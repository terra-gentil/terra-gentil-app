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
    # Derivado pelo backend (Wikipedia), nunca pelo modelo. "" quando nao achou.
    foto_referencia: str = ""


class Identificacao(BaseModel):
    nivel_confianca: Literal["alta", "media", "baixa", "nao_aplicavel"]
    como_reconheci: str = ""
    outros_nomes: list[str] = Field(default_factory=list)
    alternativas: list[AlternativaEspecie] = Field(default_factory=list)


class AreaFoto(BaseModel):
    """
    Caixa da lupa na foto, em fracao da imagem (0 a 1), sempre sobre a primeira foto.
    x e y sao o canto superior esquerdo; largura e altura a partir dele.
    """

    x: float
    y: float
    largura: float
    altura: float


def _normalizar_area(valor) -> dict | None:
    """
    Corta a caixa para dentro da imagem. Caixa ausente, nao numerica ou sem area
    (largura ou altura <= 0 depois do corte) vira None, sem derrubar a resposta.
    """
    if isinstance(valor, AreaFoto):
        valor = valor.model_dump()
    if not isinstance(valor, dict):
        return None
    numeros = {}
    for chave in ("x", "y", "largura", "altura"):
        v = valor.get(chave)
        if isinstance(v, bool) or not isinstance(v, (int, float)) or v != v:
            return None
        numeros[chave] = float(v)
    x = min(1.0, max(0.0, numeros["x"]))
    y = min(1.0, max(0.0, numeros["y"]))
    largura = min(numeros["largura"], 1.0 - x)
    altura = min(numeros["altura"], 1.0 - y)
    if largura <= 0 or altura <= 0:
        return None
    return {"x": x, "y": y, "largura": largura, "altura": altura}


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
    # Lupa: regiao da primeira foto onde o sinal aparece. None quando nao e localizavel
    # ou e a planta toda.
    area_foto: AreaFoto | None = None

    @field_validator("area_foto", mode="before")
    @classmethod
    def _area_na_faixa(cls, v):
        return _normalizar_area(v)


class PassoTratamentoV2(PassoTratamento):
    # Degrau do plano: manejo e caseiro primeiro, organico e quimico se nao resolver.
    # Quimico vem so com o principio ativo, nunca com marca.
    tipo: Literal["manejo", "caseiro", "organico", "quimico"] = "manejo"
    dia_inicio: int = 0
    como_fazer: str = ""
    # So o primeiro passo traz o motivo; os demais chegam vazios
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
    # Uma frase de prevencao para o problema nao voltar
    como_evitar: str = ""

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
    # rega e luz_e_local nao vem mais do modelo: o backend preenche a partir da grade
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
    titulo, capa, pdf, tema e emoji (secao 2.6 da proposta), a partir de
    app/data/catalogo_ebooks.json.
    """

    id: str
    motivo: str
    titulo: str = ""
    capa: str = ""
    pdf: str = ""
    tema: str = ""
    emoji: str = ""


class DiagnosticoV2Response(DiagnosticoResponse):
    """
    Relatorio v2: todos os campos v1 mais os blocos novos.

    Campos que o modelo deixou de escrever (toxicidade_detalhes, precisa_retorno,
    mensagem_retorno, calendario_cuidados, cuidados.rega e cuidados.luz_e_local) ficam
    com valor padrao aqui e sao preenchidos por completar_campos_derivados no servico.
    """

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
    # Quantidade aproximada por rega (0 = nao se aplica) e diametro do vaso visto na foto
    # (0 = nao deu para ver). Sempre exibidos como aproximados.
    rega_ml: int = 0
    vaso_estimado_cm: int = 0
    # Uma frase sobre o efeito da estacao atual no Brasil nos cuidados ("" se nao muda nada)
    nota_estacao: str = ""
    # Derivado pelo backend (Wikipedia, pelo nome cientifico), nunca pelo modelo
    foto_referencia: str = ""

    @field_validator("rega_ml", mode="before")
    @classmethod
    def _rega_ml_na_faixa(cls, v):
        return _limitar(v, 0, 20000)

    @field_validator("vaso_estimado_cm", mode="before")
    @classmethod
    def _vaso_na_faixa(cls, v):
        return _limitar(v, 0, 300)

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
