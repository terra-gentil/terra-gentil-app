// Liga o roteiro ao locutor e ao estado guardado. As telas so chamam estas funcoes.
import type { DiagnosticoResponse } from "../api/diagnostico";
import type { ErrorCode } from "../errors/AppError";
import {
  consultasComVoz,
  fotoMarcadaVezes,
  iniciarConsultaVoz,
  lerUltimas,
  podeFalarErro,
  registrarFotoMarcada,
  salvarUltimas,
} from "../storage/voz";
import { locutor } from "./index";
import { deveDarDicaDeFoto, escolherFalasLaudo, falaDeErro, falaProximaFoto, planoEspera, Sorteio } from "./roteiro";

// Fala do laudo comeca ~0,7 s depois de a tela aparecer (regra 15)
export const ATRASO_LAUDO_MS = 700;

export async function falarEspera(inicio: number): Promise<void> {
  const { trilha } = await iniciarConsultaVoz();
  const sorteio = new Sorteio(await lerUltimas());
  const itens = planoEspera(trilha, sorteio);
  await salvarUltimas(sorteio.ultimas);
  locutor.preparar(itens[0].fala);
  locutor.agendar(itens, inicio);
}

export async function falarLaudo(r: DiagnosticoResponse): Promise<void> {
  const [consultas, marcada, ultimas] = await Promise.all([consultasComVoz(), fotoMarcadaVezes(), lerUltimas()]);
  const sorteio = new Sorteio(ultimas);
  const { itens, usouFotoMarcada } = escolherFalasLaudo(
    r,
    { primeira: consultas <= 1, fotoMarcadaVezes: marcada },
    sorteio,
  );
  await salvarUltimas(sorteio.ultimas);
  if (usouFotoMarcada) await registrarFotoMarcada();
  locutor.sequencia(itens, ATRASO_LAUDO_MS);
}

// Antes de abrir a camera para a 1a foto. Termina antes de a camera abrir, para a fala entrar a tempo.
export async function falarAntesDaCamera(): Promise<void> {
  if (!deveDarDicaDeFoto(await consultasComVoz())) return;
  const sorteio = new Sorteio(await lerUltimas());
  const fala = sorteio.de("cameraDica");
  await salvarUltimas(sorteio.ultimas);
  locutor.falarAgora({ fala, sobreCamera: true });
}

// Ao pedir a 2a ou a 3a foto (camera ou galeria)
export async function falarProximaFoto(numero: number): Promise<void> {
  const sorteio = new Sorteio(await lerUltimas());
  const fala = falaProximaFoto(numero, sorteio);
  if (!fala) return;
  await salvarUltimas(sorteio.ultimas);
  locutor.falarAgora({ fala, sobreCamera: true });
}

// Ao entrar na tela "Quer mandar mais fotos?"
export async function falarMaisFotos(): Promise<void> {
  if (!deveDarDicaDeFoto(await consultasComVoz())) return;
  const sorteio = new Sorteio(await lerUltimas());
  const fala = sorteio.de("maisFotos");
  await salvarUltimas(sorteio.ultimas);
  locutor.sequencia([{ fala }], ATRASO_LAUDO_MS);
}

export async function falarErro(code: ErrorCode): Promise<void> {
  const sorteio = new Sorteio(await lerUltimas());
  const escolha = falaDeErro(code, sorteio);
  if (!escolha) return;
  if (!(await podeFalarErro(escolha.chave))) return;
  await salvarUltimas(sorteio.ultimas);
  locutor.sequencia([{ fala: escolha.fala }], ATRASO_LAUDO_MS);
}
