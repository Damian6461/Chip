// Un servidor estático de veinte líneas, para mirar el juego con módulos ES.
//
// POR QUÉ EXISTE. `file://` no sirve para verificar nada acá: los módulos ES
// están bloqueados por CORS en ese esquema, así que la página abre, no importa
// nada, y se ve un galpón vacío — que es indistinguible de "el cambio rompió
// todo". Ya pasó una vez y costó media tarde.
//
// Y el deploy tampoco sirve para lo que todavía no se pusheó, que es
// exactamente el momento en que uno quiere mirar. De ahí este.
//
//   node tools/servir.mjs [puerto]
//
// No tiene dependencias, no cachea, y sirve la raíz del repo tal cual está en
// disco. No es un servidor de producción y no pretende serlo: el de producción
// es GitHub Pages.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const RAIZ = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const PUERTO = Number(process.argv[2] ?? 8123);

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg'
};

// Devuelve el servidor ya escuchando, y el puerto REAL — que no siempre es el
// pedido: con `puerto = 0` el sistema elige uno libre, que es lo que quiere el
// test de humo para no chocar con una instancia abierta a mano.
export function servir(puerto = PUERTO) {
  const servidor = createServer(async (pedido, respuesta) => {
    const ruta = decodeURIComponent(new URL(pedido.url, 'http://x').pathname);
    // normalize + el prefijo obligatorio: sin esto un `../` sale del repo.
    const destino = join(RAIZ, normalize(ruta).replace(/^([/\\])+/, ''));
    const final = ruta.endsWith('/') ? join(destino, 'index.html') : destino;

    try {
      const cuerpo = await readFile(final);
      respuesta.writeHead(200, {
        'Content-Type': TIPOS[extname(final).toLowerCase()] ?? 'application/octet-stream',
        'Cache-Control': 'no-store'
      });
      respuesta.end(cuerpo);
    } catch {
      respuesta.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      respuesta.end(`no está: ${ruta}`);
    }
  });

  return new Promise((listo) => {
    servidor.listen(puerto, '127.0.0.1', () =>
      listo({ servidor, puerto: servidor.address().port })
    );
  });
}

// Se levanta solo SÓLO si lo corrieron a mano. Importado —lo hace el test de
// humo— no hace nada hasta que le pidan `servir()`: un módulo que abre un puerto
// por el hecho de ser importado es una sorpresa esperando.
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  const { puerto } = await servir(PUERTO);
  console.log(`sirviendo ${RAIZ} en http://localhost:${puerto}/`);
}
