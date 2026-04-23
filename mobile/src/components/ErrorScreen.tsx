import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppError, ErrorCode } from "../errors/AppError";

interface Props {
  error: AppError;
  onRetry?: () => void;
  onHome?: () => void;
}

interface ErrorContent {
  icon: string;
  title: string;
  description: string;
  checklist?: string[];
  dica?: string;
  retryLabel: string;
}

const ERROR_CONTENT: Record<ErrorCode, ErrorContent> = {
  [ErrorCode.NETWORK_OFFLINE]: {
    icon: "📡",
    title: "Sem conexao com a internet",
    description:
      "O Terra Gentil precisa de internet para analisar sua planta.",
    checklist: [
      "📶 Seu Wi-Fi esta ligado?",
      "🔋 Os dados moveis estao ativos?",
      "✈️ O modo aviao esta desligado?",
    ],
    dica: "Quando a conexao voltar, toque em Tentar de novo.",
    retryLabel: "🔄 Tentar de novo",
  },
  [ErrorCode.NETWORK_TIMEOUT]: {
    icon: "⏱️",
    title: "Esta demorando mais que o normal",
    description:
      "Nosso servidor esta com muitos pedidos agora mesmo. Isso acontece em horarios de pico.",
    dica: "Aguarde uns 30 segundos e tente de novo.",
    retryLabel: "🔄 Tentar de novo",
  },
  [ErrorCode.BACKEND_UNAVAILABLE]: {
    icon: "🔧",
    title: "Servico em manutencao",
    description:
      "Nosso servidor esta passando por uma atualizacao rapida. Volta ja, ja.",
    dica: "Tente novamente em alguns minutos.",
    retryLabel: "🔄 Tentar de novo",
  },
  [ErrorCode.BACKEND_ERROR]: {
    icon: "🤔",
    title: "Algo deu errado por aqui",
    description:
      "Nao consegui analisar essa foto agora, mas nao e culpa sua.",
    checklist: [
      "Tire outra foto com boa iluminacao",
      "Aguarde alguns segundos",
      "Confira se tem sinal de internet",
    ],
    retryLabel: "📷 Tentar outra foto",
  },
  [ErrorCode.INVALID_RESPONSE]: {
    icon: "🤔",
    title: "Recebi uma resposta estranha",
    description:
      "Aconteceu algo inesperado. Pode acontecer de vez em quando, nao se preocupe.",
    dica: "Tente tirar outra foto.",
    retryLabel: "📷 Tentar outra foto",
  },
  [ErrorCode.IMAGE_TOO_LARGE]: {
    icon: "📦",
    title: "Essa foto e grande demais",
    description: "A imagem escolhida tem mais de 10MB.",
    dica: "Escolha outra foto ou tire uma nova com a camera.",
    retryLabel: "🖼️ Escolher outra",
  },
  [ErrorCode.IMAGE_INVALID]: {
    icon: "📷",
    title: "Nao consegui ler essa imagem",
    description:
      "A foto pode estar em um formato que nao reconheco ou ter algum problema.",
    dica: "Tente outra foto em formato JPG ou PNG.",
    retryLabel: "🖼️ Escolher outra",
  },
  [ErrorCode.PERMISSION_DENIED]: {
    icon: "🔒",
    title: "Preciso de uma autorizacao",
    description:
      "Para funcionar, o Terra Gentil precisa de permissao para acessar a camera ou galeria.",
    dica: "Libere a permissao nas configuracoes do celular.",
    retryLabel: "Ok, entendi",
  },
  [ErrorCode.UNKNOWN]: {
    icon: "🤔",
    title: "Aconteceu algo inesperado",
    description:
      "Nao consegui terminar a acao, mas nao e culpa sua.",
    dica: "Tente novamente em alguns segundos.",
    retryLabel: "🔄 Tentar de novo",
  },
};

export function ErrorScreen({ error, onRetry, onHome }: Props) {
  const content = ERROR_CONTENT[error.code];

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{content.icon}</Text>
      <Text style={styles.title}>{content.title}</Text>
      <Text style={styles.description}>{content.description}</Text>

      {content.checklist && (
        <View style={styles.checklist}>
          {content.checklist.map((item, idx) => (
            <Text key={idx} style={styles.checklistItem}>
              {item}
            </Text>
          ))}
        </View>
      )}

      {content.dica && <Text style={styles.dica}>{content.dica}</Text>}

      {onRetry && (
        <TouchableOpacity style={styles.primaryButton} onPress={onRetry}>
          <Text style={styles.primaryButtonText}>{content.retryLabel}</Text>
        </TouchableOpacity>
      )}

      {onHome && (
        <TouchableOpacity style={styles.secondaryButton} onPress={onHome}>
          <Text style={styles.secondaryButtonText}>🏠 Voltar ao inicio</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 28,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  icon: {
    fontSize: 56,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1b5e20",
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#2e2e2e",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 20,
  },
  checklist: {
    alignSelf: "stretch",
    backgroundColor: "#f5f9f5",
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
  },
  checklistItem: {
    fontSize: 15,
    color: "#2e2e2e",
    lineHeight: 26,
  },
  dica: {
    fontSize: 15,
    color: "#5c5c5c",
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 24,
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: "#2e7d32",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
    marginBottom: 12,
    minHeight: 56,
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    paddingVertical: 14,
    alignItems: "center",
    width: "100%",
    minHeight: 48,
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#2e7d32",
    fontSize: 16,
    fontWeight: "600",
  },
});
