# API contract

The module is mounted below `/api/organization` by the host application.

All requests require a validated workspace context. The host resolver may read
the selected workspace from the authenticated session, but must verify that the
requesting user can access it. A client-supplied `workspace_id` is only an
input to that resolver; it is not an authorization decision.

## Resources

```text
GET    /departments
POST   /departments
GET    /departments/:id
PUT    /departments/:id
DELETE /departments/:id

GET    /areas
POST   /areas
GET    /areas/:id
PUT    /areas/:id
DELETE /areas/:id

GET    /memberships
POST   /memberships
DELETE /memberships/:areaId/:userId

GET    /routing-rules
POST   /routing-rules
PUT    /routing-rules/:id
DELETE /routing-rules/:id
POST   /routing-rules/resolve

POST   /assignment-events
```

## Create department

```json
{
  "name": "Comercial",
  "description": "Atención de oportunidades y ventas",
  "status": "active",
  "sort_order": 10
}
```

## Create area

```json
{
  "department_id": "<department-id>",
  "name": "Ventas",
  "default_team_id": "<existing-team-id>",
  "supervisor_id": "<existing-user-id>"
}
```

## Create routing rule

```json
{
  "name": "Instagram ventas",
  "priority": 10,
  "conditions": {
    "platform": "instagram",
    "keywords": ["precio", "comprar"]
  },
  "target": {
    "department_id": "<department-id>",
    "area_id": "<area-id>",
    "team_id": "<existing-team-id>",
    "assignment_mode": "round_robin"
  }
}
```

`POST /routing-rules/resolve` only calculates the first matching target. It
does not assign a conversation, send a message, invoke AI or mutate a contact.
The host application must perform the assignment through its existing
conversation/ChatAssignment flow and then record an assignment event.
