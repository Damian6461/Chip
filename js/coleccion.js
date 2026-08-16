// Qué juntó Chip. Dueño único del estado de colección.
//
// Funciones puras: reciben la colección —un array de ids— y devuelven una
// nueva, sin tocar la que les dieron. No persiste nada: quien guarda es
// estado.js, llamado desde main.js, igual que con los stats.
//
// El sistema de eventos no sabe que existe esto. Es al revés: acá se recibe lo
// que la visita mostró y se decide qué deja. Un evento que ya dio su objeto
// sigue saliendo como evento puro — ver otorgarPorEventos.

import {
  TIERS_OBJETO,
  PROBABILIDAD_OBJETO_RARO,
  MAX_OBJETOS_POR_VISITA
} from './config.js';
import { OBJETOS, objetosDelEvento } from './datos-objetos.js';

export function tiene(coleccion, id) {
  return coleccion.includes(id);
}

// El pool completo con el estado de cada pieza. Es lo que va a consumir el
// estante: los que faltan también se muestran, apagados, porque una fila
// incompleta es lo que da ganas de completarla.
export function objetosConEstado(coleccion) {
  const tengo = new Set(coleccion);
  return OBJETOS.map((objeto) => ({ ...objeto, obtenido: tengo.has(objeto.id) }));
}

// Lo que la visita deja.
//
// Reglas, en orden:
//
// 1. Un objeto que ya está no se vuelve a otorgar, y su evento NO se saca del
//    pool: sigue apareciendo como evento puro. Sacarlo achicaría el pool a
//    medida que la colección crece —siete de los veinte eventos dejan objeto— y
//    justo los que más se repiten serían los que menos pasan. Que Chip encuentre
//    otra tuerca y no sume nada a la colección es fiel: la tuerca ya la tiene.
//
// 2. Los raros piden una moneda cargada, y se tira UNA vez por visita.
//
// 3. Techo duro de MAX_OBJETOS_POR_VISITA. Un solo evento puede dejar tres
//    objetos, así que sin esto una visita podía entregar cinco.
//
// `azarRaro` es inyectable para que las pruebas sean deterministas, igual que en
// elegirEventos.
export function otorgarPorEventos(coleccion, eventos, azarRaro = Math.random) {
  const tengo = new Set(coleccion);
  const nuevos = [];

  // null = todavía no se tiró. La tirada se hace una sola vez y recién cuando
  // aparece el primer raro candidato: una visita sin raros a tiro no consume
  // suerte.
  let salioElRaro = null;

  for (const evento of eventos) {
    for (const objeto of objetosDelEvento(evento.id)) {
      if (nuevos.length >= MAX_OBJETOS_POR_VISITA) return armar(coleccion, nuevos);
      if (tengo.has(objeto.id)) continue;

      if (objeto.tier === TIERS_OBJETO.raro) {
        if (salioElRaro === null) salioElRaro = azarRaro() < PROBABILIDAD_OBJETO_RARO;
        if (!salioElRaro) continue;
      }

      tengo.add(objeto.id);
      nuevos.push(objeto);
    }
  }

  return armar(coleccion, nuevos);
}

// ---- Lo que quedó tirado en el piso ----
//
// Dos funciones y una regla entre las dos: el objeto del piso ENTRA a la
// colección antes de que la visita reparta nada. Si fuera al revés, un evento de
// esta visita podría otorgar la misma pieza que está tirada y quedaría dos veces
// en el array.
//
// Que se guarde solo no lleva ceremonia: no hay evento, no hay cartel y no hay
// animación de llegada. Pasó mientras no estabas — lo que ves al abrir es el
// resultado, no el momento. La animación de llegada es para lo que llega ahora.
export function guardarLoDelPiso(coleccion, objetoEnPiso) {
  if (!objetoEnPiso || coleccion.includes(objetoEnPiso)) return coleccion;
  return [...coleccion, objetoEnPiso];
}

// Qué puede aparecer tirado: SÓLO lo que Chip todavía no tiene.
//
// La razón no es de balance sino de lectura. Si apareciera algo repetido, el
// jugador lo levantaría, no pasaría nada en la repisa, y el gesto quedaría
// desmentido. Con la colección completa devuelve null y no hay objeto: no queda
// nada que Chip pueda haber encontrado.
export function sortearDelPiso(coleccion, aleatorio = Math.random) {
  const tengo = new Set(coleccion);
  const faltan = OBJETOS.filter((objeto) => !tengo.has(objeto.id));
  if (faltan.length === 0) return null;

  return faltan[Math.min(faltan.length - 1, Math.floor(aleatorio() * faltan.length))].id;
}

function armar(coleccion, nuevos) {
  return {
    coleccion: nuevos.length === 0 ? coleccion : [...coleccion, ...nuevos.map((o) => o.id)],
    nuevos
  };
}
