/**
 * Sonido tipo "buzzer", como el de la TV: una onda cuadrada que salta de nota
 * en nota. Cada nota suena el 80 % de su tiempo y deja una pausita, igual que
 * las canciones de la TV.
 *
 * La melodía de muestra es "Cumpleaños feliz" (melodía de dominio público).
 */

export type Nota = [frecuencia: number, tiempos: number];
export type EstadoMusica = { avance: number; posicionTono: number; sonando: boolean };

// Frecuencias en Hz (0 = silencio).
const G4 = 392, A4 = 440, B4 = 493.88, C5 = 523.25, D5 = 587.33, E5 = 659.25, F5 = 698.46, G5 = 783.99;

export const CUMPLEANOS: Nota[] = [
  [G4, 0.75], [G4, 0.25], [A4, 1], [G4, 1], [C5, 1], [B4, 2],
  [G4, 0.75], [G4, 0.25], [A4, 1], [G4, 1], [D5, 1], [C5, 2],
  [G4, 0.75], [G4, 0.25], [G5, 1], [E5, 1], [C5, 1], [B4, 1], [A4, 2],
  [F5, 0.75], [F5, 0.25], [E5, 1], [C5, 1], [D5, 1], [C5, 2.5],
];

const SEGUNDOS_POR_TIEMPO = 0.42;
const ARTICULACION = 0.8;
const VOLUMEN = 0.06;

export class Buzzer {
  private audio: AudioContext | null = null;
  private salida: GainNode | null = null;
  private osc: OscillatorNode | null = null;
  private inicio = 0;
  private marcas: { t: number; fin: number; f: number }[] = [];
  private duracion = 0;
  private fMin = 0;
  private fMax = 1;
  private temporizador = 0;

  get sonando() { return this.osc !== null; }

  tocar(notas: Nota[], alTerminar: () => void) {
    this.detener();
    const Contexto = window.AudioContext || (window as any).webkitAudioContext;
    this.audio ??= new Contexto();
    const a = this.audio;
    void a.resume();

    this.salida = a.createGain();
    this.salida.gain.value = 0;
    // Un filtro suave para que no maltrate los oídos en audífonos.
    const filtro = a.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.frequency.value = 3800;
    this.salida.connect(filtro).connect(a.destination);

    this.osc = a.createOscillator();
    this.osc.type = 'square';
    this.osc.connect(this.salida);

    const frecuencias = notas.map((n) => n[0]).filter(Boolean);
    this.fMin = Math.min(...frecuencias);
    this.fMax = Math.max(...frecuencias);

    this.inicio = a.currentTime + 0.08;
    let t = this.inicio;
    this.marcas = [];
    for (const [f, tiempos] of notas) {
      const dur = tiempos * SEGUNDOS_POR_TIEMPO;
      const fin = t + dur * ARTICULACION;
      if (f > 0) {
        this.osc.frequency.setValueAtTime(f, t);
        this.salida.gain.setValueAtTime(VOLUMEN, t);
        this.salida.gain.setValueAtTime(0, fin);
      }
      this.marcas.push({ t, fin, f });
      t += dur;
    }
    this.duracion = t - this.inicio;
    this.osc.start(this.inicio);
    this.osc.stop(t + 0.05);
    this.osc.onended = () => { if (this.osc) { this.limpiar(); alTerminar(); } };
    // Respaldo por si el navegador no avisa el final.
    this.temporizador = window.setTimeout(() => { if (this.osc) { this.limpiar(); alTerminar(); } }, (t - a.currentTime + 0.4) * 1000);
  }

  detener() {
    if (!this.osc) return;
    try { this.osc.onended = null; this.osc.stop(); } catch { /* ya estaba detenido */ }
    this.limpiar();
  }

  private limpiar() {
    clearTimeout(this.temporizador);
    this.osc?.disconnect();
    this.salida?.disconnect();
    this.osc = null;
    this.salida = null;
  }

  /** Qué está sonando ahora mismo (para que la pantallita baile al ritmo). */
  estado(): EstadoMusica | null {
    if (!this.audio || !this.osc) return null;
    const ahora = this.audio.currentTime;
    const nota = this.marcas.find((m) => ahora >= m.t && ahora < m.fin);
    const f = nota?.f ?? 0;
    return {
      avance: Math.min(1, Math.max(0, (ahora - this.inicio) / this.duracion)),
      posicionTono: f ? (f - this.fMin) / (this.fMax - this.fMin || 1) : 0.5,
      sonando: !!nota && f > 0,
    };
  }
}
