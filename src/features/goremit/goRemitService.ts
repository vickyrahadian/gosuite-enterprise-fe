import { apiRequest } from '../../services/api';
import type { GoRemitResponse } from './types';

export type GoRemitReport = 'itr-to-otr' | 'otr' | 'otr-direct';

export const goRemitService = {
  getReport: (report: GoRemitReport, start: string, end: string, signal?: AbortSignal) => {
    const params = new URLSearchParams({ start, end });
    return apiRequest<GoRemitResponse>(`/temp/goremit/${report}?${params}`, { signal });
  },
};

