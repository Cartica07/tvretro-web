/**
 * El sonido de la TV en el navegador: reproduce las notas de la grabación
 * (las mismas que recibe la TV: cada {t, f} = desde el ms t suena f Hz; 0 = silencio)
 * con una onda cuadrada, como el buzzer.
 * Un solo buzzer para toda la página: si suena en un lado, se calla en el otro.
 */
type Nota = { t: number; f: number };

const VOLUMEN = 0.05;

class Buzzer {
  private audio: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private salida: GainNode | null = null;
  private inicio = 0;
  private alTerminar: (() => void) | null = null;
  private fin = 0;
  private temporizador = 0;

  get sonando() { return this.osc !== null; }

  /** Milisegundos desde que empezó la canción (el reloj del sonido), o null si no suena. */
  tiempo(): number | null {
    if (!this.audio || !this.osc) return null;
    return Math.max(0, (this.audio.currentTime - this.inicio) * 1000);
  }

  tocar(notas: Nota[], duracionMs: number, alTerminar: () => void) {
    this.detener();
    const Contexto = window.AudioContext || (window as any).webkitAudioContext;
    this.audio ??= new Contexto();
    const a = this.audio;
    void a.resume();
    this.alTerminar = alTerminar;

    this.salida = a.createGain();
    this.salida.gain.value = 0;
    const filtro = a.createBiquadFilter(); // suaviza un poco para audífonos
    filtro.type = 'lowpass';
    filtro.frequency.value = 4500;
    this.salida.connect(filtro).connect(a.destination);
    this.osc = a.createOscillator();
    this.osc.type = 'square';
    this.osc.connect(this.salida);

    this.inicio = a.currentTime + 0.1;
    for (const n of notas) {
      const t = this.inicio + n.t / 1000;
      if (n.f > 0) {
        this.osc.frequency.setValueAtTime(n.f, t);
        this.salida.gain.setValueAtTime(VOLUMEN, t);
      } else {
        this.salida.gain.setValueAtTime(0, t);
      }
    }
    this.fin = this.inicio + duracionMs / 1000;
    this.salida.gain.setValueAtTime(0, this.fin);
    this.osc.start(this.inicio);
    this.osc.stop(this.fin + 0.05);
    this.temporizador = window.setTimeout(() => this.detener(), (this.fin - a.currentTime) * 1000 + 150);
  }

  detener() {
    if (!this.osc) return;
    clearTimeout(this.temporizador);
    try { this.osc.stop(); } catch { /* ya estaba detenido */ }
    this.osc.disconnect();
    this.salida?.disconnect();
    this.osc = null;
    this.salida = null;
    const aviso = this.alTerminar;
    this.alTerminar = null;
    aviso?.();
  }
}

export const buzzer = new Buzzer();
