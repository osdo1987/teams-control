import React, { useEffect, useState, useMemo } from 'react';
import { testService } from '../../services/testService';
import { athleteService } from '../../services/athleteService';
import { groupService } from '../../services/groupService';
import Modal from '../../components/UI/Modal';
import ConfirmModal from '../../components/UI/ConfirmModal';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f97316', '#ec4899', '#0ea5e9'];
const avatarColor = (name = '') => COLORS[name.charCodeAt(0) % COLORS.length];
const initials = (first = '?', last = '?') => `${first?.[0] || '?'}${last?.[0] || '?'}`.toUpperCase();

const CATEGORY_BADGES = {
  RESISTENCIA: 'badge badge-info', VELOCIDAD: 'badge badge-warning', FUERZA: 'badge badge-danger',
  POTENCIA: 'badge badge-success', FUERZA_CORE: 'badge badge-primary', FLEXIBILIDAD: 'badge badge-secondary',
  AGILIDAD: 'badge badge-info', PERSONALIZADO: 'badge badge-dark'
};

const TestList = () => {
  const [activeTab, setActiveTab] = useState('progress');
  const [templates, setTemplates] = useState([]);
  const [athletes, setAthletes] = useState([]);
  const [groups, setGroups] = useState([]);
  const [results, setResults] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [isTemplateModal, setIsTemplateModal] = useState(false);
  const [isSessionModal, setIsSessionModal] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', category: 'PERSONALIZADO', unit: '', higher_is_better: true });
  const [sessionData, setSessionData] = useState({ name: '', notes: '', session_date: new Date().toISOString().split('T')[0], selectedTests: [], selectedAthletes: [], results: {} });

  // Filter state
  const [filterGroup, setFilterGroup] = useState('');
  const [filterTemplate, setFilterTemplate] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [compareAthletes, setCompareAthletes] = useState([]);
  const [expandedAthlete, setExpandedAthlete] = useState(null);
  const [expandedSession, setExpandedSession] = useState(null);
  const [athleteTestData, setAthleteTestData] = useState({});
  const [selectedCompareTest, setSelectedCompareTest] = useState('');

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { if (activeTab === 'progress') fetchProgress(); }, [activeTab, filterGroup, filterTemplate, filterFrom, filterTo]);

  const fetchData = async () => {
    try {
      const [t, a, g, r, s, st] = await Promise.all([
        testService.getTemplates(), athleteService.getAthletes(),
        groupService.getGroups(), testService.getResults(),
        testService.getSessions(), testService.getStats().catch(() => null)
      ]);
      setTemplates(t); setAthletes(a); setGroups(g);
      setResults(r); setSessions(s); setStats(st);
    } catch (err) { setError('Error al cargar datos'); } finally { setLoading(false); }
  };

  const fetchProgress = async () => {
    try {
      const params = {};
      if (filterGroup) params.group_id = filterGroup;
      if (filterTemplate) params.template_id = filterTemplate;
      if (filterFrom) params.from = filterFrom;
      if (filterTo) params.to = filterTo;
      const data = await testService.getProgress(params);
      setProgress(data);
    } catch (err) { console.error('Error fetching progress:', err); }
  };

  const toggleCompareAthlete = (athleteId) => {
    setCompareAthletes(prev =>
      prev.includes(athleteId) ? prev.filter(id => id !== athleteId) : [...prev, athleteId]
    );
  };

  // Derived data
  const testNames = useMemo(() => [...new Set(results.map(r => r.template_name))], [results]);
  const groupNames = groups.map(g => g.name);

  // Progress chart data - compare athletes
  const comparisonChartData = useMemo(() => {
    if (compareAthletes.length === 0 || !selectedCompareTest) return [];
    const filtered = progress.filter(p =>
      compareAthletes.includes(p.athlete_id) && p.template_name === selectedCompareTest
    );
    // Build date-indexed dataset
    const dateMap = {};
    filtered.forEach(p => {
      p.values.forEach(v => {
        if (!dateMap[v.date]) dateMap[v.date] = { date: v.date };
        dateMap[v.date][p.athlete_name] = v.value;
      });
    });
    return Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
  }, [progress, compareAthletes, selectedCompareTest]);

  // Bar chart: latest values for selected test
  const latestValuesChart = useMemo(() => {
    if (!selectedCompareTest) return [];
    return progress
      .filter(p => p.template_name === selectedCompareTest && p.last_value !== null)
      .map(p => ({
        name: p.athlete_name?.split(' ')[0] || `Atleta ${p.athlete_id}`,
        valor: p.last_value,
        trend: p.trend
      }));
  }, [progress, selectedCompareTest]);

  // Top improvements
  const topImprovements = useMemo(() => {
    return [...progress]
      .filter(p => p.delta_pct !== 0 && p.delta_pct !== null)
      .sort((a, b) => {
        const aVal = a.higher_is_better ? a.delta_pct : -a.delta_pct;
        const bVal = b.higher_is_better ? b.delta_pct : -b.delta_pct;
        return bVal - aVal;
      })
      .slice(0, 5);
  }, [progress]);

  const handleInputChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const openCreateTemplate = () => { setEditingTemplate(null); setFormData({ name: '', description: '', category: 'PERSONALIZADO', unit: '', higher_is_better: true }); setIsTemplateModal(true); };
  const openEditTemplate = (t) => { setEditingTemplate(t); setFormData({ name: t.name, description: t.description || '', category: t.category, unit: t.unit, higher_is_better: t.higher_is_better }); setIsTemplateModal(true); };

  const handleTemplateSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTemplate) await testService.updateTemplate(editingTemplate.id, formData);
      else await testService.createTemplate(formData);
      setIsTemplateModal(false); fetchData();
    } catch (err) { setError('Error al guardar plantilla'); }
  };

  const confirmDeleteTemplate = async () => {
    if (!deleteTarget) return;
    try { await testService.deleteTemplate(deleteTarget.id); fetchData(); }
    catch (err) { setError('Error al eliminar plantilla'); }
    finally { setIsConfirmOpen(false); setDeleteTarget(null); }
  };

  const openCreateSession = () => { setSessionData({ name: '', notes: '', session_date: new Date().toISOString().split('T')[0], selectedTests: [], selectedAthletes: [], results: {} }); setIsSessionModal(true); };
  const toggleSessionTest = (testId) => { setSessionData(prev => ({ ...prev, selectedTests: prev.selectedTests.includes(testId) ? prev.selectedTests.filter(id => id !== testId) : [...prev.selectedTests, testId] })); };
  const toggleSessionAthlete = (athleteId) => { setSessionData(prev => ({ ...prev, selectedAthletes: prev.selectedAthletes.includes(athleteId) ? prev.selectedAthletes.filter(id => id !== athleteId) : [...prev.selectedAthletes, athleteId] })); };
  const updateSessionResult = (testId, athleteId, value) => { setSessionData(prev => ({ ...prev, results: { ...prev.results, [`${testId}-${athleteId}`]: value } })); };

  const handleSessionSubmit = async (e) => {
    e.preventDefault();
    try {
      const resultsArray = [];
      sessionData.selectedTests.forEach(testId => {
        sessionData.selectedAthletes.forEach(athleteId => {
          const v = sessionData.results[`${testId}-${athleteId}`];
          if (v !== undefined && v !== '') resultsArray.push({ template_id: testId, athlete_id: athleteId, value: parseFloat(v) });
        });
      });
      if (resultsArray.length === 0) { setError('Debe ingresar al menos un resultado'); return; }
      await testService.createSession({ name: sessionData.name, notes: sessionData.notes, session_date: sessionData.session_date, results: resultsArray });
      setIsSessionModal(false); fetchData();
    } catch (err) { setError('Error al crear sesion'); }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando...</div>;

  const templateResultCounts = {};
  results.forEach(r => { templateResultCounts[r.template_id] = (templateResultCounts[r.template_id] || 0) + 1; });

  return (
    <div>
      <div className="page-header">
        <div><h1>Tests de Evaluacion</h1><p className="text-muted">Gestion de pruebas fisicas, evaluaciones y seguimiento deportivo.</p></div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {activeTab === 'templates' && <button className="btn btn-primary" onClick={openCreateTemplate}>+ Nueva Plantilla</button>}
          {activeTab === 'sessions' && <button className="btn btn-primary" onClick={openCreateSession}>+ Nueva Sesion</button>}
        </div>
      </div>

      {error && <div className="badge badge-danger" style={{ marginBottom: '16px', width: '100%' }}>{error}</div>}

      <div className="tabs" style={{ display: 'flex', gap: 0, marginBottom: '24px', borderBottom: '2px solid var(--border)' }}>
        <button onClick={() => setActiveTab('progress')} className={`btn ${activeTab === 'progress' ? 'btn-primary' : 'btn-ghost'}`} style={{ borderRadius: 0, flex: 1 }}>📊 Progreso</button>
        <button onClick={() => setActiveTab('sessions')} className={`btn ${activeTab === 'sessions' ? 'btn-primary' : 'btn-ghost'}`} style={{ borderRadius: 0, flex: 1 }}>📋 Sesiones</button>
        <button onClick={() => setActiveTab('templates')} className={`btn ${activeTab === 'templates' ? 'btn-primary' : 'btn-ghost'}`} style={{ borderRadius: 0, flex: 1 }}>📝 Plantillas</button>
        <button onClick={() => setActiveTab('byathlete')} className={`btn ${activeTab === 'byathlete' ? 'btn-primary' : 'btn-ghost'}`} style={{ borderRadius: 0, flex: 1 }}>👤 Por Atleta</button>
      </div>

      {/* ============= TAB: PROGRESO ============= */}
      {activeTab === 'progress' && (
        <div>
          {/* Summary Cards */}
          {stats && (
            <div className="stat-grid" style={{ marginBottom: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
              <div className="stat-card" style={{ borderBottom: '4px solid var(--primary-color)' }}>
                <div className="stat-label">EVALUACIONES</div>
                <div className="stat-value">{stats.total_results}</div>
              </div>
              <div className="stat-card" style={{ borderBottom: '4px solid var(--success-color)' }}>
                <div className="stat-label">ATLETAS EVALUADOS</div>
                <div className="stat-value">{stats.total_athletes}</div>
              </div>
              <div className="stat-card" style={{ borderBottom: '4px solid #8b5cf6' }}>
                <div className="stat-label">TESTS</div>
                <div className="stat-value">{stats.total_templates}</div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'end' }}>
              <div className="form-group" style={{ margin: 0, minWidth: '150px', flex: 1 }}>
                <label className="form-label">Grupo</label>
                <select value={filterGroup} onChange={e => setFilterGroup(e.target.value)} className="form-input">
                  <option value="">Todos los grupos</option>
                  {groupNames.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0, minWidth: '150px', flex: 1 }}>
                <label className="form-label">Test</label>
                <select value={filterTemplate} onChange={e => { setFilterTemplate(e.target.value); setSelectedCompareTest(e.target.value); }} className="form-input">
                  <option value="">Todos los tests</option>
                  {testNames.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0, minWidth: '130px' }}>
                <label className="form-label">Desde</label>
                <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} className="form-input" />
              </div>
              <div className="form-group" style={{ margin: 0, minWidth: '130px' }}>
                <label className="form-label">Hasta</label>
                <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} className="form-input" />
              </div>
            </div>
          </div>

          {/* Comparison Line Chart */}
          {compareAthletes.length >= 1 && selectedCompareTest && comparisonChartData.length > 0 && (
            <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
              <h4 style={{ marginBottom: '12px', fontSize: '0.9rem' }}>Comparacion: {selectedCompareTest}</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={comparisonChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  {compareAthletes.map((aid, idx) => {
                    const p = progress.find(x => x.athlete_id === aid);
                    return p ? <Line key={aid} type="monotone" dataKey={p.athlete_name} stroke={COLORS[idx % COLORS.length]} strokeWidth={2} dot={{ r: 4 }} name={p.athlete_name} /> : null;
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Latest Values Bar Chart */}
          {selectedCompareTest && latestValuesChart.length > 0 && (
            <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
              <h4 style={{ marginBottom: '12px', fontSize: '0.9rem' }}>Ultimos valores: {selectedCompareTest}</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={latestValuesChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="valor" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Valor" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top Improvements */}
          {topImprovements.length > 0 && (
            <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
              <h4 style={{ marginBottom: '12px', fontSize: '0.9rem' }}>🏆 Top Mejoras</h4>
              <div className="table-container">
                <table className="data-table">
                  <thead><tr><th>Atleta</th><th>Test</th><th>Anterior</th><th>Actual</th><th>Delta</th><th>%</th></tr></thead>
                  <tbody>
                    {topImprovements.map(p => (
                      <tr key={`${p.athlete_id}-${p.template_id}`}>
                        <td><strong>{p.athlete_name}</strong></td>
                        <td>{p.template_name}</td>
                        <td>{p.previous_value ?? '-'}</td>
                        <td style={{ fontWeight: 700, color: 'var(--brand-600)' }}>{p.last_value}</td>
                        <td style={{ color: p.delta > 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                          {p.delta > 0 ? '+' : ''}{p.delta}
                        </td>
                        <td style={{ color: p.delta_pct > 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                          {p.delta_pct > 0 ? '+' : ''}{p.delta_pct}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Athlete Progress Table */}
          <div className="card" style={{ padding: '16px' }}>
            <h4 style={{ marginBottom: '12px', fontSize: '0.9rem' }}>Progreso por Atleta {selectedCompareTest ? `- ${selectedCompareTest}` : ''}</h4>
            {compareAthletes.length > 0 && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Atletas seleccionados para comparacion: {compareAthletes.length}
              </p>
            )}
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}></th>
                    <th>Atleta</th>
                    <th>Test</th>
                    <th>Primero</th>
                    <th>Anterior</th>
                    <th>Ultimo</th>
                    <th>Delta</th>
                    <th>Tendencia</th>
                  </tr>
                </thead>
                <tbody>
                  {progress.filter(p => !selectedCompareTest || p.template_name === selectedCompareTest).map(p => (
                    <tr key={`${p.athlete_id}-${p.template_id}`}>
                      <td>
                        <input type="checkbox" checked={compareAthletes.includes(p.athlete_id)}
                          onChange={() => toggleCompareAthlete(p.athlete_id)} title="Comparar en grafica" />
                      </td>
                      <td><strong>{p.athlete_name}</strong></td>
                      <td>{p.template_name}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{p.first_value ?? '-'}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{p.previous_value ?? '-'}</td>
                      <td style={{ fontWeight: 700, color: 'var(--brand-600)' }}>{p.last_value}</td>
                      <td style={{ color: p.delta > 0 ? '#10b981' : p.delta < 0 ? '#ef4444' : 'var(--text-muted)', fontWeight: 600 }}>
                        {p.delta > 0 ? '+' : ''}{p.delta}
                      </td>
                      <td style={{ fontSize: '1.2rem' }}>{p.trend}</td>
                    </tr>
                  ))}
                  {progress.length === 0 && (
                    <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>Selecciona filtros para ver progreso.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============= TAB: SESIONES ============= */}
      {activeTab === 'sessions' && (
        <div>
          {sessions.map(s => (
            <div key={s.id} style={{ marginBottom: '8px', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
              <div onClick={() => setExpandedSession(expandedSession === s.id ? null : s.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer', background: expandedSession === s.id ? '#f3f4f6' : 'white' }}>
                <span style={{ fontSize: '1.2rem' }}>📋</span>
                <strong style={{ flex: 1 }}>{s.name || 'Sesion sin nombre'}</strong>
                <span className="badge badge-info">{new Date(s.session_date).toLocaleDateString()}</span>
                <span className="badge badge-success">{new Set(s.results?.map(r => r.athlete_id)).size || 0} atletas</span>
                <span className="badge badge-primary">{s.results?.length || 0} resultados</span>
                <span style={{ transform: expandedSession === s.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
              </div>
              {expandedSession === s.id && (
                <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', background: '#fafafa' }}>
                  {s.notes && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>{s.notes}</p>}
                  <table className="data-table" style={{ margin: 0, fontSize: '0.85rem' }}>
                    <thead><tr><th>Atleta</th><th>Test</th><th>Resultado</th><th>Entrenador</th></tr></thead>
                    <tbody>
                      {s.results?.map(r => (
                        <tr key={r.id}>
                          <td><strong>{r.athlete_name || `Atleta ${r.athlete_id}`}</strong></td>
                          <td>{r.template_name}</td>
                          <td style={{ fontWeight: 700, color: 'var(--brand-600)' }}>{r.value}</td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.trainer_name || '-'}</td>
                        </tr>
                      ))}
                      {(!s.results || s.results.length === 0) && (
                        <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>Sin resultados en esta sesion.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
          {sessions.length === 0 && (
            <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)' }}>No hay sesiones registradas. Crea una nueva sesion para empezar.</p>
            </div>
          )}
        </div>
      )}

      {/* ============= TAB: PLANTILLAS ============= */}
      {activeTab === 'templates' && (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Nombre</th><th>Categoria</th><th>Unidad</th><th>Tipo</th><th>Resultados</th><th>Acciones</th></tr></thead>
            <tbody>
              {templates.map(t => (
                <tr key={t.id}>
                  <td><strong>{t.name}</strong></td>
                  <td><span className={CATEGORY_BADGES[t.category] || 'badge badge-dark'}>{t.category}</span></td>
                  <td style={{ fontWeight: 600 }}>{t.unit}</td>
                  <td>{t.is_predefined ? <span className="badge badge-info">Predefinido</span> : <span className="badge badge-warning">Personalizado</span>}</td>
                  <td><span className="badge badge-primary">{templateResultCounts[t.id] || 0}</span></td>
                  <td>
                    {!t.is_predefined && (
                      <>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEditTemplate(t)}>Editar</button>
                        <button className="btn btn-ghost btn-sm" style={{ color: '#ef4444' }}
                          onClick={() => { setDeleteTarget(t); setIsConfirmOpen(true); }}>Eliminar</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ============= TAB: POR ATLETA ============= */}
      {activeTab === 'byathlete' && (
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '12px' }}>Resultados por Atleta</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
            Haz clic en un atleta para ver sus resultados con tendencia.
          </p>

          {/* Group results by athlete */}
          {(() => {
            const grouped = {};
            results.forEach(r => {
              const name = r.athlete_name || `Atleta ${r.athlete_id}`;
              if (!grouped[name]) grouped[name] = { athlete_id: r.athlete_id, athlete_name: name, results: [] };
              grouped[name].results.push(r);
            });
            return Object.entries(grouped).map(([name, data]) => (
              <div key={name} style={{ marginBottom: '8px', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                <div onClick={() => setExpandedAthlete(expandedAthlete === name ? null : name)}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer', background: expandedAthlete === name ? '#f3f4f6' : 'white', transition: 'background 0.2s' }}>
                  <div className="table-avatar" style={{ background: avatarColor(name), width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '600', fontSize: '0.8rem', flexShrink: 0 }}>
                    {initials(name.split(' ')[0], name.split(' ')[1])}
                  </div>
                  <strong style={{ flex: 1 }}>{name}</strong>
                  <span className="badge badge-info">{data.results.length} resultados</span>
                  <span style={{ transform: expandedAthlete === name ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                </div>
                {expandedAthlete === name && (
                  <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', background: '#fafafa' }}>
                    {(() => {
                      // Group by template and compute trend
                      const byTemplate = {};
                      data.results.forEach(r => {
                        const tname = r.template_name;
                        if (!byTemplate[tname]) byTemplate[tname] = [];
                        byTemplate[tname].push(r);
                      });
                      return Object.entries(byTemplate).map(([tname, tresults]) => {
                        const sorted = tresults.sort((a, b) => new Date(a.test_date) - new Date(b.test_date));
                        const first = sorted[0];
                        const last = sorted[sorted.length - 1];
                        const firstVal = parseFloat(first.value);
                        const lastVal = parseFloat(last.value);
                        const diff = lastVal - firstVal;
                        const templateObj = templates.find(t => t.id === last.template_id);
                        const higherIsBetter = templateObj?.higher_is_better ?? true;
                        const trend = higherIsBetter ? (diff > 0 ? '↑' : diff < 0 ? '↓' : '→') : (diff > 0 ? '↓' : diff < 0 ? '↑' : '→');
                        const trendColor = trend === '↑' ? '#10b981' : trend === '↓' ? '#ef4444' : 'var(--text-muted)';
                        return (
                          <div key={tname} style={{ marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                              <strong style={{ fontSize: '0.9rem' }}>{tname}</strong>
                              <span style={{ fontSize: '1.2rem', color: trendColor }}>{trend}</span>
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                {sorted.length} registros | {firstVal} → {lastVal}
                                <span style={{ color: trendColor, marginLeft: '4px', fontWeight: 600 }}>
                                  ({diff > 0 ? '+' : ''}{diff.toFixed(2)})
                                </span>
                              </span>
                            </div>
                            {/* Sparkline mini line chart */}
                            {sorted.length > 1 && (
                              <ResponsiveContainer width="100%" height={40}>
                                <LineChart data={sorted.map(r => ({ date: new Date(r.test_date).toLocaleDateString(), value: parseFloat(r.value) }))}>
                                  <Line type="monotone" dataKey="value" stroke={trendColor} strokeWidth={2} dot={false} />
                                </LineChart>
                              </ResponsiveContainer>
                            )}
                          </div>
                        );
                      });
                    })()}
                    <table className="data-table" style={{ margin: 0, fontSize: '0.85rem' }}>
                      <thead><tr><th>Test</th><th>Resultado</th><th>Fecha</th><th>Entrenador</th><th>Notas</th></tr></thead>
                      <tbody>
                        {data.results.map(r => (
                          <tr key={r.id}>
                            <td><strong>{r.template_name}</strong></td>
                            <td style={{ fontWeight: 700, color: 'var(--brand-600)' }}>{r.value}</td>
                            <td>{new Date(r.test_date).toLocaleDateString()}</td>
                            <td style={{ fontSize: '0.8rem' }}>{r.trainer_name || '-'}</td>
                            <td style={{ fontSize: '0.8rem' }}>{r.notes || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ));
          })()}
        </div>
      )}

      {/* Modals */}
      <Modal isOpen={isTemplateModal} onClose={() => setIsTemplateModal(false)} title={editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}>
        <form onSubmit={handleTemplateSubmit} style={{ display: 'contents' }}>
          <div className="form-group"><label className="form-label">Nombre</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} className="form-input" required placeholder="Ej: Test de Cooper" /></div>
          <div className="form-group"><label className="form-label">Categoria</label><select name="category" value={formData.category} onChange={handleInputChange} className="form-input"><option value="RESISTENCIA">Resistencia</option><option value="VELOCIDAD">Velocidad</option><option value="FUERZA">Fuerza</option><option value="POTENCIA">Potencia</option><option value="FUERZA_CORE">Fuerza Core</option><option value="FLEXIBILIDAD">Flexibilidad</option><option value="AGILIDAD">Agilidad</option><option value="PERSONALIZADO">Personalizado</option></select></div>
          <div className="form-group"><label className="form-label">Unidad</label><select name="unit" value={formData.unit} onChange={handleInputChange} className="form-input" required><option value="">Seleccionar...</option><option value="metros">Metros</option><option value="segundos">Segundos</option><option value="repeticiones">Repeticiones</option><option value="kg">Kg</option><option value="centimetros">Cm</option><option value="nivel">Nivel</option></select></div>
          <div className="modal-footer" style={{ margin: '8px -24px -24px', padding: '16px 24px' }}><button type="button" className="btn btn-ghost" onClick={() => setIsTemplateModal(false)}>Cancelar</button><button type="submit" className="btn btn-primary">Guardar</button></div>
        </form>
      </Modal>

      <Modal isOpen={isSessionModal} onClose={() => setIsSessionModal(false)} title="Nueva Sesion de Tests">
        <form onSubmit={handleSessionSubmit} style={{ display: 'contents' }}>
          <div className="form-group"><label className="form-label">Nombre</label><input type="text" name="name" value={sessionData.name} onChange={e => setSessionData({ ...sessionData, name: e.target.value })} className="form-input" placeholder="Ej: Evaluacion Semanal" /></div>
          <div className="form-group"><label className="form-label">Fecha</label><input type="date" name="session_date" value={sessionData.session_date} onChange={e => setSessionData({ ...sessionData, session_date: e.target.value })} className="form-input" required /></div>
          <div className="form-group"><label className="form-label">Tests</label><div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px' }}>{templates.map(t => (<label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', cursor: 'pointer' }}><input type="checkbox" checked={sessionData.selectedTests.includes(t.id)} onChange={() => toggleSessionTest(t.id)} /><span>{t.name}</span></label>))}</div></div>
          <div className="form-group"><label className="form-label">Atletas</label><div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px' }}>{athletes.map(a => (<label key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', cursor: 'pointer' }}><input type="checkbox" checked={sessionData.selectedAthletes.includes(a.id)} onChange={() => toggleSessionAthlete(a.id)} /><span>{a.user?.first_name} {a.user?.last_name}</span></label>))}</div></div>
          {sessionData.selectedTests.length > 0 && sessionData.selectedAthletes.length > 0 && (
            <div className="form-group"><label className="form-label">Resultados</label><div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr><th style={{ textAlign: 'left', padding: '4px', fontSize: '0.75rem' }}>Atleta</th>{sessionData.selectedTests.map(testId => { const test = templates.find(t => t.id === testId); return <th key={testId} style={{ textAlign: 'center', padding: '4px', fontSize: '0.7rem' }}>{test?.name?.substring(0, 10)}</th>; })}</tr></thead><tbody>{sessionData.selectedAthletes.map(athleteId => { const athlete = athletes.find(a => a.id === athleteId); return (<tr key={athleteId}><td style={{ padding: '4px', fontSize: '0.8rem', fontWeight: 600 }}>{athlete?.user?.first_name} {athlete?.user?.last_name}</td>{sessionData.selectedTests.map(testId => (<td key={testId} style={{ padding: '4px' }}><input type="number" step="0.01" value={sessionData.results[`${testId}-${athleteId}`] || ''} onChange={e => updateSessionResult(testId, athleteId, e.target.value)} style={{ width: '65px', padding: '4px', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '0.75rem', textAlign: 'center' }} placeholder="0" /></td>))}</tr>); })}</tbody></table></div></div>
          )}
          <div className="modal-footer" style={{ margin: '8px -24px -24px', padding: '16px 24px' }}><button type="button" className="btn btn-ghost" onClick={() => setIsSessionModal(false)}>Cancelar</button><button type="submit" className="btn btn-primary">Guardar Sesion</button></div>
        </form>
      </Modal>

      <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={confirmDeleteTemplate} title="Eliminar Plantilla" message={`Eliminar "${deleteTarget?.name}"?`} />
    </div>
  );
};

export default TestList;
