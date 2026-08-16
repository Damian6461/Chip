# SPEC — La apertura y la inclinación de cabeza

Dos problemas que reportó Damián usando la app instalada. Los dos tienen causa medida, así que van con el diagnóstico incluido.

---

## 1. La apertura se ve de mala calidad y el corte es brusco

### Causa medida: los íconos están en modo paleta

Los tres íconos del manifest están guardados como PNG **de color indexado a 256 colores**:

```
icon-192.png          modo=P   colores=255
icon-512.png          modo=P   colores=256
icon-512-maskable.png modo=P   colores=256
```

Android usa `icon-512` para dibujar la splash screen, y la muestra grande. Un dibujo con degradés —la chapa de Chip, el glow cian de la antena, el cielo si aparece— reducido a 256 colores muestra **bandeo y grano** cuando se escala a ese tamaño. Es exactamente lo que se ve.

**Qué hacer:** reexportar los tres como **PNG RGBA de 8 bits por canal, sin paleta**. El peso va a subir de ~100 KB a ~300 KB cada uno, y está perfectamente bien: son tres archivos que se descargan una vez en la instalación y no forman parte del render del juego.

Verificá después que `Image.open(...).mode` dé `RGBA` y no `P`.

Esto además mejora el ícono en la pantalla de inicio, que hoy tiene el mismo problema.

### El corte brusco

Hoy la secuencia es: ícono sobre `#181b1f` → salta a la escena. Ya tenés `disolver-fondo` y `entrar-chip`, pero el salto sigue notándose porque **el contraste entre los dos momentos es enorme**: de un fondo casi negro con un ícono chico, a un galpón con un atardecer brillante ocupando toda la pantalla.

**Tres cosas que lo suavizan:**

- **Alargá el velo de apertura.** Si hoy dura ~360 ms, llevalo a 700-900 ms. En una transición que arranca desde casi negro, 360 ms se lee como un corte con un parpadeo, no como un fundido.
- **Que la escena entre desde el color exacto de la splash**, `#181b1f`, sin ningún paso intermedio. Si hay un frame donde el fondo es otro color, ahí está la costura.
- **Escalonalo:** primero sube el galpón (0-600 ms), y Chip aparece un poco después (300-900 ms). La lectura es "el lugar existe, y Chip está en él", en vez de que todo aparezca de golpe.

Verificá capturando **tres momentos** del arranque: al inicio, a mitad del fundido, y al final.

---

## 2. La inclinación de cabeza deja ver la cabeza de abajo

Damián lo ve en la app. Encontré una causa segura y hay una segunda a verificar.

### Causa confirmada: la antena y el resplandor no están en el grupo

Medido en el DOM:

```
#cabeza-grupo  → hijos: [#cabeza, #parpado, #ojos]
#antena        → padre: #efectos     (FUERA del grupo)
#resplandor    → padre: #efectos     (FUERA del grupo)
```

O sea: cuando el grupo rota, **el poste de la antena rota con la cabeza (está pintado en el sprite) pero el bulbo dibujado por código y su resplandor se quedan quietos.**

La cuenta del desfase: el pivote está a 213,7 px del borde superior del elemento, y la antena vive alrededor de los 31 px. Distancia al pivote ≈ 182 px. A 3°:

```
182 × sin(3°) ≈ 9,6 px de corrimiento horizontal
```

Sobre un bulbo que mide ~14 px, un corrimiento de 9,6 px es casi un diámetro entero. **El bulbo se despega visiblemente del poste.**

**Qué hacer:** meter `#antena` y `#resplandor` dentro de `#cabeza-grupo`, de modo que roten con la cabeza.

Ojo con dos cosas al moverlos:
- El resplandor usa `mix-blend-mode: screen` y el orden de apilamiento importa. Verificá que dentro del grupo siga componiendo igual.
- Si el grupo tiene `overflow` o un `filter`, el glow puede quedar recortado. Comprobalo mirando, no solo por consola.

### Causa a verificar: el borde de la cabeza del sprite

Reportaste que compuesto sobre el sprite entero, a 3° no asoma nada y aguanta hasta 6°. Damián ve otra cosa en el teléfono.

**Volvé a verificarlo con este método**, que es distinto del que usaste: poné el grupo en `rotate: 3deg` de forma fija, tomá captura **a tamaño real en 390×844**, y compará contra la misma captura sin rotación **superponiendo las dos**. Cualquier píxel de la cabeza sin rotar que asome en la versión rotada va a aparecer como diferencia en el borde.

Si asoma, la solución es arquitectónica: mientras la inclinación está activa, **el sprite base tiene que dibujarse con la región de la cabeza enmascarada**, y la capa de la cabeza es la única que la dibuja. El solape de 8 px sobre el torso existe justamente para que esa máscara no deje un hueco en el cuello al rotar.

Si no asoma después de mover la antena, puede que lo que Damián vio fuera el bulbo despegado y no la cabeza. Reportá cuál de las dos era.

---

## Verificación

No lo des por hecho hasta que:

1. Los tres íconos den `mode == RGBA`.
2. Tres capturas del arranque muestren el fundido y no un corte.
3. Con el grupo en `rotate: 3deg` fijo, el bulbo caiga sobre el poste y ningún borde de cabeza asome, verificado **a tamaño real** en 390×844.

---

## 3. La caricia no se siente como una caricia

Esto es lo más importante de la spec, y es un problema de diseño, no de implementación. Lo de abajo reemplaza el comportamiento actual del tap.

### El diagnóstico

Hoy acariciar es **un tap**: el dedo baja y sube en un punto, y Chip reacciona de golpe. Pero un tap no es una caricia — **es un toque, un dedazo**. Y por eso no convence.

La diferencia entre las dos cosas es física y es simple:

- **Un toque es instantáneo y puntual.** Un solo punto de contacto, sin duración.
- **Una caricia es sostenida y en movimiento.** La mano recorre la superficie, y la respuesta se construye mientras dura.

Ningún ajuste de la animación del tap va a arreglar eso, porque el gesto está diciendo otra cosa. Hay que cambiar el gesto.

### El cambio: tres gestos distintos, tres significados

| Gesto | Qué es | Respuesta de Chip |
|---|---|---|
| **Arrastrar el dedo sobre Chip** | Acariciar | Se relaja, disfruta |
| **Tap seco** (sin movimiento) | Tocarlo con el dedo | Se sobresalta; si insistís, se fastidia |
| **Mantener sin mover** | Ver sus números | Abre el panel (como ya está) |

Esto resuelve dos cosas de una. Primero, acariciar **se siente** como acariciar porque efectivamente lo es. Segundo —y esto importa para el modelo sin culpa— **el fastidio se va del lado del toque, no de la caricia**: podés acariciarlo todo lo que quieras, siempre está bien; lo que lo molesta es que lo estés picando con el dedo. Eso además dice algo del personaje.

### Acariciar (arrastrar)

**Detección:** `pointerdown` sobre Chip + movimiento acumulado mayor a ~10 px sin levantar. Desde ahí, mientras el dedo siga apoyado y moviéndose, la caricia está en curso. `touch-action: none` sobre Chip para que el navegador no interprete un scroll.

**La respuesta se construye mientras dura, no de golpe:**

- **Los ojos se entrecierran.** Es lo más importante de todo esto. Ya existe la capa `#parpado` para el parpadeo: usala para sostener una posición a media asta mientras dura la caricia, y volver a abrir cuando termina. Un animal al que le rascan cierra los ojos, y eso se lee como placer sin necesidad de ningún otro efecto. Si solo se implementa una cosa de esta lista, que sea esta.
- **La respiración se hace más lenta y más profunda.** Alargá el ciclo un 25% y subí la amplitud un 40% mientras dura. Es relajación, y es sutil pero se siente.
- **La cabeza sigue la mano.** Usando el `#cabeza-grupo` que ya existe: una inclinación muy chica (1-2°) hacia el lado donde va el dedo, que cambia si cambiás de dirección. No un seguimiento literal — una insinuación.
- **Los corazones salen de a uno**, cada ~500 ms de caricia continua, no en una tanda. Un corazón cada tanto mientras acariciás dice "esto está pasando ahora"; cinco de golpe dicen "recibí un evento".
- **El humor sube de forma continua** mientras dura, en incrementos chicos. Si el humor ya está al máximo, no sube y no hay corazones — el contrato de siempre.

**Al levantar el dedo:** Chip sostiene el estado un momento (~600 ms) y vuelve a `idle` de forma gradual, en ~1,5 s. Sin corte seco. Esa vuelta lenta es parte de lo que hace que se sienta bien.

**Sin límite ni cansancio.** Acariciar siempre está bien. Es lo más cozy que tiene el juego.

### Tocar (tap seco)

**Detección:** `pointerdown` + `pointerup` en menos de ~200 ms y con menos de 10 px de movimiento.

- **Sobresalto:** un squash rápido y corto, y un parpadeo completo. Como cuando le tocás el hombro a alguien que estaba distraído.
- **Sube el humor apenas** (1 punto, menos que la caricia). Un toque no es una caricia, pero tampoco es nada.
- **Si lo tocás 4 o 5 veces en pocos segundos, se fastidia:** pasa a `esperando` —la cara de brazos cruzados— durante ~3 s y no responde a más toques hasta que se le pasa. **No baja ningún stat.** Es gracioso, no punitivo.

Bajá el umbral respecto del actual: hoy son 6 caricias en 4 segundos y en la práctica no se dispara. Con 4 toques en 3 segundos tiene que fastidiarse **siempre**, y hay que verificarlo tocando de verdad, no con eventos sintéticos.

### Sacar el halo azul

El destello cian que aparece al tocar **se va**. Dos razones: parece un feedback de interfaz, como el ripple de un botón, y además es luz fría — que es lo contrario de lo que comunica una caricia.

La respuesta tiene que estar **en el cuerpo de Chip**, no en un efecto encima: los ojos, la respiración, la cabeza, los corazones. Si al final falta algo de calidez, probá un tono muy leve y cálido en el resplandor del bulbo mientras dura la caricia, dentro de la paleta — pero probá primero sin nada.

### Verificación

Esta hay que probarla con el dedo en el teléfono, no con eventos sintéticos. Lo que tiene que pasar:

1. Arrastrar sobre Chip cierra sus ojos a media asta y saca corazones de a uno mientras dura.
2. Levantar el dedo devuelve a `idle` de forma gradual, no de golpe.
3. Cuatro taps secos seguidos lo fastidian, siempre.
4. No aparece ningún halo ni destello cian al tocar.
5. Mantener sin mover sigue abriendo el panel, sin dispararse por accidente al acariciar.

---

## 4. El gesto del panel de debug no funciona en el teléfono

Damián no puede abrirlo manteniendo apretado el botón del menú. Con eventos sintéticos funciona —lo verifiqué— y con el dedo no. La causa está medida.

### Causa: el navegador cancela el gesto antes de los 3 segundos

**El CSS no tiene ni una sola declaración de `touch-action`, `user-select` ni `-webkit-touch-callout`** en sus 4043 líneas.

En Android y iOS, mantener el dedo apretado sobre un elemento dispara el comportamiento nativo de long-press: menú contextual, selección de texto, o el diálogo de guardar imagen. Eso emite **`pointercancel`**, y el handler tiene:

```js
menuBoton.addEventListener('pointercancel', soltar);
```

`soltar()` limpia el temporizador. O sea que el navegador aborta el gesto **antes** de que se cumplan los `ESPERA_DEBUG_MS`. Con eventos sintéticos no pasa, porque no disparan el comportamiento nativo — por eso funciona en automatización y no con el dedo.

Y hay un segundo problema en el mismo handler: cancela también con **`pointerleave`**, así que el micromovimiento normal de un dedo apoyado tres segundos lo aborta.

### Qué hacer

- **`touch-action: none`** sobre el botón del menú, para que el navegador no interprete el gesto.
- **`user-select: none`** y **`-webkit-touch-callout: none`**, que apagan la selección de texto y el menú contextual de iOS.
- **`preventDefault()` en el evento `contextmenu`** del botón.
- **`setPointerCapture`** en el `pointerdown`, y sacar `pointerleave` de la lista de cancelación. En su lugar, cancelar solo si el dedo se aleja más de ~20 px del punto inicial — un umbral de movimiento, no un evento de salida.

### Y aplicá lo mismo a los otros gestos

Esto va a golpear exactamente igual al **mantener apretado sobre Chip** para ver los números, y al **arrastre de la caricia** del punto 3. Los tres gestos necesitan el mismo tratamiento, así que resolvelo una vez y aplicalo a los tres.

Regla general para el proyecto: **cualquier gesto sostenido o de arrastre necesita `touch-action`, `user-select: none` y `contextmenu` prevenido**, o el navegador lo cancela. Anotalo en el README junto a las otras trampas.

### Verificación

Esta no se puede verificar con eventos sintéticos — los sintéticos son justamente los que no reproducen el problema. **La verificación es de Damián, con el dedo, en la PWA instalada.** Reportá qué cambiaste y él lo prueba.

---

## Reglas de siempre

`prefers-reduced-motion` cubre el fundido de apertura (sin fade, aparece directo) y la caricia (la respuesta existe, sin movimiento). Íconos nuevos a `ARCHIVOS_CACHE` con bump. Constantes en `config.js`. Tests en verde. Commit y push antes de reportar.

Y actualizá los `aria-label` y los equivalentes de teclado: hoy dice "Acariciar a Chip. Mantené apretado, o Espacio, para ver sus números", y ahora son tres gestos, no dos.
