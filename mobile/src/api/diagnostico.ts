import { API_BASE_URL, API_TIMEOUT_MS } from "../config/api";
import { AppError, ErrorCode } from "../errors/AppError";
import { toAppError } from "../errors/errorHandler";

export type NivelLuz =
  | "sol_pleno" | "meia_sombra" | "indireta_brilhante" | "sombra" | "nao_aplicavel";

export type EstadoSaude =
  | "saudavel" | "atencao" | "doente" | "critico" | "nao_aplicavel";

export type NivelDificuldade =
  | "facil" | "medio" | "dificil" | "nao_aplicavel";

export interface ProblemaDetectado {
  descricao: string;
  gravidade: string;
  causa_provavel: string;
}

export interface PassoTratamento {
  etapa: string;
  acao: string;
}

export interface DiagnosticoResponse {
  eh_planta: boolean;
  especie_identificada: string;
  nome_popular: string;
  confianca: number;
  estado_saude: EstadoSaude;
  toxica_para_pets: boolean;
  toxicidade_detalhes: string;
  nivel_luz: NivelLuz;
  rega_dias: number;
  rega_condicao: string;
  temperatura_ideal: string;
  nivel_dificuldade: NivelDificuldade;
  luz_porcentagem: number;
  luz_veredito: string;
  diagnostico_titulo: string;
  diagnostico_explicacao: string;
  problemas_detectados: ProblemaDetectado[];
  plano_tratamento: string;
  plano_timeline: PassoTratamento[];
  precisa_retorno: boolean;
  mensagem_retorno: string;
}

export async function diagnosticarPlanta(imageUri: string): Promise<DiagnosticoResponse> {
  console.log("[api] INICIANDO request para:", API_BASE_URL);
  console.log("[api] Image URI:", imageUri);

  const formData = new FormData();
  formData.append("file", { uri: imageUri, name: "planta.jpg", type: "image/jpeg" } as any);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.log("[api] TIMEOUT apos", API_TIMEOUT_MS, "ms, abortando");
    controller.abort();
  }, API_TIMEOUT_MS);

  try {
    console.log("[api] Enviando POST...");
    const response = await fetch(`${API_BASE_URL}/v1/diagnostico`, {
      method: "POST",
      body: formData,
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    console.log("[api] Response recebida, status:", response.status, "ok:", response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.log("[api] Response body error:", errorText.substring(0, 500));

      if (response.status === 413) throw new AppError(ErrorCode.IMAGE_TOO_LARGE);
      if (response.status === 415 || response.status === 400)
        throw new AppError(ErrorCode.IMAGE_INVALID);
      if (response.status === 500)
        throw new AppError(ErrorCode.BACKEND_ERROR, `HTTP 500: ${errorText.substring(0, 200)}`);
      if (response.status === 502 || response.status === 503)
        throw new AppError(ErrorCode.BACKEND_UNAVAILABLE, `HTTP ${response.status}: ${errorText.substring(0, 200)}`);
      throw new AppError(ErrorCode.BACKEND_ERROR, `HTTP ${response.status}: ${errorText.substring(0, 200)}`);
    }

    const data = (await response.json()) as DiagnosticoResponse;
    console.log("[api] Response OK, data keys:", Object.keys(data));
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    console.log("[api] CATCH error:", error);
    if (error instanceof Error) {
      console.log("[api] error.name:", error.name);
      console.log("[api] error.message:", error.message);
    }
    throw toAppError(error);
  }
}
