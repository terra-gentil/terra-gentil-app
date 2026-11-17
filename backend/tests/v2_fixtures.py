"""
Dados e mocks compartilhados dos testes do diagnostico v2 (Claude).

Nada aqui chama API real: as respostas do SDK sao objetos simples.
"""
import json
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock


def resposta_v2_planta() -> dict:
    """
    JSON v2 de uma planta com problema, no formato que o modelo escreve hoje: sem os
    campos v1 que o backend deriva (toxicidade_detalhes, precisa_retorno,
    mensagem_retorno, calendario_cuidados, cuidados.rega e cuidados.luz_e_local).
    """
    return {
        "versao_relatorio": "v2",
        "eh_planta": True,
        "foto": {
            "qualidade": "boa",
            "problemas": [],
            "o_que_aparece": "Uma jiboia em vaso de plástico perto da janela.",
            "dica_proxima_foto": "",
        },
        "leitura_foto": [
            {"aspecto": "folhas", "observacao": "Folhas inferiores amareladas.", "sinal": "atencao"},
            {"aspecto": "solo", "observacao": "Solo escuro e encharcado.", "sinal": "ruim"},
        ],
        "especie_identificada": "Epipremnum aureum",
        "nome_popular": "Jiboia",
        "confianca": 0.93,
        "identificacao": {
            "nivel_confianca": "alta",
            "como_reconheci": "Folhas em coração com manchas amarelas.",
            "outros_nomes": ["Hera-do-diabo"],
            "alternativas": [],
        },
        "estado_saude": "atencao",
        "diagnostico_titulo": "Excesso de rega",
        "diagnostico_explicacao": "O solo está encharcado e as folhas de baixo amarelaram.",
        "problemas_detectados": [
            {
                "descricao": "Excesso de água",
                "gravidade": "media",
                "causa_provavel": "Rega frequente demais.",
                "categoria": "rega_excesso",
                "evidencia_visual": "Solo brilhante e folhas inferiores amarelas.",
                "como_confirmar": "Enfie o dedo 2 cm no solo.",
                "contagioso": False,
            }
        ],
        "plano_tratamento": "Suspender a rega e melhorar a drenagem.",
        "plano_timeline": [
            {
                "etapa": "Hoje",
                "acao": "Pare de regar.",
                "tipo": "manejo",
                "dia_inicio": 0,
                "como_fazer": "Espere o solo secar.",
                "por_que": "Raiz encharcada apodrece.",
                "materiais": [],
            }
        ],
        "acompanhamento": {
            "prazo_melhora": "2 semanas",
            "sinais_melhora": ["Folhas novas verdes"],
            "sinais_piora": ["Caule mole"],
            "retorno_em_dias": 7,
            "como_evitar": "Regue só quando o solo estiver seco a 2 cm.",
        },
        "ajuda_profissional": {"recomendada": False, "motivo": ""},
        "toxica_para_pets": True,
        "toxicidade": {
            "nivel": "leve",
            "afeta": ["caes", "gatos"],
            "partes_toxicas": "Folhas e caule",
            "sintomas": "Salivação",
            "o_que_fazer": "Procure um veterinário.",
        },
        "nivel_luz": "indireta_brilhante",
        "rega_dias": 7,
        "rega_ml": 300,
        "vaso_estimado_cm": 20,
        "rega_condicao": "Quando o solo estiver seco a 2 cm.",
        "temperatura_ideal": "18 a 30 graus",
        "nivel_dificuldade": "facil",
        "luz_porcentagem": 60,
        "luz_veredito": "Boa luz para a espécie.",
        "cuidados": {
            "solo_e_vaso": "Vaso com furo.",
            "adubacao": "Na primavera.",
            "poda_e_limpeza": "Tire folhas secas.",
            "como_fazer_mudas": "Estaca em água.",
            "erros_comuns": ["Regar por calendário"],
        },
        "curiosidades": ["É nativa das Ilhas Salomão."],
        "ebooks_recomendados": [{"id": "TG074", "motivo": "Ajuda na rega."}],
    }


def mensagem_sdk(dados: dict | None = None, stop_reason: str = "end_turn", texto: str | None = None):
    """Imita o objeto Message do SDK com usage e um bloco de texto."""
    if texto is None:
        texto = json.dumps(dados if dados is not None else resposta_v2_planta())
    return SimpleNamespace(
        model="claude-opus-5-5",
        stop_reason=stop_reason,
        stop_details=SimpleNamespace(category="bio") if stop_reason == "refusal" else None,
        content=[
            SimpleNamespace(type="thinking", thinking=""),
            SimpleNamespace(type="text", text=texto),
        ],
        usage=SimpleNamespace(
            input_tokens=2400,
            output_tokens=2900,
            cache_read_input_tokens=3100,
            cache_creation_input_tokens=0,
        ),
        _request_id="req_teste",
    )


def cliente_mock(resposta=None, erro: Exception | None = None) -> MagicMock:
    """Cliente AsyncAnthropic falso: messages.create devolve a resposta ou levanta o erro."""
    cliente = MagicMock()
    cliente.messages.create = AsyncMock(
        return_value=resposta if resposta is not None else mensagem_sdk(),
        side_effect=erro,
    )
    return cliente
