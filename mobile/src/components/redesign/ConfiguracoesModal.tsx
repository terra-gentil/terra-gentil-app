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
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, LogOut, LogIn, Bell, BellOff, Trash2, Info, Play, Globe, Shield, Send, ChartBar, Settings, RotateCcw, Flag, Users, Eye } from "lucide-react-native";
import { COLORS, FONTS, SIZES, shadowSoft } from "../../constants/theme";
import { getUser, clearAuth, AuthUser } from "../../storage/auth";
import { enviarBroadcast, buscarStats } from "../../api/notificacoes";
import { buscarReports, resolverReport, buscarUsuarios, bloquearUsuario, desbloquearUsuario, Report, UsuarioAdmin } from "../../api/admin";
import { limparHistorico } from "../../storage/historico";
import { resetarWelcome, resetarTutorial } from "../../storage/preferencias";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PUSH_ENABLED_KEY = "@terragentil:push_enabled";

interface Props {
  visible: boolean;
  onClose: () => void;
  onLogout?: () => void;
  onLogin?: () => void;
  onVerTutorial?: () => void;
}

export default function ConfiguracoesModal({ visible, onClose, onLogout, onLogin, onVerTutorial }: Props) {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [adminAberto, setAdminAberto] = useState(true);
  const [broadTitulo, setBroadTitulo] = useState("");
  const [broadCorpo, setBroadCorpo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [stats, setStats] = useState<{ usuarios: number; posts: number; respostas: number; usuarios_com_push: number } | null>(null);
  const [carregandoStats, setCarregandoStats] = useState(false);
  const [broadPlataforma, setBroadPlataforma] = useState<"todos" | "ios" | "android">("todos");
  const [reports, setReports] = useState<Report[]>([]);
  const [totalReports, setTotalReports] = useState(0);
  const [carregandoReports, setCarregandoReports] = useState(false);
  const [buscaUsuario, setBuscaUsuario] = useState("");
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [buscandoUsuario, setBuscandoUsuario] = useState(false);

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
    const label = broadPlataforma === "todos" ? "todos os dispositivos" : `dispositivos ${broadPlataforma.toUpperCase()}`;
    Alert.alert(
      "Confirmar envio",
      `Enviar para ${label}?\n\n"${broadTitulo.trim()}" — ${broadCorpo.trim()}`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Enviar",
          onPress: async () => {
            setEnviando(true);
            try {
              const r = await enviarBroadcast(broadTitulo.trim(), broadCorpo.trim(), broadPlataforma);
              Alert.alert("Enviado!", `Notificação chegou em ${r.enviados} dispositivo(s).`);
              setBroadTitulo("");
              setBroadCorpo("");
            } catch (e: unknown) {
              Alert.alert("Erro", String(e));
            } finally {
              setEnviando(false);
            }
          },
        },
      ],
    );
  }

  async function handleCarregarReports() {
    setCarregandoReports(true);
    try {
      const r = await buscarReports(20, 0);
      setReports(r.reports);
      setTotalReports(r.total);
    } catch (e: unknown) {
      Alert.alert("Erro", String(e));
    } finally {
      setCarregandoReports(false);
    }
  }

  async function handleResolverReport(report: Report, deletar: boolean) {
    const acao = deletar ? "Remover conteúdo e resolver" : "Ignorar report";
    Alert.alert(acao, `"${report.conteudo_preview.slice(0, 80)}..."`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: deletar ? "Remover" : "Ignorar",
        style: deletar ? "destructive" : "default",
        onPress: async () => {
          try {
            await resolverReport(report.id, deletar);
            setReports(prev => prev.filter(r => r.id !== report.id));
            setTotalReports(prev => prev - 1);
          } catch (e: unknown) {
            Alert.alert("Erro", String(e));
          }
        },
      },
    ]);
  }

  async function handleBuscarUsuario() {
    if (buscaUsuario.trim().length < 2) return;
    setBuscandoUsuario(true);
    try {
      const lista = await buscarUsuarios(buscaUsuario.trim());
      setUsuarios(lista);
    } catch (e: unknown) {
      Alert.alert("Erro", String(e));
    } finally {
      setBuscandoUsuario(false);
    }
  }

  async function handleToggleBloqueio(u: UsuarioAdmin) {
    const acao = u.bloqueado ? "Desbloquear" : "Bloquear";
    Alert.alert(`${acao} ${u.display_name}?`, undefined, [
      { text: "Cancelar", style: "cancel" },
      {
        text: acao,
        style: u.bloqueado ? "default" : "destructive",
        onPress: async () => {
          try {
            if (u.bloqueado) {
              await desbloquearUsuario(u.id);
            } else {
              await bloquearUsuario(u.id);
            }
            setUsuarios(prev =>
              prev.map(x => x.id === u.id ? { ...x, bloqueado: !x.bloqueado } : x)
            );
          } catch (e: unknown) {
            Alert.alert("Erro", String(e));
          }
        },
      },
    ]);
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

  function handleLimparHistorico() {
    Alert.alert(
      "Limpar histórico",
      "Vou apagar todas as consultas guardadas neste celular. Essa ação não tem volta. Tem certeza?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apagar tudo",
          style: "destructive",
          onPress: async () => {
            await limparHistorico();
            Alert.alert("Pronto!", "Histórico apagado.");
          },
        },
      ],
    );
  }

  function handleVerTutorial() {
    Alert.alert(
      "Ver tutorial",
      "O tutorial vai aparecer ao fechar as configurações.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Ver",
          onPress: async () => {
            await resetarTutorial();
            onClose();
            onVerTutorial?.();
          },
        },
      ],
    );
  }

  function handleVerBoasVindas() {
    Alert.alert(
      "Ver boas-vindas",
      "A tela de boas-vindas e o tutorial vão aparecer na próxima vez que você abrir o app.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sim",
          onPress: async () => {
            await resetarWelcome();
            await resetarTutorial();
            Alert.alert("Pronto!", "Feche o app e abra de novo.");
          },
        },
      ],
    );
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

          {/* ADMIN */}
          {user?.is_admin && (
            <Secao titulo="Admin" icone={<Settings size={16} color={COLORS.amber} />}>
              <Item
                icon={<RotateCcw size={18} color={COLORS.inkSoft} />}
                texto="Ver tela de boas-vindas"
                onPress={handleVerBoasVindas}
              />
              <TouchableOpacity style={styles.adminToggle} onPress={() => setAdminAberto(v => !v)}>
                <Text style={styles.adminToggleText}>{adminAberto ? "Fechar painel" : "Abrir painel admin"}</Text>
              </TouchableOpacity>

              {adminAberto && (
                <>
                  {/* Broadcast */}
                  <Text style={styles.adminSubtitulo}>📢 Notificação push</Text>
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
                  {/* Preview da notificacao */}
                  {(broadTitulo.trim() || broadCorpo.trim()) && (
                    <View style={styles.previewNotif}>
                      <View style={styles.previewIconWrap}>
                        <Text style={styles.previewIcon}>🌱</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.previewTitulo} numberOfLines={1}>{broadTitulo.trim() || "Título"}</Text>
                        <Text style={styles.previewCorpo} numberOfLines={2}>{broadCorpo.trim() || "Mensagem..."}</Text>
                      </View>
                    </View>
                  )}
                  {/* Plataforma */}
                  <View style={styles.plataformaRow}>
                    {(["todos", "ios", "android"] as const).map(p => (
                      <TouchableOpacity
                        key={p}
                        style={[styles.plataformaBtn, broadPlataforma === p && styles.plataformaBtnAtivo]}
                        onPress={() => setBroadPlataforma(p)}
                      >
                        <Text style={[styles.plataformaBtnText, broadPlataforma === p && styles.plataformaBtnTextAtivo]}>
                          {p === "todos" ? "Todos" : p.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity
                    style={[styles.btnAdmin, enviando && styles.btnAdminDisabled]}
                    onPress={handleEnviarBroadcast}
                    disabled={enviando}
                  >
                    {enviando
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <><Send size={16} color="#fff" /><Text style={styles.btnAdminText}>Enviar notificação</Text></>}
                  </TouchableOpacity>

                  {/* Reports */}
                  <Text style={[styles.adminSubtitulo, { marginTop: 20 }]}>
                    🚩 Reports pendentes{totalReports > 0 ? ` (${totalReports})` : ""}
                  </Text>
                  <TouchableOpacity style={styles.btnStatsLoad} onPress={handleCarregarReports} disabled={carregandoReports}>
                    {carregandoReports
                      ? <ActivityIndicator color={COLORS.coral} size="small" />
                      : <><Flag size={16} color={COLORS.coral} /><Text style={[styles.btnStatsText, { color: COLORS.coral }]}>Carregar reports</Text></>}
                  </TouchableOpacity>
                  {reports.map(r => (
                    <View key={r.id} style={styles.reportCard}>
                      <Text style={styles.reportTipo}>{r.target_type === "topic" ? "Tópico" : "Post"}</Text>
                      <Text style={styles.reportPreview} numberOfLines={3}>{r.conteudo_preview || "(sem conteúdo)"}</Text>
                      {r.reason ? <Text style={styles.reportMotivo}>Motivo: {r.reason}</Text> : null}
                      <View style={styles.reportAcoes}>
                        <TouchableOpacity style={styles.reportBtnIgnorar} onPress={() => handleResolverReport(r, false)}>
                          <Text style={styles.reportBtnIgnorarText}>Ignorar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.reportBtnRemover} onPress={() => handleResolverReport(r, true)}>
                          <Text style={styles.reportBtnRemoverText}>Remover</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                  {reports.length === 0 && !carregandoReports && totalReports === 0 && (
                    <Text style={styles.adminVazio}>Nenhum report pendente</Text>
                  )}

                  {/* Gestao de usuarios */}
                  <Text style={[styles.adminSubtitulo, { marginTop: 20 }]}>👤 Gestão de usuários</Text>
                  <View style={styles.buscaRow}>
                    <TextInput
                      style={[styles.input, { flex: 1, marginBottom: 0 }]}
                      placeholder="Buscar por nome..."
                      placeholderTextColor={COLORS.inkMute}
                      value={buscaUsuario}
                      onChangeText={setBuscaUsuario}
                      onSubmitEditing={handleBuscarUsuario}
                      returnKeyType="search"
                    />
                    <TouchableOpacity style={styles.btnBuscar} onPress={handleBuscarUsuario} disabled={buscandoUsuario}>
                      {buscandoUsuario
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <Users size={16} color="#fff" />}
                    </TouchableOpacity>
                  </View>
                  {usuarios.map(u => (
                    <View key={u.id} style={styles.usuarioCard}>
                      <View style={styles.usuarioAvatar}>
                        <Text style={styles.usuarioLetra}>{u.display_name.charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.usuarioNome}>{u.display_name}</Text>
                        <Text style={styles.usuarioSub}>{u.total_posts} posts{u.bloqueado ? " · BLOQUEADO" : ""}</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.btnBloqueio, u.bloqueado && styles.btnDesbloqueio]}
                        onPress={() => handleToggleBloqueio(u)}
                      >
                        <Text style={styles.btnBloqueioText}>{u.bloqueado ? "Desbloquear" : "Bloquear"}</Text>
                      </TouchableOpacity>
                    </View>
                  ))}

                  {/* Stats */}
                  <Text style={[styles.adminSubtitulo, { marginTop: 20 }]}>📊 Estatísticas do app</Text>
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
              onPress={handleLimparHistorico}
            />
            <Item
              icon={<Info size={18} color={COLORS.inkSoft} />}
              texto="Ver tutorial"
              onPress={handleVerTutorial}
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
              onPress={() => Linking.openURL("https://www.youtube.com/@TerraGentil")}
            />
            <Item
              icon={<Globe size={18} color={COLORS.green} />}
              texto="Site terragentil.com.br"
              onPress={() => Linking.openURL("https://terragentil.com.br")}
            />
            <Item
              icon={<Shield size={18} color={COLORS.inkSoft} />}
              texto="Política de privacidade"
              onPress={() => Linking.openURL("https://terragentil.com.br/privacidade")}
            />
          </Secao>

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

  // Preview notificacao
  previewNotif: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 14,
    marginBottom: 8,
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  previewIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.greenSoft,
    justifyContent: "center",
    alignItems: "center",
  },
  previewIcon: { fontSize: 20 },
  previewTitulo: { fontFamily: FONTS.bodyExtraBold, fontSize: SIZES.sm, color: COLORS.ink },
  previewCorpo: { fontFamily: FONTS.body, fontSize: SIZES.xs, color: COLORS.inkSoft, marginTop: 1 },

  // Plataforma picker
  plataformaRow: {
    flexDirection: "row",
    gap: 8,
    marginHorizontal: 14,
    marginBottom: 10,
  },
  plataformaBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.divider,
    alignItems: "center",
  },
  plataformaBtnAtivo: {
    borderColor: COLORS.amber,
    backgroundColor: COLORS.amber + "15",
  },
  plataformaBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: SIZES.sm,
    color: COLORS.inkSoft,
  },
  plataformaBtnTextAtivo: { color: COLORS.amber },

  // Reports
  reportCard: {
    marginHorizontal: 14,
    marginBottom: 10,
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  reportTipo: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.xs,
    color: COLORS.coral,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  reportPreview: {
    fontFamily: FONTS.body,
    fontSize: SIZES.sm,
    color: COLORS.ink,
    lineHeight: 18,
  },
  reportMotivo: {
    fontFamily: FONTS.body,
    fontSize: SIZES.xs,
    color: COLORS.inkSoft,
    marginTop: 4,
    fontStyle: "italic",
  },
  reportAcoes: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  reportBtnIgnorar: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.divider,
    alignItems: "center",
  },
  reportBtnIgnorarText: { fontFamily: FONTS.bodyBold, fontSize: SIZES.sm, color: COLORS.inkSoft },
  reportBtnRemover: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.coral,
    alignItems: "center",
  },
  reportBtnRemoverText: { fontFamily: FONTS.bodyBold, fontSize: SIZES.sm, color: "#fff" },
  adminVazio: {
    fontFamily: FONTS.body,
    fontSize: SIZES.sm,
    color: COLORS.inkMute,
    paddingHorizontal: 14,
    paddingBottom: 8,
    fontStyle: "italic",
  },

  // Gestao de usuarios
  buscaRow: {
    flexDirection: "row",
    gap: 8,
    marginHorizontal: 14,
    marginBottom: 10,
    alignItems: "center",
  },
  btnBuscar: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.green,
    justifyContent: "center",
    alignItems: "center",
  },
  usuarioCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 14,
    marginBottom: 8,
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  usuarioAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.greenSoft,
    justifyContent: "center",
    alignItems: "center",
  },
  usuarioLetra: { fontFamily: FONTS.bodyExtraBold, fontSize: 16, color: COLORS.greenDark },
  usuarioNome: { fontFamily: FONTS.bodyExtraBold, fontSize: SIZES.sm, color: COLORS.ink },
  usuarioSub: { fontFamily: FONTS.body, fontSize: SIZES.xs, color: COLORS.inkSoft },
  btnBloqueio: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.coral,
  },
  btnDesbloqueio: {
    backgroundColor: COLORS.green,
  },
  btnBloqueioText: { fontFamily: FONTS.bodyBold, fontSize: SIZES.xs, color: "#fff" },
});
