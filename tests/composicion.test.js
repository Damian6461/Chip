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
import { svgDeRepisa } from '../js/formas.js';
import {
  INHALACION,
  INCLINACION_CABEZA,
  COLORES_BOTON,
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

prueba('botonera: el texto sigue en AA sobre la chapa nueva', () => {
  for (const cara of ['bajo', 'fondo']) {
    const c = contraste(COLORES_BOTON.texto, COLORES_BOTON[cara]);
    verdadero(c >= 4.5, `texto sobre ${cara}: ${c.toFixed(2)} a 1, y AA pide 4,5`);
  }

  for (const cara of ['arriba', 'chapa']) {
    const c = contraste(COLORES_BOTON.filo, COLORES_BOTON[cara]);
    verdadero(c >= 3, `ícono grabado sobre ${cara}: ${c.toFixed(2)} a 1, y AA gráfico pide 3`);
  }

  const apagado = contraste(COLORES_BOTON['mate-texto'], COLORES_BOTON['mate-bajo']);
  verdadero(apagado >= 3, `la tecla apagada da ${apagado.toFixed(2)} a 1 y tiene que seguir legible`);
});

// Y que la chapa siga siendo del mismo material que lo que tiene al lado. Si
// alguien la vuelve a oscurecer, la botonera vuelve a leerse como interfaz.
prueba('botonera: la chapa está en la familia de la chapa de Chip', () => {
  const suya = luminancia(COLORES_BOTON.chapa);
  // El gris del casco, medido del sprite. Estaba tomado de COLOR_PARPADO, que
  // valía lo mismo de casualidad; cuando el párpado volvió al crema, esto habría
  // pasado a comparar la chapa contra un durazno y el test habría dado 80% sin
  // que nadie hubiera tocado la botonera. Ahora sale de su propia constante.
  const chip = luminancia(GRIS_CHAPA_CABEZA);
  const lejos = Math.abs(suya - chip) / chip;

  verdadero(lejos < 0.35, `la chapa está a ${(lejos * 100).toFixed(0)}% de la de Chip en luminancia`);
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

prueba('ojos: las reglas que apagan van DESPUÉS de las que encienden', () => {
  // Misma especificidad, así que el orden es lo único que decide. Si alguien las
  // sube, el cruce vuelve a sumar y vuelven los cuatro aros.
  verdadero(
    ORDEN_OJOS.apagaContento > ORDEN_OJOS.enciendeGesto,
    `la regla que apaga \`contento\` está en ${ORDEN_OJOS.apagaContento} y la que lo enciende en ` +
      `${ORDEN_OJOS.enciendeGesto}: con la misma especificidad, la de arriba pierde`
  );
});

prueba('ojos: las cuatro capas del ojo comparten el filtrado', () => {
  // #parpado era la única sin `pixelated` —medido: `auto` contra `pixelated` en
  // las otras tres—. Su máscara es el mismo .webp de 256 escalado a la caja de
  // Chip, así que sin esto su borde se interpola y el de las capas de encima no:
  // dos bordes con distinta dureza en el mismo lugar.
  const bloque = CSS.slice(CSS.indexOf('#parpado {'), CSS.indexOf('#parpado[hidden]'));
  verdadero(
    /image-rendering:\s*pixelated/.test(bloque),
    '#parpado tiene que filtrar igual que #ojos y que las capas de gesto'
  );
});

prueba('ojos: #ojos cruza con transición y no se apaga de golpe', () => {
  const bloque = CSS.slice(CSS.indexOf('#ojos {'), CSS.indexOf('#ojos[hidden]'));
  verdadero(
    /transition:\s*opacity\s+var\(--ojos-cruce\)/.test(bloque),
    '#ojos necesita la misma duración que las capas de gesto para que el cruce sea un cruce'
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
  const bloque = CSS.slice(CSS.indexOf('@media (prefers-reduced-motion'));
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
  const bloque = CSS.slice(CSS.indexOf('#puerta-servicio {'), CSS.indexOf('#puerta-servicio::after'));
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
