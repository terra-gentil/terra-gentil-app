"""
Rota temporária pra testar conectividade com Gemini.

Este endpoint será REMOVIDO antes do deploy final da Sprint 2.
"""
from fastapi import APIRouter, HTTPException

from app.services.gemini_service import GeminiService

router = APIRouter()


@router.get("/v1/gemini/test", tags=["Gemini"])
async def gemini_test() -> dict[str, str]:
    try:
        service = GeminiService()
        message = service.hello()
        return {"status": "ok", "response": message}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
