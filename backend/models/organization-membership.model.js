import mongoose from 'mongoose';

const membershipSchema = new mongoose.Schema({
  workspace_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  department_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
  area_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Area', required: true, index: true },
  team_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null, index: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  role: { type: String, enum: ['member', 'supervisor', 'manager'], default: 'member' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deleted_at: { type: Date, default: null, index: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'organization_memberships' });

membershipSchema.index({ workspace_id: 1, area_id: 1, user_id: 1, deleted_at: 1 });

export default mongoose.models.OrganizationMembership || mongoose.model('OrganizationMembership', membershipSchema);
