// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

const fuente = (archivo, peso) => ({ src: [`./src/assets/fonts/${archivo}`], weight: peso, style: 'normal' });

// Dónde se publica. En GitHub Pages lo pone el flujo .github/workflows/publicar.yml
// (https://cartica07.github.io/tvretro-web/). En tu computador queda en la raíz.
// Cuando tengas dominio propio: SITIO_URL = tu dominio y SITIO_BASE = "/".
const SITIO_URL = process.env.SITIO_URL || undefined;
const SITIO_BASE = process.env.SITIO_BASE || '/';

export default defineConfig({
  site: SITIO_URL,
  base: SITIO_BASE,
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
