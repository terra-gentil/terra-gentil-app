import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { X, Bell, Heart, MessageCircle, UserPlus } from "lucide-react-native";
import { COLORS, FONTS, SIZES, shadowSoft } from "../../constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function NotificacoesModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={10} style={styles.closeBtn}>
            <X size={22} color={COLORS.ink} strokeWidth={2.4} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notificações</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroEmpty}>
            <View style={styles.bellWrap}>
              <Bell size={42} color={COLORS.greenDark} strokeWidth={2.2} />
            </View>
            <Text style={styles.heroTitle}>Tudo calmo por aqui</Text>
            <Text style={styles.heroSub}>
              Quando alguém curtir seus posts, comentar ou começar a te seguir,
              vai aparecer aqui.
            </Text>
          </View>

          <Text style={styles.legendaSecao}>Como funciona</Text>

          <Tipo
            icon={<Heart size={18} color={COLORS.coral} strokeWidth={2.4} fill={COLORS.coral} />}
            cor={COLORS.coralSoft}
            titulo="Curtidas nos seus posts"
            descricao="A gente avisa quando alguém da comunidade curtir o que você publicou."
          />

          <Tipo
            icon={<MessageCircle size={18} color={COLORS.green} strokeWidth={2.4} />}
            cor={COLORS.greenSoft}
            titulo="Novos comentários"
            descricao="Cada comentário em um post seu vira uma notificação rapidinho."
          />

          <Tipo
            icon={<UserPlus size={18} color={COLORS.amber} strokeWidth={2.4} />}
            cor={COLORS.amberSoft}
            titulo="Novos seguidores"
            descricao="Saiba quando alguém começa a acompanhar suas postagens."
          />

          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

function Tipo({
  icon,
  cor,
  titulo,
  descricao,
}: {
  icon: React.ReactNode;
  cor: string;
  titulo: string;
  descricao: string;
}) {
  return (
    <View style={styles.tipo}>
      <View style={[styles.tipoIcon, { backgroundColor: cor }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.tipoTitulo}>{titulo}</Text>
        <Text style={styles.tipoDescricao}>{descricao}</Text>
      </View>
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
    paddingTop: 16,
  },
  heroEmpty: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingHorizontal: 24,
    marginBottom: 24,
    ...shadowSoft(),
  },
  bellWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.greenSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroTitle: {
    fontFamily: FONTS.displayBlack,
    fontSize: SIZES.xl,
    color: COLORS.greenDark,
    marginBottom: 6,
  },
  heroSub: {
    fontFamily: FONTS.body,
    fontSize: SIZES.body,
    color: COLORS.inkSoft,
    textAlign: "center",
    lineHeight: 20,
  },
  legendaSecao: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.sm,
    color: COLORS.greenDark,
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  tipo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  tipoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  tipoTitulo: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.body,
    color: COLORS.ink,
  },
  tipoDescricao: {
    fontFamily: FONTS.body,
    fontSize: SIZES.sm,
    color: COLORS.inkSoft,
    marginTop: 2,
    lineHeight: 18,
  },
});
