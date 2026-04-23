# syntax=docker/dockerfile:1.7

# Stage 1: builder
FROM python:3.12-slim AS builder

WORKDIR /app

# Evita .pyc e força stdout sem buffer (melhor pra logs)
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Instala build tools só no builder
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt


# Stage 2: runtime
FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH=/root/.local/bin:$PATH

# Copia só os pacotes Python do builder, sem build tools
COPY --from=builder /root/.local /root/.local

# Copia o código
COPY ./app ./app

# Railway injeta a porta via env var PORT
EXPOSE 8000

# Startup
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
