import { API_BASE_URL, API_TIMEOUT_MS } from "../config/api";
import { AppError, ErrorCode } from "../errors/AppError";
import { toAppError } from "../errors/errorHandler";

export type NivelLuz =
  | "sol_pleno"
  | "meia_sombra"
  | "indireta_brilhante"
  | "sombra"
  | "nao_aplicavel";

export interface ProblemaDetectado {
  descricao: string;
  gravidade: string;
  causa_provavel: string;
}

export interface DiagnosticoResponse {
  eh_planta: boolean;
  especie_identificada: string;
  nome_popular: string;
  confianca: number;
  toxica_para_pets: boolean;
  nivel_luz: NivelLuz;
  rega_dias: number;
  problemas_detectados: ProblemaDetectado[];
  plano_tratamento: string;
}

export async function diagnosticarPlanta(
  imageUri: string,
): Promise<DiagnosticoResponse> {
  const formData = new FormData();
  formData.append("file", {
    uri: imageUri,
    name: "planta.jpg",
    type: "image/jpeg",
  } as any);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}/v1/diagnostico`, {
      method: "POST",
      body: formData,
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 413) {
        throw new AppError(ErrorCode.IMAGE_TOO_LARGE);
      }
      if (response.status === 415 || response.status === 400) {
        throw new AppError(ErrorCode.IMAGE_INVALID);
      }
      if (response.status === 502 || response.status === 503) {
        throw new AppError(ErrorCode.BACKEND_UNAVAILABLE);
      }
      throw new AppError(
        ErrorCode.BACKEND_ERROR,
        `HTTP ${response.status}`,
      );
    }

    const data = (await response.json()) as DiagnosticoResponse;
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw toAppError(error);
  }
}
