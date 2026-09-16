# Guía visual y de configuración — Organización AllSender

## Dónde aparecerá

La entrada se ubicará en la aplicación principal de AllSender, dentro de la
sección que hoy aparece como **Organization Teams** (`/organization_teams`).

Durante la integración se conservará la ruta actual para no romper enlaces ni
formularios de agentes. La experiencia nueva se presentará como:

```text
Organización
├── Resumen
├── Departamentos
├── Áreas
├── Equipos y agentes
└── Reglas de asignación
```

`wapi-admin` no será la pantalla operativa del cliente. El panel de workspace
seguirá reservado para administración global, planes y configuración técnica.

## Vista principal: resumen

```text
┌────────────────────────────────────────────────────────────────────────────┐
│ Organización                                      [Ayuda] [Crear departamento] │
│ Organiza tu atención por departamentos, áreas y equipos                       │
├──────────────────┬──────────────────┬──────────────────┬────────────────────┤
│ Departamentos    │ Áreas            │ Agentes          │ Sin asignar         │
│ 3 activos        │ 7 activas        │ 14 activos       │ 5 conversaciones    │
├────────────────────────────────────────────────────────────────────────────┤
│ Departamentos                                                               │
│ Buscar...       Estado: Todos                                      [+ Nuevo] │
├──────────────────┬─────────────┬────────────┬──────────────┬─────────────────┤
│ Comercial        │ 2 áreas     │ 6 agentes  │ 18 abiertas  │ Abrir           │
│ Soporte          │ 3 áreas     │ 5 agentes  │  7 abiertas  │ Abrir           │
│ Administración   │ 2 áreas     │ 3 agentes  │  2 abiertas  │ Abrir           │
└──────────────────┴─────────────┴────────────┴──────────────┴─────────────────┘
```

La vista no mostrará una configuración de IA en la primera versión. El estado
de atención será claramente **Humano**.

## Flujo de configuración

### Paso 1: crear departamento

El administrador selecciona **Crear departamento** y completa:

- Nombre: `Comercial`.
- Descripción.
- Estado.
- Orden opcional.

Al guardar, el departamento no recibe conversaciones automáticamente todavía.

### Paso 2: crear área

Desde el departamento se selecciona **Nueva área**:

- Nombre: `Ventas`.
- Descripción.
- Equipo principal: se selecciona un `Team` existente.
- Supervisor opcional: se selecciona un agente autorizado.
- Estado.

El selector de equipos reutiliza los equipos actuales de AllSender. No se crea
un segundo sistema de equipos ni se cambian los permisos de `TeamPermission`.

### Paso 3: asociar agentes

En la pestaña **Miembros** se seleccionan los agentes existentes:

```text
Área: Ventas

Buscar agente...

☑ María Rodríguez       Vendedor       Activo
☑ Carlos Pérez          Vendedor       Activo
☐ Ana Gómez             Supervisora   Activo

Rol en el área:
○ Miembro   ● Supervisor   ○ Gerente

                                      [Guardar miembros]
```

Un agente conserva su equipo y sus permisos actuales. La membresía de área es
operativa y no reemplaza el rol de usuario.

### Paso 4: configurar asignación

La pantalla **Reglas de asignación** permite elegir:

- Canal.
- Cuenta conectada.
- Palabras clave.
- Etiqueta del contacto.
- Departamento destino.
- Área destino.
- Equipo destino.
- Cola o round-robin.

Ejemplo:

```text
Nombre: Consultas de ventas por Instagram
Canal: Instagram
Palabras clave: precio, comprar, catálogo
Departamento: Comercial
Área: Ventas
Equipo: Vendedores
Método: Round-robin
Estado: Inactiva

[Probar regla]                       [Activar regla]
```

La regla debe poder probarse antes de activarse. **Probar regla** solo calcula
el destino; no asigna conversaciones ni envía mensajes.

## Vista de departamento

```text
┌────────────────────────────────────────────────────────────────────────────┐
│ ← Organización / Comercial                           [Editar] [Desactivar] │
│ Atención comercial y oportunidades                                          │
├──────────────┬──────────────┬──────────────┬────────────────────────────────┤
│ Resumen      │ Áreas        │ Miembros     │ Reglas de asignación           │
├────────────────────────────────────────────────────────────────────────────┤
│ Áreas del departamento                                      [+ Nueva área]  │
│                                                                            │
│ Ventas        Activa    Vendedores       4 agentes       12 abiertas       │
│ Cotizaciones  Activa    Presupuestos     2 agentes        6 abiertas       │
└────────────────────────────────────────────────────────────────────────────┘
```

## Vista del área

La vista del área tendrá tres zonas:

1. Información y estado.
2. Equipo, supervisor y miembros.
3. Conversaciones pendientes y reglas activas.

```text
┌──────────────────────────────┬─────────────────────────────────────────────┐
│ Ventas                       │ Conversaciones del área                      │
│ Comercial / Ventas           │ [Todas] [Sin asignar] [Abiertas] [Resueltas] │
│ Equipo: Vendedores           │                                             │
│ Supervisor: Ana Gómez        │ Cliente 1       Instagram     María         │
│ 4 miembros                   │ Cliente 2       WhatsApp      Sin asignar   │
│                              │ Cliente 3       Facebook      Carlos        │
│ [Editar área]                │                                             │
└──────────────────────────────┴─────────────────────────────────────────────┘
```

## Integración con la bandeja de chats

En la bandeja existente se agregará un filtro de organización al filtro actual
de agentes:

```text
Filtros
├── Canal
├── Estado
├── Departamento
├── Área
├── Equipo
├── Agente
└── Sin asignar
```

En el perfil de cada conversación se mostrará:

```text
Departamento: Comercial
Área: Ventas
Equipo: Vendedores
Agente: María Rodríguez

[Cambiar departamento] [Cambiar área] [Reasignar agente]
```

La respuesta seguirá siendo humana desde la bandeja actual. La creación de un
departamento o una regla no debe enviar ningún mensaje automáticamente.

## Configuración inicial recomendada

Para un cliente nuevo:

1. Crear los departamentos reales del negocio.
2. Crear las áreas de cada departamento.
3. Seleccionar los equipos existentes.
4. Asociar agentes activos.
5. Definir supervisores.
6. Probar asignación manual.
7. Crear una regla por canal.
8. Probar la regla sin activarla.
9. Activar una sola regla.
10. Verificar conversaciones nuevas.

Configuración inicial de seguridad:

```text
IA: desactivada
Respuesta automática: desactivada
Routing: manual hasta validar estructura
Reglas nuevas: inactivas hasta probarlas
Conversaciones antiguas: no migrar automáticamente
```

## Guía de uso para el cliente

El usuario final debe poder entender lo siguiente sin conocer la arquitectura:

- Un departamento es una unidad grande del negocio.
- Un área es una función específica dentro del departamento.
- Un equipo es el grupo de agentes que atiende esa función.
- Un agente es la persona que responde al cliente.
- Una regla decide a qué área debe llegar una conversación nueva.
- Una conversación existente no cambia de agente por crear una regla.
- La IA no está activa en esta primera versión.

## Segunda opción: IA

La IA no aparecerá como paso obligatorio de configuración. Cuando se implemente,
se añadirá dentro de una sección separada de automatización del área:

```text
Área: Preguntas frecuentes
Modo de atención
○ Solo humanos
○ IA como sugerencia
○ IA automática controlada

Chatbot: [seleccionar]
Escalar a humano cuando: [queja, reembolso, legal, seguridad]
```

El valor por defecto será **Solo humanos**. La IA deberá configurarse por área,
no de forma global para todos los clientes.

## Criterios visuales de aceptación

Antes de integrar en producción deben comprobarse:

- La entrada aparece cerca de `Organization Teams` y conserva los enlaces
  actuales.
- Un cliente entiende la diferencia entre departamento, área, equipo y agente.
- La selección de un equipo reutiliza los equipos actuales.
- Las reglas inactivas no afectan conversaciones.
- La prueba de regla no muta datos.
- La bandeja permite filtrar por departamento y área.
- El agente ve solamente las conversaciones autorizadas.
- La pantalla indica claramente que la IA está desactivada.
- Todas las etiquetas están traducidas a español e inglés.
- Los estados de carga, vacío, error y permiso denegado tienen una respuesta
  visual clara.
