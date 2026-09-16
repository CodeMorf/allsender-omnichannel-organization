import mongoose from 'mongoose';

const routingRuleSchema = new mongoose.Schema({
  workspace_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, trim: true, default: null, maxlength: 500 },
  priority: { type: Number, default: 100, min: 0, max: 100000, index: true },
  conditions: {
    platform: { type: String, default: null, trim: true, lowercase: true },
    account_id: { type: String, default: null, trim: true },
    keywords: { type: [String], default: [] },
    tag_ids: { type: [mongoose.Schema.Types.ObjectId], default: [] }
  },
  target: {
    department_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    area_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Area', required: false, default: null },
    team_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    assignment_mode: { type: String, enum: ['queue', 'round_robin', 'manual'], default: 'queue' }
  },
  status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  deleted_at: { type: Date, default: null, index: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'organization_routing_rules' });

routingRuleSchema.index({ workspace_id: 1, status: 1, priority: 1 });

export default mongoose.models.RoutingRule || mongoose.model('RoutingRule', routingRuleSchema);
