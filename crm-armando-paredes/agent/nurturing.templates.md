# Secuencia de nurturing — prospectos sin respuesta

Variables disponibles (inyectadas por n8n desde el CRM):
`{nombre}` · `{proyecto}` · `{distrito}` · `{tipologia}` (ej. "depa de 2 dorm") ·
`{unidades_restantes}` · `{avance_obra}` · `{url_foto_obra}` · `{proyecto_similar}` ·
`{asesor}`. Todos los mensajes ≤ 3 líneas y en tono peruano natural.

> Regla: la secuencia se **detiene** apenas el prospecto responde, agenda visita, o su
> oportunidad pasa a CERRADO_GANADO / CERRADO_PERDIDO. Cada envío registra una
> `Interaccion` y reinicia el contador de inactividad.

---

## Día 7 — recordatorio suave (texto)
> Hola {nombre}, soy Sofía de Armando Paredes 🙂
> ¿Pudiste revisar la info del {tipologia} en {proyecto} ({distrito})?
> Si tienes cualquier duda, por acá estoy.

## Día 14 — avance de obra (texto + imagen `{url_foto_obra}`)
> {nombre}, te comparto cómo va {proyecto}: ya vamos {avance_obra}% de avance.
> Quería que lo veas de primera mano 👇
> ¿Te gustaría coordinar una visita a la obra?

## Día 21 — escasez real (texto)  ⚠️ usar SOLO si `{unidades_restantes}` es bajo (≤ 5)
> {nombre}, un aviso honesto: de {proyecto} quedan solo {unidades_restantes} unidades
> con la tipología que buscabas.
> Si te interesa, te reservo una para mostrártela sin compromiso.

## Día 30 — alternativa / nuevo proyecto (texto)
> {nombre}, quizá {proyecto} ya no calzaba contigo y está perfecto.
> Acabamos de abrir {proyecto_similar}, con un perfil parecido a lo que buscabas.
> ¿Te mando la info? Sin compromiso.

---

### Notas de implementación
- **Día 21 (escasez):** `{unidades_restantes}` se toma en tiempo real de
  `GET /proyectos/:id/unidades?estado=DISPONIBLE`. Si no es bajo, **saltar** este paso —
  la escasez falsa quema la confianza.
- **Día 14 (foto):** `{url_foto_obra}` sale de un campo del proyecto o de una carpeta de
  Drive/S3 que el equipo de obra actualiza; n8n adjunta la imagen al mensaje de WhatsApp.
- Tras Día 30 sin respuesta: mover la oportunidad a `CERRADO_PERDIDO`
  (`PATCH /prospectos/:id/etapa`, motivo "sin respuesta 30d") para limpiar el pipeline.
