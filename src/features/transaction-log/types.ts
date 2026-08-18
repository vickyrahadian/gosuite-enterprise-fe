export type TransactionStatus = 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'REJECTED' | 'DUPLICATE';

export type TransactionTrace = {
  traceId: string;
  fileName: string;
  referenceNumber: string | null;
  uetr: string | null;
  messageType: string | null;
  direction: string;
  latestProcess: string;
  currentPosition: string;
  currentFileLocation: string;
  currentFilePath: string | null;
  fileExistenceStatus: string;
  status: TransactionStatus;
  receivedAt: string;
  updatedAt: string;
};

export type TransactionTraceEvent = {
  id: number;
  stage: string;
  process: string;
  status: string;
  positionFrom: string | null;
  positionTo: string | null;
  sourceFileLocation: string | null;
  sourceFilePath: string | null;
  destinationFileLocation: string | null;
  destinationFilePath: string | null;
  errorMessage: string | null;
  occurredAt: string;
};

export type TransactionTraceDetail = {
  transaction: TransactionTrace;
  timeline: TransactionTraceEvent[];
};

export type TransactionTracePage = {
  content: TransactionTrace[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
  pageable?: { pageNumber: number; pageSize: number };
};

export type TransactionTraceFilters = {
  fileName?: string;
  referenceNumber?: string;
  messageType?: string;
  direction?: string;
  currentPosition?: string;
  status?: string;
  receivedFrom?: string;
  receivedTo?: string;
  page?: number;
  size?: number;
};
