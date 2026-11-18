import React from "react";
import { StyleSheet, Text, TextStyle, View } from "react-native";
import { ChevronDown } from "lucide-react-native";
import { COLORS, FONTS, shadowSoft } from "../../../constants/theme";

// Cores do laudo que nao estao no tema
export const COR = {
  linha: "#efeae0",
  bege: "#e7e0d2",
  borda: "#d6cdbb",
  texto2: "#44403c",
  ambarTexto: "#78350f",
  ambarForte: "#92400e",
  rosaTexto: "#9f1d47",
  verdeClaro: "#ecfdf3",
  verdeFundo: "#f0fdf4",
  ambarFundo: "#fffbeb",
  ambarBorda: "#fcd34d",
  lilasTitulo: "#4c1d95",
  lilasTexto: "#3b0764",
  coral: "#ff5a3c",
};

// Fonte com tamanho e altura de linha; nada abaixo de 15
export function fonte(family: string, size: number, lineHeight: number, color: string = COLORS.ink): TextStyle {
  return { fontFamily: family, fontSize: Math.max(size, 15), lineHeight: Math.round(Math.max(size, 15) * lineHeight), color };
}

export const T = StyleSheet.create({
  h3: fonte(FONTS.displayBlack, 21, 1.2, COLORS.greenDark),
  rotulo: fonte(FONTS.bodyExtraBold, 15, 1.3),
  corpo: fonte(FONTS.body, 15, 1.5, COR.texto2),
  corpoInk: fonte(FONTS.body, 15, 1.5, COLORS.ink),
});

export const cartao = StyleSheet.create({
  base: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    ...shadowSoft(),
  },
});

// Indicador de "toque para abrir": chevron num circulo colorido; com `texto`, vira pilula "Ver" / "Fechar"
export function Chevron({
  aberto,
  cor = COLORS.greenDark,
  tamanho = 20,
  texto = false,
}: {
  aberto: boolean;
  cor?: string;
  tamanho?: number;
  texto?: boolean;
}) {
  const claro = cor.toLowerCase() === "#fff" || cor.toLowerCase() === "#ffffff";
  const fundo = claro ? "rgba(255,255,255,0.2)" : cor === COR.ambarTexto ? "#fde68a" : "#dcfce7";
  return (
    <View
      style={[
        { backgroundColor: fundo, borderRadius: 999, flexDirection: "row", alignItems: "center", justifyContent: "center" },
        texto ? { paddingLeft: 12, paddingRight: 8, height: 34, gap: 2 } : { width: 34, height: 34 },
      ]}
    >
      {texto && <Text style={fonte(FONTS.bodyExtraBold, 15, 1.2, cor)}>{aberto ? "Fechar" : "Ver"}</Text>}
      <View style={{ transform: [{ rotate: aberto ? "180deg" : "0deg" }] }}>
        <ChevronDown size={tamanho} color={cor} strokeWidth={2.6} />
      </View>
    </View>
  );
}
