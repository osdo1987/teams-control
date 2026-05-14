import React from 'react';
import { NavLink } from 'react-router-dom';
import { authService } from '../../services/authService';

const AdminSidebar = () => {
  const user = authService.getCurrentUser();
  const initials = user?.first_name?.[0]?.toUpperCase() || 'A';
  const clubName = user?.club_name || 'Club Manager';

  return (
    <aside className="sidebar">
      {/* Logo dinámico con nombre del club */}
      <div className="sidebar-logo">
        <h2 style={{ fontSize: '1.4rem', color: 'var(--primary-color)' }}>{clubName}</h2>
        <p style={{ fontSize: '0.75rem', opacity: 0.7 }}>Panel de Administración</p>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <span className="sidebar-section-label">Principal</span>

        <NavLink to="/admin" end className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <span className="nav-icon">🏠</span>
          Dashboard
        </NavLink>

        <NavLink to="/admin/groups" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <span className="nav-icon">👥</span>
          Grupos
        </NavLink>

        <NavLink to="/admin/athletes" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <span className="nav-icon">🏃</span>
          Atletas
        </NavLink>

        <span className="sidebar-section-label">Gestión</span>

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
          Pagos
        </NavLink>

        <NavLink to="/admin/attendance" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <span className="nav-icon">📋</span>
          Asistencia
        </NavLink>
      </nav>

      {/* Footer user */}
      <div className="sidebar-footer">
        <div className="sidebar-avatar" style={{ background: 'var(--primary-color)' }}>{initials}</div>
        <div className="sidebar-footer-info">
          <p style={{ fontWeight: 600 }}>{user?.first_name} {user?.last_name}</p>
          <span style={{ fontSize: '0.7rem' }}>{user?.role}</span>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
