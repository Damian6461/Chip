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

import { AMBIENTES, SONIDO } from './config.js';

// Dos elementos por ambiente: mientras uno termina, el otro ya arrancó. Es la
// única forma de cruzar un audio consigo mismo — un solo <audio> con `loop`
// vuelve al principio de golpe.
let capas = [];
let indiceActivo = 0;
let franjaActual = null;
let encendido = false;
let cargados = false;
let temporizadorCruce = null;
let pausadoPorFoco = false;

function crearCapa() {
  const audio = new Audio();
  audio.preload = 'none';
  audio.volume = 0;
  // `loop` queda en false a propósito: el bucle lo maneja programarCruce, que
  // arranca la otra capa ANTES de que ésta termine.
  audio.loop = false;
  document.body.appendChild(audio);
  return audio;
}

// La descarga, que pasa una sola vez y sólo si alguien prende el sonido.
function asegurarCargado() {
  if (cargados) return;
  cargados = true;
  capas = [crearCapa(), crearCapa()];
}

function rutaDe(franja) {
  return AMBIENTES[franja] ?? null;
}

// El crossfade, que sirve para las dos cosas: cruzar de un tramo del día a otro
// y cruzar el archivo consigo mismo al terminar. Es el mismo mecanismo porque es
// el mismo problema — dos fuentes y una transición.
function cruzar(hacia, ruta, duracion) {
  const entra = capas[hacia];
  const sale = capas[1 - hacia];

  if (entra.getAttribute('src') !== ruta) entra.src = ruta;
  entra.currentTime = 0;
  entra.volume = 0;
  entra.play().catch(() => {
    // Sin gesto previo el navegador rechaza. No es un error que valga la pena
    // reportar: el toggle lo va a volver a intentar.
  });

  const pasos = Math.max(1, Math.round(duracion / SONIDO.pasoCruceMs));
  let paso = 0;

  clearInterval(temporizadorCruce);
  temporizadorCruce = setInterval(() => {
    paso++;
    const t = Math.min(1, paso / pasos);
    entra.volume = SONIDO.volumen * t;
    sale.volume = SONIDO.volumen * (1 - t);

    if (t >= 1) {
      clearInterval(temporizadorCruce);
      sale.pause();
    }
  }, SONIDO.pasoCruceMs);

  indiceActivo = hacia;
  programarCruce();
}

// El bucle. Se programa el cruce consigo mismo para que arranque ANTES del final
// del archivo, con el mismo largo que el cruce entre tramos.
function programarCruce() {
  const activo = capas[indiceActivo];

  const alTanto = () => {
    const dura = activo.duration;
    if (!Number.isFinite(dura)) return;

    const faltan = (dura - activo.currentTime) * 1000 - SONIDO.cruceMs;
    setTimeout(() => {
      if (!encendido || pausadoPorFoco) return;
      if (capas[indiceActivo] !== activo) return; // ya cruzó por cambio de tramo
      cruzar(1 - indiceActivo, activo.getAttribute('src'), SONIDO.cruceMs);
    }, Math.max(0, faltan));
  };

  if (Number.isFinite(activo.duration)) alTanto();
  else activo.addEventListener('loadedmetadata', alTanto, { once: true });
}

// ---- La interfaz del módulo ----

// El tramo del día manda, y es el MISMO que gobierna los fondos: la hora se
// resuelve una vez en la sesión y de ahí salen el sprite, la luz, el fondo y
// esto. Un reloj propio acá sería una segunda fuente de verdad.
export function ambientar(franja) {
  if (!franja || franja === franjaActual) return;

  const ruta = rutaDe(franja);
  franjaActual = franja;
  if (!ruta || !encendido) return;

  asegurarCargado();
  cruzar(1 - indiceActivo, ruta, SONIDO.cruceMs);
}

export function encender(activo) {
  encendido = activo;

  if (!activo) {
    clearInterval(temporizadorCruce);
    for (const capa of capas) capa.pause();
    return;
  }

  asegurarCargado();
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
    for (const capa of capas) capa.pause();
  } else {
    capas[indiceActivo].play().catch(() => {});
    programarCruce();
  }
});
