import test from 'node:test';
import assert from 'node:assert/strict';
import Department from '../backend/models/department.model.js';
import Area from '../backend/models/area.model.js';
import Membership from '../backend/models/organization-membership.model.js';
import RoutingRule from '../backend/models/routing-rule.model.js';
import AssignmentEvent from '../backend/models/assignment-event.model.js';
import DepartmentSettings from '../backend/models/department-settings.model.js';

test('organization models use isolated collections and required workspace scope', () => {
  assert.equal(Department.collection.name, 'organization_departments');
  assert.equal(Area.collection.name, 'organization_areas');
  assert.equal(Membership.collection.name, 'organization_memberships');
  assert.equal(RoutingRule.collection.name, 'organization_routing_rules');
  assert.equal(AssignmentEvent.collection.name, 'organization_assignment_events');
  assert.equal(DepartmentSettings.collection.name, 'organization_department_settings');
  for (const Model of [Department, Area, Membership, RoutingRule, AssignmentEvent]) {
    assert.equal(Model.schema.path('workspace_id').options.required, true);
  }
});

test('area is optional for the primary department membership and routing flows', () => {
  assert.equal(Membership.schema.path('area_id').options.required, false);
  assert.equal(RoutingRule.schema.path('target.area_id').options.required, false);
  assert.equal(DepartmentSettings.schema.path('department_id').options.required, true);
});

test('organization models reference existing AI chatbots without implementing a runtime', () => {
  for (const Model of [Department, Area, Membership, RoutingRule, AssignmentEvent, DepartmentSettings]) {
    assert.equal(Model.schema.path('ai_model'), undefined);
  }
  assert.equal(DepartmentSettings.schema.path('ai.chatbot_id').options.ref, 'Chatbot');
});
