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

import {
  AMBIENTES,
  SONIDO,
  VOZ,
  VOZ_DE,
  VOCES,
  VOCES_LARGAS,
  PROBABILIDAD_VOZ
} from './config.js';

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
  fuente.connect(ganancia).connect(mezclaDelAmbiente());

  return { audio, ganancia };
}

// EL MASTER DEL AMBIENTE, Y ES POR QUÉ NO SE TOCA `audio.volume`.
//
// Cuando Chip habla, el ambiente tiene que correrse para atrás. La tentación es
// bajarle `volume` al <audio>, y arriba está escrito por qué no: el volumen del
// elemento se queda en 1 y quien manda es el GainNode; mezclar los dos controles
// da una ganancia que es el producto de dos cosas y ninguna sabe de la otra.
//
// Pero el GainNode de cada capa YA TIENE DUEÑO: se lo programa `cruzar` con
// curvas de igual potencia, y meter una segunda mano ahí es el mismo problema
// con otro nombre.
//
// Así que hay un segundo gain EN SERIE, después de las dos capas. Cada uno tiene
// un solo dueño: las capas son del crossfade y el master es del ducking. Dos
// ganancias en cadena se multiplican solas y ninguna necesita saber de la otra.
let masterAmbiente = null;
function mezclaDelAmbiente() {
  if (!masterAmbiente) {
    const c = contexto();
    masterAmbiente = c.createGain();
    masterAmbiente.gain.value = 1;
    masterAmbiente.connect(c.destination);
  }
  return masterAmbiente;
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

// ---- CUÁNDO EL SONIDO EMPIEZA A SONAR DE VERDAD ----
//
// No es cuando el jugador toca. Es un rato después, y ese rato se llevó puesto
// el saludo del día.
//
// El mecanismo, medido: los dos escuchan el MISMO `pointerdown` con capture. El
// primero es el de acá, que llama a `encender(true)` y ése a
// `contexto().resume()`. `resume()` devuelve una PROMESA: el contexto no queda
// en `running` en la misma vuelta. El segundo listener era el del saludo, que
// llamaba a `hablar('saludo')` — y lo primero que hace `hablar` es mirar
// `ctx.state !== 'running'` y devolver null. En silencio, que es la parte peor:
// el saludo no fallaba, no existía.
//
// Así que en vez de que el saludo adivine cuándo puede hablar, el sonido AVISA.
// `cuandoSuene(fn)` corre `fn` en el momento en que el contexto está realmente
// corriendo: ya mismo si lo está, o cuando el resume resuelva.
//
// Y sirve para el otro caso también, que es el que iba a aparecer después: si el
// jugador abre con el sonido apagado y lo prende desde el menú, el saludo sale
// ahí. Antes ese camino no pasaba por ningún `pointerdown` armado y el saludo se
// perdía igual.
let esperandoElSonido = [];

function avisarQueSuena() {
  const cola = esperandoElSonido;
  esperandoElSonido = [];
  for (const fn of cola) {
    try {
      fn();
    } catch {
      // Un aviso que falla no puede llevarse puesto a los otros ni al audio.
    }
  }
}

export function cuandoSuene(fn) {
  if (encendido && ctx && ctx.state === 'running') fn();
  else esperandoElSonido.push(fn);
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
  //
  // Y SI EL NAVEGADOR SE NIEGA, SE VUELVE A ARMAR EL GESTO. Antes el resultado de
  // `resume()` se tiraba a la basura, y eso deja el peor estado posible: las dos
  // capas creadas, el src puesto, `encendido` en true y el contexto suspendido —
  // así que el <audio> ni siquiera descarga. Medido: readyState 0 y networkState
  // 2 nueve segundos después, con el archivo bajando por fetch en 8 ms. Un
  // silencio que ni el propio módulo sabía que existía.
  contexto()
    .resume()
    .then(avisarQueSuena, armarElGesto);

  if (!capas[0].vigilada) {
    for (const capa of capas) {
      vigilarElFinal(capa);
      capa.vigilada = true;
    }
  }

  const ruta = rutaDe(franjaActual);
  if (ruta) cruzar(indiceActivo, ruta, SONIDO.entradaMs);
}

// ---- QUE EL SONIDO VUELVA SOLO AL REABRIR ----
//
// EL DEFECTO ERA QUE `encender()` SÓLO SE LLAMABA DESDE EL TOGGLE. El ajuste se
// guarda y al reabrir la app el toggle aparece en "activado" —eso andaba bien—
// pero nadie prendía nada, así que quedaba diciendo que el sonido estaba puesto
// mientras el galpón estaba mudo. Un estado que se contradice consigo mismo.
//
// Y no se arregla llamando a `encender(true)` en el arranque: el navegador exige
// un gesto del usuario para reproducir audio, y el arranque no lo es. Eso no es
// un bug que se pueda saltear y está bien que sea así.
//
// Lo que sí se puede es NO HACERLO BUSCAR EL TOGGLE OTRA VEZ. El primer toque de
// la sesión —tocar a Chip, apretar un botón, abrir el menú, cualquiera— sirve
// como gesto. Un listener de una sola vez sobre el documento, en captura para
// que ningún `stopPropagation` de más arriba lo tape, y que se borra solo.
//
// El ajuste se consulta en el momento del toque y no cuando se arma: entre el
// arranque y el primer toque el jugador puede haber apagado el sonido, y en ese
// caso el toque no tiene que prender nada.
let consultarAjuste = () => false;
let gestoArmado = false;

function armarElGesto() {
  if (gestoArmado) return;
  gestoArmado = true;

  const alPrimerToque = () => {
    gestoArmado = false;
    if (!consultarAjuste()) return;
    // Si ya está sonando de verdad no hay nada que hacer. "De verdad" incluye el
    // estado del contexto: `encendido` puede ser true con el contexto suspendido,
    // y eso es exactamente el caso que hay que rescatar.
    if (encendido && ctx && ctx.state === 'running') return;
    encender(true);
  };

  document.addEventListener('pointerdown', alPrimerToque, { capture: true, once: true });
}

export function arrancarConElPrimerGesto(ajuste) {
  consultarAjuste = ajuste;
  armarElGesto();
}

// Volver de segundo plano es el otro escenario, y es distinto: acá el contexto ya
// existe y tuvo su gesto. Lo que puede haber pasado es que quedara `suspended`,
// que es lo que hacen varios navegadores al ocultar la pestaña.
//
// Se consulta el estado y se resume explícitamente en vez de llamar a `resume()`
// a ciegas, y sobre todo SE MIRA SI FALLA: si el navegador se niega —pasa en
// iOS, que trata el volver a primer plano como una sesión nueva— se vuelve a
// armar el gesto, así el próximo toque lo rescata. Antes esto era
// `contexto().resume()` con el resultado tirado a la basura y un `.catch(() => {})`
// vacío en el play: si fallaba, el silencio era definitivo y nada lo decía.
function reanudar() {
  const c = contexto();
  const sonar = () => capas[indiceActivo].audio.play().catch(armarElGesto);
  if (c.state === 'suspended') c.resume().then(sonar, armarElGesto);
  else sonar();
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
    reanudar();
  }
});

// ============================================================================
// LA VOZ DE CHIP
// ============================================================================
//
// Veinte archivos que estuvieron en el repo sin un solo lector. Lo que sigue es
// el cableado, y las REGLAS DE CUÁNDO PUEDE HABLAR son el punto entero: un bicho
// que emite un sonido cada vez que pasa algo no se lee como que tiene voz, se
// lee como una interfaz que hace ruido.
//
// Son seis y todas dicen que NO:
//
//   1. nunca dos veces seguidas el mismo archivo
//   2. las largas, no más de una cada varios minutos
//   3. nunca encimadas: si ya está sonando una, la nueva SE DESCARTA
//   4. un piso de silencio entre dos cualesquiera
//   5. nada si el sonido está apagado o si el contexto no arrancó
//   6. nada, NUNCA, con la pestaña oculta
//
// LA TERCERA SE DESCARTA Y NO SE ENCOLA, y es deliberado: una cola convierte un
// pico de eventos en un monólogo que sigue sonando cuando ya no viene a cuento.
// Lo que se perdió, se perdió.

let vozNodo = null;
let vozGanancia = null;
let ultimaVoz = null;
let ultimoHabla = 0;
let ultimaLarga = 0;
let hablando = false;

function asegurarVoz() {
  if (vozNodo) return;
  const c = contexto();
  vozNodo = new Audio();
  // `auto` y no `none`: una voz que empieza a bajarse recién cuando hace falta
  // llega tarde y se pierde el momento. Son archivos cortos y están en
  // ARCHIVOS_CACHE, así que después del primer arranque salen del disco.
  vozNodo.preload = 'auto';
  vozNodo.volume = 1;
  document.body.appendChild(vozNodo);

  vozGanancia = c.createGain();
  vozGanancia.gain.value = VOZ.volumen;
  // La voz NO pasa por el master del ambiente: si pasara, agacharse se agacharía
  // a sí misma.
  c.createMediaElementSource(vozNodo).connect(vozGanancia).connect(c.destination);

  vozNodo.addEventListener('ended', soltarLaVoz);
  // Si el archivo no carga, el estado tiene que volver igual. Sin esto un 404
  // deja `hablando` en true para siempre y Chip se queda mudo sin decir por qué.
  vozNodo.addEventListener('error', soltarLaVoz);
}

function agacharAmbiente(factor, ms) {
  if (!masterAmbiente || !ctx) return;
  const ahora = ctx.currentTime;
  masterAmbiente.gain.cancelScheduledValues(ahora);
  masterAmbiente.gain.setValueAtTime(masterAmbiente.gain.value, ahora);
  masterAmbiente.gain.linearRampToValueAtTime(factor, ahora + ms / 1000);
}

function soltarLaVoz() {
  hablando = false;
  agacharAmbiente(1, VOZ.volverMs);
}

// Elige un archivo de los candidatos, sin repetir el anterior. Con un solo
// candidato y ése siendo el anterior, devuelve null: la regla 1 gana sobre las
// ganas de decir algo.
function elegir(candidatos) {
  const otros = candidatos.filter((id) => id !== ultimaVoz);
  if (!otros.length) return null;
  return otros[Math.floor(Math.random() * otros.length)];
}

// `hablar(situacion)` — la clave es la situación, no el archivo. Ver VOZ_DE.
//
// Devuelve el id que sonó, o null si no sonó nada. Devolver algo y no ser void es
// para que se pueda probar sin oír: un test puede llamar veinte veces y contar.
export function hablar(situacion) {
  // 6 primero, y es la más terminante de las seis: una voz en una pestaña que
  // nadie está mirando no llega tarde, llega mal.
  if (document.visibilityState === 'hidden') return null;
  if (!encendido || !ctx || ctx.state !== 'running') return null;
  if (hablando) return null;

  const candidatos = VOZ_DE[situacion];
  if (!candidatos) return null;

  // ---- LA SÉPTIMA, QUE ES UNA MONEDA Y NO UNA REGLA ----
  //
  // Las seis de arriba dicen cuándo NO PUEDE hablar. Ésta dice cuándo NO QUIERE,
  // y por eso va después: no tiene sentido tirar los dados para algo que igual
  // no iba a sonar.
  //
  // ESTABA EN main.js, en un `seAnima()` propio, y ahí es donde estaba el
  // agujero: los gestos —toque, caricia, fastidio— se cablean en
  // conectarCaricia y llamaban a `hablar` de una, así que esquivaban el filtro entero. Tocar a Chip lo hacía
  // hablar el 100% de las veces, con el piso de 4 segundos como único límite.
  // Un filtro que vive al lado de algunos de sus sujetos no es un filtro; vive
  // acá, que es la única puerta por la que pasa toda voz.
  //
  // El default es 1: lo que no está en la tabla habla siempre. Ver
  // PROBABILIDAD_VOZ.
  if (Math.random() >= (PROBABILIDAD_VOZ[situacion] ?? 1)) return null;

  const ahora = Date.now();
  if (ahora - ultimoHabla < VOZ.cooldownMs) return null;

  const id = elegir([].concat(candidatos));
  if (!id) return null;

  // El cooldown de las largas se consulta DESPUÉS de elegir, porque cuál salió
  // decide si aplica. Una situación con cuatro candidatos largos queda muda
  // durante todo el cooldown, y está bien: son las que se cuentan.
  const esLarga = VOCES_LARGAS.includes(id);
  if (esLarga && ahora - ultimaLarga < VOZ.cooldownLargasMs) return null;

  asegurarVoz();
  hablando = true;
  ultimaVoz = id;
  ultimoHabla = ahora;
  if (esLarga) ultimaLarga = ahora;

  agacharAmbiente(VOZ.agacharAmbiente, VOZ.agacharMs);
  vozNodo.src = VOCES[id];
  vozNodo.currentTime = 0;
  // Si el navegador se niega, el estado vuelve igual: el `catch` no es cosmético.
  vozNodo.play().catch(soltarLaVoz);
  return id;
}

// La pestaña se oculta con una voz sonando: se corta. Es la misma regla 6, en el
// otro sentido — no alcanza con no empezar, hay que no seguir.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' || !hablando) return;
  vozNodo.pause();
  soltarLaVoz();
});
