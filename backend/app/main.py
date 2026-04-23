from fastapi import FastAPI
from app.routes import health

app = FastAPI(
    title="Terra Gentil API",
    description="API do Doutor das Plantas",
    version="0.1.0",
)

app.include_router(health.router)
