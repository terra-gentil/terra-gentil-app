from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routes import health

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="API do Doutor das Plantas, diagnóstico de plantas com IA",
)

# CORS liberado pra dev. Em produção, restringir aos domínios do app.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["Health"])


@app.get("/", tags=["Root"])
async def root() -> dict[str, str]:
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
    }
