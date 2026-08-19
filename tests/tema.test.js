// El puente de config.js al resto del proyecto.
//
// Son DOS cruces con la misma forma, y el segundo salió del primero: si una
// custom property escrita y sin lector es peso muerto, una CONSTANTE escrita y
// sin lector es exactamente lo mismo un piso más abajo. La única diferencia es
// que en JS el error es todavía más silencioso — un `export const` que nadie
// importa ni siquiera llega a caerse a un fallback.
//
// SÓLO CORRE EN NODE: lee style.css y formas.js como texto, igual que
// assets.test.js y composicion.test.js.
//
// Por qué existe. Una custom property sin escritor NO se rompe: `var(--x)` sin
// valor se cae al fallback, o a nada, y la página sigue andando. Un `--duracion`
// que nadie escribe deja una animación en su valor por defecto; un `--color` que
// nadie escribe deja un elemento transparente. Nada tira error, nada aparece en
// la consola, y sólo se nota mirando — que es exactamente el tipo de defecto que
// más caro sale en este proyecto.
//
// Hasta que el puente fue una función pura (tema.js) no había forma de probarlo:
// vivía en 90 líneas de `raiz.style.setProperty(...)` en el cuerpo de ui.js, que
// no se puede importar sin un DOM.
//
// Se cruzan las dos direcciones, y las dos importan:
//
//   config -> CSS   un nombre que se escribe y nadie lee es peso muerto, y casi
//                   siempre es el rastro de un renombre a medio hacer.
//   CSS -> config   un nombre que se lee y nadie escribe es el defecto de arriba.
//
// Lo que esto verifica es que los NOMBRES coincidan de los dos lados, que es el
// modo de falla que pasa de verdad: alguien renombra en un archivo y no en el
// otro. Verificado que agarra las dos direcciones — con `--boton-chapita-filo`
// renombrado en tema.js, fallan las dos pruebas del cruce y las dos dicen cuál
// es. (Antes esta nota nombraba `--ciclo-led`, que se fue con el LED de la
// botonera: una nota que cita una variable inexistente no se puede volver a
// correr, que es justo lo que una nota de verificación tiene que permitir.)
//
// Lo que NO verifica, dicho en voz alta: que cada nombre declarado en una tabla
// VARS_* se escriba efectivamente en algún momento. Las de render se escriben
// desde ui.js con el nodo delante, y eso pide un DOM. Una variable declarada en
// una tabla, leída por el CSS y que ui.js se olvidara de escribir pasaría estas
// pruebas. Las del tema, que son las de carga, sí quedan cubiertas: se comparan
// contra el mapa que devuelve variablesDeTema(), o sea contra lo que realmente
// se escribe.

import { readFileSync, readdirSync } from 'node:fs';
import { prueba, igual, verdadero } from './runner.js';
import * as CONFIG from '../js/config.js';
import { variablesDeTema } from '../js/tema.js';

const RAIZ = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const CSS = readFileSync(RAIZ + 'style.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const UI = readFileSync(RAIZ + 'js/ui.js', 'utf8');
const MONTAJE = readFileSync(RAIZ + 'js/ui-montaje.js', 'utf8');
const FORMAS = readFileSync(RAIZ + 'js/formas.js', 'utf8');

const nombres = (texto, re) => new Set([...texto.matchAll(re)].map((m) => m[1]));

// Quién LEE: style.css con var(), y los SVG inline de formas.js, que también
// llevan var() adentro de sus atributos fill.
const LEIDAS = new Set([
  ...nombres(CSS, /var\(\s*(--[\w-]+)/g),
  ...nombres(FORMAS, /var\(\s*(--[\w-]+)/g)
]);

// Quién DEFINE del lado del CSS: cualquier regla que declare la propiedad. Estas
// no necesitan escritor en JS — se las da la hoja a sí misma.
const DEFINIDAS_EN_CSS = nombres(CSS, /(?:^|[;{])\s*(--[\w-]+)\s*:/gm);

const DEL_TEMA = new Set(Object.keys(variablesDeTema()));

// Y los que se escriben en cada render, que no son del tema: la luz del piso, la
// antena, la sombra, la pantalla del pecho, el fondo. Esos salen de las tablas
// VARS_* de config.js, así que se recolectan de ahí en vez de listarlos a mano.
function nombresDeLasTablas() {
  const encontrados = new Set();

  const recolectar = (valor) => {
    if (typeof valor === 'string' && valor.startsWith('--')) encontrados.add(valor);
    else if (Array.isArray(valor)) valor.forEach(recolectar);
    else if (valor && typeof valor === 'object') Object.values(valor).forEach(recolectar);
  };

  for (const [nombre, valor] of Object.entries(CONFIG)) {
    if (nombre.startsWith('VARS_')) recolectar(valor);
  }

  return encontrados;
}

// Los literales que ui.js y ui-montaje.js todavía escriben a mano, sin pasar por
// una tabla. Los dos archivos, no sólo ui.js: cuando el montaje empezó a escribir
// variables propias, el cruce las marcó como huérfanas y tenía razón a medias —
// el nombre existía, pero en ningún lado donde este test lo buscara.
const LITERALES_DE_UI = new Set([
  ...nombres(UI, /setProperty\(\s*['"`](--[\w-]+)['"`]/g),
  ...nombres(MONTAJE, /setProperty\(\s*['"`](--[\w-]+)['"`]/g)
]);

// Y `--filo`, que se escribe por pieza en el estante y no en :root.
const DECLARADAS = new Set([...DEL_TEMA, ...nombresDeLasTablas(), ...LITERALES_DE_UI]);

// ---- El tema, por sí solo ----

prueba('tema: variablesDeTema no depende del DOM y devuelve puros strings', () => {
  const vars = variablesDeTema();

  verdadero(Object.keys(vars).length > 60, `devolvió ${Object.keys(vars).length} variables`);

  for (const [nombre, valor] of Object.entries(vars)) {
    verdadero(nombre.startsWith('--'), `${nombre} no parece una custom property`);
    igual(typeof valor, 'string', `${nombre} vale ${valor}, que no es un string`);
    verdadero(valor.length > 0, `${nombre} quedó vacía`);
    verdadero(!valor.includes('undefined'), `${nombre} vale "${valor}"`);
    verdadero(!valor.includes('NaN'), `${nombre} vale "${valor}"`);
  }
});

prueba('tema: es determinista — dos llamadas dan exactamente lo mismo', () => {
  igual(
    JSON.stringify(variablesDeTema()),
    JSON.stringify(variablesDeTema()),
    'variablesDeTema tiene que ser pura'
  );
});

// El chequeo de color va dirigido por VALOR y no por nombre, y es una corrección
// de la primera versión: buscaba /sombra|filo|cuerpo|.../ en el nombre y se
// llevaba puesta a `--sombra-respiracion-x`, que es un factor de escala. Un
// heurístico sobre el nombre inventa falsos positivos en cuanto el vocabulario
// crece. Sobre el valor no hay ambigüedad: lo que empieza con # es un color y
// tiene que estar bien formado.
prueba('tema: cada valor tiene la forma que le corresponde', () => {
  for (const [nombre, valor] of Object.entries(variablesDeTema())) {
    if (/duracion|ciclo|transicion|retardo/.test(nombre)) {
      verdadero(/^\d+(\.\d+)?m?s$/.test(valor), `${nombre} vale "${valor}" y debería ser una duración`);
    }

    if (valor.startsWith('#')) {
      verdadero(/^#[0-9a-f]{3,8}$/i.test(valor), `${nombre} vale "${valor}", que no es un hex válido`);
    }

    // Escalas, anclas y factores: números pelados, sin unidad. Un `%` colado acá
    // rompe silenciosamente el calc() del otro lado.
    if (/-(x|y|achatado|corrimiento|ancla[xy]|opacidad)$/i.test(nombre) && !valor.endsWith('%')) {
      verdadero(
        Number.isFinite(Number(valor)),
        `${nombre} vale "${valor}" y debería ser un número sin unidad`
      );
    }
  }
});

// ---- El cruce con la hoja ----

prueba('puente: todo var() que el CSS no define sale de config.js', () => {
  const sinDuenio = [...LEIDAS]
    .filter((v) => !DEFINIDAS_EN_CSS.has(v) && !DECLARADAS.has(v))
    .sort();

  igual(
    sinDuenio.join(', '),
    '',
    'estas se leen con var(), no las define el CSS y no las escribe nadie'
  );
});

prueba('puente: todo lo que el tema escribe lo lee alguien', () => {
  const nadieLasLee = [...DEL_TEMA].filter((v) => !LEIDAS.has(v)).sort();

  igual(
    nadieLasLee.join(', '),
    '',
    'el tema escribe estas variables y ni style.css ni formas.js las leen'
  );
});

// Este es el que evita que los dos de arriba pasen en falso: si el parser deja
// de encontrar var() —porque cambió el formato de la hoja, porque alguien movió
// los SVG— los cruces darían cero contra cero y todo verde.
prueba('puente: los parsers encuentran algo, así que el cruce significa algo', () => {
  verdadero(LEIDAS.size > 100, `sólo se encontraron ${LEIDAS.size} var() entre style.css y formas.js`);
  verdadero(DEFINIDAS_EN_CSS.size > 20, `sólo ${DEFINIDAS_EN_CSS.size} definidas en el CSS`);
  verdadero(DECLARADAS.size > 100, `sólo ${DECLARADAS.size} declaradas del lado de config`);
});

// ---- El mismo cruce, un piso más abajo: config.js -> el resto del JS ----
//
// Lo encontró una revisión a mano y por eso existe. Había siete constantes
// escritas y sin un solo lector, y las siete contaban la misma historia: una
// mudanza terminada a medias que dejó su versión vieja en el archivo. El
// problema no es el peso —son siete líneas— sino que quien lee config.js las
// lee como si estuvieran vigentes, y quien busca por qué algo no funciona las
// encuentra y cree haber encontrado la causa.
//
// LO QUE CUENTA COMO LECTOR es cualquier mención del nombre fuera de su propia
// declaración: otro módulo que lo importe, el propio config.js usándolo para
// armar otra tabla —EVENTO_NIEBLA no lo lee nadie afuera, lo consume CLIMAS acá
// mismo—, un test, o una herramienta del repo. `icons/generador.html` importa
// ICONOS y es el único lector que tiene: sin mirar ahí, ICONOS parece muerto.
//
// LO QUE NO CUENTA es `import * as CONFIG` recorrido con Object.entries, que es
// lo que hace este mismo archivo tres funciones más arriba. Un recorrido así
// toca todos los nombres sin nombrar ninguno: si contara, taparía justo el
// defecto que esto busca.

const RUTAS_LECTORAS = [
  ...readdirSync(RAIZ + 'js').filter((n) => n.endsWith('.js') && n !== 'config.js').map((n) => 'js/' + n),
  ...readdirSync(RAIZ + 'tests').filter((n) => n.endsWith('.js') || n.endsWith('.mjs')).map((n) => 'tests/' + n),
  ...readdirSync(RAIZ + 'icons').filter((n) => n.endsWith('.html')).map((n) => 'icons/' + n),
  'sw.js',
  'index.html',
  'style.css'
];

const CONFIG_FUENTE = readFileSync(RAIZ + 'js/config.js', 'utf8');
const EXPORTS = [...CONFIG_FUENTE.matchAll(/^export const (\w+)/gm)].map((m) => m[1]);

// El texto de config.js sin sus declaraciones: lo que queda son los usos, que
// son los que cuentan como lector interno.
const CONFIG_SIN_DECLARACIONES = CONFIG_FUENTE.replace(/^export const \w+/gm, '');
const FUENTES_LECTORAS = new Map([
  ['js/config.js', CONFIG_SIN_DECLARACIONES],
  ...RUTAS_LECTORAS.map((r) => [r, readFileSync(RAIZ + r, 'utf8')])
]);

function lectoresDe(nombre) {
  const re = new RegExp(`\\b${nombre}\\b`);
  return [...FUENTES_LECTORAS].filter(([, texto]) => re.test(texto)).map(([ruta]) => ruta);
}

prueba('puente: toda constante de config.js la lee alguien', () => {
  const huerfanas = EXPORTS.filter((n) => lectoresDe(n).length === 0);

  igual(
    huerfanas.join(', '),
    '',
    'config.js declara estas constantes y no las lee nadie: o es trabajo a medias o es código muerto'
  );
});

// El segundo escalón, y NO es un lujo. `RUTAS_FONDOS` vivió acá: dos entradas de
// cuando el galpón tenía dos fondos, sin un solo lector en el juego y con dos
// tests usándola como fuente de verdad. O sea que además de estar muerta le
// prestaba autoridad a dos guardianes que verificaban la mitad de lo que decían.
// Una constante que sólo existe para que un test la mire no está describiendo el
// juego: está describiendo a otro test.
prueba('puente: ninguna constante de config.js vive sólo para los tests', () => {
  const soloDePrueba = EXPORTS.filter((n) => {
    const lectores = lectoresDe(n);
    return lectores.length > 0 && lectores.every((r) => r.startsWith('tests/'));
  });

  igual(
    soloDePrueba.join(', '),
    '',
    'estas constantes sólo las lee la suite: describen a un test y no al juego'
  );
});

// Y la red de los dos de arriba, por lo mismo de siempre: si el parser dejara de
// encontrar exports —porque cambia el formato de config.js— los dos filtros
// darían cero contra cero y pasarían en verde sin haber mirado nada.
prueba('puente: el parser de exports encuentra algo', () => {
  verdadero(EXPORTS.length > 200, `sólo se encontraron ${EXPORTS.length} exports en config.js`);
  verdadero(FUENTES_LECTORAS.size > 25, `sólo ${FUENTES_LECTORAS.size} archivos lectores`);
  // Que el parser distinga declaración de uso: si `CLIMAS` no apareciera como
  // lector interno de EVENTO_NIEBLA, el corte de las declaraciones se comió algo.
  verdadero(
    lectoresDe('EVENTO_NIEBLA').includes('js/config.js'),
    'EVENTO_NIEBLA tiene que contar a CLIMAS, en el propio config.js, como lector'
  );
});
