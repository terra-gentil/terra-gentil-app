"""Travas de segurança: perfil sem dados privados, login mobile e diagnóstico."""
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.core.config import settings
from app.routes import forum
from app.routes.auth import _redirect_mobile_permitido
from app.services.auth_service import create_jwt

DONO = "00000000-0000-0000-0000-000000000001"
OUTRO = "00000000-0000-0000-0000-000000000002"
PJ = {"origin": "https://setlists-pj-ev.pages.dev"}
PERFIL = {"id": DONO, "display_name": "Fã", "email": "fa@exemplo.com", "birth_year": 1987, "city": "Guarulhos"}


def _get(client, headers):
    with patch.object(forum, "_build_user_profile", AsyncMock(return_value=dict(PERFIL))):
        return client.get(f"/forum/users/{DONO}", headers=headers).json()


def test_visitante_nao_ve_email_nem_nascimento(community_client: TestClient):
    d = _get(community_client, PJ)
    assert d["email"] == "" and d["birth_year"] is None
    assert d["city"] == "Guarulhos"


def test_outro_usuario_logado_nao_ve(community_client: TestClient):
    d = _get(community_client, {**PJ, "Authorization": f"Bearer {create_jwt(OUTRO)}"})
    assert d["email"] == ""


def test_dono_ve_os_proprios_dados(community_client: TestClient):
    d = _get(community_client, {**PJ, "Authorization": f"Bearer {create_jwt(DONO)}"})
    assert d["email"] == "fa@exemplo.com" and d["birth_year"] == 1987


def test_redirect_mobile_so_do_app(monkeypatch):
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    assert _redirect_mobile_permitido("terragentil://auth")
    assert not _redirect_mobile_permitido("https://site-malicioso.com/pega")
    assert not _redirect_mobile_permitido("exp://192.168.0.10:8081/--/auth")
    assert not _redirect_mobile_permitido("javascript:alert(1)")
    monkeypatch.setattr(settings, "ENVIRONMENT", "development")
    assert _redirect_mobile_permitido("exp://192.168.0.10:8081/--/auth")


def test_login_mobile_recusa_redirect_externo(community_client: TestClient):
    r = community_client.get("/auth/google/login/mobile?redirect_uri=https://site-malicioso.com", follow_redirects=False)
    assert r.status_code == 400
