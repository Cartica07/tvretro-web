# Pepito · Web de ventas — Contexto completo para seguir en otra conversación

> Documento de traspaso (25 de noviembre de 2026). Léelo entero antes de tocar nada.
> Repositorio: **github.com/Cartica07/tvretro-web** (rama `main`).
> Último commit al escribir esto: `9dc35c6` (Publicación en GitHub Pages con GitHub Actions).

---

## 1. Quién es el dueño y cómo quiere que se trabaje

- **Alexander** (Colombia), ingeniero electrónico / estudiante de telecomunicaciones. Hace él mismo el
  producto (hardware, firmware, app). En TikTok es **@cartadroid** (más de 20 mil seguidores, videos
  de canciones sonando en la mini TV). **No es músico ni diseñador**: explicarle sin jerga.
- **Responder siempre en español** (Colombia, tuteo: "Elige", "Pon"; nunca voseo).
- **Forma de trabajo que pidió:**
  - Antes de cada paso grande: **mostrar el plan y esperar su aprobación**. Pasos pequeños, uno por vez,
    mostrando cada avance (vista previa publicada).
  - Si algo falta o hay duda: **preguntar antes de suponer**.
  - **No inventar nada:** ni testimonios, ni cifras de ventas, ni precios, ni duración de batería.
    Lo que no se sabe va como `[PENDIENTE: …]` visible.
  - Commits **en español**, pequeños, terminados con el trailer
    `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
  - Tiene permiso para hacer commit y push en `tvretro-web`. **No tocar ningún otro repositorio suyo**
    (los demás son solo de lectura para consultar), **no subir datos privados ni claves**.
- **Revisiones de diseño con las skills (Taste, Emil, Impeccable):** NO correrlas después de cada
  cambio (gasta recursos). **Él avisa** cuando toca una revisión, cada varios pasos.

## 2. El producto: Pepito

Antes se llamaba **TV RETRO**. El 23-11-2026 el dueño lo renombró a **Pepito** ("el televisorcito").
Se habla de Pepito **en masculino** ("Compártelo", "Conéctalo", "Enviar a Pepito").

Una mini TV retro de madera (cortada en láser) con pantalla OLED monocromática de píxeles (128×64,
se ve azul-cian), buzzer (sonido tipo 8 bits) y patas. Se maneja desde el celular. Se vende en Colombia.
**Lo que más engancha son las canciones con letra** (es lo que se ve en su TikTok).

### Dos versiones (misma app "Pepito" para las dos; al abrirla pregunta cuál tienes)

| | **Pepito Pro** | **Pepito Lite** |
|---|---|---|
| Conexión | Wi-Fi: le mandas cosas **desde cualquier lugar** | Bluetooth: el celular debe estar cerca |
| Cuenta | Sí (correo o Google) | No hace falta |
| Funciona en | Android (app) **y iPhone/computador (versión web)** | **Solo Android** (app) |
| Compartir | Dueño + hasta 5 personas | Un solo celular a la vez |
| Juegos | Varios juegos retro con su **rueda** (hoy 5; va a agregar más) | No (un solo botón) |
| Se actualiza solo | Sí | **Sí** (el dueño ya lo agregó) |
| Batería | **Sí** | **Sí** — **NUNCA prometer duración** |
| Pantalla | 1,3" | 0,96" |
| Caja | **74 mm de ancho** (laterales incluidos), 45 mm de alto | **50 mm de ancho** ("hasta de llavero") |
| Común | Mensajes, fotos, dibujos, GIF, canciones con letra (decenas), reloj, alarmas con canción, brillo/volumen/hora | igual |
| Estado en la web | "Disponible" | "Próximamente" (en pruebas finales) |

- La Pro tiene la perilla real (encoder rotativo); en la Lite la perilla es solo adorno.
- Emparejar la Lite: la TV muestra un **PIN de 6 dígitos** en pantalla y se escribe en el celular.
- Configurar Wi-Fi de la Pro: la TV muestra un **QR** (red "TV RETRO" + clave); luego se vincula con un
  **código de 6 letras** que aparece en pantalla.

## 3. Repositorios (solo `tvretro-web` se modifica)

| Repo | Uso |
|---|---|
| `Cartica07/tvretro-web` | **Esta web.** Público. Se edita aquí. |
| `Cartica07/TV_RETRO` | App/panel (HTML/JS puro + Firebase + APK Capacitor). **Solo lectura.** Rama `lite` = versión Lite y renombre a Pepito (`docs/nombre-pepito.md`, `docs/evaluacion-version-lite.md`, `docs/app-unificada.md`, `pepito/*.html` = páginas legales nuevas). |
| `Cartica07/Firmware-TV-RETRO` | Firmware ESP32-S3 (Pro) y rama `lite` con `OLED_Lite/` (ESP32-C3). Privado. **Solo lectura.** |
| `Cartica07/CancionesMiniTV`, `Cartica07/Canciones-ino` | Simulador y `.ino` de canciones. **Solo lectura.** |

## 4. Cómo está hecha la web

- **Astro 7.4**, sitio estático, una sola página (`src/pages/index.astro`). Node 22+.
- **Todo el texto editable** está en **`contenido/sitio.yaml`** (validado con zod en `src/lib/sitio.ts`;
  si un campo falta o está mal, el build falla con un mensaje claro). El dueño edita ese archivo.
- Colores de la app: fondo `#0B0F14`, superficie `#121821`, borde `#253041`, texto `#E6EDF3`,
  texto 2 `#8B98A8`, acento `#4DD2FF`, relleno acento `#50C5EC`, verde `#3DDC84`.
  Fuentes locales: **Space Grotesk** (UI) y **JetBrains Mono** (detalles/pantalla), vía Astro Fonts.
- Curva de movimiento de toda la página (Emil): `--salida: cubic-bezier(0.23, 1, 0.32, 1)`;
  botones `:active { scale(.97) }`; hover solo con `@media (hover:hover) and (pointer:fine)`.

### Pantallitas 100 % fieles (decisión importante del dueño)
Las pantallas OLED que se ven en la web **son exactas a las de la app y el firmware**, no imitaciones:
- `src/app-tvretro/` = copia **literal** de módulos de la app (renderer, fuentes, imageProcessor, gif,
  dibujo, compresión m1, intérprete `inoMusical`). Origen anotado en `src/app-tvretro/ORIGEN.md`
  (app `5b8e9a7`, firmware `b0823a4`). No editarlos: si cambian en la app, se vuelven a copiar.
- `src/scripts/oled/pantallaApp.ts` (`PantallaApp`: texto con scroll, imagen, GIF, musical sincronizado
  con el audio), `buzzer.ts` (Web Audio, onda cuadrada), `contenidos.ts`.
- `src/scripts/oled/pantallaFirmware.ts`: rutinas de Adafruit GFX portadas a JS para las pantallas del
  firmware: reloj, alarma, **QR del portal Wi-Fi** (generado con el `qrcodegen.c` del firmware),
  **código de vinculación** (Pro) y **PIN de emparejar** (Lite, de `OLED_Lite.ino`, rama lite `d7dd563`).
- **Canciones:** `contenido/canciones/*.ino` (hoy solo `cumpleanos_feliz.ino`, dominio público). En cada
  build, `scripts/grabar-canciones.mjs` las graba con el intérprete de la app a `public/demo/canciones/*.m1.txt`
  + `indice.json` (carpeta ignorada por git). **No poner letras ni títulos de canciones comerciales**
  en la web (derechos de autor); el dueño puede agregar sus propios `.ino`.

### Componentes (orden actual en la página)
1. `Encabezado.astro` (logo "Pepito" + botón WhatsApp "Pedir").
2. `Portada.astro`: título "Pepito, el televisorcito que *canta*, escribe y enamora.", TV de madera
   (`TvMadera.astro`, SVG con medidas del modelo 3D + canvas encima de la pantalla) que va rotando
   mensajes/foto/GIF; botón "Escucha cómo suena" (musical con sonido) + botón de **pausa**; entrada en
   cascada al cargar (clase `.entra`).
3. `Muestra.astro`: "Todo lo que le puedes mandar a Pepito": pestañas Mensajes (editor real: letra,
   tamaño, ajustar/scroll, invertir), Canciones, Fotos (subes la tuya, se convierte en el navegador),
   Dibujos (lienzo real de la app), GIF, Reloj (del firmware). Pantalla pegajosa en celular.
4. `VideosTikTok.astro`: se oculta solo mientras no haya enlaces de video válidos.
5. `Funciones.astro`: "Hecho para usarlo todos los días": bloque destacado (celular → Pepito
   "¡Te extraño!", se ve una vez y "Ver otra vez") + 6 funciones con íconos propios y etiqueta
   "Solo Pepito Pro/Lite" cuando aplica. 2 por fila también en celular.
6. `Versiones.astro`: "¿Cuál Pepito es para ti?": **en celular un selector Pepito Pro | Pepito Lite
   (una a la vez)**; en computador las dos lado a lado. Pro = "El regalo perfecto para alguien que
   quieres"; Lite = "El regalo perfecto para ti". Cada una: TV a escala, puntos, "Funciona en",
   precio pendiente, botón WhatsApp ("Pedir Pepito Pro" / "Quiero que me avisen"). Debajo "Los dos
   traen…" y tabla plegable "Ver todas las diferencias" (`comparar.diferencias` en el YAML).
7. `ComoFunciona.astro`: 3 pasos de la Pro con sus pantallas reales (QR, código "K7M4PQ", "¡Hola, Ana!")
   y recuadro de la Lite con su pantalla de PIN. Las cuentas atrás corren 4 s y se detienen.
8. Marcador provisional "[ Aquí siguen las demás secciones ]" y `Pie.astro` (enlaces legales a
   `cartica07.github.io/TV_RETRO/pepito/privacidad.html` y `/terminos.html`).

## 5. Tono y reglas de contenido (aprendidas con el dueño — respetarlas)

- **Vender, no explicar un manual.** Frases cortas, con ganas, sobre lo que se siente usarlo.
- **Nada de cifras técnicas exactas** en el texto de venta ("decenas de canciones", "varios juegos",
  "tu familia y tus amigos"), no "+50", "5 juegos", "hasta 5 personas", "1,3 pulgadas". Los detalles
  exactos solo en la tabla de diferencias.
- **Pro vs Lite con personalidad:** Pro = regalo para alguien que quieres (desde lejos); Lite = para ti,
  sin complicarte ("lo emparejas por Bluetooth y a darle"). Siempre visible: la Pro también va en
  iPhone por la versión web; la Lite es solo Android.
- **Celular primero (~90 % de visitas):** página corta, nada de scroll innecesario; preferir selectores
  y filas compactas a bloques apilados. Tocar ≥ 44 px.
- Cuando el dueño dicta un texto, se pone **exacto** (solo se corrige ortografía).

## 6. Cómo construir, probar y mostrar avances

- `npm install` → `npm run dev` (graba canciones y abre el servidor) → `npm run build` (sale a `dist/`).
- `npm run pendientes`: lista lo pendiente del YAML, las fotos que faltan (`src/assets/fotos/lista.json`)
  y si `public/demo/foto-demo.jpg` / `gif-demo.gif` siguen siendo las de muestra.
- Probar con Chrome headless (Playwright) a 390×844 y 1440×900: sin errores de consola y
  `scrollWidth - innerWidth == 0` (nada se sale de lado).
- **Vista previa para el dueño** (artifact de Claude, privado, slug
  `fd320caa-0791-40c9-a253-6bc32f68e772`, título "Pepito · Vista previa de la web"; última versión
  `1795484166-64be`). Para republicar una copia de `dist/`:
  1. Copiar `dist/` a una carpeta nueva (no borrar la carpeta de trabajo actual).
  2. Renombrar `_astro` → `recursos` (el prefijo `_astro` está reservado) y reemplazar `/_astro/`
     por `./recursos/` en `index.html` y por `./` dentro de `recursos/`.
  3. En `recursos/contenidos.*.js` cambiar ``S=`/` `` por ``S=`./` `` (base de las canciones).
  4. Quitar `.taste-skill/` si existe. Publicar con `publish_files` (modo `replace` si cambian nombres).
- **GitHub Pages:** `.github/workflows/publicar.yml` (withastro/action@v6 + deploy-pages@v5) publica en
  cada push a `main` en **https://cartica07.github.io/tvretro-web/** (`SITIO_URL`/`SITIO_BASE` en el
  flujo; en local la base es `/`). El primer despliegue salió bien. **Pendiente de confirmar** que el
  dueño puso Settings → Pages → Source = **GitHub Actions** (si no, sigue corriendo Jekyll y llegan
  correos de error). Para dominio propio: cambiar las dos variables del flujo.
- **Skills instaladas** en `.claude/skills/`: `design-taste-frontend` (tiene revisor:
  `node .claude/skills/design-taste-frontend/scripts/consistency.mjs dist/index.html --root dist
  --widths 1440,390 --page tech ...`), `emil-design-eng`, `impeccable`. Playwright MCP en `.mcp.json`.
  Varias alertas del revisor de Taste son de su estilo propio (una sección = una pantalla, paleta
  propia, fotos de stock) y chocan con lo pedido: no seguirlas a ciegas.

## 7. Lo que se hizo (historial por pasos)

| Paso | Commits | Qué |
|---|---|---|
| 1 | `fcb437b` | Estructura Astro, YAML editable, portada |
| 2 | `aa93bce` `25cd809` `d822fe8` `57bb8d6` `3f3759e` | Muestra con pantallas 100 % fieles, videos TikTok, TV de madera del modelo 3D, reloj del firmware |
| Skills | `158c26b` `38f7543` | Skills de diseño y Playwright MCP |
| Revisión 1 | `4ac083a` | Botón WhatsApp en la primera pantalla del celular, pantalla más grande, sin tarjetas genéricas, curva y "hundido" de Emil |
| 3 | `9bc2c14` | Funciones y Cómo funciona (QR, código y PIN reales) |
| Lite | `4061597` | Correcciones con la rama lite |
| Nombre | `b9728b0` | Todo pasa a Pepito / Pepito Pro / Pepito Lite |
| Revisión 2 | `d1d86d2` `3e87f41` | Taste (pausa, foco de teclado, rótulos, tamaño único de h3) y Emil (transform en vez de height/left, movimiento reducido suave, entrada en cascada, @starting-style) |
| 4 | `d48e1b2` `956c3ca` `dac8b6e` `0461b07` `a5effd7` `ca624f2` | Tono de venta, "¿Cuál Pepito es para ti?", página más corta en celular (8254 → 6389 px), orden Versiones antes de Cómo funciona, Lite "hasta de llavero" y se actualiza sola |
| Pages | `9dc35c6` | GitHub Pages con Actions |

## 8. Lo que falta (en orden sugerido)

1. **Ajustar la escala de las TV en "¿Cuál Pepito es para ti?"** con las medidas reales que dio el dueño:
   Pro 74 mm, Lite 50 mm de ancho → Lite = **50/74 ≈ 0,676** de la Pro (hoy usa 0,96/1,3 ≈ 0,738,
   constante `ESCALA` en `Versiones.astro`). El diseño es el mismo escalado. Si hace falta, el SVG de
   `TvMadera.astro` está en mm del modelo 3D original (caja 61×40).
2. **Paso 5:** ideas de regalo (para quién: pareja, mamá, amigos, para ti), **preguntas frecuentes**
   (proponer las preguntas al dueño antes; respuestas cortas y sin prometer batería) y **opiniones**
   (sección oculta hasta tener reseñas reales; no inventar).
3. **Paso 6:** contacto y redes, pie completo, SEO y **imagen para compartir** (`compartir-og.png`,
   1200×630), favicon/logo definitivo.
4. **Paso 7:** revisión final (cuando el dueño lo pida: Taste + Emil + Impeccable), prueba en celular real.
5. Quitar el marcador "[ Aquí siguen las demás secciones ]" cuando ya no haga falta.
6. Comparar alojamientos (GitHub Pages vs. Netlify/Vercel/Cloudflare Pages) y dominio propio: el dueño
   lo pidió "más adelante".
7. Opcional: render del modelo 3D para la portada (aplazado).

### Datos que debe dar el dueño (salen con `npm run pendientes`)
- Número de **WhatsApp** (todos los botones de pedido dependen de él), correo, Instagram, Facebook,
  nombre legal/marca del negocio, dominio.
- **Precios** de Pepito Pro y Pepito Lite.
- **Enlaces de 4 videos de TikTok** (y el nombre de cada canción).
- **Fotos reales** (12 en `src/assets/fotos/lista.json`: producto, cada versión, pantallas, capturas de
  la app, empaque, logo). Es lo que más falta para que no se vea "hecha con IA".
- Foto y GIF reales para reemplazar `public/demo/foto-demo.jpg` y `gif-demo.gif` (mismos nombres).
- Cuándo la Lite pasa de "Próximamente" a "Disponible" (`versiones[].estado` en el YAML).

### Preguntas abiertas / cosas a confirmar
- Si la red del portal Wi-Fi de la Pro cambia de "TV RETRO" a "Pepito" en el firmware, actualizar el QR
  de "Cómo funciona" (`QR_PORTAL` en `pantallaFirmware.ts`, generado con el `qrcodegen.c` del firmware).
- Que las páginas legales de `TV_RETRO/pepito/` estén publicadas y sean las definitivas (son borradores
  para revisión de un abogado).
- El repo sigue llamándose `tvretro-web`; si el dueño lo renombra, cambiar `SITIO_BASE` en el flujo.

## 9. Trampas técnicas ya resueltas (no repetirlas)

- Leer el YAML con `process.cwd()` (con `import.meta.url` se rompe al empaquetar).
- Las canciones se sirven como `.m1.txt` (Base64) para que cualquier alojamiento las entregue.
- Varias `TvMadera` en la página: pasar `sufijo` para no repetir los `id` del SVG.
- Un `<output>` dentro de un `<label>` se queda con el rótulo: usar `for`/`id` en los sliders.
- En grids, `minmax(0, 1fr)` y `min-width: 0` para que el contenido no ensanche la columna.
- Pestañas con scroll horizontal: dejar padding para que el anillo de foco no se corte.
- Nada en movimiento más de 5 s sin pausa (accesibilidad): portada con botón de pausa, demos que se
  ven una vez y quedan quietas.
- Movimiento reducido: quitar desplazamientos, dejar fundidos cortos (no apagar todo).
- GitHub Pages en modo "Deploy from a branch" usa Jekyll y falla con `.astro`: debe ser "GitHub Actions".
