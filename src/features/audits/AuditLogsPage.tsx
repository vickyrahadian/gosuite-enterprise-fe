import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { DataTable, DEFAULT_PAGE_SIZE, type DataTableColumn } from '../../components/DataTable';
import { IconButton } from '../../components/IconButton';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { ApiRequestError } from '../../services/api';
import { auditService } from './auditService';
import type { AuditFilters, AuditLog, AuditOperation } from './types';

type AuditForm = {
  tableName: string;
  recordKey: string;
  operation: '' | AuditOperation;
  actorUsername: string;
  from: string;
  to: string;
};

const emptyForm: AuditForm = { tableName: '', recordKey: '', operation: '', actorUsername: '', from: '', to: '' };

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function formatData(value: string | null) {
  if (!value) return '—';
  try { return JSON.stringify(JSON.parse(value), null, 2); } catch { return value; }
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiRequestError) return error.message;
  return 'Unable to connect to the backend. Check the API address and server connection.';
}

export function AuditLogsPage() {
  useDocumentTitle('Audit Logs | BNI');
  const [form, setForm] = useState<AuditForm>(emptyForm);
  const [activeFilters, setActiveFilters] = useState<AuditForm>(emptyForm);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async (signal?: AbortSignal, requestedPage = page, requestedSize = size, filters = activeFilters) => {
    setIsLoading(true);
    setError(null);
    const requestFilters: AuditFilters = { ...filters, operation: filters.operation || undefined, page: requestedPage, size: requestedSize };
    try {
      const result = await auditService.getAll(requestFilters, signal);
      setLogs(result.content);
      setPage(result.pageable?.pageNumber ?? requestedPage);
      setSize(result.pageable?.pageSize ?? requestedSize);
      setTotalElements(result.totalElements);
      setTotalPages(result.totalPages);
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
      setError(getErrorMessage(requestError));
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [activeFilters, page, size]);

  useEffect(() => {
    const controller = new AbortController();
    void loadLogs(controller.signal);
    return () => controller.abort();
  }, [loadLogs]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActiveFilters(form);
    setPage(0);
  };

  const clearFilters = () => {
    setForm(emptyForm);
    setActiveFilters(emptyForm);
    setPage(0);
  };

  const handlePageChange = (nextPage: number) => setPage(nextPage - 1);

  const handlePageSizeChange = (nextSize: number) => {
    setSize(nextSize);
    setPage(0);
  };

  const updateField = (field: keyof AuditForm, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const columns: DataTableColumn<AuditLog>[] = [
    { key: 'changedAt', header: 'Changed At', render: (log) => formatDate(log.changedAt) },
    { key: 'tableName', header: 'Table', render: (log) => log.tableName },
    { key: 'recordKey', header: 'Record Key', render: (log) => log.recordKey },
    { key: 'operation', header: 'Operation', render: (log) => <span className={`audit-operation audit-operation--${log.operation.toLowerCase()}`}>{log.operation}</span> },
    { key: 'actorUsername', header: 'Actor', render: (log) => log.actorUsername },
    { key: 'requestId', header: 'Request ID', render: (log) => log.requestId || '—' },
    { key: 'ipAddress', header: 'IP Address', render: (log) => log.ipAddress || '—' },
    { key: 'data', header: 'Data Changes', render: (log) => <details className="audit-data"><summary>View changes</summary><div><strong>Old</strong><pre>{formatData(log.oldData)}</pre><strong>New</strong><pre>{formatData(log.newData)}</pre></div></details> },
  ];

  return (
    <div className="crud-page audit-logs-page">
      <header className="page-header"><p>System Management</p><h1>Audit Logs</h1></header>
      <section className="management-card" aria-labelledby="audit-filter-title">
        <div className="section-heading"><h2 id="audit-filter-title">Filter Audit Logs</h2></div>
        <form className="audit-filter-grid" onSubmit={handleSearch}>
          <div className="form-field"><label htmlFor="audit-table">Table</label><select id="audit-table" value={form.tableName} onChange={(event) => updateField('tableName', event.target.value)}><option value="">All tables</option><option value="AUTH_AUDIT">AUTH_AUDIT</option><option value="AUTH_GROUP">AUTH_GROUP</option><option value="AUTH_MENU">AUTH_MENU</option><option value="AUTH_MENU_GROUP">AUTH_MENU_GROUP</option><option value="AUTH_PASSWORD_HISTORY">AUTH_PASSWORD_HISTORY</option><option value="AUTH_REFRESH_TOKEN">AUTH_REFRESH_TOKEN</option><option value="AUTH_USER">AUTH_USER</option><option value="AUTH_USER_GROUP">AUTH_USER_GROUP</option></select></div>
          <div className="form-field"><label htmlFor="audit-record-key">Record key</label><input id="audit-record-key" value={form.recordKey} onChange={(event) => updateField('recordKey', event.target.value)} placeholder="10 or 10:2" /></div>
          <div className="form-field"><label htmlFor="audit-operation">Operation</label><select id="audit-operation" value={form.operation} onChange={(event) => updateField('operation', event.target.value)}><option value="">All operations</option><option value="ADD">ADD</option><option value="EDIT">EDIT</option><option value="DELETE">DELETE</option></select></div>
          <div className="form-field"><label htmlFor="audit-actor">Actor username</label><input id="audit-actor" value={form.actorUsername} onChange={(event) => updateField('actorUsername', event.target.value)} /></div>
          <div className="form-field"><label htmlFor="audit-from">From</label><input id="audit-from" type="datetime-local" value={form.from} onChange={(event) => updateField('from', event.target.value)} /></div>
          <div className="form-field"><label htmlFor="audit-to">To</label><input id="audit-to" type="datetime-local" value={form.to} onChange={(event) => updateField('to', event.target.value)} /></div>
          <div className="audit-filter-actions"><button className="button button--primary" type="submit" disabled={isLoading}>Apply filters</button><button className="button" type="button" onClick={clearFilters} disabled={isLoading}>Clear</button></div>
        </form>
      </section>
      <section className="management-card" aria-labelledby="audit-list-title">
        <div className="section-heading"><h2 id="audit-list-title">Audit Log List</h2><div className="section-heading__actions"><span>{totalElements} {totalElements === 1 ? 'entry' : 'entries'}</span><IconButton label="Refresh audit logs" type="button" onClick={() => void loadLogs()} disabled={isLoading} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 7v5h-5" /><path d="M18.2 16a8 8 0 1 1 .8-9l1 5" /></svg>} /></div></div>
        {error && <p className="inline-error" role="alert">{error}</p>}
        <DataTable
          rows={logs}
          columns={columns}
          getRowKey={(log) => log.id}
          ariaLabel="Audit log list"
          isLoading={isLoading}
          loadingMessage="Loading audit logs..."
          emptyMessage="No audit logs found."
          serverPagination={{ currentPage: page + 1, totalPages, totalRows: totalElements, pageSize: size, onPageChange: handlePageChange, onPageSizeChange: handlePageSizeChange }}
        />
      </section>
    </div>
  );
}
