"""
Testes dos schemas Pydantic do diagnostico.

Valida que os models aceitam dados corretos e rejeitam dados invalidos,
garantindo o contrato da API.
"""
import pytest
from pydantic import ValidationError

from app.schemas.diagnostico import (
    DiagnosticoErrorResponse,
    DiagnosticoResponse,
    EstadoSaude,
    NivelDificuldade,
    NivelLuz,
    PassoTratamento,
    ProblemaDetectado,
)


class TestDiagnosticoResponse:
    """Testes do schema principal de diagnostico."""

    def test_planta_saudavel_campos_minimos(self, resposta_planta_saudavel):
        resp = DiagnosticoResponse(**resposta_planta_saudavel)
        assert resp.eh_planta is True
        assert resp.especie_identificada == "Dieffenbachia seguine"
        assert resp.nome_popular == "Comigo-ninguem-pode"
        assert resp.confianca == 0.92
        assert resp.estado_saude == EstadoSaude.saudavel
        assert resp.nivel_luz == NivelLuz.indireta_brilhante
        assert resp.nivel_dificuldade == NivelDificuldade.facil

    def test_nao_planta_valores_padrao(self, resposta_nao_planta):
        resp = DiagnosticoResponse(**resposta_nao_planta)
        assert resp.eh_planta is False
        assert resp.estado_saude == EstadoSaude.nao_aplicavel
        assert resp.nivel_luz == NivelLuz.nao_aplicavel
        assert resp.nivel_dificuldade == NivelDificuldade.nao_aplicavel
        assert resp.rega_dias == 0
        assert resp.confianca == 0.0

    def test_confianca_fora_do_range_rejeita(self, resposta_planta_saudavel):
        resposta_planta_saudavel["confianca"] = 1.5
        with pytest.raises(ValidationError):
            DiagnosticoResponse(**resposta_planta_saudavel)

    def test_confianca_negativa_rejeita(self, resposta_planta_saudavel):
        resposta_planta_saudavel["confianca"] = -0.1
        with pytest.raises(ValidationError):
            DiagnosticoResponse(**resposta_planta_saudavel)

    def test_rega_dias_acima_do_limite_rejeita(self, resposta_planta_saudavel):
        resposta_planta_saudavel["rega_dias"] = 61
        with pytest.raises(ValidationError):
            DiagnosticoResponse(**resposta_planta_saudavel)

    def test_rega_dias_negativo_rejeita(self, resposta_planta_saudavel):
        resposta_planta_saudavel["rega_dias"] = -1
        with pytest.raises(ValidationError):
            DiagnosticoResponse(**resposta_planta_saudavel)

    def test_luz_porcentagem_limites(self, resposta_planta_saudavel):
        resposta_planta_saudavel["luz_porcentagem"] = 0
        resp = DiagnosticoResponse(**resposta_planta_saudavel)
        assert resp.luz_porcentagem == 0

        resposta_planta_saudavel["luz_porcentagem"] = 100
        resp = DiagnosticoResponse(**resposta_planta_saudavel)
        assert resp.luz_porcentagem == 100

    def test_luz_porcentagem_acima_de_100_rejeita(self, resposta_planta_saudavel):
        resposta_planta_saudavel["luz_porcentagem"] = 101
        with pytest.raises(ValidationError):
            DiagnosticoResponse(**resposta_planta_saudavel)

    def test_estado_saude_invalido_rejeita(self, resposta_planta_saudavel):
        resposta_planta_saudavel["estado_saude"] = "morto"
        with pytest.raises(ValidationError):
            DiagnosticoResponse(**resposta_planta_saudavel)

    def test_nivel_luz_invalido_rejeita(self, resposta_planta_saudavel):
        resposta_planta_saudavel["nivel_luz"] = "lua_cheia"
        with pytest.raises(ValidationError):
            DiagnosticoResponse(**resposta_planta_saudavel)

    def test_campos_opcionais_usam_default(self):
        dados = {
            "eh_planta": True,
            "especie_identificada": "Ficus",
            "nome_popular": "Figueira",
            "confianca": 0.8,
            "estado_saude": "saudavel",
            "toxica_para_pets": False,
            "nivel_luz": "sol_pleno",
            "rega_dias": 5,
            "nivel_dificuldade": "facil",
            "plano_tratamento": "Regue semanalmente",
        }
        resp = DiagnosticoResponse(**dados)
        assert resp.toxicidade_detalhes == ""
        assert resp.rega_condicao == ""
        assert resp.temperatura_ideal == ""
        assert resp.luz_porcentagem == 50
        assert resp.luz_veredito == ""
        assert resp.diagnostico_titulo == ""
        assert resp.diagnostico_explicacao == ""
        assert resp.problemas_detectados == []
        assert resp.plano_timeline == []
        assert resp.precisa_retorno is False
        assert resp.mensagem_retorno == ""

    def test_problemas_detectados_valida_campos(self, resposta_planta_saudavel):
        resposta_planta_saudavel["problemas_detectados"] = [
            {"descricao": "Folhas amarelas", "gravidade": "media", "causa_provavel": "Excesso de agua"},
        ]
        resp = DiagnosticoResponse(**resposta_planta_saudavel)
        assert len(resp.problemas_detectados) == 1
        assert resp.problemas_detectados[0].descricao == "Folhas amarelas"

    def test_plano_timeline_valida_passos(self, resposta_planta_saudavel):
        resposta_planta_saudavel["plano_timeline"] = [
            {"etapa": "Hoje", "acao": "Nao regue"},
            {"etapa": "Em 3 dias", "acao": "Regue moderadamente"},
        ]
        resp = DiagnosticoResponse(**resposta_planta_saudavel)
        assert len(resp.plano_timeline) == 2
        assert resp.plano_timeline[0].etapa == "Hoje"


class TestEnums:
    """Testes dos enums do schema."""

    def test_nivel_luz_valores(self):
        assert len(NivelLuz) == 5
        assert NivelLuz.sol_pleno.value == "sol_pleno"
        assert NivelLuz.nao_aplicavel.value == "nao_aplicavel"

    def test_estado_saude_valores(self):
        assert len(EstadoSaude) == 5
        assert EstadoSaude.critico.value == "critico"

    def test_nivel_dificuldade_valores(self):
        assert len(NivelDificuldade) == 4
        assert NivelDificuldade.dificil.value == "dificil"


class TestModelsAninhados:
    """Testes dos models aninhados."""

    def test_passo_tratamento_valido(self):
        passo = PassoTratamento(etapa="Hoje", acao="Regue a planta")
        assert passo.etapa == "Hoje"
        assert passo.acao == "Regue a planta"

    def test_problema_detectado_valido(self):
        prob = ProblemaDetectado(
            descricao="Manchas escuras",
            gravidade="alta",
            causa_provavel="Fungo",
        )
        assert prob.gravidade == "alta"

    def test_diagnostico_error_response(self):
        err = DiagnosticoErrorResponse(
            error_code="GEMINI_ERROR",
            message="Erro ao processar",
            details="timeout",
        )
        assert err.error_code == "GEMINI_ERROR"
        assert err.details == "timeout"

    def test_diagnostico_error_sem_details(self):
        err = DiagnosticoErrorResponse(
            error_code="INTERNAL_ERROR",
            message="Erro interno",
        )
        assert err.details is None
