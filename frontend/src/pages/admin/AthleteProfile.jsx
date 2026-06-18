import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { athleteService } from '../../services/athleteService';
import { testService } from '../../services/testService';
import { api } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, BarChart, Bar } from 'recharts';

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
  const [templates, setTemplates] = useState([]); // Keep templates for dropdown
  const [loading, setLoading] = useState(true);
  const { showError } = useToast(); // Use toast for errors
  const [activeTab, setActiveTab] = useState('info');

  const [profileData, setProfileData] = useState({
    payments: [], attendance: [], tests: [], movements: [], groups: []
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

      const [payments, attendance, history, movements, statsData] = await Promise.all([
        api(`/payments/athlete/${id}`),
        api(`/attendance/athlete/${id}`),
        testService.getAthleteHistory(id),
        api(`/groups/history/athlete/${id}`),
        testService.getAthleteStats(id).catch(() => null)
      ]);
      setProfileData({ payments, attendance, tests: history, movements, groups: athleteData.current_groups || [] });
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

  // Build radar data from testStats
  const getRadarData = () => {
    if (!testStats?.categories) return [];
    return testStats.categories.map(cat => ({
      category: cat.category,
      atleta: cat.avg_value,
      grupo: testStats.group_comparison?.[cat.category] || 0
    }));
  };

  // Attendance monthly stats
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
  // if (error) return <div style={{ padding: '40px', textAlign: 'center', color: 'red' }}>{error}</div>; // Error is now handled by toast
  if (!athlete) return <div style={{ padding: '40px', textAlign: 'center' }}>Atleta no encontrado.</div>;

  const chartData = getChartData();
  const radarData = getRadarData();
  const attendanceMonthly = getAttendanceMonthlyChart();

  // Compute overall trend
  const overallTrend = testStats?.overall_trend || '→';
  const trendColor = overallTrend === '↑' ? '#10b981' : overallTrend === '↓' ? '#ef4444' : 'var(--text-muted)';

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="profile-header">
          <button className="btn btn-ghost flex-shrink-0" onClick={() => navigate('/admin/athletes')}>← Volver</button>
          <div className="profile-avatar" style={{
            background: avatarColor(athlete.user?.first_name || ''),
          }}>
            {initials(athlete.user?.first_name, athlete.user?.last_name)}
          </div>
          <div className="profile-info">
            <h1 style={{ margin: 0 }}>{athlete.user?.first_name} {athlete.user?.last_name}</h1>
            <p className="text-muted" style={{ margin: 0 }}>
              {athlete.user?.email} · {athlete.user?.identification_number}
            </p>
          </div>
          {/* Trend indicator */}
          {testStats && (
            <div className="trend-indicator" style={{
              background: trendColor === '#10b981' ? '#f0fdf4' : trendColor === '#ef4444' ? '#fef2f2' : '#f9fafb',
              border: `2px solid ${trendColor}`,
            }}>
              <div className="trend-arrow">{overallTrend}</div>
              <div className="trend-label" style={{ color: trendColor }}>
                {overallTrend === '↑' ? 'MEJORANDO' : overallTrend === '↓' ? 'BAJANDO' : 'ESTABLE'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: '24px', borderBottom: '2px solid var(--border)', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {[
          { key: 'info', label: '📋 Información' },
          { key: 'payments', label: '💰 Pagos' },
          { key: 'attendance', label: '📅 Asistencia' },
          { key: 'tests', label: '📊 Tests' },
          { key: 'movements', label: '🔄 Movimientos' }
        ].map(tab => (
          <button key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`btn ${activeTab === tab.key ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 0, flex: 1, padding: '12px 8px', whiteSpace: 'nowrap' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Información */}
      {activeTab === 'info' && (
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>Información Personal</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Nombre Completo</span>
              <div className="info-value" style={{ fontWeight: 600 }}>{athlete.user?.first_name} {athlete.user?.last_name}</div>
            </div>
            <div className="info-item">
              <span className="info-label">Email</span>
              <div className="info-value">{athlete.user?.email}</div>
            </div>
            <div className="info-item">
              <span className="info-label">Identificación</span>
              <div className="info-value" style={{ fontWeight: 600 }}>{athlete.user?.identification_number}</div>
            </div>
            <div className="info-item">
              <span className="info-label">Teléfono</span>
              <div className="info-value">{athlete.phone || '-'}</div>
            </div>
            <div className="info-item">
              <span className="info-label">Fecha de Nacimiento</span>
              <div className="info-value">{athlete.birth_date ? new Date(athlete.birth_date).toLocaleDateString() : '-'}</div>
            </div>
            <div className="info-item">
              <span className="info-label">Dirección</span>
              <div className="info-value">{athlete.address || '-'}</div>
            </div>
            <div className="info-item full-width">
              <span className="info-label">Grupo Actual</span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {profileData.groups?.length > 0 ? (
                  profileData.groups.map(g => <span key={g.id} className="badge badge-success">{g.name}</span>)
                ) : <span style={{ opacity: 0.5 }}>Sin grupo</span>}
              </div>
            </div>
          </div>

          {/* Radar Chart */}
          {radarData.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ marginBottom: '12px' }}>Rendimiento vs Grupo</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" fontSize={11} />
                  <PolarRadiusAxis fontSize={10} />
                  <Radar name="Atleta" dataKey="atleta" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  {testStats?.group_comparison && (
                    <Radar name="Promedio Grupo" dataKey="grupo" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                  )}
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Tab: Pagos */}
      {activeTab === 'payments' && (
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>Historial de Pagos</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr><th>Fecha</th><th>Monto</th><th>Estado</th><th>Método</th><th>Descripción</th></tr>
              </thead>
              <tbody>
                {profileData.payments.map(p => (
                  <tr key={p.id}>
                    <td>{new Date(p.payment_date).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 600 }}>${p.amount?.toLocaleString()}</td>
                    <td><span className={PAYMENT_STATUS[p.status] || 'badge badge-secondary'}>{p.status}</span></td>
                    <td>{p.payment_method || '-'}</td>
                    <td style={{ fontSize: '0.85rem' }}>{p.description || '-'}</td>
                  </tr>
                ))}
                {profileData.payments.length === 0 && (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>No hay pagos registrados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Asistencia */}
      {activeTab === 'attendance' && (
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>Historial de Asistencia</h3>

          {/* Monthly attendance chart */}
          {attendanceMonthly.length > 1 && (
            <div style={{ marginBottom: '24px', padding: '16px', background: '#f9fafb', borderRadius: '12px' }}>
              <h4 style={{ marginBottom: '12px', fontSize: '0.9rem' }}>Asistencia por Mes</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={attendanceMonthly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={10} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="present" stackId="a" fill="#10b981" name="Presente" />
                  <Bar dataKey="absent" stackId="a" fill="#ef4444" name="Ausente" />
                  <Bar dataKey="excused" stackId="a" fill="#3b82f6" name="Justificado" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr><th>Fecha</th><th>Estado</th><th>Grupo</th><th>Notas</th></tr>
              </thead>
              <tbody>
                {profileData.attendance.map(a => (
                  <tr key={a.id}>
                    <td>{new Date(a.date).toLocaleDateString()}</td>
                    <td><span className={ATTENDANCE_STATUS[a.status] || 'badge badge-secondary'}>{a.status}</span></td>
                    <td>{a.group_name || '-'}</td>
                    <td style={{ fontSize: '0.85rem' }}>{a.notes || '-'}</td>
                  </tr>
                ))}
                {profileData.attendance.length === 0 && (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>No hay asistencia registrada.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Tests */}
      {activeTab === 'tests' && (
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>
            Historial de Tests
            {testStats && (
              <span style={{
                marginLeft: '12px',
                padding: '4px 12px',
                borderRadius: '12px',
                background: trendColor === '#10b981' ? '#f0fdf4' : trendColor === '#ef4444' ? '#fef2f2' : '#f9fafb',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: trendColor
              }}>
                Tendencia: {overallTrend} ({testStats.total_tests} tests)
              </span>
            )}
          </h3>

          {/* Category stats cards */}
          {testStats?.categories && testStats.categories.length > 0 && (
            <div className="stat-grid" style={{ marginBottom: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
              {testStats.categories.map(cat => (
                <div key={cat.category} className="stat-card" style={{ borderBottom: `4px solid ${COLORS[testStats.categories.indexOf(cat) % COLORS.length]}` }}>
                  <div className="stat-label">{cat.category}</div>
                  <div className="stat-value">{cat.avg_value}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {cat.count} evaluaciones
                    {cat.templates.map(t => {
                      const diffColor = t.delta > 0 ? (t.higher_is_better ? '#10b981' : '#ef4444') : t.delta < 0 ? (t.higher_is_better ? '#ef4444' : '#10b981') : 'var(--text-muted)';
                      return (
                        <span key={t.template_name} style={{ display: 'block', fontSize: '0.7rem', marginTop: '2px' }}>
                          {t.template_name}: {t.latest_value} {t.unit}
                          {t.delta !== 0 && (
                            <span style={{ color: diffColor, marginLeft: '4px' }}>
                              ({t.delta > 0 ? '+' : ''}{t.delta})
                            </span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <select value={selectedTemplateForHistory}
              onChange={e => filterHistoryByTemplate(e.target.value)} className="form-input" style={{ maxWidth: '400px' }}>
              <option value="">Todos los tests</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          {chartData.length > 1 && (
            <div style={{ marginBottom: '24px', padding: '16px', background: '#f9fafb', borderRadius: '12px' }}>
              <h4 style={{ marginBottom: '12px', fontSize: '0.9rem' }}>Evolución</h4>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr><th>Fecha</th><th>Test</th><th>Resultado</th><th>Tendencia</th><th>Entrenador</th><th>Notas</th></tr>
              </thead>
              <tbody>
                {testHistory.map((r, idx, arr) => {
                  // Compute trend from previous
                  const prev = arr[idx + 1];
                  let trend = '→';
                  let trendColor = 'var(--text-muted)';
                  if (prev) {
                    const diff = parseFloat(r.value) - parseFloat(prev.value);
                    const template = templates.find(t => t.id === r.template_id);
                    const higherIsBetter = template?.higher_is_better ?? true;
                    if (higherIsBetter) {
                      trend = diff > 0 ? '↑' : diff < 0 ? '↓' : '→';
                    } else {
                      trend = diff > 0 ? '↓' : diff < 0 ? '↑' : '→';
                    }
                    trendColor = trend === '↑' ? '#10b981' : trend === '↓' ? '#ef4444' : 'var(--text-muted)';
                  }
                  return (
                    <tr key={r.id}>
                      <td>{new Date(r.test_date).toLocaleDateString()}</td>
                      <td><strong>{r.template_name}</strong></td>
                      <td style={{ fontWeight: 700, color: 'var(--brand-600)' }}>{r.value}</td>
                      <td style={{ fontSize: '1.1rem', color: trendColor, fontWeight: 600 }}>{trend}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{r.trainer_name || '-'}</td>
                      <td style={{ fontSize: '0.85rem' }}>{r.notes || '-'}</td>
                    </tr>
                  );
                })}
                {testHistory.length === 0 && (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>No hay tests registrados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Movimientos */}
      {activeTab === 'movements' && (
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>Historial de Movimientos</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr><th>Fecha</th><th>Acción</th><th>Grupo</th></tr>
              </thead>
              <tbody>
                {profileData.movements.map(h => (
                  <tr key={h.id}>
                    <td>{new Date(h.date).toLocaleDateString()}</td>
                    <td>
                      <span className={h.action === 'JOINED' ? 'badge badge-success' : 'badge badge-danger'}>
                        {h.action === 'JOINED' ? 'ENTRADA' : 'SALIDA'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{h.group_name}</td>
                  </tr>
                ))}
                {profileData.movements.length === 0 && (
                  <tr><td colSpan="3" style={{ textAlign: 'center', padding: '40px' }}>No hay movimientos registrados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AthleteProfile;