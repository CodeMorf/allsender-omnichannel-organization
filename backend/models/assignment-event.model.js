import mongoose from 'mongoose';

const assignmentEventSchema = new mongoose.Schema({
  workspace_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  contact_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', default: null, index: true },
  conversation_key: { type: String, required: true, trim: true, index: true },
  previous: {
    department_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
    area_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Area', default: null },
    team_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    agent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  next: {
    department_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
    area_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Area', default: null },
    team_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    agent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  source: { type: String, enum: ['manual', 'rule', 'round_robin', 'migration'], required: true },
  actor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: { createdAt: 'created_at', updatedAt: false }, collection: 'organization_assignment_events' });

assignmentEventSchema.index({ workspace_id: 1, conversation_key: 1, created_at: -1 });

export default mongoose.models.AssignmentEvent || mongoose.model('AssignmentEvent', assignmentEventSchema);
