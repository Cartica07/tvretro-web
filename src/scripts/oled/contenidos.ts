/**
 * Carga lo que se muestra en las pantallitas, convertido con el MISMO código
 * de la app: canciones (formato m1), fotos (procesarImagenConOpciones) y GIF
 * (leerGif + construirCuadrosGif). También sirve para la foto o el GIF que
 * elija quien visita la página: se convierte en su navegador, no se sube.
 */
import { decodificarMusical } from '../../app-tvretro/compresion.js';
import { procesarImagenConOpciones, cargarImagenOriginal } from '../../app-tvretro/imageProcessor.js';
import { esGif, leerGif, construirCuadrosGif, comprobarTamanoArchivo } from '../../app-tvretro/gif.js';
import type { Cuadro, Grabacion } from './pantallaApp';

const BASE = import.meta.env.BASE_URL.replace(/\/?$/, '/');

/** Encuadre por defecto de la app (geometriaImagen de main.js). */
export const GEOMETRIA_APP = { escala: 'ajustar', fondo: 'negro', rotar: 0, volteoH: false, volteoV: false };

export type Original = { el: HTMLImageElement; w: number; h: number };
export type OpcionesFoto = { umbral: number; dithering: boolean; escala?: 'ajustar' | 'llenar' | 'estirar' };

const cache = new Map<string, Promise<unknown>>();
const unaVez = <T>(clave: string, f: () => Promise<T>) => {
  if (!cache.has(clave)) cache.set(clave, f());
  return cache.get(clave) as Promise<T>;
};

export type CancionInfo = { clave: string; nombre: string; duracion: number; repetir: boolean };

export const listaCanciones = () =>
  unaVez('indice', async () => (await (await fetch(BASE + 'demo/canciones/indice.json')).json()) as CancionInfo[]);

export const cargarCancion = (clave: string) =>
  unaVez('m1:' + clave, async () => {
    const b64 = await (await fetch(BASE + `demo/canciones/${clave}.m1`)).text();
    return (await decodificarMusical(b64.trim())) as Grabacion;
  });

/** Una imagen de una dirección → original (como cargarImagenOriginal, pero sin archivo). */
export const cargarOriginalDesdeUrl = (url: string) =>
  unaVez('img:' + url, () => new Promise<Original>((ok, mal) => {
    const el = new Image();
    el.onload = () => ok({ el, w: el.naturalWidth, h: el.naturalHeight });
    el.onerror = () => mal(new Error('No se pudo cargar la imagen'));
    el.src = url;
  }));

export const fotoDemo = () => cargarOriginalDesdeUrl(BASE + 'demo/foto-demo.jpg');

/** Convierte una foto exactamente como la pestaña Imagen de la app. */
export function convertirFoto(original: Original, o: OpcionesFoto): string {
  return procesarImagenConOpciones(original, { ...GEOMETRIA_APP, escala: o.escala ?? 'ajustar', umbral: o.umbral, dithering: o.dithering }).imagenData;
}

/** Lee un GIF (bytes) como la app: queda en grises para poder cambiar Pixelar / Nivel sin releerlo. */
export function leerGifApp(buffer: ArrayBuffer) {
  return leerGif(buffer, GEOMETRIA_APP);
}
export function cuadrosGif(leido: unknown, o: OpcionesFoto): Cuadro[] {
  return construirCuadrosGif(leido, o.umbral, o.dithering).cuadros;
}

export const gifDemo = () =>
  unaVez('gif:demo', async () => leerGifApp(await (await fetch(BASE + 'demo/gif-demo.gif')).arrayBuffer()));

/** Archivo elegido por quien visita: foto o GIF, con los mismos topes de la app. */
export async function leerArchivoVisitante(archivo: File): Promise<{ tipo: 'foto'; original: Original } | { tipo: 'gif'; leido: unknown }> {
  comprobarTamanoArchivo(archivo);
  const buffer = await archivo.arrayBuffer();
  if (esGif(buffer)) return { tipo: 'gif', leido: leerGifApp(buffer) };
  return { tipo: 'foto', original: await cargarImagenOriginal(archivo) };
}
