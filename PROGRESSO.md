# PROGRESSO - Terra Gentil

## Atualizado: 2026-05-26

---

## O que foi feito hoje

### Comunidade: integração com backend do forum

**Mobile (tudo pronto, TypeScript limpo):**
- `mobile/src/api/forum.ts` — cliente tipado da API (listarTopics, buscarTopicComPosts, criarTopic, criarResposta, toggleReacao). Envia `X-Site: terra-gentil` em todos os requests.
- `mobile/src/storage/auth.ts` — armazenamento do JWT no AsyncStorage (getToken, setAuth, getUser, clearAuth).
- `mobile/src/data/comunidade.ts` — adicionado `isApiTopic` ao PostBase, novo mapper `topicToPost(topic, currentUserId)`.
- `mobile/src/components/redesign/CommunityScreen.tsx` — substituído ScrollView por FlatList com paginação (20 topics/página), carrega topics reais da API, fallback para POSTS_MOCK se offline/erro.
- `mobile/src/components/redesign/ComentariosModal.tsx` — detecta `isApiTopic`, carrega replies reais via `buscarTopicComPosts`, envia comentários via API (requer token) ou local (posts locais).
- `mobile/src/components/redesign/NovaPostagemModal.tsx` — posta na API se tiver JWT, salva local se não tiver (com prompt de login).

**Backend (código pronto, aguarda deploy):**
- `backend/app/routes/forum.py` — `_resolve_site()` agora aceita header `X-Site` como fallback para apps mobile que não enviam `Origin`. Sites válidos: `terra-gentil` e `pj` (hardcoded + valores do site_origin_map).

---

## Estado atual

**App mobile:** funcionando com fallback nos 3 posts mock. Assim que o backend for deployado, vai carregar os topics reais automaticamente.

**Bloqueador:** Railway não faz auto-deploy deste repo. O código do backend está no GitHub mas precisa de deploy manual.

---

## Próximo passo EXATO

### 1. Fazer deploy do backend no Railway (URGENTE)
```bash
railway login        # se não estiver logado
railway up           # na pasta backend/, ou especificar --service
```
Ou: entrar em railway.app, abrir o projeto, clicar em "Deploy" / "Redeploy".

### 2. Testar a API com o novo header
```bash
curl "https://terra-gentil-app-production.up.railway.app/forum/topics?per_page=3" \
  -H "X-Site: terra-gentil"
# Deve retornar HTTP 200 com lista de topics
```

### 3. Abrir o app no celular e verificar
- Aba Comunidade deve mostrar topics reais do forum
- Tap em qualquer post abre o ComentariosModal com replies reais
- Botão "Nova postagem" deve mostrar prompt de login (sem JWT ainda)

### 4. Implementar login com Google (próxima sessão)
Para o usuário poder criar posts e comentar na API, precisa de JWT. Fluxo:
- `expo-web-browser` abre `https://terra-gentil-app-production.up.railway.app/auth/google/login`
- Backend redireciona com `?token=JWT&name=...&avatar=...`
- App captura via deep link e chama `setAuth(token, user)`
- A partir daí todas as ações (post, comentar, reagir) funcionam autenticadas

---

## Commits desta sessão
```
13180c2 backend: force redeploy Railway
7940f31 comunidade: usa ref para evitar double-load no carregarTopics
6941d15 comunidade: conecta ao backend do forum via API real
```

---

## Arquivos-chave envolvidos
- `mobile/src/api/forum.ts`
- `mobile/src/storage/auth.ts`
- `mobile/src/data/comunidade.ts`
- `mobile/src/components/redesign/CommunityScreen.tsx`
- `mobile/src/components/redesign/ComentariosModal.tsx`
- `mobile/src/components/redesign/NovaPostagemModal.tsx`
- `backend/app/routes/forum.py` (aguarda deploy)
