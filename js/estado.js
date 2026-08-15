// Único módulo que toca localStorage.

import {
  SAVE_KEY,
  VERSION_ESTADO,
  NOMBRE_INICIAL,
  STAT_INICIAL,
  EVENTOS_INICIALES_IDS,
  COLECCION_INICIAL,
  PRESENCIA_INICIAL,
  HITOS_INICIALES
} from './config.js';

export function crearEstadoNuevo() {
  const ahora = Date.now();
  return {
    nombre: NOMBRE_INICIAL,
    bateria: STAT_INICIAL,
    humor: STAT_INICIAL,
    mantenimiento: STAT_INICIAL,
    ultimaVisita: ahora,
    creado: ahora,
    ultimosEventosIds: [...EVENTOS_INICIALES_IDS],
    // Los ids de lo que Chip ya juntó. Ver coleccion.js.
    coleccion: [...COLECCION_INICIAL],
    // Último día calendario en que la visita mostró eventos, para la garantía
    // diaria. null en una partida nueva: la primera visita ya cuenta como día
    // sin estrenar y trae algo.
    ultimoDiaConEvento: null,
    // Días distintos en que se abrió el juego. Es lo único que hace avanzar el
    // arco de los gigantes: estar, no hacer.
    diasDePresencia: PRESENCIA_INICIAL,
    ultimoDiaVisitado: null,
    // Hitos ya vividos, para que el momento pase una sola vez en la partida.
    hitosVistos: [...HITOS_INICIALES],
    version: VERSION_ESTADO
  };
}

// Normaliza un save viejo a la forma actual. El merge va con los defaults
// primero: así cualquier campo que se agregue en el futuro entra solo y no hace
// falta una rama por versión. Un save sin `version`, con una vieja o con una
// desconocida se arregla igual, y lo guardado siempre gana sobre el default.
//
// No guarda: main.js llama guardarEstado apenas termina el decay, así que la
// migración persiste sola y este módulo no toma decisiones de orquestación.
function migrar(guardado) {
  if (guardado.version === VERSION_ESTADO) return guardado;

  const migrado = {
    ...crearEstadoNuevo(),
    ...guardado,
    version: VERSION_ESTADO
  };

  // v4 -> v5: los tres campos del arco de gigantes también son nuevos y también
  // los trajo el merge. Una partida vieja arranca el arco desde cero, que es lo
  // correcto: la presencia se cuenta desde que existe el contador, no se inventa
  // hacia atrás.

  // v3 -> v4: `coleccion` y `ultimoDiaConEvento` son campos NUEVOS, así que el
  // merge de arriba ya los trajo con su default. No hace falta un paso propio, y
  // ese es justamente el punto del merge-primero: una partida de meses cruza a
  // v4 con la colección vacía y la garantía diaria lista, sin código de puente.

  // v2 -> v3: ultimoEventoId (uno) pasó a ultimosEventosIds (todos los de la
  // última visita). El merge de arriba resuelve los campos que sólo se agregan;
  // un campo que cambia de forma necesita su paso explícito, si no el viejo
  // queda colgado en el save para siempre.
  if ('ultimoEventoId' in migrado) {
    if (migrado.ultimoEventoId && !Array.isArray(guardado.ultimosEventosIds)) {
      migrado.ultimosEventosIds = [migrado.ultimoEventoId];
    }
    delete migrado.ultimoEventoId;
  }

  return migrado;
}

export function cargarEstado() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return crearEstadoNuevo();

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return crearEstadoNuevo();
    return migrar(parsed);
  } catch (e) {
    return crearEstadoNuevo();
  }
}

export function guardarEstado(estado) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(estado));
}
