export type AppParameter = {
  id: number;
  parameterKey: string;
  parameterValue: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AppParameterPayload = Pick<AppParameter, 'parameterKey' | 'parameterValue'>;

export type AppParameterPage = {
  content: AppParameter[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};

export type AppParameterFilters = {
  parameterKey?: string;
  page?: number;
  size?: number;
  sort?: string;
};
