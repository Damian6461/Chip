// Único módulo que toca el DOM.

import {
  STAT_MIN,
  STAT_MAX,
  PLACEHOLDER,
  CICLO_REBOTE_MS,
  DURACION_SALTO_MS,
  TRANSICION_BARRA_MS,
  DURACION_PRESION_MS,
  VARS_ANIMACION,
  CLASE_SALTO,
  RUTAS_FONDOS,
  FONDO_CORRIMIENTO,
  VARS_FONDO,
  CLASE_NOCHE,
  DURACION_PANEL_ESTADO_MS,
  TRANSICION_PANEL_MS,
  CLASE_PANEL_VISIBLE,
  ESPERA_SEGUNDO_EVENTO_MS,
  DURACION_LLEGADA_MS,
  ESPERA_ENTRE_LLEGADAS_MS,
  CLASE_OBJETO_NUEVO,
  CLASE_OBJETO_OBTENIDO,
  RUTAS_OJOS,
  ORIGEN_PARPADEO,
  DURACION_PARPADEO_MS,
  PARPADEO_INTERVALO_MIN_MS,
  PARPADEO_INTERVALO_MAX_MS,
  PROBABILIDAD_DOBLE_PARPADEO,
  ESPERA_DOBLE_PARPADEO_MS,
  CLASE_PARPADEO,
  COLOR_PARPADO,
  GRUPOS_DE_COLOR,
  CORAZONES_FELIZ,
  DESTELLOS_FELIZ,
  RAYITAS_JUGANDO,
  ARCOS_CARGANDO,
  CHISPAS_CARGANDO,
  BURBUJAS_LIMPIANDO,
  DURACION_CORAZON_MS,
  ESPERA_ENTRE_CORAZONES_MS,
  DURACION_DESTELLO_MS,
  DURACION_RAYITA_MS,
  DURACION_ARCO_MS,
  DURACION_BURBUJA_MS,
  CORAZONES_EXTRA_MIN,
  CORAZONES_EXTRA_MAX,
  CLASE_CELEBRANDO,
  VARS_PERSONAJE,
  POSICIONES_ANTENA,
  VARS_ANTENA,
  VARS_LUZ,
  COLORES_BARRAS,
  VARS_BARRAS,
  PREFIJO_CLASE_ESTADO,
  CICLO_ANTENA_MS,
  CICLO_ANTENA_NOCHE_MS,
  CICLO_ZETA_MS,
  CICLO_CHISPA_MS,
  CICLOS_POLVO_MS,
  VARS_EFECTOS
} from './config.js';
import { puedeJugar } from './acciones.js';
import { obtenerSprite } from './sprites.js';
import { objetosConEstado } from './coleccion.js';
import { gigantesConEstado } from './gigantes.js';
import {
  svgDeObjeto,
  svgDeGigante,
  svgDeCorazon,
  svgDeChispa,
  svgDeArco,
  svgDeBurbuja
} from './formas.js';

const cajaChip = document.getElementById('chip');
const contenedorMascota = document.getElementById('contenedor-mascota');
const capaOjos = document.getElementById('ojos');
const capaParpado = document.getElementById('parpado');
const contenedorCorazones = document.getElementById('corazones');
const contenedorDestellos = document.getElementById('destellos');
const contenedorCorazonesExtra = document.getElementById('corazones-extra');
const panelEstado = document.getElementById('estado');
const lineaEvento = document.getElementById('evento');
const estante = document.getElementById('estante');
const panelColeccion = document.getElementById('coleccion');
const grillaColeccion = document.getElementById('coleccion-grilla');
const detalleColeccion = document.getElementById('coleccion-detalle');
const grillaGigantes = document.getElementById('gigantes-grilla');
const detalleGigantes = document.getElementById('gigantes-detalle');
const canvas = document.getElementById('canvas-mascota');
const ctx = canvas.getContext('2d');

// Los sprites son pixel art. El canvas ahora mide 256x256, exactamente lo que
// miden ellos, así que acá adentro no hay escalado: se dibuja 1 a 1 y el CSS
// lleva el canvas al tamaño que tenga la escena. El flag se deja igual, porque
// es la garantía de que si algún día el canvas y el sprite dejan de coincidir,
// el resultado sea nítido y no borroso. El escalado a pantalla lo resuelve
// `image-rendering: pixelated` en style.css.
//
// Se setea una sola vez, acá: es estado del contexto, no un parámetro de
// drawImage, y sobrevive a clearRect. Lo único que lo resetea a `true` es
// cambiar el tamaño del canvas.
ctx.imageSmoothingEnabled = false;

// Las duraciones de las animaciones viven en config.js y se usan en style.css,
// que no puede importar un módulo. El puente son estas custom properties: se
// escriben una sola vez, acá, y la hoja las lee con var(). Duplicar los números
// en el CSS sería un carve-out más de la regla de config.js, y este no hace
// falta.
const raiz = document.documentElement;
raiz.style.setProperty(VARS_ANIMACION.cicloRebote, `${CICLO_REBOTE_MS}ms`);
raiz.style.setProperty(VARS_ANIMACION.duracionSalto, `${DURACION_SALTO_MS}ms`);
raiz.style.setProperty(VARS_ANIMACION.transicionBarra, `${TRANSICION_BARRA_MS}ms`);
raiz.style.setProperty(VARS_ANIMACION.duracionPresion, `${DURACION_PRESION_MS}ms`);
raiz.style.setProperty(VARS_ANIMACION.transicionPanel, `${TRANSICION_PANEL_MS}ms`);
raiz.style.setProperty(VARS_ANIMACION.duracionLlegada, `${DURACION_LLEGADA_MS}ms`);

// El encuadre de la escena: cuánto hay que correr la panorámica para entrar 8%
// en ella. Es un número sin unidad porque el CSS lo multiplica por el alto de
// la escena — así el mismo encuadre vale en cualquier pantalla.
raiz.style.setProperty(VARS_FONDO.corrimiento, String(FONDO_CORRIMIENTO));

// Los colores de las barras viajan por el mismo puente. Salen del sprite de
// Chip (ver COLORES_BARRAS): la piel del instrumento la define el personaje.
for (const [stat, variable] of Object.entries(VARS_BARRAS)) {
  raiz.style.setProperty(variable, COLORES_BARRAS[stat]);
}

// Y los ciclos de los efectos de vida, por el mismo puente otra vez.
raiz.style.setProperty(VARS_EFECTOS.cicloAntena, `${CICLO_ANTENA_MS}ms`);
raiz.style.setProperty(VARS_EFECTOS.cicloAntenaNoche, `${CICLO_ANTENA_NOCHE_MS}ms`);
raiz.style.setProperty(VARS_EFECTOS.cicloZeta, `${CICLO_ZETA_MS}ms`);
raiz.style.setProperty(VARS_EFECTOS.cicloChispa, `${CICLO_CHISPA_MS}ms`);
VARS_EFECTOS.ciclosPolvo.forEach((variable, i) => {
  raiz.style.setProperty(variable, `${CICLOS_POLVO_MS[i]}ms`);
});

// Y lo del personaje: el pivote del parpadeo, sus tiempos, y los dos colores
// que salieron muestreados del sprite viejo de feliz.
raiz.style.setProperty(VARS_PERSONAJE.origenParpadeo, ORIGEN_PARPADEO);
raiz.style.setProperty(VARS_PERSONAJE.duracionParpadeo, `${DURACION_PARPADEO_MS}ms`);
raiz.style.setProperty(VARS_PERSONAJE.colorParpado, COLOR_PARPADO);
raiz.style.setProperty(VARS_PERSONAJE.duracionCorazon, `${DURACION_CORAZON_MS}ms`);
raiz.style.setProperty(VARS_PERSONAJE.duracionDestello, `${DURACION_DESTELLO_MS}ms`);
raiz.style.setProperty(VARS_PERSONAJE.duracionRayita, `${DURACION_RAYITA_MS}ms`);
raiz.style.setProperty(VARS_PERSONAJE.duracionArco, `${DURACION_ARCO_MS}ms`);
raiz.style.setProperty(VARS_PERSONAJE.duracionBurbuja, `${DURACION_BURBUJA_MS}ms`);

// Las paletas de los efectos, por convención de nombre: --<grupo>-<tono>.
for (const [grupo, tonos] of Object.entries(GRUPOS_DE_COLOR)) {
  for (const [tono, valor] of Object.entries(tonos)) {
    raiz.style.setProperty(`--${grupo}-${tono}`, valor);
  }
}

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

function unParpadeo() {
  // Sacar, forzar reflow y volver a poner: reinicia la animación aunque el
  // parpadeo anterior no haya terminado. Mismo truco que el salto.
  capaOjos.classList.remove(CLASE_PARPADEO);
  void capaOjos.offsetWidth;
  capaOjos.classList.add(CLASE_PARPADEO);
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

function pararParpadeo() {
  clearTimeout(temporizadorParpadeo);
  temporizadorParpadeo = null;
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
armarEfecto(document.getElementById('arcos'), ARCOS_CARGANDO, 'arco', svgDeArco);
armarEfecto(document.getElementById('burbujas'), BURBUJAS_LIMPIANDO, 'burbuja', svgDeBurbuja);

let temporizadorCelebracion = null;

// La tanda que dispara una acción que sube el humor. Es el momento en que la
// mecánica y la emoción coinciden, y hasta ahora no tenía expresión visual.
//
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
canvas.addEventListener('animationend', () => canvas.classList.remove(CLASE_SALTO));

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

cajaChip.addEventListener('click', alternarEstado);

// Chip es un div con role=button: sin esto, con teclado no habría manera de ver
// los números, que es la única forma de leerlos que queda en el juego.
cajaChip.addEventListener('keydown', (evento) => {
  if (evento.key !== 'Enter' && evento.key !== ' ') return;
  evento.preventDefault();
  alternarEstado();
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

// ---- Abrir y cerrar la colección ----
//
// Mismo mecanismo que el panel de estado, con una diferencia: esta NO se cierra
// sola. Mirar la colección es una visita, no un vistazo — se sale cuando se
// terminó de mirar.

let objetosActuales = [];

function ocultarColeccion() {
  panelColeccion.classList.remove(CLASE_PANEL_VISIBLE);
  setTimeout(() => {
    panelColeccion.hidden = true;
  }, TRANSICION_PANEL_MS);
}

function mostrarPanelColeccion() {
  panelColeccion.hidden = false;
  detalleColeccion.replaceChildren();
  void panelColeccion.offsetWidth; // el mismo reflow que el panel de estado
  panelColeccion.classList.add(CLASE_PANEL_VISIBLE);
}

function alternarColeccion() {
  if (panelColeccion.hidden) mostrarPanelColeccion();
  else ocultarColeccion();
}

estante.addEventListener('click', alternarColeccion);
estante.addEventListener('keydown', (evento) => {
  if (evento.key !== 'Enter' && evento.key !== ' ') return;
  evento.preventDefault();
  alternarColeccion();
});

grillaColeccion.addEventListener('click', (evento) => {
  const nodo = evento.target.closest('.objeto');
  if (!nodo) return;

  const objeto = objetosActuales.find((o) => o.id === nodo.dataset.id);
  if (objeto) mostrarDetalle(objeto);
});

document.addEventListener(
  'click',
  (evento) => {
    if (panelColeccion.hidden) return;
    if (estante.contains(evento.target) || panelColeccion.contains(evento.target)) return;
    ocultarColeccion();
  },
  true
);

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
  pintarEstante(objetosActuales, nuevos);
  pintarGrilla(objetosActuales);

  const titulo = document.getElementById('coleccion-titulo');
  titulo.textContent = `Lo que juntó — ${contarObtenidos(objetosActuales)} de ${objetosActuales.length}`;
}

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

function pintarEstante(objetos, nuevos) {
  estante.replaceChildren();

  const recienLlegados = new Set(nuevos.map((o) => o.id));
  let orden = 0;

  for (const objeto of objetos) {
    const nodo = nodoDeObjeto(objeto);

    // Los que llegaron en esta visita entran con su animación, escalonados para
    // que tres hallazgos no aparezcan de golpe.
    if (recienLlegados.has(objeto.id)) {
      nodo.classList.add(CLASE_OBJETO_NUEVO);
      nodo.style.animationDelay = `${orden * ESPERA_ENTRE_LLEGADAS_MS}ms`;
      orden++;
    }

    estante.appendChild(nodo);
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
function dibujarMascota(estadoVisual) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const img = obtenerSprite(estadoVisual);

  if (img) {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  } else {
    dibujarPlaceholder(estadoVisual);
  }
}

function actualizarBarras(estado) {
  for (const nombre of Object.keys(barras)) {
    const valor = clampVisual(estado[nombre]);
    barras[nombre].fill.style.width = `${valor}%`;
    barras[nombre].valor.textContent = Math.round(valor);
  }

  btnJugar.disabled = !puedeJugar(estado);
}

// Se guarda la ruta puesta para no reescribir la propiedad en cada tick y en
// cada acción: el fondo cambia dos veces por día, render() corre todo el tiempo.
let fondoActual = null;

function pintarFondo(esNoche) {
  const ruta = esNoche ? RUTAS_FONDOS.noche : RUTAS_FONDOS.dia;
  if (ruta === fondoActual) return;

  fondoActual = ruta;

  // Una sola escritura para las dos capas: el panel nítido y el ambiente
  // difuminado del body leen la misma custom property, así el swap de las 23:00
  // las mueve juntas y no hay forma de que queden en fondos distintos.
  raiz.style.setProperty(VARS_FONDO.actual, `url("${ruta}")`);

  // Y el mismo dato como clase, para lo que cambia de ritmo y no de imagen.
  document.body.classList.toggle(CLASE_NOCHE, esNoche);
}

// La clase de estado es el único gancho que tienen los efectos de vida: las Z
// del standby y las chispas de la carga se prenden desde el CSS con ella. Sale
// del mismo `estadoVisual` que el sprite, así que no puede haber un efecto
// mostrando algo distinto de lo que muestra Chip.
let claseEstadoActual = null;

function pintarClaseEstado(estadoVisual) {
  const clase = PREFIJO_CLASE_ESTADO + estadoVisual;
  if (clase === claseEstadoActual) return;

  if (claseEstadoActual) contenedorMascota.classList.remove(claseEstadoActual);
  contenedorMascota.classList.add(clase);
  claseEstadoActual = clase;

  // El glow sigue a la antena, que no está en el mismo lugar en todos los
  // sprites. Los números viven en config.js —son medidas del arte, como los
  // colores de las barras— y viajan por el puente de siempre en vez de por
  // catorce reglas de CSS.
  const antena = POSICIONES_ANTENA[estadoVisual] ?? POSICIONES_ANTENA.idle;
  contenedorMascota.style.setProperty(VARS_ANTENA.x, `${antena.x}%`);
  contenedorMascota.style.setProperty(VARS_ANTENA.y, `${antena.y}%`);
}

// ---- La luz del galpón ----
//
// La franja llega calculada desde main.js con el mismo reloj que el fondo y la
// cadena. Acá sólo se pinta: cinco variables que el degradé de la escena lee.
//
// De noche la fuerza va a 0 en vez de sacar la capa: así el degradé no
// desaparece de golpe si algún día se le pone transición.
let franjaActual = null;

function pintarLuz(franja) {
  const nombre = franja?.nombre ?? null;
  if (nombre === franjaActual) return;
  franjaActual = nombre;

  if (!franja) {
    raiz.style.setProperty(VARS_LUZ.fuerza, '0');
    return;
  }

  raiz.style.setProperty(VARS_LUZ.x, franja.x);
  raiz.style.setProperty(VARS_LUZ.y, franja.y);
  raiz.style.setProperty(VARS_LUZ.radio, franja.radio);
  raiz.style.setProperty(VARS_LUZ.color, franja.color);
  raiz.style.setProperty(VARS_LUZ.fuerza, String(franja.fuerza));
}

// `esNoche` y `luz` llegan resueltos desde afuera por la misma razón que
// `estadoVisual`: decidir qué hora es se calcula, y este módulo pinta lo que le
// dan.
export function render(estado, estadoVisual, esNoche, luz = null) {
  pintarFondo(esNoche);
  pintarLuz(luz);
  pintarClaseEstado(estadoVisual);
  dibujarMascota(estadoVisual);
  pintarOjos(estadoVisual);
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
  // Sacar, forzar reflow y volver a poner reinicia la animación cuando la
  // acción se repite antes de que la anterior haya terminado. Sin el reflow el
  // navegador agrupa las dos mutaciones y no ve ningún cambio de clase.
  canvas.classList.remove(CLASE_SALTO);
  void canvas.offsetWidth;
  canvas.classList.add(CLASE_SALTO);
}

export function conectarAcciones({ onCargar, onJugar, onLimpiar }) {
  btnCargar.addEventListener('click', onCargar);
  btnJugar.addEventListener('click', onJugar);
  btnLimpiar.addEventListener('click', onLimpiar);
}
