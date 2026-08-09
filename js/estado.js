// Único módulo que toca localStorage.

import {
  SAVE_KEY,
  VERSION_ESTADO,
  NOMBRE_INICIAL,
  STAT_INICIAL,
  EVENTO_INICIAL_ID
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
    ultimoEventoId: EVENTO_INICIAL_ID,
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

  return {
    ...crearEstadoNuevo(),
    ...guardado,
    version: VERSION_ESTADO
  };
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
