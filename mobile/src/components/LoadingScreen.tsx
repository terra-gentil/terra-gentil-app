import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Bug,
  Check,
  Clock,
  Droplets,
  ImageUp,
  Leaf,
  Lightbulb,
  Stethoscope,
} from "lucide-react-native";
import { MASCOT_ANALYZING, MASCOT_POSES } from "../assets/mascot";
import { COLORS, FONTS, RADIUS, shadowChunky, shadowSoft } from "../constants/theme";

// Etapas sao ilusao de progresso: avancam por tempo, nao pelo backend.
export const ETAPAS = [
  { texto: "Recebendo a sua foto", Icone: ImageUp },
  { texto: "Olhando as folhas de perto", Icone: Leaf },
  { texto: "Conferindo sinais de pragas e fungos", Icone: Bug },
  { texto: "Verificando rega e luz", Icone: Droplets },
  { texto: "Preparando as dicas do Doutor", Icone: Stethoscope },
] as const;

// Momento (ms desde a montagem) em que cada etapa seguinte comeca.
// A ultima fica ativa ate a resposta chegar.
export const INICIO_ETAPAS_MS = [0, 3000, 10000, 19000, 28000];

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

export const DICA_INTERVALO_MS = 6500;
export const DEMORA_MS = 45000;

// Curva da barra: p(s) = 0,95 x (1 - e^(-s/18)), s em segundos.
// Avanca rapido no comeco, desacelera e nunca chega a 100%.
const BARRA_DURACAO_MS = 300000;
const BARRA_PONTOS_S = [0, 2, 5, 10, 15, 20, 30, 40, 50, 60, 90, 120, 180, 300];
const BARRA_INPUT = BARRA_PONTOS_S.map((s) => (s * 1000) / BARRA_DURACAO_MS);
export const BARRA_OUTPUT = BARRA_PONTOS_S.map((s) => 0.95 * (1 - Math.exp(-s / 18)));

const LASER_CORES = ["rgba(34,197,94,0)", "rgba(34,197,94,0.35)", "rgba(34,197,94,0)"] as const;
const BARRA_CORES = [COLORS.green, COLORS.greenLeaf] as const;
const BRILHO_CORES = ["rgba(255,255,255,0)", "rgba(255,255,255,0.55)", "rgba(255,255,255,0)"] as const;
const HORIZONTAL_INICIO = { x: 0, y: 0 };
const HORIZONTAL_FIM = { x: 1, y: 0 };

const LASER_ALTURA = 64;
const AVATAR = 92;

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

export function LoadingScreen({ imageUri }: Props = {}) {
  const insets = useSafeAreaInsets();
  const { width: larguraTela } = useWindowDimensions();
  const reduzir = useReduzirMovimento();

  const [etapa, setEtapa] = useState(0);
  const [dica, setDica] = useState(0);
  const [demorando, setDemorando] = useState(false);
  const [larguraBarra, setLarguraBarra] = useState(0);

  const laser = useRef(new Animated.Value(0)).current;
  const respiro = useRef(new Animated.Value(0)).current;
  const pulso = useRef(new Animated.Value(0)).current;
  const brilho = useRef(new Animated.Value(0)).current;
  const relogioBarra = useRef(new Animated.Value(0)).current;
  const opacidadeDica = useRef(new Animated.Value(1)).current;

  const larguraCartao = Math.min(larguraTela - 40, 360);
  const alturaFoto = Math.round(Math.min(larguraCartao * 0.72, 250));

  // Etapas, dicas e aviso de demora. Tudo em baixa frequencia e limpo no unmount.
  useEffect(() => {
    const timeouts = INICIO_ETAPAS_MS.slice(1).map((ms, i) =>
      setTimeout(() => setEtapa(i + 1), ms),
    );
    const demora = setTimeout(() => setDemorando(true), DEMORA_MS);
    const intervaloDica = setInterval(() => {
      setDica((d) => (d + 1) % DICAS.length);
    }, DICA_INTERVALO_MS);
    return () => {
      timeouts.forEach(clearTimeout);
      clearTimeout(demora);
      clearInterval(intervaloDica);
    };
  }, []);

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

  // Fade suave a cada dica nova (sem fade com reduzir movimento).
  useEffect(() => {
    if (reduzir) {
      opacidadeDica.setValue(1);
      return;
    }
    opacidadeDica.setValue(0);
    const anim = Animated.timing(opacidadeDica, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [dica, reduzir, opacidadeDica]);

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
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulso, { toValue: 1, duration: 1100, easing: seno, useNativeDriver: true }),
          Animated.timing(pulso, { toValue: 0, duration: 1100, easing: seno, useNativeDriver: true }),
        ]),
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

  const laserY = laser.interpolate({
    inputRange: [0, 1],
    outputRange: [-LASER_ALTURA / 2, alturaFoto - LASER_ALTURA / 2],
  });
  const mascoteY = respiro.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });
  const mascoteGiro = respiro.interpolate({ inputRange: [0, 1], outputRange: ["-2deg", "2deg"] });
  const pulsoEscala = pulso.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
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
    outputRange: [-120, Math.max(larguraBarra, 1)],
  });

  const etapaAtual = ETAPAS[etapa];
  const legendaBarra = demorando
    ? "Ainda cuidando da sua planta com carinho."
    : "Costuma levar de 15 a 40 segundos.";

  return (
    <View
      style={styles.tela}
      accessible={false}
      accessibilityRole="progressbar"
      accessibilityLabel="O Doutor Gentileza está analisando a sua planta. Aguarde."
      accessibilityState={{ busy: true }}
      testID="loading-diagnostico"
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.conteudo, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabecalho */}
        <View style={styles.selo}>
          <Stethoscope size={16} color={COLORS.greenDeep} strokeWidth={2.5} />
          <Text style={styles.seloTexto}>DOUTOR GENTILEZA</Text>
        </View>
        <Text style={styles.titulo} accessibilityRole="header">
          Analisando a sua planta
        </Text>

        {/* Foto com varredura */}
        <View style={[styles.cartaoFoto, { width: larguraCartao, height: alturaFoto }]}>
          <Image
            source={imageUri ? { uri: imageUri } : MASCOT_ANALYZING}
            style={styles.foto}
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

        {/* Doutor pensando com balao de dica */}
        <View style={[styles.linhaDoutor, { width: larguraCartao }]}>
          <Animated.View
            style={[
              styles.avatar,
              { transform: [{ translateY: mascoteY }, { rotate: mascoteGiro }] },
            ]}
          >
            <Image source={MASCOT_POSES[1]} style={styles.avatarImg} />
          </Animated.View>
          <View style={styles.balao}>
            <View style={styles.balaoBico} />
            <View style={styles.balaoTopo}>
              <Lightbulb size={18} color={COLORS.amber} strokeWidth={2.5} />
              <Text style={styles.balaoRotulo}>Você sabia?</Text>
            </View>
            <Animated.Text style={[styles.dica, { opacity: opacidadeDica }]} testID="dica">
              {DICAS[dica]}
            </Animated.Text>
          </View>
        </View>

        {/* Etapas */}
        <View style={[styles.cartaoEtapas, { width: larguraCartao }]}>
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
                <Animated.View
                  style={[
                    styles.etapaIcone,
                    feita && styles.etapaIconeFeita,
                    atual && styles.etapaIconeAtual,
                    atual && !reduzir && { transform: [{ scale: pulsoEscala }] },
                  ]}
                >
                  {feita ? (
                    <Check size={18} color="#fff" strokeWidth={3.2} />
                  ) : (
                    <Icone size={18} color={atual ? "#fff" : COLORS.inkMute} strokeWidth={2.5} />
                  )}
                </Animated.View>
                <Text
                  style={[
                    styles.etapaTexto,
                    feita && styles.etapaTextoFeita,
                    atual && styles.etapaTextoAtual,
                  ]}
                >
                  {e.texto}
                </Text>
              </View>
            );
          })}
        </View>

        {demorando && (
          <View style={[styles.aviso, { width: larguraCartao }]} accessibilityLiveRegion="polite">
            <Clock size={22} color="#92400e" strokeWidth={2.5} />
            <Text style={styles.avisoTexto}>
              Está demorando um pouquinho mais que o normal. Já já o Doutor termina, não feche o app.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Rodape fixo: etapa atual e barra de progresso */}
      <View style={[styles.rodape, { paddingBottom: insets.bottom + 18 }]}>
        <Text
          style={styles.rodapeEtapa}
          accessibilityLiveRegion="polite"
          testID="etapa-atual"
          numberOfLines={2}
        >
          {etapaAtual.texto}...
        </Text>
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
        <Text style={styles.rodapeLegenda}>{legendaBarra}</Text>
      </View>
    </View>
  );
}

const CANTO = 26;

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
    paddingBottom: 20,
  },
  selo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.greenSoft,
    borderRadius: RADIUS.pill,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  seloTexto: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: 13,
    letterSpacing: 1,
    color: COLORS.greenDeep,
  },
  titulo: {
    fontFamily: FONTS.displayBlack,
    fontSize: 28,
    color: COLORS.greenDark,
    textAlign: "center",
    marginBottom: 16,
  },
  cartaoFoto: {
    borderRadius: RADIUS.hero,
    overflow: "hidden",
    backgroundColor: COLORS.greenDark,
    borderWidth: 4,
    borderColor: "#fff",
    ...shadowChunky(COLORS.greenDeep + "55"),
  },
  foto: {
    width: "100%",
    height: "100%",
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
  cantoSE: { top: 12, left: 12, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 10 },
  cantoSD: { top: 12, right: 12, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 10 },
  cantoIE: { bottom: 12, left: 12, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 10 },
  cantoID: { bottom: 12, right: 12, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 10 },
  linhaDoutor: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 18,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    overflow: "hidden",
    borderWidth: 4,
    borderColor: "#fff",
    backgroundColor: COLORS.sky,
    ...shadowChunky(COLORS.greenDeep + "40"),
  },
  // A arte e paisagem (16:9) com o Doutor a direita: amplia e desloca pra enquadrar o rosto.
  avatarImg: {
    position: "absolute",
    height: 140,
    width: 249,
    left: -115,
    top: -34,
  },
  balao: {
    flex: 1,
    marginLeft: 14,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: AVATAR,
    ...shadowSoft(),
  },
  balaoBico: {
    position: "absolute",
    left: -7,
    top: 30,
    width: 16,
    height: 16,
    backgroundColor: COLORS.card,
    transform: [{ rotate: "45deg" }],
  },
  balaoTopo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  balaoRotulo: {
    fontFamily: FONTS.displayBold,
    fontSize: 16,
    color: "#b45309",
  },
  dica: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 16,
    lineHeight: 23,
    color: COLORS.ink,
  },
  cartaoEtapas: {
    marginTop: 18,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    paddingVertical: 8,
    paddingHorizontal: 14,
    ...shadowSoft(),
  },
  etapa: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 12,
  },
  etapaIcone: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.divider,
  },
  etapaIconeFeita: {
    backgroundColor: COLORS.green,
  },
  etapaIconeAtual: {
    backgroundColor: COLORS.amber,
  },
  etapaTexto: {
    flex: 1,
    fontFamily: FONTS.bodyMedium,
    fontSize: 16,
    lineHeight: 22,
    color: COLORS.inkSoft,
  },
  etapaTextoFeita: {
    color: COLORS.greenDeep,
  },
  etapaTextoAtual: {
    fontFamily: FONTS.bodyExtraBold,
    color: COLORS.ink,
  },
  aviso: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
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
  rodape: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: RADIUS.hero,
    borderTopRightRadius: RADIUS.hero,
    paddingTop: 18,
    paddingHorizontal: 24,
    ...shadowSoft(),
  },
  rodapeEtapa: {
    fontFamily: FONTS.displayBold,
    fontSize: 19,
    color: COLORS.greenDark,
    textAlign: "center",
    marginBottom: 12,
  },
  trilho: {
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.greenSoft,
    overflow: "hidden",
  },
  preenchimento: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 8,
    overflow: "hidden",
  },
  brilho: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 120,
  },
  rodapeLegenda: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.inkSoft,
    textAlign: "center",
    marginTop: 10,
  },
});
