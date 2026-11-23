/**
 * Lee contenido/sitio.yaml al construir la página y revisa que esté bien.
 * Si algo falla, el error dice qué campo revisar y la página no se publica rota.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse, YAMLParseError } from 'yaml';
import { z } from 'astro/zod';

// Se construye siempre desde la carpeta del proyecto.
const RUTA = join(process.cwd(), 'contenido', 'sitio.yaml');

/** true si el valor todavía es un marcador [PENDIENTE: ...]. */
export const esPendiente = (v: string | undefined | null) => !v || /^\s*\[PENDIENTE/i.test(v);

/** Número del video dentro de un enlace de TikTok, o null. */
export function idVideoTikTok(enlace: string): string | null {
  return enlace.match(/tiktok\.com\/(?:@[^/]+\/video|player\/v1|embed(?:\/v2)?)\/(\d{8,})/)?.[1] ?? null;
}

const texto = z.string();
const opcional = z.string().default('');

const esquema = z.object({
  marca: z.object({ nombre: texto, negocio: texto, dominio: texto }),
  seo: z.object({ titulo: texto, descripcion: texto }),
  contacto: z.object({
    whatsapp: texto,
    mensajeWhatsApp: texto,
    correo: opcional,
    instagram: opcional,
    tiktok: opcional,
    facebook: opcional,
  }),
  tiktok: z.object({ seguidores: opcional }),
  pantalla: z.object({
    mensajes: z.array(z.string().max(60, 'Máximo 60 letras por mensaje')).min(1),
  }),
  portada: z.object({
    titulo: texto,
    subtitulo: texto,
    botonPrincipal: texto,
    botonSecundario: texto,
    botonSonido: texto,
    destacados: z.array(z.string()).default([]),
  }),
  muestra: z.object({
    titulo: texto,
    subtitulo: opcional,
    tipos: z
      .array(
        z.object({
          id: z.enum(['mensajes', 'canciones', 'fotos', 'dibujos', 'gif', 'reloj'], {
            message: 'id debe ser uno de: mensajes, canciones, fotos, dibujos, gif, reloj',
          }),
          nombre: texto,
          titulo: texto,
          texto: texto,
          puntos: z.array(z.string()).default([]),
        }),
      )
      .min(1),
  }),
  funciones: z.object({
    titulo: texto,
    subtitulo: opcional,
    destacada: z.object({ titulo: texto, texto: texto, version: z.enum(['wifi', 'lite', '']).default(''), mensaje: z.string().max(24) }),
    lista: z.array(
      z.object({
        icono: z.enum(['compartir', 'juegos', 'galeria', 'actualizar', 'ajustes', 'bluetooth'], {
          message: 'icono debe ser: compartir, juegos, galeria, actualizar, ajustes o bluetooth',
        }),
        titulo: texto,
        texto: texto,
        version: z.enum(['wifi', 'lite', '']).default(''),
      }),
    ),
  }),
  pasos: z.object({
    titulo: texto,
    subtitulo: opcional,
    lista: z.array(z.object({ titulo: texto, texto: texto })).length(3, 'Deben ser exactamente 3 pasos'),
    notaLite: opcional,
  }),
  videos: z.object({
    titulo: texto,
    subtitulo: opcional,
    lista: z
      .array(
        z.object({
          enlace: z.string().refine((v) => esPendiente(v) || idVideoTikTok(v) !== null, {
            message: 'Usa el enlace completo del video: https://www.tiktok.com/@usuario/video/1234567890…',
          }),
          titulo: opcional,
        }),
      )
      .default([]),
  }),
  versiones: z
    .array(
      z.object({
        id: z.enum(['wifi', 'lite']),
        nombre: texto,
        estado: z.enum(['disponible', 'proximamente'], {
          message: 'estado debe ser "disponible" o "proximamente"',
        }),
        precio: texto,
        mensajeWhatsApp: texto,
      }),
    )
    .length(2),
  legal: z.object({ privacidad: texto, terminos: texto }),
});

export type Sitio = z.infer<typeof esquema>;

function cargar(): Sitio {
  let datos: unknown;
  try {
    datos = parse(readFileSync(RUTA, 'utf8'));
  } catch (e) {
    if (e instanceof YAMLParseError) {
      throw new Error(`contenido/sitio.yaml tiene un error de escritura cerca de la línea ${e.linePos?.[0]?.line ?? '?'}: ${e.message}`);
    }
    throw e;
  }
  const r = esquema.safeParse(datos);
  if (!r.success) {
    const lista = r.error.issues.map((i) => `  • ${i.path.join(' → ') || '(archivo)'}: ${i.message}`).join('\n');
    throw new Error(`Revisa contenido/sitio.yaml:\n${lista}`);
  }
  return r.data;
}

export const sitio = cargar();

/** Quita los corchetes: "[PENDIENTE: x]" → "PENDIENTE: x". */
export const textoPendiente = (v: string) => v.replace(/^\s*\[|\]\s*$/g, '');

/**
 * Enlace de WhatsApp con el mensaje ya escrito.
 * Si el número aún es un marcador, devuelve null (el botón se marca como pendiente).
 */
export function enlaceWhatsApp(mensaje = sitio.contacto.mensajeWhatsApp): string | null {
  const n = sitio.contacto.whatsapp.replace(/\D/g, '');
  if (esPendiente(sitio.contacto.whatsapp) || n.length < 10) return null;
  return `https://wa.me/${n}?text=${encodeURIComponent(mensaje)}`;
}

/** Enlace a un perfil de red social, o null si falta el usuario. */
export function enlaceRed(red: 'instagram' | 'tiktok' | 'facebook'): string | null {
  const u = sitio.contacto[red].replace(/^@/, '').trim();
  if (!u || esPendiente(u)) return null;
  const base = { instagram: 'https://instagram.com/', tiktok: 'https://www.tiktok.com/@', facebook: 'https://facebook.com/' }[red];
  return base + u;
}
