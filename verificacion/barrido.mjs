// EL BARRIDO DE LAS CUATRO REGLAS YA ESCRITAS.
//
//   node verificacion/barrido.mjs
//
// Cuatro reglas que este proyecto se dio a sí mismo, y la pregunta no es si están
// escritas —lo están— sino si quedó algún caso vivo:
//
//   1. El resplandor se dibuja, la sombra se difumina.
//   2. El cambio de un dibujo a otro es un CORTE, no una disolvencia.
//   3. Todo tamaño de sprite es fracción entera de su maestro.
//   4. Ningún corte por texto en tests/ va sin tope.
//
// POR QUÉ UN SCRIPT Y NO UNA LISTA A MANO. Porque una lista a mano queda vieja
// el mismo día, y porque tres de las cuatro no se pueden contestar leyendo: hay
// que mirar qué elementos se superponen de verdad y a qué tamaño se dibuja cada
// imagen. Lo que sí va a mano es el VEREDICTO de cada caso, que es una decisión
// y no una medición — y por eso está declarado abajo, con nombre y motivo.
//
// Los que tienen veredicto declarado salen como TOLERADO. Cualquier otro sale
// como VIVO, que es lo que hay que mirar.

import { readFileSync, readdirSync } from 'node:fs';
import { servir } from '../tools/servir.mjs';
import { abrirCromo, dormir } from '../tools/cromo.mjs';

const RAIZ = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const CSS = readFileSync(RAIZ + 'style.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

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

// ---- LOS VEREDICTOS DECLARADOS ----
//
// Cada entrada dice POR QUÉ ese caso puede quedarse. Sin motivo escrito no entra:
// una excepción sin nombre es una excepción que crece.
const VEREDICTOS = {
  // 1. Difuminados que NO son resplandores.
  '#sombra': 'La sombra proyectada de Chip. Es una sombra y una sombra es blanda.',
  '#menu-boton': 'Sombra de la chapa del menú: tiene corrimiento y es negra.',
  '.cable-sombra-puerto': 'La sombra del cable contra el puerto. Sombra otra vez.',
  '#lluvia .gota':
    'Desenfoque de PROFUNDIDAD, no resplandor: las gotas de las bandas de atrás ' +
    'están fuera de foco a propósito.',
  '.estante .objeto.obtenido':
    'Sombra proyectada de la pieza apoyada. Hoy la pieza es un SVG vectorial. ' +
    'CUANDO ENTRE SU PNG hay que rehacerla: un drop-shadow rasteriza el elemento ' +
    'y le come los píxeles propios, que es lo que se midió en el número del pecho.',
  '.estante .objeto:nth-child(3n)': 'Ídem: sombra de la pieza del estante.',
  '.objeto.obtenido': 'Ídem, la regla base.',
  'body.es-noche .estante .objeto, body.es-noche .estante .objeto.obtenido':
    'Ídem, la versión de noche.',
  'body.es-noche .estante .objeto:nth-child(3n)': 'Ídem.',
  '.estante .objeto.obtenido::after, .objeto.en-piso::after':
    'La sombra de CONTACTO. Es la única sombra que este proyecto quiere blanda.',
  '#acciones button svg':
    'NO tiene blur: son cuatro corrimientos enteros con radio cero, o sea un ' +
    'CONTORNO. Es la técnica permitida.',
  '.objeto.en-piso':
    'ACÁ HAY UNO VIVO Y DECLARADO. El segundo drop-shadow es el brillo que hace ' +
    'descubrible la pieza tirada: sin corrimiento y de color, o sea un resplandor ' +
    'difuminado. Se deja porque hoy la pieza es vectorial. Con su PNG a maestro 32 ' +
    'pasa a ser el defecto del número del pecho. Ver BRILLO_PISO.',

  // 2. Opacidades que cruzan dos dibujos.
  '#menu-boton|opacidad': 'Es una chapa de interfaz, no un cruce de dos dibujos.',
  '#estado|opacidad': 'Un panel de texto que entra y sale. No hay dos dibujos abajo.',
  '#puerta-servicio::after|opacidad': 'El acuse del toque oculto. No hay dibujo.'
};

console.log('====================================================================');
console.log('1. FILTROS CON DIFUMINADO');
console.log('====================================================================\n');

const filtros = [];
for (const { selector, cuerpo } of reglasDePrimerNivel(CSS)) {
  if (!selector) continue;
  for (const m of cuerpo.matchAll(/(?:^|;)\s*(?:-webkit-)?filter\s*:\s*([^;}]+)/g)) {
    const valor = m[1].trim().replace(/\s+/g, ' ');
    if (!/blur|drop-shadow/.test(valor)) continue;
    filtros.push({ selector, valor });
  }
}

for (const f of filtros) {
  const v = VEREDICTOS[f.selector];
  console.log(`${v ? '  ok ' : 'VIVO'}  ${f.selector}`);
  console.log(`        ${f.valor}`);
  console.log(`        ${v ?? 'SIN VEREDICTO DECLARADO. Hay que mirarlo.'}\n`);
}

console.log('====================================================================');
console.log('4. CORTES POR TEXTO EN tests/ SIN TOPE');
console.log('====================================================================\n');

// Un corte es `algo.slice(i, j)` donde i o j salen de un `indexOf`. Lo que lo
// hace seguro es que exista un tope al largo del resultado o que el corte sea
// `bloqueEntre`, que ya lo trae.
for (const archivo of readdirSync(RAIZ + 'tests').filter((n) => /\.(js|mjs)$/.test(n))) {
  const texto = readFileSync(RAIZ + 'tests/' + archivo, 'utf8');
  const lineas = texto.split('\n');

  lineas.forEach((linea, i) => {
    if (!/\.slice\(/.test(linea)) return;
    // Los cortes sobre un hex o sobre un array no son cortes por texto.
    if (/hex\.slice|\.slice\(1\)|\.slice\(0, -1\)|\.slice\(1\)|digest/.test(linea)) return;

    // ¿El índice sale de un indexOf que esté cerca?
    const contexto = lineas.slice(Math.max(0, i - 8), i + 3).join('\n');
    if (!/indexOf\(/.test(contexto)) return;
    if (/bloqueEntre/.test(contexto)) return;

    // QUÉ CUENTA COMO RED, y la primera versión de esto pedía sólo la primera:
    //
    //   a. un TOPE al largo del resultado
    //   b. una VERIFICACIÓN DEL ANCLA —que el índice no haya dado −1— que es la
    //      otra mitad, y en algunos cortes la única que hace falta
    //   c. una VENTANA FIJA: `slice(i, i + 60)` no puede comerse nada, mida lo
    //      que mida el archivo
    //
    // Pedir sólo (a) marcaba como vivos dos cortes que ya llevan (b) y (c). Un
    // detector que denuncia lo que ya está protegido entrena a ignorarlo, que es
    // el mismo daño que uno que no denuncia nada.
    const conTope = /\.length\s*[<>]|length < \d|tope/.test(contexto);
    const conAncla = /(indexOf\([^)]*\)[^\n]*\n?[^\n]*)?(>=\s*0|<\s*0)/.test(contexto);
    const conVentana = /\.slice\([^,]+,\s*[^,)]+\+\s*\d+\s*\)/.test(linea);
    const cuidado = conTope || conAncla || conVentana;

    const red = [conTope && 'tope', conAncla && 'ancla verificada', conVentana && 'ventana fija']
      .filter(Boolean)
      .join(' + ');

    console.log(
      `${cuidado ? '  ok ' : 'VIVO'}  tests/${archivo}:${i + 1}  ${linea.trim().slice(0, 80)}` +
        (cuidado ? `\n        red: ${red}` : '')
    );
    if (!cuidado) console.log('        sin tope, sin verificación del ancla y sin ventana fija\n');
  });
}

// ---- Lo que sólo se puede contestar con el juego corriendo ----
const { servidor, puerto } = await servir(0);
const cromo = await abrirCromo({ ancho: 390, alto: 844 });

try {
  await cromo.enviar('Page.enable');
  await cromo.enviar('Runtime.enable');
  await cromo.enviar('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true
  });
  await cromo.enviar('Page.navigate', { url: `http://127.0.0.1:${puerto}/index.html` });
  await dormir(2800);

  const evaluar = async (expr) =>
    (await cromo.enviar('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result.value;

  console.log('\n====================================================================');
  console.log('2. OPACIDAD FRACCIONARIA SOBRE ALGO QUE TIENE UN DIBUJO DEBAJO');
  console.log('====================================================================\n');

  // Se miran los elementos que HOY tienen opacidad fraccionaria y debajo de los
  // cuales hay otra imagen. Leer el CSS no alcanza: lo que importa es si hay dos
  // dibujos superpuestos, y eso lo sabe el layout.
  const cruces = JSON.parse(
    await evaluar(`(() => {
      const salida = [];
      const nombre = (n) => n.id ? '#' + n.id : (n.className && typeof n.className === 'string' ? '.' + n.className.split(' ').join('.') : n.tagName.toLowerCase());
      for (const n of document.querySelectorAll('*')) {
        const cs = getComputedStyle(n);
        const op = parseFloat(cs.opacity);
        if (!(op > 0 && op < 1)) continue;
        const r = n.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;

        // ¿Es o contiene una imagen?
        const propia = n.tagName === 'IMG' || n.querySelector('img');
        if (!propia) continue;

        // ¿Hay otra imagen debajo, en el mismo lugar?
        const debajo = [...document.querySelectorAll('img')].some((otra) => {
          if (otra === n || n.contains(otra)) return false;
          const o = otra.getBoundingClientRect();
          if (o.width < 2) return false;
          const cruza = !(o.right < r.left || o.left > r.right || o.bottom < r.top || o.top > r.bottom);
          return cruza && getComputedStyle(otra).visibility !== 'hidden' && !otra.closest('[hidden]');
        });

        salida.push({ nodo: nombre(n), opacidad: op, tapaOtroDibujo: debajo });
      }
      return JSON.stringify(salida);
    })()`)
  );

  // LO QUE ESTA PARTE NO PUEDE VER, dicho en voz alta: mira UN INSTANTE. Un
  // cruce que dura 200 ms —el parpadeo, una llegada, un cambio de cara— pasa
  // entero entre dos corridas de esto y no aparece. Lo que sí atrapa es lo
  // permanente: una capa que vive a opacidad 0,6 encima de otra.
  //
  // El cruce de caras, que era el caso grave de esta familia, ya no existe: se
  // convirtió en un corte, y eso lo cuida un guardián de composicion.test.js
  // —"ojos: el cambio de cara es un corte y no una disolvencia"— que sí mira el
  // CSS y no depende del instante.
  if (!cruces.length) console.log('  No hay ningún dibujo con opacidad fraccionaria en este instante.\n');
  for (const c of cruces) {
    console.log(
      `${c.tapaOtroDibujo ? 'VIVO' : '  ok '}  ${c.nodo} — opacidad ${c.opacidad}` +
        (c.tapaOtroDibujo ? '  · encima de otro dibujo: los dos se mezclan' : '  · no hay otro dibujo debajo')
    );
  }

  console.log('\n  Y las transiciones de opacidad declaradas en la hoja:');
  for (const { selector, cuerpo } of reglasDePrimerNivel(CSS)) {
    if (!selector) continue;
    for (const m of cuerpo.matchAll(/(?:^|;)\s*transition\s*:\s*([^;}]+)/g)) {
      if (!/opacity/.test(m[1])) continue;
      const v = VEREDICTOS[selector + '|opacidad'];
      console.log(`  ${v ? 'ok  ' : 'VIVO'}  ${selector}  ${v ?? 'SIN VEREDICTO DECLARADO'}`);
    }
  }

  console.log('\n====================================================================');
  console.log('3. TAMAÑOS DE DIBUJO CONTRA SU MAESTRO');
  console.log('====================================================================\n');

  // Los <img> Y los fondos de CSS: media docena de capas de Chip son
  // `background-image`, y mirar sólo los <img> dejaría la mitad del personaje
  // afuera del inventario — que es la forma clásica de que un barrido dé limpio.
  const imagenes = JSON.parse(
    await evaluar(`(async () => {
      const vistos = new Map();

      const anotar = async (url, r, suavizado, como) => {
        const clave = url.split('/').pop().split('?')[0];
        if (!clave || vistos.has(clave)) return;
        const natural = await new Promise((listo) => {
          const i = new Image();
          i.onload = () => listo([i.naturalWidth, i.naturalHeight]);
          i.onerror = () => listo([0, 0]);
          i.src = url;
        });
        vistos.set(clave, {
          archivo: clave,
          como,
          natural,
          pintado: [+r.width.toFixed(2), +r.height.toFixed(2)],
          suavizado
        });
      };

      for (const img of document.querySelectorAll('img')) {
        const r = img.getBoundingClientRect();
        if (r.width < 1) continue;
        await anotar(img.currentSrc, r, getComputedStyle(img).imageRendering, 'img');
      }

      for (const n of document.querySelectorAll('*')) {
        const cs = getComputedStyle(n);
        const m = cs.backgroundImage.match(/url\\("?([^")]+)"?\\)/);
        if (!m) continue;
        const r = n.getBoundingClientRect();
        if (r.width < 1) continue;
        await anotar(m[1], r, cs.imageRendering, 'fondo');
      }

      return JSON.stringify([...vistos.values()]);
    })()`)
  );

  for (const i of imagenes.sort((a, b) => a.archivo.localeCompare(b.archivo))) {
    const factor = i.natural[0] ? i.pintado[0] / i.natural[0] : 0;
    const entero = Number.isInteger(1 / factor) || Number.isInteger(factor);
    // Lo que importa no es el factor a secas: es el factor JUNTO CON el
    // filtrado. Un factor raro con suavizado interpola —feo pero parejo—; un
    // factor raro con `pixelated` reparte los píxeles del maestro en tamaños
    // DISTINTOS entre sí, y eso se ve como una cara con píxeles de dos anchos.
    const grave = !entero && i.suavizado === 'pixelated' && i.natural[0] > 0;
    console.log(
      `${grave ? 'VIVO' : '  ok '}  ${i.archivo.padEnd(26)} ${i.como.padEnd(6)} natural ${i.natural.join('x').padEnd(11)} ` +
        `pintado ${i.pintado.join('x').padEnd(15)} x${factor.toFixed(4)} ` +
        `${entero ? 'entero' : 'NO entero'} · ${i.suavizado}`
    );
  }

  console.log(
    [
      '',
      '  CÓMO SE LEE ESTA TABLA, porque el factor solo no dice nada:',
      '',
      '  Las panorámicas del galpón son 1672x941 y se pintan a 390x844: factor 0,23',
      '  y filtrado `auto`. Eso está BIEN y no puede ser de otra manera — es arte de',
      '  alta resolución achicado a la escena, con interpolación, que es para lo que',
      '  sirve la interpolación.',
      '',
      '  LO OTRO NO. Las capas de Chip son maestros de 256x256 —o sea pixel art de',
      '  verdad, con su grilla— pintados a 371, 408 y 442 px con `pixelated`. Son',
      '  AMPLIACIONES de x1,45 a x1,73, y con vecino más cercano una ampliación',
      '  fraccionaria no agranda los píxeles: los reparte en TAMAÑOS DISTINTOS. A',
      '  x1,45, unos píxeles del maestro salen de 1 px y otros de 2, en un patrón',
      '  que además se corre según dónde caiga cada capa.',
      '',
      '  O sea que la cara de Chip tiene píxeles de dos anchos. No es un blur —los',
      '  bordes siguen duros— es una grilla despareja, y es lo que hace que un',
      '  sprite ampliado se lea "raro" sin que uno pueda decir por qué.',
      '',
      '  NO SE TOCA ACÁ, y es a propósito: las salidas posibles son cambiar el',
      '  tamaño del maestro, cuantizar la caja de Chip a un múltiplo entero de 256',
      '  —lo que le cambia el tamaño en pantalla— o aceptar el remuestreo. Las tres',
      '  son decisiones sobre el arte de Damián y sobre la composición, no arreglos.',
      '  El barrido las encuentra y las mide; elegir es de otro.'
    ].join('\n')
  );
} finally {
  await cromo.cerrar();
  servidor.close();
}
