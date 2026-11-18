# Roteiro de voz do Doutor Gentileza (rascunho para o Andre aprovar)

Data: 18/11/2026. Nada foi gravado, nenhuma API foi chamada. Este arquivo substitui a seção 4 de
/Users/andrehz/Documents/Githubhz/terra-gentil-app/docs/ROTEIRO-ESPERA-V2.md quando for aprovado.

Versão 2, 18/11/2026: mantidas as 36 falas da versão anterior, com o mesmo texto, e acrescentadas 14 falas de apresentação do Terra Gentil e de chamada para o canal no YouTube. Só mudou o segundo em que algumas falas de exame tocam.

Resumo: 50 falas fixas, 4.449 caracteres no total.

**Para que serve a voz.** Quem cai no aplicativo muitas vezes não conhece o Terra Gentil e não sabe que existe um canal no YouTube. A voz existe para isso: o Doutor se apresenta, conta quem é o Terra Gentil e leva a pessoa para o canal, em toda consulta. As falas de exame continuam, como companhia e ritmo. A espera de 25 a 35 s é o horário nobre.

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

**Recomendação para escutar e escolher.** Ouvir três tipos na biblioteca e decidir pelo ouvido, sempre testando com a fala espera_inicio_a, a primeira_quem_somos (que tem a palavra YouTube) e a laudo_toxica_a (uma leve, uma de convite, uma séria):
1. **Homem maduro, barítono caloroso, estilo narrador de documentário de natureza.** É a minha recomendação. Combina com "Doutor", passa confiança e entende bem no alto-falante do celular.
2. **Homem mais velho, voz um pouco rouca, estilo avô que conta história.** Mais afetuoso, porém mais lento. Bom se o Andre quiser um personagem mais carinhoso do que médico.
3. **Homem de uns 40 anos, sereno, estilo médico jovem atencioso.** Mais claro e ágil. Serve de reserva se as vozes maduras da conta soarem artificiais em português.

Nos ajustes da voz, preferir estabilidade alta e pouco exagero de estilo, para todas as falas soarem como a mesma pessoa no mesmo dia. Gerar 2 ou 3 tomadas de cada fala e escolher a melhor.

**Regras de texto que já estão aplicadas nas falas.**
- Nada de "pro" (lido como PRÓ). Uso "para o" e "para".
- Palavra em inglês só onde é o nome da coisa: "YouTube" e "Ebooks" (nome da aba). As falas com essas palavras estão marcadas na coluna Conferir pronúncia, para ouvir com atenção na primeira gravação. No resto, "pets" virou "bichinhos de estimação" ou "cães e gatos", "app" virou "aplicativo" e "Wi-Fi" virou "internet".
- Nenhum algarismo, nenhuma sigla, nenhuma reticência, nenhum símbolo. Números por extenso.
- "Estou" no lugar de "tô", que a voz pode ler errado e que combina menos com o Doutor.
- "Laudo" no lugar de "relatório", porque a tela do resultado se chama "Laudo do Doutor".
- Frases sem marca de gênero para quem ouve (nada de "fique tranquilo" ou "obrigado por ser cuidadosa").
- Nenhuma fala cita o nome da planta nem o problema específico.
- Os nomes dos botões são ditos exatamente como aparecem na tela: "Lembrar de ver o canal" e "Inscreva-se no canal".
- Nenhuma fala cita o título do último vídeo nem diz "o vídeo mais recente", porque a gravação é fixa e o vídeo muda toda semana. A história do senhor que perdeu o emprego entra como "em um dos nossos vídeos", que continua verdade.
- As chamadas têm jeito de conversa: o Doutor conta o que o Terra Gentil faz e convida. Nada de "não perca", "corra" ou "clique agora".

## 2. Falas

Caracteres contados com espaços e pontuação, do jeito que a ElevenLabs cobra. Duração estimada a 2,5 palavras por segundo, mais 0,3 s de pausa por frase.

### A. Espera, abertura (toca a cada consulta, reveza)

| id | Quando toca | Texto exato enviado à voz | Caracteres | Duração | Conferir pronúncia |
|---|---|---|---|---|---|
| espera_primeira_vez | 0,5 s, só na primeira consulta da pessoa (trilha de apresentação) | Olá, muito prazer. Eu sou o Doutor Gentileza. Vou examinar a sua planta com calma. Leva uns trinta segundinhos. | 111 | 9 s |   |
| espera_inicio_a | 0,5 s, trilha A | Olá! Recebi a sua foto. Vou examinar com calma, como numa consulta. Leva uns trinta segundinhos. | 96 | 7,5 s |   |
| espera_inicio_b | 0,5 s, trilha B | Que bom ver você por aqui. Já estou com a sua foto. Me dê uns trinta segundinhos para examinar direitinho. | 106 | 9 s |   |
| espera_inicio_c | 0,5 s, trilha C | Foto recebida. Fique à vontade, que eu vou olhar a sua planta com toda a calma. | 79 | 7 s |   |

Subtotal do bloco: 392 caracteres.

### B. Espera, exame (acompanha as etapas da tela)

| id | Quando toca | Texto exato enviado à voz | Caracteres | Duração | Conferir pronúncia |
|---|---|---|---|---|---|
| espera_folhas_a | 9,5 s, trilha A (etapa Olhando folhas e caule), reveza com a folhas_b | Agora estou olhando as folhas e o caule, bem de pertinho. | 57 | 4,5 s |   |
| espera_folhas_b | 9,5 s, trilha A, reveza com a folhas_a | Deixa eu ver essas folhas com atenção, uma por uma. | 51 | 4,5 s |   |
| espera_pragas_a | 16,5 s, trilha C (etapa Procurando pragas e fungos) | Estou conferindo se tem alguma praga ou fungo escondido. | 56 | 4 s |   |
| espera_rega_a | 24 s, trilha B (etapa Avaliando luz e rega) | Agora vejo se ela está recebendo luz e água na medida certa. | 60 | 5 s |   |
| espera_canal_a | 9 s, trilha C, em toda consulta dessa trilha. Abre a chamada do canal, e a espera_botao fecha | Enquanto espera, um convite. Tem vídeo novo toda semana no canal do Terra Gentil. | 81 | 6 s |   |
| espera_pets_a | 26,5 s, trilha A (etapa segura para pets e crianças) | Também confiro se ela é segura para crianças e bichinhos de estimação. | 70 | 5 s |   |

Subtotal do bloco: 375 caracteres.

### C. Espera, reta final (só toca se o laudo ainda não chegou)

| id | Quando toca | Texto exato enviado à voz | Caracteres | Duração | Conferir pronúncia |
|---|---|---|---|---|---|
| espera_plano_a | 33 s, trilha A. Na primeira consulta, 45 s | Estou montando o seu plano de cuidados. Falta pouquinho. | 56 | 4 s |   |
| espera_plano_b | 32 s, trilha B | Já estou terminando de escrever o seu laudo. Quase lá. | 54 | 4,5 s |   |
| espera_plano_c | 32 s, trilha C | Só mais um instante. Estou passando tudo a limpo para você. | 59 | 5 s |   |
| espera_detalhes | 42 s, trilhas A, B e C | Estou caprichando nos últimos detalhes. Obrigado pela paciência. | 64 | 4 s |   |

Subtotal do bloco: 233 caracteres.

### D. Demora

| id | Quando toca | Texto exato enviado à voz | Caracteres | Duração | Conferir pronúncia |
|---|---|---|---|---|---|
| demora_a | 60 s, junto com o aviso de demora na tela | Hoje o consultório está cheio. Peço só mais uns segundinhos, já estou terminando. | 81 | 6 s |   |
| demora_b | 60 s, variação | Está demorando um pouco mais do que eu gostaria. Não precisa fazer nada, é só aguardar. | 87 | 7 s |   |
| demora_longa | 82 s, uma vez só | Continuo aqui com a sua planta. Não feche o aplicativo, falta bem pouco. | 72 | 6 s |   |

Subtotal do bloco: 240 caracteres.

### E. NOVO. Espera: apresentação do Terra Gentil e chamada para o canal (toda consulta)

| id | Quando toca | Texto exato enviado à voz | Caracteres | Duração | Conferir pronúncia |
|---|---|---|---|---|---|
| primeira_quem_somos | 10,5 s, primeira consulta, com o cartão Seja gentil com a terra na tela | O Terra Gentil é um canal do YouTube. Desde dois mil e vinte e dois, recuperamos de graça jardins e quintais abandonados de quem não pode pagar. | 144 | 11,5 s | YouTube |
| primeira_canal | 23 s, primeira consulta, com o cartão Vídeos novos toda semana na tela | Tem vídeo novo toda semana. Toque em Lembrar de ver o canal, aqui na tela, e eu deixo o convite no seu laudo. | 109 | 10 s |   |
| primeira_guias | 36 s, primeira consulta, se o laudo ainda não chegou, com o cartão dos guias na tela | E tem mais. Os guias de jardinagem são grátis, aqui mesmo no aplicativo, na aba Ebooks. | 87 | 7 s | Ebooks |
| espera_canal_b | 15,5 s, trilha A, reveza com a canal_d, com o cartão do canal na tela | O Terra Gentil recupera de graça jardins abandonados, e mostra tudo no YouTube. Toque em Lembrar de ver o canal, aqui na tela. | 126 | 10 s | YouTube |
| espera_canal_d | 15,5 s, trilha A, reveza com a canal_b, com o cartão do canal na tela | Sai vídeo novo toda semana no nosso canal no YouTube. Para não esquecer, toque em Lembrar de ver o canal, aqui na tela. | 119 | 10 s | YouTube |
| espera_canal_c | 10,5 s, trilha B, com o cartão do canal na tela | Em um dos nossos vídeos, um senhor perdeu o emprego e o jardim ficou abandonado. Limpamos tudo de graça. Para assistir, toque em Lembrar de ver o canal. | 152 | 12 s |   |
| espera_botao | 21,5 s, trilha C, com o cartão do canal na tela | Para não esquecer, toque em Lembrar de ver o canal, aqui na tela. | 65 | 5,5 s |   |
| lembrar_ok | Na hora em que a pessoa toca em Lembrar de ver o canal, se nenhuma fala estiver tocando | Combinado. O convite vai estar no fim do seu laudo. | 51 | 4,5 s |   |

Subtotal do bloco: 853 caracteres.

### F. Laudo aberto (uma fala por laudo, escolhida pela situação)

| id | Quando toca | Texto exato enviado à voz | Caracteres | Duração | Conferir pronúncia |
|---|---|---|---|---|---|
| laudo_saudavel_a | Laudo sem problema encontrado | Boa notícia. A sua planta está saudável. Deixei no laudo os cuidados para ela continuar assim. | 94 | 7,5 s |   |
| laudo_saudavel_b | Laudo sem problema, variação | Fique em paz, não encontrei nada de errado. O laudo traz as dicas para manter essa saúde. | 89 | 7,5 s |   |
| laudo_saudavel_c | Laudo sem problema, variação | Que beleza de planta. Está bem cuidada. Dê uma olhada no laudo para ela seguir assim. | 85 | 7,5 s |   |
| laudo_problema_a | Laudo com problema encontrado | Prontinho. Encontrei alguns pontos que pedem atenção. Vamos cuidar disso juntos, está tudo explicado no laudo. | 110 | 7,5 s |   |
| laudo_problema_b | Laudo com problema, variação | Terminei o exame. A sua planta precisa de uns cuidados. Vamos com calma, o passo a passo está no laudo. | 103 | 9 s |   |
| laudo_problema_c | Laudo com problema, variação | Pronto. Vi o que está incomodando a sua planta. No laudo eu explico o que fazer, sem pressa. | 92 | 8 s |   |
| laudo_serio | Laudo com o cartão Vale chamar quem entende (caso sério) | Terminei o exame. O caso pede atenção, e quanto antes melhor. No laudo eu mostro por onde começar. | 98 | 8 s |   |
| laudo_geral_a | Reserva, quando o app não souber a situação | Prontinho. O seu laudo está na tela. | 36 | 3,5 s |   |
| laudo_geral_b | Reserva, variação | Terminei. Pode ler o laudo com calma. | 37 | 3,5 s |   |

Subtotal do bloco: 744 caracteres.

### G. Laudo, falas complementares (no máximo uma, entre a fala principal e o convite)

| id | Quando toca | Texto exato enviado à voz | Caracteres | Duração | Conferir pronúncia |
|---|---|---|---|---|---|
| laudo_toxica_a | Planta tóxica, depois da fala principal e antes do convite | Um aviso importante. Esta planta pode fazer mal a crianças, cães e gatos. Deixe fora do alcance deles. | 102 | 8 s |   |
| laudo_toxica_b | Planta tóxica, variação | Atenção a um detalhe. Esta planta é tóxica para crianças e bichinhos. O melhor é deixar num lugar alto. | 103 | 8,5 s |   |
| laudo_foto_marcada | Laudo com marcas na foto, só nas três primeiras vezes e só se não houver aviso de planta tóxica | Marquei na foto onde está cada problema. É só tocar nela para ver de perto. | 75 | 6,5 s |   |

Subtotal do bloco: 280 caracteres.

### H. NOVO. Laudo: convite para o canal (fecha toda consulta que termina em laudo)

| id | Quando toca | Texto exato enviado à voz | Caracteres | Duração | Conferir pronúncia |
|---|---|---|---|---|---|
| convite_a | Depois de laudo saudável ou geral. É a da primeira consulta | Depois, desça até o fim do laudo e toque no botão vermelho, Inscreva-se no canal. Tem vídeo novo toda semana no YouTube. | 120 | 9,5 s | YouTube |
| convite_b | Saudável ou geral, variação | No fim do laudo deixei o nosso último vídeo. Toque em Inscreva-se no canal, para a gente se ver toda semana. | 108 | 9 s |   |
| convite_c | Saudável ou geral, variação | Gostou da consulta? Desça até o fim do laudo e toque em Inscreva-se no canal. É de graça e ajuda muito o Terra Gentil. | 118 | 10,5 s |   |
| convite_cuidado_a | Depois de laudo com problema ou caso sério, sempre após o acolhimento | Cuide dela primeiro. Depois, desça até o fim do laudo e toque em Inscreva-se no canal. Os vídeos ensinam muita coisa. | 117 | 9,5 s |   |
| convite_cuidado_b | Problema ou caso sério, variação | Leia com calma. Quando terminar, desça até o fim e toque em Inscreva-se no canal. Tem vídeo novo toda semana para ajudar você. | 126 | 10 s |   |
| convite_curto | Depois do aviso de planta tóxica, para não alongar | E no fim do laudo, toque em Inscreva-se no canal. | 49 | 4,5 s |   |

Subtotal do bloco: 638 caracteres.

### I. Quando não dá para fazer o laudo

| id | Quando toca | Texto exato enviado à voz | Caracteres | Duração | Conferir pronúncia |
|---|---|---|---|---|---|
| nao_planta_a | Foto que não é planta | Olhei com carinho, mas não encontrei uma planta nesta foto. Vamos tentar de novo? Aponte a câmera para as folhas. | 113 | 9 s |   |
| nao_planta_b | Foto que não é planta, variação | Desta vez não consegui ver uma planta na foto. Tire outra, com a planta bem no meio da tela. | 92 | 8 s |   |
| foto_ruim_a | Foto escura, tremida ou de longe | A foto ficou um pouco escura ou tremida, e eu não quero errar. Tire outra, com bastante luz e chegando mais perto. | 114 | 9,5 s |   |
| foto_ruim_b | Foto ruim, variação | Não consegui enxergar bem a sua planta. Vamos repetir? Procure um lugar claro e segure o celular firme. | 103 | 8 s |   |
| erro_conexao_a | Sem internet ou conexão caiu | Parece que a internet falhou no meio do caminho. Não é culpa sua. Confira a conexão e tente outra vez. | 102 | 9 s |   |
| erro_conexao_b | Sem internet, variação | A internet caiu antes de eu terminar. Quando o sinal voltar, é só tentar outra vez. | 83 | 7 s |   |
| erro_geral | Tempo limite de cem segundos ou erro do servidor | Peço desculpas. Hoje não consegui terminar o exame. Tente de novo daqui a um minutinho. | 87 | 7 s |   |

Subtotal do bloco: 694 caracteres.

### Como as falas da espera se organizam

Toda consulta tem abertura, chamada para o canal antes dos 25 s e uma ou duas falas curtas de exame. Os tempos foram conferidos para nenhuma fala começar com menos de 1 s de silêncio depois da anterior.

**Primeira consulta da vida (apresentação completa)**

| Segundo | Fala | O que diz, em resumo | Cartão do carrossel na tela |
|---|---|---|---|
| 0,5 | espera_primeira_vez | O Doutor se apresenta e avisa dos trinta segundinhos | qualquer um |
| 10,5 | primeira_quem_somos | Quem é o Terra Gentil, canal do YouTube, desde 2022, de graça | Seja gentil com a terra |
| 23 | primeira_canal | Vídeo novo toda semana, toque em Lembrar de ver o canal | Vídeos novos toda semana |
| 36, se ainda esperando | primeira_guias | Guias grátis na aba Ebooks | Mais de 100 guias grátis |
| 45, se ainda esperando | espera_plano_a | Falta pouquinho | qualquer um |

**Quem volta (rodízio A, B, C)**

| Trilha | Abertura, 0,5 s | Depois | Depois | Depois | Reta final, se ainda esperando |
|---|---|---|---|---|---|
| A | espera_inicio_a | espera_folhas_a ou espera_folhas_b (9,5 s) | espera_canal_b ou espera_canal_d (15,5 s) | espera_pets_a (26,5 s) | espera_plano_a (33 s) |
| B | espera_inicio_b | espera_canal_c (10,5 s) | espera_rega_a (24 s) | | espera_plano_b (32 s) |
| C | espera_inicio_c | espera_canal_a (9 s) | espera_pragas_a (16,5 s) | espera_botao (21,5 s) | espera_plano_c (32 s) |

Assim, quem volta ouve uma chamada diferente a cada consulta: o que o Terra Gentil faz (A), a história do senhor que perdeu o emprego (B), o vídeo novo toda semana (A e C). A espera_canal_a da versão anterior agora toca em toda consulta da trilha C, logo depois da abertura. Depois dos 42 s vale o que já existia: espera_detalhes, e as falas de demora aos 60 e 82 s.

**No laudo**

| Situação | Sequência de falas |
|---|---|
| Planta saudável | laudo_saudavel, pausa de 1 s, convite_a, b ou c |
| Com problema | laudo_problema, (laudo_foto_marcada nas três primeiras vezes), pausa de 1 s, convite_cuidado_a ou b |
| Caso sério | laudo_serio, pausa de 1,5 s, convite_cuidado_a ou b |
| Planta tóxica (com ou sem problema) | fala da situação, laudo_toxica, pausa de 1 s, convite_curto |
| App não sabe a situação | laudo_geral, convite_a, b ou c |
| Foto ruim, não é planta, erros | só a fala de orientação, sem convite |

Na primeira consulta, o convite é sempre o convite_a (ou o convite_cuidado_a, se houver problema), que é o mais explicado.

## 3. Regras de reprodução recomendadas

**Som e respeito ao aparelho**
1. Celular no silencioso ou no vibrar: o Doutor não fala. Volume de mídia em zero: também não, sem insistir.
2. Botão de alto-falante sempre visível na tela de espera, grande, e a escolha fica guardada para as próximas consultas.
3. Se já houver áudio tocando (música, rádio, vídeo, ligação), o Doutor não fala naquela consulta.
4. Com leitor de tela ligado (TalkBack), a voz gravada fica desligada, para as duas vozes não brigarem.
5. Se o aplicativo for para segundo plano ou a tela apagar, a fala para na hora.

**Ritmo**
6. Uma fala por vez, nunca uma por cima da outra. Mínimo de 1 s de silêncio entre o fim de uma e o começo da seguinte. Se a anterior atrasar, a próxima espera.
7. Se faltar tempo, quem cai é a fala de exame, nunca a chamada do canal. A chamada tem prioridade na fila.
8. A chamada para o canal toca em toda consulta e sempre começa antes dos 25 s, que é quando o laudo pode chegar.
9. A fala de demora dos 60 s toca junto com o aviso de demora que já existe na tela.

**Voz amarrada à tela**
10. Quando começa uma fala que cita um cartão, o carrossel pula para esse cartão e fica parado nele até 4 s depois do fim da fala. Fala de quem somos: cartão "Seja gentil com a terra". Chamada do canal: cartão "Vídeos novos toda semana". Fala dos guias: cartão dos guias.
11. Durante a chamada do canal, o botão "Lembrar de ver o canal" pulsa de leve, para a pessoa achar onde tocar.
12. Tocou no botão: toca lembrar_ok, se não houver outra fala no ar. Nas consultas seguintes em que o botão já estiver marcado, a trilha continua igual (o convite para assistir continua valendo).
13. O texto do botão depois do toque hoje diz "O link vai no seu relatório". Sugiro trocar para "no seu laudo", para bater com a voz.

**Chegada do laudo**
14. Quando o laudo chega, a fila da espera é cancelada. Se houver fala no meio, ela some em meio segundo, sem corte seco, e o laudo abre sem esperar. Se a chamada do canal foi cortada, não tem problema: o convite do fim do laudo cobre.
15. A fala do laudo começa cerca de 0,7 s depois de a tela aparecer.
16. Ordem no laudo: fala principal da situação (laudo_serio, laudo_problema, laudo_saudavel ou laudo_geral), depois no máximo uma complementar (planta tóxica tem prioridade sobre foto marcada), depois o convite. No caso sério ou com problema, o convite nunca vem antes do acolhimento e da orientação.
17. O Doutor nunca lê o laudo inteiro. A voz recebe, orienta e convida. No total, de 15 a 25 s.
18. Rolar a tela não corta a voz (mudou em relação à versão anterior, senão o convite quase nunca seria ouvido). A voz para se a pessoa tocar em qualquer botão, voltar, ou tocar no alto-falante.
19. Se a pessoa chegar ao cartão do canal no fim do laudo enquanto o convite ainda não tocou, o convite é dispensado: ela já está lá.
20. Laudo antigo aberto pelo histórico não tem voz.

**Repetição e erros**
21. Nunca tocar a mesma variação duas vezes seguidas. Guardar no aparelho qual foi a última de cada grupo e em que trilha a pessoa está.
22. Fala de erro toca uma vez. Se o mesmo erro se repetir em menos de dois minutos, fica só o texto na tela. Erro nunca leva convite para o canal.
23. Tudo o que a voz diz também está escrito na tela. A voz nunca é o único aviso, principalmente o de planta tóxica.

**Arquivos**
24. Os áudios vão dentro do aplicativo, um arquivo por fala, com o id como nome.
25. Mesmo volume em todos os arquivos, silêncio cortado no começo e no fim, e a abertura já carregada antes de a tela de espera aparecer.

## 4. Totais e perguntas para o Andre

**Total: 50 falas, 4.449 caracteres** (36 falas anteriores com 2.958 caracteres, mais 14 novas com 1.491).

| Bloco | Falas | Caracteres |
|---|---|---|
| A. Espera, abertura | 4 | 392 |
| B. Espera, exame | 6 | 375 |
| C. Espera, reta final | 4 | 233 |
| D. Demora | 3 | 240 |
| E. NOVO. Espera: apresentação do Terra Gentil e chamada para o canal | 8 | 853 |
| F. Laudo aberto | 9 | 744 |
| G. Laudo, falas complementares | 3 | 280 |
| H. NOVO. Laudo: convite para o canal | 6 | 638 |
| I. Quando não dá para fazer o laudo | 7 | 694 |
| **Total** | **50** | **4.449** |

Para o orçamento da ElevenLabs, contar com três tomadas por fala: perto de 13.300 caracteres. Conferir no painel da conta se isso cabe no saldo do mês antes de gerar.

**O que ainda precisa ser conferido no código antes de gravar.** Não verifiquei campo por campo se o app já distingue todas as situações (saudável, com problema, caso sério, tóxica, não é planta, foto ruim, sem conexão), nem se o cartão do canal aparece no fim de todo laudo. Se o cartão não aparecer em algum caso, o convite não deve tocar nele.

**Perguntas**
1. Voz: fecha no homem maduro, barítono caloroso (tipo 1), ou quer ouvir os três tipos antes?
2. Som já ligado na primeira vez? Agora que a voz é o caminho para o canal, recomendo ligado por padrão, respeitando o modo silencioso.
3. Se o laudo chegar no meio da chamada do canal: o laudo abre na hora e corta a fala (minha recomendação, porque o convite do laudo cobre), ou o app segura o laudo até 3 s para a frase terminar?
4. "O Terra Gentil é um canal do YouTube" está certo como apresentação, ou prefere outra definição (projeto, família, turma)?
5. A história fixa "um senhor perdeu o emprego e o jardim ficou abandonado" pode ficar para sempre na gravação, ou prefere regravar essa fala de tempos em tempos com um vídeo mais novo?
6. Diminutivos ("segundinhos", "prontinho", "pertinho", "bichinhos"): estão no ponto, ou soam infantis para o público?
7. Plano da ElevenLabs: assina o Starter para ter uso comercial e voz brasileira da biblioteca?
8. A voz exige build novo com expo-audio, não vai por atualização OTA. Entra no próximo build?
