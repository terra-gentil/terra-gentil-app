import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { OfertaCasada, avisoLojaEmBreve } from "../../../data/ofertas";
import { COLORS, FONTS } from "../../../constants/theme";
import { COR, cartao, fonte } from "./comum";

// Bloco 13: ofertas da aba Promocoes que casaram com os materiais do plano (nunca o quimico)
export default function OndeEncontrar({ ofertas }: { ofertas: OfertaCasada[] }) {
  if (ofertas.length === 0) return null;
  return (
    <View testID="onde-encontrar" style={styles.faixa}>
      <View style={{ gap: 2 }}>
        <Text style={fonte(FONTS.displayBlack, 19, 1.2)}>Onde encontrar</Text>
        <Text style={fonte(FONTS.bodyMedium, 15, 1.4, COLORS.inkSoft)}>Ofertas parceiras. O diagnóstico não depende delas.</Text>
      </View>
      {ofertas.map((o) => (
        <TouchableOpacity
          key={o.id}
          testID={`oferta-${o.id}`}
          onPress={avisoLojaEmBreve}
          activeOpacity={0.88}
          style={[cartao.base, styles.oferta]}
        >
          <LinearGradient colors={o.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.miniatura} />
          <View style={styles.textos}>
            <Text style={fonte(FONTS.displayBlack, 15, 1.2, COLORS.greenDeep)} numberOfLines={1}>
              Para: {o.para}
            </Text>
            <Text style={fonte(FONTS.bodyExtraBold, 15, 1.25)} numberOfLines={2}>
              {o.nome}
            </Text>
            <View style={styles.rodape}>
              <Text style={fonte(FONTS.displayBlack, 17, 1.1, COLORS.greenDark)}>{o.preco}</Text>
              <Text style={fonte(FONTS.bodyBold, 15, 1.1, COLORS.greenDeep)}>Ver oferta</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  faixa: { gap: 10, padding: 14, borderRadius: 22, borderWidth: 1.5, borderStyle: "dashed", borderColor: COR.borda },
  oferta: { flexDirection: "row", gap: 12, padding: 10, borderRadius: 16 },
  miniatura: { width: 72, height: 72, borderRadius: 12 },
  textos: { flex: 1, minWidth: 0, gap: 2 },
  rodape: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: "auto" },
});
