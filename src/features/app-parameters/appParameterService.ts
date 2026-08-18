import { apiRequest } from '../../services/api';
import type { AppParameter, AppParameterFilters, AppParameterPage, AppParameterPayload } from './types';

const APP_PARAMETERS_PATH = '/parameters/app-parameters';

function createQuery(filters: AppParameterFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  return params.toString();
}

export const appParameterService = {
  getAll: (filters: AppParameterFilters = {}, signal?: AbortSignal) =>
    apiRequest<AppParameterPage>(`${APP_PARAMETERS_PATH}?${createQuery(filters)}`, { signal }),
  getByKey: (parameterKey: string, signal?: AbortSignal) => apiRequest<AppParameter>(
    `${APP_PARAMETERS_PATH}/by-key?parameterKey=${encodeURIComponent(parameterKey.trim())}`,
    { signal },
  ),
  getById: (id: number, signal?: AbortSignal) => apiRequest<AppParameter>(`${APP_PARAMETERS_PATH}/${id}`, { signal }),
  create: (payload: AppParameterPayload) => apiRequest<AppParameter>(APP_PARAMETERS_PATH, { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: number, payload: AppParameterPayload) => apiRequest<AppParameter>(`${APP_PARAMETERS_PATH}/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (id: number) => apiRequest<void>(`${APP_PARAMETERS_PATH}/${id}`, { method: 'DELETE' }),
};
