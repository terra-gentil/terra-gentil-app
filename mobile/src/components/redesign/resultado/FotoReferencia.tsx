import React, { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { COLORS, FONTS } from "../../../constants/theme";
import { fonte } from "./comum";

interface Props {
  uri?: string;
  tamanho?: number;
  // Fundo escuro (veredito) usa texto claro
  claro?: boolean;
  testID?: string;
  // Sem titulo, so a miniatura com "Foto: Wikipedia" embaixo (lista de alternativas)
  titulo?: string;
}

// Miniatura da especie vinda da Wikipedia. Se a URL vier vazia ou a imagem falhar, some inteira.
export default function FotoReferencia({ uri, tamanho = 64, claro = false, testID = "foto-referencia", titulo }: Props) {
  const [falhou, setFalhou] = useState(false);
  if (!uri || falhou) return null;
  const corTexto = claro ? COLORS.greenSoft : COLORS.inkSoft;
  return (
    <View testID={testID} style={[styles.linha, !titulo && styles.coluna]}>
      <Image
        testID={`${testID}-imagem`}
        source={{ uri }}
        style={{ width: tamanho, height: tamanho, borderRadius: 14, backgroundColor: claro ? "rgba(255,255,255,0.15)" : "#e7e0d2" }}
        resizeMode="cover"
        accessibilityLabel={titulo || "Foto de referência"}
        onError={() => setFalhou(true)}
      />
      {titulo ? (
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text style={fonte(FONTS.bodyBold, 15, 1.3, claro ? "#fff" : COLORS.ink)}>{titulo}</Text>
          <Text style={fonte(FONTS.body, 15, 1.3, corTexto)}>Foto: Wikipedia</Text>
        </View>
      ) : (
        <Text style={fonte(FONTS.body, 15, 1.2, corTexto)}>Foto: Wikipedia</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: "row", alignItems: "center", gap: 12 },
  coluna: { flexDirection: "column", alignItems: "center", gap: 4 },
});
