import logging
from urllib.parse import quote, unquote

import httpx
from authlib.integrations.starlette_client import OAuth
from fastapi import APIRouter, Body, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt as jose_jwt
from starlette.config import Config

from app.core.config import settings
from app.services.auth_service import create_jwt, upsert_user, verify_jwt
from app.services.db import get_conn

logger = logging.getLogger(__name__)
router = APIRouter()

_starlette_config = Config(
    environ={
        "GOOGLE_CLIENT_ID": settings.GOOGLE_CLIENT_ID,
        "GOOGLE_CLIENT_SECRET": settings.GOOGLE_CLIENT_SECRET,
    }
)
oauth = OAuth(_starlette_config)
oauth.register(
    name="google",
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)


@router.get("/google/login", tags=["Auth"])
async def google_login(request: Request):
    redirect_uri = f"{settings.BACKEND_URL}/auth/google/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/login/mobile", tags=["Auth"])
async def google_login_mobile(request: Request, redirect_uri: str = "terragentil://auth"):
    request.session["is_mobile"] = True
    request.session["mobile_redirect_uri"] = redirect_uri
    callback_uri = f"{settings.BACKEND_URL}/auth/google/callback"
    return await oauth.google.authorize_redirect(request, callback_uri)


@router.get("/google/callback", name="google_callback", tags=["Auth"])
async def google_callback(request: Request):
    token = await oauth.google.authorize_access_token(request)
    profile = token.get("userinfo") or await oauth.google.userinfo(token=token)
    user_id = await upsert_user(dict(profile))
    jwt_token = create_jwt(user_id)
    display_name = quote(str(profile.get("name", "")))
    avatar_url = quote(str(profile.get("picture", "")))
    is_mobile = request.session.pop("is_mobile", False)
    mobile_redirect_uri = request.session.pop("mobile_redirect_uri", "terragentil://auth")
    logger.info("OAuth callback OK, is_mobile=%s, user_id=%s", is_mobile, user_id)
    if is_mobile:
        sep = "&" if "?" in mobile_redirect_uri else "?"
        redirect_url = (
            f"{mobile_redirect_uri}{sep}token={jwt_token}"
            f"&user_id={user_id}&name={display_name}&avatar={avatar_url}"
        )
    else:
        redirect_url = (
            f"{settings.FORUM_CORS_ORIGIN}/auth-callback.html"
            f"?token={jwt_token}&name={display_name}&avatar={avatar_url}"
        )
    return RedirectResponse(url=redirect_url)


@router.post("/apple/mobile", tags=["Auth"])
async def apple_login_mobile(
    identity_token: str = Body(...),
    full_name: str | None = Body(default=None),
):
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get("https://appleid.apple.com/auth/keys", timeout=10)
            r.raise_for_status()
            jwks = r.json()

        header = jose_jwt.get_unverified_header(identity_token)
        kid = header.get("kid", "")
        matching = [k for k in jwks.get("keys", []) if k.get("kid") == kid]
        if not matching:
            raise HTTPException(status_code=400, detail="Chave Apple nao encontrada")

        claims = jose_jwt.decode(
            identity_token,
            matching[0],
            algorithms=["RS256"],
            audience="br.com.terragentil.app",
            issuer="https://appleid.apple.com",
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("Apple token invalido: %s", exc)
        raise HTTPException(status_code=400, detail="Token Apple invalido") from exc

    apple_sub = claims.get("sub", "")
    email = claims.get("email")

    import uuid as _uuid
    user_id = str(_uuid.uuid5(_uuid.NAMESPACE_URL, f"apple:{apple_sub}"))
    display_name = full_name or email or "Usuário"

    async with get_conn() as conn:
        await conn.execute(
            """
            INSERT INTO forum_users (id, display_name, avatar_url, provider)
            VALUES ($1::uuid, $2, $3, 'apple')
            ON CONFLICT (id) DO UPDATE
              SET display_name = CASE WHEN forum_users.display_name = 'Usuário'
                                      THEN EXCLUDED.display_name
                                      ELSE forum_users.display_name END,
                  avatar_url = COALESCE(forum_users.avatar_url, EXCLUDED.avatar_url)
            """,
            user_id, display_name, None,
        )

    jwt_token = create_jwt(user_id)
    logger.info("Apple login OK, user_id=%s", user_id)
    return JSONResponse({
        "token": jwt_token,
        "user_id": user_id,
        "display_name": display_name,
        "avatar_url": None,
    })


_bearer = HTTPBearer(auto_error=False)


@router.get("/me", tags=["Auth"])
async def me(credentials: HTTPAuthorizationCredentials = Depends(_bearer)):
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token ausente")
    payload = verify_jwt(credentials.credentials)
    user_id = payload["user_id"]
    async with get_conn() as conn:
        row = await conn.fetchrow(
            "SELECT id, display_name, avatar_url FROM forum_users WHERE id = $1::uuid",
            user_id,
        )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")
    return {"id": str(row["id"]), "display_name": row["display_name"], "avatar_url": row["avatar_url"]}


@router.patch("/me", tags=["Auth"])
async def update_me(
    display_name: str = Body(..., min_length=2, max_length=60),
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
):
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token ausente")
    payload = verify_jwt(credentials.credentials)
    user_id = payload["user_id"]
    async with get_conn() as conn:
        await conn.execute(
            "UPDATE forum_users SET display_name = $1 WHERE id = $2::uuid",
            display_name, user_id,
        )
    logger.info("display_name atualizado user_id=%s -> %s", user_id, display_name)
    return {"display_name": display_name}
