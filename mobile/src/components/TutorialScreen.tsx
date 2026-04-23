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
import { MASCOT_POSES } from "../assets/mascot";
import { marcarTutorialVisto } from "../storage/preferencias";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Props {
  onConcluir: () => void;
}

interface Slide {
  titulo: string;
  descricao: string;
  imagem: number;
}

const SLIDES: Slide[] = [
  {
    titulo: "Bora tirar uma foto bem tirada",
    descricao:
      "Vou te mostrar em 3 passos simples como conseguir a melhor foto pra eu analisar sua planta com precisao.",
    imagem: MASCOT_POSES[0],
  },
  {
    titulo: "Chegue perto da folha",
    descricao:
      "Aproxime o celular da parte que esta com problema. Quanto mais perto, melhor eu enxergo os detalhes. Foco numa folha so, sem bagunca no quadro.",
    imagem: MASCOT_POSES[1],
  },
  {
    titulo: "Luz natural e o segredo",
    descricao:
      "Prefira sombra clarinha ou luz natural suave. Evite sol a pino e sombras pesadas projetadas. Se puder, foto de dia, perto de uma janela.",
    imagem: MASCOT_POSES[2],
  },
  {
    titulo: "Foque no problema",
    descricao:
      "Toque na tela pra focar antes de clicar. Se o problema esta numa folha, fotografe ela. Se esta no caule, inclua o caule. Me mostre o que preocupa voce.",
    imagem: MASCOT_POSES[3],
  },
];

export function TutorialScreen({ onConcluir }: Props) {
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
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.topBarSide} />
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
            </View>
            <Text style={styles.titulo}>{item.titulo}</Text>
            <Text style={styles.descricao}>{item.descricao}</Text>
          </View>
        )}
      />

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

      <TouchableOpacity style={styles.ctaButton} onPress={handleProximo}>
        <Text style={styles.ctaText}>
          {isUltimo ? "📷 Entendi, vamos comecar" : "Proximo →"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f9f5",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 54,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  topBarSide: {
    minWidth: 60,
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1b5e20",
  },
  pularText: {
    fontSize: 15,
    color: "#558b2f",
    fontWeight: "700",
    textAlign: "right",
  },
  slide: {
    paddingTop: 32,
    paddingHorizontal: 28,
    alignItems: "center",
  },
  imageWrapper: {
    width: 240,
    height: 240,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#c8e6c9",
    marginBottom: 28,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  titulo: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1a4d2e",
    textAlign: "center",
    marginBottom: 14,
  },
  descricao: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    lineHeight: 23,
    paddingHorizontal: 8,
  },
  dotsWrapper: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#c8e6c9",
    marginHorizontal: 5,
  },
  dotAtivo: {
    backgroundColor: "#2e7d32",
    width: 28,
  },
  ctaButton: {
    backgroundColor: "#2e7d32",
    marginHorizontal: 20,
    marginBottom: 32,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
    minHeight: 60,
    justifyContent: "center",
    shadowColor: "#1b5e20",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  ctaText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
  },
});
