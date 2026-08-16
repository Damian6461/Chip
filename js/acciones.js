// Las tres acciones del juego. Cada una devuelve un estado nuevo; si no aplica,
// devuelve el mismo estado que recibió (misma referencia) para que quien
// orqueste sepa que no hubo cambio.

import {
  STAT_MIN,
  STAT_MAX,
  JUGAR_BATERIA_MINIMA,
  VALORES_ACCION,
  CARICIA_HUMOR
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

// ¿Esta acción cambiaría algo? Es la pregunta que faltaba, y NO es un cooldown.
//
// La distinción importa y es la que sostiene el modelo sin culpa: acá no hay
// tiempo de espera, no hay penalización y nada se bloquea por reloj. Una acción
// no aplica cuando su stat ya está al máximo — o sea, cuando NO HACE FALTA
// porque Chip ya está atendido. La restricción es de estado, no de tiempo.
//
// Se apoya en el mismo STAT_OBJETIVO que usa cada acción, así que agregar una
// acción nueva no pide tocar esto: alcanza con declarar qué stat sube.
const STAT_DE_ACCION = {
  cargar: 'bateria',
  jugar: 'humor',
  limpiar: 'mantenimiento'
};

export function aplica(nombre, estado) {
  if (nombre === 'jugar' && !puedeJugar(estado)) return false;

  const stat = STAT_DE_ACCION[nombre];
  return stat ? estado[stat] < STAT_MAX : true;
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

// ---- Acariciar ----
//
// No es una cuarta acción: es un gesto. La diferencia está en el contrato —no
// tiene estado visual propio, no ocupa a Chip mientras dura y no aparece en
// `aplica`, que es la tabla de las tres teclas.
//
// Lo que SÍ comparte es la regla de siempre: si no cambia nada, devuelve la
// misma referencia. Con el humor al máximo, acariciar no aplica, y quien
// orqueste se entera igual que con las otras tres.
export function acariciar(estado) {
  if (estado.humor >= STAT_MAX) return estado;

  return {
    ...estado,
    humor: clampAccion(estado.humor + CARICIA_HUMOR)
  };
}
