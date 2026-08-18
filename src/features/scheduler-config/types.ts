export type SchedulerActive = 'Y' | 'N';

export type SchedulerConfig = {
  id: number;
  serviceName: string;
  isActive: SchedulerActive;
  createdAt: string;
  updatedAt: string;
};

export type SchedulerConfigPayload = Pick<SchedulerConfig, 'serviceName' | 'isActive'>;

export type SchedulerConfigPage = {
  content: SchedulerConfig[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};

export type SchedulerConfigFilters = {
  serviceName?: string;
  isActive?: SchedulerActive | '';
  page?: number;
  size?: number;
  sort?: string;
};
