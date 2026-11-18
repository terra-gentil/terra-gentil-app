import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  LayoutChangeEvent,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Camera, Droplets, Leaf, Lightbulb, PawPrint, ShieldCheck, Sun } from "lucide-react-native";
import { DiagnosticoResponse } from "../../api/diagnostico";
import { COLORS, FONTS } from "../../constants/theme";
import { consumirLembrarCanal } from "../../storage/preferencias";
import { getToken } from "../../storage/auth";
import { Ebook } from "../../data/ebooks";
import { ofertasParaMateriais } from "../../data/ofertas";
import EbookViewerModal from "./EbookViewerModal";
import NovaPostagemModal from "./NovaPostagemModal";
import LoginModal from "./LoginModal";
import CartaoVeredito from "./resultado/CartaoVeredito";
import CartaoProblema from "./resultado/CartaoProblema";
import ToxicidadeDestaque from "./resultado/ToxicidadeDestaque";
import PlanoCuidado from "./resultado/PlanoCuidado";
import Acompanhamento from "./resultado/Acompanhamento";
import LeiaDeGraca from "./resultado/LeiaDeGraca";
import OndeEncontrar from "./resultado/OndeEncontrar";
import OQueODoutorViu from "./resultado/OQueODoutorViu";
import CartaoCanal from "./resultado/CartaoCanal";
import BarraFixa, { ALTURA_BARRA } from "./resultado/BarraFixa";
import AntesDepois from "./resultado/AntesDepois";
import LembreteRega from "./resultado/LembreteRega";
import CartaoCompartilhar, { LARGURA_CARTAO, compartilharCartao, podeCompartilharImagem } from "./resultado/CartaoCompartilhar";
import { ConsultaHistorico, acharAnterior, listarConsultas } from "../../storage/historico";
import { refDoLaudo } from "../../storage/plantasEmCuidado";
import NaoPlanta from "./resultado/NaoPlanta";
import FotoLupa from "./resultado/FotoLupa";
import FotoReferencia from "./resultado/FotoReferencia";
import { COR, Chevron, T, cartao, fonte } from "./resultado/comum";
import {
  LUZ,
  SELO,
  estadoDe,
  fichaCuidados,
  infoPet,
  marcasDaLupa,
  materiaisNaoQuimicos,
  regaResumo,
  separarPlano,
  textoCompartilhar,
  tituloPergunta,
  toxicidadeDe,
  toxicidadeForte,
} from "./resultado/derivar";

export interface PerguntaComunidade {
  titulo: string;
  imageUri: string;
  categoria: string;
}

interface Props {
  imageUri: string;
  resultado: DiagnosticoResponse;
  onVoltar: () => void;
  onNovaConsulta: () => void;
  // Opcional: quem monta a tela pode tratar o "Perguntar" por conta propria.
  // Sem ela, a tela abre a nova postagem da comunidade ja preenchida.
  onPerguntarComunidade?: (pergunta: PerguntaComunidade) => void;
  // Consulta salva no historico (nova ou reaberta): da a data do laudo e evita comparar com ela mesma
  consulta?: ConsultaHistorico | null;
}

const ALTURA_CABECALHO = 56;

// Tela de resultado do diagnostico (redesign v2, Claude Design). Os blocos seguem a
// ordem da secao D da pesquisa e cada um so aparece quando o JSON traz o campo,
// entao o relatorio v1 do Gemini reserva tambem funciona.
export default function DiagnosisScreen({ imageUri, resultado: r, onVoltar, onNovaConsulta, onPerguntarComunidade, consulta }: Props) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const ancoras = useRef<Record<string, number>>({});

  // Lembrete pedido na tela de espera; aparece so neste relatorio
  const [lembrarCanal, setLembrarCanal] = useState(false);
  const [ebookAberto, setEbookAberto] = useState<Ebook | null>(null);
  const [postagemAberta, setPostagemAberta] = useState(false);
  const [loginAberto, setLoginAberto] = useState(false);

  const nivelConfianca = r.identificacao?.nivel_confianca;
  const [altAberto, setAltAberto] = useState(nivelConfianca === "media" || nivelConfianca === "baixa");
  const [problemasAbertos, setProblemasAbertos] = useState<Record<number, boolean>>({ 0: true });
  const [fichaAberta, setFichaAberta] = useState(false);
  const [toxLinhaAberta, setToxLinhaAberta] = useState(false);
  const [anterior, setAnterior] = useState<ConsultaHistorico | null>(null);
  const [cartaoMontado, setCartaoMontado] = useState(false);
  // Problema destacado na lupa da foto (indice em problemas_detectados)
  const [destaque, setDestaque] = useState<number | null>(null);
  const cartaoRef = useRef<View>(null);
  const cartaoPronto = useRef<(() => void) | null>(null);
  const compartilhando = useRef(false);

  const planta = useMemo(() => refDoLaudo(r, consulta), [r, consulta]);
  const momento = consulta?.timestamp;

  // Antes e depois: foto anterior da mesma planta nos ultimos 120 dias
  useEffect(() => {
    if (!r.eh_planta) return;
    let ativo = true;
    listarConsultas().then((hist) => {
      if (!ativo) return;
      setAnterior(
        acharAnterior(hist, {
          id: consulta?.id,
          timestamp: momento ?? Date.now(),
          especie_identificada: r.especie_identificada,
          nome_popular: r.nome_popular,
        }),
      );
    });
    return () => {
      ativo = false;
    };
  }, [r, consulta?.id, momento]);

  // Foto sem planta nao gasta o lembrete: ele fica para o proximo laudo de verdade
  const ehPlanta = r.eh_planta;
  useEffect(() => {
    if (!ehPlanta) return;
    let ativo = true;
    consumirLembrarCanal().then((v) => {
      if (ativo) setLembrarCanal(v);
    });
    return () => {
      ativo = false;
    };
  }, [ehPlanta]);

  const marcar = useCallback(
    (chave: string) => (ev: LayoutChangeEvent) => {
      ancoras.current[chave] = ev.nativeEvent.layout.y;
    },
    [],
  );

  const rolarPara = useCallback((chave: string) => {
    const y = ancoras.current[chave];
    if (y === undefined) return;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
  }, []);

  const derivados = useMemo(() => {
    const { caseiros, quimicos } = separarPlano(r);
    const tox = toxicidadeDe(r);
    return {
      caseiros,
      quimicos,
      tox,
      toxForte: toxicidadeForte(tox),
      pet: infoPet(tox),
      ficha: fichaCuidados(r),
      ofertas: ofertasParaMateriais(materiaisNaoQuimicos(r)),
      rega: regaResumo(r),
    };
  }, [r]);

  const perguntar = useCallback(async () => {
    const pergunta: PerguntaComunidade = {
      titulo: tituloPergunta(r),
      imageUri,
      categoria: (r.problemas_detectados || []).length > 0 ? "Pragas e doenças" : "Dúvida",
    };
    if (onPerguntarComunidade) {
      onPerguntarComunidade(pergunta);
      return;
    }
    const token = await getToken();
    if (token) setPostagemAberta(true);
    else setLoginAberto(true);
  }, [r, imageUri, onPerguntarComunidade]);

  const compartilharTexto = useCallback(async () => {
    try {
      await Share.share({ message: textoCompartilhar(r), title: `Laudo: ${r.nome_popular}` });
    } catch (err) {
      console.log("[diagnosis] erro ao compartilhar:", err);
    }
  }, [r]);

  // Compartilha o cartao-imagem; se nao der, cai no texto de sempre
  const compartilhar = useCallback(async () => {
    if (compartilhando.current) return;
    compartilhando.current = true;
    try {
      if (!(await podeCompartilharImagem())) {
        await compartilharTexto();
        return;
      }
      await new Promise<void>((res) => {
        cartaoPronto.current = res;
        setCartaoMontado(true);
      });
      await compartilharCartao(cartaoRef, r.nome_popular);
    } catch (err) {
      console.log("[diagnosis] cartao falhou, vai texto:", err);
      await compartilharTexto();
    } finally {
      cartaoPronto.current = null;
      setCartaoMontado(false);
      compartilhando.current = false;
    }
  }, [r, compartilharTexto]);

  const naoPlanta = !r.eh_planta;
  const [estadoRotulo] = estadoDe(r);
  const subtitulo = naoPlanta ? "Foto sem planta" : `${r.nome_popular}, ${estadoRotulo.toLowerCase()}`;
  const foto = r.foto;
  const temAvisoFoto = !naoPlanta && !!foto && foto.qualidade !== "boa";
  const selo = nivelConfianca && nivelConfianca !== "nao_aplicavel" ? SELO[nivelConfianca] : null;
  const alternativas = r.identificacao?.alternativas || [];
  const problemas = r.problemas_detectados || [];
  const temPlano = derivados.caseiros.length > 0 || derivados.quimicos.length > 0;
  const ac = r.acompanhamento;
  const mensagemV1 = r.precisa_retorno ? r.mensagem_retorno : "";
  const temAcomp = !!ac && ((ac.sinais_melhora || []).length > 0 || !!ac.prazo_melhora || (ac.retorno_em_dias || 0) > 0);
  const ajuda = r.ajuda_profissional;
  const leitura = r.leitura_foto || [];
  const luzPrecisa = LUZ[r.nivel_luz] ? LUZ[r.nivel_luz][1] : null;
  const temViu = leitura.length > 0 || !!r.luz_veredito;
  const saudavel = r.estado_saude === "saudavel";
  const curiosidade = (r.curiosidades || [])[0];
  const toxLinha = !derivados.toxForte && derivados.tox.nivel !== "nao_aplicavel";
  const toxLinhaDetalhe = [derivados.tox.sintomas, derivados.tox.o_que_fazer].filter(Boolean).join(" ");
  const luzValor = LUZ[r.nivel_luz] ? LUZ[r.nivel_luz][0] : "Sem dados";
  const notaEstacao = (r.nota_estacao || "").trim();
  const marcas = useMemo(() => (r.eh_planta ? marcasDaLupa(r.problemas_detectados) : []), [r]);
  const numeroDe = (indice: number) => marcas.find((m) => m.indice === indice)?.numero;
  const rotulosLupa = useMemo(
    () => Object.fromEntries((r.problemas_detectados || []).map((p, i) => [i, p.descricao || ""])),
    [r],
  );

  const blocoViu = temViu ? (
    <OQueODoutorViu
      key="viu"
      leitura={leitura}
      luzOnde={Math.max(0, Math.min(100, r.luz_porcentagem || 50))}
      luzPrecisa={luzPrecisa}
      luzVeredito={r.luz_veredito}
      abertoInicial={saudavel}
      nivelLuz={r.nivel_luz}
    />
  ) : null;

  return (
    <View testID="diagnosis-screen" style={styles.tela}>
      {/* 1. Cabecalho fixo */}
      <View style={[styles.cabecalho, { paddingTop: insets.top, height: ALTURA_CABECALHO + insets.top }]}>
        <TouchableOpacity onPress={onVoltar} style={styles.voltar} accessibilityRole="button" accessibilityLabel="Voltar">
          <ArrowLeft size={24} color={COLORS.greenDark} strokeWidth={2.4} />
        </TouchableOpacity>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={fonte(FONTS.displayBlack, 18, 1.15, COLORS.greenDark)}>Laudo do Doutor</Text>
          <Text style={fonte(FONTS.bodyMedium, 15, 1.2, COLORS.inkSoft)} numberOfLines={1}>
            {subtitulo}
          </Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={[styles.conteudo, { paddingBottom: (naoPlanta ? 32 : ALTURA_BARRA + 36) + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Foto com selo de reconhecimento (nunca porcentagem) */}
        <FotoLupa imageUri={imageUri} marcas={marcas} destaque={destaque} rotulos={rotulosLupa}>
          {!naoPlanta && !!selo && (
            <View testID="selo-confianca" style={styles.selo}>
              <ShieldCheck size={18} color={COLORS.green} strokeWidth={2.4} />
              <Text style={fonte(FONTS.bodyBold, 15, 1.1, COLORS.greenDark)}>{selo}</Text>
            </View>
          )}
        </FotoLupa>

        {naoPlanta ? (
          <NaoPlanta
            oQueAparece={foto?.o_que_aparece || r.plano_tratamento || ""}
            dicaProxima={foto?.dica_proxima_foto || ""}
            onNovaFoto={onNovaConsulta}
          />
        ) : (
          <>
            {/* 3. Aviso de foto */}
            {temAvisoFoto && foto && (
              <View testID="aviso-foto" style={styles.avisoFoto}>
                <View style={styles.avisoIcone}>
                  <Camera size={20} color="#fff" strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
                  <Text style={fonte(FONTS.displayBold, 17, 1.3, COR.ambarTexto)}>
                    {foto.qualidade === "ruim" ? "A foto dificultou a análise" : "Dá para ver melhor numa próxima foto"}
                  </Text>
                  {!!foto.o_que_aparece && (
                    <Text style={fonte(FONTS.body, 15, 1.5, COR.ambarTexto)}>O que consegui ver: {foto.o_que_aparece}</Text>
                  )}
                  {!!foto.dica_proxima_foto && (
                    <Text style={fonte(FONTS.bodySemiBold, 15, 1.5, COR.ambarTexto)}>
                      <Text style={{ fontFamily: FONTS.bodyExtraBold }}>Dica: </Text>
                      {foto.dica_proxima_foto}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* 4. Veredito */}
            <CartaoVeredito
              imageUri={imageUri}
              resultado={r}
              temPlano={temPlano}
              onVerPlano={() => rolarPara("plano")}
              onChipProblema={(i) => {
                setDestaque(i);
                setProblemasAbertos((a) => ({ ...a, [i]: true }));
                setTimeout(() => rolarPara(`prob-${i}`), 30);
              }}
            />

            {/* 4b. Antes e depois (so com foto anterior da mesma planta) */}
            {!!anterior && (
              <AntesDepois
                antes={anterior}
                agora={{ imageUri, timestamp: momento ?? Date.now(), estado_saude: r.estado_saude }}
              />
            )}

            {/* 5. Tambem pode ser */}
            {alternativas.length > 0 && (
              <View testID="tambem-pode-ser" style={[cartao.base, styles.recolhivel, { borderRadius: 20 }]}>
                <TouchableOpacity style={[styles.linhaRecolhe, { minHeight: 52 }]} onPress={() => setAltAberto((v) => !v)} activeOpacity={0.8}>
                  <Text style={[fonte(FONTS.displayBold, 18, 1.2), { flex: 1 }]}>Também pode ser</Text>
                  <Chevron aberto={altAberto} texto />
                </TouchableOpacity>
                {altAberto && (
                  <View style={{ gap: 12, paddingBottom: 14 }}>
                    {alternativas.map((a, i) => (
                      <View key={i} style={[styles.itemDivisoria, styles.itemAlternativa]}>
                        <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                          <Text style={fonte(FONTS.bodyExtraBold, 16, 1.3)}>
                            {a.nome_popular}{" "}
                            <Text style={{ fontFamily: FONTS.bodyMedium, fontStyle: "italic", color: COLORS.inkSoft }}>{a.especie}</Text>
                          </Text>
                          <Text style={T.corpo}>{a.como_diferenciar}</Text>
                        </View>
                        <FotoReferencia uri={a.foto_referencia} testID={`foto-referencia-alt-${i}`} />
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* 6. Tres chips-resumo */}
            <View testID="chips-resumo" style={styles.resumo}>
              <View style={[cartao.base, styles.resumoItem]}>
                <View style={[styles.resumoIcone, { backgroundColor: COLORS.amberSoft }]}>
                  <Sun size={22} color="#b45309" strokeWidth={2.2} />
                </View>
                <Text style={fonte(FONTS.bodyExtraBold, 15, 1.25)}>{luzValor}</Text>
              </View>
              <View style={[cartao.base, styles.resumoItem]}>
                <View style={[styles.resumoIcone, { backgroundColor: COLORS.skySoft }]}>
                  <Droplets size={22} color={COLORS.skyDeep} strokeWidth={2.2} />
                </View>
                <View style={{ gap: 2 }}>
                  <Text style={fonte(FONTS.bodyExtraBold, 15, 1.25)}>{derivados.rega.valor}</Text>
                  <Text style={fonte(FONTS.bodyMedium, 15, 1.25, COLORS.inkSoft)}>{derivados.rega.sub}</Text>
                </View>
              </View>
              <TouchableOpacity
                testID="chip-pet"
                activeOpacity={0.85}
                onPress={() => {
                  if (!derivados.toxForte) setToxLinhaAberta(true);
                  setTimeout(() => rolarPara("tox"), 30);
                }}
                style={[cartao.base, styles.resumoItem, { backgroundColor: derivados.pet.cardBg }]}
              >
                <View style={[styles.resumoIcone, { backgroundColor: derivados.pet.iconBg }]}>
                  <PawPrint size={22} color={derivados.pet.fg} strokeWidth={2.2} />
                </View>
                <View style={{ gap: 2 }}>
                  <Text style={fonte(FONTS.bodyExtraBold, 15, 1.25, derivados.pet.fg)}>{derivados.pet.valor}</Text>
                  <Text style={fonte(FONTS.bodyMedium, 15, 1.25, COLORS.inkSoft)}>{derivados.pet.sub}</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* 6b. Nota da estacao do ano */}
            {!!notaEstacao && (
              <View testID="nota-estacao" style={styles.notaEstacao}>
                <Leaf size={20} color={COLORS.greenDeep} strokeWidth={2.2} style={{ marginTop: 1 }} />
                <Text style={[fonte(FONTS.body, 15, 1.45, COR.texto2), { flex: 1 }]}>
                  <Text style={{ fontFamily: FONTS.bodyExtraBold, color: COLORS.greenDark }}>Nesta estação: </Text>
                  {notaEstacao}
                </Text>
              </View>
            )}

            {/* 14 (saudavel). O que o Doutor viu sobe e abre */}
            {saudavel && blocoViu}

            {/* 7. Toxicidade em destaque */}
            {derivados.toxForte && (
              <View onLayout={marcar("tox")}>
                <ToxicidadeDestaque tox={derivados.tox} />
              </View>
            )}

            {/* 8. Problemas */}
            {problemas.length > 0 && <Text style={[T.h3, styles.titulo]}>O que encontrei</Text>}
            {problemas.map((p, i) => (
              <View key={`prob-${i}`} onLayout={marcar(`prob-${i}`)}>
                <CartaoProblema
                  problema={p}
                  aberto={!!problemasAbertos[i]}
                  onAlternar={() => {
                    setDestaque(i);
                    setProblemasAbertos((a) => ({ ...a, [i]: !a[i] }));
                  }}
                  numero={numeroDe(i)}
                  onVerNaFoto={() => {
                    setDestaque(i);
                    scrollRef.current?.scrollTo({ y: 0, animated: true });
                  }}
                />
              </View>
            ))}

            {/* 9. Plano em dois degraus */}
            {temPlano && (
              <View testID="plano" onLayout={marcar("plano")} style={{ gap: 10 }}>
                <Text style={[T.h3, styles.titulo]}>Plano de cuidado</Text>
                <PlanoCuidado caseiros={derivados.caseiros} quimicos={derivados.quimicos} />
              </View>
            )}

            {/* 10. Acompanhamento (v1: so a frase de retorno) */}
            {temAcomp && ac ? (
              <Acompanhamento dados={ac} planta={planta} mensagemRetorno={mensagemV1} />
            ) : (
              !!mensagemV1 && <Acompanhamento dados={{}} planta={planta} mensagemRetorno={mensagemV1} />
            )}

            {/* 10b. Lembrete de rega recorrente */}
            {r.rega_dias > 0 && <LembreteRega planta={planta} regaDias={r.rega_dias} regaMl={r.rega_ml} />}

            {/* 11. Ajuda profissional */}
            {!!ajuda?.recomendada && (
              <View testID="ajuda-profissional" style={styles.ajuda}>
                <Text style={fonte(FONTS.displayBlack, 19, 1.25, COR.lilasTitulo)}>Vale chamar quem entende</Text>
                {!!ajuda.motivo && <Text style={fonte(FONTS.body, 15, 1.5, COR.lilasTexto)}>{ajuda.motivo}</Text>}
                <TouchableOpacity onPress={perguntar} activeOpacity={0.85} style={styles.ajudaBotao}>
                  <Text style={fonte(FONTS.bodyExtraBold, 16, 1.2, "#fff")}>Mostrar para a comunidade</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 12. Leia de graca */}
            <LeiaDeGraca ebooks={r.ebooks_recomendados || []} onAbrir={setEbookAberto} />

            {/* 13. Onde encontrar */}
            <OndeEncontrar ofertas={derivados.ofertas} />

            {/* 14. O que o Doutor viu */}
            {!saudavel && blocoViu}

            {/* 15. Ficha de cuidados */}
            {derivados.ficha.length > 0 && (
              <View testID="ficha-cuidados" style={[cartao.base, styles.recolhivel]}>
                <TouchableOpacity style={styles.linhaRecolhe} onPress={() => setFichaAberta((v) => !v)} activeOpacity={0.8}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={fonte(FONTS.displayBlack, 19, 1.2, COLORS.greenDark)}>Ficha de cuidados</Text>
                    <Text style={fonte(FONTS.body, 15, 1.3, COLORS.inkSoft)}>Rega, solo, adubo e poda</Text>
                  </View>
                  <Chevron aberto={fichaAberta} texto />
                </TouchableOpacity>
                {fichaAberta && (
                  <View style={{ paddingBottom: 12 }}>
                    {derivados.ficha.map((f) => (
                      <View key={f.label} style={[styles.itemDivisoria, { paddingVertical: 10, gap: 2 }]}>
                        <Text style={T.rotulo}>{f.label}</Text>
                        <Text style={T.corpo}>{f.texto}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* 16. Toxicidade leve ou nenhuma */}
            {toxLinha && (
              <TouchableOpacity
                testID="toxicidade-linha"
                onLayout={marcar("tox")}
                onPress={() => setToxLinhaAberta((v) => !v)}
                disabled={!toxLinhaDetalhe}
                activeOpacity={0.85}
                style={[cartao.base, styles.toxLinha]}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <PawPrint size={20} color={derivados.pet.fg} strokeWidth={2.2} />
                  <Text style={[fonte(FONTS.bodyBold, 15, 1.35, derivados.pet.fg), { flex: 1 }]}>{derivados.pet.linhaTexto}</Text>
                  {!!toxLinhaDetalhe && <Chevron aberto={toxLinhaAberta} />}
                </View>
                {toxLinhaAberta && !!toxLinhaDetalhe && <Text style={T.corpo}>{toxLinhaDetalhe}</Text>}
              </TouchableOpacity>
            )}

            {/* 17. Voce sabia? */}
            {!!curiosidade && (
              <View style={styles.curiosidade}>
                <Lightbulb size={24} color={COR.ambarForte} strokeWidth={2.2} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={fonte(FONTS.displayBlack, 18, 1.2, COR.ambarTexto)}>Você sabia?</Text>
                  <Text style={fonte(FONTS.body, 15, 1.5, COR.ambarTexto)}>{curiosidade}</Text>
                </View>
              </View>
            )}

          </>
        )}

        {/* Canal: ultimo video e inscricao (titulo muda se pediu para lembrar na tela de espera) */}
        <CartaoCanal lembrou={lembrarCanal} />

        {/* 18. Rodape */}
        <View style={styles.rodape}>
          <View testID="selo-gratis" style={styles.seloGratis}>
            <Leaf size={18} color={COLORS.greenDark} strokeWidth={2.2} />
            <Text style={fonte(FONTS.bodyExtraBold, 15, 1.2, COLORS.greenDark)}>Grátis, sem assinatura, em português</Text>
          </View>
          <Text testID="aviso-ia" style={[fonte(FONTS.body, 15, 1.5, COLORS.inkSoft), { textAlign: "center" }]}>
            Este laudo foi feito por inteligência artificial e pode errar. Na dúvida, confirme com a comunidade ou com um agrônomo.
          </Text>
        </View>
      </ScrollView>

      {/* 19. Barra fixa */}
      {!naoPlanta && (
        <BarraFixa insetInferior={insets.bottom} onPerguntar={perguntar} onCompartilhar={compartilhar} onNovaFoto={onNovaConsulta} />
      )}

      {/* Cartao-imagem do compartilhar: montado fora da tela so durante o compartilhamento */}
      {cartaoMontado && (
        <View style={styles.foraDaTela} pointerEvents="none">
          <CartaoCompartilhar ref={cartaoRef} imageUri={imageUri} resultado={r} onPronto={() => cartaoPronto.current?.()} />
        </View>
      )}

      {/* Leitor do ebook direto, sem e-mail. So entra na arvore depois do primeiro toque */}
      {ebookAberto && <EbookViewerModal visible ebook={ebookAberto} onClose={() => setEbookAberto(null)} />}

      {postagemAberta && (
        <NovaPostagemModal
          visible
          tituloInicial={tituloPergunta(r)}
          imagemInicial={imageUri}
          categoriaInicial={(r.problemas_detectados || []).length > 0 ? "Pragas e doenças" : "Dúvida"}
          onClose={() => setPostagemAberta(false)}
          onCriado={() => {
            setPostagemAberta(false);
            Alert.alert("Pergunta publicada", "Ela já está na aba Comunidade. Quem entende de plantas vai poder responder por lá.", [
              { text: "Combinado" },
            ]);
          }}
        />
      )}
      {loginAberto && (
        <LoginModal
          visible
          onClose={() => setLoginAberto(false)}
          onLogin={() => {
            setLoginAberto(false);
            setPostagemAberta(true);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: COLORS.bg },
  foraDaTela: { position: "absolute", top: 0, left: -(LARGURA_CARTAO + 200), width: LARGURA_CARTAO },
  cabecalho: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: COR.linha,
  },
  voltar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  conteudo: { paddingTop: 14, paddingHorizontal: 16, gap: 14 },
  selo: {
    position: "absolute",
    left: 12,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.94)",
  },
  avisoFoto: { backgroundColor: COLORS.amberSoft, borderRadius: 20, paddingVertical: 14, paddingHorizontal: 16, flexDirection: "row", gap: 12 },
  avisoIcone: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.amber, alignItems: "center", justifyContent: "center" },
  recolhivel: { paddingVertical: 4, paddingHorizontal: 16 },
  linhaRecolhe: { minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  itemDivisoria: { gap: 3, paddingTop: 12, borderTopWidth: 1, borderTopColor: COR.linha },
  itemAlternativa: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  notaEstacao: { flexDirection: "row", gap: 10, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 16, backgroundColor: COR.verdeFundo },
  resumo: { flexDirection: "row", gap: 8 },
  resumoItem: { flex: 1, borderRadius: 18, paddingVertical: 12, paddingHorizontal: 10, gap: 8 },
  resumoIcone: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  titulo: { marginTop: 8 },
  ajuda: { backgroundColor: COLORS.lavenderSoft, borderRadius: 22, padding: 16, gap: 10 },
  ajudaBotao: { height: 50, borderRadius: 14, backgroundColor: COLORS.lavenderDeep, alignItems: "center", justifyContent: "center" },
  toxLinha: { borderRadius: 18, paddingVertical: 12, paddingHorizontal: 14, gap: 6, minHeight: 44 },
  curiosidade: { borderRadius: 22, padding: 16, backgroundColor: COLORS.amberSoft, flexDirection: "row", gap: 12 },
  rodape: { alignItems: "center", gap: 10, paddingTop: 10, paddingHorizontal: 4 },
  seloGratis: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 100,
    backgroundColor: COLORS.greenSoft,
  },
});
