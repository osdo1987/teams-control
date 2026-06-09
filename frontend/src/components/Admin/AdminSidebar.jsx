import React from 'react';
import { NavLink } from 'react-router-dom';
import { authService } from '../../services/authService';
import { IconHome, IconTrophy, IconUsers, IconUserCheck, IconLogOut, IconZap, IconUser, IconDollarSign, IconCalendar } from '../Icons';

const links = [
  { t: 'link', to: '/admin', end: true, icon: IconHome, label: 'Dashboard' },
  { t: 'link', to: '/admin/groups', icon: IconTrophy, label: 'Grupos' },
  { t: 'link', to: '/admin/athletes', icon: IconUsers, label: 'Atletas' },
  { t: 'link', to: '/admin/users', icon: IconUser, label: 'Usuarios' },
  { t: 'link', to: '/admin/trainers', icon: IconUserCheck, label: 'Entrenadores' },
  { t: 'link', to: '/admin/payments', icon: IconDollarSign, label: 'Pagos' },
  { t: 'link', to: '/admin/attendance', icon: IconCalendar, label: 'Asistencia' },
];

const AdminSidebar = () => {
  const user = authService.getCurrentUser();
  const initials = ((user?.first_name || 'A')[0] + (user?.last_name || '')[0]).toUpperCase();
  const cn = user?.club_name || 'Club Manager';
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark"><IconZap size={22} /></div>
        <div className="brand-text">
          <span className="name">{cn}</span>
          <span className="tag">Panel Admin</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        {links.map((l) => l.t === 'link' ? (
          <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            <l.icon size={19} />{l.label}
          </NavLink>
        ) : null)}
      </nav>
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div className="avatar avatar-sm" style={{ background: 'var(--brand-600)' }}>{initials}</div>
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{user?.first_name} {user?.last_name}</div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{user?.role}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={() => authService.logout()}>
          <IconLogOut size={18} /> Cerrar Sesion
        </button>
      </div>
    </aside>
  );
};
export default AdminSidebar;