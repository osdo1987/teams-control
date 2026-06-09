import React, { useState, useEffect } from 'react';
import { statsService } from '../../services/statsService';
import { IconUsers, IconBuilding, IconCreditCard, IconTrophy } from '../../components/Icons';

const SuperAdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await statsService.getGlobalStats();
                setStats(data);
            } catch (err) {
                setError('Error al cargar estadísticas globales');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return (
        <div className="loading-state">
            <div className="spinner spinner-lg" />
            <p>Sincronizando Plataforma...</p>
        </div>
    );

    if (error) return (
        <div className="empty-state">
            <div className="icon" style={{ background: 'var(--danger-50)', color: 'var(--danger-700)' }}>⚠</div>
            <h3>Error de Conexión</h3>
            <p>{error}</p>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1>Panel Maestro</h1>
                    <p>Club Manager Global Management System • {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                </div>
            </div>

            {/* Hero Banner */}
            <section className="hero-banner">
                <div className="hero-content">
                    <div>
                        <h2>Salud del Ecosistema</h2>
                        <p>La plataforma está operando al <strong>100%</strong> de su capacidad con <strong>{stats.clubs.total} organizaciones</strong> activas.</p>
                    </div>
                    <div className="hero-metrics">
                        <div className="hero-metric">
                            <span className="value">{stats.users.total}</span>
                            <span className="label">Usuarios</span>
                        </div>
                        <div className="hero-metric">
                            <span className="value">{stats.clubs.subscriptions.active}</span>
                            <span className="label">Suscripciones</span>
                        </div>
                    </div>
                </div>
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
            </section>

            {/* Stats Grid */}
            <div className="stat-grid">
                <StatCard
                    label="Ingreso Proyectado"
                    value={`$${(stats?.clubs?.subscriptions?.projected_revenue || 0).toLocaleString()}`}
                    sub="Mensual estimado"
                    icon="💎"
                    className="icon-info"
                />
                <StatCard
                    label="Total Recaudado"
                    value={`$${(stats?.payments?.total_amount || 0).toLocaleString()}`}
                    sub={`${stats?.payments?.total_count || 0} transacciones`}
                    icon="📈"
                    className="icon-success"
                />
                <StatCard
                    label="Clubes en Trial"
                    value={stats?.clubs?.subscriptions?.expired || 0}
                    sub="Pendientes de pago"
                    icon="⏳"
                    className="icon-warning"
                />
                <StatCard
                    label="Atletas Totales"
                    value={stats?.users?.athletes || 0}
                    sub="Registrados globalmente"
                    icon="🏅"
                    className="icon-purple"
                />
            </div>

            {/* Main Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
                {/* Distribution Table */}
                <div className="table-wrapper">
                    <div className="card-header">
                        <div className="header-info">
                            <h3>Rendimiento por Organización</h3>
                            <p>Monitoreo de carga de usuarios y estados de facturación.</p>
                        </div>
                        <button className="btn btn-primary btn-sm">Exportar Reporte</button>
                    </div>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Organización</th>
                                <th>Deporte</th>
                                <th>Carga (Usuarios)</th>
                                <th>Estado Membresía</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.clubs.distribution.map(club => (
                                <tr key={club.id}>
                                    <td>
                                        <div className="table-cell-name">
                                            <div>
                                                <strong>{club.name}</strong>
                                                <small>ID #{club.id}</small>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span className="badge badge-info badge-no-dot">{club.sport}</span></td>
                                    <td>
                                        <div style={{ minWidth: '120px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '4px', fontWeight: 600 }}>
                                                <span>{club.total} usuarios</span>
                                                <span>{Math.round((club.athletes / (club.total || 1)) * 100)}% atletas</span>
                                            </div>
                                            <div className="progress">
                                                <div className="fill" style={{ width: `${Math.min((club.total / ((stats.users.total / stats.clubs.total) || 1)) * 100, 100)}%` }}></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td><StatusBadge status={club.subscription_status} /></td>
                                    <td><button className="btn btn-ghost btn-icon btn-icon-sm">•••</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Side Panels */}
                <aside style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div className="card">
                        <h3 style={{ marginBottom: '16px', fontSize: '1rem' }}>Composición de Roles</h3>
                        <RoleIndicator label="Atletas" count={stats.users.athletes} total={stats.users.total} color="var(--success-500)" />
                        <RoleIndicator label="Entrenadores" count={stats.users.trainers} total={stats.users.total} color="var(--info-500)" />
                        <RoleIndicator label="Admins" count={stats.users.admins} total={stats.users.total} color="var(--danger-500)" />
                    </div>

                    <div className="card">
                        <h3 style={{ marginBottom: '16px', fontSize: '1rem' }}>Planes Contratados</h3>
                        <PlanRow label="Unlimited" price="$150" count={stats.clubs.distribution.filter(c => c.plan_type === 'UNLIMITED').length} color="var(--warning-500)" />
                        <PlanRow label="Professional" price="$70" count={stats.clubs.distribution.filter(c => c.plan_type === 'PRO').length} color="var(--purple-500)" />
                        <PlanRow label="Basic" price="$30" count={stats.clubs.distribution.filter(c => c.plan_type === 'BASIC').length} color="var(--brand-500)" />
                    </div>
                </aside>
            </div>
        </div>
    );
};

const StatCard = ({ label, value, sub, icon, className }) => (
    <div className="stat-card card-hover">
        <div className={`stat-icon ${className || 'icon-brand'}`}>{icon}</div>
        <div>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
            {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{sub}</div>}
        </div>
    </div>
);

const RoleIndicator = ({ label, count, total, color }) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
        <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                <span>{label}</span>
                <span style={{ color }}>{count} ({percentage.toFixed(0)}%)</span>
            </div>
            <div className="progress">
                <div className="fill" style={{ width: `${percentage}%`, background: color }}></div>
            </div>
        </div>
    );
};

const PlanRow = ({ label, price, count, color }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-soft)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }}></div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{label} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{price}</span></span>
        </div>
        <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{count}</span>
    </div>
);

const StatusBadge = ({ status }) => {
    const configs = {
        ACTIVE: { label: 'Activo', color: 'var(--success-700)', bg: 'var(--success-50)' },
        TRIAL: { label: 'Prueba', color: 'var(--info-700)', bg: 'var(--info-50)' },
        EXPIRED: { label: 'Vencido', color: 'var(--danger-700)', bg: 'var(--danger-50)' },
        INACTIVE: { label: 'Inactivo', color: 'var(--gray-700)', bg: 'var(--gray-100)' }
    };
    const config = configs[status] || configs.INACTIVE;
    return <span className="badge" style={{ background: config.bg, color: config.color }}>{config.label}</span>;
};

export default SuperAdminDashboard;