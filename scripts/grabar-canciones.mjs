// Convierte cada canción de contenido/canciones/*.ino en la grabación que
// reproduce la página, con el MISMO intérprete de la app (inoMusical.js) y
// el MISMO formato m1 que recibe la TV (compresion.js).
// Corre solo antes de construir la página (npm run build). Uso suelto: npm run canciones
import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, basename } from 'node:path';
import { grabarIno, nombreDelIno } from '../src/app-tvretro/inoMusical.js';
import { codificarMusical } from '../src/app-tvretro/compresion.js';

const raiz = new URL('..', import.meta.url).pathname;
const origen = join(raiz, 'contenido', 'canciones');
const destino = join(raiz, 'public', 'demo', 'canciones');
rmSync(destino, { recursive: true, force: true });
mkdirSync(destino, { recursive: true });

const indice = [];
for (const archivo of readdirSync(origen).filter((f) => f.toLowerCase().endsWith('.ino')).sort()) {
  const clave = basename(archivo, '.ino').replace(/[^a-zA-Z0-9_-]/g, '_');
  const texto = readFileSync(join(origen, archivo), 'utf8');
  try {
    const grab = grabarIno(texto);
    const m1 = await codificarMusical(grab);
    writeFileSync(join(destino, clave + '.m1.txt'), m1.datos);
    indice.push({ clave, nombre: nombreDelIno(texto) || clave, duracion: grab.duracion, repetir: grab.repetir });
    console.log(`  ♪ ${archivo}: ${(grab.duracion / 1000).toFixed(1)} s, ${grab.cuadros.length} pantallas, ${(m1.bytes / 1024).toFixed(0)} KB`);
  } catch (e) {
    console.error(`  ✗ ${archivo}: ${e.message}`);
    process.exitCode = 1;
  }
}
writeFileSync(join(destino, 'indice.json'), JSON.stringify(indice, null, 2));
