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
import { elegirEventos, horasConGarantiaDiaria, diaLocal } from './eventos.js';
import { otorgarPorEventos } from './coleccion.js';
import { OBJETOS } from './datos-objetos.js';
import { cargarSprites, resolverEstadoVisual, esDeNoche } from './sprites.js';
import { render as renderUI, mostrarEventos, conectarAcciones, animarAccion } from './ui.js';

let estado = cargarEstado();

// Estado de orquestación. Vive acá y nunca entra al objeto `estado`, así que es
// estructuralmente imposible que guardarEstado lo persista.
let accionEnCurso = null; // nombre del estado visual de la acción, o null
let estadoVisualActual = null;
let ultimoCambioVisual = 0;
let temporizadorAccion = null;
let temporizadorDebounce = null;
let visualForzado = null; // sólo lo escribe el panel de debug
let horaForzada = null; // ídem: 0-23, o null para el reloj real
let esNocheActual = null;
let refrescarDebug = null; // lo setea debug.js si está activo

// Reloj efectivo: el real, salvo que el panel de debug esté forzando una hora.
// Lo comparten la cadena de estados y el fondo del galpón, así el sprite y la
// hora del día no pueden discrepar: si Chip está en standby, afuera es de noche.
function relojEfectivo() {
  if (horaForzada === null) return Date.now();

  const fecha = new Date();
  fecha.setHours(horaForzada, 0, 0, 0);
  return fecha.getTime();
}

function pintar() {
  renderUI(estado, estadoVisualActual, esNocheActual);
  if (refrescarDebug) refrescarDebug();
}

// El forzado del panel de debug corta la cadena acá, no adentro: sprites.js
// queda puro y sin saber que existe un modo debug.
function resolverObjetivo() {
  if (visualForzado) return visualForzado;
  return resolverEstadoVisual({ estado, ahora: relojEfectivo(), accion: accionEnCurso });
}

// Mismo contrato que actualizarVisual: devuelve si cambió, nunca pinta.
function actualizarNoche() {
  const noche = esDeNoche(relojEfectivo());
  if (noche === esNocheActual) return false;

  esNocheActual = noche;
  return true;
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

  // Salta sólo si la acción se aplicó: el early return de arriba ya filtró los
  // casos en que no pasó nada, y un salto sin efecto sería mentirle al jugador.
  animarAccion();

  actualizarVisual({ inmediato: true });
  pintar();
}

// ---- Arranque ----

// `ahora` se resuelve una sola vez y se comparte: el decay y los eventos tienen
// que estar de acuerdo sobre cuánto tiempo pasó, si no cuentan visitas distintas.
const ahoraArranque = Date.now();
const horasFuera = horasTranscurridas(estado, ahoraArranque);

estado = aplicarDecay(estado, ahoraArranque);

// Qué hizo Chip mientras no estabas.
//
// La garantía diaria entra acá y no adentro de elegirEventos: es una decisión de
// cadencia sobre las horas de esta visita, y elegirEventos sigue siendo una
// función de horas a eventos, sin saber qué día es hoy.
const horasEventos = horasConGarantiaDiaria(
  horasFuera,
  estado.ultimoDiaConEvento,
  ahoraArranque
);

// Se persisten los ids de TODO lo mostrado para que nada de esta visita pueda
// repetirse en la siguiente.
const eventos = elegirEventos(horasEventos, estado.ultimosEventosIds);

// Y lo que la visita haya dejado. La colección se calcula acá y se guarda con
// el resto del estado: coleccion.js no toca localStorage, igual que decay.js.
const hallazgos = otorgarPorEventos(estado.coleccion, eventos);

if (eventos.length > 0) {
  estado = {
    ...estado,
    ultimosEventosIds: eventos.map((evento) => evento.id),
    coleccion: hallazgos.coleccion,
    ultimoDiaConEvento: diaLocal(ahoraArranque)
  };
}

guardarEstado(estado);
mostrarEventos(eventos);

conectarAcciones({
  onCargar: () => ejecutar(E.cargando, cargar),
  onJugar: () => ejecutar(E.jugando, jugar),
  onLimpiar: () => ejecutar(E.limpiando, limpiar)
});

actualizarVisual({ inmediato: true });
actualizarNoche();
cargarSprites().then(pintar);
pintar();

// Reevaluación periódica. Los stats sólo cambian por acción, así que el único
// efecto real de este tick es detectar el cruce de las 23:00 y las 07:00 con la
// app abierta. No toca stats, no aplica decay, no guarda.
//
// Los dos chequeos corren SIEMPRE, sin cortocircuito: el fondo puede tener que
// cambiar aunque el estado visual no se mueva. Con la batería en critico, cruzar
// las 23:00 no cambia el sprite —critico le gana a standby— pero el galpón sí
// se tiene que hacer de noche.
setInterval(() => {
  const cambioEstado = actualizarVisual();
  const cambioNoche = actualizarNoche();
  if (cambioEstado || cambioNoche) pintar();
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

  // Para que el panel pueda mostrar "3/8" sin importar datos-objetos.js por su
  // cuenta: todo lo que el debug sabe del juego pasa por acá.
  totalDeObjetos: () => OBJETOS.length,

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

  // Mueve el reloj entero, no sólo el sprite: por eso el fondo y el estado
  // visual cambian juntos y no puede quedar Chip durmiendo con el galpón de día.
  forzarHora(hora) {
    horaForzada = hora;
    actualizarVisual({ inmediato: true });
    actualizarNoche();
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
