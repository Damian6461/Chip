// ¿Suena el saludo de la primera visita del día?
//
//   node verificacion/voz-saludo.mjs
//
// ---- POR QUÉ HAY QUE MEDIRLO Y NO ALCANZA CON LEERLO ----
//
// El saludo es la única voz que depende de tres cosas que pasan en el mismo
// instante y en un orden que no está escrito en ningún lado: el gesto del
// jugador, el `resume()` del contexto de audio —que es una PROMESA— y la
// consulta de `hablar` sobre si el contexto está corriendo. Leer el código no
// alcanza para saber quién llega primero.
//
// Estaba roto: los dos listeners escuchaban el mismo `pointerdown`, el del audio
// pedía el resume y el del saludo llamaba a `hablar` en la vuelta siguiente, con
// el contexto todavía suspendido. `hablar` devolvía null y no lo decía. El
// saludo no fallaba: no existía.
//
// ---- Y POR QUÉ NO SE PUEDE MEDIR A MANO EN UNA PESTAÑA CUALQUIERA ----
//
// Porque `hablar` tiene una sexta regla: NUNCA con la pestaña oculta. Manejando
// un Chrome desde afuera, la pestaña está oculta casi siempre —medido:
// `visibilityState: 'hidden'` con `hasFocus(): true`, que es una combinación que
// confunde— y entonces el saludo no suena POR LA RAZÓN CORRECTA. Un rojo
// legítimo que se lee igual que el bug.
//
// Acá se mide en headless, donde la página está visible, y el toque se manda por
// `Input.dispatchMouseEvent`, que produce un evento CONFIABLE: el navegador le
// da activación de usuario, así que el `resume()` es el de verdad y no uno
// rechazado por falta de gesto.

// ---- LOS DOS CAMINOS, Y CUÁL ES EL QUE SE ROMPÍA ----
//
// A. ABRE CON EL SONIDO YA PRENDIDO y toca. Acá el `pointerdown` viejo
//    FUNCIONABA, y es un resultado que conviene tener escrito: el contexto de
//    audio se CONSTRUYE adentro del gesto, y un contexto construido con
//    activación de usuario nace ya en `running`. O sea que el `resume()` que
//    parecía llegar tarde no llegaba tarde nunca por este camino. Medido con el
//    código viejo puesto de vuelta: el saludo sonaba igual.
//
// B. ABRE CON EL SONIDO APAGADO, toca —y ese toque se come el listener de una
//    sola vez—, y DESPUÉS lo prende desde el menú. Acá el saludo se perdía para
//    siempre: cuando el `pointerdown` corría, `encendido` era false y `hablar`
//    devolvía null; y cuando el jugador prendía el sonido, ya no quedaba ningún
//    listener armado. Este es el que se rompía de verdad.
//
// Los dos se miden abajo. Uno solo no alcanza: con A se concluiría que no había
// nada que arreglar, y con B solo no se sabría que el diagnóstico original —"el
// resume es asíncrono y llega tarde"— era falso por este camino.

import { servir } from '../tools/servir.mjs';
import { abrirCromo, dormir } from '../tools/cromo.mjs';
import { VOZ_DE, VOZ } from '../js/config.js';

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

  const evaluar = async (expr) =>
    (await cromo.enviar('Runtime.evaluate', { expression: expr, returnByValue: true })).result.value;

  // Un toque DE VERDAD. `Input.dispatchMouseEvent` produce un evento confiable,
  // con activación de usuario: es la diferencia entre medir el saludo y medir la
  // política de autoplay del navegador. Un `dispatchEvent` sintético desde la
  // página no sirve — el contexto no arranca y todo da negativo por el motivo
  // equivocado.
  const tocar = async (x, y) => {
    const toque = { x, y, button: 'left', clickCount: 1 };
    await cromo.enviar('Input.dispatchMouseEvent', { type: 'mousePressed', ...toque });
    await cromo.enviar('Input.dispatchMouseEvent', { type: 'mouseReleased', ...toque });
    await dormir(400);
  };

  const esperado = `chip/${VOZ_DE.saludo}${VOZ.extension}`;

  // El parche de `play()` va antes de que corra un solo módulo del juego: si se
  // instalara después, el saludo podría haber sonado y pasado sin que nadie lo
  // viera. La última visita, trece horas atrás, que es lo que
  // `visita.horasFuera >= 12` pide para que haya saludo.
  const sembrar = (sonido) => ({
    source: `
      try {
        const s = JSON.parse(localStorage.getItem('chip.save.v1') || '{}');
        localStorage.setItem('chip.save.v1', JSON.stringify({
          ...s,
          ajustes: { ...(s.ajustes || {}), sonido: ${sonido}, movimientoReducido: false },
          ultimaVisita: Date.now() - 13 * 3600 * 1000
        }));
      } catch (e) {}
      window.__sonaron = [];
      const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function () {
        window.__sonaron.push(this.src);
        return play.apply(this, arguments);
      };
    `
  });

  const loQueSono = async () =>
    JSON.parse(
      await evaluar('JSON.stringify(window.__sonaron.map(s => s.split("/").slice(-2).join("/")))')
    );

  const informar = (caso, sonaron) => {
    const saludo = sonaron.filter((s) => s.includes(VOZ_DE.saludo));
    const ambiente = sonaron.filter((s) => s.includes('ambiente'));
    console.log(`--- ${caso} ---`);
    console.log(`  sonó: ${sonaron.join(', ') || '(nada)'}`);
    console.log(`  ambiente ${ambiente.length ? 'SÍ' : 'no'} · saludo ${saludo.length ? 'SÍ' : 'NO'}`);
    console.log('');
    return saludo.length > 0;
  };

  // ---- A. Abre con el sonido prendido y toca ----
  // El identificador se guarda para PODER SACARLO: addScriptToEvaluateOnNewDocument
  // acumula, no reemplaza, y con los dos sembradores puestos el segundo caso
  // arrancaba con el sonido del primero. La primera corrida de B dio 'saludo SÍ'
  // por eso y no por el arreglo.
  const sembradorA = (await cromo.enviar('Page.addScriptToEvaluateOnNewDocument', sembrar(true))).identifier;
  await cromo.enviar('Page.navigate', { url: `http://127.0.0.1:${puerto}/index.html` });
  await dormir(2500);

  const visible = await evaluar('document.visibilityState');
  console.log(`Pestaña: ${visible}. (Si dice "hidden", nada de lo de abajo significa nada.)\n`);

  await tocar(195, 500);
  await dormir(1600);
  const a = informar('A. abre con el sonido prendido, y toca', await loQueSono());

  // ---- B. Abre apagado, toca, y recién después lo prende desde el menú ----
  await cromo.enviar('Page.removeScriptToEvaluateOnNewDocument', { identifier: sembradorA });
  await cromo.enviar('Page.addScriptToEvaluateOnNewDocument', sembrar(false));
  await cromo.enviar('Page.navigate', { url: `http://127.0.0.1:${puerto}/index.html` });
  await dormir(2500);

  // El toque que se come el listener de una sola vez. Con el sonido apagado,
  // `hablar` no puede hacer nada con él.
  await tocar(195, 500);
  await dormir(600);
  console.log('  (B) después del toque con el sonido apagado:', (await loQueSono()).join(', ') || '(nada)');

  // Y ahora se prende desde el menú, que es el camino que no pasa por ningún
  // gesto armado. El click va sobre el control real, buscado por id.
  const prendido = await evaluar(`(() => {
    const c = document.getElementById('ajuste-sonido');
    if (!c) return 'no existe el control';
    const r = c.getBoundingClientRect();
    return JSON.stringify({ x: r.left + r.width / 2, y: r.top + r.height / 2, visible: r.width > 0 });
  })()`);

  if (prendido === 'no existe el control') {
    console.log('--- B: no encontré #ajuste-sonido, no hay medición ---');
  } else {
    let caja = JSON.parse(prendido);
    if (!caja.visible) {
      // El menú está cerrado: hay que abrirlo primero.
      const menu = JSON.parse(
        await evaluar(`(() => {
          const b = document.getElementById('menu-boton');
          const r = b.getBoundingClientRect();
          return JSON.stringify({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
        })()`)
      );
      await tocar(menu.x, menu.y);
      await dormir(600);
      await evaluar(`(() => {
        const t = [...document.querySelectorAll('button')].find((b) => /ajuste/i.test(b.id) || /Ajustes/.test(b.textContent));
        if (t) t.click();
        return 1;
      })()`);
      await dormir(600);
      caja = JSON.parse(
        await evaluar(`(() => {
          const c = document.getElementById('ajuste-sonido');
          const r = c.getBoundingClientRect();
          return JSON.stringify({ x: r.left + r.width / 2, y: r.top + r.height / 2, visible: r.width > 0 });
        })()`)
      );
    }

    if (!caja.visible) {
      console.log('--- B: no pude llegar al control del sonido, no hay medición ---');
    } else {
      await tocar(caja.x, caja.y);
      await dormir(2000);
      const b = informar('B. abre apagado, toca, y prende el sonido desde el menú', await loQueSono());

      console.log(
        a && b
          ? 'El saludo llega por los dos caminos.'
          : `A: ${a ? 'llega' : 'NO llega'} · B: ${b ? 'llega' : 'NO llega'}`
      );
    }
  }
} finally {
  await cromo.cerrar();
  servidor.close();
}
