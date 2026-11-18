"""
Testes do ClaudeService (diagnostico v2), sempre com cliente falso.
"""
import base64
import io
import json
import logging

import anthropic
import httpx2
import pytest
from PIL import Image

from app.core.config import settings
from app.services import claude_service
from app.schemas.diagnostico_v2 import DiagnosticoV2Response
from app.schemas.diagnostico_v2_schema import DIAGNOSTICO_V2_JSON_SCHEMA, schema_v2
from app.services.claude_service import (
    LADO_MAXIMO_PX,
    ClaudeService,
    MAX_EBOOKS,
    ClaudeServiceError,
    TEXTO_TOXICIDADE_DESCONHECIDA,
    carregar_catalogo,
    completar_campos_derivados,
    linhas_catalogo,
    preparar_imagem,
    resolver_ebooks,
)
from app.schemas.diagnostico_v2 import EbookRecomendado

from .v2_fixtures import cliente_mock, mensagem_sdk, resposta_v2_planta

_REQ = httpx2.Request("POST", "https://api.anthropic.com/v1/messages")


def erro_status(classe, status: int):
    return classe("erro", response=httpx2.Response(status, request=_REQ), body=None)


def _imagem(largura: int, altura: int, formato: str = "JPEG", modo: str = "RGB") -> bytes:
    buf = io.BytesIO()
    Image.new(modo, (largura, altura), (0, 128, 0) if modo == "RGB" else (0, 128, 0, 128)).save(
        buf, format=formato
    )
    return buf.getvalue()


@pytest.fixture(autouse=True)
def _chave_fake(monkeypatch):
    monkeypatch.setattr(settings, "ANTHROPIC_API_KEY", "chave-fake-de-teste")
    monkeypatch.setattr(settings, "CLAUDE_EFFORT", "low")


class TestPrepararImagem:
    def test_reduz_lado_maior_para_1568(self):
        jpeg, original, final = preparar_imagem(_imagem(4000, 3000))
        assert original == (4000, 3000)
        assert max(final) == LADO_MAXIMO_PX
        assert final == (1568, 1176)
        img = Image.open(io.BytesIO(jpeg))
        assert img.format == "JPEG"
        assert img.size == final

    def test_retrato_tambem_limita_lado_maior(self):
        _, _, final = preparar_imagem(_imagem(3000, 4000))
        assert final == (1176, 1568)

    def test_imagem_pequena_nao_aumenta(self):
        _, _, final = preparar_imagem(_imagem(800, 600))
        assert final == (800, 600)

    def test_png_com_transparencia_vira_jpeg(self):
        jpeg, _, _ = preparar_imagem(_imagem(200, 100, "PNG", "RGBA"))
        assert Image.open(io.BytesIO(jpeg)).mode == "RGB"

    def test_aplica_orientacao_exif(self):
        img = Image.new("RGB", (400, 200), "green")
        exif = Image.Exif()
        exif[0x0112] = 6  # foto deitada: girar 90 graus
        buf = io.BytesIO()
        img.save(buf, format="JPEG", exif=exif)
        _, _, final = preparar_imagem(buf.getvalue())
        assert final == (200, 400)

    def test_imagem_corrompida(self):
        with pytest.raises(ClaudeServiceError) as exc:
            preparar_imagem(b"nao-sou-imagem")
        assert exc.value.motivo == "imagem_invalida"


class TestRequisicao:
    async def test_monta_cache_schema_effort_e_imagem(self):
        cliente = cliente_mock()
        await ClaudeService(client=cliente).diagnosticar(_imagem(3000, 2000))

        params = cliente.messages.create.await_args.kwargs
        assert params["model"] == settings.CLAUDE_MODEL
        assert params["max_tokens"] == settings.CLAUDE_MAX_TOKENS
        assert "thinking" not in params  # Opus 5.5: so effort controla o raciocinio

        # Padrao: um bloco so, sem catalogo nem ebooks, com cache de 5 minutos
        system = params["system"]
        assert len(system) == 1
        assert system[0]["cache_control"] == {"type": "ephemeral", "ttl": "5m"}
        assert system[0]["text"].startswith("Você é o Doutor Gentileza")
        assert "{CATALOGO_EBOOKS}" not in system[0]["text"]
        assert "ebook" not in system[0]["text"].lower()

        # Sem gramatica forcada: o schema vai no prefixo em cache (limite da API, fase 2)
        assert params["output_config"] == {"effort": "low"}
        esperado = json.dumps(schema_v2(com_ebooks=False), ensure_ascii=False, separators=(",", ":"))
        assert system[0]["text"].endswith(esperado)

        conteudo = params["messages"][0]["content"]
        assert conteudo[0]["type"] == "image"
        assert conteudo[0]["source"]["media_type"] == "image/jpeg"
        enviada = Image.open(io.BytesIO(base64.b64decode(conteudo[0]["source"]["data"])))
        assert max(enviada.size) == LADO_MAXIMO_PX
        assert conteudo[1]["text"].startswith("Data de hoje: ")

    async def test_system_estavel_entre_chamadas(self):
        cliente = cliente_mock()
        service = ClaudeService(client=cliente)
        await service.diagnosticar(_imagem(100, 100))
        await service.diagnosticar(_imagem(200, 150))
        a, b = (c.kwargs for c in cliente.messages.create.await_args_list)
        assert a["system"] == b["system"]
        assert json.dumps(a["output_config"], sort_keys=False) == json.dumps(
            b["output_config"], sort_keys=False
        )

    def test_sem_chave_nao_inicia(self, monkeypatch):
        monkeypatch.setattr(settings, "ANTHROPIC_API_KEY", "")
        with pytest.raises(ClaudeServiceError) as exc:
            ClaudeService(client=cliente_mock())
        assert exc.value.motivo == "sem_chave"


class TestResposta:
    async def test_resposta_valida_vira_v2(self):
        rel = await ClaudeService(client=cliente_mock()).diagnosticar(_imagem(100, 100))
        assert isinstance(rel, DiagnosticoV2Response)
        assert rel.versao_relatorio == "v2"
        assert rel.problemas_detectados[0].evidencia_visual
        assert rel.toxicidade.nivel == "leve"

    async def test_json_com_cercas_ou_texto_em_volta_e_aceito(self):
        texto = "Segue o relatorio:\n```json\n" + json.dumps(resposta_v2_planta()) + "\n```"
        cliente = cliente_mock(mensagem_sdk(texto=texto))
        rel = await ClaudeService(client=cliente).diagnosticar(_imagem(100, 100))
        assert rel.versao_relatorio == "v2"

    async def test_modo_antigo_ebook_do_modelo_volta_completo_do_catalogo(self, monkeypatch):
        monkeypatch.setattr(settings, "EBOOKS_PELO_BACKEND", False)
        rel = await ClaudeService(client=cliente_mock()).diagnosticar(_imagem(100, 100))
        [ebook] = rel.ebooks_recomendados
        assert ebook.id == "TG074" and ebook.motivo == "Ajuda na rega."
        assert ebook.titulo and ebook.emoji
        assert ebook.capa.startswith("https://terragentil.com.br/guias/")
        assert ebook.pdf.endswith("/TG074.pdf")

    async def test_modo_antigo_catalogo_vai_no_bloco_em_cache(self, monkeypatch):
        monkeypatch.setattr(settings, "EBOOKS_PELO_BACKEND", False)
        monkeypatch.setattr(settings, "CLAUDE_CACHE_TTL", "1h")
        cliente = cliente_mock()
        await ClaudeService(client=cliente).diagnosticar(_imagem(100, 100))
        system = cliente.messages.create.call_args.kwargs["system"]
        assert "cache_control" not in system[0]
        assert "Ebooks" in system[0]["text"]
        assert system[0]["text"].endswith(
            json.dumps(DIAGNOSTICO_V2_JSON_SCHEMA, ensure_ascii=False, separators=(",", ":"))
        )
        bloco = system[1]
        assert bloco["cache_control"]["ttl"] == "1h"
        assert bloco["text"].startswith("TG004 | ")
        assert "\nTG074 | " in bloco["text"] and "\nebook-02 | " in bloco["text"]

    async def test_numeros_fora_da_faixa_sao_ajustados(self):
        dados = resposta_v2_planta() | {"confianca": 1.4, "rega_dias": 90, "luz_porcentagem": -5}
        cliente = cliente_mock(mensagem_sdk(dados))
        rel = await ClaudeService(client=cliente).diagnosticar(_imagem(100, 100))
        assert (rel.confianca, rel.rega_dias, rel.luz_porcentagem) == (1.0, 60, 0)

    @pytest.mark.parametrize("stop_reason", ["refusal", "max_tokens"])
    async def test_stop_reason_vira_falha(self, stop_reason):
        cliente = cliente_mock(mensagem_sdk(stop_reason=stop_reason))
        with pytest.raises(ClaudeServiceError) as exc:
            await ClaudeService(client=cliente).diagnosticar(_imagem(100, 100))
        assert exc.value.motivo == ("recusa" if stop_reason == "refusal" else "max_tokens")

    async def test_json_fora_do_schema(self):
        cliente = cliente_mock(mensagem_sdk({"versao_relatorio": "v2", "eh_planta": True}))
        with pytest.raises(ClaudeServiceError) as exc:
            await ClaudeService(client=cliente).diagnosticar(_imagem(100, 100))
        assert exc.value.motivo == "fora_do_schema"

    async def test_json_quebrado(self):
        cliente = cliente_mock(mensagem_sdk(texto='{"versao_relatorio": "v2", '))
        with pytest.raises(ClaudeServiceError) as exc:
            await ClaudeService(client=cliente).diagnosticar(_imagem(100, 100))
        assert exc.value.motivo == "fora_do_schema"

    async def test_usage_vai_para_o_log(self, caplog):
        caplog.set_level(logging.INFO, logger="app.services.claude_service")
        await ClaudeService(client=cliente_mock()).diagnosticar(_imagem(100, 100))
        linha = next(r.getMessage() for r in caplog.records if "Claude uso" in r.getMessage())
        for trecho in ("input=2400", "output=2900", "cache_read=3100", "cache_write=0", "tempo_ms="):
            assert trecho in linha
        assert "chave-fake" not in caplog.text


class TestErrosDaApi:
    @pytest.mark.parametrize(
        "erro, motivo",
        [
            (anthropic.APITimeoutError(request=_REQ), "timeout"),
            (erro_status(anthropic.RateLimitError, 429), "limite_429"),
            (erro_status(anthropic.EnforcedSpendLimitReachedError, 429), "limite_429"),
            (erro_status(anthropic.PaymentRequiredError, 402), "erro_api_402"),
            (erro_status(anthropic.BadRequestError, 400), "erro_api_400"),
            (erro_status(anthropic.OverloadedError, 529), "erro_api_529"),
            (anthropic.APIConnectionError(request=_REQ), "conexao"),
        ],
    )
    async def test_erros_viram_motivo(self, erro, motivo):
        with pytest.raises(ClaudeServiceError) as exc:
            await ClaudeService(client=cliente_mock(erro=erro)).diagnosticar(_imagem(100, 100))
        assert exc.value.motivo == motivo


def test_cliente_padrao_sem_retentativa_e_com_limite(monkeypatch):
    from app.services import claude_service

    monkeypatch.setattr(claude_service, "_cliente", None)
    cliente = claude_service._obter_cliente()
    assert cliente.max_retries == 0
    assert cliente.timeout == settings.CLAUDE_TIMEOUT_S
    monkeypatch.setattr(claude_service, "_cliente", None)


class TestResolverEbooks:
    def test_catalogo_real_tem_site_e_classicos(self):
        catalogo = carregar_catalogo()
        assert len(catalogo) >= 140
        assert "tg074" in catalogo and "ebook-01" in catalogo
        assert all(i["titulo"] and i["capa"] and i["pdf"] and i["descricao"] for i in catalogo.values())
        assert len(linhas_catalogo()) == len(catalogo)

    def test_descarta_fora_do_catalogo_e_repetidos_e_limita(self):
        itens = [
            EbookRecomendado(id="TG999", motivo="inventado"),
            EbookRecomendado(id=" tg074 ", motivo="primeiro"),
            EbookRecomendado(id="TG074", motivo="repetido"),
            EbookRecomendado(id="ebook-02", motivo="classico"),
            EbookRecomendado(id="TG004", motivo="sobra"),
        ]
        resultado = resolver_ebooks(itens)
        assert [e.id for e in resultado] == ["TG074", "ebook-02"]
        assert len(resultado) == MAX_EBOOKS
        assert resultado[0].motivo == "primeiro"

    def test_titulo_e_link_nunca_vem_do_modelo(self):
        item = EbookRecomendado(id="TG074", motivo="m", titulo="Falso", pdf="https://mal.example/x.pdf")
        [ebook] = resolver_ebooks([item])
        assert ebook.titulo != "Falso" and "mal.example" not in ebook.pdf

    def test_lista_vazia(self):
        assert resolver_ebooks([]) == []


def _relatorio(**mudancas) -> DiagnosticoV2Response:
    return DiagnosticoV2Response(**(resposta_v2_planta() | mudancas))


class TestCamposNovos:
    def test_campos_novos_chegam_ao_relatorio(self):
        rel = _relatorio()
        assert rel.rega_ml == 300 and rel.vaso_estimado_cm == 20
        assert rel.plano_timeline[0].tipo == "manejo"
        assert rel.acompanhamento.como_evitar.startswith("Regue")

    def test_campos_novos_ausentes_viram_padrao(self):
        dados = resposta_v2_planta()
        for campo in ("rega_ml", "vaso_estimado_cm"):
            dados.pop(campo)
        dados["plano_timeline"][0].pop("tipo")
        dados["acompanhamento"].pop("como_evitar")
        rel = DiagnosticoV2Response(**dados)
        assert (rel.rega_ml, rel.vaso_estimado_cm) == (0, 0)
        assert rel.plano_timeline[0].tipo == "manejo"
        assert rel.acompanhamento.como_evitar == ""

    def test_numeros_novos_fora_da_faixa_sao_ajustados(self):
        rel = _relatorio(rega_ml=-50, vaso_estimado_cm=999)
        assert (rel.rega_ml, rel.vaso_estimado_cm) == (0, 300)

    @pytest.mark.parametrize("tipo", ["manejo", "caseiro", "organico", "quimico"])
    def test_tipos_aceitos(self, tipo):
        dados = resposta_v2_planta()
        dados["plano_timeline"][0]["tipo"] = tipo
        assert DiagnosticoV2Response(**dados).plano_timeline[0].tipo == tipo

    def test_tipo_desconhecido_e_fora_do_schema(self):
        dados = resposta_v2_planta()
        dados["plano_timeline"][0]["tipo"] = "marca_x"
        with pytest.raises(ValueError):
            DiagnosticoV2Response(**dados)

    def test_schema_do_prompt_pede_os_novos_e_nao_pede_os_cortados(self):
        props = DIAGNOSTICO_V2_JSON_SCHEMA["properties"]
        assert {"rega_ml", "vaso_estimado_cm"} <= set(DIAGNOSTICO_V2_JSON_SCHEMA["required"])
        assert "tipo" in props["plano_timeline"]["items"]["required"]
        assert "como_evitar" in props["acompanhamento"]["required"]
        for cortado in ("calendario_cuidados", "toxicidade_detalhes", "precisa_retorno",
                        "mensagem_retorno"):
            assert cortado not in props
        assert not {"rega", "luz_e_local"} & set(props["cuidados"]["properties"])


class TestCamposDerivados:
    def test_toxicidade_detalhes_vem_de_partes_e_sintomas(self):
        rel = completar_campos_derivados(_relatorio())
        assert rel.toxica_para_pets is True
        assert rel.toxicidade_detalhes == "Partes tóxicas: folhas e caule. Sintomas: salivação."

    def test_toxicidade_desconhecida_sem_detalhes_tem_texto_padrao(self):
        tox = {"nivel": "desconhecida", "afeta": [], "partes_toxicas": "", "sintomas": "",
               "o_que_fazer": ""}
        rel = completar_campos_derivados(_relatorio(toxicidade=tox, toxica_para_pets=False))
        assert rel.toxica_para_pets is True
        assert rel.toxicidade_detalhes == TEXTO_TOXICIDADE_DESCONHECIDA

    def test_planta_segura_fica_sem_detalhes(self):
        tox = {"nivel": "nao_toxica", "afeta": [], "partes_toxicas": "", "sintomas": "",
               "o_que_fazer": ""}
        rel = completar_campos_derivados(_relatorio(toxicidade=tox, toxica_para_pets=False))
        assert rel.toxica_para_pets is False and rel.toxicidade_detalhes == ""

    def test_detalhes_escritos_pelo_modelo_sao_mantidos(self):
        rel = completar_campos_derivados(_relatorio(toxicidade_detalhes="Texto do modelo."))
        assert rel.toxicidade_detalhes == "Texto do modelo."

    @pytest.mark.parametrize(
        "dias, precisa, trecho",
        [(7, True, "daqui a 7 dias"), (1, True, "amanhã"), (0, False, "")],
    )
    def test_retorno_derivado_de_retorno_em_dias(self, dias, precisa, trecho):
        dados = resposta_v2_planta()
        dados["acompanhamento"]["retorno_em_dias"] = dias
        rel = completar_campos_derivados(DiagnosticoV2Response(**dados))
        assert rel.precisa_retorno is precisa
        assert trecho in rel.mensagem_retorno
        assert (rel.mensagem_retorno == "") is (not precisa)

    def test_retorno_do_modelo_e_sobrescrito_para_ficar_coerente(self):
        dados = resposta_v2_planta() | {"precisa_retorno": True, "mensagem_retorno": "Volte."}
        dados["acompanhamento"]["retorno_em_dias"] = 0
        rel = completar_campos_derivados(DiagnosticoV2Response(**dados))
        assert rel.precisa_retorno is False and rel.mensagem_retorno == ""

    def test_cuidados_rega_e_luz_vem_da_grade(self):
        rel = completar_campos_derivados(_relatorio())
        assert rel.cuidados.rega == "Quando o solo estiver seco a 2 cm."
        assert "indireta" in rel.cuidados.luz_e_local.lower()
        assert rel.calendario_cuidados == []

    def test_nao_planta_fica_sem_retorno_e_sem_cuidados(self):
        dados = resposta_v2_planta() | {"eh_planta": False, "nivel_luz": "nao_aplicavel",
                                        "rega_condicao": ""}
        dados["toxicidade"] = {"nivel": "nao_aplicavel", "afeta": [], "partes_toxicas": "",
                               "sintomas": "", "o_que_fazer": ""}
        dados["toxica_para_pets"] = False
        rel = completar_campos_derivados(DiagnosticoV2Response(**dados))
        assert rel.precisa_retorno is False and rel.mensagem_retorno == ""
        assert rel.cuidados.rega == "" and rel.cuidados.luz_e_local == ""
        assert rel.toxicidade_detalhes == ""

    async def test_diagnosticar_aplica_as_derivacoes(self):
        rel = await ClaudeService(client=cliente_mock()).diagnosticar(_imagem(100, 100))
        assert rel.precisa_retorno is True and rel.mensagem_retorno
        assert rel.toxicidade_detalhes and rel.cuidados.rega
        assert rel.ebooks_recomendados[0].titulo

    def test_leitura_foto_sem_neutros_e_com_no_maximo_3(self):
        leituras = [
            {"aspecto": a, "observacao": "x", "sinal": sinal}
            for a, sinal in [("folhas", "ruim"), ("solo", "neutro"), ("vaso", "bom"),
                             ("caule_e_ramos", "atencao"), ("ambiente_e_luz", "bom")]
        ]
        rel = completar_campos_derivados(_relatorio(leitura_foto=leituras))
        assert [i.aspecto for i in rel.leitura_foto] == ["folhas", "vaso", "caule_e_ramos"]


class TestConserto:
    """Resposta valida em JSON mas sem campos: segunda chamada curta pede so o que faltou."""

    @staticmethod
    def _sem(*campos):
        dados = resposta_v2_planta()
        for c in campos:
            dados.pop(c)
        return dados

    async def test_campos_faltando_sao_pedidos_e_completados(self):
        completo = resposta_v2_planta()
        remendo = {k: completo[k] for k in ("toxica_para_pets", "rega_dias")}
        cliente = cliente_mock()
        cliente.messages.create.side_effect = [
            mensagem_sdk(self._sem("toxica_para_pets", "rega_dias")),
            mensagem_sdk(texto=json.dumps(remendo)),
        ]
        rel = await ClaudeService(client=cliente).diagnosticar(_imagem(100, 100))

        assert rel.rega_dias == completo["rega_dias"]
        segunda = cliente.messages.create.await_args_list[1].kwargs
        # Mesmo prefixo (cache quente), resposta anterior e pedido so dos campos com erro
        primeira = cliente.messages.create.await_args_list[0].kwargs
        assert segunda["system"] == primeira["system"]
        assert segunda["messages"][1]["role"] == "assistant"
        pedido = segunda["messages"][2]["content"][0]["text"]
        assert "toxica_para_pets" in pedido and "rega_dias" in pedido
        cliente.with_options.assert_called_with(timeout=claude_service.CONSERTO_TIMEOUT_S)

    async def test_remendo_nao_troca_campo_que_ja_estava_certo(self):
        cliente = cliente_mock()
        cliente.messages.create.side_effect = [
            mensagem_sdk(self._sem("rega_dias")),
            mensagem_sdk(texto=json.dumps({"rega_dias": 5, "nome_popular": "Outra"})),
        ]
        rel = await ClaudeService(client=cliente).diagnosticar(_imagem(100, 100))
        assert rel.rega_dias == 5 and rel.nome_popular == resposta_v2_planta()["nome_popular"]

    async def test_conserto_incompleto_vira_fora_do_schema(self):
        cliente = cliente_mock()
        cliente.messages.create.side_effect = [
            mensagem_sdk(self._sem("rega_dias")),
            mensagem_sdk(texto="{}"),
        ]
        with pytest.raises(ClaudeServiceError) as exc:
            await ClaudeService(client=cliente).diagnosticar(_imagem(100, 100))
        assert exc.value.motivo == "fora_do_schema"

    async def test_desligado_nao_faz_segunda_chamada(self, monkeypatch):
        monkeypatch.setattr(settings, "CLAUDE_CONSERTO", False)
        cliente = cliente_mock(mensagem_sdk(self._sem("rega_dias")))
        with pytest.raises(ClaudeServiceError):
            await ClaudeService(client=cliente).diagnosticar(_imagem(100, 100))
        assert cliente.messages.create.await_count == 1

    async def test_json_quebrado_nao_tenta_conserto(self):
        cliente = cliente_mock(mensagem_sdk(texto='{"versao_relatorio": "v2", '))
        with pytest.raises(ClaudeServiceError):
            await ClaudeService(client=cliente).diagnosticar(_imagem(100, 100))
        assert cliente.messages.create.await_count == 1

    async def test_pede_tambem_obrigatorio_com_valor_padrao_que_nao_veio(self):
        cliente = cliente_mock()
        cliente.messages.create.side_effect = [
            mensagem_sdk(self._sem("rega_dias", "rega_ml")),
            mensagem_sdk(texto=json.dumps({"rega_dias": 5, "rega_ml": 300})),
        ]
        rel = await ClaudeService(client=cliente).diagnosticar(_imagem(100, 100))
        pedido = cliente.messages.create.await_args_list[1].kwargs["messages"][2]["content"][0]["text"]
        assert "rega_ml" in pedido and rel.rega_ml == 300
