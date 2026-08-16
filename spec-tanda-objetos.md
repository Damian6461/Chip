# SPEC — Pool de objetos y loop del audio

Tanda para el dev. Leer entera antes de empezar. Mantené la lista de estado como siempre y no frenes entre puntos.

Orden: 1 → 2 → 3.

---

## 1. Los 28 objetos del pool

**Fuente: `objetos-28.md`, en la raíz del repo.** Ahí están los textos, los ids sugeridos y las notas de implementación. Este punto es implementarlo tal como está escrito.

Completan el pool de 36: **30 comunes y 6 raros** (17% de rareza, dentro del ~20% del brief). Son datos y siluetas, no lógica nueva — el sistema de eventos y colección ya existe y funciona.

### Lo que hay que hacer

- **Los 28 eventos** sumados al pool general, cada uno otorgando su objeto.
- **Las 28 siluetas** dibujadas por código para el estante, con su entrada en `BASES_OBJETO` medida con el método que ya estableciste (`getBBox()` sobre el SVG montado, pivote en la línea de apoyo, no en el borde de la caja).
- **La tasa de los raros** se mantiene como está para los comunes; los 5 nuevos raros entran en la misma banda de probabilidad que el raro ya existente.

### Tres cosas de canon que no se negocian

**La familia "lo que entra de afuera"** (hoja seca, piedra lisa, pluma, papel con humedad, semilla con alas) es lo único orgánico de una colección de metal. Las siluetas **tienen que notarse distintas del resto**: contorno más blando, sin remaches ni aristas duras, y si hace falta un tratamiento de color apenas distinto dentro de la paleta. Es deliberado — dicen que afuera hay otra cosa y que Chip lo notó.

**Tres de los cinco raros no se resuelven nunca:** la foto no se distingue, la etiqueta está borroneada, la caja no se abre. No agregues una forma de resolverlos, ni un texto que revele qué son, ni una animación que insinúe una respuesta. Abren una pregunta y no la cierran.

**La familia de los gigantes** es el único contacto real con ellos. Chip no los ve, no les habla, no interactúa: junta lo que se les cae. Ningún texto puede sugerir que un gigante lo notó.

### Verificación

Con el pool completo, un recorrido de varios días simulados tiene que otorgar objetos de las cuatro familias, sin repetir los ya obtenidos, y las siluetas tienen que apoyar bien en los dos estantes con las posiciones llenas. Verificá **a 390×844 y a tamaño real**, no ampliado.

---

## 2. El loop del audio se corta

Damián lo escuchó en el celular: el empalme se nota. Era la verificación que quedaba pendiente de tu lado, y esta es la respuesta.

**La causa:** `loop=true` nativo reinicia en seco. Siempre deja discontinuidad, por más que el archivo esté bien recortado.

**La solución** (la que vos mismo propusiste): **dos elementos `<audio>` alternándose con crossfade programado.** El elemento A suena; cuando le faltan ~2 s, arranca B desde cero con ganancia 0 y se cruzan las envolventes. Al terminar A se rebobina y queda listo para el ciclo siguiente.

Si el crossfade con elementos `<audio>` queda áspero, la alternativa es Web Audio API con `AudioBufferSourceNode`, que da control de sample exacto. Probá primero lo simple.

**Verificación, y es la parte difícil porque no podés escuchar:** comprobá con al menos **tres vueltas completas** que la envolvente de amplitud no tenga discontinuidad en el punto de empalme. Reportá cómo lo mediste. Si el método no te da certeza, decilo y Damián lo escucha.

---

## 3. Verificación pendiente del punto 9

El punto 9 (objetos tirados en el piso) está entregado en `f5df3cb`, pero **no se pudo verificar**: la colección estaba en 8/8 y el sistema solo tira objetos que Chip todavía no tiene. Eso es comportamiento correcto, pero deja el punto sin comprobar.

**Cuando el pool esté implementado:**

- Dejá el botón "tirar al piso" del panel de debug funcionando con objetos no obtenidos.
- Verificá el ciclo completo: el objeto ya está en el piso al abrir la app (no aparece mientras mirás), está en zona segura sin quedar tapado por Chip ni por la botonera, al tocarlo vuela al estante con arco, y Chip reacciona con `esperando` unos 2 s.
- Confirmá que convive con los objetos que llegan por evento, sin pisarse.

---

## Reglas de siempre

`prefers-reduced-motion` cubre lo nuevo. Constantes en `config.js`. Assets nuevos a `ARCHIVOS_CACHE` con bump de versión. Tests en verde. Commit y push antes de reportar.

**Verificá a tamaño real, contra la frase textual del pedido, y preguntá cuando una instrucción admita dos lecturas.** Y no verifiques un valor con el mismo instrumento que lo generó — esa fue la causa de que `BASES_OBJETO` estuviera mal en seis de ocho.

---

## Después de esta tanda

La lluvia como **evento 16**: cuando sale ese evento, el ambiente de lluvia reemplaza al de la franja y se suma lluvia visual sobre la ventana por código. No es un quinto tramo ni un sistema de clima — es un evento que además se ve y se escucha.
