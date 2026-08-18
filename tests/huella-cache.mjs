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
    total.update(readFileSync(new URL(ruta.replace(/^\.\//, ''), raiz)));
  }

  return total.digest('hex').slice(0, 16);
}
