# CHIP — Brief del loop: descubrir, coleccionar, exhibir

Fuente: `investigacion-loop.md` (informe completo con evidencia y referencias). Este documento son las **decisiones**. Si algo acá contradice al informe, gana este documento.

## El diagnóstico en una línea

El juego era "abrí, apretá tres botones, leé una línea". El loop nuevo es: **"¿qué encontró Chip?" → lo veo → va al estante → quiero completar la fila.**

## Regla que no se rompe (la de siempre)

Modelo sin culpa: sin muerte, sin fail-states, sin pérdida, sin presión temporal. Ninguna mecánica nueva puede castigar la ausencia. El decay con piso y el cap de 24h no se tocan.

---

## Mecánica 1 — Objetos-hallazgo (el corazón)

Los eventos del canon ahora **dejan objetos**. "Encontró una tuerca del tamaño de su cabeza" → la tuerca existe: entra a la colección y aparece **en el estante del fondo**, que está dibujado desde el día uno esperando esto.

- No todo evento deja objeto: los de la categoría "la colección" siempre; los demás, a veces (ver tabla de mapeo abajo). Los eventos contemplativos ("miró la lluvia") no dejan nada — la mezcla de eventos-con-objeto y eventos-puros es parte del ritmo.
- El objeto se anuncia en el propio texto del evento (ya está escrito así) y se ve en el estante en la próxima renderización de la escena.
- El estante muestra los objetos obtenidos como sprites chicos. Los no obtenidos: **siluetas apagadas** (efecto Zeigarnik: 11 de 30 motiva; 0 de infinito no).
- Tocar el estante abre la vista de colección: cada objeto con su nombre y la línea del evento que lo trajo. El objeto ES la evidencia de la historia.

## Mecánica 2 — Rareza (el latido)

Dos tiers, sin plata de por medio, solo tiempo y presencia:

- **Comunes (~80% del pool):** caen con la cadencia normal de eventos.
- **Raros (~20% del pool):** probabilidad de aparición **3-5%** por visita elegible. Sin pity timer explícito — la escasez honesta es el diseño (el evento de la grúa ya marcó el camino).
- Pool inicial: **36 objetos** (29 comunes, 7 raros). Acotado, visible, completable en meses, expandible por temporadas — con drops estacionales que **reaparecen cada año** (nada de "nunca vuelve").
- **Cadencia garantizada:** al menos un evento nuevo por día de visita (el "periódico de Tsuki"). Al volver de ausencias largas: 1 a 3 cosas, nunca más — la ausencia no se farmea ni abruma.

## Mecánica 3 — Los gigantes (el arco largo)

Los robots grandes que ignoran a Chip son el contenido de meses: **muy lentamente, empiezan a notarlo.**

- **Cuatro gigantes**, ya presentes en el canon: la grúa vieja, el carguero de siete metros, el robot de carga que lo esquivó, y los de mantenimiento pesado (como grupo).
- Cada uno tiene una **entrada en la colección** que se revela por capas, por presencia acumulada (días de visita, no tareas): silueta → nombre → un detalle → el evento especial donde ese gigante *lo nota*.
- El evento de la grúa que baja el brazo (ya implementado al 1.5%) pasa a ser el **hito final del arco de la grúa** — deja de estar en el pool general y se dispara solo cuando su arco está completo. La escasez ahora tiene estructura narrativa.
- Regla de tono: los gigantes nunca se vuelven amigos ni compañeros. Notar ≠ adoptar. El máximo del arco es un gesto — el mundo sigue siendo enorme e indiferente; solo que una vez, te vio. Eso es lo que lo hace valer.
- **Alcance v1 (se implementa ahora):** las cuatro siluetas en la vista de colección + el contador interno de presencia + el arco de la grúa completo de punta a punta. Los otros tres arcos: estructura lista, contenido en la siguiente pasada.

## Mecánica 4 — Estado sin números (ya encaminada)

El rediseño full-bleed ya esconde las barras tras un tap. Se completa la dirección:

- El panel de estado al tocar a Chip muestra las **barras sin números** — el nivel se lee del largo, como un instrumento analógico. (Los números quedan solo en el panel de debug.)
- El estado ambiental es el sprite + la luz, como siempre. Ningún elemento permanente de HUD numérico.
- Widget de home (Chip durmiendo de noche, el último hallazgo al lado): **anotado como candidato post-validación.** Es la mecánica de reenganche pasivo de Finch, pero es trabajo PWA no trivial — no bloquea nada de lo anterior.

---

## Mapeo evento → objeto (pool inicial: 36)

**Los 10 del canon actual que ya nombran objetos (comunes):**

| Evento | Objeto |
|---|---|
| 6 — la tuerca gigante | Tuerca del tamaño de su cabeza |
| 7 — el cable que no conecta nada | Cable enrollado prolijo |
| 8 — resorte + arandela + misterio | Resorte / Arandela dorada / La-cosa-que-no-sabe-qué-es (3 objetos; el misterio es RARO) |
| 9 — el tornillo que rodó | Tornillo perfecto |
| 10 — contar la colección | (no deja objeto — es meta) |
| 17 — la canción del tanque | Nota nueva (objeto especial, ver abajo) |
| 20 — récord de derrape | Marca de derrape (foto/registro, común) |

**Los ~26 restantes:** se escriben eventos nuevos de hallazgo siguiendo el canon (`eventos-brief.md` manda: tercera persona, dos oraciones, precisión de inventario, nada de drama). Sugerencias de familias: piezas del galpón (bulones, chapas con formas, restos de embalaje), cosas que los gigantes pierden sin darse cuenta (un remache del carguero, un eslabón de la grúa — comunes con historia), y rarezas (algo que cayó por la ventana, una pieza que no es de ningún robot conocido — los raros).

**La canción del tanque como colección paralela chica:** las notas (4 ya, hasta 7) se juntan como objetos; con las 7, un evento raro único: Chip toca la canción completa. Es la progresión larga que el evento 17 ya prometía.

## Prioridad de implementación

1. **Sistema de colección + estante** (mecánicas 1 y 2, con los 10 objetos ya mapeados) — desbloquea todo lo demás
2. **Barras sin números** (mecánica 4) — un ajuste sobre el rediseño en curso
3. **Arco de la grúa completo + siluetas de los cuatro gigantes** (mecánica 3 v1)
4. Escritura de los ~26 objetos/eventos restantes — tarea editorial (Damián + Claude), no del dev; el sistema arranca con los 10
5. Widget de home — post-validación

## Qué NO va (decisiones cerradas, del informe)

- Energía, timers punitivos, recursos que se pudren
- FOMO / exclusivas que no vuelven
- Ads intrusivos (si algún día hay monetización: modelo Neko Atsume — opcional y en tono)
- Breeding, AR, salir a caminar
- Colecciones infinitas sin rareza
- Cuarto stat o cuarto botón — el problema nunca fue falta de acciones
