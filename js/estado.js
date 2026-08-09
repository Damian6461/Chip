// Único módulo que toca localStorage.

import {
  SAVE_KEY,
  VERSION_ESTADO,
  NOMBRE_INICIAL,
  STAT_INICIAL
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
    version: VERSION_ESTADO
  };
}

export function cargarEstado() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return crearEstadoNuevo();

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return crearEstadoNuevo();
    return parsed;
  } catch (e) {
    return crearEstadoNuevo();
  }
}

export function guardarEstado(estado) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(estado));
}
