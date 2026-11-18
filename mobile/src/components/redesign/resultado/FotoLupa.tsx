import React, { useEffect, useRef, useState } from "react";
import { Animated, Image, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";
import { ZoomIn } from "lucide-react-native";
import { COLORS, FONTS } from "../../../constants/theme";
import { useReduzirMovimento } from "../../../hooks/useReduzirMovimento";
import { MarcaLupa, caixaNaTela } from "./derivar";
import { COR, fonte } from "./comum";
import FotoAmpliada from "./FotoAmpliada";

interface Props {
  imageUri: string;
  marcas: MarcaLupa[];
  // Indice do problema destacado (toque no chip ou no cartao)
  destaque: number | null;
  // Nome curto de cada problema (indice -> descricao), para os botoes da foto ampliada
  rotulos?: Record<number, string>;
  children?: React.ReactNode;
}

interface Tamanho {
  largura: number;
  altura: number;
}

// Foto do topo do laudo com a "lupa": circulo coral numerado sobre onde o Doutor viu cada problema
export default function FotoLupa({ imageUri, marcas, destaque, rotulos = {}, children }: Props) {
  const [caixa, setCaixa] = useState<Tamanho | null>(null);
  const [imagem, setImagem] = useState<Tamanho | null>(null);
  const [ampliada, setAmpliada] = useState(false);

  return (
    <View>
      <Pressable
        testID="foto-lupa"
        onPress={() => setAmpliada(true)}
        accessibilityRole="button"
        accessibilityLabel="Ampliar a foto"
        style={styles.foto}
        onLayout={(e: LayoutChangeEvent) => {
          const { width, height } = e.nativeEvent.layout;
          setCaixa({ largura: width, altura: height });
        }}
      >
        <Image
          testID="foto-laudo"
          source={{ uri: imageUri }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
          accessibilityLabel="Sua foto"
          // Dimensoes reais da imagem para calcular o recorte do cover
          onLoad={(e: any) => {
            const src = e?.nativeEvent?.source;
            if (src?.width > 0 && src?.height > 0) setImagem({ largura: src.width, altura: src.height });
          }}
        />
        {!!caixa &&
          !!imagem &&
          marcas.map((m) => {
            const r = caixaNaTela(m.area, caixa, imagem);
            if (!r) return null;
            return <Marca key={m.indice} numero={m.numero} retangulo={r} ativa={destaque === m.indice} />;
          })}
        {children}
        <View testID="botao-ampliar" pointerEvents="none" style={styles.ampliar}>
          <ZoomIn size={18} color={COLORS.greenDark} strokeWidth={2.6} />
          <Text style={fonte(FONTS.bodyExtraBold, 15, 1.1, COLORS.greenDark)}>Ampliar</Text>
        </View>
      </Pressable>
      {marcas.length > 0 && (
        <Text testID="legenda-lupa" style={[fonte(FONTS.bodySemiBold, 15, 1.4, COR.texto2), styles.legenda]}>
          O círculo mostra onde o Doutor viu o problema. Toque na foto para ver de perto
        </Text>
      )}
      {ampliada && (
        <FotoAmpliada
          visivel
          imageUri={imageUri}
          marcas={marcas}
          rotulos={rotulos}
          inicial={marcas.find((m) => m.indice === destaque)?.indice ?? marcas[0]?.indice ?? null}
          onFechar={() => setAmpliada(false)}
        />
      )}
    </View>
  );
}

function Marca({ numero, retangulo, ativa }: { numero: number; retangulo: { left: number; top: number; width: number; height: number }; ativa: boolean }) {
  const reduzir = useReduzirMovimento();
  const escala = useRef(new Animated.Value(1)).current;

  // Destaque pulsa 3 vezes; com "reduzir movimento" fica so a borda mais grossa
  useEffect(() => {
    if (!ativa || reduzir) {
      escala.setValue(1);
      return;
    }
    const pulso = Animated.loop(
      Animated.sequence([
        Animated.timing(escala, { toValue: 1.08, duration: 380, useNativeDriver: true }),
        Animated.timing(escala, { toValue: 1, duration: 380, useNativeDriver: true }),
      ]),
      { iterations: 3 },
    );
    pulso.start();
    return () => pulso.stop();
  }, [ativa, reduzir, escala]);

  const raio = Math.min(retangulo.width, retangulo.height) / 2;
  return (
    <Animated.View
      testID={`marca-lupa-${numero}`}
      pointerEvents="none"
      accessibilityLabel={`Marca ${numero} na foto`}
      style={[
        styles.marca,
        retangulo,
        { borderRadius: Math.max(raio, 22), borderWidth: ativa ? 6 : 4, transform: [{ scale: escala }] },
        ativa && styles.marcaAtiva,
      ]}
    >
      <View style={styles.numero}>
        <Text style={fonte(FONTS.bodyExtraBold, 15, 1, "#fff")}>{numero}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  foto: { height: 208, borderRadius: 24, overflow: "hidden", backgroundColor: COR.bege },
  marca: {
    position: "absolute",
    borderColor: COR.coral,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.45,
    shadowRadius: 3,
  },
  marcaAtiva: { backgroundColor: "rgba(255,90,60,0.15)" },
  numero: {
    position: "absolute",
    top: -2,
    left: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COR.coral,
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  legenda: { marginTop: 8, paddingHorizontal: 4 },
  ampliar: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.94)",
  },
});
