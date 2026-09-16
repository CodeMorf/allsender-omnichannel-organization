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
  area_id: string;
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
    area_id: string;
    team_id?: string | null;
    assignment_mode: AssignmentMode;
  };
  status: Status;
}

export interface OrganizationApiOptions {
  baseUrl: string;
  getToken?: () => string | null | undefined;
  fetcher?: typeof fetch;
}
