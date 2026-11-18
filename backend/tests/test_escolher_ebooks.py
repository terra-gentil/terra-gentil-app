"""Escolha dos ebooks pelo backend contra o que o Claude escolhia nos 12 laudos reais."""
import json
from pathlib import Path

import pytest

from app.schemas.diagnostico_v2 import DiagnosticoV2Response
from app.services.claude_service import carregar_catalogo
from app.services.escolher_ebooks import escolher_ebooks, nomes_da_planta, normalizar

from .v2_fixtures import resposta_v2_planta

EXEMPLOS = Path(__file__).resolve().parents[2] / "docs" / "exemplos-relatorio-v2"

# Diferencas aceitas (equivalentes): palma -> Cactos e Babosa em vez de Cactos de Colecao;
# lirio-da-paz com sede -> guia de rega em vez do guia de pet.
ESPERADO = {
    "01-jiboia-saudavel": ["TG035", "TG008"],
    "02-costela-adao-amarela": ["TG034", "TG005"],
    "03-cochonilha-suculenta": ["TG004", "TG111"],
    "04-oidio-abobrinha": ["TG063", "TG111"],
    "05-orquidea-raiz-podre": ["TG017", "TG018"],
    "06-acaro-rajado": ["TG039", "TG111"],
    "07-samambaia-pontas-secas": ["TG038", "TG005"],
    "08-tomate-requeima": ["TG088", "TG111"],
    "09-lirio-paz-murcho": ["TG036", "TG005"],
    "10-comigo-ninguem-pode": ["TG066", "TG008"],
    "11-espada-sao-jorge": ["TG074", "TG005"],
    "12-nao-planta-gato": [],
}


def _relatorio(dados: dict) -> DiagnosticoV2Response:
    return DiagnosticoV2Response(**dados.get("relatorio", dados))


@pytest.mark.parametrize("nome,esperado", ESPERADO.items())
def test_laudos_reais(nome, esperado):
    [arquivo] = EXEMPLOS.glob(f"{nome}.*.json")
    dados = json.loads(arquivo.read_text(encoding="utf-8"))
    assert [e.id for e in escolher_ebooks(_relatorio(dados), carregar_catalogo())] == esperado


def test_motivo_tem_frase_do_caso_e_descricao_do_catalogo():
    dados = json.loads(next(EXEMPLOS.glob("05-orquidea*.json")).read_text(encoding="utf-8"))
    especie, problema = escolher_ebooks(_relatorio(dados), carregar_catalogo())
    assert especie.motivo.startswith("Feito para quem tem orquídea-borboleta. Descubra")
    assert problema.motivo.startswith("Para o problema na raiz e no vaso que vi na sua planta. ")
    assert especie.titulo and especie.capa and especie.pdf.endswith("/TG017.pdf")


def test_planta_sem_nome_conhecido_e_sem_problema_fica_vazia():
    dados = resposta_v2_planta() | {
        "nome_popular": "Planta",
        "especie_identificada": "Xyzzia exotica",
        "problemas_detectados": [],
        "toxicidade": resposta_v2_planta()["toxicidade"] | {"nivel": "nao_toxica"},
    }
    dados["identificacao"] = dados["identificacao"] | {"outros_nomes": []}
    assert escolher_ebooks(DiagnosticoV2Response(**dados), carregar_catalogo()) == []


def test_catalogo_vazio_nao_quebra():
    assert escolher_ebooks(DiagnosticoV2Response(**resposta_v2_planta()), {}) == []


def test_normalizar_tira_acento_hifen_e_caractere_invisivel():
    assert normalizar("Comigo-ninguém-⁠pode") == "comigo ninguem pode"


def test_sinonimo_do_nome_cientifico():
    dados = resposta_v2_planta() | {"nome_popular": "Monstera", "especie_identificada": "Monstera deliciosa"}
    inteiros, _ = nomes_da_planta(DiagnosticoV2Response(**dados))
    assert "costela de adao" in inteiros
