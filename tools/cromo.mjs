// Un Chrome manejado por CDP crudo, sin dependencias.
//
// POR QUÉ EXISTE. Dos cosas del repo necesitan un navegador de verdad: el test
// de humo, que abre el juego y escucha la consola, y las verificaciones que
// tienen que MIRAR PÍXELES —si un borde salió duro, si una fila tiene un solo
// tono—. Las dos hacían lo mismo para arrancarlo, y lo mismo repetido dos veces
// se separa en la tercera.
//
// Node 24 trae `WebSocket` global y Chrome habla su protocolo por ahí, así que
// alcanza con lanzarlo con `--remote-debugging-port` y hablarle. Cien líneas
// contra ciento cincuenta megas de navegador bajado: la regla de "sin
// dependencias" vale más que la comodidad.
//
// LO QUE NO HACE: no espera a que la página esté "lista". Eso lo decide quien lo
// usa, porque no hay una definición única —el humo espera a que el juego se
// desocupe, una captura espera a que el layout asiente— y una espera genérica
// escondida acá adentro sería la peor de las dos.

import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CANDIDATOS = [
  process.env.CHIP_NAVEGADOR,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
].filter(Boolean);

export function buscarNavegador() {
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

// Abre un Chrome con perfil TEMPORAL —ni service worker viejo ni localStorage de
// nadie— y devuelve el cliente más un `cerrar()` que limpia todo.
//
// El tamaño de ventana va por parámetro porque las capturas lo necesitan exacto:
// medir el juego en una ventana de escritorio y multiplicar sería medir otra
// cosa, que es el error que este proyecto ya cometió con `--alto-escena`.
export async function abrirCromo({ ancho = 390, alto = 844 } = {}) {
  const navegador = buscarNavegador();
  if (!navegador) {
    throw new Error(
      'no encontré Chrome. Pasale la ruta en CHIP_NAVEGADOR=... y volvé a correr.'
    );
  }

  const perfil = mkdtempSync(join(tmpdir(), 'chip-cromo-'));
  const chrome = spawn(navegador, [
    '--headless=new',
    '--remote-debugging-port=0',
    `--user-data-dir=${perfil}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    `--window-size=${ancho},${alto}`,
    '--force-device-scale-factor=1',
    'about:blank'
  ]);

  const host = await esperarPuerto(chrome);
  const nuevo = await fetch(`http://${host}/json/new?about:blank`, { method: 'PUT' }).then((r) =>
    r.json()
  );
  const cliente = await conectar(nuevo.webSocketDebuggerUrl);

  return {
    ...cliente,
    async cerrar() {
      try {
        cliente.cerrar();
      } catch {}
      chrome.kill();
      try {
        rmSync(perfil, { recursive: true, force: true });
      } catch {}
    }
  };
}

export const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
