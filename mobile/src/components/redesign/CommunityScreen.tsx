import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as LegacyFS from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as Clipboard from "expo-clipboard";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Plus, Search, X } from "lucide-react-native";
import { COLORS, FONTS, SIZES } from "../../constants/theme";
import { MASCOT_POSES } from "../../assets/mascot";
import TopBar from "./TopBar";
import Pills from "./Pills";
import FloatCTA from "./FloatCTA";
import PostCard from "./PostCard";
import NovaPostagemModal from "./NovaPostagemModal";
import ComentariosModal from "./ComentariosModal";
import NotificacoesModal from "./NotificacoesModal";
import {
  PostBase,
  POSTS_MOCK,
  postBaseFromMeu,
  topicToPost,
} from "../../data/comunidade";
import {
  alternarSeguir,
  contarComentarios,
  listarMeusPosts,
  obterLikes,
  obterSaves,
  obterSeguindo,
  removerMeuPost,
  registrarBusca,
  MeuPost,
} from "../../storage/comunidade";
import { obterOuCriarNickname } from "../../storage/nickname";
import { getToken, getUser, AuthUser } from "../../storage/auth";
import { listarTopics, deletarTopic, TopicOut } from "../../api/forum";
import LoginModal from "./LoginModal";
import { incrementarStat } from "../../storage/conquistas";

const FILTROS = ["Recentes", "Populares", "Salvos", "Meus posts", "Seguindo", "Pragas", "Suculentas"];

function PostCardSkeleton() {
  return (
    <View style={skeletonStyles.card}>
      <View style={skeletonStyles.header}>
        <View style={skeletonStyles.avatar} />
        <View style={{ flex: 1, gap: 6 }}>
          <View style={skeletonStyles.lineShort} />
          <View style={skeletonStyles.lineXs} />
        </View>
      </View>
      <View style={skeletonStyles.lineTitle} />
      <View style={skeletonStyles.lineBody} />
      <View style={skeletonStyles.lineFull} />
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    margin: 12,
    marginBottom: 0,
    padding: 14,
    gap: 10,
  },
  header: { flexDirection: "row", gap: 10, alignItems: "center" },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#efeae0" },
  lineShort: { height: 12, width: "50%", borderRadius: 6, backgroundColor: "#efeae0" },
  lineXs: { height: 10, width: "30%", borderRadius: 5, backgroundColor: "#efeae0" },
  lineTitle: { height: 16, width: "80%", borderRadius: 6, backgroundColor: "#efeae0" },
  lineBody: { height: 12, width: "60%", borderRadius: 5, backgroundColor: "#efeae0" },
  lineFull: { height: 12, width: "90%", borderRadius: 5, backgroundColor: "#efeae0" },
});

function sortParaFiltro(filtro: string): "activity" | "newest" | "noreply" {
  if (filtro === "Recentes") return "newest";
  return "activity";
}

const CAT_EMOJI: Record<string, string> = {
  "Meu jardim": "🪴",
  "Pragas e doenças": "🐛",
  "Plantas pet-friendly": "🐾",
  "Suculentas": "🌵",
  "Hortas": "🥕",
  "Floração": "🌸",
  "Antes e depois": "✨",
  "Dúvida": "🤔",
};

function formatarNumero(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return String(n);
}

function gerarTextoCompartilhamento(post: PostBase, url: string): string {
  const catEmoji = CAT_EMOJI[post.cat] ?? "🌿";
  const likes = post.likesBase ?? 0;
  const comments = post.comentariosBase ?? 0;
  const totalEngajamento = likes + comments;

  const stats: string[] = [];
  if (likes > 0) stats.push(`💚 ${formatarNumero(likes)}`);
  if (comments > 0) stats.push(`💬 ${formatarNumero(comments)}`);
  const statsLinha = stats.length > 0 ? stats.join("  ") : null;

  let chamada: string;
  let cta: string;

  if (post.pinned) {
    chamada = `📌 Post fixado no Terra Gentil`;
    cta = `Baixa o app e cuida melhor das suas plantas 🌱\n${url}`;
  } else if (totalEngajamento >= 1000) {
    chamada = `🔥 Viral no Terra Gentil`;
    cta = `${formatarNumero(totalEngajamento)} pessoas ja interagiram. Vem participar 👇\n${url}`;
  } else if (totalEngajamento >= 100) {
    chamada = `${catEmoji} Em alta no Terra Gentil`;
    cta = `A comunidade ta debatendo isso. Vem ver 👇\n${url}`;
  } else {
    chamada = `${catEmoji} Terra Gentil`;
    cta = `Compartilha o que voce sabe. Toda planta importa 🌱\n${url}`;
  }

  const partes = [
    chamada,
    `"${post.title}"`,
    statsLinha ? `${statsLinha}  ·  por ${post.author}` : `por ${post.author}`,
    cta,
  ];

  return partes.join("\n\n");
}

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [filtro, setFiltro] = useState<string>("Recentes");
  const [meusPosts, setMeusPosts] = useState<MeuPost[]>([]);
  const [apiTopics, setApiTopics] = useState<TopicOut[]>([]);
  const [likes, setLikes] = useState<Record<string, true>>({});
  const [saves, setSaves] = useState<Record<string, true>>({});
  const [seguindo, setSeguindo] = useState<Record<string, true>>({});
  const [comentariosPorPost, setComentariosPorPost] = useState<Record<string, number>>({});
  const [nickname, setNickname] = useState("JARDIM");
  const [userId, setUserId] = useState<string | null>(null);
  const [nomeUsuario, setNomeUsuario] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [novaAberta, setNovaAberta] = useState(false);
  const [loginAberto, setLoginAberto] = useState(false);
  const [notifsAberta, setNotifsAberta] = useState(false);
  const [comentariosAberta, setComentariosAberta] = useState(false);
  const [postAtivo, setPostAtivo] = useState<PostBase | null>(null);
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [buscaTexto, setBuscaTexto] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [temMais, setTemMais] = useState(true);
  const carregandoRef = useRef(false);
  const flatListRef = useRef<FlatList<PostBase>>(null);

  const recarregarComentarios = useCallback(async (ids: (string | number)[]) => {
    const entries = await Promise.all(
      ids.map(async (id) => [String(id), await contarComentarios(id)] as const),
    );
    setComentariosPorPost((curr) => {
      const next = { ...curr };
      for (const [id, n] of entries) next[id] = n;
      return next;
    });
  }, []);

  const carregarTopics = useCallback(async (
    pagina = 1,
    resetar = false,
    sort: "activity" | "newest" | "noreply" = "newest",
    perPage = 20,
  ) => {
    if (carregandoRef.current) return;
    carregandoRef.current = true;
    setCarregando(true);
    try {
      const token = await getToken();
      const resultado = await listarTopics({ page: pagina, perPage, sort, token });
      console.log(`[comunidade] topics carregados sort=${sort} pagina=${pagina} total=${resultado.items.length}`);
      setApiTopics((prev) => (resetar ? resultado.items : [...prev, ...resultado.items]));
      setTemMais(resultado.items.length >= perPage);
      setPaginaAtual(pagina);
    } catch (err) {
      console.log("[comunidade] erro ao buscar topics:", err);
    } finally {
      carregandoRef.current = false;
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const [meus, l, s, sg, nick, user] = await Promise.all([
          listarMeusPosts(),
          obterLikes(),
          obterSaves(),
          obterSeguindo(),
          obterOuCriarNickname(),
          getUser(),
        ]);
        if (!alive) return;
        setMeusPosts(meus);
        setLikes(l);
        setSaves(s);
        setSeguindo(sg);
        setNickname(nick);
        setUserId(user?.id ?? null);
        setNomeUsuario(user?.display_name ?? null);
        setAvatarUrl(user?.avatar_url ?? null);

        const todosIds = [
          ...POSTS_MOCK.map((p) => p.id),
          ...meus.map((m) => m.id),
        ];
        recarregarComentarios(todosIds);
      })();
      carregarTopics(1, true, "newest", 8);
      return () => {
        alive = false;
      };
    }, [recarregarComentarios, carregarTopics])
  );

  const todosPosts: PostBase[] = useMemo(() => {
    const fonte: PostBase[] =
      apiTopics.length > 0
        ? apiTopics.map((t) => topicToPost(t, userId))
        : POSTS_MOCK;
    const pinados = fonte.filter((p) => p.pinned);
    const naoPinados = fonte.filter((p) => !p.pinned);
    // Posts locais (offline/legacy) so aparecem no filtro "Meus posts"
    if (filtro === "Meus posts") {
      const meus = meusPosts.map((m) => postBaseFromMeu(m, nickname));
      return [...pinados, ...naoPinados, ...meus];
    }
    return [...pinados, ...naoPinados];
  }, [meusPosts, nickname, apiTopics, userId, filtro]);

  const postsFiltrados: PostBase[] = useMemo(() => {
    let lista = todosPosts;

    if (filtro === "Salvos") {
      lista = lista.filter((p) => saves[String(p.id)]);
    } else if (filtro === "Meus posts") {
      lista = lista.filter((p) => p.isMine);
    } else if (filtro === "Seguindo") {
      lista = lista.filter((p) => seguindo[p.author]);
    } else if (filtro === "Pragas") {
      lista = lista.filter(
        (p) =>
          p.tags.some((t) => t.toLowerCase().includes("praga")) ||
          p.cat.toLowerCase().includes("praga"),
      );
    } else if (filtro === "Suculentas") {
      lista = lista.filter(
        (p) =>
          p.tags.some((t) => t.toLowerCase().includes("suculenta")) ||
          p.cat.toLowerCase().includes("suculenta"),
      );
    }

    const termo = buscaTexto.trim().toLowerCase();
    if (termo.length >= 2) {
      lista = lista.filter(
        (p) =>
          p.title.toLowerCase().includes(termo) ||
          p.cat.toLowerCase().includes(termo) ||
          p.author.toLowerCase().includes(termo) ||
          p.tags.some((t) => t.toLowerCase().includes(termo)),
      );
    }

    return lista;
  }, [todosPosts, filtro, seguindo, saves, buscaTexto]);

  function handleAbrirComentarios(post: PostBase) {
    setPostAtivo(post);
    setComentariosAberta(true);
  }

  async function handleShare(post: PostBase) {
    try {
      const url = "https://terragentil.com.br";
      const msg = gerarTextoCompartilhamento(post, url);

      if (post.imageUri) {
        const b64Match = post.imageUri.match(/^data:image\/\w+;base64,(.+)$/s);
        if (b64Match) {
          const safeId = String(post.id).replace(/[^a-z0-9]/gi, "");
          const tempUri = `${LegacyFS.cacheDirectory}share_${safeId}.jpg`;
          await LegacyFS.writeAsStringAsync(tempUri, b64Match[1], {
            encoding: LegacyFS.EncodingType.Base64,
          });

          if (Platform.OS === "ios") {
            // iOS: Share.share suporta url (imagem) + message (texto) juntos
            await Share.share({ url: tempUri, message: msg, title: post.title });
          } else {
            // Android: Share.share ignora url, so envia texto.
            // Copia texto para clipboard e abre share nativo da imagem.
            await Clipboard.setStringAsync(msg);
            await Sharing.shareAsync(tempUri, {
              mimeType: "image/jpeg",
              dialogTitle: post.title,
            });
            Alert.alert(
              "Texto copiado!",
              "O texto com o convite foi copiado. Cole como legenda no app que voce escolheu.",
              [{ text: "OK" }],
            );
          }
          return;
        }
      }

      await Share.share({ message: msg, url, title: post.title });
    } catch (err) {
      console.log("[comunidade] erro ao compartilhar:", err);
    }
  }

  function handleMore(post: PostBase) {
    if (post.isMine) {
      Alert.alert(post.title, "O que deseja fazer?", [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apagar post",
          style: "destructive",
          onPress: () =>
            Alert.alert("Apagar post?", "Essa ação não pode ser desfeita.", [
              { text: "Cancelar", style: "cancel" },
              {
                text: "Apagar",
                style: "destructive",
                onPress: async () => {
                  if (post.isApiTopic) {
                    const token = await getToken();
                    if (!token) { Alert.alert("Erro", "Você precisa estar logado para apagar."); return; }
                    try {
                      await deletarTopic(String(post.id), token);
                      await carregarTopics(1, true, sortParaFiltro(filtro), 8);
                    } catch (err) {
                      Alert.alert("Erro", "Não foi possível apagar o post. Tente de novo.");
                    }
                  } else {
                    await removerMeuPost(String(post.id));
                    const atualizada = await listarMeusPosts();
                    setMeusPosts(atualizada);
                  }
                },
              },
            ]),
        },
        { text: "Compartilhar", onPress: () => handleShare(post) },
      ]);
      return;
    }
    Alert.alert(post.title, "O que deseja fazer?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Compartilhar", onPress: () => handleShare(post) },
      {
        text: seguindo[post.author]
          ? `Deixar de seguir ${post.author}`
          : `Seguir ${post.author}`,
        onPress: async () => {
          if (post.author === "Doutor Gentileza") {
            Alert.alert("Doutor Gentileza", "O Doutor Gentileza está sempre por aqui!");
            return;
          }
          const novo = await alternarSeguir(post.author);
          setSeguindo((curr) => {
            const proximo = { ...curr };
            if (novo) proximo[post.author] = true;
            else delete proximo[post.author];
            return proximo;
          });
        },
      },
      {
        text: "Reportar",
        style: "destructive",
        onPress: () =>
          Alert.alert("Recebido", "Vamos analisar e tomar as providências."),
      },
    ]);
  }

  function handleSubmitBusca() {
    if (buscaTexto.trim().length >= 2) registrarBusca(buscaTexto.trim());
  }

  function fecharBusca() {
    setBuscaTexto("");
    setBuscaAberta(false);
  }

  function handleFiltroChange(novoFiltro: string) {
    setFiltro(novoFiltro);
    if (novoFiltro === "Recentes" || novoFiltro === "Populares") {
      carregarTopics(1, true, sortParaFiltro(novoFiltro), 8);
    }
  }

  function handleEndReached() {
    if (temMais && !carregando) carregarTopics(paginaAtual + 1, false, sortParaFiltro(filtro), 20);
  }

  return (
    <View style={styles.screen}>
      {!buscaAberta ? (
        <TopBar
          avatarSource={avatarUrl ? { uri: avatarUrl } : MASCOT_POSES[0]}
          badge={0}
          onAvatarPress={() => navigation.navigate("ProfileTab")}
          onBellPress={() => setNotifsAberta(true)}
          onSearchPress={() => setBuscaAberta(true)}
        />
      ) : (
        <View style={[styles.searchBar, { paddingTop: insets.top + 8 }]}>
          <View style={styles.searchInputWrap}>
            <Search size={18} color={COLORS.inkSoft} strokeWidth={2.2} />
            <TextInput
              autoFocus
              value={buscaTexto}
              onChangeText={setBuscaTexto}
              onSubmitEditing={handleSubmitBusca}
              placeholder="Buscar posts, autores, tags..."
              placeholderTextColor={COLORS.inkMute}
              returnKeyType="search"
              style={styles.searchInput}
            />
            {buscaTexto.length > 0 && (
              <Pressable onPress={() => setBuscaTexto("")} hitSlop={8}>
                <X size={18} color={COLORS.inkMute} strokeWidth={2.4} />
              </Pressable>
            )}
          </View>
          <TouchableOpacity onPress={fecharBusca} hitSlop={8} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={postsFiltrados}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item: p }) => (
          <PostCard
            post={p}
            liked={Boolean(likes[String(p.id)])}
            saved={Boolean(saves[String(p.id)])}
            seguindo={Boolean(seguindo[p.author])}
            comentariosLocais={comentariosPorPost[String(p.id)] ?? 0}
            onLikedChange={(novo) => {
              if (novo) incrementarStat("totalReacoesEnviadas");
              setLikes((curr) => {
                const next = { ...curr };
                if (novo) next[String(p.id)] = true;
                else delete next[String(p.id)];
                return next;
              });
            }}
            onSavedChange={(novo) => {
              setSaves((curr) => {
                const next = { ...curr };
                if (novo) next[String(p.id)] = true;
                else delete next[String(p.id)];
                return next;
              });
            }}
            onSeguindoChange={(autor, novo) => {
              setSeguindo((curr) => {
                const next = { ...curr };
                if (novo) next[autor] = true;
                else delete next[autor];
                return next;
              });
            }}
            onMore={() => handleMore(p)}
            onComment={() => handleAbrirComentarios(p)}
            onShare={() => handleShare(p)}
            onVerComentarios={() => handleAbrirComentarios(p)}
            onContinuarLendo={() => handleAbrirComentarios(p)}
          />
        )}
        ListHeaderComponent={
          !buscaAberta ? (
            <View>
              <View style={styles.loginStatus}>
                <View style={[styles.loginDot, { backgroundColor: nomeUsuario ? COLORS.green : COLORS.inkMute }]} />
                <Text style={[styles.loginStatusText, { color: nomeUsuario ? COLORS.greenDark : COLORS.inkMute }]}>
                  {nomeUsuario ? `Logado: ${nomeUsuario}` : "Sem conta"}
                </Text>
              </View>
              <Pills items={FILTROS} active={filtro} onChange={handleFiltroChange} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          carregando ? (
            <View>
              {[0, 1, 2, 3, 4].map((i) => <PostCardSkeleton key={i} />)}
            </View>
          ) : (
            <View style={styles.vazio}>
              <Text style={styles.vazioEmoji}>
                {buscaTexto.trim().length >= 2
                  ? "🔎"
                  : filtro === "Meus posts"
                  ? "✏️"
                  : filtro === "Salvos"
                  ? "🔖"
                  : "🌱"}
              </Text>
              <Text style={styles.vazioTitulo}>
                {buscaTexto.trim().length >= 2
                  ? "Nada encontrado"
                  : filtro === "Meus posts"
                  ? "Você ainda não publicou"
                  : filtro === "Salvos"
                  ? "Nenhum post salvo ainda"
                  : filtro === "Seguindo"
                  ? "Sem novidades por aqui"
                  : "Nenhum post nesse filtro"}
              </Text>
              <Text style={styles.vazioTexto}>
                {buscaTexto.trim().length >= 2
                  ? `Não achei nada com "${buscaTexto.trim()}". Tente outras palavras.`
                  : filtro === "Meus posts"
                  ? "Toque em Nova postagem para começar a compartilhar."
                  : filtro === "Salvos"
                  ? "Toque no marcador de página em qualquer post pra guardar pra depois."
                  : filtro === "Seguindo"
                  ? "Comece a seguir alguém na lista de Populares."
                  : "Tente outro filtro."}
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          carregando ? (
            <ActivityIndicator
              size="small"
              color={COLORS.green}
              style={styles.footer}
            />
          ) : null
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />

      {!buscaAberta && (
        <FloatCTA
          label="Nova postagem"
          icon={<Plus size={18} color="#fff" strokeWidth={2.6} />}
          onPress={async () => {
            const token = await getToken();
            if (token) {
              setNovaAberta(true);
            } else {
              setLoginAberto(true);
            }
          }}
        />
      )}

      <NovaPostagemModal
        visible={novaAberta}
        onClose={() => setNovaAberta(false)}
        onCriado={async (viaApi) => {
          setNovaAberta(false);
          if (viaApi) {
            carregandoRef.current = false;
            setFiltro("Recentes");
            await new Promise((r) => setTimeout(r, 400));
            await carregarTopics(1, true, "newest", 8);
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
          } else {
            const atualizada = await listarMeusPosts();
            setMeusPosts(atualizada);
            setFiltro("Meus posts");
          }
        }}
      />

      <ComentariosModal
        visible={comentariosAberta}
        post={postAtivo}
        nickname={nickname}
        onClose={() => {
          setComentariosAberta(false);
          if (postAtivo && !postAtivo.isApiTopic) {
            recarregarComentarios([postAtivo.id]);
          }
        }}
      />

      <NotificacoesModal
        visible={notifsAberta}
        onClose={() => setNotifsAberta(false)}
      />

      <LoginModal
        visible={loginAberto}
        onClose={() => setLoginAberto(false)}
        onLogin={(user: AuthUser) => {
          setLoginAberto(false);
          setUserId(user.id);
          setNomeUsuario(user.display_name);
          setAvatarUrl(user.avatar_url);
          setNovaAberta(true);
        }}
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
    paddingBottom: 140,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.bg,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 100,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: COLORS.divider,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: SIZES.body,
    color: COLORS.ink,
    padding: 0,
  },
  cancelBtn: {
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  cancelText: {
    fontFamily: FONTS.bodyBold,
    fontSize: SIZES.body,
    color: COLORS.green,
  },
  vazio: {
    paddingHorizontal: 24,
    paddingVertical: 60,
    alignItems: "center",
  },
  vazioEmoji: {
    fontSize: 36,
    marginBottom: 12,
  },
  vazioTitulo: {
    fontFamily: FONTS.displayBlack,
    fontSize: SIZES.xl,
    color: COLORS.greenDark,
    marginBottom: 6,
    textAlign: "center",
  },
  vazioTexto: {
    fontFamily: FONTS.body,
    fontSize: SIZES.body,
    color: COLORS.inkSoft,
    textAlign: "center",
    lineHeight: 20,
  },
  footer: {
    paddingVertical: 24,
  },
  loginStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  loginDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  loginStatusText: {
    fontFamily: FONTS.body,
    fontSize: SIZES.xs,
  },
});
