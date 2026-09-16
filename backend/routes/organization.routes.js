import express from 'express';
import organizationService from '../services/organization.service.js';

const noOp = (_req, _res, next) => next();

const actorIdFrom = (req) => req.user?.id || req.user?._id;

const makeError = (error) => {
  const message = error?.message || 'Organization operation failed';
  const status = /not found/i.test(message) ? 404 : /already exists|duplicate/i.test(message) ? 409 : /permission|forbidden/i.test(message) ? 403 : 400;
  return { status, message };
};

const asyncRoute = (handler) => (req, res) => Promise.resolve(handler(req, res)).catch((error) => {
  const result = makeError(error);
  return res.status(result.status).json({ success: false, message: result.message });
});

const usePermission = (checkPermission, permission) => checkPermission ? checkPermission(permission) : noOp;

export function createOrganizationRoutes({ models, middlewares = {}, validators, resolveWorkspaceId, service = null, allowUnsafeForTests = false } = {}) {
  if (typeof resolveWorkspaceId !== 'function') throw new Error('resolveWorkspaceId is required for tenant-safe organization routes');
  if (!allowUnsafeForTests && typeof middlewares.authenticate !== 'function') throw new Error('authenticate middleware is required for organization routes');
  if (!allowUnsafeForTests && typeof middlewares.requireSubscription !== 'function') throw new Error('requireSubscription middleware is required for organization routes');
  if (!allowUnsafeForTests && typeof middlewares.checkPermission !== 'function') throw new Error('checkPermission middleware is required for organization routes');
  const organization = service || (models ? new (organizationService.constructor)(models, validators) : organizationService);
  const router = express.Router();
  const authenticate = middlewares.authenticate || noOp;
  const requireSubscription = middlewares.requireSubscription || noOp;
  const checkPermission = middlewares.checkPermission;
  const checkPlanLimit = middlewares.checkPlanLimit;

  router.use(authenticate, requireSubscription);
  router.use((req, res, next) => {
    Promise.resolve(resolveWorkspaceId(req)).then((workspaceId) => {
      if (!workspaceId) return res.status(400).json({ success: false, message: 'A validated workspace context is required' });
      req.organizationContext = { workspaceId };
      return next();
    }).catch(next);
  });

  const workspace = (req) => req.organizationContext.workspaceId;
  const actor = (req) => actorIdFrom(req);

  router.get('/departments', usePermission(checkPermission, 'view.departments'), asyncRoute(async (req, res) => {
    const data = await organization.listDepartments({ ...req.query, workspaceId: workspace(req) });
    return res.json({ success: true, data });
  }));

  router.post('/departments', checkPlanLimit ? checkPlanLimit('departments') : noOp, usePermission(checkPermission, 'create.departments'), asyncRoute(async (req, res) => {
    const data = await organization.createDepartment({ ...req.body, workspaceId: workspace(req), actorId: actor(req) });
    return res.status(201).json({ success: true, data });
  }));

  router.get('/departments/:id', usePermission(checkPermission, 'view.departments'), asyncRoute(async (req, res) => {
    const data = await organization.getDepartment({ workspaceId: workspace(req), id: req.params.id });
    return res.json({ success: true, data });
  }));

  router.get('/departments/:id/settings', usePermission(checkPermission, 'view.departments'), asyncRoute(async (req, res) => {
    const data = await organization.getDepartmentSettings({ workspaceId: workspace(req), id: req.params.id });
    return res.json({ success: true, data });
  }));

  router.patch('/departments/:id/settings/:section', usePermission(checkPermission, 'update.departments'), asyncRoute(async (req, res) => {
    const data = await organization.updateDepartmentSettings({ workspaceId: workspace(req), actorId: actor(req), id: req.params.id, section: req.params.section, data: req.body });
    return res.json({ success: true, data });
  }));

  router.get('/departments/:id/summary', usePermission(checkPermission, 'view.departments'), asyncRoute(async (req, res) => {
    const data = await organization.getDepartmentSummary({ workspaceId: workspace(req), id: req.params.id });
    return res.json({ success: true, data });
  }));

  router.get('/departments/:id/connections', usePermission(checkPermission, 'view.departments'), asyncRoute(async (req, res) => {
    const data = await organization.listDepartmentConnections({ workspaceId: workspace(req), id: req.params.id });
    return res.json({ success: true, data });
  }));

  router.put('/departments/:id/connections', usePermission(checkPermission, 'update.departments'), asyncRoute(async (req, res) => {
    const data = await organization.updateDepartmentConnections({ workspaceId: workspace(req), actorId: actor(req), id: req.params.id, connection_ids: req.body?.connection_ids });
    return res.json({ success: true, data });
  }));

  router.get('/departments/:id/members', usePermission(checkPermission, 'view.organization'), asyncRoute(async (req, res) => {
    const data = await organization.listMemberships({ workspaceId: workspace(req), departmentId: req.params.id, areaId: req.query.areaId });
    return res.json({ success: true, data });
  }));

  router.post('/departments/:id/members', usePermission(checkPermission, 'manage.organization'), asyncRoute(async (req, res) => {
    const data = await organization.upsertMembership({ ...req.body, departmentId: req.params.id, workspaceId: workspace(req), actorId: actor(req) });
    return res.status(201).json({ success: true, data });
  }));

  router.put('/departments/:id', usePermission(checkPermission, 'update.departments'), asyncRoute(async (req, res) => {
    const data = await organization.updateDepartment({ ...req.body, workspaceId: workspace(req), actorId: actor(req), id: req.params.id });
    return res.json({ success: true, data });
  }));

  router.delete('/departments/:id', usePermission(checkPermission, 'delete.departments'), asyncRoute(async (req, res) => {
    const data = await organization.deleteDepartment({ workspaceId: workspace(req), actorId: actor(req), id: req.params.id });
    return res.json({ success: true, data });
  }));

  router.get('/areas', usePermission(checkPermission, 'view.areas'), asyncRoute(async (req, res) => {
    const data = await organization.listAreas({ ...req.query, workspaceId: workspace(req) });
    return res.json({ success: true, data });
  }));

  router.post('/areas', checkPlanLimit ? checkPlanLimit('areas') : noOp, usePermission(checkPermission, 'create.areas'), asyncRoute(async (req, res) => {
    const data = await organization.createArea({ ...req.body, workspaceId: workspace(req), actorId: actor(req) });
    return res.status(201).json({ success: true, data });
  }));

  router.get('/areas/:id', usePermission(checkPermission, 'view.areas'), asyncRoute(async (req, res) => {
    const data = await organization.getArea({ workspaceId: workspace(req), id: req.params.id });
    return res.json({ success: true, data });
  }));

  router.put('/areas/:id', usePermission(checkPermission, 'update.areas'), asyncRoute(async (req, res) => {
    const data = await organization.updateArea({ ...req.body, workspaceId: workspace(req), actorId: actor(req), id: req.params.id });
    return res.json({ success: true, data });
  }));

  router.delete('/areas/:id', usePermission(checkPermission, 'delete.areas'), asyncRoute(async (req, res) => {
    const data = await organization.deleteArea({ workspaceId: workspace(req), actorId: actor(req), id: req.params.id });
    return res.json({ success: true, data });
  }));

  router.get('/memberships', usePermission(checkPermission, 'view.organization'), asyncRoute(async (req, res) => {
    const data = await organization.listMemberships({ ...req.query, workspaceId: workspace(req) });
    return res.json({ success: true, data });
  }));

  router.post('/memberships', usePermission(checkPermission, 'manage.organization'), asyncRoute(async (req, res) => {
    const data = await organization.upsertMembership({ ...req.body, workspaceId: workspace(req), actorId: actor(req) });
    return res.status(201).json({ success: true, data });
  }));

  router.delete('/memberships/:areaId/:userId', usePermission(checkPermission, 'manage.organization'), asyncRoute(async (req, res) => {
    const data = await organization.removeMembership({ workspaceId: workspace(req), areaId: req.params.areaId, userId: req.params.userId });
    return res.json({ success: true, data });
  }));

  router.get('/routing-rules', usePermission(checkPermission, 'view.routing'), asyncRoute(async (req, res) => {
    const data = await organization.listRoutingRules({ ...req.query, workspaceId: workspace(req) });
    return res.json({ success: true, data });
  }));

  router.post('/routing-rules', checkPlanLimit ? checkPlanLimit('routing_rules') : noOp, usePermission(checkPermission, 'manage.routing'), asyncRoute(async (req, res) => {
    const data = await organization.createRoutingRule({ ...req.body, workspaceId: workspace(req), actorId: actor(req) });
    return res.status(201).json({ success: true, data });
  }));

  router.post('/routing-rules/resolve', usePermission(checkPermission, 'view.routing'), asyncRoute(async (req, res) => {
    const data = await organization.resolveRouting({ workspaceId: workspace(req), input: req.body });
    return res.json({ success: true, data });
  }));

  router.put('/routing-rules/:id', usePermission(checkPermission, 'manage.routing'), asyncRoute(async (req, res) => {
    const data = await organization.updateRoutingRule({ ...req.body, workspaceId: workspace(req), actorId: actor(req), id: req.params.id });
    return res.json({ success: true, data });
  }));

  router.delete('/routing-rules/:id', usePermission(checkPermission, 'manage.routing'), asyncRoute(async (req, res) => {
    const data = await organization.deleteRoutingRule({ workspaceId: workspace(req), actorId: actor(req), id: req.params.id });
    return res.json({ success: true, data });
  }));

  router.post('/assignment-events', usePermission(checkPermission, 'assign.conversations'), asyncRoute(async (req, res) => {
    const data = await organization.recordAssignment({ ...req.body, workspaceId: workspace(req), actorId: actor(req) });
    return res.status(201).json({ success: true, data });
  }));

  return router;
}
