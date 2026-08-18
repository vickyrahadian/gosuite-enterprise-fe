export type SftpTransferStatus = 'SUCCESS' | 'FAILED' | 'SKIPPED';
export type SftpTransferDirection = 'DOWNLOAD' | 'UPLOAD';
export type SftpEndpointType = 'SFTP' | 'LOCAL';

export type SftpLogMaster = {
  id: number;
  fileName: string;
  fileHash: string | null;
  latestStatus: SftpTransferStatus;
  latestDirection: SftpTransferDirection;
  latestTransferredAt: string | null;
  transferCount: number;
};

export type SftpLogPage = {
  content: SftpLogMaster[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

export type SftpTransferEndpoint = {
  type: SftpEndpointType;
  host: string | null;
  port: number | null;
  path: string;
};

export type SftpLogConfig = {
  id: number;
  name: string;
  host: string;
  port: number;
  username: string;
  direction: SftpTransferDirection;
  remotePath: string;
  localPath: string;
  isActive: 'Y' | 'N';
};

export type SftpTransfer = {
  id: number;
  batchId: string;
  direction: SftpTransferDirection;
  status: SftpTransferStatus;
  errorMessage: string | null;
  transferredAt: string | null;
  source: SftpTransferEndpoint;
  destination: SftpTransferEndpoint;
  sftpConfig: SftpLogConfig;
};

export type SftpLogDetail = {
  masterId: number;
  fileName: string;
  fileHash: string | null;
  transfers: SftpTransfer[];
};
