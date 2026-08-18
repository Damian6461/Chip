// Mide el PISO que el cable cruza, en las cuatro franjas horarias.
//
// La pregunta del punto 16 es concreta: "el cable cruza la zona que ilumina la
// ventana, así que si el tono es plano se va a ver despegado del piso de noche o
// quemado de día". Esto la contesta con números en vez de con impresiones.
//
// ---- CÓMO SE CORRE ----
//
// NO es un script de Node: necesita un decodificador de imágenes y el proyecto
// no tiene dependencias. Se pega entero en la consola del navegador, con la app
// abierta y Chip cargando. Devuelve un objeto por franja.
//
// ---- QUÉ MIDE, Y QUÉ NO ----
//
// Mide el fondo CRUDO, tal como está en el .webp, bajo cada muestra del cable.
// NO mide lo compuesto en pantalla: encima del fondo pasa la capa de luz de
// #escena::after, que sube el piso. Se eligió el crudo porque es lo que se puede
// reproducir —el archivo no cambia— y porque es la misma base con la que se
// calibró la tabla CLIMAS de config.js, así que los dos juegos de números se
// pueden poner uno al lado del otro.
//
// El punto de muestreo va 9 px POR DEBAJO de la línea media del cable: es el
// piso que el cable tiene al lado, no el que le queda tapado.

const cfg = await import('./js/config.js');
const formas = await import('./js/formas.js');

const esc = document.getElementById('escena').getBoundingClientRect();
const chip = document.getElementById('chip').getBoundingClientRect();

// Los dos extremos, calculados igual que en dibujarCable: el conector sale del
// lienzo de Chip y el toma de la escena.
const desde = {
  x: chip.x - esc.x + (cfg.CONECTOR_PECHO.x / 100) * chip.width,
  y: chip.y - esc.y + (cfg.CONECTOR_PECHO.y / 100) * chip.height
};
const hasta = {
  x: (cfg.TOMA_PARED.x / 100) * esc.width,
  y: (cfg.TOMA_PARED.y / 100) * esc.height
};

const linea = formas.lineaDelCable(
  desde,
  hasta,
  cfg.CABLE,
  cfg.RECORRIDO_CABLE,
  (cfg.APOYO_CABLE / 100) * esc.height
);

// Luminancia relativa, la de WCAG sin la corrección gamma: alcanza para
// comparar dos grises entre sí, que es lo único que se hace acá.
const luz = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

const resultado = {};
for (const franja of cfg.FRANJAS_DIA) {
  const img = new Image();
  img.src = franja.fondo;
  await img.decode();

  // Mismo encuadre que el CSS: background-size: cover, centrado.
  const c = document.createElement('canvas');
  c.width = Math.round(esc.width);
  c.height = Math.round(esc.height);
  const g = c.getContext('2d');
  const k = Math.max(c.width / img.width, c.height / img.height);
  g.drawImage(img, (c.width - img.width * k) / 2, (c.height - img.height * k) / 2, img.width * k, img.height * k);

  const datos = g.getImageData(0, 0, c.width, c.height).data;
  const lums = [];
  for (const p of linea) {
    const x = Math.round(p.x);
    const y = Math.round(p.y) + 9;
    if (x < 0 || y < 0 || x >= c.width || y >= c.height) continue;
    const i = (y * c.width + x) * 4;
    lums.push(luz(datos[i], datos[i + 1], datos[i + 2]));
  }
  lums.sort((a, b) => a - b);
  resultado[franja.nombre] = {
    mediana: Math.round(lums[lums.length >> 1]),
    min: Math.round(lums[0]),
    max: Math.round(lums.at(-1))
  };
}

// Y los tres tonos del cable, para poder cruzarlos contra el piso de arriba.
const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
resultado.cable = {
  cuerpo: Math.round(luz(...hex(cfg.CABLE.color))),
  brillo: Math.round(luz(...hex(cfg.CABLE.brillo))),
  sombra: Math.round(luz(...hex(cfg.CABLE.sombra)))
};

console.table(resultado);
resultado;
