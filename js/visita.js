// Lo que pasa al abrir la app, en orden.
//
// Función pura: recibe el estado guardado y un timestamp, y devuelve el estado
// que corresponde más lo que hay que mostrar. No guarda, no toca el DOM, no lee
// el reloj por su cuenta. Guardar es de main.js, igual que con el decay.
//
// Vive en su propio módulo por una razón concreta: el orden de estos ocho pasos
// ES la regla, y hasta que no estuvo acá no se podía probar. Estaba en el cuerpo
// de main.js, que corre al importarse y arrastra el DOM entero de ui.js — o sea
// que la parte del juego con más dependencias entre pasos era la única sin una
// sola prueba.
//
// El orden importa y no es libre:
//
// 1. El decay va primero porque todo lo demás mira el estado ya envejecido.
// 2. La presencia va antes que el hito porque el arco de los gigantes se mide en
//    días de presencia, y el día de hoy tiene que estar contado antes de
//    preguntar si hay hito.
// 3. La garantía diaria se calcula sobre las horas de ESTA visita, antes de
//    tocar `ultimoDiaConEvento`, que es justamente lo que la garantía consulta.
// 4. El hito, si lo hay, es el único evento de la visita: no comparte cartel.
// 5. Los hallazgos salen de los eventos ya elegidos, nunca al revés.

import { aplicarDecay, horasTranscurridas } from './decay.js';
import { elegirEventos, horasConGarantiaDiaria, diaLocal } from './eventos.js';
import { otorgarPorEventos } from './coleccion.js';
import { hitoPendiente, eventoDeHito } from './gigantes.js';

// `aleatorio` y `azarRaro` son inyectables por la misma razón que en
// elegirEventos y otorgarPorEventos: una visita tiene que poder probarse sin
// depender de dos monedas.
export function abrirVisita({ estado, ahora, aleatorio = Math.random, azarRaro = Math.random }) {
  // `ahora` se resuelve UNA vez y se comparte: el decay y los eventos tienen que
  // estar de acuerdo sobre cuánto tiempo pasó, si no cuentan visitas distintas.
  const horasFuera = horasTranscurridas(estado, ahora);

  let siguiente = aplicarDecay(estado, ahora);

  // Presencia: días distintos en que se abrió el juego. Abrir tres veces el
  // mismo día tiene que contar uno solo.
  const hoy = diaLocal(ahora);
  const diaNuevo = siguiente.ultimoDiaVisitado !== hoy;

  if (diaNuevo) {
    siguiente = {
      ...siguiente,
      diasDePresencia: siguiente.diasDePresencia + 1,
      ultimoDiaVisitado: hoy
    };
  }

  // La garantía diaria entra acá y no adentro de elegirEventos: es una decisión
  // de cadencia sobre las horas de esta visita, y elegirEventos sigue siendo una
  // función de horas a eventos, sin saber qué día es hoy.
  const horasEventos = horasConGarantiaDiaria(horasFuera, siguiente.ultimoDiaConEvento, ahora);

  // Si el arco de un gigante llegó a su hito, ese es el evento de la visita y es
  // el único: es el momento en que el mundo mira a Chip y no comparte cartel con
  // "barrió el pasillo tres". Se anota como vivido para que no vuelva a pasar.
  //
  // El hito NO mira las horas. Un hito pendiente sale aunque vuelvas a los dos
  // minutos, y está bien: se ganó con días de presencia, no con una ausencia.
  const hito = hitoPendiente(siguiente.diasDePresencia, siguiente.hitosVistos);

  const eventos = hito
    ? [eventoDeHito(hito)]
    : elegirEventos(horasEventos, siguiente.ultimosEventosIds, aleatorio);

  if (hito) {
    siguiente = { ...siguiente, hitosVistos: [...siguiente.hitosVistos, hito.id] };
  }

  // Y lo que la visita haya dejado. La colección se calcula acá y viaja con el
  // resto del estado: coleccion.js no toca localStorage, igual que decay.js.
  const hallazgos = otorgarPorEventos(siguiente.coleccion, eventos, azarRaro);

  // Se persisten los ids de TODO lo mostrado para que nada de esta visita pueda
  // repetirse en la siguiente.
  if (eventos.length > 0) {
    siguiente = {
      ...siguiente,
      ultimosEventosIds: eventos.map((evento) => evento.id),
      coleccion: hallazgos.coleccion,
      ultimoDiaConEvento: hoy
    };
  }

  return { estado: siguiente, eventos, hallazgos, horasFuera, diaNuevo };
}
