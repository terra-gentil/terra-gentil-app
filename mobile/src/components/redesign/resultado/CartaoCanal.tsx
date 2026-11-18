import React from "react";
import { Image, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Play } from "lucide-react-native";
import { MASCOT_POSES } from "../../../assets/mascot";
import { COLORS, FONTS } from "../../../constants/theme";
import { cartao, fonte } from "./comum";

const YOUTUBE_CANAL = "https://www.youtube.com/@TerraGentil";

// Lembrete pedido na tela de espera (consumirLembrarCanal); aparece uma vez so
export default function CartaoCanal() {
  return (
    <TouchableOpacity
      testID="cartao-lembrete-canal"
      onPress={() => Linking.openURL(YOUTUBE_CANAL)}
      activeOpacity={0.88}
      accessibilityRole="link"
      accessibilityLabel="Você pediu para lembrar. Abrir o canal Terra Gentil no YouTube"
      style={[cartao.base, styles.cartao]}
    >
      <View style={styles.capa}>
        <Image source={MASCOT_POSES[0]} style={styles.capaImg} resizeMode="cover" accessible={false} />
        <View style={styles.play}>
          <Play size={18} color="#fff" fill="#fff" strokeWidth={0} />
        </View>
      </View>
      <View style={styles.textos}>
        <Text style={fonte(FONTS.displayBlack, 17, 1.25)}>Você pediu para lembrar</Text>
        <Text style={fonte(FONTS.body, 15, 1.45, COLORS.inkSoft)}>Vídeos novos toda semana no canal Terra Gentil no YouTube.</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cartao: { overflow: "hidden" },
  capa: { height: 120, overflow: "hidden", backgroundColor: COLORS.sky },
  capaImg: { width: "100%", height: "100%" },
  play: {
    position: "absolute",
    left: 12,
    bottom: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.coral,
    alignItems: "center",
    justifyContent: "center",
  },
  textos: { paddingTop: 12, paddingHorizontal: 14, paddingBottom: 14, gap: 2 },
});
