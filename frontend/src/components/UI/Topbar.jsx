import React from 'react';
import { useLocation } from 'react-router-dom';
import { authService } from '../../services/authService';

const Topbar = ({ title, breadcrumb }) => {
  const user = authService.getCurrentUser();
  const roleLabels = {
    'SUPER_ADMIN': 'Super Admin',
    'ADMIN': 'Administrador',
    'TRAINER': 'Entrenador',
    'ATHLETE': 'Atleta'
  };

  return (
    <header className="topbar">
      <div className="topbar-title">
        {breadcrumb && <span className="crumb">{breadcrumb}</span>}
        <h2>{title || 'Panel de Control'}</h2>
      </div>
      <div className="topbar-actions">
        {user && (
          <div className="user-chip">
            <div className="avatar avatar-sm" style={{background: 'var(--brand-500)'}}>
              {user.name ? user.name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U')}
            </div>
            <div style={{display: 'flex', flexDirection: 'column'}}>
              <span className="name">{user.name || user.email}</span>
              <span className="role">{roleLabels[user.role] || user.role}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Topbar;
