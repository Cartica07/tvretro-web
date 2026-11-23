/**
 * Escenas de "Mira lo que puede mostrar": una pequeña muestra por cada tipo
 * de contenido, dibujada con la misma letra y resolución de la TV.
 */
import { calcularAnchoTexto } from './fuente5x7.js';
import { aTV, acomodar, CORAZON, NOTA, escenaEscribir, escenaDibujo, escenaReloj, type Escena, type PantallaPixel } from './pantalla';
import type { EstadoMusica } from './sonido';

const W = 128;
const H = 64;

/* ---------------- Mensajes ---------------- */

/** Texto grande que pasa de derecha a izquierda. */
export function escenaDesplazar(texto: string, tam = 3): Escena {
  const t2 = aTV(texto);
  const ancho = calcularAnchoTexto(t2, tam);
  const velocidad = 0.075; // puntos por milisegundo
  return {
    dura: (W + ancho) / velocidad,
    dibujar(p, t) {
      p.texto(t2, tam, Math.round(W - t * velocidad), Math.round((H - 7 * tam) / 2));
    },
  };
}

/** Mensaje con los colores invertidos. */
export function escenaInvertida(texto: string): Escena {
  const { tam, lineas } = acomodar(aTV(texto));
  return {
    dura: 2800,
    dibujar(p) {
      p.invertido = true;
      let y = Math.round((H - lineas.length * 8 * tam) / 2);
      for (const l of lineas) { p.textoCentrado(l, tam, y); y += 8 * tam; }
    },
  };
}

/* ---------------- Fotos ---------------- */

/**
 * Una "foto" (atardecer en el mar) pasada a puntos con el mismo método que usa
 * la app (difuminado Atkinson). Se revela de arriba abajo, como cuando llega.
 */
export function escenaFoto(): Escena {
  const gris = new Float32Array(W * H);
  const horizonte = 40;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dSol = Math.hypot(x - 90, y - 26);
      // cerros oscuros a la izquierda, uno más bajo a la derecha
      const cerro = x < 70
        ? 16 + (x / 70) ** 2 * 26 + 2.5 * Math.sin(x / 4)
        : 46 - Math.max(0, x - 106) * 0.6;
      let v: number;
      if (y < horizonte) {
        v = 55 + (y / horizonte) ** 1.2 * 150 + Math.max(0, 80 - dSol * 2.6);
        if (dSol < 9) v = 255;
        if (y > cerro) v = 10;
      } else {
        const fila = y - horizonte;
        const ancho = 11 - fila * 0.35;
        const reflejo = Math.abs(x - 90) < ancho && fila % 3 !== 2;
        v = reflejo ? 215 - fila * 4 : 95 - fila * 4;
      }
      gris[y * W + x] = Math.max(0, Math.min(255, v));
    }
  }
  // Atkinson: reparte 1/8 del error a 6 vecinos.
  const bits = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const nuevo = gris[i] > 128 ? 255 : 0;
      bits[i] = nuevo ? 1 : 0;
      const e = (gris[i] - nuevo) / 8;
      for (const [dx, dy] of [[1, 0], [2, 0], [-1, 1], [0, 1], [1, 1], [0, 2]]) {
        const xx = x + dx, yy = y + dy;
        if (xx >= 0 && xx < W && yy < H) gris[yy * W + xx] += e;
      }
    }
  }
  return {
    dura: 4800,
    dibujar(p, t) {
      const filas = Math.min(H, Math.floor((t / 1300) * H));
      for (let y = 0; y < filas; y++) for (let x = 0; x < W; x++) if (bits[y * W + x]) p.pixel(x, y);
      if (filas < H) p.rect(0, filas, W, 1); // la línea que va "cargando"
    },
  };
}

/* ---------------- Dibujos ---------------- */

/** Una carita feliz hecha a mano, trazo a trazo. */
export function escenaCarita(): Escena {
  const trazos: [number, number][][] = [];
  const circulo = (cx: number, cy: number, r: number, a0 = 0, a1 = Math.PI * 2, n = 90) => {
    const t: [number, number][] = [];
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      // un temblorcito para que parezca hecho con el dedo
      const w = Math.sin(i * 1.7) * 0.6;
      t.push([cx + Math.cos(a) * (r + w), cy + Math.sin(a) * (r + w)]);
    }
    return t;
  };
  trazos.push(circulo(64, 31, 26));
  trazos.push(circulo(54, 24, 3, 0, Math.PI * 2, 16));
  trazos.push(circulo(74, 24, 3, 0, Math.PI * 2, 16));
  trazos.push(circulo(64, 32, 14, Math.PI * 0.15, Math.PI * 0.85, 30));
  const total = trazos.reduce((n, t) => n + t.length, 0);
  return {
    dura: 4200,
    dibujar(p, t) {
      let quedan = Math.floor((t / 2400) * total);
      for (const trazo of trazos) {
        for (const [x, y] of trazo) {
          if (quedan-- <= 0) return;
          p.rect(x, y, 2, 2);
        }
      }
    },
  };
}

/* ---------------- GIF y animaciones ---------------- */

const CORAZON_GRANDE = [
  '.XX...XX.',
  'XXXX.XXXX',
  'XXXXXXXXX',
  'XXXXXXXXX',
  '.XXXXXXX.',
  '..XXXXX..',
  '...XXX...',
  '....X....',
];

/** Un corazón que late con brillitos girando alrededor (como un GIF en bucle). */
export function escenaGif(): Escena {
  return {
    dura: 5000,
    dibujar(p, t) {
      const latido = Math.floor(t / 280) % 4;
      const s = latido === 1 ? 5 : 4;
      const ox = Math.round(64 - (9 * s) / 2);
      const oy = Math.round(32 - (8 * s) / 2);
      CORAZON_GRANDE.forEach((fila, y) => {
        for (let x = 0; x < fila.length; x++) if (fila[x] === 'X') p.rect(ox + x * s, oy + y * s, s, s);
      });
      for (let i = 0; i < 8; i++) {
        const a = t / 700 + (i * Math.PI) / 4;
        const x = 64 + Math.cos(a) * 52;
        const y = 32 + Math.sin(a) * 26;
        if ((Math.floor(t / 150) + i) % 3 !== 0) {
          p.rect(x, y - 1, 1, 3);
          p.rect(x - 1, y, 3, 1);
        }
      }
    },
  };
}

/* ---------------- Canciones ---------------- */

/**
 * Canción con letra: mientras suena, cambian las frases y las imágenes al ritmo.
 * Las frases son nuestras (no son la letra de ninguna canción).
 */
export function escenaCancionConLetra(
  titulo: string,
  frases: { desde: number; texto: string }[],
  musica?: () => EstadoMusica | null,
): Escena {
  return {
    dura: 6000,
    dibujar(p, t) {
      const estado = musica?.() ?? null;
      const indice = estado ? estado.indice : Math.floor(t / 250);
      let frase = frases[0];
      for (const f of frases) if (indice >= f.desde) frase = f;
      if (!estado) frase = frases[Math.floor(t / 1500) % frases.length];

      p.texto(NOTA + ' ' + titulo, 1, 2, 2);
      const { tam, lineas } = acomodar(aTV(frase.texto));
      const alto = lineas.length * 8 * tam;
      let y = 12 + Math.round((38 - alto) / 2);
      for (const l of lineas) { p.textoCentrado(l, tam, y); y += 8 * tam; }

      // Barras pequeñas abajo, siguiendo el tono.
      for (let i = 0; i < 16; i++) {
        const centro = (estado?.posicionTono ?? (Math.sin(t / 300) + 1) / 2) * 15;
        const fuerza = estado ? (estado.sonando ? 1 : 0.2) : 0.6;
        const alto2 = Math.max(1, Math.round((8 - Math.abs(i - centro) * 1.1) * fuerza + Math.random() * 2));
        p.rect(4 + i * 8, 62 - alto2, 6, alto2);
      }
    },
  };
}

/* ---------------- Reloj y alarmas ---------------- */

/** La alarma sonando: la hora parpadea y la pantalla se invierte. */
export function escenaAlarma(): Escena {
  return {
    dura: 3600,
    dibujar(p, t) {
      const golpe = Math.floor(t / 300) % 2 === 0;
      p.invertido = golpe;
      p.textoCentrado('06:30', 3, 8);
      p.textoCentrado(`${NOTA} ¡A despertar! ${NOTA}`, 1, 44);
    },
  };
}

/* ---------------- Listas por pestaña ---------------- */

export function escenasDe(tipo: string, mensajes: string[]): Escena[] {
  switch (tipo) {
    case 'mensajes':
      return [
        escenaEscribir(mensajes[0] ?? '¡Hola!'),
        escenaDesplazar(mensajes[1] ?? 'Te quiero mucho'),
        escenaInvertida(`Te quiero ${CORAZON}`),
      ];
    case 'fotos':
      return [escenaFoto()];
    case 'dibujos':
      return [escenaCarita(), escenaDibujo()];
    case 'gif':
      return [escenaGif()];
    case 'canciones':
      return [escenaCancionConLetra('Cumpleaños feliz', FRASES_CUMPLE)];
    case 'reloj':
      return [escenaReloj(), escenaAlarma()];
    default:
      return [escenaEscribir('¡Hola!')];
  }
}

/** Frases propias que acompañan "Cumpleaños feliz" (índice de la nota donde empiezan). */
export const FRASES_CUMPLE = [
  { desde: 0, texto: '¡Feliz cumple! ♥' },
  { desde: 6, texto: 'Que la pases bonito' },
  { desde: 12, texto: '¡Pide un deseo!' },
  { desde: 19, texto: '¡A celebrar! ♫' },
];
