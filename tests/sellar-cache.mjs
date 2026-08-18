// Sube CACHE_VERSION y sella el contenido de ARCHIVOS_CACHE, en un solo paso.
//
//   node tests/sellar-cache.mjs
//
// ---- POR QUÉ EXISTE ----
//
// El bug se llevó dos deploys en un día y es el peor tipo que hay: INVISIBLE.
// Todo compila, todas las pruebas pasan, el push sale bien, GitHub Pages publica
// — y el teléfono sigue mostrando lo de ayer. Nada falla en ningún lado.
//
// El mecanismo, confirmado: el fetch del service worker es cache-first puro
// —`caches.match(req).then(c => c || fetch(req))`— así que lo que ya está
// cacheado NO vuelve a pedirse nunca. Y el `activate` sólo borra las cachés cuyo
// nombre difiere de CACHE_VERSION. Si la versión no cambia, no se borra nada y
// no se baja nada: el teléfono se queda con la foto del repo del día que
// instaló, para siempre.
//
// La primera vez fue un olvido. La segunda fue peor, porque salió de una
// instrucción razonable —"el bump va al final de todo"— que a la escala de cinco
// commits estaba mal. O sea que la disciplina ya falló de las dos maneras
// posibles: por descuido y por decisión. Lo único que queda es un test.
//
// ---- POR QUÉ LA HUELLA VIVE EN sw.js Y NO EN UN ARCHIVO APARTE ----
//
// Porque así SUBIR LA VERSIÓN Y REESCRIBIR LA HUELLA SON LA MISMA EDICIÓN. Con
// la huella en un archivo suelto, el camino corto para callar el test sería
// regenerar la huella sin tocar la versión — que es exactamente el error que se
// quiere cerrar, ahora con un test que lo bendice.
//
// Acá no hay camino corto: este script hace las dos cosas o ninguna.

import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { archivosSellados, huellaDe, leerVersion } from './huella-cache.mjs';

const RAIZ = new URL('..', import.meta.url);
const RUTA_SW = new URL('sw.js', RAIZ);

const sw = readFileSync(RUTA_SW, 'utf8');
const versionVieja = leerVersion(sw);

// El siguiente número de la serie chip-cache-vNN. Sale de la versión que hay y
// no de un contador aparte: dos fuentes para el mismo número se separan.
const m = versionVieja.match(/^(.*?)(\d+)$/);
if (!m) {
  console.error(`No entiendo la versión "${versionVieja}": esperaba algo terminado en número.`);
  process.exit(1);
}
const versionNueva = `${m[1]}${Number(m[2]) + 1}`;

const archivos = archivosSellados(sw);
const huella = huellaDe(archivos, RAIZ, createHash);

let salida = sw.replace(
  /const CACHE_VERSION = '[^']*';/,
  `const CACHE_VERSION = '${versionNueva}';`
);
salida = salida.replace(/const HUELLA_CACHE = '[^']*';/, `const HUELLA_CACHE = '${huella}';`);

if (salida === sw) {
  console.error('No se pudo reescribir sw.js: no encontré CACHE_VERSION o HUELLA_CACHE.');
  process.exit(1);
}

writeFileSync(RUTA_SW, salida);

console.log(`${versionVieja}  ->  ${versionNueva}`);
console.log(`huella de ${archivos.length} archivos: ${huella}`);
console.log('\nsw.js cambió de bytes, así que el navegador va a disparar el update.');
