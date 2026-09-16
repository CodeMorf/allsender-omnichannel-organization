# Integration checklist for AllSender

## API host

1. Register the organization models in the API model index or pass them directly to the
   module registration function.
2. Register the module after authentication and before the application error
   handler.
3. Provide the existing `authenticate`, `requireSubscription`,
   `checkPermission`, and optional `checkPlanLimit` middlewares.
4. Provide a workspace resolver that validates user, owner and selected
   workspace membership. The selected workspace must be the server-derived
   context; never accept a workspace id from the body or query string.
5. Provide external-reference validators when the request includes an existing
   team, chatbot or user:

   ```js
   validators: {
     team: async ({ id, workspaceId }) => assertTeamBelongsToOwner(id, workspaceId),
     user: async ({ id, workspaceId }) => assertUserCanOperateInWorkspace(id, workspaceId),
     chatbot: async ({ id, workspaceId }) => assertChatbotBelongsToWorkspace(id, workspaceId),
     contact: async ({ id, workspaceId }) => assertContactBelongsToWorkspace(id, workspaceId),
     connection: async ({ id, workspaceId }) => assertConnectionBelongsToWorkspace(id, workspaceId),
     flow: async ({ id, workspaceId }) => assertFlowBelongsToWorkspace(id, workspaceId)
   }
   ```

   The module rejects non-null `team_id`, `supervisor_id`, `user_id`, `chatbot_id`, `connection_id` or
   `contact_id` values
   when the corresponding validator is not installed.
6. Add the permission slugs from the README to the existing permission catalog.
7. Add `departments`, `areas` and `routing_rules` to the plan-limit catalog only
   if the corresponding plan feature exists. Do not enable a missing plan key
   silently.
8. Add a host adapter that validates existing `Team`, `User`, `Contact`,
   connections, automation flows and `ChatAssignment` references before saving
   an operational relationship.

The repository includes `createAllSenderOrganizationHostAdapter` as a starting
adapter for the current AllSender schemas. It resolves the selected workspace
only from `x-workspace-id`, checks ownership through `Workspace`, and validates
teams, chatbots, agents and contacts against the existing collections. `Team`
and `Chatbot` must carry `workspace_id` in the host schema. During a
non-destructive migration, rows with a null or missing `workspace_id` are
accepted only when the owner has exactly one active workspace and the owner
also matches; ambiguous legacy rows are rejected until explicitly backfilled.
The production host must still inject its real model registry and review its
permission/plan policy before enabling writes.

## Platform host

1. Add the client in `src/redux/api` or adapt `frontend/organizationApi.ts` to
   the existing RTK Query base query.
2. Add pages below the existing organization section.
3. Add filters to the human inbox only after API routing and authorization are
   verified.
4. Translate all labels in Spanish and English.
5. Expose IA como una opción del departamento, conectada a los agentes IA y al
   flujo de handoff que ya existen en AllSender. No construyas otro runtime IA.

## Compatibility

- Keep `User.team_id` as the existing primary team reference.
- Keep `Contact.assigned_to` for the existing human assignment.
- Keep `ChatAssignment` for the channel-specific assignment flow.
- Do not move historical contacts during the first rollout.
- Do not make a department or area required for existing records until a
  dry-run migration proves that all records have a valid workspace.
- `area_id` is optional for new memberships and routing targets; historical
  memberships and rules that contain an area remain valid.
- Save each department settings section independently. A disabled or inherited
  section must not block saving an unrelated section.
- Backfill legacy `Team` and `Chatbot` rows before enabling multiple workspaces
  for the same owner. The migration must be idempotent, preserve secrets, and
  stop on ambiguous ownership instead of guessing.
