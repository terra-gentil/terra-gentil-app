import React, { useState, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { X, Bell, Megaphone, Info } from "lucide-react-native";
import { COLORS, FONTS, SIZES, shadowSoft } from "../../constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { listarNotificacoes, marcarLida, Notificacao } from "../../api/notificacoes";
import { useNotif } from "../../context/NotifContext";

interface Props {
  visible: boolean;
  onClose: () => void;
}

function tempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min}min atrás`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h atrás`;
  const d = Math.floor(h / 24);
  return `${d}d atrás`;
}

function iconePorTipo(tipo: string) {
  if (tipo === "broadcast") return <Megaphone size={18} color={COLORS.amber} strokeWidth={2.2} />;
  return <Info size={18} color={COLORS.green} strokeWidth={2.2} />;
}

function corFundoPorTipo(tipo: string): string {
  if (tipo === "broadcast") return COLORS.amberSoft;
  return COLORS.greenSoft;
}

export default function NotificacoesModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { recarregarBadge } = useNotif();
  const [lista, setLista] = useState<Notificacao[]>([]);
  const [carregando, setCarregando] = useState(false);

  const carregar = useCallback(async () => {
    if (!visible) return;
    setCarregando(true);
    try {
      const data = await listarNotificacoes(50, 0);
      setLista(data);
    } catch {
      // silencioso
    } finally {
      setCarregando(false);
    }
  }, [visible]);

  useFocusEffect(useCallback(() => {
    carregar();
  }, [carregar]));

  React.useEffect(() => {
    if (visible) carregar();
  }, [visible]);

  async function handleTap(item: Notificacao) {
    if (item.read_at !== null) return;
    await marcarLida(item.id);
    setLista(prev => prev.map(n => n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n));
    await recarregarBadge();
  }

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

        {carregando && lista.length === 0 ? (
          <View style={styles.centralize}>
            <ActivityIndicator color={COLORS.green} size="large" />
          </View>
        ) : lista.length === 0 ? (
          <View style={styles.centralize}>
            <View style={styles.bellWrap}>
              <Bell size={42} color={COLORS.greenDark} strokeWidth={2.2} />
            </View>
            <Text style={styles.heroTitle}>Tudo calmo por aqui</Text>
            <Text style={styles.heroSub}>
              Quando houver novidades para você, vão aparecer aqui.
            </Text>
          </View>
        ) : (
          <FlatList
            data={lista}
            keyExtractor={i => i.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: insets.bottom + 24 }}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleTap(item)}
                style={[
                  styles.card,
                  item.read_at === null && styles.cardNaoLida,
                ]}
              >
                <View style={[styles.iconeWrap, { backgroundColor: corFundoPorTipo(item.type) }]}>
                  {iconePorTipo(item.type)}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitulo}>{item.title}</Text>
                  <Text style={styles.cardBody} numberOfLines={3}>{item.body}</Text>
                  <Text style={styles.cardTempo}>{tempoRelativo(item.created_at)}</Text>
                </View>
                {item.read_at === null && <View style={styles.pontinho} />}
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  closeBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: FONTS.displayBlack, fontSize: SIZES.lg, color: COLORS.greenDark },
  centralize: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
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
    textAlign: "center",
  },
  heroSub: {
    fontFamily: FONTS.body,
    fontSize: SIZES.body,
    color: COLORS.inkSoft,
    textAlign: "center",
    lineHeight: 20,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    ...shadowSoft(),
  },
  cardNaoLida: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.green,
  },
  iconeWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  cardTitulo: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.body,
    color: COLORS.ink,
    marginBottom: 2,
  },
  cardBody: {
    fontFamily: FONTS.body,
    fontSize: SIZES.sm,
    color: COLORS.inkSoft,
    lineHeight: 18,
  },
  cardTempo: {
    fontFamily: FONTS.body,
    fontSize: SIZES.xs,
    color: COLORS.inkMute,
    marginTop: 6,
  },
  pontinho: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.green,
    marginTop: 6,
  },
});
