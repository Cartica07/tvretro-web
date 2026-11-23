/**
 * Pantallita de la portada: simula la pantalla de 128×64 puntos de la TV RETRO
 * con la MISMA letra 5×7 que usa la TV (copiada de la app: fuente5x7.js).
 * Cada punto encendido se dibuja como un cuadrito, para que se vea como la real.
 */
import { dibujarTextoBitmap, dividirEnLineas, calcularAnchoTexto } from './fuente5x7.js';
import type { EstadoMusica } from './sonido';

const W = 128;
const H = 64;
const ESCALA = 4; // cada punto ocupa 4×4 px del lienzo…
const PUNTO = 3; // …y se pinta de 3×3 (queda la rejilla entre puntos)

const NOTA = String.fromCharCode(0x0e); // ♫ de la letra de la TV
const CORAZON = String.fromCharCode(0x03); // ♥

export class PantallaPixel {
  private buf = new Uint8Array(W * H);
  private ctx: CanvasRenderingContext2D;
  private rejilla: HTMLCanvasElement;
  private lapiz = {
    fillStyle: '',
    fillRect: (x: number, y: number, w: number, h: number) => this.rect(x, y, w, h),
  };

  constructor(private canvas: HTMLCanvasElement, private color: string) {
    canvas.width = W * ESCALA;
    canvas.height = H * ESCALA;
    this.ctx = canvas.getContext('2d')!;
    // Puntos apagados, apenas visibles: se dibujan una sola vez.
    this.rejilla = document.createElement('canvas');
    this.rejilla.width = canvas.width;
    this.rejilla.height = canvas.height;
    const r = this.rejilla.getContext('2d')!;
    r.fillStyle = '#05080B';
    r.fillRect(0, 0, canvas.width, canvas.height);
    r.fillStyle = 'rgba(77, 210, 255, 0.045)';
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) r.fillRect(x * ESCALA, y * ESCALA, PUNTO, PUNTO);
  }

  limpiar() { this.buf.fill(0); }

  pixel(x: number, y: number) {
    x = Math.round(x); y = Math.round(y);
    if (x >= 0 && x < W && y >= 0 && y < H) this.buf[y * W + x] = 1;
  }

  rect(x: number, y: number, w: number, h: number) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.pixel(x + i, y + j);
  }

  texto(t: string, tamano: number, x: number, y: number) {
    dibujarTextoBitmap(this.lapiz, t, tamano, x, y, '');
  }

  textoCentrado(t: string, tamano: number, y: number) {
    this.texto(t, tamano, Math.max(0, Math.round((W - calcularAnchoTexto(t, tamano)) / 2)), y);
  }

  pintar() {
    const c = this.ctx;
    c.drawImage(this.rejilla, 0, 0);
    c.fillStyle = this.color;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (this.buf[y * W + x]) c.fillRect(x * ESCALA, y * ESCALA, PUNTO, PUNTO);
      }
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Escenas: cada una sabe cuánto dura y cómo se ve en el instante t.  */
/* ------------------------------------------------------------------ */

type Escena = { dura: number; dibujar: (p: PantallaPixel, t: number) => void };

/** Elige el tamaño de letra más grande con el que el mensaje cabe. */
function acomodar(texto: string) {
  for (const tam of [2, 1]) {
    const lineas = dividirEnLineas(texto, tam, W - 8);
    if (lineas.length * 8 * tam <= H - 8) return { tam, lineas };
  }
  return { tam: 1, lineas: dividirEnLineas(texto, 1, W - 8).slice(0, 7) };
}

/** La TV escribe un mensaje letra por letra, con cursor. */
export function escenaEscribir(texto: string): Escena {
  const { tam, lineas } = acomodar(texto);
  const total = lineas.reduce((n, l) => n + l.length, 0);
  const paso = 85;
  return {
    dura: total * paso + 2200,
    dibujar(p, t) {
      let quedan = Math.min(total, Math.floor(t / paso));
      const alto = lineas.length * 8 * tam;
      let y = Math.round((H - alto) / 2);
      let cursor: [number, number] | null = null;
      for (const linea of lineas) {
        const visible = linea.slice(0, Math.max(0, quedan));
        const x = Math.round((W - calcularAnchoTexto(linea, tam)) / 2);
        p.texto(visible, tam, x, y);
        if (quedan >= 0 && quedan <= linea.length) cursor = [x + visible.length * 6 * tam, y];
        quedan -= linea.length;
        y += 8 * tam;
      }
      if (cursor && Math.floor(t / 400) % 2 === 0) p.rect(cursor[0], cursor[1], 5 * tam, 7 * tam);
    },
  };
}

/** Un corazón dibujado "a mano", trazo a trazo. */
export function escenaDibujo(): Escena {
  const puntos: [number, number][] = [];
  for (let i = 0; i <= 220; i++) {
    const a = (i / 220) * Math.PI * 2;
    const x = 16 * Math.sin(a) ** 3;
    const y = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a);
    puntos.push([64 + x * 1.45, 27 - y * 1.45]);
  }
  return {
    dura: 4200,
    dibujar(p, t) {
      const hasta = Math.min(puntos.length, Math.floor((t / 2200) * puntos.length));
      for (let i = 0; i < hasta; i++) {
        const [x, y] = puntos[i];
        p.rect(x, y, 2, 2);
      }
      if (t > 2400) p.textoCentrado('Para ti ' + CORAZON, 1, 54);
    },
  };
}

/** Reloj con fecha y alarma, con la hora real de quien visita la página. */
export function escenaReloj(): Escena {
  const dias = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return {
    dura: 4000,
    dibujar(p, t) {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      const dos = Math.floor(t / 500) % 2 === 0 ? ':' : ' ';
      p.textoCentrado(hh + dos + mm, 3, 8);
      p.textoCentrado(`${dias[d.getDay()]} ${d.getDate()} ${meses[d.getMonth()]}`, 1, 38);
      p.textoCentrado(`${NOTA} Alarma 6:30`, 1, 52);
    },
  };
}

/** Canción sonando: título, barras que bailan y avance. */
export function escenaMusica(titulo: string, musica?: () => EstadoMusica | null): Escena {
  const alturas = new Float32Array(16);
  return {
    dura: 4500,
    dibujar(p, t) {
      p.texto(NOTA + ' ' + titulo, 1, 2, 2);
      const estado = musica?.() ?? null;
      for (let i = 0; i < 16; i++) {
        let objetivo: number;
        if (estado) {
          // Las barras siguen la nota que suena: más alto donde está el tono.
          const centro = estado.posicionTono * 15;
          const fuerza = estado.sonando ? 1 : 0.15;
          objetivo = (26 - Math.abs(i - centro) * 3.2) * fuerza + Math.random() * 4;
        } else {
          objetivo = 6 + 16 * Math.abs(Math.sin(t / 260 + i * 0.7) * Math.cos(t / 410 + i * 0.3));
        }
        alturas[i] += (Math.max(2, objetivo) - alturas[i]) * 0.45;
        const alto = Math.round(alturas[i]);
        p.rect(4 + i * 8, 50 - alto, 6, alto);
      }
      const avance = estado ? estado.avance : (t % 4500) / 4500;
      p.rect(4, 56, 120, 1);
      p.rect(4, 55, Math.round(120 * avance), 3);
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Reproductor de escenas                                              */
/* ------------------------------------------------------------------ */

export class Programacion {
  private indice = 0;
  private inicio = 0;
  private especial: Escena | null = null;
  private corriendo = false;
  private ultimo = 0;
  private raf = 0;

  constructor(private p: PantallaPixel, private escenas: Escena[], private estatica: boolean) {}

  /** Muestra una escena fuera de la lista (la canción) hasta que se llame a soltar(). */
  fijar(e: Escena) { this.especial = e; this.inicio = performance.now(); this.dibujarYa(); }
  soltar() { this.especial = null; this.siguiente(); }

  iniciar() {
    if (this.corriendo) return;
    this.corriendo = true;
    this.inicio = performance.now();
    const bucle = (ahora: number) => {
      if (!this.corriendo) return;
      this.raf = requestAnimationFrame(bucle);
      if (ahora - this.ultimo < 50) return; // ~20 cuadros por segundo, como la TV
      this.ultimo = ahora;
      this.cuadro(ahora);
    };
    this.raf = requestAnimationFrame(bucle);
  }

  detener() { this.corriendo = false; cancelAnimationFrame(this.raf); }

  dibujarYa() { this.cuadro(performance.now()); }

  private siguiente() { this.indice = (this.indice + 1) % this.escenas.length; this.inicio = performance.now(); }

  private cuadro(ahora: number) {
    const escena = this.especial ?? this.escenas[this.indice];
    let t = ahora - this.inicio;
    if (this.estatica && !this.especial) t = escena.dura - 1; // sin animación: el cuadro final
    if (!this.especial && !this.estatica && t >= escena.dura) {
      this.siguiente();
      t = 0;
    }
    this.p.limpiar();
    // Un instante en negro entre escenas, como cuando la TV cambia de contenido.
    if (this.especial || this.estatica || t > 140) escena.dibujar(this.p, Math.max(0, t - 140));
    this.p.pintar();
  }
}
