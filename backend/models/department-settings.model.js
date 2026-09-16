import mongoose from 'mongoose';

const objectId = (ref) => ({ type: mongoose.Schema.Types.ObjectId, ref, default: null });

const departmentSettingsSchema = new mongoose.Schema({
  workspace_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  department_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
  general: { color: { type: String, default: '#D49A24', trim: true }, responsible_user_id: objectId('User'), default_team_id: objectId('Team') },
  chat: { connection_ids: { type: [String], default: [] }, greeting: { type: String, default: '' }, translations: { type: mongoose.Schema.Types.Mixed, default: {} }, flow_id: objectId('AutomationFlow'), flow_enabled: { type: Boolean, default: false } },
  assignment: { mode: { type: String, enum: ['manual', 'round_robin', 'least_loaded'], default: 'manual' }, assign_offline: { type: Boolean, default: false }, redistribute_unavailable: { type: Boolean, default: true }, allow_ai_first: { type: Boolean, default: false }, team_ids: { type: [mongoose.Schema.Types.ObjectId], ref: 'Team', default: [] }, default_team_id: objectId('Team') },
  business_hours: { mode: { type: String, enum: ['inherit', 'custom', 'disabled'], default: 'inherit' }, source_id: objectId('WorkingHours'), timezone: { type: String, default: 'America/Santo_Domingo' }, enabled: { type: Boolean, default: true }, schedule: { type: mongoose.Schema.Types.Mixed, default: {} }, away_message: { type: String, default: '' }, after_hours_behavior: { type: String, enum: ['queue', 'away_message', 'ai'], default: 'queue' } },
  resolution: { mode: { type: String, enum: ['inherit', 'custom', 'disabled'], default: 'inherit' }, reason_requirement: { type: String, enum: ['none', 'optional', 'required'], default: 'optional' }, auto_close: { type: Boolean, default: false }, close_after_minutes: { type: Number, min: 1, max: 10080, default: 30 }, notify_before_minutes: { type: Number, min: 0, max: 10080, default: 5 }, notification_message: { type: String, default: '' }, send_farewell: { type: Boolean, default: false }, close_ai_chats: { type: Boolean, default: false } },
  satisfaction: { enabled: { type: Boolean, default: false }, send_on_auto_close: { type: Boolean, default: true }, type: { type: String, enum: ['buttons_1_5', 'interactive_list'], default: 'buttons_1_5' }, request_message: { type: String, default: '¿Cómo calificarías nuestra atención?' }, thank_you_message: { type: String, default: '¡Gracias por tu evaluación!' }, request_comment: { type: Boolean, default: false }, comment_timeout: { type: Number, min: 1, max: 1440, default: 15 }, comment_message: { type: String, default: '¿Quieres contarnos algo más sobre tu experiencia?' }, rating_rules: { type: mongoose.Schema.Types.Mixed, default: [] }, translations: { type: mongoose.Schema.Types.Mixed, default: {} } },
  ai: { mode: { type: String, enum: ['disabled', 'assistant', 'first', 'automatic'], default: 'disabled' }, agent_id: objectId('User'), chatbot_id: objectId('Chatbot'), response_language: { type: String, default: 'es' }, similarity_threshold: { type: Number, min: 0, max: 1, default: 0.7 }, prompt_override: { type: String, default: '' }, fallback_message: { type: String, default: '' }, human_handoff: { type: Boolean, default: true }, human_handoff_message: { type: String, default: 'Te voy a comunicar con un miembro de nuestro equipo.' }, handoff_reasons: { type: [String], default: ['customer_request', 'unknown_answer', 'negative_sentiment', 'refund', 'critical_incident'] } },
  updated_by: objectId('User')
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'organization_department_settings' });

departmentSettingsSchema.index({ workspace_id: 1, department_id: 1 }, { unique: true });

export default mongoose.models.DepartmentSettings || mongoose.model('DepartmentSettings', departmentSettingsSchema);
