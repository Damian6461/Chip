// EL ESCRIBIDOR. Recibe los PNG que arma plantillas-ojos.html y los deja en
// verificacion/plantillas/.
//
// Existe porque el único decodificador de webp con alfa de esta máquina es el
// navegador —ver el encabezado de plantillas-ojos.mjs, con la medición de por
// qué WIC no sirve— y un navegador no escribe en el disco. Doce líneas de
// servidor cierran el circuito sin agregarle una dependencia al proyecto.
//
// NO ES PARTE DEL JUEGO. No está en ARCHIVOS_CACHE, no lo importa nadie, y sólo
// se corre a mano cuando hay que regenerar las plantillas:
//
//   node verificacion/plantillas-escribidor.mjs
//   y abrir verificacion/plantillas-ojos.html?guardar=1
//
// Acepta PUT, sólo nombres que ya estén declarados en plantillas-ojos.mjs, y
// sólo escribe adentro de la carpeta de plantillas. Un servidor que escribe
// archivos y acepta cualquier ruta es un agujero, aunque escuche en localhost.
import { createServer } from 'node:http';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const AQUI = dirname(fileURLToPath(import.meta.url));
const DESTINO = join(AQUI, 'plantillas');
const PUERTO = 8766;

// Los seis nombres salen de la misma tabla que los genera, así que no se pueden
// separar. Importar el módulo del navegador desde Node es seguro: la parte de
// arriba son constantes y funciones puras, y nada corre al importarlo.
const { PLANTILLAS, REFERENCIAS } = await import('./plantillas-ojos.mjs');
const PERMITIDOS = new Set([...PLANTILLAS, ...REFERENCIAS].map((p) => p.archivo));

mkdirSync(DESTINO, { recursive: true });

createServer((pedido, respuesta) => {
  // La página se sirve desde otro puerto, así que esto es cross-origin. Y un PUT
  // con un Blob manda `Content-Type: image/png`, que NO está en la lista segura
  // de CORS —sólo lo están text/plain, multipart/form-data y el de formulario—
  // así que el navegador hace un preflight. Sin `Allow-Headers` el preflight se
  // cae y el fetch dice "Failed to fetch", que se lee como si el servidor no
  // estuviera corriendo. Estaba corriendo.
  respuesta.setHeader('Access-Control-Allow-Origin', '*');
  respuesta.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  respuesta.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (pedido.method === 'OPTIONS') return respuesta.writeHead(204).end();

  const nombre = decodeURIComponent(pedido.url.replace(/^\//, ''));
  if (pedido.method !== 'PUT' || !PERMITIDOS.has(nombre)) {
    return respuesta.writeHead(400).end('nombre no declarado: ' + nombre);
  }

  const partes = [];
  pedido.on('data', (d) => partes.push(d));
  pedido.on('end', () => {
    const datos = Buffer.concat(partes);
    // La firma de PNG, porque "sólo acepta PNG" tiene que ser verdad y no una
    // intención: 89 50 4E 47 0D 0A 1A 0A.
    const firma = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    if (!datos.subarray(0, 8).equals(firma)) {
      return respuesta.writeHead(400).end('no es un PNG');
    }
    writeFileSync(join(DESTINO, nombre), datos);
    console.log(`escrito ${nombre} — ${(datos.length / 1024).toFixed(1)} KB`);
    respuesta.writeHead(200).end(`${(datos.length / 1024).toFixed(1)} KB`);
  });
}).listen(PUERTO, () => {
  console.log(`escribidor en http://localhost:${PUERTO} -> ${DESTINO}`);
  console.log('abrí verificacion/plantillas-ojos.html?guardar=1 y cortá con ctrl+c');
});
