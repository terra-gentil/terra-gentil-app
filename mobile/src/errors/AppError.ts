/**
 * Sistema de erros tipados do app.
 *
 * Nunca expomos esses codigos ao usuario. Sao usados internamente
 * para decidir qual mensagem amigavel mostrar.
 */

export enum ErrorCode {
  NETWORK_OFFLINE = "NETWORK_OFFLINE",
  NETWORK_TIMEOUT = "NETWORK_TIMEOUT",
  BACKEND_UNAVAILABLE = "BACKEND_UNAVAILABLE",
  BACKEND_ERROR = "BACKEND_ERROR",
  INVALID_RESPONSE = "INVALID_RESPONSE",
  IMAGE_TOO_LARGE = "IMAGE_TOO_LARGE",
  IMAGE_INVALID = "IMAGE_INVALID",
  PERMISSION_DENIED = "PERMISSION_DENIED",
  UNKNOWN = "UNKNOWN",
}

export class AppError extends Error {
  code: ErrorCode;
  technicalDetails?: string;

  constructor(code: ErrorCode, technicalDetails?: string) {
    super(code);
    this.code = code;
    this.technicalDetails = technicalDetails;
    this.name = "AppError";
  }
}
