import React from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { limparHistorico } from "../storage/historico";
import { resetarTutorial, resetarWelcome } from "../storage/preferencias";

const APP_VERSION = "1.0.0";
const YOUTUBE_URL = "https://www.youtube.com/@TerraGentil";
const SITE_URL = "https://terragentil.com.br";

interface Props {
  onVoltar: () => void;
}

export function SettingsScreen({ onVoltar }: Props) {
  function handleVerWelcome() {
    Alert.alert(
      "Ver boas-vindas",
      "Vou preparar pra tela de boas-vindas aparecer na proxima vez que voce abrir o app. Tudo bem?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sim, quero ver",
          onPress: async () => {
            await resetarWelcome();
            Alert.alert(
              "Pronto!",
              "Feche o app completamente e abra de novo. A tela de boas-vindas vai aparecer.",
              [{ text: "Entendi", onPress: onVoltar }],
            );
          },
        },
      ],
    );
  }

  function handleVerTutorial() {
    Alert.alert(
      "Ver tutorial",
      "Vou preparar pro tutorial de foto aparecer na proxima vez que voce abrir o app. Tudo bem?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sim, quero ver",
          onPress: async () => {
            await resetarTutorial();
            Alert.alert(
              "Pronto!",
              "Feche o app completamente e abra de novo. O tutorial vai aparecer.",
              [{ text: "Entendi", onPress: onVoltar }],
            );
          },
        },
      ],
    );
  }

  function handleLimparHistorico() {
    Alert.alert(
      "Limpar historico",
      "Vou apagar todas as consultas guardadas neste celular. Essa acao nao tem volta. Tem certeza?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apagar tudo",
          style: "destructive",
          onPress: async () => {
            await limparHistorico();
            Alert.alert("Pronto", "O historico foi apagado.", [
              { text: "OK", onPress: onVoltar },
            ]);
          },
        },
      ],
    );
  }

  function abrirYouTube() {
    Linking.openURL(YOUTUBE_URL).catch(() => {
      Alert.alert("Ops", "Nao consegui abrir o YouTube agora.");
    });
  }

  function abrirSite() {
    Linking.openURL(SITE_URL).catch(() => {
      Alert.alert("Ops", "Nao consegui abrir o site agora.");
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onVoltar}
          hitSlop={15}
        >
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuracoes</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.sectionTitle}>Preferencias</Text>

        <TouchableOpacity style={styles.card} onPress={handleVerWelcome}>
          <Text style={styles.cardIcon}>🎬</Text>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>Ver boas-vindas de novo</Text>
            <Text style={styles.cardDesc}>
              Mostra a tela de apresentacao na proxima abertura
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={handleVerTutorial}>
          <Text style={styles.cardIcon}>📖</Text>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>Ver tutorial de foto</Text>
            <Text style={styles.cardDesc}>
              Revisa as dicas de como tirar uma boa foto da planta
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Dados</Text>

        <TouchableOpacity style={styles.card} onPress={handleLimparHistorico}>
          <Text style={styles.cardIcon}>🗑️</Text>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>Limpar historico do jardim</Text>
            <Text style={styles.cardDesc}>
              Apaga todas as consultas guardadas neste celular
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Sobre</Text>

        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>🌱 Terra Gentil</Text>
          <Text style={styles.aboutVersion}>Versao {APP_VERSION}</Text>
          <Text style={styles.aboutDesc}>
            Seu Doutor das Plantas de bolso. Cuide com carinho, a planta
            agradece.
          </Text>
        </View>

        <TouchableOpacity style={styles.linkCard} onPress={abrirYouTube}>
          <Text style={styles.linkIcon}>📺</Text>
          <View style={styles.cardInfo}>
            <Text style={styles.linkTitle}>Canal no YouTube</Text>
            <Text style={styles.linkDesc}>Dicas novas toda semana</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkCard} onPress={abrirSite}>
          <Text style={styles.linkIcon}>🌐</Text>
          <View style={styles.cardInfo}>
            <Text style={styles.linkTitle}>Site Terra Gentil</Text>
            <Text style={styles.linkDesc}>terragentil.com.br</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          Feito com carinho pra quem ama plantas 🌿
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f9f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    minWidth: 80,
  },
  backText: {
    fontSize: 16,
    color: "#2e7d32",
    fontWeight: "700",
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#1b5e20",
  },
  headerSpacer: {
    minWidth: 80,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#558b2f",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e8f5e9",
  },
  cardIcon: {
    fontSize: 28,
    marginRight: 14,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  chevron: {
    fontSize: 24,
    color: "#ccc",
    fontWeight: "300",
    marginLeft: 8,
  },
  aboutCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e8f5e9",
    alignItems: "center",
  },
  aboutTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1b5e20",
    marginBottom: 4,
  },
  aboutVersion: {
    fontSize: 13,
    color: "#999",
    marginBottom: 12,
  },
  aboutDesc: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    lineHeight: 21,
  },
  linkCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e8f5e9",
  },
  linkIcon: {
    fontSize: 28,
    marginRight: 14,
  },
  linkTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a4d2e",
    marginBottom: 2,
  },
  linkDesc: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  footer: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    marginTop: 24,
    fontStyle: "italic",
  },
});
