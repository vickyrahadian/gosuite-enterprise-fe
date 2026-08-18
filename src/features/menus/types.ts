export type MenuType = 'GROUP' | 'PAGE';
export type MenuActive = 'Y' | 'N';

export type Menu = {
  id: number;
  menuKey: string;
  parentId: number | null;
  label: string;
  icon: string | null;
  page: string | null;
  menuType: MenuType;
  sortOrder: number | null;
  active: MenuActive;
  children: Menu[];
};

export type MenuPayload = {
  menuKey: string;
  parentId: number | null;
  label: string;
  icon: string | null;
  page: string | null;
  menuType: MenuType;
  sortOrder: number | null;
  active: MenuActive;
};

export type MenuForm = Omit<MenuPayload, 'parentId' | 'sortOrder' | 'icon' | 'page'> & {
  parentId: string;
  sortOrder: string;
  icon: string;
  page: string;
};
