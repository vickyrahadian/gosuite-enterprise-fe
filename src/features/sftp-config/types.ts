export type SftpAuthType = 'PASSWORD' | 'KEY';
export type SftpDirection = 'DOWNLOAD' | 'UPLOAD';
export type YesNo = 'Y' | 'N';

export type SftpConfig = {
  id: number;
  name: string;
  host: string;
  port: number;
  authType: SftpAuthType;
  username: string;
  passwordConfigured: boolean;
  keyLocation: string | null;
  direction: SftpDirection;
  remotePath: string;
  localPath: string;
  fileRegex: string | null;
  archiveEnabled: YesNo;
  maxFiles: number;
  isActive: YesNo;
  createdAt: string;
  updatedAt: string;
};

export type SftpConfigPayload = Omit<SftpConfig, 'id' | 'passwordConfigured' | 'createdAt' | 'updatedAt'> & { password: string | null };

export type SftpConfigPage = {
  content: SftpConfig[]; totalElements: number; totalPages: number; size: number; number: number;
  first: boolean; last: boolean; empty: boolean;
};

export type SftpConfigFilters = { name?: string; page?: number; size?: number; sort?: string };
