// La unión del cable con el pecho, ampliada para mirarla.
//
//   node verificacion/cable-capturas.mjs
//
// Saca la misma ventana alrededor del enchufe en cuatro estados y las escribe en
// verificacion/capturas/. La ampliación es POR ENTEROS y con vecino más cercano:
// ampliar con interpolación una pieza que se viene limpiando de tonos
// intermedios sería agregarle justo lo que se le sacó.
//
//   antes           el conector cuadrado y el cable de 7,6 px, como estaba
//   engorde-40      lo que se eligió
//   engorde-70      el otro escalón que se pidió
//
// "antes" se reconstruye pisando las variables en vivo, no sacando el código:
// una comparación contra una versión que ya no existe no se puede volver a
// correr, y esta página tiene que servir la próxima vez que se toque la pieza.

import { writeFileSync, mkdirSync } from 'node:fs';
import { servir } from '../tools/servir.mjs';
import { abrirCromo, dormir } from '../tools/cromo.mjs';
import { leerPng } from '../tools/png.mjs';
import { CONECTOR_PECHO, CABLE } from '../js/config.js';

const AMPLIACION = 8;
const R = 34; // radio de la ventana alrededor del enchufe

const SALIDA = new URL('capturas/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
mkdirSync(SALIDA, { recursive: true });

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
  await cromo.enviar('Page.navigate', { url: `http://127.0.0.1:${puerto}/index.html?debug` });
  await dormir(3000);

  const ev = async (expr) =>
    (await cromo.enviar('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }))
      .result.value;

  await ev(`(() => {
    const e = document.createElement('style');
    e.textContent =
      '*, *::before, *::after { animation: none !important; transition: none !important; }' +
      ' #apertura { display: none !important; }' +
      ' #panel-debug { opacity: 0 !important; pointer-events: none !important; }';
    document.head.appendChild(e);
    return 1;
  })()`);

  const forzado = await ev(`(() => {
    const sel = [...document.querySelectorAll('select')].find((s) =>
      [...s.options].some((o) => o.value === 'cargando')
    );
    if (!sel) return 'no encontré el selector';
    sel.value = 'cargando';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    return 'ok';
  })()`);
  if (forzado !== 'ok') {
    console.log(forzado + '. NO HAY CAPTURAS.');
    process.exit(1);
  }
  await dormir(1000);

  const geo = JSON.parse(
    await ev(`(() => {
      const c = document.getElementById('chip').getBoundingClientRect();
      return JSON.stringify({ x: c.left, y: c.top, w: c.width, h: c.height });
    })()`)
  );
  const caja = {
    x: Math.round(geo.x + (CONECTOR_PECHO.x / 100) * geo.w - R),
    y: Math.round(geo.y + (CONECTOR_PECHO.y / 100) * geo.h - R),
    width: R * 2,
    height: R * 2
  };

  // ---- El PNG ampliado, escrito a mano ----
  //
  // Chrome puede capturar a escala, pero lo hace INTERPOLANDO. Para mirar una
  // pieza de píxeles hay que ampliarla con vecino más cercano, así que se
  // captura a 1:1 y se repite cada píxel acá.
  const { deflateSync } = await import('node:zlib');
  const { createHash } = await import('node:crypto');

  function escribirPng(img, factor, ruta) {
    const W = img.ancho * factor;
    const H = img.alto * factor;
    const filas = Buffer.alloc(H * (W * 3 + 1));

    for (let y = 0; y < H; y++) {
      const base = y * (W * 3 + 1);
      filas[base] = 0; // filtro None
      const oy = Math.floor(y / factor);
      for (let x = 0; x < W; x++) {
        const ox = Math.floor(x / factor);
        const p = (oy * img.ancho + ox) * img.canales;
        filas[base + 1 + x * 3] = img.datos[p];
        filas[base + 1 + x * 3 + 1] = img.datos[p + 1];
        filas[base + 1 + x * 3 + 2] = img.datos[p + 2];
      }
    }

    const trozo = (tipo, datos) => {
      const largo = Buffer.alloc(4);
      largo.writeUInt32BE(datos.length);
      const cuerpo = Buffer.concat([Buffer.from(tipo, 'ascii'), datos]);
      const crc = Buffer.alloc(4);
      crc.writeUInt32BE(crc32(cuerpo));
      return Buffer.concat([largo, cuerpo, crc]);
    };

    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(W, 0);
    ihdr.writeUInt32BE(H, 4);
    ihdr[8] = 8; // bits por canal
    ihdr[9] = 2; // RGB
    ihdr[10] = 0;
    ihdr[11] = 0;
    ihdr[12] = 0;

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

  // CRC-32 del estándar PNG. Cuarenta líneas de tabla o seis de cálculo directo:
  // van las seis, que se leen mejor y corren una vez por captura.
  let TABLA = null;
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

  const capturar = async (nombre) => {
    const foto = await cromo.enviar('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
      clip: { ...caja, scale: 1 }
    });
    const img = leerPng(Buffer.from(foto.data, 'base64'));
    escribirPng(img, AMPLIACION, `${SALIDA}cable-union-${nombre}-x${AMPLIACION}.png`);
    console.log(`  ${nombre.padEnd(14)} ${img.ancho}x${img.alto} px -> x${AMPLIACION}`);
  };

  console.log(`Ventana de ${R * 2}x${R * 2} px alrededor del enchufe, ampliada x${AMPLIACION}`);
  console.log(`CABLE.grosor = ${CABLE.grosor}%\n`);

  // EL NOMBRE VIENE POR ARGUMENTO, y el grosor sale de la constante REAL.
  //
  // La tentación era pisar el grosor desde el navegador para sacar las tres
  // capturas de una corrida. No se puede sin mentir: el grosor viaja adentro del
  // path del cable, así que pisarlo por CSS da otra cosa parecida. Y una captura
  // que no es del código que dice ser es peor que ninguna.
  //
  // Así que se corre una vez por variante, cambiando CABLE.grosor en config.js:
  //
  //   node verificacion/cable-capturas.mjs antes        (con grosor 2.58)
  //   node verificacion/cable-capturas.mjs engorde-40   (con grosor 3.61)
  //   node verificacion/cable-capturas.mjs engorde-70   (con grosor 4.39)
  const nombre = process.argv[2] || `grosor-${String(CABLE.grosor).replace('.', ',')}`;
  await capturar(nombre);
} finally {
  await cromo.cerrar();
  servidor.close();
}
