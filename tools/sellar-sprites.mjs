// Lee sprites/objetos/ y reescribe SPRITES_OBJETO en js/config.js.
//
//   node tools/sellar-sprites.mjs
//
// ---- POR QUÉ EXISTE ----
//
// El mapa id -> ruta podría escribirse a mano. Son treinta y cinco líneas, no es
// mucho trabajo, y esa es exactamente la trampa: treinta y cinco líneas escritas
// a mano se desincronizan del disco en el primer archivo que se renombra, y el
// síntoma —una pieza que dibuja un cuadrado gris— es indistinguible de "todavía
// no dibujé ese".
//
// Acá la carpeta es la verdad y el mapa es su copia. Si un PNG no está, no entra
// en el mapa y el juego cae en la silueta provisoria, que es lo correcto. Si un
// PNG tiene un nombre que no es ningún id del catálogo, esto lo dice y no lo
// mapea: un archivo que nadie pidió no se dibuja solo.
//
// NO TOCA sw.js. Sellar la caché es otro paso y otro script, a propósito: son
// dos decisiones distintas —"estos son los sprites" y "esta es la versión que se
// publica"— y juntarlas obligaría a subir la versión cada vez que uno mira si el
// mapa quedó bien.

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { OBJETOS } from '../js/datos-objetos.js';
import { SPRITE_OBJETO, OBJETOS_SIN_SPRITE } from '../js/config.js';

const RAIZ = new URL('..', import.meta.url);
const RUTA_CONFIG = new URL('js/config.js', RAIZ);
const CARPETA = new URL(SPRITE_OBJETO.carpeta, RAIZ);

if (!existsSync(CARPETA)) {
  console.error(`No existe ${SPRITE_OBJETO.carpeta}. Ahí van los PNG.`);
  process.exit(1);
}

const ids = new Set(OBJETOS.map((o) => o.id));
const sinSprite = new Set(OBJETOS_SIN_SPRITE);

const enDisco = readdirSync(CARPETA).filter((n) => n.endsWith(SPRITE_OBJETO.extension));

const mapeados = [];
const huerfanos = [];
const prohibidos = [];

for (const nombre of enDisco.sort()) {
  const id = nombre.slice(0, -SPRITE_OBJETO.extension.length);
  if (sinSprite.has(id)) {
    prohibidos.push(nombre);
    continue;
  }
  if (!ids.has(id)) {
    huerfanos.push(nombre);
    continue;
  }
  mapeados.push(id);
}

const cuerpo = mapeados.length
  ? '\n' +
    mapeados
      .map((id) => `  '${id}': '${SPRITE_OBJETO.carpeta}${id}${SPRITE_OBJETO.extension}'`)
      .join(',\n') +
    '\n'
  : '';

// EL RECORTE, Y POR QUÉ NO ES UN REGEX SUELTO.
//
// La primera versión de esto era
// `/export const SPRITES_OBJETO = \{[\s\S]*?\n\};/`, o sea "desde la
// declaración hasta el primer `\n};`". Con el mapa vacío —`= {};`— eso no
// matchea la línea entera: el `[\s\S]*?` arranca DESPUÉS de la llave de
// apertura, se come el `};` de la propia línea sin que haya salto antes, sigue
// de largo y corta en el `\n};` de la constante SIGUIENTE. Se llevó puesta
// COLORES_REPISA entera y la app dejó de importar.
//
// Es el mismo defecto que ya nos mordió del lado de los tests, con los cortes de
// style.css por texto: un recorte que no sabe cuánto tendría que medir se come
// lo que sea. Así que acá se busca la llave de apertura y se avanza CONTANDO
// llaves, que es lo único que sabe dónde termina un objeto.
function reemplazarDeclaracion(texto, nombre, cuerpoNuevo) {
  const ancla = `export const ${nombre} = {`;
  const i = texto.indexOf(ancla);
  if (i < 0) return null;

  let prof = 0;
  let j = i + ancla.length - 1;
  for (; j < texto.length; j++) {
    if (texto[j] === '{') prof++;
    else if (texto[j] === '}' && --prof === 0) break;
  }
  if (prof !== 0) return null;

  // El `;` que sigue a la llave de cierre.
  const fin = texto.indexOf(';', j) + 1;
  return texto.slice(0, i) + `export const ${nombre} = {${cuerpoNuevo}};` + texto.slice(fin);
}

const config = readFileSync(RUTA_CONFIG, 'utf8');
const salida = reemplazarDeclaracion(config, 'SPRITES_OBJETO', cuerpo);

if (salida === null) {
  console.error('No se pudo reescribir SPRITES_OBJETO en js/config.js: no encontré la declaración.');
  process.exit(1);
}

writeFileSync(RUTA_CONFIG, salida);

const faltan = [...ids].filter((id) => !sinSprite.has(id) && !mapeados.includes(id));

console.log(`${mapeados.length} sprites mapeados de ${ids.size - sinSprite.size} objetos con arte.`);
if (faltan.length) console.log(`Todavía sin PNG (${faltan.length}): ${faltan.join(', ')}`);
if (prohibidos.length) {
  console.log(`\nIgnorados por estar en OBJETOS_SIN_SPRITE: ${prohibidos.join(', ')}`);
}
if (huerfanos.length) {
  console.log(`\nOJO — archivos que no son ningún id del catálogo: ${huerfanos.join(', ')}`);
  console.log('El nombre del archivo tiene que ser el id, tal cual. Ver sprites/objetos/LEEME.md');
}
if (mapeados.length) console.log('\nAhora: node tests/sellar-cache.mjs');
