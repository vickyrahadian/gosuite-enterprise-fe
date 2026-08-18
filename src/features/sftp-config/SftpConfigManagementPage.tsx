import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { DataTable, DEFAULT_PAGE_SIZE, type DataTableColumn } from '../../components/DataTable';
import { FormModal } from '../../components/FormModal';
import { IconButton } from '../../components/IconButton';
import { NotificationModal, type NotificationVariant } from '../../components/NotificationModal';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { ApiRequestError } from '../../services/api';
import { sftpConfigService } from './sftpConfigService';
import type { SftpAuthType, SftpConfig, SftpConfigPayload, SftpDirection, YesNo } from './types';

type FormState = {
  name: string; host: string; port: string; authType: SftpAuthType; username: string; password: string;
  keyLocation: string; direction: SftpDirection; remotePath: string; localPath: string; fileRegex: string;
  archiveEnabled: YesNo; maxFiles: string; isActive: YesNo;
};
type Notification = { variant: NotificationVariant; title: string; message: string };

const emptyForm: FormState = { name: '', host: '', port: '22', authType: 'PASSWORD', username: '', password: '', keyLocation: '', direction: 'DOWNLOAD', remotePath: '', localPath: '', fileRegex: '', archiveEnabled: 'N', maxFiles: '20', isActive: 'Y' };

function toForm(config: SftpConfig): FormState {
  return { name: config.name, host: config.host, port: String(config.port), authType: config.authType, username: config.username, password: '', keyLocation: config.keyLocation ?? '', direction: config.direction, remotePath: config.remotePath, localPath: config.localPath, fileRegex: config.fileRegex ?? '', archiveEnabled: config.archiveEnabled, maxFiles: String(config.maxFiles), isActive: config.isActive };
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.code === 'SFTP_PASSWORD_REQUIRED') return 'A password is required for password authentication.';
    if (error.code === 'SFTP_KEY_LOCATION_REQUIRED') return 'A key location is required for key authentication.';
    if (error.code === 'SFTP_CONFIG_IN_USE') return error.message || 'This configuration is referenced by an audit log and cannot be deleted.';
    if (error.status === 409) return error.message || 'The SFTP configuration conflicts with existing data.';
    if (error.status === 404) return 'SFTP configuration not found. Please refresh the data.';
    if (error.status === 400) return error.message || Object.values(error.validationErrors ?? {})[0] || 'The SFTP configuration is invalid.';
    return error.message;
  }
  return 'Unable to connect to the backend. Check the API address and server connection.';
}

export function SftpConfigManagementPage() {
  useDocumentTitle('SFTP Config | BNI');
  const [items, setItems] = useState<SftpConfig[]>([]);
  const [searchName, setSearchName] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState<SftpConfig | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SftpConfig | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const loadItems = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    try {
      const result = await sftpConfigService.getAll({ name: activeSearch, page, size, sort: 'id,asc' }, signal);
      setItems(result.content); setPage(result.number); setSize(result.size); setTotalElements(result.totalElements); setTotalPages(result.totalPages);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) setNotification({ variant: 'error', title: 'Unable to Load SFTP Configs', message: getErrorMessage(error) });
    } finally { if (!signal?.aborted) setIsLoading(false); }
  }, [activeSearch, page, size]);

  useEffect(() => { const controller = new AbortController(); void loadItems(controller.signal); return () => controller.abort(); }, [loadItems]);

  const update = (field: keyof FormState, value: string) => setForm((current) => ({ ...current, [field]: value } as FormState));
  const closeForm = () => { setIsFormOpen(false); setEditing(null); setForm(emptyForm); };
  const openAdd = () => { setEditing(null); setForm(emptyForm); setNotification(null); setIsFormOpen(true); };
  const openEdit = (config: SftpConfig) => { setEditing(config); setForm(toForm(config)); setNotification(null); setIsFormOpen(true); };
  const applySearch = (event: FormEvent) => { event.preventDefault(); setPage(0); setActiveSearch(searchName.trim()); };
  const clearSearch = () => { setSearchName(''); setPage(0); setActiveSearch(''); };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const port = Number(form.port); const maxFiles = Number(form.maxFiles);
    if (!Number.isInteger(port) || port < 1 || port > 65535) { setNotification({ variant: 'error', title: 'Invalid Port', message: 'Port must be between 1 and 65535.' }); return; }
    if (!Number.isInteger(maxFiles) || maxFiles < 1) { setNotification({ variant: 'error', title: 'Invalid Max Files', message: 'Max files must be at least 1.' }); return; }
    if (form.authType === 'PASSWORD' && !editing?.passwordConfigured && !form.password) { setNotification({ variant: 'error', title: 'Password Required', message: 'Password is required for password authentication.' }); return; }
    if (form.authType === 'KEY' && !form.keyLocation.trim()) { setNotification({ variant: 'error', title: 'Key Location Required', message: 'Key location is required for key authentication.' }); return; }
    const payload: SftpConfigPayload = { name: form.name.trim(), host: form.host.trim(), port, authType: form.authType, username: form.username.trim(), password: form.authType === 'PASSWORD' ? form.password || null : null, keyLocation: form.authType === 'KEY' ? form.keyLocation.trim() : null, direction: form.direction, remotePath: form.remotePath.trim(), localPath: form.localPath.trim(), fileRegex: form.fileRegex.trim() || null, archiveEnabled: form.archiveEnabled, maxFiles, isActive: form.isActive };
    setIsSaving(true);
    try {
      if (editing) await sftpConfigService.update(editing.id, payload); else await sftpConfigService.create(payload);
      const wasEditing = Boolean(editing); closeForm();
      setNotification({ variant: 'success', title: wasEditing ? 'SFTP Config Updated' : 'SFTP Config Created', message: `The SFTP configuration was ${wasEditing ? 'updated' : 'created'} successfully.` });
      await loadItems();
    } catch (error) { setNotification({ variant: 'error', title: editing ? 'Update Failed' : 'Creation Failed', message: getErrorMessage(error) }); }
    finally { setIsSaving(false); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try { await sftpConfigService.remove(deleteTarget.id); setDeleteTarget(null); setNotification({ variant: 'success', title: 'SFTP Config Deleted', message: 'The SFTP configuration was deleted successfully.' }); await loadItems(); }
    catch (error) { setDeleteTarget(null); setNotification({ variant: 'error', title: 'Deletion Failed', message: getErrorMessage(error) }); }
    finally { setIsDeleting(false); }
  };

  const columns: DataTableColumn<SftpConfig>[] = [
    { key: 'name', header: 'Name', render: (item) => item.name },
    { key: 'host', header: 'Host', render: (item) => `${item.host}:${item.port}` },
    { key: 'direction', header: 'Direction', render: (item) => item.direction },
    { key: 'authType', header: 'Auth', render: (item) => item.authType },
    { key: 'remotePath', header: 'Remote Path', render: (item) => item.remotePath },
    { key: 'active', header: 'Active', render: (item) => item.isActive === 'Y' ? 'Yes' : 'No' },
    { key: 'actions', header: 'Actions', align: 'right', render: (item) => <div className="row-actions"><IconButton label={`Edit ${item.name}`} type="button" onClick={() => openEdit(item)} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 20h4l11-11-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></svg>} /><IconButton label={`Delete ${item.name}`} variant="danger" type="button" onClick={() => setDeleteTarget(item)} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"/></svg>} /></div> },
  ];

  return <div className="crud-page sftp-config-page">
    <header className="page-header"><p>SFTP</p><h1>SFTP Configuration</h1></header>
    <section className="management-card" aria-labelledby="sftp-search-title"><div className="section-heading"><h2 id="sftp-search-title">Search Configurations</h2></div><form className="search-form" onSubmit={applySearch}><label htmlFor="sftp-config-search">Name</label><div className="search-form__controls"><input id="sftp-config-search" type="search" value={searchName} onChange={(event) => setSearchName(event.target.value)} maxLength={100} placeholder="Search by configuration name" autoComplete="off" /><IconButton className="icon-button--primary search-form__icon-button" label="Search SFTP configs" type="submit" disabled={isLoading} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 4.5 4.5"/></svg>} /><IconButton className="search-form__icon-button" label="Clear search" type="button" onClick={clearSearch} disabled={isLoading && !searchName} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m4 15 8-9 7 6-7 8H8l-4-3Z"/><path d="m9 12 6 5M12 20h8"/></svg>} /></div></form></section>
    <section className="management-card" aria-labelledby="sftp-list-title"><div className="section-heading"><h2 id="sftp-list-title">Configuration List</h2><div className="section-heading__actions"><span>{totalElements} {totalElements === 1 ? 'configuration' : 'configurations'}</span><IconButton label="Refresh SFTP configs" type="button" onClick={() => void loadItems()} disabled={isLoading} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 7v5h-5"/><path d="M18.2 16a8 8 0 1 1 .8-9l1 5"/></svg>} /><IconButton className="icon-button--primary" label="Add SFTP Config" type="button" onClick={openAdd} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>} /></div></div><DataTable rows={items} columns={columns} getRowKey={(item) => item.id} ariaLabel="SFTP configuration list" isLoading={isLoading} loadingMessage="Loading SFTP configurations..." emptyMessage="No SFTP configurations found." serverPagination={{ currentPage: page + 1, totalPages, totalRows: totalElements, pageSize: size, onPageChange: (next) => setPage(next - 1), onPageSizeChange: (next) => { setSize(next); setPage(0); } }} /></section>
    <FormModal isOpen={isFormOpen} title={editing ? 'Edit SFTP Configuration' : 'Add SFTP Configuration'} submitLabel={editing ? 'Save Changes' : 'Add Configuration'} isSubmitting={isSaving} onSubmit={save} onClose={closeForm}><div className="form-grid sftp-config-form-grid">
      <div className="form-field"><label htmlFor="sftp-name">Name</label><input id="sftp-name" value={form.name} onChange={(e) => update('name', e.target.value)} maxLength={100} required autoFocus disabled={isSaving}/></div>
      <div className="form-field"><label htmlFor="sftp-host">Host</label><input id="sftp-host" value={form.host} onChange={(e) => update('host', e.target.value)} maxLength={255} required disabled={isSaving}/></div>
      <div className="form-field"><label htmlFor="sftp-port">Port</label><input id="sftp-port" type="number" min="1" max="65535" value={form.port} onChange={(e) => update('port', e.target.value)} required disabled={isSaving}/></div>
      <div className="form-field"><label htmlFor="sftp-direction">Direction</label><select id="sftp-direction" value={form.direction} onChange={(e) => update('direction', e.target.value)} disabled={isSaving}><option value="DOWNLOAD">DOWNLOAD</option><option value="UPLOAD">UPLOAD</option></select></div>
      <div className="form-field"><label htmlFor="sftp-auth-type">Authentication</label><select id="sftp-auth-type" value={form.authType} onChange={(e) => update('authType', e.target.value)} disabled={isSaving}><option value="PASSWORD">PASSWORD</option><option value="KEY">KEY</option></select></div>
      <div className="form-field"><label htmlFor="sftp-username">Username</label><input id="sftp-username" value={form.username} onChange={(e) => update('username', e.target.value)} maxLength={100} required disabled={isSaving}/></div>
      {form.authType === 'PASSWORD' ? <div className="form-field sftp-config-form-grid__wide"><label htmlFor="sftp-password">Password{editing?.passwordConfigured && <span className="optional-label"> (leave blank to keep existing)</span>}</label><input id="sftp-password" type="password" value={form.password} onChange={(e) => update('password', e.target.value)} required={!editing?.passwordConfigured} disabled={isSaving} autoComplete="new-password"/></div> : <div className="form-field sftp-config-form-grid__wide"><label htmlFor="sftp-key-location">Key location</label><input id="sftp-key-location" value={form.keyLocation} onChange={(e) => update('keyLocation', e.target.value)} maxLength={500} required disabled={isSaving}/></div>}
      <div className="form-field"><label htmlFor="sftp-remote-path">Remote path</label><input id="sftp-remote-path" value={form.remotePath} onChange={(e) => update('remotePath', e.target.value)} maxLength={500} required disabled={isSaving}/></div>
      <div className="form-field"><label htmlFor="sftp-local-path">Local path</label><input id="sftp-local-path" value={form.localPath} onChange={(e) => update('localPath', e.target.value)} maxLength={500} required disabled={isSaving}/></div>
      <div className="form-field sftp-config-form-grid__wide"><label htmlFor="sftp-file-regex">File regex <span className="optional-label">(optional)</span></label><input id="sftp-file-regex" value={form.fileRegex} onChange={(e) => update('fileRegex', e.target.value)} maxLength={500} disabled={isSaving}/></div>
      <div className="form-field"><label htmlFor="sftp-archive">Archive enabled</label><select id="sftp-archive" value={form.archiveEnabled} onChange={(e) => update('archiveEnabled', e.target.value)} disabled={isSaving}><option value="Y">Yes</option><option value="N">No</option></select></div>
      <div className="form-field"><label htmlFor="sftp-max-files">Max files</label><input id="sftp-max-files" type="number" min="1" value={form.maxFiles} onChange={(e) => update('maxFiles', e.target.value)} required disabled={isSaving}/></div>
      <div className="form-field"><label htmlFor="sftp-active">Active</label><select id="sftp-active" value={form.isActive} onChange={(e) => update('isActive', e.target.value)} disabled={isSaving}><option value="Y">Yes</option><option value="N">No</option></select></div>
    </div></FormModal>
    <NotificationModal isOpen={deleteTarget !== null} variant="confirm" title="Delete SFTP Configuration" message={`Are you sure you want to delete "${deleteTarget?.name ?? ''}"?`} primaryLabel="Delete" secondaryLabel="Cancel" isProcessing={isDeleting} onPrimary={() => void confirmDelete()} onClose={() => setDeleteTarget(null)}/>
    <NotificationModal isOpen={notification !== null} variant={notification?.variant ?? 'success'} title={notification?.title ?? ''} message={notification?.message ?? ''} onPrimary={() => setNotification(null)} onClose={() => setNotification(null)}/>
  </div>;
}
