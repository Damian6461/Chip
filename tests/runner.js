// Runner mínimo, sin dependencias y agnóstico del entorno: los mismos archivos
// .test.js corren en Node (correr.mjs) y en el navegador (index.html).
//
// No sabe si hay DOM ni consola: recibe una función `informar` y le pasa cada
// resultado para que cada entrypoint lo muestre como quiera.

import { EPSILON } from './config.pruebas.js';

const registradas = [];

export function prueba(nombre, fn) {
  registradas.push({ nombre, fn });
}

function fallar(mensaje, detalle) {
  throw new Error(`${mensaje} — ${detalle}`);
}

export function igual(actual, esperado, mensaje) {
  if (actual !== esperado) fallar(mensaje, `esperado ${esperado}, obtenido ${actual}`);
}

// Comparación con tolerancia. Obligatoria para todo lo que salga de multiplicar
// las tasas de decay: 100 - 3.3 * 24 da 20.80000000000001, no 20.8.
export function cerca(actual, esperado, mensaje) {
  if (Math.abs(actual - esperado) > EPSILON) {
    fallar(mensaje, `esperado ~${esperado}, obtenido ${actual}`);
  }
}

export function verdadero(condicion, mensaje) {
  if (!condicion) fallar(mensaje, 'la condición dio falso');
}

export function correrPruebas(informar = () => {}) {
  let pasaron = 0;
  let fallaron = 0;

  for (const { nombre, fn } of registradas) {
    try {
      fn();
      pasaron++;
      informar({ nombre, ok: true });
    } catch (error) {
      fallaron++;
      informar({ nombre, ok: false, mensaje: error.message });
    }
  }

  return { pasaron, fallaron, total: registradas.length };
}
