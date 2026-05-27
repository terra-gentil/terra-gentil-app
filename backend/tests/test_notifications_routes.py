"""
Testes das rotas de notificacoes e push tokens.
Cobre autenticacao, guard de admin e fluxo de broadcast.
"""
import pytest
from contextlib import asynccontextmanager
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.services.auth_service import create_jwt

TEST_USER_ID = "00000000-0000-0000-0000-000000000001"
ADMIN_USER_ID = "00000000-0000-0000-0000-000000000002"
NOTIF_ID = "aaaaaaaa-0000-0000-0000-000000000001"


def _headers(user_id: str = TEST_USER_ID) -> dict:
    return {"Authorization": f"Bearer {create_jwt(user_id)}"}


def _make_client(db_conn):
    @asynccontextmanager
    async def fake_get_conn():
        yield db_conn

    return patch("app.routes.notifications.get_conn", fake_get_conn)


class TestPushTokens:
    def test_sem_auth_retorna_401(self, community_client: TestClient):
        resp = community_client.post("/push-tokens", json={"token": "ExpoToken[abc]"})
        assert resp.status_code == 401

    def test_com_auth_retorna_200(self, community_client: TestClient):
        db_conn = AsyncMock()
        with _make_client(db_conn):
            resp = community_client.post(
                "/push-tokens",
                headers=_headers(),
                json={"token": "ExpoToken[abc]", "platform": "ios"},
            )
        assert resp.status_code == 200
        assert resp.json()["ok"] is True


class TestListarNotificacoes:
    def test_sem_auth_retorna_401(self, community_client: TestClient):
        resp = community_client.get("/notifications")
        assert resp.status_code == 401

    def test_com_auth_lista_vazia_retorna_200(self, community_client: TestClient):
        db_conn = AsyncMock()
        db_conn.fetch.return_value = []
        with _make_client(db_conn):
            resp = community_client.get("/notifications", headers=_headers())
        assert resp.status_code == 200
        assert resp.json() == []

    def test_com_auth_retorna_lista_de_notifs(self, community_client: TestClient):
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        db_conn = AsyncMock()
        db_conn.fetch.return_value = [
            {
                "id": NOTIF_ID,
                "title": "Novidade",
                "body": "Texto da notificacao",
                "type": "broadcast",
                "data": {},
                "read_at": None,
                "created_at": now,
            }
        ]
        with _make_client(db_conn):
            resp = community_client.get("/notifications", headers=_headers())
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["title"] == "Novidade"
        assert data[0]["read_at"] is None


class TestMarcarLida:
    def test_sem_auth_retorna_401(self, community_client: TestClient):
        resp = community_client.post(f"/notifications/{NOTIF_ID}/read")
        assert resp.status_code == 401

    def test_com_auth_retorna_200(self, community_client: TestClient):
        db_conn = AsyncMock()
        with _make_client(db_conn):
            resp = community_client.post(
                f"/notifications/{NOTIF_ID}/read",
                headers=_headers(),
            )
        assert resp.status_code == 200
        assert resp.json()["ok"] is True


class TestAdminBroadcast:
    def test_sem_auth_retorna_401(self, community_client: TestClient):
        # get_conn e chamado antes do guard de auth neste endpoint
        db_conn = AsyncMock()
        with _make_client(db_conn):
            resp = community_client.post(
                "/admin/notifications/broadcast",
                json={"titulo": "Test", "corpo": "Mensagem"},
            )
        assert resp.status_code == 401

    def test_usuario_nao_admin_retorna_403(self, community_client: TestClient):
        db_conn = AsyncMock()
        db_conn.fetchrow.return_value = {"is_admin": False}
        with _make_client(db_conn):
            resp = community_client.post(
                "/admin/notifications/broadcast",
                headers=_headers(),
                json={"titulo": "Test", "corpo": "Mensagem"},
            )
        assert resp.status_code == 403

    def test_admin_sem_tokens_retorna_enviados_zero(self, community_client: TestClient):
        db_conn = AsyncMock()
        db_conn.fetchrow.return_value = {"is_admin": True}
        db_conn.fetch.return_value = []  # nenhum token registrado
        with _make_client(db_conn):
            resp = community_client.post(
                "/admin/notifications/broadcast",
                headers=_headers(ADMIN_USER_ID),
                json={"titulo": "Novidade", "corpo": "Texto da mensagem"},
            )
        assert resp.status_code == 200
        assert resp.json()["enviados"] == 0

    def test_admin_com_tokens_chama_expo_e_retorna_enviados(self, community_client: TestClient):
        db_conn = AsyncMock()
        db_conn.fetchrow.return_value = {"is_admin": True}
        db_conn.fetch.return_value = [{"token": "ExpoToken[aaa]"}, {"token": "ExpoToken[bbb]"}]

        mock_resp = MagicMock()
        mock_resp.raise_for_status = MagicMock()

        mock_httpx_client = AsyncMock()
        mock_httpx_client.__aenter__ = AsyncMock(return_value=mock_httpx_client)
        mock_httpx_client.__aexit__ = AsyncMock(return_value=False)
        mock_httpx_client.post = AsyncMock(return_value=mock_resp)

        with _make_client(db_conn):
            with patch("httpx.AsyncClient", return_value=mock_httpx_client):
                resp = community_client.post(
                    "/admin/notifications/broadcast",
                    headers=_headers(ADMIN_USER_ID),
                    json={"titulo": "Push test", "corpo": "Chegou"},
                )
        assert resp.status_code == 200
        assert resp.json()["enviados"] == 2

    def test_titulo_muito_longo_retorna_422(self, community_client: TestClient):
        resp = community_client.post(
            "/admin/notifications/broadcast",
            headers=_headers(),
            json={"titulo": "T" * 201, "corpo": "Mensagem"},
        )
        assert resp.status_code == 422


class TestAdminStats:
    def test_sem_auth_retorna_401(self, community_client: TestClient):
        db_conn = AsyncMock()
        with _make_client(db_conn):
            resp = community_client.get("/admin/stats")
        assert resp.status_code == 401

    def test_nao_admin_retorna_403(self, community_client: TestClient):
        db_conn = AsyncMock()
        db_conn.fetchrow.return_value = {"is_admin": False}
        with _make_client(db_conn):
            resp = community_client.get("/admin/stats", headers=_headers())
        assert resp.status_code == 403

    def test_admin_retorna_200_com_campos(self, community_client: TestClient):
        db_conn = AsyncMock()
        db_conn.fetchrow.return_value = {"is_admin": True}
        db_conn.fetchval.side_effect = [10, 25, 50, 8]  # usuarios, posts, respostas, push
        with _make_client(db_conn):
            resp = community_client.get("/admin/stats", headers=_headers(ADMIN_USER_ID))
        assert resp.status_code == 200
        data = resp.json()
        assert "usuarios" in data
        assert "posts" in data
        assert "respostas" in data
        assert "usuarios_com_push" in data
