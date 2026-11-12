import React from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BookOpen, Camera, Home, Tv, User, Users } from "lucide-react-native";
import { COLORS, FONTS } from "../../constants/theme";
import { useIntermitentePulse } from "../../hooks/useIntermitentePulse";

type Aba = {
  rota: string;
  rotulo: string;
  Icone: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  // Peso da largura dentro do lado da barra: rotulo comprido ganha mais espaco.
  peso: number;
};

// A Camera fica no centro. Na esquerda vao 2 abas (uma delas com o rotulo mais comprido),
// na direita as 3 de rotulo curto, pra nada apertar em telas de 320 a 360 dp.
export const ABAS_ESQUERDA: Aba[] = [
  { rota: "HomeTab", rotulo: "Início", Icone: Home, peso: 4 },
  { rota: "CommunityTab", rotulo: "Comunidade", Icone: Users, peso: 6 },
];

export const ABAS_DIREITA: Aba[] = [
  { rota: "EbooksTab", rotulo: "Ebooks", Icone: BookOpen, peso: 4 },
  { rota: "VideosTab", rotulo: "Vídeos", Icone: Tv, peso: 4 },
  { rota: "ProfileTab", rotulo: "Eu", Icone: User, peso: 3 },
];

const TOTAL_ABAS = ABAS_ESQUERDA.length + ABAS_DIREITA.length;

type Props = Pick<BottomTabBarProps, "state" | "navigation"> & {
  onFabPress: () => void;
};

export default function MainTabBar({ state, navigation, onFabPress }: Props) {
  const insets = useSafeAreaInsets();
  const fabPulse = useIntermitentePulse(4000, 6000);
  const rotaAtiva = state.routes[state.index]?.name;

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
          minimumFontScale={0.85}
          maxFontSizeMultiplier={1.2}
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
        <View style={tabStyles.espacoFab} />
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
    paddingHorizontal: 4,
  },
  // Os dois lados tem a mesma largura, entao a Camera fica exatamente no meio.
  lado: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  espacoFab: {
    width: 72,
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
