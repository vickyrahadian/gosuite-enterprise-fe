export type MessageConversionStatus =
  | 'DISCOVERED'
  | 'CLAIMED'
  | 'VALIDATED'
  | 'CONVERTED'
  | 'OUTPUT_PUBLISHED'
  | 'ARCHIVED'
  | 'FAILED_VALIDATION'
  | 'FAILED_CONVERSION'
  | 'FAILED_OUTPUT'
  | 'FAILED_ARCHIVE';

export const MESSAGE_CONVERSION_TYPES = [
  'PACS008_TO_MT103',
  'PACS009_TO_MT202',
  'PACS009_COV_TO_MT202_COV',
] as const;

export type MessageConversionType = typeof MESSAGE_CONVERSION_TYPES[number];

export type MessageConversion = {
  id: number;
  conversionType: MessageConversionType;
  status: MessageConversionStatus;
  transactionReference: string | null;
  uetr: string | null;
  settlementDate: string | null;
  currency: string | null;
  senderBic: string | null;
  receiverBic: string | null;
  sourceFileName: string;
  sourceChecksum: string;
  outputFileName: string | null;
  outputChecksum: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ConversionFile = {
  fileName: string;
  inputPath: string | null;
  archivePath: string | null;
  outputPath: string | null;
  extension: string | null;
  contentType: string | null;
  size: number | null;
  checksum: string | null;
  createdAt: string | null;
  modifiedAt: string | null;
  content: string;
};

export type MessageConversionDetail = Omit<MessageConversion, 'sourceFileName' | 'sourceChecksum' | 'outputFileName' | 'outputChecksum'> & {
  sourceFile: ConversionFile;
  outputFile: ConversionFile | null;
};

export type MessageConversionPage = {
  content: MessageConversion[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};

export type MessageConversionFilters = {
  conversionType?: MessageConversionType;
  fileName?: string;
  status?: string;
  transactionReference?: string;
  uetr?: string;
  currency?: string;
  senderBic?: string;
  receiverBic?: string;
  settlementDateFrom?: string;
  settlementDateTo?: string;
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  size?: number;
};
