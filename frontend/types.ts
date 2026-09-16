export type Status = 'active' | 'inactive';
export type MembershipRole = 'member' | 'supervisor' | 'manager';
export type AssignmentMode = 'queue' | 'round_robin' | 'manual';

export interface Department {
  _id: string;
  workspace_id: string;
  name: string;
  slug: string;
  description?: string | null;
  default_area_id?: string | null;
  status: Status;
  sort_order: number;
}

export interface Area {
  _id: string;
  workspace_id: string;
  department_id: string;
  name: string;
  slug: string;
  description?: string | null;
  default_team_id?: string | null;
  supervisor_id?: string | null;
  status: Status;
  sort_order: number;
}

export interface OrganizationMembership {
  _id: string;
  workspace_id: string;
  department_id: string;
  area_id?: string | null;
  team_id?: string | null;
  user_id: string | { _id: string; name: string; email: string; status: boolean };
  role: MembershipRole;
  status: Status;
}

export interface RoutingRule {
  _id: string;
  workspace_id: string;
  name: string;
  priority: number;
  conditions: {
    platform?: string | null;
    account_id?: string | null;
    keywords: string[];
    tag_ids: string[];
  };
  target: {
    department_id: string;
    area_id?: string | null;
    team_id?: string | null;
    assignment_mode: AssignmentMode;
  };
  status: Status;
}

export interface DepartmentSettings {
  _id: string;
  workspace_id: string;
  department_id: string;
  general: { color: string; responsible_user_id?: string | null; default_team_id?: string | null };
  chat: { connection_ids: string[]; greeting: string; translations: Record<string, string>; flow_id?: string | null; flow_enabled: boolean };
  assignment: { mode: 'manual' | 'round_robin' | 'least_loaded'; assign_offline: boolean; redistribute_unavailable: boolean; allow_ai_first: boolean; team_ids: string[]; default_team_id?: string | null };
  business_hours: { mode: 'inherit' | 'custom' | 'disabled'; timezone: string; enabled: boolean; schedule: Record<string, unknown>; away_message: string; after_hours_behavior: 'queue' | 'away_message' | 'ai' };
  resolution: { mode: 'inherit' | 'custom' | 'disabled'; reason_requirement: 'none' | 'optional' | 'required'; auto_close: boolean; close_after_minutes: number; notify_before_minutes: number; notification_message: string; send_farewell: boolean; farewell_message: string; close_ai_chats: boolean };
  satisfaction: { enabled: boolean; send_on_auto_close: boolean; type: 'buttons_1_5' | 'interactive_list'; request_message: string; thank_you_message: string; request_comment: boolean; comment_timeout: number; comment_message: string; rating_rules: unknown[]; translations: Record<string, string> };
  ai: { mode: 'disabled' | 'assistant' | 'first' | 'automatic'; agent_id?: string | null; response_language: string; similarity_threshold: number; prompt_override: string; fallback_message: string; human_handoff: boolean; human_handoff_message: string; handoff_reasons: string[] };
}

export interface OrganizationApiOptions {
  baseUrl: string;
  getToken?: () => string | null | undefined;
  fetcher?: typeof fetch;
}
