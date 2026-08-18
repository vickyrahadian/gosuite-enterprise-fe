import { apiRequest } from '../../services/api';
import type { SanctionListFilters, SanctionListItem, SanctionListPage } from './types';

const SANCTION_LIST_PATH = '/sanction-lists';

function createQuery(filters: SanctionListFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== '') params.set(key, String(value)); });
  return params.toString();
}

export const sanctionListService = {
  getAll: (filters: SanctionListFilters = {}, signal?: AbortSignal) => apiRequest<SanctionListPage>(`${SANCTION_LIST_PATH}?${createQuery(filters)}`, { signal }),
  getById: (id: number, signal?: AbortSignal) => apiRequest<SanctionListItem>(`${SANCTION_LIST_PATH}/${id}`, { signal }),
  execute: () => apiRequest<void>(`${SANCTION_LIST_PATH}/execute`, { method: 'POST' }),
};
