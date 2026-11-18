import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Camera, MessageCircle, Share2 } from "lucide-react-native";
import { COLORS, FONTS } from "../../../constants/theme";
import { COR, fonte } from "./comum";

interface Props {
  insetInferior: number;
  onPerguntar: () => void;
  onCompartilhar: () => void;
  onNovaFoto: () => void;
}

export const ALTURA_BARRA = 84;

// Bloco 19: Perguntar, Compartilhar e Nova foto, sempre a mao
export default function BarraFixa({ insetInferior, onPerguntar, onCompartilhar, onNovaFoto }: Props) {
  return (
    <View testID="barra-fixa" style={[styles.barra, { paddingBottom: 12 + insetInferior }]}>
      <TouchableOpacity testID="botao-perguntar-comunidade" onPress={onPerguntar} activeOpacity={0.85} style={[styles.botao, styles.primario]}>
        <MessageCircle size={22} color="#fff" strokeWidth={2.3} />
        <Text style={[styles.texto, { color: "#fff" }]}>Perguntar</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="botao-compartilhar" onPress={onCompartilhar} activeOpacity={0.85} style={[styles.botao, styles.secundario]}>
        <Share2 size={22} color={COLORS.greenDark} strokeWidth={2.3} />
        <Text style={styles.texto}>Compartilhar</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="botao-nova-foto" onPress={onNovaFoto} activeOpacity={0.85} style={[styles.botao, styles.secundario]}>
        <Camera size={22} color={COLORS.greenDark} strokeWidth={2.3} />
        <Text style={styles.texto}>Nova foto</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  barra: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: 8,
    paddingTop: 10,
    paddingHorizontal: 12,
    backgroundColor: "rgba(246,241,231,0.97)",
    borderTopWidth: 1,
    borderTopColor: COR.bege,
  },
  botao: { flex: 1, height: 62, borderRadius: 16, alignItems: "center", justifyContent: "center", gap: 4 },
  primario: {
    backgroundColor: COLORS.green,
    shadowColor: COLORS.greenDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  secundario: { backgroundColor: "#fff", borderWidth: 1.5, borderColor: COR.borda },
  texto: fonte(FONTS.bodyExtraBold, 15, 1.1, COLORS.greenDark),
});
