import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { DataTable, DEFAULT_PAGE_SIZE, type DataTableColumn } from '../../components/DataTable';
import { IconButton } from '../../components/IconButton';
import { CollapsibleMessageContent } from '../../components/CollapsibleMessageContent';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { ApiRequestError } from '../../services/api';
import { messageService } from './messageService';
import { CorrespondentPickerModal } from './CorrespondentPickerModal';
import { SWIFT_FILTER_DIRECTIONS, SWIFT_SORT_FIELDS, SWIFT_STATUSES, type SortDirection, type SwiftFilterDirection, type SwiftMessage, type SwiftMessageDetail, type SwiftMessageFilters, type SwiftSortField, type SwiftStatus } from './types';

type FilterForm = {
  fileName: string; referenceNumber: string; direction: '' | SwiftFilterDirection; mtype: string; sender: string; receiver: string;
  uetr: string; status: '' | SwiftStatus; createdFrom: string; createdTo: string;
  sortBy: SwiftSortField; sortDirection: SortDirection;
};

const sortLabels: Record<SwiftSortField, string> = {
  createdAt: 'Created at', updatedAt: 'Updated at', id: 'ID', fileName: 'File name',
  mtype: 'Message type', sender: 'Sender', receiver: 'Receiver', status: 'Status',
};

function getErrorMessage(error: unknown) {
  return error instanceof ApiRequestError ? error.message : 'Unable to connect to the backend. Check the API address and server connection.';
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function toApiDate(value: string) {
  return value ? `${value}:00` : undefined;
}

function toDateTimeLocalValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function createDefaultFilters(): FilterForm {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59);
  return {
    fileName: '', referenceNumber: '', direction: '', mtype: '', sender: '', receiver: '', uetr: '', status: '',
    createdFrom: toDateTimeLocalValue(monthStart), createdTo: toDateTimeLocalValue(monthEnd), sortBy: 'createdAt', sortDirection: 'DESC',
  };
}

function getExportDateError(filters: FilterForm) {
  if (!filters.createdFrom || !filters.createdTo) return 'A date range within one calendar year is required for CSV download.';
  const createdFrom = new Date(filters.createdFrom);
  const createdTo = new Date(filters.createdTo);
  if (Number.isNaN(createdFrom.getTime()) || Number.isNaN(createdTo.getTime())) return 'The download date range is invalid.';
  if (createdFrom > createdTo) return 'Created from must be before or equal to created to.';
  if (createdFrom.getFullYear() !== createdTo.getFullYear()) return 'CSV download cannot use a date range across different years.';
  return null;
}

function csvValue(value: unknown) {
  if (value === null || value === undefined) return '';
  return `"${String(value).replaceAll('"', '""')}"`;
}

function messagesToCsv(messages: SwiftMessage[]) {
  const headers = ['ID', 'Batch ID', 'File Name', 'Direction', 'Message Type', 'Sender', 'Receiver', 'UETR', 'Reference Number', 'Message Content', 'Status', 'Is COV', 'Created At', 'Updated At'];
  const rows = messages.map((message) => [
    message.id,
    message.batchId,
    message.fileName,
    message.direction,
    message.mtype,
    message.sender,
    message.receiver,
    message.uetr,
    message.referenceNumber,
    message.messageContent,
    message.status,
    message.isCov ? 'Yes' : 'No',
    message.createdAt,
    message.updatedAt,
  ]);
  return [headers.map(csvValue).join(','), ...rows.map((row) => row.map(csvValue).join(','))].join('\r\n');
}

function DetailModal({ detail, isLoading, error, onClose }: { detail: SwiftMessageDetail | null; isLoading: boolean; error: string | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => { if (dialog?.open) dialog.close(); };
  }, []);
  return (
    <dialog ref={ref} className="message-detail-modal" aria-labelledby="message-detail-title" onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <div className="form-modal__header"><h2 id="message-detail-title">Message Detail</h2><button className="form-modal__close" type="button" aria-label="Close" onClick={onClose}>&times;</button></div>
      <div className="message-detail-modal__body">
        {isLoading && <p>Loading message detail...</p>}
        {error && <p className="inline-error" role="alert">{error}</p>}
        {detail && <>
          <dl className="message-detail-grid">
            <div><dt>ID</dt><dd>{detail.id}</dd></div><div><dt>Batch ID</dt><dd>{detail.batchId || '—'}</dd></div>
            <div><dt>File name</dt><dd>{detail.fileName}</dd></div><div><dt>Direction</dt><dd>{detail.direction || '—'}</dd></div>
            <div><dt>Message type</dt><dd>{detail.mtype || '—'}</dd></div><div><dt>Status</dt><dd>{detail.status}</dd></div>
            <div><dt>Sender</dt><dd>{detail.sender || '—'}</dd></div><div><dt>Receiver</dt><dd>{detail.receiver || '—'}</dd></div>
            <div><dt>Reference number</dt><dd>{detail.referenceNumber || '—'}</dd></div><div><dt>UETR</dt><dd>{detail.uetr || '—'}</dd></div>
            <div><dt>Coverage</dt><dd>{detail.isCov ? 'Yes' : 'No'}</dd></div><div><dt>Counters</dt><dd>{detail.counter} / retry {detail.retryCounter}</dd></div>
            <div><dt>Created</dt><dd>{formatDate(detail.createdAt)}</dd></div><div><dt>Updated</dt><dd>{formatDate(detail.updatedAt)}</dd></div>
          </dl>
          {detail.errorMessage && <section><h3>Error message</h3><pre>{detail.errorMessage}</pre></section>}
          <section><h3>Message content</h3><CollapsibleMessageContent value={detail.content} /></section>
        </>}
      </div>
      <div className="form-modal__actions"><button className="button button--secondary" type="button" onClick={onClose}>Close</button></div>
    </dialog>
  );
}

export function MessageManagementPage() {
  useDocumentTitle('Message Management | BNI');
  const [form, setForm] = useState<FilterForm>(() => createDefaultFilters());
  const [activeFilters, setActiveFilters] = useState<FilterForm>(() => createDefaultFilters());
  const [messages, setMessages] = useState<SwiftMessage[]>([]);
  const [messageTypes, setMessageTypes] = useState<string[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const [messageTypesError, setMessageTypesError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<SwiftMessageDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [correspondentTarget, setCorrespondentTarget] = useState<'sender' | 'receiver' | null>(null);

  const loadMessages = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true); setError(null);
    const filters: SwiftMessageFilters = { ...activeFilters, direction: activeFilters.direction || undefined, status: activeFilters.status || undefined, createdFrom: toApiDate(activeFilters.createdFrom), createdTo: toApiDate(activeFilters.createdTo), page, size };
    try {
      const result = await messageService.getAll(filters, signal);
      setMessages(result.content); setPage(result.page); setSize(result.size);
      setTotalElements(result.totalElements); setTotalPages(result.totalPages);
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
      setError(getErrorMessage(requestError));
    } finally { if (!signal?.aborted) setIsLoading(false); }
  }, [activeFilters, page, size]);

  useEffect(() => { const controller = new AbortController(); void loadMessages(controller.signal); return () => controller.abort(); }, [loadMessages]);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoadingTypes(true);
    void messageService.getTypes(controller.signal)
      .then(setMessageTypes)
      .catch((requestError: unknown) => {
        if (!(requestError instanceof DOMException && requestError.name === 'AbortError')) setMessageTypesError(getErrorMessage(requestError));
      })
      .finally(() => { if (!controller.signal.aborted) setIsLoadingTypes(false); });
    return () => controller.abort();
  }, []);

  const applyFilters = (event: FormEvent) => {
    event.preventDefault(); setError(null);
    if (form.createdFrom && form.createdTo && form.createdFrom > form.createdTo) { setError('Created from must be before or equal to created to.'); return; }
    setPage(0); setActiveFilters(form);
  };
  const clearFilters = () => { const defaults = createDefaultFilters(); setForm(defaults); setActiveFilters(defaults); setPage(0); };
  const update = (field: keyof FilterForm, value: string) => setForm((current) => ({ ...current, [field]: value } as FilterForm));
  const downloadCsv = async () => {
    const exportDateError = getExportDateError(activeFilters);
    if (exportDateError) { setError(exportDateError); return; }
    setIsDownloading(true); setError(null);
    const filters: SwiftMessageFilters = { ...activeFilters, direction: activeFilters.direction || undefined, status: activeFilters.status || undefined, createdFrom: toApiDate(activeFilters.createdFrom), createdTo: toApiDate(activeFilters.createdTo) };
    try {
      const messages = await messageService.exportAll(filters);
      const csvBlob = new Blob([`\uFEFF${messagesToCsv(messages)}`], { type: 'text/csv;charset=utf-8' });
      const downloadUrl = URL.createObjectURL(csvBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `swift-messages-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally { setIsDownloading(false); }
  };
  const openDetail = async (id: number) => {
    setDetail(null); setDetailError(null); setIsDetailOpen(true); setIsDetailLoading(true);
    try { setDetail(await messageService.getById(id)); } catch (requestError) { setDetailError(getErrorMessage(requestError)); } finally { setIsDetailLoading(false); }
  };

  const columns: DataTableColumn<SwiftMessage>[] = [
    { key: 'referenceNumber', header: 'Reference Number', render: (message) => message.referenceNumber || '—' },
    { key: 'mtype', header: 'Message Type', render: (message) => message.mtype || '—' },
    { key: 'direction', header: 'Direction', render: (message) => message.direction || '—' },
    { key: 'sender', header: 'Sender', render: (message) => message.sender || '—' },
    { key: 'receiver', header: 'Receiver', render: (message) => message.receiver || '—' },
    { key: 'fileName', header: 'File name', render: (message) => message.fileName },
    { key: 'status', header: 'Status', render: (message) => <span className={`message-status message-status--${message.status.toLowerCase().replaceAll('_', '-')}`}>{message.status}</span> },
    { key: 'createdAt', header: 'Created', render: (message) => formatDate(message.createdAt) },
    { key: 'actions', header: 'Actions', align: 'right', render: (message) => <IconButton label={`View ${message.fileName}`} type="button" onClick={() => void openDetail(message.id)} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></svg>} /> },
  ];

  return <div className="crud-page message-management-page">
    <header className="page-header"><p>SWIFT</p><h1>Message Management</h1></header>
    <section className="management-card" aria-labelledby="message-filter-title"><div className="section-heading"><h2 id="message-filter-title">Filter Messages</h2></div>
      <form className="message-filter-grid" onSubmit={applyFilters}>
        <div className="form-field"><label htmlFor="message-file-name">File name</label><input id="message-file-name" value={form.fileName} onChange={(e) => update('fileName', e.target.value)} /></div>
        <div className="form-field"><label htmlFor="message-reference">Reference number</label><input id="message-reference" value={form.referenceNumber} onChange={(e) => update('referenceNumber', e.target.value)} /></div>
        <div className="form-field"><label htmlFor="message-direction">Direction</label><select id="message-direction" value={form.direction} onChange={(e) => update('direction', e.target.value)}><option value="">All directions</option>{SWIFT_FILTER_DIRECTIONS.map((direction) => <option key={direction} value={direction}>{direction}</option>)}</select></div>
        <div className="form-field"><label htmlFor="message-type">Message type</label><select id="message-type" value={form.mtype} onChange={(e) => update('mtype', e.target.value)} disabled={isLoadingTypes}><option value="">{isLoadingTypes ? 'Loading message types...' : 'All message types'}</option>{messageTypes.map((messageType) => <option key={messageType} value={messageType}>{messageType}</option>)}</select>{messageTypesError && <small className="form-field-error">Unable to load message types.</small>}{!isLoadingTypes && !messageTypesError && messageTypes.length === 0 && <small>No message types available.</small>}</div>
        <div className="form-field"><label htmlFor="message-sender">Sender</label><div className="correspondent-field"><input id="message-sender" value={form.sender} readOnly placeholder="Select correspondent BIC" /><button className="correspondent-field__picker" type="button" aria-label="Search sender correspondent" title="Search correspondent" onClick={() => setCorrespondentTarget('sender')}><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 7h14M5 12h14M5 17h14" /></svg></button>{form.sender && <button className="correspondent-field__clear" type="button" aria-label="Clear sender" title="Clear sender" onClick={() => update('sender', '')}>&times;</button>}</div></div>
        <div className="form-field"><label htmlFor="message-receiver">Receiver</label><div className="correspondent-field"><input id="message-receiver" value={form.receiver} readOnly placeholder="Select correspondent BIC" /><button className="correspondent-field__picker" type="button" aria-label="Search receiver correspondent" title="Search correspondent" onClick={() => setCorrespondentTarget('receiver')}><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 7h14M5 12h14M5 17h14" /></svg></button>{form.receiver && <button className="correspondent-field__clear" type="button" aria-label="Clear receiver" title="Clear receiver" onClick={() => update('receiver', '')}>&times;</button>}</div></div>
        <div className="form-field"><label htmlFor="message-uetr">UETR</label><input id="message-uetr" value={form.uetr} onChange={(e) => update('uetr', e.target.value)} /></div>
        <div className="form-field"><label htmlFor="message-status">Status</label><select id="message-status" value={form.status} onChange={(e) => update('status', e.target.value)}><option value="">All statuses</option>{SWIFT_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></div>
        <div className="form-field"><label htmlFor="message-created-from">Created from</label><input id="message-created-from" type="datetime-local" value={form.createdFrom} onChange={(e) => update('createdFrom', e.target.value)} /></div>
        <div className="form-field"><label htmlFor="message-created-to">Created to</label><input id="message-created-to" type="datetime-local" value={form.createdTo} onChange={(e) => update('createdTo', e.target.value)} /></div>
        <div className="form-field"><label htmlFor="message-sort-by">Sort by</label><select id="message-sort-by" value={form.sortBy} onChange={(e) => update('sortBy', e.target.value)}>{SWIFT_SORT_FIELDS.map((field) => <option key={field} value={field}>{sortLabels[field]}</option>)}</select></div>
        <div className="form-field"><label htmlFor="message-sort-direction">Sort direction</label><select id="message-sort-direction" value={form.sortDirection} onChange={(e) => update('sortDirection', e.target.value)}><option value="DESC">Descending</option><option value="ASC">Ascending</option></select></div>
        <div className="message-filter-actions"><IconButton className="icon-button--primary search-form__icon-button" label="Search messages" type="submit" disabled={isLoading || isDownloading} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 4.5 4.5"/></svg>} /><IconButton className="search-form__icon-button" label="Clear filters" type="button" onClick={clearFilters} disabled={isLoading || isDownloading} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m4 15 8-9 7 6-7 8H8l-4-3Z"/><path d="m9 12 6 5M12 20h8"/></svg>} /><IconButton className="search-form__icon-button" label={isDownloading ? 'Downloading CSV' : 'Download messages as CSV'} type="button" onClick={() => void downloadCsv()} disabled={isLoading || isDownloading} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>} /></div>
      </form>
    </section>
    <section className="management-card" aria-labelledby="message-list-title"><div className="section-heading"><h2 id="message-list-title">Message List</h2><div className="section-heading__actions"><span>{totalElements} {totalElements === 1 ? 'message' : 'messages'}</span><IconButton label="Refresh messages" type="button" onClick={() => void loadMessages()} disabled={isLoading} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 7v5h-5"/><path d="M18.2 16a8 8 0 1 1 .8-9l1 5"/></svg>} /></div></div>
      {error && <p className="inline-error" role="alert">{error}</p>}
      <DataTable rows={messages} columns={columns} getRowKey={(message) => message.id} ariaLabel="SWIFT message list" isLoading={isLoading} loadingMessage="Loading messages..." emptyMessage="No messages found." serverPagination={{ currentPage: page + 1, totalPages, totalRows: totalElements, pageSize: size, onPageChange: (nextPage) => setPage(nextPage - 1), onPageSizeChange: (nextSize) => { setSize(nextSize); setPage(0); } }} />
    </section>
    {isDetailOpen && <DetailModal detail={detail} isLoading={isDetailLoading} error={detailError} onClose={() => setIsDetailOpen(false)} />}
    <CorrespondentPickerModal isOpen={correspondentTarget !== null} title={`Select ${correspondentTarget === 'receiver' ? 'Receiver' : 'Sender'}`} onSelect={(bicCode) => { if (correspondentTarget) update(correspondentTarget, bicCode); }} onClose={() => setCorrespondentTarget(null)} />
  </div>;
}
