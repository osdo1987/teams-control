import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import usePermissions from '../../hooks/usePermissions';

const AthleteDashboard = () => {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const { hasPermission } = usePermissions();

    const cards = [
        { feature: 'profile', icon: 'icon-brand', emoji: '👤', title: 'Mi Perfil', desc: 'Ver y editar tu información personal', path: '/athlete/profile' },
        { feature: 'attendance', icon: 'icon-success', emoji: '📅', title: 'Asistencia', desc: 'Historial de asistencia', path: null },
        { feature: 'payments', icon: 'icon-warning', emoji: '💳', title: 'Pagos', desc: 'Estado de pagos y cuotas', path: null },
        { feature: 'tests', icon: 'icon-info', emoji: '🧪', title: 'Mis Tests', desc: 'Resultados de tests físicos', path: null },
    ];

    const visibleCards = cards.filter((c) => hasPermission(c.feature));

    return (
        <div>
            <div className="hero-banner" style={{ marginBottom: 24 }}>
                <div className="hero-content">
                    <div>
                        <h2 style={{ color: 'white', fontSize: '1.5rem', marginBottom: 8 }}>
                            Hola, {user?.first_name} 👋
                        </h2>
                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                            {user?.club_name} · Atleta
                        </p>
                    </div>
                    <div className="hero-metrics">
                        <div className="hero-metric">
                            <span className="value">⚽</span>
                            <span className="label">Atleta</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="stat-grid">
                {visibleCards.map((card) => (
                    <div
                        key={card.feature}
                        className="stat-card card-hover"
                        style={{ cursor: card.path ? 'pointer' : 'default' }}
                        onClick={() => card.path && navigate(card.path)}
                    >
                        <div className={`stat-icon ${card.icon}`}>{card.emoji}</div>
                        <div className="stat-value" style={{ fontSize: '1.2rem' }}>{card.title}</div>
                        <div className="stat-label">{card.desc}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AthleteDashboard;