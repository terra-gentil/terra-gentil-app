import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BellRing,
  BookOpen,
  Bug,
  Check,
  ClipboardList,
  Clock,
  Droplets,
  Heart,
  ImageUp,
  Leaf,
  Lightbulb,
  PawPrint,
  Play,
  PlayCircle,
  Search,
  Sparkles,
  Users,
} from "lucide-react-native";
import { MASCOT_ANALYZING, MASCOT_GIFT, MASCOT_POSES } from "../assets/mascot";
import { COLORS, FONTS, RADIUS, shadowChunky, shadowSoft } from "../constants/theme";
import { marcarLembrarCanal } from "../storage/preferencias";

// Etapas sao ilusao de progresso: avancam por tempo, nao pelo backend.
// Calibradas no Opus 5.5 (fase 2: 25 a 35 s, media 27 s). Roteiro em docs/ROTEIRO-ESPERA-V2.md.
export const ETAPAS = [
  { texto: "Recebendo a sua foto", Icone: ImageUp },
  { texto: "Descobrindo qual é a planta", Icone: Search },
  { texto: "Olhando folhas e caule de perto", Icone: Leaf },
  { texto: "Procurando pragas e fungos", Icone: Bug },
  { texto: "Avaliando luz e rega", Icone: Droplets },
  { texto: "Conferindo se é segura para pets e crianças", Icone: PawPrint },
  { texto: "Montando o seu plano de cuidados", Icone: ClipboardList },
  { texto: "Caprichando nos últimos detalhes", Icone: Sparkles },
] as const;

// Momento (ms desde a montagem) em que cada etapa seguinte comeca.
// A ultima fica ativa ate a resposta chegar.
export const INICIO_ETAPAS_MS = [0, 3000, 8000, 14000, 20000, 25000, 30000, 35000];

// Tempo tipico mostrado na contagem. Abaixo de 5 s restantes vira "quase pronto".
export const TEMPO_TIPICO_S = 30;
const CONTAGEM_PASSO_MS = 5000;

// Proporcao (largura / altura) das artes do mascote, para enquadrar a capa.
const PAISAGEM = 1365 / 768;
const RETRATO = 768 / 1365;

// Carrossel "Conheca o Terra Gentil". O ultimo cartao e uma dica "Voce sabia?".
// Cada cartao tem cor de destaque (texto, contraste AA), fundo e arte de capa.
// enquadre = ponto focal da arte (0 a 1), como object-position do CSS.
export const CARTAO_INTERVALO_MS = 8000;
export const CARTOES = [
  {
    id: "quem-somos",
    Icone: Heart,
    titulo: "Seja gentil com a terra",
    texto:
      "O Terra Gentil nasceu em 2022 para ajudar quem quer cuidar de planta sem complicação. Aqui quintais esquecidos viram jardins, e tudo o que a gente ensina é de graça.",
    destaque: COLORS.greenDeep,
    fundo: COLORS.greenDeep,
    capa: MASCOT_POSES[0],
    proporcao: PAISAGEM,
    enquadre: { x: 0.72, y: 0.28 },
  },
  {
    id: "canal",
    Icone: PlayCircle,
    titulo: "Vídeos novos toda semana",
    texto: "Transformações de quintais e tutoriais de jardinagem sem pressa, no canal Terra Gentil do YouTube.",
    destaque: COLORS.coralDeep,
    fundo: COLORS.sky,
    capa: MASCOT_POSES[1],
    proporcao: PAISAGEM,
    enquadre: { x: 0.3, y: 0.4 },
  },
  {
    id: "ebooks",
    Icone: BookOpen,
    titulo: "Mais de 100 guias grátis",
    texto: "Do vaso da sala à horta do quintal. Estão na aba Ebooks, prontos para ler no app.",
    destaque: "#b45309",
    fundo: COLORS.amber,
    capa: MASCOT_GIFT,
    proporcao: RETRATO,
    enquadre: { x: 0.5, y: 0.64 },
  },
  {
    id: "comunidade",
    Icone: Users,
    titulo: "Você não cuida sozinho",
    texto: "Na aba Comunidade, outros cultivadores trocam dicas e fotos. Mostre a sua planta lá depois do diagnóstico.",
    destaque: COLORS.lavenderDeep,
    fundo: COLORS.lavender,
    capa: MASCOT_POSES[5],
    proporcao: PAISAGEM,
    enquadre: { x: 0.68, y: 0.3 },
  },
  {
    id: "dica",
    Icone: Lightbulb,
    titulo: "Você sabia?",
    texto: "",
    destaque: COLORS.skyDeep,
    fundo: COLORS.sky,
    capa: MASCOT_POSES[6],
    proporcao: PAISAGEM,
    enquadre: { x: 0.62, y: 0.32 },
  },
] as const;

export const DICAS = [
  "Regue de manhã cedinho. A planta aproveita a água durante o dia e as folhas secam antes da noite, o que afasta os fungos.",
  "Antes de regar, coloque o dedo na terra. Se os primeiros dois centímetros ainda estiverem úmidos, espere mais um pouquinho.",
  "Vaso sem furo no fundo acumula água e apodrece a raiz. Sempre confira a drenagem.",
  "Folhas amarelando de baixo para cima podem ser excesso de água ou falta de adubo. Observe a terra antes de agir.",
  "Gire o vaso um quarto de volta toda semana. Assim a planta cresce reta, sem se esticar só para o lado da janela.",
  "Limpe a poeira das folhas com um pano úmido. Folha limpinha respira e aproveita melhor a luz.",
  "Planta de sombra também precisa de claridade. Sombra boa é luz indireta, não escuridão.",
  "No frio, a maioria das plantas cresce mais devagar e bebe menos água. Diminua a rega no inverno.",
  "Manjericão gosta de sol e de poda. Tire as florzinhas para ele continuar dando folhas cheirosas.",
  "Água com um pouquinho de sabão neutro, borrifada no fim da tarde, ajuda a afastar pulgões.",
  "Espada-de-são-jorge e zamioculca aguentam bem a falta de água. São ótimas para quem viaja muito.",
  "Folhas secas ou casca de pinus por cima da terra seguram a umidade e protegem as raízes do calor.",
  "Comigo-ninguém-pode é linda, mas é tóxica para cães, gatos e crianças. Deixe fora do alcance deles.",
  "Casca de ovo triturada devolve cálcio à terra, mas age devagar. É um carinho de longo prazo.",
  "Adubo demais queima a raiz. Na dúvida, use menos do que diz a embalagem e com a terra úmida.",
];

// Aviso de demora so depois do pior caso medido (35 s) com folga. O app desiste em 100 s.
export const DEMORA_MS = 60000;

// Curva da barra: p(s) = 0,95 x (1 - e^(-s/13)), s em segundos.
// Avanca rapido no comeco, passa de 80% perto dos 27 s tipicos e nunca chega a 100%.
const BARRA_DURACAO_MS = 300000;
const BARRA_PONTOS_S = [0, 2, 5, 10, 15, 20, 25, 30, 40, 50, 60, 90, 120, 180, 300];
const BARRA_INPUT = BARRA_PONTOS_S.map((s) => (s * 1000) / BARRA_DURACAO_MS);
export const BARRA_OUTPUT = BARRA_PONTOS_S.map((s) => 0.95 * (1 - Math.exp(-s / 13)));

// Texto da contagem a partir do tempo decorrido.
export function textoContagem(decorridoMs: number, demorando: boolean): string {
  if (demorando) return "Ainda cuidando da sua planta com carinho.";
  const restante = TEMPO_TIPICO_S - Math.floor(decorridoMs / 1000);
  if (restante <= 5) return "Quase pronto...";
  return `Cerca de ${Math.ceil(restante / 5) * 5} segundos`;
}

const LASER_CORES = ["rgba(34,197,94,0)", "rgba(34,197,94,0.35)", "rgba(34,197,94,0)"] as const;
const BARRA_CORES = [COLORS.green, COLORS.greenLeaf] as const;
const BRILHO_CORES = ["rgba(255,255,255,0)", "rgba(255,255,255,0.55)", "rgba(255,255,255,0)"] as const;
const CAPA_SOMBRA_CORES = ["rgba(20,30,20,0.5)", "rgba(20,30,20,0)"] as const;
const CAPA_SOMBRA_LOCAIS = [0, 0.6] as const;
const HORIZONTAL_INICIO = { x: 0, y: 0 };
const HORIZONTAL_FIM = { x: 1, y: 0 };

const ALTURA_FOTO = 150;
const LASER_ALTURA = 56;
const AVATAR = 54;
const ETAPA_ICONE = 28;
const ALTURA_CARROSSEL = 268;
const ALTURA_CAPA = 104;
const SEGMENTO_GAP = 4;
const BRILHO_LARGURA = 100;

// Entrada escalonada dos 4 blocos (cabecalho, aviso, exame, carrossel): 600 ms cada.
const ENTRADA_ATRASOS_MS = [0, 150, 300, 500];
const ENTRADA_DURACAO_MS = 600;

interface Props {
  // Foto da planta que esta sendo analisada. Sem ela, mostra o Doutor analisando.
  imageUri?: string | null;
}

function useReduzirMovimento(): boolean {
  const [reduzir, setReduzir] = useState(false);
  useEffect(() => {
    let ativo = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        if (ativo) setReduzir(!!v);
      })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", (v) => {
      if (ativo) setReduzir(!!v);
    });
    return () => {
      ativo = false;
      sub?.remove?.();
    };
  }, []);
  return reduzir;
}

// Emula object-fit: cover + object-position, que o Image do RN nao tem.
function enquadrar(
  larguraCaixa: number,
  alturaCaixa: number,
  proporcao: number,
  foco: { x: number; y: number },
) {
  if (larguraCaixa / alturaCaixa > proporcao) {
    const altura = larguraCaixa / proporcao;
    return { width: larguraCaixa, height: altura, left: 0, top: -(altura - alturaCaixa) * foco.y };
  }
  const largura = alturaCaixa * proporcao;
  return { width: largura, height: alturaCaixa, left: -(largura - larguraCaixa) * foco.x, top: 0 };
}

export function LoadingScreen({ imageUri }: Props = {}) {
  const insets = useSafeAreaInsets();
  const { width: larguraTela } = useWindowDimensions();
  const reduzir = useReduzirMovimento();

  const [etapa, setEtapa] = useState(0);
  const [cartao, setCartao] = useState(0);
  // Uma dica sorteada por espera, mostrada no ultimo cartao do carrossel
  const [dica] = useState(() => Math.floor(Math.random() * DICAS.length));
  const [decorridoMs, setDecorridoMs] = useState(0);
  const [lembrarCanal, setLembrarCanal] = useState(false);
  const [demorando, setDemorando] = useState(false);
  const [larguraBarra, setLarguraBarra] = useState(0);
  const [larguraSegmentos, setLarguraSegmentos] = useState(0);

  const laser = useRef(new Animated.Value(0)).current;
  const respiro = useRef(new Animated.Value(0)).current;
  const pulso = useRef(new Animated.Value(0)).current;
  const brilho = useRef(new Animated.Value(0)).current;
  const relogioBarra = useRef(new Animated.Value(0)).current;
  const entradas = useRef(ENTRADA_ATRASOS_MS.map(() => new Animated.Value(0))).current;
  const trocaCartao = useRef(new Animated.Value(1)).current;
  const segmento = useRef(new Animated.Value(0)).current;
  const primeiroCartao = useRef(true);

  const larguraConteudo = Math.min(larguraTela - 40, 480);

  // Etapas, cartoes, contagem e aviso de demora. Tudo em baixa frequencia e limpo no unmount.
  useEffect(() => {
    const timeouts = INICIO_ETAPAS_MS.slice(1).map((ms, i) =>
      setTimeout(() => setEtapa(i + 1), ms),
    );
    const demora = setTimeout(() => setDemorando(true), DEMORA_MS);
    const intervaloCartao = setInterval(() => {
      setCartao((c) => (c + 1) % CARTOES.length);
    }, CARTAO_INTERVALO_MS);
    const intervaloContagem = setInterval(() => {
      setDecorridoMs((ms) => ms + CONTAGEM_PASSO_MS);
    }, CONTAGEM_PASSO_MS);
    return () => {
      timeouts.forEach(clearTimeout);
      clearTimeout(demora);
      clearInterval(intervaloCartao);
      clearInterval(intervaloContagem);
    };
  }, []);

  function aoLembrarCanal() {
    if (lembrarCanal) return;
    setLembrarCanal(true);
    marcarLembrarCanal();
  }

  // Barra de progresso: um unico timing linear no driver nativo, a curva vem do interpolate.
  useEffect(() => {
    const anim = Animated.timing(relogioBarra, {
      toValue: 1,
      duration: BARRA_DURACAO_MS,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [relogioBarra]);

  // Entrada escalonada dos blocos (nada com reduzir movimento).
  useEffect(() => {
    if (reduzir) {
      entradas.forEach((v) => v.setValue(1));
      return;
    }
    const anim = Animated.parallel(
      entradas.map((v, i) =>
        Animated.timing(v, {
          toValue: 1,
          delay: ENTRADA_ATRASOS_MS[i],
          duration: ENTRADA_DURACAO_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ),
    );
    anim.start();
    return () => anim.stop();
  }, [reduzir, entradas]);

  // Troca de cartao: fade + deslize de 28 px em 600 ms. O primeiro entra com o bloco; com reduzir e seca.
  useEffect(() => {
    if (reduzir || primeiroCartao.current) {
      primeiroCartao.current = false;
      trocaCartao.setValue(1);
      return;
    }
    trocaCartao.setValue(0);
    const anim = Animated.timing(trocaCartao, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [cartao, reduzir, trocaCartao]);

  // Segmento do cartao atual enche em 8 s, tipo stories. Com reduzir fica cheio e parado.
  useEffect(() => {
    if (reduzir) {
      segmento.setValue(1);
      return;
    }
    segmento.setValue(0);
    const anim = Animated.timing(segmento, {
      toValue: 1,
      duration: CARTAO_INTERVALO_MS,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [cartao, reduzir, segmento]);

  // Animacoes decorativas em loop: laser, respiro do mascote, pulso da etapa atual, brilho da barra.
  useEffect(() => {
    if (reduzir) {
      laser.setValue(0.5);
      respiro.setValue(0);
      pulso.setValue(0);
      brilho.setValue(0);
      return;
    }
    const seno = Easing.inOut(Easing.sin);
    const loops = [
      Animated.loop(
        Animated.sequence([
          Animated.timing(laser, { toValue: 1, duration: 2600, easing: seno, useNativeDriver: true }),
          Animated.timing(laser, { toValue: 0, duration: 2600, easing: seno, useNativeDriver: true }),
        ]),
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(respiro, { toValue: 1, duration: 1800, easing: seno, useNativeDriver: true }),
          Animated.timing(respiro, { toValue: 0, duration: 1800, easing: seno, useNativeDriver: true }),
        ]),
      ),
      // Onda que sai da etapa atual e some (escala 1 a 1,75).
      Animated.loop(
        Animated.timing(pulso, {
          toValue: 1,
          duration: 2200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        { resetBeforeIteration: true },
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(brilho, { toValue: 1, duration: 1800, easing: Easing.linear, useNativeDriver: true }),
          Animated.delay(900),
        ]),
        { resetBeforeIteration: true },
      ),
    ];
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [reduzir, laser, respiro, pulso, brilho]);

  function aoMedirBarra(e: LayoutChangeEvent) {
    const w = Math.round(e.nativeEvent.layout.width);
    if (w !== larguraBarra) setLarguraBarra(w);
  }

  function aoMedirSegmentos(e: LayoutChangeEvent) {
    const w = Math.round(e.nativeEvent.layout.width);
    if (w !== larguraSegmentos) setLarguraSegmentos(w);
  }

  // Opacidade e deslocamento de cada bloco na entrada.
  const blocos = entradas.map((v) => ({
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
  }));

  const laserY = laser.interpolate({
    inputRange: [0, 1],
    outputRange: [-LASER_ALTURA / 2, ALTURA_FOTO - LASER_ALTURA / 2],
  });
  const mascoteY = respiro.interpolate({ inputRange: [0, 1], outputRange: [0, -3] });
  const mascoteGiro = respiro.interpolate({ inputRange: [0, 1], outputRange: ["-2deg", "2deg"] });
  const pulsoEscala = pulso.interpolate({ inputRange: [0, 1], outputRange: [1, 1.75] });
  const pulsoOpacidade = pulso.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });
  const progresso = relogioBarra.interpolate({
    inputRange: BARRA_INPUT,
    outputRange: BARRA_OUTPUT,
    extrapolate: "clamp",
  });
  const barraX = progresso.interpolate({
    inputRange: [0, 1],
    outputRange: [-larguraBarra, 0],
  });
  const brilhoX = brilho.interpolate({
    inputRange: [0, 1],
    outputRange: [-BRILHO_LARGURA, Math.max(larguraBarra, 1)],
  });
  const cartaoX = trocaCartao.interpolate({ inputRange: [0, 1], outputRange: [28, 0] });
  const larguraSegmento =
    larguraSegmentos > 0 ? (larguraSegmentos - SEGMENTO_GAP * (CARTOES.length - 1)) / CARTOES.length : 0;
  const segmentoX = segmento.interpolate({ inputRange: [0, 1], outputRange: [-larguraSegmento, 0] });

  const etapaAtual = ETAPAS[etapa];
  const legendaBarra = textoContagem(decorridoMs, demorando);
  const cartaoAtual = CARTOES[cartao];
  const { Icone: IconeCartao } = cartaoAtual;
  const textoCartao = cartaoAtual.id === "dica" ? DICAS[dica] : cartaoAtual.texto;
  const capaEstilo = enquadrar(larguraConteudo, ALTURA_CAPA, cartaoAtual.proporcao, cartaoAtual.enquadre);

  return (
    <View
      style={styles.tela}
      accessible={false}
      accessibilityRole="progressbar"
      accessibilityLabel="O Doutor Gentileza está analisando a sua planta. Aguarde."
      accessibilityState={{ busy: true }}
      testID="loading-diagnostico"
    >
      {/* Cabe em 844 de altura sem rolar; o ScrollView e seguranca para telas menores e para o aviso de demora */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.conteudo,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.coluna, { width: larguraConteudo }]}>
          {/* Cabecalho */}
          <Animated.View style={[styles.cabecalho, blocos[0]]}>
            <Animated.View
              style={[styles.avatar, { transform: [{ translateY: mascoteY }, { rotate: mascoteGiro }] }]}
            >
              <Image source={MASCOT_POSES[1]} style={styles.avatarImg} />
            </Animated.View>
            <View style={styles.cabecalhoTextos}>
              <Text style={styles.seloTexto}>DOUTOR GENTILEZA</Text>
              <Text
                style={styles.titulo}
                accessibilityRole="header"
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                Analisando a sua planta
              </Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.avisoEntrada, blocos[1]]}>
            <View style={styles.avisoEntradaIcone}>
              <Clock size={17} color={COLORS.greenDeep} strokeWidth={2.5} />
            </View>
            <Text style={styles.avisoEntradaTexto}>
              <Text style={styles.avisoEntradaForte}>O Doutor vai examinar sua planta com calma.</Text> Leva
              uns <Text style={styles.avisoEntradaTempo}>30 segundos</Text>. Enquanto isso, conheça o Terra
              Gentil.
            </Text>
          </Animated.View>

          {/* Cartao do exame: foto com laser, trilha de etapas, etapa atual, barra e contagem */}
          <Animated.View style={[styles.exame, blocos[2]]}>
            <View style={styles.foto}>
              <Image
                source={imageUri ? { uri: imageUri } : MASCOT_ANALYZING}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
                accessibilityIgnoresInvertColors
                accessible
                accessibilityLabel={imageUri ? "Foto da sua planta" : "Doutor Gentileza analisando"}
              />
              {!reduzir && (
                <Animated.View
                  testID="laser"
                  pointerEvents="none"
                  style={[styles.laser, { transform: [{ translateY: laserY }] }]}
                >
                  <LinearGradient colors={LASER_CORES} style={StyleSheet.absoluteFill} />
                  <View style={styles.laserLinha} />
                </Animated.View>
              )}
              <View pointerEvents="none" style={[styles.canto, styles.cantoSE]} />
              <View pointerEvents="none" style={[styles.canto, styles.cantoSD]} />
              <View pointerEvents="none" style={[styles.canto, styles.cantoIE]} />
              <View pointerEvents="none" style={[styles.canto, styles.cantoID]} />
            </View>

            <View style={styles.exameCorpo}>
              {/* Trilha das 8 etapas */}
              <View style={styles.trilha}>
                <View style={styles.trilhaLinha}>
                  <View
                    style={[styles.trilhaFeita, { width: `${(etapa / (ETAPAS.length - 1)) * 100}%` as `${number}%` }]}
                  />
                </View>
                {ETAPAS.map((e, i) => {
                  const feita = i < etapa;
                  const atual = i === etapa;
                  const { Icone } = e;
                  return (
                    <View
                      key={e.texto}
                      style={styles.etapa}
                      accessible
                      accessibilityLabel={`${e.texto}, ${feita ? "concluído" : atual ? "em andamento" : "a seguir"}`}
                    >
                      {atual && <View style={styles.etapaAnel} />}
                      {atual && !reduzir && (
                        <Animated.View
                          style={[
                            styles.etapaPulso,
                            { opacity: pulsoOpacidade, transform: [{ scale: pulsoEscala }] },
                          ]}
                        />
                      )}
                      <View
                        style={[
                          styles.etapaIcone,
                          feita && styles.etapaIconeFeita,
                          atual && styles.etapaIconeAtual,
                        ]}
                      >
                        {feita ? (
                          <Check size={15} color="#fff" strokeWidth={3.2} />
                        ) : (
                          <Icone
                            size={15}
                            color={atual ? "#fff" : "rgba(255,255,255,0.6)"}
                            strokeWidth={2.4}
                          />
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>

              <Text style={styles.etapaRotulo} accessible={false}>
                ETAPA {etapa + 1} DE {ETAPAS.length}
              </Text>
              <View style={styles.etapaAtualCaixa}>
                <Text
                  style={styles.etapaAtual}
                  accessibilityLiveRegion="polite"
                  testID="etapa-atual"
                  numberOfLines={2}
                >
                  {etapaAtual.texto}...
                </Text>
              </View>

              <View style={styles.trilho} onLayout={aoMedirBarra} testID="barra-trilho">
                {larguraBarra > 0 && (
                  <Animated.View
                    testID="barra-preenchimento"
                    style={[styles.preenchimento, { width: larguraBarra, transform: [{ translateX: barraX }] }]}
                  >
                    <LinearGradient
                      colors={BARRA_CORES}
                      start={HORIZONTAL_INICIO}
                      end={HORIZONTAL_FIM}
                      style={StyleSheet.absoluteFill}
                    />
                    {!reduzir && (
                      <Animated.View
                        testID="barra-brilho"
                        style={[styles.brilho, { transform: [{ translateX: brilhoX }] }]}
                      >
                        <LinearGradient
                          colors={BRILHO_CORES}
                          start={HORIZONTAL_INICIO}
                          end={HORIZONTAL_FIM}
                          style={StyleSheet.absoluteFill}
                        />
                      </Animated.View>
                    )}
                  </Animated.View>
                )}
              </View>
              <Text style={styles.contagem}>{legendaBarra}</Text>
            </View>
          </Animated.View>

          {demorando && (
            <View style={styles.aviso} accessibilityLiveRegion="polite">
              <Clock size={22} color="#92400e" strokeWidth={2.5} />
              <Text style={styles.avisoTexto}>
                Hoje o consultório está movimentado. Mais uns segundinhos, não feche o app.
              </Text>
            </View>
          )}

          {/* Carrossel "Conheca o Terra Gentil". Ultimo bloco da tela: se um cartao precisar de mais altura, nada abaixo pula. */}
          <Animated.View style={[styles.carrossel, blocos[3]]}>
            <Animated.View
              testID={`cartao-${cartaoAtual.id}`}
              style={[styles.cartao, { opacity: trocaCartao, transform: [{ translateX: cartaoX }] }]}
            >
              <View style={styles.cartaoRecorte}>
                <View style={[styles.capa, { backgroundColor: cartaoAtual.fundo }]}>
                  <Image
                    source={cartaoAtual.capa as ImageSourcePropType}
                    style={[styles.capaImg, capaEstilo]}
                    accessible={false}
                  />
                  <LinearGradient
                    colors={CAPA_SOMBRA_CORES}
                    locations={CAPA_SOMBRA_LOCAIS}
                    style={StyleSheet.absoluteFill}
                    pointerEvents="none"
                  />
                  {cartaoAtual.id === "canal" && (
                    <View style={styles.seloPlay}>
                      <Play size={18} color="#fff" fill="#fff" strokeWidth={0} />
                    </View>
                  )}
                  {cartaoAtual.id === "ebooks" && (
                    <View style={styles.seloEbooks}>
                      <Text style={styles.seloEbooksNumero}>100+</Text>
                      <Text style={styles.seloEbooksTexto}>GRÁTIS</Text>
                    </View>
                  )}
                </View>
                <View style={styles.cartaoCorpo}>
                  <View style={styles.cartaoTopo}>
                    <IconeCartao size={20} color={cartaoAtual.destaque} strokeWidth={2.5} />
                    <Text style={[styles.cartaoTitulo, { color: cartaoAtual.destaque }]}>
                      {cartaoAtual.titulo}
                    </Text>
                  </View>
                  <Text style={styles.dica} testID="dica">
                    {textoCartao}
                  </Text>
                  {cartaoAtual.id === "canal" && (
                    <Pressable
                      onPress={aoLembrarCanal}
                      style={[styles.botaoCanal, lembrarCanal && styles.botaoCanalFeito]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: lembrarCanal }}
                      testID="lembrar-canal"
                    >
                      {lembrarCanal ? (
                        <Check size={16} color={COLORS.greenDeep} strokeWidth={3} />
                      ) : (
                        <BellRing size={16} color="#fff" strokeWidth={2.5} />
                      )}
                      <Text style={[styles.botaoCanalTexto, lembrarCanal && styles.botaoCanalTextoFeito]}>
                        {lembrarCanal ? "Combinado! O link vai no seu relatório" : "Lembrar de ver o canal"}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </Animated.View>

            {/* Segmentos tipo stories e rotulo, por cima da capa */}
            <View style={styles.carrosselTopo} pointerEvents="none">
              <View style={styles.segmentos} onLayout={aoMedirSegmentos} accessible={false}>
                {CARTOES.map((c, i) => (
                  <View key={c.id} style={styles.segmento}>
                    {i < cartao && <View style={styles.segmentoCheio} />}
                    {i === cartao && larguraSegmento > 0 && (
                      <Animated.View
                        style={[
                          styles.segmentoAndando,
                          { width: larguraSegmento, transform: [{ translateX: segmentoX }] },
                        ]}
                      />
                    )}
                  </View>
                ))}
              </View>
              <Text style={styles.carrosselRotulo}>CONHEÇA O TERRA GENTIL</Text>
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const CANTO = 22;
const VERDE_FUNDO_FOTO = "#0f3d22";
const ETAPA_A_SEGUIR = "#1f6b3d";

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    flex: 1,
  },
  conteudo: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  coluna: {
    gap: 10,
  },
  cabecalho: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 2,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#fff",
    backgroundColor: COLORS.sky,
    ...shadowChunky("rgba(21,128,61,0.25)"),
    shadowOffset: { width: 0, height: 4 },
  },
  // A arte e paisagem (16:9) com o Doutor a direita: amplia e desloca pra enquadrar o rosto.
  avatarImg: {
    position: "absolute",
    height: 84,
    width: 149,
    left: -72,
    top: -14,
  },
  cabecalhoTextos: {
    flex: 1,
    gap: 2,
  },
  seloTexto: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: 13,
    letterSpacing: 1.2,
    color: COLORS.greenDeep,
  },
  titulo: {
    fontFamily: FONTS.displayBlack,
    fontSize: 23,
    lineHeight: 28,
    color: COLORS.greenDark,
  },
  avisoEntrada: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  avisoEntradaIcone: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginTop: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.greenSoft,
  },
  avisoEntradaTexto: {
    flex: 1,
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    lineHeight: 21,
    color: COLORS.greenDark,
  },
  avisoEntradaForte: {
    fontFamily: FONTS.bodyBold,
  },
  // Texto aninhado nao aceita padding nem raio: o realce fica so na cor de fundo.
  avisoEntradaTempo: {
    fontFamily: FONTS.bodyExtraBold,
    backgroundColor: COLORS.amberSoft,
    color: "#92400e",
  },
  exame: {
    backgroundColor: COLORS.greenDark,
    borderRadius: RADIUS.hero,
    padding: 10,
    ...shadowChunky("rgba(21,128,61,0.35)"),
  },
  foto: {
    height: ALTURA_FOTO,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: VERDE_FUNDO_FOTO,
  },
  laser: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: LASER_ALTURA,
    justifyContent: "center",
  },
  laserLinha: {
    height: 3,
    backgroundColor: COLORS.greenLeaf,
    shadowColor: COLORS.greenLeaf,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 4,
  },
  canto: {
    position: "absolute",
    width: CANTO,
    height: CANTO,
    borderColor: "#fff",
  },
  cantoSE: { top: 10, left: 10, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 },
  cantoSD: { top: 10, right: 10, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 },
  cantoIE: { bottom: 10, left: 10, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 },
  cantoID: { bottom: 10, right: 10, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 },
  exameCorpo: {
    paddingTop: 14,
    paddingHorizontal: 8,
    paddingBottom: 6,
  },
  trilha: {
    height: ETAPA_ICONE,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  trilhaLinha: {
    position: "absolute",
    top: ETAPA_ICONE / 2 - 1,
    left: ETAPA_ICONE / 2,
    right: ETAPA_ICONE / 2,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  trilhaFeita: {
    height: 2,
    backgroundColor: COLORS.greenLeaf,
  },
  etapa: {
    width: ETAPA_ICONE,
    height: ETAPA_ICONE,
    alignItems: "center",
    justifyContent: "center",
  },
  etapaAnel: {
    position: "absolute",
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: ETAPA_ICONE / 2 + 3,
    backgroundColor: "rgba(245,158,11,0.3)",
  },
  etapaPulso: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: ETAPA_ICONE / 2,
    backgroundColor: COLORS.amber,
  },
  etapaIcone: {
    width: ETAPA_ICONE,
    height: ETAPA_ICONE,
    borderRadius: ETAPA_ICONE / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ETAPA_A_SEGUIR,
  },
  etapaIconeFeita: {
    backgroundColor: COLORS.green,
  },
  etapaIconeAtual: {
    backgroundColor: COLORS.amber,
  },
  etapaRotulo: {
    marginTop: 14,
    fontFamily: FONTS.bodyExtraBold,
    fontSize: 13,
    letterSpacing: 1.2,
    color: COLORS.greenSoft,
  },
  etapaAtualCaixa: {
    minHeight: 52,
    marginTop: 4,
  },
  etapaAtual: {
    fontFamily: FONTS.displayBold,
    fontSize: 20,
    lineHeight: 26,
    color: "#fff",
  },
  trilho: {
    marginTop: 10,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.14)",
    overflow: "hidden",
  },
  preenchimento: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 6,
    overflow: "hidden",
  },
  brilho: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: BRILHO_LARGURA,
  },
  contagem: {
    marginTop: 8,
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.greenSoft,
  },
  aviso: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.amberSoft,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: "#fcd34d",
    padding: 14,
  },
  avisoTexto: {
    flex: 1,
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    lineHeight: 23,
    color: "#78350f",
  },
  carrossel: {
    minHeight: ALTURA_CARROSSEL,
  },
  cartao: {
    flexGrow: 1,
    minHeight: ALTURA_CARROSSEL,
    borderRadius: RADIUS.xxl,
    backgroundColor: COLORS.card,
    ...shadowSoft(),
  },
  // Recorte separado da sombra: overflow hidden no mesmo View apaga a sombra no iOS.
  cartaoRecorte: {
    flexGrow: 1,
    borderRadius: RADIUS.xxl,
    overflow: "hidden",
  },
  capa: {
    height: ALTURA_CAPA,
    overflow: "hidden",
  },
  capaImg: {
    position: "absolute",
  },
  seloPlay: {
    position: "absolute",
    right: 22,
    top: 38,
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.coral,
    ...shadowChunky("rgba(230,59,110,0.45)"),
    shadowOffset: { width: 0, height: 4 },
  },
  seloEbooks: {
    position: "absolute",
    right: 16,
    top: 34,
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 3,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.amber,
  },
  seloEbooksNumero: {
    fontFamily: FONTS.displayBlack,
    fontSize: 18,
    lineHeight: 19,
    color: COLORS.ink,
  },
  seloEbooksTexto: {
    marginTop: 1,
    fontFamily: FONTS.bodyExtraBold,
    fontSize: 10,
    lineHeight: 11,
    color: COLORS.ink,
  },
  cartaoCorpo: {
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 6,
  },
  cartaoTopo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cartaoTitulo: {
    flex: 1,
    fontFamily: FONTS.displayBold,
    fontSize: 19,
  },
  dica: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 16,
    lineHeight: 22,
    color: COLORS.ink,
  },
  botaoCanal: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    marginTop: 8,
    minHeight: 46,
    paddingHorizontal: 18,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.green,
    ...shadowChunky(COLORS.greenDeep),
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  botaoCanalFeito: {
    backgroundColor: COLORS.greenSoft,
    shadowOpacity: 0,
    elevation: 0,
  },
  botaoCanalTexto: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    color: "#fff",
  },
  botaoCanalTextoFeito: {
    color: COLORS.greenDeep,
  },
  carrosselTopo: {
    position: "absolute",
    top: 10,
    left: 14,
    right: 14,
    gap: 8,
  },
  segmentos: {
    flexDirection: "row",
    gap: SEGMENTO_GAP,
  },
  segmento: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  segmentoCheio: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
    backgroundColor: "#fff",
  },
  segmentoAndando: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#fff",
  },
  carrosselRotulo: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: 12,
    letterSpacing: 1.2,
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
