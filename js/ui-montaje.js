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

import { VERSION_JUEGO, BANDAS_NUBES, VARS_NUBES, ESTANTES, VARS_REPISA } from './config.js';
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
// Las dos capas de la luz de la cabeza. El bulbo TAPA al pintado en el sprite;
// el resplandor es lo que esa fuente derrama sobre el casco.
export const bulbo = document.getElementById('antena');
export const resplandor = document.getElementById('resplandor');

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

// LA REPISA, ahora de DOS tablas. La segunda no está en el HTML: se clona acá
// desde ESTANTES, para que pasar a tres estantes sea cambiar un número.
//
// Cada tabla lleva su índice en --repisa-nivel y el CSS la baja
// nivel * --repisa-separacion. Escribir la segunda a mano en el HTML habría
// puesto la cantidad de estantes en dos lados.
export const repisas = [];
export const estantes = [];

if (repisa && estante) {
  for (let nivel = 0; nivel < ESTANTES; nivel++) {
    const tabla = nivel === 0 ? repisa : repisa.cloneNode(false);
    const fila = nivel === 0 ? estante : estante.cloneNode(false);

    if (nivel > 0) {
      tabla.id = `repisa-${nivel}`;
      fila.id = `estante-${nivel}`;
      // El alféizar de arriba es el que tiene el rol y el tabindex: dos accesos
      // idénticos al mismo panel serían dos paradas del teclado para lo mismo.
      fila.removeAttribute('tabindex');
      fila.removeAttribute('role');
      fila.removeAttribute('aria-label');
      repisa.parentNode.insertBefore(tabla, repisa.nextSibling);
      estante.parentNode.insertBefore(fila, estante.nextSibling);
    }

    // El estilo cuelga de la CLASE y no del id: la tabla clonada necesita otro
    // id —dos elementos con el mismo id es HTML inválido— y con selectores de id
    // se quedaba sin una sola regla. Se vio enseguida: 390 px de ancho contra
    // los 133 que le tocaban.
    tabla.classList.add('repisa');
    fila.classList.add('estante');
    tabla.style.setProperty(VARS_REPISA.nivel, String(nivel));
    fila.style.setProperty(VARS_REPISA.nivel, String(nivel));
    tabla.innerHTML = svgDeRepisa();
    repisas.push(tabla);
    estantes.push(fila);
  }
}
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

// ---- El cielo ----
//
// Las cinco bandas se crean acá desde BANDAS_NUBES y no están escritas en el
// HTML, para que agregar o sacar una capa del cielo sea tocar la tabla y nada
// más. Todas comparten la receta de cúmulos de style.css; lo que las distingue
// —velocidad, tamaño, opacidad, altura y fase— viaja en estas variables.
//
// Se crean en orden y se apilan en orden, así que la última de la tabla queda
// arriba. La tabla va de la más rápida a la más lenta, o sea de la más cercana a
// la más lejana: por eso las lejanas quedan pintadas ENCIMA. Suena al revés y no
// lo es — con este alfa la de arriba no tapa, tiñe, y lo que se busca es que la
// bruma de lejos se lea sobre todo lo demás.

export const contenedorNubes = document.getElementById('nubes');

export function crearBanda(banda, clases = []) {
  const nodo = document.createElement('div');
  nodo.className = ['banda', ...clases].join(' ');
  nodo.style.setProperty(VARS_NUBES.cicloBanda, `${banda.ciclo}ms`);
  nodo.style.setProperty(VARS_NUBES.escala, String(banda.escala));
  nodo.style.setProperty(VARS_NUBES.alfaBanda, String(banda.alfa));
  nodo.style.setProperty(VARS_NUBES.bandaY, `${banda.y}%`);
  nodo.style.setProperty(VARS_NUBES.bandaAlto, `${banda.alto}%`);
  nodo.style.setProperty(VARS_NUBES.fase, `${banda.fase ?? 0}%`);
  return nodo;
}

if (contenedorNubes) {
  for (const banda of BANDAS_NUBES) {
    contenedorNubes.appendChild(crearBanda(banda, banda.deforma ? ['deformable'] : []));
  }
}
