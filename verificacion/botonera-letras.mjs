// Las letras de la botonera: tres tratamientos sobre el piso real.
//
//   node verificacion/botonera-letras.mjs
//
// ---- POR QUÉ ----
//
// La tipografía de píxeles empuja hacia un 8 bits que el personaje NO ES. Chip
// es una ilustración de bordes suaves con estética de sprite —98% de la tinta de
// su cabeza es alfa parcial, ver el README— y una fuente de 3x5 con contorno
// duro es la cosa más 8 bits de toda la pantalla.
//
// Esto NO elige. Saca las tres y las mide; la decisión es de Damián.
//
//   0-como-esta    Chip Pixel a 16 px, contorno duro de 1 px en cuatro
//                  direcciones, letter-spacing 0.
//   A-sin-dureza   la MISMA fuente, sin el contorno y sin forzar el múltiplo
//                  entero. Se deja antialiasear como cualquier texto.
//   B-fuente-ui    una fuente de interfaz limpia a 13 px, sin pretensión retro.
//                  La del resto del proyecto: --fuente-instrumento.
//
// ---- QUÉ SE MIDE, Y POR QUÉ DOS COSAS ----
//
//   CONTRASTE   entre los píxeles de la letra y los que tiene alrededor, en cada
//               franja. Es la pregunta de si se lee. El contorno duro lo vuelve
//               independiente del piso; sin contorno, el piso manda.
//   A MEDIO CAMINO   cuántos píxeles de la caja no son ni la letra ni el fondo,
//               sino una mezcla de los dos. Es un PROXY de cuánto antialiasing
//               tiene el glifo, y hay que leerlo con cuidado: la caja también
//               tiene el piso del galpón, que trae sus propios tonos y no los
//               puso esta variante. Lo que se compara entre variantes es el
//               salto, no el valor absoluto.
//
// El texto se mide sobre el RENDER REAL y no sobre un canvas: `fillText` en
// canvas antialiasea siempre, y esa réplica ya dio un número falso una vez —666
// píxeles intermedios y 12 colores por fila, midiendo el canvas y no la pieza.

import { writeFileSync, mkdirSync } from 'node:fs';
import { servir } from '../tools/servir.mjs';
import { abrirCromo, dormir } from '../tools/cromo.mjs';
import { leerPng } from '../tools/png.mjs';
import { ampliarYEscribir } from '../tools/png-escribir.mjs';
import { COLORES_BOTON, FRANJAS_DIA } from '../js/config.js';

// Una hora adentro de cada franja. `desde` es inclusivo.
const HORAS = { amanecer: 7, mediodia: 13, atardecer: 19, noche: 23 };

const VARIANTES = {
  '0-como-esta': '',
  // ESTA NO ES UNA ALTERNATIVA TIPOGRÁFICA, es un control. Salió de mirar la
  // captura del 0 ampliada: el glifo tiene FLECOS ROJOS Y AZULES en los bordes,
  // color que no puso ningún dibujante sobre la pieza más dura de la pantalla.
  //
  // La sospecha era el antialiasing de subpíxel de Chrome, y ESTE CONTROL LA
  // DESCARTA: apagarlo no mueve un solo número —82 contra 82 en las cuatro
  // franjas—. Lo que sí los baja a cero es sacar el CONTORNO (variante A), así
  // que los flecos salen de las cuatro sombras negras apiladas debajo del glifo,
  // no de cómo se rasteriza la fuente. El contorno que existe para endurecer la
  // etiqueta es el que le está metiendo color.
  '0bis-sin-subpixel': '#acciones button { -webkit-font-smoothing: antialiased; }',
  'A-sin-dureza': `
    #acciones button {
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8) !important;
      -webkit-font-smoothing: antialiased;
    }`,
  'B-fuente-ui': `
    #acciones button {
      font-family: var(--fuente-instrumento) !important;
      font-size: 13px !important;
      letter-spacing: 0.02em !important;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8) !important;
    }`
};

const AMPLIACION = 4;
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
  await cromo.enviar('Page.addScriptToEvaluateOnNewDocument', {
    source: `try {
      const s = JSON.parse(localStorage.getItem('chip.save.v1') || '{}');
      localStorage.setItem('chip.save.v1', JSON.stringify({
        ...s, bateria: 40, humor: 40, mantenimiento: 40,
        ajustes: { ...(s.ajustes || {}), sonido: false }
      }));
    } catch (e) {}`
  });
  await cromo.enviar('Page.navigate', { url: `http://127.0.0.1:${puerto}/index.html?debug` });
  await dormir(3000);

  const ev = async (expr) =>
    (await cromo.enviar('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }))
      .result.value;

  // Todo quieto, el velo escondido —no congelado, que lo deja tapando la escena
  // para siempre— y el panel de debug invisible pero operable.
  await ev(`(() => {
    const e = document.createElement('style');
    e.textContent =
      '*, *::before, *::after { animation: none !important; transition: none !important; }' +
      ' #apertura { display: none !important; }' +
      ' #panel-debug { opacity: 0 !important; pointer-events: none !important; }';
    document.head.appendChild(e);
    return 1;
  })()`);

  const forzarHora = async (hora) =>
    ev(`(() => {
      const sel = [...document.querySelectorAll('select')].find((s) =>
        [...s.options].some((o) => o.value === '13') && [...s.options].length > 20
      );
      if (!sel) return 'no encontré el selector de hora';
      sel.value = String(${hora});
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      return 'ok';
    })()`);

  const ponerVariante = async (css) =>
    ev(`(() => {
      let e = document.getElementById('variante-letras');
      if (!e) { e = document.createElement('style'); e.id = 'variante-letras'; document.head.appendChild(e); }
      e.textContent = ${JSON.stringify(css)};
      return 1;
    })()`);

  const canal = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const L = (r, g, b) => 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
  const contraste = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

  const tinta = [1, 3, 5].map((i) => parseInt(COLORES_BOTON.texto.slice(i, i + 2), 16));

  console.log('LAS LETRAS DE LA BOTONERA, sobre el piso real de las cuatro franjas.\n');
  console.log('franja      variante        contraste   px de letra   px intermedios (borde blando)');
  console.log('-'.repeat(86));

  const filas = [];

  for (const franja of FRANJAS_DIA) {
    const hora = HORAS[franja.nombre];
    const ok = await forzarHora(hora);
    if (ok !== 'ok') {
      console.log(`${franja.nombre}: ${ok}. NO HAY MEDICIÓN.`);
      continue;
    }
    await dormir(900);

    for (const [nombre, css] of Object.entries(VARIANTES)) {
      await ponerVariante(css);
      await dormir(350);

      // LA CAJA DE LA ETIQUETA. Se pide con un Range sobre el nodo de texto, que
      // da la caja de las letras y no la del botón; si no hay nodo de texto
      // —porque alguien envolvió la etiqueta en un span— se cae a la mitad de
      // abajo del botón, que es donde la etiqueta vive por layout.
      //
      // Devuelve 'no' en vez de tirar: un throw adentro de Runtime.evaluate
      // vuelve como `undefined` y el JSON.parse explota tres líneas después,
      // lejos de la causa.
      const cruda = await ev(`(() => {
        try {
          const b = document.querySelector('#acciones button');
          const nodo = [...b.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
          let c;
          if (nodo) {
            const r = document.createRange();
            r.selectNodeContents(nodo);
            c = r.getBoundingClientRect();
          } else {
            const rb = b.getBoundingClientRect();
            c = { left: rb.left, top: rb.top + rb.height * 0.55, width: rb.width, height: rb.height * 0.45 };
          }
          if (!c.width || !c.height) return 'no';
          return JSON.stringify({ x: Math.floor(c.left) - 2, y: Math.floor(c.top) - 2,
            width: Math.ceil(c.width) + 4, height: Math.ceil(c.height) + 4 });
        } catch (e) { return 'no: ' + e.message; }
      })()`);

      if (typeof cruda !== 'string' || cruda.startsWith('no')) {
        console.log(`${franja.nombre.padEnd(12)}${nombre.padEnd(16)}${cruda ?? 'sin respuesta'}. NO HAY MEDICIÓN.`);
        continue;
      }
      const caja = JSON.parse(cruda);

      if (caja.width < 8 || caja.height < 6) {
        console.log(`${franja.nombre.padEnd(12)}${nombre.padEnd(16)}la etiqueta no tiene caja. NO HAY MEDICIÓN.`);
        continue;
      }

      const foto = await cromo.enviar('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: false,
        clip: { ...caja, scale: 1 }
      });
      const png = Buffer.from(foto.data, 'base64');
      const img = leerPng(png);

      // Los píxeles de LETRA: cerca del color del texto. El resto es fondo,
      // que a esta altura es el contorno negro o el piso, según la variante.
      let letra = [0, 0, 0, 0];
      let fondo = [0, 0, 0, 0];
      let intermedios = 0;
      const tonos = new Set();
      for (let i = 0; i < img.datos.length; i += img.canales) {
        const r = img.datos[i], g = img.datos[i + 1], b = img.datos[i + 2];
        tonos.add((r << 16) | (g << 8) | b);
        const cerca =
          Math.abs(r - tinta[0]) < 40 && Math.abs(g - tinta[1]) < 40 && Math.abs(b - tinta[2]) < 40;
        const dest = cerca ? letra : fondo;
        dest[0] += r; dest[1] += g; dest[2] += b; dest[3]++;

        // PÍXELES INTERMEDIOS: los que están A MEDIO CAMINO del color del texto.
        // Son los del borde antialiaseado del glifo, y es la única cuenta que
        // separa un tratamiento duro de uno blando. El conteo de tonos de la
        // caja NO sirve para eso: lo domina el piso del galpón, que tiene
        // cientos de tonos propios y no los puso esta variante.
        const d = Math.hypot(r - tinta[0], g - tinta[1], b - tinta[2]);
        if (d >= 40 && d <= 130) intermedios++;
      }

      if (!letra[3] || !fondo[3]) {
        console.log(`${franja.nombre.padEnd(12)}${nombre.padEnd(16)}no separé letra de fondo. NO HAY MEDICIÓN.`);
        continue;
      }

      const media = (a) => L(a[0] / a[3], a[1] / a[3], a[2] / a[3]);
      const c = contraste(media(letra), media(fondo));

      filas.push({ franja: franja.nombre, variante: nombre, contraste: c, tonos: tonos.size, px: letra[3], intermedios });
      console.log(
        franja.nombre.padEnd(12) + nombre.padEnd(16) +
          c.toFixed(2).padStart(9) + '   ' +
          String(letra[3]).padStart(11) + '   ' + String(intermedios).padStart(14)
      );

      ampliarYEscribir(img, AMPLIACION, `${SALIDA}letras-${franja.nombre}-${nombre}-x${AMPLIACION}.png`);
    }
    console.log('');
  }

  console.log('LECTURA\n');
  for (const v of Object.keys(VARIANTES)) {
    const suyas = filas.filter((f) => f.variante === v);
    if (!suyas.length) continue;
    const peor = Math.min(...suyas.map((f) => f.contraste));
    const inter = Math.round(suyas.reduce((a, f) => a + f.intermedios, 0) / suyas.length);
    const spread = Math.max(...suyas.map((f) => f.contraste)) - peor;
    console.log(
      `  ${v.padEnd(16)} peor contraste ${peor.toFixed(2)} · ` +
        `varía ${spread.toFixed(2)} entre franjas · ${inter} px a medio camino`
    );
  }
  console.log('');
  console.log('  "varía" es la clave del contorno: cuanto menos varía entre franjas, menos');
  console.log('  depende la etiqueta del piso que le toque. Es lo que el contorno duro compra.');
  console.log('  "a medio camino" son los píxeles APENAS más oscuros que la letra: el borde');
  console.log('  del glifo. Es un proxy y hay que leer el SALTO entre variantes, no el valor:');
  console.log('  la caja también trae el piso del galpón, que tiene tonos que no puso nadie acá.');
  console.log('');
  console.log(`  Capturas en verificacion/capturas/, ampliadas x${AMPLIACION}.`);
  console.log('  NO SE ELIGIÓ NADA: las tres están en el repo y la hoja sigue con la 0.');
} finally {
  await cromo.cerrar();
  servidor.close();
}
