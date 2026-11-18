# PROGRESSO - Terra Gentil

## 2026-11-18 manha: custo do Claude cortado e Ver/Fechar em todas as setas

- APK 1.1.0 instalado no S23 do Andre via adb (app da Play desinstalado com autorizacao; quando a 1.1.0 sair na Play, desinstalar de novo, assinatura diferente).
- Pilula Ver/Fechar virou padrao do Chevron (comum.tsx): todas as setas para baixo mostram a palavra (publico mais velho). OTA preview 9e0abf58, commit 5140bee.
- Custo medido no log do Railway (CLI logada como Terra Gentil, projeto terra-gentil-api linkado): primeira consulta da hora custava US$ 0,187 (cache de 1h grava a US$ 8/MTok, 19.592 tokens fixos).
- Commit 5ca4dc2: catalogo de ebooks fora do prompt; backend escolhe os guias em app/services/escolher_ebooks.py (nome da planta + sinonimos, problema mais grave, pet se toxica) com motivo "Feito para quem tem X. <descricao>" / "Para <problema> que vi na sua planta. <descricao>" (opcao b do Andre). Gabarito dos 12 laudos: 10 iguais, 2 equivalentes (tests/test_escolher_ebooks.py). Cache 5 min. Prompt fixo 9.851 tokens; rodada real: primeira US$ 0,10, demais ~US$ 0,06. Interruptores no Railway: EBOOKS_PELO_BACKEND=false volta o catalogo ao Claude; CLAUDE_CACHE_TTL=1h volta o cache longo. 419 testes.
- Falha intermitente de JSON do Opus (pula campos, ~1 em 12): agora tem CONSERTO (CLAUDE_CONSERTO, padrao ligado). Resposta em JSON valido mas fora do schema -> 2a chamada com o mesmo prefixo (cache quente) + resposta anterior, pedindo so os campos com erro e os obrigatorios ausentes; remendo so substitui esses campos. Teste real (5 campos apagados do lirio): 1,8 s, ~US$ 0,025, laudo completo. JSON quebrado (sintaxe) ainda cai no Gemini.
- Foto ampliada (OTA preview d2bb69f1): toque na foto do laudo (ou pilula "Ampliar") abre FotoAmpliada.tsx em tela cheia, ja aproximada no problema (zoomNaArea em derivar.ts), botoes grandes "1 <problema>" e "Foto inteira", pinca/arrasto/toque duplo com PanResponder (so JS, sem modulo nativo). 148 testes.
- Laudo, pedidos do Andre testando no S23 (OTA preview ecbb01d1, 150 testes): livro com botao verde "Ler agora" que pulsa 4 vezes e faixa GRATIS na capa; cartao do canal sempre no fim do laudo (ultimo video em moldura, abre no YouTube, e botao vermelho "Inscreva-se no canal" com sub_confirmation=1; titulo "Voce pediu para lembrar" so se pediu na espera); aba Videos e cartao leem o feed publico do canal (mobile/src/api/videosCanal.ts, reserva com os 5 videos de 18/11). Pilula Ampliar voltou ao alto (embaixo esbarrava no selo). Escurecimento da lupa refeito com 4 faixas e 4 cantos: a borda gigante do Design NAO desenhava no Android (medido no print). Falta conferir no celular: escurecimento, livro, cartao do canal e aba Videos.
- Marca da lupa redesenhada no Claude Design (projeto "Terra Gentil marca redesign", claude.ai/design/p/f58628b4-b60b-4487-b773-3c99aeb2488b; retorno e HANDOFF-lupa.md em /Users/andrehz/Documents/Githubhz/terra-gentil-app/design-handoff-lupa/retorno, fora do git). Portado em resultado/MarcaDesenho.tsx: anel em camadas (contorno escuro, branco, coral, fio), etiqueta coral escura com numero no ponto de 45 graus, escurecimento fora da marca destacada, entrada animada e onda 2x no lugar do pulso, tudo sem animacao com reduzir movimento. Pilula Ampliar foi para baixo a direita. Foto ampliada: fundo verde muito escuro, painel creme com botoes em coluna (56 px, "Vendo" no ativo), bordas da marca com espessura fixa no zoom. OTA preview 2e0a391b. 148 testes. NAO conferido no celular ainda (Andre: fechar e abrir o app 2x e olhar um laudo com problema). Observacao do Design: em foto em pe (oidio) o cartao de 208 px corta o topo da area marcada; saida possivel e cartao mais alto para foto em pe.
- Proximo depois: falas do Doutor (ElevenLabs + expo-audio, entra na 1.1.0). Andre ainda decide conta (Starter pago vs gratuitas, risco de licenca) e voz. Roleta de chaves em /Users/andrehz/Documents/Githubhz/setlists-pj-ev/scripts/publish/narracao/chaves.mjs. Trocar "Em 15s descubro tudo" da Home (leva ~25 s).

## SEGUNDA ETAPA EM ANDAMENTO (2026-11-18 madrugada)

ATENCAO OTA: a partir do commit 2909954 o app usa runtimeVersion "2.0.0" (version 1.1.0, versionCode 3) e tem modulos nativos novos (react-native-view-shot, expo-sensors). OTA feita do main agora NAO chega no build da Play (runtime exposdk:54.0.0). Correcao urgente para o build antigo: fazer `git worktree add` no commit b4c42c2 e rodar `npx -y eas-cli@latest update --branch production` de la.
- Backend no ar (1a62322): area_foto, file2/file3, nota_estacao, foto_referencia (Wikipedia). Testado em producao com a abobrinha: ok (lupa veio com caixa quase da foto toda; app so desenha se < 60%).
- App (2909954): compartilhar como imagem, antes e depois, lembrete de rega recorrente, Plantas em cuidado na Home, Me avise persistido, permissao de notificacao passo a passo, medidor de luz. 133 testes.
- Lupa, tela Quer mandar mais fotos (ate 3), foto de referencia e nota_estacao integradas (932f4c3).
- APK de teste 1.1.0 pronto (commit 932f4c3, 146 testes): https://expo.dev/accounts/terra-gentil-app/projects/terra-gentil-app/builds/06c83e9d-ecfe-4951-8ae9-8a27235fda29 (canal preview; ajustes vao por `eas update --branch preview`). Andre testando no aparelho. So mandar para a Play (eas build --profile production + submit) quando ele aprovar.
- Fora: alerta regional, medir vaso com realidade aumentada.

## PROXIMA SESSAO: Andre testar a tela de resultado v2 no celular e pedir ajustes

Atualizado 2026-11-17 23h. Tela de resultado v2 NO AR por OTA (update group 46df746a, commit a0bc7b7), junto com os 133 livros da aba Ebooks.
- Design: projeto "Terra Gentil: Tela de Resultado" no claude.ai/design (p/3184555a-37c3-411a-8a0f-a7d77b9ce4ef); retorno em /Users/andrehz/Documents/Githubhz/terra-gentil-app/design-handoff-resultado/retorno.
- Codigo: DiagnosisScreen.tsx + mobile/src/components/redesign/resultado/ (derivar.ts e blocos), ofertas em mobile/src/data/ofertas.ts (compartilhado com Promocoes), tipo v2 opcional em api/diagnostico.ts, foto sem planta agora abre a DiagnosisScreen (saiu o "Hmm...").
- Perguntar: abre NovaPostagemModal com foto, titulo e categoria (login antes se preciso). A folha propria do prototipo nao foi feita.
- Lembrete "Me avise": notificacao local as 10h do dia do retorno; nao persiste (botao Desfazer some ao fechar).
- Decisoes abertas do Design: miniatura redonda no veredito repete a foto (tirar?); comparar familia visual com a tela de espera.
- Pendencias: 2 testes de EbooksScreen.perf ("abas e chips") ja falhavam antes, corrigir; eas nao esta instalado global, usar `npx -y eas-cli@latest update ...`; tsc com --stack-size=16000 no Node 26; EbookCard (presente por e-mail) ficou sem uso; JSON intermitente do Opus; politica de privacidade no fim.

## (anterior) levar a tela de resultado v2 ao Claude Design
Lista APROVADA pelo Andre em /Users/andrehz/Documents/Githubhz/terra-gentil-app/docs/PESQUISA-CONCORRENTES.md (secoes B, D e G).
1. Rodar /enviar-design com: mobile/src/components/redesign/DiagnosisScreen.tsx, os 12 JSON reais finais em docs/exemplos-relatorio-v2 (ja com ebooks, tipo do passo, rega_ml, vaso_estimado_cm, como_evitar), as 8 capturas em docs/concorrentes e no BRIEF a ordem dos 19 blocos da secao D. Restricoes: manter testIDs/exports, quimico sempre recolhido e sem link, ofertas em faixa separada.
2. Andre aprova no Claude Design, agente porta para React Native (EbookViewerModal para o "Leia de graca", lembrete local com expo-notifications, que ja esta no build), jest + tsc, commit, eas update --branch production (leva tambem os 133 livros da aba Ebooks).
3. Depois: corrigir JSON quebrado do Opus (2 falhas em 17 no dia 17/11, intermitente), politica de privacidade/Data Safety citando a Anthropic (Andre pediu para deixar para o fim).

## Atualizado: 2026-11-17 noite, parte 3 (ebooks no Opus, pesquisa de concorrentes, relatorio v3)

### Feito
- Ebooks ligados no Opus (commit d13195e, no ar): gerar-colecao.py roda no Mac (--site ou TG_SITE), gera colecao.ts (133 livros, tema carnivoras) e backend/app/data/catalogo_ebooks.json (133 + 8 classicos). resolver_ebooks descarta codigo fora do catalogo, tira repetido, limita a 2 e completa titulo/capa/pdf. Catalogo no bloco em cache. PDFs e capas conferidos no ar. Indicacoes boas (orquidea -> Orquidea Doente e Vaso de Orquidea).
- Pesquisa de 9 concorrentes (3 agentes + analise Fable): docs/PESQUISA-CONCORRENTES.md e docs/concorrentes. Promessa da tela: laudo que mostra o que viu, gratis e sem assinatura (todos os concorrentes populares sao pagos e com reclamacao de cobranca).
- Relatorio do Opus enxuto com 4 campos novos: PassoTratamentoV2.tipo (manejo/caseiro/organico/quimico), rega_ml, vaso_estimado_cm, acompanhamento.como_evitar. Cortes: calendario_cuidados, cuidados.rega/luz_e_local, toxicidade_detalhes, precisa_retorno, mensagem_retorno (backend deriva em completar_campos_derivados/pos_processar). 335 testes. Rodada real 12/12 validas, 11% menos tokens, ~25 s (antes ~30 s).
- Exemplos finais (como o app recebe) em docs/exemplos-relatorio-v2.

### Atencao
- Tela atual em producao: toxicidade_detalhes agora no formato "Partes toxicas: ... Sintomas: ..." (pode passar de 150 caracteres) e o cartao de lembrete aparece tambem em planta saudavel (retorno de 30 dias).
- Jiboia em garrafa: vaso 5 cm com 250 ml por rega, estimativa de vaso pode errar em recipiente atipico.

## Atualizado: 2026-11-17 noite, parte 2 (CLAUDE LIGADO EM PRODUCAO)

### Feito
- Claude Opus LIGADO em producao: variavel CLAUDE_ROLLOUT_PERCENT=100 criada no Railway (servico terra-gentil-app). Motivo: o Gemini estava fora (503 e timeout de 60 s). Teste real em /v1/diagnostico: HTTP 200 em 30 s, relatorio v2 (lirio-da-paz murcho). Travas: 100 diagnosticos por dia (CLAUDE_DAILY_LIMIT) e US$ 100 por mes no workspace; se o Claude falhar, cai no Gemini.
- O app atual so mostra os campos v1 do relatorio (o v2 e um superconjunto, entao funciona).
- Tela de espera com o design do Claude Design (commit a4813d4) PUBLICADA por OTA no canal production (update group 8cc5ddef). Inclui tempo limite de 100 s e lembrete do canal.
- EAS logado neste Mac como terra-gentil (login por dispositivo: eas login --device --non-interactive, depois --resume ID --match NUMERO).
- Projeto no Claude Design: "Terra Gentil Loading Screen" (claude.ai/design). Claude Design muda para o Claude em 14/12/2026.

### Proximo passo (urgente primeiro)
1. Politica de privacidade e Data Safety da Play: citar que a foto vai para a Anthropic (Claude ja esta processando fotos).
2. Tela do relatorio v2 no Claude Design (mesmo fluxo: /enviar-design, depois porte por agente) e publicar por OTA.
3. Ligar o catalogo de ebooks no Opus (resolver_ebooks, gerar-colecao.py).
4. Momento "Pronto!" de 1,8 s da tela de espera (precisa callback no App.tsx).
5. Acompanhar custo no Console da Anthropic nos primeiros dias.
6. Revogar a chave teste-local-fase2 ao terminar os testes locais.

## Atualizado: 2026-11-17 noite (fase 2 do diagnostico v2 e tela de espera)

### Feito
- BUG CRITICO corrigido (commit bca2e42): a API recusava o schema v2 como saida estruturada ("compiled grammar is too large", estoura a partir de 21 dos 32 campos). Em producao o Opus falharia 100% e tudo cairia no Gemini. Agora o schema vai no 1o bloco do system (em cache), sem output_config.format, e o Pydantic valida. 309 testes do backend passando.
- Fase 2 (teste real) concluida so com o Opus: 12 fotos da internet (Serper do projeto youtube-marcaregistrada) em backend/fase2-fotos, resultados em backend/fase2-resultados (fora do git). 11 de 12 acertos, 27 s em media (pior 35 s), US$ 0,065 por diagnostico, cache funcionando. Duvida: foto "requeima do tomateiro" saiu como batata. Ebooks vieram vazios (catalogo ainda nao ligado). Gemini ficou fora (503, alta demanda): comparar depois.
- Script backend/scripts/fase2_comparar.py (opcoes --so-claude, --so-gemini, --lado). Ambiente em backend/.venv. Chaves em backend/.env: ANTHROPIC_API_KEY = chave "teste-local-fase2" (workspace terra-gentil-prod, vence 24/11/2026) e GEMINI_API_KEY.
- Pegadinha: o Claude Code exporta CLAUDE_EFFORT=medium no terminal e o backend le a mesma variavel; o script descarta.
- Tela de espera v2 (commit 23cbdc7, NAO publicada por OTA): aviso de 30 s na entrada, 8 etapas ate 35 s, contagem "Cerca de N segundos", carrossel "Conheca o Terra Gentil" (quem somos, canal, ebooks, comunidade, dica), botao "Lembrar de ver o canal" que so guarda lembrete e o link aparece no fim do relatorio, demora aos 60 s, API_TIMEOUT_MS 100 s. Roteiro em docs/ROTEIRO-ESPERA-V2.md. 83 testes do app passando.
- Pacote do Claude Design pronto: /Users/andrehz/Documents/Githubhz/terra-gentil-app/design-handoff.zip + BRIEF-DESIGN.md.

### Proximo passo
1. Andre leva design-handoff.zip ao claude.ai/design; aplicar o retorno mantendo testIDs e exports do BRIEF.
2. Junto, mandar a tela do relatorio v2 (DiagnosisV2) ao Claude Design (fase 3).
3. Ebooks: rodar mobile/scripts/gerar-colecao.py e ligar resolver_ebooks() no Opus.
4. Repetir a fase 2 com --lado 1280 e com o Gemini quando ele voltar.
5. Voz do Doutor (ElevenLabs) fica para depois: exige build novo (expo-audio).
6. Revogar a chave teste-local-fase2 no Console ao terminar os testes.

### Pendencias no site terragentil.com.br
- Fala em 152 PDFs e em 12 ebooks gratuitos; app aparece "em breve" (ja esta na Play); contadores zerados.

## Atualizado: 2026-11-17 (diagnostico v2 com Claude Opus 5.5)

### Feito
- Proposta completa em /Users/andrehz/Documents/Githubhz/terra-gentil-app/docs/PROPOSTA-DIAGNOSTICO-V2.md (Fable): notas hoje vs v2, momentos de encantamento, schema e prompt v2, tela v2 em 19 blocos, ebooks "Leia de graca", custo (recomendado US$ 0,087 por diagnostico, uns 1.040 por mes).
- Fase 0 (seguranca) concluida no Console da Anthropic: sem cartao cadastrado (so o credito de US$ 100/mes), workspace terra-gentil-prod com limite de US$ 100/mes e alertas em US$ 50 e 80, chave terra-gentil-backend com escopo nesse workspace, vence em 15/02/2027. Chave salva so no Railway (ANTHROPIC_API_KEY, servico terra-gentil-app).
- Fase 1 (backend) no ar, commit 7219760, DESLIGADA: claude_service (Opus 5.5, schema v2, cache 1h, foto 1568 px, 40 s sem retry), Gemini v1 como reserva para qualquer falha, trava diaria em memoria (100/dia), 308 testes passando.
- Variaveis novas (padroes): CLAUDE_MODEL=claude-opus-5-5, CLAUDE_ROLLOUT_PERCENT=0, CLAUDE_DAILY_LIMIT=100, CLAUDE_EFFORT=low, CLAUDE_TIMEOUT_S=40, CLAUDE_MAX_TOKENS=8000.

### Proximo passo
1. Fase 2: teste real com fotos (custo, tempo, qualidade, cache_read no log) comparando com o Gemini.
2. Fase 3: levar proposta ao Claude Design (/enviar-design), implementar DiagnosisV1/DiagnosisV2 no app e subir timeout do app para 100 s via OTA ANTES de liberar.
3. Ebooks: rodar scripts/gerar-colecao.py (app 28 livros atras do site, 133 guias) e ligar resolver_ebooks().
4. Fase 4: politica de privacidade e Data Safety citando a Anthropic. Fase 5: liberacao gradual (10, 50, 100%).

### Decisoes
- Opus = relatorio v2; Gemini = relatorio v1 de hoje. Aviso de cautela de pets quando a identificacao for incerta. Historico completo e lembrete local ficam para segunda etapa.

## Atualizado: 2026-11-12 (sessao de ebooks, performance e barra de abas)

### Estado atual (tudo publicado via eas update no canal production)
- **Ebooks:** aba propria na barra inferior. Duas abas internas: Colecao (105 livros do site, PDFs no R2 pelo Worker) e Classicos (8, os outros 11 repetem a Colecao e ficam escondidos, NUMEROS_NA_COLECAO em data/ebooks.ts). Divididos em prateleiras por categoria com chips. Dados da Colecao vem de data/colecao.ts (GERADO por scripts/gerar-colecao.py, rodar de novo quando o site ganhar livros, ex.: Leva 10 TG115 a TG128). Interruptor MOSTRAR_COLECAO em EbooksScreen.tsx.
- **PDFs da Colecao:** os 104 regerados com garbage=1 (garbage>=2 embaralhava as fontes Type3) e enviados ao R2; QA baixou os 105 do ar e todos tem texto legivel.
- **Barra inferior (MainTabBar.tsx):** Inicio, Comunidade, Promocoes, [Camera], Ebooks, Videos, Eu. Promocoes e Ebooks viraram abas (PromosTab, EbooksTab), nao sao mais modais. Em 320 dp os rotulos encolhem ate 75%; se incomodar, trocar "Promocoes" por "Ofertas".
- **Performance:** lista vertical virtualizada em Ebooks, miniaturas das capas via /_next/image do site (USAR_CAPA_OTIMIZADA em data/ebooks.ts, consome cota de imagens da Vercel), scanner da Home com animacao nativa e pausa fora de foco, fontes enxutas (30 para 8 arquivos), Comunidade com memo e cache de 30 s (FOCO_TTL_MS), timeout de 25 s nas leituras do forum, timers sem vazamento.
- **Leitor de ebook:** aviso minimo de abertura 4 s no Android e 1,2 s no iOS (LOADING_MIN_MS em EbookViewerModal.tsx). Se aparecer tela em branco no Android, subir; se o PDF ja estiver pronto antes, descer.
- **Correcoes:** videos reais (4 do canal @TerraGentil), capa do ebook 1, link de privacidade, dias de cuidado da Home usam o historico completo, acentos na Home.

### Proximo passo
- Conferir no aparelho: rotulos da barra em tela estreita, camera central, scanner da Home, scroll dos chips de ebooks, PDF no Android.
- Leva 10 (TG115 a TG128) quando entrar no site: rodar o gerador e eas update.
- Opcionais: sino de notificacoes nas abas Ebooks e Promocoes; reduzir a foto antes do diagnostico (cerca de 1600 px); cache longo de capas no site.

### Blockers / depende de build novo ou backend
- Recomprimir JPGs do mascote, icon.png, adaptive-icon.png, splash-icon.png e usar expo-image (novo build).
- Fotos dos posts da Comunidade vem em base64 na listagem (backend deveria servir miniatura).
- Comandos: tsc com `node --stack-size=8000 node_modules/typescript/bin/tsc --noEmit`; testes com `npx jest`; publicar com `eas update --branch production --message "..." --non-interactive` (login por `eas login --sso`).

---

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

---

## Revisao app x site (2026-11-11)
- Ebooks: 19 PDFs e 19 capas do app conferem com o site, todos respondem 200.
- Corrigido: capa do ebook 1 vinha do host antigo da Hostinger, agora usa terragentil.com.br/ebooks/covers.
- Corrigido: link "Politica de privacidade" apontava para terragentil.com.br/privacidade (404), agora usa a pagina do GitHub Pages (200).
- Corrigido: aba Videos tinha 15 IDs inexistentes e o ID de canal errado. Agora usa os 4 videos reais do canal @TerraGentil (UCfZn0uytIhsk30SMQtoKeLA). Shorts e Lives ficam ocultos ate haver conteudo. Update OTA publicado.
- Pendente: o site tambem usa IDs de video invalidos na home (ex: K1J5I9IcGIw). Corrigir no repo do site.
- Futuro: buscar a lista de videos ao vivo via endpoint no backend (feed RSS do canal).
- Pendente: forum /v1/forum/badges retorna 404 sem auth, verificar se a rota mudou.
- Site tem secoes que o app nao tem: noticias, transformacoes, jogo, manifesto, blog.
- Mudancas de codigo exigem eas update --branch production.

## Ebooks no app por categoria + colecao completa (2026-11-11)
- EbooksScreen: duas abas, "Colecao" (105 livros do site, 7 temas) e "Classicos" (19 PDFs, 6 categorias), com chips de navegacao e prateleiras.
- Dados da colecao em `mobile/src/data/colecao.ts`, GERADO por `mobile/scripts/gerar-colecao.py` a partir do repo do site (data/guias + lib/temas.ts). Rodar de novo quando o site ganhar livros (ex: Leva 10, TG115 a TG128).
- Capas: terragentil.com.br/guias/<slug>/capa.webp. PDFs: terra-gentil-pdfs.canalterragentil.workers.dev/TGxxx.pdf. Os 105 conferidos (200).
- `npx tsc` estoura a pilha neste PC (ja sem as mudancas). Usar: node --stack-size=8000 node_modules/typescript/bin/tsc --noEmit
- BLOQUEIO (QA Opus, 11/11): 104 de 105 PDFs da colecao estao com texto ILEGIVEL no ar (so o TG010 esta bom). Causa provavel: `doc.save(garbage=4)` em `terra-gentil/scripts/guias/pdf-web.py` (fontes Type3 deduplicadas errado). Originais `Documents\Terra Gentil\ebooks\TGNNN-previa.pdf` estao ok. Afeta tambem o botao "PDF gratis" do site.
- Mitigacao no app: aba Colecao escondida (`MOSTRAR_COLECAO = false` em EbooksScreen.tsx). Religar so depois de regerar e subir os PDFs (testar extraindo "Andre" das 2 primeiras paginas).
