"""
Schema JSON do relatorio v2, usado na saida estruturada do Claude (output_config.format).

Copiado da secao 3 de docs/PROPOSTA-DIAGNOSTICO-V2.md. Para atualizar, cole o JSON novo
no bloco abaixo sem mexer na formatacao: o texto precisa ser estavel entre chamadas
para nao invalidar o cache de prompt e o cache de compilacao do schema.
"""
import json

_SCHEMA_V2_JSON = r"""
{
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "versao_relatorio": {
      "type": "string",
      "enum": ["v2"],
      "description": "Versao do formato do relatorio. Sempre v2."
    },
    "eh_planta": {
      "type": "boolean",
      "description": "true se a imagem mostra uma planta viva ou parte dela (folha, flor, fruto no pe, muda)."
    },
    "foto": {
      "type": "object",
      "additionalProperties": false,
      "description": "Avaliacao da foto recebida.",
      "properties": {
        "qualidade": {
          "type": "string",
          "enum": ["boa", "aceitavel", "ruim"],
          "description": "boa: da para analisar com seguranca. aceitavel: da para analisar com ressalvas. ruim: a analise fica comprometida."
        },
        "problemas": {
          "type": "array",
          "description": "Problemas da foto que atrapalham a analise. Lista vazia se nao houver.",
          "items": {
            "type": "string",
            "enum": [
              "desfocada",
              "escura",
              "estourada",
              "contraluz",
              "longe_demais",
              "perto_demais",
              "planta_cortada",
              "varias_plantas",
              "obstruida"
            ]
          }
        },
        "o_que_aparece": {
          "type": "string",
          "description": "Uma frase dizendo o que se ve na imagem. Se nao for planta, diga o que e."
        },
        "dica_proxima_foto": {
          "type": "string",
          "description": "Dica pratica para uma foto melhor. Vazio se a qualidade for boa."
        }
      },
      "required": ["qualidade", "problemas", "o_que_aparece", "dica_proxima_foto"]
    },
    "leitura_foto": {
      "type": "array",
      "description": "O que foi observado na foto, um item por aspecto visivel. Aspectos que nao aparecem na foto ficam de fora.",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "aspecto": {
            "type": "string",
            "enum": [
              "folhas",
              "caule_e_ramos",
              "flores_e_frutos",
              "solo",
              "vaso",
              "ambiente_e_luz"
            ]
          },
          "observacao": {
            "type": "string",
            "description": "O que se ve, de forma concreta e especifica desta foto."
          },
          "sinal": {
            "type": "string",
            "enum": ["bom", "neutro", "atencao", "ruim"]
          }
        },
        "required": ["aspecto", "observacao", "sinal"]
      }
    },
    "especie_identificada": {
      "type": "string",
      "description": "Nome cientifico. Se so der para chegar ao genero, use o genero seguido de sp."
    },
    "nome_popular": {
      "type": "string",
      "description": "Nome popular mais usado no Brasil."
    },
    "confianca": {
      "type": "number",
      "description": "Confianca na identificacao, de 0 a 1."
    },
    "identificacao": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "nivel_confianca": {
          "type": "string",
          "enum": ["alta", "media", "baixa", "nao_aplicavel"]
        },
        "como_reconheci": {
          "type": "string",
          "description": "Caracteristicas visiveis que levaram a identificacao."
        },
        "outros_nomes": {
          "type": "array",
          "description": "Outros nomes populares usados no Brasil. Lista vazia se nao houver.",
          "items": {"type": "string"}
        },
        "alternativas": {
          "type": "array",
          "description": "Ate 2 especies parecidas que tambem poderiam ser. Lista vazia quando a confianca e alta.",
          "items": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
              "nome_popular": {"type": "string"},
              "especie": {"type": "string"},
              "como_diferenciar": {
                "type": "string",
                "description": "O que o usuario pode observar na planta para tirar a duvida."
              }
            },
            "required": ["nome_popular", "especie", "como_diferenciar"]
          }
        }
      },
      "required": ["nivel_confianca", "como_reconheci", "outros_nomes", "alternativas"]
    },
    "estado_saude": {
      "type": "string",
      "enum": ["saudavel", "atencao", "doente", "critico", "nao_aplicavel"]
    },
    "diagnostico_titulo": {
      "type": "string",
      "description": "Titulo curto do veredito."
    },
    "diagnostico_explicacao": {
      "type": "string",
      "description": "Paragrafo curto explicando o veredito em linguagem simples."
    },
    "problemas_detectados": {
      "type": "array",
      "description": "Problemas encontrados, do mais grave para o menos grave. Lista vazia se a planta esta saudavel.",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "descricao": {
            "type": "string",
            "description": "Nome curto do problema."
          },
          "gravidade": {
            "type": "string",
            "enum": ["baixa", "media", "alta"]
          },
          "causa_provavel": {
            "type": "string",
            "description": "Causa mais provavel, em uma frase."
          },
          "categoria": {
            "type": "string",
            "enum": [
              "rega_excesso",
              "rega_falta",
              "luz_excesso",
              "luz_falta",
              "praga",
              "fungo_ou_bacteria",
              "nutricao",
              "raiz_ou_vaso",
              "clima",
              "dano_fisico",
              "envelhecimento_natural",
              "outro"
            ]
          },
          "evidencia_visual": {
            "type": "string",
            "description": "O que na foto sustenta este problema."
          },
          "como_confirmar": {
            "type": "string",
            "description": "Teste simples que o usuario pode fazer em casa para confirmar. Vazio se a foto ja deixa claro."
          },
          "contagioso": {
            "type": "boolean",
            "description": "true se pode passar para outras plantas proximas."
          }
        },
        "required": [
          "descricao",
          "gravidade",
          "causa_provavel",
          "categoria",
          "evidencia_visual",
          "como_confirmar",
          "contagioso"
        ]
      }
    },
    "plano_tratamento": {
      "type": "string",
      "description": "Resumo do plano em 1 ou 2 frases."
    },
    "plano_timeline": {
      "type": "array",
      "description": "Passos do plano em ordem cronologica.",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "etapa": {
            "type": "string",
            "description": "Rotulo de tempo curto, como Hoje, Proximos 3 dias, Em 1 semana."
          },
          "acao": {
            "type": "string",
            "description": "O que fazer, em uma frase curta."
          },
          "dia_inicio": {
            "type": "integer",
            "description": "Em quantos dias a partir de hoje este passo comeca. 0 significa hoje."
          },
          "como_fazer": {
            "type": "string",
            "description": "Como executar o passo, para quem nunca fez."
          },
          "por_que": {
            "type": "string",
            "description": "Motivo do passo, em uma frase."
          },
          "materiais": {
            "type": "array",
            "description": "Itens necessarios. Lista vazia se nao precisar de nada.",
            "items": {"type": "string"}
          }
        },
        "required": ["etapa", "acao", "dia_inicio", "como_fazer", "por_que", "materiais"]
      }
    },
    "acompanhamento": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "prazo_melhora": {
          "type": "string",
          "description": "Em quanto tempo esperar melhora visivel. Vazio se a planta esta saudavel."
        },
        "sinais_melhora": {
          "type": "array",
          "description": "Sinais de que o tratamento esta funcionando, ou de que a planta segue bem.",
          "items": {"type": "string"}
        },
        "sinais_piora": {
          "type": "array",
          "description": "Sinais de alerta que pedem nova avaliacao.",
          "items": {"type": "string"}
        },
        "retorno_em_dias": {
          "type": "integer",
          "description": "Em quantos dias tirar nova foto para reavaliar. 0 se nao for necessario."
        }
      },
      "required": ["prazo_melhora", "sinais_melhora", "sinais_piora", "retorno_em_dias"]
    },
    "precisa_retorno": {
      "type": "boolean",
      "description": "true se ha problema a acompanhar."
    },
    "mensagem_retorno": {
      "type": "string",
      "description": "Frase convidando a voltar e dizendo o que sera conferido. Vazio se precisa_retorno for false."
    },
    "ajuda_profissional": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "recomendada": {"type": "boolean"},
        "motivo": {
          "type": "string",
          "description": "Por que procurar ajuda presencial e de quem. Vazio se nao recomendada."
        }
      },
      "required": ["recomendada", "motivo"]
    },
    "toxica_para_pets": {
      "type": "boolean",
      "description": "true se a planta oferece risco para caes ou gatos, ou se o risco e desconhecido."
    },
    "toxicidade_detalhes": {
      "type": "string",
      "description": "Explicacao breve do risco. Vazio se nao for toxica."
    },
    "toxicidade": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "nivel": {
          "type": "string",
          "enum": ["nao_toxica", "leve", "moderada", "grave", "desconhecida", "nao_aplicavel"]
        },
        "afeta": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": ["caes", "gatos", "criancas", "adultos"]
          }
        },
        "partes_toxicas": {
          "type": "string",
          "description": "Quais partes da planta oferecem risco."
        },
        "sintomas": {
          "type": "string",
          "description": "Sintomas mais comuns em caso de ingestao ou contato."
        },
        "o_que_fazer": {
          "type": "string",
          "description": "Prevencao e o que fazer em caso de ingestao."
        }
      },
      "required": ["nivel", "afeta", "partes_toxicas", "sintomas", "o_que_fazer"]
    },
    "nivel_luz": {
      "type": "string",
      "enum": ["sol_pleno", "meia_sombra", "indireta_brilhante", "sombra", "nao_aplicavel"],
      "description": "Luz que a especie precisa."
    },
    "rega_dias": {
      "type": "integer",
      "description": "Intervalo medio de rega em dias, de 1 a 60. 0 se nao for planta."
    },
    "rega_condicao": {
      "type": "string",
      "description": "Como saber a hora de regar, olhando o solo ou a planta."
    },
    "temperatura_ideal": {
      "type": "string",
      "description": "Faixa de temperatura ideal, como 18 a 27 graus."
    },
    "nivel_dificuldade": {
      "type": "string",
      "enum": ["facil", "medio", "dificil", "nao_aplicavel"]
    },
    "luz_porcentagem": {
      "type": "integer",
      "description": "Luz do ambiente onde a planta esta, estimada pela foto. 0 muito escuro, 100 sol direto."
    },
    "luz_veredito": {
      "type": "string",
      "description": "Frase curta comparando a luz do ambiente com o que a especie precisa."
    },
    "cuidados": {
      "type": "object",
      "additionalProperties": false,
      "description": "Ficha de cuidados da especie.",
      "properties": {
        "rega": {"type": "string"},
        "luz_e_local": {
          "type": "string",
          "description": "Luz ideal e o melhor lugar da casa para a planta."
        },
        "solo_e_vaso": {"type": "string"},
        "adubacao": {"type": "string"},
        "poda_e_limpeza": {"type": "string"},
        "como_fazer_mudas": {"type": "string"},
        "erros_comuns": {
          "type": "array",
          "description": "Erros frequentes com esta especie.",
          "items": {"type": "string"}
        }
      },
      "required": [
        "rega",
        "luz_e_local",
        "solo_e_vaso",
        "adubacao",
        "poda_e_limpeza",
        "como_fazer_mudas",
        "erros_comuns"
      ]
    },
    "calendario_cuidados": {
      "type": "array",
      "description": "Rotina de cuidados da especie, da tarefa mais frequente para a menos frequente.",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "frequencia": {
            "type": "string",
            "enum": [
              "semanal",
              "quinzenal",
              "mensal",
              "trimestral",
              "semestral",
              "anual",
              "quando_necessario"
            ]
          },
          "tarefa": {"type": "string"}
        },
        "required": ["frequencia", "tarefa"]
      }
    },
    "curiosidades": {
      "type": "array",
      "description": "Fatos interessantes sobre a especie.",
      "items": {"type": "string"}
    },
    "ebooks_recomendados": {
      "type": "array",
      "description": "Ate 2 ebooks do catalogo fornecido, ligados a planta ou ao problema. Lista vazia se nenhum for realmente relevante.",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "id": {
            "type": "string",
            "description": "Codigo copiado exatamente do catalogo, como TG074 ou ebook-02."
          },
          "motivo": {
            "type": "string",
            "description": "Uma frase dizendo por que este ebook ajuda neste caso."
          }
        },
        "required": ["id", "motivo"]
      }
    }
  },
  "required": [
    "versao_relatorio",
    "eh_planta",
    "foto",
    "leitura_foto",
    "especie_identificada",
    "nome_popular",
    "confianca",
    "identificacao",
    "estado_saude",
    "diagnostico_titulo",
    "diagnostico_explicacao",
    "problemas_detectados",
    "plano_tratamento",
    "plano_timeline",
    "acompanhamento",
    "precisa_retorno",
    "mensagem_retorno",
    "ajuda_profissional",
    "toxica_para_pets",
    "toxicidade_detalhes",
    "toxicidade",
    "nivel_luz",
    "rega_dias",
    "rega_condicao",
    "temperatura_ideal",
    "nivel_dificuldade",
    "luz_porcentagem",
    "luz_veredito",
    "cuidados",
    "calendario_cuidados",
    "curiosidades",
    "ebooks_recomendados"
  ]
}
"""

DIAGNOSTICO_V2_JSON_SCHEMA: dict = json.loads(_SCHEMA_V2_JSON)
