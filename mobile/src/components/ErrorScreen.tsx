import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppError, ErrorCode } from "../errors/AppError";
import { COLORS, FONTS, SIZES, shadowChunky, shadowSoft } from "../constants/theme";
import { AlertTriangle, WifiOff, Clock, ServerCrash, ImageOff, Lock, HelpCircle, Camera, Home, RefreshCw } from "lucide-react-native";

interface Props {
  error: AppError;
  onRetry?: () => void;
  onHome?: () => void;
}

interface ErrorContent {
  Icon: any;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  checklist?: string[];
  dica?: string;
  retryLabel: string;
  retryIcon: any;
}

const ERROR_CONTENT: Record<ErrorCode, ErrorContent> = {
  [ErrorCode.NETWORK_OFFLINE]: {
    Icon: WifiOff,
    iconColor: COLORS.sky,
    iconBg: COLORS.skySoft,
    title: "Sem conexao com a internet",
    description: "O Terra Gentil precisa de internet para analisar sua planta.",
    checklist: [
      "Seu Wi-Fi esta ligado?",
      "Os dados moveis estao ativos?",
      "O modo aviao esta desligado?",
    ],
    dica: "Quando a conexao voltar, toque em Tentar de novo.",
    retryLabel: "Tentar de novo",
    retryIcon: RefreshCw,
  },
  [ErrorCode.NETWORK_TIMEOUT]: {
    Icon: Clock,
    iconColor: COLORS.amber,
    iconBg: COLORS.amberSoft,
    title: "Esta demorando mais que o normal",
    description: "Nosso servidor esta com muitos pedidos agora. Isso acontece em horarios de pico.",
    dica: "Aguarde uns 30 segundos e tente de novo.",
    retryLabel: "Tentar de novo",
    retryIcon: RefreshCw,
  },
  [ErrorCode.BACKEND_UNAVAILABLE]: {
    Icon: ServerCrash,
    iconColor: COLORS.lavender,
    iconBg: COLORS.lavenderSoft,
    title: "Servico em manutencao",
    description: "Nosso servidor esta passando por uma atualizacao rapida. Volta ja, ja.",
    dica: "Tente novamente em alguns minutos.",
    retryLabel: "Tentar de novo",
    retryIcon: RefreshCw,
  },
  [ErrorCode.BACKEND_ERROR]: {
    Icon: AlertTriangle,
    iconColor: COLORS.coral,
    iconBg: COLORS.coralSoft,
    title: "Algo deu errado por aqui",
    description: "Nao consegui analisar essa foto agora, mas nao e culpa sua. Nosso servidor encontrou um problema interno.",
    checklist: [
      "Tire outra foto com boa iluminacao",
      "Aguarde alguns segundos e tente de novo",
      "Se o erro persistir, tente mais tarde",
    ],
    retryLabel: "Tentar outra foto",
    retryIcon: Camera,
  },
  [ErrorCode.INVALID_RESPONSE]: {
    Icon: HelpCircle,
    iconColor: COLORS.amber,
    iconBg: COLORS.amberSoft,
    title: "Recebi uma resposta estranha",
    description: "Aconteceu algo inesperado. Pode acontecer de vez em quando, nao se preocupe.",
    dica: "Tente tirar outra foto.",
    retryLabel: "Tentar outra foto",
    retryIcon: Camera,
  },
  [ErrorCode.IMAGE_TOO_LARGE]: {
    Icon: ImageOff,
    iconColor: COLORS.amber,
    iconBg: COLORS.amberSoft,
    title: "Essa foto e grande demais",
    description: "A imagem escolhida tem mais de 10MB.",
    dica: "Escolha outra foto ou tire uma nova com a camera.",
    retryLabel: "Escolher outra",
    retryIcon: Camera,
  },
  [ErrorCode.IMAGE_INVALID]: {
    Icon: ImageOff,
    iconColor: COLORS.coral,
    iconBg: COLORS.coralSoft,
    title: "Nao consegui ler essa imagem",
    description: "A foto pode estar em um formato que nao reconheco ou ter algum problema.",
    dica: "Tente outra foto em formato JPG ou PNG.",
    retryLabel: "Escolher outra",
    retryIcon: Camera,
  },
  [ErrorCode.PERMISSION_DENIED]: {
    Icon: Lock,
    iconColor: COLORS.greenDark,
    iconBg: COLORS.greenSoft,
    title: "Preciso de uma autorizacao",
    description: "Para funcionar, o Terra Gentil precisa de permissao para acessar a camera ou galeria.",
    dica: "Libere a permissao nas configuracoes do celular.",
    retryLabel: "Ok, entendi",
    retryIcon: RefreshCw,
  },
  [ErrorCode.UNKNOWN]: {
    Icon: HelpCircle,
    iconColor: COLORS.inkSoft,
    iconBg: COLORS.divider,
    title: "Aconteceu algo inesperado",
    description: "Nao consegui terminar a acao, mas nao e culpa sua.",
    dica: "Tente novamente em alguns segundos.",
    retryLabel: "Tentar de novo",
    retryIcon: RefreshCw,
  },
};

export function ErrorScreen({ error, onRetry, onHome }: Props) {
  const content = ERROR_CONTENT[error.code];
  const RetryIcon = content.retryIcon;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Icone grande */}
      <View style={[styles.iconCircle, { backgroundColor: content.iconBg }]}>
        <content.Icon size={48} color={content.iconColor} strokeWidth={1.8} />
      </View>

      {/* Titulo e descricao */}
      <Text style={styles.title}>{content.title}</Text>
      <Text style={styles.description}>{content.description}</Text>

      {/* Checklist */}
      {content.checklist && (
        <View style={styles.checklist}>
          {content.checklist.map((item, idx) => (
            <View key={idx} style={styles.checklistRow}>
              <View style={styles.checkDot} />
              <Text style={styles.checklistText}>{item}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Dica */}
      {content.dica && (
        <View style={styles.dicaCard}>
          <Text style={styles.dicaText}>{content.dica}</Text>
        </View>
      )}

      {/* Botao retry */}
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry} activeOpacity={0.8}>
          <RetryIcon size={20} color="#fff" strokeWidth={2.2} />
          <Text style={styles.retryButtonText}>{content.retryLabel}</Text>
        </TouchableOpacity>
      )}

      {/* Botao voltar */}
      {onHome && (
        <TouchableOpacity style={styles.homeButton} onPress={onHome} activeOpacity={0.8}>
          <Home size={18} color={COLORS.greenDark} strokeWidth={2.2} />
          <Text style={styles.homeButtonText}>Voltar ao inicio</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    paddingHorizontal: 28,
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: "center",
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    ...shadowSoft(),
  },
  title: {
    fontFamily: FONTS.displayBlack,
    fontSize: SIZES.xl,
    color: COLORS.greenDark,
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontFamily: FONTS.body,
    fontSize: SIZES.body + 1,
    color: COLORS.inkSoft,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  checklist: {
    alignSelf: "stretch",
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 12,
    ...shadowSoft(),
  },
  checklistRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.green,
  },
  checklistText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: SIZES.body,
    color: COLORS.ink,
    flex: 1,
  },
  dicaCard: {
    alignSelf: "stretch",
    backgroundColor: COLORS.amberSoft,
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.amber,
  },
  dicaText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: SIZES.smPlus,
    color: "#78350f",
    lineHeight: 20,
    fontStyle: "italic",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: COLORS.green,
    marginBottom: 12,
    ...shadowChunky(COLORS.greenDeep),
  },
  retryButtonText: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.md,
    color: "#fff",
  },
  homeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: COLORS.green,
  },
  homeButtonText: {
    fontFamily: FONTS.bodyExtraBold,
    fontSize: SIZES.body,
    color: COLORS.greenDark,
  },
});
