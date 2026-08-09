// Único lugar donde viven los números del juego.
// Ningún otro módulo define constantes numéricas: todo se importa desde acá.

// ---- Persistencia ----

export const SAVE_KEY = 'chip.save.v1';
export const VERSION_ESTADO = 1;

// ---- Estado inicial ----

export const NOMBRE_INICIAL = 'Chip';
export const STAT_INICIAL = 100;

// ---- Tiempo ----

export const MS_POR_HORA = 3_600_000;

// ---- Stats ----

export const STAT_MIN = 0;
export const STAT_MAX = 100;

// ---- Decay ----

export const DECAY_POR_HORA = {
  bateria: 5,
  humor: 3.3,
  mantenimiento: 1.7
};

// Piso del paso del tiempo: el decay nunca deja un stat en 0.
export const DECAY_FLOOR = 10;

// Cap offline: por más días que pasen, se cobran como máximo estas horas.
export const MAX_DECAY_HOURS = 24;

// ---- Acciones ----

export const JUGAR_BATERIA_MINIMA = 15;

export const VALORES_ACCION = {
  cargar: { bateria: 40 },
  jugar: { humor: 30, bateria: -10 },
  limpiar: { mantenimiento: 50 }
};

// Duración de un estado visual disparado por una acción (ej: la animación de
// "comiendo" tras cargar) y ventana de debounce del render.
// Declarados acá para que el número viva en un solo lugar; todavía no hay
// ningún consumidor: el render actual es directo y sin estados temporales.
export const DURACION_ESTADO_ACCION_MS = 1000;
export const DEBOUNCE_VISUAL_MS = 100;

// ---- Placeholder del canvas (cuando no hay sprite disponible) ----

export const PLACEHOLDER = {
  proporcion: 0.5,
  colorRelleno: '#2a2d38',
  colorBorde: '#4a4f5e',
  grosorBorde: 2,
  colorTexto: '#e6e6e6',
  fuente: '20px system-ui, sans-serif'
};
