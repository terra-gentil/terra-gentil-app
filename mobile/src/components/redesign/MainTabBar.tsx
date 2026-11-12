import React from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BookOpen, Camera, Home, ShoppingBag, Tv, User, Users } from "lucide-react-native";
import { COLORS, FONTS } from "../../constants/theme";
import { useIntermitentePulse } from "../../hooks/useIntermitentePulse";

type Aba = {
  rota: string;
  rotulo: string;
  Icone: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  // Peso da largura dentro do lado da barra: rotulo comprido ganha mais espaco.
  peso: number;
};

// A Camera fica no centro, com 3 abas de cada lado.
// Esquerda: os rotulos compridos. O peso acompanha a largura do texto (Comunidade 70 dp,
// Promocoes 62 dp, Inicio 29 dp em corpo 11), com folga extra no Inicio pra area de toque.
// Direita: rotulos curtos, tres partes iguais.
export const ABAS_ESQUERDA: Aba[] = [
  { rota: "HomeTab", rotulo: "Início", Icone: Home, peso: 5 },
  { rota: "CommunityTab", rotulo: "Comunidade", Icone: Users, peso: 8 },
  { rota: "PromosTab", rotulo: "Promoções", Icone: ShoppingBag, peso: 7 },
];

export const ABAS_DIREITA: Aba[] = [
  { rota: "EbooksTab", rotulo: "Ebooks", Icone: BookOpen, peso: 1 },
  { rota: "VideosTab", rotulo: "Vídeos", Icone: Tv, peso: 1 },
  { rota: "ProfileTab", rotulo: "Eu", Icone: User, peso: 1 },
];

// Em 320 dp os rotulos compridos precisam encolher ate uns 76% pra nao cortar.
const ESCALA_MINIMA_ROTULO = 0.75;
const MARGEM_LATERAL = 2;
// Largura de um lado em que os tres rotulos da esquerda cabem no corpo cheio.
const LADO_IDEAL = 176;
const RESERVA_MIN = 48;
const RESERVA_MAX = 72;

// Espaco reservado no meio pra Camera (64 dp). Em tela estreita a reserva encolhe ate 48 dp
// pra sobrar largura pros rotulos: o circulo avanca 8 dp sobre as abas vizinhas, sem encostar
// nos icones (folga de uns 3 dp em 320, 6 dp em 360) e acima da linha dos rotulos.
export function reservaCentral(larguraTela: number): number {
  const sobra = larguraTela - 2 * MARGEM_LATERAL - 2 * LADO_IDEAL;
  return Math.min(RESERVA_MAX, Math.max(RESERVA_MIN, sobra));
}

// Largura de cada lado da barra (os dois sao iguais).
export function larguraDoLado(larguraTela: number): number {
  return (larguraTela - 2 * MARGEM_LATERAL - reservaCentral(larguraTela)) / 2;
}

const TOTAL_ABAS = ABAS_ESQUERDA.length + ABAS_DIREITA.length;

type Props = Pick<BottomTabBarProps, "state" | "navigation"> & {
  onFabPress: () => void;
};

export default function MainTabBar({ state, navigation, onFabPress }: Props) {
  const insets = useSafeAreaInsets();
  const fabPulse = useIntermitentePulse(4000, 6000);
  const rotaAtiva = state.routes[state.index]?.name;
  const { width: larguraTela } = useWindowDimensions();
  const reserva = reservaCentral(larguraTela);
  // A fonte grande do sistema so aumenta o rotulo ate onde a largura deixa (teto de 1,2x),
  // senao "Comunidade" e "Promoções" seriam cortados no celular.
  const tetoFonte = Math.min(1.2, Math.max(1, larguraDoLado(larguraTela) / LADO_IDEAL));

  function renderAba(aba: Aba, posicao: number) {
    const ativa = rotaAtiva === aba.rota;
    const cor = ativa ? COLORS.green : COLORS.inkMute;
    return (
      <TouchableOpacity
        key={aba.rota}
        onPress={() => navigation.navigate(aba.rota)}
        style={[tabStyles.tab, { flex: aba.peso }]}
        accessibilityRole="tab"
        accessibilityLabel={`${aba.rotulo}, aba ${posicao} de ${TOTAL_ABAS}`}
        accessibilityState={{ selected: ativa }}
      >
        <aba.Icone size={24} color={cor} strokeWidth={2.2} />
        <Text
          style={[tabStyles.tabLabel, ativa && tabStyles.tabLabelActive]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={ESCALA_MINIMA_ROTULO}
          maxFontSizeMultiplier={tetoFonte}
        >
          {aba.rotulo}
        </Text>
        {ativa && <View style={tabStyles.tabDot} />}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[tabStyles.container, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      {/* FAB central */}
      <TouchableOpacity
        onPress={onFabPress}
        style={tabStyles.fab}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Tirar foto da planta"
      >
        <Animated.View style={{ transform: [{ scale: fabPulse }] }}>
          <Camera size={28} color="#fff" strokeWidth={2.2} />
        </Animated.View>
      </TouchableOpacity>

      <View style={tabStyles.tabRow} accessibilityRole="tablist">
        <View style={tabStyles.lado}>{ABAS_ESQUERDA.map((aba, i) => renderAba(aba, i + 1))}</View>
        <View style={{ width: reserva }} />
        <View style={tabStyles.lado}>
          {ABAS_DIREITA.map((aba, i) => renderAba(aba, ABAS_ESQUERDA.length + i + 1))}
        </View>
      </View>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  container: {
    position: "relative",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  fab: {
    position: "absolute",
    left: "50%",
    top: -28,
    marginLeft: -32,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.green,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.greenDeep,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
    zIndex: 10,
  },
  tabRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 68,
    paddingHorizontal: MARGEM_LATERAL,
  },
  // Os dois lados tem a mesma largura, entao a Camera fica exatamente no meio.
  lado: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  tab: {
    alignItems: "center",
    paddingVertical: 10,
    gap: 4,
  },
  tabLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 11,
    color: COLORS.inkMute,
  },
  tabLabelActive: {
    fontFamily: FONTS.bodyExtraBold,
    color: COLORS.green,
  },
  tabDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.green,
  },
});
