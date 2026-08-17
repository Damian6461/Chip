// Pool de eventos: qué hizo Chip mientras no estabas.
//
// Los textos vienen del brief editorial y NO se editan acá. Este archivo es el
// transporte del contenido, no su fuente: si un texto tiene que cambiar, cambia
// primero en el brief. La numeración de los ids sigue la del brief para poder
// cruzar código y texto de a uno.
//
// Los eventos viven agrupados por categoría porque la categoría es parte del
// dato, no una etiqueta decorativa: es lo que va a permitir condicionar el pool
// al estado de Chip (con batería crítica, los quietos; feliz, los físicos) sin
// reescribir la estructura. Hoy nadie filtra por categoría todavía.
//
// EVENTOS es la vista plana que consume eventos.js, con la categoría estampada
// en cada entrada: el que sortea no necesita saber que hay grupos.
//
// Agregar un evento es agregar una entrada con un `id` nuevo y único en la
// categoría que le toque; sacarlo es borrar la entrada. La lógica no se toca.
//
// `presente` es una bandera del DATO y sólo la llevan algunos eventos de
// `grandes`: los que describen un gigante que está ahí MIENTRAS Chip mira. Es
// lo que dispara la pose de brazos cruzados.
//
// No es toda la categoría, y esa es la decisión. Con el pool de 36, `grandes`
// pasó de 5 eventos a 13 sobre 48 —más de una cuarta parte— y si los trece
// cruzaran los brazos la pose se volvería una muletilla. La clasificación por
// categoría está bien: esos textos SON gigantes. Lo que no todos son es un
// gigante presente.
//
// Va como bandera y no como heurística sobre el texto a propósito: buscar
// "pasó" o "esperó" en la línea funcionaría hoy y se rompería con el primer
// evento nuevo que use otras palabras.
//
// El `id` es lo que se persiste para no repetir lo de la visita anterior, así
// que conviene que sea estable: si cambia, el save viejo apunta a un id que ya
// no existe (es inofensivo — el filtro simplemente no excluye nada).

const POR_CATEGORIA = {
  // Lo que Chip cree que es su trabajo.
  funcion: [
    {
      id: 'evento-01',
      texto: 'Barrió el pasillo tres. Nadie usa el pasillo tres, por eso queda tan bien barrido.'
    },
    {
      id: 'evento-02',
      texto: 'Revisó los cables de la pared sur, uno por uno. Todos bien. Lo anotó en ningún lado.'
    },
    {
      id: 'evento-03',
      texto:
        'Encontró una mancha de aceite con forma de nube. La limpió igual, pero primero la miró un rato.'
    },
    {
      id: 'evento-04',
      texto:
        'Ordenó los tornillos del cajón por tamaño. Mañana los va a ordenar por color, ya lo decidió.'
    },
    {
      id: 'evento-05',
      texto:
        'Barrió para adentro sin darse cuenta. Tuvo que empezar de nuevo y no se lo contó a nadie, porque no hay nadie.'
    }
  ],

  // Las cosas que guarda.
  coleccion: [
    {
      id: 'evento-06',
      texto:
        'Encontró una tuerca del tamaño de su cabeza. No le entra en el compartimiento, así que ahora tiene un lugar secreto.'
    },
    {
      id: 'evento-07',
      texto:
        'Encontró un cable que no conecta nada con nada. Lo enrolló prolijo y lo guardó. Uno nunca sabe.'
    },
    {
      id: 'evento-08',
      texto:
        'Sumó a la colección: un resorte, una arandela dorada y algo que todavía no sabe qué es. Lo que no sabe qué es, es su favorito.'
    },
    {
      id: 'evento-09',
      texto:
        'Un tornillo perfecto rodó desde abajo de un contenedor hasta sus orugas. A veces el mundo funciona así.'
    },
    {
      id: 'evento-10',
      texto:
        'Contó la colección completa: cuarenta y una piezas. Después la contó de nuevo por el gusto de contarla.'
    },

    // ---- Familia A: piezas del galpón ----
    // Cosas que estaban ahí. Lo que un lugar viejo deja tirado.
    {
      id: 'evento-a1',
      texto:
        'Encontró un bulón del doce. Ya tenía uno del doce, pero este está más limpio y ahora tiene dos.'
    },
    {
      id: 'evento-a2',
      texto:
        'Una chapa recortada quedó con forma de pez. Nadie la cortó así a propósito, y por eso le gusta más.'
    },
    {
      id: 'evento-a3',
      texto:
        'Barrió un pedazo de embalaje con letras impresas. No sabe qué dicen. Lo guardó por las letras.'
    },
    {
      id: 'evento-a4',
      texto:
        'Encontró media junta de goma. La otra mitad no apareció y Chip volvió a buscarla dos veces.'
    },
    {
      id: 'evento-a5',
      texto:
        'Una llave de once apareció bajo el estante. No le sirve para nada de lo que tiene, pero es una llave.'
    },
    {
      id: 'evento-a6',
      texto:
        'El perno estaba doblado en un ángulo raro. Chip trató de enderezarlo, no pudo, y así le gustó más.'
    },
    {
      id: 'evento-a7',
      texto:
        'Encontró una tapa de válvula que gira y hace clic. Estuvo un rato largo haciéndola clic.'
    },
    {
      id: 'evento-a8',
      texto:
        'Una cinta métrica sin carcasa, enrollada sola. Mide hasta ochenta y siete y ahí se corta.'
    },
    {
      id: 'evento-a9',
      texto:
        'Un rodamiento rodó desde el fondo del galpón y se detuvo contra su oruga. Chip lo miró un rato antes de guardarlo.'
    },
    {
      id: 'evento-a10',
      texto:
        'Cortó un trozo de manguera vieja que ya no llevaba nada. El resto de la manguera sigue donde estaba.'
    },

    // ---- Familia D: las rarezas ----
    // Cada una tiene que sentirse como un hallazgo. Y tres de las cinco NO SE
    // RESUELVEN NUNCA —la foto no se distingue, la etiqueta está borroneada, la
    // caja no se abre— y eso es deliberado: abren una pregunta y no la cierran.
    // Si algún día alguien pide la respuesta, la respuesta es que no hay.
    {
      id: 'evento-d1',
      texto:
        'Encontró una pieza que no encaja con nada. La comparó con todo lo que tiene y con todo lo que vio. No es de acá.'
    },
    {
      id: 'evento-d2',
      texto:
        'Debajo del estante había una foto muy vieja. No se distingue qué muestra. Chip la guardó igual, boca arriba.'
    },
    {
      id: 'evento-d3',
      texto:
        'Una llave con una etiqueta escrita a mano. La etiqueta dice una sola palabra y está borroneada.'
    },
    {
      id: 'evento-d4',
      texto:
        'Un engranaje dorado apareció donde ayer no había nada. Gira sin ruido, que es raro para algo tan viejo.'
    },
    {
      id: 'evento-d5',
      texto:
        'Encontró una caja cerrada que suena cuando la mueve. No la puede abrir. La agita cada tanto.'
    }

  ],

  // El mundo que no lo ve.
  grandes: [
    {
      id: 'evento-11',
      presente: true,
      texto:
        'Pasó un carguero de siete metros. Chip esperó a que terminara de pasar y después siguió con lo suyo, un poco despeinado por el viento.'
    },
    {
      id: 'evento-12',
      presente: true,
      texto:
        'Los de mantenimiento pesado hicieron una reunión en el patio. Chip escuchó desde la puerta. No entendió nada, pero le gustó el murmullo.'
    },
    {
      id: 'evento-13',
      presente: true,
      texto:
        'La grúa vieja trabajó toda la tarde. Chip la miró desde un lugar seguro. Le parece que la grúa hace bien su trabajo, aunque nadie se lo dice.'
    },
    {
      id: 'evento-14',
      presente: true,
      texto:
        'Algo enorme se cayó del otro lado del galpón. Chip fue a ver, se arrepintió a mitad de camino, y volvió.'
    },
    {
      id: 'evento-15',
      presente: true,
      texto:
        'Un robot de carga lo esquivó al pasar. Chip pensó en eso el resto del día: lo esquivó, o sea que lo vio.'
    },

    // ---- Familia B: lo que los gigantes pierden ----
    // Cosas que se les caen sin que lo noten. Es el ÚNICO contacto real con
    // ellos: Chip no los ve ni les habla, junta lo que se les cae.
    {
      id: 'evento-b1',
      presente: true,
      texto:
        'Se le cayó un remache al carguero y siguió de largo. Chip esperó a que se fuera para levantarlo.'
    },
    {
      id: 'evento-b2',
      texto:
        'Un eslabón de cadena quedó en el piso después de que la grúa terminara. Pesa más que su cabeza.'
    },
    {
      id: 'evento-b3',
      texto:
        'Los de mantenimiento pesado tiraron un filtro usado. Chip lo revisó: todavía sirve para algo, seguro.'
    },
    {
      id: 'evento-b4',
      texto:
        'Una placa numerada se soltó de algo grande. El número es 4471. Chip no sabe de qué era, pero ahora lo sabe alguien.'
    },
    {
      id: 'evento-b5',
      texto:
        'Encontró un muelle tan grande que no se comprime con su peso. Se subió encima igual, para probar.'
    },
    {
      id: 'evento-b6',
      texto:
        'Un guante enorme quedó tirado cerca del portón. Le entra el cuerpo entero adentro. No lo hizo, pero lo pensó.'
    },
    {
      id: 'evento-b7',
      texto:
        'Una terminal eléctrica quemada, negra en un extremo. Alguien la cambió y no barrió lo viejo.'
    },
    {
      id: 'evento-b8',
      texto:
        'Encontró una pastilla de freno gastada hasta la mitad. Del lado sin gastar todavía se lee la marca.'
    }

  ],

  // Lo que hace cuando no hace nada.
  resto: [
    {
      id: 'evento-16',
      texto:
        'Miró la lluvia por la ventana del fondo. Es su ventana. Nadie más la usa porque queda demasiado abajo.'
    },
    {
      id: 'evento-17',
      texto:
        'Descubrió que el tanque de agua suena distinto según dónde lo golpee. Ya tiene cuatro notas. Está componiendo algo.'
    },
    {
      id: 'evento-18',
      texto: 'Se quedó dormido a mitad de una tarea. La tarea sigue a mitad y no se ofende.'
    },
    {
      id: 'evento-19',
      texto:
        'Siguió a un bicho de piso por todo el pasillo hasta que el bicho se fue por una rejilla. Chip se quedó un rato mirando la rejilla.'
    },
    {
      id: 'evento-20',
      texto:
        'Practicó frenadas en el sector encerado. Su mejor marca: dos metros y medio de derrape. No hay testigos, lo cual la hace oficial.'
    },
    // El segundo evento que cambia el mundo y no a Chip. Va en `resto` y no en
    // otra categoría: no es colección ni gigantes, es Chip parando a mirar algo
    // que no es trabajo — la misma familia que la hoja que entra por la ventana.
    {
      id: 'evento-21',
      texto: 'Hoy no se ve nada por la ventana. Chip se quedó mirando igual.'
    },

    // ---- Familia C: lo que entra de afuera ----
    // El mundo colándose por la ventana. Es lo único orgánico de una colección
    // de metal, y existe para que la colección no sea sólo chatarra: una hoja
    // seca en un estante de bulones dice algo que ningún bulón puede decir.
    {
      id: 'evento-c1',
      texto:
        'Entró una hoja por la ventana y aterrizó en el alféizar. Es lo único del galpón que no es de metal.'
    },
    {
      id: 'evento-c2',
      texto:
        'Una piedra chata y lisa apareció cerca de la puerta. No hay piedras adentro del galpón.'
    },
    {
      id: 'evento-c3',
      texto:
        'Encontró una pluma gris en el piso. Miró hacia arriba un rato largo y no vio nada.'
    },
    {
      id: 'evento-c4',
      texto:
        'Un papel mojado se secó pegado a la pared. Se despegó entero. Chip lo estiró con cuidado.'
    },
    {
      id: 'evento-c5',
      texto:
        'Una semilla con alas bajó girando por la ventana. Chip la siguió con la cabeza hasta que tocó el piso.'
    }

  ]
};

export const EVENTOS_POR_CATEGORIA = POR_CATEGORIA;

// Se derivan de las claves de arriba: la lista de categorías no se escribe dos
// veces, así no puede quedar desincronizada del pool.
export const CATEGORIAS = Object.keys(POR_CATEGORIA);

export const EVENTOS = Object.entries(POR_CATEGORIA).flatMap(([categoria, lista]) =>
  lista.map((evento) => ({ ...evento, categoria }))
);

// El único momento en que el mundo lo mira. Vive FUERA de POR_CATEGORIA a
// propósito: no entra al sorteo general, sale por probabilidad y nada más
// (PROBABILIDAD_EVENTO_RARO en config.js). Metido en el pool saldría cada tres
// días y perdería todo sentido — la escasez es el diseño.
//
// Lleva categoría igual, y es `grandes`: temáticamente es de esa familia, y así
// todos los eventos tienen la misma forma miren de donde miren.
export const EVENTO_RARO = {
  id: 'evento-raro',
  presente: true,
  categoria: 'grandes',
  texto:
    'La grúa vieja bajó el brazo hasta su altura y lo dejó ahí un segundo, sin motivo. Chip no se lo va a olvidar nunca.'
};
