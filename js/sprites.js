// Cadena de prioridad de estados visuales + carga de sprites con fallback.
// No toca el DOM del documento: sólo crea Image() y resuelve qué sprite
// corresponde. Quien dibuja es ui.js.

const RUTAS = {
  idle: 'sprites/idle.png'
};

const sprites = {};

// El orden define la prioridad: gana el primer estado cuya condición se cumple.
// Hoy sólo existe el sprite de idle, así que la cadena tiene una sola entrada
// que siempre gana. Agregar estados nuevos es agregar entradas arriba de idle.
const CADENA_ESTADOS = [
  { nombre: 'idle', condicion: () => true }
];

// Fallback de la cadena: si ninguna condición se cumpliera, se cae a idle.
const ESTADO_POR_DEFECTO = 'idle';

export function resolverEstadoVisual(estado) {
  for (const entrada of CADENA_ESTADOS) {
    if (entrada.condicion(estado)) return entrada.nombre;
  }
  return ESTADO_POR_DEFECTO;
}

// El loader nunca rechaza: un sprite que no carga queda marcado ok:false y el
// render se cae al placeholder.
function cargarSprite(nombre, ruta) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ nombre, img, ok: true });
    img.onerror = () => resolve({ nombre, img: null, ok: false });
    img.src = ruta;
  });
}

export async function cargarSprites() {
  const resultados = await Promise.all(
    Object.entries(RUTAS).map(([nombre, ruta]) => cargarSprite(nombre, ruta))
  );

  for (const resultado of resultados) {
    sprites[resultado.nombre] = resultado;
  }
}

// Devuelve la imagen lista para dibujar, o null si no hay sprite disponible.
export function obtenerSprite(nombre) {
  const sprite = sprites[nombre];
  return sprite && sprite.ok ? sprite.img : null;
}
