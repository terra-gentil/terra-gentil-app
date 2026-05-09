import React, { useState } from "react";
import { ScrollView, StyleSheet, View, Alert } from "react-native";
import { Plus } from "lucide-react-native";
import { COLORS } from "../../constants/theme";
import { MASCOT_POSES } from "../../assets/mascot";
import TopBar from "./TopBar";
import Pills from "./Pills";
import FloatCTA from "./FloatCTA";
import PostCard, { PostData } from "./PostCard";

const FILTROS = ["Populares", "Meus posts", "Seguindo", "Pragas", "Suculentas"];

const POSTS: PostData[] = [
  {
    id: 1,
    cat: "Pragas e doencas",
    author: "Mariana V.",
    avatarColor: "#fb6f92",
    avatarEmoji: "🦋",
    title: "Cochonilha apareceu na minha violeta. O que voces fazem que funciona?",
    gradient: ["#fbcfe8", "#fb6f92", "#be185d"],
    likes: "4,2K",
    comments: "892",
    accent: COLORS.coral,
    accentDeep: "#be185d",
    comment: {
      avatar: "🌻",
      name: "Joana",
      text: "Eu uso alcool 70 com cotonete em cada bichinho, leva 2 semanas mas resolve. Importante revisar embaixo das folhas...",
    },
  },
  {
    id: 2,
    cat: "Plantas pet-friendly",
    author: "Doutor Gentileza",
    avatarColor: COLORS.green,
    avatarSource: MASCOT_POSES[0],
    pinned: true,
    title: "7 plantas seguras pra quem tem gato em casa (com foto e dica de cuidado)",
    gradient: ["#86efac", "#22c55e", "#15803d"],
    likes: "12,3K",
    comments: "2,1K",
    accent: COLORS.green,
    accentDeep: COLORS.greenDeep,
    comment: {
      avatar: "😺",
      name: "Ricardo",
      text: "Salvei o post! Minha gata destruia minha jiboia, agora vou trocar por essas opcoes...",
    },
  },
  {
    id: 3,
    cat: "Meu jardim",
    author: "Lucas R.",
    avatarColor: COLORS.amber,
    avatarEmoji: "🌵",
    title: "Antes e depois da minha suculenta apos 3 meses cuidando do jeito do Doutor",
    gradient: ["#fde68a", "#f59e0b", "#b45309"],
    likes: "7,8K",
    comments: "1,5K",
    accent: COLORS.amber,
    accentDeep: "#b45309",
    comment: {
      avatar: "🌵",
      name: "Camila",
      text: "Que progresso lindo! A folha embaixo brotou tudo de novo. Quanto tempo de luz por dia ela pega?",
    },
  },
];

function emBreve(o_que: string) {
  Alert.alert("Em breve", `${o_que} chegara nas proximas atualizacoes. Obrigado pela paciencia!`);
}

export default function CommunityScreen() {
  const [filtro, setFiltro] = useState(FILTROS[0]);

  return (
    <View style={styles.screen}>
      <TopBar
        avatarSource={MASCOT_POSES[0]}
        badge={3}
        onBellPress={() => emBreve("Notificacoes da comunidade")}
        onSearchPress={() => emBreve("Busca na comunidade")}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Pills items={FILTROS} active={filtro} onChange={setFiltro} />

        {POSTS.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            onMore={() => emBreve("Acoes do post")}
            onSeguir={() => emBreve("Seguir autor")}
            onComment={() => emBreve("Comentarios")}
            onShare={() => emBreve("Compartilhar")}
            onVerComentarios={() => emBreve("Comentarios completos")}
            onContinuarLendo={() => emBreve("Leitura completa")}
          />
        ))}

        <View style={{ height: 140 }} />
      </ScrollView>

      <FloatCTA
        label="Nova postagem"
        icon={<Plus size={18} color="#fff" strokeWidth={2.6} />}
        onPress={() => emBreve("Criar nova postagem")}
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
});
