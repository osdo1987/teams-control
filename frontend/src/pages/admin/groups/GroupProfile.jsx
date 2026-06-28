import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groupService } from '../../../services/groupService';
import { useToast } from '../../../contexts/ToastContext';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f97316', '#ec4899', '#0ea5e9', '#f59e0b', '#84cc16', '#14b8a6', '#a855f7'];
const getCategoryColor = (catId) => COLORS[(catId || 0) % COLORS.length];

const GroupProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();

  const [group, setGroup] = useState(null);
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAthletes, setLoadingAthletes] = useState(false);

  // Interactive States
  const [activeTab, setActiveTab] = useState('plan'); // 'plan', 'atletas', 'asistencia', 'tests', 'finanzas'
  const [activeDay, setActiveDay] = useState('Mié');
  const [completedExercises, setCompletedExercises] = useState({ 0: true, 1: true });
  const [selectedWeek, setSelectedWeek] = useState('1');

  useEffect(() => {
    fetchGroupDetails();
  }, [id]);

  const fetchGroupDetails = async () => {
    setLoading(true);
    try {
      const groups = await groupService.getGroups();
      const foundGroup = groups.find(g => g.id === parseInt(id));
      if (!foundGroup) {
        showError('Grupo no encontrado');
        navigate('/admin/groups');
        return;
      }
      setGroup(foundGroup);

      setLoadingAthletes(true);
      const athletesData = await groupService.getGroupAthletes(foundGroup.id);
      setAthletes(athletesData || []);
    } catch (err) {
      showError(err.message || 'Error al cargar los detalles del grupo');
    } finally {
      setLoading(false);
      setLoadingAthletes(false);
    }
  };

  const getScheduleBlocks = (g) => {
    let blocks = [];
    try {
      blocks = g.schedule_blocks ? JSON.parse(g.schedule_blocks) : [];
    } catch {
      blocks = [];
    }
    return blocks;
  };

  const getCapacityPercent = (g) => {
    const current = g.athletes_count ?? athletes.length ?? 0;
    const max = g.max_capacity || 1;
    return Math.min(Math.round((current / max) * 100), 100);
  };

  const getStatusText = (g) => {
    const current = g.athletes_count ?? athletes.length ?? 0;
    const max = g.max_capacity;
    if (max && current >= max) return 'Lleno';
    return 'Activo';
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Cargando detalles del grupo...
      </div>
    );
  }

  if (!group) return null;

  return (
    <div className="group-profile-page" style={{ padding: '20px', maxWidth: '100%' }}>
      {/* Header with back button */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.5px' }}>Perfil del Grupo</h1>
          <p className="text-muted" style={{ color: '#64748B', fontSize: '0.9rem', marginTop: '5px' }}>
            Gestión integral, asistencia y planificación del grupo.
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-ghost" onClick={() => navigate('/admin/groups')} style={{ fontWeight: '600' }}>
            ← Volver a Grupos
          </button>
        </div>
      </div>

      {/* Profile Hero */}
      <div className="profile-hero-card" style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        gap: '24px',
        alignItems: 'center',
        marginBottom: '25px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        flexWrap: 'wrap'
      }}>
        <div className="profile-hero-avatar" style={{
          width: '80px',
          height: '80px',
          borderRadius: '16px',
          fontSize: '2rem',
          fontWeight: '800',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #2563EB, #8B5CF6)',
          color: 'white',
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
        }}>
          {group.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div className="profile-hero-info" style={{ flex: 1 }}>
          <h2 className="profile-hero-name" style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0 }}>{group.name}</h2>
          <div className="profile-hero-meta" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
            <span className="tag tag-active" style={{ background: '#ECFDF5', color: '#047857', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' }}>
              🟢 {getStatusText(group)}
            </span>
            {group.category_obj?.name && (
              <span className="tag tag-group" style={{
                background: `${getCategoryColor(group.category_id)}20`,
                color: getCategoryColor(group.category_id),
                border: `1px solid ${getCategoryColor(group.category_id)}40`,
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: '700',
                textTransform: 'uppercase'
              }}>
                {group.category_obj.name}
              </span>
            )}
            {group.level && (
              <span className="tag tag-id" style={{ background: '#F1F5F9', color: '#0F172A', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600' }}>
                Nivel: {group.level}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Profile Tabs */}
      <div className="profile-tabs" style={{
        display: 'flex',
        gap: '6px',
        marginBottom: '25px',
        background: '#F1F5F9',
        padding: '5px',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        width: 'fit-content'
      }}>
        {[
          { id: 'plan', label: 'Plan de Entrenamiento' },
          { id: 'atletas', label: 'Atletas' },
          { id: 'asistencia', label: 'Asistencia' },
          { id: 'tests', label: 'Tests Físicos' },
          { id: 'finanzas', label: 'Finanzas' }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`profile-tab ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? '#2563EB' : 'transparent',
                color: isActive ? '#FFFFFF' : '#64748B',
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: isActive ? '0 2px 8px rgba(37, 99, 235, 0.2)' : 'none'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {/* 1. PLAN DE ENTRENAMIENTO TAB */}
      {activeTab === 'plan' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* MACRO PLAN SUMMARY */}
          <div className="macro-summary" style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderLeft: '5px solid #2563EB',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '15px'
          }}>
            <div className="macro-info">
              <h2 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '5px' }}>Pretemporada Verano</h2>
              <p style={{ color: '#64748B', fontSize: '0.85rem' }}>📅 01 Jun - 30 Jun | Fase Actual: Acumulación</p>
            </div>
            <div className="macro-actions">
              <div className="progress-ring" style={{
                width: '55px',
                height: '55px',
                borderRadius: '50%',
                background: 'conic-gradient(#2563EB 65%, #F1F5F9 0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{
                  width: '43px',
                  height: '43px',
                  background: '#FFFFFF',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  color: '#2563EB'
                }}>65%</span>
              </div>
            </div>
          </div>

          {/* MICROCYCLE (WEEK) */}
          <div className="card" style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>Microciclo:</span>
                <select
                  className="week-selector"
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  style={{
                    background: '#F1F5F9',
                    border: '1px solid #E2E8F0',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value="1">Semana 3 (10 Jun - 16 Jun)</option>
                  <option value="2">Semana 4 - Descarga (17 Jun - 23 Jun)</option>
                </select>
                <span className={`tag ${selectedWeek === '2' ? 'tag-orange' : 'tag-green'}`} style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  {selectedWeek === '2' ? 'Descarga' : 'Carga'}
                </span>
              </div>
            </div>

            <div className="days-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
              {[
                { day: 'Lun', num: '10', type: 'Fuerza' },
                { day: 'Mar', num: '11', type: 'Descanso' },
                { day: 'Mié', num: '12', type: 'Velocidad' },
                { day: 'Jue', num: '13', type: 'Técnica' },
                { day: 'Vie', num: '14', type: 'Partido' },
                { day: 'Sáb', num: '15', type: 'Recup.' },
                { day: 'Dom', num: '16', type: 'Descanso' }
              ].map((d) => {
                const isActive = activeDay === d.day;
                const isRest = d.type.includes('Descanso');
                return (
                  <div
                    key={d.day}
                    onClick={() => setActiveDay(d.day)}
                    style={{
                      background: isActive ? '#2563EB' : '#F8FAFC',
                      color: isActive ? '#FFFFFF' : '#0F172A',
                      border: `1px solid ${isActive ? '#2563EB' : '#E2E8F0'}`,
                      borderRadius: '12px',
                      padding: '15px 10px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: '0.2s'
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '700', color: isActive ? '#FFFFFF' : '#64748B' }}>{d.day}</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '800', margin: '5px 0' }}>{d.num}</div>
                    <div style={{
                      fontSize: '0.65rem',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: isActive ? 'rgba(255, 255, 255, 0.2)' : (isRest ? '#F1F5F9' : 'rgba(37, 99, 235, 0.1)'),
                      color: isActive ? '#FFFFFF' : (isRest ? '#64748B' : '#2563EB'),
                      fontWeight: '600',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden'
                    }}>{d.type}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SESSION DETAILS */}
          <div className="card" style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div className="session-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              background: '#F1F5F9',
              padding: '15px',
              borderRadius: '12px'
            }}>
              <div className="session-title">
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>
                  {activeDay === 'Lun' && 'Lunes 10 - Fuerza Base'}
                  {activeDay === 'Mar' && 'Martes 11 - Descanso'}
                  {activeDay === 'Mié' && 'Miércoles 12 - Velocidad y Agilidad'}
                  {activeDay === 'Jue' && 'Jueves 13 - Técnica Individual'}
                  {activeDay === 'Vie' && 'Viernes 14 - Táctica Colectiva'}
                  {activeDay === 'Sáb' && 'Sábado 15 - Recuperación'}
                  {activeDay === 'Dom' && 'Domingo 16 - Descanso Total'}
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '4px' }}>
                  {group.name} | Entrenador: {group.trainers?.[0] ? `${group.trainers[0].first_name} ${group.trainers[0].last_name}` : 'Asignado'} | 16:00 - 18:00
                </p>
              </div>
            </div>

            {['Mar', 'Sáb', 'Dom'].includes(activeDay) ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748B', fontWeight: '600' }}>
                😴 Día de Descanso. No hay sesión programada.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '12px 15px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748B', fontWeight: '700', borderBottom: '2px solid #E2E8F0' }}>Estado</th>
                    <th style={{ textAlign: 'left', padding: '12px 15px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748B', fontWeight: '700', borderBottom: '2px solid #E2E8F0' }}>Ejercicio</th>
                    <th style={{ textAlign: 'left', padding: '12px 15px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748B', fontWeight: '700', borderBottom: '2px solid #E2E8F0' }}>Bloque</th>
                    <th style={{ textAlign: 'left', padding: '12px 15px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748B', fontWeight: '700', borderBottom: '2px solid #E2E8F0' }}>Series</th>
                    <th style={{ textAlign: 'left', padding: '12px 15px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748B', fontWeight: '700', borderBottom: '2px solid #E2E8F0' }}>Carga</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: 0, name: 'Sprint 30m', icon: '🏃', block: 'Principal', blockClass: 'tag-orange', series: '5 x 1', load: '30m' },
                    { id: 1, name: 'Sentadilla Jump', icon: '🦵', block: 'Principal', blockClass: 'tag-orange', series: '4 x 8', load: 'P. Corp' },
                    { id: 2, name: 'Estiramientos', icon: '🧘', block: 'Calma', blockClass: 'tag-purple', series: '1 x 10m', load: 'Global' }
                  ].map((ex) => {
                    const isCompleted = completedExercises[ex.id];
                    return (
                      <tr key={ex.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '14px 15px' }}>
                          <div
                            onClick={() => setCompletedExercises(prev => ({ ...prev, [ex.id]: !prev[ex.id] }))}
                            style={{
                              width: '24px',
                              height: '24px',
                              border: '2px solid #CBD5E1',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: isCompleted ? '#10B981' : '#FFFFFF',
                              borderColor: isCompleted ? '#10B981' : '#CBD5E1',
                              color: isCompleted ? '#FFFFFF' : 'transparent',
                              fontSize: '0.8rem',
                              fontWeight: 'bold'
                            }}
                          >
                            ✔
                          </div>
                        </td>
                        <td style={{ padding: '14px 15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                          <span style={{ marginRight: '8px' }}>{ex.icon}</span> {ex.name}
                        </td>
                        <td style={{ padding: '14px 15px' }}>
                          <span className={`tag ${ex.blockClass}`} style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>{ex.block}</span>
                        </td>
                        <td style={{ padding: '14px 15px', color: '#0F172A' }}>{ex.series}</td>
                        <td style={{ padding: '14px 15px', color: '#64748B' }}>{ex.load}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* 2. ATLETAS TAB */}
      {activeTab === 'atletas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* GENERAL INFO CARD */}
          <div className="card" style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '15px', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
              Información de Entrenamiento
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
              {group.trainers && group.trainers.length > 0 && (
                <div>
                  <span style={{ color: '#64748B', fontSize: '0.85rem', fontWeight: 600 }}>🧢 Entrenador(es)</span>
                  <p style={{ fontWeight: 600, marginTop: '4px' }}>
                    {group.trainers.map(t => `${t.first_name} ${t.last_name}`).join(', ')}
                  </p>
                </div>
              )}
              {group.training_location && (
                <div>
                  <span style={{ color: '#64748B', fontSize: '0.85rem', fontWeight: 600 }}>📍 Sede / Cancha</span>
                  <p style={{ fontWeight: 600, marginTop: '4px' }}>{group.training_location}</p>
                </div>
              )}
              {(() => {
                const blks = getScheduleBlocks(group);
                const scheduleText = blks.length > 0
                  ? blks.map(b => `${b.days.join(', ')} - ${b.start} a ${b.end}`).join(' | ')
                  : group.schedule;
                return scheduleText ? (
                  <div>
                    <span style={{ color: '#64748B', fontSize: '0.85rem', fontWeight: 600 }}>📅 Horarios</span>
                    <p style={{ fontWeight: 600, marginTop: '4px' }}>{scheduleText}</p>
                  </div>
                ) : null;
              })()}
              {group.monthly_fee && (
                <div>
                  <span style={{ color: '#64748B', fontSize: '0.85rem', fontWeight: 600 }}>💰 Cuota Mensual</span>
                  <p style={{ fontWeight: 600, color: '#10B981', marginTop: '4px' }}>
                    ${parseFloat(group.monthly_fee).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
            <div style={{ marginTop: '20px', borderTop: '1px solid #F1F5F9', paddingTop: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748B', marginBottom: 6 }}>
                <strong>Cupos y Capacidad</strong>
                <span>{athletes.length} / {group.max_capacity || '∞'} Atletas</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  borderRadius: '10px',
                  width: `${getCapacityPercent(group)}%`,
                  background: getCapacityPercent(group) >= 90 ? '#EF4444' : getCapacityPercent(group) >= 60 ? '#F59E0B' : '#10B981'
                }} />
              </div>
            </div>
          </div>

          {/* ATHLETES LIST */}
          <div className="card" style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '15px' }}>
              Atletas Inscritos ({athletes.length})
            </h3>
            {loadingAthletes ? (
              <p style={{ color: '#64748B', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>
                Cargando atletas...
              </p>
            ) : athletes.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                {athletes.map((athlete) => (
                  <div
                    key={athlete.id}
                    onClick={() => navigate(`/admin/athletes/${athlete.id}`)}
                    className="list-card-v2"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px',
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      background: '#FFFFFF',
                      cursor: 'pointer',
                      transition: '0.2s'
                    }}
                  >
                    <div className="list-info-v2" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="list-avatar-v2" style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: '#E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        fontWeight: 700
                      }}>
                        {athlete.user?.first_name?.[0]}{athlete.user?.last_name?.[0]}
                      </div>
                      <div>
                        <div className="list-name-v2" style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                          {athlete.user?.first_name} {athlete.user?.last_name}
                        </div>
                        <div className="list-sub-v2" style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          ID: {athlete.user?.identification_number || '—'}
                        </div>
                      </div>
                    </div>
                    <span style={{ color: '#10B981', fontSize: '0.8rem', fontWeight: '600' }}>
                      🟢 Activo
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#64748B', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>
                No hay atletas inscritos en este grupo.
              </p>
            )}
          </div>
        </div>
      )}

      {/* 3. ASISTENCIA TAB */}
      {activeTab === 'asistencia' && (
        <div className="card" style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Registro de Asistencia diaria</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '3px' }}>Fecha de la sesión: Hoy (22 Jun 2026)</p>
            </div>
            <button type="button" className="btn btn-primary" onClick={() => showSuccess('Asistencia guardada correctamente')}>
              💾 Guardar Cambios
            </button>
          </div>

          {athletes.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {athletes.map((athlete) => (
                <div key={athlete.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  background: '#F8FAFC'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: '#E2E8F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      {athlete.user?.first_name?.[0]}{athlete.user?.last_name?.[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{athlete.user?.first_name} {athlete.user?.last_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>ID: {athlete.user?.identification_number}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      style={{
                        background: '#ECFDF5',
                        color: '#10B981',
                        border: '1px solid #10B981',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Presente
                    </button>
                    <button
                      type="button"
                      style={{
                        background: '#FFFFFF',
                        color: '#64748B',
                        border: '1px solid #CBD5E1',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Ausente
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#64748B', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>
              No hay atletas inscritos en este grupo.
            </p>
          )}
        </div>
      )}

      {/* 4. TESTS FISICOS TAB */}
      {activeTab === 'tests' && (
        <div className="card" style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '15px' }}>
            Historial de Tests Recientes
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '12px 15px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748B', fontWeight: '700', borderBottom: '2px solid #E2E8F0' }}>Test / Evaluación</th>
                  <th style={{ textAlign: 'left', padding: '12px 15px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748B', fontWeight: '700', borderBottom: '2px solid #E2E8F0' }}>Fecha</th>
                  <th style={{ textAlign: 'left', padding: '12px 15px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748B', fontWeight: '700', borderBottom: '2px solid #E2E8F0' }}>Promedio del Grupo</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '14px 15px', fontWeight: '600' }}>⚡ Control Velocidad 30m</td>
                  <td style={{ padding: '14px 15px', color: '#64748B' }}>15 Jun 2026</td>
                  <td style={{ padding: '14px 15px', color: '#10B981', fontWeight: '600' }}>4.82 seg</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '14px 15px', fontWeight: '600' }}>🦵 Test de Salto Vertical</td>
                  <td style={{ padding: '14px 15px', color: '#64748B' }}>12 Jun 2026</td>
                  <td style={{ padding: '14px 15px', color: '#2563EB', fontWeight: '600' }}>38.5 cm</td>
                </tr>
                <tr>
                  <td style={{ padding: '14px 15px', fontWeight: '600' }}>🫁 Resistencia Yo-Yo Level 1</td>
                  <td style={{ padding: '14px 15px', color: '#64748B' }}>05 Jun 2026</td>
                  <td style={{ padding: '14px 15px', color: '#F59E0B', fontWeight: '600' }}>14.2 (1620m)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. FINANZAS TAB */}
      {activeTab === 'finanzas' && (
        <div className="card" style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Estado de Mensualidades (Junio)</h3>
            <span style={{ fontSize: '0.85rem', background: '#ECFDF5', color: '#10B981', padding: '6px 12px', borderRadius: '8px', fontWeight: '700' }}>
              Recaudación: 85%
            </span>
          </div>

          {athletes.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {athletes.map((athlete, idx) => {
                const isPaid = idx % 4 !== 0;
                return (
                  <div key={athlete.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    background: '#F8FAFC'
                  }}>
                    <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{athlete.user?.first_name} {athlete.user?.last_name}</span>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: isPaid ? '#ECFDF5' : '#FEE2E2',
                      color: isPaid ? '#047857' : '#B91C1C'
                    }}>
                      {isPaid ? 'Al día' : 'Pendiente'}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: '#64748B', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>
              No hay atletas inscritos en este grupo.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default GroupProfile;

