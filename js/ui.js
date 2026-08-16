// Único módulo que toca el DOM.

import {
  STAT_MIN,
  STAT_MAX,
  PLACEHOLDER,
  CLASE_SALTO,
  DURACION_ESTOY_BIEN_MS,
  CLASE_ESTOY_BIEN,
  SECCIONES_MENU,
  CLASE_SIN_MOVIMIENTO,
  ESTADOS_DE_ACCION,
  CLASE_CAMBIO,
  // Las duraciones de cruce NO se importan acá: llegan como argumento `cruce` de
  // render(). Quién decide cuánto dura una transición es la sesión, no el módulo
  // que la pinta — y tenerlas importadas de más era la puerta para que alguien
  // volviera a decidirlo desde acá.
  VARS_CRUCE_FONDO,
  CLASE_CRUCE_FONDO,
  VARS_FONDO,
  CLASE_NOCHE,
  DURACION_PANEL_ESTADO_MS,
  COOLDOWN_CARICIA_MS,
  CARICIAS_PARA_CANSARSE,
  VENTANA_CANSANCIO_MS,
  DURACION_CANSANCIO_MS,
  ESPERA_MANTENIDO_MS,
  DURACION_CARICIA_MS,
  CLASE_CARICIA,
  CLASE_CANSADO,
  CLASE_MANTENIENDO,
  ESPERA_DEBUG_MS,
  CLASE_ABRIENDO_DEBUG,
  VUELO_OBJETO,
  VARS_PISO,
  CLASE_VOLANDO,
  CLASE_EN_PISO,
  TRANSICION_PANEL_MS,
  CLASE_PANEL_VISIBLE,
  ESPERA_SEGUNDO_EVENTO_MS,
  DURACION_LLEGADA_MS,
  ESPERA_ENTRE_LLEGADAS_MS,
  PIEZAS_POR_ESTANTE,
  LLUVIA,
  CLASE_LLOVIENDO,
  CLASE_OBJETO_NUEVO,
  CLASE_OBJETO_OBTENIDO,
  RUTAS_OJOS,
  DURACION_PARPADEO_MS,
  MARGEN_FIN_PARPADEO_MS,
  PARPADEO_INTERVALO_MIN_MS,
  PARPADEO_INTERVALO_MAX_MS,
  PROBABILIDAD_DOBLE_PARPADEO,
  ESPERA_DOBLE_PARPADEO_MS,
  CLASE_PARPADEO,
  CORAZONES_FELIZ,
  DESTELLOS_FELIZ,
  RAYITAS_JUGANDO,
  PULSOS_CARGANDO,
  BURBUJAS_LIMPIANDO,
  DURACION_CORAZON_MS,
  ESPERA_ENTRE_CORAZONES_MS,
  CORAZONES_EXTRA_MIN,
  CORAZONES_EXTRA_MAX,
  CLASE_CELEBRANDO,
  VARS_PERSONAJE,
  POSICIONES_ANTENA,
  VARS_ANTENA,
  APOYO_ORUGAS,
  VARS_SOMBRA,
  PANTALLAS_PECHO,
  RECUADROS_RAYO,
  COLORES_NUBE,
  VARS_NUBES,
  VARS_RAYO,
  ESTADOS_CON_PANTALLA_VIVA,
  SEGMENTOS_PANTALLA,
  CAJA_SEGMENTOS,
  ALTO_NUMERO,
  CAJA_NUMERO,
  VARS_PANTALLA,
  FILOS_OBJETO,
  FILO_OBJETO_POR_DEFECTO,
  BASES_OBJETO,
  LIENZO_OBJETO,
  VARS_OBJETO,
  VARS_LUZ,
  PREFIJO_CLASE_ESTADO,
  CLASE_DESTELLO_BULBO,
  DURACION_DESTELLO_BULBO_MS,
  NUBE_RAPIDA,
  ESCALONES_ACCION,
  AROS_ORUGA,
  GIRO_ORUGAS,
  CLASE_ACOMODO,
  RUTAS_CABEZA,
  VARS_CABEZA,
  CLASE_INCLINADA,
  ESPERA_INCLINACION,
  DURACION_INCLINACION_MS,
  CABLE,
  PULSOS_CABLE,
  CONECTOR_PECHO,
  RECORRIDO_CABLE,
  VARS_CABLE
} from './config.js';
import { aplica, puedeJugar } from './acciones.js';
import { obtenerSprite, cajaDeContenidoPantalla } from './sprites.js';
import { objetosConEstado } from './coleccion.js';
import { gigantesConEstado } from './gigantes.js';
import {
  svgDeObjeto,
  svgDeGigante,
  svgDeCorazon,
  svgDeChispa,
  svgDePulso,
  svgDeBurbuja,
  svgDeTilde,
  svgDeRayo,
  svgDeNumero,
  cintaDelCable,
  fichaDelPuerto,
  caminoDeVuelo,
  reflejoDeAro
} from './formas.js';

// Los nodos, el puente de custom properties y los SVG del mobiliario están en
// ui-montaje.js. Este módulo pinta; aquel deja el galpón puesto.
import {
  raiz,
  cajaChip,
  contenedorMascota,
  nodoOrugas,
  capaCabeza,
  grupoCabeza,
  capaOjos,
  capaParpado,
  contenedorCorazones,
  contenedorDestellos,
  contenedorCorazonesExtra,
  panelEstado,
  lineaEvento,
  estante,
  panelColeccion,
  grillaColeccion,
  detalleColeccion,
  grillaGigantes,
  detalleGigantes,
  canvas,
  cuerpo,
  ctx,
  menuBoton,
  menu,
  solapas,
  secciones,
  bulbo,
  estantes,
  resplandor,
  contenedorNubes,
  contenedorLluvia,
  crearBanda,
  nodoCable,
  escena,
  nodoPiso
} from './ui-montaje.js';

// ---- El menú ----
//
// Tres secciones y sólo tres. La mudanza de la colección al cuerpo del panel la
// hace ui-montaje.js; acá queda su comportamiento.
function mostrarSeccion(nombre) {
  for (const solapa of solapas) {
    solapa.setAttribute('aria-selected', String(solapa.dataset.seccion === nombre));
  }
  for (const seccion of secciones) {
    seccion.hidden = seccion.id !== `menu-${nombre}`;
  }
}

let devolverFoco = null;

function abrirMenu(seccion = SECCIONES_MENU[0]) {
  devolverFoco = document.activeElement;
  mostrarSeccion(seccion);
  menu.hidden = false;
  solapas[SECCIONES_MENU.indexOf(seccion)]?.focus();
}

function cerrarMenu() {
  menu.hidden = true;
  ocultarConfirmacion();
  if (devolverFoco && devolverFoco.isConnected) devolverFoco.focus();
  devolverFoco = null;
}

function ocultarConfirmacion() {
  const caja = document.getElementById('confirmar-reinicio');
  if (caja) caja.hidden = true;
}

if (menu) {
  menuBoton.addEventListener('click', () => abrirMenu());
  document.getElementById('menu-cerrar').addEventListener('click', cerrarMenu);
  for (const solapa of solapas) {
    solapa.addEventListener('click', () => mostrarSeccion(solapa.dataset.seccion));
  }

  // Escape cierra, que es lo que espera cualquiera con teclado.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) cerrarMenu();
  });
}

// ---- La puerta de servicio ----
//
// Mantener apretado el botón del menú abre el panel de debug. Existe porque en
// la app INSTALADA no hay forma de pasar ?debug=1: la PWA arranca en la
// start_url cacheada y el service worker responde con caches.match sin
// ignoreSearch, así que el parámetro no llega.
//
// Tres segundos es a propósito: nadie sostiene un botón de menú tres segundos
// sin querer. Y el botón sigue haciendo lo suyo con un toque normal — si el
// timer no llegó a vencer, el click abre el menú como siempre.

let temporizadorDebug = null;
let abrioElDebug = false;

export function conectarDebugOculto(alActivar) {
  if (!menuBoton) return;

  menuBoton.addEventListener('pointerdown', () => {
    abrioElDebug = false;
    menuBoton.classList.add(CLASE_ABRIENDO_DEBUG);

    clearTimeout(temporizadorDebug);
    temporizadorDebug = setTimeout(() => {
      temporizadorDebug = null;
      menuBoton.classList.remove(CLASE_ABRIENDO_DEBUG);
      abrioElDebug = true;
      alActivar();
    }, ESPERA_DEBUG_MS);
  });

  const soltar = () => {
    clearTimeout(temporizadorDebug);
    temporizadorDebug = null;
    menuBoton.classList.remove(CLASE_ABRIENDO_DEBUG);
  };

  menuBoton.addEventListener('pointerup', soltar);
  menuBoton.addEventListener('pointerleave', soltar);
  menuBoton.addEventListener('pointercancel', soltar);

  // Al soltar después de los tres segundos el click llega igual, y sin esto el
  // menú se abriría encima del panel que se acaba de abrir. Se escucha en
  // CAPTURA para llegar antes que el handler que abre el menú.
  menuBoton.addEventListener(
    'click',
    (evento) => {
      if (!abrioElDebug) return;
      abrioElDebug = false;
      evento.stopPropagation();
      evento.preventDefault();
    },
    true
  );
}

// El movimiento reducido puede venir de dos lados: del ajuste del juego o de
// prefers-reduced-motion del sistema. El OR se resuelve acá y el CSS ve una sola
// clase — así nunca tiene que preguntar dos cosas.
const preferenciaDelSistema = window.matchMedia('(prefers-reduced-motion: reduce)');

export function aplicarAjustes(ajustes) {
  const apagado = ajustes.movimientoReducido || preferenciaDelSistema.matches;
  document.body.classList.toggle(CLASE_SIN_MOVIMIENTO, apagado);

  const casilla = document.getElementById('ajuste-movimiento');
  if (casilla) casilla.checked = ajustes.movimientoReducido;

  const sonido = document.getElementById('ajuste-sonido');
  if (sonido) sonido.checked = Boolean(ajustes.sonido);
}

// Si el sistema cambia de opinión con la app abierta, se acompaña.
export function conectarMenu({ onMovimiento, onSonido, onReiniciar, ajustesActuales }) {
  if (!menu) return;

  // Si el sistema cambia de opinión con la app abierta, se acompaña sin pisar
  // lo que el jugador eligió: el OR se recalcula con el ajuste vigente.
  preferenciaDelSistema.addEventListener('change', () => aplicarAjustes(ajustesActuales()));

  document.getElementById('ajuste-movimiento').addEventListener('change', (e) => {
    onMovimiento(e.target.checked);
  });

  // El toggle del sonido ES el gesto que el navegador pide para poder reproducir
  // audio. Por eso no hay ningún intento de sonar antes de esto.
  document.getElementById('ajuste-sonido')?.addEventListener('change', (e) => {
    onSonido(e.target.checked);
  });

  const caja = document.getElementById('confirmar-reinicio');
  document.getElementById('ajuste-reiniciar').addEventListener('click', () => {
    caja.hidden = false;
  });
  document.getElementById('confirmar-no').addEventListener('click', ocultarConfirmacion);
  document.getElementById('confirmar-si').addEventListener('click', () => {
    ocultarConfirmacion();
    cerrarMenu();
    onReiniciar();
  });
}

// El alféizar sigue abriendo la colección, pero ahora entra por la misma puerta:
// abre el menú en su sección. Una sola vista, dos accesos.
function abrirColeccion() {
  if (menu) abrirMenu('coleccion');
}

// ---- La pantalla del pecho, viva ----
//
// Tapa la que está pintada en el sprite —que decía siempre 100%, con la batería
// en 12 igual que en 100— y muestra el stat de verdad.
//
// Los segmentos se crean una sola vez: son seis, como los seis que están
// dibujados en el arte, y lo que cambia en cada render es cuáles están
// encendidos. Crearlos de nuevo en cada tick sería tirar y rehacer seis nodos
// varias veces por segundo para no cambiar nada.
const rayoPecho = document.getElementById('rayo');
if (rayoPecho) rayoPecho.innerHTML = svgDeRayo();

// La caja del rayo cambia con la pose igual que la de la pantalla y la de la
// antena: es otra medida del arte, no una posición inventada.
function pintarRayo(claveSprite) {
  if (!rayoPecho) return;
  const caja = RECUADROS_RAYO[claveSprite];
  rayoPecho.hidden = !caja;
  if (!caja) return;
  rayoPecho.style.setProperty(VARS_RAYO.x, `${caja.x}%`);
  rayoPecho.style.setProperty(VARS_RAYO.y, `${caja.y}%`);
  rayoPecho.style.setProperty(VARS_RAYO.ancho, `${caja.ancho}%`);
  rayoPecho.style.setProperty(VARS_RAYO.alto, `${caja.alto}%`);
}

const pantalla = document.getElementById('pantalla');
const segmentosPantalla = document.getElementById('pantalla-segmentos');
const numeroPantalla = document.getElementById('pantalla-numero');

if (pantalla) {
  for (let i = 0; i < SEGMENTOS_PANTALLA; i++) {
    const seg = document.createElement('span');
    seg.className = 'segmento';
    segmentosPantalla.appendChild(seg);
  }
  raiz.style.setProperty('--pantalla-seg-x', `${CAJA_SEGMENTOS.x}%`);
  raiz.style.setProperty('--pantalla-seg-y', `${CAJA_SEGMENTOS.y}%`);
  raiz.style.setProperty('--pantalla-seg-ancho', `${CAJA_SEGMENTOS.ancho}%`);
  raiz.style.setProperty('--pantalla-seg-alto', `${CAJA_SEGMENTOS.alto}%`);
  raiz.style.setProperty('--pantalla-num-y', `${CAJA_NUMERO.y}%`);
  raiz.style.setProperty('--pantalla-num-alto', `${CAJA_NUMERO.alto}%`);
raiz.style.setProperty('--pantalla-num-glifo', `${ALTO_NUMERO}cqh`);
}

// Cuántos segmentos prende un stat. Se redondea hacia ARRIBA salvo en cero: con
// batería en 1 tiene que quedar algo encendido —el aparato está prendido— y con
// batería en 0 no puede quedar nada. Redondear al más cercano dejaría el
// instrumento vacío desde el 8% para abajo, que es justo cuando el jugador más
// mira la pantalla.
function segmentosEncendidos(bateria) {
  if (bateria <= STAT_MIN) return 0;
  return Math.max(1, Math.ceil((bateria / STAT_MAX) * SEGMENTOS_PANTALLA));
}

function pintarPantalla(estado, estadoVisual) {
  if (!pantalla) return;

  const caja = PANTALLAS_PECHO[estadoVisual];
  const viva = caja && ESTADOS_CON_PANTALLA_VIVA.includes(estadoVisual);
  pantalla.hidden = !viva;
  if (!viva) return;

  pantalla.style.setProperty(VARS_PANTALLA.x, `${caja.x}%`);
  pantalla.style.setProperty(VARS_PANTALLA.y, `${caja.y}%`);
  pantalla.style.setProperty(VARS_PANTALLA.ancho, `${caja.ancho}%`);
  pantalla.style.setProperty(VARS_PANTALLA.alto, `${caja.alto}%`);
  pantalla.style.setProperty(VARS_PANTALLA.giro, `${caja.giro}deg`);
  pantalla.style.setProperty(VARS_PANTALLA.vidrio, caja.vidrio);

  // El contenido se encaja con proporción fija: lo único que cambia entre
  // estados es dónde se ancla y a qué escala.
  const cont = cajaDeContenidoPantalla(caja);
  pantalla.style.setProperty(VARS_PANTALLA.contX, `${cont.x.toFixed(2)}%`);
  pantalla.style.setProperty(VARS_PANTALLA.contY, `${cont.y.toFixed(2)}%`);
  pantalla.style.setProperty(VARS_PANTALLA.contAncho, `${cont.ancho.toFixed(2)}%`);
  pantalla.style.setProperty(VARS_PANTALLA.contAlto, `${cont.alto.toFixed(2)}%`);

  estadoUltimo = estado;
  claveUltima = estadoVisual;

  const bateria = Math.round(estado.bateria);
  const prendidos = segmentosEncendidos(estado.bateria);
  [...segmentosPantalla.children].forEach((seg, i) => {
    seg.classList.toggle('encendido', i < prendidos);
  });
  const texto = `${bateria}%`;
  if (pantalla.classList.contains(CLASE_ESTOY_BIEN)) return;
  if (numeroPantalla.dataset.texto !== texto) {
    numeroPantalla.dataset.texto = texto;
    numeroPantalla.innerHTML = svgDeNumero(texto);
  }
}

// ---- "Estoy bien, gracias" ----
//
// La respuesta cuando una acción no hace falta. Va en la pantalla del pecho,
// que es donde Chip ya habla, y reemplaza al número por un momento — no se
// suma al lado, porque dos cosas en un display de 45 px no se leen.
//
// El tono es lo importante: un tilde y no una cruz. La acción no está
// prohibida, es que ya está hecha.
let temporizadorEstoyBien = null;

export function responderEstoyBien() {
  if (!pantalla || pantalla.hidden) return;

  clearTimeout(temporizadorEstoyBien);
  numeroPantalla.dataset.texto = "";
  numeroPantalla.innerHTML = svgDeTilde();
  pantalla.classList.add(CLASE_ESTOY_BIEN);

  temporizadorEstoyBien = setTimeout(() => {
    pantalla.classList.remove(CLASE_ESTOY_BIEN);
    // El dataset vacío fuerza a pintarPantalla a reescribir el número en el
    // próximo render, que llega solo con el tick o con la próxima acción.
    numeroPantalla.dataset.texto = "";
    pintarPantalla(estadoUltimo, claveUltima);
  }, DURACION_ESTOY_BIEN_MS);
}

// Lo último que se pintó, para poder volver al número cuando el tilde se va.
let estadoUltimo = null;
let claveUltima = null;

// ---- El parpadeo ----
//
// Va por capa DOM y no por transformación del contexto 2D. Las razones, que la
// spec pedía reportar:
//
//   1. Todo lo que se mueve en este proyecto es CSS. Hacerlo en canvas obligaría
//      a redibujar ~8 cuadros por parpadeo, o sea un bucle de render que hoy no
//      existe en ningún lado.
//   2. prefers-reduced-motion ya lo cubre el bloque @media de siempre. En canvas
//      habría que consultarlo desde JS y mantener esa rama a mano.
//   3. transform-origin da el pivote exacto; en canvas habría que armar la
//      matriz a mano en cada cuadro.
//   4. La capa y el canvas escalan idéntico —los dos son 256 y ocupan la misma
//      caja— así que la alineación sale sola, sin cuentas.
//
// Se verificó antes de escribirlo: el recorte incluye el aro crema del ojo, así
// que al achatarse tapa la pupila del cuerpo y lee como párpado. El cuerpo no se
// redibuja nunca.

let temporizadorParpadeo = null;
let rutaOjosActual = null;

function intervaloParpadeo() {
  const rango = PARPADEO_INTERVALO_MAX_MS - PARPADEO_INTERVALO_MIN_MS;
  return PARPADEO_INTERVALO_MIN_MS + Math.random() * rango;
}

// RED DE CONTENCIÓN DEL PARPADEO.
//
// Abajo de #ojos hay una capa de color plano recortada con la forma de los ojos
// —el párpado— que está SIEMPRE pintada. Lo único que la tapa es #ojos. O sea:
// cualquier cuadro en que #ojos quede achatado y no se recupere deja a Chip con
// los ojos entrecerrados, que es exactamente la expresión de cansancio de
// critico. Un estado equivocado, y permanente.
//
// La animación tiene fill `both`, así que al terminar se queda en scaleY(1) y
// se recupera sola. El problema es cuando NO termina: si el reloj de animación
// se congela a mitad —pestaña en segundo plano, la primera de las cuatro
// trampas del README— la clase queda puesta con la animación a medio camino.
//
// Por eso el temporizador: pase lo que pase, DURACION_PARPADEO_MS + margen
// después la clase se va y #ojos vuelve a tapar el párpado. No se usa
// animationend porque animationend es justamente lo que no llega cuando el
// reloj está congelado — sería pedirle la salida al mismo instrumento que
// falló.
let temporizadorFinParpadeo = null;

function unParpadeo() {
  // Sacar, forzar reflow y volver a poner: reinicia la animación aunque el
  // parpadeo anterior no haya terminado. Mismo truco que el salto.
  capaOjos.classList.remove(CLASE_PARPADEO);
  void capaOjos.offsetWidth;
  capaOjos.classList.add(CLASE_PARPADEO);

  clearTimeout(temporizadorFinParpadeo);
  temporizadorFinParpadeo = setTimeout(() => {
    capaOjos.classList.remove(CLASE_PARPADEO);
  }, DURACION_PARPADEO_MS + MARGEN_FIN_PARPADEO_MS);
}

function cicloParpadeo() {
  unParpadeo();

  const doble = Math.random() < PROBABILIDAD_DOBLE_PARPADEO;
  const extra = doble ? DURACION_PARPADEO_MS + ESPERA_DOBLE_PARPADEO_MS : 0;

  if (doble) setTimeout(unParpadeo, extra);

  // El intervalo se resortea acá, después de cada parpadeo, y no una vez al
  // arrancar: con uno solo el ciclo entero quedaría fijo.
  temporizadorParpadeo = setTimeout(cicloParpadeo, extra + intervaloParpadeo());
}

// Y AL VOLVER A LA APP, LOS OJOS ABIERTOS.
//
// El temporizador de arriba cubre el caso normal, pero él mismo se estira: con
// la pestaña en segundo plano los timers se limitan a uno por segundo. Medido
// acá: un parpadeo que dura 130 ms se quedó con la clase puesta 1000 ms.
//
// El síntoma en producción es justo ese: volvés a la app y Chip te recibe con
// cara de cansancio, porque lo último que el compositor pintó antes de
// congelarse fue un cuadro a mitad del parpadeo. No es un estado equivocado de
// la cadena — es un cuadro viejo.
//
// Así que al volver a ser visible se fuerza la apertura y se reengancha el
// ciclo. Cuesta cuatro líneas y saca de la mesa la única forma que tenía Chip
// de quedarse con una expresión que no le corresponde.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible' || !rutaOjosActual) return;

  clearTimeout(temporizadorFinParpadeo);
  capaOjos.classList.remove(CLASE_PARPADEO);
  clearTimeout(temporizadorParpadeo);
  temporizadorParpadeo = setTimeout(cicloParpadeo, intervaloParpadeo());
});

function pararParpadeo() {
  clearTimeout(temporizadorParpadeo);
  clearTimeout(temporizadorFinParpadeo);
  temporizadorParpadeo = null;
  temporizadorFinParpadeo = null;
  capaOjos.classList.remove(CLASE_PARPADEO);
}

// Un recorte que no carga no rompe nada: la capa se esconde y ese estado
// simplemente no parpadea, igual que el fallback de los sprites.
capaOjos.addEventListener('error', () => {
  pararParpadeo();
  capaOjos.hidden = true;
});

function pintarOjos(estadoVisual) {
  const ruta = RUTAS_OJOS[estadoVisual] ?? null;
  if (ruta === rutaOjosActual) return;

  rutaOjosActual = ruta;
  pararParpadeo();

  if (!ruta) {
    capaOjos.hidden = true;
    capaParpado.hidden = true;
    return;
  }

  capaOjos.src = ruta;
  capaOjos.hidden = false;

  // El párpado usa el MISMO archivo como máscara: la forma es exactamente la de
  // los ojos, así que tapa los del cuerpo sin desbordar ni un píxel.
  raiz.style.setProperty(VARS_PERSONAJE.mascaraOjos, `url("${ruta}")`);
  capaParpado.hidden = false;

  temporizadorParpadeo = setTimeout(cicloParpadeo, intervaloParpadeo());
}

// ---- Los corazones ----

function armarCorazones(contenedor, cuantos, claseExtra = '') {
  contenedor.replaceChildren();

  for (let i = 0; i < cuantos; i++) {
    const nodo = document.createElement('span');
    nodo.className = `corazon ${claseExtra}`.trim();
    nodo.innerHTML = svgDeCorazon();
    contenedor.appendChild(nodo);
  }
}

// Cada efecto de estado es la misma mecánica —N nodos con una forma adentro— y
// lo que cambia es la forma, el tamaño y la animación, que vive en el CSS.
function armarEfecto(contenedor, cuantos, clase, svg) {
  contenedor.replaceChildren();

  for (let i = 0; i < cuantos; i++) {
    const nodo = document.createElement('span');
    nodo.className = clase;
    nodo.innerHTML = svg();
    contenedor.appendChild(nodo);
  }
}

armarCorazones(contenedorCorazones, CORAZONES_FELIZ);
armarCorazones(contenedorCorazonesExtra, CORAZONES_EXTRA_MAX, 'extra');
armarEfecto(contenedorDestellos, DESTELLOS_FELIZ, 'destello', svgDeChispa);
armarEfecto(document.getElementById('rayitas'), RAYITAS_JUGANDO, 'rayita', svgDeChispa);
armarEfecto(document.getElementById('pulsos'), PULSOS_CARGANDO, 'pulso', svgDePulso);
armarEfecto(document.getElementById('burbujas'), BURBUJAS_LIMPIANDO, 'burbuja', svgDeBurbuja);

let temporizadorCelebracion = null;

// La tanda que dispara una acción que sube el humor. Es el momento en que la
// mecánica y la emoción coinciden, y hasta ahora no tenía expresión visual.
//
// ---- Las orugas ----
//
// En reposo NO giran: Chip está quieto, y una rueda girando sola es lo que hace
// que un personaje parado se vea como un GIF. Giran en dos momentos, y los dos
// tienen causa: al ejecutar una acción se acomoda un cuarto de vuelta, y en
// jugando se mece de ida y vuelta.
//
// Lo que gira es la BARRA DEL CUBO y no el aro. El aro pintado es una elipse
// lisa —un círculo en escorzo— y rotarla sobre su centro no la hace rodar, la
// acuesta. La barra es la única pieza angular, y está dibujada por código
// justamente porque el arte no traía ninguna.

let temporizadorAcomodo = null;

function pintarOrugas(claveSprite) {
  if (!nodoOrugas) return;

  const aros = AROS_ORUGA[claveSprite];
  nodoOrugas.hidden = !aros;
  if (!aros) return;

  nodoOrugas.innerHTML = aros.map(reflejoDeAro).join('');
}

// El cuarto de vuelta de una acción. Se saca solo: es un gesto, no un estado.
export function acomodarOrugas() {
  if (!nodoOrugas || nodoOrugas.hidden) return;

  nodoOrugas.classList.remove(CLASE_ACOMODO);
  void nodoOrugas.offsetWidth;
  nodoOrugas.classList.add(CLASE_ACOMODO);

  clearTimeout(temporizadorAcomodo);
  temporizadorAcomodo = setTimeout(() => {
    nodoOrugas.classList.remove(CLASE_ACOMODO);
  }, GIRO_ORUGAS.acomodo.duracion + 120);
}

// ---- La inclinación de cabeza ----
//
// Cada tanto Chip ladea la cabeza. No lo dispara nada: pasa solo, y ese es el
// punto — es el único gesto del juego sin causa, y por eso se lee como que hay
// alguien adentro y no como una respuesta a un stat.
//
// El timer vive acá, misma excepción que el parpadeo y la nube ocasional: no es
// una decisión de estado, no toca el save, y nadie más necesita conocerlo.
//
// Sólo pasa cuando HAY recorte de cabeza, o sea en idle. En cargando o
// limpiando el gesto no tendría sentido y además no habría con qué taparlo.

let temporizadorInclinacion = null;
let temporizadorFinInclinacion = null;

function unaInclinacion() {
  if (!grupoCabeza || capaCabeza?.hidden) return;

  // El lado se sortea cada vez: siempre para el mismo se vuelve una muletilla.
  grupoCabeza.style.setProperty(VARS_CABEZA.lado, Math.random() < 0.5 ? '-1' : '1');

  grupoCabeza.classList.remove(CLASE_INCLINADA);
  // Reflow forzado: sin esto, sacar y poner la clase en el mismo frame no
  // reinicia la animación. Mismo motivo que en unParpadeo.
  void grupoCabeza.offsetWidth;
  grupoCabeza.classList.add(CLASE_INCLINADA);

  // Red de contención, igual que el parpadeo: si animationend no llega —pestaña
  // en segundo plano, animación cancelada— la clase quedaría puesta y la cabeza
  // se quedaría torcida para siempre.
  clearTimeout(temporizadorFinInclinacion);
  temporizadorFinInclinacion = setTimeout(() => {
    grupoCabeza.classList.remove(CLASE_INCLINADA);
  }, DURACION_INCLINACION_MS + 150);
}

function cicloInclinacion() {
  unaInclinacion();
  temporizadorInclinacion = setTimeout(
    cicloInclinacion,
    entre(ESPERA_INCLINACION.min, ESPERA_INCLINACION.max)
  );
}

function pintarCabeza(claveSprite) {
  if (!capaCabeza) return;

  const ruta = RUTAS_CABEZA[claveSprite];
  capaCabeza.hidden = !ruta;
  if (ruta && !capaCabeza.src.endsWith(ruta)) capaCabeza.src = ruta;

  // Si la pose no tiene recorte, no hay gesto: se corta el ciclo y se limpia
  // cualquier inclinación en curso, para que un cambio de estado a mitad de
  // gesto no deje la cabeza torcida sobre un sprite que no es el suyo.
  if (!ruta) {
    clearTimeout(temporizadorInclinacion);
    clearTimeout(temporizadorFinInclinacion);
    temporizadorInclinacion = null;
    grupoCabeza?.classList.remove(CLASE_INCLINADA);
    return;
  }

  if (!temporizadorInclinacion) {
    temporizadorInclinacion = setTimeout(
      cicloInclinacion,
      entre(ESPERA_INCLINACION.min, ESPERA_INCLINACION.max)
    );
  }
}

// ---- El cable ----
//
// Se dibuja en un SVG que cubre la escena entera, con viewBox de 1000x1000 y
// preserveAspectRatio="none": así las coordenadas son milésimos de la escena y
// no hace falta recalcular nada al cambiar de viewport. La distorsión que eso
// mete en el trazo la anula `vector-effect: non-scaling-stroke`, que es
// exactamente para esto.
//
// El punto de partida NO es un porcentaje fijo de la escena: es el conector del
// pecho, que vive en el lienzo de Chip, y Chip se ubica con sus propios
// anclajes. Se mide la caja real de #chip y se convierte. Un porcentaje de la
// escena se desalinearía apenas cambiara la proporción — el mismo error que ya
// tuvo el encuadre del fondo.

// EL CABLE SE DIBUJA EN PÍXELES DE LA ESCENA, y el viewBox se pone en cada
// render con el tamaño real. La primera versión usaba un viewBox de 100x100 con
// preserveAspectRatio="none", y eso distorsiona: en una escena de 390x844 una
// unidad valía 3,9 px a lo ancho y 8,4 a lo alto, así que los rulos —definidos
// como elipses achatadas— salían el DOBLE de altos que anchos. Dos globos
// parados en vez de dos vueltas de cable en el piso.
//
// Es la misma trampa que la de los porcentajes del radial-gradient: un radio en
// un espacio con los ejes a distinta escala no es un radio. Con el viewBox en
// píxeles, un círculo es un círculo y el stroke-width se mide en píxeles de
// verdad, sin necesidad de non-scaling-stroke.
function cajaDeLaEscena() {
  return nodoCable ? nodoCable.getBoundingClientRect() : null;
}

function puntoDelConector(escena) {
  if (!cajaChip || !escena) return null;
  const chip = cajaChip.getBoundingClientRect();
  if (!chip.width) return null;

  return {
    x: chip.x - escena.x + (CONECTOR_PECHO.x / 100) * chip.width,
    y: chip.y - escena.y + (CONECTOR_PECHO.y / 100) * chip.height
  };
}

export function dibujarCable() {
  if (!nodoCable) return;

  const escena = cajaDeLaEscena();
  const desde = puntoDelConector(escena);
  if (!desde || !escena.width) return;

  const aPx = (p) => ({ ...p, x: (p.x / 100) * escena.width, y: (p.y / 100) * escena.height });
  const enPx = {
    apoyo: aPx(RECORRIDO_CABLE.apoyo),
    quiebres: RECORRIDO_CABLE.quiebres.map(aPx),
    llegada: aPx(RECORRIDO_CABLE.llegada)
  };

  // LA PUNTA ENTRA AL PUERTO, no llega hasta él. El cable arranca un poco
  // ADENTRO del cuerpo y la boca se dibuja encima, así que el extremo queda
  // tapado por la pieza. Un cable que termina contra el borde del conector se ve
  // apoyado al lado; uno que se mete detrás del borde se ve enchufado.
  const haciaAdentro = { x: enPx.apoyo.x - desde.x, y: enPx.apoyo.y - desde.y };
  const ficha = fichaDelPuerto(desde, haciaAdentro, CABLE);

  const { completo, cuerpo, lomo, grosorLomo } = cintaDelCable(ficha.punta, enPx, CABLE);

  nodoCable.setAttribute('viewBox', `0 0 ${Math.round(escena.width)} ${Math.round(escena.height)}`);
  nodoCable.style.setProperty(VARS_CABLE.camino, `path("${completo}")`);

  const pulsos = Array.from(
    { length: PULSOS_CABLE.cuantos },
    (_, i) =>
      `<circle class="pulso-cable" r="${PULSOS_CABLE.radio}" style="animation-delay: ${Math.round((i * PULSOS_CABLE.ciclo) / PULSOS_CABLE.cuantos)}ms"/>`
  ).join('');

  // EL ORDEN DE PINTADO ES LA UNIÓN. La sombra primero, después la cinta —que
  // llega hasta adentro del puerto—, después los pulsos, y la ficha ÚLTIMA,
  // tapándole la punta al cable. Con la ficha antes que la cinta no taparía nada
  // y el cable volvería a terminar a la vista, que es como se veía apoyado.
  const eje = `translate(${desde.x.toFixed(1)} ${desde.y.toFixed(1)}) rotate(${ficha.giro.toFixed(1)})`;

  nodoCable.innerHTML =
    `<ellipse class="cable-sombra-puerto" transform="${eje}" rx="${(ficha.ancho * 0.78).toFixed(1)}" ry="${(ficha.ancho * 0.62).toFixed(1)}"/>` +
    `<path class="cable-cuerpo" d="${cuerpo}"/>` +
    `<path class="cable-lomo" d="${lomo}" style="stroke-width:${grosorLomo.toFixed(2)}px"/>` +
    pulsos +
    `<g class="cable-ficha" transform="${eje}">` +
    `<rect class="cable-ficha-cuerpo" x="${(-ficha.largoFicha * 0.18).toFixed(1)}" y="${(-ficha.ancho / 2).toFixed(1)}" width="${ficha.largoFicha.toFixed(1)}" height="${ficha.ancho.toFixed(1)}" rx="${ficha.radio.toFixed(1)}"/>` +
    `<rect class="cable-ficha-filo" x="${(-ficha.largoFicha * 0.18).toFixed(1)}" y="${(-ficha.ancho / 2).toFixed(1)}" width="${(ficha.largoFicha * 0.26).toFixed(1)}" height="${ficha.ancho.toFixed(1)}" rx="${(ficha.radio * 0.8).toFixed(1)}"/>` +
    `</g>`;
}

// ---- La lluvia del evento 16 ----
//
// "Miró la lluvia por la ventana del fondo. Es su ventana."
//
// Se dibuja por código, sin arte nuevo, y va RECORTADA A LA ABERTURA: la misma
// posición y la misma máscara que las nubes, así que se ve a través de la
// ventana y no sobre la escena. Llover sobre todo el galpón sería llover
// adentro.
//
// Tres bandas de profundidad, mismo criterio que las nubes: cerca es largo,
// opaco y rápido; lejos es corto, tenue, lento y difuso. Todas caen con el mismo
// ángulo, porque la lluvia cae para el mismo lado.
//
// Se llama UNA vez por sesión y no se apaga: el evento dura lo que dura la app
// abierta. A la próxima visita el nodo vuelve a nacer vacío.
let lloviendo = false;

export function llover() {
  if (lloviendo || !contenedorLluvia) return;
  lloviendo = true;

  const gotas = [];

  LLUVIA.bandas.forEach((banda, capa) => {
    // CUÁNTO TIENE QUE VIAJAR ESTA GOTA, en alturas de sí misma. Un porcentaje
    // en `translate` se mide contra la caja del propio elemento, no contra el
    // contenedor, así que el recorrido —el alto de la ventana más el largo de la
    // gota más un margen para que salga de cuadro— hay que convertirlo a las
    // unidades de la gota. Ver el keyframe `caer`.
    const viaje = ((100 + banda.largo + 20) / banda.largo) * 100;

    for (let i = 0; i < banda.lineas; i++) {
      // La posición y el desfase se sortean, pero se sortean UNA vez: una gota
      // que cambia de carril en cada repintado se lee como ruido, no como agua.
      const x = ((i + Math.random()) / banda.lineas) * 100;
      const retardo = Math.random() * banda.ciclo;

      gotas.push(
        `<i class="gota" style="--x:${x.toFixed(2)}%;` +
          `--largo:${banda.largo}%;` +
          `--grosor:${banda.grosor}px;` +
          `--alfa:${banda.alfa};` +
          `--ciclo:${banda.ciclo}ms;` +
          `--retardo:-${retardo.toFixed(0)}ms;` +
          `--desenfoque:${banda.desenfoque}px;` +
          `--viaje:${viaje.toFixed(0)}%;` +
          `--capa:${capa}"></i>`
      );
    }
  });

  contenedorLluvia.innerHTML = gotas.join('');
  contenedorLluvia.classList.add(CLASE_LLOVIENDO);
}

// ---- La nube que pasa una vez ----
//
// Cada tres a seis minutos cruza una sola nube, rápido, y después no está más.
// Es lo que hace que mirar la ventana tenga premio: con cinco bandas girando en
// bucle, a los dos minutos ya viste el cielo entero.
//
// El timer vive acá y no en main.js. Es la misma excepción que el parpadeo, y
// por la misma razón: no es una decisión de estado ni toca el save, es un
// detalle de pintado que nadie más tiene que conocer. main.js sigue siendo el
// único que tiene timers DEL JUEGO.
//
// No aparece de noche. Una nube suelta cruzando rápido contra el cielo nocturno
// se lee como un objeto volando, no como clima.

const entre = (min, max) => min + Math.random() * (max - min);

function pasarUnaNube() {
  if (!contenedorNubes || esDeNocheAhora) return;

  const cruce = Math.round(entre(NUBE_RAPIDA.cruce.min, NUBE_RAPIDA.cruce.max));
  const nodo = crearBanda({ ...NUBE_RAPIDA, ciclo: cruce, fase: Math.round(entre(0, 100)) }, [
    'pasajera'
  ]);

  contenedorNubes.appendChild(nodo);
  // Se saca sola cuando terminó de cruzar. Sin esto quedaría un nodo quieto por
  // cada nube que pasó, y a la hora habría veinte capas paradas encima del
  // cielo.
  nodo.addEventListener('animationend', () => nodo.remove(), { once: true });
}

function programarNubeRapida() {
  clearTimeout(temporizadorNubeRapida);
  temporizadorNubeRapida = setTimeout(() => {
    pasarUnaNube();
    programarNubeRapida();
  }, entre(NUBE_RAPIDA.espera.min, NUBE_RAPIDA.espera.max));
}

let temporizadorNubeRapida = null;
let esDeNocheAhora = false;

programarNubeRapida();

// EL DESTELLO DE LA LUZ DE LA CABEZA. Un golpe blanco de un instante, para las
// dos cosas que Chip registra sin que cambie su estado: una caricia y un objeto
// recogido. No es un estado: es un acuse de recibo.
//
// El timer se guarda para poder cancelarlo: dos destellos encadenados tienen que
// reiniciar el efecto, no dejar que el primero apague al segundo a mitad de
// camino. Es el mismo patrón que la red de contención del parpadeo.
let temporizadorDestelloBulbo = null;

export function destellarBulbo() {
  for (const capa of [bulbo, resplandor]) {
    if (!capa) continue;
    capa.classList.remove(CLASE_DESTELLO_BULBO);
    // Reflow forzado: sin esto, quitar y volver a poner la clase en el mismo
    // frame no reinicia la animación. Es la misma razón que en unParpadeo.
    void capa.offsetWidth;
    capa.classList.add(CLASE_DESTELLO_BULBO);
  }

  clearTimeout(temporizadorDestelloBulbo);
  temporizadorDestelloBulbo = setTimeout(() => {
    for (const capa of [bulbo, resplandor]) capa?.classList.remove(CLASE_DESTELLO_BULBO);
  }, DURACION_DESTELLO_BULBO_MS);
}

// Sale de main.js sólo si el humor efectivamente subió: con el stat saturado la
// acción se aplica igual —jugar gasta batería— pero no hay nada que celebrar, y
// un corazón sin efecto le mentiría al jugador. Mismo criterio que el salto.
export function celebrarHumor() {
  clearTimeout(temporizadorCelebracion);

  const cuantos =
    CORAZONES_EXTRA_MIN +
    Math.round(Math.random() * (CORAZONES_EXTRA_MAX - CORAZONES_EXTRA_MIN));

  [...contenedorCorazonesExtra.children].forEach((nodo, i) => {
    nodo.hidden = i >= cuantos;
  });

  contenedorCorazonesExtra.classList.remove(CLASE_CELEBRANDO);
  void contenedorCorazonesExtra.offsetWidth;
  contenedorCorazonesExtra.classList.add(CLASE_CELEBRANDO);

  temporizadorCelebracion = setTimeout(() => {
    contenedorCorazonesExtra.classList.remove(CLASE_CELEBRANDO);
  }, DURACION_CORAZON_MS + ESPERA_ENTRE_CORAZONES_MS);
}

// El salto es de una sola pasada: la clase se saca al terminar para que la
// próxima acción la pueda volver a poner. El rebote vive en el contenedor y no
// dispara este evento nunca, porque es infinito.
cuerpo.addEventListener('animationend', () => cuerpo.classList.remove(CLASE_SALTO));

// ---- El estado, que aparece al tocar a Chip ----
//
// El juego no muestra barras permanentes: el estado se lee del mundo —la pose,
// el sprite, la pantalla del pecho— y los números están cuando se los pide.
// Este panel es la tapa que se abre.

let temporizadorEstado = null;

function ocultarEstado() {
  clearTimeout(temporizadorEstado);
  temporizadorEstado = null;
  panelEstado.classList.remove(CLASE_PANEL_VISIBLE);

  // `hidden` se pone recién cuando terminó la transición de salida: puesto
  // antes, el panel desaparecería de golpe y no habría nada que animar.
  temporizadorEstado = setTimeout(() => {
    panelEstado.hidden = true;
  }, TRANSICION_PANEL_MS);
}

function mostrarEstado() {
  clearTimeout(temporizadorEstado);
  panelEstado.hidden = false;

  // Forzar reflow entre quitar `hidden` y poner la clase: sin eso el navegador
  // junta las dos mutaciones y no ve ninguna transición que correr. Es el mismo
  // truco que animarAccion, y a propósito no es requestAnimationFrame: rAF no
  // corre en una pestaña de segundo plano, así que el panel podía quedar en
  // opacidad 0 esperando un frame que no llegaba.
  void panelEstado.offsetWidth;
  panelEstado.classList.add(CLASE_PANEL_VISIBLE);

  // Se cierra solo. Nadie tiene que cerrar nada.
  temporizadorEstado = setTimeout(ocultarEstado, DURACION_PANEL_ESTADO_MS);
}

function alternarEstado() {
  if (panelEstado.hidden) mostrarEstado();
  else ocultarEstado();
}

// ---- Acariciar, y el estado que pasó a mantener apretado ----
//
// EL TAP CAMBIÓ DE SIGNIFICADO. Antes abría el panel de números; ahora acaricia.
// El criterio es cuál de los dos gestos se hace más seguido: a Chip se lo toca
// porque está ahí, no para consultar stats. El gesto frecuente se queda con el
// toque más barato y el otro se muda a mantener apretado.
//
// El reparto de responsabilidades: ui.js decide CUÁNDO se puede acariciar —el
// cooldown de la animación y el cansancio son de presentación— y la sesión
// decide SI aplica, que es del modelo. Por eso `onCaricia` devuelve un booleano.

let acariciarChip = () => false;
let temporizadorCaricia = null;
let temporizadorCansancio = null;
let temporizadorMantenido = null;
let ultimaCaricia = 0;
let caricias = [];
let cansado = false;

export function conectarCaricia(onCaricia) {
  acariciarChip = onCaricia;
}

function estaCansado() {
  return cansado;
}

// Se cansa cuando lo tocan muchas veces seguidas. Es la ÚNICA forma de
// molestarlo que tiene el juego, y es graciosa y no punitiva: no baja ningún
// stat, no bloquea las teclas, y se le pasa solo. Lo único que hace es dejar de
// contestar la caricia un rato y poner la cara de fastidio.
function cansarse() {
  cansado = true;
  caricias = [];
  cajaChip.classList.add(CLASE_CANSADO);

  clearTimeout(temporizadorCansancio);
  temporizadorCansancio = setTimeout(() => {
    cansado = false;
    cajaChip.classList.remove(CLASE_CANSADO);
  }, DURACION_CANSANCIO_MS);
}

function unaCaricia() {
  if (estaCansado()) return;

  const ahora = Date.now();

  // La cuenta para cansarse mira TODOS los toques, incluidos los que no llegan
  // a tener animación por el cooldown: lo que cansa es que lo manoseen, no que
  // se vean corazones.
  caricias = caricias.filter((t) => ahora - t < VENTANA_CANSANCIO_MS);
  caricias.push(ahora);

  if (caricias.length > CARICIAS_PARA_CANSARSE) {
    cansarse();
    return;
  }

  // El modelo primero: si el humor está lleno, la caricia no aplica y no hay
  // nada que festejar. Mismo criterio que celebrarHumor — se celebra que el
  // humor SUBIÓ, no que hubo un toque.
  const aplico = acariciarChip();

  // Y el cooldown, que es sólo de la ANIMACIÓN. La caricia ya se registró
  // arriba: lo que se limita es que quince toques en dos segundos apilen quince
  // tandas de corazones.
  if (ahora - ultimaCaricia < COOLDOWN_CARICIA_MS) return;
  ultimaCaricia = ahora;

  // El squash, siempre: es el acuse de recibo del dedo y tiene que estar aunque
  // el humor esté lleno. Si no, tocarlo con el humor en 100 no hace nada y
  // parece que la app se colgó.
  cuerpo.classList.remove(CLASE_CARICIA);
  void cuerpo.offsetWidth;
  cuerpo.classList.add(CLASE_CARICIA);

  clearTimeout(temporizadorCaricia);
  temporizadorCaricia = setTimeout(() => {
    cuerpo.classList.remove(CLASE_CARICIA);
  }, DURACION_CARICIA_MS + 60);

  // Los corazones y el destello de la luz, sólo si la caricia hizo algo.
  if (aplico) {
    celebrarHumor();
    destellarBulbo();
  }
}

// ---- El gesto ----
//
// Un solo par de handlers para las dos cosas: al apretar arranca el reloj del
// mantenido, y al soltar se decide qué fue. Si el reloj llegó a los 500 ms, ya
// abrió el panel y el soltar no hace nada; si no llegó, fue una caricia.
//
// Se usan eventos de PUNTERO y no click: click llega recién al soltar, y el
// anillo de progreso del mantenido tiene que empezar a dibujarse al apretar.

function arrancarGesto(evento) {
  // Sólo el botón principal. Un clic derecho sobre Chip no es una caricia.
  if (evento.button !== undefined && evento.button !== 0) return;

  cajaChip.classList.add(CLASE_MANTENIENDO);

  clearTimeout(temporizadorMantenido);
  temporizadorMantenido = setTimeout(() => {
    temporizadorMantenido = null;
    cajaChip.classList.remove(CLASE_MANTENIENDO);
    mostrarEstado();
  }, ESPERA_MANTENIDO_MS);
}

function soltarGesto() {
  cajaChip.classList.remove(CLASE_MANTENIENDO);

  // Si el timer sigue vivo, el mantenido no llegó: fue una caricia.
  if (temporizadorMantenido) {
    clearTimeout(temporizadorMantenido);
    temporizadorMantenido = null;
    unaCaricia();
  }
}

function cancelarGesto() {
  clearTimeout(temporizadorMantenido);
  temporizadorMantenido = null;
  cajaChip.classList.remove(CLASE_MANTENIENDO);
}

cajaChip.addEventListener('pointerdown', arrancarGesto);
cajaChip.addEventListener('pointerup', soltarGesto);
// Si el dedo se va de Chip antes de soltar, no fue ninguna de las dos cosas.
cajaChip.addEventListener('pointerleave', cancelarGesto);
cajaChip.addEventListener('pointercancel', cancelarGesto);

// EL TECLADO TIENE LOS DOS GESTOS, no uno. Chip es un div con role=button y sin
// esto la caricia sería inaccesible — y el panel de números, que ya era la única
// forma de leer los stats, se perdería del todo.
//
// Enter acaricia y Espacio abre los números. La asimetría es a propósito: Enter
// es "activar" y Espacio es "inspeccionar", que es como se reparten en la
// mayoría de los controles.
cajaChip.addEventListener('keydown', (evento) => {
  if (evento.repeat) return;

  if (evento.key === 'Enter') {
    evento.preventDefault();
    unaCaricia();
    return;
  }

  if (evento.key === ' ') {
    evento.preventDefault();
    if (panelEstado.hidden) mostrarEstado();
    else ocultarEstado();
  }
});

// Tocar afuera cierra. Se escucha en captura para que el toque en un botón de
// acción también cierre, sin que importe el orden de los handlers.
document.addEventListener(
  'click',
  (evento) => {
    if (panelEstado.hidden) return;
    if (cajaChip.contains(evento.target) || panelEstado.contains(evento.target)) return;
    ocultarEstado();
  },
  true
);

// ---- El alféizar como atajo ----
//
// La colección ya no es un overlay propio: vive adentro del menú. El alféizar
// sigue abriéndola, pero entrando por la MISMA puerta y a la misma vista. Una
// sola vista con dos accesos, en vez de dos vistas de lo mismo — que es la
// forma más rápida de que las dos se desincronicen.

let objetosActuales = [];

function irAColeccion() {
  detalleColeccion.replaceChildren();
  abrirColeccion();
}

estante.addEventListener('click', irAColeccion);
estante.addEventListener('keydown', (evento) => {
  if (evento.key !== 'Enter' && evento.key !== ' ') return;
  evento.preventDefault();
  irAColeccion();
});

grillaColeccion.addEventListener('click', (evento) => {
  const nodo = evento.target.closest('.objeto');
  if (!nodo) return;

  const objeto = objetosActuales.find((o) => o.id === nodo.dataset.id);
  if (objeto) mostrarDetalle(objeto);
});

// Acá había un handler de "clic afuera para cerrar la colección". Quedó de
// cuando la colección era un overlay propio, y cuando se MOVIÓ adentro del menú
// se borró ocultarColeccion() pero no el handler que la llamaba.
//
// No era código muerto: era código que tiraba una excepción en cada clic. El
// guard de arriba —`if (panelColeccion.hidden) return`— parecía protegerlo, pero
// mudar el panel al menú lo deja con hidden = false para siempre (ver
// irAColeccion), así que nunca cortaba. Cada toque en el galpón terminaba en un
// ReferenceError en la consola.
//
// No se reemplaza por "clic afuera cierra el menú": el menú nunca tuvo eso, se
// cierra con su ✕ y con Escape, y agregárselo sería una decisión de diseño
// disfrazada de arreglo.

// ---- Los gigantes ----
//
// Se revelan por capas y nunca se vuelven amigos: el máximo del arco es un
// gesto. Por eso la ficha no dice "desbloqueado" ni cuenta días — dice lo que
// Chip sabe, y nada más.

let gigantesActuales = [];

function pintarGigantes(gigantes) {
  grillaGigantes.replaceChildren();

  for (const gigante of gigantes) {
    const revelado = gigante.nombre !== null;
    const nodo = document.createElement('button');
    nodo.type = 'button';
    nodo.className = 'objeto gigante';
    nodo.dataset.id = gigante.id;
    if (revelado) nodo.classList.add(CLASE_OBJETO_OBTENIDO);
    if (gigante.hitoVivido) nodo.classList.add('lo-vio');
    nodo.innerHTML = svgDeGigante(gigante.id, revelado);
    nodo.setAttribute('aria-label', gigante.nombre ?? 'Todavía sin conocer');
    grillaGigantes.appendChild(nodo);
  }
}

function mostrarDetalleGigante(gigante) {
  detalleGigantes.replaceChildren();

  const nombre = document.createElement('strong');
  nombre.textContent = gigante.nombre ?? 'Algo grande, todavía sin nombre';
  detalleGigantes.appendChild(nombre);

  // El detalle y el hito aparecen sólo cuando el arco llegó ahí. Un gigante sin
  // contenido escrito —los tres que esperan la pasada editorial— muestra el
  // nombre y nada más, que es exactamente lo que se sabe de él.
  for (const linea of [gigante.detalle, gigante.hito]) {
    if (!linea) continue;
    const texto = document.createElement('span');
    texto.textContent = linea;
    detalleGigantes.appendChild(texto);
  }
}

grillaGigantes.addEventListener('click', (evento) => {
  const nodo = evento.target.closest('.gigante');
  if (!nodo) return;

  const gigante = gigantesActuales.find((g) => g.id === nodo.dataset.id);
  if (gigante) mostrarDetalleGigante(gigante);
});

export function mostrarGigantes(dias, hitosVistos = []) {
  gigantesActuales = gigantesConEstado(dias, hitosVistos);
  pintarGigantes(gigantesActuales);
  detalleGigantes.replaceChildren();
}

// Se llama una sola vez, al arranque: la colección sólo cambia al volver, igual
// que los eventos. `nuevos` son los de esta visita, los que entran animados.
export function mostrarColeccion(coleccion, nuevos = []) {
  objetosActuales = objetosConEstado(coleccion);
  // La colección cruda viaja hasta el estante porque su ORDEN es el dato: es lo
  // que dice cuáles son las últimas encontradas. objetosConEstado lo pierde.
  pintarEstante(objetosActuales, nuevos, coleccion);
  pintarGrilla(objetosActuales);

  const titulo = document.getElementById('coleccion-titulo');
  titulo.textContent = `Lo que juntó — ${contarObtenidos(objetosActuales)} de ${objetosActuales.length}`;
}

// ---- Lo que quedó tirado en el piso ----
//
// Una pieza sola, apoyada en el piso del galpón, que se levanta tocándola. La
// posición y el id los decide la visita; acá se dibuja y se vuela.
//
// Es la MISMA forma que va en la repisa y en la grilla —`nodoDeObjeto`— y no un
// dibujo aparte: la pieza que levantás del piso tiene que ser reconocible como
// la que después ves en el estante, si no el vuelo no cuenta ninguna historia.

let recogerObjeto = () => false;
let objetoDelPiso = null;

export function conectarPiso(onRecoger) {
  recogerObjeto = onRecoger;
}

export function ponerEnElPiso(piso) {
  nodoPiso.replaceChildren();
  objetoDelPiso = piso;

  if (!piso) {
    nodoPiso.hidden = true;
    return;
  }

  const nodo = nodoDeObjeto({ id: piso.id, obtenido: true });
  nodo.classList.add(CLASE_EN_PISO);
  nodoPiso.appendChild(nodo);

  nodoPiso.style.left = `${piso.x}%`;
  nodoPiso.style.top = `${piso.y}%`;
  nodoPiso.hidden = false;

  // Es un control de verdad, no una decoración: tiene rol, foco y nombre. Sin
  // esto la única forma de levantarlo sería verlo, y hay gente que no lo ve.
  nodoPiso.setAttribute('role', 'button');
  nodoPiso.setAttribute('tabindex', '0');
  nodoPiso.setAttribute('aria-label', `Guardar ${nombreDelObjeto(piso.id)} en la repisa`);
}

function nombreDelObjeto(id) {
  return objetosActuales.find((o) => o.id === id)?.nombre ?? 'lo que quedó tirado';
}

function levantarDelPiso() {
  if (!objetoDelPiso) return;

  const piso = objetoDelPiso;
  // Se apaga ACÁ y no al final del vuelo: entre el toque y el aterrizaje hay
  // 760 ms, y sin esto un segundo toque en el medio dispara todo de nuevo.
  objetoDelPiso = null;
  nodoPiso.removeAttribute('role');
  nodoPiso.removeAttribute('tabindex');

  const desde = nodoPiso.getBoundingClientRect();

  // La sesión decide si aplica. Si dice que no —el id ya no está tirado— la
  // pieza se queda donde estaba y no vuela nada.
  if (!recogerObjeto(piso.id)) return;

  nodoPiso.hidden = true;
  volarAlEstante(piso.id, desde);
}

// EL VUELO. Sale del piso, sube por arriba del estante y baja sobre su lugar.
//
// El destino no se calcula: se MIDE. La pieza ya está en su casillero cuando
// esto corre —recogerObjeto() cambió el estado y main.js repintó el estante— así
// que el lugar exacto es el rect de ese nodo, con la fila, el orden y el
// corrimiento de BASES_OBJETO ya resueltos por el layout. Calcularlo sería
// reimplementar pintarEstante y quedarse desincronizado a la primera.
//
// El nodo que vuela es un TERCERO, ni el del piso ni el del estante: el del piso
// tiene su posición en % de la escena y el del estante vive adentro de un flex,
// y mover cualquiera de los dos a mano rompería su propio layout.
function volarAlEstante(id, desde) {
  const destino = estantes
    .flatMap((fila) => [...fila.children])
    .find((n) => n.dataset.id === id);

  if (!destino) return;

  const caja = escena.getBoundingClientRect();
  const llegada = destino.getBoundingClientRect();

  const ax = desde.left - caja.left + desde.width / 2;
  const ay = desde.top - caja.top + desde.height / 2;
  const bx = llegada.left - caja.left + llegada.width / 2;
  const by = llegada.top - caja.top + llegada.height / 2;

  // La altura del arco se pide como VÉRTICE, no como punto de control: una
  // cuadrática no pasa por su control y pedirlo mal da una diagonal. Ver
  // caminoDeVuelo en formas.js, que trae la medición que lo destapó.
  const camino = caminoDeVuelo(
    { x: ax, y: ay },
    { x: bx, y: by },
    (VUELO_OBJETO.altura / 100) * caja.height
  );

  const volador = nodoDeObjeto({ id, obtenido: true });
  volador.classList.add(CLASE_VOLANDO);
  volador.style.width = `${desde.width}px`;
  volador.style.height = `${desde.height}px`;
  volador.style.setProperty(VARS_PISO.vueloCamino, `path("${camino}")`);

  // El casillero se esconde mientras la pieza viaja. Si no, la misma cosa está
  // en dos lugares a la vez y el vuelo pasa a ser una copia volando.
  destino.style.visibility = 'hidden';
  escena.appendChild(volador);

  const aterrizar = () => {
    volador.remove();
    destino.style.visibility = '';
  };

  volador.addEventListener('animationend', aterrizar, { once: true });
  // Red de contención, igual que en las llegadas al estante: si la animación no
  // termina —pestaña en segundo plano, movimiento reducido— la pieza tiene que
  // aparecer en su casillero igual.
  setTimeout(aterrizar, VUELO_OBJETO.duracion + 250);
}

nodoPiso.addEventListener('click', levantarDelPiso);
nodoPiso.addEventListener('keydown', (evento) => {
  if (evento.key !== 'Enter' && evento.key !== ' ') return;
  evento.preventDefault();
  levantarDelPiso();
});

// ---- El estante y la colección ----
//
// El estante muestra el pool COMPLETO: lo obtenido a color y lo que falta en
// silueta apagada. Una fila incompleta es lo que da ganas de completarla; una
// fila que sólo muestra lo que ya tenés no pide nada.
//
// Vive en el rincón del piso bajo la ventana y no en el estante pintado de la
// panorámica, que está en el extremo derecho de la imagen y nunca entró en
// cuadro — ver el README para la medición.

function nodoDeObjeto(objeto, tag = 'div') {
  const nodo = document.createElement(tag);
  nodo.className = 'objeto';
  nodo.dataset.id = objeto.id;
  if (objeto.obtenido) nodo.classList.add(CLASE_OBJETO_OBTENIDO);
  nodo.innerHTML = svgDeObjeto(objeto.id);
  return nodo;
}

// En la escena van SÓLO LAS PIEZAS ENCONTRADAS.
//
// Antes iban también las siluetas de lo que falta, en gris oscuro. Eso convertía
// la repisa en un marcador de progreso —ocho casilleros, unos llenos y otros
// vacíos— y un marcador es interfaz, no mundo. Un objeto que Chip no encontró
// todavía no está en el galpón: no hay nada que dibujar.
//
// Lo que falta se mira en el menú, que es donde el jugador va a preguntar
// "¿cuánto me queda?". Esa pregunta es de menú; la repisa contesta otra:
// "¿qué encontré?".
// Las piezas se reparten entre las tablas: se llena la de ARRIBA primero y la
// de abajo recibe el sobrante. Al revés —llenar abajo— dejaría la tabla de
// arriba vacía durante toda la primera mitad del juego, y una repisa con un
// estante desierto se lee como que falta algo, no como que hay lugar.
// EL ESTANTE MUESTRA LAS ÚLTIMAS, NO TODAS, y esto es un desvío declarado.
//
// Con ocho piezas entraban todas y la repisa era el inventario. Con treinta y
// seis no entran: en 110 px de tabla, dieciocho por fila dan seis píxeles por
// pieza. La grilla del CSS las achica antes que desbordarlas, así que no se
// rompe nada — se vuelve ilegible, que es peor, porque un inventario ilegible no
// contesta ninguna de las dos preguntas.
//
// Y las dos preguntas ya estaban separadas en el código: la repisa contesta
// "¿qué encontré?" y el menú contesta "¿cuánto me queda?". Mostrar las últimas
// ocho contesta la primera mejor que mostrar las treinta y seis, y la segunda la
// sigue contestando el menú, donde están todas.
//
// El orden es el de HALLAZGO y no el del catálogo: `coleccion` es un array en
// orden de llegada, así que las últimas del array son las últimas encontradas.
// objetosConEstado devuelve orden de catálogo, que para esto no sirve.
function pintarEstante(objetos, nuevos, coleccion = []) {
  for (const fila of estantes) fila.replaceChildren();

  const recienLlegados = new Set(nuevos.map((o) => o.id));
  const llegada = new Map(coleccion.map((id, i) => [id, i]));
  const obtenidos = objetos
    .filter((o) => o.obtenido)
    .sort((a, b) => (llegada.get(a.id) ?? 0) - (llegada.get(b.id) ?? 0))
    .slice(-PIEZAS_POR_ESTANTE * estantes.length);

  const porFila = PIEZAS_POR_ESTANTE;
  let orden = 0;
  let puestos = 0;

  for (const objeto of obtenidos) {
    const nodo = nodoDeObjeto(objeto);
    nodo.style.setProperty('--filo', FILOS_OBJETO[objeto.id] ?? FILO_OBJETO_POR_DEFECTO);

    // CUÁNTO HAY QUE BAJARLA para que su base toque la tabla. Ninguna silueta
    // llega al borde de su viewBox y no todas terminan en el mismo lugar: el
    // hueco va del 10,4% al 20,8%. El corrimiento único del 13% que había era el
    // promedio, y un promedio deja a las dos puntas mal — la arandela hundida y
    // la-cosa flotando dos píxeles.
    const base = BASES_OBJETO[objeto.id] ?? LIENZO_OBJETO;
    nodo.style.setProperty(
      VARS_OBJETO.base,
      `${(((LIENZO_OBJETO - base) / LIENZO_OBJETO) * 100).toFixed(2)}%`
    );
    // Y dónde queda esa línea DENTRO de la caja, que es el pivote de todo lo que
    // escale a esta pieza. Ver transform-origin en .estante .objeto.
    nodo.style.setProperty(
      VARS_OBJETO.apoyo,
      `${((base / LIENZO_OBJETO) * 100).toFixed(2)}%`
    );

    // Los que llegaron en esta visita entran con su animación, escalonados para
    // que tres hallazgos no aparezcan de golpe.
    if (recienLlegados.has(objeto.id)) {
      nodo.classList.add(CLASE_OBJETO_NUEVO);
      const espera = orden * ESPERA_ENTRE_LLEGADAS_MS;
      nodo.style.animationDelay = `${espera}ms`;
      orden++;

      // Red de contención. Mientras dura el escalonado la pieza está en scale(0)
      // por el `backwards`, que es lo correcto —todavía no llegó—, pero si el
      // animationend no llega nunca (pestaña en segundo plano, animación
      // cancelada) quedaría invisible para siempre. Este timer la devuelve a su
      // tamaño pase lo que pase.
      setTimeout(() => {
        nodo.classList.remove(CLASE_OBJETO_NUEVO);
        nodo.style.animationDelay = '';
      }, espera + DURACION_LLEGADA_MS + 200);
    }

    const fila = estantes[Math.min(Math.floor(puestos / porFila), estantes.length - 1)];
    fila.appendChild(nodo);
    puestos++;
  }
}

function contarObtenidos(objetos) {
  return objetos.filter((o) => o.obtenido).length;
}

function pintarGrilla(objetos) {
  grillaColeccion.replaceChildren();

  for (const objeto of objetos) {
    const nodo = nodoDeObjeto(objeto, 'button');
    nodo.type = 'button';
    // El que falta no dice su nombre: la silueta es la pregunta.
    nodo.setAttribute('aria-label', objeto.obtenido ? objeto.nombre : 'Todavía sin encontrar');
    grillaColeccion.appendChild(nodo);
  }
}

// Tocar una pieza cuenta su historia. La línea es la del evento que la trajo:
// el objeto ES la evidencia de que eso pasó.
function mostrarDetalle(objeto) {
  detalleColeccion.replaceChildren();

  const nombre = document.createElement('strong');
  nombre.textContent = objeto.obtenido ? objeto.nombre : 'Todavía no lo encontró';
  detalleColeccion.appendChild(nombre);

  if (objeto.obtenido && objeto.canon) {
    const canon = document.createElement('span');
    canon.textContent = objeto.canon;
    detalleColeccion.appendChild(canon);
  }
}

const barras = {
  bateria: {
    fill: document.getElementById('barra-bateria-fill'),
    valor: document.getElementById('barra-bateria-valor')
  },
  humor: {
    fill: document.getElementById('barra-humor-fill'),
    valor: document.getElementById('barra-humor-valor')
  },
  mantenimiento: {
    fill: document.getElementById('barra-mantenimiento-fill'),
    valor: document.getElementById('barra-mantenimiento-valor')
  }
};

const btnCargar = document.getElementById('btn-cargar');
const btnJugar = document.getElementById('btn-jugar');
const btnLimpiar = document.getElementById('btn-limpiar');

function clampVisual(valor) {
  return Math.min(STAT_MAX, Math.max(STAT_MIN, valor));
}

function dibujarPlaceholder(nombreEstado) {
  const w = canvas.width;
  const h = canvas.height;
  const rectW = w * PLACEHOLDER.proporcion;
  const rectH = h * PLACEHOLDER.proporcion;
  const rectX = (w - rectW) / 2;
  const rectY = (h - rectH) / 2;

  ctx.fillStyle = PLACEHOLDER.colorRelleno;
  ctx.fillRect(rectX, rectY, rectW, rectH);

  ctx.strokeStyle = PLACEHOLDER.colorBorde;
  ctx.lineWidth = PLACEHOLDER.grosorBorde;
  ctx.strokeRect(rectX, rectY, rectW, rectH);

  ctx.fillStyle = PLACEHOLDER.colorTexto;
  ctx.font = PLACEHOLDER.fuente;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(nombreEstado, w / 2, h / 2);
}

// El nombre del estado llega resuelto desde afuera: resolver la cadena es
// calcular, y este módulo pinta lo que le dan.
let claveDibujada = null;

// `ambiental` decide si el cambio se acompaña con squash. Lo resuelve el
// llamador porque depende del ESTADO —de si lo causó el jugador o no— y esto
// sólo sabe de sprites.
function dibujarMascota(claveSprite, ambiental = false) {
  const cambia = claveSprite !== claveDibujada;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const img = obtenerSprite(claveSprite);

  if (img) {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  } else {
    dibujarPlaceholder(claveSprite);
  }

  if (cambia && ambiental && claveDibujada) reiniciarAnimacion(cuerpo, CLASE_CAMBIO);
  claveDibujada = claveSprite;
}

// Sacar, forzar reflow y volver a poner. Sin el reflow el navegador agrupa las
// dos mutaciones, no ve ningún cambio de clase y la animación no se reinicia:
// el mismo truco que usa el salto.
function reiniciarAnimacion(elemento, clase) {
  elemento.classList.remove(clase);
  void elemento.offsetWidth;
  elemento.classList.add(clase);
}

cuerpo.addEventListener('animationend', (e) => {
  if (e.animationName === 'aplastar') cuerpo.classList.remove(CLASE_CAMBIO);
});

// ---- Las acciones ocupan a Chip mientras duran ----
//
// La acción es INSTANTÁNEA para el modelo: acciones.js devuelve el estado nuevo
// y estado.js lo guarda en el acto. Lo que dura es la LECTURA. Por eso todo
// esto vive en ui.js y no toca ni el save ni la cadena — si el jugador cierra la
// app a mitad de una carga, la carga ya está hecha.
//
// NO ES UN COOLDOWN. Mientras Chip carga está cargando, y en el instante en que
// termina vuelve a estar todo disponible: no hay espera después, no hay
// penalización, no hay tiempo bloqueado.

let accionEnCursoUI = null;
let temporizadorFinAccion = null;
let temporizadorEscalon = null;

// Lo que las barras MUESTRAN, que durante una acción no es lo que el estado
// dice. Sin esto, render() —que corre en cada tick— pisaría el escalonado con
// el valor final en el primer repintado.
let valoresMostrados = null;

export function iniciarAccion({ accion, duracion, anterior, siguiente }) {
  clearTimeout(temporizadorFinAccion);
  clearInterval(temporizadorEscalon);

  accionEnCursoUI = accion;

  // La barra sube EN ESCALONES a lo largo de la acción, no de golpe al final.
  // Cada escalón usa la transición de 400 ms que la barra ya tenía, así que se
  // lee como energía que va entrando y no como una barra de progreso de
  // software. Los stats que no cambian se muestran directo.
  valoresMostrados = { ...anterior };
  let escalon = 0;

  temporizadorEscalon = setInterval(() => {
    escalon++;
    const t = Math.min(1, escalon / ESCALONES_ACCION);
    for (const nombre of Object.keys(barras)) {
      valoresMostrados[nombre] = anterior[nombre] + (siguiente[nombre] - anterior[nombre]) * t;
    }
    actualizarBarras(siguiente);
    if (t >= 1) clearInterval(temporizadorEscalon);
  }, duracion / ESCALONES_ACCION);

  // Red de contención, igual que la del parpadeo: si algo interrumpe los
  // escalones —pestaña en segundo plano, timers clampeados— los botones tienen
  // que volver igual. Sin esto, una pestaña oculta dejaría a Chip ocupado para
  // siempre.
  temporizadorFinAccion = setTimeout(() => {
    accionEnCursoUI = null;
    valoresMostrados = null;
    clearInterval(temporizadorEscalon);
    actualizarBarras(siguiente);
  }, duracion + 80);
}

function actualizarBarras(estado) {
  const fuente = valoresMostrados ?? estado;

  for (const nombre of Object.keys(barras)) {
    const valor = clampVisual(fuente[nombre]);
    barras[nombre].fill.style.width = `${valor}%`;
    barras[nombre].valor.textContent = Math.round(valor);
  }

  // Las TRES teclas se apagan, pero por DOS motivos distintos, y la diferencia
  // no es cosmética:
  //
  //   NO HACE FALTA  el stat ya está al máximo. La tecla queda apagada pero
  //                  SIGUE recibiendo el toque (aria-disabled, no disabled),
  //                  porque Chip tiene algo que contestar: "estoy bien". Con
  //                  `disabled` de verdad el click nunca llega y el jugador se
  //                  queda sin respuesta, que es el problema original.
  //   NO PUEDO       jugar sin batería. Eso sí es `disabled`: no hay nada que
  //                  decir y no hay nada que hacer hasta cargarlo.
  //
  // Ninguno de los dos es un cooldown. No hay reloj en ninguna parte de esto.
  // Y hay un TERCER motivo, que es el nuevo: mientras una acción está en curso
  // se apagan las tres, incluida la que se está ejecutando —para que no se pueda
  // re-disparar encima—. Usa el MISMO tratamiento visual que "no hace falta": si
  // el jugador ya aprendió qué quiere decir esa chapa mate, no hay que enseñarle
  // un segundo idioma.
  //
  // Sigue sin haber cooldown. Esto se apaga mientras algo pasa y se prende en el
  // instante en que termina; no hay ninguna espera de por medio.
  const ocupado = accionEnCursoUI !== null;

  apagarSiNoHaceFalta(btnCargar, !ocupado && aplica('cargar', estado));
  apagarSiNoHaceFalta(btnLimpiar, !ocupado && aplica('limpiar', estado));

  btnJugar.disabled = !puedeJugar(estado);
  apagarSiNoHaceFalta(btnJugar, !ocupado && (btnJugar.disabled || aplica('jugar', estado)));
}

function apagarSiNoHaceFalta(boton, hace) {
  boton.setAttribute('aria-disabled', String(!hace));
}

// Se guarda la ruta puesta para no reescribir la propiedad en cada tick y en
// cada acción: el fondo cambia dos veces por día, render() corre todo el tiempo.
let fondoActual = null;

const capaAnterior = document.getElementById('fondo-anterior');

// `cruce` es null cuando no hay que hacer transición, o la duración en ms
// cuando sí. Lo decide main.js: acá se pinta lo que se recibe.
function pintarFondo(franja, esNoche, cruce = null) {
  const ruta = franja.fondo;
  if (ruta === fondoActual) return;

  const saliente = fondoActual;
  fondoActual = ruta;

  // Una sola escritura para las dos capas: el panel nítido y el ambiente
  // difuminado del body leen la misma custom property, así el swap las mueve
  // juntas y no hay forma de que queden en fondos distintos.
  raiz.style.setProperty(VARS_FONDO.actual, `url("${ruta}")`);

  // Las nubes toman el color del momento: blancas al mediodía, doradas al
  // atardecer, casi invisibles de noche.
  const nube = COLORES_NUBE[franja.nombre] ?? COLORES_NUBE.mediodia;
  raiz.style.setProperty(VARS_NUBES.color, nube.color);
  raiz.style.setProperty(VARS_NUBES.alfa, String(nube.alfa));

  // Y el mismo dato como clase, para lo que cambia de ritmo y no de imagen.
  document.body.classList.toggle(CLASE_NOCHE, esNoche);
  // La nube ocasional consulta esto para no salir de noche. Se guarda en vez de
  // leer la clase del body cada vez: es el mismo dato y una sola fuente.
  esDeNocheAhora = esNoche;

  // El crossfade se hace con la panorámica que SE VA, encima de la nueva y
  // desvaneciéndose. Al revés —la nueva apareciendo encima— el galpón se
  // oscurecería un instante en el medio, porque las dos son opacas.
  if (!saliente || !cruce) return;

  raiz.style.setProperty(VARS_CRUCE_FONDO.anterior, `url("${saliente}")`);
  raiz.style.setProperty(VARS_CRUCE_FONDO.duracion, `${cruce}ms`);
  capaAnterior.classList.remove(CLASE_CRUCE_FONDO);
  void capaAnterior.offsetWidth;
  capaAnterior.classList.add(CLASE_CRUCE_FONDO);
}

capaAnterior.addEventListener('animationend', () =>
  capaAnterior.classList.remove(CLASE_CRUCE_FONDO)
);

// Para el fade de apertura: main.js pisa el fondo con el del tramo anterior
// ANTES del primer render, así el primer pintado ya tiene de dónde venir.
export function sembrarFondo(ruta) {
  fondoActual = ruta;
  raiz.style.setProperty(VARS_FONDO.actual, `url("${ruta}")`);
}

// La clase de estado es el único gancho que tienen los efectos de vida: las Z
// del standby y las chispas de la carga se prenden desde el CSS con ella. Sale
// del mismo `estadoVisual` que el sprite, así que no puede haber un efecto
// mostrando algo distinto de lo que muestra Chip.
let claseEstadoActual = null;

// Dos argumentos y no uno, porque son dos cosas distintas: la CLASE sale del
// estado —de ella cuelgan los efectos, que son del estado y no de la pose— y la
// antena sale de la CLAVE DE SPRITE, porque el glow tiene que caer sobre el
// bulbo que está dibujado. Con idle e idle-manitos el estado es el mismo y el
// bulbo se corre 1,7% de ancho y 1,8% de alto: con una sola tabla, el glow
// quedaría flotando al lado de la antena en una de las dos poses.
function pintarClaseEstado(estadoVisual, claveSprite) {
  const clase = PREFIJO_CLASE_ESTADO + estadoVisual;

  if (clase !== claseEstadoActual) {
    if (claseEstadoActual) contenedorMascota.classList.remove(claseEstadoActual);
    contenedorMascota.classList.add(clase);
    claseEstadoActual = clase;
  }

  // El glow sigue a la antena, que no está en el mismo lugar en todos los
  // sprites. Los números viven en config.js —son medidas del arte, como los
  // colores de las barras— y viajan por el puente de siempre en vez de por
  // catorce reglas de CSS.
  const antena = POSICIONES_ANTENA[claveSprite] ?? POSICIONES_ANTENA.idle;
  contenedorMascota.style.setProperty(VARS_ANTENA.x, `${antena.x}%`);
  contenedorMascota.style.setProperty(VARS_ANTENA.y, `${antena.y}%`);

  // Y la sombra al piso, por la misma razón y con la misma forma de tabla: las
  // orugas no apoyan en el borde del lienzo ni en el mismo lugar en todas las
  // poses. Va en #chip y no en el contenedor porque la sombra NO rebota.
  const apoyo = APOYO_ORUGAS[claveSprite] ?? APOYO_ORUGAS.idle;
  cajaChip.style.setProperty(VARS_SOMBRA.y, `${apoyo.y}%`);
  cajaChip.style.setProperty(VARS_SOMBRA.x, `${apoyo.x}%`);
  cajaChip.style.setProperty(VARS_SOMBRA.ancho, `${apoyo.ancho}%`);
}

// ---- La luz del galpón ----
//
// La franja llega calculada desde main.js con el mismo reloj que el fondo y la
// cadena. Acá sólo se pinta: cinco variables que el degradé de la escena lee.
//
// De noche la fuerza va a 0 en vez de sacar la capa: así el degradé no
// desaparece de golpe si algún día se le pone transición.

// Sin cortocircuito por nombre de franja: la luz ahora se INTERPOLA adentro del
// tramo, así que cambia en cada tick aunque el tramo sea el mismo. Comparar por
// nombre la habría dejado clavada en el valor del arranque.
function pintarLuz(luz) {
  if (!luz) {
    raiz.style.setProperty(VARS_LUZ.fuerza, '0');
    return;
  }

  raiz.style.setProperty(VARS_LUZ.x, luz.x);
  raiz.style.setProperty(VARS_LUZ.y, luz.y);
  raiz.style.setProperty(VARS_LUZ.radio, luz.radio);
  raiz.style.setProperty(VARS_LUZ.color, luz.color);
  raiz.style.setProperty(VARS_LUZ.fuerza, String(luz.fuerza));
}

// `esNoche` y `luz` llegan resueltos desde afuera por la misma razón que
// `estadoVisual`: decidir qué hora es se calcula, y este módulo pinta lo que le
// dan.
// `claveSprite` es qué PNG dibujar. Casi siempre coincide con `estadoVisual`;
// la excepción es idle, que tiene dos poses. Llega resuelta desde main.js por la
// regla de siempre: acá se pinta, no se decide.
export function render(estado, estadoVisual, esNoche, luz = null, claveSprite = estadoVisual, franja = null, cruce = null) {
  if (franja) pintarFondo(franja, esNoche, cruce);
  pintarLuz(luz);
  pintarClaseEstado(estadoVisual, claveSprite);
  // Los cambios de acción van en corte seco: ESE corte es el feedback de que la
  // acción respondió. Los ambientales, con squash.
  dibujarMascota(claveSprite, !ESTADOS_DE_ACCION.includes(estadoVisual));
  pintarOrugas(claveSprite);
  pintarCabeza(claveSprite);
  pintarOjos(claveSprite);
  pintarPantalla(estado, claveSprite);
  pintarRayo(claveSprite);
  // El cable se redibuja en cada render y no una sola vez al arrancar: su punto
  // de partida es el conector del pecho, que se mide sobre la caja REAL de
  // #chip, y esa caja cambia con el viewport. Es una cuenta de dos restas y una
  // cúbica — más barato que escuchar el resize.
  dibujarCable();
  actualizarBarras(estado);
}

// Separada de render() a propósito: los eventos se pintan una sola vez, al
// arranque, mientras que render() corre en cada acción y en cada tick.
// Recibe los eventos ya elegidos: acá no se decide cuáles ni cuántos.
//
// Se ve UNO por vez, apoyado sobre el piso del galpón. Si la visita trajo dos,
// el segundo reemplaza al primero: son dos líneas sueltas en el mundo, no una
// lista de notificaciones.
export function mostrarEventos(eventos) {
  lineaEvento.hidden = eventos.length === 0;
  if (eventos.length === 0) return;

  lineaEvento.textContent = eventos[0].texto;

  eventos.slice(1).forEach((evento, i) => {
    setTimeout(() => {
      lineaEvento.textContent = evento.texto;
    }, ESPERA_SEGUNDO_EVENTO_MS * (i + 1));
  });
}

// Salto de feedback, separado de render() por la misma razón que mostrarEventos:
// render() corre en cada tick y esto pasa una sola vez, cuando el jugador toca
// un botón y la acción efectivamente se aplicó. Con prefers-reduced-motion la
// clase se pone igual y no hace nada: quién puede moverse lo decide el CSS.
export function animarAccion() {
  // Las orugas se acomodan junto con el salto: es la misma reacción del cuerpo
  // a haber hecho algo, y separarlas dejaría dos gestos desincronizados.
  acomodarOrugas();
  // Sacar, forzar reflow y volver a poner reinicia la animación cuando la
  // acción se repite antes de que la anterior haya terminado. Sin el reflow el
  // navegador agrupa las dos mutaciones y no ve ningún cambio de clase.
  cuerpo.classList.remove(CLASE_SALTO);
  void cuerpo.offsetWidth;
  cuerpo.classList.add(CLASE_SALTO);
}

export function conectarAcciones({ onCargar, onJugar, onLimpiar }) {
  btnCargar.addEventListener('click', onCargar);
  btnJugar.addEventListener('click', onJugar);
  btnLimpiar.addEventListener('click', onLimpiar);
}
