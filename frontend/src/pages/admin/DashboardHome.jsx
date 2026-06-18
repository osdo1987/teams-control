import React, { useState, useEffect } from 'react';
import { athleteService } from '../../services/athleteService';
import { groupService } from '../../services/groupService';
import { paymentService } from '../../services/paymentService';
import { authService } from '../../services/authService';
import { statsService } from '../../services/statsService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { IconCalendar, IconDollarSign, IconActivity, IconUsers, IconClipboard } from '../../components/Icons';

const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444'];
const GROUP_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f97316', '#ec4899', '#0ea5e9', '#6366f1', '#84cc16', '#94a3b8'];

const DashboardHome = () => {
  const [stats, setStats] = useState({
    athletes: 0,
    groups: 0,
    trainers: 0,
    recap: 0,
    pending: 0
  });
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = authService.getCurrentUser();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [athletes = [], groups = [], payments = [], trainers = [], dashData] = await Promise.all([
        athleteService.getAthletes().catch(() => []),
        groupService.getGroups().catch(() => []),
        paymentService.getPayments().catch(() => []),
        authService.getTrainers().catch(() => []),
        statsService.getDashboard().catch(() => null)
      ]);

      setDashboardData(dashData);

      const now = new Date();
      const month = now.getMonth();
      const year = now.getFullYear();

      const paidThisMonth = payments.filter(p => {
        const d = new Date(p.payment_date);
        return p.status === 'PAID' && d.getMonth() === month && d.getFullYear() === year;
      });

      const totalReceived = paidThisMonth.reduce((acc, p) => acc + Number(p.amount), 0);

      let totalPending = 0;
      athletes.forEach(a => {
        const hasPaid = payments.some(p => {
          const d = new Date(p.payment_date);
          return p.athlete_id === a.id && p.status === 'PAID' && d.getMonth() === month && d.getFullYear() === year;
        });
        if (!hasPaid) {
          totalPending += Number(a.current_groups?.[0]?.monthly_fee || 0);
        }
      });

      setStats({
        athletes: athletes.length,
        groups: groups.length,
        trainers: trainers.length,
        recap: totalReceived,
        pending: totalPending
      });
    } catch (err) {
      console.error("Error al cargar estadísticas:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-state"><p>Cargando resumen...</p></div>;

  const paymentPieData = dashboardData?.payments ? [
    { name: 'Pagados', value: dashboardData.payments.paid },
    { name: 'Pendientes', value: dashboardData.payments.pending },
    { name: 'Vencidos', value: dashboardData.payments.overdue }
  ].filter(d => d.value > 0) : [];

  const attendanceData = dashboardData?.attendance?.weekly || [];
  const revenueTrend = dashboardData?.payments?.revenue_trend || [];
  const attendanceTrend = dashboardData?.attendance?.trend || [];
  const groupsData = dashboardData?.groups || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Panel de Control</h1>
          <p className="text-muted">Bienvenido al resumen de {user.club_name || 'tu club'}.</p>
        </div>
        <div className="date-badge">
          {new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }).toUpperCase()}
        </div>
      </div>

      {/* Top Stats Row - 5 indicators in a single row */}
      <div className="stat-grid-5">
        <div className="stat-card-mini" style={{ borderLeft: '4px solid var(--brand-500)' }}>
          <div className="stat-card-mini-icon" style={{ background: 'var(--brand-50)', color: 'var(--brand-600)' }}>
            <IconUsers size={20} />
          </div>
          <div className="stat-card-mini-body">
            <div className="stat-card-mini-label">ATLETAS</div>
            <div className="stat-card-mini-value">{stats.athletes}</div>
            <div className="stat-card-mini-sub">Registrados</div>
          </div>
        </div>
        <div className="stat-card-mini" style={{ borderLeft: '4px solid var(--success-500)' }}>
          <div className="stat-card-mini-icon" style={{ background: 'var(--success-50)', color: 'var(--success-700)' }}>
            <IconActivity size={20} />
          </div>
          <div className="stat-card-mini-body">
            <div className="stat-card-mini-label">GRUPOS</div>
            <div className="stat-card-mini-value">{stats.groups}</div>
            <div className="stat-card-mini-sub">Activos</div>
          </div>
        </div>
        <div className="stat-card-mini" style={{ borderLeft: '4px solid var(--purple-500)' }}>
          <div className="stat-card-mini-icon" style={{ background: 'var(--purple-50)', color: 'var(--purple-700)' }}>
            <IconClipboard size={20} />
          </div>
          <div className="stat-card-mini-body">
            <div className="stat-card-mini-label">ENTRENADORES</div>
            <div className="stat-card-mini-value">{stats.trainers}</div>
            <div className="stat-card-mini-sub">Staff</div>
          </div>
        </div>
        <div className="stat-card-mini" style={{ borderLeft: '4px solid var(--success-500)' }}>
          <div className="stat-card-mini-icon" style={{ background: '#f0fdf4', color: '#14532d' }}>
            <IconDollarSign size={20} />
          </div>
          <div className="stat-card-mini-body">
            <div className="stat-card-mini-label">RECAUDADO</div>
            <div className="stat-card-mini-value">${stats.recap.toLocaleString()}</div>
            <div className="stat-card-mini-sub">Este mes</div>
          </div>
        </div>
        <div className="stat-card-mini" style={{ borderLeft: '4px solid var(--warning-500)' }}>
          <div className="stat-card-mini-icon" style={{ background: 'var(--warning-50)', color: 'var(--warning-700)' }}>
            <IconCalendar size={20} />
          </div>
          <div className="stat-card-mini-body">
            <div className="stat-card-mini-label">PENDIENTE</div>
            <div className="stat-card-mini-value">${stats.pending.toLocaleString()}</div>
            <div className="stat-card-mini-sub">Por cobrar</div>
          </div>
        </div>
      </div>

      {/* Charts Row 1: Attendance Weekly + Payment Distribution */}
      <div className="grid-2">
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '16px', fontWeight: 700 }}>Asistencia Semanal</h3>
          {attendanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(d) => {
                  const date = new Date(d);
                  return date.toLocaleDateString('es-CO', { weekday: 'short', month: 'numeric', day: 'numeric' });
                }} fontSize={10} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="present" stackId="a" fill="#10b981" name="Presentes" />
                <Bar dataKey="absent" stackId="a" fill="#ef4444" name="Ausentes" />
                <Bar dataKey="excused" stackId="a" fill="#3b82f6" name="Justificados" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>Sin datos de asistencia esta semana.</p>
          )}
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '16px', fontWeight: 700 }}>Distribución de Pagos del Mes</h3>
          {paymentPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={paymentPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {paymentPieData.map((entry, index) => (
                    <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>Sin pagos este mes.</p>
          )}
          {dashboardData?.payments && (
            <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Total recaudado: <strong style={{ color: '#10b981' }}>${dashboardData.payments.total_paid?.toLocaleString()}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2: Revenue Trend + Attendance Trend */}
      <div className="grid-2">
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '16px', fontWeight: 700 }}>Tendencia de Ingresos (6 meses)</h3>
          {revenueTrend.length > 0 && revenueTrend.some(r => r.revenue > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month_label" fontSize={10} />
                <YAxis fontSize={11} />
                <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} name="Ingresos" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>Sin datos de ingresos.</p>
          )}
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '16px', fontWeight: 700 }}>Tendencia de Asistencia (6 meses)</h3>
          {attendanceTrend.length > 0 && attendanceTrend.some(a => a.total > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month_label" fontSize={10} />
                <YAxis fontSize={11} domain={[0, 100]} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Line type="monotone" dataKey="pct" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} name="% Asistencia" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>Sin datos de asistencia.</p>
          )}
        </div>
      </div>

      {/* Charts Row 3: Athletes per Group + Tests Summary */}
      <div className="grid-2">
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '16px', fontWeight: 700 }}>Atletas por Grupo</h3>
          {groupsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={groupsData.map((g, i) => ({ ...g, fill: GROUP_COLORS[i % GROUP_COLORS.length] }))} dataKey="count" nameKey="group" cx="50%" cy="50%" outerRadius={80} label={({ group, count }) => `${group}: ${count}`}>
                  {groupsData.map((_, index) => (
                    <Cell key={index} fill={GROUP_COLORS[index % GROUP_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>Sin grupos registrados.</p>
          )}
        </div>

        {dashboardData?.tests && (dashboardData.tests.total_count > 0 || dashboardData.tests.recent_count > 0) && (
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '16px', fontWeight: 700 }}>Resumen de Tests</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="stat-card" style={{ borderBottom: '4px solid #3b82f6', textAlign: 'center' }}>
                <div className="stat-label">TOTAL EVALUACIONES</div>
                <div className="stat-value">{dashboardData.tests.total_count}</div>
              </div>
              <div className="stat-card" style={{ borderBottom: '4px solid #10b981', textAlign: 'center' }}>
                <div className="stat-label">ESTE MES</div>
                <div className="stat-value">{dashboardData.tests.recent_count}</div>
              </div>
              <div className="stat-card" style={{ borderBottom: '4px solid #8b5cf6', textAlign: 'center' }}>
                <div className="stat-label">ATLETAS EVALUADOS</div>
                <div className="stat-value">{dashboardData.tests.athletes_tested}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions - redesigned as visual action cards */}
      <div style={{ marginTop: '40px' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '16px', fontWeight: 700 }}>Acciones Rápidas</h3>
        <div className="quick-actions-grid">
          <a href="/admin/attendance" className="quick-action-card">
            <div className="quick-action-icon" style={{ background: '#eef2ff', color: '#4f46e5' }}>
              <IconCalendar size={22} />
            </div>
            <div className="quick-action-body">
              <span className="quick-action-title">Tomar Asistencia</span>
              <span className="quick-action-desc">Registra la asistencia del día</span>
            </div>
            <span className="quick-action-arrow">→</span>
          </a>
          <a href="/admin/payments" className="quick-action-card">
            <div className="quick-action-icon" style={{ background: '#f0fdf4', color: '#15803d' }}>
              <IconDollarSign size={22} />
            </div>
            <div className="quick-action-body">
              <span className="quick-action-title">Registrar Pagos</span>
              <span className="quick-action-desc">Gestiona cobros y pagos</span>
            </div>
            <span className="quick-action-arrow">→</span>
          </a>
          <a href="/admin/tests" className="quick-action-card">
            <div className="quick-action-icon" style={{ background: '#fffbeb', color: '#b45309' }}>
              <IconActivity size={22} />
            </div>
            <div className="quick-action-body">
              <span className="quick-action-title">Evaluar Atletas</span>
              <span className="quick-action-desc">Realiza pruebas físicas</span>
            </div>
            <span className="quick-action-arrow">→</span>
          </a>
          <a href="/admin/users" className="quick-action-card">
            <div className="quick-action-icon" style={{ background: '#faf5ff', color: '#7e22ce' }}>
              <IconUsers size={22} />
            </div>
            <div className="quick-action-body">
              <span className="quick-action-title">Ver Usuarios</span>
              <span className="quick-action-desc">Administra el club</span>
            </div>
            <span className="quick-action-arrow">→</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;