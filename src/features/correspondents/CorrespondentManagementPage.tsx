import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { DataTable, DEFAULT_PAGE_SIZE, type DataTableColumn } from '../../components/DataTable';
import { FormModal } from '../../components/FormModal';
import { IconButton } from '../../components/IconButton';
import { NotificationModal, type NotificationVariant } from '../../components/NotificationModal';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { ApiRequestError } from '../../services/api';
import { correspondentService } from './correspondentService';
import type { BankCorrespondent, BankCorrespondentPayload } from './types';

type CorrespondentForm = Record<keyof BankCorrespondentPayload, string>;
type Notification = { variant: NotificationVariant; title: string; message: string };
type SearchForm = { bic: string; name: string };

const emptyForm: CorrespondentForm = { bicCode: '', bicName: '', address1: '', address2: '', address3: '', city: '', country: '', accountNumber: '' };
const emptySearch: SearchForm = { bic: '', name: '' };
const fieldLimits: Record<keyof CorrespondentForm, number> = { bicCode: 11, bicName: 200, address1: 200, address2: 200, address3: 200, city: 100, country: 100, accountNumber: 100 };

function getErrorMessage(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.code === 'BANK_CORRESPONDENT_BIC_CONFLICT') return error.message || 'The BIC code is already in use.';
    if (error.code === 'BANK_CORRESPONDENT_IN_USE') return error.message || 'This correspondent is still in use and cannot be deleted.';
    if (error.status === 404) return 'Bank correspondent not found. Please refresh the data.';
    if (error.status === 400) return error.message || Object.values(error.validationErrors ?? {})[0] || 'The correspondent data is invalid.';
    return error.message;
  }
  return 'Unable to connect to the backend. Check the API address and server connection.';
}

function toForm(item: BankCorrespondent): CorrespondentForm {
  return { bicCode: item.bicCode, bicName: item.bicName ?? '', address1: item.address1 ?? '', address2: item.address2 ?? '', address3: item.address3 ?? '', city: item.city ?? '', country: item.country ?? '', accountNumber: item.accountNumber ?? '' };
}

function toPayload(form: CorrespondentForm): BankCorrespondentPayload {
  const optional = (value: string) => value.trim() || null;
  return { bicCode: form.bicCode.trim().toUpperCase(), bicName: optional(form.bicName), address1: optional(form.address1), address2: optional(form.address2), address3: optional(form.address3), city: optional(form.city), country: optional(form.country), accountNumber: optional(form.accountNumber) };
}

export function CorrespondentManagementPage() {
  useDocumentTitle('Correspondent Parameters | BNI');
  const [items, setItems] = useState<BankCorrespondent[]>([]);
  const [search, setSearch] = useState<SearchForm>(emptySearch);
  const [activeSearch, setActiveSearch] = useState<SearchForm>(emptySearch);
  const [form, setForm] = useState<CorrespondentForm>(emptyForm);
  const [editing, setEditing] = useState<BankCorrespondent | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BankCorrespondent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const loadItems = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    try {
      const result = await correspondentService.getAll({ bic: activeSearch.bic.trim(), name: activeSearch.name.trim(), page, size, sort: 'id,asc' }, signal);
      setItems(result.content); setPage(result.number); setSize(result.size); setTotalElements(result.totalElements); setTotalPages(result.totalPages);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) setNotification({ variant: 'error', title: 'Unable to Load Correspondents', message: getErrorMessage(error) });
    } finally { if (!signal?.aborted) setIsLoading(false); }
  }, [activeSearch, page, size]);

  useEffect(() => { const controller = new AbortController(); void loadItems(controller.signal); return () => controller.abort(); }, [loadItems]);

  const closeForm = () => { setIsFormOpen(false); setEditing(null); setForm(emptyForm); };
  const openAddForm = () => { setEditing(null); setForm(emptyForm); setNotification(null); setIsFormOpen(true); };
  const openEditForm = (item: BankCorrespondent) => { setEditing(item); setForm(toForm(item)); setNotification(null); setIsFormOpen(true); };
  const updateForm = (field: keyof CorrespondentForm, value: string) => setForm((current) => ({ ...current, [field]: field === 'bicCode' ? value.toUpperCase() : value }));
  const applySearch = (event: FormEvent) => { event.preventDefault(); setPage(0); setActiveSearch({ bic: search.bic.trim(), name: search.name.trim() }); };
  const clearSearch = () => { setSearch(emptySearch); setPage(0); setActiveSearch(emptySearch); };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const bic = form.bicCode.trim();
    if (!/^(?:[A-Za-z0-9]{8}|[A-Za-z0-9]{11})$/.test(bic)) {
      setNotification({ variant: 'error', title: 'Invalid BIC', message: 'BIC code must contain exactly 8 or 11 letters and numbers.' }); return;
    }
    setIsSaving(true);
    try {
      if (editing) await correspondentService.update(editing.id, toPayload(form)); else await correspondentService.create(toPayload(form));
      closeForm();
      setNotification({ variant: 'success', title: editing ? 'Correspondent Updated' : 'Correspondent Created', message: `The bank correspondent was ${editing ? 'updated' : 'created'} successfully.` });
      await loadItems();
    } catch (error) { setNotification({ variant: 'error', title: editing ? 'Update Failed' : 'Creation Failed', message: getErrorMessage(error) }); }
    finally { setIsSaving(false); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try { await correspondentService.remove(deleteTarget.id); setDeleteTarget(null); setNotification({ variant: 'success', title: 'Correspondent Deleted', message: 'The bank correspondent was deleted successfully.' }); await loadItems(); }
    catch (error) { setDeleteTarget(null); setNotification({ variant: 'error', title: 'Deletion Failed', message: getErrorMessage(error) }); }
    finally { setIsDeleting(false); }
  };

  const columns: DataTableColumn<BankCorrespondent>[] = [
    { key: 'bicCode', header: 'BIC Code', render: (item) => item.bicCode },
    { key: 'bicName', header: 'Bank Name', render: (item) => item.bicName || '—' },
    { key: 'city', header: 'City', render: (item) => item.city || '—' },
    { key: 'country', header: 'Country', render: (item) => item.country || '—' },
    { key: 'accountNumber', header: 'Account Number', render: (item) => item.accountNumber || '—' },
    { key: 'actions', header: 'Actions', align: 'right', render: (item) => <div className="row-actions"><IconButton label={`Edit ${item.bicCode}`} type="button" onClick={() => openEditForm(item)} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 20h4l11-11-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></svg>} /><IconButton label={`Delete ${item.bicCode}`} variant="danger" type="button" onClick={() => setDeleteTarget(item)} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"/></svg>} /></div> },
  ];

  return <div className="crud-page correspondent-management-page">
    <header className="page-header"><p>Parameter Management</p><h1>Bank Correspondents</h1></header>
    <section className="management-card" aria-labelledby="correspondent-search-title"><div className="section-heading"><h2 id="correspondent-search-title">Search Correspondents</h2></div><form className="correspondent-search-grid" onSubmit={applySearch}><div className="form-field"><label htmlFor="correspondent-bic-search">BIC code</label><input id="correspondent-bic-search" value={search.bic} onChange={(event) => setSearch((current) => ({ ...current, bic: event.target.value }))} maxLength={11} placeholder="Example: CHAS" /></div><div className="form-field"><label htmlFor="correspondent-name-search">Bank name</label><input id="correspondent-name-search" value={search.name} onChange={(event) => setSearch((current) => ({ ...current, name: event.target.value }))} maxLength={200} placeholder="Example: Chase" /></div><div className="correspondent-search-actions"><IconButton className="icon-button--primary search-form__icon-button" label="Search correspondents" type="submit" disabled={isLoading} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 4.5 4.5"/></svg>} /><IconButton className="search-form__icon-button" label="Clear search" type="button" onClick={clearSearch} disabled={isLoading && !search.bic && !search.name} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m4 15 8-9 7 6-7 8H8l-4-3Z"/><path d="m9 12 6 5M12 20h8"/></svg>} /></div></form></section>
    <section className="management-card" aria-labelledby="correspondent-list-title"><div className="section-heading"><h2 id="correspondent-list-title">Correspondent List</h2><div className="section-heading__actions"><span>{totalElements} {totalElements === 1 ? 'correspondent' : 'correspondents'}</span><IconButton label="Refresh correspondents" type="button" onClick={() => void loadItems()} disabled={isLoading} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 7v5h-5"/><path d="M18.2 16a8 8 0 1 1 .8-9l1 5"/></svg>} /><IconButton className="icon-button--primary" label="Add Correspondent" type="button" onClick={openAddForm} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>} /></div></div><DataTable rows={items} columns={columns} getRowKey={(item) => item.id} ariaLabel="Bank correspondent list" isLoading={isLoading} loadingMessage="Loading correspondents..." emptyMessage="No correspondents found." serverPagination={{ currentPage: page + 1, totalPages, totalRows: totalElements, pageSize: size, onPageChange: (next) => setPage(next - 1), onPageSizeChange: (next) => { setSize(next); setPage(0); } }} /></section>
    <FormModal isOpen={isFormOpen} title={editing ? 'Edit Correspondent' : 'Add Correspondent'} submitLabel={editing ? 'Save Changes' : 'Add Correspondent'} isSubmitting={isSaving} onSubmit={save} onClose={closeForm}><div className="form-grid correspondent-form-grid">{([['bicCode', 'BIC code'], ['bicName', 'Bank name'], ['address1', 'Address 1'], ['address2', 'Address 2'], ['address3', 'Address 3'], ['city', 'City'], ['country', 'Country'], ['accountNumber', 'Account number']] as [keyof CorrespondentForm, string][]).map(([field, label]) => <div className="form-field" key={field}><label htmlFor={`correspondent-${field}`}>{label}{field !== 'bicCode' && <span className="optional-label"> (optional)</span>}</label><input id={`correspondent-${field}`} value={form[field]} onChange={(event) => updateForm(field, event.target.value)} maxLength={fieldLimits[field]} required={field === 'bicCode'} autoFocus={field === 'bicCode'} disabled={isSaving} autoComplete="off" />{field === 'bicCode' && <small>Exactly 8 or 11 letters and numbers. BIC-8 is stored with XXX.</small>}</div>)}</div></FormModal>
    <NotificationModal isOpen={deleteTarget !== null} variant="confirm" title="Delete Correspondent" message={`Are you sure you want to delete correspondent "${deleteTarget?.bicCode ?? ''}"?`} primaryLabel="Delete" secondaryLabel="Cancel" isProcessing={isDeleting} onPrimary={() => void confirmDelete()} onClose={() => setDeleteTarget(null)} />
    <NotificationModal isOpen={notification !== null} variant={notification?.variant ?? 'success'} title={notification?.title ?? ''} message={notification?.message ?? ''} onPrimary={() => setNotification(null)} onClose={() => setNotification(null)} />
  </div>;
}
