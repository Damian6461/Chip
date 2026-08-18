// La huella de ARCHIVOS_CACHE: cómo se calcula, en un solo lugar.
//
// La comparten el guardián (assets.test.js) y el sellador (sellar-cache.mjs).
// Si cada uno la calculara por su lado, el día que uno cambie el otro empieza a
// fallar sin motivo — y la salida es callar el test, que es de donde venimos.
//
// SE LEE sw.js COMO TEXTO Y NO SE IMPORTA. sw.js es un service worker: usa
// `self`, se registra con eventos y no exporta nada. Es el mismo carve-out que
// ya está declarado para CACHE_VERSION.

import { readFileSync } from 'node:fs';

// La lista de rutas de ARCHIVOS_CACHE, parseada del texto de sw.js.
//
// Se saltea './', que es un alias de index.html —ya está en la lista— y no un
// archivo que se pueda leer del disco.
export function archivosSellados(textoSw) {
  const bloque = textoSw.match(/const ARCHIVOS_CACHE = \[([\s\S]*?)\n\];/);
  if (!bloque) throw new Error('No encontré ARCHIVOS_CACHE en sw.js');

  return [...bloque[1].matchAll(/'(\.\/[^']*)'/g)]
    .map((x) => x[1])
    .filter((ruta) => ruta !== './');
}

export function leerVersion(textoSw) {
  const m = textoSw.match(/const CACHE_VERSION = '([^']*)';/);
  if (!m) throw new Error('No encontré CACHE_VERSION en sw.js');
  return m[1];
}

export function leerHuella(textoSw) {
  const m = textoSw.match(/const HUELLA_CACHE = '([^']*)';/);
  return m ? m[1] : null;
}

// Las extensiones de texto de ARCHIVOS_CACHE. El resto —.webp, .png— son
// binarios y se hashean tal cual: ahí un byte distinto ES un archivo distinto.
const TEXTO = /\.(html|css|js|json|mjs)$/i;

// LOS FINALES DE LÍNEA SE NORMALIZAN ANTES DE HASHEAR, y esto no es prolijidad:
// sin esto el guardián no protegía nada.
//
// La primera versión hasheaba los bytes del árbol de trabajo tal cual, y esos
// bytes DEPENDEN DE CÓMO LLEGÓ CADA ARCHIVO AHÍ. Con `core.autocrlf=true` —el
// default de Git en Windows— lo que git baja viene con CRLF, pero lo que escribe
// un editor o un script queda con LF. O sea que un mismo commit da huellas
// distintas según qué archivos tocó cada uno.
//
// Medido sobre 8e2230f, el mismo commit en dos carpetas:
//
//   árbol de trabajo   manifest.json    0 CRLF / 30 LF     huella 59ea57dc…
//   clon limpio        manifest.json   30 CRLF /  0 LF     huella 0a325dba…
//   otra máquina                                           huella a6960cd8…
//
// Tres valores para el mismo contenido. Un test que pasa en la máquina del que
// lo escribió y falla en cualquier otra es PEOR que no tener test: ocupa el
// lugar del que haría falta y encima entrena a la gente a ignorar el rojo.
//
// Y normalizar no es una concesión: es lo CORRECTO para lo que este guardián
// mide. Lo que se despliega son los bytes que guarda git, que están
// normalizados a LF; el CRLF del árbol de trabajo es un artefacto local que el
// visitante de la página no ve nunca. Hashear LF es hashear lo que se sirve.
//
// Los binarios NO se tocan: ahí un 0x0D es un píxel, no un salto de línea.
function bytesEstables(ruta, raiz) {
  const crudo = readFileSync(new URL(ruta.replace(/^\.\//, ''), raiz));
  if (!TEXTO.test(ruta)) return crudo;

  // Se saca el \r sólo cuando va pegado a un \n. Un \r suelto —que en un archivo
  // de texto no debería existir— se conserva, así que esto no puede borrar
  // contenido: sólo unifica los dos finales de línea posibles en uno.
  const salida = Buffer.alloc(crudo.length);
  let n = 0;
  for (let i = 0; i < crudo.length; i++) {
    if (crudo[i] === 0x0d && crudo[i + 1] === 0x0a) continue;
    salida[n++] = crudo[i];
  }
  return salida.subarray(0, n);
}

// SHA-256 sobre el contenido de cada archivo, con la RUTA adentro del hash.
//
// La ruta va incluida a propósito: sin ella, renombrar un sprite sin tocar su
// contenido daría la misma huella, y en el caché un nombre distinto es un
// archivo distinto. Y el orden es el de la lista y no alfabético, así que
// reordenar ARCHIVOS_CACHE también cuenta como cambio — que es correcto, porque
// el orden es el del `cache.addAll`.
export function huellaDe(archivos, raiz, createHash) {
  const total = createHash('sha256');

  for (const ruta of archivos) {
    total.update(ruta);
    total.update('\0');
    total.update(bytesEstables(ruta, raiz));
  }

  return total.digest('hex').slice(0, 16);
}
