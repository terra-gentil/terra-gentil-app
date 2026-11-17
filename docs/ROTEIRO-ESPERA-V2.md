# Roteiro da tela de espera v2 (rascunho para o Andre aprovar)

Base: diagnostico no Opus leva de 25 a 35 s (fase 2, 17/11/2026, 12 fotos, media 27 s).
A tela e dividida em duas partes: no alto, foto com laser, etapas do Doutor e contagem;
embaixo, carrossel "Conheca o Terra Gentil". Textos do site: manifesto e slogans de terragentil.com.br.

## 1. Aviso logo na entrada (texto na tela)

> **O Doutor vai examinar sua planta com calma.**
> Leva uns 30 segundos. Enquanto isso, conheça o Terra Gentil.

## 2. Etapas do Doutor (alto da tela)

| Momento | Etapa na tela |
|---|---|
| 0 s | Recebendo a sua foto |
| 3 s | Descobrindo qual é a planta |
| 8 s | Olhando folhas e caule de perto |
| 14 s | Procurando pragas e fungos |
| 20 s | Avaliando luz e rega |
| 25 s | Conferindo se é segura para pets e crianças |
| 30 s | Montando o seu plano de cuidados |
| 35 s em diante | Caprichando nos últimos detalhes |

Contagem embaixo das etapas: "cerca de 25 segundos" que desce até "quase pronto".
Aviso de demora só aos 60 s: "Hoje o Doutor está atendendo muita gente. Mais uns segundinhos."
Tempo limite do app: 100 s.

## 3. Carrossel "Conheça o Terra Gentil" (troca a cada 8 s)

**Cartão 1, quem somos**
> **Seja gentil com a terra**
> O Terra Gentil nasceu em 2022 para ajudar quem quer cuidar de planta sem complicação. Aqui quintais esquecidos viram jardins, e tudo o que a gente ensina é de graça.

**Cartão 2, canal no YouTube**
> **Vídeos novos toda semana**
> Transformações de quintais e tutoriais de jardinagem sem pressa, com o André.
> Botão: **Lembrar de ver o canal** (o link aparece na tela do relatório)

**Cartão 3, ebooks**
> **Mais de 100 guias grátis**
> Do vaso da sala à horta do quintal. Estão na aba Ebooks, prontos para ler no app.

**Cartão 4, comunidade**
> **Você não cuida sozinho**
> Na aba Comunidade, outros cultivadores trocam dicas e fotos. Mostre a sua planta lá depois do diagnóstico.

O "Você sabia?" com as 15 dicas atuais pode entrar como cartão 5 ou ser intercalado.

## 4. Falas do Doutor (ElevenLabs, se aprovado)

Uma voz fixa para o Doutor Gentileza. Som respeita o modo silencioso e tem botão de alto-falante na tela.

1. (0 s) "Oi! Recebi sua foto. Vou examinar com calma, como numa consulta. Leva uns trinta segundinhos."
2. (8 s) "Agora tô olhando as folhas de perto..."
3. (14 s) "Conferindo se tem alguma praga ou fungo escondido."
4. (20 s) "Sabia que o Terra Gentil tem vídeo novo toda semana no YouTube? Depois te mostro o link."
5. (25 s) "Vendo se ela é segura pra pets e crianças."
6. (30 s) "Tô montando o seu plano de cuidados. Quase lá!"
7. (resultado) "Pronto! Seu relatório tá aqui."
8. (60 s, só se demorar) "Hoje tá movimentado no consultório. Só mais uns segundinhos."

## 5. Tela do relatório

Se a pessoa tocou em "Lembrar de ver o canal", aparece no fim do relatório um cartão
"Você pediu para lembrar: conheça o canal Terra Gentil" com o link youtube.com/@TerraGentil.

## Pontos para o Andre decidir

- Texto do cartão 1 (quem somos): está bom ou quer outra mensagem?
- Voz do ElevenLabs entra agora ou depois? Exige build novo (expo-audio), não vai por OTA.
- Desenho: Claude Design ou implementação direta.
