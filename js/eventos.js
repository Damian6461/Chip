// Qué hizo Chip mientras no estabas.
//
// Función pura: recibe las horas transcurridas (las mismas del decay, ya
// capeadas) y devuelve los eventos a mostrar. No toca el DOM, no toca
// localStorage, no elige el texto — sólo decide cuántos y cuáles.

import {
  HORAS_MINIMAS_EVENTO,
  HORAS_DOS_EVENTOS,
  MAX_EVENTOS_POR_VISITA
} from './config.js';
import { EVENTOS } from './datos-eventos.js';

function cuantosTocan(horas) {
  if (horas < HORAS_MINIMAS_EVENTO) return 0;
  if (horas <= HORAS_DOS_EVENTOS) return 1;
  return MAX_EVENTOS_POR_VISITA;
}

// `ultimosIds` son los eventos mostrados en la visita anterior — todos, no sólo
// el último. `aleatorio` es inyectable para que las pruebas sean deterministas.
export function elegirEventos(horas, ultimosIds = [], aleatorio = Math.random) {
  const cuantos = cuantosTocan(horas);
  if (cuantos === 0) return [];

  // Lo mostrado la visita pasada queda afuera del sorteo: si viste dos eventos,
  // ninguno de los dos vuelve a salir la próxima vez.
  const excluidos = new Set(ultimosIds);
  const candidatos = EVENTOS.filter((evento) => !excluidos.has(evento.id));

  const elegidos = [];
  const disponibles = [...candidatos];

  while (elegidos.length < cuantos && disponibles.length > 0) {
    const indice = Math.floor(aleatorio() * disponibles.length);
    // Sacar el elegido de la bolsa evita que salga dos veces en la misma visita.
    elegidos.push(disponibles.splice(indice, 1)[0]);
  }

  return elegidos;
}
