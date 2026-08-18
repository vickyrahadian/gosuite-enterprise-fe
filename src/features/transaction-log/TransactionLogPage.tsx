import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { DataTable, DEFAULT_PAGE_SIZE, type DataTableColumn } from '../../components/DataTable';
import { IconButton } from '../../components/IconButton';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { ApiRequestError } from '../../services/api';
import { messageService } from '../messages/messageService';
import { TransactionLogDetailModal } from './TransactionLogDetailModal';
import { transactionLogService } from './transactionLogService';
import type { TransactionTrace, TransactionTraceDetail } from './types';

type FilterForm = { fileName: string; referenceNumber: string; messageType: string; direction: string; currentPosition: string; status: string; receivedFrom: string; receivedTo: string };
const emptyFilters: FilterForm = { fileName: '', referenceNumber: '', messageType: '', direction: '', currentPosition: '', status: '', receivedFrom: '', receivedTo: '' };
const toLocalDateTimeInput = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};
const getDefaultFilters = (): FilterForm => {
  const now = new Date();
  return {
    ...emptyFilters,
    receivedFrom: toLocalDateTimeInput(new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)),
    receivedTo: toLocalDateTimeInput(new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)),
  };
};
const transactionPositions = [
  'SFTP_SOURCE',
  'INTEGRATOR_LANDING',
  'INTEGRATOR_PROCESSING',
  'INTEGRATOR_STAGING',
  'ACTIMIZE',
  'INTEGRATOR_RELEASE',
  'INTEGRATOR_ERROR',
];
const transactionDirections = ['INCOMING', 'OUTGOING'];
const transactionStatuses = ['IN_PROGRESS', 'COMPLETED', 'FAILED', 'REJECTED', 'DUPLICATE'];
const label = (value: string) => value.replaceAll('_', ' ');
const display = (value: string | null) => value || '\u2014';
const formatDate = (value: string) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date); };
const toApiDateTime = (value: string) => value && value.length === 16 ? value + ':00' : value;
const getErrorMessage = (error: unknown) => error instanceof ApiRequestError ? error.message : 'Unable to connect to the backend. Check the API address and server connection.';

export function TransactionLogPage() {
  useDocumentTitle('Transaction Tracking Log | BNI');
  const [form, setForm] = useState<FilterForm>(getDefaultFilters);
  const [activeFilters, setActiveFilters] = useState<FilterForm>(() => {
    const defaults = getDefaultFilters();
    return { ...defaults, receivedFrom: toApiDateTime(defaults.receivedFrom), receivedTo: toApiDateTime(defaults.receivedTo) };
  });
  const [items, setItems] = useState<TransactionTrace[]>([]);
  const [messageTypes, setMessageTypes] = useState<string[]>(['ACK']);
  const [isLoadingMessageTypes, setIsLoadingMessageTypes] = useState(true);
  const [messageTypesError, setMessageTypesError] = useState(false);
  const [page, setPage] = useState(0); const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0); const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null); const [detail, setDetail] = useState<TransactionTraceDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false); const [detailError, setDetailError] = useState<string | null>(null);

  const loadItems = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true); setError(null);
    try {
      const result = await transactionLogService.getAll({ ...activeFilters, page, size }, signal);
      setItems(result.content); setPage(result.pageable?.pageNumber ?? result.number); setSize(result.pageable?.pageSize ?? result.size); setTotalElements(result.totalElements); setTotalPages(result.totalPages);
    } catch (requestError) { if (!(requestError instanceof DOMException && requestError.name === 'AbortError')) setError(getErrorMessage(requestError)); }
    finally { if (!signal?.aborted) setIsLoading(false); }
  }, [activeFilters, page, size]);
  useEffect(() => { const controller = new AbortController(); void loadItems(controller.signal); return () => controller.abort(); }, [loadItems]);
  useEffect(() => {
    const controller = new AbortController();
    void messageService.getTypes(controller.signal)
      .then((types) => setMessageTypes([...new Set([...types, 'ACK'])].sort((left, right) => left.localeCompare(right))))
      .catch((requestError: unknown) => {
        if (!(requestError instanceof DOMException && requestError.name === 'AbortError')) setMessageTypesError(true);
      })
      .finally(() => { if (!controller.signal.aborted) setIsLoadingMessageTypes(false); });
    return () => controller.abort();
  }, []);

  const openDetail = async (traceId: string) => {
    setSelectedId(traceId); setDetail(null); setDetailError(null); setIsDetailLoading(true);
    try { setDetail(await transactionLogService.getById(traceId)); } catch (requestError) { setDetailError(getErrorMessage(requestError)); } finally { setIsDetailLoading(false); }
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (form.receivedFrom && form.receivedTo && form.receivedFrom > form.receivedTo) {
      setError('Received from must be earlier than or equal to Received to.');
      return;
    }
    setError(null);
    setActiveFilters({ ...form, receivedFrom: toApiDateTime(form.receivedFrom), receivedTo: toApiDateTime(form.receivedTo) });
    setPage(0);
  };
  const clear = () => { setForm(emptyFilters); setActiveFilters(emptyFilters); setError(null); setPage(0); };
  const update = (field: keyof FilterForm, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const columns: DataTableColumn<TransactionTrace>[] = [
    { key: 'referenceNumber', header: 'Reference Number', render: (item) => display(item.referenceNumber) },
    { key: 'messageType', header: 'Message Type', render: (item) => display(item.messageType) },
    { key: 'direction', header: 'Direction', render: (item) => item.direction ? label(item.direction) : '\u2014' },
    { key: 'latestProcess', header: 'Latest Process', render: (item) => label(item.latestProcess) },
    { key: 'position', header: 'Current Position', render: (item) => label(item.currentPosition) },
    { key: 'location', header: 'File Location', render: (item) => <span title={item.currentFilePath ?? undefined}>{label(item.currentFileLocation)}</span> },
    { key: 'existence', header: 'File Status', render: (item) => label(item.fileExistenceStatus) },
    { key: 'status', header: 'Status', render: (item) => <span className={`transaction-log-status transaction-log-status--${item.status.toLowerCase().replaceAll('_', '-')}`}>{label(item.status)}</span> },
    { key: 'receivedAt', header: 'Received At', render: (item) => formatDate(item.receivedAt) },
    { key: 'updatedAt', header: 'Last Updated', render: (item) => formatDate(item.updatedAt) },
    { key: 'actions', header: 'Actions', align: 'right', render: (item) => <IconButton label={`View timeline for ${item.fileName}`} type="button" onClick={() => void openDetail(item.traceId)} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></svg>} /> },
  ];

  return <div className="crud-page transaction-log-page">
    <header className="page-header"><p>Transaction Tracking</p><h1>Transaction Tracking Log</h1></header>
    <section className="management-card" aria-labelledby="transaction-filter-title"><div className="section-heading"><h2 id="transaction-filter-title">Filter Transactions</h2></div>
      <form className="transaction-log-filter-grid" onSubmit={submit}>
        <div className="transaction-log-filter-fields">
          <div className="form-field"><label htmlFor="transaction-file-name">File name</label><input id="transaction-file-name" value={form.fileName} onChange={(event) => update('fileName', event.target.value)} /></div>
          <div className="form-field"><label htmlFor="transaction-reference">Reference number</label><input id="transaction-reference" value={form.referenceNumber} onChange={(event) => update('referenceNumber', event.target.value)} /></div>
          <div className="form-field"><label htmlFor="transaction-message-type">Message type</label><select id="transaction-message-type" value={form.messageType} onChange={(event) => update('messageType', event.target.value)} disabled={isLoadingMessageTypes}><option value="">{isLoadingMessageTypes ? 'Loading message types...' : 'All message types'}</option>{messageTypes.map((messageType) => <option key={messageType} value={messageType}>{messageType}</option>)}</select>{messageTypesError && <small className="form-field-error">Unable to load all message types. ACK remains available.</small>}</div>
          <div className="form-field"><label htmlFor="transaction-direction">Direction</label><select id="transaction-direction" value={form.direction} onChange={(event) => update('direction', event.target.value)}><option value="">All directions</option>{transactionDirections.map((direction) => <option key={direction} value={direction}>{label(direction)}</option>)}</select></div>
          <div className="form-field"><label htmlFor="transaction-position">Current position</label><select id="transaction-position" value={form.currentPosition} onChange={(event) => update('currentPosition', event.target.value)}><option value="">All positions</option>{transactionPositions.map((position) => <option key={position} value={position}>{label(position)}</option>)}</select></div>
          <div className="form-field"><label htmlFor="transaction-status">Status</label><select id="transaction-status" value={form.status} onChange={(event) => update('status', event.target.value)}><option value="">All statuses</option>{transactionStatuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}</select></div>
          <div className="form-field"><label htmlFor="transaction-received-from">Received from</label><input id="transaction-received-from" type="datetime-local" step="1" value={form.receivedFrom} onChange={(event) => update('receivedFrom', event.target.value)} /></div>
          <div className="form-field"><label htmlFor="transaction-received-to">Received to</label><input id="transaction-received-to" type="datetime-local" step="1" value={form.receivedTo} onChange={(event) => update('receivedTo', event.target.value)} /></div>
        </div>
        <div className="transaction-log-filter-actions">
          <IconButton className="icon-button--primary search-form__icon-button" label="Apply transaction filters" type="submit" disabled={isLoading} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 4.5 4.5"/></svg>} />
          <IconButton className="search-form__icon-button" label="Clear transaction filters" type="button" onClick={clear} disabled={isLoading && !Object.values(form).some(Boolean)} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m4 15 8-9 7 6-7 8H8l-4-3Z"/><path d="m9 12 6 5M12 20h8"/></svg>} />
        </div>
      </form>
    </section>
    <section className="management-card" aria-labelledby="transaction-list-title"><div className="section-heading"><h2 id="transaction-list-title">Transactions</h2><div className="section-heading__actions"><span>{totalElements} {totalElements === 1 ? 'transaction' : 'transactions'}</span><IconButton label="Refresh transaction logs" type="button" onClick={() => void loadItems()} disabled={isLoading} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 7v5h-5"/><path d="M18.2 16a8 8 0 1 1 .8-9l1 5"/></svg>}/></div></div>
      {error && <p className="inline-error" role="alert">{error}</p>}
      <DataTable rows={items} columns={columns} getRowKey={(item) => item.traceId} ariaLabel="Transaction tracking log" isLoading={isLoading} loadingMessage="Loading transactions..." emptyMessage="No transactions found." serverPagination={{ currentPage: page + 1, totalPages, totalRows: totalElements, pageSize: size, onPageChange: (next) => setPage(next - 1), onPageSizeChange: (next) => { setSize(next); setPage(0); } }}/>
    </section>
    {selectedId && <TransactionLogDetailModal detail={detail} isLoading={isDetailLoading} error={detailError} onClose={() => { setSelectedId(null); setDetail(null); setDetailError(null); }}/>} 
  </div>;
}
