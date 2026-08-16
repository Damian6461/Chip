# SPEC — El cable, resuelto de una vez

Este documento reemplaza todas las instrucciones anteriores sobre el cable. Llevamos un día entero de iteraciones sobre esto, así que acá van **las mediciones del defecto**, no descripciones.

**Antes de tocar nada, leé la sección de diagnóstico.** Los dos problemas tienen causa medida.

---

## Diagnóstico

Medido en producción, sobre el `path` de relleno `rgb(43, 49, 56)` en estado `cargando`. El polígono tiene 84 puntos (42 de ida por el borde superior, 42 de vuelta por el inferior).

### Problema 1 — El pico raro

En el punto medio del polígono, la secuencia de coordenadas es:

```
(409.98, 583.23)  →  (417.19, 520.60)
```

**Un salto de 62,6 píxeles verticales entre dos muestras consecutivas.** El resto del recorrido avanza de a 3-4 px por muestra. Ese vértice es donde el cable llega a la caja, y en lugar de doblar con radio, hace una punta aguda: dos tramos casi verticales que se encuentran en un ángulo cerrado, sin redondeo.

**Por qué pasa:** el redondeo de quiebres que implementaste funciona sobre los vértices intermedios, pero el último —el que entra a la caja— no está recibiendo el mismo tratamiento, o su radio es mayor que la longitud del tramo que lo precede, lo que colapsa la curva en una punta.

### Problema 2 — No se une al cuerpo

El primer punto del polígono está en **x = 238,28**, y la escena arranca en **x = 239**. O sea que el cable **nace en el borde izquierdo del canvas**, no en el conector del pecho de Chip.

`CONECTOR_PECHO` está declarado y lo remediste (53,2 / 83), pero el path no está arrancando ahí. O el primer punto de la línea media se calcula desde otro origen, o hay una transformación aplicada al grupo que lo corre.

---

## Qué hacer

### 1. El origen

El **primer punto de la línea media** tiene que caer exactamente sobre `CONECTOR_PECHO`, convertido a coordenadas de la escena. Verificalo así, y dejá el chequeo como test:

```
primerPunto.x ≈ CONECTOR_PECHO.x% × anchoEscena   (tolerancia 1 px)
primerPunto.y ≈ CONECTOR_PECHO.y% × altoEscena
```

Si hoy da 238 y debería dar ~493 (53,2% de 480 + offset de escena), el problema es de sistema de coordenadas, no de la constante.

### 2. La unión

Que el origen coincida no alcanza para que se vea enchufado. Tres cosas juntas:

- **El cable entra, no toca.** Los primeros 6-8 px del cable tienen que quedar **por detrás** del sprite de Chip — que el `z-index` del primer tramo esté debajo del canvas del personaje, o que se dibuje un recorte. Un cable que termina *contra* el borde siempre se ve apoyado; uno que desaparece *dentro* se ve enchufado.
- **Sombra de contacto**, no un óvalo negro. Ya probaste el óvalo sólido y se leía como un agujero: un degradé radial muy suave, corto, centrado en la boca.
- **La dirección de entrada importa.** El cable tiene que entrar **perpendicular a la superficie del pecho** en su primer tramo —o sea, saliendo hacia adelante y abajo—, no tangente. Si el primer segmento corre paralelo al cuerpo, se lee apoyado por más que el punto coincida.

### 3. El pico

Todos los vértices, **incluido el último**, con el mismo radio de redondeo. Y una regla de seguridad: **el radio de un quiebre nunca puede ser mayor que la mitad del tramo más corto que lo toca.** Si lo es, se clampea. Eso evita que la curva colapse en punta.

Verificalo midiendo: **ninguna muestra consecutiva del polígono puede saltar más de ~6 px**. Hoy hay un salto de 62,6. Dejá eso como test — es una propiedad geométrica que se comprueba sola.

---

## Verificación

No la des por hecha hasta que estas tres pasen:

1. **Medida:** ningún salto entre muestras consecutivas mayor a 6 px, y primer punto sobre `CONECTOR_PECHO` con 1 px de tolerancia.
2. **A tamaño real, no ampliada:** captura en 390×844 donde el cable se lea enchufado y sin picos.
3. **Ampliada al 600% sobre la unión:** que se vea el cable entrando detrás del borde del conector, con la sombra suave, y ningún canto duro.

Si después de esto la unión sigue sin leerse bien, **frená y reportá** en vez de seguir iterando. Puede que la solución sea cambiar el enfoque —por ejemplo que el cable nazca fuera de cuadro y pase por detrás de Chip sin unión visible— y esa es una decisión de diseño, no de implementación.
