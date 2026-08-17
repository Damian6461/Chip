// El ambiente del galpón.
//
// EXCEPCIÓN DECLARADA A LA REGLA DEL DOM, igual que debug.js: este módulo crea
// sus propios elementos <audio>, los appendea a document.body y no lee ni
// modifica nada que no haya creado él. No toca el DOM del juego.
//
// TRES DECISIONES QUE SON DE ARQUITECTURA Y NO DE GUSTO:
//
// 1. ARRANCA APAGADO. No es prudencia: los navegadores BLOQUEAN el audio sin un
//    gesto del usuario, así que un ambiente que arrancara solo no sonaría y
//    además dejaría la app en un estado que no se puede distinguir de un bug.
//    El toggle del menú ES el gesto.
//
// 2. LOS AMBIENTES NO ESTÁN EN ARCHIVOS_CACHE. Son 2,3 MB que se le sumarían a
//    la instalación de la PWA para algo que mucha gente no va a usar nunca. Se
//    bajan bajo demanda la primera vez que se prende el sonido; quien no lo
//    prenda, no los baja. Ver el bloque de sw.js.
//
// 3. EL LOOP LLEVA CROSSFADE POR CÓDIGO y no `loop` a secas. Los archivos
//    originales venían con fade-in y fade-out de cinco segundos a silencio —
//    medido: el primer medio segundo de ambiente-dia estaba en -94 dBFS contra
//    -27 en el medio— así que en bucle dejaban un pozo de diez segundos por
//    vuelta. Los fades se recortaron, y lo que queda es un salto de fase en la
//    unión, que es lo que el crossfade tapa.
//
// ---- POR QUÉ EL CROSSFADE PASÓ A WEB AUDIO ----
//
// La primera versión ya cruzaba dos <audio>, y el empalme se notaba igual. Dos
// defectos, los dos de reloj y de curva, y ninguno se arregla tocando números:
//
// A. LA CURVA ERA LINEAL. Dos grabaciones de ambiente no están correlacionadas,
//    así que sus potencias se suman, no sus amplitudes: con ganancias lineales,
//    en el medio del cruce las dos valen 0,5 y la potencia total cae a
//    sqrt(0,5² + 0,5²) = 0,707, o sea -3 dB. Un pozo de 3 dB en el medio de cada
//    vuelta es exactamente "el empalme se nota". La curva de igual potencia
//    —seno y coseno— mantiene la suma de cuadrados en 1 y no tiene pozo.
//
// B. EL RELOJ ERA setTimeout, PROGRAMADO A UN MINUTO VISTA. Un timer de 61
//    segundos en un teléfono se atrasa y se estrangula, y si llega tarde el
//    archivo que sale YA TERMINÓ: silencio, y después el otro arranca en seco.
//    Y la rampa corría en un setInterval de 50 ms, que se estrangula igual, así
//    que el que salía podía llegar al final del archivo con la ganancia todavía
//    arriba — un corte seco, que es un click.
//
// La versión de ahora usa dos relojes y ninguno es el de JS:
//
//   - las rampas van sobre el RELOJ DE AUDIO (`ctx.currentTime`), que es
//     exacto a nivel de muestra y no lo afecta que la pestaña esté en segundo
//     plano. Se programan de una y el navegador las ejecuta solo.
//   - el disparo de la vuelta va sobre el RELOJ DEL MEDIO (`timeupdate` del
//     propio <audio>), que avanza con la reproducción y no con el event loop.
//
// Los <audio> se quedan: son los que permiten que el archivo se transmita en vez
// de decodificarse entero en memoria —un ambiente de 64 s en PCM son 22 MB— y
// que `preload: 'none'` siga valiendo. Lo que cambia es que su salida pasa por un
// GainNode en vez de por su propiedad `volume`.

import { AMBIENTES, SONIDO } from './config.js';

let capas = []; // { audio, ganancia }
let indiceActivo = 0;
let franjaActual = null;
let encendido = false;
let cargados = false;
let pausadoPorFoco = false;
let ctx = null;
let cruzando = false;
let lloviendo = false;

// EL CONTEXTO SE CREA EN EL GESTO, no al importar el módulo. Un AudioContext
// creado sin gesto nace suspendido y en algunos navegadores queda marcado como
// bloqueado para siempre.
function contexto() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

function crearCapa() {
  const audio = new Audio();
  audio.preload = 'none';
  // El volumen del elemento se queda en 1 y no se toca nunca: quien manda es el
  // GainNode. Mezclar los dos controles daría una ganancia que es el producto de
  // dos cosas y ninguna de las dos sabría de la otra.
  audio.volume = 1;
  // `loop` en false a propósito: el bucle lo hace el crossfade, que arranca la
  // otra capa ANTES de que ésta termine.
  audio.loop = false;
  document.body.appendChild(audio);

  const c = contexto();
  const fuente = c.createMediaElementSource(audio);
  const ganancia = c.createGain();
  ganancia.gain.value = 0;
  fuente.connect(ganancia).connect(c.destination);

  return { audio, ganancia };
}

function asegurarCargado() {
  if (cargados) return;
  cargados = true;
  capas = [crearCapa(), crearCapa()];
}

function rutaDe(franja) {
  return AMBIENTES[franja] ?? null;
}

// LAS DOS CURVAS DE IGUAL POTENCIA. seno para el que entra, coseno para el que
// sale: sen²+cos² = 1, así que la potencia total es constante todo el cruce.
//
// Se arman como arrays y se pasan a setValueCurveAtTime en vez de encadenar
// rampas lineales, porque una rampa lineal entre dos puntos vuelve a ser una
// recta y el pozo vuelve.
function curvasDeCruce(pasos, volumen) {
  const entra = new Float32Array(pasos);
  const sale = new Float32Array(pasos);

  for (let i = 0; i < pasos; i++) {
    const t = (i / (pasos - 1)) * (Math.PI / 2);
    entra[i] = Math.sin(t) * volumen;
    sale[i] = Math.cos(t) * volumen;
  }

  return { entra, sale };
}

// El crossfade, que sirve para las dos cosas: cruzar de un tramo del día a otro
// y cruzar el archivo consigo mismo al terminar. Es el mismo mecanismo porque es
// el mismo problema — dos fuentes y una transición.
function cruzar(hacia, ruta, duracionMs) {
  const c = contexto();
  const entra = capas[hacia];
  const sale = capas[1 - hacia];

  if (entra.audio.getAttribute('src') !== ruta) entra.audio.src = ruta;

  // `currentTime = 0` sólo cuando ya hay metadatos. Antes de eso el navegador lo
  // ignora o tira, y de todos modos un elemento recién cargado arranca en 0.
  if (entra.audio.readyState > 0) entra.audio.currentTime = 0;
  entra.audio.play().catch(() => {
    // Sin gesto previo el navegador rechaza. No es un error que valga la pena
    // reportar: el toggle lo va a volver a intentar.
  });

  const dur = duracionMs / 1000;
  const ahora = c.currentTime;
  const { entra: subida, sale: bajada } = curvasDeCruce(SONIDO.pasosCurva, SONIDO.volumen);

  for (const capa of [entra, sale]) {
    capa.ganancia.gain.cancelScheduledValues(ahora);
    // Anclar el valor actual antes de la curva: sin esto, setValueCurveAtTime
    // salta al primer punto de la curva y ese salto ES un click.
    capa.ganancia.gain.setValueAtTime(capa.ganancia.gain.value, ahora);
  }

  entra.ganancia.gain.setValueCurveAtTime(subida, ahora, dur);
  sale.ganancia.gain.setValueCurveAtTime(bajada, ahora, dur);

  indiceActivo = hacia;
  cruzando = true;

  // El que sale se pausa cuando su ganancia YA ES CERO, no antes. El timer acá
  // no puede producir un click aunque llegue tarde: llega a un elemento que ya
  // está en silencio.
  setTimeout(() => {
    cruzando = false;
    if (capas[indiceActivo] !== entra) return;
    sale.audio.pause();
  }, duracionMs + 120);
}

// EL DISPARO DE LA VUELTA VA SOBRE EL RELOJ DEL MEDIO.
//
// `timeupdate` lo emite el propio elemento mientras reproduce, así que avanza
// con el audio y no con el event loop: si la pestaña se estrangula, el evento se
// espacia pero NO se adelanta ni se atrasa respecto de la música. Un setTimeout
// programado a un minuto vista sí se atrasa, y ahí está el corte.
function vigilarElFinal(capa) {
  capa.audio.addEventListener('timeupdate', () => {
    if (!encendido || pausadoPorFoco || cruzando) return;
    if (capas[indiceActivo] !== capa) return;

    const dura = capa.audio.duration;
    if (!Number.isFinite(dura)) return;

    if (dura - capa.audio.currentTime <= SONIDO.cruceMs / 1000) {
      cruzar(1 - indiceActivo, capa.audio.getAttribute('src'), SONIDO.cruceMs);
    }
  });

  // Red de contención. Si por lo que sea el archivo llega al final sin haber
  // cruzado —un `timeupdate` que no llegó, una duración que apareció tarde— la
  // vuelta se da igual. Sin esto el galpón se queda mudo y nada lo dice.
  capa.audio.addEventListener('ended', () => {
    if (!encendido || pausadoPorFoco) return;
    if (capas[indiceActivo] !== capa) return;
    cruzar(1 - indiceActivo, capa.audio.getAttribute('src'), SONIDO.cruceMs);
  });
}

// ---- La interfaz del módulo ----

// El tramo del día manda, y es el MISMO que gobierna los fondos: la hora se
// resuelve una vez en la sesión y de ahí salen el sprite, la luz, el fondo y
// esto. Un reloj propio acá sería una segunda fuente de verdad.
export function ambientar(franja) {
  // MIENTRAS LLUEVE, LA FRANJA NO MANDA. El tramo del día sigue cambiando el
  // fondo y la luz; lo único que la lluvia se apropia es el ambiente. Sin este
  // corte, la próxima pintada volvería a pedir el ambiente de la hora y la
  // lluvia se apagaría sola a los segundos.
  if (lloviendo) return;
  if (!franja || franja === franjaActual) return;

  const ruta = rutaDe(franja);
  franjaActual = franja;
  if (!ruta || !encendido) return;

  asegurarCargado();
  cruzar(1 - indiceActivo, ruta, SONIDO.cruceMs);
}

// LA LLUVIA ES UN EVENTO, NO UN TRAMO. Por eso es una bandera y no una entrada
// más en la tabla de franjas: no tiene hora, no tiene fondo propio y no entra en
// la rotación. Se prende cuando sale su evento y se apaga al cerrar la app,
// porque no se persiste en ningún lado.
export function llover() {
  if (lloviendo) return;
  lloviendo = true;

  const ruta = rutaDe('lluvia');
  if (!ruta || !encendido) return;

  asegurarCargado();
  cruzar(1 - indiceActivo, ruta, SONIDO.cruceMs);
}

// Y LA VUELTA, que existe por los climas y no por la lluvia sola.
//
// Los dos climas son excluyentes, y si en una misma visita salen los dos —el
// pool sortea dos eventos y los dos están adentro— el que entra segundo tiene
// que dejar el mundo en UN estado. Sin esto, la niebla se llevaría el fondo y el
// ambiente seguiría siendo el de la tormenta: llovería sin llover.
//
// Suelta la franja además de la bandera, así la próxima pintada vuelve a pedir
// el ambiente de la hora en vez de creer que ya lo tiene puesto.
export function dejarDeLlover() {
  if (!lloviendo) return;
  lloviendo = false;
  franjaActual = null;
}

export function encender(activo) {
  encendido = activo;

  if (!activo) {
    // Sin contexto no hay nada que apagar: nadie prendió el sonido todavía. Pasa
    // en el arranque y al reiniciar la partida, que llaman a encender(false) sin
    // que haya habido gesto.
    if (!ctx) return;

    for (const capa of capas) {
      capa.ganancia.gain.cancelScheduledValues(ctx.currentTime);
      capa.ganancia.gain.setValueAtTime(0, ctx.currentTime);
      capa.audio.pause();
    }
    return;
  }

  asegurarCargado();
  // El contexto puede haber nacido suspendido: este click es el gesto que lo
  // habilita.
  contexto().resume();

  if (!capas[0].vigilada) {
    for (const capa of capas) {
      vigilarElFinal(capa);
      capa.vigilada = true;
    }
  }

  const ruta = rutaDe(franjaActual);
  if (ruta) cruzar(indiceActivo, ruta, SONIDO.entradaMs);
}

// Cuando la pestaña pierde el foco, el ambiente se calla. Sigue el mismo
// criterio que el resto del proyecto sobre las pestañas en segundo plano: no se
// deja nada corriendo que nadie está mirando —o escuchando—.
document.addEventListener('visibilitychange', () => {
  pausadoPorFoco = document.visibilityState !== 'visible';
  if (!encendido || !cargados) return;

  if (pausadoPorFoco) {
    for (const capa of capas) capa.audio.pause();
  } else {
    contexto().resume();
    capas[indiceActivo].audio.play().catch(() => {});
  }
});
