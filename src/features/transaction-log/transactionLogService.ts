import { apiRequest } from '../../services/api';
import type { TransactionTraceDetail, TransactionTraceFilters, TransactionTracePage } from './types';

const TRANSACTION_LOG_PATH = '/transaction-logs';

export const transactionLogService = {
  getAll: (filters: TransactionTraceFilters, signal?: AbortSignal) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params.set(key, String(value));
    });
    // Keep the API's documented default order deterministic when timestamps match.
    params.append('sort', 'receivedAt,desc');
    params.append('sort', 'id,desc');
    return apiRequest<TransactionTracePage>(`${TRANSACTION_LOG_PATH}?${params}`, { signal });
  },
  getById: (traceId: string, signal?: AbortSignal) =>
    apiRequest<TransactionTraceDetail>(`${TRANSACTION_LOG_PATH}/${encodeURIComponent(traceId)}`, { signal }),
};
