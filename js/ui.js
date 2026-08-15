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

const cajaChip = document.getElementById('chip');
const contenedorMascota = document.getElementById('contenedor-mascota');
const panelEstado = document.getElementById('estado');
const lineaEvento = document.getElementById('evento');
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
}

// `esNoche` llega resuelto desde afuera por la misma razón que `estadoVisual`:
// decidir qué hora es se calcula, y este módulo pinta lo que le dan.
export function render(estado, estadoVisual, esNoche) {
  pintarFondo(esNoche);
  pintarClaseEstado(estadoVisual);
  dibujarMascota(estadoVisual);
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
