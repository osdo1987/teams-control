import React, { useEffect, useState } from 'react';
import { groupService } from '../../services/groupService';
import { authService } from '../../services/authService';
import Modal from '../../components/UI/Modal';
import ConfirmModal from '../../components/UI/ConfirmModal';

const COLORS = ['#3b82f6','#8b5cf6','#10b981','#f97316','#ec4899','#0ea5e9','#f59e0b'];
const groupColor = (name = '') => COLORS[name.charCodeAt(0) % COLORS.length];

const STATUS_BADGE = {
  ACTIVE: 'badge badge-success',
  INACTIVE: 'badge badge-inactive',
  FULL: 'badge badge-warning',
};

const INITIAL_FORM = {
  name: '', club_id: 1, category: '', sport: '', description: '',
  max_capacity: '', schedule: '', schedule_days: '', schedule_start_time: '',
  schedule_end_time: '', training_location: '', level: '', season: '',
  monthly_fee: '', trainer_ids: []
};

const GroupList = () => {
  const [groups, setGroups] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [formData, setFormData] = useState({ ...INITIAL_FORM });
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    fetchGroups();
    fetchTrainers();
  }, []);

  const fetchGroups = async () => {
    try {
      const data = await groupService.getGroups();
      setGroups(data);
    } catch { setError('Error al cargar grupos'); }
    finally { setLoading(false); }
  };

  const fetchTrainers = async () => {
    try {
      const data = await authService.getTrainers();
      setTrainers(data || []);
    } catch { /* silently fail */ }
  };

  const handleInputChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleTrainerSelect = (trainerId) => {
    const id = parseInt(trainerId);
    setFormData(prev => {
      const current = prev.trainer_ids || [];
      if (current.includes(id)) {
        return { ...prev, trainer_ids: current.filter(t => t !== id) };
      }
      return { ...prev, trainer_ids: [...current, id] };
    });
  };

  const openCreateModal = () => {
    setEditingGroup(null);
    setFormData({ ...INITIAL_FORM });
    setActiveTab('general');
    setIsModalOpen(true);
  };

  const openEditModal = (group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      club_id: group.club_id,
      category: group.category || '',
      sport: group.sport || '',
      description: group.description || '',
      max_capacity: group.max_capacity || '',
      schedule: group.schedule || '',
      schedule_days: group.schedule_days || '',
      schedule_start_time: group.schedule_start_time || '',
      schedule_end_time: group.schedule_end_time || '',
      training_location: group.training_location || '',
      level: group.level || '',
      season: group.season || '',
      monthly_fee: group.monthly_fee || '',
      trainer_ids: (group.trainers || []).map(t => t.id)
    });
    setActiveTab('general');
    setIsModalOpen(true);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!formData.trainer_ids || formData.trainer_ids.length === 0) {
      setError('Debe asignar al menos un entrenador al grupo');
      return;
    }
    try {
      const payload = {
        ...formData,
        club_id: parseInt(formData.club_id),
        max_capacity: formData.max_capacity ? parseInt(formData.max_capacity) : null,
        monthly_fee: formData.monthly_fee ? parseFloat(formData.monthly_fee) : null
      };
      if (editingGroup) {
        await groupService.updateGroup(editingGroup.id, payload);
      } else {
        await groupService.createGroup(payload);
      }
      setIsModalOpen(false);
      setError('');
      fetchGroups();
    } catch (err) { setError(err.message || 'Error al guardar grupo'); }
  };

  const confirmDelete = async () => {
    if (!groupToDelete) return;
    try {
      await groupService.deleteGroup(groupToDelete.id);
      fetchGroups();
    } catch (err) {
      setError('Error al eliminar grupo');
    } finally {
      setIsConfirmOpen(false);
      setGroupToDelete(null);
    }
  };

  const tabStyle = (tab) => ({
    padding: '8px 16px',
    border: 'none',
    background: activeTab === tab ? 'var(--primary-color)' : 'transparent',
    color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: '0.82rem',
    fontWeight: 600,
    transition: 'all 0.2s'
  });

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando grupos...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Grupos</h1>
          <p className="text-muted">Gestiona los grupos de entrenamiento, categorías y horarios.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>+ Nuevo Grupo</button>
      </div>

      {error && <div className="badge badge-danger" style={{ marginBottom: '16px', padding: '10px 16px', borderRadius: '10px', display: 'block' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {groups.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>No se encontraron grupos.</p>
        ) : groups.map(group => (
          <div key={group.id} className="card" style={{ padding: '22px', cursor: 'default' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: groupColor(group.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', marginBottom: 14 }}>
                ⚽
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span className={STATUS_BADGE[group.status] || 'badge badge-success'}>{group.status || 'ACTIVE'}</span>
                <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#b91c1c', border: 'none' }} onClick={() => { setGroupToDelete(group); setIsConfirmOpen(true); }}>
                  ✕
                </button>
              </div>
            </div>

            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 4 }}>{group.name}</h3>
            
            {/* Category & Sport */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
              {group.category && <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>{group.category}</span>}
              {group.sport && <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>{group.sport}</span>}
              {group.level && <span className="badge badge-inactive" style={{ fontSize: '0.7rem' }}>{group.level}</span>}
            </div>

            {/* Schedule */}
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
              🕐 {group.schedule || 'Sin horario definido'}
            </div>
            {group.training_location && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 10 }}>
                📍 {group.training_location}
              </div>
            )}

            {/* Trainers */}
            {group.trainers && group.trainers.length > 0 && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 10 }}>
                🏅 {group.trainers.map(t => `${t.first_name} ${t.last_name}`).join(', ')}
              </div>
            )}

            {/* Monthly fee */}
            {group.monthly_fee && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 10 }}>
                💰 ${Number(group.monthly_fee).toLocaleString()} /mes
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid var(--border-color)' }}>
              <span className="badge badge-primary">
                {group.athletes_count ?? group.athletes?.length ?? 0}{group.max_capacity ? ` / ${group.max_capacity}` : ''} Atletas
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(group)}>Editar</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={confirmDelete}
        title="Eliminar Grupo"
        message={`¿Está seguro de que desea eliminar ${groupToDelete?.name}? Esto desvinculará a todos los miembros.`}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingGroup ? "Editar Grupo" : "Crear Nuevo Grupo"}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, background: 'var(--bg-main)', padding: 4, borderRadius: 10 }}>
          <button type="button" style={tabStyle('general')} onClick={() => setActiveTab('general')}>📋 General</button>
          <button type="button" style={tabStyle('schedule')} onClick={() => setActiveTab('schedule')}>🕐 Horario</button>
          <button type="button" style={tabStyle('trainer')} onClick={() => setActiveTab('trainer')}>🏅 Entrenador</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          {/* Tab: General */}
          {activeTab === 'general' && (
            <>
              <div className="form-group">
                <label className="form-label">Nombre del Grupo</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="form-input" required placeholder="Ej: Fútbol Sub-15 A" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Categoría</label>
                  <select name="category" value={formData.category} onChange={handleInputChange} className="form-input">
                    <option value="">Seleccionar</option>
                    <option value="Sub-6">Sub-6</option>
                    <option value="Sub-8">Sub-8</option>
                    <option value="Sub-10">Sub-10</option>
                    <option value="Sub-12">Sub-12</option>
                    <option value="Sub-14">Sub-14</option>
                    <option value="Sub-15">Sub-15</option>
                    <option value="Sub-17">Sub-17</option>
                    <option value="Sub-18">Sub-18</option>
                    <option value="Sub-20">Sub-20</option>
                    <option value="Adultos">Adultos</option>
                    <option value="Veteranos">Veteranos</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Deporte</label>
                  <select name="sport" value={formData.sport} onChange={handleInputChange} className="form-input">
                    <option value="">Seleccionar</option>
                    <option value="Fútbol">Fútbol</option>
                    <option value="Baloncesto">Baloncesto</option>
                    <option value="Voleibol">Voleibol</option>
                    <option value="Natación">Natación</option>
                    <option value="Atletismo">Atletismo</option>
                    <option value="Tenis">Tenis</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Nivel</label>
                  <select name="level" value={formData.level} onChange={handleInputChange} className="form-input">
                    <option value="">Seleccionar</option>
                    <option value="Principiante">Principiante</option>
                    <option value="Intermedio">Intermedio</option>
                    <option value="Avanzado">Avanzado</option>
                    <option value="Competitivo">Competitivo</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Capacidad Máxima</label>
                  <input type="number" name="max_capacity" value={formData.max_capacity} onChange={handleInputChange} className="form-input" placeholder="25" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Temporada</label>
                  <input type="text" name="season" value={formData.season} onChange={handleInputChange} className="form-input" placeholder="2026 - Primer Semestre" />
                </div>
                <div className="form-group">
                  <label className="form-label">Cuota Mensual ($)</label>
                  <input type="number" name="monthly_fee" value={formData.monthly_fee} onChange={handleInputChange} className="form-input" placeholder="120000" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} className="form-input" rows={3} placeholder="Descripción del grupo..." style={{ resize: 'vertical', minHeight: 60 }} />
              </div>
              <div className="form-group" style={{ display: 'none' }}>
                <label className="form-label">Club ID</label>
                <input type="number" name="club_id" value={formData.club_id} onChange={handleInputChange} className="form-input" required />
              </div>
            </>
          )}

          {/* Tab: Schedule */}
          {activeTab === 'schedule' && (
            <>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>🕐 Horario de Entrenamiento</h4>
              <div className="form-group">
                <label className="form-label">Horario Resumido</label>
                <input type="text" name="schedule" value={formData.schedule} onChange={handleInputChange} className="form-input" placeholder="Lun-Mie-Vie 5PM a 7PM" />
              </div>
              <div className="form-group">
                <label className="form-label">Días de Entrenamiento</label>
                <input type="text" name="schedule_days" value={formData.schedule_days} onChange={handleInputChange} className="form-input" placeholder="Lunes,Miércoles,Viernes" />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 3, display: 'block' }}>Separar con comas</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Hora Inicio</label>
                  <input type="time" name="schedule_start_time" value={formData.schedule_start_time} onChange={handleInputChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Hora Fin</label>
                  <input type="time" name="schedule_end_time" value={formData.schedule_end_time} onChange={handleInputChange} className="form-input" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Lugar de Entrenamiento</label>
                <input type="text" name="training_location" value={formData.training_location} onChange={handleInputChange} className="form-input" placeholder="Cancha Principal, Gimnasio..." />
              </div>
            </>
          )}

          {/* Tab: Trainer Assignment */}
          {activeTab === 'trainer' && (
            <>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>🏅 Asignar Entrenador(es)</h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                Seleccione al menos un entrenador para este grupo. <span style={{ color: '#ef4444', fontWeight: 600 }}>*Obligatorio</span>
              </p>
              
              {trainers.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-main)', borderRadius: 10 }}>
                  No hay entrenadores registrados. Cree uno primero.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                  {trainers.map(trainer => {
                    const isSelected = (formData.trainer_ids || []).includes(trainer.id);
                    return (
                      <div
                        key={trainer.id}
                        onClick={() => handleTrainerSelect(trainer.id)}
                        style={{
                          padding: '12px 16px',
                          borderRadius: 10,
                          border: isSelected ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                          background: isSelected ? 'rgba(37,99,235,0.06)' : 'var(--card-bg)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{
                          width: 20, height: 20, borderRadius: 6,
                          border: isSelected ? 'none' : '2px solid var(--border-color)',
                          background: isSelected ? 'var(--primary-color)' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0
                        }}>
                          {isSelected && '✓'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{trainer.first_name} {trainer.last_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: {trainer.identification_number}</div>
                        </div>
                        {trainer.phone && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>📱 {trainer.phone}</span>}
                      </div>
                    );
                  })}
                </div>
              )}

              {(formData.trainer_ids || []).length === 0 && (
                <div style={{ marginTop: 12, padding: '8px 12px', background: '#fef3c7', color: '#92400e', borderRadius: 8, fontSize: '0.78rem', fontWeight: 500 }}>
                  ⚠️ Debe seleccionar al menos un entrenador
                </div>
              )}
            </>
          )}

          <div className="modal-footer" style={{ margin: '8px -24px -24px', padding: '16px 24px' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">{editingGroup ? "Guardar Cambios" : "Crear Grupo"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default GroupList;
