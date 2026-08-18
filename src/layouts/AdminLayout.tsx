import { useState, type PropsWithChildren } from 'react';
import bniLogo from '../assets/bni-logo.svg';
import { TopHeader } from '../components/TopHeader';
import type { Menu } from '../features/menus/types';
import type { PageId } from '../types/navigation';

const pageAliases: Record<string, PageId> = {
  'user-management': 'users',
  'group-management': 'groups',
  'audit-logs': 'audits',
  'menu-management': 'menus',
  'menu-group-management': 'menu-groups',
  'message-management': 'message-management',
  'bank-correspondent': 'correspondents',
  'bank-correspondents': 'correspondents',
  'correspondent': 'correspondents',
  'correspondent-management': 'correspondents',
  'app-parameter': 'parameter',
  'app-parameters': 'parameter',
  'parameter': 'parameter',
  'parameter-management': 'parameter',
  'parameters': 'parameter',
  'sftp-config': 'sftp-config',
  'sftp-configuration': 'sftp-config',
  'scheduler-config': 'scheduler-config',
  'scheduler-configuration': 'scheduler-config',
  'sftp-log': 'sftp-log',
  'transaction-log': 'transaction-log',
  'sanction-list': 'sanction-list',
  'sanction-filtering': 'sanction-filtering',
  'mx-mt-converter': 'mx-mt-converter',
  'goremit-itr-to-otr': 'goremit-itr-to-otr',
  'itr-to-otr': 'goremit-itr-to-otr',
  'goremit-otr': 'goremit-otr',
  'otr-non-swift': 'goremit-otr',
  'goremit-otr-direct': 'goremit-otr-direct',
  'otr-direct': 'goremit-otr-direct',
};

function getMenuPage(menu: Menu): PageId | undefined {
  const page = menu.page || pageAliases[menu.menuKey];
  return page ? pageAliases[page] ?? page as PageId : undefined;
}

type AdminLayoutProps = PropsWithChildren<{
  currentPage: PageId;
  username: string;
  isLoggingOut: boolean;
  onNavigate: (page: PageId) => void;
  onLogout: () => void;
  navigationMenu: Menu[];
}>;

export function AdminLayout({ children, currentPage, username, isLoggingOut, onNavigate, onLogout, navigationMenu }: AdminLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const toggleMenu = (menuId: number) => {
    setOpenMenus((current) => ({ ...current, [menuId]: !current[menuId] }));
  };

  return (
    <div className={`admin-shell${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      <aside className={`sidebar${isSidebarCollapsed ? ' sidebar--collapsed' : ''}`}>
        <div className="sidebar-header">
          <a
            className="brand"
            href="/"
            aria-label="BNI admin dashboard"
            onClick={(event) => {
              event.preventDefault();
              onNavigate('dashboard');
            }}
          >
            <img className="brand-logo" src={bniLogo} alt="BNI" />
          </a>
        </div>
        <nav aria-label="Main navigation">
          {navigationMenu.map((menu) => {
            const isOpen = Boolean(openMenus[menu.id]);
            const submenuId = `${menu.id}-menu`;

            return (
              <div className="nav-menu" key={menu.id}>
                <button
                  className="nav-menu-trigger"
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={submenuId}
                  onClick={() => toggleMenu(menu.id)}
                >
                  <span className="nav-icon" aria-hidden="true">{menu.icon ?? '\u25a1'}</span>
                  <span className="nav-label">{menu.label}</span>
                  <span className="nav-chevron" aria-hidden="true">{isOpen ? '\u25b4' : '\u25be'}</span>
                </button>
                {isOpen && (
                  <div className="submenu" id={submenuId}>
                    {menu.children.map((item) => (
                      <a
                        className={getMenuPage(item) === currentPage ? 'active' : undefined}
                        key={item.id}
                        href={getMenuPage(item) ? `#${getMenuPage(item)}` : '#'}
                        onClick={(event) => {
                          event.preventDefault();
                          const page = getMenuPage(item);
                          if (page) onNavigate(page);
                        }}
                      >
                        {item.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <button
          className="sidebar-toggle"
          type="button"
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!isSidebarCollapsed}
          onClick={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
        >
          <svg aria-hidden="true" viewBox="0 0 20 20">
            <path d={isSidebarCollapsed ? 'm7 4 6 6-6 6' : 'm13 4-6 6 6 6'} />
          </svg>
          <span className="toggle-label">Collapse sidebar</span>
        </button>
      </aside>
      <main>
        <TopHeader username={username} isLoggingOut={isLoggingOut} onProfile={() => onNavigate('profile')} onLogout={onLogout} />
        <div className="page-content">{children}</div>
        <footer className="footer">Copyright &copy; 2026 - BNI New York</footer>
      </main>
    </div>
  );
}
