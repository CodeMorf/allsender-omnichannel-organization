import mongoose from 'mongoose';

const toObjectId = (value) => (mongoose.Types.ObjectId.isValid(value)
  ? new mongoose.Types.ObjectId(value)
  : null);

const currentOwnerId = (req) => req.user?.owner_id || req.user?._id || req.user?.id;

/**
 * Adapter for the current AllSender host models and authentication context.
 * It deliberately accepts the selected workspace only from the trusted header
 * populated by the platform base API; body/query workspace ids are ignored.
 */
export function createAllSenderOrganizationHostAdapter({ models } = {}) {
  const { Workspace, Team, User, Role, Contact, Chatbot } = models || {};
  if (!Workspace || !Team || !User || !Role || !Contact) {
    throw new Error('AllSender organization adapter requires Workspace, Team, User, Role and Contact models');
  }

  const resolveWorkspaceId = async (req) => {
    const workspaceId = toObjectId(req.headers?.['x-workspace-id']);
    const ownerId = toObjectId(currentOwnerId(req));
    if (!workspaceId || !ownerId) return null;

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      user_id: ownerId,
      deleted_at: null,
      is_active: { $ne: false }
    }).select('_id').lean();

    return workspace?._id || null;
  };

  const validators = {
    ...(Chatbot ? {
      chatbot: async ({ id, workspaceId }) => {
        const workspace = await Workspace.findById(toObjectId(workspaceId)).select('user_id').lean();
        const ownerId = workspace?.user_id;
        const chatbot = ownerId
          ? await Chatbot.findOne({ _id: toObjectId(id), user_id: ownerId, deleted_at: null, status: 'active' }).select('_id').lean()
          : null;
        if (!chatbot) throw new Error('Chatbot is not available in this workspace');
        return chatbot;
      }
    } : {}),
    user: async ({ id, workspaceId }) => {
      const workspace = await Workspace.findById(toObjectId(workspaceId)).select('user_id').lean();
      const ownerId = workspace?.user_id;
      if (!ownerId) throw new Error('Workspace owner context is required');
      const agentRole = await Role.findOne({ name: 'agent', deleted_at: null }).select('_id').lean();
      const query = { _id: toObjectId(id), created_by: ownerId, deleted_at: null, status: true };
      if (agentRole?._id) query.role_id = agentRole._id;
      else query.role_key = 'agent';
      const user = await User.findOne(query).select('_id').lean();
      if (!user) throw new Error('Agent is not available in this workspace');
      return user;
    },
    contact: async ({ id, workspaceId }) => {
      const contact = await Contact.findOne({ _id: toObjectId(id), workspace_id: toObjectId(workspaceId), deleted_at: null }).select('_id').lean();
      if (!contact) throw new Error('Contact is not available in this workspace');
      return contact;
    }
  };

  // Team ownership is owner-scoped in the existing schema (Team has no
  // workspace_id), so this validator resolves the owner through the workspace.
  validators.team = async ({ id, workspaceId }) => {
    const workspace = await Workspace.findById(toObjectId(workspaceId)).select('user_id').lean();
    const ownerId = workspace?.user_id;
    if (!ownerId) throw new Error('Workspace owner context is required');
    const team = await Team.findOne({ _id: toObjectId(id), user_id: ownerId, deleted_at: null, status: 'active' }).select('_id').lean();
    if (!team) throw new Error('Team is not available in this workspace');
    return team;
  };

  return { resolveWorkspaceId, validators };
}
