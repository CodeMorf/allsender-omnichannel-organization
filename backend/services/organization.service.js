import mongoose from 'mongoose';
import Department from '../models/department.model.js';
import Area from '../models/area.model.js';
import OrganizationMembership from '../models/organization-membership.model.js';
import RoutingRule from '../models/routing-rule.model.js';
import AssignmentEvent from '../models/assignment-event.model.js';
import DepartmentSettings from '../models/department-settings.model.js';

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

const asId = (value, label) => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) throw new Error(`${label} is required and must be a valid id`);
  return new mongoose.Types.ObjectId(value);
};

const cleanName = (value, label) => {
  const name = String(value || '').trim();
  if (!name) throw new Error(`${label} is required`);
  if (name.length > 120) throw new Error(`${label} cannot exceed 120 characters`);
  return name;
};

const slugify = (value) => String(value)
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 140);

const pageOptions = (query = {}) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number.parseInt(query.limit, 10) || DEFAULT_LIMIT));
  return { page, limit, skip: (page - 1) * limit };
};

const safeRegex = (value) => String(value || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeConditions = (conditions = {}) => ({
  platform: conditions.platform ? String(conditions.platform).trim().toLowerCase() : null,
  account_id: conditions.account_id ? String(conditions.account_id).trim() : null,
  keywords: Array.isArray(conditions.keywords) ? conditions.keywords.map(String).map((x) => x.trim()).filter(Boolean).slice(0, 50) : [],
  tag_ids: Array.isArray(conditions.tag_ids) ? conditions.tag_ids.map((id) => asId(id, 'tag_id')) : []
});

const matchConditions = (input, conditions = {}) => {
  if (conditions.platform && String(input.platform || '').toLowerCase() !== String(conditions.platform).toLowerCase()) return false;
  if (conditions.account_id && String(input.account_id || '') !== String(conditions.account_id)) return false;
  if (Array.isArray(conditions.tag_ids) && conditions.tag_ids.length) {
    const incoming = new Set((input.tag_ids || []).map(String));
    if (!conditions.tag_ids.some((tag) => incoming.has(String(tag)))) return false;
  }
  if (Array.isArray(conditions.keywords) && conditions.keywords.length) {
    const text = String(input.text || '').toLowerCase();
    if (!conditions.keywords.some((keyword) => text.includes(String(keyword).trim().toLowerCase()))) return false;
  }
  return true;
};

const ensureWorkspaceResource = async (Model, id, workspaceId, label) => {
  const resource = await Model.findOne({ _id: asId(id, label), workspace_id: asId(workspaceId, 'workspace_id'), deleted_at: null });
  if (!resource) throw new Error(`${label} not found in this workspace`);
  return resource;
};

class OrganizationService {
  constructor(models = {}, validators = {}) {
    this.Department = models.Department || Department;
    this.Area = models.Area || Area;
    this.Membership = models.OrganizationMembership || OrganizationMembership;
    this.RoutingRule = models.RoutingRule || RoutingRule;
    this.AssignmentEvent = models.AssignmentEvent || AssignmentEvent;
    this.DepartmentSettings = models.DepartmentSettings || DepartmentSettings;
    this.validators = validators;
  }

  async validateExternalReference(kind, id, workspaceId, label) {
    if (!id) return null;
    const validator = this.validators[kind];
    if (typeof validator !== 'function') throw new Error(`${kind} workspace validator is required before assigning ${label}`);
    await validator({ id, workspaceId });
    return id;
  }

  async createDepartment({ workspaceId, actorId, name, description, status = 'active', sort_order = 0 }) {
    const workspace = asId(workspaceId, 'workspace_id');
    const actor = asId(actorId, 'created_by');
    const clean = cleanName(name, 'Department name');
    const slug = slugify(clean);
    if (!slug) throw new Error('Department name must contain letters or numbers');
    const duplicate = await this.Department.findOne({ workspace_id: workspace, slug, deleted_at: null });
    if (duplicate) throw new Error('A department with this name already exists in this workspace');
    return this.Department.create({ workspace_id: workspace, name: clean, slug, description: description ? String(description).trim() : null, status, sort_order, created_by: actor });
  }

  async listDepartments({ workspaceId, page, limit, search, status } = {}) {
    const workspace = asId(workspaceId, 'workspace_id');
    const options = pageOptions({ page, limit });
    const query = { workspace_id: workspace, deleted_at: null };
    if (status) query.status = status;
    if (search && String(search).trim()) query.$or = [{ name: { $regex: safeRegex(search), $options: 'i' } }, { description: { $regex: safeRegex(search), $options: 'i' } }];
    const [items, total] = await Promise.all([
      this.Department.find(query).sort({ sort_order: 1, name: 1 }).skip(options.skip).limit(options.limit).lean(),
      this.Department.countDocuments(query)
    ]);
    return { items, pagination: { currentPage: options.page, totalPages: Math.ceil(total / options.limit), totalItems: total, itemsPerPage: options.limit } };
  }

  async getDepartment({ workspaceId, id }) {
    return ensureWorkspaceResource(this.Department, id, workspaceId, 'Department');
  }

  async getDepartmentSettings({ workspaceId, id }) {
    const department = await this.getDepartment({ workspaceId, id });
    return this.DepartmentSettings.findOneAndUpdate({ workspace_id: department.workspace_id, department_id: department._id }, { $setOnInsert: { workspace_id: department.workspace_id, department_id: department._id } }, { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }).lean();
  }

  async updateDepartmentSettings({ workspaceId, actorId, id, section, data = {} }) {
    const department = await this.getDepartment({ workspaceId, id });
    const sections = ['general', 'chat', 'assignment', 'business_hours', 'resolution', 'satisfaction', 'ai'];
    if (!sections.includes(section)) throw new Error('Invalid department settings section');
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Settings data must be an object');
    for (const teamId of section === 'assignment' ? [...(data.team_ids || []), data.default_team_id].filter(Boolean) : []) await this.validateExternalReference('team', teamId, workspaceId, 'team_id');
    if (section === 'general' && data.responsible_user_id) await this.validateExternalReference('user', data.responsible_user_id, workspaceId, 'responsible_user_id');
    if (section === 'ai' && data.agent_id) await this.validateExternalReference('user', data.agent_id, workspaceId, 'agent_id');
    if (section === 'ai' && data.chatbot_id) await this.validateExternalReference('chatbot', data.chatbot_id, workspaceId, 'chatbot_id');
    if (section === 'chat' && data.flow_id) await this.validateExternalReference('flow', data.flow_id, workspaceId, 'flow_id');
    if (section === 'chat' && data.connection_ids !== undefined) {
      if (!Array.isArray(data.connection_ids)) throw new Error('connection_ids must be an array');
      for (const connectionId of [...new Set(data.connection_ids.map(String))]) await this.validateExternalReference('connection', connectionId, workspaceId, 'connection_id');
    }
    return this.DepartmentSettings.findOneAndUpdate({ workspace_id: department.workspace_id, department_id: department._id }, { $set: { [section]: data, updated_by: asId(actorId, 'updated_by') }, $setOnInsert: { workspace_id: department.workspace_id, department_id: department._id } }, { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }).lean();
  }

  async getDepartmentSummary({ workspaceId, id }) {
    const department = await this.getDepartment({ workspaceId, id });
    const [settings, agentsCount] = await Promise.all([this.getDepartmentSettings({ workspaceId, id }), this.Membership.countDocuments({ workspace_id: department.workspace_id, department_id: department._id, status: 'active', deleted_at: null })]);
    return { department, settings, agentsCount, openConversations: null };
  }

  async listDepartmentConnections({ workspaceId, id }) {
    const department = await this.getDepartment({ workspaceId, id });
    const settings = await this.getDepartmentSettings({ workspaceId, id });
    const available = typeof this.validators.listConnections === 'function' ? await this.validators.listConnections(workspaceId) : [];
    const selected = new Set((settings.chat?.connection_ids || []).map(String));
    return { items: available, selected_ids: available.filter((item) => selected.has(String(item.id))).map((item) => item.id), department_id: department._id };
  }

  async updateDepartmentConnections({ workspaceId, actorId, id, connection_ids = [] }) {
    const department = await this.getDepartment({ workspaceId, id });
    if (!Array.isArray(connection_ids)) throw new Error('connection_ids must be an array');
    const ids = [...new Set(connection_ids.map((value) => String(value).trim()).filter(Boolean))].slice(0, 100);
    for (const connectionId of ids) await this.validateExternalReference('connection', connectionId, workspaceId, 'connection_id');
    return this.DepartmentSettings.findOneAndUpdate({ workspace_id: department.workspace_id, department_id: department._id }, { $set: { 'chat.connection_ids': ids, updated_by: asId(actorId, 'updated_by') }, $setOnInsert: { workspace_id: department.workspace_id, department_id: department._id } }, { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }).lean();
  }

  async updateDepartment({ workspaceId, actorId, id, ...data }) {
    const current = await this.getDepartment({ workspaceId, id });
    const update = { updated_by: asId(actorId, 'updated_by') };
    if (data.name !== undefined) {
      update.name = cleanName(data.name, 'Department name');
      update.slug = slugify(update.name);
      const duplicate = await this.Department.findOne({ workspace_id: current.workspace_id, slug: update.slug, deleted_at: null, _id: { $ne: current._id } });
      if (duplicate) throw new Error('A department with this name already exists in this workspace');
    }
    if (data.description !== undefined) update.description = data.description ? String(data.description).trim() : null;
    if (data.status !== undefined) update.status = data.status;
    if (data.sort_order !== undefined) update.sort_order = Number(data.sort_order) || 0;
    return this.Department.findOneAndUpdate({ _id: current._id, workspace_id: current.workspace_id, deleted_at: null }, { $set: update }, { new: true, runValidators: true }).lean();
  }

  async deleteDepartment({ workspaceId, id, actorId }) {
    const current = await this.getDepartment({ workspaceId, id });
    const areaCount = await this.Area.countDocuments({ department_id: current._id, workspace_id: current.workspace_id, deleted_at: null });
    if (areaCount > 0) throw new Error('Department cannot be deleted while it contains active areas');
    return this.Department.findOneAndUpdate({ _id: current._id, workspace_id: current.workspace_id, deleted_at: null }, { $set: { deleted_at: new Date(), status: 'inactive', updated_by: asId(actorId, 'updated_by') } }, { new: true }).lean();
  }

  async createArea({ workspaceId, actorId, departmentId, name, description, default_team_id = null, supervisor_id = null, status = 'active', sort_order = 0 }) {
    const workspace = asId(workspaceId, 'workspace_id');
    const department = await ensureWorkspaceResource(this.Department, departmentId, workspace, 'Department');
    const actor = asId(actorId, 'created_by');
    const clean = cleanName(name, 'Area name');
    const slug = slugify(clean);
    const duplicate = await this.Area.findOne({ workspace_id: workspace, department_id: department._id, slug, deleted_at: null });
    if (duplicate) throw new Error('An area with this name already exists in this department');
    await this.validateExternalReference('team', default_team_id, workspaceId, 'default_team_id');
    await this.validateExternalReference('user', supervisor_id, workspaceId, 'supervisor_id');
    return this.Area.create({ workspace_id: workspace, department_id: department._id, name: clean, slug, description: description ? String(description).trim() : null, default_team_id: default_team_id ? asId(default_team_id, 'default_team_id') : null, supervisor_id: supervisor_id ? asId(supervisor_id, 'supervisor_id') : null, status, sort_order, created_by: actor });
  }

  async listAreas({ workspaceId, departmentId, page, limit, search, status } = {}) {
    const workspace = asId(workspaceId, 'workspace_id');
    const options = pageOptions({ page, limit });
    const query = { workspace_id: workspace, deleted_at: null };
    if (departmentId) query.department_id = asId(departmentId, 'department_id');
    if (status) query.status = status;
    if (search && String(search).trim()) query.$or = [{ name: { $regex: safeRegex(search), $options: 'i' } }, { description: { $regex: safeRegex(search), $options: 'i' } }];
    const [items, total] = await Promise.all([
      this.Area.find(query).sort({ sort_order: 1, name: 1 }).skip(options.skip).limit(options.limit).lean(),
      this.Area.countDocuments(query)
    ]);
    return { items, pagination: { currentPage: options.page, totalPages: Math.ceil(total / options.limit), totalItems: total, itemsPerPage: options.limit } };
  }

  async getArea({ workspaceId, id }) {
    return ensureWorkspaceResource(this.Area, id, workspaceId, 'Area');
  }

  async updateArea({ workspaceId, actorId, id, ...data }) {
    const current = await this.getArea({ workspaceId, id });
    const update = { updated_by: asId(actorId, 'updated_by') };
    if (data.name !== undefined) {
      update.name = cleanName(data.name, 'Area name');
      update.slug = slugify(update.name);
      const duplicate = await this.Area.findOne({ workspace_id: current.workspace_id, department_id: current.department_id, slug: update.slug, deleted_at: null, _id: { $ne: current._id } });
      if (duplicate) throw new Error('An area with this name already exists in this department');
    }
    if (data.description !== undefined) update.description = data.description ? String(data.description).trim() : null;
    if (data.status !== undefined) update.status = data.status;
    if (data.sort_order !== undefined) update.sort_order = Number(data.sort_order) || 0;
    if (data.default_team_id !== undefined) update.default_team_id = data.default_team_id ? asId(data.default_team_id, 'default_team_id') : null;
    if (data.supervisor_id !== undefined) update.supervisor_id = data.supervisor_id ? asId(data.supervisor_id, 'supervisor_id') : null;
    await this.validateExternalReference('team', data.default_team_id, workspaceId, 'default_team_id');
    await this.validateExternalReference('user', data.supervisor_id, workspaceId, 'supervisor_id');
    return this.Area.findOneAndUpdate({ _id: current._id, workspace_id: current.workspace_id, deleted_at: null }, { $set: update }, { new: true, runValidators: true }).lean();
  }

  async deleteArea({ workspaceId, id, actorId }) {
    const current = await this.getArea({ workspaceId, id });
    const membershipCount = await this.Membership.countDocuments({ area_id: current._id, workspace_id: current.workspace_id, deleted_at: null });
    if (membershipCount > 0) throw new Error('Area cannot be deleted while it has active members');
    const ruleCount = await this.RoutingRule.countDocuments({ 'target.area_id': current._id, workspace_id: current.workspace_id, deleted_at: null, status: 'active' });
    if (ruleCount > 0) throw new Error('Area cannot be deleted while it has active routing rules');
    return this.Area.findOneAndUpdate({ _id: current._id, workspace_id: current.workspace_id, deleted_at: null }, { $set: { deleted_at: new Date(), status: 'inactive', updated_by: asId(actorId, 'updated_by') } }, { new: true }).lean();
  }

  async upsertMembership({ workspaceId, actorId, departmentId, areaId, userId, teamId = null, role = 'member' }) {
    const workspace = asId(workspaceId, 'workspace_id');
    const department = await ensureWorkspaceResource(this.Department, departmentId, workspace, 'Department');
    const area = areaId ? await ensureWorkspaceResource(this.Area, areaId, workspace, 'Area') : null;
    if (area && String(area.department_id) !== String(department._id)) throw new Error('Area does not belong to the selected department');
    const user = asId(userId, 'user_id');
    await this.validateExternalReference('user', userId, workspaceId, 'user_id');
    await this.validateExternalReference('team', teamId, workspaceId, 'team_id');
    const query = { workspace_id: workspace, department_id: department._id, area_id: area?._id || null, user_id: user };
    return this.Membership.findOneAndUpdate(query, { $set: { team_id: teamId ? asId(teamId, 'team_id') : null, role, status: 'active', created_by: asId(actorId, 'created_by'), deleted_at: null } }, { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }).lean();
  }

  async assignConversation({ workspaceId, actorId, contactId, whatsappPhoneNumberId, departmentId, areaId = null, teamId = null, agentId = null }) {
    const workspace = asId(workspaceId, 'workspace_id');
    const department = await ensureWorkspaceResource(this.Department, departmentId, workspace, 'Department');
    let area = null;
    if (areaId) {
      area = await ensureWorkspaceResource(this.Area, areaId, workspace, 'Area');
      if (String(area.department_id) !== String(department._id)) throw new Error('Area does not belong to the selected department');
    }
    await this.validateExternalReference('team', teamId, workspaceId, 'team_id');
    if (agentId) await this.validateExternalReference('user', agentId, workspaceId, 'agent_id');
    if (typeof this.validators.assignConversation !== 'function') throw new Error('conversation assignment adapter is required');
    return this.validators.assignConversation({ workspaceId, actorId, contactId, whatsappPhoneNumberId, departmentId: department._id, areaId: area?._id || null, teamId, agentId });
  }

  async listMemberships({ workspaceId, areaId, departmentId, status = 'active' } = {}) {
    const query = { workspace_id: asId(workspaceId, 'workspace_id'), deleted_at: null };
    if (areaId) query.area_id = asId(areaId, 'area_id');
    if (departmentId) query.department_id = asId(departmentId, 'department_id');
    if (status) query.status = status;
    return this.Membership.find(query).sort({ role: 1, created_at: 1 }).populate('user_id', 'name email status').populate('team_id', 'name status').lean();
  }

  async removeMembership({ workspaceId, areaId, userId }) {
    const result = await this.Membership.findOneAndUpdate({ workspace_id: asId(workspaceId, 'workspace_id'), area_id: asId(areaId, 'area_id'), user_id: asId(userId, 'user_id'), deleted_at: null }, { $set: { deleted_at: new Date(), status: 'inactive' } }, { new: true }).lean();
    if (!result) throw new Error('Membership not found in this workspace');
    return result;
  }

  async createRoutingRule({ workspaceId, actorId, name, description, priority = 100, conditions = {}, target }) {
    const workspace = asId(workspaceId, 'workspace_id');
    const department = await ensureWorkspaceResource(this.Department, target?.department_id, workspace, 'Department');
    const area = target?.area_id ? await ensureWorkspaceResource(this.Area, target.area_id, workspace, 'Area') : null;
    if (area && String(area.department_id) !== String(department._id)) throw new Error('Routing target area does not belong to the target department');
    const clean = cleanName(name, 'Routing rule name');
    await this.validateExternalReference('team', target.team_id, workspaceId, 'team_id');
    return this.RoutingRule.create({ workspace_id: workspace, name: clean, description: description ? String(description).trim() : null, priority: Number(priority) || 100, conditions: normalizeConditions(conditions), target: { department_id: department._id, area_id: area?._id || null, team_id: target.team_id ? asId(target.team_id, 'team_id') : null, assignment_mode: target.assignment_mode || 'queue' }, created_by: asId(actorId, 'created_by') });
  }

  async listRoutingRules({ workspaceId, status } = {}) {
    const query = { workspace_id: asId(workspaceId, 'workspace_id'), deleted_at: null };
    if (status) query.status = status;
    return this.RoutingRule.find(query).sort({ priority: 1, created_at: 1 }).lean();
  }

  async updateRoutingRule({ workspaceId, actorId, id, ...data }) {
    const current = await this.RoutingRule.findOne({ _id: asId(id, 'routing_rule_id'), workspace_id: asId(workspaceId, 'workspace_id'), deleted_at: null });
    if (!current) throw new Error('Routing rule not found in this workspace');
    const update = { updated_by: asId(actorId, 'updated_by') };
    if (data.name !== undefined) update.name = cleanName(data.name, 'Routing rule name');
    if (data.description !== undefined) update.description = data.description ? String(data.description).trim() : null;
    if (data.priority !== undefined) update.priority = Number(data.priority) || 100;
    if (data.status !== undefined) update.status = data.status;
    if (data.conditions !== undefined) update.conditions = normalizeConditions(data.conditions);
    if (data.target !== undefined) {
      const department = await ensureWorkspaceResource(this.Department, data.target?.department_id, workspaceId, 'Department');
      const area = data.target?.area_id ? await ensureWorkspaceResource(this.Area, data.target.area_id, workspaceId, 'Area') : null;
      if (area && String(area.department_id) !== String(department._id)) throw new Error('Routing target area does not belong to the target department');
      await this.validateExternalReference('team', data.target.team_id, workspaceId, 'team_id');
      update.target = { department_id: department._id, area_id: area?._id || null, team_id: data.target.team_id ? asId(data.target.team_id, 'team_id') : null, assignment_mode: data.target.assignment_mode || 'queue' };
    }
    return this.RoutingRule.findOneAndUpdate({ _id: current._id, workspace_id: current.workspace_id, deleted_at: null }, { $set: update }, { new: true, runValidators: true }).lean();
  }

  async deleteRoutingRule({ workspaceId, actorId, id }) {
    const result = await this.RoutingRule.findOneAndUpdate({ _id: asId(id, 'routing_rule_id'), workspace_id: asId(workspaceId, 'workspace_id'), deleted_at: null }, { $set: { deleted_at: new Date(), status: 'inactive', updated_by: asId(actorId, 'updated_by') } }, { new: true }).lean();
    if (!result) throw new Error('Routing rule not found in this workspace');
    return result;
  }

  async resolveRouting({ workspaceId, input }) {
    const rules = await this.listRoutingRules({ workspaceId, status: 'active' });
    const match = rules.find((rule) => matchConditions(input || {}, rule.conditions));
    return match ? { matched: true, rule: match, target: match.target } : { matched: false, rule: null, target: null };
  }

  async recordAssignment({ workspaceId, actorId = null, contactId = null, conversationKey, previous = {}, next = {}, source, metadata = {} }) {
    if (!conversationKey || !String(conversationKey).trim()) throw new Error('conversation_key is required');
    if (!['manual', 'rule', 'round_robin', 'migration'].includes(source)) throw new Error('Invalid assignment source');
    await this.validateExternalReference('contact', contactId, workspaceId, 'contact_id');
    return this.AssignmentEvent.create({ workspace_id: asId(workspaceId, 'workspace_id'), contact_id: contactId ? asId(contactId, 'contact_id') : null, conversation_key: String(conversationKey).trim(), previous, next, source, actor_id: actorId ? asId(actorId, 'actor_id') : null, metadata });
  }
}

export { matchConditions, slugify };
export const createOrganizationService = (models, validators) => new OrganizationService(models, validators);
export default new OrganizationService();
