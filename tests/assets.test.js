// Contrato de los assets: peso y presencia en el caché.
//
// SÓLO CORRE EN NODE. Es el único archivo de pruebas que toca el sistema de
// archivos, y por eso no está en tests/index.html: el navegador no puede leer
// sprites/ ni sw.js como texto. Lo importa nada más que tests/correr.mjs.
//
// Por qué existe: las dos cosas que verifica ya se habían hecho a mano y las dos
// se rompieron igual.
//
//   El peso  — los fondos se optimizaron una vez, y un reemplazo posterior de
//              arte pisó los optimizados con los originales sin que nadie se
//              enterara. Volvieron a 1,6 MB cada uno.
//   El caché — `esperando` e `idle-manitos` estuvieron en el deploy y fuera de
//              ARCHIVOS_CACHE. La app instalada los pedía a la red y sin
//              conexión mostraba el sprite de idle en su lugar, en silencio.
//
// Las dos eran disciplina. La disciplina se olvida; un test no.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { prueba, igual, verdadero } from './runner.js';
import { RUTAS_SPRITES, RUTAS_OJOS, RUTAS_FONDOS } from '../js/config.js';
import { LIMITES_PESO, PRESUPUESTO_TOTAL_KB } from './presupuesto.js';

const RAIZ = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const CARPETAS = ['sprites', 'icons'];

const listar = (carpeta) =>
  readdirSync(join(RAIZ, carpeta))
    .filter((n) => /\.(webp|png|jpg|jpeg|gif|svg)$/i.test(n))
    .map((n) => ({ carpeta, nombre: n, kb: statSync(join(RAIZ, carpeta, n)).size / 1024 }));

const ASSETS = CARPETAS.flatMap(listar);

// ---- Presupuesto de peso ----
//
// El límite es por archivo y por familia, no un número único: una panorámica de
// 1672x941 y un ícono de 192 no se miden con la misma vara.

prueba('peso: ningún asset supera su límite', () => {
  const excedidos = ASSETS.filter((a) => a.kb > limiteDe(a.nombre)).map(
    (a) => `${a.carpeta}/${a.nombre} pesa ${a.kb.toFixed(0)} KB y el límite es ${limiteDe(a.nombre)}`
  );
  igual(excedidos.join(' | '), '', 'assets fuera de presupuesto');
});

prueba('peso: el total de la instalación entra en el presupuesto', () => {
  const total = ASSETS.reduce((s, a) => s + a.kb, 0);
  verdadero(
    total <= PRESUPUESTO_TOTAL_KB,
    `los assets suman ${total.toFixed(0)} KB y el presupuesto total es ${PRESUPUESTO_TOTAL_KB} KB`
  );
});

function limiteDe(nombre) {
  const regla = LIMITES_PESO.find((r) => r.patron.test(nombre));
  return regla ? regla.kb : LIMITES_PESO.at(-1).kb;
}

// ---- Cruce sprites/ contra ARCHIVOS_CACHE ----

const sw = readFileSync(join(RAIZ, 'sw.js'), 'utf8');
const enCache = new Set([...sw.matchAll(/'\.\/((?:sprites|icons)\/[^']+)'/g)].map((m) => m[1]));

prueba('caché: todo asset del repo está en ARCHIVOS_CACHE', () => {
  const faltan = ASSETS.map((a) => `${a.carpeta}/${a.nombre}`).filter((r) => !enCache.has(r));
  igual(faltan.join(' | '), '', 'assets que existen y no se cachean');
});

prueba('caché: todo asset de ARCHIVOS_CACHE existe en el repo', () => {
  const enRepo = new Set(ASSETS.map((a) => `${a.carpeta}/${a.nombre}`));
  const fantasmas = [...enCache].filter((r) => !enRepo.has(r));
  igual(fantasmas.join(' | '), '', 'assets cacheados que no existen');
});

// Un archivo que falte en ARCHIVOS_CACHE rompe el install del service worker
// entero —`cache.addAll` es atómico— así que esto no es cosmética: la app deja
// de instalarse.
prueba('caché: las rutas declaradas en config.js existen en el disco', () => {
  const declaradas = [
    ...Object.values(RUTAS_SPRITES),
    ...Object.values(RUTAS_OJOS),
    ...Object.values(RUTAS_FONDOS)
  ];
  const enRepo = new Set(ASSETS.map((a) => `${a.carpeta}/${a.nombre}`));
  const rotas = declaradas.filter((r) => !enRepo.has(r));
  igual(rotas.join(' | '), '', 'rutas de config.js sin archivo');
});

prueba('caché: las rutas declaradas en config.js están cacheadas', () => {
  const declaradas = [
    ...Object.values(RUTAS_SPRITES),
    ...Object.values(RUTAS_OJOS),
    ...Object.values(RUTAS_FONDOS)
  ];
  const fuera = declaradas.filter((r) => !enCache.has(r));
  igual(fuera.join(' | '), '', 'rutas de config.js fuera del caché');
});
