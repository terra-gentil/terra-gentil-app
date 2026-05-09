import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
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
} from "../../data/comunidade";
import {
  alternarSeguir,
  listarMeusPosts,
  obterLikes,
  obterSaves,
  obterSeguindo,
  removerMeuPost,
  registrarBusca,
  MeuPost,
} from "../../storage/comunidade";
import { obterOuCriarNickname } from "../../storage/nickname";

const FILTROS = ["Populares", "Meus posts", "Seguindo", "Pragas", "Suculentas"];

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const [filtro, setFiltro] = useState(FILTROS[0]);
  const [meusPosts, setMeusPosts] = useState<MeuPost[]>([]);
  const [likes, setLikes] = useState<Record<string, true>>({});
  const [saves, setSaves] = useState<Record<string, true>>({});
  const [seguindo, setSeguindo] = useState<Record<string, true>>({});
  const [nickname, setNickname] = useState("JARDIM");
  const [novaAberta, setNovaAberta] = useState(false);
  const [notifsAberta, setNotifsAberta] = useState(false);
  const [comentariosAberta, setComentariosAberta] = useState(false);
  const [postAtivo, setPostAtivo] = useState<PostBase | null>(null);
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [buscaTexto, setBuscaTexto] = useState("");

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const [meus, l, s, sg, nick] = await Promise.all([
          listarMeusPosts(),
          obterLikes(),
          obterSaves(),
          obterSeguindo(),
          obterOuCriarNickname(),
        ]);
        if (!alive) return;
        setMeusPosts(meus);
        setLikes(l);
        setSaves(s);
        setSeguindo(sg);
        setNickname(nick);
      })();
      return () => {
        alive = false;
      };
    }, [])
  );

  const todosPosts: PostBase[] = useMemo(() => {
    const meus = meusPosts.map((m) => postBaseFromMeu(m, nickname));
    const pinados = POSTS_MOCK.filter((p) => p.pinned);
    const naoPinados = POSTS_MOCK.filter((p) => !p.pinned);
    return [...pinados, ...meus, ...naoPinados];
  }, [meusPosts, nickname]);

  const postsFiltrados: PostBase[] = useMemo(() => {
    let lista = todosPosts;

    if (filtro === "Meus posts") {
      lista = lista.filter((p) => p.isMine);
    } else if (filtro === "Seguindo") {
      lista = lista.filter((p) => seguindo[p.author]);
    } else if (filtro === "Pragas") {
      lista = lista.filter((p) => p.tags.some((t) => t.toLowerCase().includes("praga")));
    } else if (filtro === "Suculentas") {
      lista = lista.filter((p) => p.tags.some((t) => t.toLowerCase().includes("suculenta")));
    }

    const termo = buscaTexto.trim().toLowerCase();
    if (termo.length >= 2) {
      lista = lista.filter(
        (p) =>
          p.title.toLowerCase().includes(termo) ||
          p.cat.toLowerCase().includes(termo) ||
          p.author.toLowerCase().includes(termo) ||
          p.tags.some((t) => t.toLowerCase().includes(termo))
      );
    }

    return lista;
  }, [todosPosts, filtro, seguindo, buscaTexto]);

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
            Alert.alert(
              "Apagar post?",
              "Essa ação não pode ser desfeita.",
              [
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
              ]
            ),
        },
        { text: "Compartilhar", onPress: () => handleShare(post) },
      ]);
      return;
    }
    Alert.alert(post.title, "O que deseja fazer?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Compartilhar", onPress: () => handleShare(post) },
      {
        text: seguindo[post.author] ? `Deixar de seguir ${post.author}` : `Seguir ${post.author}`,
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
      { text: "Reportar", style: "destructive", onPress: () => Alert.alert("Recebido", "Vamos analisar e tomar as providências.") },
    ]);
  }

  function handleSubmitBusca() {
    if (buscaTexto.trim().length >= 2) {
      registrarBusca(buscaTexto.trim());
    }
  }

  function fecharBusca() {
    setBuscaTexto("");
    setBuscaAberta(false);
  }

  return (
    <View style={styles.screen}>
      {!buscaAberta ? (
        <TopBar
          avatarSource={MASCOT_POSES[0]}
          badge={0}
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {!buscaAberta && (
          <Pills items={FILTROS} active={filtro} onChange={setFiltro} />
        )}

        {postsFiltrados.length === 0 && (
          <View style={styles.vazio}>
            <Text style={styles.vazioEmoji}>
              {buscaTexto.trim().length >= 2 ? "🔎" : filtro === "Meus posts" ? "✏️" : "🌱"}
            </Text>
            <Text style={styles.vazioTitulo}>
              {buscaTexto.trim().length >= 2
                ? "Nada encontrado"
                : filtro === "Meus posts"
                ? "Você ainda não publicou"
                : filtro === "Seguindo"
                ? "Sem novidades por aqui"
                : "Nenhum post nesse filtro"}
            </Text>
            <Text style={styles.vazioTexto}>
              {buscaTexto.trim().length >= 2
                ? `Não achei nada com "${buscaTexto.trim()}". Tente outras palavras.`
                : filtro === "Meus posts"
                ? "Toque em Nova postagem para começar a compartilhar."
                : filtro === "Seguindo"
                ? "Comece a seguir alguém na lista de Populares."
                : "Tente outro filtro."}
            </Text>
          </View>
        )}

        {postsFiltrados.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            liked={Boolean(likes[String(p.id)])}
            saved={Boolean(saves[String(p.id)])}
            seguindo={Boolean(seguindo[p.author])}
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
        ))}

        <View style={{ height: 140 }} />
      </ScrollView>

      {!buscaAberta && (
        <FloatCTA
          label="Nova postagem"
          icon={<Plus size={18} color="#fff" strokeWidth={2.6} />}
          onPress={() => setNovaAberta(true)}
        />
      )}

      <NovaPostagemModal
        visible={novaAberta}
        onClose={() => setNovaAberta(false)}
        onCriado={async () => {
          setNovaAberta(false);
          const atualizada = await listarMeusPosts();
          setMeusPosts(atualizada);
          setFiltro("Meus posts");
        }}
      />

      <ComentariosModal
        visible={comentariosAberta}
        post={postAtivo}
        nickname={nickname}
        onClose={() => setComentariosAberta(false)}
      />

      <NotificacoesModal
        visible={notifsAberta}
        onClose={() => setNotifsAberta(false)}
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
    paddingBottom: 20,
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
});
