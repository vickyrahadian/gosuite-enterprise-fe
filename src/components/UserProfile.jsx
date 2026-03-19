import React, { useState, useRef, useEffect } from 'react';
import { User, Settings, HelpCircle, LogOut, ChevronDown } from 'lucide-react';

const menuItems = [
  { icon: User, label: 'My Profile' },
  { icon: Settings, label: 'Account Settings' },
  { icon: HelpCircle, label: 'Help & Support' },
];

const UserProfile = () => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="User menu"
        className="flex items-center gap-2 pl-2 pr-1 py-1  hover:bg-gray-100 transition-colors"
      >
        {/* Avatar */}
        <div className="w-8 h-8 bg-indigo-600  flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-bold">AJ</span>
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-semibold text-gray-800 leading-tight">Admin User</p>
          <p className="text-xs text-gray-400 leading-tight">Super Admin</p>
        </div>
        <ChevronDown
          size={14}
          className={`hidden md:block text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-white  shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in slide-in-from-top-2">
          {/* User info header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-800">Admin User</p>
            <p className="text-xs text-gray-500 truncate">admin@gosuite.com</p>
          </div>

          {/* Menu items */}
          <ul className="py-1">
            {menuItems.map(({ icon: Icon, label }) => (
              <li key={label}>
                <button
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setOpen(false)}
                >
                  <Icon size={16} className="text-gray-400" />
                  {label}
                </button>
              </li>
            ))}
          </ul>

          {/* Logout */}
          <div className="border-t border-gray-100 pt-1">
            <button
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
              onClick={() => setOpen(false)}
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
