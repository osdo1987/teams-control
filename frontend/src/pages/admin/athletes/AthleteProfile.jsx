import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { athleteService } from '../../../services/athleteService';
import { testService } from '../../../services/testService';
import { trainingPlanService } from '../../../services/trainingPlanService';
import { api } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f97316', '#ec4899', '#0ea5e9'];
const avatarColor = (name = '') => COLORS[name.charCodeAt(0) % COLORS.length];
const initials = (first = '?', last = '?') => `${first?.[0] || '?'}${last?.[0] || '?'}`.toUpperCase();

const PAYMENT_STATUS = {
  PAID: 'badge badge-success',
  PENDING: 'badge badge-warning',
  OVERDUE: 'badge badge-danger'
};

const ATTENDANCE_STATUS = {
  PRESENT: 'badge badge-success',
  ABSENT: 'badge badge-danger',
  EXCUSED: 'badge badge-info'
};

const AthleteProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [athlete, setAthlete] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showError } = useToast();
  const [activeTab, setActiveTab] = useState('rendimiento');

  const [profileData, setProfileData] = useState({
    payments: [], attendance: [], tests: [], movements: [], groups: [], plans: []
  });
  const [testHistory, setTestHistory] = useState([]);
  const [selectedTemplateForHistory, setSelectedTemplateForHistory] = useState('');
  const [testStats, setTestStats] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      const [athleteData, templatesData] = await Promise.all([
        athleteService.getAthlete(id),
        testService.getTemplates()
      ]);
      setAthlete(athleteData);
      setTemplates(templatesData);

      const [payments, attendance, history, movements, statsData, plans] = await Promise.all([
        api(`/payments/athlete/${id}`),
        api(`/attendance/athlete/${id}`),
        testService.getAthleteHistory(id),
        api(`/groups/history/athlete/${id}`),
        testService.getAthleteStats(id).catch(() => null),
        trainingPlanService.getAthletePlans(id).catch(() => [])
      ]);
      setProfileData({ payments, attendance, tests: history, movements, groups: athleteData.current_groups || [], plans });
      setTestHistory(history);
      setTestStats(statsData);
    } catch (err) {
      showError(err.message || 'Error al cargar perfil del atleta');
    } finally {
      setLoading(false);
    }
  };

  const filterHistoryByTemplate = async (templateId) => {
    setSelectedTemplateForHistory(templateId);
    const history = await testService.getAthleteHistory(id, templateId || null);
    setTestHistory(history);
  };

  const getChartData = () => {
    if (selectedTemplateForHistory && testHistory.length > 0) {
      return testHistory.map(r => ({
        date: new Date(r.test_date).toLocaleDateString(),
        value: parseFloat(r.value)
      }));
    }
    return [];
  };

  const getRadarData = () => {
    if (!testStats?.categories) return [];
    return testStats.categories.map(cat => ({
      category: cat.category,
      atleta: cat.avg_value,
      grupo: testStats.group_comparison?.[cat.category] || 0
    }));
  };

  const getAttendanceMonthlyChart = () => {
    const monthly = {};
    profileData.attendance.forEach(a => {
      const d = new Date(a.date);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      if (!monthly[key]) monthly[key] = { month: key, present: 0, absent: 0, excused: 0, total: 0 };
      monthly[key][a.status.toLowerCase()]++;
      monthly[key].total++;
    });
    return Object.values(monthly).sort((a, b) => a.month.localeCompare(b.month));
  };

  if (loading) return <div className="loading-state"><p>Cargando perfil...</p></div>;
  if (!athlete) return <div style={{ padding: '40px', textAlign: 'center' }}>Atleta no encontrado.</div>;

  const chartData = getChartData();
  const radarData = getRadarData();
  const attendanceMonthly = getAttendanceMonthlyChart();

  const overallTrend = testStats?.overall_trend || '→';
  const trendColor = overallTrend === '↑' ? '#10b981' : overallTrend === '↓' ? '#ef4444' : 'var(--text-muted)';

  const fullName = `${athlete.user?.first_name || ''} ${athlete.user?.last_name || ''}`;
  const groupName = profileData.groups?.[0]?.name || 'Sin grupo';
  const identification = athlete.user?.identification_number || '—';
  const email = athlete.user?.email || '—';

  // Compute KPI values from testStats
  const latestTestValues = {};
  if (testStats?.categories) {
    testStats.categories.forEach(cat => {
      if (cat.templates && cat.templates.length > 0) {
        const last = cat.templates[cat.templates.length - 1];
        latestTestValues[cat.category] = {
          value: last.latest_value,
          unit: last.unit,
          delta: last.delta,
          higher_is_better: last.higher_is_better
        };
      }
    });
  }

  const getKpiTrend = (cat) => {
    const t = latestTestValues[cat];
    if (!t || t.delta === undefined || t.delta === null) return { text: '— Estable', color: 'var(--text-muted)', arrow: '—' };
    const isGood = t.delta > 0 ? t.higher_is_better : !t.higher_is_better;
    if (t.delta === 0) return { text: '— Estable', color: 'var(--text-muted)', arrow: '—' };
    return {
      text: `${t.delta > 0 ? '▲' : '▼'} ${Math.abs(t.delta)} (Último test)`,
      color: isGood ? '#10b981' : '#ef4444',
      arrow: t.delta > 0 ? '▲' : '▼'
    };
  };

  const kpiCards = [
    { label: 'Potencia', key: 'POTENCIA', icon: '⚡', bg: '#ECFDF5', color: '#10b981' },
    { label: 'Velocidad', key: 'VELOCIDAD', icon: '🏃', bg: '#EFF6FF', color: '#3B82F6' },
    { label: 'Resistencia', key: 'RESISTENCIA', icon: '🫀', bg: '#F5F3FF', color: '#8B5CF6' },
    { label: 'Fuerza', key: 'FUERZA', icon: '💪', bg: '#FFFBEB', color: '#F59E0B' },
  ];

  return (
    <div className="athlete-profile-page">
      {/* Header with back button */}
      <div className="page-header">
        <div>
          <h1>Perfil del Atleta</h1>
          <p className="text-muted">Gestión de rendimiento y datos de {fullName}</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-ghost" onClick={() => navigate('/admin/athletes')}>← Volver a Atletas</button>
        </div>
      </div>

      {/* Profile Hero */}
      <div className="profile-hero-card">
        <div className="profile-hero-avatar">
          {athlete.photo_url ? (
            <img src={athlete.photo_url} alt={fullName} className="profile-hero-img" />
          ) : (
            <div className="profile-hero-initials" style={{ background: avatarColor(athlete.user?.first_name || '') }}>
              {initials(athlete.user?.first_name, athlete.user?.last_name)}
            </div>
          )}
        </div>
        <div className="profile-hero-info">
          <h2 className="profile-hero-name">{fullName}</h2>
          <div className="profile-hero-meta">
            <span className="tag tag-active">🟢 Activo</span>
            <span className="tag tag-group">{groupName}</span>
            <span className="tag tag-id">ID: {identification}</span>
            <span className="tag tag-email">✉️ {email}</span>
          </div>
          {testStats && (
            <div className="profile-hero-xp">
              <div className="xp-header">
                <span className="xp-level">NIVEL {testStats.total_tests || 0} - {overallTrend === '↑' ? 'ELITE' : overallTrend === '↓' ? 'EN PROGRESO' : 'ESTABLE'}</span>
                <span className="xp-count">{testStats.total_tests || 0} evaluaciones</span>
              </div>
              <div className="xp-bar">
                <div className="xp-fill" style={{ width: `${Math.min((testStats.total_tests || 0) * 10, 100)}%` }}></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button className={`profile-tab ${activeTab === 'rendimiento' ? 'active' : ''}`} onClick={() => setActiveTab('rendimiento')}>Rendimiento</button>
        <button className={`profile-tab ${activeTab === 'asistencia' ? 'active' : ''}`} onClick={() => setActiveTab('asistencia')}>Asistencia</button>
        <button className={`profile-tab ${activeTab === 'finanzas' ? 'active' : ''}`} onClick={() => setActiveTab('finanzas')}>Finanzas</button>
        <button className={`profile-tab ${activeTab === 'planes' ? 'active' : ''}`} onClick={() => setActiveTab('planes')}>Planes</button>
      </div>

      {/* Tab: Rendimiento */}
      {activeTab === 'rendimiento' && (
        <div className="profile-tab-content">
          {/* KPI Cards */}
          <div className="kpi-grid">
            {kpiCards.map(kpi => {
              const val = latestTestValues[kpi.key];
              const trend = getKpiTrend(kpi.key);
              return (
                <div key={kpi.key} className="kpi-card-modern">
                  <div className="kpi-card-header">
                    <span className="kpi-card-label">{kpi.label}</span>
                    <div className="kpi-card-icon" style={{ background: kpi.bg, color: kpi.color }}>{kpi.icon}</div>
                  </div>
                  <div className="kpi-card-value">{val ? `${val.value}${val.unit ? ' ' + val.unit : ''}` : '—'}</div>
                  <div className="kpi-card-trend" style={{ color: trend.color }}>{trend.text}</div>
                </div>
              );
            })}
          </div>

          {/* Radar + Test History */}
          <div className="profile-two-col">
            <div className="profile-card">
              <div className="profile-card-header">
                <span className="profile-card-title">Atributos vs Grupo</span>
                {testStats && <span className="badge badge-green">Top 15%</span>}
              </div>
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#E2E8F0" />
                    <PolarAngleAxis dataKey="category" fontSize={11} tick={{ fill: '#64748B', fontWeight: 600 }} />
                    <PolarRadiusAxis fontSize={10} tick={false} axisLine={false} />
                    <Radar name="Atleta" dataKey="atleta" stroke="#2563EB" fill="#2563EB" fillOpacity={0.15} strokeWidth={2} />
                    {testStats?.group_comparison && (
                      <Radar name="Promedio Grupo" dataKey="grupo" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.1} strokeWidth={2} strokeDasharray="4 4" />
                    )}
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state">Sin datos de rendimiento</div>
              )}
            </div>

            <div className="profile-card">
              <div className="profile-card-header">
                <span className="profile-card-title">Historial de Tests</span>
                <select
                  value={selectedTemplateForHistory}
                  onChange={e => filterHistoryByTemplate(e.target.value)}
                  className="form-input form-input-sm"
                  style={{ maxWidth: '200px' }}
                >
                  <option value="">Todos</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="table-scroll">
                <table className="profile-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Test</th>
                      <th>Res.</th>
                      <th>Entrenador</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testHistory.slice(0, 8).map(r => (
                      <tr key={r.id}>
                        <td>{new Date(r.test_date).toLocaleDateString()}</td>
                        <td><strong>{r.template_name}</strong></td>
                        <td style={{ fontWeight: 700, color: '#2563EB' }}>{r.value}</td>
                        <td style={{ fontSize: '0.85rem', color: '#64748B' }}>{r.trainer_name || '-'}</td>
                      </tr>
                    ))}
                    {testHistory.length === 0 && (
                      <tr><td colSpan="4" className="empty-cell">Sin tests registrados</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Evolution chart */}
          {chartData.length > 1 && (
            <div className="profile-card">
              <div className="profile-card-header">
                <span className="profile-card-title">Evolución</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="date" fontSize={11} tick={{ fill: '#64748B' }} />
                  <YAxis fontSize={11} tick={{ fill: '#64748B' }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={2} dot={{ fill: '#2563EB', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Tab: Asistencia */}
      {activeTab === 'asistencia' && (
        <div className="profile-tab-content">
          <div className="profile-two-col">
            <div className="profile-card">
              <div className="profile-card-header">
                <span className="profile-card-title">Tasa de Asistencia (Mensual)</span>
              </div>
              {attendanceMonthly.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={attendanceMonthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="month" fontSize={10} tick={{ fill: '#64748B' }} />
                    <YAxis fontSize={11} tick={{ fill: '#64748B' }} />
                    <Tooltip />
                    <Bar dataKey="present" stackId="a" fill="#10b981" name="Presente" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="absent" stackId="a" fill="#ef4444" name="Ausente" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="excused" stackId="a" fill="#3b82f6" name="Justificado" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state">Sin datos de asistencia</div>
              )}
            </div>

            <div className="profile-card">
              <div className="profile-card-header">
                <span className="profile-card-title">Historial Detallado</span>
              </div>
              <div className="table-scroll">
                <table className="profile-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Estado</th>
                      <th>Notas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profileData.attendance.slice(0, 10).map(a => (
                      <tr key={a.id}>
                        <td>{new Date(a.date).toLocaleDateString()}</td>
                        <td>
                          <span className={ATTENDANCE_STATUS[a.status] || 'badge badge-secondary'}>
                            {a.status === 'PRESENT' ? 'Presente' : a.status === 'ABSENT' ? 'Ausente' : a.status === 'EXCUSED' ? 'Justificado' : a.status}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.85rem', color: '#64748B' }}>{a.notes || '-'}</td>
                      </tr>
                    ))}
                    {profileData.attendance.length === 0 && (
                      <tr><td colSpan="3" className="empty-cell">Sin asistencia registrada</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Finanzas */}
      {activeTab === 'finanzas' && (
        <div className="profile-tab-content">
          <div className="profile-card">
            <div className="profile-card-header">
              <span className="profile-card-title">Historial de Pagos</span>
            </div>
            <div className="table-scroll">
              <table className="profile-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Descripción</th>
                    <th>Método</th>
                    <th>Monto</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {profileData.payments.map(p => (
                    <tr key={p.id}>
                      <td>{new Date(p.payment_date).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 500 }}>{p.description || 'Mensualidad'}</td>
                      <td style={{ fontSize: '0.85rem', color: '#64748B' }}>{p.payment_method || '-'}</td>
                      <td style={{ fontWeight: 700, color: '#0F172A' }}>${p.amount?.toLocaleString()}</td>
                      <td>
                        <span className={PAYMENT_STATUS[p.status] || 'badge badge-secondary'}>
                          {p.status === 'PAID' ? 'Pagado' : p.status === 'PENDING' ? 'Pendiente' : p.status === 'OVERDUE' ? 'Vencido' : p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {profileData.payments.length === 0 && (
                    <tr><td colSpan="5" className="empty-cell">Sin pagos registrados</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Planes */}
      {activeTab === 'planes' && (
        <div className="profile-tab-content">
          {profileData.plans.length > 0 ? (
            profileData.plans.map(assignment => (
              <div key={assignment.id} className="profile-card" style={{ marginBottom: '16px' }}>
                <div className="profile-card-header">
                  <span className="profile-card-title">
                    Plan: {assignment.plan_name || 'Plan de entrenamiento'}
                  </span>
                  <span className={`badge ${assignment.status === 'ACTIVE' ? 'badge-blue' : assignment.status === 'COMPLETED' ? 'badge-green' : 'badge-orange'}`}>
                    {assignment.status === 'ACTIVE' ? 'En Curso' : assignment.status === 'COMPLETED' ? 'Completado' : assignment.status || 'Asignado'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.9rem', color: '#64748B' }}>
                  <span>📅 Inicio: {assignment.start_date ? new Date(assignment.start_date).toLocaleDateString() : '—'}</span>
                  <span>📅 Fin: {assignment.end_date ? new Date(assignment.end_date).toLocaleDateString() : '—'}</span>
                  {assignment.group_name && <span>👥 Grupo: {assignment.group_name}</span>}
                </div>
              </div>
            ))
          ) : (
            <div className="profile-card">
              <div className="empty-state" style={{ padding: '40px' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📋</div>
                <p>No hay planes de entrenamiento asignados</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AthleteProfile;
