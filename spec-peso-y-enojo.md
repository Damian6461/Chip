# SPEC — Que las cosas pesen

Cuatro puntos. Los tres primeros son la misma queja mirada desde distintos lados: **todo flota.** El cuarto es un estado que quedó sin voz.

---

## 1. El objeto del piso sigue quedando después de levantarlo

Ya se pidió y sigue pasando. Al tocarlo vuela al estante pero **queda también en el piso**.

Probablemente el elemento no se remueve al terminar la animación de arco, o la animación clona en vez de mover. Verificá el ciclo entero: aparece al abrir → se toca → vuela → **desaparece del piso** → queda en la repisa → no reaparece en la próxima visita.

Y verificá el caso de dos objetos: si hay uno de evento y uno del piso, que levantar uno no afecte al otro.

---

## 2. Todo flota — las sombras no están haciendo su trabajo

Damián lo nota en toda la escena. Y no es un elemento en particular: es que **las sombras que hay son demasiado tenues y demasiado parejas.**

Una sombra que apoya un objeto tiene tres propiedades que hoy faltan:

**a) Es más densa donde el objeto toca.** Una elipse de opacidad uniforme se lee como una mancha debajo; una que es oscura en el punto de contacto y se disuelve hacia afuera se lee como sombra. Usá un degradé radial, no un color plano con blur.

**b) Es más chica que el objeto, no más grande.** El error típico es hacerla del ancho del objeto o mayor, y eso lo despega. La sombra de contacto es el área que efectivamente toca el piso — en Chip son las dos orugas, no todo su cuerpo.

**c) Se acorta cuando el objeto sube.** Ya lo hacés con la respiración de Chip. Extendelo a todo lo que se mueve.

**Qué revisar, en orden de cuánto se nota:**

- **Chip.** Su sombra es la más importante porque es el objeto más grande. Que sea más oscura en el centro, y que su forma siga las dos orugas y no sea una elipse única.
- **Los objetos de la repisa.** Hoy apoyan bien geométricamente (`BASES_OBJETO` lo resolvió) pero sin sombra se ven pegados a la tabla. Una sombra corta y densa debajo de cada uno.
- **El objeto del piso.** Igual, y además es el que más lo necesita porque está sobre una superficie grande y vacía.
- **La caja de conexión** y **la toma**, si todavía no la tienen.
- **Los botones**, que es el punto 2 de la spec anterior y sigue pendiente.

**Verificá a tamaño real y de noche**, que es cuando las sombras tenues directamente desaparecen.

---

## 3. Las orugas levantan polvo

Damián propone extender lo que hiciste con el arco de luz en los aros: que las orugas **delaten movimiento levantando polvo**.

**Cuándo:** solo cuando las orugas están girando, o sea en el cuarto de vuelta de una acción y en el mecerse de `jugando`. En reposo no hay polvo.

**Cómo:**

- **Dos o tres motas por oruga**, no más. Nacen en el punto de contacto con el piso, salen hacia atrás y afuera, suben poco y se disuelven. Ciclo corto, 600-900 ms.
- **Del color del piso**, no blancas ni cian. Tomá el tono del suelo de la panorámica; el polvo es piso levantado.
- **Muy tenues**, opacidad máxima de 0,25-0,3. Esto es un detalle que se nota sin mirarlo; si se ve claramente, está de más.
- **Desfasadas entre las dos orugas**, para que no salgan en espejo.
- Reusá el sistema de motas del ambiente si te sirve, pero **con su propio ciclo** — estas responden a una acción, no al aire.

Es lo mismo que ya hiciste con el arco de luz: en vez de mover una pieza que no puede moverse, **contás el movimiento por lo que produce**.

---

## 4. El enojo no tiene efecto

Cuando Chip se fastidia —por toques repetidos o porque le levantaste un objeto— cambia la pose y nada más. Es el único estado sin ninguna señal propia.

**Lo que se puede hacer con lo que ya existe:**

- **El bulbo de la antena parpadea corto y seco**, dos o tres veces, en el naranja del juego. No el latido suave de siempre: un parpadeo brusco. Es la señal más clara y la más barata.
- **La antena se sacude** — ahora que tiene inercia, un rebote rápido al entrar al estado. Como cuando alguien resopla.
- **La respiración se corta:** una inhalación rápida y una exhalación larga al entrar. Un suspiro.
- **Los brazos quietos**, sin acomodarse, mientras dura. Ya está el criterio para `critico` y es el mismo: la ausencia de movimiento también es información.
- **El bip** — `11_long_conversation`, que es el único largo que baja de tono. Ya está asignado en la spec anterior.

**Lo que NO hay que hacer:** nada que parezca castigo. No bajar stats, no sacudir la pantalla, no poner símbolos de enojo. Chip está fastidiado, no ofendido, y a los tres segundos se le pasa. Tiene que dar gracia, no culpa.

**Nota:** el sprite de `esperando` tiene proporciones distintas de `idle` —los ojos son 77,6% del ancho contra 86,5%, y le falta el panel del pecho—, así que el cambio de pose se lee como un salto. Está anotado y **no se va a corregir por ahora**; no intentes disimularlo con capas.

---

## Reglas de siempre

Constantes en `config.js`. `prefers-reduced-motion` cubre el polvo y el parpadeo del enojo. Tests en verde. Commit y push antes de reportar. Verificá **a tamaño real y en los seis fondos** — las sombras y el polvo son justo lo que cambia entre el mediodía y la noche.
