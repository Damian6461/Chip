// El montaje: todo lo que ui.js hacía UNA SOLA VEZ al importarse.
//
// Eran 310 de sus 779 líneas de código —el 40%— y no eran pintado: eran los
// veinte getElementById, el puente de custom properties y los tres SVG del
// mobiliario, que se dibujan una vez y no cambian nunca. Estaban ahí porque
// tenían que correr antes que todo lo demás, no porque pertenecieran al módulo
// que pinta.
//
// Sacarlas tiene un beneficio concreto y uno más chico:
//
// - El puente config -> CSS pasó a ser una función pura en tema.js, y por lo
//   tanto probable. Ver tests/tema.test.js.
// - ui.js queda con lo que hace cuando alguien lo llama, que es lo que dice su
//   nombre.
//
// Lo que NO se movió acá, a propósito: el cableado de listeners del menú y del
// alféizar. Eso también corre al importar, pero engancha funciones de ui.js
// —abrirMenu, cerrarMenu, irAColeccion—, así que traerlo daría una dependencia
// circular a cambio de nada. Montaje es "dejar el galpón puesto", no "conectar
// los botones".
//
// Este módulo SÍ toca el DOM al importarse. La regla de arquitectura no cambia:
// sigue habiendo un solo lugar donde se toca el DOM del juego, ahora son dos
// archivos del mismo módulo y ninguno de los dos es importable desde Node. Lo
// que sí es importable —y es lo que se gana— es tema.js.

import { VERSION_JUEGO } from './config.js';
import { variablesDeTema } from './tema.js';
import { svgDeToma, svgDeRepisa, svgDePanel } from './formas.js';

// ---- Los nodos ----

export const raiz = document.documentElement;

export const cajaChip = document.getElementById('chip');
export const contenedorMascota = document.getElementById('contenedor-mascota');
export const capaOjos = document.getElementById('ojos');
export const capaParpado = document.getElementById('parpado');
export const contenedorCorazones = document.getElementById('corazones');
export const contenedorDestellos = document.getElementById('destellos');
export const contenedorCorazonesExtra = document.getElementById('corazones-extra');
export const panelEstado = document.getElementById('estado');
export const lineaEvento = document.getElementById('evento');
export const estante = document.getElementById('estante');
export const panelColeccion = document.getElementById('coleccion');
export const grillaColeccion = document.getElementById('coleccion-grilla');
export const detalleColeccion = document.getElementById('coleccion-detalle');
export const grillaGigantes = document.getElementById('gigantes-grilla');
export const detalleGigantes = document.getElementById('gigantes-detalle');
export const canvas = document.getElementById('canvas-mascota');
export const toma = document.getElementById('toma');
export const repisa = document.getElementById('repisa');
export const menuBoton = document.getElementById('menu-boton');
export const menu = document.getElementById('menu');

// El salto va en #cuerpo y no en el canvas: es el envoltorio que contiene TODAS
// las capas de Chip, así que saltan juntas. Ver el bloque del rebote en
// style.css.
export const cuerpo = document.getElementById('cuerpo');

export const solapas = menu ? [...menu.querySelectorAll('#menu-solapas button')] : [];
export const secciones = menu ? [...menu.querySelectorAll('.menu-seccion')] : [];

export const ctx = canvas.getContext('2d');

// Los sprites son pixel art. El canvas mide 256x256, exactamente lo que miden
// ellos, así que acá adentro no hay escalado: se dibuja 1 a 1 y el CSS lleva el
// canvas al tamaño que tenga la escena. El flag se deja igual, porque es la
// garantía de que si algún día el canvas y el sprite dejan de coincidir, el
// resultado sea nítido y no borroso. El escalado a pantalla lo resuelve
// `image-rendering: pixelated` en style.css.
//
// Se setea una sola vez, acá: es estado del contexto, no un parámetro de
// drawImage, y sobrevive a clearRect. Lo único que lo resetea a `true` es
// cambiar el tamaño del canvas.
ctx.imageSmoothingEnabled = false;

// ---- El puente ----
//
// Las variables se escriben TODAS, sin mirar si el nodo que las va a usar
// existe. Antes las de la toma y las de la repisa iban adentro de su `if`, y no
// hacía falta: una custom property de más en :root que nadie lee no hace nada, y
// atarlas a la presencia del nodo mezclaba dos cosas distintas —qué vale el tema
// y qué hay dibujado— en la misma condición.

for (const [nombre, valor] of Object.entries(variablesDeTema())) {
  raiz.style.setProperty(nombre, valor);
}

// ---- El mobiliario ----
//
// La toma y la repisa son mobiliario del galpón, no accesorios de un estado: se
// dibujan una vez, están en todos los estados, y lo único que les cambia es el
// brillo. El botón del menú es lo mismo del lado de la interfaz.

if (toma) toma.innerHTML = svgDeToma();
if (repisa) repisa.innerHTML = svgDeRepisa();
if (menuBoton) menuBoton.innerHTML = svgDePanel();

// ---- La mudanza de la colección ----
//
// La vista de colección se MUEVE adentro del menú, tal cual está. Es el MISMO
// nodo que llena mostrarColeccion: no hay una copia que mantener. Rehacerla
// habría creado una segunda vista de lo mismo, que es la forma más rápida de que
// las dos se separen.

if (menu) {
  document.getElementById('menu-coleccion').appendChild(panelColeccion);
  panelColeccion.hidden = false;

  document.querySelector('.acerca-version').textContent = `Versión ${VERSION_JUEGO}`;
}
