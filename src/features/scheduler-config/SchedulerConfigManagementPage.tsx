import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { DataTable, DEFAULT_PAGE_SIZE, type DataTableColumn } from '../../components/DataTable';
import { FormModal } from '../../components/FormModal';
import { IconButton } from '../../components/IconButton';
import { NotificationModal, type NotificationVariant } from '../../components/NotificationModal';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { ApiRequestError } from '../../services/api';
import { schedulerConfigService } from './schedulerConfigService';
import type { SchedulerActive, SchedulerConfig, SchedulerConfigPayload } from './types';

type FormState = { serviceName: string; isActive: SchedulerActive };
type Notification = { variant: NotificationVariant; title: string; message: string };
const emptyForm: FormState = { serviceName: '', isActive: 'Y' };

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.code === 'SCHEDULER_CONFIG_SERVICE_NAME_CONFLICT') return error.message || 'The service name is already in use.';
    if (error.code === 'SCHEDULER_CONFIG_IN_USE') return error.message || 'This scheduler configuration is still in use and cannot be deleted.';
    if (error.status === 404) return 'Scheduler configuration not found. Please refresh the data.';
    if (error.status === 400) return error.message || Object.values(error.validationErrors ?? {})[0] || 'The scheduler configuration is invalid.';
    return error.message;
  }
  return 'Unable to connect to the backend. Check the API address and server connection.';
}

export function SchedulerConfigManagementPage() {
  useDocumentTitle('Scheduler Config | BNI');
  const [items, setItems] = useState<SchedulerConfig[]>([]);
  const [searchName, setSearchName] = useState('');
  const [searchActive, setSearchActive] = useState<SchedulerActive | ''>('');
  const [filters, setFilters] = useState<{ serviceName: string; isActive: SchedulerActive | '' }>({ serviceName: '', isActive: '' });
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState<SchedulerConfig | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SchedulerConfig | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const loadItems = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    try {
      const result = await schedulerConfigService.getAll({ ...filters, page, size, sort: 'id,asc' }, signal);
      setItems(result.content); setPage(result.number); setSize(result.size); setTotalElements(result.totalElements); setTotalPages(result.totalPages);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) setNotification({ variant: 'error', title: 'Unable to Load Scheduler Configs', message: getErrorMessage(error) });
    } finally { if (!signal?.aborted) setIsLoading(false); }
  }, [filters, page, size]);

  useEffect(() => { const controller = new AbortController(); void loadItems(controller.signal); return () => controller.abort(); }, [loadItems]);

  const closeForm = () => { setIsFormOpen(false); setEditing(null); setForm(emptyForm); };
  const openAdd = () => { setEditing(null); setForm(emptyForm); setNotification(null); setIsFormOpen(true); };
  const openEdit = (item: SchedulerConfig) => { setEditing(item); setForm({ serviceName: item.serviceName, isActive: item.isActive }); setNotification(null); setIsFormOpen(true); };
  const applySearch = (event: FormEvent) => { event.preventDefault(); setPage(0); setFilters({ serviceName: searchName.trim(), isActive: searchActive }); };
  const clearSearch = () => { setSearchName(''); setSearchActive(''); setPage(0); setFilters({ serviceName: '', isActive: '' }); };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const serviceName = form.serviceName.trim();
    if (!serviceName) { setNotification({ variant: 'error', title: 'Invalid Service Name', message: 'Service name is required.' }); return; }
    const payload: SchedulerConfigPayload = { serviceName, isActive: form.isActive };
    setIsSaving(true);
    try {
      if (editing) await schedulerConfigService.update(editing.id, payload); else await schedulerConfigService.create(payload);
      const wasEditing = Boolean(editing); closeForm();
      setNotification({ variant: 'success', title: wasEditing ? 'Scheduler Config Updated' : 'Scheduler Config Created', message: `The scheduler configuration was ${wasEditing ? 'updated' : 'created'} successfully.` });
      await loadItems();
    } catch (error) { setNotification({ variant: 'error', title: editing ? 'Update Failed' : 'Creation Failed', message: getErrorMessage(error) }); }
    finally { setIsSaving(false); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try { await schedulerConfigService.remove(deleteTarget.id); setDeleteTarget(null); setNotification({ variant: 'success', title: 'Scheduler Config Deleted', message: 'The scheduler configuration was deleted successfully.' }); await loadItems(); }
    catch (error) { setDeleteTarget(null); setNotification({ variant: 'error', title: 'Deletion Failed', message: getErrorMessage(error) }); }
    finally { setIsDeleting(false); }
  };

  const columns: DataTableColumn<SchedulerConfig>[] = [
    { key: 'id', header: 'ID', render: (item) => item.id },
    { key: 'serviceName', header: 'Service Name', render: (item) => item.serviceName },
    { key: 'active', header: 'Active', render: (item) => item.isActive === 'Y' ? 'Yes' : 'No' },
    { key: 'updatedAt', header: 'Updated', render: (item) => formatDate(item.updatedAt) },
    { key: 'actions', header: 'Actions', align: 'right', render: (item) => <div className="row-actions"><IconButton label={`Edit ${item.serviceName}`} type="button" onClick={() => openEdit(item)} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 20h4l11-11-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></svg>} /><IconButton label={`Delete ${item.serviceName}`} variant="danger" type="button" onClick={() => setDeleteTarget(item)} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"/></svg>} /></div> },
  ];

  return <div className="crud-page scheduler-config-page">
    <header className="page-header"><p>Scheduler</p><h1>Scheduler Configuration</h1></header>
    <section className="management-card" aria-labelledby="scheduler-search-title"><div className="section-heading"><h2 id="scheduler-search-title">Search Configurations</h2></div><form className="scheduler-config-filter-grid" onSubmit={applySearch}>
      <div className="form-field"><label htmlFor="scheduler-config-search">Service name</label><input id="scheduler-config-search" type="search" value={searchName} onChange={(event) => setSearchName(event.target.value)} maxLength={100} placeholder="Search by service name" autoComplete="off" /></div>
      <div className="form-field"><label htmlFor="scheduler-config-active-filter">Active status</label><select id="scheduler-config-active-filter" value={searchActive} onChange={(event) => setSearchActive(event.target.value as SchedulerActive | '')}><option value="">All statuses</option><option value="Y">Active</option><option value="N">Inactive</option></select></div>
      <div className="scheduler-config-filter-actions"><IconButton className="icon-button--primary search-form__icon-button" label="Search scheduler configs" type="submit" disabled={isLoading} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 4.5 4.5"/></svg>} /><IconButton className="search-form__icon-button" label="Clear scheduler filters" type="button" onClick={clearSearch} disabled={isLoading && !searchName && !searchActive} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m4 15 8-9 7 6-7 8H8l-4-3Z"/><path d="m9 12 6 5M12 20h8"/></svg>} /></div>
    </form></section>
    <section className="management-card" aria-labelledby="scheduler-list-title"><div className="section-heading"><h2 id="scheduler-list-title">Configuration List</h2><div className="section-heading__actions"><span>{totalElements} {totalElements === 1 ? 'configuration' : 'configurations'}</span><IconButton label="Refresh scheduler configs" type="button" onClick={() => void loadItems()} disabled={isLoading} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 7v5h-5"/><path d="M18.2 16a8 8 0 1 1 .8-9l1 5"/></svg>} /><IconButton className="icon-button--primary" label="Add Scheduler Config" type="button" onClick={openAdd} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>} /></div></div><DataTable rows={items} columns={columns} getRowKey={(item) => item.id} ariaLabel="Scheduler configuration list" isLoading={isLoading} loadingMessage="Loading scheduler configurations..." emptyMessage="No scheduler configurations found." serverPagination={{ currentPage: page + 1, totalPages, totalRows: totalElements, pageSize: size, onPageChange: (next) => setPage(next - 1), onPageSizeChange: (next) => { setSize(next); setPage(0); } }} /></section>
    <FormModal isOpen={isFormOpen} title={editing ? 'Edit Scheduler Configuration' : 'Add Scheduler Configuration'} submitLabel={editing ? 'Save Changes' : 'Add Configuration'} isSubmitting={isSaving} onSubmit={save} onClose={closeForm}><div className="form-grid"><div className="form-field"><label htmlFor="scheduler-service-name">Service name</label><input id="scheduler-service-name" value={form.serviceName} onChange={(event) => setForm((current) => ({ ...current, serviceName: event.target.value }))} maxLength={100} required autoFocus disabled={isSaving} autoComplete="off" /><small>{form.serviceName.length}/100 characters</small></div><div className="form-field"><label htmlFor="scheduler-active">Active</label><select id="scheduler-active" value={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.value as SchedulerActive }))} disabled={isSaving}><option value="Y">Yes</option><option value="N">No</option></select></div></div></FormModal>
    <NotificationModal isOpen={deleteTarget !== null} variant="confirm" title="Delete Scheduler Configuration" message={`Are you sure you want to delete "${deleteTarget?.serviceName ?? ''}"?`} primaryLabel="Delete" secondaryLabel="Cancel" isProcessing={isDeleting} onPrimary={() => void confirmDelete()} onClose={() => setDeleteTarget(null)} />
    <NotificationModal isOpen={notification !== null} variant={notification?.variant ?? 'success'} title={notification?.title ?? ''} message={notification?.message ?? ''} onPrimary={() => setNotification(null)} onClose={() => setNotification(null)} />
  </div>;
}
