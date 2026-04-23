# 🌱 Terra Gentil, Doutor das Plantas

App mobile que usa IA (Google Gemini) para diagnosticar doenças em plantas. Tire uma foto da sua planta e receba um diagnóstico com sugestões de tratamento.

## Estrutura do monorepo

```
backend/   - API e lógica de negócio
mobile/    - App React Native / Expo
docs/      - Documentação do projeto
```

## Stack

| Camada   | Tecnologia              |
|----------|-------------------------|
| Backend  | Python 3.12 + FastAPI   |
| Mobile   | React Native + Expo     |
| Banco    | Supabase                |
| Storage  | Cloudflare R2           |
| Deploy   | Railway                 |
| IA       | Gemini 2.5              |

## Status

Sprint 1: concluída.

- Ambiente Windows configurado
- Repositório GitHub com estrutura de monorepo
- Backend FastAPI deployado no Railway
- API de produção: https://terra-gentil-app-production.up.railway.app
- Swagger UI: https://terra-gentil-app-production.up.railway.app/docs

Próximo sprint: Sprint 2, integração com Gemini 2.5 (endpoint de diagnóstico de plantas).
