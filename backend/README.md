# Terra Gentil, Backend

API FastAPI que orquestra o Doutor das Plantas.

## Requisitos

- Python 3.12
- pip

## Setup local (Windows, PowerShell)

    cd backend
    py -3.12 -m venv .venv
    .\.venv\Scripts\Activate.ps1
    pip install -r requirements.txt
    Copy-Item .env.example .env
    uvicorn app.main:app --reload --port 8001

## Endpoints

- GET / metadados da API
- GET /health health check
- GET /docs Swagger UI
- GET /redoc ReDoc

## Estrutura

    app/
      core/       Configuração e utilidades
      routes/     Endpoints HTTP
      schemas/    Pydantic models (request e response)

## Teste manual

Com o servidor rodando, em outro PowerShell:

    Invoke-WebRequest -UseBasicParsing http://localhost:8001/health | Select-Object -ExpandProperty Content

Resposta esperada:

    {"status":"ok","version":"0.1.0","environment":"development"}
