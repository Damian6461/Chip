// Las formas de los objetos, dibujadas por código.
//
// Son siluetas simples en SVG con la paleta del juego: una tuerca es un
// hexágono con agujero, un resorte son tres vueltas, la-cosa-que-no-sabe-qué-es
// es un borrón con un signo de pregunta. No pretenden ser arte — pretenden ser
// reconocibles a 15 px y no avergonzar al galpón mientras el arte ilustrado no
// exista.
//
// Presentación pura: acá no hay contenido editorial. Qué objetos hay y de dónde
// salen es datos-objetos.js; esto es sólo cómo se ven.

// El viewBox es 24x24 para todas, así el tamaño lo decide el CSS y las formas
// quedan a la misma escala entre sí.
const FORMAS = {
  'tuerca-cabeza': `
    <path d="M7 4h10l5 8-5 8H7l-5-8z" fill="var(--metal)" stroke="var(--filo)"/>
    <circle cx="12" cy="12" r="4" fill="var(--hueco)" stroke="var(--filo)"/>`,

  'cable-enrollado': `
    <ellipse cx="12" cy="12" rx="9" ry="6" fill="none" stroke="var(--metal)" stroke-width="2.4"/>
    <ellipse cx="12" cy="12" rx="5.5" ry="3.4" fill="none" stroke="var(--metal)" stroke-width="2.2"/>
    <ellipse cx="12" cy="12" rx="2" ry="1.2" fill="none" stroke="var(--filo)" stroke-width="1.4"/>`,

  resorte: `
    <path d="M6 5h12M5 9h14M5 13h14M6 17h12M8 20h8"
      fill="none" stroke="var(--metal)" stroke-width="2" stroke-linecap="round"/>`,

  'arandela-dorada': `
    <circle cx="12" cy="12" r="9" fill="var(--acento)" stroke="var(--filo)"/>
    <circle cx="12" cy="12" r="4" fill="var(--hueco)" stroke="var(--filo)"/>`,

  // El misterio: una forma que no es de ninguna pieza conocida.
  'cosa-sin-nombre': `
    <path d="M6 9c1-4 6-6 9-4s4 7 2 10-8 5-10 2-2-5-1-8z"
      fill="var(--raro)" stroke="var(--filo)"/>
    <path d="M10.5 10.5c0-1.6 3-1.8 3 0 0 1.4-1.6 1.4-1.6 3" fill="none"
      stroke="var(--hueco)" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="11.9" cy="16.6" r="1" fill="var(--hueco)"/>`,

  'tornillo-perfecto': `
    <path d="M8 3h8v4H8z" fill="var(--metal)" stroke="var(--filo)"/>
    <path d="M12 7v14" stroke="var(--metal)" stroke-width="4"/>
    <path d="M10 10h4M10 13h4M10 16h4" stroke="var(--filo)" stroke-width="1.2"/>`,

  // Una nota, que es lo que el tanque de agua le devuelve.
  'nota-tanque': `
    <path d="M10 18V5l8-2v13" fill="none" stroke="var(--acento)" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="7.5" cy="18" r="3" fill="var(--acento)"/>
    <circle cx="15.5" cy="16" r="3" fill="var(--acento)"/>`,

  // Dos huellas de oruga frenando. El récord no es un objeto: es una marca.
  'marca-derrape': `
    <path d="M3 16c5-3 11-4 18-3M3 20c5-3 11-4 18-3"
      fill="none" stroke="var(--metal)" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M7 15.4v1.8M12 14.6v1.8M17 14.2v1.8"
      stroke="var(--hueco)" stroke-width="1.2" stroke-linecap="round"/>`
};

// Silueta genérica, por si algún día entra un objeto sin forma propia: mejor un
// casillero vacío reconocible que un hueco.
const FORMA_POR_DEFECTO = `
  <rect x="5" y="5" width="14" height="14" rx="2"
    fill="var(--hueco)" stroke="var(--filo)"/>`;

// Las siluetas de los cuatro grandes. Nunca se ven a color: son sombras, y esa
// es la idea — el mundo es enorme y no se deja mirar de cerca.
const FORMAS_GIGANTES = {
  // La grúa vieja: mástil, pluma y el gancho colgando.
  'grua-vieja': `
    <path d="M6 22V4h2v18zM4 4h11l-2 4H6zM13 8v5M10.5 13h5l-2.5 4z"
      fill="var(--sombra)" stroke="var(--sombra)" stroke-width="1.4"
      stroke-linejoin="round"/>`,

  // El carguero de siete metros: una mole con ruedas.
  carguero: `
    <path d="M2 16V9h9l4 3h7v4z" fill="var(--sombra)"/>
    <circle cx="7" cy="18" r="2.6" fill="var(--sombra)"/>
    <circle cx="17" cy="18" r="2.6" fill="var(--sombra)"/>`,

  // El robot de carga: torso y dos brazos que levantan.
  'robot-de-carga': `
    <path d="M8 6h8v11H8z" fill="var(--sombra)"/>
    <path d="M8 9H4v7M16 9h4v7" fill="none" stroke="var(--sombra)" stroke-width="2.4"/>
    <path d="M9 17h6v4H9z" fill="var(--sombra)"/>`,

  // Los de mantenimiento pesado: tres, siempre juntos, nunca uno.
  'mantenimiento-pesado': `
    <path d="M3 20v-6h5v6zM9.5 20V8h5v12zM16 20v-8h5v8z" fill="var(--sombra)"/>`
};

// Lo que se ve mientras el gigante es sólo una silueta: la forma no se muestra,
// se muestra el signo. Todavía no sabés quién es.
const INCOGNITA = `
  <circle cx="12" cy="12" r="9" fill="none" stroke="var(--sombra)" stroke-width="1.4"/>
  <path d="M9.6 9.4c0-3.2 5-3.4 5 0 0 2.4-2.5 2.4-2.5 4.6" fill="none"
    stroke="var(--sombra)" stroke-width="1.8" stroke-linecap="round"/>
  <circle cx="12.1" cy="17.4" r="1.1" fill="var(--sombra)"/>`;

export function svgDeObjeto(id) {
  const forma = FORMAS[id] ?? FORMA_POR_DEFECTO;
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${forma}</svg>`;
}

// `revelado` false devuelve la incógnita: la silueta del gigante recién aparece
// cuando la presencia alcanza para saber quién es.
export function svgDeGigante(id, revelado) {
  const forma = revelado ? FORMAS_GIGANTES[id] ?? INCOGNITA : INCOGNITA;
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${forma}</svg>`;
}

// ---- Los efectos que antes estaban dibujados en los sprites ----
//
// Todas estas formas replican el tratamiento del arte original, medido sobre las
// versiones viejas sacadas de git: TRES TONOS, no uno. Un borde saturado del
// mismo tono, el cuerpo, y un brillo.
//
// El borde no es negro: en el corazón es rojo (#ff2741 sobre #ff8d90) y en la Z
// es azul marino (#00204b sobre #00efff). Pero está siempre, y es lo que
// despega la forma de la pared del galpón. Sin borde, cualquier cosa se hunde en
// el charcoal — que es exactamente lo que pasó con la primera versión de los
// corazones.

const CORAZON = `
  <path d="M12 21.2c-1.3-1-8.6-5.6-8.6-10.6A4.8 4.8 0 0 1 12 7.2a4.8 4.8 0 0 1 8.6 3.4c0 5-7.3 9.6-8.6 10.6z"
    fill="var(--corazon-cuerpo)" stroke="var(--corazon-borde)" stroke-width="2.6"
    stroke-linejoin="round"/>
  <path d="M8.2 10.4c.3-1.4 1.6-2.1 2.6-1.8" fill="none" stroke="var(--corazon-brillo)"
    stroke-width="1.8" stroke-linecap="round"/>`;

// La chispa: una cuña que va de gruesa a fina, como las rayitas de sorpresa del
// sprite. Sirve para el destello de feliz y para la rayita de jugando: es la
// misma forma del arte, en dos tamaños y dos amarillos.
const CHISPA = `
  <path d="M17.5 5.5 8 17.2l-2.6-2.1L15.4 4z"
    fill="var(--chispa-cuerpo)" stroke="var(--chispa-borde)" stroke-width="1.6"
    stroke-linejoin="round"/>`;

// El pulso de cargando: un huso vertical —ancho al medio, en punta arriba y
// abajo— que sube por el cuerpo del enchufe al pecho. No rodea a Chip: lo
// recorre.
//
// Es una forma llena y no dos trazos. La primera versión eran dos líneas con
// stroke, y con el elemento en 3% del contenedor el trazo grueso terminaba
// midiendo 3 px: en la captura no existía. Un huso lleno sostiene el mismo
// dibujo —halo afuera, núcleo adentro— a cualquier tamaño.
const PULSO = `
  <path d="M12 1.5c2.6 5.6 3.6 8.6 3.6 10.5s-1 4.9-3.6 10.5c-2.6-5.6-3.6-8.6-3.6-10.5s1-4.9 3.6-10.5z"
    fill="var(--pulso-halo)"/>
  <path d="M12 5.5c1.2 3.6 1.6 5.4 1.6 6.5s-.4 2.9-1.6 6.5c-1.2-3.6-1.6-5.4-1.6-6.5s.4-2.9 1.6-6.5z"
    fill="var(--pulso-nucleo)"/>`;

// ---- El número de la pantalla del pecho ----
//
// Una fuente de píxeles de 3x5, dibujada acá y no tipografiada.
//
// El primer intento usó la monoespaciada del sistema, la misma de las barras
// del panel. Al comparar la captura ampliada contra el sprite —a la MISMA
// escala, que es la única comparación que vale— el número quedaba una mancha
// ilegible: el "100%" del arte es una fuente de display gruesa que ocupa la
// mitad del ancho del cristal, y una monoespaciada vectorial a 12 px con halo
// no se le parece en nada.
//
// A 3x5 la proporción da sola: "100%" son cuatro caracteres de 3 más tres
// separaciones de 1, o sea 15 x 5 unidades. Esa relación 3:1 es exactamente la
// del texto dibujado, que ocupa el 50% del ancho y el 15% del alto del cristal.
const DIGITOS = {
  '0': ['111', '101', '101', '101', '111'],
  '1': ['010', '110', '010', '010', '111'],
  '2': ['111', '001', '111', '100', '111'],
  '3': ['111', '001', '111', '001', '111'],
  '4': ['101', '101', '111', '001', '001'],
  '5': ['111', '100', '111', '001', '111'],
  '6': ['111', '100', '111', '101', '111'],
  '7': ['111', '001', '001', '001', '001'],
  '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '111'],
  '%': ['101', '001', '010', '100', '101']
};

// Un rect por píxel encendido. Son a lo sumo 5 caracteres x 15 píxeles: sale más
// barato que cualquier alternativa y no depende de ninguna fuente instalada.
export function svgDeNumero(texto) {
  const chars = [...texto].filter((c) => c in DIGITOS);
  if (!chars.length) return '';

  const ancho = chars.length * 4 - 1;
  let px = '';
  chars.forEach((c, i) => {
    DIGITOS[c].forEach((fila, y) => {
      [...fila].forEach((bit, x) => {
        if (bit === '1') px += `<rect x="${i * 4 + x}" y="${y}" width="1" height="1"/>`;
      });
    });
  });

  // shape-rendering crispEdges: sin esto el navegador antialiasa los bordes de
  // cada píxel al escalar y el número deja de ser pixel art.
  return `<svg viewBox="0 0 ${ancho} 5" aria-hidden="true" shape-rendering="crispEdges"
    fill="currentColor">${px}</svg>`;
}

// El rayo del pecho. Es la MISMA silueta que el ícono del botón Cargar: el
// símbolo de energía del juego es uno solo, y que el botón y el pecho usen
// formas distintas sería inventar un segundo idioma.
//
// No reemplaza al rayo dibujado en el sprite: se apoya encima con mezcla
// `screen`, así que lo ENCIENDE en vez de taparlo. Por eso no hace falta que
// calce al píxel — la mezcla aditiva perdona el corrimiento, y el arte sigue
// siendo el arte.
const RAYO = `
  <path d="M13 2 4 14h7l-1 8 9-12h-7z" fill="var(--rayo-color)"/>`;

// ---- La toma de corriente del galpón ----
//
// No es un efecto ni un objeto de la colección: es MOBILIARIO. Está siempre, en
// todos los estados, y existe para que el cable de `cargando` termine en algo en
// vez de terminar en el aire.
//
// El viewBox es 20x24 y no 24x24 —más alto que ancho— porque una toma real lo
// es. La caja va con degradé de chapa, el bisel en el naranja del juego, y las
// dos ranuras son huecos oscuros con clase propia (`ranura`) para que el CSS las
// pueda encender mientras Chip carga.
const TOMA = `
  <defs>
    <linearGradient id="chapa-toma" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="var(--toma-alto)"/>
      <stop offset="0.55" stop-color="var(--toma-chapa)"/>
      <stop offset="1" stop-color="var(--toma-bajo)"/>
    </linearGradient>
  </defs>
  <rect x="1.4" y="1.4" width="17.2" height="21.2" rx="1.8"
    fill="url(#chapa-toma)" stroke="var(--toma-borde)" stroke-width="1.1"/>
  <rect x="3.4" y="3.4" width="13.2" height="17.2" rx="1.2"
    fill="none" stroke="var(--toma-filo)" stroke-width="0.9"/>
  <path d="M3.6 3.2h12.8" stroke="var(--toma-brillo)" stroke-width="0.7"
    stroke-linecap="round" opacity="0.5"/>
  <rect class="ranura" x="6.1" y="7.4" width="2.4" height="6.4" rx="0.9"
    fill="var(--toma-hueco)"/>
  <rect class="ranura" x="11.5" y="7.4" width="2.4" height="6.4" rx="0.9"
    fill="var(--toma-hueco)"/>
  <circle cx="10" cy="18" r="1.5" fill="var(--toma-hueco)"/>
  <path d="M9 18h2" stroke="var(--toma-filo)" stroke-width="0.7" stroke-linecap="round"/>`;

// La burbuja de limpiando: redonda, con brillo arriba a la izquierda y un aro
// más marcado, como las del sprite.
const BURBUJA = `
  <circle cx="12" cy="12" r="8.6" fill="var(--burbuja-cuerpo)"
    stroke="var(--burbuja-borde)" stroke-width="1.8"/>
  <circle cx="8.8" cy="8.8" r="2.6" fill="var(--burbuja-brillo)"/>`;

const envolver = (forma) => `<svg viewBox="0 0 24 24" aria-hidden="true">${forma}</svg>`;

export function svgDeCorazon() {
  return envolver(CORAZON);
}

export function svgDeChispa() {
  return envolver(CHISPA);
}

// El único que NO conserva la proporción. Todas las demás formas viven en cajas
// cuadradas, así que el `meet` por defecto no las toca; el pulso vive en una caja
// alta y angosta, y con `meet` el dibujo de 24x24 se escalaba entero para entrar
// a lo ancho y quedaba centrado con aire arriba y abajo — o sea, un huso cuadrado
// de 17 px en vez de un trazo de 17x40. En la captura eso se veía como una mancha
// clara y no como energía subiendo. El huso es simétrico: estirarlo no lo rompe.
export function svgDePulso() {
  return `<svg viewBox="0 0 24 24" preserveAspectRatio="none" aria-hidden="true">${PULSO}</svg>`;
}

export function svgDeBurbuja() {
  return envolver(BURBUJA);
}

// Su propio envoltorio: es la única forma con caja no cuadrada.
export function svgDeRayo() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${RAYO}</svg>`;
}

export function svgDeToma() {
  return `<svg viewBox="0 0 20 24" aria-hidden="true">${TOMA}</svg>`;
}

export function tieneForma(id) {
  return id in FORMAS;
}

export function tieneFormaDeGigante(id) {
  return id in FORMAS_GIGANTES;
}
