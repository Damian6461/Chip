// Qué hizo Chip mientras no estabas.
//
// Función pura: recibe las horas transcurridas (las mismas del decay, ya
// capeadas) y devuelve los eventos a mostrar. No toca el DOM, no toca
// localStorage, no escribe el texto — sólo decide cuántos y cuáles.

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

// Día calendario local, en YYYY-MM-DD. Local y no UTC porque el día del jugador
// es el suyo: volver a las 23:50 y de nuevo a las 00:10 tienen que ser dos días.
// Recibe el timestamp de afuera, así las pruebas no dependen del reloj.
export function diaLocal(ahora) {
  const fecha = new Date(ahora);
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

// La garantía diaria: la primera visita de un día nuevo siempre trae algo,
// aunque hayan pasado diez minutos. Es el "periódico de Tsuki" — reabrir tiene
// premio una vez por día, sin castigar al que vuelve más seguido.
//
// Se implementa como piso sobre las horas y no como una rama adentro de
// cuantosTocan: "hoy todavía no viste nada" equivale exactamente a "pasó al
// menos el mínimo", y así la tabla de horas sigue siendo el único lugar donde
// se decide cuántos eventos tocan.
export function horasConGarantiaDiaria(horas, ultimoDiaConEvento, ahora) {
  if (ultimoDiaConEvento === diaLocal(ahora)) return horas;
  return Math.max(horas, HORAS_MINIMAS_EVENTO);
}

// `ultimosIds` son los eventos mostrados en la visita anterior — todos, no sólo
// el último. `aleatorio` es inyectable para que las pruebas sean deterministas.
//
// Acá NO hay eventos raros. El de la grúa que baja el brazo se sorteaba con una
// moneda cargada al 1.5% por visita; ahora es el hito del arco de la grúa y lo
// dispara gigantes.js cuando la presencia llega al umbral. Este módulo volvió a
// hacer una sola cosa: repartir el pool general.
export function elegirEventos(horas, ultimosIds = [], aleatorio = Math.random) {
  const cuantos = cuantosTocan(horas);
  if (cuantos === 0) return [];

  // Lo mostrado la visita pasada queda afuera: si viste dos eventos, ninguno de
  // los dos vuelve a salir la próxima vez.
  const excluidos = new Set(ultimosIds);
  const elegidos = [];

  // filter ya devuelve un array nuevo, así que se puede splicear sin tocar el
  // pool. Sacar el elegido de la bolsa evita que salga dos veces en la misma
  // visita.
  const disponibles = EVENTOS.filter((evento) => !excluidos.has(evento.id));

  while (elegidos.length < cuantos && disponibles.length > 0) {
    const indice = Math.floor(aleatorio() * disponibles.length);
    elegidos.push(disponibles.splice(indice, 1)[0]);
  }

  return elegidos;
}
