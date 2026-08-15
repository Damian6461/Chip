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
    }
  ],

  // El mundo que no lo ve.
  grandes: [
    {
      id: 'evento-11',
      texto:
        'Pasó un carguero de siete metros. Chip esperó a que terminara de pasar y después siguió con lo suyo, un poco despeinado por el viento.'
    },
    {
      id: 'evento-12',
      texto:
        'Los de mantenimiento pesado hicieron una reunión en el patio. Chip escuchó desde la puerta. No entendió nada, pero le gustó el murmullo.'
    },
    {
      id: 'evento-13',
      texto:
        'La grúa vieja trabajó toda la tarde. Chip la miró desde un lugar seguro. Le parece que la grúa hace bien su trabajo, aunque nadie se lo dice.'
    },
    {
      id: 'evento-14',
      texto:
        'Algo enorme se cayó del otro lado del galpón. Chip fue a ver, se arrepintió a mitad de camino, y volvió.'
    },
    {
      id: 'evento-15',
      texto:
        'Un robot de carga lo esquivó al pasar. Chip pensó en eso el resto del día: lo esquivó, o sea que lo vio.'
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
  categoria: 'grandes',
  texto:
    'La grúa vieja bajó el brazo hasta su altura y lo dejó ahí un segundo, sin motivo. Chip no se lo va a olvidar nunca.'
};
