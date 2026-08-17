# SPEC — Bugs, cargar por retención, y la mirada

Siete puntos. Los últimos dos son de diseño y tienen más desarrollo.

---

## 1. El objeto del piso no desaparece al levantarlo

Bug. Al tocarlo vuela al estante pero **queda también en el piso**. Probablemente el elemento del piso no se está removiendo del DOM al completar la animación de arco, o la animación clona en vez de mover.

Verificá el ciclo completo: aparece al abrir → se toca → vuela al estante → **desaparece del piso** → queda en la repisa → no vuelve a aparecer en la próxima visita.

---

## 2. Los botones siguen leyéndose como interfaz externa

Mejoraron con los tornillos y el borde naranja, pero siguen sin pertenecer al galpón. Y creo que sé por qué, y no es cuestión de más textura:

**Todo lo demás de la escena sigue la perspectiva del piso**, que ya mediste — el punto de fuga en (835, 520), las juntas de las baldosas, la caja de conexión, la toma. Los botones son **rectángulos perfectamente frontales apoyados sobre una barra**. Un objeto frontal en una escena en perspectiva siempre se lee como pegado encima.

**Tres cambios, de mayor a menor impacto:**

**a) Sacá la barra de fondo.** Hoy hay una franja que los contiene y esa franja es lo que más grita "interfaz". Que las tres chapas queden sueltas sobre el piso del galpón, sin contenedor.

**b) Dales sombra de contacto sobre el piso**, como la que tienen la caja de conexión y los objetos de la repisa. Una elipse oscura debajo de cada uno. Eso los mete en el espacio.

**c) Perspectiva leve.** Que los bordes superior e inferior de cada chapa converjan apenas hacia el mismo punto de fuga que las baldosas. No hace falta que sea dramático — 2 o 3 grados de convergencia alcanzan para que el ojo los lea como apoyados y no como pegados.

**Sin perder:** el área táctil de 44×44, el contraste AA del texto, y el tratamiento de apagado por material que ya funciona.

---

## 3. Cargar pasa a ser una acción por retención

**El cambio:** en vez de apretar y esperar 7 segundos, **mantenés apretado y Chip carga mientras lo hagas.** Soltás y para, conservando lo cargado.

- **Posición: Cargar va a la derecha.** Es el gesto que se sostiene, y el pulgar derecho lo alcanza mejor ahí. Jugar y Limpiar se corren.
- **Ritmo:** que llenar de 0 a 100 lleve unos 6-7 segundos de retención continua. Constante en `config.js`.
- **La pantalla del pecho muestra la carga en vivo:** las barritas se llenan de a una y el porcentaje sube mientras mantenés, no al final. Eso es lo que hace que el gesto tenga sentido — estás viendo el efecto de lo que hacés.
- **El cable y los pulsos** corren mientras dura la retención y paran al soltar.
- **Al soltar:** Chip pasa a `feliz` si la batería subió de verdad, con la lógica que ya tenés.
- Si la batería llega a 100 mientras mantenés, la acción termina sola y el botón se apaga.
- Jugar y Limpiar **siguen como están**, con su duración fija. No todo tiene que ser igual: cargar es un proceso, los otros dos son gestos.

**Ojo con el mismo problema del panel de debug:** este gesto es una retención, así que necesita `touch-action`, `user-select: none` y `contextmenu` prevenido, o el navegador lo cancela. Reusá lo que hayas hecho para los otros gestos.

---

## 4. El botón de debug sigue sin funcionar

Damián sigue sin poder abrirlo en el teléfono, después de dos intentos. **Cambiá el enfoque en vez de seguir ajustando el mismo gesto.**

La opción más robusta: **cinco toques rápidos en una esquina fija de la escena** (por ejemplo la superior izquierda, que está vacía). Un tap corto no compite con ningún comportamiento nativo del navegador, así que no hay nada que lo cancele.

Si preferís otra, elegila vos — pero que **no sea una retención**, porque ese camino ya falló dos veces.

---

## 5. Los ojos entrecerrados se ven raros

Pasa en la caricia y en `feliz`. Y creo que la causa es de enfoque, no de ajuste:

**Chip no tiene párpados.** Sus ojos son dos lentes grandes con aro crema y pupila oscura. Una forma que baja encima se lee como una persiana, no como un ojo que se entrecierra. Ningún ajuste de altura o color de esa capa lo va a arreglar.

**La solución: usar arte de ojos contentos de verdad.**

El ilustrador ya los dibujó — `limpiando.webp` tiene los ojos "relajados y entrecerrados de placer", y `standby.webp` los tiene cerrados como dos líneas curvas. O sea que el vocabulario existe, solo que en otras poses.

**Lo que hace falta:** un `idle-ojos-contento.png` — la capa de ojos de idle, pero con la expresión entrecerrada y contenta. Damián lo genera con el mismo método que usó para los otros (mismo prompt, adjuntando `idle.png`, cambiando solo los ojos) y recorta la capa.

Mientras tanto, **sacá el párpado de la caricia y de `feliz`.** Es mejor que Chip no cierre los ojos a que los cierre de una forma que se ve mal. El resto de la respuesta —la respiración, la cabeza, los corazones, los brazos— ya alcanza.

El párpado **se queda para el parpadeo**, que ahí sí funciona porque es un frame de 130 ms y no se llega a leer como forma.

---

## 6. Los aros de luz: revisá la tabla

En `AROS_ORUGA`, el estado `cargando` está **corrido unos 9 puntos a la izquierda** en los dos aros respecto de los otros siete:

```
idle       34,6 / 71,4        jugando    37,4 / 72,8
feliz      33,0 / 72,4        limpiando  36,0 / 71,8
critico    32,2 / 72,6        esperando  36,8 / ...
standby    32,8 / 74,8        cargando   23,4 / 64,8   ← 9 puntos a la izquierda
```

Es un desvío sistemático, no ruido. Y `cargando` es justamente el sprite que Damián reemplazó — o sea, el mismo tipo de contaminación que encontraste en `APOYO_ORUGAS`, donde la medición vieja incluía el cable dibujado que llegaba al borde del lienzo.

**Remedí los aros de `cargando` contra el sprite limpio**, y de paso verificá los otros siete a ojo con el recuadro de contraste, porque si uno se midió contra un sprite viejo pueden haber más.

---

## 7. Que Chip parezca atento

Esta es la más interesante y vale desarrollarla.

**Lo que hace que un personaje se sienta atento no es que te mire: es que dejó de mirar otra cosa para mirarte.** La atención es un cambio de estado, no un estado. Un Chip que mira siempre a la cámara es un póster; uno que estaba mirando la ventana y se da vuelta cuando llegás, está vivo.

Así que hacen falta las dos mitades: **una mirada que vaga, y una mirada que vuelve.**

### Lo que se puede hacer ya, sin arte nuevo

**a) La reacción de llegada.** Cuando la app termina de abrir, después del fundido: la cabeza hace una inclinación corta y vuelve al centro, el bulbo pulsa una vez más fuerte, y la respiración se acelera apenas por un segundo. La lectura es "levantó la vista porque entraste". Es lo más barato y lo más efectivo.

**b) Que la reacción escale con la ausencia.** Ya tenés el dato de días de presencia. Si volviste a los cinco minutos, casi nada. Si volviste después de tres días, la reacción es más marcada: dos inclinaciones, el bulbo más brillante, los brazos se acomodan. Nada de culpa ni de reproche — es alegría proporcional.

**c) Que la mirada se vaya cuando no pasa nada.** Si no tocás nada por 40-60 segundos, la cabeza se inclina hacia la ventana y **se queda ahí**, en vez de volver. Chip se distrajo. Y en cuanto tocás la pantalla, vuelve al centro. Ese ida y vuelta es lo que hace que "volver" signifique algo.

### El paso siguiente, con arte

**Las pupilas que se mueven.** Es lo que realmente vende la atención, y necesita separar la pupila del aro.

Hay un camino que quizás no necesita recorte nuevo: según describiste, debajo de `#ojos` hay una capa de color plano con la forma de los ojos, siempre pintada. Si `#ojos` se traslada 2-3 px, en un lado asomaría esa capa plana — que es exactamente cómo se ve un ojo moviéndose dentro de su cuenca.

**Probalo antes de pedir arte:** trasladá `#ojos` 3 px a un lado y mirá a 4×. Si se lee como una mirada que se mueve, tenemos pupilas gratis. Si se ve como la capa de ojos despegada, entonces hace falta un recorte de pupilas y lo pedimos.

Si funciona: la mirada vaga lento en reposo, vuelve al centro cuando llegás o cuando tocás, y durante la caricia sigue el dedo.

---

## 8. El sonido no vuelve a sonar al reabrir

Damián lo reportó: funciona la primera vez, después de tocar algo. Pero si sale de la app y vuelve a entrar, no suena más, aunque el ajuste siga en "activado".

**Hay dos escenarios distintos y conviene distinguirlos antes de arreglar:**

**a) La app pasa a segundo plano y vuelve.** Acá el audio debería retomar solo. El sospechoso es tu propio handler de `visibilitychange`: pausa al ocultarse, pero al volver puede que no esté llamando a `play()`, o que el `AudioContext` haya quedado en `suspended` y falte un `resume()`. Chequeá el `state` del contexto al volver a ser visible y resumilo explícitamente.

**b) La app se cierra del todo y se abre de nuevo.** Acá el navegador **exige un gesto nuevo del usuario** antes de permitir audio. Eso no se puede saltear, y está bien que sea así.

**Lo que sí se puede hacer, y es lo que corresponde:** que el ajuste siga guardado en "activado", y que **el audio arranque solo con el primer toque de la sesión, sea cual sea** — tocar a Chip, apretar un botón, abrir el menú, cualquier cosa. El usuario no tiene que ir a buscar el toggle otra vez ni enterarse de que hubo un problema.

O sea: un listener de `pointerdown` de una sola vez sobre el documento que, si el ajuste está en activado y el audio no está sonando, lo arranca y se desregistra.

**Verificación:** con el sonido activado, cerrar la PWA por completo, abrirla, y tocar cualquier cosa — el ambiente tiene que empezar a sonar sin que el usuario toque el ajuste. Damián lo prueba en el teléfono, porque el comportamiento de audio en una PWA instalada no se reproduce bien en el navegador de escritorio.

---

## Reglas de siempre

Constantes en `config.js`. `prefers-reduced-motion` cubre lo nuevo. Tests en verde. Commit y push antes de reportar. Verificá a tamaño real y contra la frase textual, y preguntá cuando algo admita dos lecturas.
