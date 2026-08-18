// Dibuja los puntos del camino ENCIMA de la referencia, para poder mirarlos.
//
//   node verificacion/cable-encima.mjs
//
// Escribe verificacion/cable-encima.svg. Se abre en cualquier navegador.
//
// ---- POR QUÉ SVG Y NO PNG ----
//
// Antes esto era un .png rasterizado, y se desincronizó en silencio: Damián
// verificó marcadores contra un overlay que era una revisión ANTERIOR a la
// tabla, así que revisó tres puntos —x=147, 180 y 225— que ya estaban
// corregidos, y contó 32 marcadores donde la tabla tenía 35. Trabajo perdido de
// los dos lados, y ninguno de los dos podía saberlo mirando la imagen.
//
// Un PNG es un archivo congelado: es exactamente el problema que tuvieron los
// íconos y el que RECORRIDO_CABLE evita reconstruyéndose desde sus extremos. El
// SVG no se congela — REFERENCIA la imagen y dibuja los marcadores desde
// cable-puntos.mjs, que es la fuente. Si la tabla cambia, se regenera con este
// mismo comando y no hay nada que rasterizar.
//
// Y además: es texto. Se ve en un diff qué punto se movió y cuánto, que en un
// PNG no se ve nunca.
//
// No necesita decodificar la imagen, así que corre sin dependencias — que es
// justo lo que a los otros scripts de esta carpeta les falta: piden `sharp`, y
// sin él no se pueden correr.

import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { PUNTOS } from './cable-puntos.mjs';

// EL COMMIT CON EL QUE SE GENERÓ, ESTAMPADO ADENTRO DEL SVG.
//
// Es la última puerta abierta de esta familia de errores, y la familia ya pegó
// tres veces en un día: los íconos congelados, el cuerpo sin orugas, y este
// mismo overlay — que se verificó estando una revisión atrás de la tabla, sin
// que nadie pudiera saberlo mirándolo.
//
// Regenerar desde la tabla arregla que el archivo se desincronice. Lo que NO
// arregla es que el que lo mira no sepa contra QUÉ está verificando: un SVG al
// día y uno viejo se ven igual. Con el hash adentro, la pregunta "¿de qué
// commit es esto?" se contesta abriendo el archivo.
//
// Y va el estado del árbol también: si está sucio, el hash del commit NO
// describe lo que se dibujó. Decir "sucio" vale más que un hash que miente.
function selloDelCommit() {
  const raiz = new URL('..', import.meta.url);
  try {
    const git = (args) => execFileSync('git', args, { cwd: raiz, encoding: 'utf8' }).trim();
    const hash = git(['rev-parse', '--short', 'HEAD']);
    // El propio SVG se excluye del chequeo: generarlo ensucia el árbol, así que
    // sin esto el sello diría SUCIO siempre y la palabra dejaría de significar
    // algo. Lo que importa es si cambió alguna de sus ENTRADAS.
    const sucio = git(['status', '--porcelain'])
      .split(/\r?\n/)
      .filter((l) => l.trim() && !l.includes('verificacion/cable-encima.svg'));

    return sucio.length > 0 ? hash + ' + ÁRBOL SUCIO' : hash;
  } catch {
    // Sin git —un zip, un checkout exportado— el overlay se genera igual. Lo
    // único que no se puede hacer es mentir sobre de dónde salió.
    return 'sin git: no se pudo determinar';
  }
}

const SELLO = selloDelCommit();

// El tamaño de referencia-cable.png, leído del encabezado PNG (ancho y alto son
// dos enteros de 32 bits en el chunk IHDR, a partir del byte 16).
import { readFileSync } from 'node:fs';
const png = readFileSync(new URL('../referencia-cable.png', import.meta.url));
const W = png.readUInt32BE(16);
const H = png.readUInt32BE(20);

// El mismo rojo que tenía el overlay viejo, para que la detección por color de
// Damián siga funcionando igual: rgb(255,45,85).
const MARCA = 'rgb(255,45,85)';
const RADIO = 5;

// La ventana del método, dibujada. Es la pieza que hacía falta ver y no estaba:
// el umbral de 95 no reproduce nada sin este recorte, y hasta ahora eso era una
// frase en un comentario. Ver cable-trazado.mjs.
const VENTANA = { x0: 405, x1: 1000, y0: 370, y1: 720 };

const marcas = PUNTOS.map(([x, y], i) => {
  const etiqueta = `<text x="${x + RADIO + 3}" y="${y - RADIO - 2}" font-size="11" fill="${MARCA}" font-family="monospace">${i}</text>`;
  return `<circle cx="${x}" cy="${y}" r="${RADIO}" fill="${MARCA}"/>${etiqueta}`;
}).join('\n  ');

// La polilínea va DEBAJO de los marcadores y semitransparente, para que no tape
// el cable que hay que juzgar. Es una ayuda de lectura, no el dato.
const linea = PUNTOS.map(([x, y]) => `${x},${y}`).join(' ');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <title>Los ${PUNTOS.length} puntos del cable, sobre la referencia — ${SELLO}</title>
  <desc>Generado por verificacion/cable-encima.mjs desde verificacion/cable-puntos.mjs, en el commit ${SELLO}. Los marcadores NO están dibujados a mano: salen de la tabla, así que este archivo no puede quedar atrasado respecto de ella sin que el hash lo diga.</desc>
  <image href="../referencia-cable.png" xlink:href="../referencia-cable.png" x="0" y="0" width="${W}" height="${H}"/>
  <rect x="${VENTANA.x0}" y="${VENTANA.y0}" width="${VENTANA.x1 - VENTANA.x0}" height="${VENTANA.y1 - VENTANA.y0}"
        fill="none" stroke="rgb(90,200,255)" stroke-width="2" stroke-dasharray="8 6" opacity="0.7"/>
  <text x="${VENTANA.x0 + 6}" y="${VENTANA.y0 - 8}" font-size="14" fill="rgb(90,200,255)" font-family="monospace">ventana del trazado: x ${VENTANA.x0}-${VENTANA.x1}, y ${VENTANA.y0}-${VENTANA.y1}</text>
  <polyline points="${linea}" fill="none" stroke="${MARCA}" stroke-width="1.5" opacity="0.45"/>
  ${marcas}
  <rect x="0" y="0" width="470" height="26" fill="rgb(0,0,0)" opacity="0.55"/>
  <text x="8" y="18" font-size="13" fill="rgb(255,255,255)" font-family="monospace">${PUNTOS.length} puntos — commit ${SELLO}</text>
</svg>
`;

const destino = new URL('cable-encima.svg', import.meta.url);
writeFileSync(destino, svg);

console.log(`${PUNTOS.length} puntos sobre ${W}x${H}  ->  verificacion/cable-encima.svg`);
console.log('Se abre en el navegador. La imagen se referencia, no se copia:');
console.log('tiene que quedar al lado de referencia-cable.png.');
