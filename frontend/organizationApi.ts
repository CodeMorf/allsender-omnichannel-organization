import type { Area, Department, OrganizationApiOptions, OrganizationMembership, RoutingRule } from './types';

type ApiResponse<T> = { success: boolean; data: T; message?: string };

export function createOrganizationApi(options: OrganizationApiOptions) {
  const fetcher = options.fetcher || fetch;
  const baseUrl = options.baseUrl.replace(/\/$/, '');

  async function request<T>(path: string, init: RequestInit = {}, workspaceId: string): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set('Content-Type', 'application/json');
    const token = options.getToken?.();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const response = await fetcher(`${baseUrl}${path}`, { ...init, headers });
    const payload = await response.json() as ApiResponse<T>;
    if (!response.ok || !payload.success) throw new Error(payload.message || 'Organization request failed');
    return payload.data;
  }

  const json = (body: Record<string, unknown>): RequestInit => ({ method: 'POST', body: JSON.stringify(body) });
  const put = (body: Record<string, unknown>): RequestInit => ({ method: 'PUT', body: JSON.stringify(body) });

  return {
    listDepartments: (workspaceId: string, query = '') => request<{ items: Department[]; pagination: unknown }>(`/departments?workspace_id=${encodeURIComponent(workspaceId)}${query}`, {}, workspaceId),
    createDepartment: (workspaceId: string, body: Record<string, unknown>) => request<Department>('/departments', json({ ...body, workspace_id: workspaceId }), workspaceId),
    getDepartment: (workspaceId: string, id: string) => request<Department>(`/departments/${encodeURIComponent(id)}?workspace_id=${encodeURIComponent(workspaceId)}`, {}, workspaceId),
    updateDepartment: (workspaceId: string, id: string, body: Record<string, unknown>) => request<Department>(`/departments/${encodeURIComponent(id)}`, put({ ...body, workspace_id: workspaceId }), workspaceId),
    deleteDepartment: (workspaceId: string, id: string) => request<Department>(`/departments/${encodeURIComponent(id)}?workspace_id=${encodeURIComponent(workspaceId)}`, { method: 'DELETE' }, workspaceId),
    listAreas: (workspaceId: string, query = '') => request<{ items: Area[]; pagination: unknown }>(`/areas?workspace_id=${encodeURIComponent(workspaceId)}${query}`, {}, workspaceId),
    createArea: (workspaceId: string, body: Record<string, unknown>) => request<Area>('/areas', json({ ...body, workspace_id: workspaceId }), workspaceId),
    updateArea: (workspaceId: string, id: string, body: Record<string, unknown>) => request<Area>(`/areas/${encodeURIComponent(id)}`, put({ ...body, workspace_id: workspaceId }), workspaceId),
    deleteArea: (workspaceId: string, id: string) => request<Area>(`/areas/${encodeURIComponent(id)}?workspace_id=${encodeURIComponent(workspaceId)}`, { method: 'DELETE' }, workspaceId),
    listMemberships: (workspaceId: string, query = '') => request<OrganizationMembership[]>(`/memberships?workspace_id=${encodeURIComponent(workspaceId)}${query}`, {}, workspaceId),
    upsertMembership: (workspaceId: string, body: Record<string, unknown>) => request<OrganizationMembership>('/memberships', json({ ...body, workspace_id: workspaceId }), workspaceId),
    removeMembership: (workspaceId: string, areaId: string, userId: string) => request<OrganizationMembership>(`/memberships/${encodeURIComponent(areaId)}/${encodeURIComponent(userId)}?workspace_id=${encodeURIComponent(workspaceId)}`, { method: 'DELETE' }, workspaceId),
    listRoutingRules: (workspaceId: string, query = '') => request<RoutingRule[]>(`/routing-rules?workspace_id=${encodeURIComponent(workspaceId)}${query}`, {}, workspaceId),
    createRoutingRule: (workspaceId: string, body: Record<string, unknown>) => request<RoutingRule>('/routing-rules', json({ ...body, workspace_id: workspaceId }), workspaceId),
    updateRoutingRule: (workspaceId: string, id: string, body: Record<string, unknown>) => request<RoutingRule>(`/routing-rules/${encodeURIComponent(id)}`, put({ ...body, workspace_id: workspaceId }), workspaceId),
    deleteRoutingRule: (workspaceId: string, id: string) => request<RoutingRule>(`/routing-rules/${encodeURIComponent(id)}?workspace_id=${encodeURIComponent(workspaceId)}`, { method: 'DELETE' }, workspaceId),
    resolveRouting: (workspaceId: string, input: Record<string, unknown>) => request<{ matched: boolean; rule: RoutingRule | null; target: RoutingRule['target'] | null }>('/routing-rules/resolve', json({ ...input, workspace_id: workspaceId }), workspaceId)
  };
}
