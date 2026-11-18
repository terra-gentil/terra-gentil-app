import React, { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BookOpen } from "lucide-react-native";
import { useReduzirMovimento } from "../../../hooks/useReduzirMovimento";
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
        <Text style={fonte(FONTS.bodyMedium, 15, 1.4, COLORS.inkSoft)}>Toque no livro: abre aqui no app, sem cadastro.</Text>
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
              <View style={styles.faixa}>
                <Text style={fonte(FONTS.bodyExtraBold, 15, 1, "#fff")}>GRÁTIS</Text>
              </View>
            </View>
            <View style={styles.textos}>
              <Text style={fonte(FONTS.bodyExtraBold, 15, 1.25)}>{ebook.titulo}</Text>
              {!!rec.motivo && (
                <Text style={fonte(FONTS.body, 15, 1.4, COLORS.inkSoft)} numberOfLines={4}>
                  {rec.motivo}
                </Text>
              )}
              <BotaoLer />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// Botao "Ler agora" que pulsa de leve algumas vezes para chamar o toque (parado com reduzir movimento)
function BotaoLer() {
  const reduzir = useReduzirMovimento();
  const escala = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduzir) return;
    const pulso = Animated.loop(
      Animated.sequence([
        Animated.delay(1400),
        Animated.timing(escala, { toValue: 1.07, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(escala, { toValue: 1, duration: 420, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]),
      { iterations: 4 },
    );
    pulso.start();
    return () => pulso.stop();
  }, [reduzir, escala]);

  return (
    <Animated.View testID="botao-ler-ebook" style={[styles.botaoLer, { transform: [{ scale: escala }] }]}>
      <BookOpen size={18} color="#fff" strokeWidth={2.4} />
      <Text style={fonte(FONTS.bodyExtraBold, 15, 1.1, "#fff")}>Ler agora</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  grade: { flexDirection: "row", gap: 10, alignItems: "stretch" },
  livro: { flex: 1, borderRadius: 18, overflow: "hidden" },
  capa: { aspectRatio: 3 / 4, justifyContent: "flex-end", padding: 12, overflow: "hidden" },
  capaTitulo: fonte(FONTS.displayBlack, 17, 1.15, "#fff"),
  textos: { flex: 1, paddingTop: 10, paddingHorizontal: 12, paddingBottom: 12, gap: 4 },
  faixa: {
    position: "absolute",
    top: 10,
    left: 0,
    paddingVertical: 5,
    paddingLeft: 10,
    paddingRight: 12,
    borderTopRightRadius: 999,
    borderBottomRightRadius: 999,
    backgroundColor: COLORS.coralDeep,
  },
  botaoLer: {
    marginTop: "auto",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 48,
    borderRadius: 999,
    backgroundColor: COLORS.green,
  },
});
