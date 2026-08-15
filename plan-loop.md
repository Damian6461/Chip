# CHIP — Plan de implementación del loop (colección, estante, gigantes)

Fuente de decisiones: `loop-brief.md`. Fuente de evidencia: `investigacion-loop.md`. Este documento es el plan de ejecución: qué se construye, en qué orden, y qué verifica cada etapa.

**Prerrequisito:** OK de Damián al rediseño full-bleed en teléfono real (dvh + safe-area pendientes de device). Si el teléfono muestra problemas de layout, se arreglan antes de arrancar esto.

---

## ETAPA 1 — El sistema de colección (el motor)

**Qué:** los eventos pueden dejar objetos; los objetos se persisten, se acumulan y quedan consultables.

**Alcance:**
- Nuevo módulo `js/coleccion.js`, dueño único del estado de colección. Sigue el contrato de módulos del BRIEF: función pura donde se pueda, persistencia solo vía estado.js (migración de save v2→v3 con merge de defaults, mismo patrón que la v1→v2 de eventos).
- Archivo de datos de objetos: id, nombre, tier (comun|raro), eventoId que lo trae, y línea del canon asociada. **Pool inicial: los 10 objetos ya mapeados en loop-brief.md** (incluye los 3 del evento 8, con la-cosa-que-no-sabe-qué-es como RARO).
- El sistema de eventos consulta al de colección: cuando sale un evento con objeto asociado que aún no se tiene, el objeto se otorga. Regla de rareza: los eventos que otorgan raros entran al sorteo con probabilidad 3-5% por visita elegible (constante en config.js, fracción no porcentaje — el test que ya existe para el evento raro marca el patrón).
- Cadencia (constantes en config.js): al menos un evento por día de visita; ausencias largas otorgan máximo lo que la tabla de horas ya define (1-3), nunca más.
- Los eventos sin objeto asociado siguen funcionando exactamente igual — la mezcla es parte del ritmo.

**Lo que esta etapa NO hace:** nada visual. El estante, la vista de colección y los gigantes vienen después. Esta etapa se verifica por debug y tests.

**DoD:** tests nuevos cubren: otorgamiento al salir el evento, no-duplicación (un objeto ya obtenido no se vuelve a otorgar; su evento puede repetirse como evento puro o excluirse — decidir y documentar), migración v2→v3, rareza como fracción, cap de ausencia. Panel de debug muestra la colección actual (lista simple con ids). Todo en verde con `node tests/correr.mjs`.

---

## ETAPA 2 — El estante vivo (la exhibición)

**Qué:** los objetos obtenidos aparecen en el estante del fondo de la escena; tocarlo abre la colección.

**Alcance:**
- Capa de overlay posicionada sobre la zona del estante de la panorámica (la posición se calcula con el mismo calc del encuadre — el estante está a la derecha de la panorámica; verificar que entre en la vista mobile con el corrimiento actual, y si queda fuera del viewport en 390×844, la capa se ancla a donde el estante se vea o se reposiciona el encuadre — decisión a reportar).
- Cada objeto obtenido: un sprite chico (12-20px en escena) en su posición fija del estante. **Los sprites de objetos se generan por código en esta etapa** (formas simples: la silueta de una tuerca, un tornillo, un resorte se dibujan dignas en canvas/SVG con la paleta del juego) — el arte ilustrado por ChatGPT es una pasada posterior de Damián, el sistema no lo espera.
- Objetos no obtenidos: silueta apagada (la misma forma al 15% de opacidad). El estante siempre muestra el pool completo — Zeigarnik.
- Tocar el estante → vista de colección: overlay a pantalla casi completa, estilo del panel de estado (marco metálico, fondo oscuro), grilla de objetos; tocar un objeto muestra nombre + la línea del evento que lo trajo. Cierre al tocar afuera. `role="button"` + tabindex, mismo estándar que el panel de estado.
- Cuando un evento otorga objeto, el objeto aparece en el estante con una animación breve de llegada (escala 0→1 con leve rebote, 400ms, patrón de animaciones existente, reduced-motion la omite y el objeto simplemente está).

**DoD:** captura mobile con estante poblado (obtener 3-4 objetos por debug); tocar estante abre colección con obtenidos y siluetas; la línea del canon se lee en cada objeto; reduced-motion funcional; tests en verde.

---

## ETAPA 3 — Barras sin números (cierre de la mecánica 4)

**Qué:** el panel de estado al tocar a Chip pierde los números; queda instrumento analógico puro.

**Alcance:** sacar los números del panel de estado (quedan solo en el panel de debug). Las barras ganan marcas de referencia sutiles (ticks a 25/50/75%) para que el largo se lea sin cifra. Es un ajuste chico — va en la misma sesión que la etapa 2 si los tiempos dan.

**DoD:** captura del panel sin números; el debug conserva los decimales de siempre.

---

## ETAPA 4 — Los gigantes v1 (el arco de la grúa)

**Qué:** la sección de gigantes en la colección, y el primer arco completo de punta a punta.

**Alcance:**
- En la vista de colección, segunda sección: los cuatro gigantes (grúa vieja, carguero, robot de carga, mantenimiento pesado como grupo). Estado inicial: silueta + "?".
- Contador de presencia en el save (días distintos con visita — no visitas: abrir tres veces el mismo día cuenta uno). Migración de save incluida.
- **Arco de la grúa completo:** umbrales de presencia (constantes en config.js) revelan por capas: silueta → nombre ("La grúa vieja") → un detalle del canon ("Chip la mira trabajar desde un lugar seguro") → HITO: el evento de la grúa que baja el brazo.
- **Resignificación del evento raro existente:** el evento de la grúa sale del pool general de raros y pasa a dispararse una única vez, cuando el arco llega al hito. Los tests del evento raro se actualizan a la nueva semántica (el test de "probabilidad como fracción" se conserva para los raros de objetos).
- Los otros tres gigantes: estructura de datos lista (capas definidas, contenido null), silueta visible, sin arco activo. Contenido en pasada editorial posterior.
- Regla de tono en comentario del archivo de datos, textual del brief: "los gigantes nunca se vuelven amigos. Notar ≠ adoptar. El máximo del arco es un gesto."

**DoD:** con el panel de debug se puede simular presencia acumulada y ver el arco de la grúa avanzar capa por capa hasta el hito; el evento del brazo ya no aparece por sorteo; los cuatro gigantes visibles en colección; tests de umbrales y de la resignificación en verde.

---

## ETAPA 5 — Pasada editorial (Damián + Claude, no del dev)

Los ~26 objetos/eventos restantes del pool de 36, escritos según el canon, y el contenido de los arcos del carguero, el robot de carga y mantenimiento pesado. Se escriben con el sistema ya andando y lo que se haya aprendido de verlo. Entra por `eventos-brief.md` y el archivo de datos — la regla de siempre: la fuente editorial es el brief, se propaga al código, nunca al revés.

---

## Orden y ritmo

- Etapa 1 sola, con checkpoint: es la fundación y toca el save. Reporte antes de seguir.
- Etapas 2+3 juntas: son la misma zona visual.
- Etapa 4 al final: depende de la vista de colección de la 2.
- La 5 corre en paralelo desde que la 1 está verificada.

Cada etapa: commit propio, push antes de reportar, tests en verde. Si una decisión del plan choca con algo del código real, la regla de siempre: frenar, decidir con criterio, y reportar el desvío con su porqué — el historial de desvíos bien fundados de este proyecto es exactamente el estándar.

## Lo que este plan deja afuera a propósito

- Sprites ilustrados de los objetos (pasada de arte posterior, con brief propio si hace falta)
- El widget de home (post-validación, anotado en loop-brief)
- Los arcos 2-4 de gigantes (etapa editorial)
- Cualquier moneda, economía o gasto — la colección no se compra ni se vende
