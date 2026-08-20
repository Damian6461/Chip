// Los dieciséis mínimos del contorno de la chapita, corridos de a uno.
//
//   node verificacion/botonera-minimos.mjs [#hex ...]
//
// Sin argumentos mide el naranja que está puesto. Con uno o más hex, mide cada
// candidato y los pone al lado, sin cambiar nada del código.
//
// ---- QUÉ SON LOS DIECISÉIS ----
//
// La chapita se despega del piso porque el NARANJA y el FILO NEGRO se turnan:
// sobre piso oscuro manda el naranja, sobre piso claro manda el filo. Medido:
//
//                       amanecer  mediodía  atardecer  noche
//   naranja / piso        5,91      3,32       5,78     8,81
//   filo negro / piso     1,78      3,16       1,82     1,19
//
// Así que lo que hay que garantizar no es el contraste del naranja: es que en
// CADA LADO de la pieza y en CADA FRANJA, uno de los dos esté trabajando. Cuatro
// franjas por cuatro lados son dieciséis números, y lo que se publica es EL
// PEOR. El piso de esta pieza es 3,26.
//
// El promedio de la banda no sirve y por eso se mide lado por lado: el charco de
// luz del piso hace que el mismo trazo tenga arriba un piso y abajo otro.
//
// Esta es la misma cuenta que hace verificacion/botonera-chapita.html, movida a
// un script para poder correrla antes y después de tocar un color. La página
// sigue siendo la que se mira; ésta es la que se corre.

import { servir } from '../tools/servir.mjs';
import { abrirCromo, dormir } from '../tools/cromo.mjs';

const CANDIDATOS = process.argv.slice(2);

const { servidor, puerto } = await servir(0);
const cromo = await abrirCromo({ ancho: 400, alto: 400 });

try {
  await cromo.enviar('Runtime.enable');
  await cromo.enviar('Page.enable');
  await cromo.enviar('Page.navigate', { url: `http://127.0.0.1:${puerto}/index.html` });
  await dormir(2000);

  const { result } = await cromo.enviar('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `(async () => {
      const cfg = await import('/js/config.js');
      const { BOTONERA, COLORES_BOTON, FRANJAS_DIA } = cfg;

      const ANCHO = 390, ALTO = 844;

      // La geometría de la botonera, en píxeles de la escena. Sale de las mismas
      // constantes que usa ui.js para repartir las chapas.
      const margen = BOTONERA.margenEnUnidades * BOTONERA.unidad;
      const sep = BOTONERA.separacionEnUnidades * BOTONERA.unidad;
      const altoBoton = BOTONERA.altoEnUnidades * BOTONERA.unidad;
      const anchoBoton = Math.floor((ANCHO - margen * 2 - sep * 2) / 3);
      const topBoton = ALTO - margen - altoBoton;
      const XS = [0, 1, 2].map((i) => margen + i * (anchoBoton + sep));

      const FILO = BOTONERA.chapita.filo;
      const cx = XS.map((x) => x + BOTONERA.chapita.inset);
      const cAncho = anchoBoton - BOTONERA.chapita.inset * 2;
      const cAlto = BOTONERA.chapita.alto + FILO * 2;

      // Los cuatro lados, y para cada uno la franja de piso PEGADA por afuera.
      const LADOS = {
        arriba: cx.map((x) => [x, topBoton - 1, cAncho, 1]),
        abajo: cx.map((x) => [x, topBoton + cAlto, cAncho, 1]),
        izquierda: cx.map((x) => [x - 1, topBoton, 1, cAlto]),
        derecha: cx.map((x) => [x + cAncho, topBoton, 1, cAlto])
      };

      const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
      const canal = (v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      };
      const L = ([r, g, b]) => 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
      const contraste = (a, b) => {
        const la = L(a), lb = L(b);
        return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
      };

      async function pisoDe(franja) {
        const img = new Image();
        img.src = '/' + franja.fondo;
        await img.decode();

        const c = document.createElement('canvas');
        c.width = ANCHO; c.height = ALTO;
        const g = c.getContext('2d', { willReadFrequently: true });
        const k = ALTO / img.height;
        const ancho = img.width * k;
        g.drawImage(img, (ANCHO - ancho) / 2, 0, ancho, ALTO);

        // El charco de luz de la franja, igual que lo compone la escena.
        if (franja.luz && franja.luz.fuerza > 0) {
          const lx = (franja.luz.x / 100) * ANCHO;
          const ly = (franja.luz.y / 100) * ALTO;
          const rx = (franja.luz.radio / 100) * ANCHO;
          const ry = ((franja.luz.radio / 2) / 100) * ANCHO;
          g.save();
          g.translate(lx, ly);
          g.scale(1, ry / rx);
          const grad = g.createRadialGradient(0, 0, 0, 0, 0, rx);
          const [lr, lg, lb] = hex(franja.luz.color);
          grad.addColorStop(0, 'rgba(' + lr + ',' + lg + ',' + lb + ',' + franja.luz.fuerza + ')');
          grad.addColorStop(0.72, 'rgba(' + lr + ',' + lg + ',' + lb + ',0)');
          grad.addColorStop(1, 'rgba(' + lr + ',' + lg + ',' + lb + ',0)');
          g.fillStyle = grad;
          g.beginPath();
          g.arc(0, 0, rx, 0, Math.PI * 2);
          g.fill();
          g.restore();
        }

        const salida = {};
        for (const [lado, rects] of Object.entries(LADOS)) {
          const px = [];
          for (const [x, y, w, h] of rects) {
            const d = g.getImageData(Math.round(x), Math.round(y), Math.round(w), Math.round(h)).data;
            for (let i = 0; i < d.length; i += 4) px.push([d[i], d[i + 1], d[i + 2]]);
          }
          salida[lado] = px;
        }
        return salida;
      }

      const NEGRO = [0, 0, 0];
      const naranjas = ${JSON.stringify(CANDIDATOS)}.length
        ? ${JSON.stringify(CANDIDATOS)}
        : [COLORES_BOTON.naranja];

      const filas = [];
      for (const franja of FRANJAS_DIA) {
        const piso = await pisoDe(franja);
        for (const [lado, px] of Object.entries(piso)) {
          const fila = { franja: franja.nombre, lado, valores: {} };
          for (const naranja of naranjas) {
            const tinta = hex(naranja);
            // POR PÍXEL, y el mejor de los dos: en cada píxel del borde, el que
            // trabaja es el naranja o el filo. Lo que se guarda es el PEOR
            // píxel del lado, que es donde la pieza se puede perder.
            let peor = Infinity;
            for (const p of px) {
              peor = Math.min(peor, Math.max(contraste(tinta, p), contraste(NEGRO, p)));
            }
            fila.valores[naranja] = peor;
          }
          filas.push(fila);
        }
      }
      return JSON.stringify({ naranjas, filas });
    })()`
  });

  const { naranjas, filas } = JSON.parse(result.value);

  console.log('LOS DIECISÉIS MÍNIMOS — el peor píxel de cada lado, en cada franja.');
  console.log('En cada píxel trabaja el naranja O el filo negro: se toma el mejor de los dos.\n');
  console.log('franja'.padEnd(12) + 'lado'.padEnd(12) + naranjas.map((n) => n.padEnd(12)).join(''));
  console.log('-'.repeat(24 + naranjas.length * 12));

  for (const f of filas) {
    console.log(
      f.franja.padEnd(12) +
        f.lado.padEnd(12) +
        naranjas.map((n) => f.valores[n].toFixed(2).padEnd(12)).join('')
    );
  }

  console.log('');
  for (const n of naranjas) {
    const peor = Math.min(...filas.map((f) => f.valores[n]));
    const donde = filas.find((f) => f.valores[n] === peor);
    console.log(
      `  ${n}   EL PEOR DE LOS DIECISÉIS: ${peor.toFixed(2)}  ` +
        `(${donde.franja}, ${donde.lado})   ${peor >= 3.26 ? 'pasa' : 'BAJA DEL PISO DE 3,26'}`
    );
  }
} finally {
  await cromo.cerrar();
  servidor.close();
}
