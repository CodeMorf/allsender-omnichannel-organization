import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createOrganizationRoutes } from '../backend/routes/organization.routes.js';

test('organization routes require a workspace resolver and preserve the resolved context', async () => {
  const app = express();
  app.use(express.json());
  const calls = [];
  const service = {
    listDepartments: async (input) => {
      calls.push(input);
      return { items: [], pagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: 25 } };
    }
  };
  app.use('/api/organization', createOrganizationRoutes({
    service,
    allowUnsafeForTests: true,
    resolveWorkspaceId: () => '507f1f77bcf86cd799439011'
  }));
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/organization/departments?workspaceId=507f1f77bcf86cd799439012`);
    assert.equal(response.status, 200);
    assert.equal(calls[0].workspaceId, '507f1f77bcf86cd799439011');
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('organization routes reject construction without a secure workspace resolver', () => {
  assert.throws(() => createOrganizationRoutes(), /resolveWorkspaceId is required/);
});

test('organization routes reject construction without host authentication and permission middleware', () => {
  assert.throws(() => createOrganizationRoutes({ resolveWorkspaceId: () => '507f1f77bcf86cd799439011' }), /authenticate middleware is required/);
});
