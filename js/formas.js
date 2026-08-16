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
const REPISA = `
  <defs>
    <linearGradient id="repisa-caida" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="var(--repisa-sombra)" stop-opacity="0.72"/>
      <stop offset="100%" stop-color="var(--repisa-sombra)" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <!-- la sombra que la tabla tira sobre la pared: va primero, debajo de todo -->
  <rect x="3" y="11" width="94" height="6" fill="url(#repisa-caida)"/>
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
export function svgDeRepisa() {
  return `<svg viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true">${REPISA}</svg>`;
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
export function caminoDelCable(conector, r) {
  const n = (v) => Math.round(v * 100) / 100;
  const P = (p) => `${n(p.x)} ${n(p.y)}`;

  // La caída: catenaria asimétrica, con la panza corrida hacia el extremo bajo.
  const apoyo = r.apoyo;
  const largo = Math.hypot(apoyo.x - conector.x, apoyo.y - conector.y);
  const cuelga = largo * apoyo.caida;
  const c1 = { x: conector.x + (apoyo.x - conector.x) * 0.24, y: conector.y + cuelga * 0.72 };
  const c2 = { x: conector.x + (apoyo.x - conector.x) * 0.7, y: apoyo.y + cuelga * 0.3 };

  const caida = `M ${P(conector)} C ${P(c1)}, ${P(c2)}, ${P(apoyo)}`;

  const tramos = [{ d: caida, z: 0 }];
  let previo = apoyo;

  for (const q of [...r.quiebres, r.llegada]) {
    tramos.push({ d: `M ${P(previo)} L ${P(q)}`, z: q.z });
    previo = q;
  }

  // Y el camino completo, de una sola pieza, para que los pulsos lo recorran.
  const completo =
    caida + [...r.quiebres, r.llegada].map((q) => ` L ${P(q)}`).join('');

  return { completo, tramos };
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
