import React from 'react';
import { NavLink } from 'react-router-dom';
import { authService } from '../../services/authService';
import { IconHome, IconUsers, IconCreditCard, IconLogOut, IconZap, IconBuilding, IconShield } from '../Icons';

const links = [
  { to: '/super-admin', end: true, icon: IconHome, label: 'Dashboard' },
  { to: '/super-admin/clubs', icon: IconBuilding, label: 'Clubes' },
  { to: '/super-admin/permissions', icon: IconShield, label: 'Permisos por Club' },
  { to: '/super-admin/users', icon: IconUsers, label: 'Usuarios Globales' },
  { to: '/super-admin/pricing', icon: IconCreditCard, label: 'Planes y Cobros' },
];

const SuperAdminSidebar = () => {
  const user = authService.getCurrentUser();
  const initials = user?.email?.[0]?.toUpperCase() || 'S';

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark"><IconZap size={22} /></div>
        <div className="brand-text">
          <span className="name">Club Manager</span>
          <span className="tag">Super Admin</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        <span className="sidebar-section">Main</span>
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            <l.icon size={19} />{l.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div className="avatar avatar-sm" style={{ background: 'var(--brand-600)' }}>{initials}</div>
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{user?.email?.split('@')[0] || 'SuperAdmin'}</div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>SUPER_ADMIN</div>
          </div>
        </div>
        <button className="logout-btn" onClick={() => authService.logout(null)}>
          <IconLogOut size={18} /> Cerrar Sesion
        </button>
      </div>
    </aside>
  );
};

export default SuperAdminSidebar;
