// La unión del cable con el pecho, medida antes de rediseñarla.
//
//   node verificacion/cable-union.mjs
//
// ---- LA QUEJA ----
//
// "El cable es angosto y no conecta bien, el conector es un cuadrado que no
// cubre la zona." Son dos piezas que se tocan, no una unión.
//
// ---- LOS NÚMEROS QUE MANDAN ----
//
//   1. EL GROSOR REAL DEL CABLE en píxeles. Hoy sale de un % del eje pecho->toma
//      y nadie lo mira en píxeles.
//   2. EL MÓDULO CIAN DEL PECHO: dónde empieza y dónde termina el brillo al que
//      el cable se enchufa. La brida tiene que ser MÁS GRANDE que eso — ése es
//      el número que manda sobre el diseño de la pieza.
//   3. LA PIEZA DE HOY: cuánto mide el conector actual, para saber cuánto le
//      falta.
//
// El cian se busca POR COLOR sobre el render y no por la tabla de config: la
// tabla dice dónde está el módulo en el lienzo del sprite —x 48,4-57,0, y
// 75,4-86,7— y eso es una medición sobre otro archivo. Lo que manda es dónde
// está el cian AHORA, a 390x844, con el cable ya encima.

import { servir } from '../tools/servir.mjs';
import { abrirCromo, dormir } from '../tools/cromo.mjs';
import { leerPng } from '../tools/png.mjs';
import { CONECTOR_PECHO, CABLE } from '../js/config.js';

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
  // EL CABLE SÓLO EXISTE CARGANDO — 'en los demás estados no hay nada
  // enchufado', dice la hoja. Así que la medición se hace con el panel de debug
  // abierto, forzando ese estado. Sin esto el SVG del cable está vacío y la
  // página informa que Chip no se montó, que es cierto y no es el punto.
  await cromo.enviar('Page.navigate', { url: `http://127.0.0.1:${puerto}/index.html?debug` });
  await dormir(3000);

  const ev = async (expr) =>
    (await cromo.enviar('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }))
      .result.value;

  // El velo de apertura se ESCONDE, no se congela: apagarle la animación lo deja
  // tapando la escena para siempre. Es la lección que la hoja ya tiene escrita en
  // su bloque de movimiento reducido.
  await ev(`(() => {
    const e = document.createElement('style');
    e.textContent =
      '*, *::before, *::after { animation: none !important; transition: none !important; }' +
      ' #apertura { display: none !important; }' +
      ' #panel-debug { opacity: 0 !important; pointer-events: none !important; }';
    document.head.appendChild(e);
    return 1;
  })()`);

  // Forzar `cargando` desde el select del panel de debug.
  const forzado = await ev(`(() => {
    const sel = [...document.querySelectorAll('select')].find((s) =>
      [...s.options].some((o) => o.value === 'cargando')
    );
    if (!sel) return 'no encontré el selector de estado visual';
    sel.value = 'cargando';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    return 'ok';
  })()`);
  if (forzado !== 'ok') {
    console.log(forzado + '. NO HAY MEDICIÓN.');
    process.exit(1);
  }
  await dormir(900);

  // Esperar a que Chip esté en la escena con su cable.
  const limite = Date.now() + 25000;
  let listo = false;
  while (Date.now() < limite) {
    listo = await ev(`(() => {
      const c = document.getElementById('chip');
      const cable = document.getElementById('cable');
      return Boolean(c && c.getBoundingClientRect().width > 10 && cable && cable.querySelector('.cable-cuerpo'));
    })()`);
    if (listo) break;
    await dormir(500);
  }
  if (!listo) {
    console.log('Chip no llegó a montarse con su cable en 25 s. NO HAY MEDICIÓN.');
    process.exit(1);
  }

  const geo = JSON.parse(
    await ev(`(() => {
      const chip = document.getElementById('chip').getBoundingClientRect();
      // EL CABLE ES UNA CINTA RELLENA, NO UN TRAZO: strokeWidth no dice su
      // grosor. El grosor se mide aparte, sobre los píxeles.
      // (Sin comillas invertidas: esto vive adentro de un template literal.)
      const conector = document.querySelector('.cable-conector-cuerpo');
      const cc = conector ? conector.getBoundingClientRect() : null;
      return JSON.stringify({
        chip: { x: chip.left, y: chip.top, w: chip.width, h: chip.height },
        conector: cc ? { w: cc.width, h: cc.height } : null
      });
    })()`)
  );

  // El punto de enchufe, en píxeles: es % de la CAJA DE CHIP, que es la unidad
  // del punto entero.
  const enchufe = {
    x: geo.chip.x + (CONECTOR_PECHO.x / 100) * geo.chip.w,
    y: geo.chip.y + (CONECTOR_PECHO.y / 100) * geo.chip.h
  };

  // Una ventana generosa alrededor del enchufe: 60 px de lado.
  const R = 30;
  const caja = {
    x: Math.round(enchufe.x - R),
    y: Math.round(enchufe.y - R),
    width: R * 2,
    height: R * 2
  };

  const foto = await cromo.enviar('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
    clip: { ...caja, scale: 1 }
  });
  const img = leerPng(Buffer.from(foto.data, 'base64'));

  // ---- El cian ----
  //
  // Cian del pecho: azul y verde altos, rojo claramente por debajo. No se compara
  // contra un hex fijo porque el módulo tiene su propio degradé dibujado y el
  // cable le pasa un pulso por encima.
  const esCian = (r, g, b) => b > 120 && g > 110 && r < g - 40 && r < b - 40;

  let cian = null;
  for (let y = 0; y < img.alto; y++) {
    for (let x = 0; x < img.ancho; x++) {
      const p = (y * img.ancho + x) * img.canales;
      if (!esCian(img.datos[p], img.datos[p + 1], img.datos[p + 2])) continue;
      if (!cian) cian = { x0: x, x1: x, y0: y, y1: y, n: 0 };
      cian.x0 = Math.min(cian.x0, x);
      cian.x1 = Math.max(cian.x1, x);
      cian.y0 = Math.min(cian.y0, y);
      cian.y1 = Math.max(cian.y1, y);
      cian.n++;
    }
  }

  // ---- EL GROSOR DEL CABLE, sobre los píxeles ----
  //
  // Se busca la COLUMNA más lejana del conector dentro de la ventana y se cuenta
  // cuántas filas seguidas son del gris del tubo. Lejos del conector para no
  // contar la pieza; una columna y no un promedio porque el cable ahí baja casi
  // vertical y una columna lo cruza perpendicular.
  const esTubo = (r, g, b) => {
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    // El tubo es gris azulado medio-oscuro: sin saturación fuerte y sin llegar a
    // negro. El piso del galpón a esa altura es más oscuro y más cálido.
    return lum > 40 && lum < 130 && Math.abs(r - b) < 30 && b >= r;
  };

  let grosorMedido = 0;
  let columnaUsada = -1;
  for (let x = img.ancho - 1; x >= 0; x--) {
    let mejor = 0;
    let corrida = 0;
    for (let y = 0; y < img.alto; y++) {
      const p = (y * img.ancho + x) * img.canales;
      if (esTubo(img.datos[p], img.datos[p + 1], img.datos[p + 2])) {
        corrida++;
        mejor = Math.max(mejor, corrida);
      } else corrida = 0;
    }
    if (mejor >= 3 && mejor <= 30) {
      grosorMedido = mejor;
      columnaUsada = x;
      break;
    }
  }

  const enPx = (v) => v.toFixed(2);
  const ejePecho = geo.chip.w; // la caja de Chip, que es la unidad del conector

  console.log('LA UNIÓN DEL CABLE CON EL PECHO, a 390x844\n');
  console.log(`  caja de Chip                ${enPx(geo.chip.w)} x ${enPx(geo.chip.h)} px`);
  console.log(`  punto de enchufe            ${enPx(enchufe.x)} , ${enPx(enchufe.y)}  (${CONECTOR_PECHO.x}% , ${CONECTOR_PECHO.y}% de la caja)`);
  console.log('');
  if (!grosorMedido) {
    console.log('  GROSOR DEL CABLE            no se encontró el tubo en la ventana. NO HAY MEDICIÓN.');
  } else {
    console.log(`  GROSOR DEL CABLE            ${grosorMedido} px medidos en la columna x=${columnaUsada - R} del enchufe`);
    console.log(`     declarado                CABLE.grosor = ${CABLE.grosor}% del eje pecho->toma`);
    console.log(`     +40% daría              ${enPx(grosorMedido * 1.4)} px   -> CABLE.grosor ${(CABLE.grosor * 1.4).toFixed(2)}`);
    console.log(`     +70% daría              ${enPx(grosorMedido * 1.7)} px   -> CABLE.grosor ${(CABLE.grosor * 1.7).toFixed(2)}`);
  }
  console.log('');
  // La pieza tiene tres tramos: el que se mide acá es el PRIMERO del grupo, que
  // es la brida — la que tapa la zona del puerto y la que tiene que ser más
  // grande que el salto.
  console.log(`  BRIDA DE HOY                ${geo.conector ? enPx(geo.conector.w) + ' de largo x ' + enPx(geo.conector.h) + ' de ancho' : 'no está'} px`);
  for (const tramo of ['brida', 'cuerpo', 'boca']) {
    console.log(
      `     ${tramo.padEnd(8)}             ${CONECTOR_PECHO[tramo].ancho}% de ancho = ` +
        `${enPx((CONECTOR_PECHO[tramo].ancho / 100) * ejePecho)} px`
    );
  }
  console.log('');

  if (!cian) {
    console.log('  NO SE ENCONTRÓ CIAN en la ventana. Sin ese número no hay diseño de brida.');
  } else {
    const ancho = cian.x1 - cian.x0 + 1;
    const alto = cian.y1 - cian.y0 + 1;
    console.log(`  MÓDULO CIAN                 ${ancho} x ${alto} px  (${cian.n} píxeles cian)`);
    console.log(`     respecto del enchufe     x de ${cian.x0 - R} a ${cian.x1 - R} · y de ${cian.y0 - R} a ${cian.y1 - R}`);
    console.log('');
    console.log('  EL SALTO QUE LA BRIDA TIENE QUE ESCALONAR');
    console.log(`     módulo cian              ${ancho} px de ancho`);
    console.log(`     cable                    ${grosorMedido || '?'} px`);
    console.log(`     brida                    ${geo.conector ? enPx(geo.conector.h) : '?'} px`);
    console.log('');
    console.log('     Una brida del ancho del módulo lo TAPARÍA entero, y ese módulo lo');
    console.log('     dibujó el ilustrador. La brida está a mitad de camino a propósito:');
    console.log('     le da un escalón al salto sin llevarse el brillo por delante.');
  }
} finally {
  await cromo.cerrar();
  servidor.close();
}
