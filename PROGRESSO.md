# PROGRESSO - Terra Gentil

## Atualizado: 2026-05-27

---

## O que foi feito hoje

### Build de producao, moderacao admin, seguranca e Play Store

**Mobile:**
- `PostCard`: badge coroa ADMIN para posts de admins, icone flag para denunciar
- `CommunityScreen`: handleReport com 3 categorias, chama API real de reports
- `ProfileScreen`: badge ADMIN dourado para usuarios is_admin
- `ConfiguracoesModal`: painel admin abre por padrao entre Conta e Notificacoes, reports carregam automaticamente (max 3) ao abrir
- `api/admin.ts`: buscarReports, resolverReport, buscarUsuarios, bloquear/desbloquear
- `WelcomeScreen`: barra de progresso 10s, botao Google com pulso no centro
- EAS Update configurado: expo-updates instalado, app.json com OTA, eas.json com canal production

**Backend:**
- `_exigir_admin`: dupla verificacao is_admin DB + ADMIN_USER_IDS whitelist (env)
- `main.py`: remove fallback dev-session-secret, CORS localhost so em dev
- `forum.py`: whitelist explicita topic/post para nome de tabela (previne SQL injection)
- `notifications.py`: corrige Body Pydantic para resolver_report, 6 endpoints admin novos
- Migration 004: coluna status em forum_reports, coluna bloqueado em forum_users

**Play Store:**
- Build de producao gerado (versionCode 2, canal production, com OTA)
- App submetido e aprovado para Teste fechado Alpha
- 177 paises habilitados, Google Group testers-community@googlegroups.com adicionado
- Testers Community contratado (25 testadores, 16 dias)
- Contador: Day 0/16 em andamento

**Supabase:**
- Migration 004 rodada com sucesso
- Andre Zimermann (2 contas) setados como is_admin=true
- Terra Gentil bloqueado como teste de moderacao

**Railway:**
- ADMIN_USER_IDS configurado com os 2 UUIDs do Andre
- ENVIRONMENT=production ativo

---

## Estado atual

App em Teste fechado Alpha no Google Play. 25 testadores do Testers Community sendo convocados. Contador de 14 dias inicia quando aceitarem.

Backend em producao com seguranca hardening completo. OTA update configurado.

---

## Proximo passo EXATO

### Quando o Testers Community concluir os 14 dias:
1. Play Console > Producao > Solicitar acesso de producao
2. Responder as perguntas sobre o teste fechado
3. Aguardar aprovacao do Google (1-3 dias)
4. Publicar para todos

### Para atualizacoes de codigo (sem novo build):
```bash
cd mobile
eas update --branch production --message "descricao da mudanca"
```

### Chave de servico Google Play (para submit automatico futuro):
- play.google.com/console > Setup > API access
- Criar conta de servico, baixar JSON, configurar no EAS

---

## Commits desta sessao
```
e615d58 security: hardening — whitelist admin, sem fallback JWT, CORS so dev, fix SQL
cf3eb14 admin: painel abre por padrao e aparece entre Conta e Notificacoes
9d30d30 ota: configura EAS Update + expo-updates + auto-load 3 reports ao abrir admin
f3b7c58 build: bump versionCode para 2 (novo build com expo-updates nativo)
76fd882 admin: corrige resolver_report — Body com Pydantic model para aceitar JSON object
5888a69 forum: badge admin, botao report nos posts e wiring CommunityScreen
```

---

## Arquivos-chave envolvidos
- `mobile/src/components/redesign/ConfiguracoesModal.tsx`
- `mobile/src/components/redesign/CommunityScreen.tsx`
- `mobile/src/components/redesign/PostCard.tsx`
- `mobile/src/components/redesign/ProfileScreen.tsx`
- `mobile/src/api/admin.ts`
- `mobile/app.json`
- `mobile/eas.json`
- `backend/app/main.py`
- `backend/app/routes/forum.py`
- `backend/app/routes/notifications.py`
- `backend/migrations/004_admin_moderation.sql`
