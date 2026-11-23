/**
 * La pantallita de la web, dibujada con el MISMO código de la app TV RETRO
 * (src/app-tvretro/, copiado sin cambios). Lo que no es del renderer —los
 * bucles de scroll, de animación y de canción— está copiado de js/main.js de
 * la app con los mismos tiempos (VELOCIDAD_SCROLL = 40 px/s, scroll vertical
 * a 12 px/s con 1 s de pausa, cada cuadro del GIF con su duración, y cada
 * pantalla de la canción en su milisegundo).
 */
import { dibujarOLED, medirBloqueTexto } from '../../app-tvretro/renderer.js';
import { esFuenteVariable, anchoScrollFuente } from '../../app-tvretro/fuentesTexto.js';
import { calcularAnchoTexto } from '../../app-tvretro/fonts.js';

export type EstadoTexto = {
  texto: string;
  tamano?: number;
  fuente?: 'sans' | 'sansb' | 'serif' | 'serifi' | 'clasica';
  modoTexto?: 'ajustar' | 'scroll';
  direccion?: 'h' | 'v';
  invertido?: boolean;
  alineacion?: 'izquierda' | 'centro' | 'derecha';
  alineacionV?: 'arriba' | 'centro';
};
export type Cuadro = { datos: string; dur: number };
export type Grabacion = { notas: { t: number; f: number }[]; cuadros: { t: number; bitmap: Uint8Array }[]; duracion: number; repetir: boolean };

/** Los valores con los que arranca la app (estadoActual de main.js). */
export const ESTADO_APP = {
  tipo: 'texto',
  texto: 'Bienvenido',
  tamano: 2,
  alineacion: 'centro',
  alineacionV: 'centro',
  invertido: false,
  modoTexto: 'ajustar',
  fuente: 'sans',
  manual: false,
  x: 0,
  y: 0,
  direccion: 'h',
  imagenData: '',
  imagenAncho: 0,
  imagenAlto: 0,
};

const ANCHO_OLED = 128;
const VELOCIDAD_SCROLL = 40; // px/segundo (main.js)
const VELOCIDAD_SCROLL_V = 12; // px/segundo (main.js)
const PAUSA_INICIO_V_MS = 1000;
const PAUSA_FIN_V_MS = 1000;

/** Bitmap 1bpp → Base64, como bitmapABase64 de main.js. */
const cacheB64 = new WeakMap<Uint8Array, string>();
export function bitmapABase64(bitmap: Uint8Array) {
  let b64 = cacheB64.get(bitmap);
  if (!b64) {
    let s = '';
    for (let i = 0; i < bitmap.length; i++) s += String.fromCharCode(bitmap[i]);
    b64 = btoa(s);
    cacheB64.set(bitmap, b64);
  }
  return b64;
}

export class PantallaApp {
  private raf = 0;
  private temporizador = 0;
  private turno = 0;

  constructor(public canvas: HTMLCanvasElement) {
    canvas.width = 128;
    canvas.height = 64;
    dibujarOLED(canvas, { ...ESTADO_APP, texto: '' });
  }

  /** Corta cualquier scroll, animación o canción en curso. */
  detener() {
    cancelAnimationFrame(this.raf);
    clearTimeout(this.temporizador);
    this.turno++;
  }

  /** Texto, igual que la pestaña Texto de la app (Ajustar, Scroll ↔ o Scroll ↕). */
  texto(parcial: EstadoTexto, animar = true) {
    this.detener();
    const estado = { ...ESTADO_APP, ...parcial, tipo: 'texto' };
    if (estado.modoTexto !== 'scroll' || !animar) {
      dibujarOLED(this.canvas, estado, estado.modoTexto === 'scroll' ? (estado.direccion === 'v' ? 0 : 0) : null);
      return;
    }
    if (estado.direccion === 'v') this.scrollVertical(estado);
    else this.scrollHorizontal(estado);
  }

  // Copia de iniciarScroll() de main.js.
  private scrollHorizontal(estado: typeof ESTADO_APP) {
    const mio = this.turno;
    let scrollX = ANCHO_OLED;
    let ultimoTs: number | null = null;
    let ultimoDibujado: number | null = null;
    const anchoTexto = esFuenteVariable(estado.fuente) ? anchoScrollFuente(estado) : calcularAnchoTexto(estado.texto, estado.tamano);
    const frame = (ts: number) => {
      if (mio !== this.turno) return;
      if (ultimoTs === null) ultimoTs = ts;
      const dt = (ts - ultimoTs) / 1000;
      ultimoTs = ts;
      scrollX -= VELOCIDAD_SCROLL * dt;
      if (scrollX < -anchoTexto) scrollX = ANCHO_OLED;
      const clave = Math.round(scrollX);
      if (clave !== ultimoDibujado) {
        dibujarOLED(this.canvas, estado, scrollX);
        ultimoDibujado = clave;
      }
      this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  }

  // Copia de iniciarScrollVertical() de main.js.
  private scrollVertical(estado: typeof ESTADO_APP) {
    const mio = this.turno;
    const bloque = medirBloqueTexto(estado);
    const distancia = Math.max(0, bloque.alto - 64);
    if (distancia === 0) { dibujarOLED(this.canvas, estado, 0); return; }
    const recorridoMs = (distancia / VELOCIDAD_SCROLL_V) * 1000;
    const cicloMs = PAUSA_INICIO_V_MS + recorridoMs + PAUSA_FIN_V_MS;
    let inicio: number | null = null;
    let ultimo: number | null = null;
    const frame = (ts: number) => {
      if (mio !== this.turno) return;
      if (inicio === null) inicio = ts;
      const t = (ts - inicio) % cicloMs;
      let desplazamiento = 0;
      if (t > PAUSA_INICIO_V_MS) desplazamiento = Math.min(distancia, Math.floor((distancia * (t - PAUSA_INICIO_V_MS)) / recorridoMs));
      if (desplazamiento !== ultimo) { dibujarOLED(this.canvas, estado, desplazamiento); ultimo = desplazamiento; }
      this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  }

  /** Imagen 1bpp de 128×64 en Base64 (lo que devuelve procesarImagenConOpciones). */
  imagen(datos: string, invertido = false) {
    this.detener();
    dibujarOLED(this.canvas, { ...ESTADO_APP, tipo: 'imagen', invertido, imagenData: datos, imagenAncho: 128, imagenAlto: 64 });
  }

  /** GIF / animación en bucle: copia de iniciarAnimacionPreview() de main.js. */
  animacion(cuadros: Cuadro[], invertido = false) {
    this.detener();
    if (!cuadros.length) return;
    const mio = this.turno;
    let i = 0;
    const paso = () => {
      if (mio !== this.turno) return;
      const c = cuadros[i];
      dibujarOLED(this.canvas, { ...ESTADO_APP, tipo: 'imagen', invertido, imagenData: c.datos, imagenAncho: 128, imagenAlto: 64 });
      i = (i + 1) % cuadros.length;
      this.temporizador = window.setTimeout(paso, c.dur);
    };
    paso();
  }

  /**
   * Canción con letra: copia de iniciarPreviewMusical() de main.js. Cada
   * pantalla aparece en su milisegundo. Con reloj, el tiempo lo marca el
   * sonido (así letra y música no se separan nunca).
   */
  musical(grab: Grabacion, reloj?: () => number | null, alTerminar?: () => void) {
    this.detener();
    if (!grab.cuadros.length) return;
    const mio = this.turno;
    const inicio = performance.now();
    const duracion = Math.max(1, grab.duracion);
    let dibujado = -1;
    const paso = () => {
      if (mio !== this.turno) return;
      const r = reloj ? reloj() : null;
      let t = r ?? performance.now() - inicio;
      const termino = !grab.repetir || reloj ? t >= duracion : false;
      if (grab.repetir && !reloj) t %= duracion;
      else t = Math.min(t, duracion);
      let k = 0;
      while (k + 1 < grab.cuadros.length && grab.cuadros[k + 1].t <= t) k++;
      if (k !== dibujado) {
        dibujado = k;
        dibujarOLED(this.canvas, { ...ESTADO_APP, tipo: 'imagen', invertido: false, imagenData: bitmapABase64(grab.cuadros[k].bitmap), imagenAncho: 128, imagenAlto: 64 });
      }
      if (termino) { alTerminar?.(); return; }
      const siguiente = k + 1 < grab.cuadros.length ? grab.cuadros[k + 1].t : duracion;
      this.temporizador = window.setTimeout(paso, Math.max(10, Math.min(reloj ? 30 : 250, siguiente - t)));
    };
    paso();
  }
}
