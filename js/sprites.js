// Cadena de prioridad de estados visuales + carga de sprites con fallback.
// No toca el DOM del documento: sólo crea Image() y resuelve qué sprite
// corresponde. Quien dibuja es ui.js.

import {
  ESTADOS_VISUALES as E,
  RUTAS_SPRITES,
  UMBRAL_CRITICO_BATERIA,
  UMBRAL_FELIZ_BATERIA,
  UMBRAL_FELIZ_HUMOR,
  HORA_STANDBY_INICIO,
  HORA_STANDBY_FIN,
  FRANJAS_LUZ
} from './config.js';

const sprites = {};

// Uno de los dos lugares donde se construye un Date —el otro es diaLocal en
// eventos.js— y los dos con la misma regla: el timestamp llega de afuera, así la
// franja de standby se puede testear sin depender del reloj real ni de la zona
// horaria de quien corre las pruebas.
function horaLocal(ahora) {
  return new Date(ahora).getHours();
}

// La franja cruza la medianoche, por eso es un OR y no un rango.
function enFranjaStandby(hora) {
  return hora >= HORA_STANDBY_INICIO || hora < HORA_STANDBY_FIN;
}

// El fondo del galpón cambia con la MISMA franja que el standby, no con una
// regla propia: si Chip duerme, afuera es de noche. Se exporta para que main.js
// la resuelva con el mismo `ahora` que la cadena, así el sprite y el fondo no
// pueden discrepar sobre qué hora es.
export function esDeNoche(ahora) {
  return enFranjaStandby(horaLocal(ahora));
}

// En qué momento del día está la luz que entra por la ventana. Devuelve null de
// noche, que es cuando no entra ninguna.
//
// Vive acá con esDeNoche porque es la misma pregunta —qué hora es— y tiene que
// contestar con el mismo reloj: si la luz dijera "tarde" mientras el fondo ya es
// el nocturno, el galpón se contradiría solo.
export function franjaDeLuz(ahora) {
  if (esDeNoche(ahora)) return null;

  const hora = horaLocal(ahora);
  return FRANJAS_LUZ.find((franja) => hora >= franja.desde && hora < franja.hasta) ?? null;
}

// El orden define la prioridad: gana el primer estado cuya condición se cumple.
// Agregar estados nuevos es agregar entradas en la posición que les toque.
//
// Los estados de acción van PRIMERO y le ganan a todo. Son feedback transitorio:
// si el jugador toca Cargar con la batería en 12 y no ve cambiar nada porque
// gana `critico`, la acción se siente muerta justo cuando más importa que
// responda. Con este orden el bucle queda critico -> cargando -> idle: lo
// atendiste y respondió.
const CADENA_ESTADOS = [
  { nombre: E.cargando, condicion: (c) => c.accion === E.cargando },
  { nombre: E.jugando, condicion: (c) => c.accion === E.jugando },
  { nombre: E.limpiando, condicion: (c) => c.accion === E.limpiando },
  { nombre: E.critico, condicion: (c) => c.estado.bateria < UMBRAL_CRITICO_BATERIA },
  { nombre: E.standby, condicion: (c) => enFranjaStandby(horaLocal(c.ahora)) },
  {
    nombre: E.feliz,
    condicion: (c) =>
      c.estado.bateria > UMBRAL_FELIZ_BATERIA && c.estado.humor > UMBRAL_FELIZ_HUMOR
  },
  { nombre: E.idle, condicion: () => true }
];

// Fallback de la cadena: si ninguna condición se cumpliera, se cae a idle.
const ESTADO_POR_DEFECTO = E.idle;

// contexto: { estado, ahora, accion }. `ahora` es un timestamp en ms y no tiene
// default a propósito — el reloj lo pone el llamador, igual que en aplicarDecay.
// `accion` es el nombre del estado de acción en curso, o null.
export function resolverEstadoVisual(contexto) {
  for (const entrada of CADENA_ESTADOS) {
    if (entrada.condicion(contexto)) return entrada.nombre;
  }
  return ESTADO_POR_DEFECTO;
}

// El loader nunca rechaza: un sprite que no carga queda marcado ok:false y el
// render se cae al placeholder.
function cargarSprite(nombre, ruta) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ nombre, img, ok: true });
    img.onerror = () => resolve({ nombre, img: null, ok: false });
    img.src = ruta;
  });
}

export async function cargarSprites() {
  const resultados = await Promise.all(
    Object.entries(RUTAS_SPRITES).map(([nombre, ruta]) => cargarSprite(nombre, ruta))
  );

  for (const resultado of resultados) {
    sprites[resultado.nombre] = resultado;
  }
}

function imagenDe(nombre) {
  const sprite = sprites[nombre];
  return sprite && sprite.ok ? sprite.img : null;
}

// Devuelve la imagen lista para dibujar.
//
// Degradación en dos escalones: si falta el sprite del estado pedido se usa el
// de ESTADO_POR_DEFECTO, y si tampoco está se devuelve null y ui.js dibuja el
// placeholder con el nombre del estado escrito. Así el arte puede entregarse
// incompleto — `limpiando.png` es opcional — sin que el juego muestre un
// recuadro de debug en medio de una partida.
//
// Contrapartida: con arte real, un sprite que falte se ve como idle en vez de
// cantar el error. El placeholder sólo aparece si no cargó ninguno de los dos.
export function obtenerSprite(nombre) {
  return imagenDe(nombre) ?? imagenDe(ESTADO_POR_DEFECTO);
}
