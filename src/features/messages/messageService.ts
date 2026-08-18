import { apiRequest } from '../../services/api';
import type { SwiftMessage, SwiftMessageDetail, SwiftMessageFilters, SwiftMessagePage } from './types';

function createQuery(filters: SwiftMessageFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  return params.toString();
}

export const messageService = {
  getAll: (filters: SwiftMessageFilters = {}, signal?: AbortSignal) =>
    apiRequest<SwiftMessagePage>(`/swift/messages?${createQuery(filters)}`, { signal }),
  exportAll: (filters: SwiftMessageFilters = {}, signal?: AbortSignal) =>
    apiRequest<SwiftMessage[]>(`/swift/messages/export?${createQuery(filters)}`, { signal }),
  getTypes: (signal?: AbortSignal) =>
    apiRequest<string[]>('/swift/messages/types', { signal }),
  getById: (id: number, signal?: AbortSignal) =>
    apiRequest<SwiftMessageDetail>(`/swift/messages/${id}`, { signal }),
};
