import logging
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status

from app.core.config import settings
from app.core.limiter import limiter
from app.schemas.forum import (
    PostCreate,
    PostOut,
    ReactionCreate,
    ReportCreate,
    TopicCreate,
    TopicDetailOut,
    TopicOut,
    TopicsPageOut,
)
from app.services.auth_service import verify_jwt
from app.services.db import get_conn

logger = logging.getLogger(__name__)
router = APIRouter()


def _resolve_site(request: Request) -> str:
    origin = request.headers.get("origin", "")
    site = settings.site_origin_map.get(origin)
    if not site:
        if settings.ENVIRONMENT == "development":
            return "pj"
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Origem não autorizada: {origin!r}",
        )
    return site


def _require_auth(authorization: Optional[str] = Header(default=None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token ausente")
    return verify_jwt(authorization.removeprefix("Bearer ").strip())["user_id"]


def _optional_auth(authorization: Optional[str] = Header(default=None)) -> Optional[str]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        return verify_jwt(authorization.removeprefix("Bearer ").strip())["user_id"]
    except Exception:
        return None


async def _attach_reactions(conn, target_ids: list[str], user_id: Optional[str]) -> tuple[dict, dict]:
    if not target_ids:
        return {}, {}
    reaction_rows = await conn.fetch(
        "SELECT target_id::text, type, COUNT(*)::int as cnt FROM forum_reactions WHERE target_id = ANY($1::uuid[]) GROUP BY target_id, type",
        target_ids,
    )
    counts: dict = {}
    for r in reaction_rows:
        counts.setdefault(r["target_id"], {})[r["type"]] = r["cnt"]

    mine: dict = {}
    if user_id:
        my_rows = await conn.fetch(
            "SELECT target_id::text, type FROM forum_reactions WHERE target_id = ANY($1::uuid[]) AND user_id = $2::uuid",
            target_ids, user_id,
        )
        for r in my_rows:
            mine.setdefault(r["target_id"], []).append(r["type"])

    return counts, mine


@router.get("/topics", response_model=TopicsPageOut, tags=["Forum"])
async def list_topics(
    request: Request,
    page: int = 1,
    per_page: int = 20,
    category: str = "",
    sort: str = "activity",
    user_id: Optional[str] = Depends(_optional_auth),
):
    site = _resolve_site(request)
    per_page = min(per_page, 50)
    offset = (page - 1) * per_page
    order = "t.last_post_at DESC" if sort == "activity" else "t.created_at DESC"
    noreply = sort == "noreply"

    async with get_conn() as conn:
        base_filter = "t.site = $3" + (" AND t.category = $4" if category else "")
        noreply_filter = " AND (SELECT COUNT(*) FROM forum_posts p WHERE p.topic_id = t.id) = 0" if noreply else ""
        params_base = [per_page, offset, site] + ([category] if category else [])

        rows = await conn.fetch(
            f"""
            SELECT t.id::text, t.title, t.body, t.category, t.site,
                   t.user_id::text,
                   u.display_name, u.avatar_url, t.pinned,
                   t.created_at::text, t.last_post_at::text,
                   (SELECT COUNT(*) FROM forum_posts p WHERE p.topic_id = t.id)::int AS reply_count
            FROM forum_topics t
            JOIN forum_users u ON u.id = t.user_id
            WHERE {base_filter}{noreply_filter}
            ORDER BY t.pinned DESC, {order}
            LIMIT $1 OFFSET $2
            """,
            *params_base,
        )
        count_q = "SELECT COUNT(*) FROM forum_topics t WHERE " + base_filter + noreply_filter
        total = await conn.fetchval(count_q, *params_base[2:])

    items = [TopicOut(**dict(r)) for r in rows]
    return TopicsPageOut(items=items, total=total or 0, page=page, per_page=per_page, site=site)


@router.post("/topics", response_model=TopicOut, status_code=status.HTTP_201_CREATED, tags=["Forum"])
@limiter.limit("1/minute")
async def create_topic(
    request: Request,
    payload: TopicCreate,
    user_id: str = Depends(_require_auth),
):
    site = _resolve_site(request)
    topic_id = str(uuid.uuid4())
    async with get_conn() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO forum_topics (id, title, body, category, site, user_id)
            VALUES ($1::uuid, $2, $3, $4, $5, $6::uuid)
            RETURNING id::text, title, body, category, site, user_id::text, pinned,
                      created_at::text, last_post_at::text
            """,
            topic_id, payload.title, payload.body, payload.category, site, user_id,
        )
        user = await conn.fetchrow(
            "SELECT display_name, avatar_url FROM forum_users WHERE id = $1::uuid", user_id
        )
    logger.info("Novo tópico id=%s site=%s user=%s", topic_id, site, user_id)
    return TopicOut(**dict(row), display_name=user["display_name"], avatar_url=user["avatar_url"], reply_count=0)


@router.get("/topics/{topic_id}", response_model=TopicDetailOut, tags=["Forum"])
async def get_topic(
    topic_id: str,
    request: Request,
    user_id: Optional[str] = Depends(_optional_auth),
):
    site = _resolve_site(request)
    async with get_conn() as conn:
        row = await conn.fetchrow(
            """
            SELECT t.id::text, t.title, t.body, t.category, t.site,
                   t.user_id::text,
                   u.display_name, u.avatar_url, t.pinned,
                   t.created_at::text, t.last_post_at::text,
                   (SELECT COUNT(*) FROM forum_posts p WHERE p.topic_id = t.id)::int AS reply_count
            FROM forum_topics t
            JOIN forum_users u ON u.id = t.user_id
            WHERE t.id = $1::uuid AND t.site = $2
            """,
            topic_id, site,
        )
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tópico não encontrado")

        posts_rows = await conn.fetch(
            """
            SELECT p.id::text, p.topic_id::text, p.body, p.site,
                   p.user_id::text,
                   u.display_name, u.avatar_url, p.created_at::text
            FROM forum_posts p
            JOIN forum_users u ON u.id = p.user_id
            WHERE p.topic_id = $1::uuid
            ORDER BY p.created_at ASC
            """,
            topic_id,
        )

        all_ids = [topic_id] + [p["id"] for p in posts_rows]
        counts, mine = await _attach_reactions(conn, all_ids, user_id)

    topic = TopicOut(
        **dict(row),
        reactions=counts.get(topic_id, {}),
        my_reactions=mine.get(topic_id, []),
    )
    posts = [
        PostOut(**dict(p), reactions=counts.get(p["id"], {}), my_reactions=mine.get(p["id"], []))
        for p in posts_rows
    ]
    return TopicDetailOut(topic=topic, posts=posts)


@router.post(
    "/topics/{topic_id}/posts",
    response_model=PostOut,
    status_code=status.HTTP_201_CREATED,
    tags=["Forum"],
)
@limiter.limit("1/minute")
async def create_post(
    request: Request,
    topic_id: str,
    payload: PostCreate,
    user_id: str = Depends(_require_auth),
):
    site = _resolve_site(request)
    async with get_conn() as conn:
        exists = await conn.fetchval(
            "SELECT 1 FROM forum_topics WHERE id = $1::uuid AND site = $2", topic_id, site,
        )
        if not exists:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tópico não encontrado")

        post_id = str(uuid.uuid4())
        row = await conn.fetchrow(
            """
            INSERT INTO forum_posts (id, topic_id, body, site, user_id)
            VALUES ($1::uuid, $2::uuid, $3, $4, $5::uuid)
            RETURNING id::text, topic_id::text, body, site, user_id::text, created_at::text
            """,
            post_id, topic_id, payload.body, site, user_id,
        )
        await conn.execute(
            "UPDATE forum_topics SET last_post_at = now() WHERE id = $1::uuid AND site = $2",
            topic_id, site,
        )
        user = await conn.fetchrow(
            "SELECT display_name, avatar_url FROM forum_users WHERE id = $1::uuid", user_id
        )

    logger.info("Nova resposta id=%s site=%s topic=%s user=%s", post_id, site, topic_id, user_id)
    return PostOut(**dict(row), display_name=user["display_name"], avatar_url=user["avatar_url"])


@router.post("/reactions", tags=["Forum"])
@limiter.limit("30/minute")
async def toggle_reaction(
    request: Request,
    payload: ReactionCreate,
    user_id: str = Depends(_require_auth),
):
    async with get_conn() as conn:
        exists = await conn.fetchval(
            "SELECT 1 FROM forum_reactions WHERE target_id=$1::uuid AND user_id=$2::uuid AND type=$3",
            payload.target_id, user_id, payload.type,
        )
        if exists:
            await conn.execute(
                "DELETE FROM forum_reactions WHERE target_id=$1::uuid AND user_id=$2::uuid AND type=$3",
                payload.target_id, user_id, payload.type,
            )
            active = False
        else:
            await conn.execute(
                "INSERT INTO forum_reactions (target_id, target_type, user_id, type) VALUES ($1::uuid, $2, $3::uuid, $4)",
                payload.target_id, payload.target_type, user_id, payload.type,
            )
            active = True
        count = await conn.fetchval(
            "SELECT COUNT(*)::int FROM forum_reactions WHERE target_id=$1::uuid AND type=$2",
            payload.target_id, payload.type,
        )
    return {"active": active, "count": count, "type": payload.type}


@router.post("/reports", status_code=status.HTTP_201_CREATED, tags=["Forum"])
async def create_report(
    request: Request,
    payload: ReportCreate,
    user_id: str = Depends(_require_auth),
):
    site = _resolve_site(request)
    report_id = str(uuid.uuid4())
    async with get_conn() as conn:
        await conn.execute(
            """
            INSERT INTO forum_reports (id, target_id, target_type, reason, reporter_id, site)
            VALUES ($1::uuid, $2::uuid, $3, $4, $5::uuid, $6)
            """,
            report_id, payload.target_id, payload.target_type, payload.reason, user_id, site,
        )
    logger.info("Report id=%s site=%s target=%s/%s", report_id, site, payload.target_type, payload.target_id)
    return {"status": "ok", "id": report_id}


@router.get("/users/{user_id}/profile", tags=["Forum"])
async def get_user_profile(user_id: str, request: Request):
    site = _resolve_site(request)
    async with get_conn() as conn:
        user = await conn.fetchrow(
            "SELECT id::text, display_name, avatar_url, created_at::text FROM forum_users WHERE id = $1::uuid",
            user_id,
        )
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")

        topic_count = await conn.fetchval(
            "SELECT COUNT(*)::int FROM forum_topics WHERE user_id=$1::uuid AND site=$2", user_id, site,
        )
        post_count = await conn.fetchval(
            "SELECT COUNT(*)::int FROM forum_posts WHERE user_id=$1::uuid AND site=$2", user_id, site,
        )
        topic_reactions = await conn.fetchval(
            "SELECT COUNT(*)::int FROM forum_reactions WHERE target_type='topic' AND target_id IN (SELECT id FROM forum_topics WHERE user_id=$1::uuid AND site=$2)",
            user_id, site,
        )
        post_reactions = await conn.fetchval(
            "SELECT COUNT(*)::int FROM forum_reactions WHERE target_type='post' AND target_id IN (SELECT id FROM forum_posts WHERE user_id=$1::uuid AND site=$2)",
            user_id, site,
        )

        recent_rows = await conn.fetch(
            """
            SELECT t.id::text, t.title, t.body, t.category, t.site,
                   t.user_id::text, u.display_name, u.avatar_url, t.pinned,
                   t.created_at::text, t.last_post_at::text,
                   (SELECT COUNT(*) FROM forum_posts p WHERE p.topic_id = t.id)::int AS reply_count
            FROM forum_topics t
            JOIN forum_users u ON u.id = t.user_id
            WHERE t.user_id = $1::uuid AND t.site = $2
            ORDER BY t.created_at DESC LIMIT 5
            """,
            user_id, site,
        )

    return {
        "id": user["id"],
        "display_name": user["display_name"],
        "avatar_url": user["avatar_url"],
        "created_at": user["created_at"],
        "topic_count": topic_count or 0,
        "post_count": post_count or 0,
        "reactions_received": (topic_reactions or 0) + (post_reactions or 0),
        "recent_topics": [TopicOut(**dict(r)) for r in recent_rows],
    }
