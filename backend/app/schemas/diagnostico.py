"""
Schemas do endpoint de diagnóstico de plantas.

Models Pydantic usados como contrato de entrada e saída da API.
"""
from enum import Enum

from pydantic import BaseModel, Field


class NivelLuz(str, Enum):
    """Classificação de necessidade de luz da planta."""

    sol_pleno = "sol_pleno"
    meia_sombra = "meia_sombra"
    indireta_brilhante = "indireta_brilhante"
    sombra = "sombra"
    nao_aplicavel = "nao_aplicavel"


class ProblemaDetectado(BaseModel):
    """Problema visual identificado na planta."""

    descricao: str = Field(description="Descrição curta do problema")
    gravidade: str = Field(description="Gravidade: 'baixa', 'media' ou 'alta'")
    causa_provavel: str = Field(description="Causa mais provável do problema")


class DiagnosticoResponse(BaseModel):
    """Resposta completa de um diagnóstico de planta."""

    eh_planta: bool = Field(
        description="True se a imagem contém uma planta, False caso contrário",
    )
    especie_identificada: str = Field(
        description="Nome científico da planta, ou 'Nao identificada' se nao for planta",
    )
    nome_popular: str = Field(
        description="Nome popular em português, ou 'Nao identificada'",
    )
    confianca: float = Field(
        ge=0.0,
        le=1.0,
        description="Confiança da identificação, de 0 a 1",
    )
    toxica_para_pets: bool = Field(
        description="True se tóxica para cães, gatos ou crianças pequenas",
    )
    nivel_luz: NivelLuz = Field(
        description="Necessidade de luz, ou 'nao_aplicavel' se nao for planta",
    )
    rega_dias: int = Field(
        ge=0,
        le=60,
        description="Frequência de rega em dias, 0 se nao for planta",
    )
    problemas_detectados: list[ProblemaDetectado] = Field(
        default_factory=list,
        description="Lista de problemas visuais identificados",
    )
    plano_tratamento: str = Field(
        description="Plano de cuidado, ou mensagem orientando quando nao for planta",
    )


class DiagnosticoErrorResponse(BaseModel):
    """Resposta padronizada de erro do diagnóstico."""

    error_code: str = Field(description="Código do erro")
    message: str = Field(description="Mensagem legível do erro")
    details: str | None = Field(default=None, description="Detalhes técnicos opcionais")
