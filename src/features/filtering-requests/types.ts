export type YesNo = 'Y' | 'N';

export type FilteringRequestView = {
  filteringRequestId: number;
  swiftMasterId: number;
  messageKey: string | null;
  reference: string | null;
  mtype: string | null;
  direction: string | null;
  sender: string | null;
  receiver: string | null;
  status: string | null;
  score: number | null;
  hasHit: YesNo | null;
  createdAt: string;
};

export type FilteringRequestDetail = Record<string, unknown> & { id: number; swiftMasterId: number };
export type FilteringApiLog = {
  id: number;
  filteringRequestId: number;
  requestBody: string | null;
  responseBody: string | null;
  httpStatus: number | null;
  errorMessage: string | null;
  durationMs: number | null;
  createdAt: string;
};
export type FilteringRequestPage = { content: FilteringRequestView[]; totalElements: number; totalPages: number; size: number; number: number; first: boolean; last: boolean; empty: boolean };
export type FilteringRequestFilters = { reference?: string; mtype?: string; direction?: string; sender?: string; receiver?: string; status?: string; score?: number; hasHit?: YesNo; page?: number; size?: number; sort?: string };
