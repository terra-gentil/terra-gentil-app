import logging

import httpx
from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.services.auth_service import verify_jwt
from app.services.db import get_conn

logger = logging.getLogger(__name__)
router = APIRouter()
_bearer = HTTPBearer(auto_error=False)


def _exigir_token(credentials: HTTPAuthorizationCredentials) -> str:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token ausente")
    payload = verify_jwt(credentials.credentials)
    return payload["user_id"]


async def _exigir_admin(credentials: HTTPAuthorizationCredentials, conn) -> str:
    user_id = _exigir_token(credentials)
    row = await conn.fetchrow(
        "SELECT COALESCE(is_admin, FALSE) AS is_admin FROM forum_users WHERE id = $1::uuid",
        user_id,
    )
    if not row or not row["is_admin"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    return user_id


# ── Push tokens ──────────────────────────────────────────────────────────────

@router.post("/push-tokens", tags=["Notifications"])
async def registrar_push_token(
    token: str = Body(...),
    platform: str = Body(default="unknown"),
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
):
    user_id = _exigir_token(credentials)
    async with get_conn() as conn:
        await conn.execute(
            """
            INSERT INTO push_tokens (user_id, token, platform, updated_at)
            VALUES ($1::uuid, $2, $3, NOW())
            ON CONFLICT (user_id, token) DO UPDATE
              SET updated_at = NOW(), platform = EXCLUDED.platform
            """,
            user_id, token, platform,
        )
    return {"ok": True}


# ── Notificações ──────────────────────────────────────────────────────────────

@router.get("/notifications", tags=["Notifications"])
async def listar_notificacoes(
    limit: int = Query(default=30, le=100),
    offset: int = Query(default=0, ge=0),
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
):
    user_id = _exigir_token(credentials)
    async with get_conn() as conn:
        rows = await conn.fetch(
            """
            SELECT id, title, body, type, data, read_at, created_at
            FROM notifications
            WHERE user_id = $1::uuid OR user_id IS NULL
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
            """,
            user_id, limit, offset,
        )
    return [
        {
            "id": str(r["id"]),
            "title": r["title"],
            "body": r["body"],
            "type": r["type"],
            "data": dict(r["data"]) if r["data"] else {},
            "read_at": r["read_at"].isoformat() if r["read_at"] else None,
            "created_at": r["created_at"].isoformat(),
        }
        for r in rows
    ]


@router.post("/notifications/{notification_id}/read", tags=["Notifications"])
async def marcar_lida(
    notification_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
):
    user_id = _exigir_token(credentials)
    async with get_conn() as conn:
        await conn.execute(
            "UPDATE notifications SET read_at = NOW() "
            "WHERE id = $1::uuid AND user_id = $2::uuid AND read_at IS NULL",
            notification_id, user_id,
        )
    return {"ok": True}


# ── Admin ─────────────────────────────────────────────────────────────────────

@router.post("/admin/notifications/broadcast", tags=["Admin"])
async def enviar_broadcast(
    titulo: str = Body(..., max_length=200),
    corpo: str = Body(..., max_length=500),
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
):
    async with get_conn() as conn:
        admin_id = await _exigir_admin(credentials, conn)

        await conn.execute(
            "INSERT INTO notifications (title, body, type) VALUES ($1, $2, 'broadcast')",
            titulo, corpo,
        )

        tokens = await conn.fetch("SELECT token FROM push_tokens")

    token_list = [r["token"] for r in tokens]
    if not token_list:
        logger.info("Broadcast salvo, nenhum token de push registrado")
        return {"enviados": 0}

    enviados = 0
    async with httpx.AsyncClient(timeout=30) as client:
        for i in range(0, len(token_list), 100):
            batch = token_list[i : i + 100]
            messages = [
                {"to": t, "title": titulo, "body": corpo, "sound": "default"}
                for t in batch
            ]
            try:
                resp = await client.post(
                    "https://exp.host/--/api/v2/push/send",
                    json=messages,
                    headers={"Content-Type": "application/json"},
                )
                resp.raise_for_status()
                enviados += len(batch)
            except Exception as exc:
                logger.error("Erro ao enviar push batch: %s", exc)

    logger.info("Broadcast por admin=%s: %d tokens atingidos", admin_id, enviados)
    return {"enviados": enviados}


@router.get("/admin/stats", tags=["Admin"])
async def admin_stats(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
):
    async with get_conn() as conn:
        await _exigir_admin(credentials, conn)

        usuarios = await conn.fetchval("SELECT COUNT(*) FROM forum_users")
        posts = await conn.fetchval("SELECT COUNT(*) FROM forum_topics")
        respostas = await conn.fetchval("SELECT COUNT(*) FROM forum_posts")
        tokens_push = await conn.fetchval("SELECT COUNT(DISTINCT user_id) FROM push_tokens")

    return {
        "usuarios": int(usuarios),
        "posts": int(posts),
        "respostas": int(respostas),
        "usuarios_com_push": int(tokens_push),
    }
