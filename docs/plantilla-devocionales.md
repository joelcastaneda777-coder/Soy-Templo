# Plantilla de devocionales — Soy Templo

Esta es la guía que tu equipo usa para generar un mes de devocionales con Gemini
(o cualquier otra IA) y subirlo directamente en **Panel → Devocionales → Importar un mes**,
sin tocar código ni SQL.

## Cómo funciona el flujo

1. Copia el prompt de la sección "Prompt para Gemini" (más abajo).
2. Reemplaza `[MES]`, `[AÑO]` y `[TEMA DEL MES]` con los datos reales.
3. Pégalo en Gemini y genera el mes completo.
4. Revisa el resultado (recomendado, aunque no obligatorio) y ajusta lo que haga falta.
5. Copia **todo** el Markdown que generó Gemini.
6. Ve a `/admin/devocionales/importar` en la app. Si el archivo usa "Día N" en vez de
   fechas, selecciona el mes y el año de publicación. Pega el Markdown (o sube el archivo
   `.md`) y revisa la vista previa.
7. Si todo se ve bien, dale clic en "Confirmar e importar". Si algún día tiene un problema
   (por ejemplo, le falta la oración final), la vista previa te lo va a señalar exactamente
   sin publicar nada hasta que lo corrijas.

## Formato exacto que debe tener cada día

Cada devocional es un bloque que empieza con `## AAAA-MM-DD — Título` y sigue con estas
seis partes, **en este orden y con estas etiquetas exactas** (el sistema busca ese texto
literal para separar los campos):

```markdown
## 2026-01-01 — Un nuevo comienzo

**Lectura:** Génesis 1:1-5

**Versículo clave:** "En el principio creó Dios los cielos y la tierra." (Génesis 1:1)

**Reflexión:**
Cada primero de enero llega con la sensación de una página en blanco. La Biblia empieza
igual: con un principio, con un Dios que crea orden donde había caos.

No necesitamos tener resuelto todo el año para empezarlo bien. Solo necesitamos confiar
en Aquel que sabe crear algo bueno incluso de la nada.

**Aplicación:** Escribe una intención espiritual para este año — no una meta de éxito,
sino un paso concreto para acercarte más a Dios.

**Preguntas:**
- ¿Qué "caos" de mi vida quiero entregarle a Dios este año?
- ¿Qué significa para mí confiar en un Dios que crea de la nada?

**Oración:** Padre, este año te lo entrego desde el primer día. Ayúdame a confiar en tu
obra, aunque yo no vea el resultado todavía. En el nombre de Jesús, amén.

---

## 2026-01-02 — Título del segundo día

**Lectura:** ...

(y así sucesivamente, un bloque por día, separados por una línea con solo `---`)
```

**Reglas importantes:**
- La fecha va en formato `AAAA-MM-DD` (por ejemplo `2026-01-15`, no `15/01/2026`).
- El separador entre el guion y el título puede ser `—` o `-`.
- Las etiquetas en negrita (`**Lectura:**`, `**Versículo clave:**`, etc.) deben escribirse
  tal cual — con esas tildes y esos dos puntos.
- La Reflexión y la Aplicación pueden tener varios párrafos; solo deja una línea en blanco
  entre párrafo y párrafo.
- Las Preguntas siempre van como lista con guion (`- `), una por línea.
- Termina cada día con una línea que diga solo `---` antes de empezar el siguiente.
- Los campos obligatorios son: Lectura, Versículo clave, Reflexión y Oración. Aplicación y
  Preguntas son opcionales, pero se recomienda incluirlos siempre.

## Formato alternativo (también se acepta, sin conversión)

Si Gemini (o el equipo) genera el contenido así en vez de con fecha exacta, el importador
lo reconoce igual — solo hay que elegir el mes y el año en el formulario de importación
para que calcule las fechas:

```markdown
## Día 1: Un nuevo comienzo

**Lectura:** Génesis 1:1-5

> *"En el principio creó Dios los cielos y la tierra."*

**Devocional:**
Texto de la reflexión...

**Oración:**
*Una oración de cierre.*

---
```

Diferencias que el importador entiende automáticamente:
- `## Día 1: Título` en vez de `## AAAA-MM-DD — Título` (se necesita indicar el mes/año en
  el formulario).
- Una cita en bloque (`> "..."`) justo después de la Lectura, en vez de la etiqueta
  `**Versículo clave:**`.
- `**Devocional:**` como sinónimo de `**Reflexión:**`.
- Texto envuelto en asteriscos de énfasis (`*así*`) — se limpia automáticamente.

Si el archivo no trae Aplicación ni Preguntas, se importa igual; esos campos quedan vacíos
y se pueden completar después editando el devocional.

## Prompt para Gemini (cópialo y complétalo)

```
Actúa como parte del equipo pastoral y de comunicaciones de Soy Templo Internacional,
una iglesia evangélica en El Salvador. Necesito que generes devocionales diarios para
todo el mes de [MES] de [AÑO], con el tema general de "[TEMA DEL MES]".

Tono: cálido, pastoral, cercano, en español neutro con matices salvadoreños naturales
(sin exagerar modismos). Cada devocional debe sentirse como si lo escribiera un pastor
que conoce a su congregación, no como un texto genérico de internet.

Genera un bloque por cada día del mes (del día 1 al último día de [MES] de [AÑO]),
siguiendo EXACTAMENTE este formato Markdown, sin desviarte de las etiquetas:

## AAAA-MM-DD — Título del día

**Lectura:** [una referencia bíblica real y específica, no inventada]

**Versículo clave:** "[cita textual breve, en una versión de dominio público como
Reina-Valera 1960]" (Referencia)

**Reflexión:**
[2 a 3 párrafos de reflexión original, conectando el pasaje con la vida cotidiana.
Nada de relleno genérico: que cada reflexión tenga una idea concreta y distinta.]

**Aplicación:** [una acción concreta y realizable ese mismo día]

**Preguntas:**
- [pregunta de reflexión personal]
- [segunda pregunta, distinta en enfoque a la primera]

**Oración:** [una oración breve de cierre, en primera persona]

---

Reglas:
- No repitas la misma estructura de frases de un día a otro; varía el inicio de cada
  reflexión.
- No repitas el mismo pasaje bíblico en dos días distintos del mismo mes.
- Todos los días del mes deben aparecer, sin saltarte ninguno.
- No agregues texto antes del primer "##" ni después del último "---".
- Usa fechas reales y correctas para [MES] de [AÑO] (revisa cuántos días tiene el mes).
```

## Ejemplo de temas mensuales (opcional, como inspiración)

| Mes | Tema sugerido |
|---|---|
| Enero | Nuevos comienzos y propósito |
| Febrero | El amor de Dios y las relaciones |
| Marzo | Cuaresma: arrepentimiento y renovación |
| Abril | Resurrección y esperanza |
| Mayo | Familia y hogar |
| Junio | Identidad en Cristo |
| Julio | Descanso y confianza |
| Agosto | Ayuno y disciplina espiritual |
| Septiembre | Gratitud y contentamiento |
| Octubre | Fe en medio de la incertidumbre |
| Noviembre | Comunidad y servicio |
| Diciembre | Adviento y esperanza |
