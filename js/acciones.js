// Las tres acciones del juego. Cada una devuelve un estado nuevo; si no aplica,
// devuelve el mismo estado que recibió (misma referencia) para que quien
// orqueste sepa que no hubo cambio.

import {
  STAT_MIN,
  STAT_MAX,
  JUGAR_BATERIA_MINIMA,
  VALORES_ACCION
} from './config.js';

// Clamp de las acciones: llega hasta el piso real del stat, a diferencia del
// clamp del decay, que se frena en DECAY_FLOOR.
function clampAccion(valor) {
  return Math.min(STAT_MAX, Math.max(STAT_MIN, valor));
}

// Regla de batería mínima: sin batería suficiente, no se puede jugar.
export function puedeJugar(estado) {
  return estado.bateria >= JUGAR_BATERIA_MINIMA;
}

export function cargar(estado) {
  return {
    ...estado,
    bateria: clampAccion(estado.bateria + VALORES_ACCION.cargar.bateria)
  };
}

export function jugar(estado) {
  if (!puedeJugar(estado)) return estado;

  return {
    ...estado,
    humor: clampAccion(estado.humor + VALORES_ACCION.jugar.humor),
    bateria: clampAccion(estado.bateria + VALORES_ACCION.jugar.bateria)
  };
}

export function limpiar(estado) {
  return {
    ...estado,
    mantenimiento: clampAccion(estado.mantenimiento + VALORES_ACCION.limpiar.mantenimiento)
  };
}
