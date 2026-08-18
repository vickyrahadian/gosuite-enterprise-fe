import { apiRequest } from '../../services/api';
import type { AuthUser } from '../auth/types';

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export const profileService = {
  getCurrentUser: (signal?: AbortSignal) => apiRequest<AuthUser>('/auth/me', { signal }),
  changePassword: (payload: ChangePasswordPayload) => apiRequest<void>('/auth/me/password', {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
};
