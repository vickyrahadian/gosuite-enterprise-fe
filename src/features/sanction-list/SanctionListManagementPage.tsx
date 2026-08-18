import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { DataTable, DEFAULT_PAGE_SIZE, type DataTableColumn } from '../../components/DataTable';
import { IconButton } from '../../components/IconButton';
import { NotificationModal, type NotificationVariant } from '../../components/NotificationModal';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { ApiRequestError } from '../../services/api';
import { sanctionListService } from './sanctionListService';
import type { SanctionListItem } from './types';

type FilterForm = { fileName: string; checksum: string; downloadDate: string; uploadDate: string };
type Notification = { variant: NotificationVariant; title: string; message: string };

const emptyFilters: FilterForm = { fileName: '', checksum: '', downloadDate: '', uploadDate: '' };

function formatDate(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.status === 404) return 'Sanction-list metadata not found. Please refresh the data.';
    return error.message;
  }
  return 'Unable to connect to the backend. Check the API address and server connection.';
}

export function SanctionListManagementPage() {
  useDocumentTitle('Sanction List | BNI');
  const [items, setItems] = useState<SanctionListItem[]>([]);
  const [filters, setFilters] = useState<FilterForm>(emptyFilters);
  const [activeFilters, setActiveFilters] = useState<FilterForm>(emptyFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [isExecuteConfirmationOpen, setIsExecuteConfirmationOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const loadItems = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    try {
      const result = await sanctionListService.getAll({ ...activeFilters, page, size, sort: 'downloadDate,desc' }, signal);
      setItems(result.content); setPage(result.number); setSize(result.size); setTotalElements(result.totalElements); setTotalPages(result.totalPages);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) setNotification({ variant: 'error', title: 'Unable to Load Sanction List', message: getErrorMessage(error) });
    } finally { if (!signal?.aborted) setIsLoading(false); }
  }, [activeFilters, page, size]);

  useEffect(() => { const controller = new AbortController(); void loadItems(controller.signal); return () => controller.abort(); }, [loadItems]);

  const updateFilter = (field: keyof FilterForm, value: string) => setFilters((current) => ({ ...current, [field]: value }));
  const applyFilters = (event: FormEvent) => { event.preventDefault(); setPage(0); setActiveFilters({ fileName: filters.fileName.trim(), checksum: filters.checksum.trim(), downloadDate: filters.downloadDate, uploadDate: filters.uploadDate }); };
  const clearFilters = () => { setFilters(emptyFilters); setPage(0); setActiveFilters(emptyFilters); };
  const executeSanctionFilterUpdate = async () => {
    setIsExecuting(true);
    try {
      await sanctionListService.execute();
      setIsExecuteConfirmationOpen(false);
      setNotification({ variant: 'success', title: 'Sanction Filter Data Updated', message: 'The sanction-list file was downloaded and uploaded successfully.' });
      await loadItems();
    } catch (error) {
      setIsExecuteConfirmationOpen(false);
      setNotification({ variant: 'error', title: 'Sanction Filter Update Failed', message: getErrorMessage(error) });
    } finally { setIsExecuting(false); }
  };

  const columns: DataTableColumn<SanctionListItem>[] = [
    { key: 'fileName', header: 'File Name', render: (item) => item.fileName },
    { key: 'fileSize', header: 'Size (bytes)', render: (item) => item.fileSize?.toLocaleString() ?? '—' },
    { key: 'status', header: 'Status', render: (item) => <span className={`sanction-status sanction-status--${item.status.toLowerCase().replaceAll('_', '-')}`}>{item.status}</span> },
    { key: 'downloadDate', header: 'Downloaded', render: (item) => formatDate(item.downloadDate) },
    { key: 'uploadDate', header: 'Uploaded', render: (item) => formatDate(item.uploadDate) },
  ];

  return <div className="crud-page sanction-list-page">
    <header className="page-header"><p>Sanctions</p><h1>Sanction List</h1></header>
    <section className="management-card" aria-labelledby="sanction-filter-title"><div className="section-heading"><h2 id="sanction-filter-title">Filter Metadata</h2></div><form className="sanction-filter-grid" onSubmit={applyFilters}>
      <div className="form-field"><label htmlFor="sanction-file-name">File name</label><input id="sanction-file-name" value={filters.fileName} onChange={(e) => updateFilter('fileName', e.target.value)} maxLength={500}/></div>
      <div className="form-field"><label htmlFor="sanction-checksum">Checksum</label><input id="sanction-checksum" value={filters.checksum} onChange={(e) => updateFilter('checksum', e.target.value)} maxLength={64}/></div>
      <div className="form-field"><label htmlFor="sanction-download-date">Download date</label><input id="sanction-download-date" type="date" value={filters.downloadDate} onChange={(e) => updateFilter('downloadDate', e.target.value)}/></div>
      <div className="form-field"><label htmlFor="sanction-upload-date">Upload date</label><input id="sanction-upload-date" type="date" value={filters.uploadDate} onChange={(e) => updateFilter('uploadDate', e.target.value)}/></div>
      <div className="sanction-filter-actions"><IconButton className="icon-button--primary search-form__icon-button" label="Search sanction list" type="submit" disabled={isLoading} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 4.5 4.5"/></svg>} /><IconButton className="search-form__icon-button" label="Clear filters" type="button" onClick={clearFilters} disabled={isLoading && !Object.values(filters).some(Boolean)} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m4 15 8-9 7 6-7 8H8l-4-3Z"/><path d="m9 12 6 5M12 20h8"/></svg>}/></div>
    </form></section>
    <section className="management-card" aria-labelledby="sanction-list-title"><div className="section-heading"><h2 id="sanction-list-title">Metadata List</h2><div className="section-heading__actions"><span>{totalElements} {totalElements === 1 ? 'record' : 'records'}</span><IconButton label="Refresh sanction list" type="button" onClick={() => void loadItems()} disabled={isLoading || isExecuting} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 7v5h-5"/><path d="M18.2 16a8 8 0 1 1 .8-9l1 5"/></svg>}/><IconButton className="icon-button--primary" label="Update sanction filter data" type="button" onClick={() => { setNotification(null); setIsExecuteConfirmationOpen(true); }} disabled={isExecuting} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/></svg>}/></div></div><DataTable rows={items} columns={columns} getRowKey={(item) => item.id} ariaLabel="Sanction list metadata" isLoading={isLoading} loadingMessage="Loading sanction list..." emptyMessage="No sanction-list metadata found." serverPagination={{ currentPage: page + 1, totalPages, totalRows: totalElements, pageSize: size, onPageChange: (next) => setPage(next - 1), onPageSizeChange: (next) => { setSize(next); setPage(0); } }}/></section>
    <NotificationModal isOpen={isExecuteConfirmationOpen} variant="confirm" title="Update Sanction Filter Data" message="Start the sanction-list update now? The process will download the latest sanction-list file and upload it to the configured destination." primaryLabel="Start Update" secondaryLabel="Cancel" isProcessing={isExecuting} onPrimary={() => void executeSanctionFilterUpdate()} onClose={() => { if (!isExecuting) setIsExecuteConfirmationOpen(false); }}/>
    <NotificationModal isOpen={notification !== null} variant={notification?.variant ?? 'success'} title={notification?.title ?? ''} message={notification?.message ?? ''} onPrimary={() => setNotification(null)} onClose={() => setNotification(null)}/>
  </div>;
}
