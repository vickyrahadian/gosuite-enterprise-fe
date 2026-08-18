import { apiRequest } from '../../services/api';
import type { GoRemitResponse } from './types';

export type GoRemitReport = 'itr-to-otr' | 'otr' | 'otr-direct';
export type GoRemitFilters = Record<string, string>;

export const goRemitService = {
  getReport: (report: GoRemitReport, filters: GoRemitFilters, signal?: AbortSignal) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '') params.set(key, value);
    });
    return apiRequest<GoRemitResponse>(`/temp/goremit/${report}?${params}`, { signal });
  },
};
