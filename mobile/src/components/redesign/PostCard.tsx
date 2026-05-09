import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Pin,
} from "lucide-react-native";
import { COLORS, FONTS, SIZES } from "../../constants/theme";
import { PostBase } from "../../data/comunidade";
import {
  alternarLike,
  alternarSave,
  alternarSeguir,
  contarComentarios,
  formatarK,
} from "../../storage/comunidade";

export type PostData = PostBase;

interface PostCardProps {
  post: PostBase;
  liked: boolean;
  saved: boolean;
  seguindo: boolean;
  onLikedChange?: (next: boolean) => void;
  onSavedChange?: (next: boolean) => void;
  onSeguindoChange?: (autor: string, next: boolean) => void;
  onMore?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onVerComentarios?: () => void;
  onContinuarLendo?: () => void;
}

export default function PostCard({
  post,
  liked,
  saved,
  seguindo,
  onLikedChange,
  onSavedChange,
  onSeguindoChange,
  onMore,
  onComment,
  onShare,
  onVerComentarios,
  onContinuarLendo,
}: PostCardProps) {
  const [comentariosLocais, setComentariosLocais] = useState(0);

  useEffect(() => {
    let alive = true;
    contarComentarios(post.id).then((n) => {
      if (alive) setComentariosLocais(n);
    });
    return () => {
      alive = false;
    };
  }, [post.id]);

  const likesAtual = post.likesBase + (liked ? 1 : 0);
  const comentariosAtual = post.comentariosBase + comentariosLocais;

  async function handleLike() {
    const novo = await alternarLike(post.id);
    onLikedChange?.(novo);
  }

  async function handleSave() {
    const novo = await alternarSave(post.id);
    onSavedChange?.(novo);
  }

  async function handleSeguir() {
    const novo = await alternarSeguir(post.author);
    onSeguindoChange?.(post.author, novo);
  }

  const ehDoutor = post.author === "Doutor Gentileza";

  return (
    <View style={styles.article}>
      {/* Author row */}
      <View style={styles.authorRow}>
        <View
          style={[
            styles.authorAvatar,
            { backgroundColor: post.avatarColor, shadowColor: post.avatarColor },
          ]}
        >
          {post.avatarSource ? (
            <Image source={post.avatarSource} style={styles.authorAvatarImg} />
          ) : (
            <Text style={styles.authorAvatarEmoji}>{post.avatarEmoji}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.authorTopRow}>
            <Text style={styles.authorCat} numberOfLines={1}>
              {post.cat}
            </Text>
            {post.pinned && (
              <View style={styles.pinnedBadge}>
                <Pin size={10} color={COLORS.greenDark} fill={COLORS.greenDark} />
                <Text style={styles.pinnedBadgeText}>OFICIAL</Text>
              </View>
            )}
            {post.isMine && (
              <View style={styles.myBadge}>
                <Text style={styles.myBadgeText}>MEU</Text>
              </View>
            )}
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.authorMeta} numberOfLines={1}>
              por {post.author}
            </Text>
            {!post.isMine && !ehDoutor && (
              <Text
                style={[
                  styles.authorFollow,
                  { color: seguindo ? COLORS.inkMute : post.accent },
                ]}
                onPress={handleSeguir}
              >
                {seguindo ? "Seguindo" : "Seguir"}
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity onPress={onMore} style={styles.moreBtn} hitSlop={8}>
          <MoreHorizontal size={20} color={COLORS.inkMute} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      {/* Hero: foto real ou gradient com circulos decorativos, sempre com overlay */}
      <TouchableOpacity
        style={styles.heroWrap}
        activeOpacity={0.92}
        onPress={onVerComentarios}
        accessibilityLabel={`Abrir post: ${post.title}`}
      >
        {post.imageUri ? (
          <Image
            source={{ uri: post.imageUri }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
        ) : (
          <>
            <LinearGradient
              colors={post.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.circleA} />
            <View style={styles.circleB} />
          </>
        )}
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.55)"]}
          start={{ x: 0, y: 0.3 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <Text style={styles.heroTitle} numberOfLines={3}>
          {post.title}
        </Text>
      </TouchableOpacity>

      {/* Action row */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionItem} onPress={handleLike} activeOpacity={0.7}>
          <Heart
            size={22}
            color={liked ? post.accent : COLORS.inkSoft}
            fill={liked ? post.accent : "transparent"}
            strokeWidth={2.2}
          />
          <Text style={styles.actionCount}>{formatarK(likesAtual)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem} onPress={onComment} activeOpacity={0.7}>
          <MessageCircle size={22} color={COLORS.inkSoft} strokeWidth={2.2} />
          <Text style={styles.actionCount}>{formatarK(comentariosAtual)}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onShare} activeOpacity={0.7} hitSlop={8}>
          <Share2 size={22} color={COLORS.inkSoft} strokeWidth={2.2} />
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        <TouchableOpacity onPress={handleSave} activeOpacity={0.7} hitSlop={8}>
          <Bookmark
            size={22}
            color={saved ? post.accent : COLORS.inkSoft}
            fill={saved ? post.accent : "transparent"}
            strokeWidth={2.2}
          />
        </TouchableOpacity>
      </View>

      {/* Top comment preview */}
      {post.comment && (
        <View style={styles.commentWrap}>
          <View style={styles.commentBox}>
            <View style={[styles.commentAvatar, { backgroundColor: post.accent }]}>
              <Text style={styles.commentAvatarEmoji}>{post.comment.avatar}</Text>
            </View>
            <Text style={styles.commentText}>
              <Text style={styles.commentName}>{post.comment.name}: </Text>
              {post.comment.text}{" "}
              <Text
                style={[styles.commentMore, { color: post.accent }]}
                onPress={onContinuarLendo}
              >
                Continuar lendo
              </Text>
            </Text>
          </View>
          <TouchableOpacity onPress={onVerComentarios} activeOpacity={0.6}>
            <Text style={[styles.verComentarios, { color: post.accent }]}>
              Ver todos os {formatarK(comentariosAtual)} comentários
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {post.isMine && !post.comment && (
        <View style={styles.commentWrap}>
          <TouchableOpacity onPress={onVerComentarios} activeOpacity={0.6}>
            <Text style={[styles.verComentarios, { color: post.accent }]}>
              {comentariosLocais > 0
                ? `Ver os ${comentariosLocais} comentário${comentariosLocais > 1 ? "s" : ""}`
                : "Seja o primeiro a comentar"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  article: {
    marginBottom: 14,
    backgroundColor: COLORS.bg,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  authorAvatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: 18,
  },
  authorAvatarEmoji: {
    fontSize: 18,
  },
  authorTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  authorCat: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.smPlus,
    color: COLORS.ink,
    flexShrink: 1,
  },
  pinnedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: COLORS.greenSoft,
  },
  pinnedBadgeText: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: 9,
    color: COLORS.greenDark,
    letterSpacing: 0.4,
  },
  myBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: COLORS.amberSoft,
  },
  myBadgeText: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: 9,
    color: "#b45309",
    letterSpacing: 0.4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 1,
  },
  authorMeta: {
    fontFamily: FONTS.body,
    fontSize: SIZES.xs,
    color: COLORS.inkMute,
    flexShrink: 1,
  },
  authorFollow: {
    fontFamily: FONTS.bodyBold,
    fontSize: SIZES.xs,
  },
  moreBtn: {
    padding: 4,
  },

  // Hero
  heroWrap: {
    position: "relative",
    height: 240,
    overflow: "hidden",
    backgroundColor: COLORS.greenDark,
  },
  circleA: {
    position: "absolute",
    top: 30,
    left: 50,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  circleB: {
    position: "absolute",
    top: 130,
    right: 30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  heroTitle: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    fontFamily: FONTS.displayBlack,
    fontSize: 19,
    color: "#fff",
    lineHeight: 24,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },

  // Actions
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionCount: {
    fontFamily: FONTS.bodyBold,
    fontSize: SIZES.smPlus,
    color: COLORS.ink,
  },

  // Comment preview
  commentWrap: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  commentBox: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
    backgroundColor: "#f1ece1",
    borderRadius: 14,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  commentAvatarEmoji: {
    fontSize: 14,
  },
  commentText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: SIZES.smPlus,
    color: COLORS.ink,
    lineHeight: 19,
  },
  commentName: {
    fontFamily: FONTS.bodyExtraBold,
  },
  commentMore: {
    fontFamily: FONTS.bodyBold,
  },
  verComentarios: {
    fontFamily: FONTS.bodyBold,
    fontSize: SIZES.sm,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
});
