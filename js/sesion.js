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
  DURACIONES_ACCION,
  DEBOUNCE_VISUAL_MS,
  CATEGORIA_GRANDES,
  CATEGORIA_COLECCION,
  CLIMAS,
  DURACION_FELIZ_MS,
  DURACION_ESPERANDO_MS,
  ESPERA_SEGUNDO_EVENTO_MS,
  DURACION_CRUCE_FONDO_MS,
  DURACION_FASTIDIO_MS,
  POSES_IDLE
} from './config.js';
import { aplica, acariciar, tocar } from './acciones.js';
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
  let leOrdenaron = false; // true mientras dura el fastidio de que le guarden algo
  let contento = false; // true mientras dura la reacción a algo bueno
  let temporizadoresGigante = [];
  let temporizadorFastidio = null;
  let temporizadorContento = null;
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
      gigantePasando,
      leOrdenaron,
      contento
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

  // ---- Ponerse contento ----
  //
  // `feliz` dejó de ser un estado de umbral y pasó a ser una REACCIÓN: una
  // bandera temporal que se enciende cuando pasa algo bueno y se apaga sola,
  // igual que `esperando`. Ver la cadena en sprites.js para el porqué.
  //
  // Lo dispara: una caricia que aplicó, una acción que aplicó —cuando termina su
  // propio estado visual, no antes—, levantar algo del piso —después del
  // fastidio— y un evento de la categoría `coleccion`.
  //
  // Si el disparador se repite mientras ya está contento, el temporizador se
  // REINICIA en vez de acumularse: dos caricias seguidas dan una reacción que
  // dura lo mismo desde la última, no el doble.
  function ponerseContento() {
    reloj.cancelar(temporizadorContento);
    contento = true;
    if (actualizarVisual({ inmediato: true })) pintar();

    temporizadorContento = reloj.programar(() => {
      temporizadorContento = null;
      contento = false;
      if (actualizarVisual({ inmediato: true })) pintar();
    }, DURACION_FELIZ_MS);
  }

  // LA REACCIÓN A CADA EVENTO, en el momento en que ese evento aparece en
  // pantalla. El reloj es el mismo que usa ui.js para encadenar los textos, así
  // que la pose y la línea entran juntas: Chip cruza los brazos cuando se lee
  // que pasó un gigante, no antes ni después.
  //
  // La decisión de estado vive acá y no en ui.js: la alternativa —que ui.js se
  // fije en la categoría al pintar el texto— pondría una decisión de estado en
  // el módulo que sólo pinta.
  //
  // Dos reacciones distintas:
  //
  // - `esperando` para los eventos con un GIGANTE PRESENTE. Y esa es la palabra
  //   clave: no es toda la categoría `grandes`. Con el pool de 36, `grandes`
  //   pasó de 5 eventos a 13 sobre 48, y si los trece cruzaran los brazos la
  //   pose se volvería una muletilla. La distinción no es una heurística sobre
  //   el texto sino una bandera en el dato —`presente`— y la regla es si el
  //   gigante está ahí AHORA: "pasó un carguero" sí, "una placa se soltó de algo
  //   grande" no, que es un hallazgo.
  // - `feliz` para los de `coleccion`, que son los de encontrar algo.
  function programarReacciones(eventos) {
    temporizadoresGigante.forEach(reloj.cancelar);
    temporizadoresGigante = [];

    eventos.forEach((evento, i) => {
      const arranque = ESPERA_SEGUNDO_EVENTO_MS * i;

      if (evento.categoria === CATEGORIA_GRANDES && evento.presente) {
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
        return;
      }

      if (evento.categoria === CATEGORIA_COLECCION) {
        temporizadoresGigante.push(reloj.programar(ponerseContento, arranque));
      }

      // Y LOS CLIMAS, que son los eventos que cambian el MUNDO y no a Chip.
      // Se prenden cuando su línea aparece —no al abrir— y no se apagan: duran
      // lo que dura la sesión. A la próxima visita el galpón vuelve a la
      // normalidad, y eso pasa solo, porque no se persiste en ningún lado.
      //
      // La tabla es la que dice cuál evento trae cuál clima, así que agregar el
      // tercero es agregar una entrada en CLIMAS y nada más. La lluvia por
      // código la prende `ponerClima` con la bandera de su propio clima: acá no
      // se sabe qué hace cada uno, sólo cuándo entra.
      const clima = Object.keys(CLIMAS).find((c) => CLIMAS[c].evento === evento.id);
      if (clima) {
        temporizadoresGigante.push(
          reloj.programar(() => vista.ponerClima?.(clima, DURACION_CRUCE_FONDO_MS), arranque)
        );
      }
    });
  }

  // Marca el estado visual disparado por una acción y programa su vencimiento.
  //
  // La duración sale de la ACCIÓN y no es una sola para las tres: cargar dura
  // 7 s, limpiar 4 y jugar 3, porque no son lo mismo. Ver DURACIONES_ACCION.
  function marcarAccion(nombreVisual, nombreAccion) {
    reloj.cancelar(temporizadorAccion);
    accionEnCurso = nombreVisual;

    temporizadorAccion = reloj.programar(() => {
      temporizadorAccion = null;
      accionEnCurso = null;
      // Y AL TERMINAR, SE PONE CONTENTO. Encadenado y no simultáneo: los estados
      // de acción le ganan a `feliz` en la cadena, así que prender la bandera al
      // apretar el botón la dejaría vencerse por dentro de la carga y no se
      // vería nunca. Queda cargando -> feliz -> idle, que además se lee mejor.
      //
      // Sólo se llega acá si la acción APLICÓ: ejecutar() ya cortó antes las que
      // no hacían falta y las que no cambiaron el estado.
      ponerseContento();
      if (actualizarVisual({ inmediato: true })) pintar();
      else pintar();
    }, duracionDe(nombreAccion));
  }

  // Cuánto dura una acción. Se exporta para que ui.js pueda escalonar la barra a
  // lo largo del mismo tiempo: si los dos números salieran de lugares distintos
  // se separarían a la primera.
  function duracionDe(nombreAccion) {
    return DURACIONES_ACCION[nombreAccion] ?? DURACION_ESTADO_ACCION_MS;
  }

  // Si hay una acción en curso, no entra otra. NO es un cooldown: en el instante
  // en que la acción termina vuelve a estar todo disponible, y no hay
  // penalización de ningún tipo. Es que mientras Chip carga, está cargando.
  function ocupado() {
    return accionEnCurso !== null;
  }

  // Si la acción devuelve el mismo estado, no aplicó (ej: jugar sin batería):
  // no se guarda ni se redibuja. Las tres acciones tienen estado visual propio;
  // `nombreVisual` acepta null por si alguna futura no lo tuviera.
  function ejecutar(nombreVisual, accion, nombreAccion) {
    // Con una acción en curso no entra otra, ni siquiera la misma. Sin esto se
    // podía apretar Cargar y Jugar en el mismo segundo y Chip pasaba de
    // enchufado a jugando de un cuadro al otro.
    //
    // Sale en silencio y no con "estoy bien": los botones ya están apagados
    // mientras dura, así que el jugador no debería llegar acá — y si llega, por
    // teclado o por un doble toque, contestarle sería explicarle algo que la
    // pantalla ya le está diciendo.
    if (ocupado()) return;

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
    const anterior = estado;

    estado = siguiente;
    guardar(estado);

    if (subioElHumor) vista.celebrarHumor();

    if (nombreVisual) marcarAccion(nombreVisual, nombreAccion);

    // La vista necesita tres cosas para escalonar la barra: de dónde viene, a
    // dónde va y cuánto tiene. El save YA tiene el valor final —la acción es
    // instantánea para el modelo— y lo que dura es la lectura, no el efecto.
    vista.iniciarAccion?.({
      accion: nombreAccion,
      duracion: duracionDe(nombreAccion),
      anterior,
      siguiente
    });

    // Salta sólo si la acción se aplicó: el early return de arriba ya filtró
    // los casos en que no pasó nada, y un salto sin efecto sería mentirle al
    // jugador.
    vista.animarAccion();

    actualizarVisual({ inmediato: true });
    pintar();
  }

  // ---- La caricia ----
  //
  // Es un GESTO y no una acción, y el contrato lo dice: no marca estado visual,
  // no ocupa a Chip, no entra en la tabla de las tres teclas. Lo único que
  // comparte con ellas es la regla de la referencia — si el humor está al
  // máximo, acariciar no cambia nada y quien llama se entera.
  //
  // Sí respeta lo de "ocupado": mientras Chip carga, está cargando. Una caricia
  // a mitad de una carga tendría que interrumpir la lectura del estado de acción
  // o convivir con ella, y las dos cosas se ven mal.
  //
  // Devuelve si la caricia APLICÓ, para que la vista sepa si corresponde
  // celebrar. Con el humor lleno no hay corazones: es el mismo criterio que
  // celebrarHumor, que se dispara por "el humor subió" y no por "se jugó".
  function acariciarAChip() {
    if (ocupado()) return false;

    const siguiente = acariciar(estado);
    if (siguiente === estado) return false;

    estado = siguiente;
    guardar(estado);
    // Se pone contento sólo si la caricia APLICÓ, que es el mismo contrato que
    // los corazones: con el humor lleno no cambia nada y no hay nada que
    // festejar. ponerseContento ya pinta.
    ponerseContento();
    return true;
  }

  // ---- Levantar lo que estaba tirado ----
  //
  // Lo del piso ya es de Chip: lo encontró él mientras no estabas. Levantarlo no
  // es ganarlo, es ordenarlo, y por eso no hay hallazgo, no hay evento y no hay
  // tirada de rareza. La colección suma el id y listo.
  //
  // La cara de fastidio se decide ACÁ y no en ui.js, por lo mismo que
  // programarEsperando: elegir un estado visual es de la sesión. ui.js pide
  // "levanté esto" y la sesión resuelve qué significa.
  //
  // Devuelve si aplicó, para que la vista sepa si corresponde volar la pieza al
  // estante. Un id que no está tirado no hace nada: sin esto, dos toques rápidos
  // sobre la misma pieza la sumarían dos veces.
  // ---- Tocarlo con el dedo ----
  //
  // NO es una caricia y por eso no pone contento: sube el humor un punto —menos
  // que la caricia— y la vista se encarga del sobresalto. Que los dos gestos
  // signifiquen cosas distintas depende de que den cosas distintas; si dieran lo
  // mismo, arrastrar el dedo sería una forma más incómoda de tocar.
  function tocarAChip() {
    if (ocupado()) return false;

    const siguiente = tocar(estado);
    if (siguiente === estado) return false;

    estado = siguiente;
    guardar(estado);
    pintar();
    return true;
  }

  // Y SI LO SIGUE PICANDO, se fastidia. Es la única forma de molestarlo que tiene
  // el juego y es graciosa, no punitiva: no baja ningún stat, no bloquea las
  // teclas de acción y se le pasa solo.
  //
  // A diferencia del fastidio de que le levanten algo del piso, este NO encadena
  // en `feliz`: ahí primero se queja y después se pone contento de tenerlo; acá
  // no hay nada que agradecer.
  function fastidiar() {
    reloj.cancelar(temporizadorFastidio);
    leOrdenaron = true;
    // La SEÑAL del enojo la avisa la sesión, con el mismo criterio que el estado
    // visual: quién se fastidia y cuándo es del modelo, y cómo se ve es de la
    // vista. Sin esto ui.js tendría que adivinar por qué apareció `esperando`,
    // que es la misma cara que pone cuando pasa un gigante.
    vista.enojarse?.();
    actualizarVisual({ inmediato: true });
    pintar();

    temporizadorFastidio = reloj.programar(() => {
      temporizadorFastidio = null;
      leOrdenaron = false;
      actualizarVisual({ inmediato: true });
      pintar();
    }, DURACION_FASTIDIO_MS);
  }

  function estaFastidiado() {
    return leOrdenaron;
  }

  function recogerDelPiso(id) {
    if (!id || estado.objetoEnPiso !== id) return false;

    estado = {
      ...estado,
      coleccion: estado.coleccion.includes(id) ? estado.coleccion : [...estado.coleccion, id],
      objetoEnPiso: null
    };
    guardar(estado);

    reloj.cancelar(temporizadorFastidio);
    leOrdenaron = true;
    // La misma señal que el fastidio del toque: los dos son el mismo enojo y se
    // ven igual. Lo que los distingue es cómo siguen — este encadena en `feliz`
    // y el otro no.
    vista.enojarse?.();
    actualizarVisual({ inmediato: true });
    pintar();

    temporizadorFastidio = reloj.programar(() => {
      temporizadorFastidio = null;
      leOrdenaron = false;
      // PRIMERO SE QUEJA Y DESPUÉS SE PONE CONTENTO de tenerlo. El encadenado es
      // el punto: la queja sola deja la lectura en "no le gustó", y la alegría
      // sola pierde el chiste de que se lo ordenaste. Las dos seguidas cuentan
      // la cosa entera.
      ponerseContento();
      actualizarVisual({ inmediato: true });
      pintar();
    }, DURACION_FASTIDIO_MS);

    return true;
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
    acariciar: acariciarAChip,
    tocar: tocarAChip,
    fastidiar,
    estaFastidiado,
    recogerDelPiso,
    ocupado,
    actualizarVisual,
    actualizarNoche,
    programarReacciones,
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
