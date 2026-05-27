import logging

import httpx
from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

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
    plataforma: str = Body(default="todos"),
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
):
    if plataforma not in ("todos", "ios", "android"):
        raise HTTPException(status_code=422, detail="plataforma deve ser 'todos', 'ios' ou 'android'")

    async with get_conn() as conn:
        admin_id = await _exigir_admin(credentials, conn)

        await conn.execute(
            "INSERT INTO notifications (title, body, type) VALUES ($1, $2, 'broadcast')",
            titulo, corpo,
        )

        if plataforma == "todos":
            tokens = await conn.fetch("SELECT token FROM push_tokens")
        else:
            tokens = await conn.fetch(
                "SELECT token FROM push_tokens WHERE platform = $1", plataforma
            )

    token_list = [r["token"] for r in tokens]
    if not token_list:
        logger.info("Broadcast salvo, nenhum token de push registrado (plataforma=%s)", plataforma)
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

    logger.info("Broadcast por admin=%s plataforma=%s: %d tokens atingidos", admin_id, plataforma, enviados)
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


@router.get("/admin/reports", tags=["Admin"])
async def listar_reports(
    limit: int = Query(default=20, le=100),
    offset: int = Query(default=0, ge=0),
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
):
    async with get_conn() as conn:
        await _exigir_admin(credentials, conn)

        rows = await conn.fetch(
            """
            SELECT
                r.id,
                r.target_type,
                r.target_id,
                r.reason,
                r.reporter_id,
                r.created_at,
                CASE
                    WHEN r.target_type = 'topic' THEN LEFT(t.body, 120)
                    ELSE LEFT(p.body, 120)
                END AS conteudo_preview,
                CASE
                    WHEN r.target_type = 'topic' THEN t.user_id::text
                    ELSE p.user_id::text
                END AS autor_id
            FROM forum_reports r
            LEFT JOIN forum_topics t ON r.target_type = 'topic' AND t.id = r.target_id
            LEFT JOIN forum_posts  p ON r.target_type = 'post'  AND p.id = r.target_id
            WHERE r.status = 'pendente'
            ORDER BY r.created_at DESC
            LIMIT $1 OFFSET $2
            """,
            limit, offset,
        )

        total = await conn.fetchval(
            "SELECT COUNT(*) FROM forum_reports WHERE status = 'pendente'"
        )

    return {
        "total": int(total),
        "reports": [
            {
                "id": str(r["id"]),
                "target_type": r["target_type"],
                "target_id": str(r["target_id"]),
                "reason": r["reason"],
                "reporter_id": str(r["reporter_id"]) if r["reporter_id"] else None,
                "created_at": r["created_at"].isoformat(),
                "conteudo_preview": r["conteudo_preview"] or "",
                "autor_id": r["autor_id"],
            }
            for r in rows
        ],
    }


class ResolverReportIn(BaseModel):
    deletar_conteudo: bool = False


@router.post("/admin/reports/{report_id}/resolver", tags=["Admin"])
async def resolver_report(
    report_id: str,
    data: ResolverReportIn = Body(default=ResolverReportIn()),
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
):
    async with get_conn() as conn:
        await _exigir_admin(credentials, conn)

        row = await conn.fetchrow(
            "SELECT target_type, target_id FROM forum_reports WHERE id = $1::uuid AND status = 'pendente'",
            report_id,
        )
        if not row:
            raise HTTPException(status_code=404, detail="Report nao encontrado ou ja resolvido")

        novo_status = "resolvido"

        if data.deletar_conteudo:
            if row["target_type"] == "topic":
                await conn.execute("DELETE FROM forum_topics WHERE id = $1::uuid", row["target_id"])
            else:
                await conn.execute("DELETE FROM forum_posts WHERE id = $1::uuid", row["target_id"])

        await conn.execute(
            "UPDATE forum_reports SET status = $1 WHERE id = $2::uuid",
            novo_status, report_id,
        )

    return {"ok": True, "status": novo_status, "conteudo_deletado": data.deletar_conteudo}


@router.get("/admin/users/buscar", tags=["Admin"])
async def buscar_usuarios(
    q: str = Query(..., min_length=2, max_length=100),
    limit: int = Query(default=20, le=50),
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
):
    async with get_conn() as conn:
        await _exigir_admin(credentials, conn)

        rows = await conn.fetch(
            """
            SELECT
                u.id, u.display_name, u.avatar_url, u.bloqueado,
                u.created_at,
                COUNT(t.id) AS total_posts
            FROM forum_users u
            LEFT JOIN forum_topics t ON t.user_id = u.id
            WHERE u.display_name ILIKE $1
            GROUP BY u.id
            ORDER BY u.display_name
            LIMIT $2
            """,
            f"%{q}%", limit,
        )

    return [
        {
            "id": str(r["id"]),
            "display_name": r["display_name"],
            "avatar_url": r["avatar_url"],
            "bloqueado": r["bloqueado"],
            "created_at": r["created_at"].isoformat() if r["created_at"] else None,
            "total_posts": int(r["total_posts"]),
        }
        for r in rows
    ]


@router.post("/admin/users/{user_id}/bloquear", tags=["Admin"])
async def bloquear_usuario(
    user_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
):
    async with get_conn() as conn:
        admin_id = await _exigir_admin(credentials, conn)
        if user_id == admin_id:
            raise HTTPException(status_code=400, detail="Voce nao pode bloquear a si mesmo")
        result = await conn.execute(
            "UPDATE forum_users SET bloqueado = TRUE WHERE id = $1::uuid", user_id
        )
        if result == "UPDATE 0":
            raise HTTPException(status_code=404, detail="Usuario nao encontrado")
    return {"ok": True, "bloqueado": True}


@router.post("/admin/users/{user_id}/desbloquear", tags=["Admin"])
async def desbloquear_usuario(
    user_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
):
    async with get_conn() as conn:
        await _exigir_admin(credentials, conn)
        result = await conn.execute(
            "UPDATE forum_users SET bloqueado = FALSE WHERE id = $1::uuid", user_id
        )
        if result == "UPDATE 0":
            raise HTTPException(status_code=404, detail="Usuario nao encontrado")
    return {"ok": True, "bloqueado": False}
