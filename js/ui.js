// Único módulo que toca el DOM.

import {
  STAT_MIN,
  STAT_MAX,
  PLACEHOLDER,
  CICLO_REBOTE_MS,
  DURACION_SALTO_MS,
  TRANSICION_BARRA_MS,
  VARS_ANIMACION,
  CLASE_SALTO,
  RUTAS_FONDOS,
  FONDO_POSICION_X,
  COLORES_BARRAS,
  VARS_BARRAS
} from './config.js';
import { puedeJugar } from './acciones.js';
import { obtenerSprite } from './sprites.js';

const panelJuego = document.getElementById('panel-juego');
const canvas = document.getElementById('canvas-mascota');
const ctx = canvas.getContext('2d');

// Los sprites son pixel art y el canvas los escala: con el suavizado bilineal
// que el navegador trae por defecto, salen borrosos.
//
// Se setea una sola vez, acá: es estado del contexto, no un parámetro de
// drawImage, y sobrevive a clearRect. Lo único que lo resetea a `true` es
// cambiar el tamaño del canvas — hoy nadie lo cambia, está fijo en index.html.
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

// Los colores de las barras viajan por el mismo puente. Salen del sprite de
// Chip (ver COLORES_BARRAS): la piel del instrumento la define el personaje.
for (const [stat, variable] of Object.entries(VARS_BARRAS)) {
  raiz.style.setProperty(variable, COLORES_BARRAS[stat]);
}

// El salto es de una sola pasada: la clase se saca al terminar para que la
// próxima acción la pueda volver a poner. El rebote vive en el contenedor y no
// dispara este evento nunca, porque es infinito.
canvas.addEventListener('animationend', () => canvas.classList.remove(CLASE_SALTO));

// El encuadre del fondo es fijo y se escribe una sola vez. La imagen sí cambia,
// pero el recorte validado es el mismo de día y de noche.
panelJuego.style.backgroundPositionX = FONDO_POSICION_X;

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

const contenedorEventos = document.getElementById('eventos');

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
  panelJuego.style.backgroundImage = `url("${ruta}")`;
}

// `esNoche` llega resuelto desde afuera por la misma razón que `estadoVisual`:
// decidir qué hora es se calcula, y este módulo pinta lo que le dan.
export function render(estado, estadoVisual, esNoche) {
  pintarFondo(esNoche);
  dibujarMascota(estadoVisual);
  actualizarBarras(estado);
}

// Separada de render() a propósito: los eventos se pintan una sola vez, al
// arranque, mientras que render() corre en cada acción y en cada tick.
// Recibe los eventos ya elegidos: acá no se decide cuáles ni cuántos.
export function mostrarEventos(eventos) {
  contenedorEventos.replaceChildren();
  contenedorEventos.hidden = eventos.length === 0;

  for (const evento of eventos) {
    const parrafo = document.createElement('p');
    parrafo.className = 'evento';
    parrafo.textContent = evento.texto;
    contenedorEventos.appendChild(parrafo);
  }
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
