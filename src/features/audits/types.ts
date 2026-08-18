export type AuditOperation = 'ADD' | 'EDIT' | 'DELETE';

export type AuditLog = {
  id: number;
  tableName: string;
  recordKey: string;
  operation: AuditOperation;
  changedAt: string;
  actorUserId: number;
  actorUsername: string;
  oldData: string | null;
  newData: string | null;
  requestId: string | null;
  ipAddress: string | null;
};

export type AuditPage = {
  content: AuditLog[];
  pageable: { pageNumber: number; pageSize: number };
  totalElements: number;
  totalPages: number;
  last: boolean;
};

export type AuditFilters = {
  tableName?: string;
  recordKey?: string;
  operation?: AuditOperation;
  actorUsername?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
};
