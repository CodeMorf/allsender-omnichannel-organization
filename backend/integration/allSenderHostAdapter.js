import mongoose from 'mongoose';

const toObjectId = (value) => (mongoose.Types.ObjectId.isValid(value)
  ? new mongoose.Types.ObjectId(value)
  : null);

const currentOwnerId = (req) => req.user?.owner_id || req.user?._id || req.user?.id;

const workspaceResourceScope = ({ workspaceId, ownerId, allowLegacyFallback }) => ({
  $or: [
    { workspace_id: toObjectId(workspaceId) },
    ...(allowLegacyFallback
      ? [
        { workspace_id: null, user_id: ownerId },
        { workspace_id: { $exists: false }, user_id: ownerId }
      ]
      : [])
  ]
});

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

  const getWorkspaceOwner = async (workspaceId) => {
    const workspace = await Workspace.findOne({
      _id: toObjectId(workspaceId),
      deleted_at: null,
      is_active: { $ne: false }
    }).select('user_id').lean();
    if (!workspace?.user_id) throw new Error('Workspace owner context is required');

    // Legacy rows without workspace_id are only safe while the owner has one
    // active workspace. Ambiguous legacy rows must be backfilled explicitly.
    const activeWorkspaceCount = typeof Workspace.countDocuments === 'function'
      ? await Workspace.countDocuments({
        user_id: workspace.user_id,
        deleted_at: null,
        is_active: { $ne: false }
      })
      : 0;

    return {
      ownerId: workspace.user_id,
      allowLegacyFallback: activeWorkspaceCount === 1
    };
  };

  const validators = {
    ...(Chatbot ? {
      chatbot: async ({ id, workspaceId }) => {
        const { ownerId, allowLegacyFallback } = await getWorkspaceOwner(workspaceId);
        const chatbot = await Chatbot.findOne({
          _id: toObjectId(id),
          user_id: ownerId,
          deleted_at: null,
          status: 'active',
          ...workspaceResourceScope({ workspaceId, ownerId, allowLegacyFallback })
        }).select('_id').lean();
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

  validators.team = async ({ id, workspaceId }) => {
    const { ownerId, allowLegacyFallback } = await getWorkspaceOwner(workspaceId);
    const team = await Team.findOne({
      _id: toObjectId(id),
      user_id: ownerId,
      deleted_at: null,
      status: 'active',
      ...workspaceResourceScope({ workspaceId, ownerId, allowLegacyFallback })
    }).select('_id').lean();
    if (!team) throw new Error('Team is not available in this workspace');
    return team;
  };

  return { resolveWorkspaceId, validators };
}
