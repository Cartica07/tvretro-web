# Código copiado de la app TV RETRO (sin cambios)

Estos archivos son **copias exactas** de `js/` del repositorio de la app
(`Cartica07/TV_RETRO`, rama `main`, commit `5b8e9a7` del 2026-11-21).
Así la página dibuja la pantalla, convierte fotos y GIF, y reproduce las
canciones **igual que la app**.

| Archivo | Para qué lo usa la página |
|---|---|
| `renderer.js`, `fonts.js`, `fuentesTexto.js`, `fuentesGfx.js` | Dibujar la pantalla y el texto (Sans, Serif, Clásica…) |
| `imageProcessor.js`, `gif.js` | Convertir fotos y GIF como la pestaña Imagen |
| `dibujo.js` | El lienzo de Dibujo |
| `compresion.js` | Leer las canciones en formato m1 |
| `inoMusical.js` | Grabar los `.ino` de `contenido/canciones/` al construir la página |

**No los edites aquí.** Si la app cambia, vuelve a copiarlos desde el repo de la app.
Lo que no viene de estos archivos (los tiempos del scroll, del GIF y de la
canción) está copiado de `js/main.js` en `src/scripts/oled/pantallaApp.ts`.

## Pantallas del firmware

El reloj y la alarma no los dibuja la app sino el firmware. Están copiados de
`Firmware-TV-RETRO` (rama `main`, commit `b0823a4`): `OLED_Remota/pantalla.cpp`
(`mostrarReloj`) y `OLED_Remota/alarma.cpp` (`dibujar`), con las mismas rutinas de
Adafruit GFX. Viven en `src/scripts/oled/pantallaFirmware.ts`.
