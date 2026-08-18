export type BankCorrespondent = {
  id: number;
  bicCode: string;
  bicName: string | null;
  address1: string | null;
  address2: string | null;
  address3: string | null;
  city: string | null;
  country: string | null;
  accountNumber: string | null;
};

export type BankCorrespondentPayload = Omit<BankCorrespondent, 'id'>;

export type BankCorrespondentPage = {
  content: BankCorrespondent[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};

export type BankCorrespondentFilters = {
  bic?: string;
  name?: string;
  page?: number;
  size?: number;
  sort?: string;
};
