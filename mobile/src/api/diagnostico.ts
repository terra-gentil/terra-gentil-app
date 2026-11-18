import { API_BASE_URL, API_TIMEOUT_MS } from "../config/api";
import { AppError, ErrorCode } from "../errors/AppError";
import { toAppError } from "../errors/errorHandler";

export type NivelLuz =
  | "sol_pleno" | "meia_sombra" | "indireta_brilhante" | "sombra" | "nao_aplicavel";

export type EstadoSaude =
  | "saudavel" | "atencao" | "doente" | "critico" | "nao_aplicavel";

export type NivelDificuldade =
  | "facil" | "medio" | "dificil" | "nao_aplicavel";

// Campos v2 sao opcionais: o Gemini reserva ainda pode devolver o relatorio v1 sem eles.
export type GravidadeProblema = "baixa" | "media" | "alta";

export type CategoriaProblema =
  | "rega_excesso" | "rega_falta" | "luz_excesso" | "luz_falta" | "praga"
  | "fungo_ou_bacteria" | "nutricao" | "raiz_ou_vaso" | "clima" | "dano_fisico"
  | "envelhecimento_natural" | "outro";

export interface ProblemaDetectado {
  descricao: string;
  gravidade: string;
  causa_provavel: string;
  categoria?: CategoriaProblema;
  evidencia_visual?: string;
  como_confirmar?: string;
  contagioso?: boolean;
  // Caixa do problema na foto principal, em fracoes de 0 a 1 (x,y = canto superior esquerdo)
  area_foto?: AreaFoto | null;
}

export interface AreaFoto {
  x: number;
  y: number;
  largura: number;
  altura: number;
}

export type TipoPasso = "manejo" | "caseiro" | "organico" | "quimico";

export interface PassoTratamento {
  etapa: string;
  acao: string;
  tipo?: TipoPasso;
  dia_inicio?: number;
  como_fazer?: string;
  por_que?: string;
  materiais?: string[];
}

export type ProblemaFoto =
  | "desfocada" | "escura" | "estourada" | "contraluz" | "longe_demais"
  | "perto_demais" | "planta_cortada" | "varias_plantas" | "obstruida";

export interface FotoAvaliacao {
  qualidade: "boa" | "aceitavel" | "ruim";
  problemas?: ProblemaFoto[];
  o_que_aparece?: string;
  dica_proxima_foto?: string;
}

export interface LeituraFoto {
  aspecto: "folhas" | "caule_e_ramos" | "flores_e_frutos" | "solo" | "vaso" | "ambiente_e_luz";
  observacao: string;
  sinal: "bom" | "neutro" | "atencao" | "ruim";
}

export interface AlternativaEspecie {
  nome_popular: string;
  especie: string;
  como_diferenciar: string;
  // Miniatura da Wikipedia ou ""
  foto_referencia?: string;
}

export interface Identificacao {
  nivel_confianca: "alta" | "media" | "baixa" | "nao_aplicavel";
  como_reconheci?: string;
  outros_nomes?: string[];
  alternativas?: AlternativaEspecie[];
}

export interface Acompanhamento {
  prazo_melhora?: string;
  sinais_melhora?: string[];
  sinais_piora?: string[];
  retorno_em_dias?: number;
  como_evitar?: string;
}

export interface AjudaProfissional {
  recomendada?: boolean;
  motivo?: string;
}

export type NivelToxicidade =
  | "nao_toxica" | "leve" | "moderada" | "grave" | "desconhecida" | "nao_aplicavel";

export type AfetadoToxicidade = "caes" | "gatos" | "criancas" | "adultos";

export interface Toxicidade {
  nivel: NivelToxicidade;
  afeta?: AfetadoToxicidade[];
  partes_toxicas?: string;
  sintomas?: string;
  o_que_fazer?: string;
}

export interface Cuidados {
  rega?: string;
  luz_e_local?: string;
  solo_e_vaso?: string;
  adubacao?: string;
  poda_e_limpeza?: string;
  como_fazer_mudas?: string;
  erros_comuns?: string[];
}

export interface TarefaCalendario {
  frequencia: "semanal" | "quinzenal" | "mensal" | "trimestral" | "semestral" | "anual" | "quando_necessario";
  tarefa: string;
}

export interface EbookRecomendado {
  id: string;
  motivo: string;
  titulo?: string;
  capa?: string;
  pdf?: string;
  tema?: string;
  emoji?: string;
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
  // Relatorio v2 (opcionais)
  versao_relatorio?: "v2";
  foto?: FotoAvaliacao;
  leitura_foto?: LeituraFoto[];
  identificacao?: Identificacao;
  acompanhamento?: Acompanhamento;
  ajuda_profissional?: AjudaProfissional;
  toxicidade?: Toxicidade;
  cuidados?: Cuidados;
  calendario_cuidados?: TarefaCalendario[];
  curiosidades?: string[];
  ebooks_recomendados?: EbookRecomendado[];
  rega_ml?: number;
  vaso_estimado_cm?: number;
  // Frase curta sobre a estacao do ano no Brasil, ou ""
  nota_estacao?: string;
  // Miniatura da Wikipedia da especie, ou ""
  foto_referencia?: string;
}

// Campos do multipart: a primeira foto e a principal, as outras sao outros angulos
const CAMPOS_FOTO = ["file", "file2", "file3"] as const;

export function montarFormDiagnostico(imageUris: string[]): FormData {
  const formData = new FormData();
  imageUris.slice(0, CAMPOS_FOTO.length).forEach((uri, i) => {
    formData.append(CAMPOS_FOTO[i], { uri, name: i === 0 ? "planta.jpg" : `planta${i + 1}.jpg`, type: "image/jpeg" } as any);
  });
  return formData;
}

// Aceita uma URI ou uma lista de 1 a 3 (a primeira e a foto principal)
export async function diagnosticarPlanta(imagens: string | string[]): Promise<DiagnosticoResponse> {
  const imageUris = (Array.isArray(imagens) ? imagens : [imagens]).filter(Boolean);
  if (imageUris.length === 0) throw new AppError(ErrorCode.IMAGE_INVALID);
  console.log("[api] INICIANDO request para:", API_BASE_URL);
  console.log("[api] Fotos:", imageUris.length);

  const formData = montarFormDiagnostico(imageUris);

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
      // 504 (demorou demais) e 429 (cota do Gemini) viram o aviso de tentar de novo
      if (response.status === 504)
        throw new AppError(ErrorCode.NETWORK_TIMEOUT, `HTTP 504: ${errorText.substring(0, 200)}`);
      if (response.status === 429 || response.status === 502 || response.status === 503)
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
