import { apiRequest } from '../../services/api';
import type { SftpLogDetail, SftpLogPage } from './types';

const SFTP_LOG_PATH = '/sftp/audit-logs';

export const sftpLogService = {
  getAll: (page: number, size: number, signal?: AbortSignal) =>
    apiRequest<SftpLogPage>(`${SFTP_LOG_PATH}?page=${page}&size=${size}`, { signal }),
  getById: (id: number, signal?: AbortSignal) =>
    apiRequest<SftpLogDetail>(`${SFTP_LOG_PATH}/${id}`, { signal }),
};
