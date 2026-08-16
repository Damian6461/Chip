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

console.log(`${GRIS}${'-'.repeat(60)}${FIN}`);

if (resultado.fallaron === 0) {
  console.log(`${VERDE}${resultado.pasaron} pasaron${FIN}, 0 fallaron`);
} else {
  console.log(`${resultado.pasaron} pasaron, ${ROJO}${resultado.fallaron} fallaron${FIN}`);
}

process.exit(resultado.fallaron === 0 ? 0 : 1);
