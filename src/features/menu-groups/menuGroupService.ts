import { apiRequest } from '../../services/api';
import type { MenuPermission, MenuPermissionPayload } from './types';

export const menuGroupService = {
  getPermissions: (groupId: number, signal?: AbortSignal) => apiRequest<MenuPermission[]>(`/auth/groups/${groupId}/menus`, { signal }),
  replacePermissions: (groupId: number, permissions: MenuPermissionPayload[]) => apiRequest<MenuPermission[]>(`/auth/groups/${groupId}/menus`, {
    method: 'PUT',
    body: JSON.stringify(permissions),
  }),
};
