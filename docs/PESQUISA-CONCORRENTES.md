# Pesquisa de concorrentes: tela de resultado do diagnostico (17/11/2026)

Nove apps analisados pelas capturas oficiais da Google Play e da App Store (BR) e por avaliacoes: Plantix, PictureThis, PlantApp, PlantNet, Plantum, Blossom, Planta, Greg e PlantIn. Relatorios completos e capturas de referencia em /Users/andrehz/Documents/Githubhz/terra-gentil-app/docs/concorrentes. Ressalva: as capturas sao de marketing e nenhuma mostra a tela de resultado inteira.

Recomendacao abaixo feita por um agente Fable sobre os tres relatorios. AINDA PRECISA DA APROVACAO DO ANDRE.

## A. Veredito

Cara de "laudo do Doutor que mostra o que viu e manda voce agir hoje": cartao de veredito curto no topo (estilo Blossom), a prova na foto e o plano em dois degraus, caseiro primeiro. Promessa: confianca sem cobranca. So o Terra Gentil mostra evidencia, como confirmar, sinais de melhora e piora, gratis, em portugues, sem assinatura. Dos concorrentes, trazer a forma (chips, numeros, botao fixo) e deixar de fora as ferramentas de camera.

Os concorrentes populares no Brasil sao pagos (de R$ 40 por semana a R$ 200 por ano) e as avaliacoes reclamam de cobranca, de falta de portugues e de tratamento generico.

## B. O que entra nesta versao (por prioridade)

| # | Item | Vem de | Design ou campo | Posicao |
|---|---|---|---|---|
| 1 | Cartao de veredito: foto redonda, rotulo de estado colorido, nome grande, uma frase, botao "Ver o plano" | Blossom, PlantApp | Design | Topo |
| 2 | Chips de causa (coral ou ambar), toque rola ate o problema | PictureThis, Planta | Design (problemas_detectados.categoria) | Dentro do veredito |
| 3 | Plano em dois degraus: "Caseiro" (verde) e "Se nao resolver" (ambar), quimico recolhido, so principio ativo, sem link | Plantix, PictureThis | Campo novo PassoTratamentoV2.tipo: manejo, caseiro, organico, quimico | Bloco Plano |
| 4 | Barra fixa: Perguntar a comunidade (foto e veredito preenchidos), Compartilhar, Nova foto | PlantApp (la e pago) | Design | Rodape fixo |
| 5 | Tres chips-resumo com icone: luz, rega, pets | Greg | Design | Abaixo do veredito |
| 6 | Rega em quantidade: "≈ 300 ml a cada 4 dias, vaso de uns 20 cm", sempre como aproximado | Greg, PlantIn, Blossom | Campos novos rega_ml (int) e vaso_estimado_cm (int), 0 = nao se aplica | Chip de rega e ficha |
| 7 | Luz "Onde esta" x "Do que precisa", barra em degrade com dois marcadores | PlantIn | Design (luz_porcentagem, nivel_luz) | O que o Doutor viu |
| 8 | Toxicidade em icones (cao, gato, crianca) | PictureThis, PlantApp | Design (toxicidade.afeta) | Chip 3 e cartao |
| 9 | "Para nao voltar": prevencao | Plantix | Campo novo acompanhamento.como_evitar (1 frase) | Fim do Acompanhamento |
| 10 | Selo "Gratis, sem assinatura, em portugues" | Queixa geral | Design | Rodape e compartilhar |
| 11 | "Onde encontrar": materiais casados com a aba Promocoes, faixa separada, rotulo "Ofertas parceiras. O diagnostico nao depende delas", quimico nunca casa | Plantix (ao contrario) | Design, casamento no app por nome | Depois de Ebooks |
| 12 | "Me avise em N dias" | PictureThis, Planta | Design se o build publicado tiver expo-notifications (conferir); reserva: link do Google Agenda | Acompanhamento |

Campos novos: cerca de 80 tokens.

## C. Enxugar para pagar (campos v1 que o backend passa a preencher)

| Corte | Tokens |
|---|---|
| calendario_cuidados sai (repete cuidados e rega_dias) | 155 |
| cuidados.rega e cuidados.luz_e_local saem | 80 |
| cuidados.erros_comuns com 1 item | 25 |
| leitura_foto com no maximo 3 itens nao neutros | 100 |
| toxicidade_detalhes montado pelo backend | 50 |
| mensagem_retorno e precisa_retorno derivados de retorno_em_dias | 55 |
| plano_timeline.por_que so no primeiro passo | 70 |
| foto.o_que_aparece e dica_proxima_foto so quando a foto nao e boa | 80 |
| curiosidades com exatamente 1 | 15 |

Cerca de 630 tokens a menos contra 80 a mais: uns 18% menos texto, uns 5 s a menos e menos chance de JSON quebrado. Nao cortar evidencia_visual, como_confirmar, como_fazer, sinais_melhora e sinais_piora (sao o diferencial).

## D. Ordem da tela

1. Cabecalho (fixo). 2. Foto com selo de confianca. 3. Aviso de foto, so quando nao e boa. 4. Cartao de veredito com chips de causa; "Como reconheci" e "Tambem conhecida como" recolhidos. 5. "Tambem pode ser", aberto so com confianca media ou baixa. 6. Tres chips-resumo. 7. Toxicidade em destaque, so moderada ou grave. 8. Problemas (primeiro aberto com evidencia e "Para confirmar"). 9. Plano em dois degraus (primeiro passo aberto, quimico sempre recolhido). 10. Acompanhamento com "Para nao voltar" e lembrete. 11. Ajuda profissional com ponte para a comunidade, so quando recomendada. 12. Leia de graca (ebooks). 13. Onde encontrar (ofertas, no maximo 2). 14. O que o Doutor viu, com a barra de luz (recolhido; sobe para depois do 6 quando a planta esta saudavel). 15. Ficha de cuidados com rega em ml (recolhida). 16. Toxicidade leve ou nenhuma em uma linha. 17. Voce sabia?. 18. Rodape com aviso de IA e selo Gratis. 19. Barra fixa.

## E. Segunda etapa

Marcacao do problema na foto (lupa); ate 3 fotos por consulta; antes e depois na foto de retorno (depende do historico); compartilhar como cartao-imagem (react-native-view-shot nao instalado); lembretes recorrentes e "Hospital"; fotos de referencia da doenca; alerta regional, medidor de luz, medicao de vaso com realidade aumentada, ajuste pela estacao com localizacao.

## F. O que nao trazer

Porcentagem de acerto (precisao falsa); titulo vermelho alarmista; quimico no resumo e produto junto do tratamento; especialista pago e PDF do botanico; mascote, XP e planta que fala; etiquetas, tabela botanica, mapa; pronuncia em audio e abas no resultado; material_generico_id no relatorio.

## G. Capturas para o Claude Design (em docs/concorrentes)

1. blossom-ios_05.jpg: cartao de veredito, modelo do topo.
2. plantapp-04.png: miniatura ligada ao cabecalho e botao verde fixo (sem o titulo vermelho).
3. picturethis-05.png: chips coral de causa.
4. greg-as_02.jpg: tres chips com icone grande.
5. picturethis-ios_09.jpg: opcoes de remedio caseiro com passos numerados.
6. plantin-ios_folha2.jpg: luz atual x necessaria com barra em degrade.
7. picturethis-ios_04.jpg: toxicidade em faixa e cartoes com botao de lembrete.
8. plantum-ios_03.jpg: lupa sobre a folha (referencia da segunda etapa).
