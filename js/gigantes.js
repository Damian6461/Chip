// El arco de los gigantes: qué se sabe de cada uno según cuánto estuviste.
//
// Funciones puras sobre dos datos del save: los días de presencia y los hitos ya
// vistos. No persiste nada y no conoce el DOM.
//
// El evento de la grúa que baja el brazo YA NO se sortea. Antes salía con una
// moneda cargada al 1.5% por visita; ahora es el final del arco de la grúa y se
// dispara una sola vez, cuando la presencia llega al umbral. La escasez es la
// misma; lo que cambia es que ahora significa algo.

import { CAPAS_GIGANTE, UMBRALES_GIGANTE } from './config.js';
import { GIGANTES } from './datos-gigantes.js';

// La capa más alta que los días alcanzan. Un gigante sin contenido para esa capa
// —los tres que esperan la pasada editorial— igual la alcanza: la capa es del
// arco, el contenido es del brief.
export function capaPorDias(dias) {
  let alcanzada = CAPAS_GIGANTE[0];

  for (const capa of CAPAS_GIGANTE) {
    if (dias >= UMBRALES_GIGANTE[capa]) alcanzada = capa;
  }

  return alcanzada;
}

function indiceDeCapa(capa) {
  return CAPAS_GIGANTE.indexOf(capa);
}

// ¿Llegó a esta capa o más?
export function alcanzo(dias, capa) {
  return indiceDeCapa(capaPorDias(dias)) >= indiceDeCapa(capa);
}

// Lo que la vista de colección necesita: cada gigante con lo que se sabe de él.
// Lo que todavía no se reveló viaja en null, no en string vacío: null es "no se
// sabe" y "" sería "se sabe que no hay nada".
export function gigantesConEstado(dias, hitosVistos = []) {
  const vistos = new Set(hitosVistos);

  return GIGANTES.map((gigante) => {
    const capa = capaPorDias(dias);
    const sabeNombre = alcanzo(dias, 'nombre');
    const sabeDetalle = alcanzo(dias, 'detalle');
    const llegoAlHito = alcanzo(dias, 'hito');

    return {
      id: gigante.id,
      capa,
      nombre: sabeNombre ? gigante.nombre : null,
      detalle: sabeDetalle ? gigante.detalle : null,
      // El hito sólo se muestra en la colección después de haberlo vivido: leerlo
      // ahí antes de que pase sería spoilear el único momento del juego.
      hito: llegoAlHito && vistos.has(gigante.id) ? gigante.hito : null,
      hitoVivido: vistos.has(gigante.id)
    };
  });
}

// ¿Hay un hito para disparar en esta visita?
//
// Pide tres cosas: que la presencia haya llegado al umbral, que el gigante tenga
// un hito escrito —los otros tres todavía no— y que no se haya vivido ya. Ese
// último chequeo es el que lo hace único en la vida de la partida: los días
// siguen subiendo, pero el momento pasa una sola vez.
export function hitoPendiente(dias, hitosVistos = []) {
  if (!alcanzo(dias, 'hito')) return null;

  const vistos = new Set(hitosVistos);
  return (
    GIGANTES.find((gigante) => gigante.hito !== null && !vistos.has(gigante.id)) ?? null
  );
}

// El hito como evento, para que lo muestre el mismo camino que muestra todo lo
// demás. El id es el del evento original: así la exclusión de la visita anterior
// y el save lo tratan como a cualquier otro.
export function eventoDeHito(gigante) {
  return { id: gigante.hitoEventoId, texto: gigante.hito, categoria: 'grandes' };
}
