// Escribir un PNG RGB de 8 bits, sin dependencias.
//
// El complemento de tools/png.mjs. Existe por lo mismo: varias verificaciones
// tienen que GUARDAR una captura ampliada para mirarla, y la ampliación tiene
// que ser por enteros y con vecino más cercano — ampliar con interpolación una
// pieza que se viene limpiando de tonos intermedios sería agregarle justo lo que
// se le sacó.
//
// Chrome puede capturar a escala, pero lo hace interpolando. Así que se captura
// a 1:1 y se amplía acá.

import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

let TABLA = null;

// CRC-32 del estándar PNG.
function crc32(buf) {
  if (!TABLA) {
    TABLA = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      TABLA[n] = c;
    }
  }
  let c = 0xffffffff;
  for (const b of buf) c = TABLA[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function trozo(tipo, datos) {
  const largo = Buffer.alloc(4);
  largo.writeUInt32BE(datos.length);
  const cuerpo = Buffer.concat([Buffer.from(tipo, 'ascii'), datos]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(cuerpo));
  return Buffer.concat([largo, cuerpo, crc]);
}

// `filas` viene con el byte de filtro por fila ya puesto en 0 —sin filtro— que
// es lo que corresponde para algo que se va a mirar y no a distribuir: el
// filtrado ahorra bytes y no cambia un píxel.
export function escribirPngRgb(ruta, ancho, alto, filas) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(ancho, 0);
  ihdr.writeUInt32BE(alto, 4);
  ihdr[8] = 8; // bits por canal
  ihdr[9] = 2; // RGB
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // filtro adaptativo
  ihdr[12] = 0; // sin entrelazar

  writeFileSync(
    ruta,
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      trozo('IHDR', ihdr),
      trozo('IDAT', deflateSync(filas)),
      trozo('IEND', Buffer.alloc(0))
    ])
  );
}

// Amplía una imagen decodificada por tools/png.mjs y la escribe. La ampliación
// es POR ENTEROS y con vecino más cercano: cada píxel del original se repite
// `factor` veces en cada eje y no se inventa ningún tono.
export function ampliarYEscribir(img, factor, ruta) {
  const W = img.ancho * factor;
  const H = img.alto * factor;
  const filas = Buffer.alloc(H * (W * 3 + 1));

  for (let y = 0; y < H; y++) {
    const base = y * (W * 3 + 1);
    filas[base] = 0;
    const oy = Math.floor(y / factor);
    for (let x = 0; x < W; x++) {
      const p = (oy * img.ancho + Math.floor(x / factor)) * img.canales;
      filas[base + 1 + x * 3] = img.datos[p];
      filas[base + 1 + x * 3 + 1] = img.datos[p + 1];
      filas[base + 1 + x * 3 + 2] = img.datos[p + 2];
    }
  }

  escribirPngRgb(ruta, W, H, filas);
}
