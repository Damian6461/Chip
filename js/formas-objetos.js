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

export function tieneForma(id) {
  return id in FORMAS;
}

export function tieneFormaDeGigante(id) {
  return id in FORMAS_GIGANTES;
}
