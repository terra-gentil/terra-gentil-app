import React, { useRef, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Camera, Download, Gift, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { COLORS, FONTS, SIZES, shadowChunky, shadowSoft } from "../../constants/theme";
import { MASCOT_GIFT } from "../../assets/mascot";
import { Ebook, EBOOK_DESTAQUE, TODOS_EBOOKS, CATEGORIAS_EBOOK, categoriaDoEbook } from "../../data/ebooks";
import { COLECAO, TEMAS_COLECAO, capaDoLivro, pdfDoLivro } from "../../data/colecao";
import EbookViewerModal from "./EbookViewerModal";

interface Props {
  visible: boolean;
  onClose: () => void;
}

type Aba = "colecao" | "classicos";

interface Prateleira {
  id: string;
  nome: string;
  emoji: string;
  chamada: string;
  cor: string;
  livros: Ebook[];
}

// Livros da colecao do site viram Ebook para reaproveitar o leitor de PDF.
const LIVROS_COLECAO: (Ebook & { tema: string })[] = COLECAO.map((l) => ({
  id: `colecao-${l.codigo}`,
  numero: parseInt(l.codigo.replace(/\D/g, ""), 10),
  titulo: l.titulo,
  subtitulo: "",
  capa: capaDoLivro(l),
  pdf: pdfDoLivro(l),
  paletaId: "verde",
  emoji: TEMAS_COLECAO.find((t) => t.id === l.tema)?.emoji ?? "📗",
  keywords: [],
  tema: l.tema,
}));

const PRATELEIRAS_COLECAO: Prateleira[] = TEMAS_COLECAO.map((t) => ({
  ...t,
  livros: LIVROS_COLECAO.filter((l) => l.tema === t.id),
})).filter((p) => p.livros.length > 0);

const PRATELEIRAS_CLASSICOS: Prateleira[] = CATEGORIAS_EBOOK.map((c) => ({
  ...c,
  livros: TODOS_EBOOKS.filter((e) => categoriaDoEbook(e) === c.id),
})).filter((p) => p.livros.length > 0);

export default function EbooksScreen({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [ebookAtivo, setEbookAtivo] = useState<Ebook | null>(null);
  const [viewerAberto, setViewerAberto] = useState(false);
  const [aba, setAba] = useState<Aba>("colecao");
  const scrollRef = useRef<ScrollView>(null);
  const posicoes = useRef<Record<string, number>>({});

  const prateleiras = aba === "colecao" ? PRATELEIRAS_COLECAO : PRATELEIRAS_CLASSICOS;

  function trocarAba(nova: Aba) {
    posicoes.current = {};
    setAba(nova);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }

  function irParaCategoria(id: string) {
    const y = posicoes.current[id];
    if (y !== undefined) scrollRef.current?.scrollTo({ y: Math.max(y - 8, 0), animated: true });
  }

  function abrirEbook(ebook: Ebook) {
    setEbookAtivo(ebook);
    setViewerAberto(true);
  }

  function pedirGuiaExclusivo() {
    onClose();
    setTimeout(() => {
      navigation.navigate("HomeTab");
    }, 250);
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
          ref={scrollRef}
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
                <Text style={styles.giftPillText}>{LIVROS_COLECAO.length + TODOS_EBOOKS.length} GUIAS · DE GRAÇA</Text>
              </View>
              <Text style={styles.heroTitle}>
                Os guias do{"\n"}Doutor Gentileza
              </Text>
              <Text style={styles.heroSub}>
                PDFs feitos pra você ler no celular, no computador ou imprimir.
                Sem cadastro, sem pagar. Leve quantos quiser.
              </Text>
            </View>
            <Image source={MASCOT_GIFT} style={styles.heroMascot} />
          </View>

          {/* ABAS */}
          <View style={styles.abas}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => trocarAba("colecao")}
              accessibilityRole="tab"
              accessibilityState={{ selected: aba === "colecao" }}
              style={[styles.aba, aba === "colecao" && styles.abaAtiva]}
            >
              <Text style={[styles.abaText, aba === "colecao" && styles.abaTextAtiva]}>
                📚 Coleção ({LIVROS_COLECAO.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => trocarAba("classicos")}
              accessibilityRole="tab"
              accessibilityState={{ selected: aba === "classicos" }}
              style={[styles.aba, aba === "classicos" && styles.abaAtiva]}
            >
              <Text style={[styles.abaText, aba === "classicos" && styles.abaTextAtiva]}>
                ⭐ Clássicos ({TODOS_EBOOKS.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* CHIPS DE CATEGORIA */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            {prateleiras.map((pr) => (
              <TouchableOpacity
                key={pr.id}
                activeOpacity={0.8}
                onPress={() => irParaCategoria(pr.id)}
                accessibilityRole="button"
                accessibilityLabel={`Ir para ${pr.nome}, ${pr.livros.length} guias`}
                style={[styles.chip, { borderColor: pr.cor }]}
              >
                <Text style={styles.chipText}>
                  {pr.emoji} {pr.nome}
                </Text>
                <Text style={styles.chipCount}>{pr.livros.length}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* PRATELEIRAS POR CATEGORIA */}
          {prateleiras.map((pr) => (
            <View
              key={`${aba}-${pr.id}`}
              onLayout={(ev) => {
                posicoes.current[pr.id] = ev.nativeEvent.layout.y;
              }}
              style={[styles.shelf, { borderTopColor: pr.cor }]}
            >
              <View style={styles.shelfHead}>
                <View style={[styles.shelfEmoji, { backgroundColor: pr.cor }]}>
                  <Text style={styles.shelfEmojiText}>{pr.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.shelfTitleRow}>
                    <Text style={styles.shelfTitle}>{pr.nome}</Text>
                    <View style={[styles.shelfCount, { backgroundColor: pr.cor }]}>
                      <Text style={styles.shelfCountText}>{pr.livros.length}</Text>
                    </View>
                  </View>
                  <Text style={styles.shelfSub}>{pr.chamada}</Text>
                </View>
              </View>

              {aba === "classicos" && pr.id === "comece" && (
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
              )}

              <FlatList
                horizontal
                data={pr.livros.filter((e) => e.id !== EBOOK_DESTAQUE.id)}
                keyExtractor={(e) => e.id}
                showsHorizontalScrollIndicator={false}
                style={styles.carrossel}
                contentContainerStyle={styles.carrosselConteudo}
                initialNumToRender={3}
                maxToRenderPerBatch={3}
                windowSize={3}
                renderItem={({ item: e }) => (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => abrirEbook(e)}
                    accessibilityRole="button"
                    accessibilityLabel={`Abrir guia ${e.titulo}`}
                    style={[styles.gridCard, { width: aba === "colecao" ? 118 : 146 }]}
                  >
                    <View
                      style={[
                        styles.gridCapaWrap,
                        { backgroundColor: pr.cor + "20", aspectRatio: aba === "colecao" ? 9 / 16 : 3 / 4 },
                      ]}
                    >
                      <Image source={{ uri: e.capa }} style={styles.gridCapa} />
                      {aba === "classicos" && (
                        <View style={[styles.gridNum, { backgroundColor: pr.cor }]}>
                          <Text style={styles.gridNumText}>{e.numero}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.gridTitulo} numberOfLines={2}>
                      {aba === "colecao" ? e.titulo : `${e.emoji} ${e.titulo}`}
                    </Text>
                    {aba === "classicos" && e.subtitulo ? (
                      <Text style={styles.gridSub} numberOfLines={2}>
                        {e.subtitulo}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                )}
              />
            </View>
          ))}

          {/* RODAPE */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={pedirGuiaExclusivo}
            style={styles.rodape}
          >
            <Text style={styles.rodapeTitulo}>Não achou um guia da sua planta?</Text>
            <Text style={styles.rodapeTexto}>
              Manda mensagem pelo formulário pós-diagnóstico. O Doutor escreve
              um guia exclusivo pra você e envia de graça.
            </Text>
            <View style={styles.rodapeCta}>
              <Camera size={14} color={COLORS.greenDark} strokeWidth={2.6} />
              <Text style={styles.rodapeCtaText}>Tirar foto agora</Text>
            </View>
          </TouchableOpacity>

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

  // ABAS, CHIPS E PRATELEIRAS
  abas: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 4,
    borderRadius: 100,
    backgroundColor: COLORS.greenSoft,
  },
  aba: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 100,
    alignItems: "center",
  },
  abaAtiva: {
    backgroundColor: COLORS.green,
  },
  abaText: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.sm,
    color: COLORS.greenDark,
  },
  abaTextAtiva: {
    color: "#fff",
  },
  chips: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 6,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 100,
    borderWidth: 2,
    backgroundColor: "#fff",
  },
  chipText: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.sm,
    color: COLORS.ink,
  },
  chipCount: {
    fontFamily: FONTS.displayBlack,
    fontSize: 11,
    color: COLORS.inkSoft,
  },
  shelf: {
    marginTop: 22,
    marginHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 3,
  },
  shelfHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  shelfEmoji: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    ...shadowSoft(),
  },
  shelfEmojiText: {
    fontSize: 26,
  },
  shelfTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  shelfTitle: {
    fontFamily: FONTS.displayBlack,
    fontSize: SIZES.lg,
    color: COLORS.greenDark,
  },
  shelfCount: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100,
  },
  shelfCountText: {
    fontFamily: FONTS.displayBlack,
    fontSize: 11,
    color: "#fff",
  },
  shelfSub: {
    fontFamily: FONTS.body,
    fontSize: SIZES.sm,
    color: COLORS.inkSoft,
    lineHeight: 18,
    marginTop: 2,
  },

  // DESTAQUE
  destaqueCard: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
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
  carrossel: {
    marginHorizontal: -16,
  },
  carrosselConteudo: {
    paddingHorizontal: 12,
  },
  gridCard: {
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
  rodapeCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: COLORS.green,
  },
  rodapeCtaText: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.sm,
    color: COLORS.greenDark,
    letterSpacing: 0.3,
  },
});
