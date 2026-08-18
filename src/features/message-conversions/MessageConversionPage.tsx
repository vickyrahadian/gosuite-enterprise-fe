import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { DataTable, DEFAULT_PAGE_SIZE, type DataTableColumn } from '../../components/DataTable';
import { IconButton } from '../../components/IconButton';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { ApiRequestError } from '../../services/api';
import { MessageConversionDetailModal } from './MessageConversionDetailModal';
import { messageConversionService } from './messageConversionService';
import type { MessageConversion, MessageConversionDetail } from './types';

const statuses = ['DISCOVERED', 'CLAIMED', 'VALIDATED', 'CONVERTED', 'OUTPUT_PUBLISHED', 'ARCHIVED', 'FAILED_VALIDATION', 'FAILED_CONVERSION', 'FAILED_OUTPUT', 'FAILED_ARCHIVE'];
type FilterForm = { fileName: string; status: string; transactionReference: string; uetr: string; currency: string; senderBic: string; receiverBic: string; settlementDateFrom: string; settlementDateTo: string; createdFrom: string; createdTo: string };
const emptyFilters: FilterForm = { fileName: '', status: '', transactionReference: '', uetr: '', currency: '', senderBic: '', receiverBic: '', settlementDateFrom: '', settlementDateTo: '', createdFrom: '', createdTo: '' };
const display = (value: string | null) => value || '\u2014';
const label = (value: string) => value.replaceAll('_', ' ');
const formatDate = (value: string | null) => { if (!value) return '\u2014'; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date); };
const toApiDateTime = (value: string) => value && value.length === 16 ? `${value}:00` : value;
const getErrorMessage = (error: unknown) => error instanceof ApiRequestError ? error.message : 'Unable to connect to the backend. Check the API address and server connection.';

export function MessageConversionPage() {
  useDocumentTitle('MX/MT Converter | BNI');
  const [form, setForm] = useState(emptyFilters); const [activeFilters, setActiveFilters] = useState(emptyFilters);
  const [items, setItems] = useState<MessageConversion[]>([]); const [page, setPage] = useState(0); const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0); const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null); const [detail, setDetail] = useState<MessageConversionDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false); const [detailError, setDetailError] = useState<string | null>(null);

  const loadItems = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true); setError(null);
    try { const result = await messageConversionService.getAll({ ...activeFilters, page, size }, signal); setItems(result.content); setPage(result.number); setSize(result.size); setTotalElements(result.totalElements); setTotalPages(result.totalPages); }
    catch (requestError) { if (!(requestError instanceof DOMException && requestError.name === 'AbortError')) setError(getErrorMessage(requestError)); }
    finally { if (!signal?.aborted) setIsLoading(false); }
  }, [activeFilters, page, size]);
  useEffect(() => { const controller = new AbortController(); void loadItems(controller.signal); return () => controller.abort(); }, [loadItems]);

  const openDetail = async (id: number) => { setSelectedId(id); setDetail(null); setDetailError(null); setIsDetailLoading(true); try { setDetail(await messageConversionService.getById(id)); } catch (requestError) { setDetailError(getErrorMessage(requestError)); } finally { setIsDetailLoading(false); } };
  const update = (field: keyof FilterForm, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (form.settlementDateFrom && form.settlementDateTo && form.settlementDateFrom > form.settlementDateTo) { setError('Settlement date from must be earlier than or equal to settlement date to.'); return; }
    if (form.createdFrom && form.createdTo && form.createdFrom > form.createdTo) { setError('Created from must be earlier than or equal to created to.'); return; }
    setError(null); setActiveFilters({ ...form, createdFrom: toApiDateTime(form.createdFrom), createdTo: toApiDateTime(form.createdTo) }); setPage(0);
  };
  const clear = () => { setForm(emptyFilters); setActiveFilters(emptyFilters); setError(null); setPage(0); };

  const columns: DataTableColumn<MessageConversion>[] = [
    { key: 'reference', header: 'Transaction Reference', render: (item) => display(item.transactionReference) },
    { key: 'source', header: 'Source File', render: (item) => <span title={item.sourceFileName}>{item.sourceFileName}</span> },
    { key: 'output', header: 'Output File', render: (item) => <span title={item.outputFileName ?? undefined}>{display(item.outputFileName)}</span> },
    { key: 'bic', header: 'Sender \u2192 Receiver', render: (item) => <span>{display(item.senderBic)} &rarr; {display(item.receiverBic)}</span> },
    { key: 'currency', header: 'Currency', render: (item) => display(item.currency) },
    { key: 'settlement', header: 'Settlement Date', render: (item) => display(item.settlementDate) },
    { key: 'status', header: 'Status', render: (item) => <span className={`conversion-status conversion-status--${item.status.toLowerCase().replaceAll('_', '-')}`}>{label(item.status)}</span> },
    { key: 'created', header: 'Created At', render: (item) => formatDate(item.createdAt) },
    { key: 'actions', header: 'Actions', align: 'right', render: (item) => <IconButton label={`View conversion ${item.id}`} type="button" onClick={() => void openDetail(item.id)} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></svg>} /> },
  ];

  return <div className="crud-page conversion-page">
    <header className="page-header"><p>Message Translation</p><h1>MX/MT Converter</h1></header>
    <section className="management-card" aria-labelledby="conversion-filter-title"><div className="section-heading"><h2 id="conversion-filter-title">Filter Message Conversions</h2></div>
      <form className="conversion-filter" onSubmit={submit}><div className="conversion-filter__fields">
        <div className="form-field"><label htmlFor="conversion-file">File name</label><input id="conversion-file" value={form.fileName} onChange={(event) => update('fileName', event.target.value)} placeholder="Source or output file" /></div>
        <div className="form-field"><label htmlFor="conversion-reference">Transaction reference</label><input id="conversion-reference" value={form.transactionReference} onChange={(event) => update('transactionReference', event.target.value)} /></div>
        <div className="form-field"><label htmlFor="conversion-status">Status</label><select id="conversion-status" value={form.status} onChange={(event) => update('status', event.target.value)}><option value="">All statuses</option>{statuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}</select></div>
        <div className="form-field"><label htmlFor="conversion-currency">Currency</label><input id="conversion-currency" value={form.currency} maxLength={3} onChange={(event) => update('currency', event.target.value.toUpperCase())} placeholder="USD" /></div>
        <div className="form-field"><label htmlFor="conversion-created-from">Created from</label><input id="conversion-created-from" type="datetime-local" step="1" value={form.createdFrom} onChange={(event) => update('createdFrom', event.target.value)} /></div>
        <div className="form-field"><label htmlFor="conversion-created-to">Created to</label><input id="conversion-created-to" type="datetime-local" step="1" value={form.createdTo} onChange={(event) => update('createdTo', event.target.value)} /></div>
      </div><details className="conversion-advanced"><summary>Advanced filters</summary><div className="conversion-filter__fields">
        <div className="form-field"><label htmlFor="conversion-uetr">UETR</label><input id="conversion-uetr" value={form.uetr} onChange={(event) => update('uetr', event.target.value)} /></div>
        <div className="form-field"><label htmlFor="conversion-sender">Sender BIC</label><input id="conversion-sender" value={form.senderBic} onChange={(event) => update('senderBic', event.target.value.toUpperCase())} /></div>
        <div className="form-field"><label htmlFor="conversion-receiver">Receiver BIC</label><input id="conversion-receiver" value={form.receiverBic} onChange={(event) => update('receiverBic', event.target.value.toUpperCase())} /></div>
        <div className="form-field"><label htmlFor="conversion-settlement-from">Settlement date from</label><input id="conversion-settlement-from" type="date" value={form.settlementDateFrom} onChange={(event) => update('settlementDateFrom', event.target.value)} /></div>
        <div className="form-field"><label htmlFor="conversion-settlement-to">Settlement date to</label><input id="conversion-settlement-to" type="date" value={form.settlementDateTo} onChange={(event) => update('settlementDateTo', event.target.value)} /></div>
      </div></details><div className="conversion-filter__actions"><IconButton className="icon-button--primary search-form__icon-button" label="Apply conversion filters" type="submit" disabled={isLoading} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 4.5 4.5"/></svg>} /><IconButton className="search-form__icon-button" label="Clear conversion filters" type="button" onClick={clear} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m4 15 8-9 7 6-7 8H8l-4-3Z"/><path d="m9 12 6 5M12 20h8"/></svg>} /></div></form>
    </section>
    <section className="management-card" aria-labelledby="conversion-list-title"><div className="section-heading"><h2 id="conversion-list-title">Message Conversions</h2><div className="section-heading__actions"><span>{totalElements} {totalElements === 1 ? 'conversion' : 'conversions'}</span><IconButton label="Refresh message conversions" type="button" onClick={() => void loadItems()} disabled={isLoading} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 7v5h-5"/><path d="M18.2 16a8 8 0 1 1 .8-9l1 5"/></svg>}/></div></div>
      {error && <p className="inline-error" role="alert">{error}</p>}<DataTable rows={items} columns={columns} getRowKey={(item) => item.id} ariaLabel="MX MT message conversions" isLoading={isLoading} loadingMessage="Loading message conversions..." emptyMessage="No message conversions found." serverPagination={{ currentPage: page + 1, totalPages, totalRows: totalElements, pageSize: size, onPageChange: (next) => setPage(next - 1), onPageSizeChange: (next) => { setSize(next); setPage(0); } }} />
    </section>
    {selectedId !== null && <MessageConversionDetailModal detail={detail} isLoading={isDetailLoading} error={detailError} onClose={() => { setSelectedId(null); setDetail(null); setDetailError(null); }} />}
  </div>;
}
