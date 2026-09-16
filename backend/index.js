export { default as Department } from './models/department.model.js';
export { default as Area } from './models/area.model.js';
export { default as OrganizationMembership } from './models/organization-membership.model.js';
export { default as RoutingRule } from './models/routing-rule.model.js';
export { default as AssignmentEvent } from './models/assignment-event.model.js';
export { default as organizationService } from './services/organization.service.js';
export { createOrganizationService } from './services/organization.service.js';
export { createOrganizationRoutes } from './routes/organization.routes.js';
export { registerOrganizationModule } from './integration/register.js';
