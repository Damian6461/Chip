// Service worker de Chip. Cache-first sobre los archivos del juego.
//
// ============================================================================
// CÓMO FORZAR UNA ACTUALIZACIÓN — leer antes de tocar nada
// ============================================================================
//
// 1. Subir CACHE_VERSION en CADA cambio de cualquier archivo de ARCHIVOS_CACHE.
//    Si no se sube, el usuario sigue viendo la versión vieja para siempre.
//
// 2. Durante el desarrollo el SW no se registra en localhost (ver HOSTS_SIN_SW
//    en js/config.js), así que Live Server nunca sirve archivos rancios. Para
//    probar el SW de verdad hay que servir por IP de LAN o desplegar.
//
// 3. Si aun así quedó una versión pegada:
//    DevTools -> Application -> Service Workers -> tildar "Update on reload" y
//    "Bypass for network". O bien: "Unregister" + Application -> Storage ->
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

const CACHE_VERSION = 'chip-cache-v2';

// No se cachean tests/, js/debug.js ni icons/generador.html: son superficies de
// desarrollo y no forman parte del juego instalado.
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
  './js/sprites.js',
  './js/ui.js',
  './js/main.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
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
