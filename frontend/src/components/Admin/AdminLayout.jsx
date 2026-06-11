import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close sidebar on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && sidebarOpen) setSidebarOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [sidebarOpen]);

  return (
    <div className="app-shell">
      {/* Hamburger button for mobile */}
      <button
        className="mobile-hamburger"
        onClick={() => setSidebarOpen(true)}
        aria-label="Abrir menú"
      >
        ☰
      </button>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="app-main">
        <div className="app-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;