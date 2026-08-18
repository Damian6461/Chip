// Genera fuentes/chip-pixel.ttf: la fuente pixel de las etiquetas de la botonera.
//
//   node tools/fuente-chip.mjs
//
// ============================================================================
// POR QUÉ UNA FUENTE PROPIA Y NO UNA BAJADA
// ============================================================================
//
// El punto 3.5 pide una fuente pixel autohospedada y subseteada, y sugiere
// Silkscreen sin obligar. Se dibuja acá en vez de bajar una, por tres razones y
// ninguna es preferencia:
//
//   1. NO HAY PREGUNTA DE LICENCIA. La fuente es de este repo. Una OFL bajada
//      obliga a arrastrar su archivo de licencia y a respetar su nombre
//      reservado; esto no obliga a nada.
//   2. EL SUBSETEO ES POR CONSTRUCCIÓN. No se recorta una fuente de 200 glifos
//      hasta dejar 10: existen 10. No hay nada que sobre, y no hay que confiar
//      en que una herramienta de subseteo hizo bien su trabajo.
//   3. EL TAMAÑO NATIVO ES UN NÚMERO NUESTRO, no uno que hay que averiguar. Se
//      diseña a 8 px y `unitsPerEm` vale 1024, así que UN PÍXEL SON EXACTAMENTE
//      128 UNIDADES. A 8, 16 o 24 px cada píxel del diseño cae sobre un número
//      entero de píxeles de pantalla y no queda dónde meter antialiasing.
//
// Sale TTF y no WOFF2, y vale decir por qué: WOFF2 necesita brotli más las
// transformaciones propias del formato, que es mucha maquinaria para ahorrar
// sobre un archivo que ya pesa un par de KB — y el servidor lo comprime igual
// en el cable. El requisito real del punto 3.5 no es el contenedor: es que esté
// en el repo, que entre en ARCHIVOS_CACHE y que se dibuje a su tamaño nativo.
//
// ============================================================================
// EL DISEÑO
// ============================================================================
//
// Celda de 5 px de ancho por 7 de alto sobre la línea de base, más 2 de
// descuelgo para la `g` y la `p`.
//
// EL AVANCE ES PROPORCIONAL Y NO FIJO, y esto salió de mirarlo. Con un avance
// monoespaciado de 6 px, "Limpiar" se leía "Li mpi ar": la `i` ocupa tres
// columnas de las cinco, así que quedaba con dos columnas de aire de un lado y
// una del otro, y el ojo lee ese hueco como un espacio.
//
// Ahora cada glifo se recorta a las columnas que realmente usa y avanza eso
// más una de aire. La `i` avanza 4 px y la `m` 6. La `hmtx` de TrueType tiene
// una entrada por glifo justamente para esto.
//
// Los diez caracteres son los de "Cargar", "Jugar" y "Limpiar": C a r g J u L i
// m p. Más el espacio y el .notdef, que el formato exige.

import { writeFileSync, mkdirSync } from 'node:fs';

const PX = 128; // unidades por píxel de diseño
const EM = 1024; // 8 px de alto de em
const ALTO = 7; // filas sobre la línea de base
const ANCHO = 5; // columnas dibujadas
const AIRE = 1; // columnas de aire a la derecha de cada glifo
const AVANCE_ESPACIO = 3 * PX;

// Cada glifo: filas de arriba hacia abajo. `bajo` dice cuántas filas cuelgan por
// debajo de la línea de base.
const GLIFOS = {
  ' ': { bajo: 0, filas: ['.....', '.....', '.....', '.....', '.....', '.....', '.....'] },
  C: { bajo: 0, filas: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'] },
  J: { bajo: 0, filas: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'] },
  L: { bajo: 0, filas: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'] },
  a: { bajo: 0, filas: ['.....', '.....', '.###.', '....#', '.####', '#...#', '.####'] },
  g: {
    bajo: 2,
    filas: ['.....', '.....', '.###.', '#...#', '#...#', '#...#', '.####', '....#', '.###.']
  },
  i: { bajo: 0, filas: ['..#..', '.....', '.##..', '..#..', '..#..', '..#..', '.###.'] },
  m: { bajo: 0, filas: ['.....', '.....', '#####', '#.#.#', '#.#.#', '#.#.#', '#.#.#'] },
  p: {
    bajo: 2,
    filas: ['.....', '.....', '####.', '#...#', '#...#', '#...#', '####.', '#....', '#....']
  },
  r: { bajo: 0, filas: ['.....', '.....', '#.##.', '##..#', '#....', '#....', '#....'] },
  u: { bajo: 0, filas: ['.....', '.....', '#...#', '#...#', '#...#', '#..##', '.##.#'] }
};

const ORDEN = [' ', 'C', 'J', 'L', 'a', 'g', 'i', 'm', 'p', 'r', 'u'];

// ---- De la grilla a contornos ----
//
// Cada corrida horizontal de píxeles encendidos se emite como UN rectángulo, no
// cada píxel por separado: menos contornos, mismo dibujo. Los rectángulos que se
// tocan de canto no se superponen, así que el relleno non-zero los une sin
// pelearse.
//
// El sentido es siempre el mismo —horario en un sistema con la y para arriba—
// porque dos contornos con sentidos distintos se restan entre sí.
function contornosDe(glifo) {
  const rects = [];
  glifo.filas.forEach((fila, i) => {
    // La fila 0 es la de más arriba. Su borde superior está a `ALTO` píxeles de
    // la línea de base; el descuelgo sale solo cuando `i` pasa de ALTO.
    const arriba = (ALTO - i) * PX;
    const abajo = arriba - PX;
    let x = 0;
    while (x < ANCHO) {
      if (fila[x] !== '#') {
        x++;
        continue;
      }
      let fin = x;
      while (fin + 1 < ANCHO && fila[fin + 1] === '#') fin++;
      rects.push([x * PX, abajo, (fin + 1) * PX, arriba]);
      x = fin + 1;
    }
  });
  return rects;
}

// ---- Escritura binaria ----

class Bin {
  constructor() {
    this.b = [];
  }
  u8(v) {
    this.b.push(v & 0xff);
    return this;
  }
  u16(v) {
    return this.u8(v >> 8).u8(v);
  }
  i16(v) {
    return this.u16(v < 0 ? v + 0x10000 : v);
  }
  u32(v) {
    return this.u16((v >>> 16) & 0xffff).u16(v & 0xffff);
  }
  bytes(a) {
    for (const v of a) this.u8(v);
    return this;
  }
  buf() {
    return Buffer.from(this.b);
  }
}

function padear(buf) {
  const falta = (4 - (buf.length % 4)) % 4;
  return falta ? Buffer.concat([buf, Buffer.alloc(falta)]) : buf;
}

function suma(buf) {
  const p = padear(buf);
  let t = 0;
  for (let i = 0; i < p.length; i += 4) t = (t + p.readUInt32BE(i)) >>> 0;
  return t;
}

// ---- Las tablas ----

// El recorte a las columnas usadas. Devuelve los rectángulos ya corridos a la
// izquierda —para que el glifo arranque en la columna 0— y su avance.
function ajustar(glifo) {
  const rects = contornosDe(glifo);
  if (rects.length === 0) return { rects, avance: AVANCE_ESPACIO };

  const desde = Math.min(...rects.map((r) => r[0]));
  const hasta = Math.max(...rects.map((r) => r[2]));
  return {
    rects: rects.map(([x0, y0, x1, y1]) => [x0 - desde, y0, x1 - desde, y1]),
    avance: hasta - desde + AIRE * PX
  };
}

const glifos = ORDEN.map((c) => ({ car: c, ...GLIFOS[c], ...ajustar(GLIFOS[c]) }));

// El .notdef va primero y va VACÍO a propósito: si algún día se cuela un
// caracter que no está en la fuente, un hueco se ve raro; una caja se lee como
// parte del diseño y no como un error.
const todos = [{ car: null, rects: [], bajo: 0, avance: AVANCE_ESPACIO }, ...glifos];

function glifoBinario(g) {
  if (g.rects.length === 0) return Buffer.alloc(0); // glifo vacío: longitud cero

  const xs = g.rects.flatMap((r) => [r[0], r[2]]);
  const ys = g.rects.flatMap((r) => [r[1], r[3]]);
  const b = new Bin();
  b.i16(g.rects.length);
  b.i16(Math.min(...xs)).i16(Math.min(...ys)).i16(Math.max(...xs)).i16(Math.max(...ys));

  for (let i = 0; i < g.rects.length; i++) b.u16((i + 1) * 4 - 1);
  b.u16(0); // sin instrucciones

  const puntos = [];
  for (const [x0, y0, x1, y1] of g.rects) {
    // Horario con la y para arriba: sube por la izquierda, cruza arriba, baja
    // por la derecha, vuelve por abajo.
    puntos.push([x0, y0], [x0, y1], [x1, y1], [x1, y0]);
  }

  // Todos los puntos son on-curve y todos los deltas van en int16. Se podría
  // ahorrar con los flags cortos; sobre un archivo de dos KB no vale la
  // complejidad ni el riesgo de equivocar un bit.
  for (let i = 0; i < puntos.length; i++) b.u8(0x01);

  let px = 0;
  for (const [x] of puntos) {
    b.i16(x - px);
    px = x;
  }
  let py = 0;
  for (const [, y] of puntos) {
    b.i16(y - py);
    py = y;
  }

  return padear(b.buf());
}

const glyfPartes = todos.map(glifoBinario);
const glyf = Buffer.concat(glyfPartes);

const offsets = [0];
for (const p of glyfPartes) offsets.push(offsets[offsets.length - 1] + p.length);

// loca en formato largo: más simple, y no depende de que las longitudes sean
// pares.
const loca = new Bin();
for (const o of offsets) loca.u32(o);

const numGlifos = todos.length;
const todosLosY = todos.flatMap((g) => g.rects.flatMap((r) => [r[1], r[3]]));
const yMin = Math.min(0, ...todosLosY);
const yMax = Math.max(ALTO * PX, ...todosLosY);

const head = new Bin();
head
  .u32(0x00010000)
  .u32(0x00010000)
  .u32(0) // version, revision, checkSumAdjustment (se escribe al final)
  .u32(0x5f0f3cf5) // el número mágico
  .u16(0b0000000000001011)
  .u16(EM)
  .u32(0)
  .u32(0)
  .u32(0)
  .u32(0) // creado / modificado
  .i16(0)
  .i16(yMin)
  .i16(ANCHO * PX)
  .i16(yMax)
  .u16(0)
  .u16(8) // macStyle, y lowestRecPPEM en 8: el tamaño de diseño
  .i16(2)
  .i16(1) // fontDirectionHint, indexToLocFormat largo
  .u16(0);

const hhea = new Bin();
hhea
  .u32(0x00010000)
  .i16(ALTO * PX)
  .i16(yMin)
  .i16(PX) // ascender, descender, lineGap
  .u16(Math.max(...todos.map((g) => g.avance)))
  .i16(0)
  .i16(0)
  .i16(ANCHO * PX)
  .i16(1)
  .i16(0)
  .i16(0)
  .i16(0)
  .i16(0)
  .i16(0)
  .i16(0)
  .i16(0)
  .u16(numGlifos);

const maxp = new Bin();
maxp
  .u32(0x00010000)
  .u16(numGlifos)
  .u16(Math.max(...todos.map((g) => g.rects.length * 4)))
  .u16(Math.max(...todos.map((g) => g.rects.length)))
  .u16(0)
  .u16(0)
  .u16(1)
  .u16(0)
  .u16(0)
  .u16(0)
  .u16(0)
  .u16(0)
  .u16(0)
  .u16(0)
  .u16(0);

const hmtx = new Bin();
for (const g of todos) hmtx.u16(g.avance).i16(0);

// cmap formato 4, un segmento por caracter. Con once caracteres sueltos la tabla
// sale igual de chica que fusionando rangos, y es mucho más fácil de leer.
const cods = glifos
  .map((g, i) => ({ c: g.car.codePointAt(0), id: i + 1 }))
  .sort((a, b) => a.c - b.c);
const segs = cods.map((x) => ({ ini: x.c, fin: x.c, id: x.id }));
segs.push({ ini: 0xffff, fin: 0xffff, id: 0 });
const segX2 = segs.length * 2;
let busq = 2;
while (busq * 2 <= segX2) busq *= 2;
const sel = Math.log2(busq / 2);

const sub = new Bin();
sub
  .u16(4)
  .u16(16 + segs.length * 8)
  .u16(0)
  .u16(segX2)
  .u16(busq)
  .u16(sel)
  .u16(segX2 - busq);
for (const s of segs) sub.u16(s.fin);
sub.u16(0);
for (const s of segs) sub.u16(s.ini);
for (const s of segs) sub.i16(s.id === 0 ? 1 : s.id - s.ini);
for (const s of segs) sub.u16(0);

const cmapCab = new Bin();
cmapCab.u16(0).u16(1).u16(3).u16(1).u32(12);
const cmapBuf = Buffer.concat([cmapCab.buf(), sub.buf()]);

// name: los seis registros que un navegador mira.
const NOMBRES = [
  [1, 'Chip Pixel'],
  [2, 'Regular'],
  [3, 'Chip Pixel 1.0 - generado por tools/fuente-chip.mjs'],
  [4, 'Chip Pixel'],
  [5, 'Version 1.0'],
  [6, 'ChipPixel']
];
const cadenas = NOMBRES.map(([, s]) => Buffer.from(s, 'utf16le').swap16());
const nameCab = new Bin();
nameCab.u16(0).u16(NOMBRES.length).u16(6 + NOMBRES.length * 12);
let despl = 0;
NOMBRES.forEach(([id], i) => {
  nameCab.u16(3).u16(1).u16(0x0409).u16(id).u16(cadenas[i].length).u16(despl);
  despl += cadenas[i].length;
});
const nameBuf = Buffer.concat([nameCab.buf(), ...cadenas]);

const post = new Bin();
post.u32(0x00030000).u32(0).i16(0).i16(0).u32(1).u32(0).u32(0).u32(0).u32(0);

const os2 = new Bin();
os2
  .u16(4)
  .i16(Math.round(todos.reduce((t, g) => t + g.avance, 0) / todos.length))
  .u16(400)
  .u16(5)
  .u16(0)
  .i16(PX * 3)
  .i16(PX * 3)
  .i16(0)
  .i16(0)
  .i16(PX * 3)
  .i16(PX * 3)
  .i16(0)
  .i16(PX * 3)
  .i16(PX)
  .i16(PX * 3)
  .i16(8)
  .bytes([2, 0, 6, 9, 0, 0, 0, 0, 0, 0])
  .u32(1)
  .u32(0)
  .u32(0)
  .u32(0)
  .bytes([67, 72, 73, 80]) // achVendID: CHIP
  .u16(0x0040)
  .u16(cods[0].c)
  .u16(cods[cods.length - 1].c)
  .i16(ALTO * PX)
  .i16(yMin)
  .i16(0)
  .u16(ALTO * PX)
  .u16(Math.abs(yMin))
  .u32(1)
  .u32(0)
  .i16(PX * 5)
  .i16(PX * 7)
  .u16(32)
  .u16(32)
  .u16(2);

const tablas = [
  ['OS/2', os2.buf()],
  ['cmap', cmapBuf],
  ['glyf', glyf],
  ['head', head.buf()],
  ['hhea', hhea.buf()],
  ['hmtx', hmtx.buf()],
  ['loca', loca.buf()],
  ['maxp', maxp.buf()],
  ['name', nameBuf],
  ['post', post.buf()]
].sort((a, b) => (a[0] < b[0] ? -1 : 1));

const n = tablas.length;
let potencia = 1;
while (potencia * 2 <= n) potencia *= 2;
const dir = new Bin();
dir
  .u32(0x00010000)
  .u16(n)
  .u16(potencia * 16)
  .u16(Math.log2(potencia))
  .u16(n * 16 - potencia * 16);

let cursor = 12 + n * 16;
const entradas = [];
for (const [tag, buf] of tablas) {
  entradas.push({ tag, buf, offset: cursor, largo: buf.length });
  cursor += padear(buf).length;
}
for (const e of entradas) {
  dir
    .bytes([...Buffer.from(e.tag, 'ascii')])
    .u32(suma(e.buf))
    .u32(e.offset)
    .u32(e.largo);
}

const ttf = Buffer.concat([dir.buf(), ...entradas.map((e) => padear(e.buf))]);

// checkSumAdjustment se calcula sobre el archivo entero con el campo en cero y
// se escribe después. Es el único campo que depende de sí mismo.
const headEnt = entradas.find((e) => e.tag === 'head');
ttf.writeUInt32BE((0xb1b0afba - suma(ttf)) >>> 0, headEnt.offset + 8);

mkdirSync(new URL('../fuentes/', import.meta.url), { recursive: true });
writeFileSync(new URL('../fuentes/chip-pixel.ttf', import.meta.url), ttf);

console.log(`${numGlifos} glifos: ${ORDEN.filter((c) => c !== ' ').join(' ')} + espacio + .notdef`);
console.log(`unitsPerEm ${EM}, 1 px de diseño = ${PX} unidades, tamaño nativo 8 px`);
console.log('avances (px):', glifos.map((g) => `${g.car === ' ' ? '_' : g.car}${g.avance / PX}`).join(' '));
console.log(`fuentes/chip-pixel.ttf: ${ttf.length} bytes`);
