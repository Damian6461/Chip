// Cadena de prioridad de estados visuales + carga de sprites con fallback.
// No toca el DOM del documento: sólo crea Image() y resuelve qué sprite
// corresponde. Quien dibuja es ui.js.

import {
  ASPECTO_PANTALLA,
  ESTADOS_VISUALES as E,
  RUTAS_SPRITES,
  UMBRAL_CRITICO_BATERIA,
  UMBRAL_FELIZ_BATERIA,
  UMBRAL_FELIZ_HUMOR,
  HORA_STANDBY_INICIO,
  HORA_STANDBY_FIN,
  FRANJAS_DIA,
  POSES_IDLE
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
  return franjaDelDia(ahora).nombre === 'noche';
}

// En qué tramo del día estamos. Vive acá con esDeNoche porque es la misma
// pregunta —qué hora es— y tiene que contestar con el mismo reloj: si la luz
// dijera "atardecer" mientras el fondo ya es el nocturno, el galpón se
// contradiría solo.
//
// El tramo de noche cruza la medianoche, por eso la comparación es un OR, igual
// que enFranjaStandby.
//
// Sus bordes YA NO son los del standby, a propósito. El mundo se oscurece a las
// 21 y Chip se duerme a las 23; amanece a las 6 y Chip se despierta a las 7. Las
// dos ventanas de desfase están explicadas en FRANJAS_DIA y son deliberadas.
//
// Lo que sí es una sola fuente de verdad es que TODO lo del mundo —el fondo, la
// clase es-noche, el charco del piso, la repisa apagada, el latido lento— sale
// de esta misma función. Cuando esDeNoche colgaba del standby, entre las 21 y
// las 23 el fondo era nocturno y el resto del galpón seguía iluminado de día:
// eso no se leía como "Chip está despierto de noche", se leía como un bug.
export function franjaDelDia(ahora) {
  const hora = horaLocal(ahora);

  return (
    FRANJAS_DIA.find((f) =>
      f.desde < f.hasta ? hora >= f.desde && hora < f.hasta : hora >= f.desde || hora < f.hasta
    ) ?? FRANJAS_DIA[0]
  );
}

// Cuánto se corrió la hora adentro de su tramo, de 0 a 1. Se calcula con los
// minutos y no sólo con la hora entera: si no, la luz daría cuatro saltos por
// tramo en vez de moverse.
function avanceEnFranja(ahora, franja) {
  const d = new Date(ahora);
  const hora = d.getHours() + d.getMinutes() / 60;
  const largo = franja.desde < franja.hasta
    ? franja.hasta - franja.desde
    : 24 - franja.desde + franja.hasta;
  const transcurrido = hora >= franja.desde ? hora - franja.desde : 24 - franja.desde + hora;
  return Math.min(1, Math.max(0, transcurrido / largo));
}

const mezclar = (a, b, t) => a + (b - a) * t;

// Los colores se interpolan canal por canal en sRGB. Alcanza y sobra: son dos
// tonos vecinos de la misma escena, no dos extremos del círculo cromático.
function mezclarColor(a, b, t) {
  const leer = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const [r1, g1, b1] = leer(a);
  const [r2, g2, b2] = leer(b);
  const c = (x, y) => Math.round(mezclar(x, y, t)).toString(16).padStart(2, '0');
  return `#${c(r1, r2)}${c(g1, g2)}${c(b1, b2)}`;
}

// La luz del piso, INTERPOLADA adentro del tramo. El fondo marca el momento del
// día y no se mueve; esto marca el paso del tiempo y no para nunca.
//
// El destino es el arranque del tramo siguiente, así que al final del atardecer
// la luz ya está viajando hacia la fuerza 0 de la noche y llega apagada al
// cambio de fondo, en vez de cortarse de golpe.
export function luzDelMomento(ahora) {
  const franja = franjaDelDia(ahora);
  const siguiente = FRANJAS_DIA[(FRANJAS_DIA.indexOf(franja) + 1) % FRANJAS_DIA.length];
  const t = avanceEnFranja(ahora, franja);
  const a = franja.luz;
  const b = siguiente.luz;

  // De noche no hay charco, y punto: la fuerza se queda en 0 en vez de
  // interpolar hacia el amanecer. Sin esto, a las 6:59 el piso ya tenía un
  // charco lila al 0,26 con el galpón nocturno de fondo — la luna no entra por
  // esa ventana. La posición sí sigue interpolando, para que al llegar el
  // amanecer el charco aparezca donde corresponde y no viaje desde el borde.
  const fuerza = a.fuerza === 0 ? 0 : mezclar(a.fuerza, b.fuerza, t);

  return {
    x: `${mezclar(a.x, b.x, t).toFixed(1)}%`,
    y: `${mezclar(a.y, b.y, t).toFixed(1)}%`,
    radio: `${mezclar(a.radio, b.radio, t).toFixed(1)}%`,
    color: mezclarColor(a.color, b.color, t),
    fuerza: +fuerza.toFixed(3)
  };
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
  // Un gigante pasando le gana a estar contento, pero no a estar dormido ni a
  // quedarse sin batería. Dormido no se aguanta nada —Chip no se entera— y con
  // la batería en rojo el aviso urgente es el otro. Arriba de feliz porque es
  // inmediato: está pasando ahora, del otro lado de la pared.
  //
  // La misma cara sirve para las dos cosas y no es reciclaje: `esperando` es
  // "los brazos cruzados", y eso es lo que hace cuando pasa un gigante y también
  // cuando le levantás del piso algo que él tenía ahí. La lectura del segundo
  // caso es "lo tenía ahí y vos me lo ordenaste".
  {
    nombre: E.esperando,
    condicion: (c) => c.gigantePasando === true || c.leOrdenaron === true
  },
  {
    nombre: E.feliz,
    condicion: (c) =>
      c.estado.bateria > UMBRAL_FELIZ_BATERIA && c.estado.humor > UMBRAL_FELIZ_HUMOR
  },
  { nombre: E.idle, condicion: () => true }
];

// Fallback de la cadena: si ninguna condición se cumpliera, se cae a idle.
const ESTADO_POR_DEFECTO = E.idle;

// contexto: { estado, ahora, accion, gigantePasando, leOrdenaron }. `ahora` es un
// timestamp en ms y no tiene default a propósito — el reloj lo pone el llamador,
// igual que en aplicarDecay. `accion` es el nombre del estado de acción en curso,
// o null. `gigantePasando` es true mientras se está leyendo un evento de la
// categoría `grandes` y `leOrdenaron` mientras dura el fastidio de que le
// levanten del piso una pieza; los dos los decide la sesión, que es la que tiene
// los timers. Acá no hay ninguno.
export function resolverEstadoVisual(contexto) {
  for (const entrada of CADENA_ESTADOS) {
    if (entrada.condicion(contexto)) return entrada.nombre;
  }
  return ESTADO_POR_DEFECTO;
}

// Qué PNG se dibuja mientras Chip está en idle. NO es parte de la cadena: la
// cadena resuelve el ESTADO y esto elige la POSE adentro de ese estado.
//
// Se exporta como función y no se resuelve en ui.js para que el índice pueda
// vivir en main.js, que es el único módulo con timers, y ui.js siga recibiendo
// una clave ya decidida.
export function poseDeIdle(indice) {
  return POSES_IDLE[((indice % POSES_IDLE.length) + POSES_IDLE.length) % POSES_IDLE.length];
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


// ---- El encaje del contenido de la pantalla ----
//
// Dada la caja medida de un sprite, devuelve dónde va la caja de contenido —en
// % de esa caja— para que el contenido conserve SIEMPRE la misma proporción.
//
// Es un `contain` de manual: se escala hasta que toca el lado que limita y se
// centra en el otro. Vive acá y no en ui.js porque es geometría pura y hace
// falta poder probarla: el contrato que garantiza es que las ocho poses den
// exactamente la misma proporción interna, y eso es una aserción, no una
// impresión mirando capturas.
export function cajaDeContenidoPantalla(recuadro) {
  const aspectoCaja = recuadro.ancho / recuadro.alto;

  // Si el recuadro es más ancho que el contenido, sobra a los costados; si es
  // más alto, sobra arriba y abajo.
  const ancho = aspectoCaja > ASPECTO_PANTALLA ? (ASPECTO_PANTALLA / aspectoCaja) * 100 : 100;
  const alto = aspectoCaja > ASPECTO_PANTALLA ? 100 : (aspectoCaja / ASPECTO_PANTALLA) * 100;

  return {
    x: (100 - ancho) / 2,
    y: (100 - alto) / 2,
    ancho,
    alto
  };
}
