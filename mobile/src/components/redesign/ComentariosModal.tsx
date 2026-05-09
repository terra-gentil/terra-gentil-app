import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { X, Send } from "lucide-react-native";
import { COLORS, FONTS, SIZES, shadowSoft } from "../../constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PostBase } from "../../data/comunidade";
import {
  Comentario,
  adicionarComentario,
  listarComentarios,
} from "../../storage/comunidade";

interface Props {
  visible: boolean;
  post: PostBase | null;
  nickname: string;
  onClose: () => void;
}

const EMOJIS = ["🌱", "🍀", "🌿", "🌳", "🌷", "🌻", "🌼", "🌺", "🌸", "🪴"];

function escolherEmoji(autor: string) {
  const seed = autor.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return EMOJIS[seed % EMOJIS.length];
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `há ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `há ${days}d`;
}

export default function ComentariosModal({
  visible,
  post,
  nickname,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!visible || !post) return;
    listarComentarios(post.id).then(setComentarios);
  }, [visible, post]);

  if (!post) return null;

  async function handleEnviar() {
    if (!post) return;
    const limpo = texto.trim();
    if (limpo.length < 2) return;
    setEnviando(true);
    try {
      const novo = await adicionarComentario(
        post.id,
        nickname,
        limpo,
        escolherEmoji(nickname),
      );
      setComentarios((curr) => [...curr, novo]);
      setTexto("");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={10} style={styles.closeBtn}>
            <X size={22} color={COLORS.ink} strokeWidth={2.4} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Comentários</Text>
          <View style={{ width: 32 }} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? insets.bottom : 0}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Post resumo */}
            <View style={styles.postResumo}>
              <View style={styles.postResumoHero}>
                {post.imageUri ? (
                  <Image
                    source={{ uri: post.imageUri }}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                  />
                ) : (
                  <LinearGradient
                    colors={post.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                )}
                <LinearGradient
                  colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.6)"]}
                  start={{ x: 0, y: 0.3 }}
                  end={{ x: 0, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <Text style={styles.postResumoLabel}>{post.cat.toUpperCase()}</Text>
                <Text style={styles.postResumoTitulo} numberOfLines={3}>
                  {post.title}
                </Text>
              </View>
              <View style={styles.postResumoFooter}>
                <View style={[styles.autorAvatar, { backgroundColor: post.avatarColor }]}>
                  {post.avatarSource ? (
                    <Image source={post.avatarSource} style={styles.autorAvatarImg} />
                  ) : (
                    <Text style={styles.autorAvatarEmoji}>{post.avatarEmoji}</Text>
                  )}
                </View>
                <Text style={styles.autorNome} numberOfLines={1}>
                  por {post.author}
                </Text>
              </View>
            </View>

            {/* Comentario destaque (mock do post) */}
            {post.comment && (
              <View style={[styles.comentarioBox, styles.comentarioDestaque]}>
                <View style={[styles.comentAvatar, { backgroundColor: post.accent }]}>
                  <Text style={styles.comentAvatarEmoji}>{post.comment.avatar}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.comentHeader}>
                    <Text style={styles.comentNome}>{post.comment.name}</Text>
                    <Text style={styles.comentDestaqueBadge}>+ comentado</Text>
                  </View>
                  <Text style={styles.comentTexto}>{post.comment.text}</Text>
                </View>
              </View>
            )}

            {/* Lista de comentarios locais */}
            {comentarios.length === 0 && !post.comment && (
              <View style={styles.vazio}>
                <Text style={styles.vazioEmoji}>💬</Text>
                <Text style={styles.vazioTitulo}>Nada por aqui ainda</Text>
                <Text style={styles.vazioTexto}>
                  Seja a primeira pessoa a comentar e ajudar.
                </Text>
              </View>
            )}

            {comentarios.map((c) => (
              <View key={c.id} style={styles.comentarioBox}>
                <View
                  style={[
                    styles.comentAvatar,
                    { backgroundColor: c.autor === nickname ? COLORS.green : post.accent },
                  ]}
                >
                  <Text style={styles.comentAvatarEmoji}>{c.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.comentHeader}>
                    <Text style={styles.comentNome}>{c.autor}</Text>
                    <Text style={styles.comentTempo}>{timeAgo(c.timestamp)}</Text>
                  </View>
                  <Text style={styles.comentTexto}>{c.texto}</Text>
                </View>
              </View>
            ))}

            <View style={{ height: 24 }} />
          </ScrollView>

          {/* Input */}
          <View style={[styles.inputBar, { paddingBottom: insets.bottom + 10 }]}>
            <View
              style={[styles.youAvatar, { backgroundColor: post.accent }]}
            >
              <Text style={styles.youAvatarEmoji}>{escolherEmoji(nickname)}</Text>
            </View>
            <TextInput
              value={texto}
              onChangeText={setTexto}
              placeholder="Escreva um comentário gentil..."
              placeholderTextColor={COLORS.inkMute}
              multiline
              style={styles.input}
              maxLength={500}
            />
            <TouchableOpacity
              onPress={handleEnviar}
              disabled={enviando || texto.trim().length < 2}
              activeOpacity={0.8}
              style={[
                styles.enviarBtn,
                {
                  backgroundColor:
                    texto.trim().length < 2 ? COLORS.inkMute : post.accent,
                },
              ]}
            >
              <Send size={18} color="#fff" strokeWidth={2.4} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  postResumo: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    ...shadowSoft(),
  },
  postResumoHero: {
    height: 130,
    backgroundColor: COLORS.greenDark,
    overflow: "hidden",
  },
  postResumoLabel: {
    position: "absolute",
    top: 10,
    left: 10,
    fontFamily: FONTS.bodyExtraBold,
    fontSize: 9,
    color: "#fff",
    letterSpacing: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  postResumoTitulo: {
    position: "absolute",
    bottom: 10,
    left: 12,
    right: 12,
    fontFamily: FONTS.displayBlack,
    fontSize: 15,
    color: "#fff",
    lineHeight: 19,
  },
  postResumoFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  autorAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  autorAvatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: 13,
  },
  autorAvatarEmoji: {
    fontSize: 14,
  },
  autorNome: {
    fontFamily: FONTS.bodyBold,
    fontSize: SIZES.sm,
    color: COLORS.inkSoft,
    flex: 1,
  },
  comentarioBox: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  comentarioDestaque: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    ...shadowSoft(),
  },
  comentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  comentAvatarEmoji: {
    fontSize: 16,
  },
  comentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
    flexWrap: "wrap",
  },
  comentNome: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.smPlus,
    color: COLORS.ink,
  },
  comentTempo: {
    fontFamily: FONTS.body,
    fontSize: SIZES.xs,
    color: COLORS.inkMute,
  },
  comentDestaqueBadge: {
    fontFamily: FONTS.bodyBold,
    fontSize: 9,
    color: COLORS.amberSoft,
    backgroundColor: COLORS.amber,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    letterSpacing: 0.4,
  },
  comentTexto: {
    fontFamily: FONTS.body,
    fontSize: SIZES.body,
    color: COLORS.ink,
    lineHeight: 20,
  },
  vazio: {
    paddingVertical: 40,
    alignItems: "center",
  },
  vazioEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  vazioTitulo: {
    fontFamily: FONTS.displayBlack,
    fontSize: SIZES.lg,
    color: COLORS.greenDark,
    marginBottom: 4,
  },
  vazioTexto: {
    fontFamily: FONTS.body,
    fontSize: SIZES.body,
    color: COLORS.inkSoft,
    textAlign: "center",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  youAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  youAvatarEmoji: {
    fontSize: 14,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: FONTS.body,
    fontSize: SIZES.body,
    color: COLORS.ink,
    maxHeight: 100,
  },
  enviarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
});
