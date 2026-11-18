import React, { useState } from "react";
import { Image, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";
import { ZoomIn } from "lucide-react-native";
import { COLORS, FONTS } from "../../../constants/theme";
import { MarcaLupa, Retangulo, caixaNaTela } from "./derivar";
import { AnelMarca, EscurecerFora, EtiquetaMarca } from "./MarcaDesenho";
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

// Foto do topo do laudo com a "lupa": anel coral numerado sobre onde o Doutor viu cada problema
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
        {!!caixa && !!imagem && <Marcas marcas={marcas} destaque={destaque} caixa={caixa} imagem={imagem} />}
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

function Marcas({ marcas, destaque, caixa, imagem }: { marcas: MarcaLupa[]; destaque: number | null; caixa: Tamanho; imagem: Tamanho }) {
  const visiveis = marcas
    .map((m, ordem) => ({ m, ordem, r: caixaNaTela(m.area, caixa, imagem) }))
    .filter((v): v is { m: MarcaLupa; ordem: number; r: Retangulo } => !!v.r);
  const destacada = visiveis.find((v) => v.m.indice === destaque);
  return (
    <>
      {!!destacada && <EscurecerFora key={`esc-${destacada.m.indice}`} retangulo={destacada.r} limite={caixa} />}
      {visiveis.map(({ m, ordem, r }) => (
        <AnelMarca key={m.indice} testID={`marca-lupa-${m.numero}`} numero={m.numero} retangulo={r} ativa={destaque === m.indice} ordem={ordem} />
      ))}
      {/* Etiquetas depois de todos os aneis, para ficarem por cima */}
      {visiveis.map(({ m, ordem, r }) => (
        <EtiquetaMarca key={`n-${m.indice}`} numero={m.numero} retangulo={r} ativa={destaque === m.indice} ordem={ordem} limite={caixa} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  foto: { height: 208, borderRadius: 24, overflow: "hidden", backgroundColor: COR.bege },
  legenda: { marginTop: 8, paddingHorizontal: 4 },
  ampliar: {
    // No alto: embaixo esbarrava no selo de confianca (canto de baixo a esquerda)
    position: "absolute",
    top: 12,
    right: 12,
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 12,
    paddingRight: 14,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.94)",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});
