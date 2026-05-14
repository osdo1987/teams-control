import React from 'react';
import { NavLink } from 'react-router-dom';
import { authService } from '../../services/authService';

const SuperAdminSidebar = () => {
  const user = authService.getCurrentUser();
  const initials = user?.email?.[0]?.toUpperCase() || 'S';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>Club Manager</h2>
        <p>Super Admin</p>
      </div>

      <nav className="sidebar-nav">
        <span className="sidebar-section-label">Main</span>

        <NavLink to="/super-admin" end className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <span className="nav-icon">📊</span>
          Dashboard
        </NavLink>

        <NavLink to="/super-admin/clubs" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <span className="nav-icon">🏢</span>
          Clubes
        </NavLink>

        <NavLink to="/super-admin/users" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <span className="nav-icon">👤</span>
          Usuarios Globales
        </NavLink>

        <NavLink to="/super-admin/pricing" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <span className="nav-icon">💳</span>
          Planes y Cobros
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-avatar" style={{ background: 'var(--accent-color)' }}>{initials}</div>
        <div className="sidebar-footer-info">
          <p>{user?.email?.split('@')[0] || 'SuperAdmin'}</p>
          <button className="logout-btn" onClick={() => authService.logout()}>Cerrar Sesión</button>
        </div>
      </div>
    </aside>
  );
};

export default SuperAdminSidebar;
