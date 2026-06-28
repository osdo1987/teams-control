import React from 'react';
import { NavLink } from 'react-router-dom';
import { authService } from '../../services/authService';
import usePermissions from '../../hooks/usePermissions';
import { IconHome, IconTrophy, IconUsers, IconUserCheck, IconLogOut, IconZap, IconUser, IconDollarSign, IconCalendar, IconActivity, IconImage, IconShield } from '../Icons';

const links = [
  { t: 'link', to: '/admin', end: true, icon: IconHome, label: 'Dashboard', perm: 'dashboard' },
  { t: 'link', to: '/admin/groups', icon: IconTrophy, label: 'Grupos', perm: 'groups' },
  { t: 'link', to: '/admin/athletes', icon: IconUsers, label: 'Atletas', perm: 'athletes' },
  { t: 'link', to: '/admin/users', icon: IconUser, label: 'Usuarios', perm: 'users' },
  { t: 'link', to: '/admin/trainers', icon: IconUserCheck, label: 'Entrenadores', perm: 'trainers' },
  { t: 'link', to: '/admin/payments', icon: IconDollarSign, label: 'Pagos', perm: 'payments' },
  { t: 'link', to: '/admin/attendance', icon: IconCalendar, label: 'Asistencia', perm: 'attendance' },
  { t: 'link', to: '/admin/tests', icon: IconActivity, label: 'Tests', perm: 'tests' },
  { t: 'link', to: '/admin/training-plans', icon: IconZap, label: 'Planes de Ent.', perm: 'training_plans' },
  { t: 'link', to: '/admin/landing', icon: IconImage, label: 'Landing Page', perm: 'landing' },
  { t: 'link', to: '/admin/permissions', icon: IconShield, label: 'Permisos', perm: 'permissions' },
];

const AdminSidebar = ({ open, onClose }) => {
  const user = authService.getCurrentUser();
  const { hasPermission, loading } = usePermissions();
  const initials = ((user?.first_name || 'A')[0] + (user?.last_name || '')[0]).toUpperCase();
  const cn = user?.club_name || 'Club Manager';
  return (
    <aside className={`sidebar${open ? ' open' : ''}`}>
      {/* Close button — only visible on mobile via CSS */}
      <button
        className="sidebar-close-mobile"
        onClick={onClose}
        aria-label="Cerrar menú"
      >
        ✕
      </button>

      <div className="sidebar-brand">
        <div className="brand-mark"><IconZap size={22} /></div>
        <div className="brand-text">
          <span className="name">{cn}</span>
          <span className="tag">Panel Admin</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        {links.filter((l) => l.t === 'link' && (loading || hasPermission(l.perm))).map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            <l.icon size={19} />{l.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div className="avatar avatar-sm" style={{ background: 'var(--brand-600)' }}>{initials}</div>
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{user?.first_name} {user?.last_name}</div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{user?.role}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={() => authService.logout(user?.club_slug)}>
          <IconLogOut size={18} /> Cerrar Sesion
        </button>
      </div>
    </aside>
  );
};
export default AdminSidebar;