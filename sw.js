// Service worker de Chip. Cache-first sobre los archivos del juego.
//
// ============================================================================
// CÓMO FORZAR UNA ACTUALIZACIÓN — leer antes de tocar nada
// ============================================================================
//
// 1. Subir CACHE_VERSION en CADA cambio de cualquier archivo de ARCHIVOS_CACHE.
//    Si no se sube, el usuario sigue viendo la versión vieja para siempre.
//
// 2. El SW se registra también en desarrollo. localhost y 127.0.0.1 son
//    contextos seguros, así que funciona ahí igual que en producción y se puede
//    probar normal con Live Server. Lo que NO alcanza es una IP de LAN sobre
//    HTTP plano: eso no es contexto seguro y el navegador no registra nada.
//    Para probar desde el celular hay que servir por HTTPS (GitHub Pages).
//
// 3. Mientras se desarrolla conviene dejar tildado, en DevTools -> Application
//    -> Service Workers: "Update on reload" y "Bypass for network". Sin eso el
//    SW sirve la versión cacheada y parece que los cambios no se aplican.
//    Si ya quedó una versión pegada: "Unregister" + Application -> Storage ->
//    "Clear site data" + Ctrl+Shift+R.
//
// 4. skipWaiting + clients.claim hacen que el SW nuevo tome control sin cerrar
//    pestañas. Eso puede dejar una pestaña abierta con JS viejo y assets nuevos:
//    recargar una vez después de cada deploy.
//
// ============================================================================
// POR QUÉ ESTAS CONSTANTES NO ESTÁN EN js/config.js
// ============================================================================
//
// El navegador dispara el update del service worker comparando los BYTES de
// este archivo. Si CACHE_VERSION viviera en config.js, subirla dejaría sw.js
// byte-idéntico y el update podría no dispararse nunca — justo el problema que
// este bloque explica cómo evitar. Es un carve-out consciente de la regla de
// "toda constante vive en config.js", y está anotado también allá.

const CACHE_VERSION = 'chip-cache-v109';

// LA HUELLA DEL CONTENIDO DE ARCHIVOS_CACHE. No la lee nadie en runtime: existe
// para que un test pueda contestar la única pregunta que importa acá, que es si
// alguien cambió un archivo cacheado sin subir la versión.
//
// Ese error se llevó dos deploys en un día y es invisible: todo compila, todas
// las pruebas pasan, el push sale bien, y el teléfono sigue mostrando lo de
// ayer. El fetch es cache-first puro y el activate sólo borra las cachés con
// nombre distinto de CACHE_VERSION, así que sin bump no se baja nada nunca.
//
// Vive ACÁ y no en un archivo aparte para que subir la versión y reescribir la
// huella sean la MISMA edición. Con la huella suelta, el camino corto para callar
// el test sería regenerarla sin tocar la versión — o sea el mismo error, ahora
// bendecido por un test.
//
// Se escribe sola: `node tests/sellar-cache.mjs` sube la versión y la recalcula.
// No se edita a mano.
const HUELLA_CACHE = '94b3d20c1fca1c57';

// No se cachean tests/, js/debug.js ni icons/generador.html: son superficies de
// desarrollo y no forman parte del juego instalado.
//
// TAMPOCO SE CACHEAN LOS AMBIENTES de sonidos/, y es una decisión y no un
// olvido: son 2,3 MB que se le sumarían a la instalación de la PWA para algo
// que mucha gente no va a usar nunca. Se bajan bajo demanda la primera vez que
// alguien prende el sonido; quien no lo prenda, no los baja. El fetch cae al
// `|| fetch(evento.request)` de más abajo y anda igual.
//
// tests/assets.test.js los contempla como categoría aparte, con su propio
// límite: si estuvieran en la misma bolsa que los sprites, el presupuesto de la
// instalación diría 3,9 MB cuando en realidad instala 1,6.
const ARCHIVOS_CACHE = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './js/config.js',
  './js/estado.js',
  './js/decay.js',
  './js/acciones.js',
  './js/eventos.js',
  './js/datos-eventos.js',
  './js/coleccion.js',
  './js/datos-objetos.js',
  './js/formas.js',
  './js/gigantes.js',
  './js/datos-gigantes.js',
  './js/sprites.js',
  './js/visita.js',
  './js/sesion.js',
  './js/tema.js',
  './js/ui-montaje.js',
  './js/ui.js',
  './js/main.js',
  // LA FUENTE PIXEL de las etiquetas de la botonera. Si no estuviera acá, la
  // primera apertura sin red caería a la fuente de reserva y las etiquetas
  // cambiarían de forma. Se genera con `node tools/fuente-chip.mjs`.
  './fuentes/chip-pixel.ttf',

  // ---- LA VOZ DE CHIP, Y SÍ VA EN EL CACHÉ ----
  //
  // Los AMBIENTES no se cachean, y está escrito arriba por qué: son 2,3 MB para
  // algo que mucha gente no va a prender nunca. La voz es al revés y por dos
  // motivos: son veinte archivos cortos —852 KB, 9,9 segundos en total— y sobre
  // todo TIENEN QUE ESTAR AL INSTANTE. Un ambiente que tarda dos segundos en
  // empezar no se nota; una voz que contesta un toque dos segundos después no es
  // una voz, es un eco.
  //
  // Siguen en .wav porque no hay conversor a ogg en esta máquina — ver VOZ en
  // config.js, con la medición de lo que el navegador puede y no puede escribir.
  './sonidos/chip/01_curious_short.wav',
  './sonidos/chip/02_brrup.wav',
  './sonidos/chip/03_question.wav',
  './sonidos/chip/04_thinking_long.wav',
  './sonidos/chip/05_tiny_greeting.wav',
  './sonidos/chip/06_murmur_long.wav',
  './sonidos/chip/07_bright.wav',
  './sonidos/chip/08_low_battery_hint.wav',
  './sonidos/chip/09_what_was_that.wav',
  './sonidos/chip/10_content.wav',
  './sonidos/chip/11_long_conversation.wav',
  './sonidos/chip/12_sleepy.wav',
  './sonidos/chip/13_surprised_small.wav',
  './sonidos/chip/14_robot_chuckle.wav',
  './sonidos/chip/15_distant_feeling.wav',
  './sonidos/chip/16_energetic_long.wav',
  './sonidos/chip/17_idle_mumble.wav',
  './sonidos/chip/18_long_scan.wav',
  './sonidos/chip/19_drowsy_question.wav',
  './sonidos/chip/20_signature_long.wav',
  // Los siete sprites de estado. Sin ellos, la app instalada y sin red levantaba
  // con el galpón de fondo y placeholders en el medio: ahora abre completa.
  // La lista está escrita a mano y no sale de RUTAS_SPRITES porque este archivo
  // no puede importar config.js — es el mismo carve-out del bloque de arriba.
  './sprites/idle.webp',
  './sprites/idle-ojos.webp',
  './sprites/idle-ojos-contento.webp',
  './sprites/idle-ojos-cerrado.webp',
  './sprites/idle-cabeza.webp',
  './sprites/feliz-cabeza.webp',
  // El cuerpo sin cabeza ni brazos: es el que dibuja el canvas cuando las capas
  // que rotan están puestas. Ver RUTAS_CUERPO en config.js.
  './sprites/idle-cuerpo.webp',
  // El cuerpo sin cabeza, sin brazos Y SIN ORUGAS. Es el tercer escalón del
  // recorte, y lo que habilita es que las orugas sean una capa propia para que
  // el polvo del punto 8 quepa debajo. Es el único .png de los cuerpos.
  './sprites/idle-cuerpo-sin-orugas.png',
  './sprites/feliz-cuerpo.webp',
  './sprites/feliz-ojos.webp',
  // Está en el repo y en el caché, pero NO en RUTAS_OJOS ni en POSES_IDLE: la
  // pose sigue suspendida. El recorte existe y es correcto —256x256, alineado
  // al mismo lienzo— pero el sprite es de otra generación y no pega con el
  // estilo del resto. Queda acá listo para el día que la pose se rehabilite.
  './sprites/idle-manitos-ojos.webp',
  // Igual que el de arriba: está en el repo y en el caché, sin wirear. Es el
  // recorte de las orugas para el punto 2 (que giren). Medido: vienen las DOS en
  // una sola capa pero como dos componentes separadas, con centros en 66,3/86,4 y
  // 30,8/86,5 del lienzo — que son los dos pivotes que va a necesitar el giro.
  './sprites/idle-orugas.webp',
  // Y estos son de la misma clase: aparecieron en el repo mientras se
  // trabajaba en los gestos y NO están wireados a nada. Son los recortes de los
  // brazos —izquierdo y derecho, de idle y de feliz—, 256x256 RGBA, alineados al
  // mismo lienzo. Se cachean para que el test no falle y para que estén listos el
  // día que se usen —el candidato obvio es que los brazos reaccionen a la
  // caricia—, pero nadie los carga todavía. Ojo: son los únicos .png de la
  // carpeta; los demás son .webp.
  './sprites/idle-brazo-izq.webp',
  './sprites/idle-brazo-der.webp',
  './sprites/feliz-brazo-izq.webp',
  './sprites/feliz-brazo-der.webp',
  './sprites/feliz.webp',
  './sprites/critico.webp',
  './sprites/standby.webp',
  './sprites/cargando.webp',
  './sprites/jugando.webp',
  './sprites/limpiando.webp',
  './sprites/esperando.webp',
  './sprites/idle-manitos.webp',
  './sprites/fondo-amanecer.webp',
  './sprites/fondo-mediodia.webp',
  './sprites/fondo-atardecer.webp',
  './sprites/fondo-noche.webp',
  './sprites/fondo-niebla.webp',
  './sprites/fondo-tormenta.webp',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png'
];

self.addEventListener('install', (evento) => {
  // Se anuncia qué versión y qué contenido se está instalando. Es la única forma
  // de contestar "¿qué tiene puesto este teléfono?" sin adivinar: con el
  // depurador remoto se lee esta línea y se compara contra el sw.js del repo.
  // Cuando el bug del caché pegó, la pregunta que no se podía contestar era
  // exactamente ésta.
  console.log(`[chip] instalando ${CACHE_VERSION} — huella ${HUELLA_CACHE}`);

  evento.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(ARCHIVOS_CACHE))
      .then(() => self.skipWaiting())
  );
});

// ---- "¿QUÉ VERSIÓN TENÉS PUESTA?" ----
//
// La pregunta que no se podía contestar sin adivinar, y que costó dos deploys.
// El `console.log` del install sólo se ve con el depurador remoto enchufado, o
// sea nunca en el teléfono de Damián.
//
// Ahora el panel de debug pregunta y ESTE service worker contesta. Y contesta el
// que está CONTROLANDO la página, no el que hay en el servidor: si el teléfono
// quedó con una versión vieja, lo que se ve en el panel es esa versión vieja —
// que es exactamente el dato que hace falta. Bajarse sw.js y leerlo diría lo que
// hay publicado, que es la pregunta equivocada.
// LA RESPUESTA VA POR EL PUERTO CUANDO HAY PUERTO, y esa distinción costó un
// timeout. Quien pregunta abre un MessageChannel y escucha en su `port1`; el
// service worker recibe el `port2` en `evento.ports[0]`. Contestar por
// `evento.source` —que es el cliente— es una respuesta válida que nadie está
// escuchando, así que el panel esperaba 400 ms y mostraba "el SW no contestó".
//
// Se deja el `source` como reserva para un postMessage sin puerto.
self.addEventListener('message', (evento) => {
  if (evento.data !== 'version') return;

  const respuesta = { version: CACHE_VERSION, huella: HUELLA_CACHE };
  const puerto = evento.ports && evento.ports[0];

  if (puerto) puerto.postMessage(respuesta);
  else evento.source?.postMessage(respuesta);
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nombres) =>
        Promise.all(
          nombres.filter((nombre) => nombre !== CACHE_VERSION).map((nombre) => caches.delete(nombre))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Cache-first con fallback a red. Sólo GET y sólo same-origin: cualquier otra
// cosa pasa de largo sin que el SW se meta.
self.addEventListener('fetch', (evento) => {
  const url = new URL(evento.request.url);

  if (evento.request.method !== 'GET' || url.origin !== self.location.origin) return;

  evento.respondWith(
    caches.match(evento.request).then((cacheado) => cacheado || fetch(evento.request))
  );
});
