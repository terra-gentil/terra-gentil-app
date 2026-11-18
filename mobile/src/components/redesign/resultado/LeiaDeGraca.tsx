import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { EbookRecomendado } from "../../../api/diagnostico";
import { Ebook } from "../../../data/ebooks";
import { COLORS, FONTS } from "../../../constants/theme";
import { ebookDoRelatorio } from "./derivar";
import { T, cartao, fonte } from "./comum";

interface Props {
  ebooks: EbookRecomendado[];
  onAbrir: (ebook: Ebook) => void;
}

// Bloco 12: ate 2 guias indicados pelo Doutor; o toque abre o leitor direto, sem e-mail
export default function LeiaDeGraca({ ebooks, onAbrir }: Props) {
  const lista = ebooks
    .map((e) => ({ rec: e, ebook: ebookDoRelatorio(e) }))
    .filter((x): x is { rec: EbookRecomendado; ebook: Ebook } => x.ebook !== null)
    .slice(0, 2);
  if (lista.length === 0) return null;

  return (
    <View testID="leia-de-graca" style={{ gap: 10 }}>
      <View style={{ gap: 2, marginTop: 8 }}>
        <Text style={T.h3}>Leia de graça</Text>
        <Text style={fonte(FONTS.bodyMedium, 15, 1.4, COLORS.inkSoft)}>Abre aqui no app, sem cadastro.</Text>
      </View>
      <View style={styles.grade}>
        {lista.map(({ rec, ebook }) => (
          <TouchableOpacity
            key={ebook.id}
            testID={`ebook-${ebook.id}`}
            onPress={() => onAbrir(ebook)}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={`Ler o guia ${ebook.titulo}`}
            style={[cartao.base, styles.livro]}
          >
            <View style={styles.capa}>
              <LinearGradient colors={["#16a34a", "#14532d"]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFillObject} />
              <Text style={styles.capaTitulo}>{ebook.titulo}</Text>
              {!!ebook.capa && <Image source={{ uri: ebook.capa }} style={StyleSheet.absoluteFillObject} resizeMode="cover" accessible={false} />}
            </View>
            <View style={styles.textos}>
              <Text style={fonte(FONTS.bodyExtraBold, 15, 1.25)}>{ebook.titulo}</Text>
              {!!rec.motivo && (
                <Text style={fonte(FONTS.body, 15, 1.4, COLORS.inkSoft)} numberOfLines={4}>
                  {rec.motivo}
                </Text>
              )}
              <Text style={[fonte(FONTS.bodyExtraBold, 15, 1.2, COLORS.greenDeep), { marginTop: 4 }]}>Ler agora</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grade: { flexDirection: "row", gap: 10, alignItems: "stretch" },
  livro: { flex: 1, borderRadius: 18, overflow: "hidden" },
  capa: { aspectRatio: 3 / 4, justifyContent: "flex-end", padding: 12, overflow: "hidden" },
  capaTitulo: fonte(FONTS.displayBlack, 17, 1.15, "#fff"),
  textos: { paddingTop: 10, paddingHorizontal: 12, paddingBottom: 12, gap: 4 },
});
