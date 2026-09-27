"""Edição de tópico e resposta: só o dono ou admin, com os mesmos limites da criação."""
from contextlib import asynccontextmanager
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.core.config import settings
from app.services.auth_service import create_jwt

DONO = "00000000-0000-0000-0000-000000000001"
OUTRO = "00000000-0000-0000-0000-000000000002"
ALVO = "bbbbbbbb-0000-0000-0000-000000000001"
PJ = {"origin": "https://setlists-pj-ev.pages.dev"}


def _h(user_id=DONO):
    return {"Authorization": f"Bearer {create_jwt(user_id)}", **PJ}


def _conn(dono=DONO):
    conn = AsyncMock()
    # 1a consulta: conta bloqueada? 2a: dono do alvo (None = não existe)
    conn.fetchrow.side_effect = [{"bloqueado": False}, {"user_id": dono} if dono else None]
    return conn


def _patch(conn):
    @asynccontextmanager
    async def fake():
        yield conn
    return patch("app.routes.forum.get_conn", fake)


def test_dono_edita_topico(community_client: TestClient):
    conn = _conn()
    with _patch(conn):
        r = community_client.patch(f"/forum/topics/{ALVO}", headers=_h(), json={"title": "Título novo"})
    assert r.status_code == 200
    sql, *args = conn.execute.call_args.args
    assert "UPDATE forum_topics" in sql and args == [ALVO, "Título novo", None]


def test_outro_usuario_nao_edita(community_client: TestClient):
    with _patch(_conn()):
        r = community_client.patch(f"/forum/posts/{ALVO}", headers=_h(OUTRO), json={"body": "Texto alterado"})
    assert r.status_code == 403
    assert r.json()["detail"] == "Sem permissão para editar esta resposta"


def test_admin_edita_de_qualquer_um(community_client: TestClient, monkeypatch):
    monkeypatch.setattr(settings, "ADMIN_USER_IDS", OUTRO)
    conn = _conn()
    with _patch(conn):
        r = community_client.patch(f"/forum/posts/{ALVO}", headers=_h(OUTRO), json={"body": "Corrigido pelo admin"})
    assert r.status_code == 200
    assert conn.execute.await_count == 1


def test_alvo_inexistente_404(community_client: TestClient):
    with _patch(_conn(dono=None)):
        r = community_client.patch(f"/forum/posts/{ALVO}", headers=_h(), json={"body": "Texto qualquer"})
    assert r.status_code == 404 and r.json()["detail"] == "Resposta não encontrada"


def test_validacao(community_client: TestClient):
    assert community_client.patch(f"/forum/topics/{ALVO}", headers=_h(), json={}).status_code == 422
    assert community_client.patch(f"/forum/topics/{ALVO}", headers=_h(), json={"title": "x"}).status_code == 422
    assert community_client.patch(f"/forum/posts/{ALVO}", headers=PJ, json={"body": "sem login"}).status_code == 401
