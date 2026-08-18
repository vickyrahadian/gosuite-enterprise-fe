import { apiRequest } from '../../services/api';
import type { MessageConversionDetail, MessageConversionFilters, MessageConversionPage } from './types';

const MESSAGE_CONVERSION_PATH = '/message-conversions';

export const messageConversionService = {
  getAll: (filters: MessageConversionFilters, signal?: AbortSignal) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params.set(key, String(value));
    });
    params.set('sort', 'createdAt,desc');
    return apiRequest<MessageConversionPage>(`${MESSAGE_CONVERSION_PATH}?${params}`, { signal });
  },
  getById: (id: number, signal?: AbortSignal) =>
    apiRequest<MessageConversionDetail>(`${MESSAGE_CONVERSION_PATH}/${id}`, { signal }),
};
