// Único lugar donde viven los números del juego.
// Ningún otro módulo define constantes numéricas: todo se importa desde acá.

// ---- Persistencia ----

// La key NO se sube de versión: cambiarla borraría todas las partidas en
// silencio. Para eso está el campo `version` del estado, que estado.js usa para
// migrar en el lugar.
export const SAVE_KEY = 'chip.save.v1';

// v2 agregó ultimoEventoId. v3 lo reemplazó por ultimosEventosIds: si en una
// visita se mostraron dos eventos, ninguno de los dos puede repetirse en la
// siguiente, no sólo el último. v4 agregó `coleccion` y `ultimoDiaConEvento`,
// los dos campos nuevos del sistema de hallazgos. v5 agregó los del arco de los
// gigantes: `diasDePresencia`, `ultimoDiaVisitado` y `hitosVistos`. v6 agregó
// `ultimaFranja`: qué momento del día se vio la última vez, para poder hacer el
// fade de apertura cuando cambió mientras no estabas. v7 agregó `ajustes`, que
// hoy tiene uno solo: movimientoReducido.
export const VERSION_ESTADO = 7;

// ---- Estado inicial ----

export const NOMBRE_INICIAL = 'Chip';
export const STAT_INICIAL = 100;

// ---- Tiempo ----

export const MS_POR_HORA = 3_600_000;

// ---- Stats ----

export const STAT_MIN = 0;
export const STAT_MAX = 100;

// ---- Decay ----

export const DECAY_POR_HORA = {
  bateria: 5,
  humor: 3.3,
  mantenimiento: 1.7
};

// Hasta dónde puede bajar un stat por paso del tiempo. No es dónde tiene que
// estar el valor: un stat que ya venía por debajo se queda donde está, porque
// el decay nunca aumenta nada. Ver aplicarPiso en decay.js.
export const DECAY_FLOOR = 10;

// Cap offline: por más días que pasen, se cobran como máximo estas horas.
export const MAX_DECAY_HOURS = 24;

// ---- Acciones ----

export const JUGAR_BATERIA_MINIMA = 15;

export const VALORES_ACCION = {
  // `cargar` YA NO ESTÁ ACÁ, y no es un olvido: cargar dejó de ser un salto de
  // valor y pasó a ser un proceso que dura lo que lo sostengas. Ver
  // CARGA_RETENIDA más abajo. Un número acá sería la mitad de la mecánica vieja
  // esperando a que alguien lo vuelva a usar.
  jugar: { humor: 30, bateria: -10 },
  limpiar: { mantenimiento: 50 }
};

// ---- CARGAR ES UNA RETENCIÓN, no un botón ----
//
// Antes: un tap llevaba la batería de 10 a 90 DE GOLPE —medido— y después había
// siete segundos de animación mirando algo que ya había pasado. El gesto y el
// efecto estaban separados, y por eso la animación se sentía de relleno.
//
// Ahora se mantiene apretado y Chip carga mientras lo hagas. Soltás y para,
// conservando lo cargado. Eso es lo que hace que el gesto TENGA sentido: estás
// viendo el efecto de lo que estás haciendo, no el recuerdo de lo que hiciste.
//
// Y por eso la pantalla del pecho sube en vivo: es el mismo estado pintándose en
// cada tick, no una animación aparte que haya que sincronizar.
//
// `segundos` es cuánto tarda de 0 a 100 sosteniendo sin soltar. Seis y medio: en
// menos, el gesto no llega a leerse como un proceso y vuelve a ser un botón con
// pasos; en más, cargar del todo se vuelve tedioso y la gente suelta antes.
//
// `tick` es cada cuánto se suma. 90 ms es más rápido que lo que el ojo separa en
// una barra que crece, así que se ve continuo, y es más lento que un cuadro: no
// tiene sentido tocar el estado sesenta veces por segundo para mover una barra
// de seis segmentos.
//
// NO HAY COSTO NI PENALIDAD por soltar antes, y eso es el modelo sin culpa: lo
// cargado queda cargado. Soltar no es abandonar, es haber cargado un poco.
export const CARGA_RETENIDA = {
  segundos: 6.5,
  tick: 90
};

// ---- Estados visuales ----

// Los nombres son la moneda común entre sprites.js (los resuelve), main.js (los
// pasa) y ui.js (los pinta). Se declaran acá para que no haya strings sueltos.
export const ESTADOS_VISUALES = {
  critico: 'critico',
  standby: 'standby',
  cargando: 'cargando',
  jugando: 'jugando',
  limpiando: 'limpiando',
  esperando: 'esperando',
  feliz: 'feliz',
  idle: 'idle'
};

// Carpeta en minúscula a propósito: Windows no distingue mayúsculas, un hosting
// Linux sí.
//
// Son SIETE archivos ideales, no cinco. Seis son necesarios; `limpiando.png` es
// opcional: si falta, el loader cae al sprite de idle y el juego sigue andando
// (ver ESTADO_POR_DEFECTO en sprites.js). Se declara igual para que exista un
// solo lugar donde está escrito el contrato de arte.
export const RUTAS_SPRITES = {
  critico: 'sprites/critico.webp',
  standby: 'sprites/standby.webp',
  cargando: 'sprites/cargando.webp',
  jugando: 'sprites/jugando.webp',
  limpiando: 'sprites/limpiando.webp',
  esperando: 'sprites/esperando.webp',
  feliz: 'sprites/feliz.webp',
  idle: 'sprites/idle.webp',
  // No es un estado: es la pose alternativa de idle. Vive acá igual porque el
  // loader la carga por la misma puerta y con el mismo fallback.
  'idle-manitos': 'sprites/idle-manitos.webp'
};

// Las poses de idle. Chip quieto en una sola pose durante minutos se lee como
// un sticker; con dos, cada tanto se acomoda distinto y sigue estando quieto.
//
// Son CLAVES DE SPRITE, no estados. La diferencia importa: el estado decide los
// efectos, la clase del CSS y la cadena; la pose sólo decide qué PNG se dibuja,
// dónde cae la antena y dónde la pantalla del pecho. Meter la pose en la cadena
// obligaría a inventarle una condición que no tiene.
// SUSPENDIDA: idle-manitos está afuera hasta que exista su recorte de ojos.
//
// El parpadeo es una capa aparte que sale de RUTAS_OJOS, y ahí sólo hay recortes
// para idle y feliz. Con idle-manitos elegida, la capa ni se carga: Chip pasaba
// la sesión ENTERA sin parpadear. Y como la pose se sortea al abrir, era media
// sesión al azar con la cara quieta y media normal — una inconsistencia que el
// jugador no se puede explicar, que hace más daño que la falta de variedad.
//
// La entrada de RUTAS_SPRITES, la de POSICIONES_ANTENA, la de PANTALLAS_PECHO,
// la de RECUADROS_RAYO y la de APOYO_ORUGAS se quedan todas donde están: están
// medidas y siguen siendo correctas. Volver a habilitarla es agregar
// 'idle-manitos-ojos.webp' a RUTAS_OJOS y devolverla a esta lista. Nada más.
export const POSES_IDLE = ['idle'];

// La pose se sortea UNA VEZ POR SESIÓN y no cambia mientras la app está
// abierta. La primera versión rotaba cada minuto con una moneda, y estaba mal:
// Chip cambiando de postura solo, cada tanto, mientras lo mirás, se lee como un
// glitch — no como que se acomodó. Sorteada al abrir, la pose es simplemente
// cómo está hoy, y la variación se nota entre visitas, que es donde tiene que
// notarse.

// ---- La inclinación de cabeza ----
//
// Cada tanto Chip ladea la cabeza, como si algo le llamara la atención. Es el
// único gesto del juego que no responde a nada: no lo dispara un stat ni una
// acción, pasa solo. Eso es justamente lo que lo hace leer como que hay alguien
// adentro.
//
// EL ALCANCE ES CHICO A PROPÓSITO. Girar la cabeza descubriría cuello y hombro,
// que no están dibujados. Inclinarla dos o tres grados sobre la base del casco
// no descubre nada — verificado componiendo el recorte girado SOBRE el sprite
// entero, que es el caso real: a 3 grados no asoma la cabeza pintada de abajo,
// y aguanta hasta 6. El solape del recorte sobre el torso es lo que lo permite.
export const RUTAS_CABEZA = {
  idle: 'sprites/idle-cabeza.webp',
  feliz: 'sprites/feliz-cabeza.webp'
};

// EL CUERPO SIN CABEZA NI BRAZOS, y esto es lo que destraba los dos gestos.
//
// El problema era el mismo para los dos: la capa que rota va ENCIMA del sprite
// entero, que sigue teniendo la parte dibujada, así que en el borde queda a la
// vista la de abajo, corrida. Medido, a los ángulos que las specs pedían: la
// cabeza a 3° destapaba el 3,5% de su capa, y los brazos a 12° hasta el 31%.
//
// Enmascarar la región del sprite base no servía —cambia un fleco del color de
// la pieza por un hueco transparente del mismo tamaño, que es peor— así que la
// salida era arte: un cuerpo al que ya le falten las dos cosas, para que las
// capas que rotan sean las únicas que las dibujan.
//
// Cuando una pose tiene entrada acá, el canvas dibuja ESTE sprite en lugar del
// completo. Sin entrada dibuja el de siempre, así que una pose sin capas no se
// entera de que esto existe.
export const RUTAS_CUERPO = {
  idle: 'sprites/idle-cuerpo.webp',
  feliz: 'sprites/feliz-cuerpo.webp'
};

// EL PIVOTE SE MUEVE CON LA POSE, igual que el de los brazos: en `feliz` la
// cabeza está corrida a la derecha y el cuello no cae donde el de `idle`.
//
// El punto es la base del casco: en las dos poses el recorte se angosta hasta
// y=137 y se vuelve a ensanchar en y=140, que es donde arranca el hombro. Esa
// cintura es el cuello, y y=140 sobre 256 —el 54,7%— es la misma en las dos.
// Lo que cambia es x: el centro de las filas 140 a 145 da 125,8 en idle y 132,8
// en feliz, siete píxeles de corrimiento.
//
// idle conserva su 50% exacto, que es el que ya estaba verificado; feliz lleva
// el mismo desplazamiento medido sobre esa referencia: 135 sobre 256.
export const PIVOTES_CABEZA = {
  idle: { x: 50, y: 54.7 },
  feliz: { x: 52.7, y: 54.7 }
};

// ---- LOS BRAZOS ----
//
// Son lo único de Chip que nunca se movía. Después de los ojos son la parte que
// más cambia la lectura: de "sprite con efectos encima" a "algo que está ahí".
//
// UN GRUPO POR BRAZO y no uno compartido: los dos tienen que poder moverse por
// separado, y de hecho casi todos los gestos son asimétricos. Cada uno con su
// propio pivote en el hombro, igual que #cabeza-grupo con la base del casco.
//
// Los pivotes vienen medidos sobre el lienzo de 256 y se guardan en % para que
// no dependan del tamaño en pantalla.
export const BRAZOS = {
  idle: {
    izq: { x: 66.4, y: 56.6 }, // (170, 145)
    der: { x: 30.5, y: 57.4 } // (78, 147)
  },
  feliz: {
    izq: { x: 63.7, y: 67.2 }, // (163, 172)
    der: { x: 31.3, y: 63.7 } // (80, 163)
  }
};

// EL ÁNGULO ESTÁ EN 2° Y LA SPEC PEDÍA 3 A 5, y la diferencia es una deuda de
// arte, no una decisión de gusto.
//
// El recorte del brazo rota ENCIMA del sprite entero, que sigue teniendo el
// brazo dibujado, así que en el borde queda a la vista el de abajo corrido unos
// píxeles — el mismo problema que la cabeza, y peor, porque el brazo es chico
// respecto de su palanca. Medido sobre los cuatro recortes:
//
//    3°  ->  8-9% del brazo destapado,   3,8 px de lienzo  ( 6,1 en pantalla)
//    6°  -> 16-18%,                      7,5 px            (12,2)
//   12°  -> 27-31%,                     15,0 px            (24,3)
//   14°  -> 29-35%,                     19,4 px            (31,4)
//
// A 12° eso es un brazo con un fantasma al lado, no un brazo que se mueve. La
// verificación que ya estaba hecha —"aguanta hasta 12° sin descubrir hueco"— es
// de OTRA falla: mira el hueco en la articulación del hombro, que efectivamente
// aguanta. El fleco del sprite de abajo es una falla distinta.
//
// A 2° el corrimiento es de 2,5 px de lienzo (4,1 en pantalla), que entra en el
// grosor del propio contorno del dibujo.
//
// El arreglo limpio es el MISMO que el de la cabeza y con un solo archivo por
// pose se resuelven los dos: un cuerpo sin cabeza y sin brazos —`idle-cuerpo`,
// `feliz-cuerpo`— para que las capas que rotan sean las únicas que los dibujan.
// Con eso este número sube a 5 y el de la cabeza a 3 sin tocar nada más.
export const ANGULO_BRAZO = 5;

// Y EL TECHO PARA UNA POSE QUE TODAVÍA NO TIENE SU CUERPO RECORTADO.
//
// `feliz` tiene brazos pero no tiene `feliz-cuerpo`, así que ahí la capa sigue
// rotando encima del sprite entero y vuelve el fleco. En vez de bajar el ángulo
// para todos —que castigaría a `idle`, que sí tiene su cuerpo— el ángulo se
// elige POR POSE: la que tiene cuerpo usa el grande, la que no, este.
//
// El día que exista `feliz-cuerpo.webp`, la pose pasa sola al ángulo grande sin
// que haya que tocar una línea. Es la misma idea que el fallback de los sprites:
// que la ausencia de un archivo degrade el gesto, no que lo rompa.
export const ANGULO_BRAZO_SIN_CUERPO = 2;

// Acomodarse en reposo: cada tanto un brazo rota y vuelve. Los dos brazos van
// por separado y con rangos anchos, por lo mismo que la inclinación de cabeza:
// un gesto con período fijo deja de ser un gesto y pasa a ser un reloj. Y si los
// dos coincidieran se vería coreografiado.
export const ACOMODO_BRAZO = { min: 25000, max: 45000, duracion: 1200 };

// En `feliz` uno de los dos sube. Ahora que feliz dura pocos segundos, el brazo
// puede acompañar el estado entero.
//
// LA SPEC PEDÍA 10-12° Y ESTÁ EN 3, por el mismo motivo que ANGULO_BRAZO: es el
// sprite de abajo el que limita, no el gesto. A 10° el brazo de `feliz` deja a
// la vista casi una cuarta parte del que está pintado, corrido unos 19 px en
// pantalla — un brazo con un fantasma al lado.
//
// Es el mismo techo y se levanta con el mismo archivo: un cuerpo sin brazos.
export const SALUDO_BRAZO = { angulo: 6, entra: 420, vuelve: 820 };

// Durante la caricia, el brazo del lado hacia donde va el dedo se levanta
// apenas, como acercándose.
export const BRAZO_CARICIA = 5;

export const CLASE_ACOMODANDO_BRAZO = 'acomodando';
export const CLASE_SALUDANDO = 'saludando';
export const CLASE_BAJANDO_BRAZO = 'bajando';

export const VARS_BRAZOS = {
  pivoteIzqX: '--brazo-izq-x',
  pivoteIzqY: '--brazo-izq-y',
  pivoteDerX: '--brazo-der-x',
  pivoteDerY: '--brazo-der-y',
  angulo: '--brazo-angulo',
  acomodo: '--brazo-acomodo',
  saludo: '--brazo-saludo',
  saludoEntra: '--brazo-saludo-entra',
  saludoVuelve: '--brazo-saludo-vuelve',
  caricia: '--brazo-caricia',
  lado: '--brazo-lado'
};

// Los recortes por pose. Mismo criterio que RUTAS_OJOS: una pose sin entrada
// simplemente no tiene brazos que mover, y el sprite base los dibuja como
// siempre. En `critico` NO hay, y eso es deliberado — la quietud es información.
export const RUTAS_BRAZOS = {
  idle: { izq: 'sprites/idle-brazo-izq.webp', der: 'sprites/idle-brazo-der.webp' },
  feliz: { izq: 'sprites/feliz-brazo-izq.webp', der: 'sprites/feliz-brazo-der.webp' }
};

// Tres tiempos, y el del medio es el que cuenta la historia: ladea, SE QUEDA
// mirando, y vuelve. Sin la pausa el gesto se lee como un tic.
//
// Vuelve más lento de lo que va: la curiosidad es rápida y el desinterés es
// lento. Es la misma asimetría del salto y de la respiración.
// EL ÁNGULO BAJÓ DE 3° A 1,2°, y no por gusto: a 3° asoma el sprite de abajo.
//
// La capa de cabeza se rota ENCIMA del sprite entero, así que en el borde
// exterior queda a la vista la cabeza que el sprite base sigue teniendo
// dibujada, corrida unos píxeles. Medido: a 3° quedan 505 px destapados, el
// 3,51% de la capa, y el corrimiento en el punto más alto es de 6,8 px de lienzo
// —11,1 en pantalla, porque el lienzo se muestra a 1,62x—. Eso es el doble
// contorno que se ve en el teléfono.
//
// Enmascarar la cabeza del sprite base mientras dura la inclinación NO lo
// arregla: cambia un fleco del color de la cabeza por un hueco TRANSPARENTE del
// mismo tamaño, que deja ver el galpón a través de Chip. Peor.
//
// El arreglo limpio necesita ARTE: un `idle-sin-cabeza.webp`, el cuerpo sin la
// región de la cabeza, para que la capa rotada sea la única que la dibuja. Con
// eso el ángulo puede volver a 3 y a más.
//
// Mientras tanto, 1,2° deja el corrimiento en 2,7 px de lienzo (4,4 en
// pantalla), que entra dentro del grosor del propio contorno del dibujo.
export const INCLINACION_CABEZA = {
  angulo: 3,
  entra: 620,
  sostiene: 1500,
  vuelve: 880
};

// Cada cuánto. Rango ancho a propósito: un gesto que aparece con período fijo
// deja de ser un gesto y pasa a ser un reloj.
export const DURACION_INCLINACION_MS =
  INCLINACION_CABEZA.entra + INCLINACION_CABEZA.sostiene + INCLINACION_CABEZA.vuelve;

export const ESPERA_INCLINACION = { min: 20_000, max: 40_000 };

export const CLASE_INCLINADA = 'inclinada';

export const VARS_CABEZA = {
  giro: '--giro-cabeza',
  pivoteX: '--pivote-cabeza-x',
  pivoteY: '--pivote-cabeza-y',
  angulo: '--angulo-inclinacion',
  // Los tres tramos NO viajan por separado: los offsets de un @keyframes no
  // admiten var(), así que 20,7% y 70,7% son literales del CSS atados a
  // INCLINACION_CABEZA por tests/composicion.test.js. Lo que sí viaja es el
  // total, que es lo que dura la animación.
  total: '--duracion-inclinacion',
  lado: '--lado-inclinacion'
};

// Recortes de la región ocular, para el parpadeo. Están alineados al MISMO
// lienzo de 256x256 que su sprite base, así que la capa se superpone sin
// calcular ningún offset: se dibuja en las mismas coordenadas.
//
// Sólo idle y feliz. Los demás estados no tienen recorte y no parpadean, que es
// lo correcto por diseño: standby ya tiene los ojos cerrados, critico
// entrecerrados y jugando guiña. Un estado sin recorte no es un error — es un
// estado que no parpadea.
//
// `idle-manitos` TAMPOCO PARPADEA, y es una decisión medida, no una omisión.
// La tentación era reusar idle-ojos.png, porque es la misma pose de idle con
// las manos arriba. No sirve: comparando el centro de las dos pupilas entre los
// dos PNG, el ojo izquierdo se corre 12 px a la derecha y 9 hacia arriba, y el
// derecho 6 y 6. Que los dos ojos se muevan DISTINTO quiere decir que la cabeza
// está a otro ángulo, no simplemente corrida — no hay offset que lo arregle.
//
// Un recorte desalineado 6-12 px es exactamente el defecto que apareció con el
// párpado: no se nota midiendo y canta al 400%. Así que la pose no parpadea, y
// si alguna vez tiene que hacerlo, lo que falta es `idle-manitos-ojos.png`
// alineado al mismo lienzo de 256. Con el archivo puesto acá, funciona sola.
export const RUTAS_OJOS = {
  idle: 'sprites/idle-ojos.webp',
  feliz: 'sprites/feliz-ojos.webp'
};

// ---- LAS TRES CARAS DE LA CARICIA ----
//
// CHIP NO TIENE PÁRPADOS: tiene dos lentes con aro crema y pupila. Una forma
// bajando encima se lee como una persiana, no como un ojo entrecerrándose, y por
// eso el squash de la caricia se veía mal — no era cuestión de ajustar la altura
// ni el color, estaba mal el enfoque.
//
// Los dos recortes nuevos NO son de IA. Salen de `limpiando` y de `standby`, o
// sea del mismo ilustrador y del mismo estilo. El intento generado tenía las
// curvas hacia ABAJO, que es el contorno de la tristeza, y se descartó.
export const RUTAS_OJOS_GESTO = {
  contento: 'sprites/idle-ojos-contento.webp',
  cerrado: 'sprites/idle-ojos-cerrado.webp'
};

// LA ALINEACIÓN VA POR OJO Y NO POR CAPA, y el intento anterior está contado
// abajo porque explica por qué no alcanzaba.
//
// EL ORDEN DE CSS, MEDIDO Y NO RAZONADO, porque es de lo que dependen todos los
// números de acá y es fácil decirlo al revés. Un cuadrado de 100 px con
// `translate: 10%` y `scale: 2` sobre su centro cae en [-40, 160]. Si el
// translate se escalara caería en [-30, 170]. O sea:
//
//   EL TRANSLATE NO SE MULTIPLICA POR EL SCALE.
//
// Dicho como fórmula, que no admite dos lecturas:
//
//   p' = T + s·(p − origen) + origen
//
// Evito a propósito "primero escala" o "primero traslada": el orden de la matriz
// se lee al revés que el orden en que uno escribe las propiedades, y esa frase
// manda a la persona equivocada para el lado equivocado.
//
// LAS MEDICIONES, ojo por ojo, cortando cada recorte por el hueco de columnas
// vacías que separa los dos:
//
//   capa       ojo izquierdo          ojo derecho            desnivel   hueco
//   idle       centro (85 · 97,5)     centro (152,5 · 97,5)    0,0 px   113-125
//              55x58                  54x58
//   contento   centro (83 · 107)      centro (140 · 102)      -5,0 px   107-114
//              47x51                  51x53
//   cerrado    centro (79 · 115,5)    centro (137,5 · 119,5)  +4,0 px   103-112
//              47x50                  50x50
//
// Tres cosas salen de ahí, y las tres son la razón de partir las capas:
//
//   1. En idle los dos ojos están EXACTAMENTE a nivel. En los dos gestos no, y
//      el desnivel CAMBIA DE SIGNO: contento inclina para un lado y cerrado para
//      el otro. O sea que durante la caricia la cara se bambolea.
//   2. Los dos gestos caen bajos. Cerrado hasta 22 px de lienzo por debajo, que
//      sobre los ~371 px de pantalla son más de 30. Eso es el arco pegado abajo
//      del hueco crema que se veía.
//   3. Cada ojo pide una escala DISTINTA: 1,170 el izquierdo y 1,059 el derecho
//      en contento. Un solo scale por capa deja bien uno y saca el otro un 10%.
//
// Un solo scale y un solo translate no pueden con dos ojos que piden cosas
// distintas. Por eso cada gesto se parte en dos mitades por su hueco —que está
// limpio, son columnas sin un solo píxel— y cada mitad lleva su número.
//
// NO SE TOCA EL DIBUJO. Partir por el hueco y mover cada mitad es colocar, no
// editar: los píxeles son los mismos. Esto reemplaza la nota vieja que decía que
// emparejar los ojos sería editarle el arte al ilustrador.
//
// `corte` es dónde parte el hueco, en % del lienzo. `x` e `y` en % también, y
// salen de T = destino − 128 − s·(centro − 128), con el destino siendo el ojo de
// idle que le toca a cada uno.
// Y VA POR ESTADO BASE, no una sola tabla para todos. Estaba calibrado contra la
// cabeza de idle y se usaba igual sobre feliz, y las cuencas NO están en el mismo
// lugar. Medido sobre los recortes base, que son exactamente las cuencas:
//
//   capa         ojo izquierdo        ojo derecho          desnivel propio
//   idle-ojos    (85 · 97,5) 55x58    (152,5 · 97,5) 54x58     0,0 px
//   feliz-ojos   (90,5 · 93) 56x59    (154 · 102,5) 55x60     +9,5 px
//
//   diferencia   +5,5 x · −4,5 y      +1,5 x · +5,0 y
//
// LAS DIRECCIONES SON OPUESTAS entre un ojo y el otro, y por eso sobre feliz se
// leía torcido aunque los dos arcos estuvieran a la misma altura ENTRE SÍ: el
// izquierdo se desbordaba por arriba de su aro y el derecho quedaba alto adentro
// del suyo. Ningún ajuste global puede con eso — es la misma clase de error que
// el del punto anterior, una unidad más arriba.
//
// LA ENTRADA ES OBLIGATORIA. Si mañana otro estado suma su recorte de ojos, tiene
// que declarar su ajuste: heredar el de idle en silencio es exactamente cómo
// llegamos acá. Lo cruza un test contra RUTAS_OJOS, y en vivo un estado sin
// entrada esconde las capas de gesto en vez de dibujarlas mal.
export const AJUSTE_OJOS = {
  idle: {
    contento: {
      corte: 43.16,
      izq: { escala: 1.17, x: 3.773, y: -2.315 },
      der: { escala: 1.059, x: 4.607, y: -1.16 }
    },
    // Los dos de cerrado llevan la corrección medida sobre el compuesto: los
    // valores que salían de la construcción caían 1,5 a 2 px a la derecha y algo
    // más de 1 arriba. La construcción coloca la caja alfa; lo que hay que
    // colocar es lo que se ve.
    cerrado: {
      corte: 41.99,
      izq: { escala: 1.17, x: 4.77, y: -5.67 },
      der: { escala: 1.08, x: 4.98, y: -7.9 }
    }
  },
  feliz: {
    contento: {
      corte: 43.16,
      izq: { escala: 1.191, x: 6.297, y: -3.899 },
      der: { escala: 1.078, x: 5.102, y: 0.993 }
    },
    cerrado: {
      corte: 41.99,
      izq: { escala: 1.191, x: 8.157, y: -7.855 },
      der: { escala: 1.1, x: 6.074, y: -6.309 }
    }
  }
};

// EL INTENTO ANTERIOR, y por qué no alcanzaba. Había un solo `escala`, `x` e `y`
// por capa, calculados para que la CAJA DEL PAR entero cayera sobre la de idle.
// Eso funcionaba: el par caía con 1 a 3 px de error. Pero la caja del par no es
// la unidad correcta — adentro de ella los dos ojos pueden estar desnivelados y
// pedir escalas distintas, y lo estaban. Un ajuste bien calculado sobre la
// unidad equivocada.

// LA NOTA VIEJA, como registro de por qué el intento anterior parecía completo:
//
// El pedido original era compensar con un OFFSET por capa, y la medición mostró
// que además hacía falta ESCALA, porque los recortes vienen de poses con la
// cabeza dibujada más chica —el par entero mide un 87% del de idle—. Eso se
// resolvió bien.
//
// Y quedó escrito que los dos ojos desnivelados adentro de cada recorte eran del
// dibujo y que emparejarlos sería editarle el arte al ilustrador. Eso era lo
// equivocado: partir por el hueco y colocar cada mitad no toca un solo píxel.

// LOS CATORCE NOMBRES VAN ESCRITOS, no armados con una función.
//
// El primer intento los generaba —`corte: (gesto) => ...`— y era más corto, pero
// el guardián del puente los perdió de vista: recorre las tablas VARS_* juntando
// strings que empiezan con `--`, y una función no es un string. Las catorce
// quedaron leídas por el CSS y sin escritor declarado, que es exactamente el
// defecto que ese test existe para encontrar.
//
// Es el mismo criterio que la escala de los pulsos del cable, que también son
// seis nombres y no uno: si el guardián no lo puede ver, no está protegido.
// Acá estaba `cruce: '--ojos-cruce'`, la duración de la disolvencia entre una
// cara y la siguiente. Se fue con la disolvencia: el cambio de ojos es un corte
// de un cuadro y el CSS no necesita ningún tiempo para eso. Lo que quedó es
// `CARICIA_OJOS.sostiene`, que lo usa un setTimeout de ui.js y no el CSS.
export const VARS_OJOS_GESTO = {
  contento: {
    corte: '--ojos-contento-corte',
    izq: {
      escala: '--ojos-contento-izq-escala',
      x: '--ojos-contento-izq-x',
      y: '--ojos-contento-izq-y'
    },
    der: {
      escala: '--ojos-contento-der-escala',
      x: '--ojos-contento-der-x',
      y: '--ojos-contento-der-y'
    }
  },
  cerrado: {
    corte: '--ojos-cerrado-corte',
    izq: {
      escala: '--ojos-cerrado-izq-escala',
      x: '--ojos-cerrado-izq-x',
      y: '--ojos-cerrado-izq-y'
    },
    der: {
      escala: '--ojos-cerrado-der-escala',
      x: '--ojos-cerrado-der-x',
      y: '--ojos-cerrado-der-y'
    }
  }
};

// LA PROGRESIÓN. Es lo que hace un gato al que le rascan bien: primero entrecierra
// los ojos, y si seguís, los cierra del todo.
//
// `aCerrado` es cuánto hay que sostener para llegar al cierre completo. Dos
// segundos: menos y el cierre sale con cualquier roce, más y no llega nunca en
// una caricia normal.
//
// `sostiene` es CUÁNTO DURA EL CUADRO DEL MEDIO en la vuelta, y antes se
// llamaba `cruce` porque era la duración de una disolvencia. La disolvencia se
// fue: ver el bloque de abajo.
//
// La vuelta sigue pasando por contento —el mismo camino al revés— porque un ojo
// que se abre de golpe deshace todo lo que la caricia construyó. Lo que cambió
// es cómo: antes las dos caras se mezclaban durante 260 ms; ahora `cerrado` se
// apaga, `contento` se muestra 260 ms enteros, y recién ahí se vuelve a normal.
// Es un cuadro sostenido, como en una animación por cuadros.
//
// ACÁ HABÍA UNA DISOLVENCIA ENTRE DOS DIBUJOS, Y ESE ERA EL DEFECTO. Las tres
// capas de ojo están puestas y lo que cambiaba era la opacidad, así que en el
// medio del cruce se veían las dos al 50% — y dos dibujos de pixel art al 50%
// dan una mancha translúcida con colores que ningún dibujante puso. Chip tenía
// ojos de fantasma un cuarto de segundo.
//
// Medía perfecto: la suma de opacidades daba 1,00 en todos los cuadros y el
// salto máximo entre cuadros era 0,19. Lo que estaba mal no era el valor, era la
// técnica. EL PIXEL ART CORTA, NO DISUELVE. Ahora el cambio de cara es un swap
// de un cuadro, sin transición de opacidad en ninguna de las capas.
export const CARICIA_OJOS = { aCerrado: 2000, sostiene: 260 };

export const CLASE_OJOS_CONTENTO = 'ojos-contento';
export const CLASE_OJOS_CERRADO = 'ojos-cerrado';

// LOS FONDOS DEL GALPÓN VIVEN EN FRANJAS_DIA, cada uno pegado a su tramo. Acá
// hubo un `RUTAS_FONDOS` con dos entradas —día y noche— de cuando el galpón
// tenía dos fondos y no cuatro. Cuando entraron el amanecer y el mediodía, la
// tabla nueva se llevó las rutas y esta quedó escrita, desactualizada y sin un
// solo lector en el juego.
//
// Y era PEOR que peso muerto, porque dos tests la usaban como fuente de verdad:
// el que cruza rutas contra el disco y el caché sólo miraba dos de los cuatro
// fondos, y el que verifica que un clima no pise la rotación horaria comparaba
// contra media rotación. Los dos derivan de FRANJAS_DIA ahora.
//
// Qué fondo se muestra lo decide la MISMA franja horaria que la noche del mundo
// (ver esDeNoche en sprites.js), no el standby: Chip puede estar despierto de
// noche y dormido de madrugada.

// Encuadre de la escena: se entra 8% DENTRO de la panorámica desde su borde
// izquierdo. Con eso la ventana del galpón queda a la izquierda del cuadro y
// detrás de Chip pasa la pared lisa del portón.
//
// Antes esto era un `background-position-x: 18.3%` calculado para el panel
// cuadrado de 320. Ese 18,3% NO se puede reusar: el porcentaje de
// background-position mide sobre el sobrante entre la imagen escalada y el
// contenedor, así que cambia con cada viewport — en un teléfono de 390x844 el
// mismo encuadre son 10,8%, no 18,3%. Puesto fijo, el 18,3% le comería la
// ventana por la izquierda.
//
// Lo que se conserva es la lógica, no el número. Con `background-size: auto
// 100%` la imagen escalada mide alto x (1672/941), así que entrar 8% en ella es
// correrla `alto * 0,08 * 1,7768` hacia la izquierda, sea cual sea la pantalla.
// El CSS hace ese calc con la constante de acá.
const FONDO_ENTRADA = 0.08;
const FONDO_PROPORCION = 1672 / 941;
export const FONDO_CORRIMIENTO = FONDO_ENTRADA * FONDO_PROPORCION;

// La panorámica se usa en DOS capas: el panel de Chip, nítido y recortado, y el
// ambiente de pantalla completa del body, difuminado y oscurecido. Las dos leen
// esta misma custom property, que ui.js escribe una sola vez.
//
// Es a propósito que sea una sola: si cada capa tuviera su propia asignación,
// podrían quedar en fondos distintos —galpón de día detrás y de noche adelante—
// y eso no se ve hasta que alguien cruza las 23:00 con la app abierta. Así es
// estructuralmente imposible.
export const VARS_FONDO = {
  actual: '--fondo-actual',
  corrimiento: '--fondo-corrimiento'
};

// Marca en el <body> que es de noche. La imagen ya viaja por la custom property
// de arriba, pero hay efectos que no cambian de imagen sino de ritmo —la antena
// late más lento, el polvo del haz de luz no existe— y necesitan un gancho de
// CSS. Sale del mismo esDeNoche que el fondo: una sola fuente de verdad, y esa
// fuente es el tramo del día, no la hora del standby.
export const CLASE_NOCHE = 'es-noche';

// ---- Paleta de las barras ----

// Los tres colores salen del sprite de Chip, muestreados de idle.png con conteo
// de píxeles. Ninguno está inventado ni "ajustado a ojo":
//
//   bateria       #01ffff  las barras del display del pecho — 77 px, dominante
//                          absoluto de la pantalla
//   humor         #ffa300  las hombreras naranjas — cabeza del cluster de
//                          acentos, que va de #ff9200 a #ffaa00
//   mantenimiento #ffc899  el brillo cálido de los aros de los ojos — cabeza de
//                          un cluster de ~60 px de reflejos especulares
//
// Los tres son colores de LUZ, y eso es a propósito. El primer candidato para
// mantenimiento fue #c2a593, la placa del torso, pero al 100% se leía apagado al
// lado de las otras dos: es un color de superficie —luz reflejada— y las barras
// son indicadores encendidos. El brillo del ojo es el emisivo que faltaba.
//
// Si el arte de Chip cambia, estos tres se vuelven a muestrear: son un reflejo
// del personaje, no una decisión de UI independiente.
export const COLORES_BARRAS = {
  bateria: '#01ffff',
  humor: '#ffa300',
  mantenimiento: '#ffc899'
};

// Mismo puente que VARS_ANIMACION: style.css no puede importar un módulo, así
// que ui.js escribe estos custom properties en :root al arrancar y la hoja los
// lee con var(). Las claves son las de COLORES_BARRAS y las de los stats.
export const VARS_BARRAS = {
  bateria: '--color-bateria',
  humor: '--color-humor',
  mantenimiento: '--color-mantenimiento'
};

// ---- Umbrales visuales ----

// Separado de JUGAR_BATERIA_MINIMA aunque hoy valgan lo mismo: uno es una regla
// de juego y el otro es arte. Acoplarlos haría que tocar uno mueva el otro.
export const UMBRAL_CRITICO_BATERIA = 15; // estricto: bateria < 15

// UMBRAL_FELIZ_BATERIA y UMBRAL_FELIZ_HUMOR SE FUERON, y la decisión se anota
// acá porque el que venga a buscarlos merece saber por qué no están.
//
// Gobernaban el estado visual `feliz` cuando feliz era una condición de umbral.
// Ahora es una bandera temporal que enciende la sesión, así que no queda nadie
// que los lea.
//
// Se evaluó dejarlos como condición adicional —que la caricia sólo ponga
// contento a Chip si no está mal— y no sirven para eso: la cadena ya resuelve
// ese caso mejor y antes. `critico` y `standby` están ARRIBA de `feliz`, así que
// un Chip con la batería en rojo o dormido nunca muestra la pose por más que la
// bandera esté encendida. Un guard con los umbrales sería una segunda regla que
// dice lo mismo que el orden de la cadena, y cuando dos reglas dicen lo mismo la
// que sobra se desincroniza.
//
// Dos constantes que nadie lee son deuda, no red de seguridad. Si algún día
// vuelven a hacer falta, el git log tiene el número: los dos estaban en 70.

export const HORA_STANDBY_INICIO = 23; // inclusive
export const HORA_STANDBY_FIN = 7; // exclusive -> franja 23:00 a 06:59

// ---- Ritmo visual ----

// Cuánto dura en pantalla el estado disparado por una acción antes de que la
// cadena se reevalúe.
// CUÁNTO DURA CADA ACCIÓN, y no duran lo mismo porque no son lo mismo.
//
// Antes las tres duraban 2 s y se podía apretar Cargar y Jugar en el mismo
// segundo: Chip pasaba de enchufado a jugando de un cuadro al otro. Eso rompe la
// ilusión más que cualquier otra cosa del juego.
//
// ESTO NO ES UN COOLDOWN, y la diferencia es todo el modelo. No hay espera
// DESPUÉS de la acción, no hay penalización, no hay tiempo bloqueado: mientras
// Chip carga, está cargando, y en el instante en que termina vuelve a estar todo
// disponible. La restricción es de coherencia, no de ritmo de juego. El modelo
// sin culpa no se toca — ver `aplica` en acciones.js, que es la otra restricción
// y también es de estado y no de reloj.
//
// Cargar es el más largo por una razón concreta además de la narrativa:
// enchufarse es un proceso, y son los segundos que el cable y sus pulsos
// necesitan para leerse. Con 2 s la animación no llegaba a existir.
export const DURACIONES_ACCION = {
  cargar: 7000,
  jugar: 3000,
  limpiar: 4000
};

// El que se usa cuando una acción no declara la suya. Ninguna de las tres cae
// acá hoy; existe para que agregar una acción nueva no rompa nada.
export const DURACION_ESTADO_ACCION_MS = 3000;

// En cuántos escalones sube la barra durante la acción. La energía no llega de
// golpe al final: llega mientras dura. Cada escalón usa la transición de 400 ms
// que la barra ya tenía, así que el efecto es una cuenta que sube a saltos
// suaves y no una barra animada linealmente — que se leería como una carga de
// software y no como algo entrando.
export const ESCALONES_ACCION = 6;

// EL APAGADO DE LOS BOTONES NO ES UNA CLASE. Fue `CLASE_OCUPADO = 'ocupado'`
// hasta que el tratamiento pasó a `aria-disabled`, que es el mismo estado dicho
// una sola vez: la chapa mate sale de `[aria-disabled="true"]` en style.css y el
// lector de pantalla lee lo mismo que se ve. La constante quedó sin lector y se
// fue; esto queda anotado para que nadie la reponga buscando dónde se apagan.
//
// El tratamiento visual sigue siendo el MISMO que el de una acción que no hace
// falta: si el jugador ya aprendió qué quiere decir esa chapa mate, no hay que
// enseñarle un segundo idioma.

// ---- El estado `esperando` ----
//
// De dónde sale: del canon. El evento 11 dice "Pasó un carguero de siete
// metros. CHIP ESPERÓ A QUE TERMINARA DE PASAR y después siguió con lo suyo, un
// poco despeinado por el viento", y el sprite entró al repo con el mensaje
// "Chip aguanta el paso de un gigante". La pose son los brazos cruzados: no es
// impaciencia, es aguantar.
//
// El disparador es la categoría `grandes` de datos-eventos.js —"el mundo que no
// lo ve"—, que hasta ahora nadie filtraba. Ese archivo ya avisaba que la
// categoría era dato y no etiqueta decorativa; este es su primer consumidor.
//
// Así el texto y la pose dicen lo mismo al mismo tiempo, y hay una sola fuente
// de verdad: el evento decide, el sprite ilustra. Nada de un timer aparte
// inventando gigantes que el jugador no leyó.
export const CATEGORIA_GRANDES = 'grandes';

// ---- La lluvia ----
//
// "Miró la lluvia por la ventana del fondo. Es su ventana." Es el evento 16 del
// canon, y NO ES UN QUINTO TRAMO NI UN SISTEMA DE CLIMA. Es un evento que además
// se ve y se escucha: cuando sale, el ambiente de lluvia reemplaza al de la
// franja y aparecen líneas sobre la ventana. Dura lo que dura la sesión y a la
// próxima visita el galpón vuelve a la normalidad.
//
// Armarle un sistema de clima —estados, transiciones, probabilidades— sería un
// sistema entero para un solo caso. Lo que hay es un id, una bandera y dos
// llamadas.
export const EVENTO_LLUVIA = 'evento-16';

// Y LA NIEBLA, que es el segundo. Con dos ya conviene una tabla, pero sigue sin
// ser un sistema de clima: no hay transiciones ni probabilidades propias: son
// dos eventos del pool que además cambian el fondo.
export const EVENTO_NIEBLA = 'evento-21';

export const CLASE_LLOVIENDO = 'lloviendo';

// ---- LOS DOS CLIMAS ----
//
// NO SON TRAMOS HORARIOS. La rotación amanecer / mediodía / atardecer / noche
// sigue corriendo por debajo sin enterarse; lo que hace un clima es TAPAR su
// fondo mientras está activo, con el mismo crossfade que usan los tramos entre
// sí. Si la sesión se estira y el tramo cambia, el clima gana igual.
//
// Duran lo que dura la sesión y no se persisten en ningún lado, así que a la
// próxima visita el mundo vuelve solo. Es el mismo mecanismo que ya tenía la
// lluvia; lo único nuevo es el fondo.
//
// SON EXCLUYENTES: no puede haber niebla y tormenta a la vez. Lo resuelve la
// forma del dato —hay UN clima activo, no una lista— y no una condición.
//
// `nube` es un desvío declarado: la spec no lo pide. Las nubes de código pasan
// por delante del cielo pintado, y con el fondo de tormenta las nubes doradas
// del atardecer quedaban flotando sobre un cielo de plomo. El clima trae su
// propio tono para esa capa, por el mismo motivo por el que cada tramo trae el
// suyo.
//
// ---- Y `cable`, por lo mismo pero medido ----
//
// EL CABLE SE PINTA SIEMPRE DEL MISMO GRIS y lo que cambia es el piso. Medido
// en pantalla sobre el tramo lejano —el que sube a la toma, donde el cable ya
// está afinado— en los seis fondos, en valores de 0 a 255:
//
//   fondo       piso        cable    cómo se lee
//   atardecer   66 a 150    49-57    oscuro sobre claro
//   mediodía    ~190        49-57    oscuro sobre claro
//   amanecer    ~130        49-57    oscuro sobre claro
//   noche       17 a 28     43-50    CLARO sobre oscuro, y se lee bien
//   tormenta    24 a 37     48-51    claro sobre oscuro, al límite
//   niebla      29 a 47     42-47    se CRUZAN: el cable desaparece
//
// O sea que el defecto no es "poco contraste" en general: es que el piso de la
// niebla sube justo hasta la banda en la que el cable ya estaba. Abajo del todo,
// donde el piso llega a 47, el cable queda POR DEBAJO del piso y no hay nada que
// separar.
//
// La noche es la prueba de que el mecanismo alcanza: con el piso en 17-28 el
// mismo cable se lee perfecto, verificado a tamaño real y no sólo por el número.
// Por eso la noche NO se toca — su luz plana es otra cosa que la de una tormenta,
// y lo que anda no se arregla.
//
// El clima trae entonces su propio par de tonos, y son más claros y no más
// oscuros: un día de tormenta o de niebla es luz difusa y sin dirección, y en esa
// luz todo tiende al gris medio. Bajar el cable lo hundiría en la noche.
export const CLIMAS = {
  tormenta: {
    evento: EVENTO_LLUVIA,
    fondo: 'sprites/fondo-tormenta.webp',
    // La lluvia por código va ENCIMA del fondo nuevo. El fondo se generó a
    // propósito sin gotas dibujadas: la imagen da la atmósfera y el cielo, el
    // código da el movimiento. Las dos cosas juntas.
    llueve: true,
    nube: { color: '#8d939c', alfa: 0.5 },
    // El piso de la tormenta llega a 37. El cuerpo sube a gris 92 y el lomo a
    // 128 compuesto: separación de 55 contra el piso más claro de este fondo,
    // el doble de la que tiene hoy la noche —que se lee bien— y sin llegar a
    // competir con el cian de los pulsos, que es lo único que brilla.
    cable: { color: '#505b68', brillo: '#a8b2be' }
  },
  niebla: {
    evento: EVENTO_NIEBLA,
    fondo: 'sprites/fondo-niebla.webp',
    // NADA DE PARTÍCULAS ADENTRO DEL GALPÓN. La niebla está afuera y el fondo ya
    // la cuenta; sumarla por código sería taparle la cara a Chip. La niebla se
    // siente por lo que NO hay.
    llueve: false,
    nube: { color: '#c9cdd2', alfa: 0.22 },
    // El de la niebla es el caso peor y por eso es el que fija el número: su piso
    // llega a 47, cuatro puntos por ENCIMA del cable de hoy. Mismo par que la
    // tormenta —la falla es la misma y dos tonos distintos para el mismo arreglo
    // serían dos cosas que mantener— y contra ese piso quedan 45 de separación.
    cable: { color: '#505b68', brillo: '#a8b2be' }
  }
};

// TRES BANDAS DE PROFUNDIDAD, y es el mismo criterio que las nubes: lo que está
// cerca es más largo, más opaco y más rápido; lo que está lejos es corto, tenue
// y lento. Una lluvia de líneas todas iguales se lee como una textura, no como
// agua cayendo a distintas distancias del vidrio.
//
// El ángulo es el mismo para las tres —la lluvia cae para el mismo lado— y sólo
// cambian el largo, la opacidad y la velocidad.
export const LLUVIA = {
  angulo: 14,
  bandas: [
    { lineas: 16, largo: 13, grosor: 1.7, alfa: 0.55, ciclo: 620, desenfoque: 0 },
    { lineas: 20, largo: 9, grosor: 1.3, alfa: 0.4, ciclo: 900, desenfoque: 0.4 },
    { lineas: 24, largo: 6, grosor: 1, alfa: 0.26, ciclo: 1300, desenfoque: 1 }
  ],
  // DOS TONOS Y NO UNO, y es la diferencia entre verse y no verse.
  //
  // La primera versión era un trazo claro solo, y contra el cielo del atardecer
  // —que es casi blanco— desaparecía: ampliado al 300% no se distinguía una sola
  // gota. Un trazo claro no puede leerse sobre un fondo claro, y el fondo de esa
  // ventana es claro en tres de los cuatro tramos.
  //
  // Así que la gota tiene CUERPO OSCURO y PUNTA BRILLANTE, que además es lo que
  // hace el agua: el cuerpo refracta y oscurece lo que hay detrás, y en el borde
  // de abajo junta un reflejo. Con los dos tonos se ve contra el cielo del
  // mediodía y contra el de la noche, sin cambiar de paleta por tramo.
  cuerpo: '#3f5668',
  brillo: '#eaf4fb'
};

export const VARS_LLUVIA = {
  angulo: '--lluvia-angulo',
  cuerpo: '--lluvia-cuerpo',
  brillo: '--lluvia-brillo'
};

// La categoría de encontrar algo. Es la que pone a Chip contento cuando el
// evento se lee: `feliz` es una reacción, y encontrar una pieza es una de las
// cosas a las que reacciona.
export const CATEGORIA_COLECCION = 'coleccion';

// CUÁNTO DURA LA REACCIÓN DE `feliz`.
//
// El número tiene dos límites y los dos importan. Corto de menos y el sprite
// entra y sale antes de que el ojo lo registre; largo de más y vuelve a ser un
// estado, que es de lo que lo sacamos. 3,2 s deja ver la pose entera —el
// parpadeo, el ciclo rápido de respiración— y se va antes de instalarse.
export const DURACION_FELIZ_MS = 3200;

// Cuánto aguanta la pose. Más largo que una acción (2 s) porque un gigante no
// pasa en dos segundos, y bastante más corto que la lectura completa de una
// visita: es un momento, no un estado en el que Chip se queda a vivir.
export const DURACION_ESPERANDO_MS = 9000;

// Ventana mínima entre dos cambios de estado visual automáticos. Las acciones
// del jugador la saltean: apretar un botón tiene que responder al instante.
export const DEBOUNCE_VISUAL_MS = 2000;

// Cada cuánto se reevalúa la cadena sin que pase nada. Su único efecto real es
// detectar el cruce de HORA_STANDBY_INICIO y HORA_STANDBY_FIN con la app
// abierta: no toca stats, no aplica decay, no guarda.
export const TICK_VISUAL_MS = 60_000;

// ---- Animaciones de vida ----

// LA RESPIRACIÓN. Chip respira siempre, en todos los estados.
//
// Reemplazó al rebote, que era traslación pura: subir y bajar 4 px es levitar,
// no respirar. Un cuerpo que respira se DEFORMA en el lugar, con el pivote en la
// línea de apoyo de las orugas (APOYO_ORUGAS), que es lo único que no se mueve.
//
// El ciclo se alargó de 2,2 s a 3,4: la respiración en reposo es lenta, y el
// rebote viejo a 2,2 leía más como nerviosismo que como calma. Sigue valiendo la
// razón por la que no es un número redondo: DEBOUNCE_VISUAL_MS y
// DURACION_ESTADO_ACCION_MS valen 2 s los dos, y un ciclo múltiplo de ellos
// haría caer el cambio de sprite siempre en el mismo punto de la respiración,
// que es justo lo que vuelve mecánica a una animación.
export const CICLO_RESPIRACION_MS = 3400;

// La curva es ASIMÉTRICA y ese es el detalle que la hace leer como respiración:
// inhalar ocupa el 40% del ciclo y exhalar el 60%. Un cuerpo real toma aire más
// rápido de lo que lo suelta. Con 50/50 se ve como un fuelle.
//
// Este número NO viaja por custom property, y no por olvido: los offsets de un
// @keyframes (`40% { ... }`) no admiten var(). Es un literal en style.css atado
// a este valor por tests/composicion.test.js, igual que las posiciones de los
// corazones. Si alguien mueve uno de los dos, el test lo dice.
export const INHALACION = 0.4;

// Amplitud base. El scaleX va a la INVERSA y es lo que evita que se lea como un
// globo inflándose: cuando un cuerpo se estira hacia arriba, se angosta un poco.
// La compensación no es exacta —0,994 contra 1,018— porque conservar el volumen
// al milímetro se ve rígido; un cuerpo blando gana un poco de volumen al inhalar.
export const RESPIRACION = { y: 1.018, x: 0.994 };

// La respiración es el PRIMER indicador de estado, antes de mirarle la cara.
// Cada estado tiene su ritmo y su profundidad; el multiplicador escala la
// amplitud sobre RESPIRACION. Lo que no está acá usa el ciclo y el 1x de arriba.
export const RESPIRACION_POR_ESTADO = {
  // Respira despacio y poco: la batería no da para más.
  critico: { ciclo: 5000, amplitud: 0.5 },
  // Agitado y profundo, como quien está contento.
  feliz: { ciclo: 2600, amplitud: 1.5 },
  // Dormido: casi no se mueve, pero se mueve.
  standby: { ciclo: 6000, amplitud: 0.35 }
};

// Cuánto acompaña la sombra. Al inhalar Chip se estira hacia arriba y apoya
// menos, así que la huella se angosta; al exhalar vuelve a ensancharse. Es la
// contrafase de siempre, ahora atada a la deformación y no a la altura.
export const RESPIRACION_SOMBRA = { x: 0.94, opacidad: 0.82 };

// Salto de acción: sube y vuelve, montado encima de la respiración. Sigue siendo
// TRASLACIÓN, a propósito — ahí sí se quiere que despegue del piso.
// EL SALTO TIENE TRES TIEMPOS, no dos. Subir y bajar simétrico es lo que hace
// que un salto se vea mecánico: un cuerpo con masa se agacha antes de saltar,
// despega rápido, y cae más lento de lo que subió porque en la subida el impulso
// pelea contra el peso y en la bajada van los dos para el mismo lado.
//
// La anticipación es lo que más aporta y lo que más se olvida: sin ella el salto
// arranca de la nada y se lee como un corte de montaje.
export const SALTO = {
  anticipacion: 80, // se agacha
  impulso: 120, // despega, ease-out
  caida: 250, // vuelve, con rebote al aterrizar
  agacha: 3, // px hacia abajo antes de despegar
  altura: 8, // px de despegue
  rebote: 2 // px de sobrepaso al aterrizar
};

export const DURACION_SALTO_MS = SALTO.anticipacion + SALTO.impulso + SALTO.caida;

// Cuánto tarda una barra en viajar hasta su nuevo ancho en vez de saltar.
export const TRANSICION_BARRA_MS = 400;

// Cuánto tarda un botón en hundirse y volver. Corto a propósito: es el acuse de
// recibo del dedo, no una animación. Más lento se siente lento, no suave.
// SOLTAR ES MÁS LENTO QUE APRETAR, siempre. El dedo baja de golpe y el material
// vuelve solo; que las dos mitades duren lo mismo es lo que hace que un botón se
// sienta de plástico duro. 60 abajo y 140 arriba.
export const PRESION_BOTON = { baja: 60, sube: 140 };

export const DURACION_PRESION_MS = PRESION_BOTON.baja + PRESION_BOTON.sube;

// La otra punta de estos tres números está en style.css, que no puede importar
// un módulo. En vez de duplicarlos ahí (sería un cuarto carve-out de la regla
// de config.js), ui.js los inyecta como custom properties en :root al arrancar
// y la hoja los lee con var(). Sin JS no hay animación, que es exactamente lo
// que corresponde.
export const VARS_ANIMACION = {
  cicloRespiracion: '--ciclo-respiracion',
  saltoAgacha: '--salto-agacha',
  saltoAltura: '--salto-altura',
  saltoRebote: '--salto-rebote',
  presionBaja: '--presion-baja',
  presionSube: '--presion-sube',
  llegadaDesde: '--llegada-desde',
  llegadaAplaste: '--llegada-aplaste',
  zetaDesde: '--zeta-desde',
  zetaHasta: '--zeta-hasta',
  corazonGiro: '--corazon-giro',
  corazonBamboleo: '--corazon-bamboleo',
  respiracionY: '--respiracion-y',
  respiracionX: '--respiracion-x',
  sombraX: '--sombra-respiracion-x',
  sombraOpacidad: '--sombra-respiracion-opacidad',
  duracionSalto: '--duracion-salto',
  transicionBarra: '--transicion-barra',
  duracionPresion: '--duracion-presion',
  transicionPanel: '--transicion-panel',
  duracionLlegada: '--duracion-llegada'
};

// Clase que dispara el salto. La declara style.css, la pone y la saca ui.js.
// ---- ACÁ ESTABA CICLO_LED_MS, Y SE FUE CON EL LED ----
//
// Valía 2400, y lo que decía la nota sigue siendo buen criterio para lo que
// venga: iba FUERA DE FASE con la antena y con el rayo del pecho, porque tres
// latidos del mismo largo se sincronizan y el aparato entero se vuelve un
// metrónomo. Si algún día vuelve una luz a la botonera, ese es el número a
// respetar y no el 2400.
//
// El LED en sí se fue cuando el botón perdió la caja: era un cuadrado de 2x2 en
// la esquina de un rectángulo, y sin rectángulo no hay esquina. Ver style.css,
// donde estaba la regla.

export const CLASE_SALTO = 'saltando';

// ---- El cambio de sprite ----
//
// Los cambios de estado se sentían bruscos, y la respuesta NO es uniforme: hay
// dos tipos y necesitan tratamiento opuesto.
//
// Los de ACCIÓN quedan en corte seco. Tocás Cargar y Chip cambia al instante:
// ese corte ES el feedback de que la acción respondió. Suavizarlo lo haría
// sentir flojo y con retardo. El salto que ya existe alcanza de acompañamiento.
//
// Los AMBIENTALES —cruzar 15 de batería, que den las 23, subir a feliz, que pase
// un gigante, cambiar de pose— no los causó el jugador, y ahí el corte seco
// parece un glitch en vez de un cambio de humor.
//
// La técnica es el truco clásico de la animación tradicional: se tapa el cambio
// de dibujo con movimiento. Un squash corto justo en el instante del cambio y el
// ojo lee el movimiento en vez del corte.
export const ESTADOS_DE_ACCION = ['cargando', 'jugando', 'limpiando'];

export const DURACION_SQUASH_MS = 150;
export const CLASE_CAMBIO = 'cambiando';

// El pivote va en la base de las orugas y no en el centro: comprimido desde el
// medio, Chip se hunde en el piso y flota al mismo tiempo. Sale de la misma
// tabla APOYO_ORUGAS que ancla la sombra.
// El crossfade de 120 ms se probó encima del squash y NO quedó. Un fade entre
// dos dibujos distintos muestra los dos: en la captura del punto medio exacto de
// idle -> feliz se ven dos Chips superpuestos, con el bulbo de la antena
// duplicado y las dos manos a la vez. El detalle está en style.css.
export const VARS_CAMBIO = {
  duracionSquash: '--duracion-squash'
};

// ---- Acariciar ----
//
// EL TAP CAMBIA DE SIGNIFICADO. Antes abría el panel de estado; ahora acaricia,
// y el panel se mudó a mantener apretado. El motivo es cuál de los dos gestos se
// hace más seguido: a Chip se lo toca porque está ahí, no para consultar
// números. El gesto más frecuente se queda con el toque más barato.
//
// Sube el humor MUY POCO. No es una cuarta acción encubierta: es que a Chip le
// gusta que lo toquen. Dos puntos no reemplazan a jugar —que da 30— y no
// alcanzan para sostener el stat solo.
// ---- TRES GESTOS, TRES SIGNIFICADOS ----
//
// Acariciar era un TAP, y por eso no convencía: un tap no es una caricia, es un
// dedazo. La diferencia es física y ningún ajuste de la animación la salva,
// porque el gesto está diciendo otra cosa. Un toque es instantáneo y puntual;
// una caricia es sostenida y en movimiento, y la respuesta se construye mientras
// dura.
//
//   arrastrar el dedo   -> acariciar: se relaja
//   tap seco            -> tocarlo:   se sobresalta, y si insistís se fastidia
//   mantener sin mover  -> sus números
//
// Y eso corre el fastidio del lado del TOQUE y no de la caricia, que es lo que
// importa para el modelo sin culpa: podés acariciarlo todo lo que quieras,
// siempre está bien. Lo que lo molesta es que lo estés picando con el dedo.

// ---- LA ZONA TÁCTIL DE CHIP ----
//
// La caja de #chip es CUADRADA y mide --alto-chip de lado: en un teléfono de
// 480x945 son 416x416, el 87% del ancho de la escena. La silueta de Chip mide
// unos 278 px de ancho: la caja es casi el doble de lo que hay dibujado, y todo
// ese aire de más se comía los toques de alrededor. Damián lo midió en
// producción con un objeto tirado en x 391-416: fuera de la silueta de Chip
// —que termina en x≈379— y adentro de su caja, así que el tap nunca llegaba a
// la pieza.
//
// La zona sale de la HUELLA ALFA de las nueve poses, unidas: el hitbox tiene que
// cubrir cualquier pose y no la que esté puesta ahora. Umbral 128 —el contorno
// opaco, no la niebla del borde— y corrida mínima de 6 px, porque `jugando`
// tiene cinco píxeles sueltos de alfa 19 a 58 en x=11 que no son dibujo: son
// basura del recorte, y sin la corrida corrían el borde izquierdo 14 puntos.
//
// Cada fila es [y de arranque, x izquierdo, x derecho] en % del lienzo de 256,
// que es exactamente la caja de #chip. Bandas de 16 px: la escalera no se nota
// en un hitbox y con 34 vértices el polígono sigue siendo legible.
//
// A los extremos medidos se les suman 2 puntos de holgura por lado, que es más
// que lo que Chip se corre con la respiración (1,1 puntos en el borde) y con el
// rebote.
//
// Y ABAJO SE RECORTA CONTRA LA FRANJA DEL PISO. De la banda y=62,5 para abajo
// —donde puede haber una pieza tirada— el borde derecho se corta en 83,5 aunque
// `jugando` llegue a 89,1: la rueda de esa pose es lo único que entra en la
// franja, y entre perder un pedazo de rueda tocable en una pose transitoria o
// perder el objeto que el jugador quiere levantar, se pierde la rueda. De ahí
// salen los límites de ZONA_PISO, que se derivan de este número.
export const SILUETA_CHIP = [
  [0, 35.9, 66.5],
  [6.3, 35.9, 66.5],
  [12.5, 28.5, 68.8],
  [18.8, 20.7, 77.8],
  [25, 16, 84],
  [31.3, 12.5, 85.2],
  [37.5, 7, 87.9],
  [43.8, 7, 87.9],
  [50, 8.5, 87.2],
  [56.3, 14, 87.2],
  [62.5, 12.8, 83.5],
  [68.8, 12.8, 83.5],
  [75, 12.5, 83.5],
  [81.3, 11.7, 82.9],
  [87.5, 13.2, 82.9],
  [93.8, 16, 79.7]
];

export const VARS_ZONA_CHIP = { forma: '--zona-chip' };

// Cuánto movimiento convierte un apretón en un arrastre.
export const MOVIMIENTO_CARICIA = 10;

// LOS TRES GESTOS SE DECIDEN CON DOS UMBRALES Y NO CON TRES. Uno de espacio
// —MOVIMIENTO_CARICIA— y uno de tiempo —ESPERA_MANTENIDO_MS—, y entre los dos
// parten el espacio entero: te moviste, aguantaste, o ninguna de las dos.
//
// Hubo un tercero, `TOQUE_SECO_MS = 200`, con el comentario "más que esto ya no
// es un tap seco". Como era MÁS CHICO que el del mantenido, no separaba dos
// gestos: abría un pozo de 300 ms entre los dos. Soltar a los 300 ms sin moverse
// no era nada — ni toque, ni panel, ni sobresalto, ni una unidad para el
// fastidio. Y como el fastidio pide cuatro toques en tres segundos, los toques
// que caían en el pozo hacían que Chip no se enojara nunca.
//
// La regla: un umbral nuevo entre estos dos tiene que SEPARAR dos gestos, no
// meterse adentro de uno. Ver soltarGesto en ui.js.

// Un toque sube menos que una caricia. No es nada, pero no es lo mismo.
export const TOQUE_HUMOR = 1;

// Cada cuánto sale un corazón mientras la caricia sigue. De a uno y no en tanda:
// uno cada tanto dice "esto está pasando ahora", cinco de golpe dicen "recibí un
// evento".
export const PASO_CARICIA_MS = 500;

// CUÁNTOS TOQUES LO FASTIDIAN. Eran 6 en 4 s y en la práctica no se disparaba
// nunca. Con 4 en 3 s se fastidia siempre, que es lo que hace que el gesto tenga
// una consecuencia legible.
export const TOQUES_PARA_FASTIDIO = 4;
export const VENTANA_FASTIDIO_MS = 3000;

// LA RELAJACIÓN, en multiplicadores sobre la respiración de reposo. Más lenta y
// más profunda: es lo que hace un cuerpo al que le rascan.
export const RESPIRACION_CARICIA = { ciclo: 1.25, amplitud: 1.4 };

// LOS OJOS A MEDIA ASTA SIGUEN SIENDO LO MÁS IMPORTANTE de la caricia —un animal
// al que le rascan cierra los ojos, y eso solo ya se lee como placer— pero se
// hacen con ARTE y no con una transformación.
//
// Acá vivía `PARPADO_CARICIA = 0.45`, que aplastaba la capa de ojos al 45% de
// alto. El problema no era el número: Chip no tiene párpados, tiene lentes, y
// una forma bajando encima se lee como una persiana. Ningún valor de ese factor
// lo iba a arreglar.
//
// Lo reemplaza la progresión de RUTAS_OJOS_GESTO: normal -> contento ->
// cerrado, con recortes de verdad. El párpado se queda para el PARPADEO, donde
// funciona porque son 130 ms y no se llega a leer como forma.

// La cabeza acompaña la mano. Una insinuación, no un seguimiento literal.
export const INCLINACION_CARICIA = 1.2;

// Sostener y volver. La vuelta lenta es parte de lo que hace que se sienta bien:
// un corte seco al levantar el dedo deshace todo lo anterior.
export const SOSTEN_CARICIA_MS = 600;
export const VUELTA_CARICIA_MS = 1500;

export const CLASE_ACARICIANDO = 'acariciando';
export const CLASE_SOBRESALTO = 'sobresalto';
export const CLASE_VOLVIENDO = 'volviendo';

export const VARS_CARICIA_GESTO = {
  // `parpado: '--caricia-parpado'` se fue con el aplastado de la capa de ojos.
  // Ver PARPADO_CARICIA arriba: lo reemplazan los recortes de RUTAS_OJOS_GESTO.
  inclinacion: '--caricia-inclinacion',
  vuelta: '--caricia-vuelta',
  cicloRespiracion: '--caricia-respiracion-ciclo',
  respiracionY: '--caricia-respiracion-y',
  respiracionX: '--caricia-respiracion-x'
};

export const CARICIA_HUMOR = 2;

// Mantener apretado para ver los números. 500 ms es el umbral clásico de
// long-press: más corto se dispara sin querer al acariciar, más largo se siente
// trabado.
export const ESPERA_MANTENIDO_MS = 500;

// ---- LO QUE DEJÓ LA MUDANZA DEL TAP ----
//
// Cuando acariciar era un TAP, acá vivían seis constantes más. La mudanza a los
// tres gestos las dejó escritas y sin un solo lector: no rompen nada, no tiran
// error y no se ven — el modo de falla exacto que el puente de custom properties
// ya vigilaba del lado del CSS. El guardián de tema.test.js ahora también cruza
// los exports de este archivo, y fue él quien las encontró.
//
// No se perdió ninguna decisión: las seis tienen heredera arriba, y quedan
// anotadas para que nadie las reponga creyendo que falta algo.
//
//   COOLDOWN_CARICIA_MS = 400     -> PASO_CARICIA_MS. El cooldown limitaba la
//     animación de un tap repetido. La caricia sostenida no lo necesita: los
//     corazones salen de un intervalo, así que el ritmo está en la forma del
//     gesto y no en un freno puesto encima.
//
//   CARICIAS_PARA_CANSARSE = 6    -> TOQUES_PARA_FASTIDIO = 4
//   VENTANA_CANSANCIO_MS = 4000   -> VENTANA_FASTIDIO_MS = 3000
//   DURACION_CANSANCIO_MS = 3000  -> DURACION_FASTIDIO_MS = 2000
//     El fastidio se corrió a la vereda del TOQUE, que es el punto entero del
//     modelo sin culpa: acariciarlo siempre está bien, picarlo con el dedo no.
//     Y los números bajaron porque con 6 en 4 s no se disparaba nunca.
//
//   CLASE_CARICIA = 'acariciado'  -> CLASE_ACARICIANDO. El squash de 320 ms era
//     el acuse de recibo de un tap; la caricia lo reemplazó por una respuesta
//     que se construye mientras dura. Se fue también la regla muerta que lo
//     pintaba en style.css.
//
//   CLASE_CANSADO = 'cansado'     -> el estado visual `esperando`. La cara de
//     fastidio la decide la SESIÓN y la dibuja un sprite, no una clase de CSS:
//     elegir un estado visual nunca fue de la hoja.

// EL ANILLO CIAN DEL MANTENIDO SE FUE, y con él la clase que lo prendía y la
// variable que le daba la duración.
//
// Era la señal de que el mantenido estaba corriendo: un aro que se cerraba sobre
// Chip durante los 500 ms. El problema es que se prendía en el `pointerdown`, o
// sea en TODOS los gestos, y aparecía al 18% del recorrido — 90 ms, menos de lo
// que tarda un dedo en recorrer los 10 px que convierten el gesto en caricia.
// Así que acariciarlo o tocarlo dibujaba un destello cian, que es el ripple de
// un botón y es luz fría: lo contrario de lo que comunica una caricia.
//
// Va SIN REEMPLAZO, y eso es la decisión y no un olvido. Lo que Chip contesta
// cuando lo tocás ya está en su cuerpo —los ojos, la respiración, la cabeza, los
// corazones, el sobresalto— y el mantenido termina abriendo el panel, que es
// señal suficiente de que el gesto llegó.
export const VARS_CARICIA = {
  duracion: '--duracion-caricia'
};

// Cuánto dura el squash de la caricia. Corto: es un acuse de recibo, no una
// animación de acción — las de acción duran segundos y ocupan a Chip, esta no
// ocupa nada.
export const DURACION_CARICIA_MS = 320;

// ---- El estado que aparece al tocar a Chip ----

// El estado no vive en pantalla: vive en Chip. Se abre tocándolo y se cierra
// solo, sin que el jugador tenga que cerrar nada. Cuatro segundos alcanzan para
// leer tres números y no tanto como para que la escena quede tapada.
export const DURACION_PANEL_ESTADO_MS = 4000;

// Entrada y salida del panel. Corta: es una tapa que se abre, no una pantalla
// que navega.
export const TRANSICION_PANEL_MS = 150;

export const CLASE_PANEL_VISIBLE = 'visible';

// ---- El estante y la vista de colección ----

// Cuánto dura la llegada de un objeto nuevo al estante: escala de 0 a 1 con un
// rebotecito. Corta — es un "apareció", no una ceremonia.
// LA LLEGADA AL ESTANTE ES UNA CAÍDA, no una aparición. Un objeto que aparece
// creciendo desde cero se lee como UI; uno que cae desde arriba y golpea contra
// la madera se lee como una cosa con peso.
//
// El squash del aterrizaje dura poquísimo a propósito: 60 ms es lo que tarda un
// golpe. Más largo y deja de ser un impacto para ser una animación de goma.
export const LLEGADA = {
  caida: 260, // desde 20 px arriba, acelerando
  golpe: 60, // el squash contra el estante
  recupera: 120,
  desde: 20, // px por encima de su lugar
  aplaste: 0.85 // scaleY en el golpe
};

export const DURACION_LLEGADA_MS = LLEGADA.caida + LLEGADA.golpe + LLEGADA.recupera;

// Escalonado entre objetos cuando llegan varios en la misma visita, para que no
// aparezcan los tres de golpe.
export const ESPERA_ENTRE_LLEGADAS_MS = 120;

export const CLASE_OBJETO_NUEVO = 'llegando';
export const CLASE_OBJETO_OBTENIDO = 'obtenido';

// Cuánto tarda el segundo evento de la visita en reemplazar al primero. Se ve
// uno por vez: son dos líneas sueltas en el mundo, no una lista.
export const ESPERA_SEGUNDO_EVENTO_MS = 4000;

// ---- La luz que recorre el día ----
//
// El galpón tiene día y noche desde el swap de fondos. Esto suma la hora: el
// charco de luz que entra por la ventana cambia de lugar y de temperatura a lo
// largo del día. Amanecer bajo y cálido, mediodía alto y neutro, tarde
// anaranjada y larga.
//
// AHORA SON CUATRO TRAMOS CON PANORÁMICA PROPIA, no dos. Antes el galpón tenía
// día y noche y el degradé del piso simulaba el recorrido de la luz; ahora el
// momento del día lo dice el ARTE —cuatro panorámicas con la misma composición
// y la misma ventana— y el degradé pasa a hacer lo que un dibujo fijo no puede:
// moverse DENTRO del tramo.
//
// Los cortes horarios, y por qué:
//
//   amanecer   6-9    3 h   el cielo lila y la luz fría y baja
//   mediodia   9-18   9 h   el cielo azul, la luz blanca y alta
//   atardecer 18-21   3 h   el cielo dorado, la luz larga y naranja
//   noche     21-6    9 h   el cielo con estrellas
//
// LOS TRAMOS NO SON PAREJOS, Y NO TIENEN QUE SERLO. El primer reparto fue
// 4/6/6/8 y se veía solo lo que estaba mal: a las 22, con el cielo real negro
// hacía rato, Chip estaba en un galpón con luz dorada de sol poniente. El
// atardecer duraba seis horas. Y el amanecer tenía el problema inverso: a las
// 10 de la mañana la luz seguía siendo rosada de las 7.
//
// El sol no reparte parejo. Mediodía y noche son los ESTADOS largos; amanecer y
// atardecer son TRANSICIONES cortas. Con 3/9/3/9 el día es mayormente mediodía,
// la noche es mayormente noche, y los dos crepúsculos duran poco — que es
// exactamente lo que los hace valer cuando los agarrás.
//
// CONSECUENCIA BUSCADA: estos cortes ya NO son los del standby. El standby
// sigue en 23-7 (HORA_STANDBY_INICIO / HORA_STANDBY_FIN) y el mundo va por su
// cuenta, así que quedan dos ventanas de desfase, las dos deliberadas:
//
//   21-23   el galpón ya es de noche y Chip todavía está despierto. Es la misma
//           idea del swap sin cortocircuito: el mundo tiene su hora y Chip la
//           suya, y un robot despierto a las diez de la noche no es un bug.
//    6-7    amanece y Chip sigue durmiendo. La otra cara: se quedó dormido.
//
// Lo que SÍ se movió para que el desfase no se lea como error: la noche del
// MUNDO —la clase es-noche, el charco de luz, la repisa apagada— ahora la
// decide esta tabla y no el standby (ver esDeNoche en sprites.js). Si no, a las
// 21 el fondo cambiaba a nocturno y todo lo demás seguía iluminado de día, que
// eso sí se ve como un bug.
//
// OJO CON LOS NOMBRES DE ARCHIVO. `fondo-dia.webp` es el ATARDECER: mantiene el
// nombre viejo para no romper referencias. El lila es `fondo-amanecer`, el azul
// `fondo-mediodia` y el nocturno `fondo-noche`. Verificado mirando las cuatro,
// no leyendo los nombres.
//
// `luz` es dónde arranca el charco de cada tramo. El final de un tramo es el
// arranque del siguiente, y sprites.js interpola entre los dos según lo que se
// haya corrido la hora: al principio del mediodía la luz está en un lugar y al
// final en otro, moviéndose sin saltos. El fondo marca el momento del día; la
// luz marca el paso del tiempo.
export const FRANJAS_DIA = [
  {
    nombre: 'amanecer',
    desde: 6,
    hasta: 9,
    fondo: 'sprites/fondo-amanecer.webp',
    luz: { x: 18, y: 78, radio: 60, color: '#c9a6ff', fuerza: 0.26 }
  },
  {
    nombre: 'mediodia',
    desde: 9,
    hasta: 18,
    fondo: 'sprites/fondo-mediodia.webp',
    luz: { x: 34, y: 64, radio: 42, color: '#fff6e0', fuerza: 0.2 }
  },
  {
    nombre: 'atardecer',
    desde: 18,
    hasta: 21,
    fondo: 'sprites/fondo-dia.webp',
    luz: { x: 58, y: 80, radio: 66, color: '#ff9440', fuerza: 0.38 }
  },
  {
    nombre: 'noche',
    desde: 21,
    hasta: 6,
    fondo: 'sprites/fondo-noche.webp',
    luz: { x: 66, y: 84, radio: 50, color: '#3a4a7a', fuerza: 0 }
  }
];

export const VARS_LUZ = {
  x: '--luz-x',
  y: '--luz-y',
  radio: '--luz-radio',
  color: '--luz-color',
  fuerza: '--luz-fuerza'
};

// ---- Las transiciones entre tramos ----
//
// DECISIÓN CERRADA: tramos con transición, no crossfade continuo. Mezclar los
// dos fondos vecinos según la hora exacta obliga a tener dos imágenes de más de
// un mega superpuestas en memoria todo el tiempo, y en un celular de gama media
// no vale lo que aporta.
//
// La transición importa MÁS AL ABRIR que al cruzar. Casi nadie va a tener la app
// abierta justo en el minuto del cambio; en cambio todos abren después de horas
// y encuentran el galpón distinto. Es la misma lógica que los eventos: lo que
// pasó mientras no estabas se muestra, no se oculta.
export const DURACION_CRUCE_FONDO_MS = 2600;
export const DURACION_CRUCE_APERTURA_MS = 1500;

export const VARS_CRUCE_FONDO = {
  anterior: '--fondo-anterior',
  duracion: '--duracion-cruce-fondo'
};

export const CLASE_CRUCE_FONDO = 'cruzando-fondo';

// ---- La punta de la antena ----

// Dónde cae el bulbo de la antena en cada sprite, en % del lienzo. Medido uno
// por uno aislando la componente conexa de cian: la redondez del blob es lo que
// distingue el bulbo de las "Z" del standby y del cable de cargando, que son del
// mismo color y engañan a cualquier promedio.
//
// Antes el glow estaba clavado en la posición de idle y en las poses giradas
// quedaba corrido — hasta 10,5% del ancho en `jugando`, unos 39 px en pantalla,
// que se leía como un brillo suelto al lado de la antena. `cargando` está en
// tres cuartos y se corre 5,8%.
//
// Un estado sin entrada cae en idle, que es el default del CSS.
export const POSICIONES_ANTENA = {
  idle: { x: 50.0, y: 7.8 },
  feliz: { x: 53.8, y: 7.6 },
  critico: { x: 44.4, y: 7.5 },
  standby: { x: 50.0, y: 11.5 },
  // Remedida contra el sprite limpio. El sprite viejo tenía remolinos y cable
  // dibujados alrededor del bulbo, y eso corría el centroide del halo: el núcleo
  // se movió x -1,3 e y -1,7 entre las dos versiones, medido con el mismo
  // código y con umbral apretado al núcleo. Con umbral flojo la diferencia se
  // perdía en el halo y parecía que no había cambiado nada.
  cargando: { x: 42.9, y: 6.6 },
  jugando: { x: 60.5, y: 6.5 },
  limpiando: { x: 45.9, y: 8.8 },
  esperando: { x: 52.8, y: 8.1 },
  // La pose alternativa entra en la MISMA tabla que los estados, porque el glow
  // sigue al dibujo y no a la cadena. Medida con la misma receta: la corrida
  // sobre idle devolvió 50,0% / 7,8% clavado, que es el valor que ya estaba en
  // la tabla — o sea que la técnica reproduce lo anterior.
  'idle-manitos': { x: 51.7, y: 6.0 }
};

export const VARS_ANTENA = {
  x: '--antena-x',
  y: '--antena-y',
  // Y las de la inercia. Van en esta tabla y no en una propia porque son del
  // mismo sujeto: dónde está la antena y cómo se mueve. Ver ANTENA_INERCIA más
  // abajo, que trae la medición del poste.
  pivote: '--antena-pivote',
  extra: '--antena-extra',
  rebote1: '--antena-rebote-1',
  rebote2: '--antena-rebote-2',
  rebote3: '--antena-rebote-3',
  atraso: '--antena-atraso',
  sobrepaso: '--antena-sobrepaso',
  vaivenAngulo: '--antena-vaiven-angulo',
  vaivenCiclo: '--antena-vaiven-ciclo'
};

// ---- La luz de la cabeza ----
//
// DECISIÓN: el bulbo del sprite se TAPA con una capa dibujada por código, no se
// borra del PNG. Borrarlo dejaría un hueco en el poste que habría que
// reconstruir en los ocho sprites, y es irreversible. Taparlo no.
//
// Para taparlo hay que cubrirlo entero, y eso se midió: el núcleo brillante del
// bulbo tiene un radio de 7 a 9 px sobre el lienzo de 256 según la pose —o sea
// hasta 3,5% del contenedor— y su halo llega a 13. El disco va a 9% de diámetro,
// que cubre el peor caso con margen y sigue leyendo como un bulbo y no como un
// parche. Al ser porcentaje escala con Chip; el valor viejo eran 12 px fijos,
// que en una pantalla grande quedaban chicos.
export const DIAMETRO_BULBO = 9; // % del contenedor

// ---- LA ANTENA CON INERCIA ----
//
// Hoy el bulbo se mueve EXACTAMENTE con la cabeza: mismo ángulo, mismo
// instante. Una antena real tiene masa y va con retraso — sale detrás, y cuando
// el cuerpo frena ella sigue un momento más y vuelve oscilando. Eso es el
// follow-through de la animación clásica y es lo que hace que un personaje deje
// de leerse como una figura rígida.
//
// EL PIVOTE, MEDIDO, Y ES DE DÓNDE SALE EL RIESGO DE TODO ESTO.
//
// Medido sobre idle-cabeza.webp, contando el ancho de la corrida opaca fila por
// fila alrededor de x=128:
//
//   y 12-28   el bulbo, hasta 20 px de ancho (x119-138)
//   y 30-38   EL POSTE, 10 px de ancho (x124-133)
//   y 40-48   la base abriéndose contra el casco
//   y 50+     la cabeza, 80 px y subiendo
//
// O sea que el poste va de y≈29 a y≈48 y su base está en y=48, que son 28 px
// por debajo del centro del bulbo (y=20, o sea el 7,8% de POSICIONES_ANTENA).
// 28 sobre 256 son 10,9 puntos del lienzo, y ese es `pivote`.
//
// EL POSTE ESTÁ PINTADO EN EL SPRITE y el bulbo va por código. Rotar #antena
// mueve el bulbo y NO mueve el poste, así que todo ángulo que la antena gire de
// más respecto de la cabeza despega el bulbo de la punta del poste. La cuenta:
// el bulbo está a 28 px del pivote, o sea 0,49 px de lienzo por grado, que a la
// escala de pantalla —416 sobre 256— son 0,79 px por grado.
//
// Con eso, `extra` es el número que hay que cuidar. Es cuánto se queda inclinada
// la antena DE MÁS mientras la cabeza sostiene, en fracción del ángulo de ella:
// 0,4 sobre 3° son 1,2° y 0,95 px de despegue en pantalla, que es menos de un
// décimo del ancho del poste. El rebote llega al doble por un instante.
//
// Los valores del rebote son fracciones del mismo ángulo, y alternan de signo
// porque un resorte amortiguado pasa de largo para los dos lados. Cada uno más
// chico que el anterior.
export const ANTENA_INERCIA = {
  pivote: 10.9,
  extra: 0.4,
  rebote: [0.6, -0.3, 0.12],
  // El arranque: la antena sale ATRÁS de la cabeza —ángulo de signo contrario—
  // y recién después la pasa. Sin esta parte el retraso no se lee como masa, se
  // lee como que la antena llega tarde.
  atraso: -0.5,
  sobrepaso: 0.65,
  // Y EL VAIVÉN DE REPOSO. Nada se mueve perfectamente quieto. Ciclo largo y
  // desincronizado de la respiración a propósito: si compartieran período, las
  // dos cosas se leerían como una sola.
  vaiven: { angulo: 0.7, ciclo: 5500 }
};

// El color ES el estado. Cada uno con su núcleo —el centro caliente, casi
// blanco— y su cuerpo, que es lo que tiñe el halo.
//
// El ámbar de `cargando` y el rojo de `critico` son los dos que más trabajan:
// son los que avisan sin que haya que leer un número.
export const COLORES_BULBO = {
  idle: { nucleo: '#dffcff', cuerpo: '#22d3ee', halo: '#22d3ee' },
  feliz: { nucleo: '#eafeff', cuerpo: '#38e8ff', halo: '#38e8ff' },
  cargando: { nucleo: '#fff3d6', cuerpo: '#f0a326', halo: '#f0a326' },
  critico: { nucleo: '#ffd9d9', cuerpo: '#c2453f', halo: '#c2453f' },
  standby: { nucleo: '#cfe6f2', cuerpo: '#2a6f86', halo: '#2a6f86' }
};

// El destello blanco de una caricia o de un hallazgo NO es una entrada más de
// COLORES_BULBO, y esa fue la primera versión. Un color aparte obliga a cambiar
// las tres variables al prender y a devolverlas al apagar, y ese regreso es un
// salto de blanco a cian a plena opacidad — el defecto que se quería evitar.
//
// Se resuelve con `filter: brightness() saturate()` sobre el color del estado:
// subir el brillo y bajar la saturación DA blanco, y vuelve interpolando, así
// que el destello se apaga en vez de cortarse. Además funciona igual sobre el
// ámbar de cargando y el rojo de crítico, sin una entrada por estado.
export const DESTELLO_BULBO = { brillo: 2.6, saturacion: 0.15 };

// Cuánto late cada uno. `critico` no tiene ciclo propio acá: usa su propio
// keyframe irregular, el mismo criterio que el rayo del pecho — una luz que
// falla no late, tartamudea.
export const CICLOS_BULBO = {
  idle: 3100,
  feliz: 1500,
  cargando: 900,
  critico: 2300,
  standby: 5200
};

// Los dos extremos de opacidad del latido, por estado. `critico` baja mucho más
// que los otros: la luz casi se apaga entre pulso y pulso.
export const LATIDO_BULBO = {
  idle: { piso: 0.62, pico: 1 },
  feliz: { piso: 0.72, pico: 1 },
  cargando: { piso: 0.55, pico: 1 },
  critico: { piso: 0.18, pico: 0.86 },
  standby: { piso: 0.3, pico: 0.55 }
};

// EL RESPLANDOR SOBRE LA CABEZA. Es lo que hace que la luz se sienta como una
// FUENTE y no como un sticker luminoso: una mancha suave proyectada sobre la
// parte alta del casco, que late con el bulbo.
//
// Va en `screen` para que sume luz sobre el dibujo en vez de taparlo, y su
// tamaño es varias veces el del bulbo — una fuente chica ilumina un área grande.
export const RESPLANDOR_CABEZA = {
  diametro: 46, // % del contenedor
  // Cuánto más abajo del bulbo cae el centro del resplandor. La luz baña la
  // cabeza, que está abajo de la antena, no el aire que está arriba.
  corrimientoY: 9,
  opacidad: 0.5
};

// De noche la luz de la cabeza es la única fuente cálida de la escena, y se
// tiene que notar: el halo crece un 30%.
export const FACTOR_HALO_NOCHE = 1.3;

// Cuánto dura el destello blanco de una caricia o de un hallazgo.
export const DURACION_DESTELLO_BULBO_MS = 420;

export const VARS_BULBO = {
  diametro: '--bulbo-diametro',
  nucleo: '--bulbo-nucleo',
  cuerpo: '--bulbo-cuerpo',
  halo: '--bulbo-halo',
  ciclo: '--bulbo-ciclo',
  piso: '--bulbo-piso',
  pico: '--bulbo-pico',
  resplandorDiametro: '--resplandor-diametro',
  resplandorY: '--resplandor-y',
  resplandorOpacidad: '--resplandor-opacidad',
  haloNoche: '--halo-noche',
  duracionDestello: '--duracion-destello-bulbo',
  destelloBrillo: '--destello-brillo',
  destelloSaturacion: '--destello-saturacion'
};

export const CLASE_DESTELLO_BULBO = 'destellando';

// ---- Dónde apoyan las orugas ----
//
// La sombra estaba clavada al borde del canvas y Chip flotaba: el canvas mide
// 416 px en pantalla pero Chip no llega abajo del todo, así que la sombra
// quedaba unos píxeles por debajo de las orugas, descolgada.
//
// Esto es la línea de apoyo REAL, medida sprite por sprite: la fila más baja con
// cuerpo —al menos 6 píxeles opacos, para no morder una antiesquina suelta— y la
// huella, que son las columnas con cuerpo en las diez filas de arriba de esa
// línea. Diez y no una porque las orugas son redondas: en la última fila tocan
// 13% de ancho y en las diez, el 55% que es la huella de verdad.
//
// En `cargando` el cable y la ficha llegan al borde inferior del lienzo y daban
// 100%: se excluye el cian del cable y se toma el valor de las otras poses, que
// caen todas entre 95,7% y 96,9%. La ficha apoyada en el piso no es una oruga.
// ---- Los aros de las orugas ----
//
// MEDIDA A MANO, y ese fue el resultado de probar lo contrario. Cuatro métodos
// automáticos fallaron y quedaron documentados en EL-PORQUE.md; el techo era
// siempre el mismo, que la oruga no se distingue de lo que tiene encima ni por
// color ni por alfa.
//
// Se midió leyendo los nueve sprites contra una grilla de porcentajes cada 2,
// ampliados 5x. El control cruzado es APOYO_ORUGAS: la distancia del eje del aro
// a la línea de apoyo cae entre 8,7 y 10,6 puntos en los nueve, y el test de
// abajo exige que siga cayendo en esa banda. Si alguien agrega un sprite y le
// inventa los aros, ese rango lo caza.
//
// Los radios son de la ELIPSE pintada: el aro es un círculo visto en escorzo, o
// sea más alto que ancho.
export const AROS_ORUGA = {
  idle: [
    { x: 34.6, y: 87.4, rx: 2.6, ry: 4.1 },
    { x: 71.4, y: 87.3, rx: 3.0, ry: 4.4 }
  ],
  feliz: [
    { x: 33.0, y: 87.0, rx: 2.7, ry: 4.2 },
    { x: 72.4, y: 86.2, rx: 3.0, ry: 4.4 }
  ],
  critico: [
    { x: 32.2, y: 88.0, rx: 2.6, ry: 4.0 },
    { x: 72.6, y: 87.6, rx: 2.8, ry: 4.2 }
  ],
  standby: [
    { x: 32.8, y: 87.0, rx: 2.8, ry: 4.3 },
    { x: 74.8, y: 85.6, rx: 3.1, ry: 4.6 }
  ],
  cargando: [
    { x: 23.4, y: 87.6, rx: 2.7, ry: 4.2 },
    { x: 64.8, y: 88.0, rx: 2.6, ry: 4.0 }
  ],
  jugando: [
    { x: 37.4, y: 85.6, rx: 2.9, ry: 4.3 },
    { x: 72.8, y: 86.6, rx: 2.9, ry: 4.3 }
  ],
  limpiando: [
    { x: 36.0, y: 87.6, rx: 2.7, ry: 4.1 },
    { x: 71.8, y: 86.6, rx: 2.9, ry: 4.3 }
  ],
  esperando: [
    { x: 36.8, y: 87.0, rx: 2.8, ry: 4.2 },
    { x: 72.0, y: 86.8, rx: 2.9, ry: 4.3 }
  ],
  'idle-manitos': [
    { x: 36.0, y: 87.4, rx: 2.7, ry: 4.1 },
    { x: 71.6, y: 87.0, rx: 2.9, ry: 4.3 }
  ]
};

// EL REFLEJO QUE RECORRE EL ARO.
//
// La primera versión dibujaba una CHAVETA cruzando el cubo y la rotaba. Andaba,
// pero agregaba una pieza mecánica al arte, y el arte no se toca.
//
// Esto no agrega nada: los aros YA tienen un reflejo especular pintado, y lo
// que se anima es dónde está esa luz. Un metal que gira no cambia de forma —
// cambia dónde le pega la luz, y el brillo corre por el borde. Es la misma
// lógica que el bulbo de la antena: no se cambia el dibujo, se cambia la luz.
//
// Es un ARCO corto y no un punto: un punto de luz sobre un aro se lee como un
// LED, y un arco se lee como el filo del metal atrapando la luz.
export const REFLEJO_ARO = {
  // Cuánto del perímetro ocupa el arco de luz, de 0 a 1.
  arco: 0.17,
  // Grosor del trazo, en % del contenedor. Fino: es un filo, no un anillo.
  grosor: 0.85,
  // El naranja claro del propio aro, muestreado del arte: los píxeles más
  // brillantes del aro llegan a rgb(255, 216, 0).
  color: '#ffd84a',
  // En reposo el arco está QUIETO, apoyado donde pega la luz de la ventana —que
  // está a la izquierda— y muy tenue: ahí no es un efecto, es el reflejo que ya
  // estaba pintado. Al girar sube.
  opacidadReposo: 0.35,
  opacidadGiro: 0.95
};

// El giro, ahora medido en VUELTAS del reflejo y no en grados de una pieza.
export const GIRO_ORUGAS = {
  // Al ejecutar una acción: una vuelta rápida, como si se acomodara.
  acomodo: { duracion: 620 },
  // En jugando: continuo y lento. No es una rueda libre — es un cuerpo que se
  // mece en el lugar, así que la vuelta es pausada.
  mecida: { ciclo: 2400 }
};

// En reposo el reflejo está quieto: Chip no se mueve, y una luz corriendo
// sola por la rueda de un personaje parado se lee como un GIF en loop.

export const VARS_ORUGAS = {
  duracionAcomodo: '--acomodo-duracion',
  cicloMecida: '--mecida-ciclo',
  reflejoColor: '--reflejo-color',
  reflejoArco: '--reflejo-arco',
  reflejoHueco: '--reflejo-hueco',
  reflejoGrosor: '--reflejo-grosor',
  reflejoReposo: '--reflejo-reposo',
  reflejoGiro: '--reflejo-giro'
};

export const CLASE_ACOMODO = 'acomodando';

// ============================================================================
// EL POLVO DE LAS ORUGAS — punto 8
// ============================================================================
//
// La misma idea que el arco de luz en los aros: en vez de mover una pieza que no
// se puede mover, se cuenta el movimiento POR LO QUE PRODUCE. Las orugas no
// pueden rodar —el aro pintado es una elipse lisa, y rotarla sobre su centro la
// acuesta en vez de hacerla rodar— pero una oruga que gira levanta piso, y eso
// sí se puede dibujar.
//
// DÓNDE NACEN: en los puntos de contacto, que YA ESTÁN MEDIDOS. Salen de
// AROS_ORUGA, que trae los dos aros de cada pose en % del lienzo, cruzados
// contra APOYO_ORUGAS. No hay ninguna coordenada nueva acá: si alguien agrega
// una pose y le mide los aros, el polvo la acompaña sin tocar nada.
//
// CUÁNDO: sólo cuando las orugas giran, o sea en el cuarto de vuelta de una
// acción y en el mecerse de `jugando`. En reposo no hay polvo — es la misma
// regla que ya tienen los reflejos, y por el mismo motivo: una mota saliendo de
// un personaje quieto se lee como un GIF.
export const POLVO_ORUGAS = {
  // Dos por oruga. Tres ya se leen como humo, y la spec avisa: si se ve
  // claramente, está de más.
  porOruga: 2,

  // Ciclo corto: una mota de piso levantado no se queda flotando.
  ciclo: { min: 620, max: 880 },

  // A dónde va cada mota, en % del lienzo de 256. HACIA ATRÁS Y AFUERA respecto
  // del centro de Chip, y sube poco: el polvo de una oruga sale a ras del suelo,
  // no en una nube.
  //
  // `afuera` es hacia el borde más cercano —la oruga izquierda tira a la
  // izquierda y la derecha a la derecha— y ui.js le pone el signo por el lado
  // del aro, así que acá va sin signo.
  viaje: { afuera: 5.5, arriba: 2.6 },

  // El tamaño, en % del lienzo. Chico: una mota, no una bola.
  radio: { nace: 0.9, muere: 2.2 },

  // MUY TENUES, que es lo que la spec repite dos veces. 0,28 es el techo del
  // rango que pide (0,25 a 0,3) y es lo máximo que alcanza una mota a la mitad
  // de su vida; nace y muere en cero.
  opacidad: 0.28,

  // Desfasadas entre las dos orugas para que no salgan en espejo, y desfasadas
  // entre las motas de la misma oruga para que no salgan en abanico. En ms.
  desfase: { entreOrugas: 190, entreMotas: 130 }
};

// El color del polvo es EL DEL PISO, no blanco ni cian: el polvo es piso
// levantado. Sale del mismo tono que ya usa la sombra de contacto de las piezas
// —el gris de las baldosas de la panorámica, medido— y no de un gris inventado.
export const COLOR_POLVO = '#9aa3ad';

export const VARS_POLVO = {
  color: '--polvo-color',
  opacidad: '--polvo-opacidad',
  radioNace: '--polvo-radio-nace',
  radioMuere: '--polvo-radio-muere',
  afuera: '--polvo-afuera',
  arriba: '--polvo-arriba'
};

export const CLASE_POLVO = 'levantando-polvo';

// ---- POR QUÉ NO HAY UN TERCER ESCALÓN DE RECORTE ----
//
// Hubo uno: `idle-cuerpo-sin-orugas.png` como cuerpo, más `idle-orugas.webp`
// como capa propia encima, para que el polvo cupiera debajo de las orugas.
// Estuvo puesto y se sacó, y el motivo está medido.
//
// LOS DOS RECORTES NO COMPARTEN SU BORDE. Comparando el alfa de los tres
// sprites —los tres de 256x256, sin escalar— hay 787 píxeles que el cuerpo
// completo tiene y que las dos capas juntas NO cubren. La peor fila es y=245
// con 62, después y=246 con 54 y y=244 con 41; y hay un segundo grupo entre
// y=199 y y=206, las cuñas donde las orugas se juntan con las manos.
//
// LOS NÚMEROS VIAJAN CON SU DEFINICIÓN, que es una regla que costó una vuelta:
// "62" es el CENSO de la fila —agujeros en esa y, pegados o no— contado con
// alfa > 24 sobre 255. El tramo más largo de agujeros CONSECUTIVOS es otra
// cuenta y da 33, en y=244, de x=57 a x=89. Las dos describen la misma costura;
// publicar una sin decir cuál es hizo que otra medición diera 34 y no se
// pudiera cruzar. La página las imprime a las dos, más la misma medición
// repetida con seis umbrales de alfa.
//
// Dibujado: una costura vacía de 1 a 2 px que recorre todo el contorno exterior
// de las dos orugas. Uno de los dos recortes se comió un píxel más que el otro.
// Antes no se veía porque estaba todo pintado en un solo sprite; partirlo lo
// destapó. Eso es "las ruedas comidas" que se reportó.
//
// Y AL REVÉS TAMBIÉN: 44 píxeles que las capas tienen y el completo no. O sea
// que tampoco sirve dibujar el cuerpo completo abajo y las orugas encima: ese
// sobrante pintaría un fleco de 1 px por fuera de la silueta.
//
// LO QUE DECIDE ES QUE LA CAPA DE ORUGAS NUNCA SE MUEVE. Lo que gira es la barra
// del cubo, que está dibujada por código en el SVG; la imagen de las orugas se
// quedaba quieta. O sea que el recorte no compraba movimiento: compraba
// únicamente poder meter el polvo por debajo — y el polvo nace en la línea de
// apoyo, o sea POR DEBAJO del borde de la oruga, así que se ve igual sin la
// capa.
//
// Un recorte que cuesta 787 píxeles de agujero y no habilita nada no se
// sostiene. `idle-cuerpo-sin-orugas.png` queda en el repo y en ARCHIVOS_CACHE,
// sin cablear, y con este comentario al lado: el día que los dos recortes
// compartan borde —o que las orugas necesiten moverse de verdad— vuelve, y
// verificacion/capas.html es la página que lo comprueba.

// ============================================================================
// LA MIRADA — punto 6
// ============================================================================
//
// "Lo que hace que un personaje se sienta atento no es que te mire: es que dejó
// de mirar otra cosa para mirarte." La atención es un CAMBIO de estado y no un
// estado, así que hacen falta las dos mitades: una mirada que se va y una que
// vuelve.
//
// Sin arte nuevo. Lo que se mueve es la cabeza, que ya tiene su grupo, su pivote
// por pose y su animación de ladeo.
export const MIRADA = {
  // ---- La mirada que se va ----
  //
  // Si no pasa nada por 40 a 60 segundos, Chip se distrae y mira hacia la
  // ventana. Y SE QUEDA AHÍ: no vuelve solo. Ese "se queda" es la mitad que hace
  // que volver signifique algo — una cabeza que va y vuelve sola es un tic.
  seDistraeEn: { min: 40_000, max: 60_000 },

  // Hacia dónde. La ventana está a la IZQUIERDA de la escena, así que la cabeza
  // se ladea para ese lado: en pantalla eso es una rotación negativa, porque el
  // eje de rotación de CSS es horario.
  lado: -1,

  // Un poco más que el ladeo ocasional, que vale 3°: distraerse es un gesto más
  // marcado que una muletilla, y además tiene que durar.
  angulo: 4.5,

  // IRSE ES LENTO Y VOLVER ES RÁPIDO, y esa asimetría es el gesto entero.
  // Distraerse pasa sin que uno lo note; darse vuelta porque llegaste es un
  // movimiento con intención. Con los dos tiempos iguales no se lee ninguna de
  // las dos cosas.
  seVa: 1500,
  vuelve: 380,

  // LOS OJOS SE VAN CON LA CABEZA, y esto salió del experimento que el punto 6
  // pide hacer ANTES de encargar arte: "trasladá #ojos 3 px a un lado y mirá la
  // captura a 4×; si se lee como una mirada que se mueve, hay pupilas gratis".
  //
  // Se probó y se lee. Debajo de #ojos está #parpado, que es la forma de los
  // ojos rellena de un color plano; al correr la capa de arriba, del lado
  // contrario asoma ese crema — que es exactamente cómo se ve un ojo moviéndose
  // adentro de su cuenca. No se ve la capa despegada: no hay costura ni borde
  // suelto. O sea que no hace falta pedir un recorte de pupila.
  //
  // En píxeles del lienzo de 256, que es la unidad en la que están medidos todos
  // los recortes. Tres: con dos no se nota y con cuatro el aro de la cuenca
  // empieza a comerse el crema del otro lado.
  ojosPx: 3,
  lienzo: 256,

  // ---- La mirada que vuelve ----
  //
  // Al abrir la app, después del fundido: la cabeza se ladea y vuelve, el bulbo
  // pulsa y la respiración se acelera un momento. "Levantó la vista porque
  // entraste".
  //
  // Y ESCALA CON LA AUSENCIA. El dato ya existe: `horasFuera` sale de la visita.
  // Nada de culpa ni de reproche — es alegría proporcional. Gana el ÚLTIMO
  // escalón cuyo `desdeHoras` se haya superado.
  llegada: {
    retraso: 260,
    escalones: [
      // Volviste enseguida: no pasa nada. Un personaje que festeja cada vez que
      // mirás la pantalla se vuelve ruido en un día.
      { desdeHoras: 0, ladeos: 0, destella: false, respiracion: 1 },
      // Un rato: levanta la vista.
      { desdeHoras: 2, ladeos: 1, destella: true, respiracion: 1.35 },
      // Un día o más: dos ladeos y el bulbo más fuerte.
      { desdeHoras: 24, ladeos: 2, destella: true, respiracion: 1.6 }
    ],
    // Cuánto dura la respiración acelerada. Un segundo: es un sobresalto, no un
    // estado de ánimo.
    respiracionMs: 1100
  }
};

export const VARS_MIRADA = {
  angulo: '--mirada-angulo',
  lado: '--mirada-lado',
  seVa: '--mirada-se-va',
  vuelve: '--mirada-vuelve',
  ojos: '--mirada-ojos'
};

// `llegada.respiracionMs` NO viaja por el puente: lo usa un setTimeout de ui.js
// para sacar la clase, y el CSS no lo necesita. Estuvo un rato acá y el guardián
// del puente lo marcó como escrito sin lector, que es exactamente lo que era.

export const CLASE_DISTRAIDA = 'distraida';
export const CLASE_ATENTA = 'atenta';

// ---- LA SOMBRA SON DOS MANCHAS, no una elipse ----
//
// "Todo flota" era el reporte, y la sombra de Chip es la que más pesa porque es
// el objeto más grande. Era UNA elipse del ancho entero del apoyo, y eso tiene
// dos problemas que se ven aunque no se sepan nombrar: una mancha pareja debajo
// de un objeto se lee como una mancha, no como sombra; y una sombra tan ancha
// como el objeto lo despega en vez de apoyarlo.
//
// Chip apoya en DOS ORUGAS y entre ellas no hay nada. Medida la huella de
// contacto —las columnas con alfa en los últimos 4 px antes de la línea de
// apoyo, donde ya no hay cuerpo y sólo quedan las orugas—:
//
//   idle       x 29,9 ancho 12,5   |   x 64,6 ancho 15,6
//   feliz      x 26,4 ancho 10,9   |   x 63,7 ancho 14,5
//   critico    x 25,8 ancho 11,3   |   x 62,9 ancho 15,2
//   standby    x 27,9 ancho  7,8   |   x 63,3 ancho 15,2
//   limpiando  x 30,3 ancho 11,7   |   x 63,9 ancho 14,1
//   esperando  x 30,5 ancho 15,2   |   x 64,8 ancho 15,2
//
// `cargando` y `jugando` devuelven UNA sola huella, y no es un error de la
// medición: en esas dos poses una oruga está más alta y no toca el piso a la
// misma altura que la otra. Por eso las manchas NO van en una tabla por pose
// sino en fracciones de la caja de apoyo, que ya viene por pose de APOYO_ORUGAS:
// así siguen a la pose sin necesitar una fila por cada una, y las dos poses
// asimétricas no quedan con media sombra.
//
// Las fracciones salen de la tabla de arriba. Para idle, con la caja de apoyo en
// x 21,5 y ancho 54,7, las huellas caen en el 15,4% y el 78,8% de la caja y
// miden el 22,9% y el 28,5% de su ancho. Redondeado y promediado sobre las seis
// poses simétricas queda esto.
export const SOMBRA_CHIP = {
  huellas: [
    { x: 16, ancho: 26 },
    { x: 79, ancho: 30 }
  ],
  // Más densa en el punto de contacto y muriendo rápido: es lo que separa una
  // sombra de una mancha. El alfa lo multiplica después la opacidad del keyframe
  // de la respiración — ojo con eso, ya mordió una vez.
  alfa: 0.78,
  // Dónde se termina cada mancha, en % de su propio radio. Corto: una caída
  // larga vuelve a dar la mancha pareja que se quiere evitar.
  caida: 58,
  desenfoque: 2.5
};

export const APOYO_ORUGAS = {
  idle: { y: 96.5, x: 21.5, ancho: 54.7 },
  feliz: { y: 96.9, x: 17.6, ancho: 58.6 },
  critico: { y: 96.9, x: 17.2, ancho: 59.0 },
  standby: { y: 96.9, x: 17.6, ancho: 59.8 },
  // Remedido contra el sprite limpio: la medición vieja del apoyo estaba
  // contaminada por el cable dibujado, que bajaba hasta el borde inferior del
  // lienzo. Comparando viejo y nuevo en la MISMA fila, el delta es x -1,6 y
  // ancho +0,8; se aplica ese delta y no el valor absoluto, para no cambiar de
  // convención respecto del resto de la tabla.
  cargando: { y: 96.5, x: 23.8, ancho: 57.1 },
  jugando: { y: 96.1, x: 28.1, ancho: 48.0 },
  limpiando: { y: 96.5, x: 21.5, ancho: 54.3 },
  esperando: { y: 95.7, x: 21.1, ancho: 55.5 },
  'idle-manitos': { y: 96.1, x: 19.5, ancho: 56.6 }
};

// LA MISMA SOMBRA DE CONTACTO, para lo que apoya y no es Chip: las piezas de la
// repisa y la que quedó tirada en el piso.
//
// Hoy las piezas tienen un `drop-shadow` que sigue la silueta y va 1 px abajo.
// Eso es una sombra ARROJADA —la que un objeto proyecta— y sirve para despegarlo
// del fondo, pero no lo apoya: una silueta borrosa un píxel más abajo se lee
// como relieve, no como contacto. Lo que apoya es una mancha corta y densa
// DEBAJO, y las dos cosas no se pisan, se suman.
//
// `ancho` en % del objeto, y va abajo de 100 a propósito: el error clásico es
// hacerla del ancho del objeto o más, y eso lo despega. La sombra de contacto es
// lo que TOCA el piso, que siempre es menos que la silueta.
export const SOMBRA_OBJETO = {
  ancho: 62,
  alto: 5,
  alfa: 0.6,
  desenfoque: 1.5
};

export const VARS_SOMBRA = {
  y: '--apoyo-y',
  x: '--apoyo-x',
  ancho: '--apoyo-ancho',
  // Y la forma de adentro de esa caja: las dos manchas, su densidad y su caída.
  // Van en esta tabla y no en una propia porque son del mismo sujeto — dónde
  // apoya Chip y cómo se ve esa huella. Ver SOMBRA_CHIP arriba.
  alfa: '--sombra-alfa',
  caida: '--sombra-caida',
  desenfoque: '--sombra-desenfoque',
  huella1X: '--sombra-huella-1-x',
  huella1Ancho: '--sombra-huella-1-ancho',
  huella2X: '--sombra-huella-2-x',
  huella2Ancho: '--sombra-huella-2-ancho',
  // Y la de las piezas que apoyan en la repisa y en el piso.
  objetoAncho: '--sombra-objeto-ancho',
  objetoAlto: '--sombra-objeto-alto',
  objetoAlfa: '--sombra-objeto-alfa',
  objetoDesenfoque: '--sombra-objeto-desenfoque'
};

// ---- La pantalla del pecho ----
//
// El display del torso estaba PINTADO en los siete sprites y decía siempre
// "100%". Era la única cosa del juego que mentía: Chip podía estar con la
// batería en 12 y mostrar el instrumento lleno.
//
// Esta tabla es dónde cae el vidrio de esa pantalla en cada sprite, en % del
// lienzo de 256, medida con la misma disciplina que POSICIONES_ANTENA: aislar
// por una firma que separe, quedarse con la componente conexa, y MIRAR la caja
// dibujada encima del sprite antes de darla por buena.
//
// Hicieron falta dos métodos, porque ninguno solo resuelve los nueve sprites:
//
//   vidrio — el color del cristal. Muestreado adentro de la pantalla de idle, es
//            un azul-verde muy oscuro (r≈0, g 19-36, b 36-56); la firma
//            `b - r >= 26` con luminancia baja no la tiene nada más, porque el
//            contorno negro tiene b-r≈0 y la chapa del pecho es cálida. Falla en
//            `critico`, donde la pantalla está en alarma y el cristal se pinta
//            gris, y en `cargando`, donde el cable cian comparte la firma.
//
//   hueco  — el agujero oscuro más grande adentro de la placa del pecho.
//            Topológico y no cromático, así que sirve justo donde falla el otro.
//
// La elección entre los dos no es a ojo: una pantalla válida entra en la placa
// del pecho, ocupa entre 14% y 27% del ancho del lienzo y tiene relación de
// aspecto entre 1,15 y 2,3. Sin la condición de la placa, en `critico` el
// método del vidrio elegía un recorte de más abajo que pasaba las pruebas de
// forma, y en `esperando` elegía los antebrazos cruzados.
//
// `giro` sale de ajustar una recta al borde superior del cristal, columna por
// columna, descartando el 12% de cada punta por las esquinas redondeadas. Todos
// los sprites tienen la pantalla algo inclinada salvo idle y limpiando, que
// están de frente. El residuo del ajuste es de 0 a 0,4 px en las poses
// frontales y sube a 2,9 px en `cargando`: ahí la pantalla no está inclinada
// sino EN PERSPECTIVA —es un trapecio, no un rectángulo girado— y 2,5° es la
// mejor aproximación de un giro plano.
//
// `vidrio` es el color de fondo, la moda de los píxeles oscuros de adentro de
// cada pantalla. Cambia de sprite a sprite porque cambia la iluminación de la
// pose, y por eso no hay un solo color para todas.
//
// A los dos que salieron por el método del hueco —critico y cargando— se les
// erosionó el borde después, porque ese método se come el bisel de alrededor y
// deja la caja unos píxeles más grande. El corte de la derecha lo marca el
// separador del rayo: el rayo vive en su propio recuadro, al lado del cristal,
// y no forma parte de la pantalla. Con el bisel adentro, en la captura ampliada
// el reemplazo de `cargando` se comía el marco y el rayo del arte.
//
// Todas las cajas caen entre 17,2% y 18,3% de ancho, que es la confirmación de
// que los dos métodos están midiendo la misma cosa.
export const PANTALLAS_PECHO = {
  idle: { x: 37.5, y: 61.3, ancho: 17.2, alto: 12.5, giro: 0, vidrio: '#001e30' },
  feliz: { x: 36.3, y: 60.9, ancho: 18.0, alto: 12.9, giro: 2.3, vidrio: '#001c2e' },
  critico: { x: 34.0, y: 65.2, ancho: 17.2, alto: 11.3, giro: 6.8, vidrio: '#0f1825' },
  standby: { x: 37.9, y: 63.7, ancho: 17.2, alto: 12.5, giro: 0.7, vidrio: '#00283f' },
  // REMEDIDO. Estaba en y 62,1 / alto 11,7: el recuadro entraba 0,8 puntos
  // abajo del cristal y le faltaban 1,2 de alto, así que la pantalla viva
  // quedaba corrida hacia abajo y sin llenar el vidrio pintado.
  //
  // La medición vieja se hizo buscando "oscuro y azulado" en el torso, y en esta
  // pose eso agarra también la sombra del hombro y el cable, que son del mismo
  // tono. La nueva arranca del CONTENIDO cian del display —que no se confunde
  // con ninguna sombra— y crece desde ahí sólo por vidrio oscuro; el cable, que
  // es cian brillante, no es vidrio y no la deja fugarse.
  // giro 0 y no 2,5. El marco pintado de esta pose es HORIZONTAL —se ve con una
  // guía recta encima del bisel: las dos aristas corren paralelas al borde del
  // lienzo— así que el 2,5 estaba inclinando el contenido adentro de un marco
  // recto. El número venía de suponer que el torso en tres cuartos arrastraba al
  // display, y no: el display está pintado de frente.
  //
  // REMEDIDO OTRA VEZ, y esta vez contra el bisel. Sacado el giro, lo que
  // quedaba mal era la caja: 41,8/60,6/18,7x12,9 tomaba el borde EXTERNO del
  // bisel arriba y a la izquierda, y se pasaba tres puntos y medio por abajo del
  // cristal. Un recuadro que tapa su propio marco y desborda hacia el torso se
  // lee como una pantalla chueca aunque esté perfectamente derecha.
  //
  // El método: perfiles de luminancia sobre el sprite limpio, que dan las dos
  // aristas verticales sin discusión —el vidrio corre de 43 a 60,2 con los
  // brillos del bisel en 41-41,8 y 60,5-61,3— y después el recuadro magenta
  // encima del sprite al 900% para las cuatro aristas juntas. Los detectores
  // automáticos no sirvieron acá: "oscuro y azulado" agarra medio torso, y el
  // contenido cian agarra la antena, el rayo y los hombros.
  cargando: { x: 43.5, y: 61.9, ancho: 17.1, alto: 9.5, giro: 0, vidrio: '#002137' },
  jugando: { x: 39.5, y: 57.0, ancho: 17.6, alto: 14.1, giro: 7.4, vidrio: '#001c2e' },
  limpiando: { x: 37.9, y: 60.9, ancho: 16.4, alto: 13.3, giro: 0, vidrio: '#001e31' },
  'idle-manitos': { x: 39.1, y: 60.2, ancho: 17.6, alto: 11.3, giro: 4.5, vidrio: '#002a3c' }
  // `esperando` no está, y no es un olvido: los antebrazos cruzados tapan la
  // pantalla entera. No hay nada que redibujar.
};

// En qué estados la pantalla se redibuja viva. NO es "en todos", y la razón es
// que el arte de los otros dos ya dice la verdad:
//
//   standby  muestra una luna. No hay número, no hay mentira: Chip duerme.
//   critico  muestra la batería vacía en rojo, que es exactamente lo que pasa
//            cuando el stat está abajo de JUGAR_BATERIA_MINIMA.
//
// Taparlas sería reemplazar un dibujo correcto por uno peor.
export const ESTADOS_CON_PANTALLA_VIVA = [
  'idle',
  'idle-manitos',
  'feliz',
  'cargando',
  'jugando',
  'limpiando'
];

// Cuántos segmentos tiene el instrumento. Son seis porque son seis los que están
// dibujados en el sprite: el reemplazo tiene que leerse como el mismo aparato.
export const SEGMENTOS_PANTALLA = 6;

// LA PANTALLA ES UN LAYOUT FIJO ESCALADO, no un porcentaje de cada recuadro.
//
// Ese era el bug, y se ve con la batería en el mismo valor en los siete estados:
// las barritas cambian de proporción de un estado a otro. Medido en pantalla,
// alto/ancho de una barrita:
//
//   cargando  2,29     jugando  2,32     feliz  2,55
//   idle      2,84     limpiando 3,17
//
// 38% de dispersión. Y el número, de 7,0 px de alto en idle a 10,0 en jugando:
// 43%. A 7 px una tipografía de píxeles de 3x5 le toca 1,4 px por fila y la
// última se la come el antialias — de ahí el "el porcentaje sale cortado abajo".
//
// LA CAUSA. Las cajas de adentro estaban en % del RECUADRO DE CADA SPRITE, y
// esos recuadros no tienen la misma proporción: van de 1,186 (jugando, que se
// inclina hacia adelante) a 1,505 (cargando). Un 27% de diferencia de aspecto
// que se traslada entero al contenido.
//
// LA REGLA AHORA. El contenido vive en una caja de proporción FIJA que se mete
// adentro del recuadro de cada sprite como un `contain`: se escala hasta el
// límite que toque y se centra. Lo único que cambia entre estados es DÓNDE se
// ancla y A QUÉ ESCALA — nunca la geometría de adentro. Si un recuadro tiene
// otra proporción, sobra un poco de cristal arriba y abajo o a los costados, y
// eso está bien: es fondo, no contenido.
//
// La proporción de referencia es la de idle, que es la pose frontal: 17,2/12,5.
export const ASPECTO_PANTALLA = 1.376;

// Dónde cae cada cosa adentro de esa caja de contenido, medido sobre idle.webp
// aislando los píxeles encendidos del display (cian claro) y separándolos por
// fila. El hueco más grande cae en el 62,5% del alto y parte los dos bloques:
//
//   barras   x 15,9%  ancho 70,5%   y 21,9%  alto 37,5%
//   número   x 25,0%  ancho 54,5%   y 65,6%  alto 21,9%
export const CAJA_SEGMENTOS = { x: 16, y: 22, ancho: 70, alto: 37 };
export const CAJA_NUMERO = { y: 65.5, alto: 22 };

// El alto del glifo, en % del alto de la CAJA DE CONTENIDO. Sale de la misma
// medición: el bloque del número ocupa el 21,9% del display en el arte. Antes
// eran 15 cqh del recuadro del sprite, que en idle daban 7 px contra los 10 que
// tiene el arte.
export const ALTO_NUMERO = 21;

// ---- Las nubes de la ventana ----
//
// La abertura, medida sobre fondo-mediodia aislando la componente conexa de
// cielo (azul saturado y claro): x 2,8% a 38,3% de la escena, y 5,6% a 58,9%.
// Son 171 x 502 px de escena — una ventana alta y angosta, que ahora ocupa más
// de la mitad del alto.
export const ABERTURA_VENTANA = { x: 2.8, y: 5.6, ancho: 35.5, alto: 53.3 };

// EL VIDRIO, que no es la caja de arriba.
//
// La caja es el rectángulo que envuelve a la ventana; el hueco de verdad tiene
// el marco dibujado EN PERSPECTIVA, con el borde de arriba bajando en diagonal
// hacia la derecha y la esquina redondeada. La lluvia se recortaba con una
// elipse —`ellipse 78% 88% at 50% 42%`— que tapaba las esquinas pero dejaba
// pasar los bordes de en medio, así que caía sobre la chapa del marco. Se ve en
// captura, y se ve mejor todavía pintando las gotas de rojo y sacando la
// máscara, que es como se confirmó.
//
// OJO CON CÓMO SE MIDE ESTO. El reporte decía que las gotas van de y -0,3% a
// y 81,6%, o sea muy por debajo del vidrio, y ese número sale de
// getBoundingClientRect sobre las gotas: un rect no sabe nada del `overflow:
// hidden` del padre, así que devuelve dónde estaría la gota si nadie la
// recortara. Recortada está. Lo que sí se pinta afuera es otra cosa y más chica:
// el filo del marco. Décima entrada de la tabla del README.
//
// La forma sale del arte. En `fondo-dia` el cielo mide entre 180 y 235 de
// luminancia y el marco entre 40 y 130 —separación limpia, alcanza un umbral— y
// el hueco resulta ser: x 148 a 319 de la panorámica, y 58 a 578, con el borde
// de arriba barriendo de x=163 en y=60 hasta x=319 en y=150. Es el mismo agujero
// en la misma pared en los cuatro fondos, así que alcanza con medirlo en uno.
//
// Los pares van en % de la CAJA —no de la escena— porque es ahí donde se aplica
// el clip-path, y llevan 1 punto de retiro contra el filo medido.
export const VIDRIO_VENTANA = [
  [1.5, 2.2],
  [10.3, 2.6],
  [33.8, 6.5],
  [58.6, 10.5],
  [82.7, 14.5],
  [97.5, 17.6],
  [99, 20.6],
  [99, 100],
  [1.5, 100]
];

export const VARS_VIDRIO = { forma: '--vidrio-ventana' };

// DECISIÓN: las nubes se generan por código y se mueven ENCIMA del cielo
// pintado, en vez de recortar las de la panorámica y desplazarlas.
//
// Recortarlas no cierra por dos motivos medidos. Uno: la abertura tiene 171 px
// de ancho en la panorámica, así que deslizar una copia de la imagen mete el
// marco de la ventana en cuadro después de veinte píxeles — muy lejos de "una
// vuelta cada varios minutos". Dos: para que el loop fuera de verdad infinito
// habría que sacar el parche de cielo a un archivo aparte y hacerlo tileable, y
// eso son cuatro assets nuevos justo cuando el peso de instalación es la
// prioridad número uno.
//
// Generadas, el loop es exacto por construcción —la banda se repite y se
// desplaza justo un ancho de patrón—, no pesan un byte, y el cielo del artista
// queda intacto abajo: estas nubes pasan por delante, no lo reemplazan.
// DOS BANDAS A DISTINTA VELOCIDAD, y el ciclo bajado de 240 s a 80.
//
// Cuatro minutos por vuelta es el mismo error de calibración que tuvimos con el
// polvo: sutil hasta volverse inexistente. Una sesión de este género dura menos
// de un minuto, así que en 240 s de ciclo el jugador ve una foto fija — el
// movimiento existe y es medible, pero no le pasa a nadie.
//
// A 80 s, veinte segundos de mirar la ventana alcanzan para notar que algo se
// corrió, y sigue siendo un andar de nube y no un timelapse.
//
// Y una sola banda deja el cielo plano por más que se mueva: sin nada que se
// mueva a otra velocidad no hay con qué comparar, y el ojo no lee profundidad.
// La segunda banda va al DOBLE de lento, más chica y más tenue, y abajo, cerca
// del horizonte — que es donde caen las nubes lejanas cuando mirás el cielo por
// una ventana, no arriba.
// CINCO BANDAS. Eran dos, y dos alcanzaban para que el cielo dejara de estar
// plano pero no para que tuviera profundidad: con dos velocidades el ojo lee
// "hay algo adelante y algo atrás", no "hay cielo".
//
// Las velocidades son MUY distintas entre sí a propósito. Dos capas que van a
// 80 y 95 segundos se leen como una sola capa con ruido; lo que construye
// distancia es que la más rápida tarde cuatro veces menos que la más lenta.
//
// Y la regla de perspectiva, que es la que ordena la tabla entera: lo que está
// CERCA se mueve rápido, es chico en la ventana y se ve nítido; lo que está
// LEJOS se mueve lento, ocupa más y se difumina. Por eso la banda de 60 s es la
// más chica y tenue —está cerca, apenas asoma— y la de 260 s es la más grande y
// difusa. Al revés se lee como un error de escala.
//
// `y` y `alto` recortan la franja de la ventana donde vive cada banda: las
// lejanas caen cerca del horizonte, que es donde están cuando mirás el cielo de
// verdad. `fase` corre el patrón para que las cinco no repitan la misma silueta
// en la misma columna.
export const BANDAS_NUBES = [
  { ciclo: 60_000, escala: 0.55, alfa: 0.45, y: 6, alto: 46, fase: 0, deforma: false },
  { ciclo: 95_000, escala: 0.85, alfa: 0.75, y: 0, alto: 58, fase: 37, deforma: false },
  { ciclo: 140_000, escala: 1, alfa: 1, y: 10, alto: 64, fase: 71, deforma: true },
  { ciclo: 190_000, escala: 1.25, alfa: 0.6, y: 30, alto: 60, fase: 19, deforma: true },
  { ciclo: 260_000, escala: 1.6, alfa: 0.38, y: 46, alto: 54, fase: 53, deforma: true }
];

// De noche TODO afloja con el mismo factor. Frenar sólo algunas rompería la
// proporción entre ellas, que es de donde sale la profundidad, justo cuando el
// cielo es más plano y más la necesita.
export const FACTOR_NUBES_NOCHE = 1.6;

// LA DEFORMACIÓN. Una nube no es rígida: se estira mientras cruza. Va sólo en
// las bandas lentas —las de lejos— porque en las rápidas el cruce dura tan poco
// que no se llega a leer, y en cambio sí se nota el costo.
//
// El recorrido es 1 -> 1.08 -> 1 y no 1 -> 1.08 a secas: una rampa de ida sola
// vuelve de golpe al reiniciar el ciclo, y ese salto se ve. Ida y vuelta cierra.
export const DEFORMACION_NUBE = 1.08;

// LA NUBE OCASIONAL. Cada tanto pasa una sola, rápido, y después no está más.
// Es lo que hace que mirar la ventana tenga premio: si todo se repite con el
// mismo período, a los dos minutos ya viste el cielo entero.
//
// No aparece de noche. Una nube suelta cruzando rápido contra el cielo nocturno
// se lee como un objeto, no como clima.
export const NUBE_RAPIDA = {
  cruce: { min: 25_000, max: 30_000 },
  espera: { min: 180_000, max: 360_000 },
  escala: 0.7,
  alfa: 0.8,
  y: 14,
  alto: 44
};

// El color de las nubes sale del momento del día: blancas al mediodía, lilas al
// amanecer, doradas al atardecer y casi invisibles de noche. Es el mismo
// criterio que el resto de la escena — nada tiene color propio, todo lo toma de
// la hora.
// Los alfas SUBIERON, y el que más el del mediodía. El cielo del mediodía es lo
// más claro del juego y ya trae cúmulos pintados: blanco al 0,3 encima de eso no
// se ve, medido con dos capturas a 15 segundos. Cuanto más claro el cielo, más
// alfa necesita la capa para existir — al revés de lo que uno supone.
//
// Con cinco bandas superpuestas el alfa de cada una se multiplica por su factor
// de banda, así que el total no se dispara: la suma de los cinco factores es
// menor que 3,2 y ninguna banda sola llega al alfa de acá.
export const COLORES_NUBE = {
  amanecer: { color: '#ffffff', alfa: 0.3 },
  mediodia: { color: '#ffffff', alfa: 0.5 },
  atardecer: { color: '#ffe6b8', alfa: 0.38 },
  noche: { color: '#93a6d8', alfa: 0.1 }
};

export const VARS_NUBES = {
  x: '--ventana-x',
  y: '--ventana-y',
  ancho: '--ventana-ancho',
  alto: '--ventana-alto',
  color: '--nube-color',
  alfa: '--nube-alfa',
  escala: '--banda-escala',
  alfaBanda: '--banda-alfa',
  bandaY: '--banda-y',
  bandaAlto: '--banda-alto',
  fase: '--banda-fase',
  cicloBanda: '--banda-ciclo',
  deformacion: '--nube-deformacion',
  factorNoche: '--nubes-factor-noche',
};

// ---- "Estoy bien, gracias" ----
//
// Cuando una acción no hace falta, el botón se apaga Y Chip contesta algo. El
// tono es deliberado: no es "no se puede", es "ya estoy atendido". Por eso el
// símbolo es un tilde y no una cruz, y por eso dura poco — es un acuse de
// recibo, no un cartel de error.
//
// Aparece en la pantalla del pecho, que es donde Chip ya habla: usa la misma
// caja medida y la misma fuente de píxeles que el número de batería. Inventarle
// una burbuja de diálogo aparte habría sido un segundo idioma para lo mismo.
export const DURACION_ESTOY_BIEN_MS = 1600;
export const CLASE_ESTOY_BIEN = 'estoy-bien';

// ---- La repisa alta ----
//
// Los objetos estaban en el alféizar, a media altura y al lado de Chip, y se
// leían como iconos de interfaz pegados sobre el galpón: tres formas sueltas
// en el aire contra la pared.
//
// DÓNDE SE APOYAN AHORA, y por qué esta y no las otras dos candidatas:
//
//   la pared derecha  ELEGIDA. Medida banda por banda, es plana y oscura entre
//                     el 8% y el 22% del alto —desvío estándar de 8 sobre una
//                     media de 35— y tiene una costura de panel justo debajo,
//                     en 24-26%, que le da a la repisa dónde apoyarse.
//                     Lejos de Chip, que arranca en el 38%. Y el fondo oscuro
//                     hace que las piezas metálicas se despeguen solas.
//   el travesaño de   Descartada: no es horizontal, es una moldura en diagonal,
//   la ventana        y está sobre el cielo. Los objetos quedarían a contraluz,
//                     que es justo donde el contorno oscuro deja de servir.
//   la repisa del     Descartada: lo que parecía un borde es una costura de
//   portón            chapa, no un saliente. No hay dónde apoyar.
//
// La repisa se dibuja por código, con los soportes en L y el canto frontal.
// LA REPISA, remedida y bajada.
//
// Estaba en y 19,5% y ahí se le montaba encima a los tubos de la pared. No se
// eligió el lugar nuevo a ojo: se midió el desvío estándar de luminancia por
// franja horizontal, sobre la mitad derecha de lo que SE VE de la panorámica —no
// de la imagen entera, que es más ancha que la escena— y en los CUATRO fondos,
// porque la repisa está siempre y tiene que caer bien en los cuatro.
//
// El perfil sube monótono hacia abajo: 9,9 en y=8,5% y 13,7 en y=24,9%. O sea
// que la pared se ensucia a medida que baja, y 19,5% cae justo donde arranca la
// subida. Hay dos zonas limpias:
//
//   y = 6 a 12%   la más lisa (sd 10,0), pero ahí arriba está el botón del menú
//   y = 26 a 28%  un mínimo local (sd 13,0), DEBAJO de los tubos
//
// Se elige la segunda. La primera es más lisa pero pelea con el botón del menú,
// y además la instrucción era bajarla: una repisa alta obliga a mirar arriba y
// la colección deja de estar a la altura de Chip.
//
// Y achicada: de 40% de ancho a 34. Con dos estantes ocupa más alto, y mantener
// el ancho la habría vuelto el objeto más grande de la pared.
// y=29,5 y no 26,5. La pared tiene conductos VERTICALES con ménsulas
// horizontales, y 26,5% caía sobre la primera de ellas: la tabla quedaba
// montada encima en vez de apoyada debajo. La siguiente línea horizontal libre,
// medida con una escala de porcentajes sobre la escena renderizada, está en
// 29,5%.
//
// Y de 34% de ancho a 28. Con dos tablas y ménsulas visibles, 34% la volvía la
// pieza más grande de la pared; a 28 son 109 px en un viewport de 390, contra
// los 133 de antes.
// x 70 y no 60. El problema no era la ALTURA sino que la repisa CRUZABA los
// conductos verticales de la pared, que bajan por x 52-58% y x 63-68%: su
// tercio izquierdo quedaba montado encima de ellos. Corrida a 70-95% apoya en
// pared limpia y la altura se queda donde estaba.
// CENTRADA EN EL HUECO QUE DEJAN LOS CONDUCTOS, no pegada a un borde.
//
// El ancho de 26 se quedó: con la tabla llegando al 95 las piezas de las últimas
// posiciones se salían del cuadro —medido: el borde derecho de la cuarta caía en
// 101,1%— y eso lo arregló la grilla del CSS, no el ancho.
//
// Lo que estaba mal era el ARRANQUE. Al alargarla se la corrió a x=64 y volvió a
// montarse sobre los conductos verticales de la pared, que es el problema que ya
// se había corregido una vez.
//
// LOS CONDUCTOS, MEDIDOS y no estimados: se calculó el gradiente vertical del
// fondo columna por columna, en la banda de alto donde vive la repisa (26,5% a
// 38,7%), mapeando la imagen a la escena con FONDO_CORRIMIENTO. Contra un
// gradiente medio de 3,4, los bordes marcados caen en:
//
//   45-49%     el marco de la ventana (el más fuerte, pico de 28)
//   58-62%     el primer conducto
//   65-66,5%   el segundo
//   77-78%     una junta de panel, mucho más suave (14 contra 28)
//   80-100%    pared lisa: entre 0 y 1, sin un solo borde
//
// O sea que el hueco libre de conductos va de 66,5% a 100%: mide 33,5. Con la
// repisa en 26, centrada quedan 3,75 de margen a cada lado, y de ahí el 70,5.
//
// La junta de 77-78% queda DEBAJO de la tabla y no hay forma de evitarla: una
// repisa de 26 en un hueco de 33,5 la cruza sí o sí. Pero es una junta de chapa,
// no un caño: no tiene volumen y la tabla no se monta sobre nada.
export const REPISA = { x: 70.5, y: 29.5, ancho: 26, alto: 3.4 };

// DOS ESTANTES. La separación va en % de la escena, igual que el resto de la
// geometría de la pared, para que el hueco entre tablas no cambie con el
// viewport. 6,2% es lo que entra una pieza de las grandes con aire arriba: menos
// y la fila de abajo se lee apretada contra la de arriba.
// CUÁNTAS PIEZAS ENTRAN POR TABLA, medido y no elegido: con las tablas donde
// están, cuatro de 27 px llenan los 110 px útiles y la quinta ya obliga a la
// grilla a achicarlas. Con dos estantes son ocho, que es exactamente lo que el
// pool tenía cuando la repisa era el inventario entero.
//
// Ahora el pool son 36 y la repisa muestra las ÚLTIMAS ocho. Ver pintarEstante:
// el desvío está explicado ahí.
export const PIEZAS_POR_ESTANTE = 4;

export const ESTANTES = 2;
export const SEPARACION_ESTANTES = 6.2;

// Está por encima del horizonte —el borde del alféizar, en el 63% del alto— así
// que se ve DESDE ABAJO. Los objetos se achatan un poco en vertical y su base
// queda tapada por el canto de la tabla, que es exactamente lo que pasa cuando
// mirás una repisa alta.
export const ACHATADO_REPISA = 0.88;

// El contorno de cada pieza en un tono OSCURO DE SU PROPIO COLOR, no negro. Es
// la regla que salió de los corazones: el negro hunde la forma, y un tono
// oscuro del mismo tinte la despega sin ensuciarla. Las piezas de metal comparten
// el azul-gris; las dos de acento tienen el suyo.
// DÓNDE TERMINA LA TINTA DE CADA SILUETA, en unidades del viewBox de 24.
//
// Ninguna llega hasta abajo del todo y NO todas terminan en el mismo lugar, así
// que un corrimiento único —lo que había al principio, el promedio— deja a las
// dos puntas mal: unas hundidas en la tabla y otras flotando por encima.
//
// Remedida con `getBBox()` sobre el SVG ya montado, más la mitad del ancho de
// trazo, que es tinta y el bbox de geometría no la cuenta. La tabla anterior
// estaba a ojo en seis de las ocho —hasta 0,7 unidades, que a 30 px de pieza son
// 0,9 px— y ese error es exactamente el síntoma que se ve: unas hundidas y otras
// flotando, sin patrón.
//
// La medición vieja fallaba por circular: se verificaba con el mismo detector
// que la había producido. getBBox no sabe nada de esta tabla.
export const BASES_OBJETO = {
  'tuerca-cabeza': 20.6,
  'cable-enrollado': 18.6,
  resorte: 20.6,
  'arandela-dorada': 21.6,
  'cosa-sin-nombre': 19.08,
  'tornillo-perfecto': 21.6,
  'nota-tanque': 21.6,
  'marca-derrape': 20.6,
  'bulon-doce': 20.6,
  'chapa-pez': 18.6,
  'resto-embalaje': 21.6,
  'media-junta': 21.6,
  'llave-once': 21.6,
  'perno-doblado': 19.6,
  'tapa-valvula': 20.6,
  'cinta-metrica': 19.7,
  rodamiento: 21.6,
  'trozo-manguera': 19.6,
  'remache-carguero': 23.6,
  'eslabon-grua': 18.6,
  'filtro-descartado': 20.2,
  'placa-numero': 17.6,
  'muelle-industrial': 20.9,
  'guante-trabajo': 21.6,
  'terminal-quemada': 17.6,
  'pastilla-freno': 17.6,
  'hoja-seca': 20.6,
  'piedra-lisa': 19.6,
  pluma: 19.6,
  'papel-humedad': 21.35,
  'semilla-alas': 21.2,
  'pieza-desconocida': 21.6,
  foto: 20.1,
  'llave-etiqueta': 17.6,
  'engranaje-dorado': 20.5,
  'caja-suena': 20.6
};

// El alto del viewBox de las siluetas. Vive acá porque la cuenta de la base lo
// necesita y es el mismo número que usa formas.js.
export const LIENZO_OBJETO = 24;

// Va en una tabla VARS_* y no como string suelto: el test del puente recolecta
// los nombres de custom property de ahí, y suelto quedaba invisible para él.
export const VARS_OBJETO = { base: '--base-objeto', apoyo: '--apoyo-objeto' };

export const FILOS_OBJETO = {
  'arandela-dorada': '#5a3a10',
  'cosa-sin-nombre': '#00404d',
  'nota-tanque': '#5a3a10'
};
export const FILO_OBJETO_POR_DEFECTO = '#1b222c';

// Los colores de la tabla, MEDIDOS contra la pared donde va, no elegidos a ojo.
//
// La primera versión usaba el azul-gris del resto de la chapa —cara 74, canto 50
// de luminancia— y contra una pared que mide 35 de media y es CÁLIDA (RGB 41/36/33)
// se leía como una barra de interfaz apoyada encima del galpón. El problema era
// doble: demasiado clara y del tinte equivocado.
//
// Los tonos de ahora están todos en la familia cálida de la pared, y escalonados
// contra su media de 35:
//
//   canto     43   apenas arriba de la pared: se despega sin gritar
//   cara      60   la tira de arriba, que recibe algo de luz
//   filo     112   una línea de un píxel, y el único brillo permitido
//   soporte   27   DEBAJO de la pared: los soportes están en sombra
//   sombra     -   negro cálido para la caída sobre la pared
export const COLORES_REPISA = {
  cara: '#403c34',
  canto: '#2e2b26',
  filo: '#7d6f56',
  soporte: '#1d1b18',
  sombra: '#0a0806'
};

export const VARS_REPISA = {
  separacion: '--repisa-separacion',
  nivel: '--repisa-nivel',
  x: '--repisa-x',
  y: '--repisa-y',
  ancho: '--repisa-ancho',
  alto: '--repisa-alto',
  achatado: '--repisa-achatado'
};

// ---- La apertura ----
//
// Android arma la splash de la app instalada solo, con el ícono sobre el
// background_color del manifest. Eso no se diseña: se elige el color y se
// elige el ícono. Lo que sí se diseña es el instante SIGUIENTE, que era un
// corte seco de la pantalla del sistema al galpón.
//
// EL COLOR ESTÁ MEDIDO, no elegido. Es el promedio del percentil 10 de
// luminancia de las tres panorámicas de día:
//
//   amanecer  #17181c
//   mediodia  #1d232a
//   atardecer #151718
//   promedio  #181b1f  <- background_color, theme_color y el velo
//
// O sea: la sombra del galpón. El valor anterior, #0d0f14, era el charcoal de
// la app —más oscuro que cualquier zona real de la escena— así que el salto a
// la escena era un flash. Con la sombra del propio galpón, la splash y el
// primer cuadro son el mismo lugar con la luz apagada.
// ---- Los íconos de la PWA ----
//
// VIVEN ACÁ Y NO EN EL GENERADOR porque los dibujan DOS cosas: la página
// icons/generador.html, para mirarlos, y un script de build, para escribirlos.
// Con los números en el HTML, el archivo que se genera y el que se mira podían
// separarse sin que nadie se enterara — que es exactamente lo que pasó: los
// íconos en disco llevan el galpón detrás y el generador dibujaba a Chip sobre
// un plano.
//
// Y ESE ERA EL PROBLEMA DE FONDO, más que el bandeo. Los íconos eran un archivo
// suelto, generado una vez y congelado: cuando el arte cambió, no cambiaron. Al
// salir del generador quedan atados al sprite real y se regeneran solos cuando
// alguien toca a Chip.
//
// El recorte del fondo está MEDIDO sobre fondo-dia.webp (1672x941): el cielo de
// la ventana ocupa x 7,4% a 20,3% y y 8,9% a 73,5%. El cuadrado se corre apenas
// a la derecha del borde para que la ventana quede en el tercio izquierdo y
// entre pared a la derecha, que es lo que le da profundidad al ícono.
export const ICONOS = {
  fondo: 'sprites/fondo-dia.webp',
  chip: 'sprites/idle.webp',
  // Lado del recorte, en fracción del alto del fondo, y desde dónde.
  recorte: { lado: 0.86, x: 0.024, y: 0.07 },
  // El fondo va un poco más apagado que el original: a brillo pleno el cielo
  // compite con Chip, que es lo más claro que tiene que haber.
  brilloFondo: 0.82,
  // CUÁNTO DEL ÍCONO PUEDE OCUPAR CHIP EN EL MASKABLE. Android recorta el borde
  // con formas distintas según el launcher —círculo, squircle, gota— y sólo
  // garantiza el 80% central. La tinta de Chip tiene que entrar ahí o en un
  // teléfono con íconos redondos le corta la cabeza.
  //
  // Se aplica sobre la TINTA y no sobre el lienzo: el sprite trae margen
  // transparente, así que escalar el lienzo al 80% dejaría a Chip mucho más
  // chico de lo necesario. El script mide la caja opaca y encuadra sobre ella.
  zonaSegura: 0.8
};

// ESTE COLOR VIVE EN CINCO LUGARES y ninguno de los otros lo puede leer de acá,
// porque los cuatro primeros tienen que existir ANTES que el JS:
//
//   manifest.json    "background_color"    la splash que pinta el sistema
//   manifest.json    "theme_color"         la barra en la app instalada
//   index.html       <meta theme-color>    la barra en el navegador
//   index.html       el <style> inline     el primer frame, antes de la hoja
//   config.js        esto                  el velo de #apertura
//
// Y style.css lo usa una sexta vez para el negro de alrededor de la escena.
//
// ERAN TRES COLORES DISTINTOS para la misma cosa: #181b1f en el manifest, en el
// theme-color y en el velo, y #05070a en el body. La cadena del arranque es
// splash -> primer frame -> velo -> escena, y cualquier cuadro de otro color en
// el medio es una costura que se ve.
//
// Unificado en #05070a, que es el que ya usaba el body: para este lado el mismo
// color sirve para el arranque Y para el negro de alrededor, y no queda ninguna
// segunda cadena que mantener. Lo cruza un test, porque es exactamente la clase
// de par que se desincroniza en silencio.
export const COLOR_APERTURA = '#05070a';

// EL VELO DURA 820 ms Y NO 360, y el escalonado se abrió a la par.
//
// A 360 ms el fundido se leía como un corte con un parpadeo, no como un
// fundido. Y el motivo no es el número en abstracto sino de dónde sale la
// transición: el arranque va de la splash —casi negra, con un ícono chico— a un
// galpón con un atardecer brillante ocupando toda la pantalla. Cuanto mayor es
// el contraste entre los dos momentos, más tiempo necesita el ojo para leerlo
// como una disolvencia y no como un salto.
//
// El escalonado es la otra mitad del efecto: primero está el galpón (0-820 ms),
// después aparece Chip EN el galpón (300-900 ms). Si entran juntos se lee como
// que la imagen tardó en cargar; escalonados se lee como que alguien prendió la
// luz y Chip ya estaba ahí.
//
// Y COLOR_APERTURA tiene que ser EXACTAMENTE el background_color del manifest:
// cualquier cuadro intermedio de otro color es la costura que se ve.
export const DURACION_APERTURA_MS = 820;
export const RETARDO_CHIP_APERTURA_MS = 300;
export const DURACION_ENTRADA_CHIP_MS = 600;

export const VARS_APERTURA = {
  color: '--color-apertura',
  duracion: '--duracion-apertura',
  retardoChip: '--retardo-chip-apertura',
  duracionChip: '--duracion-entrada-chip'
};

// ---- El menú ----
//
// La colección se abría tocando el alféizar y nada más: un secreto que nadie
// iba a descubrir. Ahora hay una puerta visible, y el alféizar queda como
// atajo, no como única entrada.
//
// TRES SECCIONES Y SÓLO TRES. No es donde se acumulan features: la economía
// del juego es su fuerza, y cada sección nueva tiene que justificarse contra
// esa regla, no contra el espacio que sobre en la pantalla.
export const SECCIONES_MENU = ['coleccion', 'ajustes', 'acerca'];

// La chapa del panel de mantenimiento que hace de botón. Mismo vocabulario que
// la toma de corriente: es mobiliario del galpón, no un ícono de interfaz.
//
// LOS CUATRO SIGUEN VIVOS, Y CASI SE VAN TRES. Cuando la botonera perdió la caja
// —ver COLORES_BOTON_CHAPITA— `chapa`, `filo` y `hueco` se quedaron sin un solo
// lector EN style.css, y por un momento parecieron muertos. No lo están: los lee
// `formas.js`, en el SVG del panel de mantenimiento, que es el dueño original de
// esta tabla y la razón del nombre. La botonera era el inquilino.
//
// Queda anotado porque el error estuvo escrito: un grep sobre la hoja no ve a
// formas.js, y formas.js también escribe var(). El guardián del puente sí mira
// los dos, y por eso lo agarró.
export const COLORES_PANEL = {
  chapa: '#2b313c',
  filo: '#0b0e13',
  hueco: '#12161d',
  linea: '#5d6675'
};

// ---- La botonera, que ahora es del galpón y no de una app ----
//
// Eran rectángulos oscuros con un ícono fino y una etiqueta: se leían como
// interfaz. Y era lo único de la escena que no hablaba el idioma del mundo —el
// cable, la repisa, la toma y la panorámica ya estaban dibujados con el
// vocabulario del galpón y las teclas no.
//
// LOS GRISES NO SON NUEVOS: son los de al lado.
//
//   Chip, la chapa de la cabeza      #676c77   (medido, ver GRIS_CHAPA_CABEZA)
//   la toma del fondo                #878c92   (medida contra la panorámica)
//   la botonera, antes               #39414f a #141821
//
// La botonera vieja era mucho más oscura que las dos cosas de metal que tiene
// alrededor, y por eso leía como una superficie de otro material. `chapa` es
// prácticamente la chapa de Chip; `arriba` es esa misma cara recibiendo la luz
// de la ventana, y `bajo` y `fondo` son lo que queda del quiebre para abajo.
//
// EL CONTRASTE DEL TEXTO SE REMIDIÓ, que es lo que la spec pedía vigilar. La
// etiqueta cae en la mitad de abajo, así que lo que importa es #cdd3dd contra
// `bajo`: 6,62 a 1, cómodo sobre el 4,5 de AA. El ícono va grabado en la mitad
// de ARRIBA y ahí el par es #10141b contra `arriba`: 4,27, sobre el 3 que pide
// AA para un elemento gráfico. Si alguien aclara la chapa, el que se rompe
// primero es el ícono.
//
// El naranja es el MISMO de la toma, y usado igual: una franja pintada en el
// canto, gastada, no un contorno encendido alrededor de la tecla.
// ============================================================================
// LOS DOCE GRISES SE FUERON, Y ESO ES EL PUNTO 3.3
// ============================================================================
//
// Acá vivían doce tonos propios —arriba, chapa, bajo, fondo, filo, brillo,
// remache, mate, mate-bajo, mate-texto— y ese era el problema entero: la
// botonera tenía SU PROPIA PALETA. Una pieza con paleta propia es de otro
// juego, por más que cada tono esté bien elegido.
//
// Ahora usa los tonos que la escena ya tiene declarados, y los usa por su
// nombre: `--panel-chapa`, `--panel-filo`, `--panel-hueco` y `--panel-linea`
// salen de COLORES_PANEL y los escribe el mismo puente de siempre. No se
// repiten acá, porque repetirlos sería volver a tener dos fuentes.
//
// Lo único que queda en esta tabla es lo que es de la botonera y de nada más:
//
//   texto     el gris claro de las etiquetas. NO es nuevo: es el que la
//             botonera ya usaba. Medido contra la chapa nueva da 8,68 a 1,
//             bastante arriba del 4,5 que pide AA.
//   naranja   #ffa300, el de la paleta cerrada. Reemplaza al #c8781f, que era
//             un tono inventado para la botonera vieja. Sobre la chapa da 6,53
//             y sobre el hueco 9,06, así que no hace falta bajarle nada.
//
// El apagado no necesita tono propio: es el mismo relleno con el texto en
// `--panel-linea`. Contra la chapa da 2,25, que para texto normal sería poco —
// y para texto deshabilitado es exactamente lo que se quiere, porque "apagado"
// tiene que leerse como apagado.
export const COLORES_BOTON = {
  texto: '#cdd3dd',
  naranja: '#ffa300'
};

// ---- LAS CHAPAS APOYADAS EN EL PISO ----
//
// El diagnóstico no era falta de textura. TODO lo demás de la escena sigue la
// fuga del piso —las juntas de las baldosas, la caja de conexión, la toma, el
// cable— y las tres teclas eran rectángulos perfectamente frontales adentro de
// una barra. Un objeto frontal en una escena en perspectiva se lee pegado
// encima, por más remaches que tenga.
//
// Tres cambios, y el primero es el que más pesa:
//
//   1. SE VA LA BARRA. El degradé oscuro que las contenía era lo que más gritaba
//      "interfaz": un contenedor con fondo propio es una barra de aplicación, no
//      tres piezas en un galpón. Ahora las chapas están sueltas sobre el piso.
//      Lo que la barra sostenía —que el texto se leyera— no dependía de ella: el
//      contraste del texto se mide contra la CHAPA, no contra el piso.
//   2. SOMBRA DE CONTACTO, una elipse abajo de cada una, como la que ya tienen
//      la caja de conexión y las piezas de la repisa. Es lo que las mete en el
//      espacio en vez de dejarlas flotando.
//   3. FUGA. Los bordes de arriba y abajo dejan de ser paralelos y convergen
//      hacia el mismo punto que las baldosas.
//
// EL PUNTO DE FUGA ES EL MEDIDO, no uno inventado para esto: (835, 520) sobre la
// panorámica de 1672 —ver EL-PORQUE.md— cae en el 55,26% del alto de la escena y
// en el 138% del ancho en 480x889, o sea afuera del cuadro por la derecha. Es el
// mismo par que usan el cable y la toma, y por eso las tres cosas fugan al mismo
// lugar en vez de cada una al suyo.
//
// La x en % del ancho sólo es exacta en la proporción de referencia, porque el
// fondo escala por el ALTO. Es la misma aproximación que ya tienen la toma y la
// repisa, y está anotada donde corresponde.
//
// LOS DOS NÚMEROS DE LA PERSPECTIVA VAN JUNTOS y no se eligen por separado. Lo
// que se ve es cuánto CONVERGEN los bordes, y eso sale de los dos: con la chapa
// inclinada un ángulo t sobre su base, el borde de arriba se va h·sen(t) hacia
// el fondo y se achica en p/(p + h·sen t).
//
// Y ACÁ LA CUENTA SE EQUIVOCÓ DE MAGNITUD, así que queda anotada entera.
//
// Buscando los 2 a 3 grados de convergencia que pide la spec sobre una chapa de
// unos 50 px de alto, la primera elección fue perspectiva 200 e inclinación 8°:
// 3,4% de achique del borde de arriba, o sea los 2,8° pedidos. El número era
// correcto y el resultado estaba mal, porque la convergencia NO es lo que más se
// ve.
//
// Lo que más se ve es el CORTE LATERAL. Con el origen de perspectiva afuera del
// cuadro, inclinar la chapa le corre el borde de arriba de costado, y ese
// corrimiento va como (h·sen t / p) · dx, donde dx es lo lejos que está la chapa
// del punto de fuga. Para la tecla de la izquierda dx son casi 590 px:
//
//   perspectiva 200, inclinación 8°  ->  achique 3,4% (2,8°)  ->  corte 21 px
//   perspectiva 620, inclinación 6°  ->  achique 0,9% (0,7°)  ->  corte  5 px
//
// Con 21 px sobre una chapa de 144 la botonera no se lee en perspectiva: se lee
// deformada, y el texto se tuerce. La spec pedía "que no sea dramático" y 21 px
// es dramático. Verificado mirando las dos a tamaño real.
//
// O sea: el número a controlar era el corte, no el achique. La convergencia que
// queda es de 0,7° y alcanza, porque no trabaja sola — abajo está la sombra de
// contacto, y las dos juntas son las que apoyan la pieza.
// ============================================================================
// SE FUE LA PERSPECTIVA, Y ES LO PRIMERO DEL PUNTO 3
// ============================================================================
//
// Estaban `inclinacion: 6`, `perspectiva: 620` y el punto de fuga, y las cuatro
// se van juntas. No es que estuvieran mal calculadas —la fuga era la medida del
// galpón, y la convergencia de 0,7° estaba verificada—: es que INCLINAR ALGO EN
// 3D OBLIGA AL NAVEGADOR A RESAMPLEAR CADA BORDE fuera de la grilla de píxeles.
// Con la inclinación puesta, ningún otro arreglo de este punto se puede ver: los
// cantos duros, la fuente pixel y los íconos de 16 unidades quedan todos
// interpolados por el mismo transform.
//
// Lo que la inclinación sostenía —que la chapa se lea apoyada y no pegada como
// una calcomanía— lo sigue haciendo la sombra de contacto, que se queda.
//
// TODO EN UNIDADES ENTERAS, que es el punto 3.7. La unidad es 8 px, la misma
// que el tamaño nativo de la fuente: así el alto, la separación, el texto y los
// íconos son todos múltiplos del mismo módulo y no hay dónde aparezca un
// decimal.
export const BOTONERA = {
  // El módulo. Ocho, como el em de la fuente pixel.
  unidad: 8,
  // 6 unidades = 48 px de alto. Arriba de los 44 del mínimo táctil.
  altoEnUnidades: 6,
  separacionEnUnidades: 1,
  margenEnUnidades: 2,

  // 16 px de fuente: DOS veces el tamaño nativo de 8, o sea un múltiplo entero.
  // A 12 —lo que tenía Arial— cada píxel de diseño mediría 1,5 y volvería el
  // antialiasing que todo este punto viene a sacar.
  fuente: 16,

  // El ícono se dibuja en una grilla de 16x16 y se muestra a 16 px: 1 a 1, así
  // que cada unidad del SVG es un píxel de pantalla. Un múltiplo entero también
  // serviría; 1 a 1 es el único que no hay que verificar.
  icono: 16,

  // NO HAY MUESCA, y vale decir por qué se descartó. El punto 3.2 la ofrece
  // como opción —"si el canto hace falta"— y el problema es que un chaflán se
  // recorta con `clip-path`, y `clip-path` recorta TAMBIÉN los pseudo-elementos:
  // se llevaría puesta la sombra de contacto, que vive fuera de la caja y es lo
  // único que apoya la chapa en el piso. Cambiar una esquina por la sombra es
  // mal negocio. El canto duro alcanza.

  // ---- LA CHAPITA, QUE ES TODA LA SILUETA QUE QUEDA ----
  //
  // Y ACÁ ESTÁ EL DIAGNÓSTICO QUE FALTABA. Las tres variantes anteriores —la
  // maciza, la hueca al 0,72 y la del medio al 0,90— se probaron y se
  // rechazaron las tres por la misma razón, que ninguna de las tres tocaba:
  // COMPARTÍAN LA SILUETA RECTANGULAR. Lo que se estuvo cambiando fue el
  // relleno, y el relleno nunca fue el problema.
  //
  // La medición de verificacion/botonera-hueca.html lo decía y no se leyó así:
  // el piso de las cuatro franjas va de 23 a 97 de luminancia, o sea que NINGÚN
  // relleno saca más de 2,59 de contraste en las cuatro. El naranja sí: 8,07 a
  // 9,72. El único elemento que aguanta las cuatro franjas ya estaba en la
  // pieza, y era la franja de pintura — no el fondo sobre el que se apoyaba.
  //
  // Así que el botón deja de tener caja. La silueta la lleva una chapita
  // pintada arriba del texto, como la etiqueta grabada de un tablero de galpón:
  // el tablero no dibuja un rectángulo alrededor de cada perilla, le pone una
  // plaquita arriba con el nombre.
  //
  //   alto   3 px. Con 2 —el alto de la franja del canto que reemplaza— se
  //          lee como un subrayado desprendido; con 3 se lee como una pieza.
  //   inset  8 px de aire a cada lado, que es la UNIDAD del módulo. Es lo que
  //          hace que la chapita sea más angosta que el botón y por lo tanto
  //          se lea como algo APOYADO encima y no como el borde de arriba de
  //          una caja invisible.
  //   filo   1 px de negro RODEÁNDOLA, y el primer intento lo puso sólo abajo.
  //          Ver abajo, porque es la corrección que más importa de todas.
  //   halo   sólo al apretar. Ver COLORES_BOTON_CHAPITA.
  //
  // EL FILO VA EN LOS CUATRO LADOS, Y ESTUVO EN UNO SOLO. El pedido original era
  // "sumale box-shadow: 0 1px 0 #000 para que despegue del piso claro". Hace
  // exactamente eso, y por eso el error se ve recién cuando se mide lado por
  // lado: el naranja y el negro SE TURNAN según la hora.
  //
  //                        amanecer  mediodía  atardecer  noche
  //   naranja / piso          5,91      3,32       5,78    8,81
  //   filo negro / piso       1,78      3,16       1,82    1,19
  //
  // Sobre piso oscuro manda el naranja y el filo no se ve; sobre piso claro se
  // da vuelta. Con el filo abajo nomás, el mediodía dejaba ARRIBA Y LOS DOS
  // COSTADOS con 2,56 en el peor píxel — o sea la pieza a merced de la hora en
  // tres de sus cuatro bordes. Rodeándola, en cada franja y en cada lado hay
  // siempre uno de los dos trabajando.
  //
  // Y CRECE HACIA ADENTRO, NO HACIA AFUERA. El `box-shadow` no ocupa lugar en el
  // layout, pero sí PINTA: un anillo de 1 px alrededor de una chapita puesta en
  // `top: 0` la haría empezar un píxel más arriba del botón. Así que la chapita
  // se corre 1 px hacia adentro y el inset sube 1 —de 8 a 9— y el anillo cae
  // justo donde antes terminaba el naranja. La silueta exterior de la ficha es
  // EXACTAMENTE la de antes; lo único que cambió está adentro.
  chapita: { alto: 3, inset: 8, filo: 1, halo: 4 },

  // ---- EL PIE ----
  //
  // Una línea fina abajo, más corta que la chapita, para que la ficha se lea
  // apoyada y no flotando. Es lo que hacía la elipse de contacto, con la
  // diferencia de que la elipse suponía una chapa entera apoyando su base y ya
  // no hay chapa: lo que apoya es una ficha de dos trazos.
  //
  // `alfa` no es cosmética: a plena opacidad son dos naranjas iguales arriba y
  // abajo y la pieza se lee simétrica, que es justamente lo que una etiqueta
  // apoyada no es. Al 55% la chapita manda y el pie acompaña.
  pie: { alto: 1, inset: 22, abajo: 2, alfa: 0.55 }
};

// ---- ACÁ ESTABA BOTONERA.sombra, LA ELIPSE DE CONTACTO ----
//
// Era `{ ancho: 76, alto: 7, alfa: 0.5, difuminado: 5 }` y con ella se van sus
// cuatro variables. Estaba descrita como "lo único suave que queda, y a
// propósito", y eso seguía siendo cierto: una sombra real es suave.
//
// Lo que dejó de ser cierto es lo que la sombra sostenía. Una sombra de
// contacto dice dónde APOYA UNA SUPERFICIE, y su ancho iba en % de la chapa
// —76— porque suponía una chapa. Sin caja no hay superficie que apoye: hay dos
// trazos de pintura y un texto. Una elipse difusa debajo de eso no dice
// "apoyado", dice "hay algo acá que no se ve".
//
// Se probaron las dos, con captura, antes de sacarla: ver
// verificacion/botonera-chapita.html.

// `unidad` NO viaja por el puente: no la lee el CSS, sólo sirve para derivar el
// alto, la separación y el margen acá al lado. Una variable escrita sin lector
// es exactamente lo que el guardián del puente denuncia — y lo denunció.
export const VARS_BOTONERA = {
  alto: '--boton-alto',
  separacion: '--boton-separacion',
  margen: '--boton-margen',
  fuente: '--boton-fuente',
  icono: '--boton-icono',
  chapitaAlto: '--boton-chapita-alto',
  chapitaInset: '--boton-chapita-inset',
  chapitaFilo: '--boton-chapita-filo',
  chapitaHalo: '--boton-chapita-halo',
  pieAlto: '--boton-pie-alto',
  pieInset: '--boton-pie-inset',
  pieAbajo: '--boton-pie-abajo',
  pieAlfa: '--boton-pie-alfa',
  // El ancho de cada chapa NO sale de acá: lo mide ui.js y lo escribe en píxeles
  // enteros, porque depende del ancho de la escena. Ver medirBotonera.
  ancho: '--boton-ancho'
};

// LA FUENTE PIXEL DE LAS ETIQUETAS. Punto 3.5.
//
// Se genera con `node tools/fuente-chip.mjs` y vive en el repo: no se carga de
// ningún CDN, porque Chip funciona sin red y una fuente remota rompe eso. Está
// en ARCHIVOS_CACHE, así que la primera apertura offline ya la tiene.
//
// Diseñada a 8 px con unitsPerEm 1024: un píxel de diseño son 128 unidades
// exactas, y por eso se dibuja a 8, 16 o 24 y nunca a 12 ni a 18.
//
// `block` y no `swap`: con `swap` se ve un cuadro con la fuente de reserva y las
// etiquetas saltan de forma al llegar la buena — justo el parpadeo que el punto
// 4 vino a sacar.
export const FUENTE_BOTONERA = {
  familia: 'Chip Pixel',
  ruta: 'fuentes/chip-pixel.ttf',
  formato: 'truetype',
  display: 'block',
  // Los tamaños en los que se ve nítida, para que el test pueda cruzar contra
  // BOTONERA.fuente en vez de contra un número escrito dos veces.
  nativo: 8
};

export const VARS_FUENTE = {
  familia: '--fuente-pixel'
};

// Cuántas chapas hay en la fila. Lo usa medirBotonera para repartir el ancho en
// enteros, y está acá y no escrito a mano en ui.js porque es la misma cuenta que
// haría cualquiera que agregue una cuarta acción: si el número queda dentro de
// la función, el día que entre otro botón las tres viejas se desalinean sin que
// nada lo diga.
export const BOTONES_EN_LA_FILA = 3;

// Versión que se muestra en Sobre Chip. Se sube a mano, con el mismo criterio
// que CACHE_VERSION: es una decisión, no un efecto colateral.
export const VERSION_JUEGO = '0.9';

// Marca en el body que el movimiento está apagado. Puede venir del ajuste del
// juego o de prefers-reduced-motion del sistema; ui.js resuelve el OR y escribe
// esta sola clase, así el CSS no tiene que preguntar dos cosas.
export const CLASE_SIN_MOVIMIENTO = 'sin-movimiento';

// ---- El rayo del pecho ----
//
// Estaba dibujado al lado de las barritas y era el único elemento de la
// pantalla que no hacía nada. Es el símbolo de energía: puede comunicar estado
// por sí solo.
//
// DÓNDE ESTÁ EL RAYO, y la corrección que costó entenderlo: el rayo está
// ADENTRO del cristal, a la derecha de las barritas. No es un recuadro aparte.
//
// La primera medición lo buscó como "hueco a la derecha del cristal" y tomó la
// caja de contorno de todo lo que tuviera firma de vidrio en una ventana de
// 41 px. Eso mete el marco y la hombrera: el recuadro salía de 15% de ancho en
// vez de 4, y el rayo terminaba dibujado sobre el brazo de Chip.
//
// La medición buena es TEMPLATE MATCHING, un solo método para los ocho. Buscarlo
// por color no cierra —en critico es rojo, en standby no hay rayo sino una luna—
// y cada máscara cromática necesitaba su excepción. El rayo es el mismo dibujo
// en todas las poses: se recorta el de idle, verificado a ojo, y se lo busca por
// correlación normalizada en el resto.
//
// El puntaje además CONTESTA si el rayo está: idle 1,00 (es el patrón), limpiando
// 0,86, cargando 0,85, critico 0,79, feliz 0,77, jugando 0,69, idle-manitos 0,52
// —ahí el brazo levantado lo tapa a medias, y por eso baja— y standby 0,44, que
// es el único que no tiene. La caída del puntaje es la señal, no una falla.
export const RECUADROS_RAYO = {
  idle: { x: 55.9, y: 63.3, ancho: 4.3, alto: 8.6 },
  feliz: { x: 55.1, y: 63.7, ancho: 4.3, alto: 8.6 },
  critico: { x: 52, y: 66.8, ancho: 4.3, alto: 8.6 },
  // standby no tiene rayo: el display muestra una luna. La correlación se cae a
  // 0,44 y eso es la señal, no una falla del método.
  standby: null,
  cargando: { x: 62.5, y: 62.9, ancho: 4.3, alto: 8.6 },
  jugando: { x: 58.2, y: 61.3, ancho: 4.3, alto: 8.6 },
  limpiando: { x: 55.5, y: 62.9, ancho: 4.3, alto: 8.6 },
  'idle-manitos': { x: 57, y: 61.3, ancho: 4.3, alto: 8.6 }
};

// Los cuatro ritmos. El de reposo es más lento que el de la antena y fuera de
// fase: dos latidos del mismo largo se sincronizan y el conjunto se vuelve
// mecánico. El de critico es el que más comunica —un rayo que titila mal se lee
// al instante— y por eso su keyframe es irregular a propósito.
export const CICLO_RAYO_MS = 3700;
export const CICLO_RAYO_CRITICO_MS = 1300;
export const CICLO_RAYO_NOCHE_MS = 6200;

// ---- EL RAYO CUENTA LA CARGA, no sólo que hay corriente ----
//
// Latía IGUAL con la batería en 90 que en 45: es el instrumento de la batería y
// no informaba nada. Ahora el ritmo sale del stat y no del estado.
//
// LAS BANDAS SON DOS Y NO TRES, y esa es la decisión que hay que explicar. La
// spec pide alta, media y baja, y la baja YA EXISTE: es `critico`, que entra
// abajo de UMBRAL_CRITICO_BATERIA y tiene su propio keyframe irregular —
// titilar-rayo— hecho justamente para leerse como una falla. Agregar una tercera
// banda acá sería un segundo sistema diciendo lo mismo, y los dos se
// desincronizarían el día que alguien mueva el umbral.
//
// O sea que el rayo tiene cuatro ritmos y cada uno tiene un dueño distinto:
//
//   alta y media   estas bandas, por el número de batería
//   baja           el estado `critico`, con su titileo irregular
//   cargando       el pulso del cable, en fase con él
//   standby/noche  el mínimo del sistema
//
// `desde` es inclusivo y la tabla se recorre de arriba hacia abajo, así que la
// primera que entra manda. La última tiene que ser 0 o habría batería sin banda.
//
// Media late MÁS RÁPIDO y MÁS DÉBIL: un pulso corto y bajo se lee como un
// sistema trabajando con lo justo, que es lo que hay que comunicar antes de que
// llegue a crítico. Los valores de la banda alta son los que ya estaban.
export const RITMOS_RAYO = [
  { desde: 60, ciclo: 3700, piso: 0.24, pico: 0.52 },
  { desde: 0, ciclo: 2300, piso: 0.16, pico: 0.38 }
];

export const VARS_RITMO_RAYO = {
  piso: '--rayo-piso',
  pico: '--rayo-pico'
};

// ---- EL ENOJO, que era el único estado sin voz ----
//
// Chip se fastidia —por toques repetidos o porque le levantaste algo del piso—
// y hasta ahora cambiaba la pose y nada más. Todos los demás estados tienen una
// señal propia; este no tenía ninguna.
//
// LA REGLA QUE MANDA: nada que parezca castigo. No baja stats, no sacude la
// pantalla, no hay símbolos de enojo. Chip está fastidiado, no ofendido, y a los
// tres segundos se le pasa. Tiene que dar gracia, no culpa.
//
// Tres señales, y las tres salen de cosas que ya existen:
//
//   el bulbo    parpadea corto y seco en el naranja del juego, dos o tres veces.
//               NO es el latido suave de siempre: un latido lento dice "estoy
//               acá"; un parpadeo brusco dice "pará".
//   la antena   se sacude. Ahora que tiene inercia esto sale gratis: es el mismo
//               resorte de ANTENA_INERCIA disparado de golpe, como un resoplido.
//   los brazos  QUIETOS. La ausencia de movimiento también es información, y es
//               el mismo criterio que ya usa `critico`.
//
// El parpadeo es rápido a propósito: 170 ms de ciclo contra los 2600 del latido
// de reposo. Un factor de quince es lo que hace que se lea como otra cosa y no
// como el mismo latido apurado.
export const ENOJO = {
  destellos: 3,
  ciclo: 170,
  // El naranja del juego, el mismo de la franja de los botones y de la toma. No
  // un rojo: el rojo ya es de `critico` y quiere decir otra cosa —que se está
  // quedando sin batería—, y dos señales rojas distintas se confunden.
  color: '#f0a326',
  // La sacudida, en grados y sobre el mismo pivote de la base del poste. Más
  // grande que la inercia de la inclinación porque acá el gesto ES el sacudón,
  // no un residuo: 2,2° son 1,74 px de despegue del bulbo, todavía adentro del
  // tercio del ancho del poste que fija el test.
  sacudida: 2.2,
  duracionSacudida: 540
};

export const CLASE_ENOJO = 'enojado';

export const VARS_ENOJO = {
  ciclo: '--enojo-ciclo',
  color: '--enojo-color',
  sacudida: '--enojo-sacudida',
  duracionSacudida: '--enojo-sacudida-duracion'
};

// El cian del display, que es el mismo de la batería. El rayo no tiene color
// propio: es el mismo sistema eléctrico.
export const VARS_RAYO = {
  x: '--rayo-x',
  y: '--rayo-y',
  ancho: '--rayo-ancho',
  alto: '--rayo-alto',
  ciclo: '--ciclo-rayo',
  cicloCritico: '--ciclo-rayo-critico',
  cicloNoche: '--ciclo-rayo-noche'
};

export const VARS_PANTALLA = {
  x: '--pantalla-x',
  y: '--pantalla-y',
  ancho: '--pantalla-ancho',
  alto: '--pantalla-alto',
  giro: '--pantalla-giro',
  vidrio: '--pantalla-vidrio',
  contX: '--pantalla-cont-x',
  contY: '--pantalla-cont-y',
  contAncho: '--pantalla-cont-ancho',
  contAlto: '--pantalla-cont-alto'
};

// ---- La toma de corriente ----
//
// El cable de `cargando.png` salía hacia abajo a la derecha y terminaba en el
// aire. Esta es su punta, medida con la misma técnica que la antena —componente
// conexa de cian, la más grande que toca el borde inferior— en % del lienzo del
// sprite:
//
//   el cable ocupa x 55,5-79,7% / y 86,7-98,8%, y su punta cae en 79,7% / 98,6%
//
// La coordenada es del SPRITE, no de la escena, y es a propósito: la toma se
// posiciona con los mismos anclajes que usa #chip —el 50% de ancho y el piso—,
// así que en cualquier viewport cae exactamente donde el dibujo la pide. Un
// porcentaje de la escena se desalinearía apenas cambiara la proporción.
// Dónde NACE el cable: el conector del pecho, medido sobre el sprite limpio.
// Antes acá había PUNTA_DEL_CABLE, que era donde TERMINABA el cable dibujado —
// y ese cable ya no existe, Damián lo borró. La toma se posicionaba contra una
// punta que hoy no está.
//
// El conector ocupa x 48,4-57% / y 75,4-85,5% del lienzo; el cable sale del
// centro de su boca.
// LA BOCA del conector, que es donde se enchufa un cable. 53,2 / 85,8.
//
// Estaba en 52,9 / 77,5 y ese punto NO es la boca: es el reborde iluminado de
// ARRIBA del conector. Salió de tomar el centroide de todo el cian de la pieza,
// y el cian está concentrado en ese reborde —los 21 píxeles más brillantes están
// en las filas 76,2 y 76,6— así que el promedio se fue para arriba.
//
// La boca es la abertura cian de ABAJO, que se ve ampliando la pieza al 1200%:
// el conector es un puerto con el reborde encendido arriba y la abertura abajo.
// Un cable sale de la abertura, no del reborde.
// DÓNDE SE ENCHUFA, en % del lienzo del sprite.
//
// Es el módulo cian que está DEBAJO de la pantalla del pecho —medido sobre el
// sprite de `cargando`: x 48,4-57,0, y 75,4-86,7— y el punto de entrada va en su
// mitad de abajo, no en su borde.
//
// Estaba en y 85,8, que es el labio inferior del módulo: el cable llegaba
// pegado al canto y la unión se leía como un cable apoyado al lado del puerto.
// Entrando en 83 el extremo queda ADENTRO de la pieza y la ficha lo tapa, que es
// la diferencia entre "llega hasta" y "está enchufado".
// Y EL LADO DE LA PIEZA VA EN LA MISMA UNIDAD, que es el punto entero.
//
// Lo que está pegado a un sprite escala con el sprite; lo que está en el mundo
// —los objetos de la colección— va en píxeles fijos. Son reglas distintas a
// propósito, y ésta es de las primeras: el conector está atornillado al pecho de
// Chip, así que si Chip crece, crece con él.
//
// POR QUÉ NO UN % DE ESCENA, medido antes de dibujar nada: el arranque del cable
// da 74,52 % de alto EXACTO en cinco viewports, pero en ancho se mueve entre
// 52,57 y 52,92 — 0,35 puntos, 1,4 px sobre una escena de 390. La caja de Chip
// es cuadrada y sale del alto, así que al cambiar la relación de aspecto Chip se
// corre respecto del ancho. Sobre una pieza de 8 px, 1,4 px es el 18 %: el
// conector quedaría descentrado del cable justo en los teléfonos donde la unión
// se tiene que ver tapada. En % de la caja de Chip el punto es exacto POR
// CONSTRUCCIÓN, porque es de donde el cable saca su propio arranque.
//
// 2,2 % de la caja da 8 px a 390x844, adentro de los 6 a 10 pedidos. El número
// se redondea a un ENTERO PAR al dibujar, para que la mitad también sea entera y
// la pieza quede centrada sobre el eje del cable sin medio píxel.
export const CONECTOR_PECHO = { x: 52.7, y: 83, lado: 2.2 };

// EL CABLE, dibujado y animado por código.
//
// LA FORMA SALE DE referencia-cable.png y no de acá: ver RECORRIDO_CABLE más
// abajo, que trae el camino extraído y verificado. Lo que vive en esta tabla es
// cómo se DIBUJA ese camino.
//
// SE FUE LA PERSPECTIVA, y es el cambio de fondo. El cable tenía caída de
// grosor, radio mínimo, clampeo por curvatura y afinado máximo: toda una
// máquina para que se viera irse al fondo. Estaba bien construida y estaba
// resolviendo el problema equivocado.
//
// ESTE CABLE NO SE ALEJA: SE APOYA. Va por el piso, casi todo a la misma
// profundidad, y cruza la escena en diagonal. Un cable que se afina de 13 px a
// 1,7 mientras corre por el suelo delante tuyo no se lee como profundidad: se
// lee como un cable que se rompe. En la referencia el grosor es constante de
// punta a punta — medido: 25,3 px sobre un eje de 849,6, o sea el 2,98% del
// largo del recorrido.
//
// Con el grosor constante desaparecen de un saque el clampeo del ancho contra la
// curvatura y el afinado máximo: los dos existían para que una cinta que cambia
// de ancho no diera saltos en el borde. Una cinta de ancho fijo no puede darlos.
export const CABLE = {
  // EN % DEL EJE PECHO->TOMA, no del ancho de la escena.
  //
  // Estuvo en 1,1% del ancho, que es como Damián lo estimó y él mismo corrigió:
  // la referencia es arte conceptual y no comparte encuadre con la escena, así
  // que un % del ancho de una imagen ajena es precisión falsa. Contra el eje sí
  // se puede cruzar, porque el eje es la misma pieza en las dos.
  //
  // Medido sobre la referencia: 25,3 px de cable sobre un eje de 849,6. Son
  // 2,58%, y era 2,98 hasta que el toma se fue de cuadro. NO ES UN CAMBIO DE
  // CRITERIO: es la compensación de que el eje se alargó.
  //
  // El grosor es un % del eje pecho->toma, y mover el toma del 90% al 106% del
  // ancho estira ese eje de 256,3 a 296,2 px en una escena de 390x844. Con el
  // 2,98 intacto el cable engordaba de 7,64 a 8,83 px —un 15,6%— sin que nadie
  // hubiera pedido un cable más gordo. 2,58 lo devuelve a los 7,64 de antes.
  //
  // Antes de eso: en la escena de 480x944 el eje medía 240 px y el 2,98 daba 7,2,
  // contra los 5,3 que daba el 1,1% del ancho.
  grosor: 2.58,

  // EL RADIO MÍNIMO VA EN SEMIANCHOS Y NO EN PÍXELES, y el número absoluto que
  // había casi borra el quiebre en S.
  //
  // Eran 14 px, que venían del cable viejo de 13 px de grueso: dos diámetros,
  // que es lo que piden los catálogos de cable industrial. Pero en la escena el
  // eje pecho->toma mide 233 px y el quiebre entero mide 4,9 — o sea que un piso
  // de 14 px no le deja doblar, y la relajación lo aplana hasta que desaparece.
  // Medido: el retroceso del quiebre pasaba de 0,0228 del eje a 0,0019.
  //
  // Y el techo de "dos diámetros" no aplica acá, porque la referencia no lo
  // respeta: ahí el cable mide 25,3 px y el quiebre 18, o sea que el artista lo
  // dobló más cerrado que su propio diámetro. Es una decisión de dibujo y hay
  // que dejarla pasar.
  //
  // Lo único que este control tiene que seguir garantizando es que la CINTA no
  // se pliegue, y eso pasa cuando el radio baja del semiancho. 1,4 semianchos
  // deja margen sin tocar la forma.
  radioMinimoEnSemianchos: 1.4,

  // EL PASO DEL REMUESTREO. La tabla trae 36 puntos con densidad despareja —el
  // quiebre concentra doce en un tramo corto— y el redondeo corta cada esquina
  // contra su vecino más corto, así que sin remuestrear el quiebre sale distinto
  // del resto. En % del largo del recorrido.
  pasoMuestreo: 0.5,

  // GRIS INDUSTRIAL, no azul. Sale de los caños de la panorámica, que es lo que
  // el cable tiene que parecer.
  color: '#2b3138',

  // ES UN TUBO Y NO UN TRAZO, y esto es lo que lo hace redondo.
  //
  // La luz de esta escena entra por la ventana, arriba a la izquierda. Un tubo
  // bajo esa luz tiene el filo de arriba claro y la panza de abajo oscura, y esas
  // dos líneas son todo lo que hace falta: un trazo de un solo color se ve plano
  // por más grueso que sea.
  //
  // `brillo` es la arista de arriba y `sombra` la de abajo. No son un contorno:
  // son dónde le pega la luz y dónde no.
  //
  // LOS DOS SE QUEDAN COMO DOCUMENTACIÓN DEL ORIGEN, y lo que se DIBUJA son
  // `filoArriba` y `filoAbajo`, dos líneas más abajo. Ver ahí por qué.
  brillo: '#7b858f',
  sombra: '#171b21',

  // ---- LAS DOS ARISTAS, YA COMO COLOR Y NO COMO MEZCLA ----
  //
  // Hasta acá las aristas se dibujaban con `brillo` y `sombra` a opacidad 0,55 y
  // 0,7, y el comentario de la hoja decía que era A PROPÓSITO: "semitransparente
  // para que el filo se MEZCLE con el cuerpo en vez de apoyarse encima". O sea
  // que la técnica estaba elegida, no heredada — por eso se decide de nuevo en
  // vez de arreglarse.
  //
  // POR QUÉ SE DECIDE DE NUEVO. Mezclar dos capas en runtime sobre una escena de
  // pixel art produce tonos que nadie dibujó, y es la misma familia del cruce de
  // los ojos que ya se sacó por lo mismo. Con alfa, además, el tono depende de
  // qué haya debajo: donde las dos capas del cable se cruzan, el filo cae sobre
  // otro filo y da un cuarto color que no está en ninguna paleta. Medido antes
  // de tocar nada: un corte vertical del tubo daba 6, 7 y 12 colores distintos.
  //
  // QUÉ SON ESTOS DOS NÚMEROS. Son exactamente el resultado de esa mezcla,
  // calculado una vez: 55 % de `brillo` sobre `color` da #575f68, y 70 % de
  // `sombra` sobre `color` da #1d2228. Lo que se ve no cambia en el tramo normal
  // —es el mismo tono— y deja de cambiar donde antes se apilaba.
  //
  // Se dibujan a OPACIDAD 1. Un color plano sobre pixel art es un color; un
  // color con alfa es una promesa de que abajo va a haber siempre lo mismo.
  filoArriba: '#575f68',
  filoAbajo: '#1d2228',

  // DE DÓNDE VIENE LA LUZ, como vector unitario en coordenadas de pantalla: x
  // hacia la derecha, y hacia ABAJO. Así que (-0,6, -0,8) apunta arriba y a la
  // izquierda, que es donde está la ventana del galpón.
  //
  // No es decoración: es el criterio con el que se decide cuál de los dos bordes
  // lleva el filo claro. Estaba implícito y escrito como "el borde de arriba",
  // y con eso el filo saltaba de lado en el medio de los tramos verticales. Ver
  // `desplazado` en formas.js, que cuenta la medición.
  luz: { x: -0.6, y: -0.8 },
  // Qué fracción del grosor ocupa cada filo. Finos: un filo grueso deja de ser
  // una arista y pasa a ser un segundo cable pegado al primero.
  filo: 0.22,

  // El azul eléctrico es SÓLO de los pulsos, y ese contraste —cuerpo apagado,
  // energía viva— es todo el efecto. Si el cable también fuera cian, los pulsos
  // no tendrían contra qué destacarse.
  energia: '#5fe6ff',
  // EL ANILLO DEL PULSO, y no es un hex nuevo: es el núcleo del bulbo de `idle`,
  // el cian casi blanco que el juego ya usa para el centro caliente de una luz.
  // Va MÁS CLARO que la energía y no más oscuro, que es como se lee una luz
  // pequeña en pixel art: el borde es donde revienta, no donde se apaga.
  halo: '#dffcff',
  // La sombra donde entra al puerto: sin ella el cable se apoya, no se enchufa.
  sombraPuerto: '#050a0e',
  // La ficha: un gris de plástico, más claro que el cable. Tiene que leerse como
  // OTRA pieza, no como el cable engordado — si comparte color con el cable, la
  // unión vuelve a ser un extremo y no un enchufe.
  // ACÁ ESTABA `ficha: '#4a525a'`, y la nota de arriba sigue describiendo bien lo
  // que se buscaba: una pieza que se lea como OTRA y no como el cable engordado.
  // El tono no lo lograba, y el motivo no era el gris sino de qué familia era.
  // El conector es una pieza de CHIP —una toma en su pecho— así que se pinta con
  // el metal de Chip y no con uno de la familia del cable. Ver
  // VARS_CABLE.conectorCuerpo.
  // CUÁNTO CABLE QUEDA DETRÁS DEL SPRITE. Es el tramo que entra al puerto y
  // desaparece adentro de Chip. Un cable que termina CONTRA el borde del
  // conector se ve apoyado; uno que desaparece adentro se ve enchufado.
  // En % del eje, como el grosor: en px se quedaba corto en pantallas grandes y
  // la ficha dejaba de tapar la punta.
  entraAlCuerpo: 4,
  balanceo: { ciclo: 4600, amplitud: 2.2 }
};

// ---- EL RECORRIDO SALE DE LA REFERENCIA, Y ES RELATIVO A SUS DOS EXTREMOS ----
//
// Fuente: referencia-cable.png, en la raíz del repo. NO se dibujó a mano.
//
// CÓMO SE SACÓ. LA VENTANA ES EL MÉTODO, no el umbral: se recorta x 405-1000,
// y 370-720 de la referencia y recién ahí se umbraliza en 95. Sin la ventana el
// 95 no separa nada —la pared del fondo es tan oscura como el cable— y el
// histograma no tiene valle: es una meseta de 80 a 110 donde cualquier corte da
// casi lo mismo. Dentro de la ventana hay 18.066 px bajo 95 y la componente
// conectada más grande se lleva 18.011, el 99,7%: ahí el umbral no decide nada
// y por eso el número no es delicado.
//
// Después, centroide por banda de distancia BFS sobre esa componente, que es lo
// que resuelve el quiebre en S — ahí el cable es casi vertical y un barrido por
// columnas no sirve.
//
// Verificado dibujando los puntos encima de la referencia y mirándolos: Damián
// confirmó 32 de 35 sobre el cable, corrigió a mano dos (x=180 y x=225) y dejó
// uno sin resolver. Los corregidos ya están en la tabla de puntos.
//
// DOS TRAMOS SE LEYERON DE LA IMAGEN y no del detector, y vale saber cuáles:
//
//   - El arranque en el pecho. Ahí el cable pasa pegado a las orugas y al pie, y
//     con la ventana abierta hasta esa zona el trazado se va por encima de las
//     orugas y vuelve. Verificado que pasa.
//   - El último tramo, el que sube por la pared al enchufe. Ahí la pared es tan
//     oscura como el cable —20 a 90 contra 13 a 31— y no hay umbral que los
//     separe. No se inventaron puntos: ese tramo lo da la restricción del
//     extremo, que es el toma.
//
// POR QUÉ VA NORMALIZADO. Los puntos NO son coordenadas de escena: son [t, v] en
// un marco que arranca en el enchufe del pecho y termina en el toma. `t` reparte
// la posición HORIZONTAL entre los dos extremos y `v` es cuánto cae el cable por
// debajo de esa recta, en vertical y en unidades del largo de la recta.
//
// EL MARCO ES UN CORTE Y NO UNA ROTACIÓN, y ese detalle es lo que hace que el
// cable se apoye en vez de flotar. La versión anterior medía `n` sobre la
// PERPENDICULAR al eje: conserva la forma exactamente, pero también la gira.
// Con el eje de la referencia a 6,6° de la horizontal daba igual; con el de la
// escena, que sube 40,6° hasta el toma de la pared, la panza colgaba girada 40°
// y el cable se arqueaba por el aire. Verificado mirándolo a tamaño de teléfono.
//
// Un cable tirado en el piso no gira con sus extremos: la gravedad no rota. Lo
// que se conserva al mover el toma es que la panza cae PARA ABAJO.
//
// Así el camino se reconstruye desde CONECTOR_PECHO y TOMA_PARED, que ya viven
// en config: mover cualquiera de los dos mueve el cable entero y la forma se
// conserva. Guardar píxeles sería un archivo congelado que deja de coincidir con
// el arte al primer ajuste — el mismo problema que tuvieron los íconos.
//
// LO QUE DICE LA FORMA, Y QUÉ SE LE SACÓ.
//
// Hasta v99 la tabla salía de calcar referencia-cable.png, y decía tres cosas:
// una PANZA de 0,2496 del eje alrededor de t = 0,42; un ARRANQUE CON t NEGATIVO
// —el cable salía del enchufe, caía al piso y recién ahí empezaba el recorrido—;
// y un QUIEBRE EN S cerca de t = 0,80, donde el parámetro retrocedía 0,0403 y el
// cable se doblaba sobre sí mismo. De ese quiebre estaba escrito que era lo
// único que hacía que el cable pareciera un cable.
//
// LAS TRES ERAN DE UN CABLE QUE IBA AL PISO Y A UNA TOMA DE PARED. Cuando el
// destino pasó a estar fuera de cuadro, las tres se quedaron sin a qué
// responder: no hay piso donde apoyarse, y el quiebre existía para entrar al
// conector — sin conector queda un rulo en el aire, y encima ahora caería DENTRO
// del cuadro y no contra la pared.
//
// Y la panza, además, era el defecto. Bajaba de 74,52% a 88,54% del alto de la
// escena para después salir por el 58%: un cable que va a un punto MÁS ALTO no
// pasa antes por abajo. De paso cruzaba el panel de mensajes.
//
// LO QUE DICE LA FORMA AHORA, y es lo que hay que preservar:
//
//   - SALE DEL PUERTO CASI HORIZONTAL. La subida va con smoothstep, cuya
//     derivada es cero en el arranque. Un cable que sale en diagonal se ve
//     tirado, no enchufado.
//   - SE AFLOJA TRES PUNTOS y no doce: baja hasta el 77,52% del alto y ahí da la
//     vuelta. El panel de mensajes con tres líneas arranca en el 81,3%, así que
//     quedan 3,8 puntos de aire.
//   - CRUZA EL BORDE DERECHO en el 59,38% del alto, con x = 99,8%, y sigue hasta
//     el 106%, donde el overflow lo corta.
//
// Lo que se perdió es el trazo del ilustrador. Lo que se ganó es que esas tres
// frases SEAN el código: la tabla la genera `node tools/recorrido-cable.mjs` a
// partir de ellas, y cambiar la forma es cambiar un número ahí y regenerar.
// tests/coleccion.test.js hace cumplir las tres.
export const RECORRIDO_CABLE = [
  [0, 0], [0.0233, 0.0125], [0.0465, 0.0251], [0.0698, 0.0385],
  [0.093, 0.0532], [0.1163, 0.0695], [0.1395, 0.0876], [0.1628, 0.1075],
  [0.186, 0.1289], [0.2093, 0.1517], [0.2326, 0.1754], [0.2558, 0.1996],
  [0.2791, 0.2236], [0.3023, 0.247], [0.3256, 0.269], [0.3488, 0.289],
  [0.3721, 0.3065], [0.3953, 0.3208], [0.4186, 0.3316], [0.4419, 0.3384],
  [0.4651, 0.3409], [0.4884, 0.3389], [0.5116, 0.3325], [0.5349, 0.3216],
  [0.5581, 0.3065], [0.5814, 0.2876], [0.6047, 0.2652], [0.6279, 0.24],
  [0.6512, 0.2126], [0.6744, 0.1838], [0.6977, 0.1542], [0.7209, 0.1247],
  [0.7442, 0.0962], [0.7674, 0.0692], [0.7907, 0.0447], [0.814, 0.0232],
  [0.8372, 0.0052], [0.8605, -0.0087], [0.8837, -0.0182], [0.907, -0.0232],
  [0.9302, -0.0236], [0.9535, -0.0196], [0.9767, -0.0116], [1, 0]
];

// EL PULSO SE ACHICA CON EL CABLE, y antes no: viajaba con radio fijo de 4,2 px
// todo el recorrido. Con el cable yendo de 13 px a 1,7 eso deja, en el último
// tercio, una bola de energía cinco veces más ancha que el caño que la lleva —
// deja de ser energía ADENTRO del cable y pasa a ser una luz encima.
//
// Las muestras salen de recorrer la línea media y leer el grosor en cada
// fracción del camino, no de una interpolación: `z` no crece parejo con el
// recorrido, así que una rampa lineal daría 0,58 justo donde hace falta 0,33.
// Las primeras dos son 1 porque el primer quinto del recorrido es la caída
// desde el pecho, que está toda a la misma profundidad.
export const PULSOS_CABLE = {
  // TRES Y NO CINCO. Cinco pulsos sobre este recorrido se leen como línea
  // punteada y no como energía en tránsito; fue la mitad del defecto que se
  // reportó como "los puntitos se ven como suciedad" —la otra mitad era el halo
  // gaussiano, ver `anillo` abajo—. Dos deja el cable muerto. Medido con las
  // tres, a 390x844, congeladas y con las demoras repartidas parejo.
  //
  // Y las demoras se reparten sobre este número, no sobre uno escrito aparte:
  // ver el bucle que arma los pulsos en ui.js. Cambiarlo acá los vuelve a
  // espaciar solo.
  cuantos: 3,
  ciclo: 3200,

  // EL RADIO SALE DEL GROSOR DEL CABLE Y NO DE UN NÚMERO SUELTO. Era 4,2 px
  // fijos, o sea 8,4 de diámetro, y el cable mide 7,2: el pulso era más ancho
  // que el caño y se leía como una luz pegada encima en vez de energía adentro.
  //
  // 0,34 del grosor deja el pulso adentro con un margen visible de cable a los
  // lados, que es lo que hace que se lea como algo que VIAJA POR el cable.
  radioEnGrosores: 0.34,

  // ---- EL RESPLANDOR SE DIBUJA, NO SE DIFUMINA ----
  //
  // Acá había un `filter: drop-shadow(0 0 4px var(--cable-energia))` en la hoja,
  // y era el defecto (d) entero: los puntitos que se leían como suciedad no eran
  // el borde del círculo ni que fueran cinco. Medido en una caja de 28x28
  // alrededor de un pulso, con el círculo ya en radio entero y con
  // `shape-rendering: crispEdges` puesto:
  //
  //   14 píxeles opacos      el círculo, limpio
  //   440 píxeles parciales  en 26 tonos distintos
  //
  // Y `shape-rendering` NO LO VE: los filtros se aplican después del rasterizado
  // y son ciegos a él. Un blur sobre una pieza de píxeles mete cientos de tonos
  // que ninguna paleta tiene, siempre.
  //
  // EN PIXEL ART UNA LUZ NO ES GAUSSIANA: ES ESCALONADA. Así que el resplandor
  // pasa a ser un ANILLO dibujado — un círculo más grande debajo del núcleo, de
  // borde duro y color de la paleta. Va ADENTRO del dibujo del pulso y no como
  // filtro, así que si mañana cambia el radio el anillo se mueve con él.
  //
  // 1 px, entero. Con el núcleo en radio 2 el anillo queda en 3, o sea una banda
  // de un píxel alrededor — que a este tamaño es todo el resplandor que entra.
  anillo: 1
};

// LA CAJA DE CONEXIÓN, de vuelta y al fondo. Es la misma que se dibujó en su
// momento —chapa gruesa, conector cilíndrico, tornillos, borde naranja— pero
// SUMERGIDA: chica, en penumbra y con la luz de esa profundidad. No compite con
// Chip porque está lejos, que era el problema de tenerla adelante.
// EL EXTREMO DE LA PARED, y es el segundo punto del que sale el cable entero.
//
// Dejó de ser una caja de conexión del fondo y pasó a ser un ENCHUFE DE PARED
// común —placa chica con la ficha puesta— en la pared derecha, que es lo que
// tiene la referencia. El cambio no es decorativo: la caja del fondo estaba
// lejos y arriba, así que el cable se iba al fondo en diagonal y se afinaba. Un
// enchufe en la pared de al lado deja el cable a la misma distancia todo el
// recorrido, y ESO es lo que le da largo para tener panza y quiebre.
//
// x 90: contra el borde derecho, un poco más afuera que la caja vieja. y 58: la
// altura de un enchufe de pared, arriba de la línea del piso.
//
// Este par y CONECTOR_PECHO son los dos extremos de RECORRIDO_CABLE. Mover
// cualquiera de los dos mueve el cable entero, y la forma se conserva: no hay
// puntos de escena guardados que se puedan desincronizar.
// A PARTIR DE ESTA ALTURA EL CABLE VA DETRÁS DE CHIP. Es el mismo número que la
// línea donde Chip apoya: --piso-chip vale 18%, así que su base está en el 82%
// del alto. Lo que está más arriba que esa línea, en el piso, está más lejos que
// él — y lo que está más lejos se dibuja detrás.
export const PASA_DETRAS_CABLE = 82;

// ---- ACÁ ESTABA APOYO_CABLE, Y SE FUE CON LA PANZA ----
//
// Era el tercer anclaje del recorrido: la línea del alto de la escena donde la
// panza del cable se apoyaba. `lineaDelCable` reescalaba TODA la caída para que
// el punto más bajo aterrizara justo ahí.
//
// Hacía falta cuando la tabla salía de calcar referencia-cable.png: la
// referencia y la escena no comparten encuadre, así que la panza —que allá es el
// 30% del alto de la imagen— acá entraba a la mitad de tamaño relativo y no
// llegaba al suelo. Los dos extremos no alcanzaban para ubicar un cable que se
// apoya.
//
// AHORA LA FORMA SE GENERA CON LAS ALTURAS DE ESTA ESCENA YA ADENTRO —ver
// tools/recorrido-cable.mjs— así que reescalarla la deformaba. Medido: el diseño
// pide bajar hasta el 77,52% del alto, y con el apoyo todavía puesto el cable
// bajaba al 86,6%, otra vez adentro del panel de mensajes. La tabla ya dice
// dónde va cada punto; corregirla después era pisar la decisión.
//
// EL INTENTO DE SALVARLO, QUE NO ERA EL CAMINO PERO VALE LA MEDICIÓN. Antes de
// sacarle la panza al cable se probó subir esta constante para que dejara de
// cruzar el panel. No hay número que sirva, y las dos mitades del por qué son:
//
//   apoyo 80  panza 80,5%  ->  171 puntos del cable sobre la silueta de Chip
//   apoyo 81  panza 81,7%  ->  131 puntos sobre la silueta
//   apoyo 82  panza 83,1%  ->   33 puntos, sólo el enchufe
//   apoyo 86  panza 88,5%  ->   33 puntos, sólo el enchufe
//
// o sea que la panza tenía que quedar por debajo de la base de Chip —82%, que es
// --piso-chip— o le cruzaba las orugas. Y del otro lado el borde de arriba del
// panel NO ES UNA LÍNEA FIJA: crece con el largo del mensaje, del 85,5% con una
// línea al 81,3% con tres. Evitar a Chip pedía >= 82 y evitar el panel pedía
// <= 81,3: las dos ventanas no se tocan.
//
// La salida no era mover la panza. Era que no hubiera panza.


export const TOMA_PARED = {
  // EL CABLE SE VA DE CUADRO, y por eso este número pasa de 90 a 106.
  //
  // Estuvo en 90 apuntando a una caja dibujada por código sobre pared lisa, y el
  // motivo por el que se fue está medido en verificacion/telefono.html: el
  // galpón se recorta con `background-size: auto 100%`, así que en un teléfono
  // de 390x844 sólo se ve del 8,0% al 34,0% del ancho del dibujo — y los DOS
  // tomas que el arte sí dibuja viven en el 87,8%. Nunca entran en pantalla.
  //
  // Y no alcanzaba con mudar la constante a algo que sí entre, porque un % de la
  // ESCENA no puede seguir a un rasgo del FONDO: el mismo punto del dibujo cae
  // en 75,17% de la escena a 390x844 y en 68,39% en pantalla ancha. Cualquier
  // valor está bien en un aparato y mal en el otro.
  //
  // Un cable que sale de cuadro no le debe explicación a nadie, funciona igual
  // en todos los anchos, y de paso se lleva puesta la ficha de la punta —que
  // apoyada contra pared lisa era el defecto— y el cruce del cable sobre el
  // panel de mensajes. Un solo número para tres cosas.
  //
  // 106 y no 101: tiene que CRUZAR el borde y quedar cortado por el overflow.
  // Terminar a tres píxeles del canto se ve peor que terminar en el medio.
  x: 106,
  y: 58,

  // 3,4% del ancho, y antes eran 4,7: un 28% más chica.
  //
  // El 4,7 se había subido para que la caja se encontrara sin buscarla, y en eso
  // tenía razón. Lo que no miraba es que una caja de ese tamaño a esa altura se
  // lee CERCA, y con eso el galpón se achica: si el fondo está al alcance de la
  // mano, no hay nave. La legibilidad ahora la sostiene otra cosa —el cable
  // afinado que muere ahí adentro— y no el tamaño de la caja.
  ancho: 3.4,

  // Sumergida, pero encontrable. 0,34 la hacía desaparecer contra la pared.
  //
  // Subió de 0,46 a 0,55 junto con el achique: a 3,4% de ancho y con el cable
  // convertido en un pelo, el 0,46 la dejaba otra vez indistinguible del paño.
  // Mirado a tamaño real, con 0,55 lo que la encuentra es su punto cian y su
  // banda naranja, no su tamaño — que es como se anuncia el resto del galpón.
  brillo: 0.55,
  saturacion: 0.62
};

// OJO CON LAS TRES DE ARRIBA — `ancho`, `brillo` y `saturacion`: hoy no las lee
// nadie. Las leía la regla de #toma en style.css, que se fue con el nodo. `x` e
// `y` sí siguen vivas: ui.js las usa para saber a dónde va el cable, y ahora
// apuntan fuera de cuadro.
//
// No se borran porque describen la caja y la caja está entera en `svgDeToma()`,
// esperando. El guardián del puente no las marca porque mira los exports y no
// sus propiedades — así que esto queda escrito acá, que es donde alguien las va
// a leer antes de preguntarse para qué están.

export const VARS_CABLE = {
  camino: '--cable-camino',
  // El grosor ya no viaja por custom property: lo escribe ui.js POR TRAMO, con
  // la profundidad de cada uno, para que el cable se afine con la distancia. Un
  // valor único en :root no puede hacer eso.
  color: '--cable-color',
  // LAS DOS ARISTAS DEL TUBO, y son dos nombres y no uno. `brillo` estuvo solo
  // mientras el cable tenía un lomo; un tubo necesita el par, porque lo que lo
  // hace redondo es el CONTRASTE entre las dos caras y no la línea de luz.
  // Y las dos aristas del tubo, que ya no son `brillo` y `sombra` con alfa sino
  // dos colores planos. Los nombres viejos —--cable-brillo y --cable-sombra— se
  // fueron con la mezcla: los leían las dos reglas de los filos y nada más.
  filoArriba: '--cable-filo-arriba',
  filoAbajo: '--cable-filo-abajo',
  energia: '--cable-energia',
  halo: '--cable-halo',
  sombraPuerto: '--cable-sombra-puerto',
  // EL CUERPO DEL CONECTOR, y ojo con el nombre del token que lo alimenta: es
  // GRIS_CHAPA_CABEZA, o sea la chapa de LA CABEZA. Ver tema.js.
  conectorCuerpo: '--conector-cuerpo',
  // Acá estaban las cinco de la caja del toma —tomaX, tomaY, tomaAncho,
  // tomaBrillo y tomaSaturacion—. Se fueron con el nodo #toma: ver el comentario
  // en index.html. Las leía una sola regla de style.css y esa regla ya no
  // existe, así que quedarse con ellas era escribir cinco variables que nadie
  // lee — el guardián del puente lo marcó, y con razón.
  //
  // TOMA_PARED.x e y siguen existiendo, pero ya no viajan al CSS: los usa ui.js
  // para saber a dónde va el cable, y el cable se dibuja en SVG.
  cicloBalanceo: '--cable-balanceo-ciclo',
  amplitudBalanceo: '--cable-balanceo-amplitud',
  // El radio del pulso NO viaja por custom property: es un atributo r del SVG y
  // lo escribe ui.js desde PULSOS_CABLE. Estuvo acá un rato y el test del puente
  // lo marcó como escrito sin lector, que es exactamente lo que era.
  // Y LA ESCALA DEL PULSO TAMPOCO VIAJA MÁS, que eran seis nombres. Existían
  // porque el pulso se achicaba a lo largo del cable para acompañar la
  // perspectiva; sin perspectiva, la rampa encogía el pulso hasta hacerlo
  // desaparecer en la mitad lejana sin corregir nada. Ver el keyframe
  // `viajar-pulso` en style.css.
  cicloPulso: '--cable-pulso-ciclo'
};

// Del tamaño de un puño de Chip: la mano de `cargando` mide ~12% del lienzo.
// Más alta que ancha, como una toma de verdad.
// El lienzo ahora es 40x38 y no 20x24: la caja se dibuja con su cara de arriba
// y su lateral, así que ocupa más ancho que alto. El frente propiamente dicho
// sigue midiendo lo mismo que antes en pantalla — lo que se agregó es el
// volumen, no el tamaño.
// El tamaño de la caja ya no se mide en % del alto de Chip: al fondo se mide en
// % de la escena, y ese número vive en TOMA_PARED. Estaba atado a Chip cuando
// la caja estaba a su lado.
const TAMANO_TOMA = { ancho: 13, alto: 12.3 };

// DÓNDE, DENTRO DEL DIBUJO, ENCHUFA EL CABLE. Es el centro del conector
// cilíndrico: (17, 20,6) de un viewBox de 40x38. Sin esto el CSS anclaba el
// borde de la caja a la punta del cable y el cable terminaba contra la chapa
// en vez de contra la boca del conector.
export const ANCLA_TOMA = { x: 0.425, y: 0.542 };

// LA PERSPECTIVA SE DIBUJA, NO SE TRANSFORMA.
//
// La versión anterior era un rectángulo de frente al que el CSS le aplicaba
// rotate(-1,6deg) + perspective(160px) + rotateX(14deg). Verificado en zoom al
// 400% en producción: no se ve. rotateX sobre una chapa plana la achata un poco
// y nada más — no aparece ninguna cara de arriba, porque no hay ninguna cara de
// arriba que mostrar. Una chapa inclinada sigue siendo una chapa.
//
// Ahora las tres caras están dibujadas en el SVG con la fuga medida, y el CSS no
// transforma nada. Por eso PERSPECTIVA_TOMA ya no existe: los grados que
// importan viven en el path, que es donde se pueden ver.
//
// La medición está contada entera arriba de TOMA en formas.js: dos juntas del
// piso intersectadas dan el punto de fuga en (835, 520) de una panorámica de
// 1672 de ancho —el centro horizontal exacto—, y desde la base de la toma la
// dirección a ese punto es 39° sobre la horizontal.

// La posición de la caja NO viaja más por acá: ahora va en % de la escena y en
// VARS_CABLE, porque la caja dejó de ser un accesorio anclado a Chip y pasó a
// ser mobiliario del fondo. Sobreviven las dos anclas, que dicen dónde está la
// BOCA del conector dentro del dibujo — eso es del SVG y no cambia con el lugar.
// Y acá estaba VARS_TOMA, con --toma-ancla-x y --toma-ancla-y. Se fue por lo
// mismo: las leía la regla de #toma, que ya no existe. ANCLA_TOMA sobrevive
// arriba porque describe el DIBUJO —dónde está la boca del conector adentro del
// SVG— y eso no cambia con que la caja esté puesta o no.

// LOS TONOS, MEDIDOS CONTRA LO QUE YA HAY EN ESE PISO.
//
// La primera calibración se hizo contra el piso crudo de la panorámica —89 de
// luminancia— y salió una caja de 28 a 65. En pantalla el piso mide 138, porque
// encima pasa la capa de luz de la escena, y la caja quedaba tres veces más
// oscura que todo lo que la rodea: una mancha negra pegada al piso.
//
// La referencia correcta no es el piso: es la CONSOLA que ya está dibujada en
// ese mismo piso, a la izquierda de la ventana. Medida en pantalla, a la misma
// hora:
//
//   consola, cara de arriba   197
//   consola, frente           159
//   consola, parte baja       136
//   piso                      140
//
// O sea: el mobiliario de este galpón es acero claro, MÁS claro que el piso, no
// más oscuro. La caja quedó en ese rango:
//
//   arriba   168   mira al techo
//   frente   119   degradé de chapa a bajo
//   lado      90   le da la espalda a la ventana
//
// El naranja es el mismo del juego, pero usado como lo usa el mundo —una franja
// pintada y gastada, igual que la placa de la consola— y no como un contorno
// encendido alrededor de la caja, que era lo que la hacía leer como un icono.
export const COLORES_TOMA = {
  arriba: '#a4a8ad',
  chapa: '#878c92',
  bajo: '#5f6469',
  lado: '#565b60',
  filo: '#23272c',
  hueco: '#101317',
  brillo: '#d7dce2',
  borne: '#c9a24a',
  naranja: '#c8781f',
  'naranja-alto': '#e8a24a',
  sombra: '#0c0f13'
};

// ---- LOS DOS TONOS DE LA CHAPITA QUE NO SON EL NARANJA BASE ----
//
// VIVEN ACÁ ABAJO Y NO ADENTRO DE COLORES_BOTON POR UNA RAZÓN DE ORDEN DE
// EVALUACIÓN, no de diseño: los dos SE REFERENCIAN, no se copian, y las dos
// fuentes están declaradas más abajo que COLORES_BOTON. Un módulo ES se evalúa
// de arriba abajo, así que ponerlos allá arriba sería un ReferenceError al
// cargar. Se probó.
//
// Viajan con el mismo prefijo `boton` que COLORES_BOTON —tema.js hace dos
// `tonos('boton', ...)` sobre el mismo espacio de nombres— así que del lado del
// CSS son `--boton-naranja-claro` y `--boton-naranja-apagado`, al lado del
// `--boton-naranja` de siempre. Que estén en dos tablas es un detalle de este
// archivo y no una división que el CSS tenga que conocer.
//
// NINGUNO DE LOS DOS ES UN HEX NUEVO, y eso era el pedido:
//
//   claro     #fff3d6, el núcleo del bulbo de `cargando`. Es el crema caliente
//             que el juego ya usa para decir "esto está encendido". Que la
//             chapita apretada use el mismo blanco cálido que la antena
//             cargando no es una coincidencia agradable: es que las dos cosas
//             dicen lo mismo.
//   apagado   #c8781f, el naranja gastado de la caja de conexión. Es el mismo
//             naranja del juego bajado en luminancia por el ilustrador, no por
//             una cuenta: ya existe pintado en la escena, sobre la caja que
//             está a un metro de la botonera.
export const COLORES_BOTON_CHAPITA = {
  'naranja-claro': COLORES_BULBO.cargando.nucleo,
  'naranja-apagado': COLORES_TOMA.naranja
};


// ---- El parpadeo ----

// La primera animación que pasa ADENTRO de Chip. Todo lo anterior desplazaba la
// imagen entera, que es lo que lo hacía leer como sticker.
//
// El achatado va alrededor del centro vertical de la región ocular, medido sobre
// los dos recortes: y=97 en idle y y=98 en feliz, sobre 256. Los dos redondean a
// 38%, así que alcanza una constante.
export const ORIGEN_PARPADEO = '38%';

// El color del párpado cerrado.
//
// Hace falta porque el sprite base tiene los ojos dibujados: al achatar la capa
// de ojos, los del cuerpo asomaban arriba y abajo de la banda —con el brillo
// blanco flotando sobre el "párpado", que es justo lo que delata una animación
// mal hecha—. Se verificó con zoom al 400% antes de arreglarlo.
//
// La solución es una capa que usa el MISMO recorte como máscara y lo rellena de
// este color, tapando los ojos del cuerpo. Queda debajo de la capa de ojos, así
// que en reposo no se ve nada distinto; sólo aparece cuando el ojo se cierra.
//
// EL GRIS DE LA CHAPA DE LA CABEZA. Vive acá y no adentro de otra constante
// porque es una MEDICIÓN del arte y la usan dos cosas que no tienen nada que ver
// entre sí: la calibración de la botonera —que tiene que estar en la familia del
// metal de Chip— y, hasta hoy, el párpado.
//
// Sale de la chapa que hay justo arriba de la región ocular, descartando el
// contorno y todo lo que no sea gris: mediana de 1067 px en idle (#696e7a) y de
// 947 px en feliz (#646973). El punto medio de los dos, a dos unidades de cada
// uno.
//
// Estaba guardado adentro de COLOR_PARPADO, que valía lo mismo por una razón que
// dejó de existir. Cuando el párpado volvió al crema, el número se habría ido con
// él y el test de la botonera se habría quedado comparando contra un durazno.
export const GRIS_CHAPA_CABEZA = '#676c77';

// EL COLOR ES EL CREMA DE LA CUENCA, y volvió a serlo. Vale contar las dos
// vueltas, porque la segunda no deshace la primera: la deshabilita.
//
// Original: #ffc493, el crema con el que el artista dibujó los ojos cerrados de
// `standby`.
//
// Se cambió a gris #676c77 —la chapa de la cabeza— por una razón medida y buena
// EN SU MOMENTO: la caricia dejaba los ojos a media asta achatando la capa al
// 45%, y la banda que quedaba al descubierto era contorno NEGRO —286 px en idle,
// 263 en feliz— y no cuenca. El crema ponía una banda clara donde el dibujo
// tiene el filo oscuro del ojo, y por eso se veía postizo.
//
// ESA CONDICIÓN YA NO EXISTE. El achatado se fue cuando la caricia pasó a usar
// recortes de verdad —ver RUTAS_OJOS_GESTO—: hoy el párpado sólo participa del
// PARPADEO, que son 130 ms y en el que la capa de ojos se achata a CERO. Lo que
// queda al descubierto ahí es la cuenca entera, que en el sprite es crema. O sea
// que el argumento del gris se apoyaba en un comportamiento que ya se borró.
//
// El valor sale de medir sobre idle-ojos.webp descartando la pupila y el
// contorno —sólo píxeles claros y cálidos, r > 150 y r − b > 30—: 2212 px, y el
// racimo dominante es #ffca9b / #ffca9a / #ffc899 / #ffc89a / #ffc99b, todos
// adentro de un par de unidades. #ffc899 cae en el medio. Feliz da lo mismo
// (#ffcb9f, #ffcda1, #ffc896).
//
// Y no es un color nuevo: es el durazno de la paleta cerrada del proyecto.
//
// Un párpado es la propia cuenca cerrándose. Si es de otro color se lee como un
// agujero en la cara, que es exactamente lo que se veía con el gris.
//
// No depende de la franja horaria: el sprite de Chip no lleva filtro por hora
// —lo único que cambia de noche es la escala del halo del bulbo— así que el
// párpado y la cuenca que lo rodea reciben siempre la misma luz.
export const COLOR_PARPADO = '#ffc899';

// 130 ms en total. El reparto interno —cierre 50, mantener 20, apertura 60— vive
// en los porcentajes del keyframe, porque es la forma del movimiento y no un
// número suelto: el párpado baja más rápido de lo que sube, como uno de verdad.
export const DURACION_PARPADEO_MS = 130;

// Intervalo entre parpadeos, resorteado después de cada uno. NUNCA fijo: a
// intervalo constante lee como metrónomo, que es peor que no parpadear.
export const PARPADEO_INTERVALO_MIN_MS = 2000;
export const PARPADEO_INTERVALO_MAX_MS = 6000;

// De vez en cuando parpadea dos veces seguidas. Es el detalle que lo saca de
// mecánico.
export const PROBABILIDAD_DOBLE_PARPADEO = 0.15;
export const ESPERA_DOBLE_PARPADEO_MS = 180;

// Cuánto se espera, después de la animación, para sacar la clase a mano. No es
// un margen de tolerancia: es el seguro de que #ojos vuelva a tapar el párpado
// aunque la animación nunca haya terminado. Ver la red de contención en ui.js.
export const MARGEN_FIN_PARPADEO_MS = 120;

export const CLASE_PARPADEO = 'parpadeando';

// ---- Los efectos por estado ----
//
// Damián borró los efectos que estaban dibujados en los siete sprites. Estos
// los reemplazan, animados y prendidos por la clase de estado.
//
// Los colores y los TAMAÑOS no están estimados: salen de medir por diferencia
// los sprites viejos contra los pelados, sacando los viejos de git. Lo que
// desapareció de cada uno es exactamente el efecto que había, con su caja y su
// paleta. La medición está anotada al lado de cada grupo.
//
// Todo lleva tres tonos —borde saturado, cuerpo, brillo— porque así está pintado
// el arte del juego. Sin borde, cualquier forma se hunde en la pared charcoal:
// la primera versión de los corazones, de un solo tono y a la mitad del tamaño,
// no se veía.

// Corazones de feliz. Los originales median 24x22 px sobre el lienzo de 256, o
// sea 9,4% del alto de Chip, y nacían pegados a los costados de la cabeza
// (17,8% y 80,3% de ancho, 21% de alto).
const COLORES_CORAZON = {
  borde: '#ff2741',
  cuerpo: '#ff8d90',
  brillo: '#ffe0df'
};

// Chispas de feliz: cuñas de 13-14 px de ancho, o sea 5,5%.
const COLORES_DESTELLO = {
  borde: '#ffb100',
  cuerpo: '#ffdc16'
};

// Rayitas de jugando: la misma cuña pero de 26x25, el doble, y en un amarillo
// más anaranjado. Es el estado más enérgico y el efecto lo tiene que decir.
const COLORES_RAYITA = {
  borde: '#e07d00',
  cuerpo: '#ffb900'
};

// Pulsos de cargando: la energía que sube por el cuerpo desde el enchufe hasta
// el rayo del pecho. Mismo cian del cable y del display.
const COLORES_PULSO = {
  halo: '#16c8e6',
  nucleo: '#eafcff'
};

// Burbujas de limpiando: redondas, de 20 a 26 px.
const COLORES_BURBUJA = {
  borde: '#7fd8f0',
  cuerpo: '#cdeffb',
  brillo: '#ffffff'
};

// Las Z del standby: 20x25 px el más grande, con contorno azul marino.
const COLORES_ZETA = {
  borde: '#00204b',
  cuerpo: '#00efff'
};

// ---- Dos reglas de composición, para los cinco estados ----
//
// 1. NADA toca la punta de la antena. El bulbo tiene su propio glow y es el
//    indicador de "encendido": una partícula que le pasa por encima le apaga la
//    lectura. La zona prohibida es un círculo de este radio alrededor de la
//    posición de POSICIONES_ANTENA, que cambia por estado.
//
//    No se resuelve con detección de colisiones: se resuelve componiendo. Las
//    partículas nacen a los costados de la cabeza y se van hacia afuera, así el
//    centro de arriba queda libre por construcción.
export const RADIO_EXCLUSION_ANTENA = 11; // % del contenedor

// 2. Los efectos tienen que caber en la silueta de Chip ensanchada un 30%. El
//    cuerpo va de x 14% a x 78% —medido sobre el sprite—, así que la franja
//    permitida es de 5% a 88%. Todo lo que se salga deja de leerse como algo que
//    le pasa a Chip y pasa a ser decoración de pantalla.
//
//    Los arcos que orbitaban en `cargando` medían 40% de ancho y arrancaban en
//    -4%: se leían como dos orejas cian, más grandes que la cabeza, y encima
//    tapaban el rayo del pecho, que era justo lo que había que enfatizar.
export const FRANJA_EFECTOS = { desde: 5, hasta: 88 }; // % del contenedor

// Cuántas piezas de cada cosa. Los corazones son cuatro y no tres para poder
// repartirlos en abanico simétrico: dos de un lado y dos del otro. Con tres, uno
// queda en el medio — arriba de la antena.
export const CORAZONES_FELIZ = 4;
export const DESTELLOS_FELIZ = 4;
export const RAYITAS_JUGANDO = 5;
export const PULSOS_CARGANDO = 4;
export const BURBUJAS_LIMPIANDO = 5;

// Ritmos. Cada estado tiene el suyo: no son partículas genéricas recoloreadas.
export const DURACION_RAYITA_MS = 700;
export const DURACION_PULSO_MS = 900;
export const DURACION_BURBUJA_MS = 2200;

// Un corazón tarda esto en nacer, subir en arco y apagarse.
// EL CORAZÓN SE TAMBALEA. Uno que sube perfectamente derecho parece un ícono;
// uno que oscila y gira parece que flota. El giro CAMBIA DE SENTIDO a mitad de
// camino —es una hoja cayendo al revés— y ese cambio es lo que lo hace leer como
// algo liviano en el aire y no como un sprite con una curva.
export const CORAZON = { giro: 8, bamboleo: 5 }; // grados y px

export const DURACION_CORAZON_MS = 2400;
export const ESPERA_ENTRE_CORAZONES_MS = 800;

// Los destellos no flotan: laten. Por eso duran mucho menos.
export const DURACION_DESTELLO_MS = 900;

// La tanda que dispara una acción que sube el humor. Dos o tres, no siempre los
// mismos: tres iguales cada vez volverían a leer como animación de estado.
export const CORAZONES_EXTRA_MIN = 2;
export const CORAZONES_EXTRA_MAX = 3;
export const CLASE_CELEBRANDO = 'celebrando';

// El puente de siempre hacia style.css, para lo que es del personaje.
export const VARS_PERSONAJE = {
  origenParpadeo: '--origen-parpadeo',
  duracionParpadeo: '--duracion-parpadeo',
  colorParpado: '--color-parpado',
  mascaraOjos: '--mascara-ojos',
  duracionCorazon: '--duracion-corazon',
  duracionDestello: '--duracion-destello',
  duracionRayita: '--duracion-rayita',
  duracionPulso: '--duracion-pulso',
  duracionBurbuja: '--duracion-burbuja'
};

// Las paletas de los efectos viajan por convención de nombre: cada grupo se
// escribe como `--<grupo>-<tono>`, o sea --corazon-borde, --burbuja-brillo, etc.
// Declarar catorce nombres a mano no agregaría nada: lo que importa es que el
// grupo y el tono estén en config, y ahí están.
export const GRUPOS_DE_COLOR = {
  corazon: COLORES_CORAZON,
  destello: COLORES_DESTELLO,
  rayita: COLORES_RAYITA,
  pulso: COLORES_PULSO,
  burbuja: COLORES_BURBUJA,
  zeta: COLORES_ZETA
};

// ---- Efectos de vida ----

// Micro-efectos de CSS superpuestos al canvas. Ninguno tiene lógica propia:
// los que dependen del estado de Chip se prenden con la clase que ui.js pone en
// el contenedor de la mascota, derivada de la MISMA cadena de estados que el
// sprite. Un efecto con su propio timer sería una segunda fuente de verdad.
export const PREFIJO_CLASE_ESTADO = 'estado-';

// El ciclo de la antena vive ahora en CICLOS_BULBO, con un valor por estado. El
// de reposo sigue siendo 3100 y sigue estando fuera de fase con la respiración
// de 3400 por la razón de siempre: dos ciclos del mismo largo se sincronizan y
// el conjunto se vuelve un metrónomo.

// Cada "z" del standby tarda esto en nacer, subir y apagarse.
// Las Z se ACERCAN mientras suben —escalan de 0,6 a 1,1— y se apagan ANTES de
// terminar el viaje, así se disuelven en el aire en vez de desaparecer en un
// punto. Una Z que se apaga justo al final del recorrido se lee como que la
// cortaron.
export const ZETA = { desde: 0.6, hasta: 1.1, seApagaEn: 0.78 };

export const CICLO_ZETA_MS = 4000;

// Una chispa de carga. El estado `cargando` dura DURACION_ESTADO_ACCION_MS
// (2 s), así que entran tres tandas antes de que el sprite vuelva a idle.
export const CICLO_CHISPA_MS = 600;

// Tres ciclos largos y desparejos para el polvo: si fueran múltiplos entre sí,
// las motas volverían a alinearse cada tanto y el ojo lo pesca.
//
// Cuántas motas hay, dónde nacen y cuánto brilla cada una NO está acá: está en
// el markup y en style.css, igual que las posiciones de los corazones y de las
// burbujas. Son composición, no parámetros — moverlas es mirar el cuadro, y el
// cuadro está en la hoja de estilos.
export const CICLOS_POLVO_MS = [11_000, 14_000, 17_000];

// cicloAntena y cicloAntenaNoche se fueron: los reemplazó CICLOS_BULBO, que
// tiene un ritmo por estado en vez de uno solo más el de noche. El bulbo dejó de
// ser un halo encima del dibujo y pasó a ser la luz misma; ver COLORES_BULBO.
export const VARS_EFECTOS = {
  cicloZeta: '--ciclo-zeta',
  cicloChispa: '--ciclo-chispa',
  ciclosPolvo: ['--ciclo-polvo-1', '--ciclo-polvo-2', '--ciclo-polvo-3']
};

// ---- Eventos (vida propia) ----

// Menos de 1 hora, nada. Entre 1 y 6, un evento. Más de 6, hasta dos.
export const HORAS_MINIMAS_EVENTO = 1;
export const HORAS_DOS_EVENTOS = 6;
export const MAX_EVENTOS_POR_VISITA = 2;

// Con qué arranca ultimosEventosIds en una partida nueva: sin nada excluido.
// Se copia al crear el estado, nunca se comparte la referencia.
export const EVENTOS_INICIALES_IDS = [];

// ---- La colección ----

// Los dos tiers de objeto. Nombres declarados acá para que no haya strings
// sueltos entre datos-objetos.js y coleccion.js.
export const TIERS_OBJETO = {
  comun: 'comun',
  raro: 'raro'
};

// Con qué probabilidad se otorga un objeto raro en una visita que lo tenía a
// tiro. Fracción, no porcentaje: 0.04 es 4%, dentro del 3-5% que fija el brief.
//
// La tirada es UNA por visita, no una por objeto: si algún día dos raros caen
// en la misma visita, o entran los dos o no entra ninguno. Que la escasez sea
// del momento y no de cada pieza.
export const PROBABILIDAD_OBJETO_RARO = 0.04;

// Techo de objetos por visita. La tabla de horas ya limita los EVENTOS a dos,
// pero un solo evento puede dejar tres objetos —el 8 deja resorte, arandela y
// la-cosa—, así que sin este techo una vuelta de ausencia larga podía entregar
// cinco cosas de golpe. El brief pide 1 a 3, nunca más.
export const MAX_OBJETOS_POR_VISITA = 3;

// Con qué arranca la colección en una partida nueva. Se copia al crear el
// estado, nunca se comparte la referencia.
export const COLECCION_INICIAL = [];

// ---- Lo que quedó tirado en el piso ----
//
// CONVIVE CON LOS EVENTOS, no los reemplaza. Los eventos siguen otorgando
// objetos solos; esto es un extra ocasional y de otra naturaleza: el evento te
// CUENTA que Chip encontró algo, y esto te muestra que lo encontró y no lo
// guardó. Es un rastro, no un aviso.
//
// Por eso aparece al ABRIR y no durante la sesión: ya estaba ahí cuando
// llegaste. Un objeto que se materializa con la app abierta sería un spawn, y
// un spawn es de otro juego.
export const PROBABILIDAD_OBJETO_PISO = 0.15;

// LA ZONA SEGURA DEL PISO, medida contra la escena y no estimada.
//
// El pedido decía "que no quede tapado por Chip ni por la botonera". Son dos
// obstáculos, y en el galpón hay TRES: el cartel de evento se apoya en el piso
// —medido: y 86,7% a 92,2%, de x 3 a x 97— y NO SE VA NUNCA; una vez que
// mostrarEventos lo prende se queda toda la sesión. Y el objeto aparece
// exactamente en la misma apertura que el cartel, así que la franja de adelante,
// que era la candidata obvia, es justo la que está ocupada.
//
// De ahí las dos franjas laterales.
//
// LOS LÍMITES DE X SE REMIDIERON, y los de antes estaban mal. Decían "abajo de
// la mitad ninguna pose pasa de x 18,2% ni de x 74,7%", y esos dos números son
// los de `critico` sola: la medición vieja se quedó con una pose y los anotó
// como si fueran la unión de las nueve. En la franja del piso `jugando` llega a
// x 82,5% con su rueda derecha, o sea DENTRO de la franja de la derecha, que
// arrancaba en 80. Novena vez que un instrumento engaña en el proyecto, y esta
// vez el instrumento era una medición que se verificó a sí misma.
//
// Ahora el contorno sale de SILUETA_CHIP, que es la misma huella que recorta la
// zona táctil de Chip.
//
// Y HAY QUE HACER LA CUENTA EN DOS PANTALLAS, no en una, porque la caja de Chip
// mide 44% del ALTO y la escena tiene el ancho topado en 480: cuanto más
// angosta y alta la pantalla, más ancho ocupa Chip en proporción. En 480x945 su
// caja es el 86,6% del ancho; en 390x844 es el 95,2%. La franja libre no es la
// misma en las dos, y la que manda es la peor:
//
//                       480x945        390x844
//   silueta izquierda   x 16,8         x 13,5
//   silueta derecha     x 79,0         x 81,9
//   media pieza         3,8 puntos     4,6 puntos
//
// Los límites de abajo dejan la pieza DIBUJADA sin tocar la silueta en las dos.
// La caja táctil, que es más grande que el dibujo, se solapa medio punto en la
// pantalla angosta, y eso lo resuelve el orden de apilado — ver #piso en
// style.css. tests/orquestador.test.js rehace las dos cuentas.
//
// `y` es la BASE del objeto —dónde apoya— y no su borde de arriba, igual que
// BASES_OBJETO en la repisa: lo que uno quiere tocar es la línea de apoyo.
// El techo de 86 deja la pieza entera arriba del cartel de evento.
export const ZONA_PISO = {
  y0: 72,
  y1: 86,
  // Se sortea entre las dos con peso por ancho, así que la de la derecha —que
  // es más ancha porque hay más piso libre de ese lado— sale más seguido. Con
  // peso parejo el objeto caería en la franja angosta la mitad de las veces y
  // la izquierda se leería como su lugar fijo.
  franjas: [
    { x0: 5, x1: 8.8 },
    { x0: 87, x1: 94 }
  ]
};

// EL TAMAÑO DE LA PIEZA TIRADA, y su caja táctil, que no son lo mismo.
//
// Medía 25 px de lado en una escena de 480: poco más de la mitad del mínimo
// táctil de 44, y además difícil de descubrir — una cosa de 25 px en una escena
// de 480 es fácil de no ver. El dibujo sube a 36 y el área táctil va a 44 con
// padding invisible alrededor, que es el mismo reparto que ya hace el botón del
// menú: grande para el dedo, discreta para el ojo.
//
// En píxeles y no en % de la escena a propósito: 44 px es un mínimo del DEDO, y
// el dedo no se achica cuando la ventana es más angosta.
export const OBJETO_PISO = { lado: 36, toque: 44 };

// EL BRILLO QUE LO HACE DESCUBRIBLE. El pedido pide "un brillo muy sutil o un
// movimiento mínimo", y explícitamente NO un ícono parpadeante.
//
// Es un halo que respira, no un blink: la opacidad nunca baja de `alfaMin`, así
// que la pieza no desaparece en ningún momento del ciclo — lo que cambia es
// cuánta luz junta. Ciclo largo a propósito: a 4,4 s el ojo lo registra como
// que algo ahí devuelve luz, no como que algo titila.
export const BRILLO_PISO = {
  ciclo: 4400,
  color: '#ffe6b0',
  radioMin: 2,
  radioMax: 8,
  alfaMin: 0.3,
  alfaMax: 0.75
};

// EL VUELO AL ESTANTE. Un arco, no una recta: el pedido dice "animación de arco"
// y además una recta entre dos puntos de la pantalla se lee como una transición
// de interfaz, no como algo que alguien levantó y guardó.
//
// `altura` es cuánto sube el VÉRTICE de la curva por encima del punto más alto
// de los dos, en % del alto de la escena — no dónde va el punto de control. La
// diferencia no es una sutileza: una Bézier cuadrática no pasa por su control,
// y pedir 11 ahí daba un arco de 1,9. Ver caminoDeVuelo en formas.js.
//
// Seis puntos sobre un tramo vertical de cuarenta y cinco: alcanza para que se
// lea como levantar y apoyar, y no llega a leerse como un tiro por elevación.
export const VUELO_OBJETO = { duracion: 760, altura: 6 };

// CUÁNTO DURA LA CARA DE FASTIDIO cuando le ordenás algo que él tenía ahí.
export const DURACION_FASTIDIO_MS = 2000;

export const VARS_PISO = {
  brilloCiclo: '--brillo-piso-ciclo',
  brilloColor: '--brillo-piso-color',
  brilloRadioMin: '--brillo-piso-radio-min',
  brilloRadioMax: '--brillo-piso-radio-max',
  brilloAlfaMin: '--brillo-piso-alfa-min',
  brilloAlfaMax: '--brillo-piso-alfa-max',
  vueloDuracion: '--vuelo-duracion',
  vueloCamino: '--vuelo-camino',
  lado: '--objeto-piso-lado',
  toque: '--objeto-piso-toque'
};

export const CLASE_VOLANDO = 'volando';
export const CLASE_EN_PISO = 'en-piso';

// ---- Los gigantes ----

// Presencia: días distintos en que el jugador abrió el juego. No visitas —abrir
// tres veces el mismo día cuenta uno— y no tareas. Estar es lo único que hace
// avanzar esto, que es lo que lo separa de una barra de progreso.
export const PRESENCIA_INICIAL = 0;

// Las capas en que se revela un gigante. El orden importa: es el orden en que
// se descubren.
export const CAPAS_GIGANTE = ['silueta', 'nombre', 'detalle', 'hito'];

// Cuántos días de presencia pide cada capa. La silueta está desde el día cero:
// el casillero vacío es lo que hace preguntar quién es.
//
// El hito a 30 días es a propósito lento. Es el único momento en que el mundo
// mira a Chip, y vale porque llegar ahí llevó meses de estar. Bajarlo lo
// arruina, no lo mejora — es la misma lógica que tenía el 1.5% de antes, pero
// ahora la escasez tiene estructura narrativa en vez de ser una moneda.
export const UMBRALES_GIGANTE = {
  silueta: 0,
  nombre: 3,
  detalle: 10,
  hito: 30
};

// Con qué arranca la lista de hitos ya vistos. Un hito se dispara UNA vez en la
// vida de la partida: por eso se anota, y por eso no alcanza con mirar los días.
export const HITOS_INICIALES = [];

// ---- Service worker ----

export const RUTA_SW = './sw.js';

// El SW se registra siempre, incluido en desarrollo: localhost y 127.0.0.1 son
// contextos seguros, así que funciona ahí sin trucos. Si Live Server empieza a
// servir archivos rancios, la solución es "Update on reload" en DevTools, no
// desactivar el SW — ver el bloque de cabecera de sw.js.

// OJO: CACHE_VERSION y la lista de archivos cacheados NO viven acá, viven en
// sw.js. El navegador dispara el update comparando los bytes de sw.js, así que
// una versión declarada afuera dejaría ese archivo idéntico y el update podría
// no dispararse nunca. El bloque de cabecera de sw.js explica el carve-out.
// Lo mismo con manifest.json, que al ser JSON estático no puede importar nada:
// duplica background_color y theme_color (#0d0f14). Se cambian juntos.

// ---- Panel de debug ----

// El panel se activa con ?debug en la URL. En juego normal debug.js ni se
// descarga: main.js lo carga con import dinámico.
// ---- El ambiente del galpón ----
//
// Un archivo por tramo del día, con la MISMA tabla horaria que gobierna los
// fondos: la hora se resuelve una vez y de ahí salen el sprite, la luz, el fondo
// y el sonido. Un reloj propio para el audio sería una segunda fuente de verdad.
//
// `lluvia` está cargada y SIN ENGANCHAR. Es para el evento 16 del canon —"Miró
// la lluvia por la ventana del fondo. Es su ventana."— que todavía no tiene
// disparador. Queda en la tabla para que el día que se enganche sea agregar la
// llamada y nada más; y NO es un quinto tramo ni un sistema de clima: la lluvia
// es un evento, y armarle un sistema propio sería un sistema entero para un
// solo caso.
export const AMBIENTES = {
  amanecer: 'sonidos/ambiente-amanecer.ogg',
  mediodia: 'sonidos/ambiente-dia.ogg',
  atardecer: 'sonidos/ambiente-dia.ogg',
  noche: 'sonidos/ambiente-noche.ogg',
  lluvia: 'sonidos/ambiente-lluvia.ogg'
};

export const SONIDO = {
  // Bajo. Es ambiente, no música: tiene que estar abajo de todo y notarse
  // cuando no está, no cuando está.
  volumen: 0.28,
  // El cruce entre tramos, y el del archivo consigo mismo al terminar. Los dos
  // usan el mismo número porque son el mismo problema: dos fuentes y una
  // transición.
  cruceMs: 2600,
  // La primera entrada, al prender el sonido: más lenta, para que no aparezca
  // de golpe.
  entradaMs: 1800,
  // Cuántos puntos tiene la curva de igual potencia que se le pasa a
  // setValueCurveAtTime. No es una frecuencia de refresco —la curva la
  // interpola el motor de audio, muestra por muestra— sino cuántos puntos
  // definen su forma. 128 sobre un seno de un cuarto de vuelta deja el error de
  // interpolación por debajo de 0,01 dB, que es inaudible.
  //
  // Reemplaza a `pasoCruceMs`, que era el intervalo del setInterval que movía la
  // ganancia a mano. Ese intervalo se estrangulaba en segundo plano y dejaba al
  // que salía con ganancia todavía arriba cuando el archivo terminaba: un corte
  // seco. Ahora la rampa la programa el reloj de audio de una sola vez.
  pasosCurva: 128
};

export const PARAM_DEBUG = 'debug';

// CÓMO SE ABRE EL PANEL EN LA APP INSTALADA.
//
// Con ?debug=1 no alcanza: la PWA instalada arranca en la start_url cacheada y
// el service worker responde con caches.match SIN ignoreSearch, así que el
// parámetro no llega a ningún lado. Para probar en el teléfono había que abrir
// Chrome aparte, que es justamente lo que la app instalada viene a evitar.
//
// EL GESTO CAMBIÓ: eran tres segundos apretando el botón del menú, ahora son
// CINCO TOQUES EN LA ESQUINA DE ARRIBA A LA IZQUIERDA.
//
// El long-press estaba bien pensado —reutilizaba un control existente y nadie
// sostiene un botón de menú tres segundos sin querer— pero no funcionaba con el
// dedo en la PWA instalada, y se le hicieron las cuatro cosas que un gesto
// sostenido necesita en un teléfono: touch-action, user-select y touch-callout
// en el CSS, contextmenu prevenido, captura del puntero y cancelación por
// distancia en vez de por pointerleave. Están todas puestas y sigue sin abrir.
//
// A esa altura el problema deja de ser cuál falta y pasa a ser que el gesto
// COMPITE con el navegador: un dedo quieto tres segundos sobre un control es
// exactamente la firma que Android y iOS se reservan, y cada capa —el navegador,
// la webview, el gestor de ventanas de la PWA— puede cancelarlo por su cuenta
// sin avisar. No hay forma de verificarlo desde acá: los eventos sintéticos
// pasan justamente porque no disparan nada nativo.
//
// Cinco toques rápidos no compiten con nada. Un tap es el gesto más barato y
// mejor soportado que hay, y cinco seguidos en menos de dos segundos no pasan
// por accidente. La esquina de arriba a la izquierda está vacía —Chip arranca en
// el 38% del alto, el botón del menú está en la otra esquina— así que la zona no
// le roba el toque a nada.
//
// Lo que se pierde es que el gesto ya no vive sobre un control visible; a cambio
// una puerta de servicio invisible es más honesta que una escondida adentro de
// un botón que sí hace otra cosa.
export const TOQUES_DEBUG = 5;
export const VENTANA_DEBUG_MS = 2000;

// La esquina, en píxeles. En px y no en % por la misma razón que la caja del
// objeto — el dedo no se achica con la ventana.
//
// SUBIÓ DE 44 A 56, y no es "por las dudas". 44 es el mínimo táctil para un
// control que se VE: el dedo apunta a algo. Acá no hay nada dibujado, así que
// el jugador apunta a una esquina de memoria y el error de puntería es mayor.
// Un blanco invisible del tamaño del mínimo visible está mal dimensionado.
export const ESQUINA_DEBUG = 56;

// Y NO ARRANCA PEGADA AL BORDE. Estaba en el vértice exacto del área segura, y
// esa franja es de la que menos se puede confiar en un teléfono: ahí viven el
// gesto de barrido del sistema, la barra de estado y el borde curvo de la
// pantalla. Un toque a 2 px del canto lo puede tragar cualquiera de los tres,
// y desde el JS eso se ve igual que un toque que nunca pasó.
//
// 12 px adentro la saca de esa franja sin moverla de la esquina.
export const MARGEN_DEBUG = 12;

// CUÁNTO DURA EL ACUSE DE CADA TOQUE. Ver la puerta de servicio en style.css:
// existe porque cinco toques que no abren nada eran indistinguibles de cinco
// toques que no se registraron, y en un teléfono no hay consola para desempatar.
export const ACUSE_DEBUG_MS = 220;

export const VARS_DEBUG = {
  esquina: '--esquina-debug',
  margen: '--margen-debug',
  acuse: '--acuse-debug'
};
export const OPCION_DEBUG_AUTO = 'auto';

// Opciones del selector de hora del panel: 0 a 23. Forzar la hora mueve el
// reloj entero, así que arrastra el sprite y el fondo juntos.
export const HORAS_DEL_DIA = 24;
export const MULTIPLICADOR_DEBUG_INICIAL = 1;
export const HORAS_DEBUG_INICIAL = 1;
export const DIAS_DEBUG_INICIAL = 10;

// Estilos inline del panel, por simetría con PLACEHOLDER: es una superficie de
// desarrollo y no justifica ensuciar style.css, que es del juego.
// EL PANEL ARRANCA PLEGADO, y eso es un arreglo y no una preferencia.
//
// Medido a 390 px de ancho: el panel ocupaba de x=172 a x=382 y de y=8 a y=587
// —la mitad derecha de la pantalla, encima de Chip— con `pointer-events: auto`.
// O sea que abrir el juego con ?debug=1 en un teléfono dejaba media escena sin
// poder tocar. Fue lo que hizo que la caricia "no funcionara" al probarla.
//
// Y no tenía `id` ni clase, así que tampoco había forma de apuntarle desde un
// test para denunciarlo.
//
// Plegado es una barrita en la esquina. Se despliega tocándola, y en pantallas
// angostas se despliega ABAJO y a lo ancho, que es donde no está Chip.
export const PANEL_DEBUG = {
  ancho: '210px',
  margen: '8px',
  padding: '10px',
  fondo: '#14161d',
  borde: '1px solid #2a2d38',
  radio: '8px',
  color: '#e6e6e6',
  fuente: '12px system-ui, sans-serif',
  separacion: '8px',
  zIndex: '9999',
  // Abajo de este ancho, desplegado va abajo y a lo ancho en vez de al costado.
  // 720: arriba de eso hay lugar para la columna del juego y el panel al lado.
  anchoAngosto: 720,
  // Cuánto de la pantalla puede ocupar desplegado en angosto. El resto scrollea.
  altoMaximoAngosto: '45vh'
};

// ---- Placeholder del canvas (cuando no hay sprite disponible) ----

export const PLACEHOLDER = {
  proporcion: 0.5,
  colorRelleno: '#2a2d38',
  colorBorde: '#4a4f5e',
  grosorBorde: 2,
  colorTexto: '#e6e6e6',
  fuente: '20px system-ui, sans-serif'
};
