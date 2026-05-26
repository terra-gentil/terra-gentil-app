import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
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
import { listarTopics, TopicOut } from "../../api/forum";
import LoginModal from "./LoginModal";

const FILTROS = ["Populares", "Salvos", "Meus posts", "Seguindo", "Pragas", "Suculentas"];

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [filtro, setFiltro] = useState(FILTROS[0]);
  const [meusPosts, setMeusPosts] = useState<MeuPost[]>([]);
  const [apiTopics, setApiTopics] = useState<TopicOut[]>([]);
  const [likes, setLikes] = useState<Record<string, true>>({});
  const [saves, setSaves] = useState<Record<string, true>>({});
  const [seguindo, setSeguindo] = useState<Record<string, true>>({});
  const [comentariosPorPost, setComentariosPorPost] = useState<Record<string, number>>({});
  const [nickname, setNickname] = useState("JARDIM");
  const [userId, setUserId] = useState<string | null>(null);
  const [nomeUsuario, setNomeUsuario] = useState<string | null>(null);
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

  const carregarTopics = useCallback(async (pagina = 1, resetar = false) => {
    if (carregandoRef.current) return;
    carregandoRef.current = true;
    setCarregando(true);
    try {
      const token = await getToken();
      const resultado = await listarTopics({ page: pagina, perPage: 20, token });
      setApiTopics((prev) => (resetar ? resultado.items : [...prev, ...resultado.items]));
      setTemMais(resultado.items.length >= 20);
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

        const todosIds = [
          ...POSTS_MOCK.map((p) => p.id),
          ...meus.map((m) => m.id),
        ];
        recarregarComentarios(todosIds);
      })();
      carregarTopics(1, true);
      return () => {
        alive = false;
      };
    }, [recarregarComentarios, carregarTopics])
  );

  const todosPosts: PostBase[] = useMemo(() => {
    const meus = meusPosts.map((m) => postBaseFromMeu(m, nickname));
    const fonte: PostBase[] =
      apiTopics.length > 0
        ? apiTopics.map((t) => topicToPost(t, userId))
        : POSTS_MOCK;
    const pinados = fonte.filter((p) => p.pinned);
    const naoPinados = fonte.filter((p) => !p.pinned);
    return [...pinados, ...meus, ...naoPinados];
  }, [meusPosts, nickname, apiTopics, userId]);

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
      await Share.share({
        message: `${post.title}\n\nNa comunidade do Doutor Gentileza: https://terragentil.com.br`,
        title: post.title,
      });
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
                  await removerMeuPost(String(post.id));
                  const atualizada = await listarMeusPosts();
                  setMeusPosts(atualizada);
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

  function handleEndReached() {
    if (temMais && !carregando) carregarTopics(paginaAtual + 1);
  }

  return (
    <View style={styles.screen}>
      {!buscaAberta ? (
        <TopBar
          avatarSource={MASCOT_POSES[0]}
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
              <Pills items={FILTROS} active={filtro} onChange={setFiltro} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !carregando ? (
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
          ) : null
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
            carregarTopics(1, true);
            setFiltro("Populares");
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
