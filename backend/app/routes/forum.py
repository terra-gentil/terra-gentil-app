import logging
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, Response, status

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
    UserProfileUpdate,
)
from app.services.auth_service import verify_jwt
from app.services.db import get_conn

logger = logging.getLogger(__name__)
router = APIRouter()


_MOBILE_VALID_SITES = {"terra-gentil", "pj"}


def _resolve_site(request: Request) -> str:
    origin = request.headers.get("origin", "")
    site = settings.site_origin_map.get(origin)
    if site:
        return site
    # Apps mobile nao enviam Origin. Aceitam header X-Site com o nome do site.
    x_site = request.headers.get("x-site", "").strip()
    if x_site and x_site in (set(settings.site_origin_map.values()) | _MOBILE_VALID_SITES):
        return x_site
    if settings.ENVIRONMENT == "development":
        return "pj"
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=f"Origem não autorizada: {origin!r}",
    )


def _require_auth(authorization: Optional[str] = Header(default=None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token ausente")
    return verify_jwt(authorization.removeprefix("Bearer ").strip())["user_id"]


async def _require_auth_active(authorization: Optional[str] = Header(default=None)) -> str:
    user_id = _require_auth(authorization)
    async with get_conn() as conn:
        row = await conn.fetchrow(
            "SELECT bloqueado FROM forum_users WHERE id = $1::uuid", user_id
        )
    if row and row["bloqueado"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Conta bloqueada")
    return user_id


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


_SORT_ORDER = {
    "activity": "t.last_post_at DESC",
    "newest": "t.created_at DESC",
    "noreply": "COALESCE(pc.reply_count, 0) ASC, t.created_at DESC",
    "likes": "COALESCE(rc_mata.cnt, 0) DESC, t.last_post_at DESC",
}


@router.get("/topics", response_model=TopicsPageOut, tags=["Forum"])
@limiter.limit("30/minute")
async def list_topics(
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    category: str = "",
    sort: str = "activity",
    show_id: str = "",
    user_id: Optional[str] = Depends(_optional_auth),
):
    site = _resolve_site(request)
    offset = (page - 1) * per_page
    order = _SORT_ORDER.get(sort, _SORT_ORDER["activity"])
    noreply = sort == "noreply"

    async with get_conn() as conn:
        # Filtros dinâmicos. Args: [per_page, offset, site, ...]
        where = ["t.site = $3"]
        args = [per_page, offset, site]
        if category:
            args.append(category)
            where.append(f"t.category = ${len(args)}")
        if show_id:
            args.append(show_id)
            where.append(f"t.anchor_show_id = ${len(args)}")
        if noreply:
            where.append("COALESCE(pc.reply_count, 0) = 0")
        where_sql = " WHERE " + " AND ".join(where)

        rows = await conn.fetch(
            f"""
            SELECT t.id::text, t.title, t.body, t.category, t.site,
                   t.user_id::text,
                   u.display_name, u.avatar_url, t.pinned,
                   t.created_at::text,
                   COALESCE(t.last_post_at, t.created_at)::text AS last_post_at,
                   t.anchor_show_id,
                   COALESCE(pc.reply_count, 0)::int AS reply_count,
                   COALESCE(rc_mata.cnt, 0)::int AS mata_cnt,
                   COALESCE(rc_tava.cnt, 0)::int AS tava_la_cnt
            FROM forum_topics t
            JOIN forum_users u ON u.id = t.user_id
            LEFT JOIN (
                SELECT topic_id, COUNT(*)::int AS reply_count
                FROM forum_posts GROUP BY topic_id
            ) pc ON pc.topic_id = t.id
            LEFT JOIN (
                SELECT target_id, COUNT(*)::int AS cnt
                FROM forum_reactions WHERE type = 'mata' GROUP BY target_id
            ) rc_mata ON rc_mata.target_id = t.id
            LEFT JOIN (
                SELECT target_id, COUNT(*)::int AS cnt
                FROM forum_reactions WHERE type = 'tava_la' GROUP BY target_id
            ) rc_tava ON rc_tava.target_id = t.id
            {where_sql}
            ORDER BY t.pinned DESC, {order}
            LIMIT $1 OFFSET $2
            """,
            *args,
        )
        # COUNT usa os mesmos filtros sem LIMIT/OFFSET; reindexa placeholders (sem $1/$2)
        count_args = args[2:]
        count_where = where_sql.replace("$3", "$1").replace("$4", "$2").replace("$5", "$3")
        if noreply:
            # noreply usa NOT EXISTS no count pra evitar JOIN
            count_where = count_where.replace("COALESCE(pc.reply_count, 0) = 0", "NOT EXISTS (SELECT 1 FROM forum_posts p WHERE p.topic_id = t.id)")
        total = await conn.fetchval(
            f"SELECT COUNT(*) FROM forum_topics t {count_where}",
            *count_args,
        )

    items = []
    for r in rows:
        d = dict(r)
        mata = d.pop("mata_cnt", 0) or 0
        tava = d.pop("tava_la_cnt", 0) or 0
        items.append(TopicOut(**d, reactions={"mata": mata, "tava_la": tava}))
    return TopicsPageOut(items=items, total=total or 0, page=page, per_page=per_page, site=site)


@router.post("/topics", response_model=TopicOut, status_code=status.HTTP_201_CREATED, tags=["Forum"])
@limiter.limit("10/minute")
async def create_topic(
    request: Request,
    payload: TopicCreate,
    user_id: str = Depends(_require_auth_active),
):
    site = _resolve_site(request)
    topic_id = str(uuid.uuid4())
    async with get_conn() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO forum_topics (id, title, body, category, site, user_id, anchor_show_id)
            VALUES ($1::uuid, $2, $3, $4, $5, $6::uuid, $7)
            RETURNING id::text, title, body, category, site, user_id::text, pinned,
                      created_at::text, last_post_at::text, anchor_show_id
            """,
            topic_id, payload.title, payload.body, payload.category, site, user_id, payload.anchor_show_id,
        )
        user = await conn.fetchrow(
            "SELECT display_name, avatar_url FROM forum_users WHERE id = $1::uuid", user_id
        )
    logger.info("Novo tópico id=%s site=%s user=%s show=%s", topic_id, site, user_id, payload.anchor_show_id)
    return TopicOut(**dict(row), display_name=user["display_name"], avatar_url=user["avatar_url"], reply_count=0)


@router.get("/topics/{topic_id}", response_model=TopicDetailOut, tags=["Forum"])
@limiter.limit("30/minute")
async def get_topic(
    topic_id: str,
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(30, ge=1, le=100),
    user_id: Optional[str] = Depends(_optional_auth),
):
    site = _resolve_site(request)
    offset = (page - 1) * per_page
    async with get_conn() as conn:
        row = await conn.fetchrow(
            """
            SELECT t.id::text, t.title, t.body, t.category, t.site,
                   t.user_id::text,
                   u.display_name, u.avatar_url, t.pinned,
                   t.created_at::text,
                   COALESCE(t.last_post_at, t.created_at)::text AS last_post_at,
                   t.anchor_show_id,
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
            LIMIT $2 OFFSET $3
            """,
            topic_id, per_page, offset,
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
    return TopicDetailOut(topic=topic, posts=posts, total_posts=row["reply_count"], page=page, per_page=per_page)


@router.delete("/topics/{topic_id}", status_code=204, tags=["Forum"])
async def deletar_topic(
    topic_id: str,
    request: Request,
    user_id: str = Depends(_require_auth),
):
    site = _resolve_site(request)
    async with get_conn() as conn:
        row = await conn.fetchrow(
            "SELECT user_id::text FROM forum_topics WHERE id = $1::uuid AND site = $2",
            topic_id, site,
        )
        if not row:
            raise HTTPException(status_code=404, detail="Tópico não encontrado")
        if row["user_id"] != user_id and not settings.is_admin(user_id):
            raise HTTPException(status_code=403, detail="Sem permissão para apagar este tópico")
        await conn.execute("DELETE FROM forum_topics WHERE id = $1::uuid", topic_id)
    logger.info("Tópico deletado id=%s por user=%s admin=%s", topic_id, user_id, settings.is_admin(user_id))
    return Response(status_code=204)


@router.delete("/posts/{post_id}", status_code=204, tags=["Forum"])
async def deletar_post(
    post_id: str,
    request: Request,
    user_id: str = Depends(_require_auth),
):
    site = _resolve_site(request)
    async with get_conn() as conn:
        row = await conn.fetchrow(
            "SELECT user_id::text FROM forum_posts WHERE id = $1::uuid AND site = $2",
            post_id, site,
        )
        if not row:
            raise HTTPException(status_code=404, detail="Resposta não encontrada")
        if row["user_id"] != user_id and not settings.is_admin(user_id):
            raise HTTPException(status_code=403, detail="Sem permissão para apagar esta resposta")
        await conn.execute("DELETE FROM forum_posts WHERE id = $1::uuid", post_id)
    logger.info("Post deletado id=%s por user=%s admin=%s", post_id, user_id, settings.is_admin(user_id))
    return Response(status_code=204)


@router.post(
    "/topics/{topic_id}/posts",
    response_model=PostOut,
    status_code=status.HTTP_201_CREATED,
    tags=["Forum"],
)
@limiter.limit("10/minute")
async def create_post(
    request: Request,
    topic_id: str,
    payload: PostCreate,
    user_id: str = Depends(_require_auth_active),
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
    user_id: str = Depends(_require_auth_active),
):
    async with get_conn() as conn:
        async with conn.transaction():
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
                    "INSERT INTO forum_reactions (target_id, target_type, user_id, type) VALUES ($1::uuid, $2, $3::uuid, $4) ON CONFLICT DO NOTHING",
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
    user_id: str = Depends(_require_auth_active),
):
    site = _resolve_site(request)
    report_id = str(uuid.uuid4())
    async with get_conn() as conn:
        table = "forum_topics" if payload.target_type == "topic" else "forum_posts"
        target_exists = await conn.fetchval(
            f"SELECT 1 FROM {table} WHERE id = $1::uuid AND site = $2",
            payload.target_id, site,
        )
        if not target_exists:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conteúdo não encontrado")
        await conn.execute(
            """
            INSERT INTO forum_reports (id, target_id, target_type, reason, reporter_id, site)
            VALUES ($1::uuid, $2::uuid, $3, $4, $5::uuid, $6)
            """,
            report_id, payload.target_id, payload.target_type, payload.reason, user_id, site,
        )
    logger.info("Report id=%s site=%s target=%s/%s", report_id, site, payload.target_type, payload.target_id)
    return {"status": "ok", "id": report_id}


async def _build_user_profile(user_id: str, site: str) -> dict:
    try:
        uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")
    async with get_conn() as conn:
        # Tenta com as colunas novas (migration 003). Se ainda não foi rodada, faz fallback.
        try:
            user = await conn.fetchrow(
                """
                SELECT id::text, display_name, avatar_url, created_at::text,
                       COALESCE(bio, '') AS bio,
                       COALESCE(email, '') AS email,
                       birth_year,
                       COALESCE(city, '') AS city,
                       COALESCE(shows_attended, '{}'::text[]) AS shows_attended
                FROM forum_users WHERE id = $1::uuid
                """,
                user_id,
            )
        except Exception as exc:
            logger.warning("Fallback _build_user_profile sem cols novas (rode migration 003): %s", exc)
            base = await conn.fetchrow(
                "SELECT id::text, display_name, avatar_url, created_at::text FROM forum_users WHERE id = $1::uuid",
                user_id,
            )
            if not base:
                user = None
            else:
                user = dict(base)
                user.update({"bio": "", "email": "", "birth_year": None, "city": "", "shows_attended": []})
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")

        stats = await conn.fetchrow(
            """
            SELECT
              (SELECT COUNT(*) FROM forum_posts  WHERE user_id = $1::uuid AND site = $2)::int AS posts_count,
              (SELECT COUNT(*) FROM forum_topics WHERE user_id = $1::uuid AND site = $2)::int AS topics_count,
              (SELECT COUNT(*) FROM forum_reactions WHERE user_id = $1::uuid AND site = $2 AND type = 'tava_la')::int AS tava_la_count,
              (
                SELECT COUNT(*) FROM forum_reactions r WHERE r.type = 'mata' AND r.site = $2 AND (
                  (r.target_type = 'post'  AND r.target_id IN (SELECT id FROM forum_posts  WHERE user_id = $1::uuid AND site = $2))
                  OR
                  (r.target_type = 'topic' AND r.target_id IN (SELECT id FROM forum_topics WHERE user_id = $1::uuid AND site = $2))
                )
              )::int AS likes_received,
              (
                SELECT COUNT(*) + 1 FROM (
                  SELECT user_id, COUNT(*) c FROM forum_posts WHERE site = $2 GROUP BY user_id
                ) x WHERE x.c > (SELECT COUNT(*) FROM forum_posts WHERE user_id = $1::uuid AND site = $2)
              )::int AS rank_pos
            """,
            user_id, site,
        )

        recent_rows = await conn.fetch(
            """
            SELECT t.id::text, t.title, t.body, t.category, t.site,
                   t.user_id::text, u.display_name, u.avatar_url, t.pinned,
                   t.created_at::text,
                   COALESCE(t.last_post_at, t.created_at)::text AS last_post_at,
                   t.anchor_show_id,
                   (SELECT COUNT(*) FROM forum_posts p WHERE p.topic_id = t.id)::int AS reply_count
            FROM forum_topics t
            JOIN forum_users u ON u.id = t.user_id
            WHERE t.user_id = $1::uuid AND t.site = $2
            ORDER BY t.created_at DESC LIMIT 10
            """,
            user_id, site,
        )

    p, t, tl = stats["posts_count"], stats["topics_count"], stats["tava_la_count"]
    return {
        "id": user["id"],
        "user_id": user["id"],
        "display_name": user["display_name"],
        "avatar_url": user["avatar_url"],
        "created_at": user["created_at"],
        "bio": user["bio"],
        "email": user["email"],
        "birth_year": user["birth_year"],
        "city": user["city"],
        "shows_attended": list(user["shows_attended"] or []),
        # nomes legados (compat com frontend antigo)
        "topic_count": t,
        "post_count": p,
        "reactions_received": stats["likes_received"],
        # nomes novos
        "posts_count": p,
        "topics_count": t,
        "tava_la_count": tl,
        "likes_received": stats["likes_received"],
        "rank_pos": stats["rank_pos"],
        "veterano": p >= 100,
        "arquivista": t >= 8,
        "recent_topics": [TopicOut(**dict(r), reactions={}, my_reactions=[]) for r in recent_rows],
        "recent_activity": [
            {"kind": "topic", "id": r["id"], "created_at": r["created_at"], "snippet": (r["body"] or "")[:200], "target_title": r["title"], "target_id": r["id"]}
            for r in recent_rows
        ],
    }


@router.get("/users/{user_id}", tags=["Forum"])
@limiter.limit("20/minute")
async def get_user(user_id: str, request: Request):
    return await _build_user_profile(user_id, _resolve_site(request))


@router.get("/users/{user_id}/profile", tags=["Forum"])
@limiter.limit("20/minute")
async def get_user_profile(user_id: str, request: Request):
    return await _build_user_profile(user_id, _resolve_site(request))


@router.get("/users/{user_id}/badges", tags=["Forum"])
@limiter.limit("30/minute")
async def get_user_badges(user_id: str, request: Request):
    site = _resolve_site(request)
    try:
        uuid.UUID(user_id)
    except ValueError:
        return {"veterano": False, "arquivista": False, "tava_la": 0}
    async with get_conn() as conn:
        row = await conn.fetchrow(
            """
            SELECT
              (SELECT COUNT(*) FROM forum_posts  WHERE user_id = $1::uuid AND site = $2)::int AS posts_count,
              (SELECT COUNT(*) FROM forum_topics WHERE user_id = $1::uuid AND site = $2)::int AS topics_count,
              (SELECT COUNT(*) FROM forum_reactions WHERE user_id = $1::uuid AND site = $2 AND type = 'tava_la')::int AS tava_la_count
            """,
            user_id, site,
        )
    if not row:
        return {"veterano": False, "arquivista": False, "tava_la": 0}
    p, t, tl = row["posts_count"], row["topics_count"], row["tava_la_count"]
    return {
        "posts_count": p, "topics_count": t, "tava_la_count": tl,
        "veterano": p >= 100, "arquivista": t >= 8, "tava_la": tl,
    }


@router.patch("/users/me", tags=["Forum"])
@limiter.limit("10/minute")
async def update_my_profile(
    request: Request,
    payload: UserProfileUpdate,
    user_id: str = Depends(_require_auth),
):
    """Permite ao usuário logado editar bio, email, ano de nascimento, cidade e shows que esteve."""
    fields = []
    values: list = []
    idx = 1
    for col, val in [
        ("display_name", payload.display_name),
        ("bio", payload.bio),
        ("email", payload.email),
        ("birth_year", payload.birth_year),
        ("city", payload.city),
        ("shows_attended", payload.shows_attended),
    ]:
        if val is not None:
            fields.append(f"{col} = ${idx}")
            values.append(val)
            idx += 1
    if not fields:
        return {"updated": False, "reason": "nada pra atualizar"}
    values.append(user_id)
    sql = f"UPDATE forum_users SET {', '.join(fields)} WHERE id = ${idx}::uuid"
    async with get_conn() as conn:
        try:
            await conn.execute(sql, *values)
        except Exception as exc:
            logger.error("Erro ao atualizar perfil (rode migration 003?): %s", exc)
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Banco fora de sync. Rode migration 003.") from exc
    logger.info("Perfil atualizado user_id=%s fields=%s", user_id, [f.split(" = ")[0] for f in fields])
    return {"updated": True, "fields": len(fields)}
