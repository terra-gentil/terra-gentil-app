import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Image,
  ImageStyle,
  LayoutChangeEvent,
  ListRenderItemInfo,
  PixelRatio,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Camera, Download, Gift } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { COLORS, FONTS, SIZES, shadowChunky, shadowSoft } from "../../constants/theme";
import { MASCOT_GIFT } from "../../assets/mascot";
import {
  Ebook,
  EBOOK_DESTAQUE,
  TODOS_EBOOKS,
  CATEGORIAS_EBOOK,
  categoriaDoEbook,
  NUMEROS_NA_COLECAO,
  capaOtimizada,
} from "../../data/ebooks";
import { COLECAO, TEMAS_COLECAO, capaDoLivro, pdfDoLivro } from "../../data/colecao";
import EbookViewerModal from "./EbookViewerModal";

type Aba = "colecao" | "classicos";

// Interruptor da aba Colecao (PDFs regerados e no ar desde 2026-11-11).
const MOSTRAR_COLECAO = true;

// Com a Colecao ligada, os classicos repetidos nela saem da lista.
const CLASSICOS = MOSTRAR_COLECAO ? TODOS_EBOOKS.filter((e) => !NUMEROS_NA_COLECAO.has(e.numero)) : TODOS_EBOOKS;

interface Prateleira {
  id: string;
  nome: string;
  emoji: string;
  chamada: string;
  cor: string;
  livros: Ebook[];
  // Livros do carrossel (sem o destaque, que tem cartao proprio). Calculado uma vez so.
  carrossel: Ebook[];
}

const EMOJI_DO_TEMA = new Map(TEMAS_COLECAO.map((t) => [t.id, t.emoji]));

// Livros da colecao do site viram Ebook para reaproveitar o leitor de PDF.
const LIVROS_COLECAO: (Ebook & { tema: string })[] = COLECAO.map((l) => ({
  id: `colecao-${l.codigo}`,
  numero: parseInt(l.codigo.replace(/\D/g, ""), 10),
  titulo: l.titulo,
  subtitulo: "",
  capa: capaDoLivro(l),
  pdf: pdfDoLivro(l),
  paletaId: "verde",
  emoji: EMOJI_DO_TEMA.get(l.tema) ?? "📗",
  keywords: [],
  tema: l.tema,
}));

function montarPrateleira<T extends Omit<Prateleira, "livros" | "carrossel">>(base: T, livros: Ebook[]): Prateleira {
  return { ...base, livros, carrossel: livros.filter((e) => e.id !== EBOOK_DESTAQUE.id) };
}

const PRATELEIRAS_COLECAO: Prateleira[] = TEMAS_COLECAO.map((t) =>
  montarPrateleira(t, LIVROS_COLECAO.filter((l) => l.tema === t.id)),
).filter((p) => p.livros.length > 0);

const PRATELEIRAS_CLASSICOS: Prateleira[] = CATEGORIAS_EBOOK.map((c) =>
  montarPrateleira(c, CLASSICOS.filter((e) => categoriaDoEbook(e) === c.id)),
).filter((p) => p.livros.length > 0);

const TOTAL_GUIAS = (MOSTRAR_COLECAO ? LIVROS_COLECAO.length : 0) + CLASSICOS.length;

// Medidas fixas dos cartoes, usadas no estilo e no getItemLayout do carrossel.
const LARGURA_CARD: Record<Aba, number> = { colecao: 118, classicos: 146 };
const RESPIRO_CARD = 4; // paddingHorizontal de styles.gridCard
const RESPIRO_CARROSSEL = 12; // paddingHorizontal de styles.carrosselConteudo
const LARGURA_CAPA_DESTAQUE = 110;
// Distancia entre o topo da celula e a borda da prateleira (marginTop 22), menos a folga de 8.
const AJUSTE_SCROLL_PRATELEIRA = -14;

function layoutDoCard(aba: Aba) {
  const largura = LARGURA_CARD[aba];
  return (_dados: ArrayLike<Ebook> | null | undefined, index: number) => ({
    length: largura,
    offset: RESPIRO_CARROSSEL + largura * index,
    index,
  });
}
const LAYOUT_CARD: Record<Aba, ReturnType<typeof layoutDoCard>> = {
  colecao: layoutDoCard("colecao"),
  classicos: layoutDoCard("classicos"),
};

const chaveDoLivro = (e: Ebook) => e.id;

const ACEITA_WEBP = { Accept: "image/webp,image/*,*/*;q=0.8" };

// Capa remota em miniatura. Se a miniatura falhar, cai na capa original.
const CapaRemota = memo(function CapaRemota({
  capa,
  larguraDp,
  style,
}: {
  capa: string;
  larguraDp: number;
  style: StyleProp<ImageStyle>;
}) {
  const [falhou, setFalhou] = useState(false);
  const source = useMemo(() => {
    const mini = falhou ? capa : capaOtimizada(capa, larguraDp * PixelRatio.get());
    return mini === capa ? { uri: capa } : { uri: mini, headers: ACEITA_WEBP };
  }, [capa, larguraDp, falhou]);
  const aoFalhar = useCallback(() => setFalhou(true), []);
  return <Image source={source} style={style} onError={falhou ? undefined : aoFalhar} />;
});

const CartaoLivro = memo(function CartaoLivro({
  livro,
  cor,
  aba,
  onAbrir,
}: {
  livro: Ebook;
  cor: string;
  aba: Aba;
  onAbrir: (e: Ebook) => void;
}) {
  const classico = aba === "classicos";
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onAbrir(livro)}
      accessibilityRole="button"
      accessibilityLabel={`Abrir guia ${livro.titulo}`}
      style={classico ? styles.gridCardClassico : styles.gridCardColecao}
    >
      <View
        style={[
          styles.gridCapaWrap,
          classico ? styles.capaClassico : styles.capaColecao,
          { backgroundColor: cor + "20" },
        ]}
      >
        <CapaRemota capa={livro.capa} larguraDp={LARGURA_CARD[aba] - RESPIRO_CARD * 2} style={styles.gridCapa} />
        {classico && (
          <View style={[styles.gridNum, { backgroundColor: cor }]}>
            <Text style={styles.gridNumText}>{livro.numero}</Text>
          </View>
        )}
      </View>
      <Text style={styles.gridTitulo} numberOfLines={2}>
        {classico ? `${livro.emoji} ${livro.titulo}` : livro.titulo}
      </Text>
      {classico && livro.subtitulo ? (
        <Text style={styles.gridSub} numberOfLines={2}>
          {livro.subtitulo}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
});

const PrateleiraLinha = memo(function PrateleiraLinha({
  pr,
  aba,
  onAbrir,
}: {
  pr: Prateleira;
  aba: Aba;
  onAbrir: (e: Ebook) => void;
}) {
  const renderLivro = useCallback(
    ({ item }: ListRenderItemInfo<Ebook>) => <CartaoLivro livro={item} cor={pr.cor} aba={aba} onAbrir={onAbrir} />,
    [pr.cor, aba, onAbrir],
  );

  return (
    <View style={[styles.shelf, { borderTopColor: pr.cor }]}>
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
        <TouchableOpacity activeOpacity={0.85} onPress={() => onAbrir(EBOOK_DESTAQUE)} style={styles.destaqueCard}>
          <View style={styles.destaqueImagemWrap}>
            <CapaRemota capa={EBOOK_DESTAQUE.capa} larguraDp={LARGURA_CAPA_DESTAQUE} style={styles.destaqueImg} />
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
        data={pr.carrossel}
        keyExtractor={chaveDoLivro}
        renderItem={renderLivro}
        getItemLayout={LAYOUT_CARD[aba]}
        showsHorizontalScrollIndicator={false}
        style={styles.carrossel}
        contentContainerStyle={styles.carrosselConteudo}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={3}
      />
    </View>
  );
});

const Cabecalho = memo(function Cabecalho({
  aba,
  prateleiras,
  onTrocarAba,
  onIrPara,
  onLayout,
}: {
  aba: Aba;
  prateleiras: Prateleira[];
  onTrocarAba: (a: Aba) => void;
  onIrPara: (index: number) => void;
  onLayout: (ev: LayoutChangeEvent) => void;
}) {
  return (
    <View onLayout={onLayout}>
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
            <Text style={styles.giftPillText}>{TOTAL_GUIAS} GUIAS · DE GRAÇA</Text>
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
      {MOSTRAR_COLECAO && (
        <View style={styles.abas}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onTrocarAba("colecao")}
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
            onPress={() => onTrocarAba("classicos")}
            accessibilityRole="tab"
            accessibilityState={{ selected: aba === "classicos" }}
            style={[styles.aba, aba === "classicos" && styles.abaAtiva]}
          >
            <Text style={[styles.abaText, aba === "classicos" && styles.abaTextAtiva]}>
              ⭐ Clássicos ({CLASSICOS.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* CHIPS DE CATEGORIA */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {prateleiras.map((pr, index) => (
          <TouchableOpacity
            key={pr.id}
            activeOpacity={0.8}
            onPress={() => onIrPara(index)}
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
    </View>
  );
});

const Rodape = memo(function Rodape({ onPedir }: { onPedir: () => void }) {
  return (
    <View>
      <TouchableOpacity activeOpacity={0.85} onPress={onPedir} style={styles.rodape}>
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
    </View>
  );
});

// Quantas vezes insistir no scroll ate a prateleira, enquanto ela ainda nao foi medida.
const MAX_TENTATIVAS_SCROLL = 6;

// Tela da aba Ebooks. A aba e preguicosa: nada daqui monta antes da primeira visita.
export default function EbooksScreen() {
  const insets = useSafeAreaInsets();
  // Mesma conta das outras abas: altura da barra (68) mais a area segura de baixo.
  const tabBarHeight = 68 + Math.max(insets.bottom, 6);
  const estiloConteudo = useMemo(() => [styles.content, { paddingBottom: tabBarHeight }], [tabBarHeight]);
  const navigation = useNavigation<any>();
  const [ebookAtivo, setEbookAtivo] = useState<Ebook | null>(null);
  const [viewerAberto, setViewerAberto] = useState(false);
  const [aba, setAba] = useState<Aba>(MOSTRAR_COLECAO ? "colecao" : "classicos");
  const listaRef = useRef<FlatList<Prateleira>>(null);
  const alturaCabecalho = useRef(0);
  const scrollPendente = useRef<{ timer: ReturnType<typeof setTimeout> | null; tentativas: number }>({
    timer: null,
    tentativas: 0,
  });

  const prateleiras = aba === "colecao" ? PRATELEIRAS_COLECAO : PRATELEIRAS_CLASSICOS;

  const cancelarScrollPendente = useCallback(() => {
    if (scrollPendente.current.timer) clearTimeout(scrollPendente.current.timer);
    scrollPendente.current = { timer: null, tentativas: 0 };
  }, []);

  useEffect(() => cancelarScrollPendente, [cancelarScrollPendente]);

  const trocarAba = useCallback(
    (nova: Aba) => {
      cancelarScrollPendente();
      setAba(nova);
      listaRef.current?.scrollToOffset({ offset: 0, animated: false });
    },
    [cancelarScrollPendente],
  );

  const irParaCategoria = useCallback(
    (index: number) => {
      cancelarScrollPendente();
      listaRef.current?.scrollToIndex({ index, animated: true, viewOffset: AJUSTE_SCROLL_PRATELEIRA });
    },
    [cancelarScrollPendente],
  );

  // A prateleira alvo ainda nao foi montada (lista vertical sob demanda): rola ate a
  // posicao estimada, o que faz ela montar, e acerta a posicao exata em seguida.
  const aoFalharScroll = useCallback(
    (info: { index: number; highestMeasuredFrameIndex: number; averageItemLength: number }) => {
      const pendente = scrollPendente.current;
      if (pendente.timer) clearTimeout(pendente.timer);
      if (pendente.tentativas >= MAX_TENTATIVAS_SCROLL) {
        scrollPendente.current = { timer: null, tentativas: 0 };
        return;
      }
      pendente.tentativas += 1;
      listaRef.current?.scrollToOffset({
        offset: alturaCabecalho.current + info.averageItemLength * info.index,
        animated: true,
      });
      pendente.timer = setTimeout(() => {
        pendente.timer = null;
        listaRef.current?.scrollToIndex({
          index: info.index,
          animated: true,
          viewOffset: AJUSTE_SCROLL_PRATELEIRA,
        });
      }, 300);
    },
    [],
  );

  const medirCabecalho = useCallback((ev: LayoutChangeEvent) => {
    alturaCabecalho.current = ev.nativeEvent.layout.height;
  }, []);

  const abrirEbook = useCallback((ebook: Ebook) => {
    setEbookAtivo(ebook);
    setViewerAberto(true);
  }, []);

  const fecharViewer = useCallback(() => setViewerAberto(false), []);

  const pedirGuiaExclusivo = useCallback(() => {
    navigation.navigate("HomeTab");
  }, [navigation]);

  const renderPrateleira = useCallback(
    ({ item }: ListRenderItemInfo<Prateleira>) => <PrateleiraLinha pr={item} aba={aba} onAbrir={abrirEbook} />,
    [aba, abrirEbook],
  );

  const chaveDaPrateleira = useCallback((pr: Prateleira) => `${aba}-${pr.id}`, [aba]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle} accessibilityRole="header">
          Ebooks grátis
        </Text>
      </View>

      {/* Lista vertical unica: so as prateleiras perto da tela ficam montadas */}
      <FlatList
        ref={listaRef}
        data={prateleiras}
        keyExtractor={chaveDaPrateleira}
        renderItem={renderPrateleira}
        ListHeaderComponent={
          <Cabecalho
            aba={aba}
            prateleiras={prateleiras}
            onTrocarAba={trocarAba}
            onIrPara={irParaCategoria}
            onLayout={medirCabecalho}
          />
        }
        ListFooterComponent={<Rodape onPedir={pedirGuiaExclusivo} />}
        contentContainerStyle={estiloConteudo}
        showsVerticalScrollIndicator={false}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={3}
        onScrollToIndexFailed={aoFalharScroll}
      />

      {/* O leitor so entra na arvore depois que um guia for aberto */}
      {ebookAtivo && <EbookViewerModal visible={viewerAberto} ebook={ebookAtivo} onClose={fecharViewer} />}
    </View>
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
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  headerTitle: {
    fontFamily: FONTS.displayBlack,
    fontSize: SIZES.lg,
    color: COLORS.greenDark,
  },
  content: {
    // paddingBottom dinamico vem inline pra compensar a TabBar e a Camera central
    paddingTop: 14,
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
    paddingHorizontal: RESPIRO_CARROSSEL,
  },
  gridCardColecao: {
    width: LARGURA_CARD.colecao,
    paddingHorizontal: RESPIRO_CARD,
  },
  gridCardClassico: {
    width: LARGURA_CARD.classicos,
    paddingHorizontal: RESPIRO_CARD,
  },
  capaColecao: {
    aspectRatio: 9 / 16,
  },
  capaClassico: {
    aspectRatio: 3 / 4,
  },
  gridCapaWrap: {
    width: "100%",
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
