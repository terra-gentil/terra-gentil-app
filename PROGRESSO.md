# PROGRESSO - Terra Gentil

## Atualizado: 2026-06-21

---

## Marco 2026-06-21: App ENVIADO para producao no Google Play

- Acesso de producao CONCEDIDO pelo Google (e-mail recebido 21/06)
- Versao de producao criada: bundle 2 (1.0.0), minSdk 24, target 36, tamanho 22.5 MB
- Notas de versao em pt-BR preenchidas
- Lancamento completo (100% dos usuarios), 177 paises (resto do mundo)
- Mapeamento Data Safety levantado no codigo (ver secao Data Safety abaixo)
- **Enviado para revisao em 21/06**, status "Alteracoes em analise" (verificacoes rapidas + revisao Google)
- **PUBLICADO em 21/06**: app no ar na Google Play, 100% rollout, revisao passou na hora
- Link publico: https://play.google.com/store/apps/details?id=br.com.terragentil.app
- Primeiros numeros: 7 instalacoes, MAU 22 (migrados do teste)
- hub-hz atualizado: status 'producao' + url da Play Store

### Data Safety declarado
- Coleta: Nome (obrig), E-mail (opcional, perfil/ebook), User ID (obrig), Fotos (opcional), Conteudo do usuario (forum/feed, opcional), Token push Expo (opcional)
- Compartilhado com terceiro: Foto da planta enviada ao Google Gemini (diagnostico). E-mail do ebook vai ao FormSubmit.co
- NAO coleta: localizacao, dados financeiros, analytics, crash reporting, senha (login so Google/Apple OAuth)
- Supabase/Railway/Expo = processadores de infra (nao contam como compartilhamento)

### Aprendizado do processo
- Cuidado: o fluxo "Criar nova versao" abre por padrao em faixas erradas (Teste aberto). SEMPRE conferir o titulo "Criar versao de producao" antes de salvar
- Configurar paises sozinho NAO publica o app, precisa criar a VERSAO com o bundle

---

## Atualizado: 2026-06-20

---

## Marco 2026-06-20: Solicitacao de acesso de producao ENVIADA

- Teste fechado concluido: Testers Community marcou 16/16 dias, 2/2 reports prontos
- Google Play Console reconheceu os requisitos (12 testadores + 14 dias), botao "Solicitar acesso de producao" ficou ativo
- Questionario de producao respondido (3 etapas: teste fechado, sobre o app, prontidao para producao)
  - Recrutamento: provedor de testes pago (Testers Community)
  - Publico-alvo: cultivadores/jardinagem no Brasil, faixa 0-10.000 instalacoes/ano
  - Mudancas no teste: hardening backend, painel moderacao, OTA, ajuste navegacao
- **Solicitacao enviada hoje 13:41**, em analise humana do Google (ate 7 dias, normalmente 1-3)
- Aguardando e-mail do Google na conta do proprietario

### Proximo passo quando aprovar
1. Conferir checklist que trava publicacao: Seguranca de dados, Classificacao IARC, ficha da loja, politica de privacidade, publico-alvo
2. Criar release de Producao reaproveitando o mesmo AAB do teste fechado (nao rebuildar)
3. Publicar com rollout gradual (20% > 50% > 100%)

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
