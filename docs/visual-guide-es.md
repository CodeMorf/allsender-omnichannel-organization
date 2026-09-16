# Guía visual y de configuración — AllSender

## Dónde aparece

La entrada se encuentra en la aplicación principal de AllSender, en
**Organización → Departamentos** (`/organization`). `wapi-admin` conserva la
administración global y no sustituye la pantalla operativa del cliente.

La navegación de la organización mantiene las áreas y equipos existentes como
funciones compatibles, pero la experiencia normal comienza directamente por
departamentos:

```text
Organización
└── Departamentos
    └── Ventas
        ├── General
        ├── Canales y bienvenida
        ├── Equipo y asignación
        ├── Horario
        ├── Cierre y resolución
        ├── Satisfacción
        ├── IA
        └── Avanzado → Áreas / reglas
```

## Alta en menos de un minuto

El botón **Nuevo departamento** abre un formulario pequeño, no un modal gigante.

```text
PASO 1 · INFORMACIÓN
Nombre *        [Ventas                         ]
Descripción     [Atención comercial             ]
Color           [●]

PASO 2 · ATENCIÓN INICIAL (opcional)
Conexiones      ☑ WhatsApp Italia   ☐ Instagram
Team principal  [Equipo Comercial                 ]
Agentes         ☑ María   ☑ Carlos

[Cancelar] [Crear departamento] [Crear y configurar]
```

Solo el nombre es obligatorio. Las conexiones, el team y los agentes se
guardan usando los recursos existentes; el usuario nunca necesita conocer
`workspace_id`, membresías o eventos de asignación.

## Lista de departamentos

```text
Departamentos
Organiza la atención de tus clientes por áreas del negocio, equipos y canales.

[+ Nuevo departamento]
[Buscar] [Estado] [Conexión] [Tarjetas | Lista]

● Ventas                         Activo
  Atención comercial             Agentes: 2   Canales: 1
  Team: Equipo Comercial         Atención: Humana
  Horario: Heredado              Abiertos: —
```

Los estados deben ser explícitos: **Configurado**, **Pendiente**,
**Desactivado** o **Heredado**. Cuando la métrica de conversaciones abiertas
no existe en el host, se muestra `—`, nunca un dato inventado.

## Página del departamento

```text
← Departamentos                         [Activo] [Guardado]
Ventas
Atención comercial y nuevos clientes

General                 Configurado
Canales y bienvenida    Configurado
Equipo y asignación    2 equipos
Horario                Heredado
Cierre y resolución    Desactivado
Satisfacción           Desactivada
IA                     Desactivada
Avanzado               Opcional
```

Cada sección tiene su propio estado de edición y guardado. El botón de guardar
aparece dentro de la sección activa con el nombre correspondiente, por ejemplo
**Guardar Horario** o **Guardar Canales y bienvenida**. El aviso
**Cambios sin guardar** solo pertenece a la sección que se está editando; al
guardar aparece **Guardado**. Cambiar de sección no borra cambios locales
pendientes.

## Canales y bienvenida

Se seleccionan conexiones ya vinculadas a AllSender y se define la bienvenida.
La vista previa del lado derecho se actualiza con el texto y las variables,
por ejemplo `{{contact.name}}`. El flujo opcional apunta al automation builder
existente; no se crea un chatbot paralelo.

```text
Conexiones vinculadas
☑ WhatsApp Italia
☐ Instagram

Mensaje de bienvenida
Hola {{contact.name}}, ¿cómo podemos ayudarte?

Flujo automático de bienvenida       [Activar flujo]
El cliente será enviado directamente al equipo.

🌐 Traducciones
Español       Principal
Italiano      Pendiente
Inglés        Pendiente
Fallback: usar el mensaje principal.
```

## Equipo, agentes y asignación

El team es una referencia al `Team` real de AllSender. Un agente puede estar en
varios departamentos y la membresía no modifica su `User.team_id`.

```text
Modo de asignación
○ Manual       ○ Round-robin       ○ Menor carga

Team principal [Equipo Comercial]
[ ] Permitir agentes fuera de línea
[✓] Reasignar si deja de estar disponible
[ ] Permitir IA antes de asignar humano

Agentes
María       En línea   Miembro ✓   Recibe asignaciones ✓
Carlos      Ausente    Miembro ✓   Recibe asignaciones ✓
```

Las áreas son opcionales. Solo aparecen en **Avanzado → Áreas** para negocios
que necesitan una clasificación adicional.

## Horario, cierre y satisfacción

Horario ofrece **Usar horario de la empresa**, **Personalizar este departamento**
o **Desactivar horario**. La personalización admite zona horaria, múltiples
intervalos por día y mensaje fuera de horario. Cierre permite motivo, aviso,
inactividad, despedida y cierre de chats IA. Satisfacción permite encuesta
1–5, comentario, tiempo límite, rangos de respuesta y traducciones.

## IA y transferencia

IA es opcional y parte de la configuración del departamento. Puede estar
desactivada, actuar como asistente, atender primero o actuar automáticamente.
Se reutilizan los agentes IA y el contexto del host. La transferencia puede
dirigirse al team principal, otro team, un departamento o una persona; el host
debe conservar historial, archivos, notas y contacto.

## Bandeja de entrada

El Inbox debe incorporar los filtros Departamento, Área opcional, Team, Agente,
Canal y Estado. En cada conversación se muestra el destino operativo:

```text
Ventas → Equipo Comercial → María
Ventas → Emma Sales AI
```

El módulo de organización calcula y valida el destino. La recepción de
mensajes, asignación efectiva, respuesta, cierre y handoff deben conectarse al
flujo de conversación ya existente.

## Criterios de aceptación

- Crear `Ventas` solo con nombre funciona.
- Crear con canal, team y agentes guarda las relaciones existentes.
- Departamento sin área funciona; departamentos y reglas antiguas con área
  siguen funcionando.
- Las secciones guardan de forma independiente.
- Un workspace no puede leer ni guardar recursos de otro.
- Estados de carga, vacío, error y permisos se muestran en lenguaje de cliente.
- La pantalla funciona en desktop, tablet, móvil y tema claro/oscuro.
- IA y automatizaciones permanecen apagadas por defecto.
