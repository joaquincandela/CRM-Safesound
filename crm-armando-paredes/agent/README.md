# Agente conversacional de WhatsApp — "Sofía"

Capa de tiempo real construida en **n8n** sobre el CRM. n8n recibe el mensaje de
WhatsApp, consulta el CRM, llama a **Claude (`claude-opus-4-8`)** con Structured Outputs,
decide responder o escalar, responde por WhatsApp y registra todo en el CRM.

Archivos de este folder:
- `sofia.system.md` — system prompt del agente (cárgalo en `$vars.SOFIA_SYSTEM_PROMPT`).
- `clasificacion.request.json` — cuerpo exacto del POST a `/v1/messages`.
- `nurturing.templates.md` — plantillas Día 7/14/21/30.

---

## ⚠️ Endpoints que el CRM necesita exponer para esto
Los 4 endpoints listados no bastan para una capa conversacional síncrona. Hay que añadir:
1. **`GET /prospectos?telefono=51999...`** — lookup por teléfono (¿existe el número?).
   Hoy el listado filtra por etapa/score/asesor/proyecto, no por teléfono.
2. **`GET /proyectos/:id/unidades?estado=DISPONIBLE`** — ya existe en el backend; se usa
   para inyectar inventario real y **evitar que Claude invente precios**.
3. **`POST /score/interaccion`** — ya existe; registra la interacción y refresca
   `ultimaActividad` (clave para que el nurturing no dispare de más).
4. Un canal de alerta al asesor (WhatsApp del asesor o Slack) — vive en n8n, no en el CRM.

---

## FLUJO 1 — Conversación entrante (el corazón)

```
[1] WhatsApp Trigger ─▶ [2] Normalizar ─▶ [3] Lookup prospecto ─▶ [4] IF ¿existe?
        │                                                              │
        │                                          NO ────────────────┤
        │                                          ▼                   ▼ SÍ
        │                                [5a] Crear prospecto    [5b] Cargar score+historial
        │                                          └──────────┬────────┘
        │                                                     ▼
        │                              [6] Cargar inventario disponible (GET unidades)
        │                                                     ▼
        │                              [7] Claude — clasificar + responder (Structured Output)
        │                                                     ▼
        │                              [8] Parsear JSON  ──▶ [9] Registrar eventos de score
        │                                                     ▼
        │                              [10] IF ¿escalar_a_humano || score>60 || señales_cierre?
        │                                       │                         │
        │                            SÍ ────────┤                         ├──── NO
        │                                       ▼                         ▼
        │                          [11] Alertar al asesor       [12] Enviar respuesta_sugerida
        │                                       └──────────┬──────────────┘
        └───────────────────────────────────────────────▶ [13] Registrar interacción en CRM
```

**Nodo por nodo:**

1. **WhatsApp Trigger** (WhatsApp Business Cloud / 360dialog / Twilio). Entrega `from`
   (teléfono), `text`, `name`, `message_id`.
2. **Set/Code "Normalizar"** — extrae `telefono`, `mensaje`, `nombre`, `messageId`;
   normaliza el teléfono a formato E.164 (`+51...`).
3. **HTTP Request "Lookup"** — `GET {{CRM}}/prospectos?telefono={{telefono}}` con header
   `Authorization: Bearer {{ $vars.CRM_TOKEN }}`.
4. **IF "¿existe?"** — `{{ $json.data.length > 0 }}`.
5a. **HTTP Request "Crear prospecto"** (rama NO) — `POST {{CRM}}/prospectos`
    `{ nombre, telefono, fuente: "WHATSAPP", proyectoId? }`. Devuelve prospecto +
    oportunidad recién creada.
5b. **HTTP Request "Score 360"** (rama SÍ) — `GET {{CRM}}/prospectos/:id/score` para traer
    score actual, etapa y oportunidad activa.
6. **HTTP Request "Inventario"** — `GET {{CRM}}/proyectos/:id/unidades?estado=DISPONIBLE`
   del proyecto de interés; se serializa a texto y se mete en `<INVENTARIO_DISPONIBLE>`.
   **Esto es lo que impide que Sofía invente precios:** solo ve datos reales.
7. **HTTP Request "Claude"** — `POST https://api.anthropic.com/v1/messages`.
   Headers: `x-api-key: {{ $vars.ANTHROPIC_API_KEY }}`, `anthropic-version: 2023-06-01`,
   `content-type: application/json`. Body = `clasificacion.request.json` con las variables
   resueltas. Structured Outputs garantiza el JSON; **no se usa prefill** (da 400 en 4.8).
8. **Code "Parsear"** — `JSON.parse($json.content[0].text)` → objeto con `intencion`,
   `escalar_a_humano`, `respuesta_sugerida`, `eventos_score`, etc.
9. **HTTP Request (loop) "Score"** — por cada `eventos_score[]`:
   `POST {{CRM}}/score/evento` `{ oportunidadId, regla: tipo }`.
   **Importante:** el backend es la fuente de verdad de los puntos; manda solo `regla`
   (el campo `puntos` que propone Claude es referencial, no se confía en él).
10. **IF "¿escalar?"** — `escalar_a_humano == true` **OR** `score > 60` **OR**
    `señales_cierre.length > 0`.
11. **WhatsApp/Slack "Alertar asesor"** (rama SÍ) — ver plantilla abajo. Además mover la
    oportunidad: `PATCH {{CRM}}/prospectos/:id/etapa { etapa: "NEGOCIACION" }`.
12. **WhatsApp "Responder"** — envía `respuesta_sugerida` al `telefono`. (En la rama de
    escalamiento, el mensaje ya avisa que un asesor lo contactará — igual se envía.)
13. **HTTP Request "Interacción"** — `POST {{CRM}}/score/interaccion`
    `{ prospectoId, oportunidadId, tipo: "WHATSAPP", resumen: mensaje }`. Cierra el loop
    y refresca `ultimaActividad`.

> **Latencia:** el body NO usa `thinking` (omitido) para que la respuesta de WhatsApp sea
> rápida; Structured Outputs ya restringe la salida. Si la calidad del escalamiento lo
> pide, activa `"thinking": {"type": "adaptive"}` a costa de ~1–3 s extra.
>
> **Caché de prompt:** el system prompt va en un bloque con `cache_control`. Para que el
> caché realmente aplique en Opus 4.8 el prefijo estable debe superar ~4096 tokens — si
> agregas el catálogo fijo de proyectos al bloque de system (antes del inventario
> variable), amortizas ese costo en cada mensaje.

---

## FLUJO 2 — Alerta de señal de cierre (parte del nodo [11])

Disparador: `escalar_a_humano == true` o `señales_cierre` no vacío. Mensaje al asesor con
contexto completo, para que llame de inmediato:

```
🔥 PROSPECTO CALIENTE — {{nombre}} ({{telefono}})
Proyecto: {{proyecto}} · Etapa: {{etapa}} · Score: {{score}}
Señal: {{señales_cierre joined}}
Último mensaje: "{{mensaje}}"
Motivo: {{razon_escalar}}
Abrir en CRM: {{CRM_UI}}/prospectos/{{prospectoId}}
```

n8n lo envía al WhatsApp del `{{asesor}}` asignado (o a un canal de Slack del equipo
comercial). La detección de señales NO es un nodo aparte: ya viene resuelta en el JSON del
paso [7] (campos `señales_cierre` + `escalar_a_humano`), porque el system prompt de Sofía
lista los patrones de cierre. Una sola llamada a Claude = menos latencia y menos costo.

---

## FLUJO 3 — Nurturing automatizado (workflow separado, por cron)

```
[1] Schedule Trigger (diario 9:00 a.m., TZ America/Lima)
        ▼
[2] HTTP Request — prospectos inactivos por bucket (7/14/21/30 días)
        ▼
[3] Switch por días de inactividad ─▶ elige plantilla (Día 7/14/21/30)
        ▼
[4] (Día 21) HTTP Request — unidades disponibles; filtra si quedan pocas
[4] (Día 14) Resolver {url_foto_obra}
        ▼
[5] Render plantilla con variables del prospecto  ─▶  [6] Enviar WhatsApp
        ▼
[7] POST /score/interaccion (registra el toque, reinicia ultimaActividad)
```

1. **Schedule Trigger** — `0 9 * * *` (TZ America/Lima).
2. **HTTP Request "Inactivos"** — consulta prospectos vivos por antigüedad de
   `ultimaActividad` (el endpoint `GET /alertas` del CRM ya calcula inactividad; expón un
   filtro por días o reutiliza esa data).
3. **Switch** — enruta a la plantilla según el bucket (7/14/21/30) de
   `nurturing.templates.md`.
4. Día 21: `GET /proyectos/:id/unidades?estado=DISPONIBLE` → si `unidades_restantes > 5`,
   **omitir** (no inventar escasez). Día 14: resolver la foto de avance de obra.
5. **Render** la plantilla con `{nombre}`, `{proyecto}`, etc.
6. **WhatsApp** — envía. Respeta ventana de 24h de WhatsApp Business: fuera de ventana usa
   **plantillas HSM pre-aprobadas** por Meta (los textos de `nurturing.templates.md` deben
   registrarse como templates).
7. **POST /score/interaccion** — deja rastro y reinicia el contador, para no spamear.

> La secuencia se corta sola si el prospecto responde (vuelve al Flujo 1, que registra
> actividad) o si la oportunidad llega a CERRADO_*.
