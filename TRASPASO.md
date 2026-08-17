# CHIP — Traspaso

Documento para arrancar una conversación nueva sin perder contexto. Pegalo entero al principio del chat.

---

# 1. Qué es Chip

Un virtual pet para móvil, PWA. Un robot pixel art llamado Chip vive en un galpón de robots gigantes que lo ignoran. Modelo **pasivo y sin culpa**: no se muere, no hay fail-states, no hay cooldowns punitivos ni FOMO.

**Deploy:** damian6461.github.io/Chip/
**Repo:** github.com/Damian6461/Chip
**Local:** `C:\Chip`

**Referencias:** Tsuki Odyssey (principal), Neko Atsume (rastros y colección), Wall-E (personaje), Finch (tono).

---

# 2. Los tres roles

**Damián** hace el arte (Photoshop, ChatGPT para generación) y todos los commits. Es quien decide.

**El dev** es una sesión de Claude Code que implementa. Lee specs del repo y reporta.

**Yo (esta conversación)** soy consultoría, specs, auditoría y **verificación en producción**. No puedo commitear, ni tocar la máquina de Damián, ni hablar con el dev.

## Cómo trabajamos

1. Damián me dice qué quiere o qué ve mal.
2. Yo **verifico en producción** con el navegador y mido antes de opinar.
3. Escribo una **spec en un archivo `.md`**, se la presento a Damián.
4. Damián la descarga, la guarda en `C:\Chip`, la commitea y le dice al dev: *"Hacé lo que dice `spec-X.md`"*.
5. El dev implementa y reporta. Damián me pasa el reporte.
6. **Yo verifico el deploy punto por punto contra las palabras textuales de Damián**, no contra "está implementado".

**Esa separación es lo que hace funcionar el proyecto.** El dev verificando su propio trabajo falla — pasó varias veces. Si alguna vez se propone unificar, el argumento en contra es este.

## Reglas de estilo

- Damián escribe en español rioplatense, casual. Respondele igual.
- **Sin relleno.** Directo.
- Para tareas de Photoshop o de UI, **pasos numerados y concretos**, no orientación general.
- Cuando algo se pueda medir, medilo antes de opinar.
- **Antes de pedirle un recorte a Damián, evaluá si se puede resolver por código.** Ya lleva más de diez recortes hechos a mano.

---

# 3. Estado técnico

~265 tests en verde. Assets ~1,8 MB de sprites + 2,4 MB de sonidos + 190 KB de íconos. Carga en frío ~600 ms.

**Implementado y verificado:**

- 9 sprites de estado + recortes de capas (ojos, cabeza, brazos, orugas, cuerpo)
- Seis fondos: cuatro franjas horarias (6-9 amanecer / 9-18 mediodía / 18-21 atardecer / 21-6 noche) más **tormenta** y **niebla**, que son estados de evento, no tramos
- Pool completo de **36 objetos** (30 comunes, 6 raros) en cuatro familias
- 48 eventos, arcos de gigantes, colección con repisa de dos estantes
- Respiración con `scaleY` asimétrico, parpadeo, inclinación de cabeza 3°, brazos con acomodo y saludo
- `feliz` es una **reacción temporal**, no un estado por umbral
- Cable de carga como polígono con perspectiva, pulsos de energía, caja de conexión en la pared del fondo
- Cuatro ambientes de sonido con carga bajo demanda, y 20 bips de Chip (se usan 7)
- Objetos en el piso, caricia por arrastre con progresión de ojos, fastidio por toque repetido
- PWA offline, panel de debug

---

# 4. Pendientes

## Del dev — `spec-mirada-y-carga.md`

- **Cargar por retención**: mantener apretado carga, botón a la derecha, la pantalla del pecho muestra la carga en vivo
- **La antena con inercia** — el riesgo ya identificado: el poste está pintado y el bulbo va por código, así que a amplitud alta el bulbo se despega. Medir el largo del poste y mirar en el pico
- **El rayo del pecho contando la batería** (rápido e irregular cuando está baja; sincronizado con los pulsos del cable al cargar)
- **Las luces de las orejas** como indicador de "pasó algo" — la menos importante, se puede descartar
- **La atención de Chip**: la mirada se va a los 40-60 s sin interacción y vuelve al tocar; reacción de llegada que escala con los días de ausencia
- **El audio que no vuelve al reabrir**: que arranque con el primer toque de la sesión
- **La apertura sin parpadeo**: color de fondo en `<style>` inline en el `<head>`
- **El botón de debug**, que sigue sin funcionar en el teléfono

## Del dev — `spec-peso-y-enojo.md`

- **Sombras que apoyen**: más densas en el punto de contacto, **más chicas que el objeto**, degradé radial y no color plano. Chip, objetos de repisa y de piso, caja, botones
- **Polvo de las orugas** al girar
- **El enojo con efecto**: bulbo parpadeando seco en naranja, antena sacudiéndose, respiración cortada, brazos quietos. **Nada que parezca castigo**

## De Damián

- **`idle-cuerpo-sin-orugas.png`** — en curso, para probar el giro de ruedas
- **Los íconos**: mirar las capturas y dar el visto bueno. Están generados y medidos (187 KB contra 206), sin commitear, frenando un commit de diez minutos
- **Escuchar los ambientes** en el celular, dos vueltas completas del loop
- **Probar con el dedo**: la caricia, el fastidio, la progresión de ojos

## Anotado, sin hacer

- **El sprite de `esperando` tiene otras proporciones** que `idle` (ojos 77,6% del ancho contra 86,5%, y le falta el panel del pecho), así que el cambio de pose se lee como un salto. **Decisión tomada: no se corrige por ahora**, y no hay que disimularlo con capas
- Los ojos de los recortes nuevos no están a la misma altura entre sí, porque vienen de poses con la cabeza inclinada. **No se toca** — emparejarlo sería editarle el arte al ilustrador

---

# 5. Decisiones cerradas — no renegociar

- **El modelo sin culpa es sagrado.** Sin cooldowns, sin timers punitivos, sin FOMO, sin energía. La duración de una acción no es cooldown: es coherencia
- **Chip no se desplaza** por el taller
- **Los gigantes nunca se vuelven amigos.** Notar ≠ adoptar
- **No se agregan estados visuales** más allá de los que hay
- **El menú tiene tres secciones**: colección, ajustes, sobre Chip
- **No se agregan rasgos al arte que el ilustrador no dibujó.** Por eso se descartó una "chaveta" en las orugas y se optó por un arco de luz
- **La lluvia es un evento** (el 16), no un tramo ni un sistema de clima. Lo mismo la niebla
- **Paleta:** cian / naranja `#ffa300` / durazno `#ffc899`. Nada afuera
- **Tres de los objetos raros no se resuelven nunca**: la foto no se distingue, la etiqueta está borroneada, la caja no se abre

---

# 6. Las trampas conocidas

Este proyecto lleva **ocho casos** de instrumentos de medición que engañaron. Vale tenerlos presentes:

1. **La pestaña en segundo plano** throttlea los timers a uno por segundo
2. **El fetch interceptado** por el propio service worker
3. **Una transición capturada a medio camino**
4. **`getBoundingClientRect` sobre un elemento rotado** devuelve el bounding box del giro, no el elemento
5. **El zoom miente**: defectos sub-píxel que a tamaño real no existen, y defectos reales que a tamaño real sí existen y en zoom se ven bien
6. **Verificar la propiedad equivocada** — la que uno espera en vez de la que el código usa (`disabled` cuando el diseño usa `aria-disabled`)
7. **El service worker sirviendo caché viejo**, y también **la caché HTTP del navegador**, que sobrevive a borrar el SW
8. **Un barrido que excluye el archivo donde está el lector** — dio dos falsos positivos de código muerto

**Y dos reglas de código que ya mordieron:**

- El shorthand `animation` pisa los delays de `:nth-child` por especificidad. Pasó tres veces
- **`elemento.hidden = true` no esconde nada por sí solo.** Lo esconde una regla del user agent que pierde contra cualquier `display` de autor. Un `display: grid` en el contenedor lo desactiva en silencio

**Regla general:** un valor no se verifica con el instrumento que lo generó.

---

# 7. Cómo verifico en producción

```
1. Abrir damian6461.github.io/Chip/?debug=1 en el navegador
2. BORRAR el service worker y las cachés, y recargar
   (si no, se mide una versión vieja — pasó varias veces)
3. Medir con javascript_exec, en porcentajes de la escena
4. Mirar A TAMAÑO REAL, no ampliado
5. Para animaciones, capturar tres momentos del ciclo
```

El panel de debug tiene: simulador de horas, sumar objeto, tirar al piso, disparar hito, cambiar pose, clima tormenta/niebla, reiniciar partida.

---

# 8. La fase que falta

Hay un plan de validación escrito y sin ejecutar: **cinco personas, una semana, una sola métrica — si lo abren al día siguiente.** Al menos dos que no jueguen videojuegos, nadie que sepa que es de Damián.

Se viene postergando hace tiempo. Cuando Damián lo pida, está listo.

**Lo que el juego necesita ahora no es más código: es que alguien lo use.**
