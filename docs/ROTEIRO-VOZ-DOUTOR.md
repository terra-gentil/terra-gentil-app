# Roteiro de voz do Doutor Gentileza (rascunho para o Andre aprovar)

Data: 18/11/2026. Nada foi gravado, nenhuma API foi chamada. Este arquivo substitui a seção 4 de
/Users/andrehz/Documents/Githubhz/terra-gentil-app/docs/ROTEIRO-ESPERA-V2.md quando for aprovado.

Resumo: 36 falas fixas, 2.958 caracteres no total. Em uma consulta comum a pessoa ouve de 3 a 5 falas.

## 1. Direção de voz

**Quem é o Doutor.** Um médico de família que também gosta de planta. Atende sem pressa, olha no olho, explica com palavras simples. Trata a pessoa por "você", nunca por "senhor" ou "senhora" (não sabemos quem está do outro lado) e nunca por apelido.

**Tom.** Calmo, caloroso, seguro. Sorriso leve na voz, sem animação de locutor de propaganda. Quando a notícia é ruim, a voz fica mais séria e mais devagar, mas nunca alarmada.

**Idade aparente.** Entre 55 e 65 anos. Voz madura, que passa experiência, mas ainda firme e clara.

**Ritmo.** Perto de 2,5 palavras por segundo, com pausa de verdade em cada ponto final. As durações da tabela já consideram esse ritmo. Se a voz escolhida falar mais rápido, é melhor reduzir a velocidade do que encurtar o texto.

**Sotaque.** Brasileiro neutro, do tipo que se ouve em rádio do Sudeste, sem regionalismo marcado. Deixar a voz detectar o idioma pelo texto, sem forçar "pt", para não puxar sotaque de Portugal.

**O que evitar.**
- Voz de locutor comercial, empolgada ou "vendedora".
- Voz infantil, de desenho animado, ou caricata de velhinho.
- Voz grave demais ou sussurrada, que some no alto-falante pequeno do celular.
- Fala corrida, risada forçada, entonação de pergunta no fim de frase afirmativa.
- Trilha musical por baixo. A voz vai sozinha, limpa.

**Recomendação para escutar e escolher.** Ouvir três tipos na biblioteca e decidir pelo ouvido, sempre testando com a fala espera_inicio_a e com a laudo_toxica_a (uma leve, uma séria):
1. **Homem maduro, barítono caloroso, estilo narrador de documentário de natureza.** É a minha recomendação. Combina com "Doutor", passa confiança e entende bem no alto-falante do celular.
2. **Homem mais velho, voz um pouco rouca, estilo avô que conta história.** Mais afetuoso, porém mais lento. Bom se o Andre quiser um personagem mais carinhoso do que médico.
3. **Homem de uns 40 anos, sereno, estilo médico jovem atencioso.** Mais claro e ágil. Serve de reserva se as vozes maduras da conta soarem artificiais em português.

Nos ajustes da voz, preferir estabilidade alta e pouco exagero de estilo, para todas as falas soarem como a mesma pessoa no mesmo dia. Gerar 2 ou 3 tomadas de cada fala e escolher a melhor.

**Regras de texto que já estão aplicadas nas falas.**
- Nada de "pro" (lido como PRÓ). Uso "para o" e "para".
- Nada de palavra em inglês. "Pets" virou "bichinhos de estimação" ou "cães e gatos". "YouTube" virou "canal do Terra Gentil". "App" virou "aplicativo". "Wi-Fi" virou "internet".
- Nenhum algarismo, nenhuma sigla, nenhuma reticência, nenhum símbolo. Números por extenso.
- "Estou" no lugar de "tô", que a voz pode ler errado e que combina menos com o Doutor.
- "Laudo" no lugar de "relatório", porque a tela do resultado se chama "Laudo do Doutor".
- Frases sem marca de gênero para quem ouve (nada de "fique tranquilo" ou "obrigado por ser cuidadosa").
- Nenhuma fala cita o nome da planta nem o problema específico.

## 2. Falas

Caracteres contados com espaços e pontuação, do jeito que a ElevenLabs cobra. Duração estimada a 2,5 palavras por segundo, mais 0,3 s de pausa por frase.

### A. Espera, abertura (toca a cada consulta, reveza)

| id | Quando toca | Texto exato enviado à voz | Caracteres | Duração |
|---|---|---|---|---|
| espera_primeira_vez | 0,5 s, só na primeira consulta da pessoa | Olá, muito prazer. Eu sou o Doutor Gentileza. Vou examinar a sua planta com calma. Leva uns trinta segundinhos. | 111 | 9 s |
| espera_inicio_a | 0,5 s, trilha A | Olá! Recebi a sua foto. Vou examinar com calma, como numa consulta. Leva uns trinta segundinhos. | 96 | 7,5 s |
| espera_inicio_b | 0,5 s, trilha B | Que bom ver você por aqui. Já estou com a sua foto. Me dê uns trinta segundinhos para examinar direitinho. | 106 | 9 s |
| espera_inicio_c | 0,5 s, trilha C | Foto recebida. Fique à vontade, que eu vou olhar a sua planta com toda a calma. | 79 | 7 s |

Subtotal do bloco: 392 caracteres.

### B. Espera, exame (acompanha as etapas da tela)

| id | Quando toca | Texto exato enviado à voz | Caracteres | Duração |
|---|---|---|---|---|
| espera_folhas_a | 9,5 s, trilha A (etapa Olhando folhas e caule) | Agora estou olhando as folhas e o caule, bem de pertinho. | 57 | 4,5 s |
| espera_folhas_b | 9,5 s, trilha C | Deixa eu ver essas folhas com atenção, uma por uma. | 51 | 4,5 s |
| espera_pragas_a | 15 s, trilha B (etapa Procurando pragas e fungos) | Estou conferindo se tem alguma praga ou fungo escondido. | 56 | 4 s |
| espera_rega_a | 21 s, trilha A (etapa Avaliando luz e rega) | Agora vejo se ela está recebendo luz e água na medida certa. | 60 | 5 s |
| espera_canal_a | 21 s, trilha C, nunca na primeira consulta | Enquanto espera, um convite. Tem vídeo novo toda semana no canal do Terra Gentil. | 81 | 6 s |
| espera_pets_a | 26 s, trilha B (etapa segura para pets e crianças) | Também confiro se ela é segura para crianças e bichinhos de estimação. | 70 | 5 s |

Subtotal do bloco: 375 caracteres.

### C. Espera, reta final (só toca se o laudo ainda não chegou)

| id | Quando toca | Texto exato enviado à voz | Caracteres | Duração |
|---|---|---|---|---|
| espera_plano_a | 32 s, trilha A | Estou montando o seu plano de cuidados. Falta pouquinho. | 56 | 4 s |
| espera_plano_b | 32 s, trilha B | Já estou terminando de escrever o seu laudo. Quase lá. | 54 | 4,5 s |
| espera_plano_c | 32 s, trilha C | Só mais um instante. Estou passando tudo a limpo para você. | 59 | 5 s |
| espera_detalhes | 42 s, qualquer trilha | Estou caprichando nos últimos detalhes. Obrigado pela paciência. | 64 | 4 s |

Subtotal do bloco: 233 caracteres.

### D. Demora

| id | Quando toca | Texto exato enviado à voz | Caracteres | Duração |
|---|---|---|---|---|
| demora_a | 60 s, junto com o aviso de demora na tela | Hoje o consultório está cheio. Peço só mais uns segundinhos, já estou terminando. | 81 | 6 s |
| demora_b | 60 s, variação | Está demorando um pouco mais do que eu gostaria. Não precisa fazer nada, é só aguardar. | 87 | 7 s |
| demora_longa | 82 s, uma vez só | Continuo aqui com a sua planta. Não feche o aplicativo, falta bem pouco. | 72 | 6 s |

Subtotal do bloco: 240 caracteres.

### E. Laudo aberto (uma fala por laudo, escolhida pela situação)

| id | Quando toca | Texto exato enviado à voz | Caracteres | Duração |
|---|---|---|---|---|
| laudo_saudavel_a | Laudo sem problema encontrado | Boa notícia. A sua planta está saudável. Deixei no laudo os cuidados para ela continuar assim. | 94 | 7,5 s |
| laudo_saudavel_b | Laudo sem problema, variação | Fique em paz, não encontrei nada de errado. O laudo traz as dicas para manter essa saúde. | 89 | 7,5 s |
| laudo_saudavel_c | Laudo sem problema, variação | Que beleza de planta. Está bem cuidada. Dê uma olhada no laudo para ela seguir assim. | 85 | 7,5 s |
| laudo_problema_a | Laudo com problema encontrado | Prontinho. Encontrei alguns pontos que pedem atenção. Vamos cuidar disso juntos, está tudo explicado no laudo. | 110 | 7,5 s |
| laudo_problema_b | Laudo com problema, variação | Terminei o exame. A sua planta precisa de uns cuidados. Vamos com calma, o passo a passo está no laudo. | 103 | 9 s |
| laudo_problema_c | Laudo com problema, variação | Pronto. Vi o que está incomodando a sua planta. No laudo eu explico o que fazer, sem pressa. | 92 | 8 s |
| laudo_serio | Laudo com o cartão Vale chamar quem entende (caso sério) | Terminei o exame. O caso pede atenção, e quanto antes melhor. No laudo eu mostro por onde começar. | 98 | 8 s |
| laudo_geral_a | Reserva, quando o app não souber a situação | Prontinho. O seu laudo está na tela. | 36 | 3,5 s |
| laudo_geral_b | Reserva, variação | Terminei. Pode ler o laudo com calma. | 37 | 3,5 s |

Subtotal do bloco: 744 caracteres.

### F. Laudo, falas complementares (tocam depois da fala principal, com um segundo de pausa)

| id | Quando toca | Texto exato enviado à voz | Caracteres | Duração |
|---|---|---|---|---|
| laudo_toxica_a | Planta tóxica para pets ou crianças | Um aviso importante. Esta planta pode fazer mal a crianças, cães e gatos. Deixe fora do alcance deles. | 102 | 8 s |
| laudo_toxica_b | Planta tóxica, variação | Atenção a um detalhe. Esta planta é tóxica para crianças e bichinhos. O melhor é deixar num lugar alto. | 103 | 8,5 s |
| laudo_foto_marcada | Laudo com marcas na foto, só nas três primeiras vezes | Marquei na foto onde está cada problema. É só tocar nela para ver de perto. | 75 | 6,5 s |

Subtotal do bloco: 280 caracteres.

### G. Quando não dá para fazer o laudo

| id | Quando toca | Texto exato enviado à voz | Caracteres | Duração |
|---|---|---|---|---|
| nao_planta_a | Foto que não é planta | Olhei com carinho, mas não encontrei uma planta nesta foto. Vamos tentar de novo? Aponte a câmera para as folhas. | 113 | 9 s |
| nao_planta_b | Foto que não é planta, variação | Desta vez não consegui ver uma planta na foto. Tire outra, com a planta bem no meio da tela. | 92 | 8 s |
| foto_ruim_a | Foto escura, tremida ou de longe | A foto ficou um pouco escura ou tremida, e eu não quero errar. Tire outra, com bastante luz e chegando mais perto. | 114 | 9,5 s |
| foto_ruim_b | Foto ruim, variação | Não consegui enxergar bem a sua planta. Vamos repetir? Procure um lugar claro e segure o celular firme. | 103 | 8 s |
| erro_conexao_a | Sem internet ou conexão caiu | Parece que a internet falhou no meio do caminho. Não é culpa sua. Confira a conexão e tente outra vez. | 102 | 9 s |
| erro_conexao_b | Sem internet, variação | A internet caiu antes de eu terminar. Quando o sinal voltar, é só tentar outra vez. | 83 | 7 s |
| erro_geral | Tempo limite de cem segundos ou erro do servidor | Peço desculpas. Hoje não consegui terminar o exame. Tente de novo daqui a um minutinho. | 87 | 7 s |

Subtotal do bloco: 694 caracteres.

### Como as falas da espera se organizam (três trilhas que revezam)

Para a pessoa não ouvir sempre a mesma sequência, a espera tem três trilhas. O app usa uma por consulta, em rodízio (A, B, C, A, B, C). Os tempos acompanham as etapas que já aparecem na tela.

| Trilha | 0,5 s | Meio da espera | Segunda fala do meio | 32 s, se ainda esperando |
|---|---|---|---|---|
| A | espera_inicio_a | espera_folhas_a (9,5 s) | espera_rega_a (21 s) | espera_plano_a |
| B | espera_inicio_b | espera_pragas_a (15 s) | espera_pets_a (26 s) | espera_plano_b |
| C | espera_inicio_c | espera_folhas_b (9,5 s) | espera_canal_a (21 s) | espera_plano_c |

Na primeira consulta da vida, a abertura é espera_primeira_vez e o resto segue a trilha A. Como o laudo costuma chegar entre 25 e 35 s, a fala dos 32 s toca só em parte das consultas, e as de 42, 60 e 82 s são raras.

## 3. Regras de reprodução recomendadas

**Som e respeito ao aparelho**
1. Celular no silencioso ou no vibrar: o Doutor não fala. Volume de mídia em zero: também não, sem insistir.
2. Botão de alto-falante sempre visível na tela de espera, grande, e a escolha fica guardada para as próximas consultas.
3. Se já houver áudio tocando (música, rádio, vídeo, ligação), o Doutor não fala naquela consulta. Não interromper o que a pessoa está ouvindo.
4. Com leitor de tela ligado (TalkBack), a voz gravada fica desligada, para as duas vozes não brigarem.
5. Se o aplicativo for para segundo plano ou a tela apagar, a fala para na hora.

**Ritmo**
6. Uma fala por vez, nunca uma por cima da outra. Mínimo de 3 s de silêncio entre o fim de uma e o começo da seguinte. Se a anterior atrasar, a próxima espera ou é descartada, nunca encavala.
7. No máximo quatro falas nos primeiros 35 s de espera (a trilha já garante isso). A voz ocupa menos da metade do tempo, o resto é silêncio para a pessoa ler o carrossel.
8. A fala do canal (espera_canal_a) nunca toca na primeira consulta e aparece no máximo uma vez a cada três.
9. A fala de demora dos 60 s toca junto com o aviso de demora que já existe na tela, para voz e texto dizerem a mesma coisa.

**Chegada do laudo**
10. Quando o laudo chega, a fila da espera é cancelada. Se houver fala no meio, ela some em meio segundo (diminuindo o volume, sem corte seco). O laudo abre sem esperar a fala terminar.
11. A fala do laudo começa cerca de 0,7 s depois de a tela aparecer.
12. No laudo toca uma fala principal só. Ordem de escolha: laudo_serio, depois laudo_problema, depois laudo_saudavel, e laudo_geral como reserva.
13. Depois da principal, com 1 s de pausa, pode entrar uma complementar, no máximo. A de planta tóxica tem prioridade sobre a da foto marcada.
14. O Doutor nunca lê o laudo inteiro. A voz só recebe a pessoa e aponta para a tela.
15. Se a pessoa rolar a tela, tocar em algum botão ou voltar, a fala diminui e para. Ela já está lendo, a voz não deve atrapalhar.
16. Laudo antigo aberto pelo histórico não tem voz. Só fala no laudo recém-feito.

**Repetição e erros**
17. Nunca tocar a mesma variação duas vezes seguidas. Guardar no aparelho qual foi a última de cada grupo.
18. Fala de erro (foto ruim, não é planta, conexão, erro geral) toca uma vez. Se o mesmo erro se repetir em menos de dois minutos, fica só o texto na tela, para o Doutor não parecer um disco riscado.
19. Tudo o que a voz diz também está escrito na tela. A voz nunca é o único aviso, principalmente o de planta tóxica.

**Arquivos**
20. Os áudios vão dentro do aplicativo, um arquivo por fala, com o id como nome. Assim a fala de erro de conexão funciona mesmo sem internet.
21. Mesmo volume em todos os arquivos, silêncio cortado no começo e no fim, e a abertura já carregada antes de a tela de espera aparecer.

## 4. Totais e perguntas para o Andre

**Total: 36 falas, 2.958 caracteres** (já com todas as variações).

| Bloco | Falas | Caracteres |
|---|---|---|
| A. Espera, abertura | 4 | 392 |
| B. Espera, exame | 6 | 375 |
| C. Espera, reta final | 4 | 233 |
| D. Demora | 3 | 240 |
| E. Laudo, fala principal | 9 | 744 |
| F. Laudo, complementares | 3 | 280 |
| G. Sem laudo (foto ou erro) | 7 | 694 |
| **Total** | **36** | **2.958** |

Para o orçamento da ElevenLabs, contar com três tomadas por fala: perto de 8.900 caracteres. Conferir no painel da conta se isso cabe no saldo do mês antes de gerar.

**O que ainda precisa ser conferido no código antes de gravar.** Não verifiquei campo por campo se o app já distingue todas as situações (saudável, com problema, caso sério, tóxica, não é planta, foto ruim, sem conexão). Se alguma não existir, a fala correspondente fica guardada e o app usa a de reserva.

**Perguntas**
1. Voz: fecha no homem maduro, barítono caloroso (tipo 1), ou quer ouvir os três tipos antes?
2. Quantidade de falas na espera: as três trilhas com até quatro falas cada estão boas, ou prefere mais silêncio (só abertura e reta final)?
3. Fala do canal no meio da espera: mantém uma a cada três consultas, ou tira e deixa o canal só no cartão?
4. Diminutivos ("segundinhos", "prontinho", "pertinho", "bichinhos"): estão no ponto, ou soam infantis para o público?
5. Som já ligado na primeira vez, ou a pessoa precisa tocar no alto-falante para ativar?
6. Aviso de planta tóxica em voz e fala de caso sério: entram nesta primeira gravação?
7. Plano da ElevenLabs: assina o Starter para ter uso comercial e voz brasileira da biblioteca?
8. Lembrete do rascunho anterior: a voz exige build novo com expo-audio, não vai por atualização OTA. Entra no próximo build?
