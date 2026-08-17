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
  idle: 'sprites/idle-cabeza.webp'
};

// El pivote, en % del lienzo: la base del casco. Sale de (128, 140) sobre 256.
export const PIVOTE_CABEZA = { x: 50, y: 54.7 };

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
export const ANGULO_BRAZO = 2;

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
export const SALUDO_BRAZO = { angulo: 3, entra: 260, vuelve: 520 };

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
  angulo: 1.2,
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

// Clase que apaga los tres botones mientras algo está pasando. Es el MISMO
// tratamiento visual que el de una acción que no hace falta: si el jugador ya
// aprendió qué quiere decir esa chapa mate, no hay que enseñarle un segundo
// idioma.
export const CLASE_OCUPADO = 'ocupado';

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

export const CLASE_LLOVIENDO = 'lloviendo';

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

// Cuánto movimiento convierte un apretón en un arrastre.
export const MOVIMIENTO_CARICIA = 10;

// Y cuánto lo cancela. Es un umbral de DISTANCIA y no el evento `pointerleave`:
// un dedo apoyado tres segundos se mueve solo, y con pointerleave el gesto se
// abortaba con el micromovimiento. Ver la trampa del touch-action en el README.
export const MOVIMIENTO_CANCELA = 20;

// Más que esto ya no es un tap seco.
export const TOQUE_SECO_MS = 200;

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

// Los ojos a media asta. Es lo más importante de la caricia: un animal al que le
// rascan cierra los ojos, y eso solo ya se lee como placer. Si de toda la lista
// se implementara una cosa, sería esta.
export const PARPADO_CARICIA = 0.45;

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
  parpado: '--caricia-parpado',
  inclinacion: '--caricia-inclinacion',
  vuelta: '--caricia-vuelta',
  cicloRespiracion: '--caricia-respiracion-ciclo',
  respiracionY: '--caricia-respiracion-y',
  respiracionX: '--caricia-respiracion-x'
};

export const CARICIA_HUMOR = 2;

// Cada cuánto puede haber una reacción visual. Sin esto, quince toques en dos
// segundos apilan quince tandas de corazones y la pantalla se llena.
//
// Ojo: esto NO es un cooldown del gesto. La caricia se registra igual —el humor
// sube—, lo que se limita es la ANIMACIÓN. Que es la distinción de siempre en
// este proyecto: se restringe lo que se ve, no lo que se puede hacer.
export const COOLDOWN_CARICIA_MS = 400;

// CUÁNDO SE CANSA. Más de seis caricias en cuatro segundos y Chip pone la cara
// de fastidio un rato. Es la única forma de molestarlo que tiene el juego, y es
// graciosa y no punitiva: NO baja ningún stat, no bloquea nada más que la
// caricia, y se le pasa solo.
export const CARICIAS_PARA_CANSARSE = 6;
export const VENTANA_CANSANCIO_MS = 4000;
export const DURACION_CANSANCIO_MS = 3000;

// Mantener apretado para ver los números. 500 ms es el umbral clásico de
// long-press: más corto se dispara sin querer al acariciar, más largo se siente
// trabado.
export const ESPERA_MANTENIDO_MS = 500;

export const CLASE_CARICIA = 'acariciado';
export const CLASE_CANSADO = 'cansado';
export const CLASE_MANTENIENDO = 'manteniendo';

export const VARS_CARICIA = {
  espera: '--espera-mantenido',
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

export const COLOR_APERTURA = '#181b1f';

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
export const CONECTOR_PECHO = { x: 52.7, y: 83 };

// EL CABLE, dibujado y animado por código.
//
// LA FORMA ES EL PUNTO. La primera versión era una catenaria sola: una curva
// perfecta cruzando el fondo en diagonal. Se leía como una línea de interfaz,
// no como un cable, y el motivo es que un cable real NO cae en una curva
// perfecta — hace tramos rectos, se quiebra, se dobla sobre sí mismo, apoya en
// el piso y sigue. Esa irregularidad es toda la diferencia.
//
// El recorrido tiene cinco partes, y cada una hace algo distinto:
//
//   1. LA CAÍDA     sale del conector y cae con peso. Es la única catenaria.
//   2. EL APOYO     toca el piso y ahí se acuesta. El quiebre entre caer y
//                   apoyar es lo que dice que hay un piso.
//   3. LOS RULOS    una o dos vueltas de sobrante. Es lo que queda cuando hay
//                   más cable del necesario, y es el detalle que más vende que
//                   el cable es una cosa y no un trazo.
//   4. LA CORRIDA   por el suelo hacia el fondo, casi recta pero no del todo.
//   5. LA LLEGADA   sube apenas al zócalo de la caja de conexión.
//
// Todo en % de la ESCENA salvo el arranque, que sale del conector de Chip.
export const CABLE = {
  // Grosor y color: es un cable de energía industrial, no un hilo. El trazo base
  // va OSCURO a propósito; lo que brilla son los pulsos, y ese contraste entre
  // el cable apagado y la energía que lo recorre es el efecto.
  // Grosor CERCA del conector. Se afina con la profundidad de cada tramo, pero
  // NO en línea recta: el tamaño aparente va como 1/distancia, así que el trazo
  // usa grosor / (1 + caidaGrosor * z). Con una interpolación lineal —lo que
  // había— el afinado se reparte parejo y en pantalla se lee como un cable de
  // grosor constante que se adelgaza de golpe al final.
  //
  // Con la curva, a media profundidad el cable ya mide un 40% de lo que medía
  // cerca, que es lo que hace una perspectiva de verdad.
  // 13 y no 8. A 8 el cable era un hilo en TODO el recorrido, no sólo al final:
  // un cable de energía industrial tiene cuerpo, y el de la panorámica —los caños
  // de la pared— es la referencia de escala que tiene al lado.
  grosor: 13,
  caidaGrosor: 3,
  // Y el afinado tiene PISO. A 1,6 el tramo que sube a la caja terminaba en un
  // pelo contra una pared oscura y desaparecía. Un cable que se va al fondo se ve
  // más fino; no se ve menos.
  grosorMinimo: 4,
  // GRIS INDUSTRIAL, no azul. El tono de antes era un teal oscuro que con el
  // lomo encima leía como una línea de luz apagada. Este sale de los caños de la
  // panorámica, que es lo que el cable tiene que parecer.
  color: '#2b3138',
  // El filo de arriba: la luz de la ventana pegándole por encima. No es un
  // contorno ni un segundo cable, es una arista iluminada.
  brillo: '#7b858f',
  // El azul eléctrico es SÓLO de los pulsos, y ese contraste —cuerpo apagado,
  // energía viva— es todo el efecto. Si el cable también fuera cian, los pulsos
  // no tendrían contra qué destacarse.
  energia: '#5fe6ff',
  // La sombra donde entra al puerto: sin ella el cable se apoya, no se enchufa.
  sombraPuerto: '#050a0e',
  // La ficha: un gris de plástico, más claro que el cable. Tiene que leerse como
  // OTRA pieza, no como el cable engordado — si comparte color con el cable, la
  // unión vuelve a ser un extremo y no un enchufe.
  ficha: '#4a525a',
  // EL PASO DEL REMUESTREO. La línea media se recorre a paso fijo en vez de
  // usar los puntos con que se definió, que venían de dos fuentes con densidades
  // muy distintas: la caída con 14 muestras y los quiebres con una cada uno.
  // Medido en producción, entre dos muestras consecutivas había hasta 63 px
  // contra los 3 o 4 del resto, y con eso el grosor se afinaba de golpe y el
  // redondeo de cada quiebre salía distinto según el largo de sus vecinos.
  //
  // 4 px es más chico que el grosor mínimo del cable, así que ninguna variación
  // de ancho puede quedar sin muestra que la sostenga.
  pasoMuestreo: 4,
  // CUÁNTO CABLE QUEDA DETRÁS DEL SPRITE. Es el tramo que entra al puerto y
  // desaparece adentro de Chip. Un cable que termina CONTRA el borde del
  // conector se ve apoyado; uno que desaparece adentro se ve enchufado.
  entraAlCuerpo: 8,
  balanceo: { ciclo: 4600, amplitud: 2.2 }
};

// Los puntos del recorrido, en % de la escena. El primero no está: es el
// conector del pecho, que se mide sobre la caja real de Chip.
//
// El piso del galpón en perspectiva: lo que está más al fondo va MÁS ARRIBA en
// pantalla y más chico. Por eso la corrida sube de y=88 a y=70 mientras se va
// hacia la derecha — no es que el cable trepe, es que se aleja.
// El piso ÚTIL termina donde empieza la línea de eventos, alrededor del 84%:
// más abajo el cable pasa por detrás del texto y de la botonera y deja de
// leerse como galpón. Todo el recorrido vive arriba de esa línea.
// EL RECORRIDO, medido contra la profundidad de la panorámica.
//
// EL FONDO DEL TALLER ESTÁ EN y = 65-66%: ahí es donde el piso encuentra la
// pared, medido con una escala de porcentajes sobre el fondo. Todo lo que esté
// más abajo de 66 está en el PISO, o sea adelante. La versión anterior terminaba
// en 71% y por eso la caja quedaba en primer plano, a la misma profundidad que
// Chip, en vez de al fondo.
//
// LOS DOBLECES SON TRAMOS RECTOS QUE SE QUIEBRAN, no curvas. Un cable tirado en
// el piso no describe una curva suave: hace un tramo, dobla en ángulo, hace
// otro. La versión anterior era una curva con un rulo y se leía como una cinta.
// La única curva que queda es la CAÍDA, que sí es una catenaria porque ahí el
// cable cuelga en el aire.
//
// Y se ACHICA con la distancia: cada tramo lleva su profundidad y el trazo se
// afina con ella. Un cable del mismo grosor de punta a punta aplana la escena.
export const RECORRIDO_CABLE = {
  // Dónde toca el piso, y cuánto cuelga la panza. El apoyo cae adelante y a la
  // izquierda de Chip: el cable sale del pecho, no de atrás.
  // y 81,5 y no 85,5: la línea de eventos arranca en 83% y el cable le pasaba
  // por detrás. La banda útil del piso va de 66% —donde el piso encuentra la
  // pared— a 82%, que es donde apoyan las orugas de Chip. Todo el recorrido
  // vive ahí adentro.
  // y 83,2 y no 81,5. Con el cable fino no se notaba; con cuerpo de 13 px sí: el
  // recorrido pasaba POR DELANTE de las orugas de Chip, porque la banda 74-82%
  // es justamente donde está su cuerpo. La banda libre de verdad es la de abajo,
  // entre el borde de Chip (82%) y el cartel de evento (86,7%), y todo el tramo
  // horizontal vive ahí hasta salir de su silueta.
  // x 48 y no 42, y esto es geometría y no gusto. El conector está en 52%, y con
  // el apoyo en 42 el cable bajaba hacia la IZQUIERDA y el recorrido volvía a la
  // derecha: una horquilla de casi 180°. Una cinta de 13 px de ancho no puede
  // doblar en un radio menor que su propio medio ancho sin que el borde interno
  // se pliegue sobre sí mismo — medido, un salto de 13 px en un borde cuyo paso
  // es de 4. Con el apoyo casi debajo del conector el giro se abre y no hay
  // pliegue.
  apoyo: { x: 48, y: 83.2, caida: 0.42 },

  // Los quiebres, en orden, del apoyo hasta la caja. Cada uno con su
  // PROFUNDIDAD de 0 a 1 —0 es acá, 1 es el fondo— que decide el grosor.
  // Los tramos son rectos; lo que los hace leer como cable son los ángulos
  // entre ellos, que no son suaves ni parejos.
  // Los tres primeros corren por el piso, adelante y por debajo de Chip; recién
  // cuando el cable sale de su silueta —que abajo llega hasta x 74,7%— empieza a
  // subir por la pared hacia la caja.
  quiebres: [
    { x: 54, y: 84.3, z: 0.05 },
    { x: 60.5, y: 83.5, z: 0.11 },
    { x: 67, y: 84.1, z: 0.18 },
    // Sale de atrás de Chip y arranca la trepada.
    { x: 76, y: 82.4, z: 0.3 },
    { x: 81.5, y: 76.5, z: 0.52 },
    // El último quiebre es el pie de la pared: de ahí el cable SUBE hasta la
    // caja, que está atornillada a media altura y no apoyada en el zócalo.
    { x: 84.5, y: 68, z: 0.78 }
  ],

  // La boca de la caja de conexión, contra la pared del fondo. Sigue a
  // TOMA_FONDO.x: si los dos números se separan, el cable llega al aire.
  llegada: { x: 86.5, y: 58.6, z: 1 }
};

export const PULSOS_CABLE = { cuantos: 5, ciclo: 3200, radio: 4.2 };

// LA CAJA DE CONEXIÓN, de vuelta y al fondo. Es la misma que se dibujó en su
// momento —chapa gruesa, conector cilíndrico, tornillos, borde naranja— pero
// SUMERGIDA: chica, en penumbra y con la luz de esa profundidad. No compite con
// Chip porque está lejos, que era el problema de tenerla adelante.
export const TOMA_FONDO = {
  // MONTADA EN LA PARED, a media altura. Estaba en y=65%, que es la línea donde
  // el piso encuentra la pared: o sea apoyada en el zócalo. Una caja de conexión
  // industrial va atornillada a la pared, no puesta en el suelo.
  //
  // 58% la deja sobre la pared del fondo y por encima de la línea del piso, que
  // es donde iría en un galpón de verdad.
  //
  // x 86,5 y no 80,5: contra el borde derecho. Ahí la pared del fondo está
  // limpia y el cable cruza todo el cuadro para llegar, que es lo que hace que el
  // galpón se lea más grande que lo que entra en pantalla. En 80,5 la caja
  // quedaba en el medio del paño y el recorrido se acortaba.
  //
  // No choca con la repisa: la repisa vive entre y 28,5% y 38%, y esto está en
  // 58. Y RECORRIDO_CABLE.llegada.x lo acompaña — si los dos se separan, el
  // cable termina en el aire al lado de la caja.
  x: 86.5,
  y: 58,

  // 4,7% del ancho. A 3 quedaba tan sumergida que había que buscarla: el
  // objeto pintado de referencia mide 2,9%, pero ESE es decorado del fondo y no
  // tiene que leerse — la caja de Chip sí, porque el cable muere ahí y sin verla
  // el cable termina en la nada. Se sube hasta que se encuentre sin buscarla,
  // sin llegar a competir con Chip, que ocupa 95% del alto.
  ancho: 4.7,

  // Sumergida, pero encontrable. 0,34 la hacía desaparecer contra la pared.
  brillo: 0.46,
  saturacion: 0.62
};

export const VARS_CABLE = {
  camino: '--cable-camino',
  // El grosor ya no viaja por custom property: lo escribe ui.js POR TRAMO, con
  // la profundidad de cada uno, para que el cable se afine con la distancia. Un
  // valor único en :root no puede hacer eso.
  color: '--cable-color',
  brillo: '--cable-brillo',
  energia: '--cable-energia',
  sombraPuerto: '--cable-sombra-puerto',
  ficha: '--cable-ficha',
  tomaX: '--toma-fondo-x',
  tomaY: '--toma-fondo-y',
  tomaAncho: '--toma-fondo-ancho',
  tomaBrillo: '--toma-fondo-brillo',
  tomaSaturacion: '--toma-fondo-saturacion',
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
// El tamaño de la caja ya no se mide en % del alto de Chip: al fondo se mide en
// % de la escena, y ese número vive en TOMA_FONDO. Estaba atado a Chip cuando
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
export const VARS_TOMA = {
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
// De ahí las dos franjas laterales. El límite de x sale del contorno OPACO de
// los nueve sprites, no de su caja: la caja de #chip va de x 6,7% a 93,3% de la
// escena, pero abajo de la mitad ninguna pose pasa de x 18,2% ni de x 74,7%.
// El margen contra ese contorno es de 3 puntos de cada lado.
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
    { x0: 8, x1: 15 },
    { x0: 80, x1: 94 }
  ]
};

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
  vueloCamino: '--vuelo-camino'
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
// El gesto es MANTENER APRETADO EL BOTÓN DEL MENÚ tres segundos. Se eligió sobre
// la alternativa —cinco toques en una esquina— por dos razones: reutiliza un
// control que ya existe en vez de inventar una zona sensible invisible, y es
// imposible de encontrar sin querer, porque nadie sostiene un botón de menú tres
// segundos. Un toque normal sigue abriendo el menú.
export const ESPERA_DEBUG_MS = 3000;

export const CLASE_ABRIENDO_DEBUG = 'abriendo-debug';
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
