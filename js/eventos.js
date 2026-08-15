// Qué hizo Chip mientras no estabas.
//
// Función pura: recibe las horas transcurridas (las mismas del decay, ya
// capeadas) y devuelve los eventos a mostrar. No toca el DOM, no toca
// localStorage, no escribe el texto — sólo decide cuántos y cuáles.

import {
  HORAS_MINIMAS_EVENTO,
  HORAS_DOS_EVENTOS,
  MAX_EVENTOS_POR_VISITA,
  PROBABILIDAD_EVENTO_RARO
} from './config.js';
import { EVENTOS, EVENTO_RARO } from './datos-eventos.js';

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
// el último.
//
// Las dos fuentes de azar entran separadas y son inyectables para que las
// pruebas sean deterministas: `aleatorio` sortea la bolsa y `azarRaro` es el
// portero del evento raro. Separadas a propósito — compartiendo fuente, un
// `aleatorio` fijo en 0 (el que hace que el sorteo saque siempre el primero de
// la bolsa) dispararía el raro en todas las visitas.
export function elegirEventos(
  horas,
  ultimosIds = [],
  aleatorio = Math.random,
  azarRaro = Math.random
) {
  const cuantos = cuantosTocan(horas);
  if (cuantos === 0) return [];

  // Lo mostrado la visita pasada queda afuera: si viste dos eventos, ninguno de
  // los dos vuelve a salir la próxima vez. Vale también para el raro, que si
  // acaba de salir no se repite aunque la moneda vuelva a caer parada.
  const excluidos = new Set(ultimosIds);
  const elegidos = [];

  // El raro no se sortea: no está en el pool y no compite con nadie. Ocupa uno
  // de los lugares de la visita, no suma uno extra.
  if (!excluidos.has(EVENTO_RARO.id) && azarRaro() < PROBABILIDAD_EVENTO_RARO) {
    elegidos.push(EVENTO_RARO);
  }

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
