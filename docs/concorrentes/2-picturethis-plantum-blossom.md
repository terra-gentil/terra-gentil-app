# Relatorio do agente: PictureThis, Plantum, Blossom

Vistas de verdade: PictureThis 16 capturas Play + 10 App Store, Plantum 10 App Store (so iOS), Blossom 8 Play + 10 App Store. Sao recortes de marketing; nenhuma mostra a tela de resultado inteira. Arquivos deste agente comecam com play_ e ios_.

## PictureThis (R$ 199,90/ano)
Identificacao (visto): galeria (foto grande + 2 miniaturas "+3"), voltar/camera/compartilhar sobre a foto; folha branca com nome em negrito, cientifico em italico, alto-falante de pronuncia, "Tambem conhecido como" + "Mais", icone de editar; abas Visao Geral/Cuidado/Explorar; Informacoes Basicas com toxicidade humanos/animais e potencial de erva daninha; mapa de distribuicao, ciclo de vida.
Cartao de cuidados (ios_04): faixa de toxicidade com icone vermelho; pilulas "Sol pleno" e "7 a 99 °C"; cartoes "A cada 14 dias, Regar" e "A cada 7 dias, Fertilizante" com botao verde "Adicionar Lembrete"; "Esta planta parece saudavel!" com "Salvar no Meu Jardim" (check de saude embutido). Barra fixa no rodape: Novo, Compartilhar, + Salvar no Meu Jardim.
Ferramentas em cartoes coloridos: azul "Medidor de Luz: Luz insuficiente"; vermelho "Verificador de Replantio: Vaso muito pequeno, precisa ser replantado!"; "Calculadora de Agua: ≈ 25 mm por rega".
Diagnostico (visto): ate 3 fotos; cartao "Causas de doenca" com chips coral; toxicidade em 3 quadradinhos (humanos, caes, gatos); selos "Ervas Daninhas"/"Toxico"; tela de tratamento "Use remedios caseiros": "Opcao 1: Agua com Sabao", "Opcao 2: Oleo Vegetal", passos numerados, ilustracao com circulos numerados (copo "1 litro", borrifador). Antes/depois com controle deslizante.
Reclamacoes: cobranca/renovacao sem aviso, diagnosticos errados ("fiz tudo e morreram"), falta de portugues, bug no calendario.

## Plantum (so iOS, R$ 39,90/semana)
Visto: diagnostico abre com faixa coral "Abiotico" explicando estresse abiotico; LUPA circular destacando a folha afetada na foto. Aba Diagnostique: "Verifique sua planta" (Beta, "Tire fotos"), carrossel "Problemas comuns" com fotos reais, cartao "Pergunte ao Especialista". Ficha: chips "Toxica para animais" (rosa), "Facil", "Alta", "Florifera", "Medicinal"; galeria; "Adicionar a Minhas Plantas". Varias plantas numa foto com baloes. "Pote Medidor" em realidade aumentada (19 x 12 cm, Calcular Volume).
Reclamacoes: cobranca apos cancelar, golpe.

## Blossom (sem portugues)
Visto: cartao de doenca com foto redonda, "Sick plant" em vermelho pequeno, nome em serifa grande, frase "Overwatering and nutrient deficiency detected", pilula verde "Cure"; aba lateral lilas "Baseado em IA"; chip "Disease: Root Rot / Cause: Overwatering" com lupa sobre a folha. Identificacao: ate 3 fotos, selo coral "Best Match", 3 quadradinhos "Care: Easy", "Water: every 10-14 days", "Sun: Part", tabela listrada (tipo, tamanho adulto, sol, solo, pH, floracao, cor, origem, toxicidade), "Reminder is set". Medidor de luz em barra vertical com gradiente "PARTIAL SUN (1.001 a 5.000 lux)". Calculadora "≈ 450 ml por rega, vaso medio". Visual suave: verde-menta, serifa, cantos arredondados.
Pago: trava na 3a planta; diagnostico ilimitado e calculadora premium. Reclamacoes: sem portugues, erra a mesma foto, "tratamento pior ainda", paywall.

## O que eles dao e o Terra Gentil nao
Varias fotos; fotos de referencia da especie e das alternativas; agua em ml, temperatura em numeros, lux; etiquetas rapidas (facil, florifera, invasora); toxicidade em icones (temos afeta, so design); opcoes alternativas de tratamento (caseira x comprada); prevencao especifica; lupa na area afetada; acoes no proprio resultado (lembrete, salvar, compartilhar, especialista); antes/depois.
O Terra Gentil ja da e eles nao mostram: evidencia visual, como confirmar, gravidade, contagioso, linha do tempo com dias, sinais de melhora e piora, ajuda profissional, qualidade da foto, "como reconheci". Gratis e em pt-BR.

## Diferenciais (do agente)
Alta: 1 cartao veredito estilo Blossom (foto redonda, rotulo de estado, nome grande, frase "X detectado", botao "Ver tratamento"), so design. 2 chips de causa + faixa do tipo (Ambiente, Fungo, Praga), so design. 3 botao "Lembrar" em cada passo e cartao de rega/adubo, so design. 4 toxicidade em 3 icones, so design. 5 opcoes de tratamento lado a lado (caseira, comprada), campo novo opcoes_tratamento[] com tipo/passos/materiais. 6 selo "Gratis, sem assinatura, em portugues", so design.
Media: 7 etiquetas da planta (enum fechado), campo novo. 8 rega em numeros (≈ 300 ml, vaso medio) e temperatura min/max, campos novos. 9 como_prevenir em ProblemaDetectadoV2. 10 compartilhar como cartao e salvar fixos no rodape. 11 "Pergunte a comunidade".
Baixa: 12 lupa (regiao_afetada x,y,w,h; precisao do Opus incerta). 13 ate 3 fotos. 14 antes/depois. 15 foto de referencia nas alternativas. 16 pronuncia TTS.

Capturas (pasta concorrentes/): picturethis/play_02.png, play_04.png, play_06.png, ios_04.jpg, ios_09.jpg, ios_07.jpg; plantum/ios_03.jpg, ios_06.jpg, ios_08.jpg; blossom/ios_05.jpg, play_07.png, play_08.png, ios_10.jpg, play_01.png. Folhas sheet_*.jpg em cada pasta.
