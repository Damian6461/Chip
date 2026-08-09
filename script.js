// ---- Constantes ----

const SAVE_KEY = 'chip.save.v1';
const DECAY_FLOOR = 10; // piso del paso del tiempo: el decay nunca deja un stat en 0
const STAT_MIN = 0;
const STAT_MAX = 100;
const MAX_DECAY_HOURS = 24;
const MS_POR_HORA = 3_600_000;
const JUGAR_BATERIA_MINIMA = 15;

const DECAY_POR_HORA = {
  bateria: 5,
  humor: 3.3,
  mantenimiento: 1.7
};

function clamp(valor, min, max) {
  return Math.min(max, Math.max(min, valor));
}

function clampDecay(valor) {
  return clamp(valor, DECAY_FLOOR, STAT_MAX);
}

function clampAccion(valor) {
  return clamp(valor, STAT_MIN, STAT_MAX);
}

// ---- Estado / persistencia ----

function crearEstadoNuevo() {
  const ahora = Date.now();
  return {
    nombre: 'Chip',
    bateria: 100,
    humor: 100,
    mantenimiento: 100,
    ultimaVisita: ahora,
    creado: ahora,
    version: 1
  };
}

function cargarEstado() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return crearEstadoNuevo();

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return crearEstadoNuevo();
    return parsed;
  } catch (e) {
    return crearEstadoNuevo();
  }
}

function guardarEstado(estado) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(estado));
}

// Decay calculado siempre por diferencia de timestamps, nunca por un contador corriendo.
function aplicarDecay(estado, ahora = Date.now()) {
  const horasTranscurridas = (ahora - estado.ultimaVisita) / MS_POR_HORA;
  const horas = Math.min(Math.max(horasTranscurridas, 0), MAX_DECAY_HOURS);

  estado.bateria = clampDecay(estado.bateria - DECAY_POR_HORA.bateria * horas);
  estado.humor = clampDecay(estado.humor - DECAY_POR_HORA.humor * horas);
  estado.mantenimiento = clampDecay(estado.mantenimiento - DECAY_POR_HORA.mantenimiento * horas);
  estado.ultimaVisita = ahora;

  return estado;
}

// ---- Sprites ----

const sprites = {};

function cargarSprite(nombre, ruta) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ nombre, img, ok: true });
    img.onerror = () => resolve({ nombre, img: null, ok: false });
    img.src = ruta;
  });
}

async function cargarSprites() {
  const resultados = await Promise.all([
    cargarSprite('idle', 'sprites/idle.png')
  ]);

  for (const resultado of resultados) {
    sprites[resultado.nombre] = resultado;
  }
}

// ---- Render ----

const canvas = document.getElementById('canvas-mascota');
const ctx = canvas.getContext('2d');

const barras = {
  bateria: {
    fill: document.getElementById('barra-bateria-fill'),
    valor: document.getElementById('barra-bateria-valor')
  },
  humor: {
    fill: document.getElementById('barra-humor-fill'),
    valor: document.getElementById('barra-humor-valor')
  },
  mantenimiento: {
    fill: document.getElementById('barra-mantenimiento-fill'),
    valor: document.getElementById('barra-mantenimiento-valor')
  }
};

const btnCargar = document.getElementById('btn-cargar');
const btnJugar = document.getElementById('btn-jugar');
const btnLimpiar = document.getElementById('btn-limpiar');

function dibujarPlaceholder() {
  const w = canvas.width;
  const h = canvas.height;
  const rectW = w * 0.5;
  const rectH = h * 0.5;
  const rectX = (w - rectW) / 2;
  const rectY = (h - rectH) / 2;

  ctx.fillStyle = '#2a2d38';
  ctx.fillRect(rectX, rectY, rectW, rectH);

  ctx.strokeStyle = '#4a4f5e';
  ctx.lineWidth = 2;
  ctx.strokeRect(rectX, rectY, rectW, rectH);

  ctx.fillStyle = '#e6e6e6';
  ctx.font = '20px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('idle', w / 2, h / 2);
}

function dibujarMascota() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const spriteIdle = sprites.idle;
  if (spriteIdle && spriteIdle.ok) {
    ctx.drawImage(spriteIdle.img, 0, 0, canvas.width, canvas.height);
  } else {
    dibujarPlaceholder();
  }
}

function actualizarUI(estado) {
  for (const nombre of Object.keys(barras)) {
    const valor = clamp(estado[nombre], STAT_MIN, STAT_MAX);
    barras[nombre].fill.style.width = `${valor}%`;
    barras[nombre].valor.textContent = Math.round(valor);
  }

  btnJugar.disabled = estado.bateria < JUGAR_BATERIA_MINIMA;
}

function render() {
  dibujarMascota();
  actualizarUI(estado);
}

// ---- Acciones ----

function cargar() {
  estado.bateria = clampAccion(estado.bateria + 40);
  guardarEstado(estado);
  render();
}

function jugar() {
  if (estado.bateria < JUGAR_BATERIA_MINIMA) return;
  estado.humor = clampAccion(estado.humor + 30);
  estado.bateria = clampAccion(estado.bateria - 10);
  guardarEstado(estado);
  render();
}

function limpiar() {
  estado.mantenimiento = clampAccion(estado.mantenimiento + 50);
  guardarEstado(estado);
  render();
}

btnCargar.addEventListener('click', cargar);
btnJugar.addEventListener('click', jugar);
btnLimpiar.addEventListener('click', limpiar);

// ---- Modo debug ----
// Sin botones: se usa desde la consola del navegador.
// window.chipDebug.multiplier escala cuántas horas simuladas representa cada
// llamada a simulateHours(), para poder probar el decay sin esperar horas reales.
window.chipDebug = {
  multiplier: 1,
  simulateHours(horas) {
    estado.ultimaVisita -= horas * this.multiplier * MS_POR_HORA;
    estado = aplicarDecay(estado);
    guardarEstado(estado);
    render();
  },
  getEstado() {
    return estado;
  }
};

// ---- Arranque ----

let estado = cargarEstado();
estado = aplicarDecay(estado);
guardarEstado(estado);

cargarSprites().then(render);
render();
