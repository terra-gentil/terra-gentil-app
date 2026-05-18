import logging
from urllib.parse import quote

from authlib.integrations.starlette_client import OAuth
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
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


@router.get("/google/callback", name="google_callback", tags=["Auth"])
async def google_callback(request: Request):
    token = await oauth.google.authorize_access_token(request)
    profile = token.get("userinfo") or await oauth.google.userinfo(token=token)
    user_id = await upsert_user(dict(profile))
    jwt_token = create_jwt(user_id)
    display_name = quote(str(profile.get("name", "")))
    avatar_url = quote(str(profile.get("picture", "")))
    redirect_url = (
        f"{settings.FORUM_CORS_ORIGIN}/auth-callback.html"
        f"?token={jwt_token}&name={display_name}&avatar={avatar_url}"
    )
    logger.info("OAuth callback OK, redirecionando user_id=%s", user_id)
    return RedirectResponse(url=redirect_url)


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
