// Un decodificador de PNG de ochenta líneas, sin dependencias.
//
// POR QUÉ EXISTE. Varias verificaciones de este repo tienen que MIRAR PÍXELES:
// si un borde salió duro, si una fila tiene un solo tono, cuánto derrama un
// filtro. Chrome devuelve las capturas en PNG, y para contar tonos hay que
// deshacerlo.
//
// No cubre el formato entero y no pretende: lee 8 bits por canal, RGB y RGBA,
// que es lo único que devuelve `Page.captureScreenshot`. Cualquier otra cosa
// TIRA en vez de devolver píxeles inventados — un decodificador que se equivoca
// en silencio le presta autoridad a todas las mediciones que dependen de él.
//
// Los cinco filtros por fila son los del estándar y están escritos tal cual: el
// que quiera entender de dónde salen, el spec es corto.

import { inflateSync } from 'node:zlib';

export function leerPng(buf) {
  let i = 8; // la firma de 8 bytes
  let ancho = 0;
  let alto = 0;
  let canales = 0;
  const trozos = [];

  while (i < buf.length) {
    const largo = buf.readUInt32BE(i);
    const tipo = buf.toString('ascii', i + 4, i + 8);
    const datos = buf.subarray(i + 8, i + 8 + largo);

    if (tipo === 'IHDR') {
      ancho = datos.readUInt32BE(0);
      alto = datos.readUInt32BE(4);
      if (datos[8] !== 8) throw new Error(`profundidad ${datos[8]}: sólo se leen 8 bits por canal`);
      const color = datos[9];
      canales = color === 6 ? 4 : color === 2 ? 3 : 0;
      if (!canales) throw new Error(`tipo de color ${color}: sólo se leen RGB y RGBA`);
      if (datos[12] !== 0) throw new Error('PNG entrelazado: no contemplado');
    } else if (tipo === 'IDAT') {
      trozos.push(datos);
    } else if (tipo === 'IEND') {
      break;
    }

    i += 12 + largo; // largo + tipo + datos + crc
  }

  if (!trozos.length) throw new Error('el PNG no trae datos de imagen');

  const crudo = inflateSync(Buffer.concat(trozos));
  const paso = ancho * canales;
  const salida = Buffer.alloc(alto * paso);

  for (let y = 0; y < alto; y++) {
    const filtro = crudo[y * (paso + 1)];
    const linea = crudo.subarray(y * (paso + 1) + 1, y * (paso + 1) + 1 + paso);

    for (let x = 0; x < paso; x++) {
      // a = el de la izquierda, b = el de arriba, c = el de arriba a la
      // izquierda, todos en bytes ya reconstruidos.
      const a = x >= canales ? salida[y * paso + x - canales] : 0;
      const b = y > 0 ? salida[(y - 1) * paso + x] : 0;
      const c = x >= canales && y > 0 ? salida[(y - 1) * paso + x - canales] : 0;
      let v = linea[x];

      if (filtro === 1) v += a;
      else if (filtro === 2) v += b;
      else if (filtro === 3) v += (a + b) >> 1;
      else if (filtro === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }

      salida[y * paso + x] = v & 0xff;
    }
  }

  return { ancho, alto, canales, datos: salida };
}

export const aHex = (r, g, b) =>
  '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('');
