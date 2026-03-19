import React from 'react';
import {
  LayoutDashboard,
  Users,
  Box,
  ShoppingCart,
  BarChart2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';

const iconMap = {
  LayoutDashboard,
  Users,
  Box,
  ShoppingCart,
  BarChart2,
  Settings,
};

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { id: 'users', label: 'Users', icon: 'Users' },
  { id: 'products', label: 'Products', icon: 'Box' },
  { id: 'orders', label: 'Orders', icon: 'ShoppingCart' },
  { id: 'analytics', label: 'Analytics', icon: 'BarChart2' },
  { id: 'settings', label: 'Settings', icon: 'Settings' },
];

const Sidebar = ({ collapsed, onToggle, activeItem, onNavigate }) => {
  return (
    <aside
      className={`
        fixed left-0 top-0 h-full bg-slate-900 flex flex-col z-40
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 bg-indigo-600  flex items-center justify-center shrink-0">
            <Zap size={18} className="text-white" />
          </div>
          {!collapsed && (
            <span className="text-white font-bold text-lg truncate">GoSuite</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = iconMap[item.icon];
            const isActive = activeItem === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  aria-label={item.label}
                  className={`
                    sidebar-link w-full
                    ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}
                    ${collapsed ? 'justify-center px-2' : ''}
                  `}
                >
                  <Icon size={18} className="shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom: Logout + Collapse Toggle */}
      <div className="px-2 py-4 border-t border-slate-700 space-y-1 shrink-0">
        <button
          aria-label="Logout"
          className={`sidebar-link sidebar-link-inactive w-full text-red-400 hover:bg-red-900/30 hover:text-red-300 ${collapsed ? 'justify-center px-2' : ''}`}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>

        <button
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`sidebar-link sidebar-link-inactive w-full ${collapsed ? 'justify-center px-2' : 'justify-end'}`}
        >
          {collapsed ? <ChevronRight size={18} /> : (
            <>
              <span className="text-xs">Collapse</span>
              <ChevronLeft size={18} />
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
