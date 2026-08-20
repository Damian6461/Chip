// EL TEST QUE ABRE EL JUEGO.
//
// ---- POR QUÉ EXISTE, Y POR QUÉ NO EXISTÍA ----
//
// Trescientos treinta y dos tests en verde con la app tirando ReferenceError en
// el arranque, la pantalla del pecho apagada y Chip clavado en `esperando` con
// los brazos cruzados. Se reportó desde afuera como "no se muestra la carga".
//
// Ninguno de los trescientos treinta y dos podía verlo, y no por un descuido de
// alguno: TODOS leen archivos y cruzan texto. Verifican lo que está escrito.
// Ninguno ejecuta el juego. Un `let` declarado cuatrocientas líneas abajo de su
// primer uso —zona muerta temporal— es sintácticamente impecable, pasa
// cualquier lectura, y revienta al correr.
//
// Este archivo hace la única cosa que faltaba: ABRE EL JUEGO EN UN NAVEGADOR DE
// VERDAD, espera a que asiente, y falla si hubo un solo error de consola o una
// excepción sin atrapar. Más tres preguntas de que arrancó de verdad y no que
// arrancó a medias, que es el estado que este bug producía.
//
// ---- POR QUÉ CDP CRUDO Y NO PLAYWRIGHT ----
//
// El proyecto no tiene dependencias y esa regla vale más que la comodidad. Node
// 24 trae `WebSocket` global y Chrome habla su protocolo por ahí, así que
// alcanza con lanzarlo con `--remote-debugging-port` y hablarle. Son cien líneas
// y no bajan ciento cincuenta megas de navegador.
//
// ---- POR QUÉ FALLA EN VEZ DE SALTEARSE SI NO ENCUENTRA CHROME ----
//
// Porque un test de humo que se saltea solo es exactamente el agujero que vino a
// tapar: verde sin haber mirado. Si el navegador no está donde lo busca, se le
// dice con CHIP_NAVEGADOR y sigue. Callarse no es una opción.

import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { servir } from '../tools/servir.mjs';

const CANDIDATOS = [
  process.env.CHIP_NAVEGADOR,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
].filter(Boolean);

function buscarNavegador() {
  return CANDIDATOS.find((ruta) => existsSync(ruta)) ?? null;
}

// El puerto real de DevTools sale de stderr y no se puede adivinar: se lanza con
// `--remote-debugging-port=0` para no chocar con un Chrome abierto a mano, y
// Chrome contesta con la línea "DevTools listening on ws://...".
function esperarPuerto(proceso, ms = 15000) {
  return new Promise((listo, error) => {
    let texto = '';
    const reloj = setTimeout(
      () => error(new Error(`Chrome no anunció su puerto en ${ms} ms. Dijo: ${texto.slice(-400)}`)),
      ms
    );
    proceso.stderr.on('data', (trozo) => {
      texto += trozo;
      const m = texto.match(/ws:\/\/([^/]+)\//);
      if (m) {
        clearTimeout(reloj);
        listo(m[1]);
      }
    });
    proceso.on('exit', (codigo) => {
      clearTimeout(reloj);
      error(new Error(`Chrome se cerró con código ${codigo} antes de anunciar el puerto`));
    });
  });
}

// Un cliente CDP mínimo: manda comandos numerados y reparte los eventos.
function conectar(url) {
  return new Promise((listo, error) => {
    const ws = new WebSocket(url);
    let id = 0;
    const pendientes = new Map();
    const oyentes = [];

    ws.addEventListener('message', (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id !== undefined) {
        const p = pendientes.get(msg.id);
        pendientes.delete(msg.id);
        if (p) (msg.error ? p.error : p.listo)(msg.error ?? msg.result);
      } else {
        for (const f of oyentes) f(msg);
      }
    });
    ws.addEventListener('error', () => error(new Error(`no se pudo hablar con ${url}`)));
    ws.addEventListener('open', () =>
      listo({
        enviar(metodo, params = {}) {
          return new Promise((l, e) => {
            const n = ++id;
            pendientes.set(n, { listo: l, error: e });
            ws.send(JSON.stringify({ id: n, method: metodo, params }));
          });
        },
        alEvento(f) {
          oyentes.push(f);
        },
        cerrar() {
          ws.close();
        }
      })
    );
  });
}

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

// LO QUE SE MIRA UNA VEZ QUE ASENTÓ. Corre adentro de la página: son las tres
// preguntas de "arrancó de verdad", elegidas porque son justo las tres que el
// ReferenceError del arranque contestaba mal.
const SONDA = `(() => {
  const pantalla = document.getElementById('pantalla');
  const numero = document.getElementById('pantalla-numero');
  const mascota = document.getElementById('mascota') || document.querySelector('[class*="estado-"]');
  return JSON.stringify({
    pantalla: pantalla ? getComputedStyle(pantalla).display : 'no existe',
    clases: mascota ? mascota.className : 'no existe',
    bateria: numero ? (numero.dataset.texto || '') : 'no existe'
  });
})()`;

export async function correrHumo(informar = () => {}) {
  const resultados = [];
  const anotar = (nombre, mensaje) => {
    resultados.push({ nombre, ok: !mensaje, mensaje });
    informar({ nombre, ok: !mensaje, mensaje });
  };

  const navegador = buscarNavegador();
  if (!navegador) {
    anotar(
      'humo: el juego abre sin un solo error de consola',
      'no encontré Chrome. Pasale la ruta en CHIP_NAVEGADOR=... y volvé a correr. ' +
        'Este test NO se saltea solo: un test de humo que se calla es el agujero que vino a tapar.'
    );
    return { pasaron: 0, fallaron: 1, total: 1 };
  }

  const { servidor, puerto } = await servir(0);
  const perfil = mkdtempSync(join(tmpdir(), 'chip-humo-'));
  let chrome = null;
  let cliente = null;

  try {
    chrome = spawn(navegador, [
      '--headless=new',
      '--remote-debugging-port=0',
      `--user-data-dir=${perfil}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-gpu',
      '--window-size=390,844',
      'about:blank'
    ]);

    const host = await esperarPuerto(chrome);

    // Un target nuevo y limpio. El perfil es temporal, así que no hay service
    // worker viejo sirviendo una versión de ayer — que es el otro modo de falla
    // que este proyecto ya conoce.
    const nuevo = await fetch(`http://${host}/json/new?about:blank`, { method: 'PUT' }).then((r) =>
      r.json()
    );
    cliente = await conectar(nuevo.webSocketDebuggerUrl);

    const errores = [];
    cliente.alEvento((msg) => {
      if (msg.method === 'Runtime.exceptionThrown') {
        const d = msg.params.exceptionDetails;
        errores.push(`pageerror: ${d.exception?.description ?? d.text} (${d.url ?? '?'}:${d.lineNumber})`);
      }
      if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        errores.push('console.error: ' + msg.params.args.map((a) => a.description ?? a.value).join(' '));
      }
      if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
        const e = msg.params.entry;
        errores.push(`log(${e.source}): ${e.text} ${e.url ?? ''}`);
      }
    });

    await cliente.enviar('Runtime.enable');
    await cliente.enviar('Log.enable');
    await cliente.enviar('Page.enable');
    await cliente.enviar('Page.navigate', { url: `http://127.0.0.1:${puerto}/index.html` });

    // ASENTAR. El juego pinta en el arranque, corre el decay, registra el
    // service worker y arranca sus timers. Dos segundos es de sobra para lo que
    // se está buscando —un error de arranque sale en el primer cuadro— y no
    // tanto como para que el test se vuelva lento de correr.
    await dormir(2000);

    const { result } = await cliente.enviar('Runtime.evaluate', {
      expression: SONDA,
      returnByValue: true
    });
    const sonda = JSON.parse(result.value);

    anotar(
      'humo: el juego abre sin un solo error de consola',
      errores.length ? `${errores.length} error(es): ${errores.join(' | ')}` : null
    );

    anotar(
      'humo: la pantalla del pecho está encendida',
      sonda.pantalla === 'none' || sonda.pantalla === 'no existe'
        ? `#pantalla quedó en display:${sonda.pantalla}`
        : null
    );

    anotar(
      'humo: Chip salió de esperando',
      /estado-esperando/.test(sonda.clases)
        ? `la mascota quedó en "${sonda.clases}": el arranque se cortó antes del primer estado real`
        : null
    );

    anotar(
      'humo: la batería muestra un número',
      /\d/.test(sonda.bateria) ? null : `el display del pecho dice "${sonda.bateria}"`
    );
  } catch (e) {
    anotar('humo: el juego abre sin un solo error de consola', `no se pudo correr: ${e.message}`);
  } finally {
    try {
      cliente?.cerrar();
    } catch {}
    chrome?.kill();
    servidor.close();
    try {
      rmSync(perfil, { recursive: true, force: true });
    } catch {}
  }

  const fallaron = resultados.filter((r) => !r.ok).length;
  return { pasaron: resultados.length - fallaron, fallaron, total: resultados.length };
}
