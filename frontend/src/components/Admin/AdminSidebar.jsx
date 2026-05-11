import React from 'react';
import { NavLink } from 'react-router-dom';
import { authService } from '../../services/authService';

const ICONS = {
  dashboard: '▣',
  athletes:  '⚑',
  groups:    '◉',
  users:     '✦',
  payments:  '◈',
  attendance:'☰',
};

const AdminSidebar = () => {
  const user = authService.getCurrentUser();
  const initials = user?.email?.[0]?.toUpperCase() || 'A';

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <h2>SportClub</h2>
        <p>Admin Console</p>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <span className="sidebar-section-label">Main</span>

        <NavLink to="/admin" end className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <span className="nav-icon">🏠</span>
          Dashboard
        </NavLink>

        <NavLink to="/admin/groups" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <span className="nav-icon">👥</span>
          Groups
        </NavLink>

        <NavLink to="/admin/athletes" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <span className="nav-icon">🏃</span>
          Athletes
        </NavLink>

        <span className="sidebar-section-label">Management</span>

        <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <span className="nav-icon">🔑</span>
          Cuentas (Usuarios)
        </NavLink>

        <NavLink to="/admin/trainers" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <span className="nav-icon">🏅</span>
          Entrenadores
        </NavLink>

        <NavLink to="/admin/payments" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <span className="nav-icon">💳</span>
          Payments
        </NavLink>

        <NavLink to="/admin/attendance" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <span className="nav-icon">📋</span>
          Attendance
        </NavLink>
      </nav>

      {/* Footer user */}
      <div className="sidebar-footer">
        <div className="sidebar-avatar">{initials}</div>
        <div className="sidebar-footer-info">
          <p>{user?.email?.split('@')[0] || 'Admin'}</p>
          <span>System Administrator</span>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
