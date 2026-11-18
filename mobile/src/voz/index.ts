// Voz do Doutor: locutor unico ligado ao expo-audio, ao AppState e ao leitor de tela.
import { AccessibilityInfo, AppState } from "react-native";
import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { FALAS, FalaId } from "./falas";
import { Locutor, Tocador } from "./locutor";
import { vozLigada } from "../storage/voz";

class TocadorExpo implements Tocador {
  private player: AudioPlayer | null = null;
  private assinatura: { remove: () => void } | null = null;
  private carregada: FalaId | null = null;

  private garantir(): AudioPlayer {
    if (!this.player) this.player = createAudioPlayer(null);
    return this.player;
  }

  preparar(fala: FalaId): void {
    if (this.carregada === fala) return;
    this.garantir().replace(FALAS[fala]);
    this.carregada = fala;
  }

  tocar(fala: FalaId, aoTerminar: () => void): void {
    const p = this.garantir();
    this.assinatura?.remove();
    // Toda fala comeca do inicio: se ja estava carregada (preparar), so volta ao zero
    if (this.carregada === fala) p.seekTo(0).catch(() => undefined);
    else p.replace(FALAS[fala]);
    this.carregada = null;
    this.assinatura = p.addListener("playbackStatusUpdate", (s) => {
      if (s.didJustFinish) {
        this.assinatura?.remove();
        this.assinatura = null;
        aoTerminar();
      }
    });
    p.play();
  }

  volume(v: number): void {
    if (this.player) this.player.volume = v;
  }

  parar(): void {
    this.assinatura?.remove();
    this.assinatura = null;
    this.player?.pause();
  }
}

export const locutor = new Locutor(new TocadorExpo());

let iniciado = false;

// Chamado uma vez no App: modo de audio, preferencia do alto-falante, segundo plano e TalkBack.
export async function iniciarVoz(): Promise<void> {
  if (iniciado) return;
  iniciado = true;
  try {
    // Abaixa a musica de outros apps em vez de brigar com ela; no iOS respeita o silencioso
    await setAudioModeAsync({
      playsInSilentMode: false,
      interruptionMode: "duckOthers",
      // O locutor ja para sozinho em segundo plano; isto so deixa a dica de foto seguir com a camera aberta
      shouldPlayInBackground: true,
      shouldRouteThroughEarpiece: false,
      allowsRecording: false,
    });
  } catch (err) {
    console.log("[voz] modo de audio falhou", err);
  }
  locutor.setLigado(await vozLigada());
  locutor.setPrimeiroPlano(AppState.currentState === "active" || AppState.currentState == null);
  AppState.addEventListener("change", (estado) => locutor.setPrimeiroPlano(estado === "active"));
  try {
    locutor.setLeitorDeTela(await AccessibilityInfo.isScreenReaderEnabled());
  } catch {
    locutor.setLeitorDeTela(false);
  }
  AccessibilityInfo.addEventListener("screenReaderChanged", (v) => locutor.setLeitorDeTela(!!v));
}

export type { ItemFala } from "./roteiro";
