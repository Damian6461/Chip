// Los cuatro grandes del galpón.
//
// REGLA DE TONO, textual del brief y no negociable: los gigantes nunca se
// vuelven amigos. Notar ≠ adoptar. El máximo del arco es un gesto — el mundo
// sigue siendo enorme e indiferente; sólo que una vez, te vio. Eso es lo que lo
// hace valer.
//
// Cada gigante se revela por capas según la presencia acumulada: días distintos
// en que el jugador abrió el juego, no visitas y no tareas. Estar es lo único
// que hace avanzar esto.
//
// Igual que los objetos, el texto del hito NO se copia: sale del evento que ya
// existe en datos-eventos.js. El detalle sí es texto propio de este archivo,
// porque no es un evento — es lo que Chip fue entendiendo del gigante.

import { EVENTO_RARO } from './datos-eventos.js';

const CATALOGO = [
  {
    id: 'grua-vieja',
    nombre: 'La grúa vieja',
    // Del canon, evento 13: "Chip la miró desde un lugar seguro. Le parece que
    // la grúa hace bien su trabajo, aunque nadie se lo dice."
    detalle: 'Chip la mira trabajar desde un lugar seguro. Le parece que hace bien su trabajo.',
    // El hito es el evento que ya estaba escrito: la grúa que baja el brazo.
    hitoEventoId: EVENTO_RARO.id
  },
  {
    id: 'carguero',
    nombre: 'El carguero de siete metros',
    // Contenido en la pasada editorial. La estructura ya está: cuando el texto
    // exista, entra acá y el arco funciona sin tocar una línea de lógica.
    detalle: null,
    hitoEventoId: null
  },
  {
    id: 'robot-de-carga',
    nombre: 'El robot de carga',
    detalle: null,
    hitoEventoId: null
  },
  {
    id: 'mantenimiento-pesado',
    // Como grupo, no como individuo: en el canon son "los de mantenimiento
    // pesado" y nunca se separan.
    nombre: 'Los de mantenimiento pesado',
    detalle: null,
    hitoEventoId: null
  }
];

const TEXTO_HITO = new Map([[EVENTO_RARO.id, EVENTO_RARO.texto]]);

export const GIGANTES = CATALOGO.map((gigante) => ({
  ...gigante,
  hito: gigante.hitoEventoId ? TEXTO_HITO.get(gigante.hitoEventoId) ?? null : null
}));

export function gigantePorId(id) {
  return GIGANTES.find((gigante) => gigante.id === id) ?? null;
}
