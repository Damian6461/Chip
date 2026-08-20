// Las dos reglas de composición de los efectos, hechas cumplir.
//
// SÓLO CORRE EN NODE, igual que assets.test.js: lee style.css como texto.
//
// Por qué existe. `RADIO_EXCLUSION_ANTENA` y `FRANJA_EFECTOS` estaban declaradas
// en config.js y no las leía NADIE — ni JS ni CSS. Aparecían nada más que en un
// comentario de style.css, contando que las posiciones de los corazones se
// habían verificado a mano contra ellas. O sea: los números que mandan viven en
// el CSS como literales (`left: 15%`), y config.js guardaba la regla que nadie
// consultaba. Si alguien movía un corazón al 92% no se quejaba nadie.
//
// Es exactamente la misma forma de la trampa que ya nos mordió con el guardián
// de las poses: una regla que el código sostiene por disciplina y no por
// construcción. La disciplina se olvida; un test no.
//
// Lo que este archivo NO puede verificar, dicho en voz alta:
//
//   - Las zetas de standby. Su ancho no está declarado en %: son un glifo de
//     texto dimensionado por font-size. La franja se les podría chequear con el
//     `left` solo, pero sería medir media caja y dar una garantía falsa.
//   - La deriva de los keyframes. Los corazones se van 9 px hacia afuera al
//     final del recorrido, y 9 px sobre un contenedor de ~390 son ~2,3%. Se
//     chequea la posición declarada, que es donde nacen y donde vive la
//     decisión. El margen que queda —el más justo es de 3 puntos— lo absorbe.
//   - Las reglas dentro de @media o @supports. El parser toma sólo las de primer
//     nivel; hoy TODA la geometría de los efectos vive ahí, y el chequeo de
//     inventario de abajo es lo que avisa si eso deja de ser cierto.

import { readFileSync, existsSync } from 'node:fs';
import { prueba, igual, verdadero } from './runner.js';
import { svgDeRepisa } from '../js/formas.js';
import {
  INHALACION,
  INCLINACION_CABEZA,
  CABLE,
  CONECTOR_PECHO,
  PULSOS_CABLE,
  TAMANO_OBJETO,
  OBJETO_PISO,
  REPISA,
  PIEZAS_POR_ESTANTE,
  ANCHO_MINIMO_SOPORTADO,
  COLORES_BOTON,
  COLORES_BOTON_CHAPITA,
  COLORES_BULBO,
  COLORES_TOMA,
  COLORES_PANEL,
  BOTONERA,
  FUENTE_BOTONERA,
  ANTENA_INERCIA,
  RITMOS_RAYO,
  UMBRAL_CRITICO_BATERIA,
  GRIS_CHAPA_CABEZA,
  PANEL_DEBUG,
  COLOR_APERTURA,
  RADIO_EXCLUSION_ANTENA,
  FRANJA_EFECTOS,
  POSICIONES_ANTENA,
  CORAZONES_FELIZ,
  DESTELLOS_FELIZ,
  RAYITAS_JUGANDO,
  PULSOS_CARGANDO,
  BURBUJAS_LIMPIANDO
} from '../js/config.js';

const RAIZ = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const CSS = readFileSync(RAIZ + 'style.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

// ============================================================================
// EL CORTE DE UN BLOQUE DE LA HOJA, CON SU RED
// ============================================================================
//
// PASÓ DOS VECES Y LA SEGUNDA CASI NO SE VE. Media docena de estos tests ubican
// su sujeto buscando texto: `bloqueEntre(CSS, 'A', 'B')`. Si
// el ancla B desaparece —porque alguien borró esa regla, que es exactamente lo
// que pasa cuando el diseño avanza— `indexOf` devuelve −1, `slice` lo interpreta
// como "un carácter antes del final" y el bloque pasa a ser LA HOJA ENTERA.
//
// Y ahí está lo peor: UN GUARDIÁN ROTO ASÍ NO SE CAE, SE RELAJA. El test sigue
// verde porque encuentra lo que busca en cualquier otra pieza del archivo. La
// primera vez fue el corte de los estados del botón, que denunciaba un `width`
// a tres mil líneas; la segunda, el guardián de los íconos, que cortaba en
// `.led {` y al irse el LED siguió pasando encontrando un `crispEdges` ajeno.
//
// Esta función es la red, y hace tres cosas que un slice suelto no hace:
//   1. si falta cualquiera de las dos anclas, TIRA. No devuelve un bloque raro.
//   2. si el bloque supera el tope, TIRA. Un bloque de regla son cientos de
//      caracteres, no miles: el tope es lo que distingue "encontré mi regla" de
//      "me comí el archivo".
//   3. si el final quedara antes del principio, TIRA.
//
// El tope por defecto es holgado a propósito —una regla larga con sus longhands
// entra cómoda— porque no está para medir el tamaño de una regla: está para
// atrapar el salto de magnitud de comerse la hoja, que son 200 000 caracteres.
function bloqueEntre(texto, desde, hasta, tope = 4000) {
  const i = texto.indexOf(desde);
  if (i < 0) throw new Error(`el corte no encontró su ancla de inicio: ${desde}`);
  const j = texto.indexOf(hasta, i);
  if (j < 0) throw new Error(`el corte no encontró su ancla de fin: ${hasta} (después de ${desde})`);
  const bloque = texto.slice(i, j);
  if (bloque.length > tope) {
    throw new Error(
      `el corte entre ${desde} y ${hasta} devolvió ${bloque.length} caracteres y el tope es ${tope}: ` +
        'eso no es una regla, es medio archivo'
    );
  }
  return bloque;
}

// Las familias que se posicionan en % y por lo tanto se pueden chequear.
const FAMILIAS = ['corazon', 'destello', 'rayita', 'pulso', 'burbuja'];

// Cuántas piezas dice config.js que hay de cada una. Es el inventario contra el
// que se cruza lo que el parser encuentra: si no coinciden, o alguien agregó una
// pieza en el CSS sin tocar la constante, o el parser se rompió. Las dos cosas
// hay que enterarlas.
const INVENTARIO = {
  corazon: CORAZONES_FELIZ,
  destello: DESTELLOS_FELIZ,
  rayita: RAYITAS_JUGANDO,
  pulso: PULSOS_CARGANDO,
  burbuja: BURBUJAS_LIMPIANDO
};

// El juego de corazones de la celebración: son otras piezas, con sus propias
// posiciones, y pueden aparecer sobre CUALQUIER estado —se disparan cuando sube
// el humor, no cuando Chip está feliz—. Por eso se chequean contra todas las
// antenas y no contra una.
const CONTENEDOR_CELEBRACION = '#corazones-extra';

// ---- El parser ----

// Reglas de primer nivel, con conteo de llaves. Un split por `}` no sirve: los
// @keyframes tienen bloques adentro y desalinean todo lo que viene después.
function reglasDePrimerNivel(texto) {
  const reglas = [];
  let buffer = '';
  let selector = null;
  let prof = 0;

  for (const c of texto) {
    if (c === '{') {
      prof++;
      if (prof === 1) {
        selector = buffer.trim().replace(/\s+/g, ' ');
        buffer = '';
        continue;
      }
    } else if (c === '}') {
      prof--;
      if (prof === 0) {
        reglas.push({ selector, cuerpo: buffer });
        buffer = '';
        selector = null;
        continue;
      }
    }
    buffer += c;
  }

  return reglas;
}

function porcentaje(cuerpo, propiedad) {
  const m = cuerpo.match(new RegExp(`(?:^|;)\\s*${propiedad}\\s*:\\s*(-?[\\d.]+)%\\s*(?:;|$)`, 'm'));
  return m ? parseFloat(m[1]) : null;
}

// Junta la geometría de cada pieza: la regla base de la familia da los valores
// por defecto y la de :nth-child los pisa, igual que hace la cascada.
function leerPiezas() {
  const grupos = new Map();

  for (const { selector, cuerpo } of reglasDePrimerNivel(CSS)) {
    if (!selector) continue;

    for (const sel of selector.split(',').map((s) => s.trim())) {
      // Nos importa el ÚLTIMO selector simple: `.estado-feliz #corazones .corazon`
      // y `.corazon` son la misma pieza con distinta especificidad.
      const m = sel.match(/(?:^|\s)\.(\w+)(?::nth-child\((\d+)\))?$/);
      if (!m || !FAMILIAS.includes(m[1])) continue;

      const familia = m[1];
      const indice = m[2] ? Number(m[2]) : 0; // 0 = la regla base
      const contenedor = sel.includes(CONTENEDOR_CELEBRACION) ? CONTENEDOR_CELEBRACION : '';
      const clave = `${contenedor}|${familia}`;

      if (!grupos.has(clave)) grupos.set(clave, new Map());
      const grupo = grupos.get(clave);
      if (!grupo.has(indice)) grupo.set(indice, {});

      for (const p of ['left', 'top', 'width']) {
        const v = porcentaje(cuerpo, p);
        if (v !== null) grupo.get(indice)[p] = v;
      }
    }
  }

  const piezas = [];
  for (const [clave, grupo] of grupos) {
    const [contenedor, familia] = clave.split('|');
    const base = grupo.get(0) ?? {};

    for (const [indice, propio] of grupo) {
      if (indice === 0) continue;

      const left = propio.left ?? base.left;
      const top = propio.top ?? base.top;
      const ancho = propio.width ?? base.width;

      // Una regla de :nth-child que sólo toca la animación no es una pieza
      // nueva: no aporta geometría y no hay nada que chequearle.
      if (left === undefined || top === undefined || ancho === undefined) continue;

      piezas.push({
        nombre: `${contenedor}.${familia}:nth-child(${indice})`,
        familia,
        celebracion: contenedor === CONTENEDOR_CELEBRACION,
        left,
        top,
        ancho
      });
    }
  }

  return piezas;
}

const PIEZAS = leerPiezas();

// El estado en el que aparece cada familia, sacado del propio CSS y no de una
// tabla escrita a mano acá: si mañana las burbujas también salen en otro estado,
// este test lo tiene que saber sin que nadie se acuerde de venir a avisarle.
function estadosDe(familia) {
  const re = new RegExp(`\\.estado-([\\w-]+)[^,{}]*\\.${familia}\\b`, 'g');
  return [...new Set([...CSS.matchAll(re)].map((m) => m[1]))];
}

// ---- El inventario, que es lo que evita que este archivo pase en falso ----

prueba('composición: el CSS declara exactamente las piezas que dice config.js', () => {
  for (const [familia, cuantas] of Object.entries(INVENTARIO)) {
    const encontradas = PIEZAS.filter((p) => p.familia === familia && !p.celebracion).length;
    igual(encontradas, cuantas, `${familia}: el CSS tiene ${encontradas} y config.js dice ${cuantas}`);
  }
});

prueba('composición: cada familia de efectos aparece en un estado y uno solo', () => {
  for (const familia of FAMILIAS) {
    const estados = estadosDe(familia);
    igual(estados.length, 1, `${familia} aparece en [${estados.join(', ')}]`);
    verdadero(
      POSICIONES_ANTENA[estados[0]] !== undefined,
      `${familia} sale en "${estados[0]}", que necesita entrada en POSICIONES_ANTENA`
    );
  }
});

// ---- Regla 1: la franja ----

prueba('composición: ningún efecto se sale de FRANJA_EFECTOS', () => {
  const fuera = [];

  for (const p of PIEZAS) {
    const derecha = p.left + p.ancho;
    if (p.left < FRANJA_EFECTOS.desde || derecha > FRANJA_EFECTOS.hasta) {
      fuera.push(`${p.nombre} ocupa [${p.left}, ${derecha.toFixed(1)}]`);
    }
  }

  igual(
    fuera.join(' | '),
    '',
    `la franja permitida es [${FRANJA_EFECTOS.desde}, ${FRANJA_EFECTOS.hasta}] y se salen`
  );
});

// ---- Regla 2: el círculo de la antena ----
//
// Las distancias se calculan como un círculo de verdad y no como un óvalo,
// porque el contenedor ES cuadrado: #chip mide --alto-chip de ancho y de alto, y
// #contenedor-mascota va con inset: 0 adentro. Un 11% horizontal y un 11%
// vertical son la misma longitud. Si algún día la caja deja de ser cuadrada,
// este cálculo pasa a mentir y hay que rehacerlo en las dos dimensiones.

function distanciaALaAntena(pieza, estado) {
  const antena = POSICIONES_ANTENA[estado];
  const centroX = pieza.left + pieza.ancho / 2;
  const centroY = pieza.top + pieza.ancho / 2; // las piezas son cuadradas
  return Math.hypot(centroX - antena.x, centroY - antena.y);
}

prueba('composición: ningún efecto entra en el círculo de exclusión de la antena', () => {
  const pisan = [];

  for (const p of PIEZAS) {
    // Los de la celebración se disparan cuando sube el humor, o sea en
    // cualquier estado: tienen que despejar TODAS las posiciones de antena.
    const estados = p.celebracion ? Object.keys(POSICIONES_ANTENA) : estadosDe(p.familia);

    for (const estado of estados) {
      const d = distanciaALaAntena(p, estado);
      if (d < RADIO_EXCLUSION_ANTENA) {
        pisan.push(`${p.nombre} queda a ${d.toFixed(1)} de la antena de ${estado}`);
      }
    }
  }

  igual(pisan.join(' | '), '', `el radio prohibido es ${RADIO_EXCLUSION_ANTENA} y lo invaden`);
});

// El margen real, para que el día que alguien mueva una pieza sepa cuánto aire
// había. La más justa hoy es burbuja:4 contra la antena de limpiando.
prueba('composición: queda margen contra la antena, no está pasando raspando', () => {
  let peor = Infinity;
  let quien = '';

  for (const p of PIEZAS) {
    const estados = p.celebracion ? Object.keys(POSICIONES_ANTENA) : estadosDe(p.familia);
    for (const estado of estados) {
      const d = distanciaALaAntena(p, estado);
      if (d < peor) {
        peor = d;
        quien = `${p.nombre} en ${estado}`;
      }
    }
  }

  verdadero(
    peor >= RADIO_EXCLUSION_ANTENA,
    `la pieza más cerca es ${quien}, a ${peor.toFixed(1)} del radio de ${RADIO_EXCLUSION_ANTENA}`
  );
});

// ---- La asimetría de la respiración ----
//
// El pico de `respirar` y el de `respirar-sombra` tienen que caer en el MISMO
// fotograma, y los dos en INHALACION. Si se separan, el cuerpo y su huella
// cuentan dos historias distintas y se lee como un desfasaje, no como peso.
//
// Va acá y no en tema.test.js por la misma razón que las posiciones de los
// corazones: es un literal del CSS que sostiene una constante de config, y los
// offsets de un @keyframes no pueden llevar var().

// Se apoya en el mismo parser de llaves de arriba y NO en una expresión regular
// propia. La primera versión usaba /@keyframes respirar\s*\{([\s\S]*?)\n\}/ y
// devolvía null en los DOS keyframes, porque el archivo tiene finales CRLF y ese
// `\n\}` no cerraba nunca. Los dos null se comparaban entre sí y la prueba de la
// sombra PASABA: un pase en falso de manual, en el mismo commit que agregó un
// guardián para evitarlos. De ahí el `verdadero` de abajo — ninguna de las dos
// puede aprobar sin haber encontrado un número de verdad.
function picoDelKeyframe(nombre) {
  const bloque = reglasDePrimerNivel(CSS).find((r) => r.selector === `@keyframes ${nombre}`);
  if (!bloque) return null;

  // Los offsets del bloque, sin el 0% ni el 100%, que son el reposo.
  const offsets = [...bloque.cuerpo.matchAll(/(\d+(?:\.\d+)?)%\s*\{/g)]
    .map((m) => Number(m[1]))
    .filter((n) => n > 0 && n < 100);

  return offsets.length === 1 ? offsets[0] : offsets;
}

prueba('respiración: el pico del keyframe cae en INHALACION', () => {
  const pico = picoDelKeyframe('respirar');

  verdadero(
    Number.isFinite(pico),
    `no se encontró un pico único en @keyframes respirar (dio ${JSON.stringify(pico)})`
  );
  igual(pico, INHALACION * 100, `el pico de @keyframes respirar tiene que ser INHALACION`);
});

prueba('respiración: la sombra pica en el mismo fotograma que el cuerpo', () => {
  const cuerpo = picoDelKeyframe('respirar');
  const sombra = picoDelKeyframe('respirar-sombra');

  verdadero(Number.isFinite(cuerpo) && Number.isFinite(sombra), `dieron ${cuerpo} y ${sombra}`);
  igual(sombra, cuerpo, `el cuerpo y su huella tienen que llegar al pico juntos`);
});

// ---- Los tres tiempos de la inclinación de cabeza ----
//
// Mismo caso que INHALACION: los offsets de un @keyframes no admiten var(), así
// que 20,7% y 70,7% son literales del CSS que sostienen INCLINACION_CABEZA.

prueba('inclinación: los tramos del keyframe salen de INCLINACION_CABEZA', () => {
  const total =
    INCLINACION_CABEZA.entra + INCLINACION_CABEZA.sostiene + INCLINACION_CABEZA.vuelve;
  const esperados = [
    +((INCLINACION_CABEZA.entra / total) * 100).toFixed(1),
    +(((INCLINACION_CABEZA.entra + INCLINACION_CABEZA.sostiene) / total) * 100).toFixed(1)
  ];

  const bloque = reglasDePrimerNivel(CSS).find((r) => r.selector === '@keyframes ladear');
  verdadero(Boolean(bloque), 'no se encontró @keyframes ladear');

  const offsets = [...bloque.cuerpo.matchAll(/(\d+(?:\.\d+)?)%\s*\{/g)]
    .map((m) => Number(m[1]))
    .filter((n) => n > 0 && n < 100);

  igual(
    offsets.join(', '),
    esperados.join(', '),
    'los tramos del CSS tienen que ser los de config'
  );
});

// ---- El contraste de la botonera ----
//
// Los grises de las teclas subieron para que pertenezcan al galpón —eran mucho
// más oscuros que la chapa de Chip y que la caja del fondo— y eso mueve el
// contraste del texto, que es lo primero que se rompe al aclarar un fondo.
//
// La cuenta se hace acá y no a mano en un comentario: es la misma trampa del
// resto del archivo. Un número medido una vez y anotado se desactualiza en
// silencio con el primer retoque de paleta.
//
// La etiqueta cae en la mitad de ABAJO de la tecla —el ícono va arriba— así que
// el par que importa para el texto es `texto` contra `bajo` y `fondo`. El ícono
// va grabado en la mitad de ARRIBA, y para un elemento gráfico AA pide 3.
function luminancia(hex) {
  const canal = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

function contraste(a, b) {
  const [x, y] = [luminancia(a), luminancia(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

// ---- LA BOTONERA SIN CAJA ----
//
// EL FONDO DE REFERENCIA CAMBIÓ, Y ESO ES LO PRIMERO. Estos tres tests medían
// contra `--panel-chapa` y `--panel-hueco`, que eran el relleno del botón. El
// botón ya no tiene relleno: lo que hay detrás de la etiqueta es el PISO DEL
// GALPÓN, y el piso cambia cuatro veces por día.
//
// Los tres seguían pasando después de sacarle la caja, y ése era el problema:
// un test verde midiendo contra una superficie que ya no está en pantalla.
//
// LOS CUATRO PISOS, MEDIDOS, NO ESTIMADOS. Salen de
// verificacion/botonera-chapita.html: la panorámica de cada franja recortada al
// encuadre del teléfono —390x844, `background-size: auto 100%`, que recorta por
// los costados— compuesta con el charco de luz de la hora, y promediada en la
// banda de 48 px que ocupa la botonera.
//
// Están copiados acá y no importados de ningún lado porque no existe del lado de
// config: son una medición sobre cuatro imágenes, y para rehacerla hay que abrir
// la página. Si alguien cambia una panorámica, esto queda viejo — y el modo de
// enterarse es el mismo de siempre: mirarla.
const PISOS = {
  amanecer: '#353742', //  53, 55, 66 — luminancia 10
  mediodia: '#585d62', //  88, 93, 98 — luminancia 28, el más claro de los cuatro
  atardecer: '#413731', //  65, 55, 49 — luminancia 10
  noche: '#17191a' //  23, 25, 26 — luminancia 2
};

// El más claro es el que manda: es donde un naranja pierde. NO es el atardecer
// —que es el que uno esperaría por el nombre— sino el MEDIODÍA. Medido.
const PISO_CLARO = PISOS.mediodia;
const PISO_OSCURO = PISOS.noche;

prueba('botonera: el texto se lee sobre su contorno, no sobre un relleno', () => {
  // Sin caja, la etiqueta ya no tiene un tono conocido debajo. Lo que la hace
  // legible en las cuatro franjas es el contorno negro de 1 px: el texto se mide
  // contra ÉL, y el contorno es el que se mide contra el piso.
  const contraElContorno = contraste(COLORES_BOTON.texto, '#000000');
  verdadero(contraElContorno >= 4.5, `texto sobre su contorno: ${contraElContorno.toFixed(2)} a 1, y AA pide 4,5`);

  // Y contra el piso más claro, sin contorno, para tener el número que dice por
  // qué el contorno hace falta.
  const sinContorno = contraste(COLORES_BOTON.texto, PISO_CLARO);
  verdadero(
    sinContorno < contraElContorno,
    `el contorno tiene que ayudar: sin él da ${sinContorno.toFixed(2)} sobre el mediodía`
  );
});

prueba('botonera: el naranja es el de la paleta cerrada y no uno propio', () => {
  // Era #c8781f, un tono inventado para la botonera vieja. El punto 3.3 pide el
  // #ffa300 de la paleta.
  igual(COLORES_BOTON.naranja.toLowerCase(), '#ffa300', 'el naranja de la paleta cerrada');

  // Y los dos tonos nuevos de la chapita tampoco son hex nuevos: uno es el
  // núcleo del bulbo de `cargando` y el otro el naranja gastado de la caja de
  // conexión. Si alguien los reemplaza por un valor inventado, esto lo agarra.
  igual(
    COLORES_BOTON_CHAPITA['naranja-claro'],
    COLORES_BULBO.cargando.nucleo,
    'la chapita encendida usa el crema del bulbo de cargando, no un blanco propio'
  );
  igual(
    COLORES_BOTON_CHAPITA['naranja-apagado'],
    COLORES_TOMA.naranja,
    'la chapita apagada usa el naranja gastado de la caja de conexión'
  );
});

prueba('botonera: la chapita se despega del piso en las cuatro franjas', () => {
  // LO QUE ESTE TEST NO DICE, y hay que decirlo: NO exige 4,5 del naranja contra
  // el piso, porque el naranja NO lo saca. Sobre el mediodía da 2,81 de mediana
  // y 2,56 en el peor píxel. Está medido y está publicado en
  // verificacion/botonera-chapita.html; la decisión de si eso alcanza es del
  // revisor y está abierta.
  //
  // Lo que sí se exige es lo que hace que la pieza no desaparezca: que en CADA
  // franja haya algo —el naranja o el filo negro— que le saque 3 al piso. Son
  // las dos mitades de la misma pieza y se turnan: sobre piso oscuro gana el
  // naranja y el filo no se ve; sobre piso claro gana el filo y el naranja no.
  //
  // Y EL FILO RODEA LA CHAPITA, que es lo que hace que esta cuenta valga para
  // los cuatro bordes y no para uno. Medido lado por lado sobre las cuatro
  // franjas —dieciséis mínimos, el peor píxel de cada uno—: el peor de los
  // dieciséis da 3,26, en el mediodía por la izquierda. Está en
  // verificacion/botonera-chapita.html, punto c.bis.
  //
  // Con el filo abajo nomás, ese mismo peor daba 2,56.
  for (const [franja, piso] of Object.entries(PISOS)) {
    const porElNaranja = contraste(COLORES_BOTON.naranja, piso);
    const porElFilo = contraste('#000000', piso);
    verdadero(
      Math.max(porElNaranja, porElFilo) >= 3,
      `en ${franja} la chapita no se despega: naranja ${porElNaranja.toFixed(2)}, filo ${porElFilo.toFixed(2)}`
    );
  }

  // Y que las dos mitades SE TURNEN de verdad, o el filo sería adorno. Lo que se
  // prueba es la tendencia, que es lo que este test puede ver: al aclararse el
  // piso, el naranja pierde y el filo gana.
  //
  // ESTE TEST MIDE CONTRA EL PROMEDIO DE LA BANDA, y ahí el naranja todavía le
  // gana al filo por poco en el mediodía —3,32 contra 3,16—. Contra el PEOR
  // PÍXEL se da vuelta: 2,56 el naranja y 3,21 el filo. Los dos números están en
  // verificacion/botonera-chapita.html, que es donde se puede recorrer píxel por
  // píxel; acá no hay canvas, así que acá va el promedio y queda dicho cuál es
  // cuál. Un test que no puede reproducir un número no debería afirmarlo.
  const naranjaClaro = contraste(COLORES_BOTON.naranja, PISO_CLARO);
  const naranjaOscuro = contraste(COLORES_BOTON.naranja, PISO_OSCURO);
  const filoClaro = contraste('#000000', PISO_CLARO);
  const filoOscuro = contraste('#000000', PISO_OSCURO);

  verdadero(
    naranjaOscuro > naranjaClaro,
    `el naranja tiene que perder al aclararse el piso: ${naranjaOscuro.toFixed(2)} de noche, ${naranjaClaro.toFixed(2)} al mediodía`
  );
  verdadero(
    filoClaro > filoOscuro,
    `y el filo tiene que ganar: ${filoOscuro.toFixed(2)} de noche, ${filoClaro.toFixed(2)} al mediodía`
  );
  verdadero(
    filoClaro >= 3,
    `sobre el piso más claro el filo es lo único que queda, y da ${filoClaro.toFixed(2)}`
  );
});

prueba('botonera: la tecla apagada se lee apagada, no ilegible', () => {
  // "Apagado" es una diferencia contra la chapita ENCENDIDA, no contra el piso:
  // el jugador compara las tres teclas entre sí, que están una al lado de la
  // otra. Lo que hay que garantizar es que el marrón se distinga del naranja y
  // que no sea tan oscuro que la pieza desaparezca sobre el piso de noche.
  const contraLaEncendida = contraste(
    COLORES_BOTON_CHAPITA['naranja-apagado'],
    COLORES_BOTON.naranja
  );
  // Medido: 1,70. El umbral va en 1,5 y no en 1,8 —que era el de la versión
  // anterior, contra otro par de colores— porque acá además hay diferencia de
  // TONO: naranja encendido contra marrón gastado. Dos superficies que sólo se
  // distinguieran por luminancia pedirían más.
  verdadero(contraLaEncendida >= 1.5, `apagada contra encendida: ${contraLaEncendida.toFixed(2)} a 1`);

  const apagadaSobreOscuro = contraste(COLORES_BOTON_CHAPITA['naranja-apagado'], PISO_OSCURO);
  verdadero(apagadaSobreOscuro >= 3, `apagada sobre el piso de noche: ${apagadaSobreOscuro.toFixed(2)} a 1`);

  // Y el texto apagado: contra su contorno, que es lo que tiene debajo.
  const texto = contraste(COLORES_PANEL.linea, '#000000');
  const encendido = contraste(COLORES_BOTON.texto, '#000000');
  verdadero(texto >= 1.8, `el texto apagado da ${texto.toFixed(2)} a 1 y tiene que verse`);
  verdadero(texto < encendido, 'y tiene que contrastar MENOS que el encendido, o no se distinguen');
});

// ---- Lo que el punto 3 saca, y que nadie lo vuelva a poner ----
//
// Estas cuatro cosas no son gusto: cada una manda píxeles fuera de la grilla, y
// con cualquiera puesta el resto del punto no se puede ver.

prueba('botonera: no hay perspectiva ni inclinación', () => {
  // Es lo primero y lo más importante del punto 3. Inclinar algo en 3D obliga al
  // navegador a resamplear cada borde fuera de la grilla de píxeles: con el
  // rotateX puesto, los cantos duros, la fuente pixel y los íconos de 16
  // unidades quedan todos interpolados por el mismo transform.
  const bloque = bloqueEntre(CSS, '#acciones {', '#acciones button::after');
  verdadero(!/perspective/.test(bloque), 'volvió la perspectiva a #acciones');
  verdadero(!/rotateX/.test(bloque), 'volvió el rotateX a las chapas');
  verdadero(!('inclinacion' in BOTONERA), 'BOTONERA no puede volver a declarar inclinación');
  verdadero(!('perspectiva' in BOTONERA), 'BOTONERA no puede volver a declarar perspectiva');
  verdadero(!('fuga' in BOTONERA), 'BOTONERA no puede volver a declarar el punto de fuga');
});

prueba('botonera: las esquinas son duras', () => {
  const bloque = bloqueEntre(CSS, '#acciones button {', '#acciones button::after');
  const radio = bloque.match(/border-radius:\s*([^;]+);/);
  verdadero(radio !== null, 'la chapa tiene que declarar border-radius explícito');
  igual(radio[1].trim(), '0', 'un radio redondeado nunca cae en la grilla');
});

// Las longitudes de cada sombra de un `box-shadow` o de un `text-shadow`: los
// colores se descartan, incluidos los `rgb(...)` con sus propios paréntesis.
// Las longitudes que declaran los `--boton-*` que aparecen adentro de una
// sombra, para poder resolverlas antes de medirlas. SIN ESTO EL GUARDIÁN NO VE
// LA EXPANSIÓN: el primer intento borraba los `var()` junto con los colores, así
// que `0 0 0 var(--boton-chapita-filo)` se leía como una sombra de tres
// longitudes en cero — verde, y sin haber mirado el único número que importa.
const LARGOS_DE_LA_CHAPITA = {
  '--boton-chapita-filo': BOTONERA.chapita.filo,
  '--boton-chapita-halo': BOTONERA.chapita.halo
};

function sombrasDe(declaracion) {
  let texto = declaracion.replace(/#[0-9a-fA-F]{3,8}/g, '');
  for (const [nombre, valor] of Object.entries(LARGOS_DE_LA_CHAPITA)) {
    texto = texto.split(`var(${nombre})`).join(`${valor}px`);
  }
  return texto
    .replace(/(?:rgba?|hsla?|color-mix)\((?:[^()]|\([^()]*\))*\)/g, '')
    .replace(/var\((?:[^()]|\([^()]*\))*\)/g, 'SIN-RESOLVER')
    .split(',')
    // Un cero se escribe `0` y no `0px`, así que la unidad es opcional. Un
    // intento anterior pedía `px` y devolvía una sola longitud de `0 1px 0`.
    .map((s) => (s.match(/-?[\d.]+(?:px)?/g) || []).map(parseFloat))
    .filter((l) => l.length > 0);
}

// ---- EL CABLE, DIBUJADO CON LAS REGLAS DE LA ESCENA Y NO CON LAS DE UN VECTOR ----
//
// Los cuatro defectos que se le veían al cable —el trazo suave, el ancho
// fraccionario, las opacidades que mezclan y los puntitos cian— eran uno solo:
// estaba dibujado con convenciones de vector sobre una escena de pixel art, y
// estaba PEDIDO así. El comentario de la hoja decía que la opacidad era para que
// el filo se MEZCLARA con el cuerpo.
//
// Medido sobre un corte vertical del tubo, antes: 6, 7 y 12 colores distintos en
// tres cortes. Después: 3, 3 y 3. Ver verificacion/cable-cortes.html.

prueba('cable: las tres capas del tubo y el pulso piden bordes duros', () => {
  // `shape-rendering: auto` quiere decir antialias. Es la misma hoja donde los
  // íconos de la botonera ya piden `crispEdges` por el mismo motivo.
  const tubo = bloqueEntre(CSS, '.cable-cuerpo {', '.cable-sombra-puerto');
  const cuantos = (tubo.match(/shape-rendering:\s*crispEdges/g) || []).length;
  igual(cuantos, 2, 'las tres capas del tubo van en dos reglas, y las dos tienen que pedir crispEdges');
  verdadero(!/shape-rendering:\s*auto/.test(tubo), 'volvió el antialias a alguna capa del tubo');

  const pulso = bloqueEntre(CSS, '.pulso-cable {', '@keyframes viajar-pulso');
  const anillos = (pulso.match(/shape-rendering:\s*crispEdges/g) || []).length;
  igual(anillos, 2, 'las dos piezas del pulso —anillo y núcleo— piden crispEdges');
});

prueba('cable: el conector del pecho es una pieza de píxeles, no una ficha vectorial', () => {
  // ACÁ HABÍA UNA FICHA, y el cambio de fondo no es el dibujo sino QUÉ PIEZA ES:
  // una ficha TERMINA el cable, un conector lo RECIBE. Ver conectorDelPecho.
  //
  // Lo que este guardián cuida es que la pieza siga siendo de píxeles: la ficha
  // tenía `rx` —cuatro esquinas interpoladas— y un filo a opacidad 0,75.
  const bloque = bloqueEntre(CSS, '.cable-conector-cuerpo {', '#cable .cable-cuerpo,');
  const cuantos = (bloque.match(/shape-rendering:\s*crispEdges/g) || []).length;
  igual(cuantos, 4, 'las cuatro piezas del conector piden crispEdges');
  verdadero(!/opacity:/.test(bloque), 'una opacidad en el conector vuelve a mezclar en vivo');
  verdadero(!/gradient|blur/.test(bloque), 'ni degradés ni difuminados');

  // Y QUE NO VUELVA EL RADIO. `rx` en un rectángulo de 8 px son cuatro esquinas
  // a medio pintar, que a este tamaño es la mitad del contorno de la pieza.
  const UI = readFileSync(RAIZ + 'js/ui.js', 'utf8');
  const dibujo = bloqueEntre(UI, '<g class="cable-conector"', '</g>`;', 2000);
  verdadero(!/rx=/.test(dibujo), 'volvió una esquina redondeada al conector');
  verdadero(!/toFixed/.test(dibujo), 'una medida con decimales: al DOM tienen que llegar enteras');

  // EL LADO VA EN % DE LA CAJA DE CHIP y no en píxeles fijos: lo que está pegado
  // a un sprite escala con el sprite. Los objetos de la colección van al revés
  // —píxeles fijos— porque están en el mundo y no sobre Chip.
  verdadero(
    typeof CONECTOR_PECHO.lado === 'number' && CONECTOR_PECHO.lado < 10,
    `CONECTOR_PECHO.lado vale ${CONECTOR_PECHO.lado} y tiene que ser un % de la caja, no píxeles`
  );
});

prueba('cable: el resplandor del pulso se dibuja, no se difumina', () => {
  // ES LA MITAD QUE `shape-rendering` NO PUEDE CUIDAR. Los filtros se aplican
  // DESPUÉS del rasterizado y son ciegos a él: un `crispEdges` con un blur al
  // lado no cambia un solo píxel del halo. Por eso este guardián mira el filtro
  // y no el rendering.
  //
  // Medido con el blur puesto, en una caja de 28x28 alrededor de un pulso: 14
  // píxeles opacos y 440 parciales en 26 tonos.
  const pulso = bloqueEntre(CSS, '.pulso-cable {', '@keyframes viajar-pulso');
  verdadero(!/filter:/.test(pulso), 'volvió un filtro al pulso, y con él los píxeles parciales');
  verdadero(!/blur/.test(pulso), 'volvió un blur al pulso');

  // Y EL ANILLO ES PARTE DEL DIBUJO, no un adorno suelto: su radio sale del
  // mismo número que el núcleo, así que cambiar el radio los mueve a los dos.
  const UI = readFileSync(RAIZ + 'js/ui.js', 'utf8');
  verdadero(
    /r="\$\{radioPulso \+ PULSOS_CABLE\.anillo\}"/.test(UI),
    'el anillo tiene que derivar del radio del núcleo, o se despega al cambiarlo'
  );
  verdadero(Number.isInteger(PULSOS_CABLE.anillo), 'el anillo va en píxeles enteros');
});

prueba('cable: los filos son colores y no mezclas en vivo', () => {
  // LO QUE ESTE TEST CUIDA NO ES EL HEX: es que el hex SIGA SIENDO el resultado
  // de la mezcla de la que salió. Si mañana alguien retoca `brillo` o `color`
  // pensando que los filos lo siguen, esto se pone rojo y le dice el número.
  const canal = (h, i) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  const mezcla = (capa, fondo, alfa) =>
    '#' +
    [0, 1, 2]
      .map((i) => Math.round(canal(capa, i) * alfa + canal(fondo, i) * (1 - alfa)))
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('');

  igual(
    CABLE.filoArriba.toLowerCase(),
    mezcla(CABLE.brillo, CABLE.color, 0.55),
    'el filo de arriba tiene que ser el 55 % de `brillo` sobre `color`, resuelto'
  );
  igual(
    CABLE.filoAbajo.toLowerCase(),
    mezcla(CABLE.sombra, CABLE.color, 0.7),
    'el filo de abajo tiene que ser el 70 % de `sombra` sobre `color`, resuelto'
  );

  // Y que la hoja no vuelva a mezclar en vivo. Una opacidad en el filo devuelve
  // el defecto entero: el tono pasa a depender de qué haya debajo, y donde las
  // dos capas del cable se cruzan aparece un cuarto color.
  const filos = bloqueEntre(CSS, '.cable-filo-arriba,', '.cable-sombra-puerto');
  verdadero(!/opacity:/.test(filos), 'volvió una opacidad a los filos, y con ella la mezcla');
});

// ---- QUÉ ES UN DEGRADÉ Y QUÉ ES UNA BANDA ----
//
// Este guardián decía `!/gradient/` a secas y estuvo bien mientras la chapita fue
// un color plano. Cuando pasó a llevar el desgaste por filas —tres capas de un
// píxel, y la del medio partida— se puso rojo, y tenía razón EN LO QUE MIRABA:
// hay gradients en la regla. Lo que no sabía es que ninguno degrada.
//
// La diferencia, que es la que importa:
//
//   `linear-gradient(#c8781f, #e8a24a)`        una RAMPA. Entre las dos puntas
//                                              hay cien tonos que no están en la
//                                              paleta. Esto es lo prohibido.
//   `linear-gradient(#e8a24a 0 0)`             una BANDA de un solo color.
//   `repeating-linear-gradient(90deg,
//      #c8781f 0 22px, #0000 22px 23px)`       DOS BANDAS con el corte en un
//                                              píxel entero. Ningún tono medio.
//
// Lo que las separa, sintácticamente, es que cada parada de color declare un
// RANGO —dos posiciones— y no un punto. Una parada con dos posiciones pinta una
// banda maciza; dos paradas con un punto cada una interpolan entre ellas. Así
// que la regla queda: en la ficha, toda parada de color tiene que traer su rango.
//
// La razón de aflojar el guardián en vez de sacarlo: sin él, la próxima vez que
// alguien quiera "darle un poquito de volumen" a la chapita, un
// `linear-gradient(#e8a24a, #c8781f)` entra sin que nadie diga nada. Y esta es
// justamente la pieza que se rehizo tres veces por tener relieve.
function degradesBlandos(bloque) {
  const malos = [];

  for (const m of bloque.matchAll(/(?:repeating-)?(?:linear|radial|conic)-gradient\(/g)) {
    // El paréntesis de cierre se busca contando, no con un regex: adentro hay
    // `calc(...)` y un `[^)]*` cortaría en el primero.
    let prof = 0;
    let j = m.index + m[0].length - 1;
    for (; j < bloque.length; j++) {
      if (bloque[j] === '(') prof++;
      else if (bloque[j] === ')' && --prof === 0) break;
    }
    const dentro = bloque.slice(m.index + m[0].length, j);

    // Las paradas se separan por comas de PRIMER NIVEL: las de adentro de un
    // calc() no cuentan.
    const paradas = [];
    let buffer = '';
    prof = 0;
    for (const c of dentro) {
      if (c === '(') prof++;
      else if (c === ')') prof--;
      if (c === ',' && prof === 0) {
        paradas.push(buffer.trim());
        buffer = '';
      } else buffer += c;
    }
    paradas.push(buffer.trim());

    for (const parada of paradas) {
      // El ángulo o la forma no es una parada de color.
      if (/^(to\s|\d+deg|\d+turn|circle|ellipse|at\s)/.test(parada)) continue;
      if (!parada) continue;

      // Un color seguido de DOS posiciones. El color puede ser un var(), un hex
      // o un `#0000`; las posiciones, longitudes o calc().
      const posiciones = parada
        .replace(/^(?:var\(--[\w-]+\)|#[0-9a-fA-F]{3,8}|[a-z]+)/, '')
        .trim();
      const cuantas = posiciones ? partesDePrimerNivel(posiciones).length : 0;

      if (cuantas < 2) {
        malos.push(`${m[0]}…) tiene una parada sin rango: "${parada}"`);
      }
    }
  }

  return malos;
}

// Trocitos separados por espacios de primer nivel, para contar posiciones sin
// que un `calc(a - b)` cuente como tres.
function partesDePrimerNivel(texto) {
  const partes = [];
  let buffer = '';
  let prof = 0;
  for (const c of texto) {
    if (c === '(') prof++;
    else if (c === ')') prof--;
    if (/\s/.test(c) && prof === 0) {
      if (buffer) partes.push(buffer);
      buffer = '';
    } else buffer += c;
  }
  if (buffer) partes.push(buffer);
  return partes;
}

prueba('botonera: la ficha es plana — ni degradés, ni relieve, ni un blur en reposo', () => {
  // Un color por trazo y nada en el medio. Lo que cambió respecto de la versión
  // con caja: ANTES acá se prohibía `box-shadow` a secas, porque el único
  // box-shadow imaginable era un relieve. Ahora la chapita lleva uno —el píxel
  // negro de abajo, que es lo que la despega del piso claro— así que la
  // prohibición se corrió a lo que realmente rompe el dibujo:
  //
  //   NINGUNA sombra en reposo puede tener DIFUMINADO, y todos los
  //   corrimientos tienen que ser enteros.
  //
  // Una sombra de difuminado cero y corrimiento entero es la misma silueta
  // corrida un número entero de píxeles: no puede pintar un solo píxel parcial.
  // Un blur, sí — y ahí se va la fuente pixel, los cantos duros y los íconos de
  // 16 unidades, todos juntos.
  const bloque = bloqueEntre(CSS, '#acciones button {', '#acciones button::before');
  igual(
    degradesBlandos(bloque).join(' | '),
    '',
    'volvió un degradé a la ficha: dos colores que se cruzan en vez de dos bandas'
  );
  verdadero(!/color-mix/.test(bloque), 'volvió un tono mezclado en vez de uno de la paleta');

  const sombras = [...bloque.matchAll(/(?:box|text)-shadow:\s*([^;]+);/g)].flatMap((m) => sombrasDe(m[1]));
  verdadero(sombras.length >= 5, `el parser tiene que encontrar las sombras: encontró ${sombras.length}`);
  for (const l of sombras) {
    // Tres longitudes es `x y blur`; cuatro suma la expansión, que es la del
    // filo. Menos de tres es un var que no se resolvió y hay que resolverlo,
    // porque si no el número no se está mirando.
    verdadero(
      l.length === 3 || l.length === 4,
      `una sombra con ${l.length} longitudes: ${l.join(' ')} — ¿quedó un var() sin resolver?`
    );
    verdadero(l[2] === 0, `una sombra en reposo difumina ${l[2]}px, y eso saca los píxeles de la grilla`);
    verdadero(
      l.every(Number.isInteger),
      `una longitud fraccionaria en una sombra: ${l.join(' ')}`
    );
  }
});

prueba('botonera: el guardián del degradé se lo ve rojo con una rampa de verdad', () => {
  // 1. La rampa clásica, que es lo que este guardián existe para impedir.
  // Denuncia las DOS paradas, no la rampa como una sola cosa, y está bien así:
  // el mensaje nombra cada parada que le falta el rango, que es lo que hay que
  // arreglar. La primera versión de esta prueba esperaba una sola denuncia y se
  // puso roja — la prueba estaba mal, no el detector.
  const rampa = 'background-image: linear-gradient(#c8781f, #e8a24a);';
  verdadero(degradesBlandos(rampa).length === 2, `no vio la rampa: ${degradesBlandos(rampa)}`);

  // 2. La rampa disfrazada de porcentajes, que es como suele entrar.
  const disfrazada = 'background: linear-gradient(180deg, var(--boton-naranja) 0%, #e8a24a 100%);';
  verdadero(degradesBlandos(disfrazada).length === 2, 'dos paradas de un punto, dos denuncias');

  // 3. Y NO LADRA DONDE NO DEBE: las tres capas reales de la chapita, con sus
  //    calc() adentro, que es donde un parser ingenuo se rompe.
  const bandas =
    'background-image: linear-gradient(var(--chapita-luz) 0 0),' +
    'repeating-linear-gradient(90deg,' +
    ' var(--chapita-base) 0 calc(var(--p) - var(--h)),' +
    ' #0000 calc(var(--p) - var(--h)) var(--p)),' +
    'linear-gradient(var(--chapita-sombra) 0 0);';
  igual(degradesBlandos(bandas).join(' | '), '', 'las bandas macizas no son un degradé');
});

prueba('botonera: la ficha son dos trazos, y los dos caen en la grilla', () => {
  // ACÁ ESTABA EL TEST DE LA SOMBRA DE CONTACTO —"se queda, y sigue siendo
  // suave"— y se fue con ella. Lo que cuidaba era que nadie "terminara" el punto
  // 3 sacándole el degradé a la elipse y dejando la chapa flotando. Ya no hay
  // chapa que flote: hay una chapita arriba y un pie abajo, y lo que hay que
  // cuidar es otra cosa.
  //
  // Las dos se compararon con captura antes de decidir: ver
  // verificacion/botonera-chapita.html, punto c.
  const chapita = bloqueEntre(CSS, '#acciones button::after {', '#acciones button::before');
  const pie = bloqueEntre(CSS, '#acciones button::before {', '#acciones button svg');

  verdadero(/height:\s*var\(--boton-chapita-alto\)/.test(chapita), 'el alto de la chapita sale de config');

  // ARRIBA Y NO ABAJO: es una etiqueta, no un subrayado. Y no se prueba con
  // `top: 0` porque ya no vale cero — vale el filo, por lo de acá abajo.
  verdadero(/top:\s*var\(--boton-chapita-filo\)/.test(chapita), 'la chapita va ARRIBA');
  verdadero(!/bottom:/.test(chapita), 'si se ancla abajo vuelve a ser el canto de una caja');

  // EL FILO CRECE HACIA ADENTRO, Y ESTO ES LO QUE LO FIJA. El anillo de
  // `box-shadow` pinta 1 px por fuera de la caja del pseudo. Para que la silueta
  // exterior de la ficha no se mueva, la chapita arranca corrida ese mismo píxel
  // —`top: filo`— y su aire lateral lo lleva sumado —`inset + filo`—. Si alguien
  // devuelve el `top: 0`, la ficha empieza a pintar arriba del botón sin que
  // ningún test de área táctil se entere: el box-shadow no toca el layout.
  verdadero(
    /left:\s*calc\(var\(--boton-chapita-inset\) \+ var\(--boton-chapita-filo\)\)/.test(chapita),
    'el aire lateral tiene que llevar el filo sumado, o el anillo se sale para afuera'
  );
  verdadero(
    /box-shadow:\s*0 0 0 var\(--boton-chapita-filo\)/.test(chapita),
    'el filo va como EXPANSIÓN —0 0 0 N— que es lo único que da un píxel exacto en los cuatro lados'
  );
  verdadero(/bottom:\s*var\(--boton-pie-abajo\)/.test(pie), 'el pie va abajo, con su separación de config');
  verdadero(/left:\s*var\(--boton-pie-inset\)/.test(pie), 'y su aire lateral');
  verdadero(!/gradient|blur/.test(pie), 'el pie es una línea llena, no una mancha difusa');

  // TODO EN ENTEROS. Un pie de 1,5 px de alto son dos filas a medio pintar.
  const enteros = [
    ['chapita.alto', BOTONERA.chapita.alto],
    ['chapita.inset', BOTONERA.chapita.inset],
    ['chapita.filo', BOTONERA.chapita.filo],
    ['chapita.halo', BOTONERA.chapita.halo],
    ['pie.alto', BOTONERA.pie.alto],
    ['pie.inset', BOTONERA.pie.inset],
    ['pie.abajo', BOTONERA.pie.abajo]
  ];
  for (const [nombre, valor] of enteros) {
    verdadero(Number.isInteger(valor), `${nombre} vale ${valor} y tiene que ser un entero de píxeles`);
  }

  // Y EL PIE ES MÁS CORTO QUE LA CHAPITA. No es gusto: es lo que hace que la
  // pieza se lea apoyada en vez de simétrica. Si alguien iguala los dos insets,
  // quedan dos subrayados y se pierde el arriba y el abajo.
  verdadero(
    BOTONERA.pie.inset > BOTONERA.chapita.inset,
    `el pie tiene que ser más corto que la chapita: ${BOTONERA.pie.inset} contra ${BOTONERA.chapita.inset}`
  );
});

prueba('botonera: el área táctil no la paga la propuesta', () => {
  // ES LO ÚNICO QUE HOY FUNCIONA BIEN. Medido en el navegador antes y después,
  // a 390x844, los tres botones dan 114x48 en (16, 780), (138, 780) y (260, 780)
  // — idénticos al píxel. Ver verificacion/botonera-chapita.html, punto a.
  //
  // Lo que este test cuida es lo que hizo que siguieran iguales: que la caja
  // siga siendo `border-box` con el mismo ancho y alto declarados, y que ninguna
  // regla de estado le toque la geometría. Sacar el borde de 1 px NO mueve nada
  // con border-box; agregarle un padding, sí.
  const bloque = bloqueEntre(CSS, '#acciones button {', '#acciones button::after');
  verdadero(/box-sizing:\s*border-box/.test(bloque), 'sin border-box, sacar el borde encoge la caja');
  verdadero(/width:\s*var\(--boton-ancho\)/.test(bloque), 'el ancho lo sigue midiendo ui.js');
  verdadero(/height:\s*var\(--boton-alto\)/.test(bloque), 'y el alto sale del módulo de 8');

  // Ninguna regla de estado puede cambiar la caja: el botón apagado y el
  // apretado ocupan exactamente el mismo lugar. El viaje de 2 px del apretado va
  // por `transform`, que no reflowea.
  // EL LÍMITE VA A UN SELECTOR Y NO A UN COMENTARIO, y el primer intento usaba
  // un comentario: `CSS` acá viene con los comentarios YA SACADOS, así que el
  // indexOf daba −1, el slice se comía la hoja entera y el test denunciaba un
  // `width` que estaba a tres mil líneas de la botonera. Hoy eso lo atrapa
  // `bloqueEntre` sola: es la función que salió de este defecto.
  const desdeEstados = bloqueEntre(CSS, '#acciones button:active', '.evento {');
  for (const prohibida of ['width', 'height', 'padding', 'margin', 'inset']) {
    const re = new RegExp(`(^|[;{\\s])${prohibida}:`, 'm');
    verdadero(
      !re.test(desdeEstados),
      `una regla de estado declara ${prohibida} y eso mueve la caja del botón`
    );
  }

  // El alto sale de 6 unidades de 8, que son 48: arriba de los 44 del mínimo
  // táctil, y entero.
  const alto = BOTONERA.unidad * BOTONERA.altoEnUnidades;
  verdadero(alto >= 44, `el botón mide ${alto} px de alto y el mínimo táctil es 44`);
});

prueba('botonera: los íconos son píxeles y no trazos', () => {
  // Eran viewBox de 24x24 con stroke-width 1.8 y linecap round: trazos de ancho
  // fraccionario con puntas redondeadas. Ahora son <rect> sobre una grilla de
  // 16x16, mostrados a 16 px, o sea uno a uno.
  const botones = [...INDICE.matchAll(/<button id="btn-[\s\S]*?<\/button>/g)].map((m) => m[0]);
  igual(botones.length, 3, 'tienen que seguir siendo tres botones');

  for (const b of botones) {
    const vb = b.match(/viewBox="([^"]*)"/);
    verdadero(vb !== null, 'cada botón tiene su ícono');
    igual(vb[1], '0 0 16 16', 'la grilla del ícono es de 16 unidades');
    verdadero(!/stroke/.test(b), 'ningún stroke: todo tiene que ser relleno');
    verdadero(!/<path/.test(b), 'ningún path: sólo rectángulos enteros');
    verdadero(/<rect /.test(b), 'y tiene que tener rectángulos');
  }

  // EL LÍMITE ERA `.led {` Y EL LED YA NO EXISTE. Con la regla borrada el
  // indexOf daba −1, el slice se comía la hoja entera y el test pasaba porque
  // encontraba un `crispEdges` de otra pieza. Es la segunda vez que un corte
  // apunta a algo que se puede borrar; el límite ahora es el selector de la
  // regla siguiente, que si desaparece se lleva puesto el test en vez de
  // ablandarlo.
  const bloque = bloqueEntre(CSS, '#acciones button svg', '#acciones button:active');
  verdadero(/crispEdges/.test(bloque), 'el ícono necesita shape-rendering: crispEdges');
  igual(BOTONERA.icono % 16, 0, 'el tamaño en pantalla es un múltiplo entero de la grilla');
});

prueba('botonera: la fuente pixel se dibuja a un múltiplo entero de su nativo', () => {
  // Una fuente diseñada a 8 px se ve nítida a 8, 16 o 24. A 12 —lo que tenía
  // Arial— cada píxel de diseño mediría 1,5 y volvería el antialiasing que todo
  // este punto viene a sacar.
  igual(
    BOTONERA.fuente % FUENTE_BOTONERA.nativo,
    0,
    `${BOTONERA.fuente} px no es múltiplo de los ${FUENTE_BOTONERA.nativo} de diseño`
  );

  // Y el @font-face del CSS tiene que apuntar al mismo archivo que declara
  // config.js. La ruta va literal en la hoja porque @font-face se resuelve antes
  // de que exista ninguna custom property: es un carve-out, y como todos los
  // carve-outs de este proyecto lleva su cruce.
  const cara = bloqueEntre(CSS, '@font-face', '#acciones {');
  verdadero(cara.includes(FUENTE_BOTONERA.ruta), `el @font-face no apunta a ${FUENTE_BOTONERA.ruta}`);
  verdadero(
    cara.includes(FUENTE_BOTONERA.familia),
    'la familia del CSS y la de config tienen que coincidir'
  );
  verdadero(
    new RegExp('font-display:\\s*' + FUENTE_BOTONERA.display).test(cara),
    'font-display tiene que ser block: con swap las etiquetas saltan de forma'
  );
});

prueba('botonera: la fuente está en el repo y en ARCHIVOS_CACHE', () => {
  // Autohospedada: Chip funciona sin red y una fuente remota rompe eso. Y si no
  // estuviera en el caché, la primera apertura offline caería a la fuente de
  // reserva y las etiquetas cambiarían de forma.
  verdadero(!/https?:/.test(FUENTE_BOTONERA.ruta), 'la fuente no puede venir de un CDN');
  verdadero(existsSync(RAIZ + FUENTE_BOTONERA.ruta), `falta ${FUENTE_BOTONERA.ruta} en el repo`);
  verdadero(SW_BOTONERA.includes(FUENTE_BOTONERA.ruta), 'la fuente tiene que estar en ARCHIVOS_CACHE');
});

prueba('botonera: el ancho de las chapas se reparte en píxeles enteros', () => {
  // Punto 3.7. Era `flex: 1`, o sea un reparto en porcentaje: 30% sobre 390 px
  // son 117, y sobre 393 son 117,9. Ese decimal es medio píxel de borde borroso
  // en los dos cantos verticales de las tres chapas, en cualquier teléfono cuyo
  // ancho no sea múltiplo de tres.
  const bloque = bloqueEntre(CSS, '#acciones button {', '#acciones button::after');
  verdadero(!/flex:\s*1/.test(bloque), 'volvió el reparto por flex, que da decimales');
  verdadero(/width:\s*var\(--boton-ancho\)/.test(bloque), 'el ancho tiene que venir medido');
  verdadero(
    /Math\.floor/.test(UI_FUENTE) && /VARS_BOTONERA\.ancho/.test(UI_FUENTE),
    'ui.js tiene que redondear el ancho HACIA ABAJO antes de escribirlo'
  );
});

// ---- `hidden` contra `display`, que es una trampa del navegador ----
//
// `elemento.hidden = true` no esconde nada por sí solo: lo esconde la regla
// `[hidden] { display: none }` de la hoja del USER AGENT, y esa hoja pierde
// contra cualquier declaración de autor. O sea que un `display: grid` en
// style.css deja el `hidden` sin efecto, en silencio y sin consola.
//
// Ya había dos comentarios avisando —en #estado y en #eventos— y aun así volvió
// a pasar, porque la trampa no se dispara al escribir el hidden sino DESPUÉS,
// el día que alguien le agrega un display al elemento por otro motivo. En #piso
// el display llegó con la caja táctil de 44 px, meses después del hidden, y el
// resultado fue el bug de "la pieza vuela al estante y queda también en el
// piso": el nodo original nunca se escondía, así que la misma cosa quedaba en
// dos lugares.
//
// La disciplina se olvida; un test no. Este cruza los dos archivos: qué nodos
// esconde el JS con `.hidden`, y cuáles de esos tienen un `display` propio en el
// CSS sin la regla `[hidden]` que lo repita.
//
// El id tiene que ser el SUJETO de la regla y no un ancestro: `#rayo svg` le da
// display al svg, no a #rayo, y contarlo daría un falso positivo.

const SW_BOTONERA = readFileSync(RAIZ + 'sw.js', 'utf8');
const INDICE = readFileSync(RAIZ + 'index.html', 'utf8');
const UI_FUENTE = readFileSync(RAIZ + 'js/ui.js', 'utf8');
const MONTAJE_FUENTE = readFileSync(RAIZ + 'js/ui-montaje.js', 'utf8');
const FUENTE_VISTA = UI_FUENTE + '\n' + MONTAJE_FUENTE;

function nodosQueElJsEsconde() {
  const aId = new Map();
  const decl = /(?:const|let|var)\s+(\w+)\s*=\s*document\.getElementById\(\s*['"]([\w-]+)['"]/g;
  for (const m of FUENTE_VISTA.matchAll(decl)) aId.set(m[1], m[2]);

  const ids = new Set();
  for (const m of FUENTE_VISTA.matchAll(/(\w+)\.hidden\s*=/g)) {
    if (aId.has(m[1])) ids.add(aId.get(m[1]));
  }
  return [...ids].sort();
}

function reglasConDisplayPropio(id) {
  return [...CSS.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(([, sel, cuerpo]) => {
    if (/\[hidden\]/.test(sel)) return false;
    const sujetos = sel.split(',').map((s) => s.trim().split(/[\s>+~]+/).pop());
    if (!sujetos.some((s) => new RegExp('#' + id + '(?![\\w-])').test(s))) return false;
    const d = cuerpo.match(/(?:^|;)\s*display\s*:\s*([^;]+)/);
    return d && d[1].trim() !== 'none';
  });
}

prueba('hidden: todo nodo con display propio repite la regla [hidden]', () => {
  const faltan = nodosQueElJsEsconde().filter(
    (id) => reglasConDisplayPropio(id).length > 0 && !CSS.includes('#' + id + '[hidden]')
  );

  igual(
    faltan.map((id) => '#' + id).join(', '),
    '',
    'el JS los esconde con .hidden, el CSS les da display y nadie repite [hidden]: el hidden no hace nada'
  );
});

// La red del de arriba: si los dos parsers dejaran de encontrar cosas —porque
// cambió la forma de declarar los nodos, porque el CSS se reformateó— el filtro
// daría cero contra cero y pasaría en verde sin haber mirado nada.
prueba('hidden: los dos parsers encuentran algo', () => {
  const ids = nodosQueElJsEsconde();
  verdadero(ids.length >= 10, `sólo se encontraron ${ids.length} nodos que el JS esconde`);
  verdadero(
    reglasConDisplayPropio('piso').length > 0,
    '#piso tiene display: grid por la caja táctil, así que el parser de CSS tiene que verlo'
  );
  verdadero(
    reglasConDisplayPropio('rayo').length === 0,
    '#rayo no tiene display propio: el de `#rayo svg` es del svg y no puede contarse'
  );
});

// ---- La inercia de la antena ----
//
// El poste está PINTADO en el sprite y el bulbo va por código, así que todo
// ángulo que la antena gire de más respecto de la cabeza despega el bulbo de la
// punta del poste. Eso no es un efecto secundario que se pueda ignorar: es el
// límite duro de cuánta inercia se puede pedir, y la spec avisa que hay que
// mirarlo en el PICO de la oscilación y no en reposo.
//
// La cuenta, con los números medidos sobre idle-cabeza.webp:
//
//   el bulbo está a 28 px del pivote sobre el lienzo de 256
//   28 x sen(1°) = 0,49 px de lienzo por grado
//   el lienzo se dibuja a 416, o sea x1,625  ->  0,79 px de pantalla por grado
//   el poste mide 10 px de lienzo = 16,25 px de pantalla
//
// El techo es que el bulbo no se corra más de un TERCIO del ancho del poste.
// Más que eso y deja de leerse como una antena que oscila: se lee como el bulbo
// despegado, que es exactamente lo que ya pasó una vez con la cabeza y quedó
// anotado en index.html.
prueba('antena: la inercia no despega el bulbo del poste', () => {
  const PX_POR_GRADO = (28 * Math.sin(Math.PI / 180) * 416) / 256;
  const ANCHO_POSTE = (10 * 416) / 256;

  const maximo = Math.max(
    Math.abs(ANTENA_INERCIA.extra),
    Math.abs(ANTENA_INERCIA.atraso),
    Math.abs(ANTENA_INERCIA.sobrepaso),
    ...ANTENA_INERCIA.rebote.map(Math.abs)
  );
  const grados = maximo * INCLINACION_CABEZA.angulo;
  const corrimiento = grados * PX_POR_GRADO;

  verdadero(
    corrimiento < ANCHO_POSTE / 3,
    `el residuo máximo son ${grados.toFixed(2)}°, o sea ${corrimiento.toFixed(2)} px de despegue, y el poste mide ${ANCHO_POSTE.toFixed(1)} px`
  );
});

// El rebote ES un resorte amortiguado, y eso quiere decir dos cosas concretas:
// pasa de largo para los dos lados y cada pasada es más chica. Sin las dos, la
// vuelta deja de leerse como masa y pasa a leerse como un temblor.
prueba('antena: el rebote alterna de signo y se apaga', () => {
  const r = ANTENA_INERCIA.rebote;
  verdadero(r.length >= 2, `hacen falta al menos dos pasadas y hay ${r.length}`);

  for (let i = 1; i < r.length; i++) {
    verdadero(
      r[i] * r[i - 1] < 0,
      `la pasada ${i + 1} tiene que cambiar de signo: ${r[i - 1]} y después ${r[i]}`
    );
    verdadero(
      Math.abs(r[i]) < Math.abs(r[i - 1]),
      `la pasada ${i + 1} tiene que ser más chica: ${Math.abs(r[i - 1])} y después ${Math.abs(r[i])}`
    );
  }
});

// Y el arranque va con el signo CONTRARIO al del sostén: la antena sale atrás
// de la cabeza. Si arrancara del mismo lado, el retraso no se leería como masa
// sino como que la antena llega tarde.
prueba('antena: sale atrás de la cabeza y después la pasa', () => {
  verdadero(
    ANTENA_INERCIA.atraso * ANTENA_INERCIA.extra < 0,
    `atraso ${ANTENA_INERCIA.atraso} y extra ${ANTENA_INERCIA.extra} tienen que ser de signo contrario`
  );
  verdadero(
    ANTENA_INERCIA.sobrepaso > ANTENA_INERCIA.extra,
    'la antena pasa de largo antes de acomodarse en su ángulo de sostén'
  );
});

// ---- El rayo del pecho cuenta la carga ----
//
// Latía igual con la batería en 90 que en 45. Ahora el ritmo sale del stat, y
// lo que estas pruebas fijan es que la tabla siga siendo una escalera completa
// y que apunte para el lado correcto.

prueba('rayo: las bandas cubren toda la batería, sin huecos', () => {
  // Se recorre de arriba hacia abajo y gana la primera que entra, así que tienen
  // que estar ordenadas y la última tiene que ser 0. Sin eso hay un valor de
  // batería para el que `find` no devuelve nada y el rayo se queda sin ritmo.
  for (let i = 1; i < RITMOS_RAYO.length; i++) {
    verdadero(
      RITMOS_RAYO[i].desde < RITMOS_RAYO[i - 1].desde,
      `la banda ${i + 1} arranca en ${RITMOS_RAYO[i].desde} y la anterior en ${RITMOS_RAYO[i - 1].desde}`
    );
  }
  igual(RITMOS_RAYO.at(-1).desde, 0, 'la última banda tiene que llegar hasta 0');
});

prueba('rayo: con menos carga late más rápido y más débil', () => {
  // Es la dirección entera del efecto: si alguien invierte los números, el rayo
  // sigue latiendo y sigue cambiando con la batería, pero pasa a decir lo
  // contrario de lo que pasa. No se ve mirando — se ve leyendo la tabla.
  for (let i = 1; i < RITMOS_RAYO.length; i++) {
    const alta = RITMOS_RAYO[i - 1];
    const baja = RITMOS_RAYO[i];
    verdadero(baja.ciclo < alta.ciclo, `ciclo: ${baja.ciclo} tiene que ser menor que ${alta.ciclo}`);
    verdadero(baja.pico < alta.pico, `pico: ${baja.pico} tiene que ser menor que ${alta.pico}`);
    verdadero(baja.piso < alta.piso, `piso: ${baja.piso} tiene que ser menor que ${alta.piso}`);
  }
});

prueba('rayo: la banda de abajo no le pisa el trabajo a critico', () => {
  // `critico` tiene su propio keyframe irregular y entra abajo de su umbral. La
  // banda de abajo de esta tabla lo cubre por número, pero la regla de estado le
  // gana en el CSS. Lo que no puede pasar es que alguien meta acá una tercera
  // banda que ARRANQUE abajo del umbral: sería un segundo sistema contando lo
  // mismo, y los dos se desincronizan la primera vez que se mueve el umbral.
  const debajo = RITMOS_RAYO.filter((r) => r.desde > 0 && r.desde < UMBRAL_CRITICO_BATERIA);
  igual(
    debajo.map((r) => r.desde).join(', '),
    '',
    `ninguna banda puede arrancar abajo de UMBRAL_CRITICO_BATERIA (${UMBRAL_CRITICO_BATERIA})`
  );

  verdadero(
    /\.estado-critico #rayo/.test(CSS),
    'y la regla de critico tiene que seguir existiendo, que es quien cuenta esa banda'
  );
});

// ---- El color del arranque, que vive en cinco lugares ----
//
// La cadena es: splash del sistema -> primer frame -> velo de #apertura ->
// escena. Cualquier cuadro de otro color en el medio es una costura que se ve, y
// eran TRES colores distintos para lo mismo.
//
// Ninguno de los cinco puede leer el valor de los otros: los cuatro primeros
// tienen que existir antes de que exista el JS. O sea que la única forma de que
// no se separen es un test que los mire a todos.
//
// El <style> inline además tiene que ir ANTES del <link>: si va después, el
// navegador ya bloqueó el primer pintado esperando la hoja y el inline no llega
// a tiempo — que es todo el punto de tenerlo.

const MANIFEST = JSON.parse(readFileSync(RAIZ + 'manifest.json', 'utf8'));

prueba('arranque: los cinco lugares dicen el mismo color', () => {
  const inline = HTML.match(/<style>html,body\{background:(#[0-9a-f]{6});/i)?.[1];
  const meta = HTML.match(/<meta name="theme-color" content="(#[0-9a-f]{6})"/i)?.[1];

  const lugares = {
    'manifest background_color': MANIFEST.background_color,
    'manifest theme_color': MANIFEST.theme_color,
    'index <meta theme-color>': meta,
    'index <style> inline': inline,
    'config COLOR_APERTURA': COLOR_APERTURA
  };

  const distintos = [...new Set(Object.values(lugares))];
  igual(
    distintos.length,
    1,
    'el color del arranque tiene que ser uno: ' +
      Object.entries(lugares).map(([d, v]) => `${d}=${v}`).join(', ')
  );
});

prueba('arranque: el <style> inline va antes del <link> de la hoja', () => {
  const iStyle = HTML.indexOf('<style>html,body{');
  const iLink = HTML.indexOf('<link rel="stylesheet"');

  verdadero(iStyle >= 0, 'tiene que haber un <style> inline con el fondo');
  verdadero(iLink >= 0, 'y el <link> de style.css');
  verdadero(
    iStyle < iLink,
    'el inline después del link no sirve: el link ya bloqueó el primer pintado'
  );
});

// ---- El panel de debug no puede tapar la escena ----
//
// A 390 px de ancho ocupaba de x=172 a x=382 y de y=8 a y=587: la mitad derecha
// de la pantalla, encima de Chip, con pointer-events auto. Abrir el juego con
// ?debug=1 en un teléfono dejaba media escena sin poder tocar — y fue lo que
// hizo que la caricia "no funcionara" al probarla.
//
// Y no tenía id ni clase, así que tampoco había forma de apuntarle desde acá
// para denunciarlo.
//
// debug.js no se puede importar en Node —arma su subárbol contra el DOM— así que
// se lee como texto, igual que ui.js en el test de los gestos. Lo que se fija es
// lo que se pierde al reescribirlo: que tenga id y que arranque CERRADO.

const DEBUG_JS = readFileSync(RAIZ + 'js/debug.js', 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/.*$/gm, '');

prueba('debug: el panel tiene id, para poder apuntarle', () => {
  verdadero(
    /panel\.id = '[\w-]+'/.test(DEBUG_JS),
    'sin id no hay forma de encontrarlo desde un test ni desde una regla'
  );
});

prueba('debug: el panel arranca plegado', () => {
  // Es el arreglo entero: un panel de desarrollo no puede decidir por su cuenta
  // taparle media escena a quien abrió el juego. Si alguien lo deja abierto por
  // default, vuelve el bug.
  verdadero(/let abierto = false;/.test(DEBUG_JS), 'el estado inicial tiene que ser cerrado');
  verdadero(
    /cuerpo\.style\.display = abierto \? 'flex' : 'none';/.test(DEBUG_JS),
    'y el cuerpo tiene que estar escondido mientras esté plegado'
  );
});

prueba('debug: en pantalla angosta el panel se va abajo', () => {
  // Desplegado al costado, en un teléfono, vuelve a estar encima de Chip. Abajo
  // está la botonera, que también molesta, pero se cierra tocando la manija —
  // que es lo que hace que la posición deje de ser un problema irreversible.
  verdadero(
    typeof PANEL_DEBUG.anchoAngosto === 'number' && PANEL_DEBUG.anchoAngosto > 400,
    `anchoAngosto tiene que ser un ancho de viewport, y es ${PANEL_DEBUG.anchoAngosto}`
  );
  verdadero(
    /window\.innerWidth < PANEL_DEBUG\.anchoAngosto/.test(DEBUG_JS),
    'y debug.js tiene que consultarlo'
  );
});

// ---- IDs únicos ----
//
// Había DOS `<linearGradient id="repisa-caida">` en el mismo documento, uno por
// tabla, porque el SVG de la repisa se inyecta una vez por nivel con el id
// escrito a mano. `url(#repisa-caida)` resuelve SIEMPRE al primero, así que la
// segunda tabla se pintaba con el gradiente de la primera.
//
// No se veía nada porque los dos tenían los mismos stops. El día que uno
// necesitara otro valor, el cambio no iba a tener efecto y no iba a haber error
// en ninguna parte: falla en silencio y a destiempo, como las otras tres de esa
// familia.
//
// El test que pide la spec es sobre el DOM vivo, y esa comprobación no se puede
// hacer desde Node. Lo que sí se puede es cubrir las dos fuentes de ids que hay:
// los estáticos del HTML y los que dibuja formas.js. Entre las dos está todo.

const HTML = readFileSync(RAIZ + 'index.html', 'utf8');

prueba('ids: los del index no se repiten', () => {
  const ids = [...HTML.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const repetidos = ids.filter((id, i) => ids.indexOf(id) !== i);
  igual([...new Set(repetidos)].join(', '), '', 'ids repetidos en index.html');
  verdadero(ids.length > 30, `sólo se encontraron ${ids.length} ids, el parser no está mirando`);
});

prueba('ids: cada tabla de la repisa trae su propio gradiente', () => {
  const cero = svgDeRepisa(0);
  const uno = svgDeRepisa(1);

  const idsDe = (svg) => [...svg.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
  const refsDe = (svg) => [...svg.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1]);

  verdadero(idsDe(cero).length > 0, 'el SVG de la repisa tiene que declarar algún id');
  igual(
    idsDe(cero).filter((id) => idsDe(uno).includes(id)).join(', '),
    '',
    'dos tablas no pueden compartir un id: el segundo gradiente no se aplica nunca'
  );

  // Y que cada referencia caiga en un id de SU PROPIO svg. Un id parametrizado
  // con la referencia escrita a mano sería el mismo bug con más pasos.
  for (const [nivel, svg] of [[0, cero], [1, uno]]) {
    const sueltas = refsDe(svg).filter((r) => !idsDe(svg).includes(r));
    igual(sueltas.join(', '), '', `nivel ${nivel}: referencias url(#...) sin id en el mismo svg`);
  }
});

// ---- LOS OJOS: UNA SOLA CAPA DE CREMA ENCENDIDA A LA VEZ ----
//
// El punto 17. Damián: "en idle y feliz se siguen viendo las capas en los ojos,
// hay varios bordes. Deberían llegar a lo gris."
//
// Medido en el navegador, con la transición desactivada para leer el estado
// final: en el cierre completo quedaban CUATRO superficies de crema en opacidad
// 1 al mismo tiempo —#parpado, #ojos, ojos-contento y ojos-cerrado—. Cada
// recorte trae su propio aro oscuro pintado adentro de la cuenca, y cada uno va
// a una escala distinta: cuatro capas encendidas son cuatro aros concéntricos.
//
// POR QUÉ ESTO SE VERIFICA EN UN TEST Y NO MIRANDO. Lo que hace que el arreglo
// funcione no es el valor sino el ORDEN: las reglas que apagan tienen la MISMA
// especificidad que las que encienden —dos ids y una clase— así que ganan sólo
// por venir después. Alguien reordenando el archivo, o agrupando selectores
// parecidos, deshace el arreglo sin tocar un solo valor y sin que nada se queje.
// Eso no se ve en una captura: se ve acá.

const ORDEN_OJOS = (() => {
  const posicion = (fragmento) => CSS.indexOf(fragmento);
  return {
    enciendeGesto: posicion('#chip.ojos-contento #ojos-contento-izq'),
    apagaOjos: posicion('#chip.ojos-contento #ojos'),
    apagaContento: posicion('#chip.ojos-cerrado #ojos-contento-izq')
  };
})();

prueba('ojos: encender una capa apaga la de abajo, y no la suma', () => {
  verdadero(
    ORDEN_OJOS.apagaOjos > 0,
    'falta la regla que apaga #ojos cuando entra el gesto: sin ella son dos cremas'
  );
  verdadero(
    ORDEN_OJOS.apagaContento > 0,
    'falta la regla que apaga `contento` cuando entra `cerrado`: sin ella son tres'
  );
});

prueba('ojos: las reglas que apagan ganan por especificidad, no por orden', () => {
  // La primera versión dependía del ORDEN: mismos dos ids y una clase que las
  // reglas que encienden, así que ganaban sólo por venir después. Eso se rompe
  // solo: alguien reordena el archivo o agrupa dos selectores parecidos, y el
  // cruce vuelve a sumar sin que se toque un valor y sin que nada avise.
  //
  // Con `.ojos-gesto` en el objetivo son dos ids y DOS clases: ganan estén donde
  // estén. Se verifica la especificidad y no la posición, porque la posición era
  // justamente la parte frágil.
  for (const lado of ['izq', 'der']) {
    verdadero(
      CSS.includes(`#chip.ojos-cerrado #ojos-contento-${lado}.ojos-gesto`),
      `la regla que apaga contento-${lado} tiene que llevar .ojos-gesto: sin eso empata ` +
        'con la que lo enciende y gana la que esté más abajo'
    );
  }
});

prueba('ojos: las cuatro capas del ojo comparten el filtrado', () => {
  // #parpado era la única sin `pixelated` —medido: `auto` contra `pixelated` en
  // las otras tres—. Su máscara es el mismo .webp de 256 escalado a la caja de
  // Chip, así que sin esto su borde se interpola y el de las capas de encima no:
  // dos bordes con distinta dureza en el mismo lugar.
  const bloque = bloqueEntre(CSS, '#parpado {', '#parpado[hidden]');
  verdadero(
    /image-rendering:\s*pixelated/.test(bloque),
    '#parpado tiene que filtrar igual que #ojos y que las capas de gesto'
  );
});

// ---- EL PIXEL ART CORTA, NO DISUELVE ----
//
// ACÁ HUBO DOS TESTS SEGUIDOS QUE PEDÍAN LO CONTRARIO DE LO QUE PIDE ÉSTE, y la
// historia completa vale más que el test:
//
// 1. El primero buscaba el texto `transition: opacity var(--ojos-cruce)` y ahí
//    estaba, escrito tal cual — pero otra regla más específica lo reseteaba.
//    Miraba la DECLARACIÓN; el navegador aplica el VALOR CALCULADO. Verde con el
//    defecto vivo.
// 2. El segundo, después del arreglo, exigía que #ojos declarara `opacity` en su
//    transition-property, para que el cruce existiera de verdad. Ése medía bien:
//    la suma de opacidades daba 1,00 en todos los cuadros y el salto máximo era
//    0,19.
//
// Y EL CRUCE SEGUÍA ESTANDO MAL, porque el defecto no era el valor: era la
// técnica. Dos dibujos de pixel art al 50% cada uno dan una mancha translúcida
// con colores que ningún dibujante puso. Un cuadro del medio, capturado a 3x,
// alcanzó para verlo; ninguna medición de los extremos lo iba a mostrar nunca.
//
// Así que el cambio de cara es un CORTE de un cuadro y este test prohíbe la
// disolvencia. Las capas de ojo son cuatro dibujos apilados: se reemplazan, no
// se mezclan.
//
// `translate` sí transiciona, y no es lo mismo — mover un dibujo entero adentro
// de su cuenca no inventa ningún color.
prueba('ojos: el cambio de cara es un corte y no una disolvencia', () => {
  const bloques = {
    '#ojos': bloqueEntre(CSS, '#ojos {', '#ojos[hidden]'),
    '.ojos-gesto': bloqueEntre(CSS, '.ojos-gesto {', '.ojos-gesto[hidden]')
  };

  for (const [nombre, bloque] of Object.entries(bloques)) {
    verdadero(bloque.length > 0, `no se pudo aislar el bloque de ${nombre}`);

    const propiedades = bloque.match(/transition-property\s*:\s*([^;]+)/);
    verdadero(
      !/(?:^|;)\s*transition\s*:/.test(bloque),
      `${nombre} no puede usar el shorthand \`transition\`: es la regla de los shorthands`
    );
    verdadero(
      !propiedades || !/\bopacity\b/.test(propiedades[1]),
      `${nombre} transiciona \`opacity\`, o sea que dos dibujos se mezclan en el medio. ` +
        'El pixel art corta: la capa nueva reemplaza a la vieja en un cuadro.'
    );
  }

  // Y la otra mitad: el translate de la mirada TIENE que seguir transicionando,
  // porque sacar la disolvencia no puede llevarse puesto el movimiento.
  verdadero(
    /transition-property\s*:\s*translate\s*;/.test(bloques['#ojos']),
    'la mirada distraída necesita que #ojos transicione `translate`'
  );
});

// ---- LAS DOS CAPAS DEL CABLE SE MUEVEN JUNTAS ----
//
// El cable se dibuja en DOS nodos: #cable adelante y #cable-atras detrás del
// sprite. Los dos corren el mismo balanceo. Si el bloque de movimiento reducido
// apaga uno y no el otro, media pieza se queda quieta y la otra media sigue
// colgando, que es peor que las dos moviéndose — y el corte entre las dos se
// abre y se cierra en cada vuelta.
//
// Estuvo así: la lista decía `#cable path` y nada más.
prueba('movimiento reducido: apaga las dos capas del cable, no una', () => {
  // ESTE CORTE ES ABIERTO A PROPÓSITO Y LLEVA SU RED APARTE. Lo que se busca es
  // "aparece el selector en algún lado del bloque de movimiento reducido", y el
  // bloque es lo último de la hoja: no hay un ancla de fin que no sea el fin del
  // archivo. Así que no puede usar `bloqueEntre`, y a cambio lleva las dos
  // comprobaciones que aquélla haría: que el ancla exista, y un tope. Un corte
  // abierto sin tope es el mismo defecto de siempre con otra cara — si alguien
  // borrara el @media, el `indexOf` daría −1, el slice devolvería la hoja entera
  // y el test seguiría verde encontrando `#cable` en su propia regla.
  const arranque = CSS.indexOf('@media (prefers-reduced-motion');
  verdadero(arranque >= 0, 'no existe el bloque de movimiento reducido');
  const bloque = CSS.slice(arranque);
  verdadero(
    bloque.length < 12000,
    `el bloque de movimiento reducido mide ${bloque.length} y eso es más hoja de la que hay ahí`
  );
  const hasta = bloque.indexOf('animation: none;');
  const lista = bloque.slice(0, hasta);

  verdadero(/#cable path/.test(lista), 'falta la capa de adelante');
  verdadero(/#cable-atras path/.test(lista), 'falta la capa de atrás, que es la que sube al toma');
});

// ---- LA PUERTA DE SERVICIO NO ARRANCA PEGADA AL CANTO ----
//
// Cinco toques en la esquina abren el panel de debug, que en la app instalada es
// la única forma de llegar. Estaba en el vértice exacto del área segura, y esa
// franja es la menos confiable de un teléfono: ahí viven el barrido del sistema,
// la barra de estado y la curva de la pantalla. Un toque que se traga cualquiera
// de los tres se ve, desde el JS, igual que un toque que nunca pasó.
prueba('debug: la puerta de servicio entra desde el borde del área segura', () => {
  const bloque = bloqueEntre(CSS, '#puerta-servicio {', '#puerta-servicio::after');
  verdadero(
    /top:\s*calc\(env\(safe-area-inset-top[^)]*\)[^)]*\+\s*var\(--margen-debug\)\)/.test(bloque),
    'la puerta tiene que separarse del canto de arriba'
  );
  verdadero(
    /left:\s*calc\(env\(safe-area-inset-left[^)]*\)[^)]*\+\s*var\(--margen-debug\)\)/.test(bloque),
    'y del canto de la izquierda'
  );
});

prueba('debug: el gesto acusa recibo, o un fallo es indistinguible de un no-toque', () => {
  // Cinco toques que no abrían nada eran indistinguibles de cinco toques que no
  // se registraron, y en un teléfono no hay consola para desempatar entre los
  // tres candidatos: la puntería, la ventana de 2 s, o que debug.js no bajó.
  verdadero(/#puerta-servicio::after/.test(CSS), 'falta la marca del acuse');
  verdadero(/#puerta-servicio\.abriendo::after/.test(CSS), 'falta el aviso del quinto toque');
  verdadero(/#puerta-servicio\.fallo::after/.test(CSS), 'falta el aviso de que la descarga falló');
  verdadero(
    /marcarDebugFallido/.test(UI_FUENTE),
    'ui.js tiene que poder marcar el fallo de la descarga'
  );
});

// ---- EL SHORTHAND `transition`, que es la misma trampa que `animation` ----
//
// "Los ojos se salen de la órbita." El defecto que reportó Damián, y el
// mecanismo es este renglón:
//
//   #ojos            { transition: opacity  … }   <- un id
//   #cabeza-grupo #ojos { transition: translate … }   <- DOS ids, gana
//
// El segundo no agrega el translate: RESETEA la familia entera y deja
// transition-property en `translate` solo. El cruce de opacidad de los ojos
// —que es lo que hace que las capas de gesto entren y salgan sin pisarse— se
// murió en silencio, sin consola, sin test rojo, y con las dos reglas leyéndose
// perfectamente bien por separado.
//
// El síntoma: #ojos saltaba de 0 a 1 sin transición mientras la capa de gesto
// —corrida arriba y a la derecha, porque es un recorte de otra pose— todavía se
// apagaba. 260 ms con dos ojos dibujados en dos lugares.
//
// Es la CUARTA mordida de la regla de los shorthands del README: tres veces
// `animation` pisando `animation-delay`, y ésta. Distinta propiedad, misma
// trampa, y por eso la regla dejó de estar escrita para `animation` y pasó a
// valer para cualquier shorthand — todos resetean su familia entera.
//
// Ésta tardó una sesión entera en aparecer porque las dos reglas las escribieron
// dos puntos distintos de la spec —el 17 el cruce, el 6 la mirada— con un commit
// de diferencia.
//
// ESTE TEST NO COMPRUEBA UN VALOR, PROHÍBE UNA CONSTRUCCIÓN, y la diferencia es
// el motivo de que exista: el test que ya había buscaba el texto
// `transition: opacity var(--ojos-cruce)` y ahí estaba, escrito tal cual,
// mientras el defecto corría. Un grep sobre la hoja no puede resolver la
// cascada — mira la declaración, y el navegador aplica el valor calculado. Lo
// que sí se puede prohibir es dejar el valor a merced de la especificidad.
//
// QUÉ SE PROHÍBE, exactamente: que dos reglas con el MISMO sujeto usen el
// shorthand `transition` declarando propiedades DISTINTAS. Que lo usen las dos
// para la misma propiedad no rompe nada —es lo que hace #cabeza-grupo con
// `rotate` en sus tres reglas— porque el reset no se lleva puesto a nadie.

// ---- EL AGUJERO QUE TENÍA LA PRIMERA VERSIÓN DE ESTE GUARDIÁN ----
//
// La primera versión comparaba SHORTHAND CONTRA SHORTHAND: pedía que dos reglas
// del mismo sujeto usaran `transition:` con propiedades distintas.
//
// Esa forma dejó de existir en el archivo EN EL MISMO COMMIT que escribió el
// guardián, porque el arreglo pasó #ojos a longhands. O sea que el guardián
// quedó cuidando una forma de código que ya no está. La reincidencia iba a
// entrar por la otra: base en longhands y UNA sola regla más específica con el
// shorthand — que es exactamente el defecto de Damián, y pasaba verde.
//
// Reproducido: devolviendo `transition: translate …` a
// `#cabeza-grupo.distraida #ojos` sobre el commit del arreglo, el suite daba
// 314 en verde con el defecto vivo y medible en el navegador.
//
// LA REGLA QUE FALTABA, que es la inversa y la que se hace cumplir acá:
//
//   si un sujeto declara un longhand de una familia en CUALQUIER regla,
//   ninguna otra regla de igual o mayor especificidad puede usar el SHORTHAND
//   de esa familia sobre ese mismo sujeto.
//
// Y la lección, que vale más que el renglón: UN GUARDIÁN ESCRITO CONTRA EL BUG
// QUE YA PASÓ CUIDA LA FORMA VIEJA DEL CÓDIGO. El arreglo cambia la forma. Por
// eso los tres tests de abajo no se conforman con que la hoja esté limpia: le
// meten el defecto a un CSS de mentira y exigen que el guardián se ponga ROJO.
// Verde no prueba nada hasta que se lo vio rojo.

// Las dos familias que ya mordieron. `animation` va porque la regla del README
// vale para cualquier shorthand y el test se había quedado en `transition`.
const FAMILIAS_SHORTHAND = {
  transition: [
    'transition-property', 'transition-duration',
    'transition-timing-function', 'transition-delay', 'transition-behavior'
  ],
  animation: [
    'animation-name', 'animation-duration', 'animation-timing-function',
    'animation-delay', 'animation-iteration-count', 'animation-direction',
    'animation-fill-mode', 'animation-play-state', 'animation-composition',
    'animation-timeline', 'animation-range'
  ]
};

// EL COMPUESTO FINAL de un selector: lo último, que es lo que el selector
// realmente apunta. `#cabeza-grupo.distraida #ojos` apunta a `#ojos`.
const compuestoFinalDe = (selector) =>
  selector.trim().split(/[\s>+~]+/).filter(Boolean).at(-1) ?? '';

// EL SUJETO: el compuesto final reducido a una clave, para que dos selectores
// que apuntan al mismo elemento caigan en la misma bolsa.
//
//   `#cabeza-grupo.distraida #ojos` y `#ojos`      ->  #ojos
//   `.estado-standby .zeta` y `.zeta:nth-child(2)` ->  .zeta
//   `#puerta-servicio::after`                      ->  #puerta-servicio::after
//
// LAS PSEUDO-CLASES SE SACAN Y EL PSEUDO-ELEMENTO SE QUEDA, y las dos mitades
// costaron un bug cada una:
//
// - Con las pseudo-clases adentro, `.zeta:nth-child(2)` y `.zeta` caían en
//   bolsas distintas y no se comparaban nunca — o sea que la familia
//   `animation`, la que mordió tres veces, se colaba igual. Son el mismo
//   elemento: la pseudo-clase filtra cuáles, no cambia la caja.
//
// - Con el pseudo-elemento sacado, `#x::after` y `#x` caían en la MISMA bolsa, y
//   eso es un falso positivo: un pseudo-elemento es OTRA CAJA y no comparte
//   cascada con su elemento, así que un shorthand en una no le resetea nada a la
//   otra. Bloqueaba un cambio legítimo — darle una transición propia a
//   #puerta-servicio ponía el guardián en rojo.
//
// La primera versión de esto TENÍA el ternario
// `coincidencia.startsWith(':') ? '' : coincidencia`, que parece distinguir los
// dos casos y no distingue nada: '::after'.startsWith(':') es `true`, así que la
// rama derecha no corría nunca. El comentario de al lado describía la intención
// y no la conducta, así que leerlo confirmaba el error. Ver la regla del README:
// una condición que siempre da lo mismo se lee como una decisión y no lo es.
function sujetoDe(selector) {
  const compuesto = compuestoFinalDe(selector);
  const pseudo = compuesto.match(/::[\w-]+/)?.[0] ?? '';
  const sinPseudo = compuesto.replace(/::?[\w-]+(\([^()]*\))?/g, '');
  const id = sinPseudo.match(/#[\w-]+/);
  return (id ? id[0] : sinPseudo) + pseudo;
}

// ---- EL SEGUNDO PASE: `.a.b` CONTRA `.a` ----
//
// La clave de arriba no ve este par —son dos claves distintas— y el hueco es
// real: `.objeto` con `.objeto.volando`, `.objeto.llegando` y `.objeto.en-piso`
// ya existe en la hoja. Hoy ninguna declara longhands, pero es exactamente la
// forma que va a tener el día que alguien quiera desfasar la llegada.
//
// LA REGLA ES ANGOSTA A PROPÓSITO, Y EL ANCHO SE DESCARTÓ CON EL NÚMERO:
//
//   comparar por conjuntos de clases, suelto      975 hallazgos, todos ruido
//   idem exigiendo ids iguales                    145 hallazgos, todos ruido
//   puras clases y contención estricta              0 hallazgos
//
// El ruido sale siempre de lo mismo: un compuesto final SIN restricción de
// clases contiene a todos los demás. `#antena` contra `.banda.deformable`, un
// `svg` pelado contra media hoja, `body.sin-movimiento *` contra todo.
//
// Así que se comparan dos compuestos sólo si los DOS son de puras clases —sin
// id, sin tipo de elemento, sin `*`, sin atributo, y con el mismo
// pseudo-elemento— y uno contiene ESTRICTAMENTE al otro. Ahí la contención es
// exacta y no hay ningún "podría tener cualquier clase" de por medio: todo
// elemento que matchea `.a.b` matchea `.a`.
//
// Es un pase que SE SUMA a la clave por id, no la reemplaza.
function clasesPurasDe(selector) {
  const compuesto = compuestoFinalDe(selector);
  const pseudo = compuesto.match(/::[\w-]+/)?.[0] ?? '';
  const sinPseudo = compuesto.replace(/::?[\w-]+(\([^()]*\))?/g, '');
  if (!/^(\.[\w-]+)+$/.test(sinPseudo)) return null;
  return { pseudo, clases: new Set(sinPseudo.match(/\.[\w-]+/g)) };
}

const contieneEstrictamente = (grande, chico) =>
  grande.size > chico.size && [...chico].every((c) => grande.has(c));

// ¿Estos dos compuestos de puras clases se superponen de forma comprobable?
function seSuperponenPorClases(a, b) {
  const ca = clasesPurasDe(a);
  const cb = clasesPurasDe(b);
  if (!ca || !cb || ca.pseudo !== cb.pseudo) return false;
  return contieneEstrictamente(ca.clases, cb.clases) || contieneEstrictamente(cb.clases, ca.clases);
}

// ---- LA ESPECIFICIDAD ----
//
// (ids, clases, elementos). Alcanza para lo único que se le pide: comparar
// quién le gana a quién.
//
// APROXIMACIONES, dichas en voz alta, porque un cálculo completo es un parser
// de selectores entero y esta hoja no lo necesita:
//   - `:where(…)` no aporta nada: se saca.
//   - `:is()`, `:not()` y `:has()` aportan lo de su argumento. Con una LISTA de
//     argumentos habría que tomar el más específico; acá se toman todos, que
//     sobreestima. No hay ninguno con lista en la hoja.
//   - el resto de las funcionales —`:nth-child(2n+1)`— cuentan como una
//     pseudo-clase y su argumento no aporta.
//
// El test `especificidad: el cálculo da lo mismo que la cuenta a mano` cruza
// esto contra selectores reales medidos a mano: si alguna aproximación deja de
// alcanzar, se entera ahí y no en un falso negativo silencioso.
function especificidad(selector) {
  let s = ' ' + selector.trim() + ' ';
  s = s.replace(/:where\([^()]*\)/g, ' ');
  // Dos pasadas: alcanza para un nivel de anidamiento, que es todo lo que hay.
  s = s.replace(/:(?:is|not|has|matches|any)\(([^()]*)\)/g, ' $1 ');
  s = s.replace(/:(?:is|not|has|matches|any)\(([^()]*)\)/g, ' $1 ');
  s = s.replace(/\([^()]*\)/g, '');
  s = s.replace(/::[\w-]+/g, ' pseudoelemento ');

  const ids = (s.match(/#[\w-]+/g) ?? []).length;
  const clases =
    (s.match(/\.[\w-]+/g) ?? []).length +
    (s.match(/\[[^\]]*\]/g) ?? []).length +
    (s.match(/:[\w-]+/g) ?? []).length;

  const resto = s
    .replace(/#[\w-]+/g, ' ')
    .replace(/\.[\w-]+/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/:[\w-]+/g, ' ');
  const elementos = (resto.match(/[a-zA-Z][\w-]*/g) ?? []).length;

  return [ids, clases, elementos];
}

function comparar(a, b) {
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
}

// Las reglas de la hoja, con su orden. Se saltean los @keyframes —sus llaves
// anidadas confunden al parser de bloques y adentro no hay cascada— y las
// @media NO hace falta abrirlas: sus reglas caen como reglas normales, que es
// lo correcto, porque una media query no agrega especificidad.
function reglasDe(css) {
  const sinKeyframes = css.replace(/@keyframes[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
  return [...sinKeyframes.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selectores, cuerpo], orden) => ({
    orden,
    cuerpo,
    selectores: selectores
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith('@'))
  }));
}

function declaracionesDe(cuerpo) {
  return cuerpo
    .split(';')
    .map((d) => d.split(':'))
    .filter((p) => p.length >= 2)
    .map(([prop, ...valor]) => ({ prop: prop.trim(), valor: valor.join(':').trim() }));
}

// `transition: none` y `animation: none` son resets A PROPÓSITO —los usa el
// bloque de movimiento reducido— y no le borran nada a nadie: apagan todo, que
// es lo que dicen. Si contaran, el guardián marcaría en rojo el bloque que
// mejor está escrito de la hoja.
const esApagado = (valor) => /^(none|none\s*,\s*none)+$/.test(valor.trim());

// EL CRUCE PELIGROSO: un shorthand que le gana a un longhand del mismo sujeto
// declarado en OTRA regla. Con especificidad igual manda el orden del archivo,
// así que un longhand escrito DESPUÉS está bien — es el patrón que ya usa
// #chip.volviendo #cabeza-grupo. Y dos declaraciones de la MISMA regla tampoco
// cuentan: ahí el orden es explícito y está a la vista, como en `.mota-polvo`.
function crucesPeligrosos(css) {
  const reglas = reglasDe(css);
  const hallazgos = [];

  for (const [familia, longhands] of Object.entries(FAMILIAS_SHORTHAND)) {
    const cortos = [];
    const largos = [];

    for (const regla of reglas) {
      const decl = declaracionesDe(regla.cuerpo);
      const corto = decl.find((d) => d.prop === familia);
      const propios = decl.filter((d) => longhands.includes(d.prop));
      if (!corto && propios.length === 0) continue;

      for (const sel of regla.selectores) {
        const donde = { sujeto: sujetoDe(sel), espec: especificidad(sel), sel, orden: regla.orden };
        if (corto && !esApagado(corto.valor)) cortos.push(donde);
        for (const p of propios) largos.push({ ...donde, prop: p.prop });
      }
    }

    for (const s of cortos) {
      for (const l of largos) {
        if (s.orden === l.orden) continue;

        // Dos caminos para decidir que las dos reglas se pisan: la misma clave
        // de sujeto —el caso normal, exacto cuando hay id— o la contención
        // estricta entre compuestos de puras clases, que es el segundo pase.
        const mismoSujeto = s.sujeto === l.sujeto;
        if (!mismoSujeto && !seSuperponenPorClases(s.sel, l.sel)) continue;

        // Y quién gana: más especificidad, o igual especificidad y después en el
        // archivo. Un longhand escrito DESPUÉS con la misma especificidad está
        // bien y no se marca.
        const cmp = comparar(s.espec, l.espec);
        if (cmp > 0 || (cmp === 0 && s.orden > l.orden)) {
          hallazgos.push(
            `${s.sujeto}: "${s.sel}" usa el shorthand \`${familia}\` y le gana a ` +
              `"${l.sel}", que declara \`${l.prop}\``
          );
        }
      }
    }
  }

  return [...new Set(hallazgos)];
}

// Las propiedades que declara un shorthand `transition`. De cada tramo separado
// por comas, el primer token que no sea un tiempo, una curva ni una palabra de
// `transition-behavior`.
const NO_ES_PROPIEDAD = new Set([
  'ease', 'linear', 'ease-in', 'ease-out', 'ease-in-out',
  'step-start', 'step-end', 'normal', 'allow-discrete'
]);

function propiedadesDelShorthand(valor) {
  return valor
    .split(/,(?![^(]*\))/)
    .map((tramo) =>
      tramo
        .trim()
        .split(/\s+/)
        .find(
          (t) =>
            /^[a-z-]+$/.test(t) &&
            !NO_ES_PROPIEDAD.has(t) &&
            !/^(cubic-bezier|steps)\(/.test(t) &&
            !/\d/.test(t)
        )
    )
    .filter(Boolean);
}

prueba('shorthand: dos reglas con el mismo sujeto no pueden declarar `transition` de cosas distintas', () => {
  // Se saltean los @keyframes: adentro no hay transiciones y sus llaves anidadas
  // confunden al parser de bloques.
  const sinKeyframes = CSS.replace(/@keyframes[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');

  const porSujeto = new Map();
  for (const [, selectores, cuerpo] of sinKeyframes.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const shorthand = cuerpo.match(/(?:^|;)\s*transition\s*:\s*([^;]+)/);
    if (!shorthand) continue;
    const lista = propiedadesDelShorthand(shorthand[1]);
    // `transition: none` es un reset a propósito —lo usa el bloque de
    // movimiento reducido— y no compite con nadie: no declara una propiedad, las
    // apaga todas. Lo mismo `all`. Contarlos daría tres falsas alarmas sobre
    // reglas que están bien.
    if (lista.length === 0 || lista.every((p) => p === 'none' || p === 'all')) continue;
    const props = lista.sort().join(' ');
    for (const selector of selectores.split(',')) {
      const sujeto = sujetoDe(selector);
      if (!sujeto) continue;
      if (!porSujeto.has(sujeto)) porSujeto.set(sujeto, new Map());
      porSujeto.get(sujeto).set(props, selector.trim());
    }
  }

  // El parser tiene que encontrar algo, o el test pasa por vacío.
  verdadero(porSujeto.size > 0, 'el parser de `transition` no encontró ninguna regla');

  const chocan = [...porSujeto]
    .filter(([, sets]) => sets.size > 1)
    .map(([sujeto, sets]) =>
      `${sujeto}: ` + [...sets].map(([props, sel]) => `"${sel}" declara [${props}]`).join(' contra ')
    );

  verdadero(
    chocan.length === 0,
    'el shorthand `transition` resetea la familia entera, así que la regla que gana por ' +
      'especificidad borra en silencio lo que declaró la otra. Van longhands ' +
      '(transition-property / -duration / -timing-function):\n  ' + chocan.join('\n  ')
  );
});

// ---- Y LA FORMA INVERSA, QUE ES POR DONDE VOLVIÓ A ENTRAR ----

prueba('especificidad: el cálculo da lo mismo que la cuenta a mano', () => {
  // Sin esto, el guardián de abajo podría estar comparando cualquier cosa y
  // pasando en verde por eso. Los cinco están medidos a mano y son de la hoja.
  const medidos = [
    ['#ojos', [1, 0, 0]],
    ['#cabeza-grupo.distraida #ojos', [2, 1, 0]],
    ['#chip.acariciando #cabeza-grupo', [2, 1, 0]],
    ['.estado-standby .zeta', [0, 2, 0]],
    ['.zeta:nth-child(2)', [0, 2, 0]],
    ['#chip:has(.estado-esperando) #cuerpo', [2, 1, 0]]
  ];

  for (const [sel, esperada] of medidos) {
    const dio = especificidad(sel);
    verdadero(
      comparar(dio, esperada) === 0,
      `"${sel}" tendría que dar (${esperada}) y dio (${dio})`
    );
  }
});

prueba('guardián: un shorthand no puede ganarle a un longhand declarado en otra regla', () => {
  const hallazgos = crucesPeligrosos(CSS);
  verdadero(
    hallazgos.length === 0,
    'un shorthand resetea su familia entera, así que la regla que gana por especificidad ' +
      'borra en silencio el longhand que declaró la otra. La regla más específica tiene que ' +
      'usar longhands:\n  ' + hallazgos.join('\n  ')
  );
});

// EL GUARDIÁN, VISTO EN ROJO. Un guardián que nunca falló no está verificado:
// está sin estrenar. El anterior pasó verde desde el día uno y el defecto que
// tenía que atajar estuvo vivo todo ese tiempo.
//
// Los cinco casos de abajo son CSS de mentira, cortos a propósito, y cada uno
// tiene un nombre porque cada uno es una decisión del guardián que alguien
// podría querer cambiar más adelante.
prueba('guardián: se lo ve rojo con el defecto real, y no ladra donde no debe', () => {
  // 1. EL DEFECTO DE DAMIÁN, tal cual estaba: base en longhands y UNA regla más
  //    específica con el shorthand. Es la forma que el guardián viejo no veía.
  const defecto = `
    #ojos { transition-property: opacity, translate; }
    #cabeza-grupo.distraida #ojos {
      translate: 1px 0;
      transition: translate 1500ms ease-in-out;
    }`;
  const rojo = crucesPeligrosos(defecto);
  verdadero(rojo.length > 0, 'el guardián NO vio el defecto que ya se nos escapó una vez');
  verdadero(
    /#ojos/.test(rojo[0]) && /distraida/.test(rojo[0]) && /transition-property/.test(rojo[0]),
    `el mensaje tiene que nombrar las dos reglas y el longhand pisado, y dice: ${rojo[0]}`
  );

  // 2. LA MISMA FORMA EN `animation`, que es como mordió las tres primeras
  //    veces. Especificidad igual y el shorthand DESPUÉS: gana por orden.
  const zetas = `
    .zeta:nth-child(2) { animation-delay: 200ms; }
    .estado-standby .zeta { animation: latir 2s infinite; }`;
  verdadero(
    crucesPeligrosos(zetas).length > 0,
    'la familia `animation` tiene que estar cubierta igual que `transition`'
  );

  // 3. ORDEN: con especificidad IGUAL, el longhand escrito DESPUÉS gana y está
  //    bien. Es lo que hacen #chip.acariciando y #chip.volviendo sobre
  //    #cabeza-grupo, y marcarlo sería un falso positivo sobre código correcto.
  const porOrden = `
    #chip.acariciando #cabeza-grupo { transition: rotate 260ms ease-out; }
    #chip.volviendo #cabeza-grupo { transition-duration: 900ms; }`;
  verdadero(crucesPeligrosos(porOrden).length === 0, 'el longhand posterior con igual especificidad está bien');

  // 4. MISMA REGLA: el polvo declara el shorthand y su delay en el mismo bloque
  //    y en ese orden. Ahí no hay cascada que resolver — se lee de arriba abajo.
  const mismaRegla = `
    .mota-polvo { animation: levantar-polvo 2s linear infinite; animation-delay: 1s; }`;
  verdadero(crucesPeligrosos(mismaRegla).length === 0, 'dos declaraciones de la misma regla no son un cruce');

  // 5. APAGAR NO ES PISAR. El bloque de movimiento reducido usa el shorthand
  //    para apagar todo, a propósito, y es la regla mejor escrita de la hoja.
  const apagado = `
    #ojos { transition-property: opacity, translate; }
    @media (prefers-reduced-motion: reduce) { #ojos { transition: none; } }`;
  verdadero(crucesPeligrosos(apagado).length === 0, '`transition: none` es un reset a propósito');

  // 6. UN PSEUDO-ELEMENTO ES OTRA CAJA. `#x::after` no comparte cascada con
  //    `#x`, así que un shorthand en uno no le resetea nada al otro. Marcarlo
  //    bloquea un cambio legítimo, y ya pasó: darle una transición propia a
  //    #puerta-servicio ponía el guardián en rojo por su ::after.
  //
  //    Este fixture es de los que NO tienen que ladrar, y sin él el arreglo se
  //    revierte sin que nada avise — que es justamente cómo llegó el ternario
  //    muerto de `sujetoDe` hasta acá.
  const pseudoElemento = `
    #puerta-servicio { transition-property: opacity; transition-duration: 200ms; }
    #puerta-servicio::after { transition: opacity 220ms ease-out; }`;
  verdadero(
    crucesPeligrosos(pseudoElemento).length === 0,
    'un pseudo-elemento es otra caja: no comparte cascada con su elemento'
  );

  // 7. `.a.b` CONTRA `.a`, que es el segundo pase. La forma existe en la hoja
  //    —`.objeto` con `.objeto.volando`, `.objeto.llegando` y `.objeto.en-piso`—
  //    y va a tener longhands el día que alguien desfase la llegada.
  const contencion = `
    .objeto { animation-delay: 120ms; }
    .objeto.volando { animation: volar 400ms ease-out; }`;
  const rojoPorClases = crucesPeligrosos(contencion);
  verdadero(
    rojoPorClases.length > 0,
    'la contención estricta entre compuestos de puras clases tiene que verse'
  );
  verdadero(
    /\.objeto\.volando/.test(rojoPorClases[0]) && /animation-delay/.test(rojoPorClases[0]),
    `el mensaje tiene que nombrar el par, y dice: ${rojoPorClases[0]}`
  );

  // 8. Y LA CONTENCIÓN NO ALCANZA SOLA: si el shorthand es el de MENOS clases,
  //    pierde por especificidad y no pisa nada.
  const alRevés = `
    .objeto.volando { animation-delay: 120ms; }
    .objeto { animation: volar 400ms ease-out; }`;
  verdadero(
    crucesPeligrosos(alRevés).length === 0,
    'el shorthand menos específico no le gana al longhand más específico'
  );
});

// ============================================================================
// EL TAMAÑO DE UNA PIEZA: DOS NÚMEROS, Y LOS DOS DIVIDEN AL MAESTRO
// ============================================================================
//
// El defecto que este guardián persigue no se ve mirando la pantalla: se ve
// mirando el archivo, y sólo si uno va a buscarlo. Había CINCO tamaños para la
// misma pieza —0,026 y 0,034 y 0,030 del alto de la escena, 36 px fijos, y el
// 100% de una celda de grilla— en tres unidades distintas. Ninguno era el
// maestro dividido por un entero.
//
// Con SVG eso no se notaba, y ahí está la trampa: un vector se redibuja a
// cualquier tamaño sin perder nada, así que la hoja podía acumular tamaños a ojo
// durante meses sin una sola consecuencia visible. La consecuencia aparece toda
// junta el día que el arte pasa a ser PNG a maestro fijo, y entonces hay que
// encontrar los cinco a mano.
//
// Lo que se verifica es en dos partes, y las dos hacen falta:
//
//   1. LA ARITMÉTICA: que maestro/mundo y maestro/grilla sean enteros. Barato y
//      no alcanza solo — no dice nada de lo que la hoja hace con esos números.
//   2. LA HOJA: que ninguna regla que apunte a una pieza le ponga un `width`,
//      un `height` o un `scale` que no sea uno de los tokens permitidos. Ese es
//      el que atrapa el 0,034 escrito a mano.
//
// Los pseudo-elementos quedan afuera a propósito. `::after` es OTRA CAJA —la
// sombra de contacto, que no es la pieza— y ya hay una regla escrita en este
// mismo archivo diciendo que no comparte cascada con su elemento. Medirle el
// tamaño a la sombra como si fuera el del objeto sería el error de siempre: un
// número correcto con la etiqueta equivocada.
const TAMANOS_DE_PIEZA_PERMITIDOS = new Set([
  // Los dos tamaños del juego.
  'var(--objeto-grilla-lado)',
  'var(--objeto-piso-lado)',
  // La caja del dedo, que no es el dibujo: el reparto de #piso y del botón del
  // menú. Es la caja la que puede ser cualquier cosa; la pieza de adentro no.
  'var(--objeto-piso-toque)',
  '100%',
  'auto'
]);

function tamanosSospechosos(texto) {
  const sospechosos = [];

  for (const { selector, cuerpo } of reglasDePrimerNivel(texto)) {
    if (!selector) continue;
    if (!/\.objeto\b|#piso\b/.test(selector)) continue;
    if (selector.includes('::')) continue;

    for (const m of cuerpo.matchAll(/(?:^|;)\s*(width|height)\s*:\s*([^;}]+)/g)) {
      const valor = m[2].trim().replace(/\s+/g, ' ');
      if (!TAMANOS_DE_PIEZA_PERMITIDOS.has(valor)) {
        sospechosos.push(`${selector} { ${m[1]}: ${valor} }`);
      }
    }

    // Un scale fraccionario es un tamaño escrito de otra manera: 0,92 sobre 16
    // da 14,72, que no es entero ni divide a nada. El único scale admitido es
    // el que no escala.
    for (const m of cuerpo.matchAll(/(?:^|;)\s*scale\s*:\s*([^;}]+)/g)) {
      const factores = m[1].trim().split(/\s+/);
      if (factores.some((f) => f !== '1')) {
        sospechosos.push(`${selector} { scale: ${m[1].trim()} }`);
      }
    }
  }

  return sospechosos;
}

prueba('objetos: los dos tamaños del juego dividen al maestro por un entero', () => {
  const { maestro, mundo, grilla } = TAMANO_OBJETO;

  verdadero(
    Number.isInteger(maestro / mundo),
    `el tamaño de mundo tiene que dividir al maestro: ${maestro}/${mundo} = ${maestro / mundo}`
  );
  verdadero(
    Number.isInteger(maestro / grilla),
    `el tamaño de grilla tiene que dividir al maestro: ${maestro}/${grilla} = ${maestro / grilla}`
  );
  igual(OBJETO_PISO.lado, mundo, 'la pieza del piso es la pieza en el mundo, y mide lo mismo');
});

prueba('objetos: ninguna regla le inventa un tamaño a una pieza', () => {
  const sospechosos = tamanosSospechosos(CSS);
  igual(
    sospechosos.join(' | '),
    '',
    'tamaños de pieza que no son ninguno de los dos del juego'
  );
});

prueba('objetos: se lo ve rojo con los cinco tamaños que había', () => {
  // Los cinco de verdad, tal como estaban escritos en la hoja antes de esto.
  const comoEstaba = `
    .objeto { width: calc(var(--alto-escena) * 0.026); height: calc(var(--alto-escena) * 0.026); }
    .estante .objeto { width: min(calc(var(--alto-escena) * 0.034), 100%); }
    .estante:has(.objeto:nth-child(5)) .objeto { width: calc(var(--alto-escena) * 0.030); }
    .estante .objeto:nth-child(3n) { scale: 0.92 calc(var(--repisa-achatado) * 0.92); }
    .objeto.en-piso { width: 36px; height: 36px; }`;

  const encontrados = tamanosSospechosos(comoEstaba);
  verdadero(
    encontrados.length >= 5,
    `con la hoja vieja tiene que ladrar cinco veces y ladró ${encontrados.length}: ${encontrados.join(' | ')}`
  );
  verdadero(
    encontrados.some((s) => /0\.034/.test(s)),
    'el 0,034 del estante es el que más costaba ver: tiene que estar nombrado'
  );
  verdadero(
    encontrados.some((s) => /scale/.test(s)),
    'el scale fraccionario es un tamaño y tiene que contar como tal'
  );

  // Y NO LADRA DONDE NO DEBE: la caja del dedo y la sombra de contacto son
  // otras cajas y pueden medir lo que quieran.
  const legitimo = `
    #piso { width: var(--objeto-piso-toque); height: var(--objeto-piso-toque); }
    .objeto.en-piso { width: var(--objeto-piso-lado); height: var(--objeto-piso-lado); }
    .estante .objeto::after { height: 5px; }
    #coleccion-grilla .objeto { width: 100%; height: auto; }`;
  igual(
    tamanosSospechosos(legitimo).join(' | '),
    '',
    'la caja táctil y el pseudo-elemento no son la pieza'
  );
});

// LA FILA ENTRA, Y ES UNA CUENTA, NO UNA ESPERANZA.
//
// Mientras la pieza podía encoger —el `min(..., 100%)` que estaba en
// `.estante .objeto`— que la fila entrara era automático y no había nada que
// verificar: la grilla achicaba las piezas hasta que entraran. Ese era
// justamente el problema. Con el lado fijo, si no entra, se desborda.
//
// Así que la cuenta pasa a ser explícita, y se hace con el ancho REAL de la
// tabla leído de la hoja —el multiplicador vive ahí, no en config— para que el
// día que alguien lo cambie el guardián lo vea.
prueba('estante: cuatro piezas de 16 entran en la tabla más angosta que se soporta', () => {
  const fila = bloqueEntre(CSS, '.estante {', '}');
  const m = fila.match(/width:\s*calc\(\s*var\(--repisa-ancho\)\s*\*\s*([\d.]+)\s*\)/);
  verdadero(m !== null, `la fila tiene que declarar su ancho como fracción de la tabla: ${fila}`);

  const util = (REPISA.ancho / 100) * Number(m[1]) * ANCHO_MINIMO_SOPORTADO;
  const ocupado = PIEZAS_POR_ESTANTE * TAMANO_OBJETO.grilla;

  verdadero(
    ocupado <= util,
    `en ${ANCHO_MINIMO_SOPORTADO} px de ancho la fila mide ${util.toFixed(1)} px y ` +
      `${PIEZAS_POR_ESTANTE} piezas de ${TAMANO_OBJETO.grilla} ocupan ${ocupado}`
  );

  // Y que quede AIRE, no que raspe: cuatro piezas pegadas una contra otra se
  // leen como un bloque, no como cuatro cosas apoyadas. Un píxel entre piezas
  // es el mínimo para que se separen.
  const huecos = PIEZAS_POR_ESTANTE - 1;
  verdadero(
    util - ocupado >= huecos,
    `sobran ${(util - ocupado).toFixed(1)} px para ${huecos} huecos: las piezas se tocan`
  );
});

// Acá estaba `los ojos cruzan Y se mueven`, que exigía `opacity` en la lista de
// #ojos. Lo reemplaza `ojos: el cambio de cara es un corte y no una
// disolvencia`, más arriba en este mismo archivo, que pide exactamente lo
// contrario y por un motivo que ese test no podía ver: el cruce medía bien y se
// veía mal. No es que estuviera mal escrito — estaba defendiendo la técnica
// equivocada.
//
// Se anota en vez de borrarse por la misma razón que las constantes que se van
// de config.js: quien busque por qué #ojos no cruza tiene que encontrar la
// respuesta acá y no el hueco.
