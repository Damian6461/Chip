// Orquestador: mantiene el estado vivo y conecta los módulos entre sí.

import { MS_POR_HORA } from './config.js';
import { cargarEstado, guardarEstado } from './estado.js';
import { aplicarDecay } from './decay.js';
import { cargar, jugar, limpiar } from './acciones.js';
import { cargarSprites } from './sprites.js';
import { render as renderUI, conectarAcciones } from './ui.js';

let estado = cargarEstado();

function render() {
  renderUI(estado);
}

// Si la acción devuelve el mismo estado, no aplicó (ej: jugar sin batería):
// no se guarda ni se redibuja.
function ejecutar(accion) {
  const siguiente = accion(estado);
  if (siguiente === estado) return;

  estado = siguiente;
  guardarEstado(estado);
  render();
}

// ---- Arranque ----

estado = aplicarDecay(estado);
guardarEstado(estado);

conectarAcciones({
  onCargar: () => ejecutar(cargar),
  onJugar: () => ejecutar(jugar),
  onLimpiar: () => ejecutar(limpiar)
});

cargarSprites().then(render);
render();

// ---- Punto de enganche: sistema de eventos ----
// import { iniciarEventos } from './eventos.js';
// iniciarEventos(...);

// ---- Punto de enganche: service worker ----
// if ('serviceWorker' in navigator) {
//   navigator.serviceWorker.register('...');
// }

// ---- Modo debug ----
// Sin botones: se usa desde la consola del navegador.
// window.chipDebug.multiplier escala cuántas horas simuladas representa cada
// llamada a simulateHours(), para poder probar el decay sin esperar horas reales.
window.chipDebug = {
  multiplier: 1,
  simulateHours(horas) {
    const retrocedido = {
      ...estado,
      ultimaVisita: estado.ultimaVisita - horas * this.multiplier * MS_POR_HORA
    };
    estado = aplicarDecay(retrocedido);
    guardarEstado(estado);
    render();
  },
  getEstado() {
    return estado;
  }
};
