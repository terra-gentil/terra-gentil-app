import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, LogOut, LogIn, Bell, BellOff, Trash2, Info, Play, Globe, Shield, Send, ChartBar, Settings } from "lucide-react-native";
import { COLORS, FONTS, SIZES, shadowSoft } from "../../constants/theme";
import { getUser, clearAuth, AuthUser } from "../../storage/auth";
import { enviarBroadcast, buscarStats } from "../../api/notificacoes";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PUSH_ENABLED_KEY = "@terragentil:push_enabled";

interface Props {
  visible: boolean;
  onClose: () => void;
  onLogout?: () => void;
  onLogin?: () => void;
}

export default function ConfiguracoesModal({ visible, onClose, onLogout, onLogin }: Props) {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [adminAberto, setAdminAberto] = useState(false);
  const [broadTitulo, setBroadTitulo] = useState("");
  const [broadCorpo, setBroadCorpo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [stats, setStats] = useState<{ usuarios: number; posts: number; respostas: number; usuarios_com_push: number } | null>(null);
  const [carregandoStats, setCarregandoStats] = useState(false);

  useEffect(() => {
    if (!visible) return;
    getUser().then(setUser);
    AsyncStorage.getItem(PUSH_ENABLED_KEY).then(v => setPushEnabled(v !== "false"));
  }, [visible]);

  async function togglePush(value: boolean) {
    setPushEnabled(value);
    await AsyncStorage.setItem(PUSH_ENABLED_KEY, value ? "true" : "false");
  }

  async function handleLogout() {
    Alert.alert("Sair da conta", "Quer mesmo sair?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await clearAuth();
          setUser(null);
          onClose();
          onLogout?.();
        },
      },
    ]);
  }

  async function handleEnviarBroadcast() {
    if (!broadTitulo.trim() || !broadCorpo.trim()) {
      Alert.alert("Preencha título e mensagem");
      return;
    }
    setEnviando(true);
    try {
      const r = await enviarBroadcast(broadTitulo.trim(), broadCorpo.trim());
      Alert.alert("Enviado!", `Notificação chegou em ${r.enviados} dispositivo(s).`);
      setBroadTitulo("");
      setBroadCorpo("");
    } catch (e: unknown) {
      Alert.alert("Erro", String(e));
    } finally {
      setEnviando(false);
    }
  }

  async function handleCarregarStats() {
    setCarregandoStats(true);
    try {
      const s = await buscarStats();
      setStats(s);
    } catch (e: unknown) {
      Alert.alert("Erro", String(e));
    } finally {
      setCarregandoStats(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={10} style={styles.closeBtn}>
            <X size={22} color={COLORS.ink} strokeWidth={2.4} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Configurações</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>

          {/* CONTA */}
          <Secao titulo="Conta">
            {user ? (
              <>
                <View style={styles.perfilRow}>
                  <View style={styles.perfilAvatar}>
                    <Text style={styles.perfilLetra}>
                      {user.display_name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.perfilNome}>{user.display_name}</Text>
                    <Text style={styles.perfilSub}>Conta ativa</Text>
                  </View>
                </View>
                <Item icon={<LogOut size={18} color={COLORS.coral} />} texto="Sair da conta" cor={COLORS.coral} onPress={handleLogout} />
              </>
            ) : (
              <Item icon={<LogIn size={18} color={COLORS.green} />} texto="Entrar na conta" cor={COLORS.green} onPress={() => { onClose(); onLogin?.(); }} />
            )}
          </Secao>

          {/* NOTIFICACOES */}
          <Secao titulo="Notificações">
            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                {pushEnabled
                  ? <Bell size={18} color={COLORS.green} />
                  : <BellOff size={18} color={COLORS.inkMute} />}
                <Text style={styles.toggleTexto}>Notificações push</Text>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={togglePush}
                trackColor={{ false: COLORS.divider, true: COLORS.green }}
                thumbColor="#fff"
              />
            </View>
          </Secao>

          {/* APP */}
          <Secao titulo="App">
            <Item
              icon={<Trash2 size={18} color={COLORS.inkSoft} />}
              texto="Limpar histórico de diagnósticos"
              onPress={() => Alert.alert("Histórico", "Função em breve.")}
            />
            <Item
              icon={<Info size={18} color={COLORS.inkSoft} />}
              texto="Ver tutorial"
              onPress={() => Alert.alert("Tutorial", "Função em breve.")}
            />
          </Secao>

          {/* SOBRE */}
          <Secao titulo="Sobre">
            <View style={styles.versaoRow}>
              <Text style={styles.versaoLabel}>Versão</Text>
              <Text style={styles.versaoValor}>1.0.0</Text>
            </View>
            <Item
              icon={<Play size={18} color={COLORS.coral} />}
              texto="Canal no YouTube"
              onPress={() => Alert.alert("YouTube", "youtube.com/@terragentil")}
            />
            <Item
              icon={<Globe size={18} color={COLORS.green} />}
              texto="Site terragentil.com.br"
              onPress={() => Alert.alert("Site", "terragentil.com.br")}
            />
            <Item
              icon={<Shield size={18} color={COLORS.inkSoft} />}
              texto="Política de privacidade"
              onPress={() => Alert.alert("Privacidade", "Função em breve.")}
            />
          </Secao>

          {/* ADMIN */}
          {user?.is_admin && (
            <Secao titulo="Admin" icone={<Settings size={16} color={COLORS.amber} />}>
              <TouchableOpacity style={styles.adminToggle} onPress={() => setAdminAberto(v => !v)}>
                <Text style={styles.adminToggleText}>{adminAberto ? "Fechar painel" : "Abrir painel admin"}</Text>
              </TouchableOpacity>

              {adminAberto && (
                <>
                  {/* Broadcast */}
                  <Text style={styles.adminSubtitulo}>Enviar notificação push</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Título (max 60)"
                    placeholderTextColor={COLORS.inkMute}
                    value={broadTitulo}
                    onChangeText={t => setBroadTitulo(t.slice(0, 60))}
                    maxLength={60}
                  />
                  <TextInput
                    style={[styles.input, styles.inputMulti]}
                    placeholder="Mensagem (max 200)"
                    placeholderTextColor={COLORS.inkMute}
                    value={broadCorpo}
                    onChangeText={t => setBroadCorpo(t.slice(0, 200))}
                    multiline
                    maxLength={200}
                  />
                  <TouchableOpacity
                    style={[styles.btnAdmin, enviando && styles.btnAdminDisabled]}
                    onPress={handleEnviarBroadcast}
                    disabled={enviando}
                  >
                    {enviando
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <><Send size={16} color="#fff" /><Text style={styles.btnAdminText}>Enviar para todos</Text></>}
                  </TouchableOpacity>

                  {/* Stats */}
                  <Text style={[styles.adminSubtitulo, { marginTop: 20 }]}>Estatísticas do app</Text>
                  <TouchableOpacity style={styles.btnStatsLoad} onPress={handleCarregarStats} disabled={carregandoStats}>
                    {carregandoStats
                      ? <ActivityIndicator color={COLORS.green} size="small" />
                      : <><ChartBar size={16} color={COLORS.green} /><Text style={styles.btnStatsText}>Carregar stats</Text></>}
                  </TouchableOpacity>
                  {stats && (
                    <View style={styles.statsGrid}>
                      <StatCard label="Usuários" valor={stats.usuarios} />
                      <StatCard label="Posts" valor={stats.posts} />
                      <StatCard label="Respostas" valor={stats.respostas} />
                      <StatCard label="Com push" valor={stats.usuarios_com_push} />
                    </View>
                  )}
                </>
              )}
            </Secao>
          )}

        </ScrollView>
      </View>
    </Modal>
  );
}

function Secao({ titulo, icone, children }: { titulo: string; icone?: React.ReactNode; children: React.ReactNode }) {
  return (
    <View style={styles.secao}>
      <View style={styles.secaoTituloRow}>
        <Text style={styles.secaoTitulo}>{titulo}</Text>
        {icone}
      </View>
      <View style={styles.secaoCard}>{children}</View>
    </View>
  );
}

function Item({ icon, texto, cor, onPress }: { icon: React.ReactNode; texto: string; cor?: string; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.itemIcon}>{icon}</View>
      <Text style={[styles.itemTexto, cor ? { color: cor } : null]}>{texto}</Text>
    </TouchableOpacity>
  );
}

function StatCard({ label, valor }: { label: string; valor: number }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValor}>{valor.toLocaleString("pt-BR")}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
  content: { paddingHorizontal: 16, paddingTop: 16 },
  secao: { marginBottom: 20 },
  secaoTituloRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  secaoTitulo: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.sm,
    color: COLORS.inkSoft,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  secaoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    ...shadowSoft(),
  },
  perfilRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  perfilAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.greenSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  perfilLetra: { fontFamily: FONTS.bodyExtraBold, fontSize: 18, color: COLORS.greenDark },
  perfilNome: { fontFamily: FONTS.bodyExtraBold, fontSize: SIZES.body, color: COLORS.ink },
  perfilSub: { fontFamily: FONTS.body, fontSize: SIZES.sm, color: COLORS.inkSoft },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  itemIcon: { width: 24, alignItems: "center" },
  itemTexto: { fontFamily: FONTS.bodySemiBold, fontSize: SIZES.body, color: COLORS.ink },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  toggleLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  toggleTexto: { fontFamily: FONTS.bodySemiBold, fontSize: SIZES.body, color: COLORS.ink },
  versaoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  versaoLabel: { fontFamily: FONTS.bodySemiBold, fontSize: SIZES.body, color: COLORS.ink },
  versaoValor: { fontFamily: FONTS.body, fontSize: SIZES.body, color: COLORS.inkSoft },
  adminToggle: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  adminToggleText: { fontFamily: FONTS.bodyExtraBold, fontSize: SIZES.body, color: COLORS.amber },
  adminSubtitulo: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.sm,
    color: COLORS.inkSoft,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
  },
  input: {
    marginHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: FONTS.body,
    fontSize: SIZES.body,
    color: COLORS.ink,
    backgroundColor: COLORS.bg,
  },
  inputMulti: { minHeight: 72, textAlignVertical: "top" },
  btnAdmin: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 14,
    marginTop: 4,
    marginBottom: 8,
    backgroundColor: COLORS.amber,
    borderRadius: 12,
    paddingVertical: 12,
  },
  btnAdminDisabled: { opacity: 0.6 },
  btnAdminText: { fontFamily: FONTS.bodyExtraBold, fontSize: SIZES.body, color: "#fff" },
  btnStatsLoad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 14,
    marginBottom: 12,
  },
  btnStatsText: { fontFamily: FONTS.bodySemiBold, fontSize: SIZES.body, color: COLORS.green },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: COLORS.greenSoft,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  statValor: { fontFamily: FONTS.displayBlack, fontSize: SIZES.xl, color: COLORS.greenDark },
  statLabel: { fontFamily: FONTS.body, fontSize: SIZES.sm, color: COLORS.inkSoft, marginTop: 2 },
});
