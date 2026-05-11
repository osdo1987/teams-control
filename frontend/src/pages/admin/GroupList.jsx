import React, { useEffect, useState } from 'react';
import { groupService } from '../../services/groupService';
import { authService } from '../../services/authService';
import { categoryService } from '../../services/categoryService';
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
  name: '', club_id: 1, category_id: '', description: '',
  max_capacity: '', schedule: '', schedule_days: '', schedule_start_time: '',
  schedule_end_time: '', training_location: '', level: '', season: '',
  monthly_fee: '', trainer_ids: []
};

const GroupList = () => {
  const [groups, setGroups] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [formData, setFormData] = useState({ ...INITIAL_FORM });
  const [activeTab, setActiveTab] = useState('general');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const user = authService.getCurrentUser();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [groupsData, trainersData, categoriesData] = await Promise.all([
        groupService.getGroups(),
        authService.getTrainers(),
        categoryService.getCategories()
      ]);
      setGroups(groupsData);
      setTrainers(trainersData || []);
      setCategories(categoriesData || []);
    } catch { setError('Error al cargar datos'); }
    finally { setLoading(false); }
  };

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (g.category_obj?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    setFormData({ ...INITIAL_FORM, club_id: user.club_id });
    setActiveTab('general');
    setIsModalOpen(true);
  };

  const openEditModal = (group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      club_id: group.club_id,
      category_id: group.category_id || '',
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
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
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
      fetchData();
    } catch (err) { setError(err.message || 'Error al guardar grupo'); }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName) return;
    try {
      await categoryService.createCategory({ name: newCategoryName, club_id: user.club_id });
      setNewCategoryName('');
      fetchData();
    } catch (err) { setError('Error al crear categoría'); }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await categoryService.deleteCategory(id);
      fetchData();
    } catch (err) { setError('Error al eliminar categoría'); }
  };

  const confirmDelete = async () => {
    if (!groupToDelete) return;
    try {
      await groupService.deleteGroup(groupToDelete.id);
      fetchData();
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
          <h1>Grupos de {user.club_name}</h1>
          <p className="text-muted">Gestiona los grupos de {user.sport || 'Fútbol'} y categorías.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => setIsCategoryModalOpen(true)}>⚙️ Categorías</button>
          <button className="btn btn-primary" onClick={openCreateModal}>+ Nuevo Grupo</button>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="🔍 Buscar grupo por nombre o categoría..."
          className="form-input"
          style={{ borderRadius: '12px' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {error && <div className="badge badge-danger" style={{ marginBottom: '16px', padding: '10px 16px', borderRadius: '10px', display: 'block' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {filteredGroups.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>No se encontraron grupos.</p>
        ) : filteredGroups.map(group => (
          <div key={group.id} className="card" style={{ padding: '22px', cursor: 'default' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: groupColor(group.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', marginBottom: 14 }}>
                {user.sport?.includes('Baloncesto') ? '🏀' : '⚽'}
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span className={STATUS_BADGE[group.status] || 'badge badge-success'}>{group.status || 'ACTIVE'}</span>
                <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#b91c1c', border: 'none' }} onClick={() => { setGroupToDelete(group); setIsConfirmOpen(true); }}>
                  ✕
                </button>
              </div>
            </div>

            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 4 }}>{group.name}</h3>
            
            <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
              {group.category_obj?.name && <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>{group.category_obj.name}</span>}
              <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>{user.sport}</span>
              {group.level && <span className="badge badge-inactive" style={{ fontSize: '0.7rem' }}>{group.level}</span>}
            </div>

            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
              🕐 {group.schedule || 'Sin horario definido'}
            </div>
            {group.training_location && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 10 }}>
                📍 {group.training_location}
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
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, background: 'var(--bg-main)', padding: 4, borderRadius: 10 }}>
          <button type="button" style={tabStyle('general')} onClick={() => setActiveTab('general')}>📋 General</button>
          <button type="button" style={tabStyle('schedule')} onClick={() => setActiveTab('schedule')}>🕐 Horario</button>
          <button type="button" style={tabStyle('trainer')} onClick={() => setActiveTab('trainer')}>🏅 Entrenador</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          {activeTab === 'general' && (
            <>
              <div className="form-group">
                <label className="form-label">Nombre del Grupo</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="form-input" required placeholder="Ej: Fútbol Sub-15 A" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Categoría</label>
                  <select name="category_id" value={formData.category_id} onChange={handleInputChange} className="form-input" required>
                    <option value="">Seleccionar</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
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
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Capacidad Máxima</label>
                  <input type="number" name="max_capacity" value={formData.max_capacity} onChange={handleInputChange} className="form-input" placeholder="25" />
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
            </>
          )}

          {activeTab === 'schedule' && (
            <>
              <div className="form-group">
                <label className="form-label">Horario Resumido</label>
                <input type="text" name="schedule" value={formData.schedule} onChange={handleInputChange} className="form-input" placeholder="Lun-Mie-Vie 5PM a 7PM" />
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

          {activeTab === 'trainer' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
              {trainers.map(trainer => {
                const isSelected = (formData.trainer_ids || []).includes(trainer.id);
                return (
                  <div key={trainer.id} onClick={() => handleTrainerSelect(trainer.id)}
                    style={{ padding: '10px', borderRadius: 8, border: isSelected ? '2px solid var(--primary-color)' : '1px solid var(--border-color)', cursor: 'pointer', background: isSelected ? 'rgba(37,99,235,0.05)' : 'white' }}>
                    <strong>{trainer.first_name} {trainer.last_name}</strong>
                  </div>
                );
              })}
            </div>
          )}

          <div className="modal-footer" style={{ margin: '8px -24px -24px', padding: '16px 24px' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">{editingGroup ? "Guardar" : "Crear"}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} title="Gestionar Categorías">
        <form onSubmit={handleCreateCategory} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <input type="text" className="form-input" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Nueva categoría (ej: Sub-15 A)" required />
          <button type="submit" className="btn btn-primary">Añadir</button>
        </form>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {categories.map(cat => (
            <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--bg-main)', borderRadius: 10 }}>
              <span>{cat.name}</span>
              <button className="btn btn-sm" style={{ color: '#ef4444', border: 'none', background: 'transparent' }} onClick={() => handleDeleteCategory(cat.id)}>Eliminar</button>
            </div>
          ))}
          {categories.length === 0 && <p className="text-muted">No has creado categorías todavía.</p>}
        </div>
      </Modal>
    </div>
  );
};

export default GroupList;
