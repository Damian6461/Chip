// La sesión viva: todo lo que pasa entre que la app abre y que se cierra.
//
// Es una fábrica y no un módulo con estado de archivo, y eso es lo que la hace
// probable: cada prueba arma su propia sesión con su propio reloj y su propia
// vista falsa, sin que una filtre en la otra. Estaba en main.js, donde el estado
// vivía en variables de módulo y el reloj era `Date.now` a secas.
//
// Las tres dependencias que recibe son exactamente las tres cosas que este
// módulo NO tiene derecho a hacer solo:
//
// - `vista`: pintar. Sigue valiendo que ui.js es el único que toca el DOM.
// - `reloj`: leer la hora y programar timers. Sigue valiendo que los timers
//   reales los pone main.js — acá se usan los que main.js inyecta.
// - `guardar`: escribir el save. Sigue valiendo que estado.js es el único que
//   toca localStorage.
//
// El reloj tiene DOS lecturas y no una, y la diferencia es real:
//
// - `mundo()` es la hora del juego, la que el panel de debug puede forzar. La
//   consultan la cadena de estados y el tramo del día.
// - `real()` es el reloj de pared, y sólo lo usa el debounce, que mide cuánto
//   hace que cambió el sprite. Si el debounce leyera el reloj forzado, mover la
//   hora a las 23 en el panel le daría un "transcurrido" de horas y el debounce
//   dejaría de existir.
//
// En main.js eran `relojEfectivo()` y `Date.now()` mezclados en el mismo cuerpo,
// y la distinción no estaba escrita en ningún lado.

import {
  ESTADOS_VISUALES as E,
  DURACION_ESTADO_ACCION_MS,
  DEBOUNCE_VISUAL_MS,
  CATEGORIA_GRANDES,
  DURACION_ESPERANDO_MS,
  ESPERA_SEGUNDO_EVENTO_MS,
  DURACION_CRUCE_FONDO_MS,
  POSES_IDLE
} from './config.js';
import { aplica } from './acciones.js';
import { resolverEstadoVisual, esDeNoche, franjaDelDia, luzDelMomento, poseDeIdle } from './sprites.js';

export function crearSesion({
  estado: estadoInicial,
  vista,
  reloj,
  guardar,
  // Sorteada al arrancar y estable toda la sesión. Ver POSES_IDLE en config.js.
  // Se puede fijar desde afuera para que una prueba no dependa de una moneda.
  poseInicial = Math.floor(Math.random() * POSES_IDLE.length)
}) {
  let estado = estadoInicial;

  // Estado de orquestación. Vive acá y nunca entra al objeto `estado`, así que
  // es estructuralmente imposible que guardar() lo persista.
  let accionEnCurso = null; // nombre del estado visual de la acción, o null
  let estadoVisualActual = null;
  let ultimoCambioVisual = 0;
  let temporizadorAccion = null;
  let temporizadorDebounce = null;
  let gigantePasando = false; // true mientras se lee un evento de la categoría grandes
  let temporizadoresGigante = [];
  let poseIdle = poseInicial;
  let visualForzado = null; // sólo lo escribe el panel de debug
  let esNocheActual = null;
  let franjaActual = null;
  // Duración del próximo crossfade de fondo, o null para cambio seco. Se consume
  // en la pintada siguiente y se limpia: una transición es un evento, no un modo.
  let cruceFondo = null;

  function pintar() {
    vista.render(
      estado,
      estadoVisualActual,
      esNocheActual,
      luzDelMomento(reloj.mundo()),
      claveDeSprite(),
      franjaActual,
      cruceFondo
    );
    cruceFondo = null;
  }

  // El forzado del panel de debug corta la cadena acá, no adentro: sprites.js
  // queda puro y sin saber que existe un modo debug.
  function resolverObjetivo() {
    if (visualForzado) return visualForzado;
    return resolverEstadoVisual({
      estado,
      ahora: reloj.mundo(),
      accion: accionEnCurso,
      gigantePasando
    });
  }

  // Qué PNG le toca dibujar. El ESTADO lo resuelve la cadena; la POSE sólo
  // existe adentro de idle y no participa de ninguna condición. Los demás
  // estados son su propia clave.
  function claveDeSprite() {
    return estadoVisualActual === E.idle ? poseDeIdle(poseIdle) : estadoVisualActual;
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

    const transcurrido = reloj.real() - ultimoCambioVisual;

    if (inmediato || transcurrido >= DEBOUNCE_VISUAL_MS) {
      cancelarDebounce();
      estadoVisualActual = objetivo;
      ultimoCambioVisual = reloj.real();
      return true;
    }

    // Cambio suprimido: se programa un solo timer que al vencer vuelve a
    // resolver la cadena, en vez de reproducir este objetivo, que para entonces
    // puede haber quedado viejo. Así el estado converge siempre y no queda
    // repintado fantasma.
    if (!temporizadorDebounce) {
      temporizadorDebounce = reloj.programar(() => {
        temporizadorDebounce = null;
        if (actualizarVisual()) pintar();
      }, DEBOUNCE_VISUAL_MS - transcurrido);
    }

    return false;
  }

  function cancelarDebounce() {
    reloj.cancelar(temporizadorDebounce);
    temporizadorDebounce = null;
  }

  // Mismo contrato que actualizarVisual: devuelve si cambió, nunca pinta.
  //
  // Resuelve las dos cosas juntas —el tramo del día y si es de noche— porque
  // salen del mismo reloj y de la misma tabla. Separarlas era lo que permitía
  // que se contradijeran.
  function actualizarNoche() {
    const franja = franjaDelDia(reloj.mundo());
    const noche = esDeNoche(reloj.mundo());
    const cambio = franja.nombre !== franjaActual?.nombre || noche !== esNocheActual;
    if (!cambio) return false;

    // Cruzar un límite con la app abierta: disolvencia de un par de segundos.
    // Sólo si ya había un tramo — en el arranque lo decide el save.
    //
    // El `??` NO es defensivo: es el arreglo de un bug que tuvo la primera
    // prueba de integración que corrió sobre esto. En el arranque, sembrar el
    // tramo anterior deja programado el cruce de APERTURA (1500 ms) y después
    // llama a esta función; y esta función entra sí o sí, porque la condición
    // que la hace entrar —que el tramo guardado sea distinto del real— es
    // exactamente la misma que hizo sembrar. O sea que el cruce de apertura se
    // pisaba SIEMPRE con el de cruce (2600 ms) y DURACION_CRUCE_APERTURA_MS
    // nunca llegó a la pantalla ni una vez.
    //
    // Un cruce ya programado gana. cruceFondo se limpia en cada pintada, así que
    // la única forma de que llegue acá con valor es que lo acaben de poner.
    if (franjaActual && franja.nombre !== franjaActual.nombre) {
      cruceFondo = cruceFondo ?? DURACION_CRUCE_FONDO_MS;
    }

    franjaActual = franja;
    esNocheActual = noche;
    guardarFranja(franja);
    return true;
  }

  // El tramo visto se persiste para poder hacer el fade de apertura. Se guarda
  // solo cuando cambia, no en cada tick: el save no es un log.
  function guardarFranja(franja) {
    if (estado.ultimaFranja === franja.nombre) return;
    estado = { ...estado, ultimaFranja: franja.nombre };
    guardar(estado);
  }

  // Prende `esperando` en el momento en que cada evento de la categoría grandes
  // aparece en pantalla, y lo apaga solo. El reloj es el mismo que usa ui.js
  // para encadenar los eventos, así que la pose y el texto entran juntos: Chip
  // cruza los brazos cuando se lee que pasó un gigante, no antes ni después.
  //
  // La decisión de estado vive acá y no en ui.js: la alternativa —que ui.js se
  // fije en la categoría al pintar el texto— pondría una decisión de estado en
  // el módulo que sólo pinta.
  function programarEsperando(eventos) {
    temporizadoresGigante.forEach(reloj.cancelar);
    temporizadoresGigante = [];

    eventos.forEach((evento, i) => {
      if (evento.categoria !== CATEGORIA_GRANDES) return;

      const arranque = ESPERA_SEGUNDO_EVENTO_MS * i;

      temporizadoresGigante.push(
        reloj.programar(() => {
          gigantePasando = true;
          if (actualizarVisual({ inmediato: true })) pintar();
        }, arranque),
        reloj.programar(() => {
          gigantePasando = false;
          if (actualizarVisual({ inmediato: true })) pintar();
        }, arranque + DURACION_ESPERANDO_MS)
      );
    });
  }

  // Marca el estado visual disparado por una acción y programa su vencimiento.
  function marcarAccion(nombreVisual) {
    reloj.cancelar(temporizadorAccion);
    accionEnCurso = nombreVisual;

    temporizadorAccion = reloj.programar(() => {
      temporizadorAccion = null;
      accionEnCurso = null;
      if (actualizarVisual({ inmediato: true })) pintar();
    }, DURACION_ESTADO_ACCION_MS);
  }

  // Si la acción devuelve el mismo estado, no aplicó (ej: jugar sin batería):
  // no se guarda ni se redibuja. Las tres acciones tienen estado visual propio;
  // `nombreVisual` acepta null por si alguna futura no lo tuviera.
  function ejecutar(nombreVisual, accion, nombreAccion) {
    // Si la acción no hace falta —el stat ya está al máximo— Chip contesta en
    // vez de no hacer nada. No es un rechazo: es "ya estoy atendido".
    if (nombreAccion && !aplica(nombreAccion, estado)) {
      vista.responderEstoyBien();
      return;
    }

    const siguiente = accion(estado);
    if (siguiente === estado) return;

    // Se mira el humor ANTES de reemplazar el estado. La celebración no se
    // dispara por "jugar" sino por "el humor subió": con el humor en 100 la
    // acción se aplica igual —gasta batería— pero no hay nada que festejar. Así
    // la regla vale también para cualquier acción futura que suba humor.
    const subioElHumor = siguiente.humor > estado.humor;

    estado = siguiente;
    guardar(estado);

    if (subioElHumor) vista.celebrarHumor();

    if (nombreVisual) marcarAccion(nombreVisual);

    // Salta sólo si la acción se aplicó: el early return de arriba ya filtró
    // los casos en que no pasó nada, y un salto sin efecto sería mentirle al
    // jugador.
    vista.animarAccion();

    actualizarVisual({ inmediato: true });
    pintar();
  }

  // El tick periódico. Los stats sólo cambian por acción, así que su único
  // efecto real es detectar el cruce de un límite de tramo con la app abierta.
  // No toca stats, no aplica decay, no guarda —salvo el nombre del tramo.
  //
  // Los dos chequeos corren SIEMPRE, sin cortocircuito: el fondo puede tener
  // que cambiar aunque el estado visual no se mueva. Con la batería en critico,
  // cruzar las 23:00 no cambia el sprite —critico le gana a standby— pero el
  // galpón sí se tiene que hacer de noche.
  function tick() {
    const cambioEstado = actualizarVisual();
    const cambioNoche = actualizarNoche();
    if (cambioEstado || cambioNoche) pintar();
    return cambioEstado || cambioNoche;
  }

  // EL FADE DE APERTURA. Siembra el fondo con el del tramo ANTERIOR —el que
  // quedó guardado en el save— para que el primer pintado tenga de dónde venir.
  // Sin sembrar, la primera pintada no tendría saliente y la disolvencia no
  // existiría. Devuelve si sembró, para poder verificarlo.
  function sembrarTramoAnterior(franjaGuardada, duracion) {
    if (!franjaGuardada || franjaGuardada.nombre === franjaDelDia(reloj.mundo()).nombre) {
      return false;
    }

    vista.sembrarFondo(franjaGuardada.fondo);
    franjaActual = franjaGuardada;
    esNocheActual = franjaGuardada.nombre === 'noche';
    cruceFondo = duracion;
    return true;
  }

  // Reemplaza el estado entero y lo guarda. Es el único camino por el que algo
  // de afuera —el reinicio del menú, los botones del panel de debug— puede
  // escribir el estado vivo, y por eso guarda siempre: no hay forma de dejar la
  // sesión y el save discrepando.
  function establecerEstado(nuevo) {
    estado = nuevo;
    guardar(estado);
  }

  return {
    // lecturas
    estado: () => estado,
    estadoVisual: () => estadoVisualActual,
    claveDeSprite,
    franja: () => franjaActual,
    esNoche: () => esNocheActual,
    // el juego
    ejecutar,
    actualizarVisual,
    actualizarNoche,
    programarEsperando,
    sembrarTramoAnterior,
    establecerEstado,
    pintar,
    tick,
    // el panel de debug
    forzarVisual(nombre) {
      visualForzado = nombre;
    },
    cambiarPose() {
      poseIdle += 1;
      return claveDeSprite();
    }
  };
}
