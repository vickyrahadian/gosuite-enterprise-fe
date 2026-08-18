import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { FormModal } from '../../components/FormModal';
import { IconButton } from '../../components/IconButton';
import { NotificationModal, type NotificationVariant } from '../../components/NotificationModal';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { ApiRequestError } from '../../services/api';
import { menuService } from './menuService';
import type { Menu, MenuForm, MenuPayload, MenuType } from './types';

type Notice = { variant: NotificationVariant; title: string; message: string };
const emptyForm: MenuForm = { menuKey: '', parentId: '', label: '', icon: '', page: '', menuType: 'PAGE', sortOrder: '0', active: 'Y' };

function getErrorMessage(error: unknown) {
  if (!(error instanceof ApiRequestError)) return 'Unable to connect to the backend. Check the API address and server connection.';
  if (error.status === 409) return error.message || 'The menu cannot be changed because it conflicts with another menu or is still in use.';
  if (error.status === 404) return error.message || 'The menu or selected parent was not found.';
  return error.message || 'The menu data is invalid.';
}

function formatMenuLabel(menu: Menu, menus: Menu[]) {
  let depth = 0;
  let parentId = menu.parentId;
  const seen = new Set<number>();
  while (parentId !== null && !seen.has(parentId)) {
    seen.add(parentId);
    depth += 1;
    parentId = menus.find((item) => item.id === parentId)?.parentId ?? null;
  }
  return `${'— '.repeat(depth)}${menu.label}`;
}

function validateForm(form: MenuForm, editing: Menu | null): string | null {
  if (!form.menuKey.trim()) return 'Menu key is required.';
  if (form.menuKey.trim().length > 100) return 'Menu key must be at most 100 characters.';
  if (!form.label.trim()) return 'Label is required.';
  if (form.label.trim().length > 150) return 'Label must be at most 150 characters.';
  if (form.icon.trim().length > 100) return 'Icon must be at most 100 characters.';
  if (form.page.trim().length > 150) return 'Page must be at most 150 characters.';
  if (!['GROUP', 'PAGE'].includes(form.menuType)) return 'Menu type must be GROUP or PAGE.';
  if (form.parentId && Number(form.parentId) === editing?.id) return 'A menu cannot be its own parent.';
  if (form.sortOrder.trim() && !Number.isInteger(Number(form.sortOrder))) return 'Sort order must be an integer.';
  return null;
}

export function MenuManagementPage() {
  useDocumentTitle('Menu Management | BNI');
  const [menus, setMenus] = useState<Menu[]>([]);
  const [search, setSearch] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [form, setForm] = useState<MenuForm>(emptyForm);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Menu | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadMenus = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    try {
      setMenus(await menuService.getAll(signal));
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setNotice({ variant: 'error', title: 'Unable to Load Menus', message: getErrorMessage(error) });
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadMenus(controller.signal);
    return () => controller.abort();
  }, [loadMenus]);

  const parentOptions = useMemo(() => menus.filter((menu) => menu.menuType === 'GROUP' && menu.id !== editingMenu?.id).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.label.localeCompare(b.label)), [editingMenu, menus]);
  const filteredMenus = activeSearch ? menus.filter((menu) => `${menu.menuKey} ${menu.label} ${menu.page ?? ''}`.toLowerCase().includes(activeSearch.toLowerCase())) : menus;

  const openAdd = () => { setEditingMenu(null); setForm(emptyForm); setNotice(null); setIsFormOpen(true); };
  const openEdit = (menu: Menu) => { setEditingMenu(menu); setForm({ menuKey: menu.menuKey, parentId: menu.parentId === null ? '' : String(menu.parentId), label: menu.label, icon: menu.icon ?? '', page: menu.page ?? '', menuType: menu.menuType, sortOrder: String(menu.sortOrder ?? 0), active: menu.active }); setNotice(null); setIsFormOpen(true); };
  const closeForm = () => { setIsFormOpen(false); setEditingMenu(null); setForm(emptyForm); };
  const updateField = <K extends keyof MenuForm>(field: K, value: MenuForm[K]) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateForm(form, editingMenu);
    if (validationError) { setNotice({ variant: 'error', title: 'Invalid Menu', message: validationError }); return; }
    const payload: MenuPayload = { menuKey: form.menuKey.trim(), parentId: form.parentId ? Number(form.parentId) : null, label: form.label.trim(), icon: form.icon.trim() || null, page: form.page.trim() || null, menuType: form.menuType, sortOrder: form.sortOrder.trim() ? Number(form.sortOrder) : 0, active: form.active };
    setIsSaving(true);
    try {
      if (editingMenu) {
        const updated = await menuService.update(editingMenu.id, payload);
        setMenus((current) => current.map((menu) => menu.id === updated.id ? updated : menu));
        setNotice({ variant: 'success', title: 'Menu Updated', message: 'The menu was updated successfully.' });
      } else {
        const created = await menuService.create(payload);
        setMenus((current) => [...current, created]);
        setNotice({ variant: 'success', title: 'Menu Created', message: 'The menu was created successfully.' });
      }
      closeForm();
    } catch (error) { setNotice({ variant: 'error', title: editingMenu ? 'Update Failed' : 'Creation Failed', message: getErrorMessage(error) }); } finally { setIsSaving(false); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await menuService.remove(deleteTarget.id);
      setMenus((current) => current.filter((menu) => menu.id !== deleteTarget.id));
      setDeleteTarget(null);
      setNotice({ variant: 'success', title: 'Menu Deleted', message: 'The menu was deleted successfully.' });
    } catch (error) { setDeleteTarget(null); setNotice({ variant: 'error', title: 'Deletion Failed', message: getErrorMessage(error) }); } finally { setIsDeleting(false); }
  };

  const columns: DataTableColumn<Menu>[] = [
    { key: 'menuKey', header: 'Menu Key', render: (menu) => menu.menuKey },
    { key: 'label', header: 'Label', render: (menu) => <span style={{ paddingLeft: `${Math.min((menu.parentId ? 1 : 0) * 14, 28)}px` }}>{formatMenuLabel(menu, menus)}</span> },
    { key: 'type', header: 'Type', render: (menu) => menu.menuType },
    { key: 'page', header: 'Page', render: (menu) => menu.page || '—' },
    { key: 'sortOrder', header: 'Order', render: (menu) => menu.sortOrder ?? 0 },
    { key: 'active', header: 'Status', render: (menu) => menu.active === 'Y' ? 'Active' : 'Inactive' },
    { key: 'actions', header: 'Actions', align: 'right', render: (menu) => <div className="row-actions"><IconButton label={`Edit ${menu.label}`} type="button" onClick={() => openEdit(menu)} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 20h4l11-11-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></svg>} /><IconButton label={`Delete ${menu.label}`} variant="danger" type="button" onClick={() => setDeleteTarget(menu)} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" /></svg>} /></div> },
  ];

  return <div className="crud-page menu-management-page">
    <header className="page-header"><p>System Management</p><h1>Menu Management</h1></header>
    <section className="management-card" aria-labelledby="menu-search-title"><div className="section-heading"><h2 id="menu-search-title">Search Menus</h2></div><form className="search-form" onSubmit={(event) => { event.preventDefault(); setActiveSearch(search.trim()); }}><label htmlFor="menu-search">Menu key, label, or page</label><div className="search-form__controls"><input id="menu-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search menus" /><IconButton className="icon-button--primary search-form__icon-button" label="Search menus" type="submit" icon={<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 4.5 4.5" /></svg>} /><IconButton className="search-form__icon-button" label="Clear search" type="button" onClick={() => { setSearch(''); setActiveSearch(''); }} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m4 15 8-9 7 6-7 8H8l-4-3Z" /><path d="m9 12 6 5M12 20h8" /></svg>} /></div></form></section>
    <section className="management-card" aria-labelledby="menu-list-title"><div className="section-heading"><h2 id="menu-list-title">Menu List</h2><div className="section-heading__actions"><span>{filteredMenus.length} {filteredMenus.length === 1 ? 'menu' : 'menus'}</span><IconButton label="Refresh menus" type="button" onClick={() => void loadMenus()} disabled={isLoading} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 7v5h-5" /><path d="M18.2 16a8 8 0 1 1 .8-9l1 5" /></svg>} /><IconButton className="icon-button--primary" label="Add menu" type="button" onClick={openAdd} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>} /></div></div><DataTable rows={filteredMenus} columns={columns} getRowKey={(menu) => menu.id} ariaLabel="Menu list" isLoading={isLoading} loadingMessage="Loading menus..." emptyMessage="No menus found." disablePagination /></section>
    <FormModal isOpen={isFormOpen} title={editingMenu ? 'Edit Menu' : 'Add Menu'} submitLabel={editingMenu ? 'Save Changes' : 'Add Menu'} isSubmitting={isSaving} onSubmit={handleSubmit} onClose={closeForm}><div className="form-grid"><div className="form-field"><label htmlFor="menu-key">Menu key</label><input id="menu-key" value={form.menuKey} maxLength={100} onChange={(event) => updateField('menuKey', event.target.value)} autoFocus /></div><div className="form-field"><label htmlFor="menu-label">Label</label><input id="menu-label" value={form.label} maxLength={150} onChange={(event) => updateField('label', event.target.value)} /></div><div className="form-field"><label htmlFor="menu-type">Menu type</label><select id="menu-type" value={form.menuType} onChange={(event) => updateField('menuType', event.target.value as MenuType)}><option value="GROUP">GROUP</option><option value="PAGE">PAGE</option></select></div><div className="form-field"><label htmlFor="menu-parent">Parent menu</label><select id="menu-parent" value={form.parentId} onChange={(event) => updateField('parentId', event.target.value)}><option value="">Root menu</option>{parentOptions.map((menu) => <option value={menu.id} key={menu.id}>{formatMenuLabel(menu, menus)}</option>)}</select></div><div className="form-field"><label htmlFor="menu-page">Page identifier</label><input id="menu-page" value={form.page} maxLength={150} onChange={(event) => updateField('page', event.target.value)} placeholder="Example: users" /></div><div className="form-field"><label htmlFor="menu-icon">Icon</label><input id="menu-icon" value={form.icon} maxLength={100} onChange={(event) => updateField('icon', event.target.value)} placeholder="Example: ⚙ or settings" /></div><div className="form-field"><label htmlFor="menu-sort-order">Sort order</label><input id="menu-sort-order" type="number" step="1" value={form.sortOrder} onChange={(event) => updateField('sortOrder', event.target.value)} /></div><div className="form-field"><label htmlFor="menu-active">Status</label><select id="menu-active" value={form.active} onChange={(event) => updateField('active', event.target.value as 'Y' | 'N')}><option value="Y">Active</option><option value="N">Inactive</option></select></div></div></FormModal>
    <NotificationModal isOpen={deleteTarget !== null} variant="confirm" title="Delete Menu" message={`Are you sure you want to delete "${deleteTarget?.label ?? ''}"? Menus with children or group mappings cannot be deleted.`} primaryLabel="Delete" secondaryLabel="Cancel" isProcessing={isDeleting} onPrimary={() => void confirmDelete()} onClose={() => setDeleteTarget(null)} /><NotificationModal isOpen={notice !== null} variant={notice?.variant ?? 'success'} title={notice?.title ?? ''} message={notice?.message ?? ''} onPrimary={() => setNotice(null)} onClose={() => setNotice(null)} />
  </div>;
}
