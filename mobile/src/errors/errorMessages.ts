import { ErrorCode } from "./AppError";

export interface ErrorMessage {
  title: string;
  message: string;
  actionLabel: string;
}

/**
 * Mapeia codigos tecnicos para mensagens amigaveis em PT-BR.
 * Facilita i18n futuro: troca esse arquivo, app inteiro traduz.
 */
export const errorMessages: Record<ErrorCode, ErrorMessage> = {
  [ErrorCode.NETWORK_OFFLINE]: {
    title: "Sem conexao",
    message:
      "Verifique seu Wi-Fi ou dados moveis e tente novamente. O Doutor das Plantas precisa de internet para analisar a foto.",
    actionLabel: "Tentar de novo",
  },
  [ErrorCode.NETWORK_TIMEOUT]: {
    title: "Esta demorando...",
    message:
      "Nosso servidor esta com muitos pedidos no momento. Tente novamente em alguns segundos.",
    actionLabel: "Tentar de novo",
  },
  [ErrorCode.BACKEND_UNAVAILABLE]: {
    title: "Servico indisponivel",
    message:
      "Nosso servidor esta passando por manutencao. Tente novamente em alguns minutos.",
    actionLabel: "Tentar de novo",
  },
  [ErrorCode.BACKEND_ERROR]: {
    title: "Algo deu errado",
    message:
      "Nao consegui analisar essa foto agora. Tente tirar outra ou escolher da galeria.",
    actionLabel: "Tentar outra foto",
  },
  [ErrorCode.INVALID_RESPONSE]: {
    title: "Resposta inesperada",
    message:
      "Recebi uma resposta estranha do servidor. Pode tentar de novo?",
    actionLabel: "Tentar de novo",
  },
  [ErrorCode.IMAGE_TOO_LARGE]: {
    title: "Imagem muito grande",
    message:
      "A foto escolhida e grande demais. Tente uma com menos de 10MB.",
    actionLabel: "Escolher outra",
  },
  [ErrorCode.IMAGE_INVALID]: {
    title: "Imagem invalida",
    message:
      "Nao consegui ler essa imagem. Tente outra foto em formato JPG ou PNG.",
    actionLabel: "Escolher outra",
  },
  [ErrorCode.PERMISSION_DENIED]: {
    title: "Permissao necessaria",
    message:
      "Precisamos de acesso a camera ou galeria para funcionar. Autorize nas configuracoes do aparelho.",
    actionLabel: "Ok, entendi",
  },
  [ErrorCode.UNKNOWN]: {
    title: "Algo inesperado aconteceu",
    message:
      "Nao consegui terminar a acao. Pode tentar de novo em alguns segundos.",
    actionLabel: "Tentar de novo",
  },
};
