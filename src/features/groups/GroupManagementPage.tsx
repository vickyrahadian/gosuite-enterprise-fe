import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { FormModal } from '../../components/FormModal';
import { IconButton } from '../../components/IconButton';
import { NotificationModal, type NotificationVariant } from '../../components/NotificationModal';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { ApiRequestError } from '../../services/api';
import { groupService } from './groupService';
import type { Group } from './types';

const MAX_GROUP_NAME_LENGTH = 100;

type Notification = {
  variant: NotificationVariant;
  title: string;
  message: string;
};

function getErrorMessage(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.status === 409) return error.message || 'The group name is already in use or the group is still assigned to a user.';
    if (error.status === 404) return 'Group not found. Please refresh the data.';
    if (error.status === 400) return error.message || 'The group data is invalid.';
    return error.message;
  }
  return 'Unable to connect to the backend. Check the API address and server connection.';
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function GroupManagementPage() {
  useDocumentTitle('Group Management | BNI');
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchName, setSearchName] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [groupName, setGroupName] = useState('');
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Group | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);

  const loadGroups = useCallback(async (signal?: AbortSignal, name = '') => {
    setIsLoading(true);
    try {
      const normalizedName = name.trim();
      setGroups(normalizedName
        ? await groupService.searchByName(normalizedName, signal)
        : await groupService.getAll(signal));
      setActiveSearch(normalizedName);
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
      setNotification({ variant: 'error', title: 'Unable to Load Groups', message: getErrorMessage(requestError) });
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadGroups(controller.signal);
    return () => controller.abort();
  }, [loadGroups]);

  const resetForm = () => {
    setEditingGroup(null);
    setGroupName('');
    setIsFormOpen(false);
  };

  const openAddForm = () => {
    setEditingGroup(null);
    setGroupName('');
    setNotification(null);
    setIsFormOpen(true);
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void loadGroups(undefined, searchName);
  };

  const clearSearch = () => {
    setSearchName('');
    void loadGroups();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedName = groupName.trim();
    setNotification(null);

    if (!normalizedName) {
      setNotification({ variant: 'error', title: 'Invalid Group', message: 'Group name is required.' });
      return;
    }

    setIsSaving(true);
    try {
      if (editingGroup) {
        const updated = await groupService.update(editingGroup.id, { groupName: normalizedName });
        setGroups((current) => activeSearch && !updated.groupName.toLowerCase().includes(activeSearch.toLowerCase())
          ? current.filter((group) => group.id !== updated.id)
          : current.map((group) => group.id === updated.id ? updated : group));
        setNotification({ variant: 'success', title: 'Group Updated', message: 'The group was updated successfully.' });
      } else {
        const created = await groupService.create({ groupName: normalizedName });
        if (!activeSearch || created.groupName.toLowerCase().includes(activeSearch.toLowerCase())) {
          setGroups((current) => [...current, created]);
        }
        setNotification({ variant: 'success', title: 'Group Created', message: 'The group was created successfully.' });
      }
      resetForm();
    } catch (requestError) {
      setNotification({ variant: 'error', title: editingGroup ? 'Update Failed' : 'Creation Failed', message: getErrorMessage(requestError) });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (group: Group) => {
    setEditingGroup(group);
    setGroupName(group.groupName);
    setNotification(null);
    setIsFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const group = deleteTarget;
    setIsDeleting(true);
    try {
      await groupService.remove(group.id);
      setGroups((current) => current.filter(({ id }) => id !== group.id));
      if (editingGroup?.id === group.id) resetForm();
      setDeleteTarget(null);
      setNotification({ variant: 'success', title: 'Group Deleted', message: 'The group was deleted successfully.' });
    } catch (requestError) {
      setDeleteTarget(null);
      setNotification({ variant: 'error', title: 'Deletion Failed', message: getErrorMessage(requestError) });
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: DataTableColumn<Group>[] = [
    { key: 'id', header: 'ID', render: (group) => group.id },
    { key: 'name', header: 'Group Name', render: (group) => group.groupName },
    { key: 'created', header: 'Created', render: (group) => formatDate(group.createdAt) },
    { key: 'updated', header: 'Updated', render: (group) => formatDate(group.updatedAt) },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (group) => (
        <div className="row-actions">
          <IconButton
            label={`Edit ${group.groupName}`}
            type="button"
            onClick={() => handleEdit(group)}
            icon={(
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M4 20h4l11-11-4-4L4 16v4Z" />
                <path d="m13.5 6.5 4 4" />
              </svg>
            )}
          />
          <IconButton
            label={`Delete ${group.groupName}`}
            variant="danger"
            type="button"
            onClick={() => setDeleteTarget(group)}
            icon={(
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />
              </svg>
            )}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="crud-page group-management-page">
      <header className="page-header">
        <div>
          <p>System Management</p>
          <h1>Group Management</h1>
        </div>
      </header>

      <section className="management-card" aria-labelledby="group-search-title">
        <div className="section-heading">
          <h2 id="group-search-title">Search Groups</h2>
        </div>
        <form className="search-form" onSubmit={handleSearch}>
          <label htmlFor="group-search">Group name</label>
          <div className="search-form__controls">
            <input
              id="group-search"
              type="search"
              value={searchName}
              onChange={(event) => setSearchName(event.target.value)}
              maxLength={MAX_GROUP_NAME_LENGTH}
              placeholder="Search by group name"
              autoComplete="off"
            />
            <IconButton
              className="icon-button--primary search-form__icon-button"
              label="Search groups"
              type="submit"
              disabled={isLoading}
              icon={(
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <circle cx="10.5" cy="10.5" r="6.5" />
                  <path d="m15.5 15.5 4.5 4.5" />
                </svg>
              )}
            />
            <IconButton
              className="search-form__icon-button"
              label="Clear search"
              type="button"
              onClick={clearSearch}
              disabled={isLoading && !searchName}
              icon={(
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="m4 15 8-9 7 6-7 8H8l-4-3Z" />
                  <path d="m9 12 6 5M12 20h8" />
                </svg>
              )}
            />
          </div>
        </form>
      </section>

      <section className="management-card" aria-labelledby="group-list-title">
        <div className="section-heading">
          <h2 id="group-list-title">Group List</h2>
          <div className="section-heading__actions">
            <span>{groups.length} {groups.length === 1 ? 'group' : 'groups'}</span>
            <IconButton
              label="Refresh groups"
              type="button"
              onClick={() => void loadGroups(undefined, searchName)}
              disabled={isLoading}
              icon={(
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M20 7v5h-5" />
                  <path d="M18.2 16a8 8 0 1 1 .8-9l1 5" />
                </svg>
              )}
            />
            <IconButton
              className="icon-button--primary"
              label="Add Group"
              type="button"
              onClick={openAddForm}
              icon={(
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              )}
            />
          </div>
        </div>
        <DataTable
          rows={groups}
          columns={columns}
          getRowKey={(group) => group.id}
          ariaLabel="Group list"
          isLoading={isLoading}
          loadingMessage="Loading groups..."
          emptyMessage="No groups found."
        />
      </section>

      <FormModal
        isOpen={isFormOpen}
        title={editingGroup ? 'Edit Group' : 'Add Group'}
        submitLabel={editingGroup ? 'Save Changes' : 'Add Group'}
        isSubmitting={isSaving}
        onSubmit={handleSubmit}
        onClose={resetForm}
      >
        <div className="form-field">
          <label htmlFor="group-name">Group name</label>
          <input
            id="group-name"
            name="groupName"
            value={groupName}
            onChange={(event) => setGroupName(event.target.value)}
            maxLength={MAX_GROUP_NAME_LENGTH}
            placeholder="Example: ADMIN"
            autoComplete="off"
            disabled={isSaving}
            autoFocus
          />
          <small>{groupName.length}/{MAX_GROUP_NAME_LENGTH} characters</small>
        </div>
      </FormModal>

      <NotificationModal
        isOpen={deleteTarget !== null}
        variant="confirm"
        title="Delete Group"
        message={`Are you sure you want to delete the "${deleteTarget?.groupName ?? ''}" group?`}
        primaryLabel="Delete"
        secondaryLabel="Cancel"
        isProcessing={isDeleting}
        onPrimary={() => void confirmDelete()}
        onClose={() => setDeleteTarget(null)}
      />
      <NotificationModal
        isOpen={notification !== null}
        variant={notification?.variant ?? 'success'}
        title={notification?.title ?? ''}
        message={notification?.message ?? ''}
        onPrimary={() => setNotification(null)}
        onClose={() => setNotification(null)}
      />
    </div>
  );
}
