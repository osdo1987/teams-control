import React, { useEffect, useState } from 'react';
import { trainingPlanService } from '../../services/trainingPlanService';
import { athleteService } from '../../services/athleteService';
import { groupService } from '../../services/groupService';
import Modal from '../../components/UI/Modal';
import ConfirmModal from '../../components/UI/ConfirmModal';
import { useToast } from '../../contexts/ToastContext';

const TrainingPlanList = () => {
  const [plans, setPlans] = useState([]);
  const [athletes, setAthletes] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showError, showSuccess } = useToast();
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'editor'

  // Modal states
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedPlanForAssign, setSelectedPlanForAssign] = useState(null);

  // Assignment form state
  const [assignForm, setAssignForm] = useState({
    targetType: 'athlete', // 'athlete' or 'group'
    athlete_id: '',
    group_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days default
  });

  // Editor states
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    cycles: []
  });

  // Expand state for plan details in listing
  const [expandedPlanId, setExpandedPlanId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansData, athletesData, groupsData] = await Promise.all([
        trainingPlanService.getPlans(),
        athleteService.getAthletes().catch(() => []),
        groupService.getGroups().catch(() => [])
      ]);
      setPlans(plansData);
      setAthletes(athletesData);
      setGroups(groupsData);
    } catch (err) {
      setError('Error al cargar datos del servidor');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanDelete = async () => {
    if (!deleteTarget) return;
    try {
      await trainingPlanService.deletePlan(deleteTarget.id);
      showSuccessMsg('Plan de entrenamiento eliminado correctamente.');
      fetchData();
    } catch (err) {
      showError(err.message || 'Error al eliminar el plan');
    } finally {
      setIsConfirmOpen(false);
      setDeleteTarget(null);
    }
  };

  // Editor Methods
  const startCreatePlan = () => {
    setEditingPlanId(null);
    setPlanForm({
      name: '',
      description: '',
      cycles: [
        {
          name: 'Semana 1',
          description: '',
          order: 1,
          sessions: [
            {
              name: 'Día 1',
              notes: '',
              order: 1,
              exercises: [
                { exercise_name: '', sets: 4, reps: '10', weight: '', duration_seconds: '', rest_seconds: 60, notes: '', order: 1 }
              ]
            }
          ]
        }
      ]
    });
    setActiveTab('editor');
  };

  const startEditPlan = (plan) => {
    setEditingPlanId(plan.id);
    setPlanForm({
      name: plan.name,
      description: plan.description || '',
      cycles: plan.cycles ? JSON.parse(JSON.stringify(plan.cycles)) : []
    });
    setActiveTab('editor');
  };

  const handlePlanFormChange = (field, val) => {
    setPlanForm(prev => ({ ...prev, [field]: val }));
  };

  // Cycle handlers
  const addCycle = () => {
    setPlanForm(prev => {
      const order = prev.cycles.length + 1;
      return {
        ...prev,
        cycles: [
          ...prev.cycles,
          {
            name: `Semana ${order}`,
            description: '',
            order: order,
            sessions: [
              {
                name: 'Día 1',
                notes: '',
                order: 1,
                exercises: [
                  { exercise_name: '', sets: 4, reps: '10', weight: '', duration_seconds: '', rest_seconds: 60, notes: '', order: 1 }
                ]
              }
            ]
          }
        ]
      };
    });
  };

  const removeCycle = (cycleIdx) => {
    setPlanForm(prev => ({
      ...prev,
      cycles: prev.cycles.filter((_, idx) => idx !== cycleIdx)
    }));
  };

  const handleCycleChange = (cycleIdx, field, val) => {
    setPlanForm(prev => {
      const cycles = [...prev.cycles];
      cycles[cycleIdx][field] = val;
      return { ...prev, cycles };
    });
  };

  // Session handlers
  const addSession = (cycleIdx) => {
    setPlanForm(prev => {
      const cycles = [...prev.cycles];
      const order = cycles[cycleIdx].sessions.length + 1;
      cycles[cycleIdx].sessions.push({
        name: `Día ${order}`,
        notes: '',
        order: order,
        exercises: [
          { exercise_name: '', sets: 4, reps: '10', weight: '', duration_seconds: '', rest_seconds: 60, notes: '', order: 1 }
        ]
      });
      return { ...prev, cycles };
    });
  };

  const removeSession = (cycleIdx, sessionIdx) => {
    setPlanForm(prev => {
      const cycles = [...prev.cycles];
      cycles[cycleIdx].sessions = cycles[cycleIdx].sessions.filter((_, idx) => idx !== sessionIdx);
      return { ...prev, cycles };
    });
  };

  const handleSessionChange = (cycleIdx, sessionIdx, field, val) => {
    setPlanForm(prev => {
      const cycles = [...prev.cycles];
      cycles[cycleIdx].sessions[sessionIdx][field] = val;
      return { ...prev, cycles };
    });
  };

  // Exercise handlers
  const addExercise = (cycleIdx, sessionIdx) => {
    setPlanForm(prev => {
      const cycles = [...prev.cycles];
      const order = cycles[cycleIdx].sessions[sessionIdx].exercises.length + 1;
      cycles[cycleIdx].sessions[sessionIdx].exercises.push({
        exercise_name: '',
        sets: 4,
        reps: '10',
        weight: '',
        duration_seconds: '',
        rest_seconds: 60,
        notes: '',
        order: order
      });
      return { ...prev, cycles };
    });
  };

  const removeExercise = (cycleIdx, sessionIdx, exerciseIdx) => {
    setPlanForm(prev => {
      const cycles = [...prev.cycles];
      cycles[cycleIdx].sessions[sessionIdx].exercises = cycles[cycleIdx].sessions[sessionIdx].exercises.filter((_, idx) => idx !== exerciseIdx);
      return { ...prev, cycles };
    });
  };

  const handleExerciseChange = (cycleIdx, sessionIdx, exerciseIdx, field, val) => {
    setPlanForm(prev => {
      const cycles = [...prev.cycles];
      cycles[cycleIdx].sessions[sessionIdx].exercises[exerciseIdx][field] = val;
      return { ...prev, cycles };
    });
  };

  // Save Plan
  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!planForm.name.trim()) {
      showError('El nombre del plan es obligatorio.');
      return;
    }

    // Prepare payload
    const payload = {
      name: planForm.name,
      description: planForm.description || null,
      cycles: planForm.cycles.map((c, cIdx) => ({
        name: c.name,
        description: c.description || null,
        order: cIdx + 1,
        sessions: c.sessions.map((s, sIdx) => ({
          name: s.name || `Sesión ${sIdx + 1}`,
          notes: s.notes,
          order: sIdx + 1,
          exercises: s.exercises.map((ex, exIdx) => ({
            exercise_name: ex.exercise_name,
            sets: parseInt(ex.sets) || 1,
            reps: ex.reps || '',
            weight: ex.weight || '',
            duration_seconds: ex.duration_seconds ? parseInt(ex.duration_seconds) : null,
            rest_seconds: ex.rest_seconds ? parseInt(ex.rest_seconds) : null,
            notes: ex.notes || '',
            order: exIdx + 1
          }))
        }))
      }))
    };

    try {
      if (editingPlanId) {
        await trainingPlanService.updatePlan(editingPlanId, payload);
        showSuccess('Plan de entrenamiento actualizado correctamente.');
      } else {
        await trainingPlanService.createPlan(payload);
        showSuccess('Plan de entrenamiento creado correctamente.');
      }
      setActiveTab('list');
      fetchData();
    } catch (err) {
      showError(err.message || 'Error al guardar el plan de entrenamiento.');
    }
  };

  // Assignment Modal
  const openAssignModal = (plan) => {
    setSelectedPlanForAssign(plan);
    setAssignForm({
      targetType: 'athlete',
      athlete_id: '',
      group_id: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    setIsAssignModalOpen(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      start_date: assignForm.start_date,
      end_date: assignForm.end_date
    };
    if (assignForm.targetType === 'athlete') {
      if (!assignForm.athlete_id) {
        setError('Debe seleccionar un atleta.');
        return;
      }
      payload.athlete_id = parseInt(assignForm.athlete_id);
    } else {
      if (!assignForm.group_id) {
        setError('Debe seleccionar un grupo.');
        return;
      }
      payload.group_id = parseInt(assignForm.group_id);
    }

    try {
      await trainingPlanService.assignPlan(selectedPlanForAssign.id, payload);
      showSuccessMsg(`Plan de entrenamiento asignado exitosamente.`);
      setIsAssignModalOpen(false);
      setSelectedPlanForAssign(null);
    } catch (err) {
      setError('Error al asignar el plan.');
    }
  };

  if (loading) return <div className="loading-state"><div className="spinner spinner-lg"></div><p>Cargando planes de entrenamiento...</p></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Planes de Entrenamiento</h1>
          <p className="text-muted">Planifica y asigna rutinas y ciclos deportivos a tus atletas y grupos.</p>
        </div>
        {activeTab === 'list' && (
          <button className="btn btn-primary" onClick={startCreatePlan}>
            ⚡ Nuevo Plan
          </button>
        )}
      </div>

      {/* ==================== PLAN EDITOR ==================== */}
      {activeTab === 'editor' && (
        <form onSubmit={handleSavePlan} className="card" style={{ padding: 24 }}>
          <h2>{editingPlanId ? '📝 Editar Plan' : '⚡ Nuevo Plan de Entrenamiento'}</h2>

          <div className="form-group" style={{ marginTop: 16 }}>
            <label className="form-label">Nombre del Plan</label>
            <input
              type="text"
              className="form-input"
              value={planForm.name}
              onChange={e => handlePlanFormChange('name', e.target.value)}
              placeholder="Ej: Periodo Preparatorio - Fuerza Base"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea
              className="form-input"
              value={planForm.description}
              onChange={e => handlePlanFormChange('description', e.target.value)}
              placeholder="Ej: Enfoque de hipertrofia muscular y fortalecimiento de core para la pretemporada."
              rows={3}
            />
          </div>

          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3>Ciclos / Semanas del Plan ({planForm.cycles.length})</h3>
              <button type="button" className="btn btn-ghost btn-sm" onClick={addCycle}>
                ➕ Agregar Ciclo
              </button>
            </div>

            {planForm.cycles.map((cycle, cycleIdx) => (
              <div key={cycleIdx} className="card" style={{ background: 'var(--bg-light)', padding: 16, marginBottom: 16, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ fontWeight: 'bold' }}
                      value={cycle.name}
                      onChange={e => handleCycleChange(cycleIdx, 'name', e.target.value)}
                      placeholder="Nombre del Ciclo (ej: Semana 1)"
                    />
                  </div>
                  <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--danger-color)' }} onClick={() => removeCycle(cycleIdx)}>
                    Eliminar Ciclo
                  </button>
                </div>

                <div className="form-group">
                  <input
                    type="text"
                    className="form-input"
                    value={cycle.description}
                    onChange={e => handleCycleChange(cycleIdx, 'description', e.target.value)}
                    placeholder="Descripción del ciclo/objetivo principal de la semana"
                  />
                </div>

                {/* SESSIONS / DAYS OF CYCLE */}
                <div style={{ paddingLeft: 16, borderLeft: '2px solid var(--brand-300)', marginTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <strong style={{ fontSize: '0.875rem' }}>Sesiones de Entrenamiento</strong>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => addSession(cycleIdx)}>
                      ➕ Agregar Sesión / Día
                    </button>
                  </div>

                  {cycle.sessions.map((session, sessionIdx) => (
                    <div key={sessionIdx} style={{ background: 'var(--bg-card)', padding: 12, borderRadius: 8, marginBottom: 12, border: '1px dashed var(--border)' }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
                        <input
                          type="text"
                          className="form-input"
                          style={{ flex: 1, fontSize: '0.85rem', fontWeight: 600 }}
                          value={session.name}
                          onChange={e => handleSessionChange(cycleIdx, sessionIdx, 'name', e.target.value)}
                          placeholder="Nombre del Día (ej: Día 1 - Pierna)"
                        />
                        <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--danger-color)' }} onClick={() => removeSession(cycleIdx, sessionIdx)}>
                          🗑️
                        </button>
                      </div>

                      <div className="form-group">
                        <input
                          type="text"
                          className="form-input"
                          value={session.notes}
                          onChange={e => handleSessionChange(cycleIdx, sessionIdx, 'notes', e.target.value)}
                          placeholder="Notas generales de la sesión"
                        />
                      </div>

                      {/* EXERCISES OF SESSION */}
                      <div style={{ marginTop: 8 }}>
                        <table className="data-table" style={{ fontSize: '0.8rem', minWidth: 'unset', width: '100%' }}>
                          <thead>
                            <tr>
                              <th>Nombre del Ejercicio</th>
                              <th style={{ width: 60 }}>Sets</th>
                              <th style={{ width: 85 }}>Reps</th>
                              <th style={{ width: 85 }}>Peso</th>
                              <th style={{ width: 80 }}>Descanso (s)</th>
                              <th>Notas</th>
                              <th style={{ width: 40 }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {session.exercises.map((ex, exIdx) => (
                              <tr key={exIdx}>
                                <td>
                                  <input
                                    type="text"
                                    className="form-input"
                                    style={{ fontSize: '0.75rem', padding: 4 }}
                                    value={ex.exercise_name}
                                    onChange={e => handleExerciseChange(cycleIdx, sessionIdx, exIdx, 'exercise_name', e.target.value)}
                                    placeholder="Ej: Sentadilla"
                                    required
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    className="form-input"
                                    style={{ fontSize: '0.75rem', padding: 4, textAlign: 'center' }}
                                    value={ex.sets}
                                    onChange={e => handleExerciseChange(cycleIdx, sessionIdx, exIdx, 'sets', e.target.value)}
                                    min="1"
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    className="form-input"
                                    style={{ fontSize: '0.75rem', padding: 4 }}
                                    value={ex.reps}
                                    onChange={e => handleExerciseChange(cycleIdx, sessionIdx, exIdx, 'reps', e.target.value)}
                                    placeholder="Ej: 10 o Fallo"
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    className="form-input"
                                    style={{ fontSize: '0.75rem', padding: 4 }}
                                    value={ex.weight}
                                    onChange={e => handleExerciseChange(cycleIdx, sessionIdx, exIdx, 'weight', e.target.value)}
                                    placeholder="Ej: 80kg o 75%"
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    className="form-input"
                                    style={{ fontSize: '0.75rem', padding: 4, textAlign: 'center' }}
                                    value={ex.rest_seconds}
                                    onChange={e => handleExerciseChange(cycleIdx, sessionIdx, exIdx, 'rest_seconds', e.target.value)}
                                    placeholder="60"
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    className="form-input"
                                    style={{ fontSize: '0.75rem', padding: 4 }}
                                    value={ex.notes}
                                    onChange={e => handleExerciseChange(cycleIdx, sessionIdx, exIdx, 'notes', e.target.value)}
                                    placeholder="Ej: Codos adentro"
                                  />
                                </td>
                                <td>
                                  <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--danger-color)', padding: 2 }} onClick={() => removeExercise(cycleIdx, sessionIdx, exIdx)}>
                                    ✕
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => addExercise(cycleIdx, sessionIdx)}>
                          ➕ Agregar Ejercicio
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="modal-footer" style={{ marginTop: 24, padding: 0 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setActiveTab('list')}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              💾 Guardar Plan
            </button>
          </div>
        </form>
      )}

      {/* ==================== PLAN LIST ==================== */}
      {activeTab === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {plans.map(plan => (
            <div key={plan.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    🏋️‍♂️ {plan.name}
                  </h3>
                  <p className="text-muted" style={{ margin: '4px 0 8px', fontSize: '0.85rem' }}>
                    {plan.description || 'Sin descripción'}
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className="badge badge-info">{plan.cycles?.length || 0} Ciclos / Semanas</span>
                    <span className="badge badge-primary">Creado por {plan.trainer_name || 'Entrenador'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setExpandedPlanId(expandedPlanId === plan.id ? null : plan.id)}>
                    {expandedPlanId === plan.id ? 'Ocultar Detalles' : 'Ver Estructura'}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => openAssignModal(plan)}>
                    ⚡ Asignar Plan
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => startEditPlan(plan)}>
                    Editar
                  </button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger-color)' }} onClick={() => { setDeleteTarget(plan); setIsConfirmOpen(true); }}>
                    Eliminar
                  </button>
                </div>
              </div>

              {expandedPlanId === plan.id && (
                <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                  <h4>Estructura del Plan</h4>
                  {plan.cycles?.map((cycle, cIdx) => (
                    <div key={cycle.id} style={{ marginTop: 12, paddingLeft: 12, borderLeft: '3px solid var(--brand-500)' }}>
                      <strong>{cycle.name}</strong> {cycle.description && <span className="text-muted" style={{ fontSize: '0.8rem' }}>- {cycle.description}</span>}
                      {cycle.sessions?.map(session => (
                        <div key={session.id} style={{ marginLeft: 16, marginTop: 8, background: 'var(--bg-light)', padding: 10, borderRadius: 6 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>📅 {session.name}</div>
                          {session.notes && <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: 4 }}>Nota: {session.notes}</div>}
                          <table className="data-table" style={{ fontSize: '0.75rem', width: '100%', minWidth: 'unset', marginTop: 4 }}>
                            <thead>
                              <tr>
                                <th>Ejercicio</th>
                                <th>Sets</th>
                                <th>Repeticiones</th>
                                <th>Peso</th>
                                <th>Descanso</th>
                                <th>Notas</th>
                              </tr>
                            </thead>
                            <tbody>
                              {session.exercises?.map(ex => (
                                <tr key={ex.id}>
                                  <td><strong>{ex.exercise_name}</strong></td>
                                  <td>{ex.sets}</td>
                                  <td>{ex.reps || '-'}</td>
                                  <td>{ex.weight || '-'}</td>
                                  <td>{ex.rest_seconds ? `${ex.rest_seconds}s` : '-'}</td>
                                  <td>{ex.notes || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {plans.length === 0 && (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <p className="text-muted">No hay planes de entrenamiento registrados en tu club.</p>
              <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={startCreatePlan}>
                + Crear el primer plan
              </button>
            </div>
          )}
        </div>
      )}

      {/* ==================== ASSIGN MODAL ==================== */}
      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="Asignar Plan de Entrenamiento">
        <form onSubmit={handleAssignSubmit} style={{ display: 'contents' }}>
          <div style={{ marginBottom: 12 }}>
            <strong>Plan:</strong> {selectedPlanForAssign?.name}
          </div>

          <div className="form-group">
            <label className="form-label">Asignar a</label>
            <select
              className="form-input"
              value={assignForm.targetType}
              onChange={e => setAssignForm({ ...assignForm, targetType: e.target.value, athlete_id: '', group_id: '' })}
            >
              <option value="athlete">Atleta Individual</option>
              <option value="group">Grupo de Entrenamiento</option>
            </select>
          </div>

          {assignForm.targetType === 'athlete' ? (
            <div className="form-group">
              <label className="form-label">Seleccionar Atleta</label>
              <select
                className="form-input"
                value={assignForm.athlete_id}
                onChange={e => setAssignForm({ ...assignForm, athlete_id: e.target.value })}
                required
              >
                <option value="">Seleccionar...</option>
                {athletes.map(ath => (
                  <option key={ath.id} value={ath.id}>
                    {ath.user?.first_name} {ath.user?.last_name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">Seleccionar Grupo</label>
              <select
                className="form-input"
                value={assignForm.group_id}
                onChange={e => setAssignForm({ ...assignForm, group_id: e.target.value })}
                required
              >
                <option value="">Seleccionar...</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="form-label">Fecha de Inicio</label>
              <input
                type="date"
                className="form-input"
                value={assignForm.start_date}
                onChange={e => setAssignForm({ ...assignForm, start_date: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="form-label">Fecha de Fin</label>
              <input
                type="date"
                className="form-input"
                value={assignForm.end_date}
                onChange={e => setAssignForm({ ...assignForm, end_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="modal-footer" style={{ margin: '8px -24px -24px', padding: '16px 24px' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsAssignModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Confirmar Asignación
            </button>
          </div>
        </form>
      </Modal>

      {/* ==================== CONFIRM DELETE MODAL ==================== */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handlePlanDelete}
        title="Eliminar Plan"
        message={`¿Estás seguro de que deseas eliminar el plan "${deleteTarget?.name}"? Esta acción no se puede deshacer y eliminará las asignaciones activas.`}
      />
    </div>
  );
};

export default TrainingPlanList;
