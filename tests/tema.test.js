// El puente de config.js a style.css.
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
// otro. Verificado que agarra las dos direcciones — con `--ciclo-led` renombrado
// en tema.js, fallan las dos pruebas del cruce y las dos dicen cuál es.
//
// Lo que NO verifica, dicho en voz alta: que cada nombre declarado en una tabla
// VARS_* se escriba efectivamente en algún momento. Las de render se escriben
// desde ui.js con el nodo delante, y eso pide un DOM. Una variable declarada en
// una tabla, leída por el CSS y que ui.js se olvidara de escribir pasaría estas
// pruebas. Las del tema, que son las de carga, sí quedan cubiertas: se comparan
// contra el mapa que devuelve variablesDeTema(), o sea contra lo que realmente
// se escribe.

import { readFileSync } from 'node:fs';
import { prueba, igual, verdadero } from './runner.js';
import * as CONFIG from '../js/config.js';
import { variablesDeTema } from '../js/tema.js';

const RAIZ = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const CSS = readFileSync(RAIZ + 'style.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const UI = readFileSync(RAIZ + 'js/ui.js', 'utf8');
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

// Los literales que ui.js todavía escribe a mano, sin pasar por una tabla.
const LITERALES_DE_UI = nombres(UI, /setProperty\(\s*['"`](--[\w-]+)['"`]/g);

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
