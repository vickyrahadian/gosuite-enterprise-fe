export type MenuPermission = {
  menuId: number;
  menuKey: string;
  label: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

export type MenuPermissionPayload = Omit<MenuPermission, 'menuKey' | 'label'>;
