import { apiRequest } from '../../services/api';
import type { Menu, MenuPayload } from './types';

const MENUS_PATH = '/auth/menus';

export const menuService = {
  getAll: (signal?: AbortSignal) => apiRequest<Menu[]>(MENUS_PATH, { signal }),
  getTree: (signal?: AbortSignal) => apiRequest<Menu[]>(`${MENUS_PATH}/tree`, { signal }),
  getMine: (signal?: AbortSignal) => apiRequest<Menu[]>( '/auth/me/menus', { signal }),
  getById: (id: number, signal?: AbortSignal) => apiRequest<Menu>(`${MENUS_PATH}/${id}`, { signal }),
  create: (payload: MenuPayload) => apiRequest<Menu>(MENUS_PATH, { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: number, payload: MenuPayload) => apiRequest<Menu>(`${MENUS_PATH}/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (id: number) => apiRequest<void>(`${MENUS_PATH}/${id}`, { method: 'DELETE' }),
};
