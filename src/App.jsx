import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import Dashboard from './components/Dashboard';

const pageLabels = {
  dashboard: 'Dashboard',
  users: 'Users',
  products: 'Products',
  orders: 'Orders',
  analytics: 'Analytics',
  settings: 'Settings',
};

// Placeholder page for non-dashboard routes
const PlaceholderPage = ({ page }) => (
  <main className="p-4 md:p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
    <div className="w-16 h-16 bg-indigo-50 flex items-center justify-center mb-4">
      <span className="text-3xl">🚧</span>
    </div>
    <h2 className="text-xl font-bold text-gray-800 mb-2">
      {pageLabels[page] || 'Page'} — Coming Soon
    </h2>
    <p className="text-gray-500 max-w-xs">
      This section is under construction. Check back later!
    </p>
  </main>
);

const App = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);

  // Collapse sidebar automatically on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
        setMobileSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Toggle dark mode class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const sidebarWidth = sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64';

  return (
    <div className={`min-h-screen bg-gray-50 ${darkMode ? 'dark' : ''}`}>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — always rendered; position toggled by class */}
      <div
        className={`
          fixed left-0 top-0 h-full z-40
          transition-transform duration-300 ease-in-out
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((c) => !c)}
          activeItem={activeNav}
          onNavigate={(id) => {
            setActiveNav(id);
            setMobileSidebarOpen(false);
          }}
        />
      </div>

      {/* Main content area shifts right to clear the sidebar */}
      <div className={`transition-all duration-300 ${sidebarWidth}`}>
        <TopNav
          sidebarCollapsed={sidebarCollapsed}
          darkMode={darkMode}
          onDarkModeToggle={() => setDarkMode((d) => !d)}
          breadcrumb={pageLabels[activeNav] || 'Page'}
          onMobileMenuToggle={() => setMobileSidebarOpen((o) => !o)}
        />

        {activeNav === 'dashboard' ? (
          <Dashboard />
        ) : (
          <PlaceholderPage page={activeNav} />
        )}
      </div>
    </div>
  );
};

export default App;
