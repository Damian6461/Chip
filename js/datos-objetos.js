// Las cosas que Chip junta. Igual que datos-eventos.js: acá viaja el contenido,
// no la lógica.
//
// El mapeo evento -> objeto sale de loop-brief.md. Un evento puede dejar más de
// un objeto (el 8 deja tres) y la mayoría de los eventos no deja ninguno: la
// mezcla de eventos-con-objeto y eventos-puros es parte del ritmo, no un
// pendiente.
//
// La línea del canon NO se copia acá. Cada objeto apunta a su evento por id y el
// texto se toma de datos-eventos.js, que es donde lo puso el brief. Copiarlo
// sería tener dos originales del mismo texto y que se separen en la primera
// corrección editorial.

import { EVENTOS } from './datos-eventos.js';
import { TIERS_OBJETO } from './config.js';

const CATALOGO = [
  {
    id: 'tuerca-cabeza',
    nombre: 'Tuerca del tamaño de su cabeza',
    tier: TIERS_OBJETO.comun,
    eventoId: 'evento-06'
  },
  {
    id: 'cable-enrollado',
    nombre: 'Cable enrollado prolijo',
    tier: TIERS_OBJETO.comun,
    eventoId: 'evento-07'
  },
  {
    id: 'resorte',
    nombre: 'Resorte',
    tier: TIERS_OBJETO.comun,
    eventoId: 'evento-08'
  },
  {
    id: 'arandela-dorada',
    nombre: 'Arandela dorada',
    tier: TIERS_OBJETO.comun,
    eventoId: 'evento-08'
  },
  {
    // El único raro del pool inicial. Que salga del mismo evento que dos comunes
    // es lo que obligó a poner la tirada de rareza en el objeto y no en el
    // evento: ver otorgarPorEventos en coleccion.js.
    id: 'cosa-sin-nombre',
    nombre: 'La-cosa-que-no-sabe-qué-es',
    tier: TIERS_OBJETO.raro,
    eventoId: 'evento-08'
  },
  {
    id: 'tornillo-perfecto',
    nombre: 'Tornillo perfecto',
    tier: TIERS_OBJETO.comun,
    eventoId: 'evento-09'
  },
  {
    id: 'nota-tanque',
    nombre: 'Nota nueva',
    tier: TIERS_OBJETO.comun,
    eventoId: 'evento-17'
  },
  {
    id: 'marca-derrape',
    nombre: 'Marca de derrape',
    tier: TIERS_OBJETO.comun,
    eventoId: 'evento-20'
  }
];

const TEXTO_POR_EVENTO = new Map(EVENTOS.map((evento) => [evento.id, evento.texto]));

// `canon` se deriva del evento: es la línea que trajo el objeto, y es lo que la
// vista de colección va a mostrar como su historia.
export const OBJETOS = CATALOGO.map((objeto) => ({
  ...objeto,
  canon: TEXTO_POR_EVENTO.get(objeto.eventoId) ?? null
}));

// Índice para no recorrer el catálogo entero en cada visita.
const POR_EVENTO = new Map();
for (const objeto of OBJETOS) {
  const lista = POR_EVENTO.get(objeto.eventoId) ?? [];
  lista.push(objeto);
  POR_EVENTO.set(objeto.eventoId, lista);
}

export function objetosDelEvento(eventoId) {
  return POR_EVENTO.get(eventoId) ?? [];
}

export function objetoPorId(id) {
  return OBJETOS.find((objeto) => objeto.id === id) ?? null;
}
