// Único módulo que toca el DOM.

import { STAT_MIN, STAT_MAX, PLACEHOLDER } from './config.js';
import { puedeJugar } from './acciones.js';
import { resolverEstadoVisual, obtenerSprite } from './sprites.js';

const canvas = document.getElementById('canvas-mascota');
const ctx = canvas.getContext('2d');

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

function dibujarMascota(estado) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const nombreEstado = resolverEstadoVisual(estado);
  const img = obtenerSprite(nombreEstado);

  if (img) {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  } else {
    dibujarPlaceholder(nombreEstado);
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

export function render(estado) {
  dibujarMascota(estado);
  actualizarBarras(estado);
}

export function conectarAcciones({ onCargar, onJugar, onLimpiar }) {
  btnCargar.addEventListener('click', onCargar);
  btnJugar.addEventListener('click', onJugar);
  btnLimpiar.addEventListener('click', onLimpiar);
}
