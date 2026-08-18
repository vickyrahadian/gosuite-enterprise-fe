export const SANCTION_LIST_STATUSES = ['DOWNLOAD', 'UPLOADED', 'FAILED_DOWNLOAD', 'FAILED_UPLOAD'] as const;
export type SanctionListStatus = typeof SANCTION_LIST_STATUSES[number];

export type SanctionListItem = {
  id: number;
  fileName: string;
  fileSize: number | null;
  checksum: string | null;
  downloadDate: string;
  status: SanctionListStatus;
  uploadDate: string | null;
};

export type SanctionListPage = { content: SanctionListItem[]; totalElements: number; totalPages: number; size: number; number: number; first: boolean; last: boolean; empty: boolean };
export type SanctionListFilters = { fileName?: string; checksum?: string; downloadDate?: string; uploadDate?: string; page?: number; size?: number; sort?: string };
