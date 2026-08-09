// Función pura: recibe estado + timestamp y devuelve un estado nuevo con el
// decay aplicado. No guarda, no toca el DOM, no muta el estado que recibe.

import {
  DECAY_POR_HORA,
  DECAY_FLOOR,
  MAX_DECAY_HOURS,
  MS_POR_HORA
} from './config.js';

// El decay nunca puede AUMENTAR un stat. DECAY_FLOOR limita cuánto puede bajar
// el paso del tiempo, no dónde tiene que estar el valor.
//
// Antes esto era Math.max(DECAY_FLOOR, valor) a secas, que no es un piso sino
// un imán: cualquier valor por debajo de 10 subía a 10. Con la batería en 15,
// jugar la dejaba en 5 y el tick siguiente devolvía esos 5 gratis, así que el
// costo de la acción se evaporaba justo en el borde donde tiene que doler.
//
// Tomar el mínimo contra el valor anterior también hace innecesario el tope en
// STAT_MAX: el resultado nunca puede superar de dónde venía.
function aplicarPiso(valorAnterior, valorConDecay) {
  return Math.min(valorAnterior, Math.max(DECAY_FLOOR, valorConDecay));
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
    bateria: aplicarPiso(estado.bateria, estado.bateria - DECAY_POR_HORA.bateria * horas),
    humor: aplicarPiso(estado.humor, estado.humor - DECAY_POR_HORA.humor * horas),
    mantenimiento: aplicarPiso(
      estado.mantenimiento,
      estado.mantenimiento - DECAY_POR_HORA.mantenimiento * horas
    ),
    ultimaVisita: ahora
  };
}
