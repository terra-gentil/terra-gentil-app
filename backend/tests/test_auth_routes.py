"""
Testes das rotas de autenticacao: GET /auth/me e PATCH /auth/me.
DB mockado via patch em app.routes.auth.get_conn.
"""
import pytest
from contextlib import asynccontextmanager
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.services.auth_service import create_jwt

TEST_USER_ID = "00000000-0000-0000-0000-000000000001"


def _headers(user_id: str = TEST_USER_ID) -> dict:
    return {"Authorization": f"Bearer {create_jwt(user_id)}"}


def _make_client(db_conn):
    @asynccontextmanager
    async def fake_get_conn():
        yield db_conn

    return patch("app.routes.auth.get_conn", fake_get_conn)


class TestGetMe:
    def test_sem_token_retorna_401(self, community_client: TestClient):
        resp = community_client.get("/auth/me")
        assert resp.status_code == 401

    def test_token_invalido_retorna_401(self, community_client: TestClient):
        resp = community_client.get("/auth/me", headers={"Authorization": "Bearer lixo"})
        assert resp.status_code == 401

    def test_usuario_encontrado_retorna_200_com_is_admin(self, community_client: TestClient):
        db_conn = AsyncMock()
        db_conn.fetchrow.return_value = {
            "id": TEST_USER_ID,
            "display_name": "Andre Test",
            "avatar_url": None,
            "is_admin": False,
        }
        with _make_client(db_conn):
            resp = community_client.get("/auth/me", headers=_headers())
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == TEST_USER_ID
        assert data["display_name"] == "Andre Test"
        assert "is_admin" in data
        assert data["is_admin"] is False

    def test_usuario_admin_retorna_is_admin_true(self, community_client: TestClient):
        db_conn = AsyncMock()
        db_conn.fetchrow.return_value = {
            "id": TEST_USER_ID,
            "display_name": "Admin",
            "avatar_url": None,
            "is_admin": True,
        }
        with _make_client(db_conn):
            resp = community_client.get("/auth/me", headers=_headers())
        assert resp.status_code == 200
        assert resp.json()["is_admin"] is True

    def test_usuario_nao_encontrado_retorna_404(self, community_client: TestClient):
        db_conn = AsyncMock()
        db_conn.fetchrow.return_value = None
        with _make_client(db_conn):
            resp = community_client.get("/auth/me", headers=_headers())
        assert resp.status_code == 404


class TestPatchMe:
    # PATCH /auth/me espera body como JSON string puro: "Nome" (nao um objeto)
    def test_sem_token_retorna_401(self, community_client: TestClient):
        resp = community_client.patch("/auth/me", json="Novo Nome")
        assert resp.status_code == 401

    def test_nome_muito_curto_retorna_422(self, community_client: TestClient):
        resp = community_client.patch("/auth/me", headers=_headers(), json="A")
        assert resp.status_code == 422

    def test_nome_valido_retorna_200(self, community_client: TestClient):
        db_conn = AsyncMock()
        with _make_client(db_conn):
            resp = community_client.patch(
                "/auth/me",
                headers=_headers(),
                json="Nome Valido",
            )
        assert resp.status_code == 200
        assert resp.json()["display_name"] == "Nome Valido"

    def test_nome_muito_longo_retorna_422(self, community_client: TestClient):
        resp = community_client.patch("/auth/me", headers=_headers(), json="N" * 61)
        assert resp.status_code == 422
