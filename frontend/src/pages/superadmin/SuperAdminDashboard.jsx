import React, { useState, useEffect } from 'react';
import { statsService } from '../../services/statsService';

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
            <div className="loader-orbit">
                <div className="orbit-core"></div>
                <div className="orbit-ring"></div>
            </div>
            <p>Sincronizando Plataforma...</p>
        </div>
    );

    if (error) return <div className="error-card"><h3>⚠️ Error de Conexión</h3><p>{error}</p></div>;

    return (
        <div className="super-dashboard animate-in">
            {/* Header / Welcome Area */}
            <header className="dashboard-top-bar">
                <div className="welcome-text">
                    <h1>Panel Maestro</h1>
                    <p>SportClub Global Management System • {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                </div>
                <div className="top-actions">
                    <button className="btn-icon" title="Notificaciones">🔔</button>
                    <button className="btn-icon" title="Ajustes">⚙️</button>
                    <div className="user-profile-summary">
                        <span>Super Admin</span>
                        <div className="avatar-mini">SA</div>
                    </div>
                </div>
            </header>

            {/* Main Hero Summary */}
            <section className="hero-banner">
                <div className="hero-main-content">
                    <div className="hero-text">
                        <h2>Salud del Ecosistema</h2>
                        <p>La plataforma está operando al <strong>100%</strong> de su capacidad con <strong>{stats.clubs.total} organizaciones</strong> activas.</p>
                    </div>
                    <div className="hero-metrics">
                        <div className="hero-metric-item">
                            <span className="metric-value">{stats.users.total}</span>
                            <span className="metric-label">Usuarios</span>
                        </div>
                        <div className="divider-v"></div>
                        <div className="hero-metric-item">
                            <span className="metric-value">{stats.clubs.subscriptions.active}</span>
                            <span className="metric-label">Suscripciones</span>
                        </div>
                    </div>
                </div>
                <div className="hero-bg-decoration">
                    <div className="blob blob-1"></div>
                    <div className="blob blob-2"></div>
                </div>
            </section>

            {/* Premium Stats Grid */}
            <div className="grid-4 mt-4">
                <StatCard 
                    label="Ingreso Proyectado" 
                    value={`$${(stats?.clubs?.subscriptions?.projected_revenue || 0).toLocaleString()}`} 
                    sub="Mensual estimado" 
                    icon="💎" 
                    color="cyan" 
                />
                <StatCard 
                    label="Total Recaudado" 
                    value={`$${(stats?.payments?.total_amount || 0).toLocaleString()}`} 
                    sub={`${stats?.payments?.total_count || 0} transacciones`} 
                    icon="📈" 
                    color="emerald" 
                />
                <StatCard 
                    label="Clubes en Trial" 
                    value={stats?.clubs?.subscriptions?.expired || 0} 
                    sub="Pendientes de pago" 
                    icon="⏳" 
                    color="amber" 
                />
                <StatCard 
                    label="Atletas Totales" 
                    value={stats?.users?.athletes || 0} 
                    sub="Registrados globalmente" 
                    icon="🏅" 
                    color="indigo" 
                />
            </div>

            {/* Analytics & Management Sections */}
            <div className="layout-grid-main mt-4">
                {/* Distribution Table */}
                <div className="glass-card table-section">
                    <div className="card-header">
                        <div className="header-info">
                            <h3>Rendimiento por Organización</h3>
                            <p>Monitoreo de carga de usuarios y estados de facturación.</p>
                        </div>
                        <button className="btn btn-primary btn-sm">Exportar Reporte</button>
                    </div>
                    <div className="scroll-x">
                        <table className="modern-table">
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
                                            <div className="org-cell">
                                                <div className="org-logo" style={{ background: `linear-gradient(135deg, var(--${club.id % 2 === 0 ? 'primary' : 'purple'}-color), #5eead4)` }}>
                                                    {club.name[0]}
                                                </div>
                                                <div className="org-info">
                                                    <strong>{club.name}</strong>
                                                    <span>ID #{club.id}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td><span className="tag-sport">{club.sport}</span></td>
                                        <td>
                                            <div className="load-meter">
                                                <div className="load-labels">
                                                    <span>{club.total} usuarios</span>
                                                    <span>{Math.round((club.athletes / (club.total || 1)) * 100)}% atletas</span>
                                                </div>
                                                <div className="progress-mini">
                                                    <div className="fill" style={{ width: `${(club.total / (stats.users.total/stats.clubs.total || 1)) * 100}%` }}></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td><StatusBadge status={club.subscription_status} /></td>
                                        <td><button className="btn-circle-ghost">•••</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Side Analytics */}
                <aside className="side-panels">
                    <div className="glass-card p-4">
                        <h3>Composición de Roles</h3>
                        <div className="donut-summary mt-3">
                            <RoleIndicator label="Atletas" count={stats.users.athletes} total={stats.users.total} color="#10b981" />
                            <RoleIndicator label="Entrenadores" count={stats.users.trainers} total={stats.users.total} color="#3b82f6" />
                            <RoleIndicator label="Admins" count={stats.users.admins} total={stats.users.total} color="#ef4444" />
                        </div>
                    </div>

                    <div className="glass-card p-4 mt-4">
                        <h3>Planes Contratados</h3>
                        <div className="plans-breakdown mt-3">
                            <PlanRow label="Unlimited" price="$150" count={stats.clubs.distribution.filter(c => c.plan_type === 'UNLIMITED').length} color="var(--warning-color)" />
                            <PlanRow label="Professional" price="$70" count={stats.clubs.distribution.filter(c => c.plan_type === 'PRO').length} color="var(--purple-color)" />
                            <PlanRow label="Basic" price="$30" count={stats.clubs.distribution.filter(c => c.plan_type === 'BASIC').length} color="var(--primary-color)" />
                        </div>
                    </div>
                </aside>
            </div>

            <style>{`
                :root {
                    --dash-bg: #0f172a;
                    --card-bg: rgba(255, 255, 255, 0.85);
                    --accent-blue: #38bdf8;
                    --accent-emerald: #10b981;
                    --glass-border: rgba(255, 255, 255, 0.2);
                }

                .super-dashboard {
                    color: var(--text-primary);
                    padding: 0 10px 40px;
                }

                .dashboard-top-bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 0;
                    margin-bottom: 20px;
                }
                .welcome-text h1 { font-size: 1.8rem; font-weight: 800; letter-spacing: -0.04em; color: var(--text-primary); }
                .welcome-text p { font-size: 0.85rem; color: var(--text-secondary); }

                .top-actions { display: flex; align-items: center; gap: 16px; }
                .btn-icon {
                    width: 42px; height: 42px; border-radius: 12px;
                    background: white; border: 1px solid var(--border-color);
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer; transition: all 0.2s; font-size: 1.1rem;
                }
                .btn-icon:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }

                .user-profile-summary {
                    display: flex; align-items: center; gap: 12px;
                    padding: 6px 6px 6px 16px; background: white;
                    border-radius: 99px; border: 1px solid var(--border-color);
                    font-size: 0.85rem; font-weight: 600;
                }
                .avatar-mini {
                    width: 32px; height: 32px; border-radius: 50%;
                    background: var(--primary-color); color: white;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 0.75rem;
                }

                .hero-banner {
                    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                    border-radius: 30px; padding: 50px; color: white;
                    position: relative; overflow: hidden;
                    box-shadow: 0 20px 40px rgba(15, 23, 42, 0.15);
                }
                .hero-main-content { position: relative; z-index: 2; display: flex; justify-content: space-between; align-items: center; }
                .hero-text h2 { font-size: 2.2rem; font-weight: 800; margin-bottom: 8px; letter-spacing: -0.03em; }
                .hero-text p { color: rgba(255,255,255,0.7); font-size: 1.1rem; }
                
                .hero-metrics { display: flex; align-items: center; gap: 40px; }
                .hero-metric-item { display: flex; flex-direction: column; align-items: center; }
                .metric-value { font-size: 2.8rem; font-weight: 900; line-height: 1; }
                .metric-label { font-size: 0.9rem; color: rgba(255,255,255,0.6); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
                .divider-v { width: 1px; height: 60px; background: rgba(255,255,255,0.15); }

                .blob { position: absolute; border-radius: 50%; filter: blur(80px); z-index: 1; }
                .blob-1 { width: 300px; height: 300px; background: var(--primary-color); top: -100px; right: -50px; opacity: 0.3; }
                .blob-2 { width: 250px; height: 250px; background: #8b5cf6; bottom: -80px; left: 10%; opacity: 0.2; }

                .stat-card-premium {
                    background: white; border-radius: 24px; padding: 24px;
                    border: 1px solid var(--border-color);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex; flex-direction: column; gap: 12px;
                }
                .stat-card-premium:hover { transform: translateY(-5px); box-shadow: 0 12px 30px rgba(0,0,0,0.08); }
                .sc-icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; }
                
                .sc-cyan { background: #ecfeff; color: #0891b2; }
                .sc-emerald { background: #ecfdf5; color: #059669; }
                .sc-amber { background: #fffbeb; color: #d97706; }
                .sc-indigo { background: #eef2ff; color: #4f46e5; }

                .sc-value { font-size: 1.8rem; font-weight: 800; color: var(--text-primary); }
                .sc-label { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); }
                .sc-sub { font-size: 0.75rem; color: var(--text-muted); }

                .layout-grid-main { display: grid; grid-template-columns: 1fr 320px; gap: 24px; }
                .glass-card { background: white; border-radius: 24px; border: 1px solid var(--border-color); box-shadow: var(--card-shadow); overflow: hidden; }
                
                .card-header { padding: 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); }
                .header-info h3 { font-size: 1.1rem; font-weight: 700; }
                .header-info p { font-size: 0.8rem; color: var(--text-secondary); }

                .modern-table { width: 100%; border-collapse: collapse; }
                .modern-table th { padding: 16px 24px; text-align: left; font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; background: #f8fafc; }
                .modern-table td { padding: 16px 24px; border-bottom: 1px solid var(--border-color); font-size: 0.9rem; }
                
                .org-cell { display: flex; align-items: center; gap: 14px; }
                .org-logo { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 0.9rem; }
                .org-info { display: flex; flex-direction: column; }
                .org-info span { font-size: 0.72rem; color: var(--text-muted); }

                .tag-sport { background: #f1f5f9; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); }
                
                .load-meter { width: 140px; }
                .load-labels { display: flex; justify-content: space-between; font-size: 0.7rem; margin-bottom: 6px; font-weight: 600; }
                .progress-mini { height: 6px; background: #f1f5f9; border-radius: 10px; overflow: hidden; }
                .progress-mini .fill { height: 100%; background: var(--primary-color); border-radius: 10px; }

                .btn-circle-ghost { width: 32px; height: 32px; border-radius: 50%; border: none; background: transparent; cursor: pointer; color: var(--text-muted); transition: background 0.2s; }
                .btn-circle-ghost:hover { background: #f1f5f9; color: var(--text-primary); }

                .role-item { margin-bottom: 16px; }
                .role-head { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.85rem; font-weight: 600; }
                .role-bar { height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
                .role-fill { height: 100%; border-radius: 4px; }

                .plan-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; border-radius: 14px; margin-bottom: 8px; transition: background 0.2s; }
                .plan-item:hover { background: #f8fafc; }
                .plan-info { display: flex; align-items: center; gap: 10px; }
                .plan-dot { width: 10px; height: 10px; border-radius: 50%; }
                .plan-name { font-size: 0.85rem; font-weight: 600; }
                .plan-price { font-size: 0.75rem; color: var(--text-muted); margin-left: 4px; }
                .plan-count { font-weight: 800; font-size: 0.9rem; }

                .animate-in { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
                @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }

                .loading-state { height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; color: var(--text-secondary); }
                .loader-orbit { width: 60px; height: 60px; position: relative; }
                .orbit-core { width: 20px; height: 20px; background: var(--primary-color); border-radius: 50%; position: absolute; top: 20px; left: 20px; }
                .orbit-ring { width: 100%; height: 100%; border: 3px solid rgba(37,99,235,0.1); border-top-color: var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }

                .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
            `}</style>
        </div>
    );
};

const StatCard = ({ label, value, sub, icon, color }) => (
    <div className="stat-card-premium">
        <div className={`sc-icon sc-${color}`}>{icon}</div>
        <div className="sc-info">
            <div className="sc-value">{value}</div>
            <div className="sc-label">{label}</div>
            <div className="sc-sub">{sub}</div>
        </div>
    </div>
);

const RoleIndicator = ({ label, count, total, color }) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
        <div className="role-item">
            <div className="role-head">
                <span>{label}</span>
                <span style={{ color }}>{count} ({percentage.toFixed(0)}%)</span>
            </div>
            <div className="role-bar">
                <div className="role-fill" style={{ width: `${percentage}%`, background: color }}></div>
            </div>
        </div>
    );
};

const PlanRow = ({ label, price, count, color }) => (
    <div className="plan-item">
        <div className="plan-info">
            <div className="plan-dot" style={{ background: color }}></div>
            <span className="plan-name">{label} <span className="plan-price">{price}</span></span>
        </div>
        <div className="plan-count">{count}</div>
    </div>
);

const StatusBadge = ({ status }) => {
    const configs = {
        ACTIVE: { label: 'Activo', color: '#10b981', bg: '#ecfdf5' },
        TRIAL: { label: 'Prueba', color: '#3b82f6', bg: '#eff6ff' },
        EXPIRED: { label: 'Vencido', color: '#ef4444', bg: '#fef2f2' },
        INACTIVE: { label: 'Inactivo', color: '#64748b', bg: '#f1f5f9' }
    };
    const config = configs[status] || configs.INACTIVE;
    return (
        <span style={{ 
            background: config.bg, color: config.color, 
            padding: '4px 12px', borderRadius: '99px', 
            fontSize: '0.75rem', fontWeight: 700,
            display: 'inline-flex', alignItems: 'center', gap: '4px'
        }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: config.color }}></span>
            {config.label}
        </span>
    );
};

export default SuperAdminDashboard;
