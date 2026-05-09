import React, { useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Download, Gift, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, FONTS, SIZES, shadowChunky, shadowSoft } from "../../constants/theme";
import { MASCOT_GIFT } from "../../assets/mascot";
import { Ebook, EBOOK_DESTAQUE, EBOOKS } from "../../data/ebooks";
import { paletaPorId } from "../../data/comunidade";
import EbookViewerModal from "./EbookViewerModal";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function EbooksScreen({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [ebookAtivo, setEbookAtivo] = useState<Ebook | null>(null);
  const [viewerAberto, setViewerAberto] = useState(false);

  function abrirEbook(ebook: Ebook) {
    setEbookAtivo(ebook);
    setViewerAberto(true);
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={10} style={styles.closeBtn}>
            <X size={22} color={COLORS.greenDark} strokeWidth={2.4} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ebooks grátis</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* HERO com mascote presente */}
          <View style={styles.hero}>
            <LinearGradient
              colors={["#fde68a", "#f59e0b", "#b45309"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.heroCircleA} />
            <View style={styles.heroCircleB} />
            <View style={styles.heroBody}>
              <View style={styles.giftPill}>
                <Gift size={12} color="#7c2d12" strokeWidth={2.6} />
                <Text style={styles.giftPillText}>20 GUIAS · DE GRAÇA</Text>
              </View>
              <Text style={styles.heroTitle}>
                Os guias do{"\n"}Doutor Gentileza
              </Text>
              <Text style={styles.heroSub}>
                PDFs feitos pra você ler no celular, no computador ou imprimir.
                Sem cadastro, sem pagar — leve quantos quiser.
              </Text>
            </View>
            <Image source={MASCOT_GIFT} style={styles.heroMascot} />
          </View>

          {/* DESTAQUE */}
          <Text style={styles.sectionLabel}>📘 Comece por aqui</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => abrirEbook(EBOOK_DESTAQUE)}
            style={styles.destaqueCard}
          >
            <View style={styles.destaqueImagemWrap}>
              <Image source={{ uri: EBOOK_DESTAQUE.capa }} style={styles.destaqueImg} />
              <View style={styles.destaquePill}>
                <Text style={styles.destaquePillText}>+ POPULAR</Text>
              </View>
            </View>
            <View style={styles.destaqueInfo}>
              <Text style={styles.destaqueTitulo} numberOfLines={2}>
                {EBOOK_DESTAQUE.titulo}
              </Text>
              <Text style={styles.destaqueSub} numberOfLines={3}>
                {EBOOK_DESTAQUE.subtitulo}
              </Text>
              <View style={styles.destaqueCta}>
                <Download size={16} color="#fff" strokeWidth={2.6} />
                <Text style={styles.destaqueCtaText}>Abrir guia</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* BIBLIOTECA */}
          <Text style={styles.sectionLabel}>🌿 Toda a biblioteca</Text>
          <View style={styles.grid}>
            {EBOOKS.map((e) => {
              const paleta = paletaPorId(e.paletaId);
              return (
                <TouchableOpacity
                  key={e.id}
                  activeOpacity={0.85}
                  onPress={() => abrirEbook(e)}
                  style={styles.gridCard}
                >
                  <View style={[styles.gridCapaWrap, { backgroundColor: paleta.accent + "20" }]}>
                    <Image source={{ uri: e.capa }} style={styles.gridCapa} />
                    <View style={[styles.gridNum, { backgroundColor: paleta.accent }]}>
                      <Text style={styles.gridNumText}>{e.numero}</Text>
                    </View>
                  </View>
                  <Text style={styles.gridTitulo} numberOfLines={2}>
                    {e.emoji} {e.titulo}
                  </Text>
                  <Text style={styles.gridSub} numberOfLines={2}>
                    {e.subtitulo}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* RODAPE */}
          <View style={styles.rodape}>
            <Text style={styles.rodapeTitulo}>Não achou um guia da sua planta?</Text>
            <Text style={styles.rodapeTexto}>
              Manda mensagem pelo formulário pós-diagnóstico. O Doutor escreve
              um guia exclusivo pra você e envia de graça.
            </Text>
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>

        <EbookViewerModal
          visible={viewerAberto}
          ebook={ebookAtivo}
          onClose={() => setViewerAberto(false)}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: FONTS.displayBlack,
    fontSize: SIZES.lg,
    color: COLORS.greenDark,
  },
  content: {
    paddingTop: 14,
    paddingBottom: 20,
  },

  // HERO
  hero: {
    marginHorizontal: 16,
    borderRadius: 22,
    overflow: "hidden",
    minHeight: 200,
    marginBottom: 22,
    flexDirection: "row",
    ...shadowChunky("#b45309"),
  },
  heroCircleA: {
    position: "absolute",
    top: -30,
    left: -10,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  heroCircleB: {
    position: "absolute",
    bottom: -40,
    right: 60,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  heroBody: {
    flex: 1.2,
    padding: 18,
    paddingRight: 8,
    justifyContent: "center",
  },
  giftPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  giftPillText: {
    fontFamily: FONTS.displayBlack,
    fontSize: 10,
    color: "#7c2d12",
    letterSpacing: 0.6,
  },
  heroTitle: {
    fontFamily: FONTS.displayBlack,
    fontSize: 24,
    color: "#3e2723",
    lineHeight: 28,
  },
  heroSub: {
    fontFamily: FONTS.body,
    fontSize: SIZES.smPlus,
    color: "#5d4037",
    marginTop: 8,
    lineHeight: 18,
  },
  heroMascot: {
    width: 130,
    height: "100%",
    resizeMode: "cover",
    alignSelf: "flex-end",
  },

  sectionLabel: {
    fontFamily: FONTS.displayBlack,
    fontSize: SIZES.body + 1,
    color: COLORS.greenDark,
    paddingHorizontal: 16,
    marginBottom: 10,
  },

  // DESTAQUE
  destaqueCard: {
    flexDirection: "row",
    gap: 14,
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    marginBottom: 22,
    ...shadowSoft(),
  },
  destaqueImagemWrap: {
    width: 110,
    height: 150,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: COLORS.greenSoft,
    position: "relative",
  },
  destaqueImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  destaquePill: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: COLORS.coral,
  },
  destaquePillText: {
    fontFamily: FONTS.displayBlack,
    fontSize: 9,
    color: "#fff",
    letterSpacing: 0.6,
  },
  destaqueInfo: {
    flex: 1,
    justifyContent: "center",
    gap: 6,
  },
  destaqueTitulo: {
    fontFamily: FONTS.displayBlack,
    fontSize: SIZES.lg,
    color: COLORS.greenDark,
    lineHeight: 22,
  },
  destaqueSub: {
    fontFamily: FONTS.body,
    fontSize: SIZES.sm,
    color: COLORS.inkSoft,
    lineHeight: 18,
  },
  destaqueCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: COLORS.green,
    marginTop: 4,
    ...shadowChunky(COLORS.greenDeep),
  },
  destaqueCtaText: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.sm,
    color: "#fff",
    letterSpacing: 0.3,
  },

  // GRID
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    rowGap: 14,
  },
  gridCard: {
    width: "50%",
    paddingHorizontal: 4,
  },
  gridCapaWrap: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 8,
    ...shadowSoft(),
  },
  gridCapa: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  gridNum: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  gridNumText: {
    fontFamily: FONTS.displayBlack,
    fontSize: 11,
    color: "#fff",
  },
  gridTitulo: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.smPlus,
    color: COLORS.ink,
    lineHeight: 18,
    paddingHorizontal: 4,
  },
  gridSub: {
    fontFamily: FONTS.body,
    fontSize: SIZES.xs,
    color: COLORS.inkSoft,
    lineHeight: 15,
    marginTop: 2,
    paddingHorizontal: 4,
  },

  // RODAPE
  rodape: {
    margin: 16,
    backgroundColor: COLORS.greenSoft,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: COLORS.green,
  },
  rodapeTitulo: {
    fontFamily: FONTS.displayBlack,
    fontSize: SIZES.body + 1,
    color: COLORS.greenDark,
    marginBottom: 4,
  },
  rodapeTexto: {
    fontFamily: FONTS.body,
    fontSize: SIZES.sm,
    color: COLORS.inkSoft,
    lineHeight: 18,
  },
});
