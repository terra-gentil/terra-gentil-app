# HANDOFF COMPLETO: TERRA GENTIL (Doutor das Plantas)

## SOBRE ESTE DOCUMENTO
Este documento contem TUDO que uma IA precisa saber pra trabalhar no projeto Terra Gentil.
Atualizado em 8 maio 2026, pos CommunityScreen e jogo Resgate dos Jardins.
Leia inteiro antes de tocar em qualquer arquivo.

---

## 1. QUEM E O ANDRE (preferencias do usuario)

Andre nao programa direto. Ele usa Claude Code no terminal Windows pra tudo.
Quando ele pede algo, espera receber prompts prontos pra colar no Claude Code.

**Regras absolutas:**
. Sem travessao em NADA (nem markdown, nem codigo, nem commit messages). Usa "." ou nenhum marcador
. PT-BR sempre, inclusive em commits, comentarios e variaveis
. Publico alvo: 40 a 70 anos. Fonte grande, linguagem simples
. Persona do app: "Doutor Gentileza", botanico acolhedor
. Commits: pode commitar direto quando pedido, NAO precisa pedir confirmacao
. Commits sempre com: Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
. Formato de commit: feat(mobile): descricao curta / feat(backend): descricao curta
. Sempre mostrar output de git log --oneline apos commit
. Sempre fazer git push origin main apos commit (a menos que diga o contrario)
. Quando Andre diz "p" ou mensagens curtas truncadas, pedir pra elaborar
. Downloads vao pra C:\Users\engan\Downloads\
. Tem liberdade total pra alterar pastas e arquivos sem pedir autorizacao
. SEMPRE comparar com o figma (zip de design reference) antes de implementar telas novas. Andre exige fidelidade ao figma

---

## 2. O PROJETO

**Nome:** Terra Gentil, Doutor das Plantas
**Repo:** https://github.com/terra-gentil/terra-gentil-app
**Pasta local:** C:\Gitlab_hz\app-terragentil

### Stack
. **Backend:** FastAPI + Python 3.12, deploy Railway Hobby
. **Mobile:** React Native Expo SDK 54, React Navigation 7.x (bottom tabs + native stack)
. **IA:** Google Gemini 2.5 Flash com retry automatico
. **Storage local:** AsyncStorage (historico + preferencias)
. **Testes:** pytest 8.3.3 + httpx 0.27.2 (49 testes, todos passando)
. **Design system:** "Pixel Garden" (joyful, bold, mascote-first)

### URLs
. Backend producao: https://terra-gentil-app-production.up.railway.app
. Swagger: https://terra-gentil-app-production.up.railway.app/docs
. Politica de privacidade: https://terra-gentil.github.io/terra-gentil-app/privacy-policy.html
. Canal YouTube (ID: UCX3xUnHpQrhSUJUGjqMAN2A): https://www.youtube.com/@TerraGentil
. Site: https://terragentil.com.br

### Comandos uteis
```
# Subir mobile
cd C:\Gitlab_hz\app-terragentil\mobile ; npx expo start --clear

# Subir backend local
cd C:\Gitlab_hz\app-terragentil\backend ; .\.venv\Scripts\Activate ; uvicorn app.main:app --reload --port 8001

# Teste backend
curl.exe -X POST -F "file=@teste-planta.png" https://terra-gentil-app-production.up.railway.app/v1/diagnostico

# Rodar testes
cd C:\Gitlab_hz\app-terragentil\backend ; .\.venv\Scripts\Activate ; python -m pytest tests/ -v

# Build Android
cd C:\Gitlab_hz\app-terragentil\mobile ; eas build --platform android --profile production --non-interactive

# Screenshot celular
adb exec-out screencap -p > C:\Users\engan\Downloads\screenshot.png

# Type check mobile
cd C:\Gitlab_hz\app-terragentil\mobile ; npx tsc --noEmit
```

---

## 3. ARQUITETURA DO BACKEND (intacto, nao modificar)

```
backend/
  .env                    (GEMINI_API_KEY real, NAO commitado)
  .env.example            (template vazio, commitado)
  requirements.txt
  app/
    __init__.py
    main.py               (FastAPI app, CORS, rotas)
    core/
      config.py           (Settings via pydantic-settings, le .env)
    routes/
      health.py           (GET /health)
      diagnostico.py      (POST /v1/diagnostico)
    schemas/
      health.py           (HealthResponse)
      diagnostico.py      (DiagnosticoResponse com 21 campos, enums, models aninhados)
    services/
      gemini_service.py   (GeminiService com retry, JSON schema, validacao)
    prompts/
      diagnostico_v1.py   (prompt v3 persona Doutor Gentileza)
  tests/
    conftest.py           (fixtures: client, imagens, respostas mock)
    test_schemas.py       (20 testes)
    test_routes.py        (18 testes)
    test_gemini_service.py (11 testes)
```

### Fluxo do diagnostico
1. Mobile envia foto JPEG/PNG/WebP via multipart POST /v1/diagnostico
2. Rota valida: content type, tamanho (max 10MB), nao vazio
3. GeminiService abre com PIL, valida, envia pro Gemini com prompt + JSON schema
4. Gemini retorna JSON estruturado com 21 campos
5. Se JSON truncado ou invalido: retry automatico (ate 2 tentativas)
6. Resposta validada pelo Pydantic DiagnosticoResponse
7. Retorna ao mobile

### DiagnosticoResponse (21 campos)
```
eh_planta: bool
especie_identificada: str
nome_popular: str
confianca: float (0.0 a 1.0)
estado_saude: "saudavel" | "atencao" | "doente" | "critico" | "nao_aplicavel"
toxica_para_pets: bool
toxicidade_detalhes: str
nivel_luz: "sol_pleno" | "meia_sombra" | "indireta_brilhante" | "sombra" | "nao_aplicavel"
rega_dias: int (0 a 60)
rega_condicao: str
temperatura_ideal: str
nivel_dificuldade: "facil" | "medio" | "dificil" | "nao_aplicavel"
luz_porcentagem: int (0 a 100)
luz_veredito: str
diagnostico_titulo: str
diagnostico_explicacao: str
problemas_detectados: list[{descricao, gravidade, causa_provavel}]
plano_tratamento: str
plano_timeline: list[{etapa, acao}]
precisa_retorno: bool
mensagem_retorno: str
```

---

## 4. ARQUITETURA DO MOBILE (atualizada pos Pixel Garden Fase 2 parcial)

```
mobile/
  App.tsx                          (SafeAreaProvider global, React Navigation, bottom tabs com FAB, font loading, fluxo condicional)
  app.json                         (Expo config, package br.com.terragentil.app)
  eas.json                         (perfis preview APK e production AAB)
  package.json                     (Expo 54, RN 0.81.5, React Navigation 7.x, Lucide, Google Fonts, expo-linear-gradient)
  assets/
    icon.png                       (1024x1024, crop do mascote pose-1)
    adaptive-icon.png              (1024x1024, mesmo)
    splash-icon.png                (1284x2778, mascote centralizado fundo verde)
    favicon.png                    (48x48)
    feature-graphic.png            (1024x500, pra Play Store, NAO commitado ainda)
    mascot/
      pose-1.jpg a pose-8.jpg      (8 poses do Doutor Gentileza, 1365x768)
      analyzing.jpg                (mascote analisando, 1365x768)
      gift.jpg                     (mascote com presente, 768x1365, vertical)
  src/
    api/
      diagnostico.ts               (fetch com timeout 60s, AbortController, logs debug)
    assets/
      mascot.ts                    (MASCOT_POSES[], MASCOT_ANALYZING, MASCOT_GIFT, getRandomMascotPose)
    components/
      EbookCard.tsx                (card dourado pos diagnostico, form nome/email/mensagem via formsubmit.co)
      ErrorScreen.tsx              (redesenhada Pixel Garden, tratamento por ErrorCode com icones Lucide)
      HistoricoList.tsx            (LEGADO, nao usado, pode deletar)
      LoadingScreen.tsx            (mascote analyzing + laser verde + cross-promo YouTube)
      LuxMeter.tsx                 (barra escura com ponteiro triangular)
      PermissionScreen.tsx         (criado mas NAO integrado no App.tsx)
      ResultCard.tsx               (LEGADO, nao usado, pode deletar)
      ScannerArea.tsx              (LEGADO, nao usado, pode deletar)
      SettingsScreen.tsx           (LEGADO, funcionalidade migrada pra ProfileScreen)
      StatsGrid.tsx                (LEGADO, nao usado, pode deletar)
      Timeline.tsx                 (linha do tempo vertical com dots verdes)
      TutorialScreen.tsx           (redesenhada Pixel Garden, 4 slides swipe, safe area corrigida)
      WelcomeScreen.tsx            (redesenhada Pixel Garden, safe area com View wrapper)
      redesign/
        TopBar.tsx                 (avatar + search bar + bell com badge, useSafeAreaInsets topo)
        HomeScreen.tsx             (greeting, streak, scanner card, atalhos 2x2 NAVEGANDO pras tabs, diagnosticos recentes)
        DiagnosisScreen.tsx        (hero image + stats grid + alerta + toxicidade + timeline + ebook + botoes)
        VideosScreen.tsx           (15 videos reais YouTube com thumbnails, 3 categorias, filtros, botao Inscreva-se, links individuais)
        ProfileScreen.tsx          (cover gradient, avatar+anel verde, stats, gamificacao/nivel, streak card amber 3D, conquistas, meu jardim grid 3col, configs, links YouTube/site)
        CommunityScreen.tsx        (feed Pixel Garden, 5 pills, 3 posts gradient hero, FAB Nova postagem, Doutor Gentileza fixado oficial)
        GameScreen.tsx             (WebView fullscreen do jogo Resgate dos Jardins, integrado via flag showGame no App.tsx)
        Pills.tsx                  (filtros horizontais com sombra chunky)
        SectionTitle.tsx           (titulo secao + acao direita)
        ChunkyButton.tsx           (botao com sombra 3D, variante outline)
        FloatCTA.tsx               (botao flutuante centralizado, icon aceita ReactNode pra Lucide)
        PlantCard.tsx              (card de planta 150px para scroll horizontal)
        PostCard.tsx               (card de post com gradient hero, like/save locais, comment preview)
        StatCard.tsx               (card de stat com icone/label/valor)
        StreakStrip.tsx             (faixa de streak com badge)
    config/
      api.ts                       (API_BASE_URL Railway, API_TIMEOUT_MS 60000)
    constants/
      branding.ts                  (BRANDING: textos da marca)
      theme.ts                     (DESIGN SYSTEM CENTRALIZADO: cores, fontes, tamanhos, radii, sombras)
    errors/
      AppError.ts                  (ErrorCode enum + AppError class)
      errorHandler.ts              (toAppError converte fetch/timeout/HTTP em AppError)
      errorMessages.ts             (mensagens amigaveis PT-BR por ErrorCode)
    storage/
      historico.ts                 (salvarConsulta, listarConsultas, limparHistorico. Buffer 20, mostra 5)
      preferencias.ts              (welcome + tutorial flags: jaVisto, marcar, resetar)
```

### Design System "Pixel Garden" (theme.ts)

**Cores (21 tokens):**
```
Verdes (primario): green #16a34a, greenDeep #15803d, greenDark #14532d, greenSoft #dcfce7, greenLeaf #22c55e
Coral (CTA + social): coral #fb6f92, coralDeep #e63b6e, coralSoft #ffe1ec
Apoio: amber #f59e0b, amberSoft #fef3c7, sky #38bdf8, skySoft #e0f2fe, lavender #a78bfa, lavenderSoft #ede9fe
Neutros: bg #f6f1e7 (bege creme), card #ffffff, ink #1c1917, inkSoft #57534e, inkMute #a8a29e, divider #efeae0
```

**Fontes:**
. Display (titulos): Nunito 700/800/900
. Body (textos): Plus Jakarta Sans 400/500/600/700/800

**Sombras (assinatura Pixel Garden):**
. shadowChunky: offset y=6, opacity 1, radius 0 (3D duro, estilo Duolingo)
. shadowSoft: offset y=8, opacity 0.08, radius 24 (suave para cards)
. IMPORTANTE: no Android shadowColor colorido nao funciona. Usar borderBottomWidth + borderBottomColor como fallback pra efeito 3D visivel no Android

### Navegacao (React Navigation 7.x)

```
SafeAreaProvider (envolve todo o App)
  Boot > Welcome > Tutorial > Game (renderizacao condicional por state)
  NavigationContainer
    BottomTabNavigator (custom TabBar com FAB central)
      HomeTab > HomeScreen (atalhos navegam pras tabs)
      CommunityTab > CommunityScreen (feed com 3 posts, 5 filtros, FAB)
      (FAB central: camera, dispara fluxo de diagnostico)
      VideosTab > VideosScreen (15 videos reais YouTube)
      ProfileTab > ProfileScreen (gamificacao, configs, links)
```

Custom TabBar: 4 tabs visiveis (Inicio, Comunidade, Videos, Eu) + FAB central 64x64 com icone camera. useSafeAreaInsets pra paddingBottom dinamico. Icones Lucide (Home, Users, Tv, User, Camera).

### Fluxo do usuario
1. Primeira abertura: Welcome (Pixel Garden) > Tutorial (4 slides swipe) > Home
2. Aberturas seguintes: direto pra Home
3. Na Home: toca no FAB camera ou botao "Tirar foto" no scanner card > abre camera > tira foto
4. Ou toca "Galeria" > abre galeria
5. Atalhos rapidos: Comunidade (tab), Videos (tab), Ebooks (em breve), Promocoes (em breve)
6. LoadingScreen aparece com laser verde + promo YouTube
7. Resultado chega: DiagnosisScreen com hero image, stats, timeline, toxicidade, ebook
8. Se nao for planta: tela "Hmm..." com mensagem
9. Se for planta: salva no historico automaticamente
10. Historico aparece na Home como scroll horizontal de PlantCards (ultimas 5)
11. Aba Videos: 15 videos reais com thumbnails, filtros (Todos/Transformacoes/Shorts/Lives), botao Inscreva-se
12. Aba Eu (Profile): cover, avatar, stats, nivel/gamificacao, streak, conquistas, meu jardim, configs, links
13. Aba Comunidade: feed com filtros (Populares/Meus posts/Seguindo/Pragas/Suculentas), 3 posts mock com gradient hero, comment preview, FAB "Nova postagem". Acoes (like, comment, share, bookmark, seguir) atualmente abrem Alert "em breve"
14. Profile > Editar perfil: reseta tutorial. Profile > settings: reseta welcome+tutorial pra fluxo completo
15. HomeScreen tem atalho "Jogar" que dispara onJogar > setShowGame(true) > GameScreen WebView fullscreen do jogo Resgate dos Jardins

---

## 5. BUGS CONHECIDOS E DEBITOS TECNICOS

1. **Icones sao provisorios**: icon.png e adaptive-icon.png sao crop da pose-1 do mascote. Precisam de arte dedicada antes do lancamento real
2. **Long press dev no titulo**: precisa ser removido ou escondido antes do lancamento na Play Store. Hoje reseta o welcome via Alert
3. **Versao hardcoded**: APP_VERSION "1.0.0" esta hardcoded em ProfileScreen.tsx e SettingsScreen.tsx. Deveria puxar do package.json ou app.json
4. **Imagens do tutorial sao placeholder**: TutorialScreen usa MASCOT_POSES[0..3] como imagens dos 4 slides. Precisam de fotos reais de plantas/dicas
5. **feature-graphic.png nao commitado**: gerado pra Play Store mas ficou untracked
6. **Console.log de debug no diagnostico.ts**: tem varios console.log("[api]...") que foram uteis pra debug mas devem ser removidos ou condicionados antes de producao
7. **PermissionScreen.tsx existe mas nao esta integrado**: o componente foi criado mas o App.tsx ainda usa Alert.alert simples pra permissoes negadas
8. **EbookCard usa formsubmit.co**: servico gratuito com limites. Se escalar, precisa de backend proprio
9. **Componentes legados nao removidos**: HistoricoList, ScannerArea, ResultCard, StatsGrid, SettingsScreen ainda existem nos arquivos mas nao sao mais usados. Podem ser removidos com seguranca
10. **Conquistas sao 100% client-side**: calculadas do AsyncStorage local. Se limpar historico ou trocar celular, perde tudo. Persistencia real precisa do Sprint 7 (Supabase)
11. **Shadow chunky colorido nao funciona no Android**: elevation so gera sombra cinza. Workaround atual: borderBottomWidth + borderBottomColor nos elementos com shadow chunky
12. **CommunityScreen tem dados mock**: os 3 posts sao hardcoded em CommunityScreen.tsx. Todas as interacoes (like, comment, share, bookmark, seguir, nova postagem, busca, notificacoes) abrem Alert "em breve". Persistencia real precisa de backend social (Sprint 7+)
13. **Credenciais GitHub conta errada**: o Git Credential Manager pode ficar cacheando a conta andrehz4 que NAO tem acesso ao remote terra-gentil/terra-gentil-app. Se push der 403, limpar credencial: `printf "protocol=https\nhost=github.com\n\n" | git credential reject` e push novamente abre popup de login pra logar com a conta certa

---

## 6. SPRINTS CONCLUIDAS

### Sprint 5 Fase 2 (abril 2026)
. Schema v3 com 21 campos alinhado ao site
. Prompt v3 persona Doutor Gentileza
. Gemini retry + max_output_tokens 16384
. Mascote com 10 imagens bundled
. ScannerArea, LoadingScreen, ResultCard rico
. LuxMeter, StatsGrid, Timeline
. EbookCard pos diagnostico via formsubmit.co
. Cross-promo YouTube no loading
. Error handling centralizado
. Timeout 60s, quality 0.5

### Sprint 6 (abril 2026)
. Prontuario do Jardim (AsyncStorage local)
. Welcome na primeira abertura
. Tutorial de foto 4 slides
. SettingsScreen com 3 secoes
. BackHandler Android
. Long press dev
. 10 dicas rotacionando no scanner
. Fonte maior 40+ em todos componentes
. AsyncStorage 2.2.0

### Sprint 9A/B (abril 2026)
. Config EAS (app.json + eas.json)
. Build preview APK + production AAB
. Politica de privacidade GitHub Pages
. Suite de testes 49 casos
. Icones do app com mascote
. Play Store Console em andamento

### Pixel Garden Fase 1 (abril 2026)
. Design system centralizado (theme.ts com 21 cores, fontes, sombras)
. React Navigation 7.x (bottom tabs + native stack)
. Custom TabBar com FAB central camera
. 10 componentes reutilizaveis no redesign/
. HomeScreen redesenhada (greeting, streak, scanner card, atalhos, recentes)
. DiagnosisScreen redesenhada (hero, stats grid, alerta, timeline, ebook)
. ErrorScreen redesenhada (icones Lucide, tratamento por ErrorCode)
. WelcomeScreen redesenhada Pixel Garden com safe area
. TutorialScreen redesenhada Pixel Garden com safe area
. Safe area (topo + fundo) pra dispositivos com botoes nativos (ex: S21)
. Emojis substituidos por icones Lucide nos componentes UI
. Google Fonts (Nunito + Plus Jakarta Sans)

### Pixel Garden Fase 2 parcial (abril/maio 2026)
. VideosScreen com 15 videos reais do YouTube (channel ID: UCX3xUnHpQrhSUJUGjqMAN2A)
. Thumbnails reais via img.youtube.com, links individuais por video
. 3 categorias: Transformacoes (2), Shorts (10), Lives (3)
. Filtros funcionais por Pills (Todos/Transformacoes/Shorts/Lives)
. Botao "Inscreva-se" no topo ao lado do titulo
. ProfileScreen gamificada seguindo figma
. Cover gradient verde com circulos e wave
. Avatar com anel verde (simula boxShadow ring do figma)
. Stats: Diagnosticos, Especies, Selos
. Gamificacao: 5 niveis (Semente > Broto > Jardineiro > Botanico > Doutor das Plantas)
. Streak card amber gradient com barra progresso e shadow 3D (borderBottom fallback Android)
. Conquistas: 5 selos com emojis, desbloqueiam por total de diagnosticos
. Meu jardim: grid 3 colunas com fotos reais + emoji overlay + card "+ Nova"
. Configs integradas no Profile: ver boas-vindas (reseta welcome+tutorial), ver tutorial, limpar dados
. Links: YouTube + site
. HomeScreen atalhos navegando pras tabs corretas (Videos, Comunidade)
. Safe area corrigida no WelcomeScreen (View wrapper com insets) e TutorialScreen
. GameScreen WebView fullscreen do jogo Resgate dos Jardins (atalho na Home dispara showGame)
. CommunityScreen seguindo figma: TopBar com badge 3, 5 pills (Populares/Meus posts/Seguindo/Pragas/Suculentas), 3 posts com gradient hero (rosa/verde/amber), Doutor Gentileza pinned como oficial, comment preview, FAB Nova postagem
. PostCard reutilizavel com like/save locais e icones Lucide
. FloatCTA estendido pra aceitar ReactNode no icon

---

## 7. PROXIMOS SPRINTS

### Pixel Garden Fase 2 (pendente: 2 telas)
. EbooksScreen: hero gift, destaque, grid de capas. Componente novo: BookCard.tsx
. PromotionsScreen: deals, countdown, ofertas relampago. Componente novo: DealCard.tsx
Design reference: C:\Users\engan\Downloads\app-terragentil (1).zip
Quando precisar abrir o zip, extrair pra C:\Users\engan\Downloads\figma-extract com Expand-Archive (PowerShell) e ler os JSX em src/screens/.

### Sprint 7 (so quando houver pressao de usuarios)
Migracao AsyncStorage > Supabase, sincronizacao entre celulares.

### Sprint 8 (migrar site terragentil.com.br)
Remover chamada direta ao Gemini do site (key ja revogada).
Integrar site com backend Railway. Replicar UI consumindo mesma API.

### Sprint 9 (em andamento)
Fechar Play Store Console: screenshots, ficha completa, teste fechado com 12 testadores por 14 dias, depois solicitar acesso de producao.

### Sprint 10 (iOS)
Conta Apple Developer (USD 99/ano). EAS Build iOS. TestFlight.

### Sprint 11 (white label)
Extrair template-mobile-ia. Generalizar schemas e prompts.

---

## 8. CORES DO APP (theme.ts centralizado)

Todas as cores estao centralizadas em mobile/src/constants/theme.ts.
NAO usar cores inline nos componentes, sempre referenciar COLORS.xxx.

```
Verdes (primario):
  green: #16a34a (CTA principal, botoes)
  greenDeep: #15803d (sombra chunky)
  greenDark: #14532d (titulos sobre fundo claro)
  greenSoft: #dcfce7 (superficie tint)
  greenLeaf: #22c55e (accent)

Coral/Rosa (CTA secundaria):
  coral: #fb6f92 (botoes sociais, pills ativas)
  coralDeep: #e63b6e (sombra coral)
  coralSoft: #ffe1ec (fundo suave)

Apoio:
  amber: #f59e0b (ebooks, streaks, luz)
  amberSoft: #fef3c7
  sky: #38bdf8 (info, rega, promocoes)
  skySoft: #e0f2fe
  lavender: #a78bfa (videos, dificuldade)
  lavenderSoft: #ede9fe

Neutros:
  bg: #f6f1e7 (bege creme, fundo do app)
  card: #ffffff
  ink: #1c1917 (texto principal)
  inkSoft: #57534e (texto secundario)
  inkMute: #a8a29e (texto desabilitado)
  divider: #efeae0 (bordas, separadores)
```

---

## 9. CONTRATO DA API (intacto)

### POST /v1/diagnostico
. Content-Type: multipart/form-data
. Campo: file (JPEG, PNG ou WebP, max 10MB)
. Resposta 200: DiagnosticoResponse (21 campos, ver secao 3)
. Resposta 400: EMPTY_FILE
. Resposta 413: FILE_TOO_LARGE
. Resposta 415: UNSUPPORTED_MEDIA_TYPE
. Resposta 502: GEMINI_INVALID_RESPONSE ou GEMINI_ERROR
. Resposta 500: INTERNAL_ERROR

### GET /health
. Resposta 200: { status: "ok", version: "0.1.0", environment: "production" }

### GET /
. Resposta 200: { app: "Terra Gentil API", version: "0.1.0", docs: "/docs" }

---

## 10. EXEMPLO DE RESPOSTA REAL DO BACKEND

```json
{
  "eh_planta": true,
  "especie_identificada": "Dieffenbachia seguine",
  "nome_popular": "Comigo-ninguem-pode",
  "confianca": 0.95,
  "estado_saude": "saudavel",
  "toxica_para_pets": true,
  "toxicidade_detalhes": "Contem cristais de oxalato de calcio, que podem causar irritacao na boca, garganta e trato digestivo de pets e humanos se ingeridos.",
  "nivel_luz": "indireta_brilhante",
  "rega_dias": 7,
  "rega_condicao": "quando os primeiros 2 a 3 cm do solo estiverem secos ao toque",
  "temperatura_ideal": "18 a 29 graus",
  "nivel_dificuldade": "facil",
  "luz_porcentagem": 90,
  "luz_veredito": "Sua foto esta excelente, muito clara e bem iluminada!",
  "diagnostico_titulo": "Sua Comigo-ninguem-pode esta saudavel e vibrante!",
  "diagnostico_explicacao": "Que alegria ver sua plantinha tao cheia de vida! Suas folhas estao com uma coloracao bonita e uniforme.",
  "problemas_detectados": [],
  "plano_tratamento": "Continue com os cuidados carinhosos que voce ja esta oferecendo!",
  "plano_timeline": [
    {"etapa": "Esta semana", "acao": "Monitore a umidade do solo antes de regar novamente"},
    {"etapa": "A cada 2-4 semanas", "acao": "Considere adubar com fertilizante balanceado diluido"},
    {"etapa": "Anualmente", "acao": "Verifique se precisa de vaso maior"}
  ],
  "precisa_retorno": false,
  "mensagem_retorno": ""
}
```

---

## 11. GIT STATUS ATUAL

Branch: main (unica branch)
Tudo pushado, up to date com origin/main.

### Ultimos commits
```
49dbe58 feat(mobile): CommunityScreen Pixel Garden com feed e PostCard
d811319 feat(mobile): WebView do jogo Resgate dos Jardins (Gentileza)
5280774 feat(mobile): ProfileScreen gamificada, atalhos Home navegando, safe area Welcome/Tutorial
85aa742 feat(mobile): VideosScreen com videos reais do YouTube e thumbnails
2862b57 feat(mobile): ErrorScreen redesenhada Pixel Garden com tratamento explicito 500
330c0de feat(mobile): substitui emojis por icones Lucide no redesign Pixel Garden
988c181 feat(mobile): redesign Pixel Garden Fase 1 com React Navigation e novo visual
86c9e83 chore: backup pre-redesign Pixel Garden com assets pendentes
193a9c0 feat(mobile): icones do app com mascote Doutor Gentileza
5112324 test(backend): suite de testes com 49 casos
114813f docs: politica de privacidade para Google Play Console Sprint 9B
986de7a feat(mobile): config EAS para build preview Android Sprint 9A
70fbaf7 feat(mobile): tutorial de foto pos boas-vindas
ecc369c feat(mobile): boas-vindas primeira abertura e tela de configuracoes
aa9dfbc feat(mobile): fonte maior para acessibilidade 40+
9c279b3 feat(mobile): expande pool de dicas do scanner
c98316f feat(mobile): prontuario do jardim com historico local
a01a15d feat(mobile): ebook on demand pos diagnostico e cross-promo YouTube
70af993 feat(mobile): mascote Doutor Gentileza e tela de resultado rica
7cca42a fix(backend): gemini retry e max_tokens ampliado
a3b93bc feat(backend): schema enriquecido v3 com persona Doutor Gentileza
976527c feat(mobile): sistema de error handling centralizado
```

---

## 12. DEPENDENCIAS

### Backend (requirements.txt, intacto)
```
fastapi==0.115.0
uvicorn[standard]==0.32.0
pydantic==2.9.2
pydantic-settings==2.6.0
python-dotenv==1.0.1
python-multipart==0.0.12
google-generativeai==0.8.3
Pillow==10.4.0
pytest==8.3.3
httpx==0.27.2
```

### Mobile (package.json, atualizado pos Pixel Garden Fase 2)
```
@expo-google-fonts/nunito: ^0.4.2
@expo-google-fonts/plus-jakarta-sans: ^0.4.2
@react-native-async-storage/async-storage: 2.2.0
@react-navigation/bottom-tabs: ^7.15.10
@react-navigation/native: ^7.2.2
@react-navigation/native-stack: ^7.14.12
expo: ~54.0.33
expo-image-picker: ~17.0.10
expo-linear-gradient: ~15.0.8
expo-status-bar: ~3.0.9
lucide-react-native: ^1.11.0
react: 19.1.0
react-native: 0.81.5
react-native-safe-area-context: ~5.6.0
react-native-screens: ~4.16.0
react-native-svg: 15.12.1
```

NAO tem: react-native-reanimated, expo-updates.
Animacoes usam Animated nativo do React Native com useNativeDriver: true.

---

## 13. SEGURANCA (intacto)

. .env com GEMINI_API_KEY NAO esta no git (verificado com auditoria completa do historico)
. .gitignore cobre: .env, *.pem, *.key, *.keystore, .claude/
. Nenhuma credencial no historico de commits
. HTTPS em todas as comunicacoes
. CORS aberto (allow_origins=["*"]) porque o mobile precisa acessar de qualquer IP

---

## 14. DESIGN REFERENCE (Pixel Garden)

Um zip com mockups HTML/JSX de 8 telas existe em:
C:\Users\engan\Downloads\app-terragentil (1).zip

Contem: Onboarding, Home, Diagnosis, Community, Videos, Ebooks, Promotions, Profile.
Sao referencias visuais hi-fi (cores, tipografia, espacamentos definitivos).
NAO sao codigo de producao pra copiar. A tarefa e recriar em React Native.
SEMPRE extrair e ler o JSX da tela correspondente antes de implementar.

Telas JA implementadas seguindo o figma: Onboarding, Home, Diagnosis, Videos, Profile, Community.
Telas PENDENTES: Ebooks, Promotions.

Componentes reutilizaveis a criar pra Fase 2:
. BookCard.tsx (capa de ebook, pra EbooksScreen)
. DealCard.tsx (card de promocao, pra PromotionsScreen)
PostCard.tsx ja foi criado pra CommunityScreen.

---

## 15. NOTAS TECNICAS IMPORTANTES

. No Android, shadowColor colorido NAO funciona (elevation gera sombra cinza). Usar borderBottomWidth + borderBottomColor como fallback pra efeito 3D chunky visivel
. ProfileScreen usa expo-linear-gradient pra cover e streak card
. PostCard usa expo-linear-gradient pra hero (3 cores) + LinearGradient overlay bottom pra escurecer e dar legibilidade ao titulo branco
. Conquistas sao calculadas client-side pelo total de diagnosticos no AsyncStorage (nao tem endpoint no backend)
. VideosScreen carrega thumbnails do YouTube via URL publica: https://img.youtube.com/vi/{VIDEO_ID}/mqdefault.jpg
. Cada video abre seu link individual no YouTube (nao o canal generico)
. Reset de boas-vindas no Profile reseta AMBOS os flags (welcome + tutorial) pra fluxo completo funcionar
. Safe area no WelcomeScreen usa View wrapper com paddingTop/Bottom dos insets (nao contentContainerStyle)
. CommunityScreen e dados mock: POSTS hardcoded em CommunityScreen.tsx, todas acoes abrem Alert "em breve"
. GameScreen e renderizado fullscreen via flag showGame no App.tsx (nao via React Navigation), pausando o fluxo principal sem desmontar o NavigationContainer

---

FIM DO HANDOFF.
