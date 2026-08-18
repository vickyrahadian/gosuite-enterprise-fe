import { apiRequest } from '../../services/api';
import type { BankCorrespondent, BankCorrespondentFilters, BankCorrespondentPage, BankCorrespondentPayload } from './types';

const CORRESPONDENTS_PATH = '/parameters/bank-correspondents';

function createQuery(filters: BankCorrespondentFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  return params.toString();
}

export const correspondentService = {
  getAll: (filters: BankCorrespondentFilters = {}, signal?: AbortSignal) =>
    apiRequest<BankCorrespondentPage>(`${CORRESPONDENTS_PATH}?${createQuery(filters)}`, { signal }),
  getById: (id: number, signal?: AbortSignal) =>
    apiRequest<BankCorrespondent>(`${CORRESPONDENTS_PATH}/${id}`, { signal }),
  create: (payload: BankCorrespondentPayload) => apiRequest<BankCorrespondent>(CORRESPONDENTS_PATH, {
    method: 'POST', body: JSON.stringify(payload),
  }),
  update: (id: number, payload: BankCorrespondentPayload) => apiRequest<BankCorrespondent>(`${CORRESPONDENTS_PATH}/${id}`, {
    method: 'PUT', body: JSON.stringify(payload),
  }),
  remove: (id: number) => apiRequest<void>(`${CORRESPONDENTS_PATH}/${id}`, { method: 'DELETE' }),
};
