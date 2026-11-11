import React, { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
} from "react-native";
import { Play, ExternalLink, Radio } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, FONTS, SIZES, RADIUS, SPACING, shadowChunky, shadowSoft } from "../../constants/theme";
import TopBar from "./TopBar";
import { useNotif } from "../../context/NotifContext";
import Pills from "./Pills";
import SectionTitle from "./SectionTitle";
import NotificacoesModal from "./NotificacoesModal";
import { MASCOT_POSES } from "../../assets/mascot";

const YOUTUBE_CHANNEL = "https://www.youtube.com/@TerraGentil";

function thumbUrl(videoId: string) {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

function thumbUrlHQ(videoId: string) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

// Videos reais do canal @TerraGentil (UCfZn0uytIhsk30SMQtoKeLA), conferidos no feed oficial.
type Video = { id: string; titulo: string; url: string; data: string };

const TRANSFORMACOES: Video[] = [
  {
    id: "Q9FzrwE7nBA",
    titulo: "JARDIM ABANDONADO da Senhora de 90 anos Invadiu a Calçada: Limpei Tudo de GRAÇA!",
    url: "https://www.youtube.com/watch?v=Q9FzrwE7nBA",
    data: "7 nov 2026",
  },
  {
    id: "ykCh1KKHcvg",
    titulo: "17 HORAS Limpando de GRAÇA o JARDIM ABANDONADO dessa Senhora!",
    url: "https://www.youtube.com/watch?v=ykCh1KKHcvg",
    data: "31 out 2026",
  },
  {
    id: "5xIySYrszC4",
    titulo: "Viúvo aos 87, não dá mais conta do JARDIM ABANDONADO. Limpei tudo de GRAÇA!",
    url: "https://www.youtube.com/watch?v=5xIySYrszC4",
    data: "24 out 2026",
  },
  {
    id: "BuM4y6FvX10",
    titulo: "Aos 78 anos, ela me ABENÇOOU por limpar o Jardim Abandonado de GRAÇA!",
    url: "https://www.youtube.com/watch?v=BuM4y6FvX10",
    data: "17 out 2026",
  },
];

// Sem shorts nem lives publicos no canal por enquanto. Preencher aqui quando houver.
const SHORTS: Video[] = [];
const LIVES: Video[] = [];

const CATEGORIAS = [
  "Todos",
  ...(TRANSFORMACOES.length ? ["Transformações"] : []),
  ...(SHORTS.length ? ["Shorts"] : []),
  ...(LIVES.length ? ["Lives"] : []),
];

function abrirVideo(url: string) {
  Linking.openURL(url);
}

export default function VideosScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const tabBarHeight = 68 + Math.max(insets.bottom, 6);
  const { badgeCount } = useNotif();
  const [filtro, setFiltro] = useState("Todos");
  const [notifAberto, setNotifAberto] = useState(false);

  const mostrarTransformacoes = TRANSFORMACOES.length > 0 && (filtro === "Todos" || filtro === "Transformações");
  const mostrarShorts = SHORTS.length > 0 && (filtro === "Todos" || filtro === "Shorts");
  const mostrarLives = LIVES.length > 0 && (filtro === "Todos" || filtro === "Lives");

  return (
    <View style={styles.screen}>
      <TopBar
        avatarSource={MASCOT_POSES[0]}
        badge={badgeCount}
        onAvatarPress={() => navigation.navigate("ProfileTab")}
        onBellPress={() => setNotifAberto(true)}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + 12 }]}
      >
        {/* Header */}
        <View style={styles.headerWrap}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Terra Gentil TV</Text>
            <TouchableOpacity style={styles.subscribeBtn} onPress={() => abrirVideo(YOUTUBE_CHANNEL)} activeOpacity={0.8}>
              <Play size={14} color="#fff" fill="#fff" />
              <Text style={styles.subscribeBtnText}>Inscreva-se</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.headerSub}>Canal oficial  .  Transformações reais</Text>
        </View>

        {/* Pills */}
        <Pills items={CATEGORIAS} active={filtro} onChange={setFiltro} color={COLORS.lavender} colorDeep="#7c3aed" />

        {/* Hero: video mais emocionante */}
        {mostrarTransformacoes && (
          <View style={styles.heroWrap}>
            <TouchableOpacity style={styles.hero} onPress={() => abrirVideo(TRANSFORMACOES[0].url)} activeOpacity={0.85}>
              <Image
                source={{ uri: thumbUrlHQ(TRANSFORMACOES[0].id) }}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
              />
              <View style={styles.heroOverlay} />

              {/* Badge */}
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>MAIS RECENTE</Text>
              </View>

              {/* Play button */}
              <View style={styles.heroPlayWrap}>
                <View style={styles.heroPlayBtn}>
                  <Play size={28} color={COLORS.green} fill={COLORS.green} />
                </View>
              </View>

              {/* Info bottom */}
              <View style={styles.heroInfo}>
                <Text style={styles.heroLabel}>TRANSFORMAÇÕES  .  {TRANSFORMACOES[0].data}</Text>
                <Text style={styles.heroTitulo} numberOfLines={2}>{TRANSFORMACOES[0].titulo}</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Stat strip */}
        <View style={styles.statStrip}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{TRANSFORMACOES.length + SHORTS.length + LIVES.length}</Text>
            <Text style={styles.statLabel}>vídeos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{CATEGORIAS.length - 1}</Text>
            <Text style={styles.statLabel}>{CATEGORIAS.length - 1 === 1 ? "categoria" : "categorias"}</Text>
          </View>
        </View>

        {/* Secao: Transformacoes */}
        {mostrarTransformacoes && (
          <>
            <SectionTitle title="Transformações" action={`${TRANSFORMACOES.length} vídeos →`} actionColor={COLORS.green} onAction={() => abrirVideo(YOUTUBE_CHANNEL)} />
            <Text style={styles.playlistDesc}>Transformações reais e gratuitas de jardins abandonados. Todo o trabalho feito de graça para quem não pode pagar.</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {TRANSFORMACOES.map((v) => (
                <TouchableOpacity key={v.id} style={styles.videoCard} onPress={() => abrirVideo(v.url)} activeOpacity={0.8}>
                  <View style={styles.videoThumbWrap}>
                    <Image source={{ uri: thumbUrl(v.id) }} style={styles.videoThumbImg} resizeMode="cover" />
                    <View style={styles.videoPlaySmall}>
                      <Play size={16} color={COLORS.greenDark} fill={COLORS.greenDark} />
                    </View>
                  </View>
                  <View style={styles.videoInfo}>
                    <Text style={styles.videoTitulo} numberOfLines={2}>{v.titulo}</Text>
                    <Text style={styles.videoMeta}>{v.data}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* Secao: Shorts */}
        {mostrarShorts && (
          <>
            <SectionTitle title="Shorts" action={`${SHORTS.length} vídeos →`} actionColor={COLORS.coral} onAction={() => abrirVideo(YOUTUBE_CHANNEL)} />
            <Text style={styles.playlistDesc}>O melhor das transformações em poucos segundos.</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {SHORTS.map((v) => (
                <TouchableOpacity key={v.id} style={styles.videoCard} onPress={() => abrirVideo(v.url)} activeOpacity={0.8}>
                  <View style={styles.videoThumbWrap}>
                    <Image source={{ uri: thumbUrl(v.id) }} style={styles.videoThumbImg} resizeMode="cover" />
                    <View style={styles.videoPlaySmall}>
                      <Play size={16} color={COLORS.greenDark} fill={COLORS.greenDark} />
                    </View>
                  </View>
                  <View style={styles.videoInfo}>
                    <Text style={styles.videoTitulo} numberOfLines={2}>{v.titulo}</Text>
                    <Text style={styles.videoMeta}>{v.data}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* Lives */}
        {mostrarLives && (
          <>
            <SectionTitle title="Transmissões ao vivo" />
            <View style={styles.livesList}>
              {LIVES.map((v) => (
                <TouchableOpacity key={v.id} style={styles.liveCard} onPress={() => abrirVideo(v.url)} activeOpacity={0.8}>
                  <View style={styles.liveThumbWrap}>
                    <Image source={{ uri: thumbUrl(v.id) }} style={styles.liveThumbImg} resizeMode="cover" />
                    <View style={styles.liveBadge}>
                      <Radio size={12} color="#fff" />
                      <Text style={styles.liveBadgeText}>LIVE</Text>
                    </View>
                  </View>
                  <View style={styles.liveInfo}>
                    <Text style={styles.liveTitulo} numberOfLines={2}>{v.titulo}</Text>
                    <Text style={styles.videoMeta}>{v.data}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* CTA YouTube */}
        <View style={styles.ctaWrap}>
          <TouchableOpacity style={styles.ctaCard} onPress={() => abrirVideo(YOUTUBE_CHANNEL)} activeOpacity={0.85}>
            <View style={styles.ctaLeft}>
              <Image source={MASCOT_POSES[2]} style={styles.ctaMascot} resizeMode="cover" />
              <View style={{ flex: 1 }}>
                <Text style={styles.ctaTitle}>Inscreva-se no canal!</Text>
                <Text style={styles.ctaSub}>Vídeo novo toda semana. Transformações, gentileza e muito verde.</Text>
              </View>
            </View>
            <View style={styles.ctaBtn}>
              <ExternalLink size={16} color="#fff" />
              <Text style={styles.ctaBtnText}>Abrir YouTube</Text>
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>

      <NotificacoesModal
        visible={notifAberto}
        onClose={() => setNotifAberto(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    // paddingBottom dinamico vem inline pra compensar TabBar + insets
  },
  headerWrap: {
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: 6,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontFamily: FONTS.displayBlack,
    fontSize: SIZES.xxl,
    color: COLORS.greenDark,
  },
  subscribeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.coral,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.pill,
    ...shadowChunky(COLORS.coralDeep),
  },
  subscribeBtnText: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.sm,
    color: "#fff",
  },
  headerSub: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: SIZES.sm,
    color: COLORS.inkMute,
    marginTop: 2,
  },

  // Hero
  heroWrap: {
    paddingHorizontal: SPACING.screenPadding,
    paddingBottom: 14,
  },
  hero: {
    height: 200,
    borderRadius: RADIUS.xl,
    overflow: "hidden",
    backgroundColor: COLORS.greenDark,
    position: "relative",
    ...shadowChunky(COLORS.greenDeep),
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  heroBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.coral,
  },
  heroBadgeText: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: 10,
    color: "#fff",
    letterSpacing: 0.5,
  },
  heroPlayWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  heroPlayBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 10,
  },
  heroInfo: {
    position: "absolute",
    bottom: 14,
    left: 14,
    right: 14,
  },
  heroLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  heroTitulo: {
    fontFamily: FONTS.displayBlack,
    fontSize: SIZES.lg,
    color: "#fff",
    marginTop: 4,
    lineHeight: 22,
  },

  // Stat strip
  statStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: SPACING.screenPadding,
    marginBottom: 6,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    ...shadowSoft(),
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNum: {
    fontFamily: FONTS.displayBlack,
    fontSize: SIZES.xl,
    color: COLORS.greenDark,
  },
  statLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: SIZES.xs,
    color: COLORS.inkMute,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.divider,
  },

  // Playlist description
  playlistDesc: {
    fontFamily: FONTS.body,
    fontSize: SIZES.sm,
    color: COLORS.inkSoft,
    paddingHorizontal: SPACING.screenPadding,
    marginBottom: 10,
    lineHeight: 18,
  },

  // Video cards horizontal
  horizontalScroll: {
    paddingHorizontal: SPACING.screenPadding,
    paddingBottom: SPACING.sectionGap,
    gap: 12,
  },
  videoCard: {
    width: 200,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    overflow: "hidden",
    ...shadowSoft(),
  },
  videoThumbWrap: {
    height: 110,
    position: "relative",
    backgroundColor: COLORS.divider,
  },
  videoThumbImg: {
    width: "100%",
    height: "100%",
  },
  videoPlaySmall: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -18,
    marginLeft: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  videoInfo: {
    padding: 10,
  },
  videoTitulo: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.smPlus,
    color: COLORS.ink,
    lineHeight: 17,
  },
  videoMeta: {
    fontFamily: FONTS.body,
    fontSize: SIZES.xs,
    color: COLORS.inkMute,
    marginTop: 4,
  },

  // Lives
  livesList: {
    paddingHorizontal: SPACING.screenPadding,
    gap: 8,
    paddingBottom: SPACING.sectionGap,
  },
  liveCard: {
    flexDirection: "row",
    gap: 12,
    padding: 10,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.sm,
    ...shadowSoft(),
  },
  liveThumbWrap: {
    width: 120,
    height: 70,
    borderRadius: RADIUS.sm,
    overflow: "hidden",
    backgroundColor: COLORS.divider,
    position: "relative",
  },
  liveThumbImg: {
    width: "100%",
    height: "100%",
  },
  liveBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: COLORS.coralDeep,
  },
  liveBadgeText: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: 9,
    color: "#fff",
    letterSpacing: 0.5,
  },
  liveInfo: {
    flex: 1,
    paddingTop: 2,
  },
  liveTitulo: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.smPlus,
    color: COLORS.ink,
    lineHeight: 17,
  },

  // CTA
  ctaWrap: {
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: 4,
  },
  ctaCard: {
    backgroundColor: COLORS.greenSoft,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.green,
    ...shadowChunky(COLORS.greenDeep + "40"),
  },
  ctaLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  ctaMascot: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  ctaTitle: {
    fontFamily: FONTS.displayBlack,
    fontSize: SIZES.md,
    color: COLORS.greenDark,
  },
  ctaSub: {
    fontFamily: FONTS.body,
    fontSize: SIZES.sm,
    color: COLORS.inkSoft,
    marginTop: 2,
    lineHeight: 17,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.green,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    ...shadowChunky(COLORS.greenDeep),
  },
  ctaBtnText: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.body,
    color: "#fff",
  },
});
