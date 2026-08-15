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
// los dos campos nuevos del sistema de hallazgos.
export const VERSION_ESTADO = 4;

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
  transicionPanel: '--transicion-panel'
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

// Cuánto tarda el segundo evento de la visita en reemplazar al primero. Se ve
// uno por vez: son dos líneas sueltas en el mundo, no una lista.
export const ESPERA_SEGUNDO_EVENTO_MS = 4000;

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

// ---- Eventos raros ----

// El evento raro (EVENTO_RARO en datos-eventos.js) no está en el pool: no se
// sortea, se tira una moneda cargada una sola vez por visita con evento. Si
// sale, ocupa uno de los lugares de la visita en vez de sumar uno más, así la
// cuenta por horas de arriba no cambia.
//
// La escasez ES el diseño: es el único momento en que el mundo mira a Chip, y
// vale porque un jugador lo ve una vez cada varios meses. Subir este número lo
// arruina, no lo mejora.
export const PROBABILIDAD_EVENTO_RARO = 0.015; // 1.5%

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
