import React, { useState } from 'react';
import { Search, Bell, Sun, Moon, ChevronRight, Menu } from 'lucide-react';
import UserProfile from './UserProfile';

const TopNav = ({ sidebarCollapsed, darkMode, onDarkModeToggle, breadcrumb, onMobileMenuToggle }) => {
  const [searchValue, setSearchValue] = useState('');
  const notificationCount = 3;

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 gap-4 sticky top-0 z-30">
      {/* Mobile menu button */}
      <button
        onClick={onMobileMenuToggle}
        aria-label="Toggle menu"
        className="lg:hidden p-2  text-gray-500 hover:bg-gray-100 transition-colors"
      >
        <Menu size={20} />
      </button>

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-1 text-sm text-gray-500 min-w-0">
        <span className="text-gray-400">Admin</span>
        <ChevronRight size={14} className="text-gray-300 shrink-0" />
        <span className="font-medium text-gray-700 truncate">{breadcrumb}</span>
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="relative hidden sm:block">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          type="search"
          placeholder="Search..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          aria-label="Search"
          className="pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-48 lg:w-64 transition-all"
        />
      </div>

      {/* Dark mode toggle */}
      <button
        onClick={onDarkModeToggle}
        aria-label="Toggle dark mode"
        className="p-2  text-gray-500 hover:bg-gray-100 transition-colors"
      >
        {darkMode ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Notifications */}
      <button
        aria-label={`${notificationCount} notifications`}
        className="relative p-2  text-gray-500 hover:bg-gray-100 transition-colors"
      >
        <Bell size={18} />
        {notificationCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold  flex items-center justify-center leading-none">
            {notificationCount}
          </span>
        )}
      </button>

      {/* User Profile */}
      <UserProfile />
    </header>
  );
};

export default TopNav;
