import { apiRequest } from '../../services/api';
import type { AuditFilters, AuditPage } from './types';

export const auditService = {
  getAll: (filters: AuditFilters = {}, signal?: AbortSignal) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params.set(key, String(value));
    });
    const query = params.toString();
    return apiRequest<AuditPage>(`/auth/audits${query ? `?${query}` : ''}`, { signal });
  },
};
