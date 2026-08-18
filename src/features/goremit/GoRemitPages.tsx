import { GoRemitReportPage } from './GoRemitReportPage';

const itrToOtrFilters = [
  { key: 'incomingReference', label: 'Incoming Reference' },
  { key: 'outgoingReference', label: 'Outgoing Reference' },
  { key: 'correspondentReference', label: 'Correspondent Reference' },
  { key: 'senderBic', label: 'Sender BIC' },
  { key: 'receiver1', label: 'Receiver' },
  { key: 'amount', label: 'Amount', type: 'number' as const },
  { key: 'orderingName', label: 'Ordering Name' },
  { key: 'beneficiaryName', label: 'Beneficiary Name' },
  { key: 'accountWithInstitutionName', label: 'Account With Institution Name' },
];

const otrFilters = [
  { key: 'reference', label: 'Reference' },
  { key: 'amount', label: 'Amount', type: 'number' as const },
  { key: 'orderingName', label: 'Ordering Name' },
  { key: 'beneficiaryName', label: 'Beneficiary Name' },
  { key: 'bankName', label: 'Bank Name' },
];

const otrDirectFilters = [
  { key: 'reference', label: 'Reference' },
  { key: 'amountSettle', label: 'Settlement Amount', type: 'number' as const },
  { key: 'orderingCustomer', label: 'Ordering Customer' },
  { key: 'beneficiaryName', label: 'Beneficiary Name' },
  { key: 'accountWithInstitutionName', label: 'Account With Institution Name' },
];

export const GoRemitItrToOtrPage = () => <GoRemitReportPage report="itr-to-otr" title="ITR to OTR" filterFields={itrToOtrFilters} />;
export const GoRemitOtrPage = () => <GoRemitReportPage report="otr" title="OTR Non-SWIFT" filterFields={otrFilters} />;
export const GoRemitOtrDirectPage = () => <GoRemitReportPage report="otr-direct" title="OTR Direct" filterFields={otrDirectFilters} />;
