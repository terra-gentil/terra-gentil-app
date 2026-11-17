# Brief para o Claude Design: tela de espera do diagnóstico, Terra Gentil

## O app
Terra Gentil é um app de jardinagem (Android, na Google Play) para quem cuida de planta em casa no Brasil.
A pessoa fotografa a planta e o Doutor Gentileza, um mascote botânico, devolve um relatório completo:
espécie, problemas, plano de tratamento, toxicidade para pets e cuidados. Tudo grátis.

## Stack do front
- React Native com Expo (SDK 54), TypeScript. Não é HTML: o resultado precisa virar componentes `View`, `Text`, `Image`, `Pressable`, `Animated`.
- Gradientes com `expo-linear-gradient`, ícones `lucide-react-native`, área segura com `react-native-safe-area-context`.
- Fontes: Nunito (títulos: 700, 800, 900) e Plus Jakarta Sans (texto: 400 a 800).
- Paleta em `theme.ts`: verdes (#16a34a, #15803d, #14532d, #dcfce7, #22c55e), coral (#fb6f92), âmbar (#f59e0b, #fef3c7), fundo creme #f6f1e7, cartões brancos, tinta #1c1917.
- Mascote: fotos em `assets/mascot/` (`analyzing.jpg` e `pose-1.jpg` a `pose-8.jpg`).

## O pedido
Deixar a tela de espera do diagnóstico **muito bonita**. Ela fica de 25 a 35 segundos na frente da pessoa
(a IA nova, Claude Opus, faz um exame mais completo e demora mais que a anterior). A tela precisa:

1. **Avisar logo na entrada** que leva uns 30 segundos, com tom de consulta tranquila, não de problema.
2. **Mostrar o exame acontecendo:** a foto da planta com varredura e as 8 etapas do Doutor avançando.
3. **Mostrar quanto falta:** contagem honesta ("Cerca de 25 segundos" até "Quase pronto...") e barra de progresso.
4. **Apresentar o Terra Gentil** nesses 30 segundos, quase uma propaganda: carrossel de cartões com quem somos,
   canal do YouTube (com botão "Lembrar de ver o canal"), mais de 100 ebooks grátis e a comunidade, mais uma dica "Você sabia?".
5. Também redesenhar o **cartão "Você pediu para lembrar"** que aparece no fim do relatório quando a pessoa tocou no botão do canal (link para youtube.com/@TerraGentil).

Os textos aprovados estão em `ROTEIRO-ESPERA-V2.md` e já estão no código atual. Pode sugerir melhorias de texto,
mas mantenha o sentido. Os screenshots `estado-atual-*.jpg` mostram a versão funcional de hoje.

Ideias bem-vindas: hierarquia mais clara entre "exame" e "conheça o Terra Gentil", carrossel com mais presença
(capa, cor por cartão, miniaturas), animações suaves de troca, um momento final de "pronto!" antes do relatório.
Público inclui gente mais velha: texto grande (mínimo 15), bom contraste, nada piscando rápido.

## Restrições rígidas (não renomear nem remover, os testes e o app quebram)

**testIDs**
- `loading-diagnostico` (raiz, com `accessibilityRole="progressbar"` e `accessibilityState={{ busy: true }}`)
- `laser` (varredura da foto, some com "reduzir movimento")
- `cartao-${id}` (cartão atual do carrossel), `dica` (texto do cartão)
- `lembrar-canal` (botão do canal no cartão "canal")
- `etapa-atual` (texto da etapa atual, com `accessibilityLiveRegion="polite"`, conteúdo `{texto}...`)
- `barra-trilho`, `barra-preenchimento`, `barra-brilho` (barra de progresso)
- `cartao-lembrete-canal` (no relatório, DiagnosisScreen)

**Constantes exportadas de LoadingScreen.tsx** (os testes importam): `ETAPAS`, `INICIO_ETAPAS_MS`, `TEMPO_TIPICO_S`,
`CARTAO_INTERVALO_MS`, `CARTOES` (ids `quem-somos`, `canal`, `ebooks`, `comunidade`, `dica`), `DICAS`, `DEMORA_MS` (60000),
`BARRA_OUTPUT`, `textoContagem()`, `LoadingScreen`.

**Comportamentos**
- Etapas avançam por tempo: 0, 3, 8, 14, 20, 25, 30 e 35 s; a última fica ativa até a resposta chegar.
- Carrossel troca a cada 8 s. Uma dica sorteada por espera no cartão "dica".
- Aviso de demora só aos 60 s ("Hoje o consultório está movimentado...").
- Botão do canal chama `marcarLembrarCanal()` uma vez e muda para "Combinado! O link vai no seu relatório". Ele **não** abre o YouTube durante a espera (o Android pode pausar a análise).
- Rótulos de acessibilidade das etapas: `"{texto}, concluído" | "em andamento" | "a seguir"`; foto: "Foto da sua planta" ou "Doutor Gentileza analisando".
- Com "reduzir movimento" do sistema ligado, nada de animação decorativa (laser, respiro, pulso, brilho, fades).
- Animações no driver nativo (`useNativeDriver: true`), timers limpos ao desmontar.
- Prop única: `imageUri?: string | null`.

## Como devolver
Handoff bundle para o Claude Code (preferido) ou o código dos componentes React Native.
Se o protótipo sair em HTML, tudo bem: o Claude Code converte, desde que os pontos acima sejam respeitados.
