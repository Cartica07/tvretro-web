# TV RETRO · Página de ventas

Página web de ventas de **TV RETRO**, la mini TV retro de píxeles con sonido.
Hecha con [Astro](https://astro.build): el resultado es una página estática, rápida y que se puede alojar gratis.

## Cambiar textos, precios y contacto

Todo lo editable está en **`contenido/sitio.yaml`**. Cada campo tiene una explicación al lado.
Lo que dice `[PENDIENTE: ...]` sale marcado en amarillo en la página hasta que pongas el dato real.

Para ver la lista de lo que falta (datos y fotos):

```bash
npm run pendientes
```

## Fotos

Van en **`src/assets/fotos/`** con el nombre de la lista (`src/assets/fotos/lista.json`).
La página las optimiza sola al construirse; mientras falten, se muestra un marcador.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm install` | Instala lo necesario (solo la primera vez) |
| `npm run dev` | Abre la página en tu computador mientras editas (`http://localhost:4321`) |
| `npm run build` | Construye la página final en la carpeta `dist/` |
| `npm run pendientes` | Lista los datos y fotos que faltan |

Necesita Node 22 o más nuevo.
