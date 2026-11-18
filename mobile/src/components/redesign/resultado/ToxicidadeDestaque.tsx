import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AlertTriangle, Baby, Cat, Dog } from "lucide-react-native";
import { Toxicidade } from "../../../api/diagnostico";
import { FONTS } from "../../../constants/theme";
import { AFETA, tituloToxicidade } from "./derivar";
import { COR, T, fonte } from "./comum";

// Bloco 7: toxicidade moderada ou grave, logo depois dos chips-resumo
export default function ToxicidadeDestaque({ tox }: { tox: Toxicidade }) {
  const linhas = [
    { label: "Partes tóxicas", texto: tox.partes_toxicas },
    { label: "Sintomas", texto: tox.sintomas },
    { label: "Se alguém mastigar", texto: tox.o_que_fazer },
  ].filter((l) => !!l.texto);
  return (
    <View testID="toxicidade-destaque" style={styles.caixa}>
      <View style={styles.titulo}>
        <AlertTriangle size={24} color={COR.rosaTexto} strokeWidth={2.2} />
        <Text style={[fonte(FONTS.displayBlack, 19, 1.25, COR.rosaTexto), { flex: 1 }]}>{tituloToxicidade(tox)}</Text>
      </View>
      {(tox.afeta || []).length > 0 && (
        <View style={styles.afeta}>
          {(tox.afeta || []).map((a) => {
            const [label, icone] = AFETA[a] || [a, "pessoa"];
            const Icone = icone === "cao" ? Dog : icone === "gato" ? Cat : Baby;
            return (
              <View key={a} style={styles.pilula}>
                <Icone size={20} color={COR.rosaTexto} strokeWidth={2} />
                <Text style={fonte(FONTS.bodyBold, 15, 1.1, COR.rosaTexto)}>{label}</Text>
              </View>
            );
          })}
        </View>
      )}
      {linhas.length > 0 && (
        <View style={styles.detalhes}>
          {linhas.map((l) => (
            <View key={l.label} style={{ gap: 2 }}>
              <Text style={T.rotulo}>{l.label}</Text>
              <Text style={T.corpo}>{l.texto}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  caixa: { backgroundColor: "#ffe1ec", borderRadius: 22, paddingTop: 16, paddingHorizontal: 16, paddingBottom: 18, gap: 12 },
  titulo: { flexDirection: "row", alignItems: "center", gap: 10 },
  afeta: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pilula: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 100, backgroundColor: "#fff" },
  detalhes: { gap: 10, backgroundColor: "#fff", borderRadius: 16, padding: 14 },
});
