import { useCallback, useEffect, useMemo, useState } from 'react';
import { IconButton } from '../../components/IconButton';
import { NotificationModal, type NotificationVariant } from '../../components/NotificationModal';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { ApiRequestError } from '../../services/api';
import { groupService } from '../groups/groupService';
import type { Group } from '../groups/types';
import { menuService } from '../menus/menuService';
import type { Menu } from '../menus/types';
import { menuGroupService } from './menuGroupService';
import type { MenuPermission, MenuPermissionPayload } from './types';

type Notice = { variant: NotificationVariant; title: string; message: string };
type PermissionState = Pick<MenuPermission, 'canView' | 'canCreate' | 'canEdit' | 'canDelete'>;

function getErrorMessage(error: unknown) {
  if (!(error instanceof ApiRequestError)) return 'Unable to connect to the backend. Check the API address and server connection.';
  return error.message || 'Unable to update group permissions.';
}

function flattenMenus(menus: Menu[], depth = 0): Array<{ menu: Menu; depth: number }> {
  return menus.flatMap((menu) => [{ menu, depth }, ...flattenMenus(menu.children ?? [], depth + 1)]);
}

function emptyPermission(): PermissionState {
  return { canView: false, canCreate: false, canEdit: false, canDelete: false };
}

export function MenuGroupManagementPage() {
  useDocumentTitle('Menu Group Management | BNI');
  const [groups, setGroups] = useState<Group[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [permissions, setPermissions] = useState<Record<number, PermissionState>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const loadBaseData = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    try {
      const [groupData, menuTree] = await Promise.all([groupService.getAll(signal), menuService.getTree(signal)]);
      setGroups(groupData);
      setMenus(menuTree);
      if (groupData.length > 0) setSelectedGroupId((current) => current || String(groupData[0].id));
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setNotice({ variant: 'error', title: 'Unable to Load Permission Setup', message: getErrorMessage(error) });
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  const loadPermissions = useCallback(async (groupId: number, signal?: AbortSignal) => {
    setIsLoading(true);
    try {
      const assigned = await menuGroupService.getPermissions(groupId, signal);
      const next: Record<number, PermissionState> = {};
      assigned.forEach((permission) => {
        next[permission.menuId] = {
          canView: permission.canView,
          canCreate: permission.canCreate,
          canEdit: permission.canEdit,
          canDelete: permission.canDelete,
        };
      });
      setPermissions(next);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setPermissions({});
      setNotice({ variant: 'error', title: 'Unable to Load Permissions', message: getErrorMessage(error) });
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadBaseData(controller.signal);
    return () => controller.abort();
  }, [loadBaseData]);

  useEffect(() => {
    if (!selectedGroupId) {
      setPermissions({});
      return;
    }
    const controller = new AbortController();
    void loadPermissions(Number(selectedGroupId), controller.signal);
    return () => controller.abort();
  }, [loadPermissions, selectedGroupId]);

  const flatMenus = useMemo(() => flattenMenus(menus), [menus]);

  const updatePermission = (menuId: number, field: keyof PermissionState, checked: boolean) => {
    setPermissions((current) => ({ ...current, [menuId]: { ...(current[menuId] ?? emptyPermission()), [field]: checked } }));
  };

  const savePermissions = async () => {
    if (!selectedGroupId) return;
    const payload: MenuPermissionPayload[] = flatMenus
      .map(({ menu }) => ({ menuId: menu.id, ...(permissions[menu.id] ?? emptyPermission()) }))
      .filter((permission) => permission.canView || permission.canCreate || permission.canEdit || permission.canDelete);
    setIsSaving(true);
    setNotice(null);
    try {
      await menuGroupService.replacePermissions(Number(selectedGroupId), payload);
      setNotice({ variant: 'success', title: 'Permissions Saved', message: 'Group menu permissions were updated successfully.' });
    } catch (error) {
      setNotice({ variant: 'error', title: 'Save Failed', message: getErrorMessage(error) });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="crud-page menu-group-management-page">
      <header className="page-header"><p>System Management</p><h1>Menu Group Management</h1></header>
      <section className="management-card" aria-labelledby="permission-group-title">
        <div className="section-heading"><h2 id="permission-group-title">Select Group</h2></div>
        <div className="permission-group-selector">
          <label htmlFor="permission-group">Group</label>
          <select id="permission-group" value={selectedGroupId} onChange={(event) => setSelectedGroupId(event.target.value)} disabled={isLoading || isSaving}>
            <option value="">Select a group</option>
            {groups.map((group) => <option value={group.id} key={group.id}>{group.groupName}</option>)}
          </select>
        </div>
      </section>
      <section className="management-card" aria-labelledby="permission-matrix-title">
        <div className="section-heading"><h2 id="permission-matrix-title">Menu Permissions</h2><div className="section-heading__actions"><IconButton label="Refresh permissions" type="button" onClick={() => selectedGroupId && void loadPermissions(Number(selectedGroupId))} disabled={isLoading || isSaving || !selectedGroupId} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 7v5h-5" /><path d="M18.2 16a8 8 0 1 1 .8-9l1 5" /></svg>} /><IconButton className="icon-button--primary" label={isSaving ? 'Saving permissions' : 'Save permissions'} type="button" onClick={() => void savePermissions()} disabled={isLoading || isSaving || !selectedGroupId} icon={<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 3h12l2 2v16H5V3Z"/><path d="M8 3v6h8V3M8 21v-7h8v7"/></svg>} /></div></div>
        <div className="permission-table-wrapper">
          <table className="permission-table"><thead><tr><th>Menu</th><th>View</th><th>Create</th><th>Edit</th><th>Delete</th></tr></thead><tbody>{isLoading ? <tr><td className="table-message" colSpan={5}>Loading permissions...</td></tr> : flatMenus.length === 0 ? <tr><td className="table-message" colSpan={5}>No menus found.</td></tr> : flatMenus.map(({ menu, depth }) => { const state = permissions[menu.id] ?? emptyPermission(); return <tr key={menu.id}><td><span className={`permission-menu-label permission-menu-label--${menu.menuType.toLowerCase()}`} style={{ paddingLeft: `${depth * 24}px` }}>{menu.label}<small>{menu.menuKey}</small></span></td><td><input aria-label={`View ${menu.label}`} type="checkbox" checked={state.canView} onChange={(event) => updatePermission(menu.id, 'canView', event.target.checked)} disabled={isSaving || !selectedGroupId} /></td><td><input aria-label={`Create ${menu.label}`} type="checkbox" checked={state.canCreate} onChange={(event) => updatePermission(menu.id, 'canCreate', event.target.checked)} disabled={isSaving || !selectedGroupId} /></td><td><input aria-label={`Edit ${menu.label}`} type="checkbox" checked={state.canEdit} onChange={(event) => updatePermission(menu.id, 'canEdit', event.target.checked)} disabled={isSaving || !selectedGroupId} /></td><td><input aria-label={`Delete ${menu.label}`} type="checkbox" checked={state.canDelete} onChange={(event) => updatePermission(menu.id, 'canDelete', event.target.checked)} disabled={isSaving || !selectedGroupId} /></td></tr>; })}</tbody></table>
        </div>
      </section>
      <NotificationModal isOpen={notice !== null} variant={notice?.variant ?? 'success'} title={notice?.title ?? ''} message={notice?.message ?? ''} onPrimary={() => setNotice(null)} onClose={() => setNotice(null)} />
    </div>
  );
}
