import React, { forwardRef, useEffect, useRef } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { Leaf } from "lucide-react-native";
import { DiagnosticoResponse } from "../../../api/diagnostico";
import { COLORS, FONTS } from "../../../constants/theme";
import { LINK_PLAY, estadoDe, separarPlano } from "./derivar";
import { COR, fonte } from "./comum";

export const LARGURA_CARTAO = 360;

// Ate 3 passos do plano, caseiros primeiro
export function passosDoCartao(r: DiagnosticoResponse): string[] {
  const { caseiros, quimicos } = separarPlano(r);
  return [...caseiros, ...quimicos]
    .map((p) => (p.acao || p.etapa || "").trim())
    .filter(Boolean)
    .slice(0, 3);
}

interface Props {
  imageUri: string;
  resultado: DiagnosticoResponse;
  // Avisa quando a foto carregou (ou falhou): so entao vale capturar
  onPronto?: () => void;
}

// Cartao-imagem do laudo para compartilhar. Montado fora da tela so na hora de compartilhar.
const CartaoCompartilhar = forwardRef<View, Props>(function CartaoCompartilhar({ imageUri, resultado: r, onPronto }, ref) {
  const [rotulo, fundo, texto] = estadoDe(r);
  const passos = passosDoCartao(r);
  const avisou = useRef(false);
  const pronto = () => {
    if (avisou.current) return;
    avisou.current = true;
    onPronto?.();
  };
  // Seguranca: se a foto nao avisar, segue depois de 1,5 s
  useEffect(() => {
    const t = setTimeout(pronto, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View ref={ref} collapsable={false} testID="cartao-compartilhar" style={styles.cartao}>
      <View style={styles.foto}>
        <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" onLoadEnd={pronto} onError={pronto} />
      </View>
      <View style={styles.corpo}>
        <Text style={fonte(FONTS.displayBlack, 24, 1.15, COLORS.greenDark)}>{r.nome_popular}</Text>
        <View style={[styles.chip, { backgroundColor: fundo }]}>
          <Text style={fonte(FONTS.bodyExtraBold, 15, 1.2, texto)}>{rotulo}</Text>
        </View>
        {!!r.diagnostico_titulo && <Text style={fonte(FONTS.bodyBold, 17, 1.35, COLORS.ink)}>{r.diagnostico_titulo}</Text>}
        {passos.length > 0 && (
          <View style={{ gap: 6 }}>
            <Text style={fonte(FONTS.bodyExtraBold, 15, 1.3, COLORS.greenDeep)}>O que fazer</Text>
            {passos.map((p, i) => (
              <View key={i} style={{ flexDirection: "row", gap: 8 }}>
                <View style={styles.numero}>
                  <Text style={fonte(FONTS.displayBlack, 15, 1, "#fff")}>{i + 1}</Text>
                </View>
                <Text style={[fonte(FONTS.body, 15, 1.4, COR.texto2), { flex: 1 }]} numberOfLines={3}>
                  {p}
                </Text>
              </View>
            ))}
          </View>
        )}
        <View style={styles.selo}>
          <Leaf size={16} color={COLORS.greenDark} strokeWidth={2.4} />
          <Text style={fonte(FONTS.bodyExtraBold, 15, 1.2, COLORS.greenDark)}>Grátis, sem assinatura, em português</Text>
        </View>
      </View>
      <View style={styles.rodape}>
        <Text style={fonte(FONTS.displayBlack, 20, 1.2, "#fff")}>Terra Gentil</Text>
        <Text style={fonte(FONTS.bodyMedium, 15, 1.3, "#dcfce7")}>Laudo do Doutor Gentileza. Baixe na Play:</Text>
        <Text style={fonte(FONTS.bodyBold, 15, 1.3, "#fff")}>{LINK_PLAY.replace("https://", "")}</Text>
      </View>
    </View>
  );
});

export default CartaoCompartilhar;

export async function podeCompartilharImagem(): Promise<boolean> {
  try {
    return await Sharing.isAvailableAsync();
  } catch {
    return false;
  }
}

// Captura o cartao e abre o compartilhar do sistema com a imagem. Lanca erro se nao der.
export async function compartilharCartao(alvo: React.RefObject<View | null>, nome: string): Promise<void> {
  if (!alvo.current) throw new Error("cartao nao montado");
  const uri = await captureRef(alvo, { format: "png", quality: 1, result: "tmpfile" });
  await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: `Laudo: ${nome}`, UTI: "public.png" });
}

const styles = StyleSheet.create({
  cartao: { width: LARGURA_CARTAO, backgroundColor: COLORS.bg, borderRadius: 24, overflow: "hidden" },
  foto: { height: 240, backgroundColor: COR.bege },
  corpo: { padding: 18, gap: 10 },
  chip: { alignSelf: "flex-start", borderRadius: 100, paddingVertical: 5, paddingHorizontal: 12 },
  numero: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.green, alignItems: "center", justifyContent: "center", marginTop: 1 },
  selo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 100,
    backgroundColor: COLORS.greenSoft,
    marginTop: 4,
  },
  rodape: { backgroundColor: COLORS.greenDark, paddingVertical: 14, paddingHorizontal: 18, gap: 2 },
});
