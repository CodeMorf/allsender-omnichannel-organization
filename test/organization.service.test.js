import test from 'node:test';
import assert from 'node:assert/strict';
import { matchConditions, slugify } from '../backend/services/organization.service.js';

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
