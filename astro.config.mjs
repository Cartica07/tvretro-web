// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

const fuente = (archivo, peso) => ({ src: [`./src/assets/fonts/${archivo}`], weight: peso, style: 'normal' });

export default defineConfig({
  // Cuando tengas dominio, ponlo aquí también (sirve para el mapa del sitio y la vista previa al compartir).
  // site: 'https://tudominio.co',
  fonts: [
    {
      name: 'Space Grotesk',
      cssVariable: '--fuente-ui',
      provider: fontProviders.local(),
      fallbacks: ['system-ui', 'sans-serif'],
      options: {
        variants: [
          fuente('space-grotesk-latin-400-normal.woff2', 400),
          fuente('space-grotesk-latin-600-normal.woff2', 600),
          fuente('space-grotesk-latin-700-normal.woff2', 700),
        ],
      },
    },
    {
      name: 'JetBrains Mono',
      cssVariable: '--fuente-pantalla',
      provider: fontProviders.local(),
      fallbacks: ['ui-monospace', 'monospace'],
      options: {
        variants: [
          fuente('jetbrains-mono-latin-400-normal.woff2', 400),
          fuente('jetbrains-mono-latin-700-normal.woff2', 700),
        ],
      },
    },
  ],
});
