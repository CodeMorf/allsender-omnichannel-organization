# AllSender Omnichannel Organization

Módulo integrable para organizar la atención humana de AllSender por workspace,
departamento, área, equipo y agente. La primera versión no depende de IA y no
envía mensajes automáticamente.

## Objetivo

Este repositorio contiene el contrato y la implementación de referencia para:

- Departamentos y áreas aislados por `workspace_id`.
- Relación operativa con los equipos y agentes existentes.
- Asignación manual y routing humano por reglas sencillas.
- Permisos separados de los permisos actuales de `Team`.
- Auditoría de asignaciones.
- Cliente de API para integrar la interfaz principal.

El módulo no sustituye al `Team` actual. AllSender ya utiliza `Team` y
`TeamPermission` para agrupar agentes y permisos. La integración conserva
`User.team_id`, `Contact.assigned_to` y `ChatAssignment` durante la migración.

## Estado

La base inicial contiene modelos, servicio, rutas, registro para Express,
contrato de API, cliente web y pruebas de dominio. La integración en los
repositorios de producción de API y plataforma es un paso posterior y separado.
No se incluyen credenciales, datos reales, migraciones destructivas ni cambios
de producción.

## Arquitectura

```text
Workspace
└── Department
    └── Area
        ├── Team existente
        ├── miembros/agentes
        └── reglas de routing humano
```

La autorización debe comprobar siempre el workspace además del identificador
del recurso. Un `_id` válido por sí solo nunca autoriza acceso.

## Integración con la API actual

El backend se registra mediante inyección de dependencias para reutilizar los
middlewares y modelos que ya existen en AllSender:

```js
import { registerOrganizationModule } from '@allsender/omnichannel-organization/backend/integration/register.js';

registerOrganizationModule({
  app,
  apiPrefix: '/api',
  models: { Department, Area, OrganizationMembership, RoutingRule, AssignmentEvent },
  middlewares: {
    authenticate,
    requireSubscription,
    checkPermission,
    checkPlanLimit
  }
});
```

El registro monta:

```text
/api/organization/departments
/api/organization/areas
/api/organization/memberships
/api/organization/routing-rules
```

La integración real debe conectarse al `Workspace`, `User`, `Team`, `Contact`
y `ChatAssignment` existentes mediante un adaptador del host. Este repositorio
no crea una segunda autenticación ni una segunda base de usuarios.

## Permisos

```text
view.departments       create.departments       update.departments       delete.departments
view.areas             create.areas             update.areas             delete.areas
view.organization      manage.organization     view.routing             manage.routing
assign.conversations   view.organization_reports
```

La aplicación anfitriona decide cómo registrar estos permisos en su catálogo.
El módulo solo los exige en las rutas.

## IA

La IA no forma parte de la primera versión. El campo de política de IA no se
usa para enrutar ni responder. En una fase posterior podrá añadirse como
consumidor opcional del contexto del área, empezando por sugerencias aprobadas
por un humano.

## Validación local

```bash
npm install
npm run validate
```

Antes de integrar en producción todavía deben ejecutarse las pruebas contra la
API real, los permisos reales, MongoDB, los flujos de conversación y el build
de la plataforma anfitriona.
