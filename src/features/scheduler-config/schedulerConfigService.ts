import { apiRequest } from '../../services/api';
import type { SchedulerConfig, SchedulerConfigFilters, SchedulerConfigPage, SchedulerConfigPayload } from './types';

const SCHEDULER_CONFIG_PATH = '/scheduler/configs';

function createQuery(filters: SchedulerConfigFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  return params.toString();
}

export const schedulerConfigService = {
  getAll: (filters: SchedulerConfigFilters = {}, signal?: AbortSignal) =>
    apiRequest<SchedulerConfigPage>(`${SCHEDULER_CONFIG_PATH}?${createQuery(filters)}`, { signal }),
  getById: (id: number, signal?: AbortSignal) => apiRequest<SchedulerConfig>(`${SCHEDULER_CONFIG_PATH}/${id}`, { signal }),
  create: (payload: SchedulerConfigPayload) => apiRequest<SchedulerConfig>(SCHEDULER_CONFIG_PATH, { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: number, payload: SchedulerConfigPayload) => apiRequest<SchedulerConfig>(`${SCHEDULER_CONFIG_PATH}/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (id: number) => apiRequest<void>(`${SCHEDULER_CONFIG_PATH}/${id}`, { method: 'DELETE' }),
};
