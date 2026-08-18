import { apiRequest } from '../../services/api';
import type { SftpConfig, SftpConfigFilters, SftpConfigPage, SftpConfigPayload } from './types';

const SFTP_CONFIG_PATH = '/sftp/configs';

function createQuery(filters: SftpConfigFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== '') params.set(key, String(value)); });
  return params.toString();
}

export const sftpConfigService = {
  getAll: (filters: SftpConfigFilters = {}, signal?: AbortSignal) => apiRequest<SftpConfigPage>(`${SFTP_CONFIG_PATH}?${createQuery(filters)}`, { signal }),
  getById: (id: number, signal?: AbortSignal) => apiRequest<SftpConfig>(`${SFTP_CONFIG_PATH}/${id}`, { signal }),
  create: (payload: SftpConfigPayload) => apiRequest<SftpConfig>(SFTP_CONFIG_PATH, { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: number, payload: SftpConfigPayload) => apiRequest<SftpConfig>(`${SFTP_CONFIG_PATH}/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (id: number) => apiRequest<void>(`${SFTP_CONFIG_PATH}/${id}`, { method: 'DELETE' }),
};
