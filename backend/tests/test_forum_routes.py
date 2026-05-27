"""
Testes das rotas de forum: criacao, delecao e posts.
Complementa test_site_isolation.py que ja cobre listagem e isolamento de site.
"""
import pytest
from contextlib import asynccontextmanager
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.services.auth_service import create_jwt

TEST_USER_ID = "00000000-0000-0000-0000-000000000001"
OTHER_USER_ID = "00000000-0000-0000-0000-000000000002"
TOPIC_ID = "bbbbbbbb-0000-0000-0000-000000000001"

# Origin valido para _resolve_site retornar "pj"
PJ_ORIGIN = {"origin": "https://setlists-pj-ev.pages.dev"}


def _headers(user_id: str = TEST_USER_ID) -> dict:
    return {"Authorization": f"Bearer {create_jwt(user_id)}", **PJ_ORIGIN}


def _make_client(db_conn):
    @asynccontextmanager
    async def fake_get_conn():
        yield db_conn

    return patch("app.routes.forum.get_conn", fake_get_conn)


TOPIC_ROW = {
    "id": TOPIC_ID,
    "title": "Titulo do topico",
    "body": "Conteudo do topico aqui com mais texto",
    "category": "geral",
    "site": "pj",
    "user_id": TEST_USER_ID,
    "pinned": False,
    "created_at": "2026-01-01T00:00:00",
    "last_post_at": "2026-01-01T00:00:00",
    # reply_count nao vem do INSERT RETURNING — e adicionado pelo route
}

USER_ROW = {"display_name": "Test User", "avatar_url": None}


class TestCreateTopic:
    def test_sem_auth_retorna_401(self, community_client: TestClient):
        resp = community_client.post(
            "/forum/topics",
            headers=PJ_ORIGIN,
            json={"title": "Titulo", "body": "Conteudo aqui"},
        )
        assert resp.status_code == 401

    def test_titulo_muito_curto_retorna_422(self, community_client: TestClient):
        resp = community_client.post(
            "/forum/topics",
            headers=_headers(),
            json={"title": "AB", "body": "Conteudo valido aqui"},
        )
        assert resp.status_code == 422

    def test_body_muito_curto_retorna_422(self, community_client: TestClient):
        resp = community_client.post(
            "/forum/topics",
            headers=_headers(),
            json={"title": "Titulo valido", "body": "curto"},
        )
        assert resp.status_code == 422

    def test_payload_valido_cria_topico(self, community_client: TestClient):
        db_conn = AsyncMock()
        db_conn.fetchrow.side_effect = [TOPIC_ROW, USER_ROW]
        with _make_client(db_conn):
            resp = community_client.post(
                "/forum/topics",
                headers=_headers(),
                json={"title": "Titulo do topico", "body": "Conteudo do topico aqui com mais texto"},
            )
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "Titulo do topico"
        assert data["reply_count"] == 0


class TestDeleteTopic:
    def test_sem_auth_retorna_401(self, community_client: TestClient):
        resp = community_client.delete(f"/forum/topics/{TOPIC_ID}", headers=PJ_ORIGIN)
        assert resp.status_code == 401

    def test_topico_nao_encontrado_retorna_404(self, community_client: TestClient):
        db_conn = AsyncMock()
        db_conn.fetchrow.return_value = None
        with _make_client(db_conn):
            resp = community_client.delete(
                f"/forum/topics/{TOPIC_ID}",
                headers=_headers(),
            )
        assert resp.status_code == 404

    def test_nao_dono_retorna_403(self, community_client: TestClient):
        db_conn = AsyncMock()
        db_conn.fetchrow.return_value = {"user_id": OTHER_USER_ID}  # dono e outro usuario
        with _make_client(db_conn):
            resp = community_client.delete(
                f"/forum/topics/{TOPIC_ID}",
                headers=_headers(TEST_USER_ID),  # autenticado como TEST_USER, nao OTHER
            )
        assert resp.status_code == 403

    def test_dono_deleta_com_sucesso(self, community_client: TestClient):
        db_conn = AsyncMock()
        db_conn.fetchrow.return_value = {"user_id": TEST_USER_ID}
        with _make_client(db_conn):
            resp = community_client.delete(
                f"/forum/topics/{TOPIC_ID}",
                headers=_headers(TEST_USER_ID),
            )
        assert resp.status_code == 204


class TestCreatePost:
    def test_sem_auth_retorna_401(self, community_client: TestClient):
        resp = community_client.post(
            f"/forum/topics/{TOPIC_ID}/posts",
            headers=PJ_ORIGIN,
            json={"body": "Resposta valida"},
        )
        assert resp.status_code == 401

    def test_body_vazio_retorna_422(self, community_client: TestClient):
        resp = community_client.post(
            f"/forum/topics/{TOPIC_ID}/posts",
            headers=_headers(),
            json={"body": ""},
        )
        assert resp.status_code == 422

    def test_body_muito_curto_retorna_422(self, community_client: TestClient):
        resp = community_client.post(
            f"/forum/topics/{TOPIC_ID}/posts",
            headers=_headers(),
            json={"body": "x"},
        )
        assert resp.status_code == 422

    def test_topico_inexistente_retorna_404(self, community_client: TestClient):
        db_conn = AsyncMock()
        db_conn.fetchval.return_value = None  # topico nao existe
        with _make_client(db_conn):
            resp = community_client.post(
                f"/forum/topics/{TOPIC_ID}/posts",
                headers=_headers(),
                json={"body": "Resposta valida aqui"},
            )
        assert resp.status_code == 404
