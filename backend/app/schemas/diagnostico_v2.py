"""
Modelos Pydantic do relatorio v2 (Claude).

Estendem os modelos v1: todo relatorio v2 continua sendo um v1 valido, com os mesmos
21 campos, e acrescenta os blocos novos. O app diferencia pelo campo versao_relatorio.
Os limites numericos que o schema JSON nao expressa sao ajustados para a faixa
em vez de rejeitar a resposta.
"""
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.diagnostico import DiagnosticoResponse, PassoTratamento, ProblemaDetectado


def _limitar(valor, minimo, maximo):
    """Ajusta numero para a faixa. Valor nao numerico segue para a validacao normal."""
    if isinstance(valor, bool) or not isinstance(valor, (int, float)):
        return valor
    return max(minimo, min(maximo, valor))


class FotoAvaliacao(BaseModel):
    qualidade: Literal["boa", "aceitavel", "ruim"]
    problemas: list[
        Literal[
            "desfocada",
            "escura",
            "estourada",
            "contraluz",
            "longe_demais",
            "perto_demais",
            "planta_cortada",
            "varias_plantas",
            "obstruida",
        ]
    ] = Field(default_factory=list)
    o_que_aparece: str = ""
    dica_proxima_foto: str = ""


class LeituraFoto(BaseModel):
    aspecto: Literal[
        "folhas", "caule_e_ramos", "flores_e_frutos", "solo", "vaso", "ambiente_e_luz"
    ]
    observacao: str
    sinal: Literal["bom", "neutro", "atencao", "ruim"]


class AlternativaEspecie(BaseModel):
    nome_popular: str
    especie: str
    como_diferenciar: str


class Identificacao(BaseModel):
    nivel_confianca: Literal["alta", "media", "baixa", "nao_aplicavel"]
    como_reconheci: str = ""
    outros_nomes: list[str] = Field(default_factory=list)
    alternativas: list[AlternativaEspecie] = Field(default_factory=list)


class ProblemaDetectadoV2(ProblemaDetectado):
    gravidade: Literal["baixa", "media", "alta"]
    categoria: Literal[
        "rega_excesso",
        "rega_falta",
        "luz_excesso",
        "luz_falta",
        "praga",
        "fungo_ou_bacteria",
        "nutricao",
        "raiz_ou_vaso",
        "clima",
        "dano_fisico",
        "envelhecimento_natural",
        "outro",
    ]
    evidencia_visual: str
    como_confirmar: str = ""
    contagioso: bool = False


class PassoTratamentoV2(PassoTratamento):
    dia_inicio: int = 0
    como_fazer: str = ""
    por_que: str = ""
    materiais: list[str] = Field(default_factory=list)

    @field_validator("dia_inicio", mode="before")
    @classmethod
    def _dia_nao_negativo(cls, v):
        return _limitar(v, 0, 365)


class Acompanhamento(BaseModel):
    prazo_melhora: str = ""
    sinais_melhora: list[str] = Field(default_factory=list)
    sinais_piora: list[str] = Field(default_factory=list)
    retorno_em_dias: int = 0

    @field_validator("retorno_em_dias", mode="before")
    @classmethod
    def _retorno_na_faixa(cls, v):
        return _limitar(v, 0, 365)


class AjudaProfissional(BaseModel):
    recomendada: bool = False
    motivo: str = ""


class Toxicidade(BaseModel):
    nivel: Literal["nao_toxica", "leve", "moderada", "grave", "desconhecida", "nao_aplicavel"]
    afeta: list[Literal["caes", "gatos", "criancas", "adultos"]] = Field(default_factory=list)
    partes_toxicas: str = ""
    sintomas: str = ""
    o_que_fazer: str = ""


class Cuidados(BaseModel):
    rega: str = ""
    luz_e_local: str = ""
    solo_e_vaso: str = ""
    adubacao: str = ""
    poda_e_limpeza: str = ""
    como_fazer_mudas: str = ""
    erros_comuns: list[str] = Field(default_factory=list)


class TarefaCalendario(BaseModel):
    frequencia: Literal[
        "semanal", "quinzenal", "mensal", "trimestral", "semestral", "anual", "quando_necessario"
    ]
    tarefa: str


class EbookRecomendado(BaseModel):
    """
    Ebook indicado pelo Doutor.

    O modelo devolve so id e motivo. O backend confere o id no catalogo e completa
    titulo, capa, pdf, tema e emoji (secao 2.6 da proposta). Na fase 1 nao ha catalogo
    e a lista sai sempre vazia.
    """

    id: str
    motivo: str
    titulo: str = ""
    capa: str = ""
    pdf: str = ""
    tema: str = ""
    emoji: str = ""


class DiagnosticoV2Response(DiagnosticoResponse):
    """Relatorio v2: todos os campos v1 mais os blocos novos."""

    model_config = ConfigDict(extra="ignore")

    versao_relatorio: Literal["v2"]
    foto: FotoAvaliacao
    leitura_foto: list[LeituraFoto] = Field(default_factory=list)
    identificacao: Identificacao
    problemas_detectados: list[ProblemaDetectadoV2] = Field(default_factory=list)
    plano_timeline: list[PassoTratamentoV2] = Field(default_factory=list)
    acompanhamento: Acompanhamento = Field(default_factory=Acompanhamento)
    ajuda_profissional: AjudaProfissional = Field(default_factory=AjudaProfissional)
    toxicidade: Toxicidade
    cuidados: Cuidados = Field(default_factory=Cuidados)
    calendario_cuidados: list[TarefaCalendario] = Field(default_factory=list)
    curiosidades: list[str] = Field(default_factory=list)
    ebooks_recomendados: list[EbookRecomendado] = Field(default_factory=list)

    @field_validator("confianca", mode="before")
    @classmethod
    def _confianca_na_faixa(cls, v):
        return _limitar(v, 0.0, 1.0)

    @field_validator("rega_dias", mode="before")
    @classmethod
    def _rega_na_faixa(cls, v):
        return _limitar(v, 0, 60)

    @field_validator("luz_porcentagem", mode="before")
    @classmethod
    def _luz_na_faixa(cls, v):
        return _limitar(v, 0, 100)
