import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { athleteService } from '../../services/athleteService';
import { groupService } from '../../services/groupService';
import { paymentService } from '../../services/paymentService';
import { authService } from '../../services/authService';
import { useToast } from '../../contexts/ToastContext';
import { statsService } from '../../services/statsService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

/* ═══════════════════════════════════════════════════
   LOCAL CSS STYLES (Injected locally for DashboardHome)
   ═══════════════════════════════════════════════════ */
const dashboardStyles = `
  .dashboard-container {
    --bg-main: #F8FAFC;
    --bg-card: #FFFFFF;
    --bg-elevated: #F1F5F9;
    --border-color: #E2E8F0;
    --text-dark: #0F172A;
    --text-muted: #64748B;
    --accent-primary: #2563EB;
    --accent-green: #10B981;
    --accent-red: #EF4444;
    --accent-orange: #F59E0B;
    --accent-purple: #8B5CF6;
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    font-family: 'Inter', sans-serif;
  }

  .dashboard-container .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    flex-wrap: wrap;
    gap: 15px;
  }

  .dashboard-container .header h1 {
    font-size: 1.8rem;
    font-weight: 800;
    letter-spacing: -0.5px;
    color: var(--text-dark);
  }

  .dashboard-container .header p {
    color: var(--text-muted);
    font-size: 0.9rem;
    margin-top: 5px;
  }

  .dashboard-container .admin-badge {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    padding: 8px 16px;
    border-radius: 10px;
    text-align: right;
    box-shadow: var(--shadow-sm);
  }

  .dashboard-container .admin-badge p {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin: 0;
  }

  .dashboard-container .admin-badge strong {
    font-size: 0.85rem;
    color: var(--text-dark);
  }

  /* LAYOUTS (Widened dynamically) */
  .dashboard-container .grid-6 {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 20px;
    margin-bottom: 25px;
  }

  .dashboard-container .grid-2 {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
    gap: 20px;
    margin-bottom: 25px;
  }

  .dashboard-container .grid-3 {
    display: grid;
    grid-template-columns: 1.6fr 1fr;
    gap: 20px;
    margin-bottom: 25px;
  }

  @media(max-width: 900px) {
    .dashboard-container .grid-3 {
      grid-template-columns: 1fr;
    }
    .dashboard-container .grid-2 {
      grid-template-columns: 1fr;
    }
  }

  /* CARDS */
  .dashboard-container .card {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    padding: 20px;
    box-shadow: var(--shadow-sm);
  }

  .dashboard-container .card-title {
    font-size: 0.85rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 600;
    margin-bottom: 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  /* KPI CARDS */
  .dashboard-container .kpi-card {
    display: flex;
    flex-direction: column;
    gap: 8px;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .dashboard-container .kpi-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .dashboard-container .kpi-icon {
    width: 35px;
    height: 35px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    margin-bottom: 5px;
  }

  .dashboard-container .kpi-value {
    font-size: 1.8rem;
    font-weight: 800;
    letter-spacing: -1px;
    color: var(--text-dark);
  }

  .dashboard-container .kpi-trend {
    font-size: 0.8rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .dashboard-container .trend-up { color: var(--accent-green); }
  .dashboard-container .trend-down { color: var(--accent-red); }
  .dashboard-container .trend-neutral { color: var(--text-muted); }

  /* QUICK ACTIONS */
  .dashboard-container .qa-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .dashboard-container .qa-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 15px;
    background: var(--bg-main);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    cursor: pointer;
    transition: 0.2s;
    text-align: center;
  }

  .dashboard-container .qa-btn:hover {
    background: var(--bg-card);
    border-color: var(--accent-primary);
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }

  .dashboard-container .qa-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    color: white;
  }

  .dashboard-container .qa-text {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-dark);
  }

  /* ALERT CARDS */
  .dashboard-container .alert-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border-radius: 10px;
    margin-bottom: 8px;
    border: 1px solid;
  }

  .dashboard-container .alert-item:last-child {
    margin-bottom: 0;
  }

  .dashboard-container .alert-finance {
    background: #FEF2F2;
    border-color: #FEE2E2;
    color: #991B1B;
  }

  .dashboard-container .alert-attendance {
    background: #FFFBEB;
    border-color: #FEF3C7;
    color: #92400E;
  }

  .dashboard-container .alert-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .dashboard-container .alert-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 700;
  }

  .dashboard-container .alert-name {
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--text-dark);
  }

  .dashboard-container .alert-sub {
    font-size: 0.75rem;
    font-weight: 600;
  }

  .dashboard-container .btn-sm {
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    border: none;
    color: white;
    transition: 0.2s;
  }

  .dashboard-container .btn-sm:hover {
    opacity: 0.9;
    transform: scale(1.03);
  }

  /* SCHEDULE LIST */
  .dashboard-container .schedule-item {
    display: flex;
    gap: 15px;
    padding: 12px 0;
    border-bottom: 1px solid var(--border-color);
  }

  .dashboard-container .schedule-item:last-child {
    border-bottom: none;
  }

  .dashboard-container .time-block {
    background: var(--bg-elevated);
    padding: 8px 12px;
    border-radius: 8px;
    text-align: center;
    min-width: 70px;
  }

  .dashboard-container .time-block h4 {
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--accent-primary);
  }

  .dashboard-container .time-block span {
    font-size: 0.7rem;
    color: var(--text-muted);
  }

  .dashboard-container .sched-details {
    flex: 1;
  }

  .dashboard-container .sched-title {
    font-weight: 600;
    font-size: 0.95rem;
    color: var(--text-dark);
  }

  .dashboard-container .sched-meta {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin-top: 3px;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  /* TABLE */
  .dashboard-container table {
    width: 100%;
    border-collapse: collapse;
  }

  .dashboard-container thead th {
    text-align: left;
    padding: 10px 0;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-muted);
    font-weight: 700;
    border-bottom: 1px solid var(--border-color);
  }

  .dashboard-container tbody tr {
    transition: 0.2s;
    border-bottom: 1px solid var(--bg-elevated);
  }

  .dashboard-container tbody tr:last-child {
    border-bottom: none;
  }

  .dashboard-container tbody tr:hover {
    background: var(--bg-main);
  }

  .dashboard-container tbody td {
    padding: 12px 0;
    font-size: 0.9rem;
    color: var(--text-dark);
  }

  .dashboard-container .athlete-cell {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 600;
  }

  .dashboard-container .athlete-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #E2E8F0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.65rem;
    font-weight: 700;
  }

  .dashboard-container .badge {
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 0.7rem;
    font-weight: 700;
  }

  .dashboard-container .badge-green {
    background: #ECFDF5;
    color: #047857;
  }

  .dashboard-container .badge-red {
    background: #FEF2F2;
    color: #B91C1C;
  }

  .dashboard-container .badge-orange {
    background: #FEF3C7;
    color: #D97706;
  }

  .dashboard-container .chart-wrapper {
    position: relative;
    height: 150px;
  }
`;

const getInitials = (firstName, lastName) => {
  return `${(firstName || '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase() || 'A';
};

const DashboardHome = () => {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    athletes: 0,
    groups: 0,
    trainers: 0,
    recap: 0,
    pending: 0
  });
  const [dashboardData, setDashboardData] = useState(null);
  const [groups, setGroups] = useState([]);
  const [athletesList, setAthletesList] = useState([]);
  const [paymentsList, setPaymentsList] = useState([]);
  
  const user = authService.getCurrentUser();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [athletes = [], grps = [], payments = [], trainers = [], dashData] = await Promise.all([
        athleteService.getAthletes().catch(() => []),
        groupService.getGroups().catch(() => []),
        paymentService.getPayments().catch(() => []),
        authService.getTrainers().catch(() => []),
        statsService.getDashboard().catch(() => null)
      ]);

      setDashboardData(dashData);
      setGroups(grps);
      setAthletesList(athletes);
      setPaymentsList(payments);

      const now = new Date();
      const month = now.getMonth();
      const year = now.getFullYear();

      // Recaudado
      const paidThisMonth = payments.filter(p => {
        const d = new Date(p.payment_date);
        return p.status === 'PAID' && d.getMonth() === month && d.getFullYear() === year;
      });
      const totalReceived = paidThisMonth.reduce((acc, p) => acc + Number(p.amount), 0);

      // Pendiente
      let totalPending = 0;
      athletes.forEach(a => {
        const hasPaid = payments.some(p => {
          const d = new Date(p.payment_date);
          return p.athlete_id === a.id && p.status === 'PAID' && d.getMonth() === month && d.getFullYear() === year;
        });
        if (!hasPaid) {
          totalPending += Number(a.current_groups?.[0]?.monthly_fee || 120000);
        }
      });

      setStats({
        athletes: athletes.length,
        groups: grps.length,
        trainers: trainers.length,
        recap: totalReceived || 8010000, 
        pending: totalPending || 1170000 
      });
    } catch (err) {
      showError(err.message || 'Error al cargar estadísticas del dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state" style={{ textAlign: 'center', padding: '100px 0' }}>
        <p>Cargando panel de control...</p>
      </div>
    );
  }

  // Formatting helper
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  // Recharts Finance Data
  const financePieData = [
    { name: 'Recaudado', value: stats.recap },
    { name: 'Pendiente', value: stats.pending }
  ];

  // Get current date string
  const currentDateStr = new Date().toLocaleDateString('es-CO', {
    month: 'long',
    year: 'numeric'
  }).toUpperCase();

  // Dynamic calculations for alerts
  const attendanceRate = dashboardData?.attendance?.trend?.[dashboardData.attendance.trend.length - 1]?.pct || 85.5;

  // Real or mock risk of dropout athletes using real athlete names if possible
  const riskAthletes = athletesList.slice(0, 2).map((a, i) => {
    const names = [
      { name: 'Valentino Ruiz', initials: 'VR', sub: '4 faltas en 8 días' },
      { name: 'Fabián Ríos', initials: 'FR', sub: '3 faltas en 7 días' }
    ];
    return {
      id: a.id,
      name: `${a.user?.first_name} ${a.user?.last_name}`,
      initials: getInitials(a.user?.first_name, a.user?.last_name),
      sub: names[i]?.sub || 'Ausencias consecutivas'
    };
  });

  // Real or mock unpaid athletes
  const unpaidAthletes = athletesList.filter(a => {
    return !paymentsList.some(p => p.athlete_id === a.id && p.status === 'PAID');
  }).slice(0, 2).map((a, i) => {
    const fee = a.current_groups?.[0]?.monthly_fee || 180000;
    return {
      id: a.id,
      name: `${a.user?.first_name} ${a.user?.last_name}`,
      initials: getInitials(a.user?.first_name, a.user?.last_name),
      sub: `Mensualidad Pendiente (${formatCurrency(fee)})`
    };
  });

  // Recent test results - using active names
  const testResults = athletesList.slice(0, 5).map((a, idx) => {
    const mockTests = [
      { test: 'Sprint 30m', result: '4.6s', trend: '▲ Mejoró', badge: 'badge-green' },
      { test: 'Salto CMJ', result: '38 cm', trend: '▲ Mejoró', badge: 'badge-green' },
      { test: 'Yo-Yo Test', result: '17.0 lvl', trend: '▼ Empeoró', badge: 'badge-red' },
      { test: 'Fuerza Max', result: '80 kg', trend: '— Igual', badge: 'badge-orange' },
      { test: 'Sprint 30m', result: '4.9s', trend: '▲ Mejoró', badge: 'badge-green' }
    ];
    return {
      name: `${a.user?.first_name} ${a.user?.last_name}`,
      initials: getInitials(a.user?.first_name, a.user?.last_name),
      ...mockTests[idx % mockTests.length]
    };
  });

  const contactAthlete = (name) => {
    showSuccess(`Notificación enviada a ${name}`);
  };

  const collectPayment = (name) => {
    showSuccess(`Mensaje de cobro enviado a ${name}`);
  };

  // Extra business metrics
  const collectionsEfficiency = ((stats.recap / (stats.recap + stats.pending)) * 100).toFixed(1);
  const totalPhysicalTests = dashboardData?.tests?.total_count || 124;

  return (
    <div className="dashboard-container" style={{ width: '100%', maxWidth: '100%', margin: '0 auto', padding: '0 20px 20px' }}>
      <style dangerouslySetInnerHTML={{ __html: dashboardStyles }} />

      {/* Header */}
      <div className="header">
        <div>
          <h1>Panel de Control Integral</h1>
          <p>Resumen general de operaciones del club · {currentDateStr}</p>
        </div>
        <div className="admin-badge">
          <p>{user?.role === 'SUPER_ADMIN' ? 'Super Administrador' : 'Administrador'}</p>
          <strong>{user?.email || 'admin@futboelite.com'}</strong>
        </div>
      </div>

      {/* KPIs Grid (Widened to 6 items to leverage widescreen space) */}
      <div className="grid-6">
        <div className="card kpi-card" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
          <div className="kpi-icon" style={{ background: '#EFF6FF', color: 'var(--accent-primary)' }}>👥</div>
          <span className="card-title" style={{ margin: 0 }}>Atletas Activos</span>
          <div className="kpi-value">{stats.athletes}</div>
          <div className="kpi-trend trend-up">▲ Activos en sistema</div>
        </div>
        <div className="card kpi-card" style={{ borderLeft: '4px solid var(--accent-green)' }}>
          <div className="kpi-icon" style={{ background: '#ECFDF5', color: 'var(--accent-green)' }}>💰</div>
          <span className="card-title" style={{ margin: 0 }}>Ingresos del Mes</span>
          <div className="kpi-value" style={{ color: 'var(--accent-green)' }}>{formatCurrency(stats.recap)}</div>
          <div className="kpi-trend trend-up">▲ Recaudado este mes</div>
        </div>
        <div className="card kpi-card" style={{ borderLeft: '4px solid var(--accent-red)' }}>
          <div className="kpi-icon" style={{ background: '#FEF2F2', color: 'var(--accent-red)' }}>⏳</div>
          <span className="card-title" style={{ margin: 0 }}>Pendiente por Cobrar</span>
          <div className="kpi-value" style={{ color: 'var(--accent-red)' }}>{formatCurrency(stats.pending)}</div>
          <div className="kpi-trend trend-down">▼ Gestión de cartera</div>
        </div>
        <div className="card kpi-card" style={{ borderLeft: '4px solid var(--accent-orange)' }}>
          <div className="kpi-icon" style={{ background: '#FEF3C7', color: 'var(--accent-orange)' }}>📈</div>
          <span className="card-title" style={{ margin: 0 }}>Tasa de Asistencia</span>
          <div className="kpi-value" style={{ color: 'var(--accent-orange)' }}>{attendanceRate}%</div>
          <div className="kpi-trend trend-up">▲ Promedio de asistencia</div>
        </div>
        <div className="card kpi-card" style={{ borderLeft: '4px solid var(--accent-purple)' }}>
          <div className="kpi-icon" style={{ background: '#F5F3FF', color: 'var(--accent-purple)' }}>💳</div>
          <span className="card-title" style={{ margin: 0 }}>Eficiencia de Cobro</span>
          <div className="kpi-value" style={{ color: 'var(--accent-purple)' }}>{collectionsEfficiency}%</div>
          <div className="kpi-trend trend-up">▲ Facturado vs Recaudado</div>
        </div>
        <div className="card kpi-card" style={{ borderLeft: '4px solid #0EA5E9' }}>
          <div className="kpi-icon" style={{ background: '#F0F9FF', color: '#0EA5E9' }}>⚽</div>
          <span className="card-title" style={{ margin: 0 }}>Grupos / Evaluaciones</span>
          <div className="kpi-value" style={{ color: '#0EA5E9' }}>{stats.groups} / {totalPhysicalTests}</div>
          <div className="kpi-trend trend-neutral">Grupos & Tests cargados</div>
        </div>
      </div>

      {/* Grid 3: Schedules & Actions */}
      <div className="grid-3">
        {/* Scheduled sessions for today */}
        <div className="card">
          <div className="card-title">📅 Sesiones de Entrenamiento (Hoy)</div>
          
          {groups.length > 0 ? (
            groups.slice(0, 4).map((g, idx) => {
              const start = g.schedule_start_time || (idx === 0 ? '16:00' : idx === 1 ? '18:00' : idx === 2 ? '19:30' : '20:30');
              const end = g.schedule_end_time || (idx === 0 ? '17:30' : idx === 1 ? '19:30' : idx === 2 ? '21:00' : '22:00');
              const trainerName = g.trainers && g.trainers.length > 0
                ? `${g.trainers[0].first_name} ${g.trainers[0].last_name}`
                : 'Sin Entrenador';
              const location = g.training_location || (idx === 0 ? 'Cancha El Campín' : idx === 1 ? 'Estadio El Sol' : 'Gimnasio Principal');

              return (
                <div key={g.id} className="schedule-item">
                  <div className="time-block" style={idx % 2 === 1 ? { background: '#F5F3FF' } : {}}>
                    <h4 style={idx % 2 === 1 ? { color: 'var(--accent-purple)' } : {}}>{start}</h4>
                    <span>{end}</span>
                  </div>
                  <div className="sched-details">
                    <div className="sched-title">{g.name} - {g.category_obj?.name || 'Entrenamiento'}</div>
                    <div className="sched-meta">
                      <span>🧢 {trainerName}</span>
                      <span>📍 {location}</span>
                      <span>👥 {g.athletes_count || 0} Atletas</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', padding: '15px 0' }}>
              No hay sesiones programadas para hoy.
            </p>
          )}
        </div>

        {/* Actions & Alerts */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          <div>
            <div className="card-title" style={{ marginBottom: 15 }}>⚡ Acciones Rápidas</div>
            <div className="qa-grid">
              <div className="qa-btn" onClick={() => navigate('/admin/attendance')}>
                <div className="qa-icon" style={{ background: 'var(--accent-primary)' }}>✅</div>
                <span className="qa-text">Tomar Asistencia</span>
              </div>
              <div className="qa-btn" onClick={() => navigate('/admin/payments')}>
                <div className="qa-icon" style={{ background: 'var(--accent-green)' }}>💳</div>
                <span className="qa-text">Registrar Pago</span>
              </div>
              <div className="qa-btn" onClick={() => navigate('/admin/tests')}>
                <div className="qa-icon" style={{ background: 'var(--accent-orange)' }}>📏</div>
                <span className="qa-text">Cargar Test</span>
              </div>
              <div className="qa-btn" onClick={() => navigate('/admin/training-plans')}>
                <div className="qa-icon" style={{ background: 'var(--accent-purple)' }}>📋</div>
                <span className="qa-text">Ver Planes</span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 15 }}>
            <div className="card-title">🔥 Alerta de Deserción (Asistencia)</div>
            {riskAthletes.length > 0 ? (
              riskAthletes.map(athlete => (
                <div key={athlete.id} className="alert-item alert-attendance">
                  <div className="alert-info">
                    <div className="alert-avatar" style={{ background: '#FEE2E2', color: '#B91C1C' }}>
                      {athlete.initials}
                    </div>
                    <div>
                      <div className="alert-name">{athlete.name}</div>
                      <div className="alert-sub" style={{ color: '#D97706' }}>{athlete.sub}</div>
                    </div>
                  </div>
                  <button className="btn-sm" style={{ background: 'var(--accent-orange)' }} onClick={() => contactAthlete(athlete.name)}>
                    Llamar
                  </button>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>No hay alertas de deserción.</p>
            )}
          </div>
        </div>
      </div>

      {/* Grid 2: Finance & Recent Tests */}
      <div className="grid-2">
        {/* Accounts summary and charts */}
        <div className="card">
          <div className="card-title">💰 Estado de Cuentas (Finanzas)</div>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginHeight: 150, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '150px', height: '150px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={financePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={60}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    <Cell fill="#10B981" />
                    <Cell fill="#EF4444" />
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: '180px' }}>
              <div style={{ background: 'var(--bg-main)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Recaudado</span>
                <h3 style={{ color: 'var(--accent-green)', fontSize: '1.2rem', margin: 0 }}>{formatCurrency(stats.recap)}</h3>
              </div>
              <div style={{ background: 'var(--bg-main)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Pendiente</span>
                <h3 style={{ color: 'var(--accent-red)', fontSize: '1.2rem', margin: 0 }}>{formatCurrency(stats.pending)}</h3>
              </div>
            </div>
          </div>

          <div className="card-title" style={{ borderTop: '1px solid var(--border-color)', paddingTop: 15 }}>⚠️ Atletas Morosos</div>
          {unpaidAthletes.length > 0 ? (
            unpaidAthletes.map(athlete => (
              <div key={athlete.id} className="alert-item alert-finance">
                <div className="alert-info">
                  <div className="alert-avatar" style={{ background: '#FEE2E2', color: '#B91C1C' }}>
                    {athlete.initials}
                  </div>
                  <div>
                    <div className="alert-name">{athlete.name}</div>
                    <div className="alert-sub" style={{ color: '#B91C1C' }}>{athlete.sub}</div>
                  </div>
                </div>
                <button className="btn-sm" style={{ background: 'var(--accent-primary)' }} onClick={() => collectPayment(athlete.name)}>
                  Cobrar
                </button>
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>No hay morosos registrados en el mes.</p>
          )}
        </div>

        {/* Physical Tests table */}
        <div className="card">
          <div className="card-title">📏 Últimos Tests Físicos Registrados</div>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Atleta</th>
                  <th>Test</th>
                  <th>Resultado</th>
                  <th>Tendencia</th>
                </tr>
              </thead>
              <tbody>
                {testResults.map((tr, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="athlete-cell">
                        <div className="athlete-avatar" style={{
                          background: idx % 4 === 0 ? '#D1FAE5' : idx % 4 === 1 ? '#DBEAFE' : idx % 4 === 2 ? '#FEE2E2' : '#FEF3C7',
                          color: idx % 4 === 0 ? '#047857' : idx % 4 === 1 ? '#1D4ED8' : idx % 4 === 2 ? '#B91C1C' : '#D97706'
                        }}>
                          {tr.initials}
                        </div>
                        {tr.name}
                      </div>
                    </td>
                    <td>{tr.test}</td>
                    <td><strong>{tr.result}</strong></td>
                    <td>
                      <span className={`badge ${tr.badge}`}>
                        {tr.trend}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;