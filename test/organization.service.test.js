import test from 'node:test';
import assert from 'node:assert/strict';
import { createOrganizationService, matchConditions, slugify } from '../backend/services/organization.service.js';

test('slugify produces stable URL-safe identifiers for Spanish names', () => {
  assert.equal(slugify(' Atención al Cliente '), 'atencion-al-cliente');
  assert.equal(slugify('Ventas / B2B'), 'ventas-b2b');
});

test('routing conditions match platform, account, keywords and tags', () => {
  const conditions = { platform: 'instagram', account_id: 'ig-1', keywords: ['precio', 'comprar'], tag_ids: ['tag-1'] };
  assert.equal(matchConditions({ platform: 'Instagram', account_id: 'ig-1', text: '¿Cuál es el precio?', tag_ids: ['tag-1'] }, conditions), true);
  assert.equal(matchConditions({ platform: 'facebook', account_id: 'ig-1', text: 'precio', tag_ids: ['tag-1'] }, conditions), false);
  assert.equal(matchConditions({ platform: 'instagram', account_id: 'ig-1', text: 'hola', tag_ids: ['tag-1'] }, conditions), false);
  assert.equal(matchConditions({ platform: 'instagram', account_id: 'ig-1', text: 'precio', tag_ids: ['tag-2'] }, conditions), false);
});

test('empty routing conditions are a catch-all rule', () => {
  assert.equal(matchConditions({ platform: 'whatsapp', text: 'hola' }, {}), true);
});

test('department-level membership removal targets the null-area membership', async () => {
  const queries = [];
  const service = createOrganizationService({
    OrganizationMembership: {
      findOneAndUpdate: (query) => {
        queries.push(query);
        return { lean: async () => ({ _id: '507f1f77bcf86cd799439014' }) };
      }
    }
  });

  const result = await service.removeMembership({
    workspaceId: '507f1f77bcf86cd799439011',
    departmentId: '507f1f77bcf86cd799439012',
    userId: '507f1f77bcf86cd799439013'
  });

  assert.equal(result._id, '507f1f77bcf86cd799439014');
  assert.equal(queries.length, 1);
  assert.equal(queries[0].department_id.toString(), '507f1f77bcf86cd799439012');
  assert.equal(queries[0].area_id, null);
});
