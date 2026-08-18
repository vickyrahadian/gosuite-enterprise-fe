import { apiRequest } from '../../services/api';
import type { AuthSession, LoginCredentials } from './types';

export const authService = {
  login: (credentials: LoginCredentials) => apiRequest<AuthSession>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  logout: (refreshToken: string) => apiRequest<void>('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  }),
};
