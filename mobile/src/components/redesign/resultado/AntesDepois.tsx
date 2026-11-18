import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { EstadoSaude } from "../../../api/diagnostico";
import { COLORS, FONTS } from "../../../constants/theme";
import { ESTADO } from "./derivar";
import { COR, T, cartao, fonte } from "./comum";

export interface FotoNoTempo {
  imageUri: string;
  timestamp: number;
  estado_saude: EstadoSaude;
}

const PESO: Record<string, number> = { saudavel: 0, atencao: 1, doente: 2, critico: 3 };

export function comparacao(antes: EstadoSaude, agora: EstadoSaude): string {
  const a = PESO[antes] ?? 1;
  const b = PESO[agora] ?? 1;
  if (b < a) return "Melhorou desde a última foto. Continue assim!";
  if (b > a) return "Piorou desde a última foto. Vale seguir o plano com atenção.";
  return "Está parecida com a última foto.";
}

function dataCurta(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function Lado({ titulo, foto }: { titulo: string; foto: FotoNoTempo }) {
  const [rotulo, fundo, texto] = ESTADO[foto.estado_saude] || ESTADO.atencao;
  return (
    <View style={{ flex: 1, gap: 6 }}>
      <View style={styles.foto}>
        <Image source={{ uri: foto.imageUri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" accessibilityLabel={`Foto ${titulo.toLowerCase()}`} />
      </View>
      <Text style={T.rotulo}>
        {titulo} <Text style={{ fontFamily: FONTS.bodyMedium, color: COLORS.inkSoft }}>· {dataCurta(foto.timestamp)}</Text>
      </Text>
      <View style={[styles.chip, { backgroundColor: fundo }]}>
        <Text style={fonte(FONTS.bodyExtraBold, 15, 1.2, texto)}>{rotulo}</Text>
      </View>
    </View>
  );
}

// "Como estava e como esta": so aparece quando ha foto anterior da mesma planta
export default function AntesDepois({ antes, agora }: { antes: FotoNoTempo; agora: FotoNoTempo }) {
  return (
    <View testID="antes-depois" style={[cartao.base, styles.caixa]}>
      <Text style={T.h3}>Como estava e como está</Text>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Lado titulo="Antes" foto={antes} />
        <Lado titulo="Agora" foto={agora} />
      </View>
      <Text style={[T.corpoInk, { fontFamily: FONTS.bodySemiBold }]}>{comparacao(antes.estado_saude, agora.estado_saude)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  caixa: { padding: 16, gap: 12 },
  foto: { aspectRatio: 1, borderRadius: 16, overflow: "hidden", backgroundColor: COR.bege },
  chip: { alignSelf: "flex-start", borderRadius: 100, paddingVertical: 4, paddingHorizontal: 10 },
});
