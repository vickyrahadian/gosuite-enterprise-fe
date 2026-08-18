import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { FormModal } from '../../components/FormModal';
import { IconButton } from '../../components/IconButton';
import { NotificationModal, type NotificationVariant } from '../../components/NotificationModal';
import { groupService } from '../groups/groupService';
import type { Group } from '../groups/types';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { ApiRequestError } from '../../services/api';
import { userService } from './userService';
import type { User } from './types';

const MAX_USERNAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 255;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72;

type Notification = {
  variant: NotificationVariant;
  title: string;
  message: string;
};

type UserForm = {
  username: string;
  email: string;
  password: string;
  groupIds: number[];
};

const emptyForm: UserForm = { username: '', email: '', password: '', groupIds: [] };

function getErrorMessage(error: unknown) {
  if (error instanceof ApiRequestError) return error.message;
  return 'Unable to connect to the backend. Check the API address and server connection.';
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function validateForm(form: UserForm, isEditing: boolean): string | null {
  if (!form.username.trim()) return 'Username is required.';
  if (!form.email.trim()) return 'Email is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'Enter a valid email address.';
  if (!isEditing && !form.password) return 'Password is required when creating a user.';
  if (form.password && (form.password.length < MIN_PASSWORD_LENGTH || form.password.length > MAX_PASSWORD_LENGTH)) {
    return `Password must contain ${MIN_PASSWORD_LENGTH}-${MAX_PASSWORD_LENGTH} characters.`;
  }
  if (form.groupIds.length === 0) return 'Select at least one group.';
  return null;
}

export function UserManagementPage() {
  useDocumentTitle('User Management | BNI');
  const [users, setUsers] = useState<User[]>([]);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    try {
      const [userData, groupData] = await Promise.all([
        userService.getAll(signal),
        groupService.getAll(signal),
      ]);
      setUsers(userData);
      setAvailableGroups(groupData);
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
      setNotification({ variant: 'error', title: 'Unable to Load Users', message: getErrorMessage(requestError) });
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadData(controller.signal);
    return () => controller.abort();
  }, [loadData]);

  const filteredUsers = activeSearch
    ? users.filter((user) => `${user.username} ${user.email}`.toLowerCase().includes(activeSearch.toLowerCase()))
    : users;

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingUser(null);
    setForm(emptyForm);
  };

  const openAddForm = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setNotification(null);
    setIsFormOpen(true);
  };

  const openEditForm = (user: User) => {
    setEditingUser(user);
    setForm({
      username: user.username,
      email: user.email,
      password: '',
      groupIds: user.groups.map((group) => group.id),
    });
    setNotification(null);
    setIsFormOpen(true);
  };

  const toggleGroup = (groupId: number) => {
    setForm((current) => ({
      ...current,
      groupIds: current.groupIds.includes(groupId)
        ? current.groupIds.filter((id) => id !== groupId)
        : [...current.groupIds, groupId],
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotification(null);
    const validationError = validateForm(form, editingUser !== null);
    if (validationError) {
      setNotification({ variant: 'error', title: 'Invalid User', message: validationError });
      return;
    }

    const commonPayload = {
      username: form.username.trim(),
      email: form.email.trim().toLowerCase(),
      groupIds: form.groupIds,
    };

    setIsSaving(true);
    try {
      if (editingUser) {
        const updated = await userService.update(editingUser.id, {
          ...commonPayload,
          password: form.password || null,
        });
        setUsers((current) => current.map((user) => user.id === updated.id ? updated : user));
        closeForm();
        setNotification({ variant: 'success', title: 'User Updated', message: 'The user was updated successfully.' });
      } else {
        const created = await userService.create({ ...commonPayload, password: form.password });
        setUsers((current) => [...current, created]);
        closeForm();
        setNotification({ variant: 'success', title: 'User Created', message: 'The user was created successfully.' });
      }
    } catch (requestError) {
      setNotification({ variant: 'error', title: editingUser ? 'Update Failed' : 'Creation Failed', message: getErrorMessage(requestError) });
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const user = deleteTarget;
    setIsDeleting(true);
    try {
      await userService.remove(user.id);
      setUsers((current) => current.filter(({ id }) => id !== user.id));
      setDeleteTarget(null);
      setNotification({ variant: 'success', title: 'User Deleted', message: 'The user was deleted successfully.' });
    } catch (requestError) {
      setDeleteTarget(null);
      setNotification({ variant: 'error', title: 'Deletion Failed', message: getErrorMessage(requestError) });
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: DataTableColumn<User>[] = [
    { key: 'id', header: 'ID', render: (user) => user.id },
    { key: 'username', header: 'Username', render: (user) => user.username },
    { key: 'email', header: 'Email', render: (user) => user.email },
    {
      key: 'groups',
      header: 'Groups',
      render: (user) => (
        <div className="tag-list">
          {user.groups.map((group) => <span className="tag" key={group.id}>{group.groupName}</span>)}
        </div>
      ),
    },
    { key: 'created', header: 'Created', render: (user) => formatDate(user.createdAt) },
    { key: 'updated', header: 'Updated', render: (user) => formatDate(user.updatedAt) },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (user) => (
        <div className="row-actions">
          <IconButton label={`Edit ${user.username}`} type="button" onClick={() => openEditForm(user)} icon={(
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 20h4l11-11-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></svg>
          )} />
          <IconButton label={`Delete ${user.username}`} variant="danger" type="button" onClick={() => setDeleteTarget(user)} icon={(
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" /></svg>
          )} />
        </div>
      ),
    },
  ];

  return (
    <div className="crud-page user-management-page">
      <header className="page-header">
        <p>System Management</p>
        <h1>User Management</h1>
      </header>

      <section className="management-card" aria-labelledby="user-search-title">
        <div className="section-heading"><h2 id="user-search-title">Search Users</h2></div>
        <form className="search-form" onSubmit={(event) => { event.preventDefault(); setActiveSearch(searchValue.trim()); }}>
          <label htmlFor="user-search">Username or email</label>
          <div className="search-form__controls">
            <input id="user-search" type="search" value={searchValue} onChange={(event) => setSearchValue(event.target.value)} placeholder="Search by username or email" autoComplete="off" />
            <IconButton className="icon-button--primary search-form__icon-button" label="Search users" type="submit" icon={(
              <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 4.5 4.5" /></svg>
            )} />
            <IconButton className="search-form__icon-button" label="Clear search" type="button" onClick={() => { setSearchValue(''); setActiveSearch(''); }} icon={(
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m4 15 8-9 7 6-7 8H8l-4-3Z" /><path d="m9 12 6 5M12 20h8" /></svg>
            )} />
          </div>
        </form>
      </section>

      <section className="management-card" aria-labelledby="user-list-title">
        <div className="section-heading">
          <h2 id="user-list-title">User List</h2>
          <div className="section-heading__actions">
            <span>{filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}</span>
            <IconButton label="Refresh users" type="button" onClick={() => void loadData()} disabled={isLoading} icon={(
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 7v5h-5" /><path d="M18.2 16a8 8 0 1 1 .8-9l1 5" /></svg>
            )} />
            <IconButton className="icon-button--primary" label="Add User" type="button" onClick={openAddForm} icon={(
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
            )} />
          </div>
        </div>
        <DataTable rows={filteredUsers} columns={columns} getRowKey={(user) => user.id} ariaLabel="User list" isLoading={isLoading} loadingMessage="Loading users..." emptyMessage="No users found." />
      </section>

      <FormModal isOpen={isFormOpen} title={editingUser ? 'Edit User' : 'Add User'} submitLabel={editingUser ? 'Save Changes' : 'Add User'} isSubmitting={isSaving} onSubmit={handleSubmit} onClose={closeForm}>
        <div className="form-grid">
          <div className="form-field"><label htmlFor="user-username">Username</label><input id="user-username" value={form.username} onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))} maxLength={MAX_USERNAME_LENGTH} autoComplete="username" disabled={isSaving} autoFocus /></div>
          <div className="form-field"><label htmlFor="user-email">Email</label><input id="user-email" type="text" inputMode="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} maxLength={MAX_EMAIL_LENGTH} autoComplete="email" disabled={isSaving} /></div>
          <div className="form-field"><label htmlFor="user-password">Password {editingUser && <span className="optional-label">(optional)</span>}</label><input id="user-password" type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} maxLength={MAX_PASSWORD_LENGTH} autoComplete="new-password" disabled={isSaving} /><small>{editingUser ? 'Leave blank to keep the current password.' : `${MIN_PASSWORD_LENGTH}-${MAX_PASSWORD_LENGTH} characters.`}</small></div>
          <fieldset className="group-selector">
            <legend>Groups <span aria-hidden="true">*</span></legend>
            {availableGroups.length === 0 ? <p>No groups are available. Create a group first.</p> : availableGroups.map((group) => (
              <label className="group-option" key={group.id}><input type="checkbox" checked={form.groupIds.includes(group.id)} onChange={() => toggleGroup(group.id)} disabled={isSaving} /><span>{group.groupName}</span></label>
            ))}
            <small>Select at least one group.</small>
          </fieldset>
        </div>
      </FormModal>

      <NotificationModal isOpen={deleteTarget !== null} variant="confirm" title="Delete User" message={`Are you sure you want to delete "${deleteTarget?.username ?? ''}"?`} primaryLabel="Delete" secondaryLabel="Cancel" isProcessing={isDeleting} onPrimary={() => void confirmDelete()} onClose={() => setDeleteTarget(null)} />
      <NotificationModal isOpen={notification !== null} variant={notification?.variant ?? 'success'} title={notification?.title ?? ''} message={notification?.message ?? ''} onPrimary={() => setNotification(null)} onClose={() => setNotification(null)} />
    </div>
  );
}
