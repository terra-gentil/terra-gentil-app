"""
Aplicação FastAPI, Terra Gentil API.

Ponto de entrada do backend. Registra middlewares e rotas.
"""
import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.core.config import settings
from app.core.limiter import limiter
from app.routes import diagnostico, health
from app.routes import auth, feed, forum, notifications

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="API do Doutor das Plantas e Comunidade",
)
app.state.limiter = limiter

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.site_origin_map.keys()) + [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://localhost:5500",
        "http://localhost:8080",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.add_middleware(SessionMiddleware, secret_key=settings.JWT_SECRET or "dev-session-secret")
app.add_middleware(SlowAPIMiddleware)

_ALLOWED_ORIGINS = set(list(settings.site_origin_map.keys()) + [
    "http://localhost:3000", "http://localhost:8000",
    "http://localhost:5500", "http://localhost:8080",
])

def _cors_headers_for(request: Request) -> dict[str, str]:
    """CORS headers pra anexar em respostas de erro (FastAPI não anexa por padrão)."""
    origin = request.headers.get("origin", "")
    headers = {"Access-Control-Allow-Credentials": "true"}
    if origin in _ALLOWED_ORIGINS:
        headers["Access-Control-Allow-Origin"] = origin
    return headers


async def _rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    return JSONResponse(
        status_code=429,
        content={"detail": "Muitas tentativas seguidas. Aguarde um momento antes de tentar novamente."},
        headers=_cors_headers_for(request),
    )


async def _unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Garante que erros 500 saiam com CORS. Sem isso, o browser bloqueia a leitura
    da response e o frontend recebe 'CORS' em vez do erro real."""
    logging.getLogger(__name__).exception("Unhandled exception em %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Erro interno: {type(exc).__name__}"},
        headers=_cors_headers_for(request),
    )


app.add_exception_handler(RateLimitExceeded, _rate_limit_handler)
app.add_exception_handler(Exception, _unhandled_exception_handler)

app.include_router(health.router, tags=["Health"])
app.include_router(diagnostico.router)
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(forum.router, prefix="/forum", tags=["Forum"])
app.include_router(feed.router, prefix="/feed", tags=["Feed"])
app.include_router(notifications.router, tags=["Notifications"])


@app.get("/", tags=["Root"])
async def root() -> dict[str, str]:
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
    }
