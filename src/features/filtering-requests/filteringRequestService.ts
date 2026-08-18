import { apiRequest } from '../../services/api';
import type { FilteringApiLog, FilteringRequestDetail, FilteringRequestFilters, FilteringRequestPage, FilteringRequestView } from './types';

const FILTERING_REQUEST_PATH = '/filtering/requests';

function createQuery(filters: FilteringRequestFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== '') params.set(key, String(value)); });
  return params.toString();
}

export const filteringRequestService = {
  getAll: (filters: FilteringRequestFilters = {}, signal?: AbortSignal) => apiRequest<FilteringRequestPage>(`${FILTERING_REQUEST_PATH}?${createQuery(filters)}`, { signal }),
  getById: (id: number, signal?: AbortSignal) => apiRequest<FilteringRequestView>(`${FILTERING_REQUEST_PATH}/${id}`, { signal }),
  getDetail: (id: number, signal?: AbortSignal) => apiRequest<FilteringRequestDetail>(`${FILTERING_REQUEST_PATH}/${id}/detail`, { signal }),
  getApiLogs: (id: number, signal?: AbortSignal) => apiRequest<FilteringApiLog[]>(`${FILTERING_REQUEST_PATH}/${id}/api-logs`, { signal }),
};
