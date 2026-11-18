import React, { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Camera, ImageIcon, Plus, Trash2 } from "lucide-react-native";
import { COLORS, FONTS } from "../constants/theme";
import { COR, fonte } from "./redesign/resultado/comum";
import { locutor } from "../voz";
import { falarMaisFotos } from "../voz/acoes";

export type OrigemFoto = "camera" | "galeria";

export const MAX_FOTOS = 3;

interface Props {
  // A primeira e a foto principal; as outras sao outros angulos (no maximo 3 no total)
  fotos: string[];
  onAdicionar: (origem: OrigemFoto) => void;
  onRemover: (indice: number) => void;
  onAnalisar: () => void;
  onCancelar: () => void;
}

// Depois da primeira foto: oferece mandar mais 2 angulos. Analisar com 1 foto e 1 toque.
export default function MaisFotosScreen({ fotos, onAdicionar, onRemover, onAnalisar, onCancelar }: Props) {
  const insets = useSafeAreaInsets();
  const [escolhendo, setEscolhendo] = useState(false);
  const extras = fotos.slice(1, MAX_FOTOS);
  const vagas = Math.max(0, MAX_FOTOS - 1 - extras.length);
  const total = Math.min(fotos.length, MAX_FOTOS);

  // O Doutor explica que mais fotos ajudam; sai da tela, a voz para
  useEffect(() => {
    falarMaisFotos().catch(() => undefined);
    return () => locutor.cancelar(true);
  }, []);

  function adicionar(origem: OrigemFoto) {
    setEscolhendo(false);
    onAdicionar(origem);
  }

  return (
    <View testID="mais-fotos" style={[styles.tela, { paddingTop: insets.top }]}>
      <View style={styles.cabecalho}>
        <TouchableOpacity onPress={onCancelar} style={styles.voltar} accessibilityRole="button" accessibilityLabel="Voltar">
          <ArrowLeft size={24} color={COLORS.greenDark} strokeWidth={2.4} />
        </TouchableOpacity>
        <Text style={fonte(FONTS.displayBlack, 20, 1.2, COLORS.greenDark)}>Quer mandar mais fotos?</Text>
      </View>

      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        <Text style={fonte(FONTS.body, 17, 1.5, COR.texto2)}>
          Fotos de outros ângulos ajudam o Doutor: uma de perto da folha doente e uma do vaso com a terra.
        </Text>
        <Text style={fonte(FONTS.bodySemiBold, 15, 1.4, COLORS.inkSoft)}>Não é obrigatório. Dá para analisar só com esta foto.</Text>

        <View style={{ gap: 6 }}>
          <Text style={fonte(FONTS.bodyExtraBold, 15, 1.3)}>Foto principal</Text>
          <Image testID="foto-principal" source={{ uri: fotos[0] }} style={styles.principal} resizeMode="cover" accessibilityLabel="Foto principal" />
        </View>

        <View style={styles.extras}>
          {extras.map((uri, i) => (
            <View key={`${uri}-${i}`} testID={`foto-extra-${i + 1}`} style={styles.vaga}>
              <Image source={{ uri }} style={styles.vagaImagem} resizeMode="cover" accessibilityLabel={`Foto ${i + 2}`} />
              <TouchableOpacity
                testID={`remover-foto-${i + 1}`}
                onPress={() => onRemover(i + 1)}
                accessibilityRole="button"
                accessibilityLabel={`Remover foto ${i + 2}`}
                style={styles.remover}
              >
                <Trash2 size={18} color={COR.rosaTexto} strokeWidth={2.4} />
                <Text style={fonte(FONTS.bodyBold, 15, 1.2, COR.rosaTexto)}>Remover</Text>
              </TouchableOpacity>
            </View>
          ))}
          {Array.from({ length: vagas }).map((_, i) => (
            <TouchableOpacity
              key={`vaga-${i}`}
              testID={`adicionar-foto-${i}`}
              onPress={() => setEscolhendo(true)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Adicionar foto"
              style={[styles.vaga, styles.vagaVazia]}
            >
              <Plus size={32} color={COLORS.greenDark} strokeWidth={2.6} />
              <Text style={[fonte(FONTS.bodyExtraBold, 16, 1.25, COLORS.greenDark), { textAlign: "center" }]}>Adicionar foto</Text>
            </TouchableOpacity>
          ))}
        </View>

        {escolhendo && vagas > 0 && (
          <View testID="escolher-origem" style={styles.origem}>
            <Text style={fonte(FONTS.bodyExtraBold, 16, 1.3)}>De onde vem a foto?</Text>
            <TouchableOpacity testID="origem-camera" onPress={() => adicionar("camera")} style={styles.botaoOrigem} accessibilityRole="button">
              <Camera size={22} color="#fff" strokeWidth={2.4} />
              <Text style={fonte(FONTS.bodyExtraBold, 17, 1.2, "#fff")}>Tirar foto agora</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="origem-galeria" onPress={() => adicionar("galeria")} style={styles.botaoOrigem} accessibilityRole="button">
              <ImageIcon size={22} color="#fff" strokeWidth={2.4} />
              <Text style={fonte(FONTS.bodyExtraBold, 17, 1.2, "#fff")}>Escolher da galeria</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEscolhendo(false)} style={styles.botaoDesistir} accessibilityRole="button">
              <Text style={fonte(FONTS.bodyBold, 16, 1.2, COLORS.inkSoft)}>Deixar para lá</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={[styles.rodape, { paddingBottom: 16 + insets.bottom }]}>
        <TouchableOpacity
          testID="analisar-agora"
          onPress={onAnalisar}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={total > 1 ? `Analisar agora com ${total} fotos` : "Analisar agora"}
          style={styles.analisar}
        >
          <Text style={fonte(FONTS.displayBlack, 20, 1.2, "#fff")}>Analisar agora</Text>
          {total > 1 && <Text style={fonte(FONTS.bodySemiBold, 15, 1.2, COLORS.greenSoft)}>{total} fotos</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: COLORS.bg },
  cabecalho: { minHeight: 56, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8 },
  voltar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  conteudo: { paddingHorizontal: 16, paddingBottom: 24, gap: 14 },
  principal: { width: "100%", height: 200, borderRadius: 20, backgroundColor: COR.bege },
  extras: { flexDirection: "row", gap: 12 },
  vaga: { flex: 1, gap: 8 },
  vagaImagem: { width: "100%", height: 140, borderRadius: 18, backgroundColor: COR.bege },
  vagaVazia: {
    height: 140,
    borderRadius: 18,
    borderWidth: 3,
    borderStyle: "dashed",
    borderColor: COLORS.green,
    backgroundColor: COLORS.greenSoft,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  remover: {
    minHeight: 48,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#ffe1ec",
  },
  origem: { gap: 10, padding: 14, borderRadius: 20, backgroundColor: COLORS.card },
  botaoOrigem: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: COLORS.greenDeep,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  botaoDesistir: { minHeight: 48, alignItems: "center", justifyContent: "center" },
  rodape: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: COR.linha, backgroundColor: COLORS.bg },
  analisar: {
    minHeight: 64,
    borderRadius: 18,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    shadowColor: COLORS.greenDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
});
