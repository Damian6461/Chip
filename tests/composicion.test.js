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

import { readFileSync } from 'node:fs';
import { prueba, igual, verdadero } from './runner.js';
import {
  INHALACION,
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
