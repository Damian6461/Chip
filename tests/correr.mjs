// Entrypoint de Node: `node tests/correr.mjs`. Sale con 0 si pasa todo, 1 si no.
//
// El almacén falso se instala ANTES de importar nada del juego, por eso los
// imports de abajo son dinámicos y no estáticos: los estáticos se evalúan todos
// antes que el cuerpo del módulo y la instalación llegaría tarde.

import { instalarAlmacenFalso } from './almacen-falso.js';

instalarAlmacenFalso();

const { correrPruebas } = await import('./runner.js');
await import('./decay.test.js');
await import('./cadena.test.js');
await import('./eventos.test.js');
await import('./coleccion.test.js');
await import('./gigantes.test.js');
await import('./orquestador.test.js');
// Sólo en Node: es el único que toca el sistema de archivos, por eso no está en
// tests/index.html.
await import('./assets.test.js');
await import('./composicion.test.js');
await import('./tema.test.js');

const VERDE = '\x1b[32m';
const ROJO = '\x1b[31m';
const GRIS = '\x1b[90m';
const FIN = '\x1b[0m';

const resultado = correrPruebas(({ nombre, ok, mensaje }) => {
  if (ok) {
    console.log(`${VERDE}  ok  ${FIN} ${nombre}`);
  } else {
    console.log(`${ROJO}FALLA${FIN} ${nombre}`);
    console.log(`        ${ROJO}${mensaje}${FIN}`);
  }
});

// ---- Y EL QUE ABRE EL JUEGO ----
//
// Va acá adentro y no en un comando aparte, y esa es la mitad del asunto: un
// test de humo que hay que acordarse de correr es un test que no corre. Los
// trescientos treinta y dos de arriba estuvieron verdes con la app tirando
// ReferenceError al abrirla, así que la lección no es "falta un test", es "falta
// un test EN EL MISMO COMANDO".
//
// Es asíncrono —levanta un servidor y un Chrome— y el runner de arriba es
// síncrono a propósito, así que trae su propio conteo y se suma al final. Se
// puede saltear con CHIP_SIN_HUMO=1 para el ciclo corto de escribir tests de
// texto; no se puede saltear sin decirlo.
const { correrHumo } = await import('./humo.mjs');

const humo = process.env.CHIP_SIN_HUMO
  ? { pasaron: 0, fallaron: 0, total: 0, salteado: true }
  : await correrHumo(({ nombre, ok, mensaje }) => {
      if (ok) {
        console.log(`${VERDE}  ok  ${FIN} ${nombre}`);
      } else {
        console.log(`${ROJO}FALLA${FIN} ${nombre}`);
        console.log(`        ${ROJO}${mensaje}${FIN}`);
      }
    });

if (humo.salteado) {
  console.log(`${ROJO} !!!  ${FIN} el test de humo NO corrió: CHIP_SIN_HUMO está puesto`);
}

console.log(`${GRIS}${'-'.repeat(60)}${FIN}`);

const pasaron = resultado.pasaron + humo.pasaron;
const fallaron = resultado.fallaron + humo.fallaron;

if (fallaron === 0) {
  console.log(`${VERDE}${pasaron} pasaron${FIN}, 0 fallaron`);
} else {
  console.log(`${pasaron} pasaron, ${ROJO}${fallaron} fallaron${FIN}`);
}

process.exit(fallaron === 0 ? 0 : 1);
