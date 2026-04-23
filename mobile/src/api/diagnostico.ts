import { API_BASE_URL } from "../config/api";

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

  const response = await fetch(`${API_BASE_URL}/v1/diagnostico`, {
    method: "POST",
    body: formData,
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Erro ${response.status}: ${errorText || response.statusText}`,
    );
  }

  const data = (await response.json()) as DiagnosticoResponse;
  return data;
}
