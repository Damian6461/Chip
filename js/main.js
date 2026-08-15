// Orquestador: mantiene el estado vivo y conecta los módulos entre sí.

import {
  MS_POR_HORA,
  ESTADOS_VISUALES as E,
  DURACION_ESTADO_ACCION_MS,
  DEBOUNCE_VISUAL_MS,
  TICK_VISUAL_MS,
  CATEGORIA_GRANDES,
  DURACION_ESPERANDO_MS,
  ESPERA_SEGUNDO_EVENTO_MS,
  PROBABILIDAD_CAMBIO_POSE,
  PARAM_DEBUG,
  RUTA_SW
} from './config.js';
import { crearEstadoNuevo, cargarEstado, guardarEstado } from './estado.js';
import { aplicarDecay, horasTranscurridas } from './decay.js';
import { cargar, jugar, limpiar } from './acciones.js';
import { elegirEventos, horasConGarantiaDiaria, diaLocal } from './eventos.js';
import { otorgarPorEventos } from './coleccion.js';
import { OBJETOS } from './datos-objetos.js';
import { hitoPendiente, eventoDeHito, capaPorDias } from './gigantes.js';
import {
  cargarSprites,
  resolverEstadoVisual,
  esDeNoche,
  franjaDeLuz,
  poseDeIdle
} from './sprites.js';
import {
  render as renderUI,
  mostrarEventos,
  mostrarColeccion,
  mostrarGigantes,
  conectarAcciones,
  animarAccion,
  celebrarHumor
} from './ui.js';

let estado = cargarEstado();

// Estado de orquestación. Vive acá y nunca entra al objeto `estado`, así que es
// estructuralmente imposible que guardarEstado lo persista.
let accionEnCurso = null; // nombre del estado visual de la acción, o null
let estadoVisualActual = null;
let ultimoCambioVisual = 0;
let temporizadorAccion = null;
let temporizadorDebounce = null;
let gigantePasando = false; // true mientras se lee un evento de la categoría grandes
let temporizadoresGigante = [];
let poseIdle = 0; // qué PNG de idle se está dibujando
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
  renderUI(estado, estadoVisualActual, esNocheActual, franjaDeLuz(relojEfectivo()), claveDeSprite());
  if (refrescarDebug) refrescarDebug();
}

// El forzado del panel de debug corta la cadena acá, no adentro: sprites.js
// queda puro y sin saber que existe un modo debug.
function resolverObjetivo() {
  if (visualForzado) return visualForzado;
  return resolverEstadoVisual({
    estado,
    ahora: relojEfectivo(),
    accion: accionEnCurso,
    gigantePasando
  });
}

// Qué PNG le toca dibujar. El ESTADO lo resuelve la cadena; la POSE sólo existe
// adentro de idle y no participa de ninguna condición. Los demás estados son su
// propia clave.
function claveDeSprite() {
  return estadoVisualActual === E.idle ? poseDeIdle(poseIdle) : estadoVisualActual;
}

// Chip se acomoda. Corre en el tick visual —uno por minuto— y sólo a veces, para
// que el cambio no sea metronómico: dos poses alternándose cada 60 segundos
// exactos se leen como una animación lenta, y esto no es una animación.
function rotarPoseIdle() {
  if (estadoVisualActual !== E.idle) return false;
  if (Math.random() >= PROBABILIDAD_CAMBIO_POSE) return false;
  poseIdle += 1;
  return true;
}

// Prende `esperando` en el momento en que cada evento de la categoría grandes
// aparece en pantalla, y lo apaga solo. El reloj es el mismo que usa ui.js para
// encadenar los eventos, así que la pose y el texto entran juntos: Chip cruza
// los brazos cuando se lee que pasó un gigante, no antes ni después.
//
// Los timers viven acá porque main.js es el único módulo que tiene timers. La
// alternativa —que ui.js se fije en la categoría al pintar el texto— pondría
// una decisión de estado en el módulo que sólo pinta.
function programarEsperando(eventos) {
  temporizadoresGigante.forEach(clearTimeout);
  temporizadoresGigante = [];

  eventos.forEach((evento, i) => {
    if (evento.categoria !== CATEGORIA_GRANDES) return;

    const arranque = ESPERA_SEGUNDO_EVENTO_MS * i;

    temporizadoresGigante.push(
      setTimeout(() => {
        gigantePasando = true;
        if (actualizarVisual({ inmediato: true })) pintar();
      }, arranque),
      setTimeout(() => {
        gigantePasando = false;
        if (actualizarVisual({ inmediato: true })) pintar();
      }, arranque + DURACION_ESPERANDO_MS)
    );
  });
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

  // Se mira el humor ANTES de reemplazar el estado. La celebración no se dispara
  // por "jugar" sino por "el humor subió": con el humor en 100 la acción se
  // aplica igual —gasta batería— pero no hay nada que festejar. Así la regla
  // vale también para cualquier acción futura que suba humor.
  const subioElHumor = siguiente.humor > estado.humor;

  estado = siguiente;
  guardarEstado(estado);

  if (subioElHumor) celebrarHumor();

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

// Presencia: días distintos en que se abrió el juego. Se cuenta antes que nada
// más porque el arco de los gigantes depende de esto, y abrir tres veces el
// mismo día tiene que contar uno solo.
const hoy = diaLocal(ahoraArranque);
if (estado.ultimoDiaVisitado !== hoy) {
  estado = {
    ...estado,
    diasDePresencia: estado.diasDePresencia + 1,
    ultimoDiaVisitado: hoy
  };
}

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

// Si el arco de un gigante llegó a su hito, ese es el evento de la visita y es
// el único: es el momento en que el mundo mira a Chip y no comparte cartel con
// "barrió el pasillo tres". Se anota como vivido para que no vuelva a pasar.
const hito = hitoPendiente(estado.diasDePresencia, estado.hitosVistos);

// Se persisten los ids de TODO lo mostrado para que nada de esta visita pueda
// repetirse en la siguiente.
const eventos = hito
  ? [eventoDeHito(hito)]
  : elegirEventos(horasEventos, estado.ultimosEventosIds);

if (hito) {
  estado = { ...estado, hitosVistos: [...estado.hitosVistos, hito.id] };
}

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
programarEsperando(eventos);
mostrarColeccion(estado.coleccion, hallazgos.nuevos);
mostrarGigantes(estado.diasDePresencia, estado.hitosVistos);

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
  const cambioPose = rotarPoseIdle();
  if (cambioEstado || cambioNoche || cambioPose) pintar();
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

  // Cambia la pose de idle a mano. Con la rotación real corriendo una vez por
  // minuto y con moneda, esperar a verla es incómodo; esto la fuerza.
  cambiarPose: () => {
    poseIdle += 1;
    pintar();
    return claveDeSprite();
  },

  // Para que el panel pueda mostrar "3/8" sin importar datos-objetos.js por su
  // cuenta: todo lo que el debug sabe del juego pasa por acá.
  totalDeObjetos: () => OBJETOS.length,

  // La capa que alcanzó el arco con la presencia de hoy, para verlo avanzar en
  // el panel sin abrir la colección.
  capaDeLaGrua: () => capaPorDias(estado.diasDePresencia),

  // Suma el primer objeto que falte, para poder ver el estante poblado sin
  // esperar a que el sorteo lo traiga. Pasa por el mismo camino que un hallazgo
  // real: cambia el estado, se guarda y se repinta.
  sumarObjeto() {
    const falta = OBJETOS.find((objeto) => !estado.coleccion.includes(objeto.id));
    if (!falta) return;

    estado = { ...estado, coleccion: [...estado.coleccion, falta.id] };
    guardarEstado(estado);
    mostrarColeccion(estado.coleccion, [falta]);
    pintar();
  },

  // Simula presencia acumulada para ver el arco de los gigantes avanzar sin
  // esperar meses. No recarga: repinta la colección en el lugar, así se puede
  // ver la capa cambiar con el panel abierto.
  sumarDias(dias) {
    estado = { ...estado, diasDePresencia: estado.diasDePresencia + dias };
    guardarEstado(estado);
    mostrarGigantes(estado.diasDePresencia, estado.hitosVistos);
    pintar();
  },

  // Dispara el hito que esté pendiente, si lo hay, sin esperar a la próxima
  // apertura. Devuelve el texto para poder verificarlo desde el panel.
  dispararHito() {
    const pendiente = hitoPendiente(estado.diasDePresencia, estado.hitosVistos);
    if (!pendiente) return null;

    estado = { ...estado, hitosVistos: [...estado.hitosVistos, pendiente.id] };
    guardarEstado(estado);

    const evento = eventoDeHito(pendiente);
    mostrarEventos([evento]);
    // El mismo par que en el arranque. Si acá faltara, el hito de la grúa —que
    // es de la categoría `grandes`— saldría por debug sin la pose, y el panel
    // estaría probando un camino que no es el del juego.
    programarEsperando([evento]);
    mostrarGigantes(estado.diasDePresencia, estado.hitosVistos);
    pintar();
    return pendiente.hito;
  },

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
