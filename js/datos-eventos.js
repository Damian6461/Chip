// Pool de eventos: lo único que hay que escribir acá es el campo `texto`.
//
// La lógica no vive en este archivo. Agregar un evento es agregar una entrada
// con un `id` nuevo y único; sacarlo es borrar la entrada. Nada más se toca.
//
// El `id` es lo que se persiste para no repetir el último evento mostrado, así
// que conviene que sea estable: si cambia, el save viejo apunta a un id que ya
// no existe (es inofensivo — el filtro simplemente no excluye nada).
//
// TODO(Damián): reemplazar los textos. Son placeholders a propósito: el
// contenido de los eventos es la decisión de diseño central del producto y no
// la toma el código.

export const EVENTOS = [
  { id: 'evento-01', texto: 'PLACEHOLDER: texto del evento 01' },
  { id: 'evento-02', texto: 'PLACEHOLDER: texto del evento 02' },
  { id: 'evento-03', texto: 'PLACEHOLDER: texto del evento 03' },
  { id: 'evento-04', texto: 'PLACEHOLDER: texto del evento 04' },
  { id: 'evento-05', texto: 'PLACEHOLDER: texto del evento 05' },
  { id: 'evento-06', texto: 'PLACEHOLDER: texto del evento 06' }
];
