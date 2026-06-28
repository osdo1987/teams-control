import React from 'react';
import { NavLink } from 'react-router-dom';
import { authService } from '../../services/authService';
import { IconHome, IconLogOut, IconZap, IconUser, IconDollarSign, IconCalendar, IconActivity, IconTrophy } from '../Icons';

const links = [
    { to: '/trainer', end: true, icon: IconHome, label: 'Inicio' },
    { to: '/trainer/groups', icon: IconTrophy, label: 'Mis Grupos' },
    { to: '/trainer/attendance', icon: IconCalendar, label: 'Asistencia' },
    { to: '/trainer/tests', icon: IconActivity, label: 'Tests' },
    { to: '/trainer/payments', icon: IconDollarSign, label: 'Pagos' },
    { to: '/trainer/training-plans', icon: IconZap, label: 'Planes de Ent.' },
    { to: '/trainer/profile', icon: IconUser, label: 'Mi Perfil' },
];

const TrainerSidebar = ({ open, onClose }) => {
    const user = authService.getCurrentUser();
    const initials = ((user?.first_name || 'A')[0] + (user?.last_name || '')[0]).toUpperCase();
    const cn = user?.club_name || 'Club Manager';
    return (
        <aside className={`sidebar${open ? ' open' : ''}`}>
            <button className="sidebar-close-mobile" onClick={onClose} aria-label="Cerrar menú">✕</button>
            <div className="sidebar-brand">
                <div className="brand-mark"><IconZap size={22} /></div>
                <div className="brand-text">
                    <span className="name">{cn}</span>
                    <span className="tag">Entrenador</span>
                </div>
            </div>
            <nav className="sidebar-nav">
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

export default TrainerSidebar;