// Locutor unico do app: uma fala por vez, com fila, prioridade e fade (secao 3 do roteiro).
// O tocador de verdade (expo-audio) fica em tocadorExpo; aqui so a logica, testavel com relogio falso.
import type { FalaId } from "./falas";
import type { ItemFala } from "./roteiro";

export interface Tocador {
  preparar(fala: FalaId): void;
  tocar(fala: FalaId, aoTerminar: () => void): void;
  volume(v: number): void;
  parar(): void;
}

export type EventoLocutor = { tipo: "inicio" | "fim"; item: ItemFala };
type Ouvinte = (ev: EventoLocutor) => void;

interface Pronto {
  item: ItemFala;
  prontoEm: number;
  ordem: number;
}

export const SILENCIO_MIN_MS = 1000;
export const FADE_MS = 500;
const FADE_PASSOS = 10;
// Se o fim da fala nunca chegar (erro do tocador), libera a fila depois disso
const VIGIA_MS = 20000;

export class Locutor {
  private fila: Pronto[] = [];
  private agendados: ReturnType<typeof setTimeout>[] = [];
  private espera: ReturnType<typeof setTimeout> | null = null;
  private vigia: ReturnType<typeof setTimeout> | null = null;
  private fade: ReturnType<typeof setInterval> | null = null;
  private atual: ItemFala | null = null;
  private fimUltima = -Infinity;
  private ordem = 0;
  private ouvintes = new Set<Ouvinte>();
  private ligado = true;
  private leitorDeTela = false;
  private emPrimeiroPlano = true;

  constructor(
    private tocador: Tocador,
    private agora: () => number = () => Date.now(),
  ) {}

  get falando(): boolean {
    return this.atual !== null;
  }

  get estaLigado(): boolean {
    return this.ligado;
  }

  ouvir(fn: Ouvinte): () => void {
    this.ouvintes.add(fn);
    return () => {
      this.ouvintes.delete(fn);
    };
  }

  // Botao de alto-falante (regra 2). Desligar corta a fala com fade e descarta o que chegar enquanto isso.
  setLigado(v: boolean): void {
    this.ligado = v;
    if (!v) this.interromper(true);
  }

  // TalkBack ligado: a voz gravada fica muda (regra 4)
  setLeitorDeTela(v: boolean): void {
    this.leitorDeTela = v;
    if (v) this.interromper(false);
  }

  // App em segundo plano ou tela apagada: para na hora (regra 5)
  setPrimeiroPlano(v: boolean): void {
    this.emPrimeiroPlano = v;
    if (!v) this.interromper(false);
  }

  private podeFalar(): boolean {
    return this.ligado && !this.leitorDeTela && this.emPrimeiroPlano;
  }

  preparar(fala: FalaId): void {
    if (this.podeFalar() && !this.atual) this.tocador.preparar(fala);
  }

  // Espera: cada item fica pronto no seu "em" (ms contados a partir de "inicio")
  agendar(itens: ItemFala[], inicio = this.agora()): void {
    for (const item of itens) {
      const atraso = Math.max(0, inicio + (item.em ?? 0) - this.agora());
      this.agendados.push(setTimeout(() => this.entrar(item), atraso));
    }
  }

  // Laudo: entra tudo agora, toca em ordem respeitando as pausas
  sequencia(itens: ItemFala[], atrasoMs = 0): void {
    this.agendados.push(
      setTimeout(() => itens.forEach((item) => this.entrar(item)), atrasoMs),
    );
  }

  // Toca so se nada estiver no ar (lembrar_ok, regra 12)
  tocarSeLivre(fala: FalaId): void {
    if (this.atual || !this.podeFalar()) return;
    this.entrar({ fala, prioridade: "alta" });
  }

  // Tira da fila o que ainda nao tocou (convite dispensado, regra 19)
  dispensar(filtro: (item: ItemFala) => boolean): void {
    this.fila = this.fila.filter((p) => !filtro(p.item));
  }

  // Cancela tudo: agenda, fila e a fala no ar (com fade de 0,5 s ou seco)
  cancelar(comFade = true): void {
    this.agendados.forEach(clearTimeout);
    this.agendados = [];
    this.fila = [];
    if (this.espera) clearTimeout(this.espera);
    this.espera = null;
    this.interromper(comFade);
  }

  private entrar(item: ItemFala): void {
    if (!this.podeFalar()) return;
    this.fila.push({ item, prontoEm: this.agora(), ordem: this.ordem++ });
    this.tentar();
  }

  private tentar(): void {
    if (this.atual || this.fade || !this.podeFalar()) return;
    const agora = this.agora();
    // Fala de exame atrasada demais cai (regra 7)
    this.fila = this.fila.filter((p) => p.item.toleranciaMs === undefined || agora - p.prontoEm <= p.item.toleranciaMs);
    if (this.fila.length === 0) return;

    const proximo = [...this.fila].sort((a, b) => {
      const pa = a.item.prioridade === "alta" ? 0 : 1;
      const pb = b.item.prioridade === "alta" ? 0 : 1;
      return pa - pb || a.ordem - b.ordem;
    })[0];
    const pausa = Math.max(SILENCIO_MIN_MS, proximo.item.pausaAntesMs ?? 0);
    const falta = this.fimUltima + pausa - agora;
    if (falta > 0) {
      if (this.espera) clearTimeout(this.espera);
      this.espera = setTimeout(() => {
        this.espera = null;
        this.tentar();
      }, falta);
      return;
    }

    this.fila = this.fila.filter((p) => p !== proximo);
    this.iniciar(proximo.item);
  }

  private iniciar(item: ItemFala): void {
    this.atual = item;
    const encerrar = () => {
      if (this.atual !== item) return;
      this.terminar();
    };
    this.vigia = setTimeout(encerrar, VIGIA_MS);
    this.emitir({ tipo: "inicio", item });
    try {
      this.tocador.volume(1);
      this.tocador.tocar(item.fala, encerrar);
    } catch (err) {
      console.log("[voz] falha ao tocar", item.fala, err);
      encerrar();
    }
  }

  private terminar(): void {
    const item = this.atual;
    if (this.vigia) clearTimeout(this.vigia);
    this.vigia = null;
    this.atual = null;
    this.fimUltima = this.agora();
    if (item) this.emitir({ tipo: "fim", item });
    this.tentar();
  }

  private interromper(comFade: boolean): void {
    if (!this.atual) return;
    const item = this.atual;
    this.atual = null;
    if (this.vigia) clearTimeout(this.vigia);
    this.vigia = null;
    this.emitir({ tipo: "fim", item });
    const fechar = () => {
      try {
        this.tocador.parar();
      } catch {
        // tocador ja liberado
      }
      this.fimUltima = this.agora();
      this.tentar();
    };
    if (!comFade) {
      if (this.fade) clearInterval(this.fade);
      this.fade = null;
      fechar();
      return;
    }
    if (this.fade) return;
    let passo = 0;
    this.fade = setInterval(() => {
      passo += 1;
      try {
        this.tocador.volume(Math.max(0, 1 - passo / FADE_PASSOS));
      } catch {
        // ignora: o fechar abaixo para de qualquer jeito
      }
      if (passo >= FADE_PASSOS) {
        if (this.fade) clearInterval(this.fade);
        this.fade = null;
        fechar();
      }
    }, FADE_MS / FADE_PASSOS);
  }

  private emitir(ev: EventoLocutor): void {
    this.ouvintes.forEach((fn) => {
      try {
        fn(ev);
      } catch (err) {
        console.log("[voz] ouvinte falhou", err);
      }
    });
  }
}
