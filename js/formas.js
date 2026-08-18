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
      stroke="var(--hueco)" stroke-width="1.2" stroke-linecap="round"/>`,

  // ---- FAMILIA A: piezas del galpón ----

  'bulon-doce': `
    <path d="M6 3h8l3 3-3 3H6L3 6z" fill="var(--metal)" stroke="var(--filo)"/>
    <path d="M8.5 9h3v11h-3z" fill="var(--metal)" stroke="var(--filo)"/>
    <path d="M8.5 12h3M8.5 15h3M8.5 18h3" stroke="var(--filo)" stroke-width="0.9"/>`,

  // Nadie la cortó así a propósito, y por eso le gusta más.
  'chapa-pez': `
    <path d="M3 12c3-5 9-6 13-3l4-3v12l-4-3c-4 3-10 2-13-3z"
      fill="var(--metal)" stroke="var(--filo)"/>
    <circle cx="8" cy="11" r="1.1" fill="var(--hueco)"/>`,

  // Lo guardó por las letras, que no sabe qué dicen.
  'resto-embalaje': `
    <path d="M4 6l7-2 9 3-1 12-8 2-7-3z" fill="var(--metal)" stroke="var(--filo)"/>
    <path d="M7 10h7M7 13h5M7 16h6" stroke="var(--hueco)" stroke-width="1.4"
      stroke-linecap="round"/>`,

  // La otra mitad no apareció.
  'media-junta': `
    <path d="M12 3a9 9 0 0 1 0 18" fill="none" stroke="var(--metal)" stroke-width="4"/>
    <path d="M12 3a9 9 0 0 1 0 18" fill="none" stroke="var(--filo)" stroke-width="0.9"/>
    <path d="M12 7a5 5 0 0 1 0 10" fill="none" stroke="var(--hueco)" stroke-width="1.1"/>`,

  'llave-once': `
    <path d="M5 3l3 2-1 3 3 2 8 9-2 2-9-8-2-3-3 1-2-3z"
      fill="var(--metal)" stroke="var(--filo)"/>
    <circle cx="7" cy="6.5" r="1.2" fill="var(--hueco)"/>`,

  // Trató de enderezarlo, no pudo, y así le gustó más.
  'perno-doblado': `
    <path d="M4 19c4 0 6-3 6-7s2-6 5-6" fill="none" stroke="var(--metal)"
      stroke-width="3.4" stroke-linecap="round"/>
    <circle cx="15.6" cy="6" r="2.6" fill="var(--metal)" stroke="var(--filo)"/>`,

  // Gira y hace clic.
  'tapa-valvula': `
    <circle cx="12" cy="12" r="8" fill="var(--metal)" stroke="var(--filo)"/>
    <path d="M12 4v2M12 18v2M4 12h2M18 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M17.7 6.3l-1.4 1.4M7.7 16.3l-1.4 1.4"
      stroke="var(--filo)" stroke-width="1.3" stroke-linecap="round"/>
    <circle cx="12" cy="12" r="3" fill="var(--hueco)" stroke="var(--filo)"/>`,

  // Mide hasta ochenta y siete y ahí se corta.
  // Un rollo con la lengüeta saliendo y sus marcas. La primera versión era una
  // sola curva y se leía como un gancho, no como una cinta.
  'cinta-metrica': `
    <circle cx="9" cy="11" r="7" fill="none" stroke="var(--metal)" stroke-width="2.4"/>
    <circle cx="9" cy="11" r="3.2" fill="none" stroke="var(--metal)" stroke-width="2"/>
    <path d="M9 18h12" fill="none" stroke="var(--metal)" stroke-width="2.6"
      stroke-linecap="round"/>
    <path d="M13 16.9v2.2M16 16.9v2.2M19 16.9v2.2" stroke="var(--filo)"
      stroke-width="0.95" stroke-linecap="round"/>`,

  'rodamiento': `
    <circle cx="12" cy="12" r="9" fill="none" stroke="var(--metal)" stroke-width="2.2"/>
    <circle cx="12" cy="12" r="3.4" fill="var(--metal)" stroke="var(--filo)"/>
    <circle cx="12" cy="5.4" r="1.7" fill="var(--hueco)"/>
    <circle cx="18.6" cy="12" r="1.7" fill="var(--hueco)"/>
    <circle cx="12" cy="18.6" r="1.7" fill="var(--hueco)"/>
    <circle cx="5.4" cy="12" r="1.7" fill="var(--hueco)"/>`,

  // El resto de la manguera sigue donde estaba.
  'trozo-manguera': `
    <path d="M5 19c0-6 3-8 7-8s5-2 5-5" fill="none" stroke="var(--metal)"
      stroke-width="4.4" stroke-linecap="round"/>
    <path d="M5 19c0-6 3-8 7-8s5-2 5-5" fill="none" stroke="var(--hueco)"
      stroke-width="1.1" stroke-linecap="round"/>`,

  // ---- FAMILIA B: lo que los gigantes pierden ----
  //
  // Van más grandes en su lienzo que las de la familia A: son piezas de cosas
  // enormes, y que ocupen más caja es la única forma de decir eso en 24 px.

  'remache-carguero': `
    <path d="M4 8a8 5 0 0 1 16 0z" fill="var(--metal)" stroke="var(--filo)"/>
    <path d="M9 8h6v13l-3 2-3-2z" fill="var(--metal)" stroke="var(--filo)"/>
    <path d="M7 6.5a6 3 0 0 1 6-1.5" fill="none" stroke="var(--hueco)"
      stroke-width="1.2" stroke-linecap="round"/>`,

  // Pesa más que su cabeza.
  'eslabon-grua': `
    <rect x="3" y="6" width="18" height="12" rx="6" fill="none"
      stroke="var(--metal)" stroke-width="3.6"/>
    <rect x="3" y="6" width="18" height="12" rx="6" fill="none"
      stroke="var(--filo)" stroke-width="0.9"/>
    <path d="M9 12h6" stroke="var(--hueco)" stroke-width="2.4" stroke-linecap="round"/>`,

  // Todavía sirve para algo, seguro.
  'filtro-descartado': `
    <path d="M5 5h14v12a7 2.6 0 0 1-14 0z" fill="var(--metal)" stroke="var(--filo)"/>
    <ellipse cx="12" cy="5" rx="7" ry="2.4" fill="var(--hueco)" stroke="var(--filo)"/>
    <path d="M8 8v9M12 8v9M16 8v9" stroke="var(--filo)" stroke-width="1"/>`,

  // El número es 4471. Chip no sabe de qué era, pero ahora lo sabe alguien.
  'placa-numero': `
    <rect x="2" y="7" width="20" height="10" rx="1" fill="var(--metal)" stroke="var(--filo)"/>
    <circle cx="4.6" cy="12" r="0.9" fill="var(--hueco)"/>
    <circle cx="19.4" cy="12" r="0.9" fill="var(--hueco)"/>
    <path d="M7 9.5v2.2h2.4M9.4 9.5v5M11.6 9.5v2.2H14M14 9.5v5M16.2 9.5h2.4l-1.5 5M20 10.4l1-.9v5"
      fill="none" stroke="var(--hueco)" stroke-width="1.15" stroke-linecap="round"
      stroke-linejoin="round"/>`,

  // Tan grande que no se comprime con su peso. Se subió encima igual.
  // TRES ANILLOS Y NO CUATRO LÍNEAS. La primera versión era una pila de rayas
  // horizontales y quedaba idéntica al `resorte`, que es exactamente lo que un
  // objeto de una colección no puede ser: igual a otro. Los anillos en
  // perspectiva dicen "espiral pesada" y las rayas no dicen nada.
  'muelle-industrial': `
    <ellipse cx="12" cy="6.5" rx="8.5" ry="2.8" fill="none" stroke="var(--metal)" stroke-width="2.8"/>
    <ellipse cx="12" cy="12" rx="8.5" ry="2.8" fill="none" stroke="var(--metal)" stroke-width="2.8"/>
    <ellipse cx="12" cy="17.5" rx="8.5" ry="2.8" fill="none" stroke="var(--metal)" stroke-width="2.8"/>
    <path d="M3.5 6.5v11M20.5 6.5v11" stroke="var(--filo)" stroke-width="0.9"/>`,

  // Le entra el cuerpo entero adentro. No lo hizo, pero lo pensó.
  'guante-trabajo': `
    <path d="M6 21v-8c0-1 1-1 1 0v-2c0-1.2 1.4-1.2 1.4 0V8c0-1.4 1.6-1.4 1.6 0v3c0-1.4 1.6-1.4 1.6 0v2l3-1c1.2-.4 1.8 1 1 1.8l-3 3v4z"
      fill="var(--metal)" stroke="var(--filo)"/>
    <path d="M6 18.6h9.6" stroke="var(--hueco)" stroke-width="1.2"/>`,

  // Alguien la cambió y no barrió lo viejo.
  'terminal-quemada': `
    <path d="M3 10h9v4H3z" fill="var(--metal)" stroke="var(--filo)"/>
    <circle cx="16" cy="12" r="5" fill="var(--metal)" stroke="var(--filo)"/>
    <circle cx="16" cy="12" r="2.2" fill="var(--hueco)"/>
    <path d="M3 10h4v4H3z" fill="var(--filo)"/>`,

  // Del lado sin gastar todavía se lee la marca.
  'pastilla-freno': `
    <path d="M3 7h18v5H3z" fill="var(--metal)" stroke="var(--filo)"/>
    <path d="M3 12h18l-2 5H5z" fill="var(--hueco)" stroke="var(--filo)"/>
    <path d="M13 12h8l-2 5h-6z" fill="var(--metal)" stroke="var(--filo)"/>
    <path d="M15 14.4h3" stroke="var(--filo)" stroke-width="1"/>`,

  // ---- FAMILIA C: lo que entra de afuera ----
  //
  // TIENEN QUE NOTARSE DISTINTAS, y es deliberado: son lo único orgánico de una
  // colección de metal. Por eso no usan --metal ni el filo negro duro del resto,
  // sino su propia paleta cálida y contornos curvos sin ángulos. Una hoja seca
  // en un estante de bulones dice algo que ningún bulón puede decir.

  'hoja-seca': `
    <path d="M20 4c-9 0-16 5-16 11 0 3 2 5 5 5 6 0 11-7 11-16z"
      fill="var(--organico)" stroke="var(--organico-veta)"/>
    <path d="M19 5C13 8 8 13 5.5 19" fill="none" stroke="var(--organico-veta)"
      stroke-width="1.1" stroke-linecap="round"/>
    <path d="M16 6.6c-1.6.2-2 2.6-3.6 3.2M13 9.4c-1.6.4-2 2.8-3.6 3.4M10 12.6c-1.5.5-1.8 2.6-3.2 3.2"
      fill="none" stroke="var(--organico-veta)" stroke-width="0.85" stroke-linecap="round"/>`,

  // No hay piedras adentro del galpón.
  'piedra-lisa': `
    <path d="M3.5 14.5c0-3.6 4-6.5 9-6.5s8.5 2.4 8.5 5.4-3.4 5.6-8.6 5.6-8.9-1.5-8.9-4.5z"
      fill="var(--organico)" stroke="var(--organico-veta)"/>
    <path d="M6.5 12.4c2-1.6 5-2.4 8-2.2" fill="none" stroke="var(--organico-claro)"
      stroke-width="1.3" stroke-linecap="round"/>`,

  // Miró hacia arriba un rato largo y no vio nada.
  pluma: `
    <path d="M19 3c-7 1-13 7-14 14l2 2c7-1 13-7 14-14z"
      fill="var(--organico-claro)" stroke="var(--organico-veta)"/>
    <path d="M19 3L5.6 18.4" fill="none" stroke="var(--organico-veta)" stroke-width="1.1"/>
    <path d="M14.4 5.4l-3.2 3.2M17 8.4l-3.2 3.2M11.4 8.6l-3.2 3.2M13.8 11.8l-3.2 3.2"
      fill="none" stroke="var(--organico-veta)" stroke-width="0.8" stroke-linecap="round"/>`,

  // Se despegó entero. Chip lo estiró con cuidado.
  'papel-humedad': `
    <path d="M5 4c4-1 9-1 14 0-1 6-1 11 0 16-5 1-10 1-14 0 1-5 1-10 0-16z"
      fill="var(--organico-claro)" stroke="var(--organico-veta)"/>
    <path d="M8 8.6c2.6 1.6 5.4 1.4 8 0M8 12.4c2.6 1.6 5.4 1.4 8 0M8 16.2c2 1.2 4 1.2 6 0"
      fill="none" stroke="var(--organico)" stroke-width="1" stroke-linecap="round"/>`,

  // Bajó girando por la ventana.
  'semilla-alas': `
    <path d="M12 17c0-7 3-12 8-13 1 5-2 11-8 13z" fill="var(--organico-claro)"
      stroke="var(--organico-veta)"/>
    <path d="M12 17c0-7-3-12-8-13-1 5 2 11 8 13z" fill="var(--organico-claro)"
      stroke="var(--organico-veta)"/>
    <ellipse cx="12" cy="18.4" rx="2.6" ry="2.2" fill="var(--organico)"
      stroke="var(--organico-veta)"/>`,

  // ---- FAMILIA D: las rarezas ----

  // No encaja con nada. No es de acá.
  'pieza-desconocida': `
    <path d="M12 3l5 3-1 6 4 4-4 5-6-2-5 2-2-6 3-4-1-5z"
      fill="var(--raro)" stroke="var(--filo)"/>
    <path d="M9.6 9.6l4.8 4.8M14.4 9.6l-4.8 4.8" fill="none" stroke="var(--hueco)"
      stroke-width="1.3" stroke-linecap="round"/>`,

  // NO SE RESUELVE NUNCA. No se distingue qué muestra, y no va a distinguirse:
  // el borrón es la pieza, no un dibujo pendiente.
  foto: `
    <rect x="3.5" y="4.5" width="17" height="15" rx="0.8" fill="var(--metal)"
      stroke="var(--filo)"/>
    <rect x="5.5" y="6.5" width="13" height="9" fill="var(--hueco)"/>
    <path d="M7.5 13c2-3 4 1 5.5-1.5s3 1.5 3.5 0" fill="none" stroke="var(--raro)"
      stroke-width="1.6" stroke-linecap="round" opacity="0.55"/>
    <circle cx="10" cy="9.6" r="1.6" fill="var(--raro)" opacity="0.4"/>`,

  // NO SE RESUELVE NUNCA. La etiqueta dice una sola palabra y está borroneada.
  'llave-etiqueta': `
    <circle cx="6.5" cy="8" r="3.4" fill="none" stroke="var(--metal)" stroke-width="2.4"/>
    <path d="M8.8 10.4L15 17" fill="none" stroke="var(--metal)" stroke-width="2.4"
      stroke-linecap="round"/>
    <path d="M13 15l1.6-1.6M15 17l1.6-1.6" stroke="var(--metal)" stroke-width="2"
      stroke-linecap="round"/>
    <path d="M15.5 3.5h6v5h-6l-1.4-2.5z" fill="var(--raro)" stroke="var(--filo)"/>
    <path d="M16.6 6h3.4" stroke="var(--hueco)" stroke-width="1.4"
      stroke-linecap="round" opacity="0.6"/>`,

  // Gira sin ruido, que es raro para algo tan viejo.
  'engranaje-dorado': `
    <path d="M12 2l2 1.6 2.4-.6 1.2 2.2 2.4.8-.2 2.5 1.8 1.7-1.4 2.1.6 2.4-2.2 1.2-.8 2.4-2.5-.2-1.7 1.8-2.1-1.4-2.4.6-1.2-2.2-2.4-.8.2-2.5L3.4 12l1.4-2.1L4.2 7.5l2.2-1.2.8-2.4 2.5.2z"
      fill="var(--acento)" stroke="var(--filo)"/>
    <circle cx="12" cy="12" r="3.6" fill="var(--hueco)" stroke="var(--filo)"/>`,

  // NO SE RESUELVE NUNCA. Suena cuando la mueve y no la puede abrir. Las tres
  // marcas de al lado son el sonido, no una tapa entreabierta: la caja está
  // cerrada y se queda cerrada.
  'caja-suena': `
    <path d="M4 8l8-3 8 3v9l-8 3-8-3z" fill="var(--metal)" stroke="var(--filo)"/>
    <path d="M4 8l8 3 8-3M12 11v9" fill="none" stroke="var(--filo)" stroke-width="1"/>
    <path d="M14.6 6.4c1.2.6 1.2 2.4 0 3M16.8 5c2 1.2 2 4.8 0 6"
      fill="none" stroke="var(--raro)" stroke-width="1.2" stroke-linecap="round"/>`

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

// La repisa alta de la pared derecha, dibujada por código.
//
// Está POR ENCIMA de la línea del horizonte —que en esta escena cae en el 63%
// del alto, medida por el borde del alféizar— así que se ve DESDE ABAJO. Eso
// manda el dibujo entero: de la cara de arriba se ve apenas una tira, lo que
// domina es el canto frontal, y la tira de arriba se ACORTA en los extremos
// porque el borde de atrás está más lejos. Ese trapecio de dos píxeles es todo
// lo que hace falta para que la tabla no se lea como una barra de frente.
//
// Los tonos NO están elegidos a ojo. La primera versión medía 48-88 de
// luminancia contra una pared de 35, y en azul frío contra una pared cálida
// (RGB 41/36/33): saltaba de la escena como un elemento de interfaz. Ahora el
// canto está apenas por encima de la pared, la cara un poco más, y lo único
// brillante es el filo de arriba —una línea de un píxel— porque la luz entra
// por la ventana, que está a la izquierda y es lo más claro del cuadro.
//
// El viewBox es 100x20 porque es una tabla ancha: así el CSS le da el largo sin
// deformar el grosor.
// EL ID DEL GRADIENTE SALE DEL NIVEL, y esa es la única forma de que no se
// repita. Este SVG se inyecta UNA VEZ POR TABLA, y con el id escrito a mano
// quedaban dos `<linearGradient id="repisa-caida">` en el mismo documento.
//
// `url(#repisa-caida)` resuelve SIEMPRE al primero, así que la segunda tabla se
// estaba pintando con el gradiente de la primera. Hoy no se ve porque los dos
// tienen los mismos stops; el día que uno necesite otro valor, el cambio no va
// a tener efecto y no va a haber error en ninguna parte — que es la peor forma
// de fallar.
//
// Renombrar el segundo a mano no sirve: el bug vuelve con el tercer estante. Lo
// que lo cierra es que el id del gradiente y el id de la tabla salgan del MISMO
// dato, que es el nivel.
const repisaCaida = (nivel) => `repisa-${nivel}-caida`;

const REPISA = (nivel) => `
  <defs>
    <linearGradient id="${repisaCaida(nivel)}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="var(--repisa-sombra)" stop-opacity="0.72"/>
      <stop offset="100%" stop-color="var(--repisa-sombra)" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <!-- la sombra que la tabla tira sobre la pared: va primero, debajo de todo -->
  <rect x="3" y="11" width="94" height="6" fill="url(#${repisaCaida(nivel)})"/>
  <!-- LAS DOS ESCUADRAS. Se reescribieron dos veces y la segunda por una razón
       medible: se dibujaban SUB-PÍXEL. El viewBox es 100x20 sobre un elemento de
       98x29 px, así que una unidad vale 0,98 px de ancho y 1,43 de alto — un
       trazo de 0,8 no llegaba a un píxel y desaparecía.

       Y el relleno tampoco separaba: #1d1b18 son 27 de luminancia contra una
       pared que mide 41 al atardecer, 42 al amanecer y 61 al mediodía. Catorce
       puntos de diferencia no dibujan nada a este tamaño. Lo que separa es el
       FILO, que está en 112, y para que exista tiene que medir más de un píxel.

       Montante, ala bajo la tabla y TIRANTE DIAGONAL. La diagonal es la que dice
       que algo está sujeto: una L sola puede leerse como una sombra, un
       triángulo no. -->
  <g fill="var(--repisa-soporte)">
    <path d="M15 9h5v10.5h-5z"/>
    <path d="M15 9h9v2.8h-9z"/>
    <path d="M79 9h5v10.5h-5z"/>
    <path d="M74.5 9h9.5v2.8h-9.5z"/>
  </g>
  <!-- los tirantes -->
  <path d="M20 11.8 24.5 11.8 20 19z" fill="var(--repisa-soporte)"/>
  <path d="M79 11.8 74.5 11.8 79 19z" fill="var(--repisa-soporte)"/>
  <!-- Los filos, del lado de la ventana. Van a 1,7 de grosor y no a 0,8: es lo
       que hace falta para pasar el píxel con este viewBox. -->
  <path d="M15.6 9v10.5" stroke="var(--repisa-filo)" stroke-width="1.7" opacity="0.8"/>
  <path d="M79.6 9v10.5" stroke="var(--repisa-filo)" stroke-width="1.7" opacity="0.8"/>
  <path d="M20.4 12 20.4 18.6" stroke="var(--repisa-filo)" stroke-width="1.2" opacity="0.55"/>
  <path d="M78.6 12 78.6 18.6" stroke="var(--repisa-filo)" stroke-width="1.2" opacity="0.55"/>
  <!-- la cara de arriba, en trapecio: el borde de atrás es más corto -->
  <path d="M4 5.6h92l2 2H2z" fill="var(--repisa-cara)"/>
  <!-- el canto frontal, que es lo que más se ve desde acá abajo -->
  <path d="M2 7.6h96v3.4H2z" fill="var(--repisa-canto)"/>
  <!-- el filo iluminado de arriba. Una línea sola: es el único brillo que se
       permite, y viene de la ventana, que está a la izquierda -->
  <path d="M5 5.9h90" stroke="var(--repisa-filo)" stroke-width="0.9"
    stroke-linecap="round" opacity="0.8"/>
  <!-- las dos cabezas de bulón sobre los soportes: chapa de galpón, no un
       mueble. Son lo que dice que la tabla está atornillada a algo -->
  <circle cx="16.7" cy="9.3" r="0.9" fill="var(--repisa-filo)" opacity="0.45"/>
  <circle cx="83.3" cy="9.3" r="0.9" fill="var(--repisa-filo)" opacity="0.45"/>`;

// El tilde de "estoy bien". Mismo grosor de trazo y mismas puntas redondeadas
// que el resto de los íconos del juego; no es un glifo de una fuente.
const TILDE = `
  <path d="M4 12.5 9.5 18 20 6.5" fill="none" stroke="var(--color-bateria)"
    stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;

// El panel de mantenimiento: la puerta del menú.
//
// Es diegético a propósito — no es un ícono de hamburguesa, es una cosa que
// está apoyada contra la pared del galpón. Chapa oscura con dos tornillos, una
// pantallita apagada y una etiqueta. Mismo vocabulario que la toma de
// corriente y que las teclas: bisel arriba, sombra abajo, bordes duros.
const PANEL = `
  <rect x="1.5" y="2" width="21" height="20" rx="1.6" fill="var(--panel-chapa)"
    stroke="var(--panel-filo)" stroke-width="1.2"/>
  <rect x="4" y="5" width="16" height="8" rx="0.8" fill="var(--panel-hueco)"/>
  <path d="M6 8.5h7M6 10.5h4" stroke="var(--panel-linea)" stroke-width="1"
    stroke-linecap="round"/>
  <path d="M4.5 16.5h15M4.5 19h9" stroke="var(--panel-linea)" stroke-width="1.2"
    stroke-linecap="round" opacity="0.75"/>
  <circle cx="3.6" cy="3.8" r="0.8" fill="var(--panel-filo)"/>
  <circle cx="20.4" cy="3.8" r="0.8" fill="var(--panel-filo)"/>`;

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
// LA CAJA DE CONEXIÓN DEL PISO.
//
// Lo que había era un tomacorriente doméstico: chapa frontal plana, dos ranuras
// verticales y un borne redondo, con un halo naranja alrededor. Tres problemas,
// y los tres se veían en zoom al 400%:
//
//   CONCEPTO    dos ranuras verticales es un enchufe de pared de casa. Este
//               mundo tiene un tanque, caños y una consola con pantalla en el
//               piso; acá va una caja de conexión industrial, con conector
//               cilíndrico, bulones en las esquinas y una franja naranja
//               PINTADA —como la placa naranja de la consola del fondo—, no un
//               contorno encendido.
//   PERSPECTIVA era un rectángulo de frente. La caja está en el PISO: hay que
//               ver la cara de arriba y el lateral.
//   APOYO       no había sombra visible. Flotaba.
//
// LA FUGA ESTÁ MEDIDA, no estimada. Se tomaron dos juntas del piso de la
// panorámica —una abajo a la izquierda de la ventana y otra al lado de donde
// cae la toma— y se intersectaron sus rectas: se cruzan en el píxel (835, 520)
// de una panorámica de 1672 de ancho. O sea, el punto de fuga está en el centro
// horizontal exacto de la imagen, que es la confirmación de que la vista es
// frontal. Que dos rectas medidas por separado den el centro al píxel es la
// prueba de que son juntas del piso y no grietas.
//
// Desde la base de la toma —píxel (497, 793)— la dirección hacia ese punto es
// 39° sobre la horizontal, hacia la derecha. Eso manda el dibujo entero: la
// cara de arriba y el lateral DERECHO se corren 39° arriba a la derecha. El
// lateral izquierdo no se ve, porque el fondo de la caja va hacia la derecha y
// esa cara le queda atrás.
//
// LOS TONOS, contra el piso del mediodía donde cae (luminancia 89):
//
//   cara de arriba   67   mira al techo, es la que más luz recibe
//   frente           46   la que más se ve
//   lateral derecho  29   le da la espalda a la ventana, que está a la izquierda
//
// Los tres por debajo del piso: es una caja de chapa oscura sobre cemento
// claro, no al revés.
const TOMA = `
  <defs>
    <linearGradient id="toma-frente" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="var(--toma-chapa)"/>
      <stop offset="1" stop-color="var(--toma-bajo)"/>
    </linearGradient>
  </defs>

  <!-- LA SOMBRA, primero y debajo de todo. La luz entra por la ventana, que
       está a la izquierda, así que cae hacia la derecha y hacia adelante. Más
       densa contra la base —donde la caja TOCA— y abierta al alejarse: es la
       diferencia entre una cosa apoyada y una cosa flotando dos centímetros. -->
  <ellipse cx="22" cy="34.8" rx="18" ry="2.9" fill="var(--toma-sombra)" opacity="0.3"/>
  <ellipse cx="19.5" cy="34.5" rx="12.5" ry="1.9" fill="var(--toma-sombra)" opacity="0.55"/>
  <path d="M2 33.9h30.6v1.1H2z" fill="var(--toma-sombra)" opacity="0.8"/>

  <!-- LA CARA DE ARRIBA. El corrimiento de 6 en x y -4,85 en y son los 39°
       medidos: la profundidad en pantalla de una caja de este tamaño a esta
       distancia del horizonte. -->
  <path d="M2 12h30l6-4.85H8z" fill="var(--toma-arriba)"/>
  <!-- el filo delantero de la tapa, que es donde pega la luz de la ventana -->
  <path d="M2.4 11.8h29.2" stroke="var(--toma-brillo)" stroke-width="0.8"
    stroke-linecap="round" opacity="0.55"/>
  <!-- la tapa está atornillada: se ve el reborde -->
  <path d="M5.4 10.1h25.4l3.4-2.75H8.8z" fill="none" stroke="var(--toma-filo)"
    stroke-width="0.6" opacity="0.6"/>

  <!-- EL LATERAL DERECHO, el más oscuro: le da la espalda a la ventana. -->
  <path d="M32 12l6-4.85v22L32 34z" fill="var(--toma-lado)"/>
  <path d="M32 12l6-4.85" stroke="var(--toma-filo)" stroke-width="0.7" opacity="0.7"/>

  <!-- EL FRENTE. -->
  <rect x="2" y="12" width="30" height="22" fill="url(#toma-frente)"/>
  <rect x="2.5" y="12.5" width="29" height="21" fill="none"
    stroke="var(--toma-filo)" stroke-width="0.7"/>

  <!-- La franja naranja PINTADA sobre la chapa, gastada. Es el naranja del
       juego usado como lo usa el mundo: una placa pintada, no un halo. -->
  <path d="M3.4 28.6h27.2v3.5H3.4z" fill="var(--toma-naranja)"/>
  <path d="M3.4 28.6h27.2v0.9H3.4z" fill="var(--toma-naranja-alto)" opacity="0.7"/>
  <path d="M6 29.6h1.4v1.6H6zM9 29.6h0.9v1.6H9zM11.4 29.6h1.9v1.6h-1.9z"
    fill="var(--toma-hueco)" opacity="0.55"/>

  <!-- EL CONECTOR CILÍNDRICO: collar roscado, boca oscura y dos bornes. Es lo
       que reemplaza a las dos ranuras verticales del enchufe de casa. -->
  <circle cx="17" cy="20.6" r="7" fill="var(--toma-bajo)" stroke="var(--toma-filo)" stroke-width="0.8"/>
  <circle cx="17" cy="20.6" r="7" fill="none" stroke="var(--toma-brillo)" stroke-width="0.6"
    stroke-dasharray="1.6 1.5" opacity="0.45"/>
  <circle cx="17" cy="20.6" r="4.8" fill="var(--toma-chapa)" stroke="var(--toma-filo)" stroke-width="0.7"/>
  <circle class="boca" cx="17" cy="20.6" r="3.2" fill="var(--toma-hueco)"/>
  <!-- TRES BORNES EN TRIÁNGULO, uno arriba y dos abajo, más la chaveta del
       collar. La versión anterior tenía dos bornes al mismo nivel y una raya
       corta debajo, y a 48 px eso es una CARA: dos ojos y una boca. Un conector
       trifásico de verdad va en triángulo justamente para que no haya dos
       posiciones equivalentes, así que la forma correcta es además la que no se
       lee como cara. -->
  <circle cx="17" cy="18.6" r="0.8" fill="var(--toma-borne)"/>
  <circle cx="15.3" cy="21.6" r="0.8" fill="var(--toma-borne)"/>
  <circle cx="18.7" cy="21.6" r="0.8" fill="var(--toma-borne)"/>
  <path d="M17 15.6v1.3" stroke="var(--toma-filo)" stroke-width="1.1" stroke-linecap="round"/>
  <!-- el brillo del collar, arriba a la izquierda: la ventana está de ese lado -->
  <path d="M12.6 17.2a6.2 6.2 0 0 1 4-2.4" fill="none" stroke="var(--toma-brillo)"
    stroke-width="0.9" stroke-linecap="round" opacity="0.5"/>

  <!-- Los cuatro bulones de las esquinas. -->
  <circle class="bulon" cx="5.2" cy="15" r="1.25" fill="var(--toma-bajo)" stroke="var(--toma-filo)" stroke-width="0.5"/>
  <circle class="bulon" cx="28.8" cy="15" r="1.25" fill="var(--toma-bajo)" stroke="var(--toma-filo)" stroke-width="0.5"/>
  <circle class="bulon" cx="5.2" cy="25.6" r="1.25" fill="var(--toma-bajo)" stroke="var(--toma-filo)" stroke-width="0.5"/>
  <circle class="bulon" cx="28.8" cy="25.6" r="1.25" fill="var(--toma-bajo)" stroke="var(--toma-filo)" stroke-width="0.5"/>
  <path d="M4.5 14.6h1.4M28.1 14.6h1.4M4.5 25.2h1.4M28.1 25.2h1.4"
    stroke="var(--toma-brillo)" stroke-width="0.5" stroke-linecap="round" opacity="0.5"/>`;

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
// `nivel` no tiene default a propósito: si alguien llama a esto sin decir cuál
// tabla es, el id vuelve a repetirse. Que falte el dato tiene que doler acá y no
// tres meses después, en un gradiente que no se aplica y no avisa.
export function svgDeRepisa(nivel) {
  return `<svg viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true">${REPISA(nivel)}</svg>`;
}

export function svgDeTilde() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${TILDE}</svg>`;
}

export function svgDePanel() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${PANEL}</svg>`;
}

export function svgDeRayo() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${RAYO}</svg>`;
}

export function svgDeToma() {
  // viewBox propio y NO el de 24x24 del resto: la caja se dibuja con su cara de
  // arriba y su lateral, así que ocupa más ancho que alto y necesita lugar
  // abajo para la sombra.
  return `<svg viewBox="0 0 40 38" aria-hidden="true">${TOMA}</svg>`;
}

// EL RECORRIDO DEL CABLE. Función pura: recibe el conector y la tabla de puntos,
// devuelve el camino entero más sus tramos por separado.
//
// DOS COSAS DISTINTAS, y esa es la forma. La CAÍDA es una curva —el cable
// cuelga en el aire y una catenaria es lo que hace algo colgado—. Todo lo que
// viene después son TRAMOS RECTOS que se quiebran en ángulo, porque un cable
// tirado en el piso no describe curvas suaves: hace un tramo, dobla, hace otro.
// La versión anterior era una curva con un rulo y se leía como una cinta.
//
// Se devuelven los tramos por separado para poder AFINAR el trazo con la
// distancia: cada tramo trae su profundidad y el que lo dibuja le da su grosor.
// Un cable del mismo grosor de punta a punta aplana la escena entera.
// ---- EL CABLE, COMO CINTA Y NO COMO TRAZO ----
//
// Se dibujaba con un <path> por tramo y `stroke`. Eso traía tres problemas que
// no se arreglan tocando números:
//
// 1. NODOS BRILLANTES EN LOS QUIEBRES. Cada tramo era su propio path con
//    `stroke-linecap: round`, así que en cada vértice se apilaban dos casquetes
//    redondos — y encima el path del brillo ponía otros dos.
// 2. NO SE PODÍA AFINAR DE VERDAD. Un `stroke` tiene un ancho por path.
// 3. NO TENÍA CUERPO. Un trazo con brillo encima se lee como una línea de luz.
//
// La cinta resuelve los tres: se muestrea la línea media, cada muestra lleva su
// profundidad y de ahí su semiancho, y se emite un polígono cerrado.
// Corner-cutting de Chaikin, con el clamp escrito y no implícito.
//
// Cada vértice interior se reemplaza por dos puntos sobre sus segmentos. El
// corte NUNCA puede pasar de la mitad del tramo más corto que toca el vértice:
// si lo pasara, las dos curvas de vértices vecinos se cruzarían y el redondeo
// colapsaría en la punta que vinimos a sacar.
//
// Con el 0,25 de Chaikin el clamp no se activa casi nunca —un cuarto ya es menos
// que la mitad— pero está escrito igual, porque "casi nunca" no es una garantía
// y el día que alguien suba el factor esto lo frena.
const CORTE = 0.25;

function suavizar(puntos) {
  if (puntos.length < 3) return puntos;

  const largoDe = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
  const salida = [puntos[0]];

  for (let i = 0; i < puntos.length - 1; i++) {
    const a = puntos[i];
    const b = puntos[i + 1];
    const largo = largoDe(a, b) || 1;

    const mezcla = (t) => ({
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      z: a.z + (b.z - a.z) * t
    });

    // El corte de este tramo, clampeado contra el tramo vecino más corto.
    const vecinoA = i > 0 ? largoDe(puntos[i - 1], a) : largo;
    const vecinoB = i < puntos.length - 2 ? largoDe(b, puntos[i + 2]) : largo;
    const tope = Math.min(largo, vecinoA, vecinoB) / 2;
    const t = Math.min(CORTE, tope / largo);

    if (i > 0) salida.push(mezcla(t));
    if (i < puntos.length - 2) salida.push(mezcla(1 - t));
  }

  salida.push(puntos[puntos.length - 1]);
  return salida;
}

// REMUESTREO A PASO FIJO, que es lo que arregla el pico.
//
// La línea media venía de dos fuentes con densidades muy distintas: la caída
// muestreada en 14 puntos y los quiebres, que son 7 puntos sueltos. En los
// tramos rectos largos no había ninguna muestra intermedia, así que entre dos
// consecutivas había hasta 63 px —medido en producción— contra los 3 o 4 del
// resto del recorrido.
//
// Eso trae dos problemas y ninguno se ve leyendo el código. El grosor sólo puede
// cambiar EN una muestra, así que un tramo largo se afina de golpe en su
// extremo en vez de a lo largo. Y el redondeo de Chaikin corta un cuarto de cada
// tramo: sobre un tramo de 63 px eso son 16 px de curva contra 1 px en los
// tramos cortos, o sea que el mismo quiebre se redondea distinto según de qué
// largo sean sus vecinos.
//
// Con paso fijo las dos cosas se arreglan solas y además queda una propiedad
// verificable: ninguna muestra consecutiva salta más que el paso.
function remuestrear(linea, paso) {
  if (linea.length < 2) return linea;

  const salida = [linea[0]];
  let resto = paso;

  for (let i = 1; i < linea.length; i++) {
    const a = linea[i - 1];
    const b = linea[i];
    let largo = Math.hypot(b.x - a.x, b.y - a.y);
    if (largo === 0) continue;

    let recorrido = 0;

    while (recorrido + resto <= largo) {
      recorrido += resto;
      const t = recorrido / largo;
      salida.push({
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        z: a.z + (b.z - a.z) * t
      });
      resto = paso;
    }

    resto -= largo - recorrido;
  }

  // El último punto va siempre, aunque no caiga en el paso: es la boca de la
  // caja y tiene que quedar donde dice RECORRIDO_CABLE, no donde caiga la
  // grilla del remuestreo.
  const ultimo = linea[linea.length - 1];
  const previo = salida[salida.length - 1];
  if (Math.hypot(ultimo.x - previo.x, ultimo.y - previo.y) > 0.01) salida.push(ultimo);

  return salida;
}

// La caída del conector al piso: catenaria asimétrica, con la panza corrida
// hacia el extremo bajo.
function muestrasDeLaCaida(desde, apoyo, pasos) {
  const largo = Math.hypot(apoyo.x - desde.x, apoyo.y - desde.y);
  const cuelga = largo * apoyo.caida;
  // EL PRIMER CONTROL VA JUSTO DEBAJO DEL CONECTOR, y eso es lo que hace que la
  // curva SALGA vertical: la tangente en t=0 apunta de P0 a c1. Con c1 corrido
  // hacia el apoyo —como estaba— el cable arrancaba en diagonal, o sea casi
  // tangente al pecho, y un cable que corre pegado al cuerpo se lee apoyado por
  // más que su origen sea exacto.
  //
  // La alternativa era meter un tramo recto vertical antes de la catenaria, y se
  // probó: forma ESQUINA con la curva, y en una esquina más cerrada que el ancho
  // del cable el borde interno de la cinta se dobla sobre sí mismo. Medido: un
  // salto de 12,9 px en un borde cuyo paso es de 4. Con el control acá no hay
  // esquina que doblar.
  const c1 = { x: desde.x, y: desde.y + cuelga * 0.72 };
  const c2 = { x: desde.x + (apoyo.x - desde.x) * 0.7, y: apoyo.y + cuelga * 0.3 };

  const en = (t) => {
    const u = 1 - t;
    return {
      x: u * u * u * desde.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * apoyo.x,
      y: u * u * u * desde.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * apoyo.y,
      z: 0
    };
  };

  return Array.from({ length: pasos + 1 }, (_, i) => en(i / pasos));
}

function normales(linea) {
  return linea.map((p, i) => {
    const a = linea[Math.max(0, i - 1)];
    const b = linea[Math.min(linea.length - 1, i + 1)];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const largo = Math.hypot(dx, dy) || 1;
    return { x: -dy / largo, y: dx / largo };
  });
}

// GROSOR CONSTANTE. Antes se afinaba con la profundidad de cada tramo; ahora no,
// porque este cable no se aleja: se apoya y cruza el piso a la misma distancia.
// En la referencia mide lo mismo de punta a punta.
//
// VA EN % DEL EJE PECHO->TOMA Y NO DEL ANCHO DE LA ESCENA, y la diferencia no es
// cosmética. La referencia es arte conceptual: no comparte encuadre con la
// escena, así que medir el cable contra el ancho de una imagen que no es la
// nuestra es precisión falsa. Contra el eje sí sobrevive, porque el eje es la
// misma pieza en las dos —del enchufe del pecho al toma— y es lo único que se
// puede poner una al lado de la otra.
//
// Y arrastra la consecuencia correcta: el grosor sale de lo LARGO que es el
// recorrido, no de lo ancha que es la pantalla. Un teléfono más angosto acorta
// el eje y adelgaza el cable en la misma proporción, así que la silueta se
// conserva.
export function grosorDelCable(largoEje, cable) {
  return (cable.grosor / 100) * largoEje;
}

// El eje: la recta del enchufe del pecho al toma. Es el metro de todo el cable
// —el camino, el grosor y el paso de muestreo van en unidades de este largo— y
// por eso se calcula en un solo lugar.
function largoDelEje(conector, toma) {
  return Math.hypot(toma.x - conector.x, toma.y - conector.y) || 1;
}

// La línea media completa, del conector a la caja. Se exporta para poder
// verificar en un test que su PRIMER punto cae sobre el conector: el primer
// punto del polígono no sirve para eso, porque está corrido media anchura de
// cable sobre la normal.
export function lineaDelCable(conector, toma, cable, recorrido, apoyo = 0) {
  // EL CAMINO SE RECONSTRUYE DESDE LOS DOS EXTREMOS, y por eso mover cualquiera
  // de los dos mueve el cable entero sin tocar la tabla.
  //
  // `recorrido` trae [t, v] normalizados: `t` reparte la posición HORIZONTAL
  // entre los dos extremos y `v` es cuánto cae el cable por debajo de la recta,
  // EN VERTICAL, en unidades del largo del eje. Ver RECORRIDO_CABLE, que cuenta
  // cómo se sacaron de referencia-cable.png.
  //
  // EL MARCO ES UN CORTE Y NO UNA ROTACIÓN, y eso es lo que hace que el cable se
  // apoye. Estuvo escrito con `n` sobre la perpendicular al eje, que es el marco
  // obvio y conserva la forma exactamente. El problema es que también la ROTA:
  // en la referencia el eje está a 6,6° de la horizontal y no se nota, pero acá
  // el toma está en la pared y el eje sube 40,6°, así que la panza colgaba
  // girada 40° y el cable se arqueaba por el aire en vez de caer al piso.
  //
  // Un cable tirado en el suelo NO gira con sus extremos: la gravedad no rota.
  // Lo que se conserva al mover el toma es que la panza cae para abajo. Por eso
  // `v` se aplica en vertical y no sobre la normal.
  //
  // La `v` positiva es hacia ABAJO, con la y de pantalla creciendo para abajo. Si
  // alguien invierte el signo, el cable cuelga para arriba.
  const ejeX = toma.x - conector.x;
  const ejeY = toma.y - conector.y;
  const largo = largoDelEje(conector, toma);

  // ---- EL TERCER ANCLAJE: EL PISO ----
  //
  // Los dos extremos no alcanzan para ubicar este cable, y eso NO es un capricho
  // de escala: la referencia y la escena no son la misma foto.
  //
  // Medido. En la referencia el eje pecho->toma mide 849,6 px sobre una imagen
  // de 1100 de ancho: el 77%. En la escena mide 239 sobre 480: el 50%, y la
  // escena además es vertical. Todo lo que se derive del eje entra a la escena a
  // la mitad de tamaño relativo, así que la panza —que en la referencia es el
  // 30% del alto de la imagen y llega al piso— acá caía 60 px y se quedaba
  // colgada en el aire, apenas por debajo del pecho.
  //
  // No hay transformación de semejanza que arregle eso: dos encuadres distintos
  // con dos proporciones distintas no se corresponden punto a punto. Lo que sí
  // existe en las dos imágenes son TRES cosas y no dos: el enchufe del pecho, el
  // toma, y el piso. Un cable más largo que la distancia entre sus puntas no
  // cuelga: se apoya, y hasta dónde baja lo decide el suelo, no el largo del
  // cable.
  //
  // Así que `v` se escala para que la panza toque `apoyo`. Es un solo factor
  // para todo el canal vertical, o sea que la forma —la U ancha, el quiebre en
  // S, el arranque hacia atrás— se conserva entera; lo único que se fija es
  // cuánto baja. Y es el punto 6 del spec, que es explícito: "y apoya, va por
  // delante de las baldosas, no flotando sobre ellas".
  //
  // Sin `apoyo` el cable queda como lo dice la tabla cruda, que es lo que usan
  // las pruebas de forma: ahí lo que se mide es el camino, no dónde apoya.
  const yEnElEje = (t) => conector.y + t * ejeY;
  let escalaV = 1;
  if (apoyo > 0) {
    const panza = recorrido.reduce(
      (mejor, [t, v], i) =>
        yEnElEje(t) + v * largo > yEnElEje(recorrido[mejor][0]) + recorrido[mejor][1] * largo
          ? i
          : mejor,
      0
    );
    const caida = recorrido[panza][1] * largo;
    // Si el recorrido no baja —no debería, pero un cambio de tabla podría—, no
    // hay nada que estirar y el factor queda en 1 en vez de dividir por cero.
    if (caida > 0) escalaV = Math.max(0.1, (apoyo - yEnElEje(recorrido[panza][0])) / caida);
  }

  const linea = recorrido.map(([t, v]) => ({
    x: conector.x + t * ejeX,
    y: yEnElEje(t) + v * largo * escalaV
  }));

  // El paso viene en % del largo del recorrido, así que se resuelve acá: en una
  // escena angosta el cable es más corto y las muestras se juntan solas.
  cable = { ...cable, pasoMuestreo: (cable.pasoMuestreo / 100) * largo };

  // UNA PASADA DE REDONDEO Y NO DOS, y esto lo destapó un test.
  //
  // La ruta vieja se armaba con quiebres duros —puntos sueltos unidos por rectas—
  // y hacían falta dos pasadas de Chaikin para que el borde interno de cada codo
  // no se plegara. Esta ruta NO tiene quiebres duros: sale de trazar una curva
  // que ya era suave en la referencia, así que lo único que hace la segunda
  // pasada es comerse la forma.
  //
  // MEDIDO, y por eso está acá escrito: el retroceso del quiebre en S vale 0,0125
  // del eje en la tabla cruda. Con dos pasadas queda en 0,0019 — el 85% comido.
  // Con una queda en 0,0075, o sea que sobrevive el 60%.
  //
  // Y el quiebre en S es lo más importante de la forma: es lo que hace que se lea
  // como un cable que alguien dejó ahí y no como una curva trazada. Suavizarlo
  // hasta que desaparezca es dibujar exactamente lo que la referencia NO es.
  //
  // El radio mínimo se queda: es lo que evita que el borde interno se pliegue
  // justo ahí, donde el camino se dobla sobre sí mismo. Hace el mismo trabajo que
  // la segunda pasada hacía de más, pero sólo donde hace falta.
  const remuestreado = remuestrear(linea, cable.pasoMuestreo);
  const radio = (grosorDelCable(largo, cable) / 2) * cable.radioMinimoEnSemianchos;
  return remuestrear(respetarRadioMinimo(remuestreado, radio), cable.pasoMuestreo);
}

// UN CABLE NO PUEDE DOBLAR MÁS CERRADO QUE SU RADIO MÍNIMO, y eso es físico y no
// un ajuste: un cable de 13 px de grueso doblado en un radio de medio píxel no
// es un cable doblado, es un cable roto.
//
// Se relaja sólo donde el radio no llega, y con fuerza proporcional a cuánto le
// falta: los tramos que ya cumplen no se tocan, así el recorrido dibujado no se
// deforma para arreglar un codo. Es un laplaciano —cada muestra se corre hacia
// el promedio de sus dos vecinas— con los extremos clavados, porque el primero
// es la boca del conector y el último la de la caja.
//
// El tope de vueltas existe porque un codo muy cerrado puede no llegar nunca al
// radio pedido sin deformar el recorrido entero, y en ese caso es preferible un
// codo un poco más cerrado que un cable que se va de su camino. Lo que queda sin
// resolver lo absorbe el clampeo del ancho en cintaDelCable, que es el que
// GARANTIZA que la cinta no dé un salto.
function respetarRadioMinimo(linea, radioMinimo) {
  if (!radioMinimo || linea.length < 3) return linea;

  const p = linea.map((q) => ({ ...q }));

  for (let vuelta = 0; vuelta < 200; vuelta++) {
    const r = radiosDeLaLinea(p);
    if (Math.min(...r.slice(1, -1)) >= radioMinimo) break;

    const antes = p.map((q) => ({ ...q }));
    for (let i = 1; i < p.length - 1; i++) {
      if (r[i] >= radioMinimo) continue;
      const falta = 1 - r[i] / radioMinimo;
      const fuerza = 0.5 * falta;
      p[i].x = antes[i].x + fuerza * (antes[i - 1].x + antes[i + 1].x - 2 * antes[i].x);
      p[i].y = antes[i].y + fuerza * (antes[i - 1].y + antes[i + 1].y - 2 * antes[i].y);
    }
  }

  return p;
}

// El radio del arco que pasa por cada muestra y sus dos vecinas. Los extremos no
// tienen curvatura definida y devuelven Infinity, que es "recto".
function radiosDeLaLinea(linea) {
  return linea.map((p, i) => {
    if (i === 0 || i === linea.length - 1) return Infinity;
    const a = linea[i - 1];
    const b = linea[i + 1];
    const u1 = Math.atan2(p.y - a.y, p.x - a.x);
    const u2 = Math.atan2(b.y - p.y, b.x - p.x);
    let giro = Math.abs(u2 - u1);
    if (giro > Math.PI) giro = 2 * Math.PI - giro;
    if (giro < 1e-4) return Infinity;
    return Math.hypot(p.x - a.x, p.y - a.y) / (2 * Math.sin(giro / 2));
  });
}

export function cintaDelCable(
  conector,
  toma,
  cable,
  recorrido,
  cuantoAtras = 0,
  alturaDetras = 0,
  apoyo = 0
) {
  const n = (v) => Math.round(v * 100) / 100;
  const linea = lineaDelCable(conector, toma, cable, recorrido, apoyo);
  const largoEje = largoDelEje(conector, toma);
  // El paso en píxeles, que es lo que hace falta para contar muestras. En la
  // tabla viaja en % del eje, igual que el grosor y que el camino entero.
  const paso = (cable.pasoMuestreo / 100) * largoEje;

  const completo = linea.map((p, i) => `${i === 0 ? 'M' : 'L'} ${n(p.x)} ${n(p.y)}`).join(' ');

  const nor = normales(linea);

  // EL ANCHO SE LIMITA POR LA CURVATURA, y esto es lo que impide que la cinta se
  // pliegue sobre sí misma.
  //
  // El borde interno de un giro recorre menos que la línea media: si el radio de
  // ese giro es menor que el medio ancho de la cinta, el borde interno se cruza
  // y aparece un pico. Medido antes de esto: un salto de 13 px sobre un borde
  // cuyo paso es de 4.
  //
  // Se probaron dos arreglos que NO alcanzaron, y vale anotarlos: abrir el giro
  // del apoyo bajó el pico de 13,3 a 10,3, y una segunda pasada de redondeo lo
  // dejó en 10,28. Ninguno de los dos podía alcanzar, porque el pliegue no
  // estaba en un quiebre sino en la curvatura de la propia catenaria, que ya
  // venía suave y por lo tanto el redondeo no tenía nada que cortarle.
  //
  // Lo que sí funciona es el límite físico: un cable no puede doblar más cerrado
  // que su propio radio. Donde la curva se cierra, la cinta se afina; y como el
  // afinado es proporcional al radio, no se nota — el ojo lee un cable que se
  // aplasta un poco en la curva, que es lo que hace un cable.
  //
  // EL FACTOR NO ES 0,92, Y ESO ERA LO QUE DEJABA EL CORTE. Con 0,92 el borde
  // EXTERNO de un giro recorre 1,92 veces lo que recorre la línea media, o sea
  // hasta 7,7 px con un paso de 4 — medido en producción: 7,08 px en el codo del
  // apoyo. El borde externo de un arco de radio R con semiancho s avanza
  // (R+s)/R por cada paso de la línea media, así que para que ese avance no pase
  // de `saltoMaximo` hace falta s <= (saltoMaximo/paso - 1) * R.
  //
  // El factor sale de esa cuenta y no de una constante puesta a mano: si alguien
  // cambia el paso o el tope, el clampeo se acomoda solo y el test sigue siendo
  // el mismo número.
  // Y hay un SEGUNDO término, que es el que dejaba el salto en 5,13 cuando la
  // cuenta prometía 5,00: entre dos muestras el borde no sólo avanza por la
  // curva, también se corre hacia afuera lo que haya cambiado el ancho. Los dos
  // son perpendiculares —uno es tangente y el otro normal— así que se suman en
  // cuadratura, y el presupuesto del salto se reparte entre los dos.
  //
  // El ancho, entonces, tampoco puede cambiar más rápido que `afinadoMaximo` por
  // píxel de recorrido. Que además es cierto de un cable: no se afina a
  // escalones.
  // SEMIANCHO CONSTANTE, y con eso se fueron dos controles enteros.
  //
  // El clampeo del ancho contra la curvatura y el tope de afinado existían para
  // que una cinta que CAMBIA de ancho no diera saltos en el borde: entre dos
  // muestras el borde se corre por la curva y además por lo que haya cambiado el
  // ancho, y los dos términos se sumaban en cuadratura. Una cinta de ancho fijo
  // no tiene el segundo término y no puede dar ese salto.
  //
  // Lo que sigue haciendo falta es el RADIO MÍNIMO, que ya se aplicó sobre la
  // línea media: el borde interno de un giro se pliega si el radio baja del
  // semiancho, y el quiebre en S es justo donde el camino se dobla sobre sí
  // mismo. Eso se resuelve en el camino, no en el ancho.
  const semiancho = grosorDelCable(largoEje, cable) / 2;

  const unLado = linea.map((p, i) => ({ x: p.x + nor[i].x * semiancho, y: p.y + nor[i].y * semiancho }));
  const elOtro = linea.map((p, i) => ({ x: p.x - nor[i].x * semiancho, y: p.y - nor[i].y * semiancho }));

  // El polígono de un tramo de la línea, de `desde` a `hasta` inclusive.
  const cinta = (desde, hasta) =>
    unLado
      .slice(desde, hasta + 1)
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${n(p.x)} ${n(p.y)}`)
      .join(' ') +
    ' ' +
    elOtro
      .slice(desde, hasta + 1)
      .reverse()
      .map((p) => `L ${n(p.x)} ${n(p.y)}`)
      .join(' ') +
    ' Z';

  // EL CABLE SE PARTE EN DOS, y no por gusto: el primer tramo se dibuja DETRÁS
  // del sprite de Chip y el resto adelante. Un cable que termina contra el borde
  // del conector se ve apoyado; uno que desaparece adentro se ve enchufado, y la
  // única forma de que desaparezca adentro es que el sprite lo tape.
  //
  // El corte lleva una muestra de solape para que no quede costura entre las dos
  // piezas.
  const corte = Math.max(1, Math.min(linea.length - 2, Math.round(cuantoAtras / paso)));

  // Y SE PARTE UNA SEGUNDA VEZ, donde el cable se aleja más que Chip.
  //
  // Mientras corre por delante de sus orugas está más cerca que él y va en la
  // capa de adelante. En cuanto sube por encima de su línea de apoyo está en el
  // piso pero más lejos, y ahí tiene que pasarle por detrás: si no, le cruza el
  // cuerpo con una franja gris.
  //
  // El corte es la primera muestra que queda por encima de esa línea DESPUÉS DE
  // TOCAR EL PISO, y ese "después" no es un detalle: el cable arranca en el
  // pecho, que en pantalla está bien arriba de la línea de apoyo y sin embargo
  // es lo más CERCANO de todo el recorrido. Alto en el cuadro sólo quiere decir
  // lejos si estás en el piso.
  //
  // Y "TOCAR EL PISO" ES LITERAL: la muestra tiene que haber BAJADO de la línea
  // de apoyo, no ser la más baja del recorrido. Acá estaba el defecto y era
  // grande. Se buscaba la panza —el mínimo, que existe siempre— y de ahí en
  // adelante la primera muestra por encima de la línea. Con un recorrido que
  // nunca llega al piso eso da la muestra siguiente a la panza, así que el 97%
  // del cable se iba a la capa de atrás.
  //
  // Medido en producción antes del arreglo: la caja del cuerpo de adelante era
  // de 26x13 px sobre una escena de 480x944. Y como los dos filos del tubo se
  // emiten sólo en el tramo de adelante, el sombreado entero vivía en ese
  // pedacito: el cable se veía como un pelo plano. Un defecto de capas que se
  // manifestaba como un defecto de color.
  //
  // Si el recorrido nunca baja de la línea, no hay nada detrás de Chip y el
  // cable queda entero adelante — que es exactamente el caso de esta escena,
  // con el toma en la pared y el recorrido cruzando en diagonal sin pasarle por
  // atrás.
  const toco = alturaDetras > 0 ? linea.findIndex((p) => p.y >= alturaDetras) : -1;
  const detras = toco >= 0 ? linea.findIndex((p, i) => i > toco && p.y < alturaDetras) : -1;
  const fondo = detras > corte ? detras : linea.length - 1;

  // ES UN TUBO: FILO CLARO ARRIBA, OSCURO ABAJO.
  //
  // Un trazo de un solo color se ve plano por más grueso que sea. Lo que hace
  // que se lea redondo son dos aristas: donde le pega la luz y donde no. La luz
  // de esta escena entra por la ventana, arriba a la izquierda, así que el filo
  // claro va arriba y la panza oscura abajo.
  //
  // Antes había UN solo lomo, y encima se cortaba donde el cable se volvía fino
  // —con la perspectiva vieja, en el último tercio el brillo habría medido más
  // que el caño que iluminaba—. Con el grosor constante ese corte no tiene
  // sentido: los dos filos corren todo el tramo visible.
  //
  // Van adentro del cuerpo del cable y no encima de su borde: a `filo` del
  // semiancho desde el centro, o sea sin tocar la silueta. Un filo apoyado en el
  // borde se lee como un contorno, no como luz.
  // EL LADO ILUMINADO SE DECIDE CONTRA LA LUZ, y no contra la pantalla. Acá
  // había un defecto que se veía a simple vista al 300%.
  //
  // Estaba escrito `const arriba = nor[j].y < 0 ? 1 : -1`, o sea "el filo claro
  // es el que queda más arriba en el cuadro". La normal se da vuelta sola según
  // hacia dónde gire la curva, y ese criterio la reordena — hasta ahí bien. El
  // problema es DÓNDE cambia de signo: `nor.y == 0` pasa cuando el cable está
  // VERTICAL, y este cable tiene dos tramos verticales largos, la caída del
  // pecho y la subida al toma. Ahí el filo claro saltaba de un borde al otro en
  // una muestra y quedaba un escalón en el medio de cada tramo recto.
  //
  // Y es justo el peor lugar posible: un caño vertical iluminado desde la
  // izquierda es donde MÁS marcado está el filo, así que el salto pasaba con el
  // contraste al máximo.
  //
  // Con la dirección de la luz, el cambio de lado cae donde el cable corre
  // PARALELO a la luz —los hombros de la U—, que es exactamente donde los dos
  // bordes reciben lo mismo y el salto no tiene contraste que mostrar. El salto
  // no se puede eliminar con dos trazos de color fijo; lo que se puede es
  // mandarlo donde no se ve.
  const luz = cable.luz;
  const desplazado = (desde, hasta, lado) =>
    linea
      .slice(desde, hasta + 1)
      .map((p, i) => {
        const j = i + desde;
        const aLaLuz = nor[j].x * luz.x + nor[j].y * luz.y > 0 ? 1 : -1;
        const d = semiancho * (1 - cable.filo) * lado * aLaLuz;
        return `${i === 0 ? 'M' : 'L'} ${n(p.x + nor[j].x * d)} ${n(p.y + nor[j].y * d)}`;
      })
      .join(' ');

  const grosorFilo = Math.max(0.9, semiancho * 2 * cable.filo);

  // LOS FILOS VAN EN LAS DOS CAPAS, con el mismo corte que el cuerpo.
  //
  // Estuvieron sólo en la de adelante y era un error que se veía: el tramo que
  // sube por la pared al toma queda del lado lejano de la línea de apoyo, o sea
  // en la capa de atrás, y ahí el cable perdía el sombreado. Medido en la escena
  // de 480x944: 228 px de los 288 de recorrido dibujado —el 79%— salían planos.
  //
  // Que esté lejos no es motivo para que deje de ser un tubo. Lo que la capa de
  // atrás resuelve es la OCLUSIÓN —quién tapa a quién— y no el sombreado; son
  // dos preguntas distintas y estaban contestadas con la misma respuesta.
  const partido = (lado) =>
    fondo < linea.length - 1
      ? `${desplazado(0, corte, lado)} ${desplazado(fondo, linea.length - 1, lado)}`
      : desplazado(0, corte, lado);

  // Las dos capas llevan DOS tramos cada una y no uno: la de atrás es la punta
  // que entra al puerto más todo lo que queda más lejos que Chip, y la de
  // adelante es la panza que cuelga por delante de él. Se emiten como dos
  // subpaths del mismo path —cada uno con su M— porque son la misma pieza con el
  // mismo relleno, y partirlos en dos nodos duplicaría el pintado.
  const atras =
    fondo < linea.length - 1
      ? `${cinta(0, corte + 1)} ${cinta(fondo, linea.length - 1)}`
      : cinta(0, corte + 1);

  return {
    completo,
    atras,
    adelante: cinta(corte, fondo + (fondo < linea.length - 1 ? 1 : 0)),
    filoArriba: desplazado(corte, fondo, 1),
    filoAbajo: desplazado(corte, fondo, -1),
    filoArribaAtras: partido(1),
    filoAbajoAtras: partido(-1),
    grosorFilo,
    // El grosor en píxeles sale de acá y no se vuelve a calcular afuera: la
    // ficha tiene que medirse contra el cable que se acaba de dibujar, y dos
    // cuentas separadas del mismo número son dos cuentas que se pueden separar.
    grosor: semiancho * 2,
    linea
  };
}

// LA FICHA, que es lo que hace que la unión se lea.
//
// El cable no termina CONTRA el conector: entra. Y "entra" no se dibuja
// alargando el cable, se dibuja tapándole la punta con la pieza que va encima —
// igual que en la realidad, donde lo que ves es la ficha y no el extremo del
// cable.
//
// Tres piezas, y el ORDEN de pintado es el efecto:
//
//   1. la sombra, difusa y debajo de todo: el oscurecimiento alrededor de donde
//      entra. Sin ella la ficha flota sobre el pecho.
//   2. el cable, que llega hasta ADENTRO del puerto.
//   3. la ficha, encima, tapando el extremo.
//
// La primera versión dibujaba un óvalo negro sólido en vez de una ficha. A
// tamaño real eso no se lee como un conector: se lee como un agujero en el
// pecho de Chip.
// EL GROSOR ENTRA COMO PÍXELES YA RESUELTOS y no como el ancho de la escena, y
// esto tapaba un error mudo: la firma decía `(conector, direccion, cable)` y
// adentro llamaba a `grosorDelCable(0, cable)`, o sea grosor CERO. ui.js le
// pasaba un cuarto argumento que la función ni miraba, así que no hubo error en
// consola: salía una ficha de 0 px de ancho, invisible, y la unión volvía a ser
// una punta de cable apoyada en el pecho.
export function fichaDelPuerto(conector, direccion, grosor) {
  const g = grosor;
  const largo = Math.hypot(direccion.x, direccion.y) || 1;
  const ux = direccion.x / largo;
  const uy = direccion.y / largo;

  return {
    // Hasta dónde llega la punta del cable: bien adentro, para que la ficha la
    // tape entera aunque el balanceo la mueva un pixel.
    punta: { x: conector.x + ux * g * 0.9, y: conector.y + uy * g * 0.9 },
    // La ficha: un poco más ancha que el cable y más corta que ancha, que es la
    // proporción de una ficha de alimentación vista de costado.
    ancho: g * 1.34,
    largoFicha: g * 1.05,
    radio: g * 0.22,
    // Y el ángulo, para que la ficha acompañe la dirección de entrada.
    giro: (Math.atan2(uy, ux) * 180) / Math.PI
  };
}


// EL RECORRIDO DEL REFLEJO sobre un aro. Función pura: recibe el aro medido y
// devuelve la elipse por la que corre la luz.
//
// NO agrega ninguna pieza al arte, y esa es la diferencia con la primera
// versión —una chaveta dibujada que rotaba—. Los aros YA tienen un reflejo
// especular pintado; lo que se anima es DÓNDE ESTÁ ESA LUZ. Un metal que gira
// no cambia de forma, cambia dónde le pega el brillo. Misma lógica que el bulbo
// de la antena: no se toca el dibujo, se mueve la luz.
//
// Se traza apenas ADENTRO del aro pintado —al 82% de sus radios— porque el
// reflejo vive en el filo interno del metal. Encima de la línea taparía el
// dibujo; adentro, lo enciende.
//
// pathLength="100" normaliza el perímetro: así el largo del arco de luz y su
// avance se escriben en PORCENTAJE del recorrido. Sin eso habría que calcular el
// perímetro de una elipse —que no tiene fórmula cerrada— y rehacerlo cada vez
// que un aro cambia de tamaño.
export function reflejoDeAro(aro) {
  const n = (v) => Math.round(v * 100) / 100;
  const rx = aro.rx * 0.82;
  const ry = aro.ry * 0.82;

  // Arranca en la IZQUIERDA del aro. La luz del galpón entra por la ventana,
  // que está a la izquierda: con el recorrido empezando ahí, el reflejo en
  // reposo queda donde la luz lo pondría.
  return (
    `<path class="reflejo" pathLength="100" ` +
    `d="M ${n(aro.x - rx)} ${n(aro.y)} ` +
    `a ${n(rx)} ${n(ry)} 0 1 1 ${n(rx * 2)} 0 ` +
    `a ${n(rx)} ${n(ry)} 0 1 1 ${n(-rx * 2)} 0"/>`
  );
}

export function tieneForma(id) {
  return id in FORMAS;
}

// EL ARCO DEL VUELO al estante, y por qué no alcanza con levantar el punto de
// control.
//
// Una Bézier cuadrática NO PASA POR SU PUNTO DE CONTROL: se le acerca como mucho
// hasta la mitad. La primera versión ponía el control a 11% del alto de la escena
// por encima del estante y el arco resultante subía 1,9% —medido, no estimado—,
// así que el vuelo se leía como una diagonal y no como que alguien levantó una
// cosa y la apoyó.
//
// Así que en vez de elegir el control y ver qué sale, se pide el VÉRTICE y se
// despeja el control. Con A = y de salida, C = y de llegada, B = y del control:
//
//   y(t) = (1-t)^2*A + 2t(1-t)*B + t^2*C
//   el vértice cae en t* = (A-B)/(A-2B+C)  y ahí vale  A - (A-B)^2/(A-2B+C)
//
// Igualando eso al pico pedido, y llamando u = A-B y k = A-pico:
//
//   u^2 - 2ku + k(A-C) = 0   =>   u = k ± raiz(k*(k-A+C))
//
// Se toma la raíz POSITIVA y no la otra: la negativa da un t* mayor que 1, o sea
// un vértice que cae fuera de la curva, que es exactamente el arco falso del que
// venimos. Y k-A+C es la altura pedida, siempre positiva, así que el radicando
// nunca es negativo y no hace falta un caso degenerado.
function controlDelVuelo(desde, hasta, altura) {
  const pico = Math.min(desde.y, hasta.y) - altura;
  const k = desde.y - pico;
  const u = k + Math.sqrt(Math.max(0, k * (k - desde.y + hasta.y)));

  return { x: (desde.x + hasta.x) / 2, y: desde.y - u, u };
}

export function caminoDeVuelo(desde, hasta, altura) {
  const c = controlDelVuelo(desde, hasta, altura);
  const n = (v) => v.toFixed(1);

  return (
    'M ' + n(desde.x) + ' ' + n(desde.y) +
    ' Q ' + n(c.x) + ' ' + n(c.y) +
    ' ' + n(hasta.x) + ' ' + n(hasta.y)
  );
}

// Dónde termina picando ese camino. Se exporta para que la altura del arco se
// pueda verificar en Node y no haga falta un navegador para saber si el vuelo
// sube lo que dice que sube.
export function picoDelVuelo(desde, hasta, altura) {
  const c = controlDelVuelo(desde, hasta, altura);
  const den = desde.y - 2 * c.y + hasta.y;

  return { t: c.u / den, y: desde.y - (c.u * c.u) / den };
}
