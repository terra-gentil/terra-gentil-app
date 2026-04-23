"""
Schemas do endpoint de diagnostico de plantas.

Alinhados com a experiencia visual do site terragentil.com.br (v2).
"""
from enum import Enum

from pydantic import BaseModel, Field


class NivelLuz(str, Enum):
    sol_pleno = "sol_pleno"
    meia_sombra = "meia_sombra"
    indireta_brilhante = "indireta_brilhante"
    sombra = "sombra"
    nao_aplicavel = "nao_aplicavel"


class EstadoSaude(str, Enum):
    saudavel = "saudavel"
    atencao = "atencao"
    doente = "doente"
    critico = "critico"
    nao_aplicavel = "nao_aplicavel"


class NivelDificuldade(str, Enum):
    facil = "facil"
    medio = "medio"
    dificil = "dificil"
    nao_aplicavel = "nao_aplicavel"


class PassoTratamento(BaseModel):
    """Um passo no plano de tratamento, com etapa temporal."""

    etapa: str = Field(
        description="Rotulo temporal curto, ex: 'Hoje', 'Dia 1', 'Proximos dias', 'Em 1 semana'",
    )
    acao: str = Field(description="Acao concreta a ser feita")


class ProblemaDetectado(BaseModel):
    descricao: str
    gravidade: str
    causa_provavel: str


class DiagnosticoResponse(BaseModel):
    """Resposta enriquecida de um diagnostico de planta."""

    # Identificacao basica
    eh_planta: bool
    especie_identificada: str
    nome_popular: str
    confianca: float = Field(ge=0.0, le=1.0)

    # Estado geral
    estado_saude: EstadoSaude = Field(
        description="Estado geral da planta",
    )

    # Toxicidade
    toxica_para_pets: bool
    toxicidade_detalhes: str = Field(
        default="",
        description="Explicacao detalhada de por que e toxica (vazio se nao for)",
    )

    # Grid de stats
    nivel_luz: NivelLuz
    rega_dias: int = Field(ge=0, le=60)
    rega_condicao: str = Field(
        default="",
        description="Condicao de rega, ex: 'quando o solo estiver seco ao toque'",
    )
    temperatura_ideal: str = Field(
        default="",
        description="Faixa de temperatura ideal, ex: '18 a 24 graus'",
    )
    nivel_dificuldade: NivelDificuldade

    # Medidor de luz visual (0 a 100)
    luz_porcentagem: int = Field(
        ge=0,
        le=100,
        default=50,
        description="Quanto de luz a foto tem. 0 = escuro, 100 = sol pleno",
    )
    luz_veredito: str = Field(
        default="",
        description="Texto curto sobre a luz da foto",
    )

    # Diagnostico principal
    diagnostico_titulo: str = Field(
        default="",
        description="Titulo curto do diagnostico, ex: 'Amarelamento foliar' ou 'Saudavel'",
    )
    diagnostico_explicacao: str = Field(
        default="",
        description="Explicacao detalhada do diagnostico",
    )
    problemas_detectados: list[ProblemaDetectado] = Field(default_factory=list)

    # Plano de tratamento timelined
    plano_tratamento: str = Field(description="Resumo em texto do plano geral")
    plano_timeline: list[PassoTratamento] = Field(
        default_factory=list,
        description="Passos ordenados do tratamento",
    )

    # Retorno sugerido
    precisa_retorno: bool = Field(
        default=False,
        description="Se o usuario deve voltar pra atualizar a planta",
    )
    mensagem_retorno: str = Field(
        default="",
        description="Mensagem sobre quando voltar, ex: 'Volte em 3 dias'",
    )


class DiagnosticoErrorResponse(BaseModel):
    error_code: str
    message: str
    details: str | None = None
