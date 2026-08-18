import { apiRequest } from '../../services/api';
import type { Group, GroupPayload } from './types';

const GROUPS_PATH = '/auth/groups';

export const groupService = {
  getAll: (signal?: AbortSignal) => apiRequest<Group[]>(GROUPS_PATH, { signal }),
  searchByName: (name: string, signal?: AbortSignal) => apiRequest<Group[]>(
    `${GROUPS_PATH}/search?name=${encodeURIComponent(name)}`,
    { signal },
  ),
  create: (payload: GroupPayload) => apiRequest<Group>(GROUPS_PATH, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  update: (id: number, payload: GroupPayload) => apiRequest<Group>(`${GROUPS_PATH}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  remove: (id: number) => apiRequest<void>(`${GROUPS_PATH}/${id}`, { method: 'DELETE' }),
};
