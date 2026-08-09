// Panel de debug. Se activa con ?debug en la URL y main.js lo carga con import
// dinámico, así que en juego normal este archivo ni se descarga.
//
// Toca el DOM, pero no rompe la regla de que ui.js es su único dueño: crea su
// propio subárbol, lo appendea a document.body y no lee ni modifica ningún
// elemento declarado en index.html. Lo que necesita del juego llega por `api`.

import {
  PANEL_DEBUG,
  MULTIPLICADOR_DEBUG_INICIAL,
  HORAS_DEBUG_INICIAL,
  OPCION_DEBUG_AUTO
} from './config.js';

function crearPanel() {
  const panel = document.createElement('div');
  Object.assign(panel.style, {
    position: 'fixed',
    top: PANEL_DEBUG.margen,
    right: PANEL_DEBUG.margen,
    width: PANEL_DEBUG.ancho,
    padding: PANEL_DEBUG.padding,
    background: PANEL_DEBUG.fondo,
    border: PANEL_DEBUG.borde,
    borderRadius: PANEL_DEBUG.radio,
    color: PANEL_DEBUG.color,
    font: PANEL_DEBUG.fuente,
    zIndex: PANEL_DEBUG.zIndex,
    display: 'flex',
    flexDirection: 'column',
    gap: PANEL_DEBUG.separacion
  });
  return panel;
}

function crearFila() {
  const fila = document.createElement('div');
  Object.assign(fila.style, {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  });
  return fila;
}

function crearEtiqueta(texto) {
  const etiqueta = document.createElement('span');
  etiqueta.textContent = texto;
  Object.assign(etiqueta.style, { color: '#9aa0ab', whiteSpace: 'nowrap' });
  return etiqueta;
}

function crearNumero(valorInicial) {
  const input = document.createElement('input');
  input.type = 'number';
  input.value = String(valorInicial);
  Object.assign(input.style, {
    width: '100%',
    minWidth: '0',
    background: '#1e2129',
    border: '1px solid #2a2d38',
    borderRadius: '4px',
    color: 'inherit',
    font: 'inherit',
    padding: '3px 5px'
  });
  return input;
}

function crearBoton(texto) {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.textContent = texto;
  Object.assign(boton.style, {
    background: '#1e2129',
    border: '1px solid #2a2d38',
    borderRadius: '4px',
    color: 'inherit',
    font: 'inherit',
    padding: '4px 8px',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  });
  return boton;
}

function crearSelect(opciones) {
  const select = document.createElement('select');
  Object.assign(select.style, {
    flex: '1',
    minWidth: '0',
    background: '#1e2129',
    border: '1px solid #2a2d38',
    borderRadius: '4px',
    color: 'inherit',
    font: 'inherit',
    padding: '3px 4px'
  });

  for (const valor of opciones) {
    const opcion = document.createElement('option');
    opcion.value = valor;
    opcion.textContent = valor;
    select.appendChild(opcion);
  }

  return select;
}

export function iniciarDebug(api) {
  const panel = crearPanel();

  // ---- Multiplicador de tiempo ----
  const filaMultiplicador = crearFila();
  const inputMultiplicador = crearNumero(MULTIPLICADOR_DEBUG_INICIAL);
  filaMultiplicador.append(crearEtiqueta('multiplicador'), inputMultiplicador);

  // ---- Simular horas ----
  const filaHoras = crearFila();
  const inputHoras = crearNumero(HORAS_DEBUG_INICIAL);
  const botonSimular = crearBoton('simular h');
  botonSimular.addEventListener('click', () => {
    const horas = Number(inputHoras.value) || 0;
    const multiplicador = Number(inputMultiplicador.value) || 1;
    api.simularHoras(horas, multiplicador);
    refrescarStats();
  });
  filaHoras.append(inputHoras, botonSimular);

  // ---- Forzar estado visual ----
  const filaVisual = crearFila();
  const selectVisual = crearSelect([OPCION_DEBUG_AUTO, ...api.obtenerNombresVisuales()]);
  selectVisual.addEventListener('change', () => {
    const elegido = selectVisual.value;
    api.forzarEstadoVisual(elegido === OPCION_DEBUG_AUTO ? null : elegido);
  });
  filaVisual.append(crearEtiqueta('visual'), selectVisual);

  // ---- Reiniciar partida ----
  const botonReiniciar = crearBoton('reiniciar partida');
  botonReiniciar.addEventListener('click', () => {
    api.reiniciarSave();
    selectVisual.value = OPCION_DEBUG_AUTO;
    refrescarStats();
  });

  // ---- Lectura de stats ----
  const stats = document.createElement('div');
  Object.assign(stats.style, {
    color: '#9aa0ab',
    fontFamily: 'ui-monospace, monospace',
    fontSize: '11px',
    whiteSpace: 'pre'
  });

  function refrescarStats() {
    const e = api.obtenerEstado();
    stats.textContent = [
      `bat  ${e.bateria.toFixed(2)}`,
      `hum  ${e.humor.toFixed(2)}`,
      `mant ${e.mantenimiento.toFixed(2)}`
    ].join('\n');
  }

  refrescarStats();

  panel.append(filaMultiplicador, filaHoras, filaVisual, botonReiniciar, stats);
  document.body.appendChild(panel);
}
