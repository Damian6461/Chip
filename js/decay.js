// Función pura: recibe estado + timestamp y devuelve un estado nuevo con el
// decay aplicado. No guarda, no toca el DOM, no muta el estado que recibe.

import {
  DECAY_POR_HORA,
  DECAY_FLOOR,
  STAT_MAX,
  MAX_DECAY_HOURS,
  MS_POR_HORA
} from './config.js';

function clampDecay(valor) {
  return Math.min(STAT_MAX, Math.max(DECAY_FLOOR, valor));
}

// El decay se calcula siempre por diferencia de timestamps, nunca por un
// contador corriendo. Mover ultimaVisita a `ahora` es lo que evita el doble
// decay: lo ya cobrado no se vuelve a cobrar.
export function aplicarDecay(estado, ahora = Date.now()) {
  const horasTranscurridas = (ahora - estado.ultimaVisita) / MS_POR_HORA;
  const horas = Math.min(Math.max(horasTranscurridas, 0), MAX_DECAY_HOURS);

  return {
    ...estado,
    bateria: clampDecay(estado.bateria - DECAY_POR_HORA.bateria * horas),
    humor: clampDecay(estado.humor - DECAY_POR_HORA.humor * horas),
    mantenimiento: clampDecay(estado.mantenimiento - DECAY_POR_HORA.mantenimiento * horas),
    ultimaVisita: ahora
  };
}
