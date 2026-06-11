import React, { useEffect, useState } from 'react';
import { testService } from '../../services/testService';
import { athleteService } from '../../services/athleteService';
import Modal from '../../components/UI/Modal';
import ConfirmModal from '../../components/UI/ConfirmModal';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f97316', '#ec4899', '#0ea5e9'];
const avatarColor = (name = '') => COLORS[name.charCodeAt(0) % COLORS.length];
const initials = (first = '?', last = '?') => `${first?.[0] || '?'}${last?.[0] || '?'}`.toUpperCase();

const CATEGORY_BADGES = {
  RESISTENCIA: 'badge badge-info',
  VELOCIDAD: 'badge badge-warning',
  FUERZA: 'badge badge-danger',
  POTENCIA: 'badge badge-success',
  FUERZA_CORE: 'badge badge-primary',
  FLEXIBILIDAD: 'badge badge-secondary',
  AGILIDAD: 'badge badge-info',
  PERSONALIZADO: 'badge badge-dark'
};

const TestList = () => {
  const [activeTab, setActiveTab] = useState('templates');
  const [templates, setTemplates] = useState([]);
  const [athletes, setAthletes] = useState([]);
  const [results, setResults] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [isTemplateModal, setIsTemplateModal] = useState(false);
  const [isResultModal, setIsResultModal] = useState(false);
  const [isSessionModal, setIsSessionModal] = useState(false);
  const [isHistoryModal, setIsHistoryModal] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [historyAthlete, setHistoryAthlete] = useState(null);
  const [historyResults, setHistoryResults] = useState([]);
  const [selectedTemplateForHistory, setSelectedTemplateForHistory] = useState('');

  const [formData, setFormData] = useState({
    name: '', description: '', category: 'PERSONALIZADO', unit: '', higher_is_better: true
  });

  const [resultData, setResultData] = useState({
    template_id: '', athlete_id: '', value: '', notes: '', test_date: new Date().toISOString().split('T')[0]
  });

  // Session form state
  const [sessionData, setSessionData] = useState({
    name: '', notes: '', session_date: new Date().toISOString().split('T')[0],
    selectedTests: [], selectedAthletes: [], results: {}
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [t, a, r, s] = await Promise.all([
        testService.getTemplates(),
        athleteService.getAthletes(),
        testService.getResults(),
        testService.getSessions()
      ]);
      setTemplates(t);
      setAthletes(a);
      setResults(r);
      setSessions(s);
    } catch (err) {
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleResultChange = e => setResultData({ ...resultData, [e.target.name]: e.target.value });

  // Template CRUD
  const openCreateTemplate = () => {
    setEditingTemplate(null);
    setFormData({ name: '', description: '', category: 'PERSONALIZADO', unit: '', higher_is_better: true });
    setIsTemplateModal(true);
  };

  const openEditTemplate = (t) => {
    setEditingTemplate(t);
    setFormData({
      name: t.name, description: t.description || '',
      category: t.category, unit: t.unit, higher_is_better: t.higher_is_better
    });
    setIsTemplateModal(true);
  };

  const handleTemplateSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        await testService.updateTemplate(editingTemplate.id, formData);
      } else {
        await testService.createTemplate(formData);
      }
      setIsTemplateModal(false);
      fetchData();
    } catch (err) {
      setError('Error al guardar plantilla');
    }
  };

  const confirmDeleteTemplate = async () => {
    if (!deleteTarget) return;
    try {
      await testService.deleteTemplate(deleteTarget.id);
      fetchData();
    } catch (err) {
      setError('Error al eliminar plantilla');
    } finally {
      setIsConfirmOpen(false);
      setDeleteTarget(null);
    }
  };

  // Results
  const openCreateResult = () => {
    setResultData({
      template_id: '', athlete_id: '', value: '', notes: '', test_date: new Date().toISOString().split('T')[0]
    });
    setIsResultModal(true);
  };

  const handleResultSubmit = async (e) => {
    e.preventDefault();
    try {
      await testService.createResult({
        ...resultData,
        value: parseFloat(resultData.value)
      });
      setIsResultModal(false);
      fetchData();
    } catch (err) {
      setError('Error al registrar evaluacion');
    }
  };

  const confirmDeleteResult = async (id) => {
    try {
      await testService.deleteResult(id);
      fetchData();
    } catch (err) {
      setError('Error al eliminar resultado');
    }
  };

  // Sessions
  const openCreateSession = () => {
    setSessionData({
      name: '', notes: '', session_date: new Date().toISOString().split('T')[0],
      selectedTests: [], selectedAthletes: [], results: {}
    });
    setIsSessionModal(true);
  };

  const toggleSessionTest = (testId) => {
    setSessionData(prev => {
      const newTests = prev.selectedTests.includes(testId)
        ? prev.selectedTests.filter(id => id !== testId)
        : [...prev.selectedTests, testId];
      return { ...prev, selectedTests: newTests };
    });
  };

  const toggleSessionAthlete = (athleteId) => {
    setSessionData(prev => {
      const newAthletes = prev.selectedAthletes.includes(athleteId)
        ? prev.selectedAthletes.filter(id => id !== athleteId)
        : [...prev.selectedAthletes, athleteId];
      return { ...prev, selectedAthletes: newAthletes };
    });
  };

  const updateSessionResult = (testId, athleteId, value) => {
    setSessionData(prev => {
      const key = `${testId}-${athleteId}`;
      const newResults = { ...prev.results, [key]: value };
      return { ...prev, results: newResults };
    });
  };

  const handleSessionSubmit = async (e) => {
    e.preventDefault();
    try {
      const resultsArray = [];
      sessionData.selectedTests.forEach(testId => {
        sessionData.selectedAthletes.forEach(athleteId => {
          const key = `${testId}-${athleteId}`;
          const value = sessionData.results[key];
          if (value !== undefined && value !== '') {
            resultsArray.push({
              template_id: testId,
              athlete_id: athleteId,
              value: parseFloat(value)
            });
          }
        });
      });

      if (resultsArray.length === 0) {
        setError('Debe ingresar al menos un resultado');
        return;
      }

      await testService.createSession({
        name: sessionData.name,
        notes: sessionData.notes,
        session_date: sessionData.session_date,
        results: resultsArray
      });
      setIsSessionModal(false);
      fetchData();
    } catch (err) {
      setError('Error al crear sesion');
    }
  };

  // History
  const openHistory = async (athlete) => {
    setHistoryAthlete(athlete);
    setSelectedTemplateForHistory('');
    const history = await testService.getAthleteHistory(athlete.id);
    setHistoryResults(history);
    setIsHistoryModal(true);
  };

  const filterHistoryByTemplate = async (templateId) => {
    setSelectedTemplateForHistory(templateId);
    if (!historyAthlete) return;
    const history = await testService.getAthleteHistory(historyAthlete.id, templateId || null);
    setHistoryResults(history);
  };

  const getChartData = () => {
    if (selectedTemplateForHistory && historyResults.length > 0) {
      return historyResults.map(r => ({
        date: new Date(r.test_date).toLocaleDateString(),
        value: parseFloat(r.value)
      }));
    }
    return [];
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando...</div>;

  const chartData = getChartData();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Tests de Evaluacion</h1>
          <p className="text-muted">Gestion de pruebas fisicas, evaluaciones y seguimiento deportivo.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {activeTab === 'templates' && (
            <button className="btn btn-primary" onClick={openCreateTemplate}>+ Nueva Plantilla</button>
          )}
          {activeTab === 'results' && (
            <button className="btn btn-primary" onClick={openCreateResult}>+ Nueva Evaluacion</button>
          )}
          {activeTab === 'sessions' && (
            <button className="btn btn-primary" onClick={openCreateSession}>+ Nueva Sesion</button>
          )}
        </div>
      </div>

      {error && <div className="badge badge-danger" style={{ marginBottom: '16px', width: '100%' }}>{error}</div>}

      {/* Tabs */}
      <div className="tabs" style={{ display: 'flex', gap: 0, marginBottom: '24px', borderBottom: '2px solid var(--border)' }}>
        <button
          onClick={() => setActiveTab('templates')}
          className={`btn ${activeTab === 'templates' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ borderRadius: 0, flex: 1 }}
        >
          Plantillas de Tests
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`btn ${activeTab === 'results' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ borderRadius: 0, flex: 1 }}
        >
          Evaluaciones Registradas
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          className={`btn ${activeTab === 'sessions' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ borderRadius: 0, flex: 1 }}
        >
          Sesiones de Tests
        </button>
      </div>

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Categoria</th>
                <th>Unidad</th>
                <th>Mayor = Mejor</th>
                <th>Tipo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {templates.map(t => (
                <tr key={t.id}>
                  <td>
                    <strong>{t.name}</strong>
                    {t.description && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.description}</div>}
                  </td>
                  <td><span className={CATEGORY_BADGES[t.category] || 'badge badge-dark'}>{t.category}</span></td>
                  <td style={{ fontWeight: 600 }}>{t.unit}</td>
                  <td>{t.higher_is_better ? '✅ Si' : '❌ No'}</td>
                  <td>{t.is_predefined ? <span className="badge badge-info">Predefinido</span> : <span className="badge badge-warning">Personalizado</span>}</td>
                  <td>
                    {!t.is_predefined && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEditTemplate(t)}>Editar</button>
                        <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#b91c1c', border: 'none' }}
                          onClick={() => { setDeleteTarget(t); setIsConfirmOpen(true); }}>✕</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Results Tab */}
      {activeTab === 'results' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Atleta</th>
                <th>Test</th>
                <th>Resultado</th>
                <th>Fecha</th>
                <th>Entrenador</th>
                <th>Notas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {results.map(r => (
                <tr key={r.id}>
                  <td>
                    <div className="table-cell-name">
                      <div className="table-avatar" style={{
                        background: avatarColor(r.athlete_name || ''),
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: '600',
                        flexShrink: 0,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                      }}>
                        {initials(r.athlete_name?.split(' ')[0], r.athlete_name?.split(' ')[1])}
                      </div>
                      <strong>{r.athlete_name}</strong>
                    </div>
                  </td>
                  <td>{r.template_name}</td>
                  <td style={{ fontWeight: 700, color: 'var(--brand-600)' }}>{r.value}</td>
                  <td>{new Date(r.test_date).toLocaleDateString()}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{r.trainer_name || '-'}</td>
                  <td style={{ fontSize: '0.85rem', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {r.notes || '-'}
                  </td>
                  <td>
                    <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#b91c1c', border: 'none' }}
                      onClick={() => confirmDeleteResult(r.id)}>✕</button>
                  </td>
                </tr>
              ))}
              {results.length === 0 && (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>No hay evaluaciones registradas aun.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Fecha</th>
                <th>Entrenador</th>
                <th>Tests</th>
                <th>Atletas</th>
                <th>Resultados</th>
                <th>Notas</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => (
                <tr key={s.id}>
                  <td><strong>{s.name || 'Sesion sin nombre'}</strong></td>
                  <td>{new Date(s.session_date).toLocaleDateString()}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{s.trainer_name || '-'}</td>
                  <td><span className="badge badge-info">{s.results?.length || 0} tests</span></td>
                  <td><span className="badge badge-success">{new Set(s.results?.map(r => r.athlete_id)).size || 0} atletas</span></td>
                  <td><span className="badge badge-primary">{s.results?.length || 0} registros</span></td>
                  <td style={{ fontSize: '0.85rem', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.notes || '-'}
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>No hay sesiones registradas aun.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* History Section */}
      {athletes.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h3 style={{ marginBottom: '12px' }}>Historial por Atleta</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Atleta</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {athletes.map(a => (
                  <tr key={a.id}>
                    <td>
                      <div className="table-cell-name">
                        <div className="table-avatar" style={{
                          background: avatarColor(a.user?.first_name || ''),
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: '600',
                          flexShrink: 0,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}>
                          {initials(a.user?.first_name, a.user?.last_name)}
                        </div>
                        <div>
                          <strong>{a.user?.first_name} {a.user?.last_name}</strong>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{a.user?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => openHistory(a)}>
                        📊 Ver Tests
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Template Modal */}
      <Modal isOpen={isTemplateModal} onClose={() => setIsTemplateModal(false)}
        title={editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla de Test'}>
        <form onSubmit={handleTemplateSubmit} style={{ display: 'contents' }}>
          <div className="form-group">
            <label className="form-label">Nombre del Test</label>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange}
              className="form-input" required placeholder="Ej: Test de Cooper" />
          </div>
          <div className="form-group">
            <label className="form-label">Descripcion</label>
            <textarea name="description" value={formData.description} onChange={handleInputChange}
              className="form-input" rows="2" placeholder="Instrucciones o descripcion del test" />
          </div>
          <div className="form-group">
            <label className="form-label">Categoria</label>
            <select name="category" value={formData.category} onChange={handleInputChange} className="form-input">
              <option value="RESISTENCIA">Resistencia</option>
              <option value="VELOCIDAD">Velocidad</option>
              <option value="FUERZA">Fuerza</option>
              <option value="POTENCIA">Potencia</option>
              <option value="FUERZA_CORE">Fuerza Core</option>
              <option value="FLEXIBILIDAD">Flexibilidad</option>
              <option value="AGILIDAD">Agilidad</option>
              <option value="PERSONALIZADO">Personalizado</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Unidad de Medida</label>
            <select name="unit" value={formData.unit} onChange={handleInputChange} className="form-input" required>
              <option value="">Seleccionar...</option>
              <option value="metros">Metros</option>
              <option value="segundos">Segundos</option>
              <option value="repeticiones">Repeticiones</option>
              <option value="kg">Kilogramos</option>
              <option value="centimetros">Centimetros</option>
              <option value="nivel">Nivel</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">
              <input type="checkbox" checked={formData.higher_is_better}
                onChange={e => setFormData({ ...formData, higher_is_better: e.target.checked })} style={{ marginRight: 8 }} />
              Mayor valor = Mejor resultado
            </label>
          </div>
          <div className="modal-footer" style={{ margin: '8px -24px -24px', padding: '16px 24px' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsTemplateModal(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar</button>
          </div>
        </form>
      </Modal>

      {/* Result Modal */}
      <Modal isOpen={isResultModal} onClose={() => setIsResultModal(false)} title="Registrar Evaluacion">
        <form onSubmit={handleResultSubmit} style={{ display: 'contents' }}>
          <div className="form-group">
            <label className="form-label">Test</label>
            <select name="template_id" value={resultData.template_id} onChange={handleResultChange}
              className="form-input" required>
              <option value="">Seleccionar test...</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Atleta</label>
            <select name="athlete_id" value={resultData.athlete_id} onChange={handleResultChange}
              className="form-input" required>
              <option value="">Seleccionar atleta...</option>
              {athletes.map(a => (
                <option key={a.id} value={a.id}>
                  {a.user?.first_name} {a.user?.last_name} ({a.user?.identification_number})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Resultado</label>
            <input type="number" step="0.01" name="value" value={resultData.value}
              onChange={handleResultChange} className="form-input" required placeholder="Ej: 2800" />
          </div>
          <div className="form-group">
            <label className="form-label">Fecha del Test</label>
            <input type="date" name="test_date" value={resultData.test_date}
              onChange={handleResultChange} className="form-input" required />
          </div>
          <div className="form-group">
            <label className="form-label">Notas / Observaciones</label>
            <textarea name="notes" value={resultData.notes} onChange={handleResultChange}
              className="form-input" rows="2" placeholder="Condiciones, variaciones, etc." />
          </div>
          <div className="modal-footer" style={{ margin: '8px -24px -24px', padding: '16px 24px' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsResultModal(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Registrar</button>
          </div>
        </form>
      </Modal>

      {/* Session Modal - Create multiple tests at once */}
      <Modal isOpen={isSessionModal} onClose={() => setIsSessionModal(false)} title="Nueva Sesion de Tests">
        <form onSubmit={handleSessionSubmit} style={{ display: 'contents' }}>
          <div className="form-group">
            <label className="form-label">Nombre de la Sesion</label>
            <input type="text" name="name" value={sessionData.name}
              onChange={e => setSessionData({ ...sessionData, name: e.target.value })}
              className="form-input" placeholder="Ej: Evaluacion Fisica Semanal" />
          </div>
          <div className="form-group">
            <label className="form-label">Fecha</label>
            <input type="date" name="session_date" value={sessionData.session_date}
              onChange={e => setSessionData({ ...sessionData, session_date: e.target.value })}
              className="form-input" required />
          </div>

          {/* Select Tests */}
          <div className="form-group">
            <label className="form-label">Seleccionar Tests (multi)</label>
            <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px' }}>
              {templates.map(t => (
                <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', cursor: 'pointer' }}>
                  <input type="checkbox" checked={sessionData.selectedTests.includes(t.id)}
                    onChange={() => toggleSessionTest(t.id)} />
                  <span>{t.name}</span>
                  <span className={CATEGORY_BADGES[t.category] || 'badge badge-dark'} style={{ fontSize: '0.7rem' }}>{t.category}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Select Athletes */}
          <div className="form-group">
            <label className="form-label">Seleccionar Atletas (multi)</label>
            <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px' }}>
              {athletes.map(a => (
                <label key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', cursor: 'pointer' }}>
                  <input type="checkbox" checked={sessionData.selectedAthletes.includes(a.id)}
                    onChange={() => toggleSessionAthlete(a.id)} />
                  <span>{a.user?.first_name} {a.user?.last_name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Results Grid */}
          {sessionData.selectedTests.length > 0 && sessionData.selectedAthletes.length > 0 && (
            <div className="form-group">
              <label className="form-label">Ingresar Resultados</label>
              <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '4px', fontSize: '0.75rem' }}>Atleta</th>
                      {sessionData.selectedTests.map(testId => {
                        const test = templates.find(t => t.id === testId);
                        return <th key={testId} style={{ textAlign: 'center', padding: '4px', fontSize: '0.7rem' }}>{test?.name?.substring(0, 10)}</th>;
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {sessionData.selectedAthletes.map(athleteId => {
                      const athlete = athletes.find(a => a.id === athleteId);
                      return (
                        <tr key={athleteId}>
                          <td style={{ padding: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                            {athlete?.user?.first_name} {athlete?.user?.last_name}
                          </td>
                          {sessionData.selectedTests.map(testId => (
                            <td key={testId} style={{ padding: '4px' }}>
                              <input type="number" step="0.01"
                                value={sessionData.results[`${testId}-${athleteId}`] || ''}
                                onChange={e => updateSessionResult(testId, athleteId, e.target.value)}
                                style={{ width: '70px', padding: '4px', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '0.75rem', textAlign: 'center' }}
                                placeholder="0" />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Notas / Observaciones</label>
            <textarea name="notes" value={sessionData.notes}
              onChange={e => setSessionData({ ...sessionData, notes: e.target.value })}
              className="form-input" rows="2" placeholder="Condiciones, clima, etc." />
          </div>

          <div className="modal-footer" style={{ margin: '8px -24px -24px', padding: '16px 24px' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsSessionModal(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar Sesion</button>
          </div>
        </form>
      </Modal>

      {/* History Modal with Chart */}
      <Modal isOpen={isHistoryModal} onClose={() => setIsHistoryModal(false)}
        title={`Historial de Tests: ${historyAthlete?.user?.first_name} ${historyAthlete?.user?.last_name}`}>
        <div style={{ marginBottom: 16 }}>
          <label className="form-label">Filtrar por Test</label>
          <select value={selectedTemplateForHistory}
            onChange={e => filterHistoryByTemplate(e.target.value)} className="form-input">
            <option value="">Todos los tests</option>
            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        {chartData.length > 1 && (
          <div style={{ marginBottom: 24, padding: 16, background: '#f9fafb', borderRadius: 12 }}>
            <h4 style={{ marginBottom: 12, fontSize: '0.9rem' }}>Evolucion</h4>
            <ResponsiveContainer width="100%" height={250}>
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

        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Test</th>
                <th>Resultado</th>
                <th>Entrenador</th>
                <th>Notas</th>
              </tr>
            </thead>
            <tbody>
              {historyResults.map(r => (
                <tr key={r.id}>
                  <td>{new Date(r.test_date).toLocaleDateString()}</td>
                  <td><strong>{r.template_name}</strong></td>
                  <td style={{ fontWeight: 700, color: 'var(--brand-600)' }}>{r.value}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{r.trainer_name || '-'}</td>
                  <td style={{ fontSize: '0.85rem' }}>{r.notes || '-'}</td>
                </tr>
              ))}
              {historyResults.length === 0 && (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No hay resultados registrados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="modal-footer" style={{ margin: '8px -24px -24px', padding: '16px 24px' }}>
          <button type="button" className="btn btn-primary" onClick={() => setIsHistoryModal(false)}>Cerrar</button>
        </div>
      </Modal>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={confirmDeleteTemplate}
        title="Eliminar Plantilla"
        message={`Eliminar permanentemente la plantilla "${deleteTarget?.name}"?`}
      />
    </div>
  );
};

export default TestList;