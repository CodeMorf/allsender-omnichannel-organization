import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createOrganizationRoutes } from '../backend/routes/organization.routes.js';
import { createAllSenderOrganizationHostAdapter } from '../backend/integration/allSenderHostAdapter.js';

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

test('host adapter rejects ambiguous legacy team and chatbot rows', async () => {
  const workspaceId = '507f1f77bcf86cd799439011';
  const ownerId = '507f1f77bcf86cd799439012';
  const resourceId = '507f1f77bcf86cd799439013';
  const queries = [];
  const queryResult = (value) => ({
    select() { return this; },
    lean: async () => value
  });
  const Workspace = {
    findOne: () => queryResult({ _id: workspaceId, user_id: ownerId }),
    countDocuments: async () => 2
  };
  const Team = {
    findOne: (query) => {
      queries.push({ resource: 'team', query });
      return queryResult(null);
    }
  };
  const Chatbot = {
    findOne: (query) => {
      queries.push({ resource: 'chatbot', query });
      return queryResult(null);
    }
  };
  const adapter = createAllSenderOrganizationHostAdapter({
    models: {
      Workspace,
      Team,
      Chatbot,
      User: {},
      Role: {},
      Contact: {}
    }
  });

  await assert.rejects(
    adapter.validators.team({ id: resourceId, workspaceId }),
    /Team is not available in this workspace/
  );
  await assert.rejects(
    adapter.validators.chatbot({ id: resourceId, workspaceId }),
    /Chatbot is not available in this workspace/
  );

  for (const { query } of queries) {
    assert.equal(query.$or.length, 1);
    assert.equal(query.$or[0].workspace_id.toString(), workspaceId);
  }
});

test('host adapter allows legacy team rows only for a single active workspace owner', async () => {
  const workspaceId = '507f1f77bcf86cd799439011';
  const ownerId = '507f1f77bcf86cd799439012';
  let teamQuery;
  const queryResult = (value) => ({
    select() { return this; },
    lean: async () => value
  });
  const adapter = createAllSenderOrganizationHostAdapter({
    models: {
      Workspace: {
        findOne: () => queryResult({ _id: workspaceId, user_id: ownerId }),
        countDocuments: async () => 1
      },
      Team: {
        findOne: (query) => {
          teamQuery = query;
          return queryResult({ _id: '507f1f77bcf86cd799439013' });
        }
      },
      User: {},
      Role: {},
      Contact: {}
    }
  });

  await adapter.validators.team({ id: '507f1f77bcf86cd799439013', workspaceId });
  assert.equal(teamQuery.$or.length, 3);
  assert.equal(teamQuery.$or[1].user_id.toString(), ownerId);
  assert.equal(teamQuery.$or[2].user_id.toString(), ownerId);
});
