export const SWIFT_STATUSES = ['PROCESSED', 'FAILED', 'FILTER', 'RELEASED', 'HIT', 'FAILED_FILTERING', 'FAILED_INQUIRY', 'REJECTED', 'RETRY_EXHAUSTED'] as const;
export type SwiftStatus = typeof SWIFT_STATUSES[number];

export const SWIFT_FILTER_DIRECTIONS = ['INCOMING', 'OUTGOING'] as const;
export type SwiftFilterDirection = typeof SWIFT_FILTER_DIRECTIONS[number];

export const SWIFT_SORT_FIELDS = ['createdAt', 'updatedAt', 'id', 'fileName', 'mtype', 'sender', 'receiver', 'status'] as const;
export type SwiftSortField = typeof SWIFT_SORT_FIELDS[number];
export type SortDirection = 'ASC' | 'DESC';

export type SwiftMessage = {
  id: number;
  batchId: string | null;
  fileName: string;
  direction: string | null;
  mtype: string | null;
  sender: string | null;
  receiver: string | null;
  uetr: string | null;
  referenceNumber: string | null;
  messageContent: string | null;
  status: SwiftStatus;
  isCov: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SwiftMessageDetail = Omit<SwiftMessage, 'messageContent'> & {
  content: string | null;
  errorMessage: string | null;
  counter: number;
  retryCounter: number;
};

export type SwiftMessagePage = {
  content: SwiftMessage[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

export type SwiftMessageFilters = {
  fileName?: string;
  referenceNumber?: string;
  direction?: SwiftFilterDirection;
  mtype?: string;
  sender?: string;
  receiver?: string;
  uetr?: string;
  status?: SwiftStatus;
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  size?: number;
  sortBy?: SwiftSortField;
  sortDirection?: SortDirection;
};
