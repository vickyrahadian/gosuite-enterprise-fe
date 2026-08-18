import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { DataTable, DEFAULT_PAGE_SIZE, type DataTableColumn } from '../../components/DataTable';
import { IconButton } from '../../components/IconButton';
import { CollapsibleMessageContent } from '../../components/CollapsibleMessageContent';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { ApiRequestError } from '../../services/api';
import { CorrespondentPickerModal } from '../messages/CorrespondentPickerModal';
import { filteringRequestService } from './filteringRequestService';
import type { FilteringApiLog, FilteringRequestFilters, FilteringRequestView, YesNo } from './types';

type FilterForm = { reference: string; mtype: string; direction: string; sender: string; receiver: string; status: string; score: string; hasHit: '' | YesNo };
const emptyFilters: FilterForm = { reference: '', mtype: '', direction: '', sender: '', receiver: '', status: '', score: '', hasHit: '' };

function getErrorMessage(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.status === 404) return 'Filtering request not found. Please refresh the data.';
    if (error.code === 'FILTERING_HAS_HIT_INVALID') return 'Has hit must be Y or N.';
    return error.message;
  }
  return 'Unable to connect to the backend. Check the API address and server connection.';
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function formatFieldName(value: string) {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replaceAll('_', ' ').replace(/^./, (character) => character.toUpperCase());
}

function parseRequestBody(value: string | null): Record<string, unknown> | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch { return null; }
}

function formatRequestJson(value: string | null) {
  if (!value) return '';
  try { return JSON.stringify(JSON.parse(value), null, 2); }
  catch { return value; }
}

function flattenRequestFields(value: unknown, prefix: string): Array<[string, unknown]> {
  if (value === null || value === undefined || typeof value !== 'object') return [[prefix, value]];
  if (Array.isArray(value)) {
    if (value.length === 0) return [[prefix, null]];
    return value.flatMap((item, index) => flattenRequestFields(item, `${prefix} ${index + 1}`));
  }
  const entries = Object.entries(value);
  if (entries.length === 0) return [[prefix, null]];
  return entries.flatMap(([key, nestedValue]) => flattenRequestFields(nestedValue, `${prefix}.${key}`));
}

function formatRequestFieldName(value: string) {
  return value.split('.').map((part) => formatFieldName(part)).join(' / ');
}

function groupInitialRequest(payload: Record<string, unknown>) {
  const entries = Object.entries(payload).filter(([key]) => key !== 'customFields' && key !== 'messageText');
  const entriesByKey = new Map(entries);
  const claimed = new Set<string>();
  const groups: Array<{ title: string; fields: Array<[string, unknown]> }> = [];
  const addGroup = (title: string, keys: string[]) => {
    const fields = keys.flatMap((key) => {
      const value = entriesByKey.get(key);
      if (value === undefined) return [];
      claimed.add(key);
      return [[key, value] as [string, unknown]];
    });
    if (fields.length > 0) groups.push({ title, fields });
  };

  addGroup('General Info', ['businessUnit', 'currencyCd', 'messageDateTime', 'messageDirection', 'messageInstanceNumber', 'messageKey', 'messageRefNumber', 'messageSourceType', 'messageTypeCd', 'partyKey', 'productKey', 'searchDefId', 'additionalMessageInfo']);
  addGroup('Transaction Information', ['amount', 'fiToFiInfo', 'messageInstructions', 'remittanceInfo']);
  addGroup('Ordering Info', ['originator']);
  addGroup('Originating FI', ['originating']);

  const beneficiary = entriesByKey.get('beneficiary');
  if (beneficiary && typeof beneficiary === 'object' && !Array.isArray(beneficiary)) {
    const beneficiaryFields = Object.entries(beneficiary).filter(([key]) => key !== 'beneficiaryFI');
    const beneficiaryFI = Object.entries(beneficiary).find(([key]) => key === 'beneficiaryFI');
    if (beneficiaryFields.length > 0) groups.push({ title: 'Beneficiary Info', fields: [['beneficiary', Object.fromEntries(beneficiaryFields)]] });
    if (beneficiaryFI) groups.push({ title: 'Beneficiary FI', fields: [['beneficiaryFI', beneficiaryFI[1]]] });
    claimed.add('beneficiary');
  } else {
    addGroup('Beneficiary Info', ['beneficiary']);
  }

  addGroup('Sending', ['sending']);
  addGroup('Receiving', ['receiving']);
  addGroup('Intermediary', ['intermediate']);
  const additional = entries.filter(([key]) => !claimed.has(key));
  if (additional.length > 0) groups.push({ title: 'Additional Information', fields: additional });
  return groups;
}

function InitialFilteringRequestModal({ request, payload, rawRequest, isLoading, error, onClose }: { request: FilteringRequestView; payload: Record<string, unknown> | null; rawRequest: string | null; isLoading: boolean; error: string | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const messageText = typeof payload?.messageText === 'string' ? payload.messageText : '';
  const formattedRequestJson = formatRequestJson(rawRequest);
  useEffect(() => { const dialog = dialogRef.current; if (dialog && !dialog.open) dialog.showModal(); return () => { if (dialog?.open) dialog.close(); }; }, []);
  return <dialog ref={dialogRef} className="filtering-detail-modal" aria-labelledby="initial-filtering-request-title" onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <div className="form-modal__header"><h2 id="initial-filtering-request-title">Initial Filtering API Request</h2><button className="form-modal__close" type="button" aria-label="Close" onClick={onClose}>&times;</button></div>
    <div className="filtering-request-context">
      <span><strong>Reference:</strong> {request.reference || '—'}</span>
      <span><strong>Message Key:</strong> {request.messageKey || '—'}</span>
      <span><strong>Filtering Request ID:</strong> {request.filteringRequestId}</span>
      <span><strong>Message Type:</strong> {request.mtype || '—'}</span>
    </div>
    <div className="filtering-detail-modal__body">
      {isLoading && <p>Loading initial API request...</p>}
      {error && <p className="inline-error" role="alert">{error}</p>}
      {payload && <div className="initial-filtering-request-layout">
        <div className="filtering-detail-sections">
          {groupInitialRequest(payload).map((section) => <section key={section.title}>
            <h3>{section.title}</h3>
            <dl className="filtering-detail-grid">{section.fields.flatMap(([key, value]) => flattenRequestFields(value, key)).map(([fieldKey, fieldValue]) => <div key={fieldKey}><dt>{formatRequestFieldName(fieldKey)}</dt><dd>{fieldValue === null || fieldValue === undefined || fieldValue === '' ? '—' : String(fieldValue)}</dd></div>)}</dl>
          </section>)}
        </div>
        <div className="initial-filtering-request-side">
          {messageText && <section className="initial-filtering-request-message">
            <h3>Message Text</h3>
            <div className="initial-filtering-request-message__body"><CollapsibleMessageContent value={messageText} emptyMessage="No message text available." /></div>
          </section>}
          {formattedRequestJson && <section className="initial-filtering-request-message">
            <h3>Request JSON</h3>
            <div className="initial-filtering-request-message__body"><CollapsibleMessageContent value={formattedRequestJson} emptyMessage="No request JSON available." /></div>
          </section>}
        </div>
      </div>}
    </div>
    <div className="form-modal__actions"><button className="button button--secondary" type="button" onClick={onClose}>Close</button></div>
  </dialog>;
}

export function FilteringRequestManagementPage() {
  useDocumentTitle('Sanction Filtering | BNI');
  const [filters, setFilters] = useState<FilterForm>(emptyFilters);
  const [activeFilters, setActiveFilters] = useState<FilterForm>(emptyFilters);
  const [items, setItems] = useState<FilteringRequestView[]>([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialRequestContext, setInitialRequestContext] = useState<FilteringRequestView | null>(null);
  const [initialRequestPayload, setInitialRequestPayload] = useState<Record<string, unknown> | null>(null);
  const [initialRequestRaw, setInitialRequestRaw] = useState<string | null>(null);
  const [isInitialRequestLoading, setIsInitialRequestLoading] = useState(false);
  const [initialRequestError, setInitialRequestError] = useState<string | null>(null);
  const [correspondentTarget, setCorrespondentTarget] = useState<'sender' | 'receiver' | null>(null);

  const loadItems = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true); setError(null);
    const requestFilters: FilteringRequestFilters = { reference: activeFilters.reference, mtype: activeFilters.mtype, direction: activeFilters.direction, sender: activeFilters.sender, receiver: activeFilters.receiver, status: activeFilters.status, score: activeFilters.score === '' ? undefined : Number(activeFilters.score), hasHit: activeFilters.hasHit || undefined, page, size, sort: 'createdAt,desc' };
    try {
      const result = await filteringRequestService.getAll(requestFilters, signal);
      setItems(result.content); setPage(result.number); setSize(result.size); setTotalElements(result.totalElements); setTotalPages(result.totalPages);
    } catch (requestError) {
      if (!(requestError instanceof DOMException && requestError.name === 'AbortError')) setError(getErrorMessage(requestError));
    } finally { if (!signal?.aborted) setIsLoading(false); }
  }, [activeFilters, page, size]);

  useEffect(() => { const controller = new AbortController(); void loadItems(controller.signal); return () => controller.abort(); }, [loadItems]);

  const update = (field: keyof FilterForm, value: string) => setFilters((current) => ({ ...current, [field]: value } as FilterForm));
  const applyFilters = (event: FormEvent) => { event.preventDefault(); setPage(0); setActiveFilters({ ...filters, reference: filters.reference.trim(), mtype: filters.mtype.trim(), sender: filters.sender.trim(), receiver: filters.receiver.trim(), status: filters.status.trim() }); };
  const clearFilters = () => { setFilters(emptyFilters); setPage(0); setActiveFilters(emptyFilters); };
  const openInitialRequest = async (request: FilteringRequestView) => {
    setInitialRequestContext(request); setInitialRequestPayload(null); setInitialRequestRaw(null); setInitialRequestError(null); setIsInitialRequestLoading(true);
    try {
      const apiLogs = await filteringRequestService.getApiLogs(request.filteringRequestId);
      const firstRequest = apiLogs[0]?.requestBody;
      if (!firstRequest) setInitialRequestError('No initial API request was found for this filtering request.');
      else {
        setInitialRequestRaw(firstRequest);
        const payload = parseRequestBody(firstRequest);
        if (!payload) setInitialRequestError('The initial API request body is not valid JSON.');
        else setInitialRequestPayload(payload);
      }
    } catch (requestError) { setInitialRequestError(getErrorMessage(requestError)); }
    finally { setIsInitialRequestLoading(false); }
  };

  const columns: DataTableColumn<FilteringRequestView>[] = [
    { key: 'messageKey', header: 'Message Key', render: (item) => item.messageKey || '—' },
    { key: 'reference', header: 'Reference Number', render: (item) => item.reference || '—' },
    { key: 'mtype', header: 'Message Type', render: (item) => item.mtype || '—' },
    { key: 'direction', header: 'Direction', render: (item) => item.direction || '—' },
    { key: 'sender', header: 'Sender', render: (item) => item.sender || '—' },
    { key: 'receiver', header: 'Receiver', render: (item) => item.receiver || '—' },
    { key: 'status', header: 'Status', render: (item) => item.status ? <span className={`filtering-status filtering-status--${item.status.toLowerCase().replaceAll('_', '-')}`}>{item.status}</span> : '—' },
    { key: 'score', header: 'Score', render: (item) => item.score ?? '—' },
    { key: 'hasHit', header: 'Hit', render: (item) => item.hasHit === 'Y' ? 'Yes' : item.hasHit === 'N' ? 'No' : '—' },
    { key: 'createdAt', header: 'Created', render: (item) => formatDate(item.createdAt) },
    { key: 'actions', header: 'Detail', align: 'right', render: (item) => <IconButton label={`View initial API request for filtering request ${item.filteringRequestId}`} type="button" onClick={() => void openInitialRequest(item)} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></svg>}/> },
  ];

  return <div className="crud-page sanction-filtering-page">
    <header className="page-header"><p>Actimize Integrator</p><h1>Sanction Filtering</h1></header>
    <section className="management-card" aria-labelledby="filtering-filter-title"><div className="section-heading"><h2 id="filtering-filter-title">Filter Requests</h2></div><form className="filtering-request-filter-grid" onSubmit={applyFilters}>
      <div className="form-field"><label htmlFor="filter-reference">Reference</label><input id="filter-reference" value={filters.reference} onChange={(e) => update('reference', e.target.value)}/></div>
      <div className="form-field"><label htmlFor="filter-mtype">Message type</label><input id="filter-mtype" value={filters.mtype} onChange={(e) => update('mtype', e.target.value)}/></div>
      <div className="form-field"><label htmlFor="filter-sender">Sender</label><div className="correspondent-field"><input id="filter-sender" value={filters.sender} readOnly placeholder="Select correspondent BIC"/><button className="correspondent-field__picker" type="button" aria-label="Search sender correspondent" title="Search correspondent" onClick={() => setCorrespondentTarget('sender')}><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 7h14M5 12h14M5 17h14"/></svg></button>{filters.sender && <button className="correspondent-field__clear" type="button" aria-label="Clear sender" title="Clear sender" onClick={() => update('sender', '')}>&times;</button>}</div></div>
      <div className="form-field"><label htmlFor="filter-receiver">Receiver</label><div className="correspondent-field"><input id="filter-receiver" value={filters.receiver} readOnly placeholder="Select correspondent BIC"/><button className="correspondent-field__picker" type="button" aria-label="Search receiver correspondent" title="Search correspondent" onClick={() => setCorrespondentTarget('receiver')}><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 7h14M5 12h14M5 17h14"/></svg></button>{filters.receiver && <button className="correspondent-field__clear" type="button" aria-label="Clear receiver" title="Clear receiver" onClick={() => update('receiver', '')}>&times;</button>}</div></div>
      <div className="form-field"><label htmlFor="filter-direction">Direction</label><select id="filter-direction" value={filters.direction} onChange={(e) => update('direction', e.target.value)}><option value="">All directions</option><option value="INCOMING">INCOMING</option><option value="OUTGOING">OUTGOING</option></select></div>
      <div className="form-field"><label htmlFor="filter-status">Status</label><input id="filter-status" value={filters.status} onChange={(e) => update('status', e.target.value)}/></div>
      <div className="form-field"><label htmlFor="filter-score">Score</label><input id="filter-score" type="number" step="1" value={filters.score} onChange={(e) => update('score', e.target.value)}/></div>
      <div className="form-field"><label htmlFor="filter-hit">Has hit</label><select id="filter-hit" value={filters.hasHit} onChange={(e) => update('hasHit', e.target.value)}><option value="">All results</option><option value="Y">Yes</option><option value="N">No</option></select></div>
      <div className="filtering-request-filter-actions"><IconButton className="icon-button--primary search-form__icon-button" label="Search filtering requests" type="submit" disabled={isLoading} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 4.5 4.5"/></svg>}/><IconButton className="search-form__icon-button" label="Clear filters" type="button" onClick={clearFilters} disabled={isLoading && !Object.values(filters).some(Boolean)} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m4 15 8-9 7 6-7 8H8l-4-3Z"/><path d="m9 12 6 5M12 20h8"/></svg>}/></div>
    </form></section>
    <section className="management-card" aria-labelledby="filtering-list-title"><div className="section-heading"><h2 id="filtering-list-title">Filtering Request List</h2><div className="section-heading__actions"><span>{totalElements} {totalElements === 1 ? 'request' : 'requests'}</span><IconButton label="Refresh filtering requests" type="button" onClick={() => void loadItems()} disabled={isLoading} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 7v5h-5"/><path d="M18.2 16a8 8 0 1 1 .8-9l1 5"/></svg>}/></div></div>{error && <p className="inline-error" role="alert">{error}</p>}<DataTable rows={items} columns={columns} getRowKey={(item) => item.filteringRequestId} ariaLabel="Filtering request list" isLoading={isLoading} loadingMessage="Loading filtering requests..." emptyMessage="No filtering requests found." serverPagination={{ currentPage: page + 1, totalPages, totalRows: totalElements, pageSize: size, onPageChange: (next) => setPage(next - 1), onPageSizeChange: (next) => { setSize(next); setPage(0); } }}/></section>
    {initialRequestContext && <InitialFilteringRequestModal request={initialRequestContext} payload={initialRequestPayload} rawRequest={initialRequestRaw} isLoading={isInitialRequestLoading} error={initialRequestError} onClose={() => setInitialRequestContext(null)}/>} 
    <CorrespondentPickerModal isOpen={correspondentTarget !== null} title={`Select ${correspondentTarget === 'receiver' ? 'Receiver' : 'Sender'}`} onSelect={(bicCode) => { if (correspondentTarget) update(correspondentTarget, bicCode); }} onClose={() => setCorrespondentTarget(null)} />
  </div>;
}
