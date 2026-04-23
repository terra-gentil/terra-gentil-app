import AsyncStorage from "@react-native-async-storage/async-storage";
import { DiagnosticoResponse, EstadoSaude } from "../api/diagnostico";

const STORAGE_KEY = "@terragentil:historico";
const LIMITE_BUFFER = 20;

export interface ConsultaHistorico {
  id: string;
  timestamp: number;
  imageUri: string;
  nome_popular: string;
  especie_identificada: string;
  estado_saude: EstadoSaude;
  diagnostico_titulo: string;
}

export async function salvarConsulta(
  resultado: DiagnosticoResponse,
  imageUri: string,
): Promise<void> {
  if (!resultado.eh_planta) return;

  try {
    const nova: ConsultaHistorico = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      imageUri,
      nome_popular: resultado.nome_popular,
      especie_identificada: resultado.especie_identificada,
      estado_saude: resultado.estado_saude,
      diagnostico_titulo: resultado.diagnostico_titulo,
    };

    const atual = await listarConsultas();
    const novaLista = [nova, ...atual].slice(0, LIMITE_BUFFER);

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(novaLista));
    console.log("[historico] consulta salva, total:", novaLista.length);
  } catch (err) {
    console.log("[historico] erro ao salvar:", err);
  }
}

export async function listarConsultas(
  limite?: number,
): Promise<ConsultaHistorico[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const lista = JSON.parse(raw) as ConsultaHistorico[];
    if (!Array.isArray(lista)) return [];
    return limite ? lista.slice(0, limite) : lista;
  } catch (err) {
    console.log("[historico] erro ao listar:", err);
    return [];
  }
}

export async function limparHistorico(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    console.log("[historico] historico limpo");
  } catch (err) {
    console.log("[historico] erro ao limpar:", err);
  }
}
