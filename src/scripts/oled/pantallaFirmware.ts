/**
 * Pantallas que dibuja el FIRMWARE (no la app): el reloj y la alarma sonando.
 * Copia línea por línea de Firmware-TV-RETRO (OLED_Remota/pantalla.cpp →
 * mostrarReloj, y alarma.cpp → dibujar), con las mismas rutinas de Adafruit GFX
 * (línea, rectángulo, círculo) y la misma letra clásica 5×7.
 * El resultado se pinta con el renderer de la app, como cualquier imagen.
 */
import { dibujarTextoBitmap } from '../../app-tvretro/fonts.js';
import { bitmapABase64, type PantallaApp } from './pantallaApp';

const ANCHO = 128;
const ALTO = 64;

class Gfx {
  buf = new Uint8Array(1024);
  limpiar() { this.buf.fill(0); }
  pixel(x: number, y: number) {
    if (x < 0 || x >= ANCHO || y < 0 || y >= ALTO) return;
    this.buf[y * 16 + (x >> 3)] |= 0x80 >> (x & 7);
  }
  vline(x: number, y: number, h: number) { for (let i = 0; i < h; i++) this.pixel(x, y + i); }
  hline(x: number, y: number, w: number) { for (let i = 0; i < w; i++) this.pixel(x + i, y); }
  fillRect(x: number, y: number, w: number, h: number) { for (let i = 0; i < w; i++) this.vline(x + i, y, h); }
  drawRect(x: number, y: number, w: number, h: number) {
    this.hline(x, y, w); this.hline(x, y + h - 1, w); this.vline(x, y, h); this.vline(x + w - 1, y, h);
  }
  // Adafruit_GFX::writeLine (Bresenham)
  drawLine(x0: number, y0: number, x1: number, y1: number) {
    const empinada = Math.abs(y1 - y0) > Math.abs(x1 - x0);
    if (empinada) { [x0, y0] = [y0, x0]; [x1, y1] = [y1, x1]; }
    if (x0 > x1) { [x0, x1] = [x1, x0]; [y0, y1] = [y1, y0]; }
    const dx = x1 - x0, dy = Math.abs(y1 - y0);
    let err = Math.trunc(dx / 2);
    const paso = y0 < y1 ? 1 : -1;
    for (; x0 <= x1; x0++) {
      if (empinada) this.pixel(y0, x0); else this.pixel(x0, y0);
      err -= dy;
      if (err < 0) { y0 += paso; err += dx; }
    }
  }
  // Adafruit_GFX::drawCircle
  drawCircle(x0: number, y0: number, r: number) {
    let f = 1 - r, ddx = 1, ddy = -2 * r, x = 0, y = r;
    this.pixel(x0, y0 + r); this.pixel(x0, y0 - r); this.pixel(x0 + r, y0); this.pixel(x0 - r, y0);
    while (x < y) {
      if (f >= 0) { y--; ddy += 2; f += ddy; }
      x++; ddx += 2; f += ddx;
      this.pixel(x0 + x, y0 + y); this.pixel(x0 - x, y0 + y); this.pixel(x0 + x, y0 - y); this.pixel(x0 - x, y0 - y);
      this.pixel(x0 + y, y0 + x); this.pixel(x0 - y, y0 + x); this.pixel(x0 + y, y0 - x); this.pixel(x0 - y, y0 - x);
    }
  }
  // Adafruit_GFX::fillCircle + fillCircleHelper
  fillCircle(x0: number, y0: number, r: number) {
    this.vline(x0, y0 - r, 2 * r + 1);
    let f = 1 - r, ddx = 1, ddy = -2 * r, x = 0, y = r, px = x, py = y;
    const delta = 1;
    while (x < y) {
      if (f >= 0) { y--; ddy += 2; f += ddy; }
      x++; ddx += 2; f += ddx;
      if (x < y + 1) { this.vline(x0 + x, y0 - y, 2 * y + delta); this.vline(x0 - x, y0 - y, 2 * y + delta); }
      if (y !== py) { this.vline(x0 + py, y0 - px, 2 * px + delta); this.vline(x0 - py, y0 - px, 2 * px + delta); py = y; }
      px = x;
    }
  }
  // setTextSize + setCursor + print con la letra clásica (igual que Adafruit drawChar).
  print(texto: string, x: number, y: number, tamano: number) {
    dibujarTextoBitmap({ fillStyle: '', fillRect: (a: number, b: number, w: number, h: number) => this.fillRect(a, b, w, h) }, texto, tamano, x, y, '');
  }
  // getTextBounds de la letra clásica: 6 px por carácter × tamaño, 8 de alto.
  ancho(texto: string, tamano: number) { return texto.length * 6 * tamano; }
}

const gfx = new Gfx();
const div = (a: number, b: number) => Math.trunc(a / b); // división entera de C

/** pantalla.cpp → mostrarReloj(estado, hayMensajeNuevo = false, firebaseOk = true), con Wi-Fi de 4 barras. */
export function dibujarReloj(ahora: Date, barrasSenal = 4) {
  gfx.limpiar();
  // dibujarIconoSenal
  const anchoBarra = 3, espacio = 1, alturaMax = 8;
  const xBase = ANCHO - 4 * (anchoBarra + espacio) - 2, yBase = 1;
  for (let i = 0; i < 4; i++) {
    const alturaBarra = div(alturaMax * (i + 1), 4);
    const x = xBase + i * (anchoBarra + espacio);
    const y = yBase + (alturaMax - alturaBarra);
    if (i < barrasSenal) gfx.fillRect(x, y, anchoBarra, alturaBarra);
    else gfx.drawRect(x, y, anchoBarra, alturaBarra);
  }
  // dibujarIconoFirebase(true)
  gfx.fillCircle(ANCHO - 26, 5, 3);

  const h = ahora.getHours();
  const hora12 = h % 12 === 0 ? 12 : h % 12;
  const hora = `${hora12}:${String(ahora.getMinutes()).padStart(2, '0')}`;
  const fecha = `${String(ahora.getDate()).padStart(2, '0')}/${String(ahora.getMonth() + 1).padStart(2, '0')}/${ahora.getFullYear()}`;
  gfx.print(h < 12 ? 'AM' : 'PM', 2, 1, 1);
  gfx.print(hora, div(ANCHO - gfx.ancho(hora, 3), 2), 24, 3);
  gfx.print(fecha, div(ANCHO - gfx.ancho(fecha, 1), 2), 54, 1);
  return bitmapABase64(gfx.buf.slice());
}

/** alarma.cpp → dibujar(ahora, invertir). */
export function dibujarAlarma(ahora: Date) {
  gfx.limpiar();
  const h = ahora.getHours();
  const hora12 = h % 12 === 0 ? 12 : h % 12;
  const hora = `${hora12}:${String(ahora.getMinutes()).padStart(2, '0')}`;
  const ampm = h < 12 ? 'AM' : 'PM';
  gfx.print('ALARMA', 28, 2, 2);
  const anchoHora = gfx.ancho(hora, 3);
  const anchoAmPm = gfx.ancho(ampm, 2);
  const inicio = Math.max(0, div(ANCHO - (anchoHora + 4 + anchoAmPm), 2));
  gfx.print(hora, inicio, 24, 3);
  gfx.print(ampm, inicio + anchoHora + 4, 32, 2);
  gfx.print('A:parar  Rueda:+5min', 4, 56, 1);
  return bitmapABase64(gfx.buf.slice());
}

/**
 * Pestaña Reloj: el reloj (se redibuja cada segundo, INTERVALO_HORA_MS) y,
 * cada tanto, la alarma sonando (se invierte cada 500 ms, como en la TV).
 * Devuelve una función para detenerlo.
 */
export function mostrarRelojYAlarma(pantalla: PantallaApp): () => void {
  pantalla.detener();
  let vivo = true;
  let id = 0;
  const RELOJ_MS = 6000, ALARMA_MS = 4000;
  const inicio = performance.now();
  const paso = () => {
    if (!vivo) return;
    const t = (performance.now() - inicio) % (RELOJ_MS + ALARMA_MS);
    const ahora = new Date();
    if (t < RELOJ_MS) {
      pantalla.imagen(dibujarReloj(ahora));
      id = window.setTimeout(paso, 1000 - (Date.now() % 1000) + 5);
    } else {
      const invertir = Math.floor((t - RELOJ_MS) / 500) % 2 === 1;
      pantalla.imagen(dibujarAlarma(ahora), invertir);
      id = window.setTimeout(paso, 500 - ((t - RELOJ_MS) % 500));
    }
  };
  paso();
  return () => { vivo = false; clearTimeout(id); };
}

/* ------------------------------------------------------------------ */
/*  Pantallas de la puesta en marcha (para "Cómo funciona")             */
/* ------------------------------------------------------------------ */

/**
 * QR del portal del Wi-Fi para la clave de ejemplo "m4ph7wke", armado con el
 * MISMO qrcodegen.c del firmware y los mismos segmentos que conexion_wifi.cpp
 * (versión 2, 25 × 25). Cada TV inventa su propia clave cada vez.
 */
const CLAVE_EJEMPLO = 'm4ph7wke';
const QR_PORTAL: string[] = ['1111111001111011101111111','1000001010111110001000001','1011101001010011101011101','1011101011100010101011101','1011101001110001001011101','1000001010000000001000001','1111111010101010101111111','0000000000110101100000000','1111101110000011110101010','1010100011110011110011100','1000111110000100101110111','1110100000111110000000111','1100011000001100101100111','1111010010101011001000000','1010111110011010111001101','1001000101010011011000010','1001001100101001111110100','0000000011001000100010111','1111111011100100101011111','1000001001110110100010111','1011101010001101111111111','1011101011100001111000001','1011101011100111111101001','1000001011011101001110000','1111111010000011111111101'];

/** conexion_wifi.cpp → dibujarPantallaPortalConQr(clave) + dibujarQr(false). */
export function dibujarPortalQr() {
  gfx.limpiar();
  const columna = 62;
  gfx.print('Escanea el', columna, 2, 1);
  gfx.print('QR o une:', columna, 11, 1);
  gfx.print('TV RETRO', columna, 25, 1);
  gfx.print('Clave:', columna, 36, 1);
  gfx.print(CLAVE_EJEMPLO, columna, 46, 1);
  const QR_PX = 2, QR_MARGEN = 3, n = QR_PORTAL.length;
  const lado = n * QR_PX + 2 * QR_MARGEN;
  const y0 = Math.max(0, div(64 - lado, 2));
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++)
      if (QR_PORTAL[y][x] === '1') gfx.fillRect(QR_MARGEN + x * QR_PX, y0 + QR_MARGEN + y * QR_PX, QR_PX, QR_PX);
  return bitmapABase64(gfx.buf.slice());
}

/** pantalla.cpp → mostrarEmparejamiento(EMP_MOSTRANDO, codigo, segundos), sin el desvío anti-quemado. */
/**
 * Versión Lite: la ventana de emparejamiento (rama lite de Firmware-TV-RETRO,
 * OLED_Lite/OLED_Lite.ino → dibujarEmparejar(), commit d7dd563). El PIN de
 * 6 dígitos sale solo en la pantalla y la ventana dura 5 minutos.
 */
export function dibujarEmparejarLite(pin: string, segundosRestantes: number) {
  gfx.limpiar();
  gfx.print('Emparejar: escribe el', 0, 0, 1); // println: x = 0, y += 8
  gfx.print('PIN en tu celular', 0, 8, 1);
  gfx.print(pin, 8, 26, 2);
  gfx.print(`Vence en ${div(segundosRestantes, 60)}:${String(segundosRestantes % 60).padStart(2, '0')}`, 0, 56, 1);
  return bitmapABase64(gfx.buf.slice());
}

export function dibujarVincular(codigo: string, segundosRestantes: number) {
  gfx.limpiar();
  const centrado = (t: string, y: number, tam: number) => gfx.print(t, div(ANCHO - gfx.ancho(t, tam), 2), y, tam);
  centrado('VINCULAR TV', 2, 1);
  centrado(codigo, 20, 3);
  centrado(`Vence en ${div(segundosRestantes, 60)}:${String(segundosRestantes % 60).padStart(2, '0')}`, 54, 1);
  return bitmapABase64(gfx.buf.slice());
}
