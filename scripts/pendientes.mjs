// Lista todo lo que todavía dice [PENDIENTE: ...] y las fotos que faltan.
// Uso:  npm run pendientes
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const raiz = new URL('..', import.meta.url).pathname;
const yaml = readFileSync(join(raiz, 'contenido/sitio.yaml'), 'utf8').split('\n');

console.log('\n📝 Datos pendientes en contenido/sitio.yaml:\n');
let n = 0;
yaml.forEach((linea, i) => {
  const m = linea.match(/\[PENDIENTE:\s*([^\]]+)\]/);
  if (m && !linea.trim().startsWith('#')) {
    n++;
    console.log(`  línea ${String(i + 1).padStart(3)}  →  ${m[1]}`);
  }
});
if (!n) console.log('  ¡Nada! Todo está completo.');

const lista = join(raiz, 'src/assets/fotos/lista.json');
if (existsSync(lista)) {
  const esperadas = JSON.parse(readFileSync(lista, 'utf8'));
  const hay = new Set(readdirSync(join(raiz, 'src/assets/fotos')).map((f) => f.replace(/\.[^.]+$/, '')));
  const faltan = esperadas.filter((f) => !hay.has(f.nombre));
  console.log(`\n📷 Fotos que faltan en src/assets/fotos (${faltan.length} de ${esperadas.length}):\n`);
  faltan.forEach((f) => console.log(`  ${f.nombre.padEnd(22)} ${f.medida.padEnd(14)} ${f.que}`));
}

// Foto y GIF de muestra (los hizo Claude): cámbialos por unos reales tuyos.
import { createHash } from 'node:crypto';
const MUESTRAS = {
  'public/demo/foto-demo.jpg': '2f444795591674f0c65409ae1f88d38a',
  'public/demo/gif-demo.gif': '214938c4300bd20907a135649fc180f1',
};
const siguen = Object.entries(MUESTRAS).filter(([f, h]) => existsSync(join(raiz, f)) && createHash('md5').update(readFileSync(join(raiz, f))).digest('hex') === h);
if (siguen.length) {
  console.log('\n🖼  Muestras para cambiar por unas reales (mismo nombre de archivo):\n');
  siguen.forEach(([f]) => console.log('  ' + f));
}
console.log('');
