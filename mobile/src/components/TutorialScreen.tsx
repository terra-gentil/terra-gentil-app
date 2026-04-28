import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MASCOT_POSES } from "../assets/mascot";
import { COLORS, FONTS, SIZES, shadowChunky, shadowSoft } from "../constants/theme";
import { marcarTutorialVisto } from "../storage/preferencias";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Props {
  onConcluir: () => void;
}

interface Slide {
  titulo: string;
  descricao: string;
  imagem: number;
  emoji: string;
}

const SLIDES: Slide[] = [
  {
    titulo: "Bora tirar uma foto bem tirada",
    descricao:
      "Vou te mostrar em 3 passos simples como conseguir a melhor foto pra eu analisar sua planta com precisao.",
    imagem: MASCOT_POSES[0],
    emoji: "📸",
  },
  {
    titulo: "Chegue perto da folha",
    descricao:
      "Aproxime o celular da parte que esta com problema. Quanto mais perto, melhor eu enxergo os detalhes. Foco numa folha so, sem bagunca no quadro.",
    imagem: MASCOT_POSES[1],
    emoji: "🌿",
  },
  {
    titulo: "Luz natural e o segredo",
    descricao:
      "Prefira sombra clarinha ou luz natural suave. Evite sol a pino e sombras pesadas projetadas. Se puder, foto de dia, perto de uma janela.",
    imagem: MASCOT_POSES[2],
    emoji: "☀️",
  },
  {
    titulo: "Foque no problema",
    descricao:
      "Toque na tela pra focar antes de clicar. Se o problema esta numa folha, fotografe ela. Se esta no caule, inclua o caule. Me mostre o que preocupa voce.",
    imagem: MASCOT_POSES[3],
    emoji: "🎯",
  },
];

export function TutorialScreen({ onConcluir }: Props) {
  const insets = useSafeAreaInsets();
  const [slideAtual, setSlideAtual] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);

  async function handleConcluir() {
    await marcarTutorialVisto();
    onConcluir();
  }

  function handleProximo() {
    if (slideAtual < SLIDES.length - 1) {
      const proximo = slideAtual + 1;
      listRef.current?.scrollToIndex({ index: proximo, animated: true });
      setSlideAtual(proximo);
    } else {
      handleConcluir();
    }
  }

  function handlePular() {
    handleConcluir();
  }

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / SCREEN_WIDTH);
    if (index !== slideAtual) {
      setSlideAtual(index);
    }
  }

  const isUltimo = slideAtual === SLIDES.length - 1;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarSide}>
          <Text style={styles.stepLabel}>
            {slideAtual + 1} de {SLIDES.length}
          </Text>
        </View>
        <Text style={styles.topBarTitle}>Tutorial</Text>
        {!isUltimo ? (
          <TouchableOpacity
            style={styles.topBarSide}
            onPress={handlePular}
            hitSlop={12}
          >
            <Text style={styles.pularText}>Pular</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.topBarSide} />
        )}
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(_, idx) => String(idx)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <View style={styles.imageWrapper}>
              <Image source={item.imagem} style={styles.image} resizeMode="cover" />
              <Text style={styles.slideEmoji}>{item.emoji}</Text>
            </View>
            <Text style={styles.titulo}>{item.titulo}</Text>
            <Text style={styles.descricao}>{item.descricao}</Text>
          </View>
        )}
      />

      {/* Dots */}
      <View style={styles.dotsWrapper}>
        {SLIDES.map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.dot,
              idx === slideAtual && styles.dotAtivo,
            ]}
          />
        ))}
      </View>

      {/* CTA */}
      <View style={[styles.ctaWrapper, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <TouchableOpacity
          style={[styles.ctaButton, isUltimo && styles.ctaButtonFinal]}
          onPress={handleProximo}
          activeOpacity={0.8}
        >
          <Text style={styles.ctaText}>
            {isUltimo ? "Entendi, vamos comecar!" : "Proximo →"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  topBarSide: {
    minWidth: 60,
  },
  topBarTitle: {
    fontFamily: FONTS.displayBlack,
    fontSize: SIZES.lg,
    color: COLORS.greenDark,
  },
  stepLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: SIZES.sm,
    color: COLORS.inkMute,
  },
  pularText: {
    fontFamily: FONTS.bodyBold,
    fontSize: SIZES.body,
    color: COLORS.coralDeep,
    textAlign: "right",
  },
  slide: {
    paddingTop: 24,
    paddingHorizontal: 28,
    alignItems: "center",
  },
  imageWrapper: {
    width: 260,
    height: 260,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 5,
    borderColor: "#fff",
    backgroundColor: COLORS.greenLeaf,
    marginBottom: 28,
    ...shadowChunky(COLORS.greenDeep + "40"),
  },
  image: {
    width: "100%",
    height: "100%",
  },
  slideEmoji: {
    position: "absolute",
    bottom: 12,
    right: 12,
    fontSize: 28,
    backgroundColor: "#fff",
    width: 44,
    height: 44,
    borderRadius: 22,
    textAlign: "center",
    lineHeight: 44,
    overflow: "hidden",
    ...shadowSoft(),
  },
  titulo: {
    fontFamily: FONTS.displayBlack,
    fontSize: SIZES.xl,
    color: COLORS.greenDark,
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 28,
  },
  descricao: {
    fontFamily: FONTS.body,
    fontSize: SIZES.body,
    color: COLORS.inkSoft,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  dotsWrapper: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.divider,
    marginHorizontal: 5,
  },
  dotAtivo: {
    backgroundColor: COLORS.green,
    width: 28,
    ...shadowChunky(COLORS.greenDeep + "60"),
  },
  ctaWrapper: {
    paddingHorizontal: 24,
  },
  ctaButton: {
    width: "100%",
    paddingVertical: 18,
    borderRadius: 18,
    backgroundColor: COLORS.green,
    alignItems: "center",
    ...shadowChunky(COLORS.greenDeep),
  },
  ctaButtonFinal: {
    backgroundColor: COLORS.coral,
    ...shadowChunky(COLORS.coralDeep),
  },
  ctaText: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.md,
    color: "#fff",
  },
});
