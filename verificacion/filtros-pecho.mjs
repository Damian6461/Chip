// Los dos filtros que quedaban en el pecho, medidos antes de tocarlos.
//
//   node verificacion/filtros-pecho.mjs
//
// ---- QUÉ PREGUNTA CONTESTA ----
//
// Quedan dos `drop-shadow` con difuminado sobre piezas de pixel art:
//
//   #pantalla-numero svg   drop-shadow(0 0 2px ...) sobre una fuente de 3x5
//                          píxeles dibujada a mano, con shape-rendering
//                          crispEdges puesto explícitamente.
//   #rayo svg              drop-shadow(0 0 3px ...) sobre el rayo del pecho,
//                          que además va con mix-blend-mode: screen.
//
// La regla que se les aplica es la misma que se le aplicó al pulso del cable:
// si el resplandor YA está dibujado en la forma, el filtro es un tercero encima
// y se va; si no está, va un anillo escalonado. Y `crispEdges` no protege de
// nada acá — se aplica ANTES del filtro, así que el filtro no lo ve.
//
// Lo que se mide es lo que el filtro AGREGA: se captura la región con el filtro
// puesto y con `filter: none`, y se diffea. Sale cuántos píxeles cambia, cuánto
// los cambia, y hasta dónde llega — que es la pregunta de verdad, porque un
// resplandor que se derrama diez píxeles afuera de una pieza de tres no es un
// resplandor, es una mancha.

import { servir } from '../tools/servir.mjs';
import { abrirCromo, dormir } from '../tools/cromo.mjs';
import { leerPng } from '../tools/png.mjs';

const ANCHO = 390;
const ALTO = 844;
const MARGEN = 12; // aire alrededor de la pieza, para ver hasta dónde derrama

const SUJETOS = [
  { nombre: 'el número del pecho', selector: '#pantalla-numero svg' },
  { nombre: 'el rayo del pecho', selector: '#rayo svg' }
];

const { servidor, puerto } = await servir(0);
const cromo = await abrirCromo({ ancho: ANCHO, alto: ALTO });

try {
  await cromo.enviar('Page.enable');
  await cromo.enviar('Runtime.enable');
  await cromo.enviar('Emulation.setDeviceMetricsOverride', {
    width: ANCHO,
    height: ALTO,
    deviceScaleFactor: 1,
    mobile: true
  });
  await cromo.enviar('Page.addScriptToEvaluateOnNewDocument', {
    source: `try {
      const s = JSON.parse(localStorage.getItem('chip.save.v1') || '{}');
      localStorage.setItem('chip.save.v1', JSON.stringify({
        ...s, bateria: 72, humor: 72, mantenimiento: 72,
        ajustes: { ...(s.ajustes || {}), movimientoReducido: false, sonido: false }
      }));
    } catch (e) {}`
  });
  await cromo.enviar('Page.navigate', { url: `http://127.0.0.1:${puerto}/index.html` });
  await dormir(2500);

  // ESPERAR A QUE EL PECHO ESTÉ PRENDIDO, y no medir mientras no lo esté.
  //
  // `esperando` —Chip aguantando el paso de un gigante— apaga la pantalla del
  // pecho y el rayo. Dura 9 s y puede arrancar hasta 8 s después de abrir, así
  // que una de cada varias corridas caía justo ahí. Y esta página no se daba
  // cuenta: informaba caja de 0x0, opacidad 0 y "el filtro cambia 0 píxeles",
  // que se lee como "el filtro no hace nada" y es "no había nada que filtrar".
  //
  // Es la MISMA falsa lectura que este archivo ya denunciaba tres párrafos más
  // abajo, con el rayo a opacidad 0,22. La primera vez costó una medición; la
  // segunda, con el aviso escrito al lado, costó otra. Por eso ahora no se
  // espera y ya: se espera Y se verifica antes de imprimir un solo número.
  const listo = Date.now() + 20000;
  while (Date.now() < listo) {
    const ok = await cromo.enviar('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const n = document.querySelector('#pantalla-numero svg');
        const r = document.querySelector('#rayo');
        return Boolean(n && n.getBoundingClientRect().width > 0 &&
          r && parseFloat(getComputedStyle(r).opacity) > 0.05);
      })()`
    });
    if (ok.result.value) break;
    await dormir(500);
  }

  // LAS ANIMACIONES SE PAUSAN, NO SE APAGAN, Y LA DIFERENCIA COSTÓ UNA MEDICIÓN.
  //
  // La primera versión de esto usaba `movimientoReducido`, que es el camino
  // obvio para que la pieza no lata entre las dos capturas. Y con eso el rayo
  // informó "0 píxeles cambiados": el filtro no hacía nada. Era mentira del
  // método — con movimiento reducido la hoja le clava `opacity: 0.22` al rayo, y
  // a esa opacidad la mezcla `screen` con el pecho ya saturado devuelve lo mismo
  // con halo y sin halo. Medido después a opacidad plena: 13 464 píxeles
  // cambiados, delta 255.
  //
  // Un cero que sale de haber apagado el sujeto no es un cero. Pausar deja la
  // pieza EN SU ESTADO REAL y congelada, que es lo que hacía falta.
  await cromo.enviar('Runtime.evaluate', {
    expression: `(() => {
      const e = document.createElement('style');
      e.textContent = '*, *::before, *::after { animation-play-state: paused !important; }';
      document.head.appendChild(e);
      return 1;
    })()`
  });
  await dormir(200);

  const evaluar = async (expr) => {
    const { result } = await cromo.enviar('Runtime.evaluate', {
      expression: expr,
      returnByValue: true
    });
    return result.value;
  };

  const capturar = async (caja) => {
    const foto = await cromo.enviar('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
      clip: { ...caja, scale: 1 }
    });
    return leerPng(Buffer.from(foto.data, 'base64'));
  };

  for (const sujeto of SUJETOS) {
    const crudo = await evaluar(`(() => {
      const n = document.querySelector(${JSON.stringify(sujeto.selector)});
      if (!n) return 'null';
      const r = n.getBoundingClientRect();
      return JSON.stringify({
        x: r.left, y: r.top, w: r.width, h: r.height,
        filtro: getComputedStyle(n).filter,
        mezcla: getComputedStyle(n.parentElement).mixBlendMode,
        // La opacidad del padre queda en el informe porque es lo que hizo
        // mentir a la primera medición: un sujeto casi apagado no puede
        // mostrar lo que le agrega un filtro.
        opacidad: getComputedStyle(n.parentElement).opacity
      });
    })()`);

    if (crudo === 'null') {
      console.log(`--- ${sujeto.nombre}: NO ESTÁ EN EL DOM. No hay medición. ---\n`);
      continue;
    }
    const info = JSON.parse(crudo);

    // Y la red, por si la espera de arriba se agotó igual: un sujeto sin caja o
    // apagado no produce un cero, produce NADA. Decirlo es la única salida
    // honesta; imprimir ceros sería firmar una medición que no se hizo.
    if (info.w < 1 || info.h < 1 || parseFloat(info.opacidad) < 0.05) {
      console.log(
        `--- ${sujeto.nombre}: EL SUJETO ESTÁ APAGADO ` +
          `(caja ${info.w.toFixed(1)}x${info.h.toFixed(1)}, opacidad ${info.opacidad}). ` +
          'No hay medición: probablemente estaba pasando un gigante. Corré de nuevo. ---\n'
      );
      continue;
    }

    const caja = {
      x: Math.max(0, Math.floor(info.x) - MARGEN),
      y: Math.max(0, Math.floor(info.y) - MARGEN),
      width: Math.ceil(info.w) + MARGEN * 2,
      height: Math.ceil(info.h) + MARGEN * 2
    };

    const con = await capturar(caja);
    await evaluar(`(() => {
      const e = document.createElement('style');
      e.id = 'sin-filtro';
      e.textContent = ${JSON.stringify(sujeto.selector)} + ' { filter: none !important; }';
      document.head.appendChild(e);
      return 1;
    })()`);
    await dormir(150);
    const sin = await capturar(caja);
    await evaluar(`document.getElementById('sin-filtro').remove(), 1`);
    await dormir(150);

    // ---- El diff ----
    let cambiados = 0;
    let maxDelta = 0;
    let sumaDelta = 0;
    // Hasta dónde llega el cambio, medido como distancia al borde de la caja de
    // la pieza: 0 quiere decir "adentro de la pieza", 5 quiere decir "cinco
    // píxeles afuera".
    let derrame = 0;
    const izq = Math.floor(info.x) - caja.x;
    const arr = Math.floor(info.y) - caja.y;
    const der = izq + Math.ceil(info.w);
    const aba = arr + Math.ceil(info.h);

    for (let y = 0; y < con.alto; y++) {
      for (let x = 0; x < con.ancho; x++) {
        const p = (y * con.ancho + x) * con.canales;
        const d = Math.max(
          Math.abs(con.datos[p] - sin.datos[p]),
          Math.abs(con.datos[p + 1] - sin.datos[p + 1]),
          Math.abs(con.datos[p + 2] - sin.datos[p + 2])
        );
        if (d === 0) continue;
        cambiados++;
        sumaDelta += d;
        maxDelta = Math.max(maxDelta, d);
        const fuera = Math.max(0, izq - x, x - (der - 1), arr - y, y - (aba - 1));
        derrame = Math.max(derrame, fuera);
      }
    }

    // Y los tonos: cuántos valores distintos hay adentro de la pieza, con y sin
    // el filtro. Un pixel art de dos colores tiene dos tonos; si con el filtro
    // hay cuarenta, el filtro los inventó.
    const tonosDe = (img) => {
      const s = new Set();
      for (let y = arr; y < aba; y++) {
        for (let x = izq; x < der; x++) {
          const p = (y * img.ancho + x) * img.canales;
          s.add(`${img.datos[p]},${img.datos[p + 1]},${img.datos[p + 2]}`);
        }
      }
      return s.size;
    };

    console.log(`--- ${sujeto.nombre} (${sujeto.selector}) ---`);
    console.log(`  caja ${info.w.toFixed(1)}x${info.h.toFixed(1)} px · mezcla del padre: ${info.mezcla} · opacidad del padre: ${info.opacidad}`);
    console.log(`  filtro: ${info.filtro}`);
    console.log(`  píxeles que el filtro cambia: ${cambiados} de ${con.ancho * con.alto}`);
    console.log(`  delta máximo ${maxDelta} · delta medio ${(sumaDelta / Math.max(1, cambiados)).toFixed(1)}`);
    console.log(`  derrame afuera de la pieza: ${derrame} px`);
    console.log(`  tonos adentro de la pieza: ${tonosDe(con)} con filtro, ${tonosDe(sin)} sin filtro`);
    console.log('');
  }
} finally {
  await cromo.cerrar();
  servidor.close();
}
