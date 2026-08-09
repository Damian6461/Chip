// localStorage en memoria, compartido por los dos entrypoints de las pruebas.
//
// Se instala ANTES de importar cualquier módulo del juego, así estado.js escribe
// acá y la suite nunca toca un save real: ni en Node, donde localStorage no
// existe, ni en el navegador, donde existe y es exactamente el del juego.

export function instalarAlmacenFalso() {
  const almacen = new Map();

  const falso = {
    getItem: (clave) => (almacen.has(clave) ? almacen.get(clave) : null),
    setItem: (clave, valor) => {
      almacen.set(clave, String(valor));
    },
    removeItem: (clave) => {
      almacen.delete(clave);
    },
    clear: () => {
      almacen.clear();
    },
    key: (indice) => Array.from(almacen.keys())[indice] ?? null,
    get length() {
      return almacen.size;
    }
  };

  // En el navegador localStorage es un accessor de sólo lectura en Window:
  // asignarlo directo no hace nada, hay que redefinir la propiedad.
  Object.defineProperty(globalThis, 'localStorage', {
    value: falso,
    configurable: true,
    writable: true
  });
}
