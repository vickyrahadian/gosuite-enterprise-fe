import { apiRequest } from '../../services/api';
import type { CreateUserPayload, UpdateUserPayload, User } from './types';

const USERS_PATH = '/auth/users';

export const userService = {
  getAll: (signal?: AbortSignal) => apiRequest<User[]>(USERS_PATH, { signal }),
  create: (payload: CreateUserPayload) => apiRequest<User>(USERS_PATH, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  update: (id: number, payload: UpdateUserPayload) => apiRequest<User>(`${USERS_PATH}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  remove: (id: number) => apiRequest<void>(`${USERS_PATH}/${id}`, { method: 'DELETE' }),
};
