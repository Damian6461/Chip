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

const CACHE_VERSION = 'chip-cache-v82';

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
  './sprites/fondo-dia.webp',
  './sprites/fondo-noche.webp',
  './sprites/fondo-niebla.webp',
  './sprites/fondo-tormenta.webp',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png'
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(ARCHIVOS_CACHE))
      .then(() => self.skipWaiting())
  );
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
