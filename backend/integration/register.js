import { createOrganizationRoutes } from '../routes/organization.routes.js';

export function registerOrganizationModule({
  app,
  apiPrefix = '/api',
  models,
  middlewares,
  validators,
  resolveWorkspaceId,
  service
} = {}) {
  if (!app || typeof app.use !== 'function') throw new Error('An Express app is required');
  const router = createOrganizationRoutes({ models, middlewares, validators, resolveWorkspaceId, service });
  const mountPath = `${apiPrefix.replace(/\/$/, '')}/organization`;
  app.use(mountPath, router);
  return { mountPath, router };
}
