import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { COLORS, FONTS, SIZES, shadowSoft } from "../../constants/theme";
import {
  AuthUser,
  ProfileExtra,
  getProfileExtra,
  getToken,
  saveProfileExtra,
  updateDisplayName,
} from "../../storage/auth";
import { FORUM_API_URL } from "../../config/api";

const OPCOES_SEXO = ["Masculino", "Feminino", "Não-binário", "Prefiro não dizer"];

interface Props {
  visible: boolean;
  usuario: AuthUser | null;
  onClose: () => void;
  onSalvo: (nomeAtualizado: string) => void;
}

export default function EditarPerfilModal({ visible, usuario, onClose, onSalvo }: Props) {
  const insets = useSafeAreaInsets();
  const [nome, setNome] = useState("");
  const [sexo, setSexo] = useState("");
  const [idade, setIdade] = useState("");
  const [email, setEmail] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!visible) return;
    (async () => {
      const extra = await getProfileExtra();
      setNome(extra.nome ?? usuario?.display_name ?? "");
      setSexo(extra.sexo ?? "");
      setIdade(extra.idade ?? "");
      setEmail(extra.email ?? "");
    })();
  }, [visible, usuario]);

  async function handleSalvar() {
    const nomeLimpo = nome.trim();
    if (nomeLimpo.length < 2) {
      Alert.alert("Nome muito curto", "Digite pelo menos 2 caracteres.");
      return;
    }
    if (idade && (Number(idade) < 1 || Number(idade) > 120)) {
      Alert.alert("Idade inválida", "Digite uma idade entre 1 e 120.");
      return;
    }

    setSalvando(true);
    try {
      const extra: ProfileExtra = { nome: nomeLimpo, sexo, idade, email: email.trim() };
      await saveProfileExtra(extra);
      await updateDisplayName(nomeLimpo);

      if (usuario) {
        const token = await getToken();
        if (token) {
          await fetch(`${FORUM_API_URL}/auth/me`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ display_name: nomeLimpo }),
          }).catch(() => {});
        }
      }

      onSalvo(nomeLimpo);
    } catch (err) {
      console.log("[editar-perfil] erro:", err);
      Alert.alert("Erro", "Não foi possível salvar. Tente de novo.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={10} style={styles.closeBtn}>
            <X size={22} color={COLORS.ink} strokeWidth={2.4} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar perfil</Text>
          <View style={{ width: 32 }} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.label}>Nome</Text>
            <TextInput
              value={nome}
              onChangeText={setNome}
              placeholder="Seu nome na comunidade"
              placeholderTextColor={COLORS.inkMute}
              maxLength={60}
              style={styles.input}
              autoCapitalize="words"
            />

            <Text style={styles.label}>Sexo</Text>
            <View style={styles.pillsRow}>
              {OPCOES_SEXO.map((op) => {
                const ativo = sexo === op;
                return (
                  <TouchableOpacity
                    key={op}
                    onPress={() => setSexo(ativo ? "" : op)}
                    activeOpacity={0.7}
                    style={[styles.pill, ativo && styles.pillAtivo]}
                  >
                    <Text style={[styles.pillText, ativo && styles.pillTextAtivo]}>{op}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Idade</Text>
            <TextInput
              value={idade}
              onChangeText={(v) => setIdade(v.replace(/\D/g, ""))}
              placeholder="Ex: 34"
              placeholderTextColor={COLORS.inkMute}
              keyboardType="number-pad"
              maxLength={3}
              style={[styles.input, styles.inputSmall]}
            />

            <Text style={styles.label}>E-mail</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
              placeholderTextColor={COLORS.inkMute}
              keyboardType="email-address"
              autoCapitalize="none"
              maxLength={120}
              style={styles.input}
            />

            <View style={{ height: 40 }} />
          </ScrollView>

          <View style={[styles.bottom, { paddingBottom: insets.bottom + 16 }]}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSalvar}
              disabled={salvando || nome.trim().length < 2}
              style={[
                styles.salvarBtn,
                { backgroundColor: nome.trim().length < 2 ? COLORS.inkMute : COLORS.green },
              ]}
            >
              {salvando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.salvarText}>Salvar</Text>
              )}
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
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  label: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.smPlus,
    color: COLORS.greenDark,
    marginBottom: 8,
    marginTop: 6,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: FONTS.body,
    fontSize: SIZES.body,
    color: COLORS.ink,
    borderWidth: 1,
    borderColor: COLORS.divider,
    marginBottom: 20,
    ...shadowSoft(),
  },
  inputSmall: {
    width: 120,
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: COLORS.divider,
  },
  pillAtivo: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  pillText: {
    fontFamily: FONTS.bodyBold,
    fontSize: SIZES.sm,
    color: COLORS.inkSoft,
  },
  pillTextAtivo: {
    color: "#fff",
  },
  bottom: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  salvarBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  salvarText: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.body + 1,
    color: "#fff",
    letterSpacing: 0.4,
  },
});
