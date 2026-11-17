# Relatorio do agente: Plantix, PictureThis, PlantApp (populares no Brasil) e PlantNet

Ressalva: capturas da Play sao vitrines de marketing; nenhuma mostra a tela de resultado inteira. VI = visto nas imagens, LI = lido em texto. Google Lens: sem material sobre diagnostico de doenca de planta.

## Plantix (144 mil avaliacoes, 4,6, gratis, foco em lavoura)
- VI (plantix/02.png): resultado sobre a camera em 3 cartoes brancos empilhados: selo com icone de alerta amarelo + nome ("Mancha Bacteriana"), "Sintomas" em uma linha, "Tratamento" ja com principio ativo quimico (sem organico visivel no resumo).
- VI (03.png): alerta regional "A doenca ocorreu nas proximidades" com botao azul "Medidas preventivas", cartoes de doenca com selos "Alerta" e "Crescendo".
- VI (05, 06): comunidade com foto de frasco de produto; calculadora de adubo com embalagens.
- LI (biblioteca PT, cochonilha): Resumo, Tambem ocorre em (33 culturas), Sintomas, Recomendacoes separadas em Controle organico (primeiro: cotonete com alcool, neem, inimigos naturais) e Controle quimico (so principios ativos, sem dose, frase de abordagem integrada), O que causou, Medidas preventivas, Compartilhar (WhatsApp primeiro), Outros problemas da cultura.
- LI: loja indiana; dono e empresa de comercializacao de quimicos, risco de conflito de interesse.
- Reclamacoes BR: comunidade sem resposta, nao cobre culturas comuns.

## PictureThis (810 mil, 4,7, pago R$ 199,99/ano)
- VI (picturethis/03.png): foto grande + 2 miniaturas "+3", camera e compartilhar sobre a foto, nome + cientifico em italico + icone de som (pronuncia), "Tambem conhecido como... Mais", abas Visao Geral/Cuidado/Explorar, Informacoes Basicas com toxicidade humanos, pets, potencial de erva daninha.
- VI (05.png): cartao "Causas de doenca" com icone de planta murcha e chips coral (Luz insuficiente, Excesso de agua, Pobre ventilacao, Infectado por doenca). Camera aceita varias fotos.
- VI (08.png): antes/depois com divisor verde. (07.png) toxicidade em 3 colunas com icones vermelhos (humanos, caes, gatos).
- VI (04.png): cronograma com interruptores (Agua em 21 dias, Fertilizar) e ferramentas (calculadora de agua, medidor de luz).
- Reclamacoes: cobranca e renovacao sem aviso, reembolso negado.

## PlantApp (551 mil, 4,6, pago: 3 identificacoes gratis, depois R$ 53/semana)
- VI (plantapp/04.png), de cima para baixo: miniatura redonda da foto ligada por linha ao cabecalho (nome, especie em italico, seta), titulo vermelho com icone "Doencas encontradas!", nome grande da doenca, "Visao geral" em caixa cinza, "Como tratar?" em caixa cinza com receita caseira e DOSE ("1 colher de cha de vinagre por litro") e "ler mais", BOTAO VERDE FIXO NO RODAPE "Pergunte ao botanico". Abas Informacoes/Guia de cuidados; grade Temperatura e Zona; linhas com icone Luz, Solo, Local; medidor de luz na camera.
- VI (06, 07): seguranca pets em 2 cartoes com escudo ("Segura para pessoas", "Toxica para animais"), chat com botanico, "Salvar no meu jardim".
- Reclamacoes: propaganda enganosa, acerta 50%, nao deixa corrigir quando erra.

## PlantNet (contraste, gratis)
- VI (plantnet/03.png): lista de candidatos com fotos de referencia, porcentagem (67%, 29%) e botao "Confirmar".

## Diferenciais da tela de resultado (do agente)
1. Tratamento em dois degraus "Caseiro primeiro" e "Se nao resolver" (Plantix). Selo verde e selo ambar, quimico recolhido. Campo novo: tipo em PassoTratamentoV2 (caseiro, organico comercial, quimico), quimico so com principio ativo.
2. Chips de causa (PictureThis). So design (problemas_detectados.categoria).
3. Prevencao como bloco proprio (Plantix). Campo novo prevencao ou reaproveitar erros_comuns.
4. "Pergunte a comunidade" fixo no rodape (PlantApp cobra botanico; nos de graca). So design.
5. Materiais viram "Onde comprar": chip "tem oferta" quando a aba Promocoes tiver o material generico. Regras: Opus nunca escolhe marca nem ve o catalogo; casamento no app por nome generico; ofertas em faixa separada depois do plano com rotulo "Ofertas parceiras, o diagnostico nao depende delas"; caseiro gratis sempre antes; quimico nunca vira link de compra. Campo novo opcional material_generico_id (lista fechada).
6. Fotos de referencia da doenca. Precisa banco de imagens. Baixa.
7. Antes/depois no retorno. So design, depende do historico.
8. Toxicidade em icones por quem e afetado. So design (afeta ja existe).
9. Compartilhar com WhatsApp primeiro, cartao-imagem. So design.
10. Alerta regional. Backend novo. Baixa.
11. Ouvir o nome (TTS). Baixa.
12. Varias fotos por consulta. API e prompt. Media.
Prioridade do agente: Alta 1, 2, 4, 5, 8. Media 3, 7, 9, 12. Baixa 6, 10, 11.
Posicionamento: os apps de casa populares no Brasil sao pagos e caros, com avaliacoes furiosas por cobranca.

Capturas: /private/tmp/claude-501/-Users-andrehz-Documents-Githubhz-terra-gentil-app/0ad9165e-9a6f-432f-b89c-3b99af6b6785/scratchpad/concorrentes/ plantapp/04.png, picturethis/05.png, picturethis/03.png, picturethis/08.png, plantix/02.png, plantix/03.png, plantnet/03.png; folhas de contato plantix/folha.jpg, picturethis/folha1.jpg, folha2.jpg, plantapp/folha1.jpg, folha2.jpg, plantnet/folha1.jpg.
