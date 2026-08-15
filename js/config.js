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
// gigantes: `diasDePresencia`, `ultimoDiaVisitado` y `hitosVistos`.
export const VERSION_ESTADO = 5;

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
  cargar: { bateria: 40 },
  jugar: { humor: 30, bateria: -10 },
  limpiar: { mantenimiento: 50 }
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
  critico: 'sprites/critico.png',
  standby: 'sprites/standby.png',
  cargando: 'sprites/cargando.png',
  jugando: 'sprites/jugando.png',
  limpiando: 'sprites/limpiando.png',
  feliz: 'sprites/feliz.png',
  idle: 'sprites/idle.png'
};

// Recortes de la región ocular, para el parpadeo. Están alineados al MISMO
// lienzo de 256x256 que su sprite base, así que la capa se superpone sin
// calcular ningún offset: se dibuja en las mismas coordenadas.
//
// Sólo idle y feliz. Los demás estados no tienen recorte y no parpadean, que es
// lo correcto por diseño: standby ya tiene los ojos cerrados, critico
// entrecerrados y jugando guiña. Un estado sin recorte no es un error — es un
// estado que no parpadea.
export const RUTAS_OJOS = {
  idle: 'sprites/idle-ojos.png',
  feliz: 'sprites/feliz-ojos.png'
};

// Fondos del galpón, detrás de Chip. Mismo criterio que RUTAS_SPRITES: las
// rutas de assets viven acá y no desperdigadas entre el CSS y el JS. Son
// document-relative porque las consume una propiedad inline puesta desde ui.js,
// no una regla de style.css.
//
// Cuál de los dos se muestra lo decide la MISMA franja horaria que el standby
// (ver esDeNoche en sprites.js): si Chip duerme, afuera es de noche.
export const RUTAS_FONDOS = {
  dia: 'sprites/fondo-dia.png',
  noche: 'sprites/fondo-noche.png'
};

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
export const FONDO_ENTRADA = 0.08;
export const FONDO_PROPORCION = 1672 / 941;
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
// CSS. Sale del mismo esDeNoche que el fondo: una sola fuente de verdad.
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

export const UMBRAL_FELIZ_BATERIA = 70; // estricto: > 70
export const UMBRAL_FELIZ_HUMOR = 70; // estricto: > 70

export const HORA_STANDBY_INICIO = 23; // inclusive
export const HORA_STANDBY_FIN = 7; // exclusive -> franja 23:00 a 06:59

// ---- Ritmo visual ----

// Cuánto dura en pantalla el estado disparado por una acción antes de que la
// cadena se reevalúe.
export const DURACION_ESTADO_ACCION_MS = 2000;

// Ventana mínima entre dos cambios de estado visual automáticos. Las acciones
// del jugador la saltean: apretar un botón tiene que responder al instante.
export const DEBOUNCE_VISUAL_MS = 2000;

// Cada cuánto se reevalúa la cadena sin que pase nada. Su único efecto real es
// detectar el cruce de HORA_STANDBY_INICIO y HORA_STANDBY_FIN con la app
// abierta: no toca stats, no aplica decay, no guarda.
export const TICK_VISUAL_MS = 60_000;

// ---- Animaciones de vida ----

// Rebote permanente: Chip respira siempre, en todos los estados.
//
// 2.2 s y no 2 a propósito. DEBOUNCE_VISUAL_MS y DURACION_ESTADO_ACCION_MS
// valen 2 s los dos: un ciclo del mismo largo quedaría en fase con ellos y el
// cambio de sprite caería siempre en el mismo punto del rebote, que es
// justamente lo que hace que una animación se vea mecánica.
export const CICLO_REBOTE_MS = 2200;

// Salto de acción: sube y vuelve, una sola vez, montado encima del rebote.
export const DURACION_SALTO_MS = 300;

// Cuánto tarda una barra en viajar hasta su nuevo ancho en vez de saltar.
export const TRANSICION_BARRA_MS = 400;

// Cuánto tarda un botón en hundirse y volver. Corto a propósito: es el acuse de
// recibo del dedo, no una animación. Más lento se siente lento, no suave.
export const DURACION_PRESION_MS = 90;

// La otra punta de estos tres números está en style.css, que no puede importar
// un módulo. En vez de duplicarlos ahí (sería un cuarto carve-out de la regla
// de config.js), ui.js los inyecta como custom properties en :root al arrancar
// y la hoja los lee con var(). Sin JS no hay animación, que es exactamente lo
// que corresponde.
export const VARS_ANIMACION = {
  cicloRebote: '--ciclo-rebote',
  duracionSalto: '--duracion-salto',
  transicionBarra: '--transicion-barra',
  duracionPresion: '--duracion-presion',
  transicionPanel: '--transicion-panel',
  duracionLlegada: '--duracion-llegada'
};

// Clase que dispara el salto. La declara style.css, la pone y la saca ui.js.
export const CLASE_SALTO = 'saltando';

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
export const DURACION_LLEGADA_MS = 400;

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
// Es puro CSS sobre la escena que ya existe: un degradé radial detrás de Chip,
// sin arte nuevo. Chip no se mueve — el que se mueve es el taller.
//
// Las franjas son [desde, hasta) en hora local, y cierran contra la franja de
// standby: de 23 a 7 no hay luz, que es cuando el fondo ya es el nocturno.
export const FRANJAS_LUZ = [
  { nombre: 'amanecer', desde: 7, hasta: 11, x: '20%', y: '76%', radio: '58%', color: '#ffae5e', fuerza: 0.32 },
  { nombre: 'mediodia', desde: 11, hasta: 16, x: '36%', y: '66%', radio: '40%', color: '#fff2d2', fuerza: 0.18 },
  { nombre: 'tarde', desde: 16, hasta: 20, x: '58%', y: '79%', radio: '64%', color: '#ff8a3c', fuerza: 0.36 },
  { nombre: 'anochecer', desde: 20, hasta: 23, x: '66%', y: '83%', radio: '52%', color: '#c9683f', fuerza: 0.18 }
];

export const VARS_LUZ = {
  x: '--luz-x',
  y: '--luz-y',
  radio: '--luz-radio',
  color: '--luz-color',
  fuerza: '--luz-fuerza'
};

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
  cargando: { x: 44.2, y: 8.3 },
  jugando: { x: 60.5, y: 6.5 },
  limpiando: { x: 45.9, y: 8.8 }
};

export const VARS_ANTENA = {
  x: '--antena-x',
  y: '--antena-y'
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
export const PUNTA_DEL_CABLE = { x: 79.7, y: 98.6 };

// Del tamaño de un puño de Chip: la mano de `cargando` mide ~12% del lienzo.
// Más alta que ancha, como una toma de verdad.
export const TAMANO_TOMA = { ancho: 11, alto: 13 }; // % del alto de Chip

export const VARS_TOMA = {
  x: '--toma-x',
  y: '--toma-y',
  ancho: '--toma-ancho',
  alto: '--toma-alto-caja'
};

// La chapa sale de la paleta del galpón, no inventada: el gris del metal de las
// piezas y el naranja que ya usan las hombreras de Chip y el borde del estante.
export const COLORES_TOMA = {
  alto: '#4a505c',
  chapa: '#343a45',
  bajo: '#22262e',
  borde: '#c8781f',
  filo: '#0b0e13',
  hueco: '#05070a',
  brillo: '#8f98a8'
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
// El color no está elegido a ojo: es el que el artista usó para dibujar los ojos
// cerrados de `standby`, muestreado de ese sprite (#ffc493, 103 px, dominante de
// su zona ocular después del contorno negro).
export const COLOR_PARPADO = '#ffc493';

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
export const COLORES_CORAZON = {
  borde: '#ff2741',
  cuerpo: '#ff8d90',
  brillo: '#ffe0df'
};

// Chispas de feliz: cuñas de 13-14 px de ancho, o sea 5,5%.
export const COLORES_DESTELLO = {
  borde: '#ffb100',
  cuerpo: '#ffdc16'
};

// Rayitas de jugando: la misma cuña pero de 26x25, el doble, y en un amarillo
// más anaranjado. Es el estado más enérgico y el efecto lo tiene que decir.
export const COLORES_RAYITA = {
  borde: '#e07d00',
  cuerpo: '#ffb900'
};

// Pulsos de cargando: la energía que sube por el cuerpo desde el enchufe hasta
// el rayo del pecho. Mismo cian del cable y del display.
export const COLORES_PULSO = {
  halo: '#16c8e6',
  nucleo: '#eafcff'
};

// Burbujas de limpiando: redondas, de 20 a 26 px.
export const COLORES_BURBUJA = {
  borde: '#7fd8f0',
  cuerpo: '#cdeffb',
  brillo: '#ffffff'
};

// Las Z del standby: 20x25 px el más grande, con contorno azul marino.
export const COLORES_ZETA = {
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

// La antena late fuera de fase con el rebote de 2.2 s a propósito: dos ciclos
// del mismo largo se sincronizan y el conjunto se vuelve mecánico.
export const CICLO_ANTENA_MS = 3100;

// De noche el corazón va lento. Ver esDeNoche: es la misma franja del standby.
export const CICLO_ANTENA_NOCHE_MS = 5000;

// Cada "z" del standby tarda esto en nacer, subir y apagarse.
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

export const VARS_EFECTOS = {
  cicloAntena: '--ciclo-antena',
  cicloAntenaNoche: '--ciclo-antena-noche',
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
export const PARAM_DEBUG = 'debug';
export const OPCION_DEBUG_AUTO = 'auto';

// Opciones del selector de hora del panel: 0 a 23. Forzar la hora mueve el
// reloj entero, así que arrastra el sprite y el fondo juntos.
export const HORAS_DEL_DIA = 24;
export const MULTIPLICADOR_DEBUG_INICIAL = 1;
export const HORAS_DEBUG_INICIAL = 1;
export const DIAS_DEBUG_INICIAL = 10;

// Estilos inline del panel, por simetría con PLACEHOLDER: es una superficie de
// desarrollo y no justifica ensuciar style.css, que es del juego.
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
  zIndex: '9999'
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
