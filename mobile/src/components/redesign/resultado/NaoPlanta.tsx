import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Camera } from "lucide-react-native";
import { MASCOT_POSES } from "../../../assets/mascot";
import { COLORS, FONTS } from "../../../constants/theme";
import { COR, cartao, fonte } from "./comum";

interface Props {
  oQueAparece: string;
  dicaProxima: string;
  onNovaFoto: () => void;
}

// Estado proprio quando a foto nao tem planta: sem barra fixa, botao grande de nova foto
export default function NaoPlanta({ oQueAparece, dicaProxima, onNovaFoto }: Props) {
  return (
    <View testID="estado-nao-planta" style={{ gap: 14 }}>
      <View style={[cartao.base, { borderRadius: 24, overflow: "hidden" }]}>
        <Image source={MASCOT_POSES[2]} style={styles.mascote} resizeMode="cover" accessible={false} />
        <View style={styles.corpo}>
          <View style={styles.pilula}>
            <Text style={fonte(FONTS.bodyBold, 15, 1.2, COLORS.inkSoft)}>Sem planta na foto</Text>
          </View>
          <Text style={fonte(FONTS.displayBlack, 24, 1.2, COLORS.greenDark)}>Não encontrei uma planta nesta foto</Text>
          {!!oQueAparece && <Text style={fonte(FONTS.body, 16, 1.5, COR.texto2)}>{oQueAparece}</Text>}
        </View>
      </View>
      {!!dicaProxima && (
        <View style={styles.dica}>
          <View style={styles.dicaIcone}>
            <Camera size={22} color="#fff" strokeWidth={2.2} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={fonte(FONTS.displayBold, 17, 1.3, COLORS.greenDark)}>Para a próxima foto</Text>
            <Text style={fonte(FONTS.body, 16, 1.5, COLORS.greenDark)}>{dicaProxima}</Text>
          </View>
        </View>
      )}
      <TouchableOpacity testID="botao-nova-foto-nao-planta" onPress={onNovaFoto} activeOpacity={0.85} style={styles.botao}>
        <Camera size={22} color="#fff" strokeWidth={2.4} />
        <Text style={fonte(FONTS.displayBlack, 18, 1.2, "#fff")}>Tirar nova foto</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  mascote: { width: "100%", height: 150 },
  corpo: { paddingTop: 18, paddingHorizontal: 18, paddingBottom: 20, gap: 10 },
  pilula: { alignSelf: "flex-start", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 100, backgroundColor: COR.linha },
  dica: { backgroundColor: COLORS.greenSoft, borderRadius: 20, paddingVertical: 16, paddingHorizontal: 18, flexDirection: "row", gap: 12 },
  dicaIcone: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.green, alignItems: "center", justifyContent: "center" },
  botao: {
    height: 56,
    borderRadius: 18,
    backgroundColor: COLORS.green,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: COLORS.greenDeep,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
});
