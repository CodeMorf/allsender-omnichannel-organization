# AllSender Omnichannel Organization

Módulo integrable para convertir un departamento de AllSender en una unidad
operativa de atención omnicanal. La jerarquía principal es:

```text
Workspace → Departamento → Team → agente humano o agente IA
                         ↘ Área opcional (configuración avanzada)
```

Un departamento puede funcionar únicamente con nombre. Cuando se necesita más
control, reutiliza los teams, usuarios, conexiones, automatizaciones, horarios,
Inbox, permisos y agentes IA que ya existen en AllSender. El módulo no crea un
segundo sistema de usuarios, teams, chatbot, conexiones, IA ni horarios.

## Qué incluye

- Departamentos aislados por `workspace_id`, con borrado lógico y compatibilidad
  con áreas existentes.
- Configuración independiente de canales y bienvenida, team y asignación,
  horarios, resolución, satisfacción y IA opcional.
- Membresías Department → Team → agente sin modificar `User.team_id`; un agente
  puede pertenecer a varios departamentos.
- Routing con destino `department_id` obligatorio y `area_id`/`team_id` opcionales.
- Validación de workspace para departamentos, áreas, teams, agentes, contactos,
  automatizaciones y conexiones.
- Auditoría de asignaciones mediante el flujo existente de conversaciones y
  `ChatAssignment`; resolver una regla por sí solo no envía mensajes.
- Cliente de API y contrato para integrar la pantalla de Departamentos de la
  plataforma AllSender.

## Estado de integración

El contrato, los modelos y las rutas de referencia están preparados para el
host AllSender. La integración productiva debe inyectar los modelos reales,
middlewares, resolver de workspace y validadores del host. No se incluyen
credenciales ni migraciones destructivas.

La pantalla recomendada es una página propia por departamento, con navegación
por secciones y guardado independiente. La alta rápida ofrece únicamente:
nombre, descripción, color, conexiones, team principal y agentes opcionales.

## Integración con la API actual

```js
import { registerOrganizationModule } from '@allsender/omnichannel-organization/backend/integration/register.js';

registerOrganizationModule({
  app,
  apiPrefix: '/api',
  models: {
    Department, Area, OrganizationMembership, RoutingRule, AssignmentEvent,
    DepartmentSettings
  },
  middlewares: { authenticate, requireSubscription, checkPermission, checkPlanLimit },
  validators: { team, user, contact, connection, flow },
  resolveWorkspaceId
});
```

El registro monta `/api/organization`. Las operaciones de configuración son:

```text
GET   /departments
POST  /departments
GET   /departments/:id
PUT   /departments/:id
DELETE /departments/:id
GET   /departments/:id/settings
PATCH /departments/:id/settings/:section
GET   /departments/:id/summary
GET   /departments/:id/satisfaction
GET   /departments/:id/members
POST  /departments/:id/members
GET   /departments/:id/connections
PUT   /departments/:id/connections
```

Las rutas históricas de áreas, membresías, reglas y eventos se conservan. El
endpoint de satisfacción devuelve respuestas, promedio, distribución 1-5 y
comentarios del departamento, siempre limitado por `workspace_id`.

Al cerrar una conversación, el host puede enviar `reason` a `/chat/status`.
Cuando `resolution.reason_requirement` es `required`, el cierre se rechaza si
no se proporciona un motivo. El `ChatAssignment` conserva `resolution_reason` y
`resolved_at`; los cierres automáticos usan el motivo `inactivity`.

## Permisos

El host debe registrar en su catálogo existente, como mínimo:

```text
view.departments       create.departments       update.departments
delete.departments     manage.organization      view.routing
manage.routing         assign.conversations
```

Los permisos se evalúan con el RBAC de AllSender; no se crea otro sistema.

## IA y transferencia

La IA es opcional. `disabled` mantiene el flujo humano; `assistant`, `first` y
`automatic` reutilizan los agentes IA existentes. La configuración permite
fallback y transferencia a humano, pero el módulo no inventa un runtime de IA:
el host debe conectar esas decisiones con su flujo de Inbox y registrar el
evento de transferencia.

## Validación local

```bash
npm install
npm run validate
```

Antes de declarar una integración completa hay que probar en el host real:
aislamiento entre workspaces, permisos de un cliente no administrador,
conexiones activas, creación de agentes, recepción en Inbox, round-robin,
horarios, cierre, CSAT, traducciones, IA/handoff y build de la plataforma.
