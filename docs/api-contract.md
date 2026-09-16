# Contrato de API de Organización AllSender

El host monta el módulo debajo de `/api/organization`. Todas las operaciones
requieren autenticación, suscripción válida, permiso RBAC y un workspace
validado por el servidor. Un `workspace_id` enviado por el cliente nunca debe
ser la única decisión de autorización.

## Departamentos y configuración

```text
GET     /departments
POST    /departments
GET     /departments/:id
PUT     /departments/:id
DELETE  /departments/:id

GET     /departments/:id/settings
PATCH   /departments/:id/settings/general
PATCH   /departments/:id/settings/chat
PATCH   /departments/:id/settings/assignment
PATCH   /departments/:id/settings/business_hours
PATCH   /departments/:id/settings/resolution
PATCH   /departments/:id/settings/satisfaction
PATCH   /departments/:id/settings/ai
GET     /departments/:id/summary
GET     /departments/:id/satisfaction
```

La configuración está separada de la identidad de `Department` en la relación
única `(workspace_id, department_id)`. Cada sección se guarda de forma
independiente; guardar horario no debe validar ni modificar IA o CSAT.

## Creación rápida

```json
{
  "name": "Ventas",
  "description": "Atención comercial y nuevos clientes",
  "status": "active"
}
```

La aplicación puede guardar después, por separado:

```json
{
  "connection_ids": ["<existing-connection-id>"],
  "greeting": "Hola {{contact.name}}, ¿cómo podemos ayudarte?",
  "flow_id": null,
  "flow_enabled": false
}
```

## Miembros, teams y áreas

```text
GET     /departments/:id/members
POST    /departments/:id/members
DELETE  /departments/:id/members/:userId

GET     /memberships
POST    /memberships
DELETE  /memberships/:areaId/:userId

GET     /areas
POST    /areas
GET     /areas/:id
PUT     /areas/:id
DELETE  /areas/:id
```

Una membresía nueva requiere `department_id` y `user_id`; `area_id` y `team_id`
son opcionales. Los registros históricos que ya tienen área continúan siendo
válidos. El team seleccionado es una referencia al `Team` existente y nunca
reescribe `User.team_id`.

```json
{
  "userId": "<existing-agent-id>",
  "teamId": "<existing-team-id>",
  "areaId": null,
  "role": "member"
}
```

## Conexiones

```text
GET /departments/:id/connections
PUT /departments/:id/connections
```

El `PUT` recibe una lista de identificadores de conexiones que ya existen en
AllSender. El host debe comprobar que cada conexión pertenece al workspace,
está activa y puede ser utilizada por el usuario autenticado. No se almacenan
tokens en esta configuración.

## Routing

```text
GET     /routing-rules
POST    /routing-rules
PUT     /routing-rules/:id
DELETE  /routing-rules/:id
POST    /routing-rules/resolve
POST    /assignment-events
```

```json
{
  "name": "Consultas de ventas",
  "priority": 10,
  "conditions": {
    "platform": "instagram",
    "keywords": ["precio", "comprar"]
  },
  "target": {
    "department_id": "<department-id>",
    "area_id": null,
    "team_id": "<existing-team-id>",
    "assignment_mode": "round_robin"
  }
}
```

`department_id` es obligatorio; `area_id` y `team_id` son opcionales. Resolver
una regla solo calcula el destino. El host debe aplicar ese destino a su flujo
existente de Inbox/`ChatAssignment` y registrar un `assignment-event`; la
resolución no envía mensajes, no invoca IA y no modifica contactos por sí sola.

## Estructura de `DepartmentSettings`

```text
general:          color, responsible_user_id, default_team_id
chat:             connection_ids, greeting, translations, flow_id, flow_enabled
assignment:       mode, assign_offline, redistribute_unavailable,
                  allow_ai_first, team_ids, default_team_id
business_hours:   mode, timezone, enabled, schedule, away_message,
                  after_hours_behavior
resolution:       mode, reason_requirement, auto_close, close_after_minutes,
                  notify_before_minutes, notification_message, send_farewell,
                  farewell_message, close_ai_chats
satisfaction:     enabled, send_on_auto_close, type, request_message,
                  thank_you_message, request_comment, comment_timeout,
                  comment_message, rating_rules, translations
ai:               mode, agent_id, chatbot_id, response_language, similarity_threshold,
                  prompt_override, fallback_message, human_handoff,
                  human_handoff_message, handoff_reasons
```

Los modos `inherit`, `custom` y `disabled` permiten que horario, resolución e
IA hereden la configuración de empresa sin obligar al usuario a conocer la
implementación interna.

Cuando `chat.flow_enabled` es verdadero y `chat.flow_id` referencia un flujo
activo del mismo usuario y workspace, el host puede ejecutarlo como bienvenida
del primer mensaje. La referencia se valida contra el workspace y la ejecución
debe conservar el motor de automatizaciones existente; si no es válida, el
mensaje `greeting` queda como fallback.

`/departments/:id/satisfaction` devuelve el resumen persistido de respuestas
del departamento (`total_responses`, `average_rating`, `distribution`,
`comments_count` y respuestas recientes). Las respuestas deben calcularse
siempre con asignaciones y contactos del workspace validado.
