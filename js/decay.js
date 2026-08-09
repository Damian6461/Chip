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

// Horas desde la última visita, ya capeadas y nunca negativas.
// Está exportada porque el sistema de eventos necesita exactamente el mismo
// número: pedirlo acá evita duplicar la lógica del cap en otro módulo.
export function horasTranscurridas(estado, ahora = Date.now()) {
  const brutas = (ahora - estado.ultimaVisita) / MS_POR_HORA;
  return Math.min(Math.max(brutas, 0), MAX_DECAY_HOURS);
}

// El decay se calcula siempre por diferencia de timestamps, nunca por un
// contador corriendo. Mover ultimaVisita a `ahora` es lo que evita el doble
// decay: lo ya cobrado no se vuelve a cobrar.
export function aplicarDecay(estado, ahora = Date.now()) {
  const horas = horasTranscurridas(estado, ahora);

  return {
    ...estado,
    bateria: clampDecay(estado.bateria - DECAY_POR_HORA.bateria * horas),
    humor: clampDecay(estado.humor - DECAY_POR_HORA.humor * horas),
    mantenimiento: clampDecay(estado.mantenimiento - DECAY_POR_HORA.mantenimiento * horas),
    ultimaVisita: ahora
  };
}
