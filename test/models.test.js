import test from 'node:test';
import assert from 'node:assert/strict';
import Department from '../backend/models/department.model.js';
import Area from '../backend/models/area.model.js';
import Membership from '../backend/models/organization-membership.model.js';
import RoutingRule from '../backend/models/routing-rule.model.js';
import AssignmentEvent from '../backend/models/assignment-event.model.js';

test('organization models use isolated collections and required workspace scope', () => {
  assert.equal(Department.collection.name, 'organization_departments');
  assert.equal(Area.collection.name, 'organization_areas');
  assert.equal(Membership.collection.name, 'organization_memberships');
  assert.equal(RoutingRule.collection.name, 'organization_routing_rules');
  assert.equal(AssignmentEvent.collection.name, 'organization_assignment_events');
  for (const Model of [Department, Area, Membership, RoutingRule, AssignmentEvent]) {
    assert.equal(Model.schema.path('workspace_id').options.required, true);
  }
});

test('organization models do not add AI or outbound-send behavior', () => {
  for (const Model of [Department, Area, Membership, RoutingRule, AssignmentEvent]) {
    assert.equal(Model.schema.path('chatbot_id'), undefined);
    assert.equal(Model.schema.path('ai_model'), undefined);
  }
});
