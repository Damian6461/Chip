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

// Fondos del galpón, detrás de Chip. Mismo criterio que RUTAS_SPRITES: las
// rutas de assets viven acá y no desperdigadas entre el CSS y el JS. Son
// document-relative porque las consume una propiedad inline puesta desde ui.js,
// no una regla de style.css.
//
// Cuál de los dos se muestra lo decide la MISMA franja horaria que el standby
// (ver esDeNoche en sprites.js): la noche del mundo la manda FRANJAS_DIA, no
// el standby. Chip puede estar despierto de noche y dormido de madrugada.
export const RUTAS_FONDOS = {
  dia: 'sprites/fondo-dia.webp',
  noche: 'sprites/fondo-noche.webp'
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

export const UMBRAL_FELIZ_BATERIA = 70; // estricto: > 70
export const UMBRAL_FELIZ_HUMOR = 70; // estricto: > 70

export const HORA_STANDBY_INICIO = 23; // inclusive
export const HORA_STANDBY_FIN = 7; // exclusive -> franja 23:00 a 06:59

// ---- Ritmo visual ----

// Cuánto dura en pantalla el estado disparado por una acción antes de que la
// cadena se reevalúe.
export const DURACION_ESTADO_ACCION_MS = 2000;

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
// El LED de las teclas disponibles. Va fuera de fase con la antena y con el
// rayo del pecho: tres latidos del mismo largo se sincronizan y el aparato
// entero se vuelve un metrónomo.
export const CICLO_LED_MS = 2400;

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
  cargando: { x: 44.2, y: 8.3 },
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
  y: '--antena-y'
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

export const VARS_SOMBRA = {
  y: '--apoyo-y',
  x: '--apoyo-x',
  ancho: '--apoyo-ancho'
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
  cargando: { x: 43.0, y: 61.3, ancho: 18.7, alto: 12.9, giro: 0, vidrio: '#002137' },
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
export const REPISA = { x: 60, y: 29.5, ancho: 28, alto: 3.4 };

// DOS ESTANTES. La separación va en % de la escena, igual que el resto de la
// geometría de la pared, para que el hueco entre tablas no cambie con el
// viewport. 6,2% es lo que entra una pieza de las grandes con aire arriba: menos
// y la fila de abajo se lee apretada contra la de arriba.
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
export const COLOR_APERTURA = '#181b1f';

// El velo se apaga en 360 ms y Chip entra 160 ms después, ya empezada la
// escena. El orden es la mitad del efecto: primero está el galpón, después
// aparece Chip EN el galpón. Si entran juntos se lee como que la imagen tardó
// en cargar; escalonados se lee como que alguien prendió la luz.
export const DURACION_APERTURA_MS = 360;
export const RETARDO_CHIP_APERTURA_MS = 160;
export const DURACION_ENTRADA_CHIP_MS = 320;

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
export const COLORES_PANEL = {
  chapa: '#2b313c',
  filo: '#0b0e13',
  hueco: '#12161d',
  linea: '#5d6675'
};

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
export const CONECTOR_PECHO = { x: 52.9, y: 77.5 };

// EL CABLE, dibujado y animado por código.
//
// La forma es una CATENARIA —la caída natural de algo que cuelga por su propio
// peso— y no una recta ni un arco simétrico. Se aproxima con una cúbica de dos
// puntos de control tirados hacia abajo: la diferencia con un arco simétrico es
// que la panza cae más cerca del extremo bajo, que es lo que hace un cable de
// verdad.
export const CABLE = {
  grosor: 3.4,
  // Cuánto cuelga la panza respecto de la cuerda entre los dos extremos, en % de
  // la distancia. Un cable flojo pero no una soga.
  caida: 0.34,
  color: '#1f7f96',
  brillo: '#5fd8ef',
  // El balanceo: muy leve y muy lento. Algo que apenas se mueve por su propio
  // peso, no algo que serpentea.
  balanceo: { ciclo: 4600, amplitud: 2.6 }
};

// LOS PULSOS que viajan por el cable. Nacen en el extremo lejano y recorren el
// path hasta el conector: la energía VIAJA, y eso es lo que separa una carga que
// se ve profesional de una luz que parpadea en su lugar.
export const PULSOS_CABLE = { cuantos: 4, ciclo: 2600, radio: 3.2 };

// LAS TRES UBICACIONES A PROBAR. Coordenadas en % de la ESCENA, no del sprite:
// el destino es un lugar del galpón, no un lugar de Chip.
export const DESTINOS_CABLE = {
  // 1. Cruza el fondo hacia la izquierda y se pierde detrás del marco de la
  //    ventana. Sin objeto: el cable simplemente va a algún lado fuera de
  //    cuadro, y eso sugiere que el galpón es más grande que lo que se ve.
  ventana: { x: 8, y: 62, toma: false },
  // 2. Toma en la pared del fondo, a la altura del zócalo, con el cable subiendo
  //    en diagonal hacia ella.
  pared: { x: 86, y: 74, toma: true },
  // 3. Sin toma: el cable baja y se pierde en el borde inferior de la escena.
  abajo: { x: 68, y: 101, toma: false }
};

export const DESTINO_CABLE_ACTUAL = 'ventana';

export const VARS_CABLE = {
  camino: '--cable-camino',
  grosor: '--cable-grosor',
  color: '--cable-color',
  brillo: '--cable-brillo',
  cicloBalanceo: '--cable-balanceo-ciclo',
  amplitudBalanceo: '--cable-balanceo-amplitud',
  // El radio del pulso NO viaja por custom property: es un atributo r del SVG y
  // lo escribe ui.js desde PULSOS_CABLE. Estuvo acá un rato y el test del puente
  // lo marcó como escrito sin lector, que es exactamente lo que era.
  cicloPulso: '--cable-pulso-ciclo'
};

// Del tamaño de un puño de Chip: la mano de `cargando` mide ~12% del lienzo.
// Más alta que ancha, como una toma de verdad.
// El lienzo ahora es 40x38 y no 20x24: la caja se dibuja con su cara de arriba
// y su lateral, así que ocupa más ancho que alto. El frente propiamente dicho
// sigue midiendo lo mismo que antes en pantalla — lo que se agregó es el
// volumen, no el tamaño.
export const TAMANO_TOMA = { ancho: 13, alto: 12.3 }; // % del alto de Chip

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

export const VARS_TOMA = {
  x: '--toma-x',
  y: '--toma-y',
  ancho: '--toma-ancho',
  alto: '--toma-alto-caja',
  anclaX: '--toma-ancla-x',
  anclaY: '--toma-ancla-y'
};

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
