import { AppError, ErrorCode } from "./AppError";

/**
 * Converte qualquer erro cru (fetch, timeout, etc) em AppError tipado.
 *
 * Isso isola a complexidade: camadas superiores so lidam com AppError,
 * nao precisam saber de HTTP, TypeError, AbortError, etc.
 */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();

    if (msg.includes("aborted") || msg.includes("timeout")) {
      return new AppError(ErrorCode.NETWORK_TIMEOUT, error.message);
    }

    if (
      msg.includes("network") ||
      msg.includes("failed to fetch") ||
      msg.includes("fetch")
    ) {
      return new AppError(ErrorCode.NETWORK_OFFLINE, error.message);
    }

    if (msg.includes("503") || msg.includes("502")) {
      return new AppError(ErrorCode.BACKEND_UNAVAILABLE, error.message);
    }

    if (msg.includes("500") || msg.includes("backend error")) {
      return new AppError(ErrorCode.BACKEND_ERROR, error.message);
    }

    if (msg.includes("413")) {
      return new AppError(ErrorCode.IMAGE_TOO_LARGE, error.message);
    }

    if (msg.includes("415") || msg.includes("400")) {
      return new AppError(ErrorCode.IMAGE_INVALID, error.message);
    }

    return new AppError(ErrorCode.UNKNOWN, error.message);
  }

  return new AppError(ErrorCode.UNKNOWN, String(error));
}

/**
 * Loga erro no console pra debug, sem expor pro usuario.
 * Futuramente vira integracao com Sentry.
 */
export function logError(error: AppError, context?: string): void {
  console.log(
    `[${context || "app"}] ${error.code}:`,
    error.technicalDetails || error.message,
  );
}
