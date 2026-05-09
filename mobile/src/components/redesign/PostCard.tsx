import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageSourcePropType,
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
import { COLORS, FONTS, SIZES, RADIUS } from "../../constants/theme";

export interface PostData {
  id: string | number;
  cat: string;
  author: string;
  avatarColor: string;
  avatarEmoji?: string;
  avatarSource?: ImageSourcePropType;
  pinned?: boolean;
  title: string;
  gradient: [string, string, string];
  likes: string;
  comments: string;
  accent: string;
  accentDeep: string;
  comment: {
    avatar: string;
    name: string;
    text: string;
  };
}

interface PostCardProps {
  post: PostData;
  onMore?: () => void;
  onSeguir?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onVerComentarios?: () => void;
  onContinuarLendo?: () => void;
}

export default function PostCard({
  post,
  onMore,
  onSeguir,
  onComment,
  onShare,
  onVerComentarios,
  onContinuarLendo,
}: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

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
          </View>
          <Text style={styles.authorMeta} numberOfLines={1}>
            por {post.author} {"  "}
            <Text
              style={[styles.authorFollow, { color: post.accent }]}
              onPress={onSeguir}
            >
              Seguir
            </Text>
          </Text>
        </View>
        <TouchableOpacity onPress={onMore} style={styles.moreBtn} hitSlop={8}>
          <MoreHorizontal size={20} color={COLORS.inkMute} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      {/* Hero gradient com circulos decorativos e overlay */}
      <View style={styles.heroWrap}>
        <LinearGradient
          colors={post.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Circulos decorativos */}
        <View style={styles.circleA} />
        <View style={styles.circleB} />
        {/* Escurecimento bottom pra legibilidade do titulo */}
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.55)"]}
          start={{ x: 0, y: 0.3 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <Text style={styles.heroTitle} numberOfLines={3}>
          {post.title}
        </Text>
      </View>

      {/* Action row */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.actionItem}
          onPress={() => setLiked((v) => !v)}
          activeOpacity={0.7}
        >
          <Heart
            size={22}
            color={liked ? post.accent : COLORS.inkSoft}
            fill={liked ? post.accent : "transparent"}
            strokeWidth={2.2}
          />
          <Text style={styles.actionCount}>{post.likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem} onPress={onComment} activeOpacity={0.7}>
          <MessageCircle size={22} color={COLORS.inkSoft} strokeWidth={2.2} />
          <Text style={styles.actionCount}>{post.comments}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onShare} activeOpacity={0.7} hitSlop={8}>
          <Share2 size={22} color={COLORS.inkSoft} strokeWidth={2.2} />
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          onPress={() => setSaved((v) => !v)}
          activeOpacity={0.7}
          hitSlop={8}
        >
          <Bookmark
            size={22}
            color={saved ? post.accent : COLORS.inkSoft}
            fill={saved ? post.accent : "transparent"}
            strokeWidth={2.2}
          />
        </TouchableOpacity>
      </View>

      {/* Top comment preview */}
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
            Ver todos os {post.comments} comentarios
          </Text>
        </TouchableOpacity>
      </View>
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
    // anel externo simulado
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
  authorMeta: {
    fontFamily: FONTS.body,
    fontSize: SIZES.xs,
    color: COLORS.inkMute,
    marginTop: 1,
  },
  authorFollow: {
    fontFamily: FONTS.bodyBold,
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
