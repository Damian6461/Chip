// Orquestador: mantiene el estado vivo y conecta los módulos entre sí.

import {
  MS_POR_HORA,
  ESTADOS_VISUALES as E,
  DURACION_ESTADO_ACCION_MS,
  DEBOUNCE_VISUAL_MS,
  TICK_VISUAL_MS,
  PARAM_DEBUG,
  RUTA_SW
} from './config.js';
import { crearEstadoNuevo, cargarEstado, guardarEstado } from './estado.js';
import { aplicarDecay, horasTranscurridas } from './decay.js';
import { cargar, jugar, limpiar } from './acciones.js';
import { elegirEventos } from './eventos.js';
import { cargarSprites, resolverEstadoVisual } from './sprites.js';
import { render as renderUI, mostrarEventos, conectarAcciones } from './ui.js';

let estado = cargarEstado();

// Estado de orquestación. Vive acá y nunca entra al objeto `estado`, así que es
// estructuralmente imposible que guardarEstado lo persista.
let accionEnCurso = null; // nombre del estado visual de la acción, o null
let estadoVisualActual = null;
let ultimoCambioVisual = 0;
let temporizadorAccion = null;
let temporizadorDebounce = null;
let visualForzado = null; // sólo lo escribe el panel de debug
let refrescarDebug = null; // lo setea debug.js si está activo

function pintar() {
  renderUI(estado, estadoVisualActual);
  if (refrescarDebug) refrescarDebug();
}

// El forzado del panel de debug corta la cadena acá, no adentro: sprites.js
// queda puro y sin saber que existe un modo debug.
function resolverObjetivo() {
  if (visualForzado) return visualForzado;
  return resolverEstadoVisual({ estado, ahora: Date.now(), accion: accionEnCurso });
}

function cancelarDebounce() {
  clearTimeout(temporizadorDebounce);
  temporizadorDebounce = null;
}

// Decide si el estado visual puede cambiar ahora. Devuelve true si cambió;
// nunca pinta, pinta el llamador. `inmediato` saltea el debounce: lo usan las
// acciones del jugador, que tienen que responder al toque.
function actualizarVisual({ inmediato = false } = {}) {
  const objetivo = resolverObjetivo();

  if (objetivo === estadoVisualActual) {
    cancelarDebounce();
    return false;
  }

  const transcurrido = Date.now() - ultimoCambioVisual;

  if (inmediato || transcurrido >= DEBOUNCE_VISUAL_MS) {
    cancelarDebounce();
    estadoVisualActual = objetivo;
    ultimoCambioVisual = Date.now();
    return true;
  }

  // Cambio suprimido: se programa un solo timer que al vencer vuelve a resolver
  // la cadena, en vez de reproducir este objetivo, que para entonces puede haber
  // quedado viejo. Así el estado converge siempre y no queda repintado fantasma.
  if (!temporizadorDebounce) {
    temporizadorDebounce = setTimeout(() => {
      temporizadorDebounce = null;
      if (actualizarVisual()) pintar();
    }, DEBOUNCE_VISUAL_MS - transcurrido);
  }

  return false;
}

// Marca el estado visual disparado por una acción y programa su vencimiento.
function marcarAccion(nombreVisual) {
  clearTimeout(temporizadorAccion);
  accionEnCurso = nombreVisual;

  temporizadorAccion = setTimeout(() => {
    temporizadorAccion = null;
    accionEnCurso = null;
    if (actualizarVisual({ inmediato: true })) pintar();
  }, DURACION_ESTADO_ACCION_MS);
}

// Si la acción devuelve el mismo estado, no aplicó (ej: jugar sin batería):
// no se guarda ni se redibuja. Las tres acciones tienen estado visual propio;
// `nombreVisual` acepta null por si alguna futura no lo tuviera.
function ejecutar(nombreVisual, accion) {
  const siguiente = accion(estado);
  if (siguiente === estado) return;

  estado = siguiente;
  guardarEstado(estado);

  if (nombreVisual) marcarAccion(nombreVisual);
  actualizarVisual({ inmediato: true });
  pintar();
}

// ---- Arranque ----

// `ahora` se resuelve una sola vez y se comparte: el decay y los eventos tienen
// que estar de acuerdo sobre cuánto tiempo pasó, si no cuentan visitas distintas.
const ahoraArranque = Date.now();
const horasFuera = horasTranscurridas(estado, ahoraArranque);

estado = aplicarDecay(estado, ahoraArranque);

// Qué hizo Chip mientras no estabas. Se persisten los ids de TODO lo mostrado
// para que nada de esta visita pueda repetirse en la siguiente.
const eventos = elegirEventos(horasFuera, estado.ultimosEventosIds);
if (eventos.length > 0) {
  estado = { ...estado, ultimosEventosIds: eventos.map((evento) => evento.id) };
}

guardarEstado(estado);
mostrarEventos(eventos);

conectarAcciones({
  onCargar: () => ejecutar(E.cargando, cargar),
  onJugar: () => ejecutar(E.jugando, jugar),
  onLimpiar: () => ejecutar(E.limpiando, limpiar)
});

actualizarVisual({ inmediato: true });
cargarSprites().then(pintar);
pintar();

// Reevaluación periódica. Los stats sólo cambian por acción, así que el único
// efecto real de este tick es detectar el cruce de las 23:00 y las 07:00 con la
// app abierta. No toca stats, no aplica decay, no guarda.
setInterval(() => {
  if (actualizarVisual()) pintar();
}, TICK_VISUAL_MS);

// ---- Service worker ----
// Se registra también en desarrollo: localhost es contexto seguro y el SW anda
// ahí sin trucos. Si parece que los cambios no se aplican, es caché: el bloque
// de cabecera de sw.js tiene el procedimiento.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register(RUTA_SW);
}

// ---- Modo debug ----
// Todo lo que el panel necesita del juego pasa por acá: debug.js no importa ni
// estado.js ni decay.js, y el estado vivo nunca sale de este módulo.
const apiDebug = {
  obtenerEstado: () => estado,

  obtenerNombresVisuales: () => Object.values(E),

  // El multiplicador escala cuántas horas representa cada simulación, para
  // probar el decay sin esperar horas reales.
  simularHoras(horas, multiplicador) {
    const retrocedido = {
      ...estado,
      ultimaVisita: estado.ultimaVisita - horas * multiplicador * MS_POR_HORA
    };
    estado = aplicarDecay(retrocedido);
    guardarEstado(estado);
    actualizarVisual({ inmediato: true });
    pintar();
  },

  // Retrocede ultimaVisita SIN aplicar decay y recarga, para que el arranque
  // corra completo igual que si hubieras cerrado y vuelto a abrir la app.
  // simularHoras no sirve para esto: aplica el decay en el momento, así que al
  // recargar ya no quedan horas transcurridas y los eventos nunca se disparan.
  volverTrasHoras(horas, multiplicador) {
    guardarEstado({
      ...estado,
      ultimaVisita: estado.ultimaVisita - horas * multiplicador * MS_POR_HORA
    });
    location.reload();
  },

  forzarEstadoVisual(nombre) {
    visualForzado = nombre;
    actualizarVisual({ inmediato: true });
    pintar();
  },

  reiniciarSave() {
    estado = crearEstadoNuevo();
    guardarEstado(estado);
    actualizarVisual({ inmediato: true });
    pintar();
  }
};

// Import dinámico: sin ?debug en la URL, debug.js no se descarga.
// iniciarDebug devuelve su refresco, que pintar() engancha para que la lectura
// de stats siga a los botones del juego y no sólo a los del panel.
if (new URLSearchParams(location.search).has(PARAM_DEBUG)) {
  import('./debug.js').then(({ iniciarDebug }) => {
    refrescarDebug = iniciarDebug(apiDebug);
  });
}
