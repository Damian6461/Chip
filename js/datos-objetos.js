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
  },

  // ---- Los 28 que completan el pool ----
  //
  // Cada uno sale de SU evento y de ninguno más: acá la relación es uno a uno, a
  // diferencia de los ocho de arriba, donde el evento 8 deja tres objetos. Eso
  // hace que el techo de MAX_OBJETOS_POR_VISITA casi nunca se toque con estos, y
  // está bien: el techo existe para el caso raro, no para el común.
  {
    id: 'bulon-doce',
    nombre: 'Bulón del doce',
    tier: TIERS_OBJETO.comun,
    eventoId: 'evento-a1'
  },
  {
    id: 'chapa-pez',
    nombre: 'Chapa con forma de pez',
    tier: TIERS_OBJETO.comun,
    eventoId: 'evento-a2'
  },
  {
    id: 'resto-embalaje',
    nombre: 'Resto de embalaje',
    tier: TIERS_OBJETO.comun,
    eventoId: 'evento-a3'
  },
  {
    id: 'media-junta',
    nombre: 'Media junta de goma',
    tier: TIERS_OBJETO.comun,
    eventoId: 'evento-a4'
  },
  {
    id: 'llave-once',
    nombre: 'Llave de once',
    tier: TIERS_OBJETO.comun,
    eventoId: 'evento-a5'
  },
  {
    id: 'perno-doblado',
    nombre: 'Perno doblado',
    tier: TIERS_OBJETO.comun,
    eventoId: 'evento-a6'
  },
  {
    id: 'tapa-valvula',
    nombre: 'Tapa de válvula',
    tier: TIERS_OBJETO.comun,
    eventoId: 'evento-a7'
  },
  {
    id: 'cinta-metrica',
    nombre: 'Cinta métrica rota',
    tier: TIERS_OBJETO.comun,
    eventoId: 'evento-a8'
  },
  {
    id: 'rodamiento',
    nombre: 'Rodamiento suelto',
    tier: TIERS_OBJETO.comun,
    eventoId: 'evento-a9'
  },
  {
    id: 'trozo-manguera',
    nombre: 'Trozo de manguera',
    tier: TIERS_OBJETO.comun,
    eventoId: 'evento-a10'
  },
  {
    id: 'remache-carguero',
    nombre: 'Remache del carguero',
    tier: TIERS_OBJETO.comun,
    eventoId: 'evento-b1'
  },
  {
    id: 'eslabon-grua',
    nombre: 'Eslabón de la grúa',
    tier: TIERS_OBJETO.comun,
    eventoId: 'evento-b2'
  },
  {
    id: 'filtro-descartado',
    nombre: 'Filtro descartado',
    tier: TIERS_OBJETO.comun,
    eventoId: 'evento-b3'
  },
  {
    id: 'placa-numero',
    nombre: 'Placa con número',
    tier: TIERS_OBJETO.comun,
    eventoId: 'evento-b4'
  },
  {
    id: 'muelle-industrial',
    nombre: 'Muelle industrial',
    tier: TIERS_OBJETO.comun,
    eventoId: 'evento-b5'
  },
  {
    id: 'guante-trabajo',
    nombre: 'Guante de trabajo',
    tier: TIERS_OBJETO.comun,
    eventoId: 'evento-b6'
  },
  {
    id: 'terminal-quemada',
    nombre: 'Terminal quemada',
    tier: TIERS_OBJETO.comun,
    eventoId: 'evento-b7'
  },
  {
    id: 'pastilla-freno',
    nombre: 'Pastilla de freno gastada',
    tier: TIERS_OBJETO.comun,
    eventoId: 'evento-b8'
  },
  {
    id: 'hoja-seca',
    nombre: 'Hoja seca',
    tier: TIERS_OBJETO.comun,
    eventoId: 'evento-c1'
  },
  {
    id: 'piedra-lisa',
    nombre: 'Piedra lisa',
    tier: TIERS_OBJETO.comun,
    eventoId: 'evento-c2'
  },
  {
    id: 'pluma',
    nombre: 'Pluma',
    tier: TIERS_OBJETO.comun,
    eventoId: 'evento-c3'
  },
  {
    id: 'papel-humedad',
    nombre: 'Papel con humedad',
    tier: TIERS_OBJETO.comun,
    eventoId: 'evento-c4'
  },
  {
    id: 'semilla-alas',
    nombre: 'Semilla con alas',
    tier: TIERS_OBJETO.comun,
    eventoId: 'evento-c5'
  },
  {
    id: 'pieza-desconocida',
    nombre: 'Pieza de ningún robot conocido',
    tier: TIERS_OBJETO.raro,
    eventoId: 'evento-d1'
  },
  {
    id: 'foto',
    nombre: 'Foto',
    tier: TIERS_OBJETO.raro,
    eventoId: 'evento-d2'
  },
  {
    id: 'llave-etiqueta',
    nombre: 'Llave con etiqueta',
    tier: TIERS_OBJETO.raro,
    eventoId: 'evento-d3'
  },
  {
    id: 'engranaje-dorado',
    nombre: 'Engranaje dorado',
    tier: TIERS_OBJETO.raro,
    eventoId: 'evento-d4'
  },
  {
    id: 'caja-suena',
    nombre: 'Lo que suena adentro',
    tier: TIERS_OBJETO.raro,
    eventoId: 'evento-d5'
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
