"""
Testes do diagnostico v2.2: lupa na foto (area_foto), ate 3 fotos por consulta, estacao do
hemisferio sul (nota_estacao) e foto de referencia da Wikipedia (foto_referencia).

Claude, Gemini e Wikipedia sempre falsos: nenhuma chamada sai para a rede.
"""
import asyncio
import base64
import io
import time
from datetime import datetime
from unittest.mock import patch

import httpx
import pytest
from PIL import Image

from app.core.config import settings
from app.prompts.diagnostico_v2 import instrucoes_v2
from app.routes import diagnostico as rota
from app.schemas.diagnostico import DiagnosticoResponse
from app.schemas.diagnostico_v2 import DiagnosticoV2Response, ProblemaDetectadoV2
from app.schemas.diagnostico_v2_schema import DIAGNOSTICO_V2_JSON_SCHEMA
from app.services import claude_service, foto_referencia
from app.services.claude_service import (
    LADO_MAXIMO_PX,
    MAX_FOTOS,
    ClaudeService,
    _montar_requisicao,
    estacao_brasil,
    texto_usuario,
)
from app.services.foto_referencia import normalizar_nome, preencher_fotos_referencia
from app.services.gemini_service import NOTA_VARIAS_FOTOS, GeminiService
from app.services.trava_diaria import FUSO_BRASILIA, trava_claude

from .conftest import mock_gemini_response
from .v2_fixtures import cliente_mock, mensagem_sdk, resposta_v2_com_alternativas, resposta_v2_planta


def _img(largura=60, altura=40, formato="PNG", cor="green") -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (largura, altura), cor).save(buf, formato)
    return buf.getvalue()


def _problema(**area) -> dict:
    base = resposta_v2_planta()["problemas_detectados"][0]
    base["area_foto"] = area if area else None
    return base


@pytest.fixture(autouse=True)
def _claude_ligado(monkeypatch):
    monkeypatch.setattr(settings, "ANTHROPIC_API_KEY", "chave-fake-de-teste")
    monkeypatch.setattr(settings, "CLAUDE_ROLLOUT_PERCENT", 100)
    monkeypatch.setattr(settings, "CLAUDE_DAILY_LIMIT", 100)
    monkeypatch.setattr(settings, "CLAUDE_EFFORT", "low")
    trava_claude.zerar()
    yield
    trava_claude.zerar()


def _wikipedia(monkeypatch, fotos: dict[tuple[str, str], str], chamadas: list | None = None):
    """Wikipedia falsa: {(idioma, titulo): url}. O resto responde 404."""

    def handler(req: httpx.Request) -> httpx.Response:
        if chamadas is not None:
            chamadas.append(req)
        idioma = req.url.host.split(".")[0]
        titulo = req.url.path.rsplit("/", 1)[-1]
        from urllib.parse import unquote

        url = fotos.get((idioma, unquote(titulo)))
        if url is None:
            return httpx.Response(404, json={"type": "not_found"})
        return httpx.Response(200, json={"type": "standard", "thumbnail": {"source": url}})

    monkeypatch.setattr(foto_referencia, "_transporte", httpx.MockTransport(handler))


# ---------------------------------------------------------------- 1. lupa na foto


class TestAreaFoto:
    def test_caixa_valida_e_mantida(self):
        p = ProblemaDetectadoV2(**_problema(x=0.1, y=0.2, largura=0.3, altura=0.4))
        assert p.area_foto.model_dump() == {"x": 0.1, "y": 0.2, "largura": 0.3, "altura": 0.4}

    def test_sem_area_e_null(self):
        assert ProblemaDetectadoV2(**_problema()).area_foto is None
        dados = _problema()
        del dados["area_foto"]
        assert ProblemaDetectadoV2(**dados).area_foto is None

    def test_coordenadas_fora_da_faixa_sao_cortadas(self):
        p = ProblemaDetectadoV2(**_problema(x=-0.2, y=0.8, largura=0.5, altura=0.9))
        assert p.area_foto.model_dump() == pytest.approx(
            {"x": 0.0, "y": 0.8, "largura": 0.5, "altura": 0.2}
        )

    def test_caixa_maior_que_a_imagem_vira_imagem_inteira(self):
        p = ProblemaDetectadoV2(**_problema(x=0, y=0, largura=3, altura=2))
        assert p.area_foto.model_dump() == {"x": 0.0, "y": 0.0, "largura": 1.0, "altura": 1.0}

    @pytest.mark.parametrize(
        "area",
        [
            {"x": 0.1, "y": 0.1, "largura": 0, "altura": 0.3},
            {"x": 0.1, "y": 0.1, "largura": 0.3, "altura": -0.2},
            {"x": 1.5, "y": 0.1, "largura": 0.3, "altura": 0.3},
            {"x": 0.1, "y": 1.0, "largura": 0.3, "altura": 0.3},
        ],
        ids=["largura_zero", "altura_negativa", "x_fora", "y_na_borda"],
    )
    def test_caixa_sem_area_vira_null(self, area):
        assert ProblemaDetectadoV2(**_problema(**area)).area_foto is None

    @pytest.mark.parametrize(
        "valor",
        ["planta toda", [0.1, 0.2, 0.3, 0.4], {"x": 0.1, "y": 0.1, "largura": 0.3},
         {"x": "a", "y": 0.1, "largura": 0.3, "altura": 0.3},
         {"x": True, "y": 0.1, "largura": 0.3, "altura": 0.3},
         {"x": float("nan"), "y": 0.1, "largura": 0.3, "altura": 0.3}],
        ids=["texto", "lista", "sem_altura", "nao_numero", "booleano", "nan"],
    )
    def test_formato_estranho_vira_null_sem_derrubar(self, valor):
        dados = _problema()
        dados["area_foto"] = valor
        assert ProblemaDetectadoV2(**dados).area_foto is None

    def test_relatorio_completo_aceita_area_e_null(self):
        r = DiagnosticoV2Response(**resposta_v2_com_alternativas())
        assert r.problemas_detectados[0].area_foto.largura == 0.5
        assert r.problemas_detectados[1].area_foto is None
        json_saida = r.model_dump(mode="json")
        assert json_saida["problemas_detectados"][1]["area_foto"] is None

    def test_schema_e_prompt_pedem_area_foto(self):
        item = DIAGNOSTICO_V2_JSON_SCHEMA["properties"]["problemas_detectados"]["items"]
        assert "area_foto" in item["required"]
        assert item["properties"]["area_foto"]["type"] == ["object", "null"]
        assert set(item["properties"]["area_foto"]["required"]) == {"x", "y", "largura", "altura"}
        texto = instrucoes_v2()
        assert "area_foto" in texto and "caixa folgada" in texto
        assert "primeira foto" in texto


# ---------------------------------------------------------------- 2. ate 3 fotos


class TestVariasFotosNoClaude:
    async def test_tres_fotos_vao_antes_do_texto(self):
        cliente = cliente_mock()
        fotos = [_img(3000, 2000, "JPEG"), _img(100, 80, cor="red"), _img(90, 90, cor="blue")]
        await ClaudeService(client=cliente).diagnosticar(fotos)

        conteudo = cliente.messages.create.await_args.kwargs["messages"][0]["content"]
        assert [b["type"] for b in conteudo] == ["image", "image", "image", "text"]
        tamanhos = [
            Image.open(io.BytesIO(base64.b64decode(b["source"]["data"]))).size
            for b in conteudo[:3]
        ]
        # Ordem preservada e mesmo redimensionamento por foto
        assert max(tamanhos[0]) == LADO_MAXIMO_PX
        assert tamanhos[1:] == [(100, 80), (90, 90)]
        assert all(b["source"]["media_type"] == "image/jpeg" for b in conteudo[:3])
        assert "Fotos enviadas: 3" in conteudo[3]["text"]
        assert "area_foto se refere sempre" in conteudo[3]["text"]

    async def test_foto_unica_em_bytes_continua_igual(self):
        cliente = cliente_mock()
        await ClaudeService(client=cliente).diagnosticar(_img())
        conteudo = cliente.messages.create.await_args.kwargs["messages"][0]["content"]
        assert [b["type"] for b in conteudo] == ["image", "text"]
        assert conteudo[1]["text"].startswith("Data de hoje: ")
        assert "Foto enviada: 1." in conteudo[1]["text"]

    async def test_mais_de_tres_fotos_sao_cortadas(self):
        cliente = cliente_mock()
        await ClaudeService(client=cliente).diagnosticar([_img()] * 5)
        conteudo = cliente.messages.create.await_args.kwargs["messages"][0]["content"]
        assert sum(b["type"] == "image" for b in conteudo) == MAX_FOTOS == 3

    async def test_system_igual_com_uma_ou_tres_fotos(self):
        cliente = cliente_mock()
        service = ClaudeService(client=cliente)
        await service.diagnosticar(_img())
        await service.diagnosticar([_img(), _img(), _img()])
        a, b = (c.kwargs for c in cliente.messages.create.await_args_list)
        assert a["system"] == b["system"]

    async def test_foto_extra_corrompida_falha_como_imagem_invalida(self):
        from app.services.claude_service import ClaudeServiceError

        with pytest.raises(ClaudeServiceError) as exc:
            await ClaudeService(client=cliente_mock()).diagnosticar([_img(), b"lixo"])
        assert exc.value.motivo == "imagem_invalida"

    def test_prompt_explica_angulos_da_mesma_planta(self):
        texto = instrucoes_v2()
        assert "até 3 fotos" in texto
        assert "mesma planta" in texto


def _claude_com(cliente):
    return patch.object(rota, "ClaudeService", lambda: ClaudeService(client=cliente))


@pytest.fixture()
def gemini_ok(resposta_planta_saudavel):
    with patch("app.routes.diagnostico.GeminiService") as svc:
        svc.return_value.diagnosticar.return_value = DiagnosticoResponse(**resposta_planta_saudavel)
        yield svc


class TestRotaVariasFotos:
    def test_file2_e_file3_chegam_ao_claude(self, client, gemini_ok):
        cliente = cliente_mock()
        with _claude_com(cliente):
            resp = client.post(
                "/v1/diagnostico",
                files={
                    "file": ("a.png", _img(), "image/png"),
                    "file2": ("b.jpg", _img(formato="JPEG"), "image/jpeg"),
                    "file3": ("c.png", _img(), "image/png"),
                },
            )
        assert resp.status_code == 200
        assert resp.json()["versao_relatorio"] == "v2"
        conteudo = cliente.messages.create.await_args.kwargs["messages"][0]["content"]
        assert sum(b["type"] == "image" for b in conteudo) == 3

    def test_so_file2_sem_file3(self, client, gemini_ok):
        cliente = cliente_mock()
        with _claude_com(cliente):
            resp = client.post(
                "/v1/diagnostico",
                files={"file": ("a.png", _img(), "image/png"), "file2": ("b.png", _img(), "image/png")},
            )
        assert resp.status_code == 200
        conteudo = cliente.messages.create.await_args.kwargs["messages"][0]["content"]
        assert sum(b["type"] == "image" for b in conteudo) == 2

    def test_sem_file_continua_422(self, client):
        resp = client.post("/v1/diagnostico", files={"file2": ("b.png", _img(), "image/png")})
        assert resp.status_code == 422

    def test_file2_formato_errado_415(self, client, gemini_ok):
        resp = client.post(
            "/v1/diagnostico",
            files={"file": ("a.png", _img(), "image/png"), "file2": ("b.gif", b"GIF89a", "image/gif")},
        )
        assert resp.status_code == 415
        assert resp.json()["detail"]["error_code"] == "UNSUPPORTED_MEDIA_TYPE"

    def test_file3_grande_demais_413(self, client, gemini_ok, monkeypatch):
        monkeypatch.setattr(rota, "MAX_FILE_SIZE_BYTES", 1000)
        resp = client.post(
            "/v1/diagnostico",
            files={
                "file": ("a.png", _img(10, 10), "image/png"),
                "file3": ("c.jpg", b"x" * 2000, "image/jpeg"),
            },
        )
        assert resp.status_code == 413
        assert resp.json()["detail"]["error_code"] == "FILE_TOO_LARGE"

    def test_file2_vazio_400(self, client, gemini_ok):
        resp = client.post(
            "/v1/diagnostico",
            files={"file": ("a.png", _img(), "image/png"), "file2": ("b.png", b"", "image/png")},
        )
        assert resp.status_code == 400
        assert resp.json()["detail"]["error_code"] == "EMPTY_FILE"

    def test_gemini_recebe_extras_quando_e_o_provedor(self, client, gemini_ok, monkeypatch):
        monkeypatch.setattr(settings, "ANTHROPIC_API_KEY", "")
        extra = _img(cor="red")
        resp = client.post(
            "/v1/diagnostico",
            files={"file": ("a.png", _img(), "image/png"), "file2": ("b.png", extra, "image/png")},
        )
        assert resp.status_code == 200
        chamada = gemini_ok.return_value.diagnosticar.call_args
        assert chamada.kwargs == {"fotos_extras": [extra]}

    def test_gemini_reserva_recebe_extras(self, client, gemini_ok):
        from app.services.claude_service import ClaudeServiceError

        extra = _img(cor="red")
        with _claude_com(cliente_mock(erro=ClaudeServiceError("x"))):
            resp = client.post(
                "/v1/diagnostico",
                files={"file": ("a.png", _img(), "image/png"), "file3": ("c.png", extra, "image/png")},
            )
        assert resp.status_code == 200
        chamada = gemini_ok.return_value.diagnosticar.call_args
        assert chamada.kwargs == {"tentativas": 1, "fotos_extras": [extra]}


class TestGeminiVariasFotos:
    @pytest.fixture()
    def gemini_service(self):
        with patch("app.services.gemini_service.settings") as s:
            s.GEMINI_API_KEY = "fake"
            s.GEMINI_MODEL = "gemini-teste"
            with patch("app.services.gemini_service.genai"):
                yield GeminiService()

    def test_manda_todas_as_imagens_com_nota(self, gemini_service, resposta_planta_saudavel):
        gemini_service.model.generate_content.return_value = mock_gemini_response(
            resposta_planta_saudavel
        )
        gemini_service.diagnosticar(_img(), fotos_extras=[_img(cor="red"), _img(cor="blue")])
        partes = gemini_service.model.generate_content.call_args.args[0]
        assert len(partes) == 4
        assert partes[0].endswith(NOTA_VARIAS_FOTOS.format(n=3))
        assert all(isinstance(p, Image.Image) for p in partes[1:])

    def test_uma_foto_manda_prompt_original(self, gemini_service, resposta_planta_saudavel):
        from app.prompts.diagnostico_v1 import PROMPT_DIAGNOSTICO_V1

        gemini_service.model.generate_content.return_value = mock_gemini_response(
            resposta_planta_saudavel
        )
        gemini_service.diagnosticar(_img())
        partes = gemini_service.model.generate_content.call_args.args[0]
        assert len(partes) == 2 and partes[0] == PROMPT_DIAGNOSTICO_V1

    def test_extra_corrompida_levanta_erro(self, gemini_service):
        from app.services.gemini_service import GeminiServiceError

        with pytest.raises(GeminiServiceError, match="invalida"):
            gemini_service.diagnosticar(_img(), fotos_extras=[b"lixo"])


# ---------------------------------------------------------------- 3. estacao


class TestEstacao:
    @pytest.mark.parametrize(
        "mes,estacao",
        [(12, "verão"), (1, "verão"), (2, "verão"), (3, "outono"), (4, "outono"), (5, "outono"),
         (6, "inverno"), (7, "inverno"), (8, "inverno"), (9, "primavera"), (10, "primavera"),
         (11, "primavera")],
    )
    def test_estacao_do_hemisferio_sul(self, mes, estacao):
        assert estacao_brasil(mes) == estacao

    def test_texto_do_usuario_tem_mes_e_estacao(self):
        texto = texto_usuario(datetime(2026, 7, 3, tzinfo=FUSO_BRASILIA), 1)
        assert texto.startswith("Data de hoje: 03/07/2026.")
        assert "Mês: julho." in texto
        assert "Estação no Brasil: inverno." in texto
        assert "rega e nos cuidados" in texto

    def test_estacao_vai_na_mensagem_e_nao_no_system(self):
        class Fixo(datetime):
            @classmethod
            def now(cls, tz=None):
                return datetime(2026, 1, 15, 10, tzinfo=tz)

        with patch.object(claude_service, "datetime", Fixo):
            verao = _montar_requisicao(_img(), ("linha",))

        class Inverno(datetime):
            @classmethod
            def now(cls, tz=None):
                return datetime(2026, 7, 15, 10, tzinfo=tz)

        with patch.object(claude_service, "datetime", Inverno):
            inverno = _montar_requisicao(_img(), ("linha",))

        # Bloco em cache (e o system inteiro) nao muda com a estacao
        assert verao["system"] == inverno["system"]
        assert "verão" in verao["messages"][0]["content"][-1]["text"]
        assert "inverno" in inverno["messages"][0]["content"][-1]["text"]
        assert all("Estação no Brasil" not in b["text"] for b in verao["system"])

    def test_nota_estacao_no_relatorio_e_no_schema(self):
        r = DiagnosticoV2Response(**resposta_v2_planta())
        assert r.nota_estacao.startswith("Na primavera")
        dados = resposta_v2_planta()
        del dados["nota_estacao"]
        assert DiagnosticoV2Response(**dados).nota_estacao == ""
        assert "nota_estacao" in DIAGNOSTICO_V2_JSON_SCHEMA["required"]
        assert "nota_estacao" in instrucoes_v2()
        assert "hemisfério sul" in instrucoes_v2()


# ---------------------------------------------------------------- 4. foto de referencia


class TestNormalizarNome:
    @pytest.mark.parametrize(
        "entrada,saida",
        [
            ("Epipremnum aureum", "Epipremnum aureum"),
            ("  monstera deliciosa  ", "Monstera deliciosa"),
            ("Monstera sp.", "Monstera"),
            ("Dracaena trifasciata (Prain) Mabb.", "Dracaena trifasciata"),
            ("Philodendron hederaceum 'Brasil'", "Philodendron hederaceum"),
            ("Não identificada", "Não identificada"),
            ("", ""),
        ],
    )
    def test_normaliza(self, entrada, saida):
        assert normalizar_nome(entrada) == saida


class TestFotoReferencia:
    async def test_preenche_especie_e_alternativas(self, monkeypatch):
        chamadas = []
        _wikipedia(
            monkeypatch,
            {
                ("pt", "Epipremnum_aureum"): "https://upload.wikimedia.org/jiboia.jpg",
                ("en", "Philodendron_hederaceum"): "https://upload.wikimedia.org/filo.jpg",
            },
            chamadas,
        )
        r = DiagnosticoV2Response(**resposta_v2_com_alternativas())
        await preencher_fotos_referencia(r)
        assert r.foto_referencia == "https://upload.wikimedia.org/jiboia.jpg"
        assert r.identificacao.alternativas[0].foto_referencia == "https://upload.wikimedia.org/filo.jpg"
        # Syngonium nao existe em nenhum idioma na Wikipedia falsa
        assert r.identificacao.alternativas[1].foto_referencia == ""
        assert all(c.headers["User-Agent"] == "TerraGentilApp/1.0" for c in chamadas)
        assert all("/api/rest_v1/page/summary/" in c.url.path for c in chamadas)
        # pt achou a jiboia: en nao foi consultado para ela
        assert not any(
            c.url.host.startswith("en.") and c.url.path.endswith("Epipremnum_aureum") for c in chamadas
        )

    async def test_cache_evita_nova_busca(self, monkeypatch):
        chamadas = []
        _wikipedia(monkeypatch, {("pt", "Epipremnum_aureum"): "https://x/j.jpg"}, chamadas)
        for _ in range(3):
            r = DiagnosticoV2Response(**resposta_v2_planta())
            await preencher_fotos_referencia(r)
            assert r.foto_referencia == "https://x/j.jpg"
        assert len(chamadas) == 1

    async def test_pagina_inexistente_tambem_vai_para_o_cache(self, monkeypatch):
        chamadas = []
        _wikipedia(monkeypatch, {}, chamadas)
        for _ in range(2):
            r = DiagnosticoV2Response(**resposta_v2_planta())
            await preencher_fotos_referencia(r)
            assert r.foto_referencia == ""
        assert len(chamadas) == 2  # pt e en uma vez so

    async def test_falha_de_rede_e_silenciosa_e_nao_fica_no_cache(self, monkeypatch):
        def quebra(req):
            raise httpx.ConnectError("sem rede", request=req)

        monkeypatch.setattr(foto_referencia, "_transporte", httpx.MockTransport(quebra))
        r = DiagnosticoV2Response(**resposta_v2_planta())
        await preencher_fotos_referencia(r)
        assert r.foto_referencia == ""
        assert "Epipremnum aureum" not in foto_referencia._cache

    async def test_erro_500_e_json_estranho_viram_vazio(self, monkeypatch):
        monkeypatch.setattr(
            foto_referencia, "_transporte",
            httpx.MockTransport(lambda req: httpx.Response(500, text="erro")),
        )
        r = DiagnosticoV2Response(**resposta_v2_planta())
        await preencher_fotos_referencia(r)
        assert r.foto_referencia == ""

    async def test_desambiguacao_e_sem_miniatura_viram_vazio(self, monkeypatch):
        respostas = {
            "pt": httpx.Response(200, json={"type": "disambiguation", "thumbnail": {"source": "https://x/d.jpg"}}),
            "en": httpx.Response(200, json={"type": "standard"}),
        }
        monkeypatch.setattr(
            foto_referencia, "_transporte",
            httpx.MockTransport(lambda req: respostas[req.url.host.split(".")[0]]),
        )
        r = DiagnosticoV2Response(**resposta_v2_planta())
        await preencher_fotos_referencia(r)
        assert r.foto_referencia == ""

    async def test_lenta_nao_passa_do_teto(self, monkeypatch):
        async def lenta(req):
            await asyncio.sleep(5)
            return httpx.Response(200, json={"thumbnail": {"source": "https://x/tarde.jpg"}})

        monkeypatch.setattr(foto_referencia, "_transporte", httpx.MockTransport(lenta))
        monkeypatch.setattr(foto_referencia, "TEMPO_TOTAL_S", 0.1)
        r = DiagnosticoV2Response(**resposta_v2_com_alternativas())
        inicio = time.monotonic()
        await preencher_fotos_referencia(r)
        assert time.monotonic() - inicio < 1
        assert r.foto_referencia == ""
        assert all(a.foto_referencia == "" for a in r.identificacao.alternativas)

    async def test_buscas_em_paralelo(self, monkeypatch):
        async def demora(req):
            await asyncio.sleep(0.2)
            return httpx.Response(200, json={"thumbnail": {"source": "https://x/f.jpg"}})

        monkeypatch.setattr(foto_referencia, "_transporte", httpx.MockTransport(demora))
        r = DiagnosticoV2Response(**resposta_v2_com_alternativas())
        inicio = time.monotonic()
        await preencher_fotos_referencia(r)
        # 3 nomes de 0,2 s cada: em paralelo fica perto de 0,2 s, nao de 0,6 s
        assert time.monotonic() - inicio < 0.5
        assert r.foto_referencia == "https://x/f.jpg"

    async def test_nao_planta_nao_busca_e_modelo_nao_escreve(self, monkeypatch):
        chamadas = []
        _wikipedia(monkeypatch, {}, chamadas)
        dados = resposta_v2_planta()
        dados["eh_planta"] = False
        dados["foto_referencia"] = "https://inventado.pelo.modelo/x.jpg"
        r = DiagnosticoV2Response(**dados)
        await preencher_fotos_referencia(r)
        assert r.foto_referencia == ""
        assert chamadas == []

    def test_campo_nao_vai_no_schema_do_modelo(self):
        props = DIAGNOSTICO_V2_JSON_SCHEMA["properties"]
        assert "foto_referencia" not in props
        alt = props["identificacao"]["properties"]["alternativas"]["items"]["properties"]
        assert "foto_referencia" not in alt

    def test_rota_devolve_fotos_de_referencia(self, client, gemini_ok, monkeypatch):
        _wikipedia(
            monkeypatch,
            {
                ("pt", "Epipremnum_aureum"): "https://x/jiboia.jpg",
                ("pt", "Syngonium"): "https://x/singonio.jpg",
            },
        )
        with _claude_com(cliente_mock(mensagem_sdk(resposta_v2_com_alternativas()))):
            resp = client.post("/v1/diagnostico", files={"file": ("a.png", _img(), "image/png")})
        assert resp.status_code == 200
        data = resp.json()
        assert data["foto_referencia"] == "https://x/jiboia.jpg"
        assert [a["foto_referencia"] for a in data["identificacao"]["alternativas"]] == [
            "", "https://x/singonio.jpg",
        ]
        assert data["nota_estacao"]
        assert data["problemas_detectados"][0]["area_foto"] == {
            "x": 0.1, "y": 0.55, "largura": 0.5, "altura": 0.4,
        }
        assert data["problemas_detectados"][1]["area_foto"] is None

    def test_gemini_v1_nao_ganha_campos_novos(self, client, gemini_ok, monkeypatch):
        monkeypatch.setattr(settings, "ANTHROPIC_API_KEY", "")
        data = client.post(
            "/v1/diagnostico", files={"file": ("a.png", _img(), "image/png")}
        ).json()
        assert "foto_referencia" not in data and "nota_estacao" not in data
