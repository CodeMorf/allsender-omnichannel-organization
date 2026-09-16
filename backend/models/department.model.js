import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  workspace_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 140 },
  description: { type: String, trim: true, default: null, maxlength: 500 },
  default_area_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Area', default: null },
  sort_order: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  deleted_at: { type: Date, default: null, index: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'organization_departments' });

departmentSchema.index({ workspace_id: 1, slug: 1, deleted_at: 1 });

export default mongoose.models.Department || mongoose.model('Department', departmentSchema);
