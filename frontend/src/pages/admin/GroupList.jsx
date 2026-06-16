import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupService } from '../../services/groupService';
import { authService } from '../../services/authService';
import { categoryService } from '../../services/categoryService';
import { athleteService } from '../../services/athleteService';
import { userService } from '../../services/userService';
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
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [athletes, setAthletes] = useState([]);
  const [selectedAthleteIds, setSelectedAthleteIds] = useState([]);
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

  // Inline category/trainer states
  const [isAddingCategoryInline, setIsAddingCategoryInline] = useState(false);
  const [inlineCategoryName, setInlineCategoryName] = useState('');
  const [isAddingTrainerInline, setIsAddingTrainerInline] = useState(false);
  const [inlineTrainerForm, setInlineTrainerForm] = useState({
    first_name: '', last_name: '', identification_number: '', phone: '', password: 'Entrenador123*'
  });

  const user = authService.getCurrentUser();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [groupsData, trainersData, categoriesData, athletesData] = await Promise.all([
        groupService.getGroups(),
        authService.getTrainers(),
        categoryService.getCategories(),
        athleteService.getAthletes()
      ]);
      setGroups(groupsData);
      setTrainers(trainersData || []);
      setCategories(categoriesData || []);
      setAthletes(athletesData || []);
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

  const handleAthleteSelect = (athleteId) => {
    const id = parseInt(athleteId);
    setSelectedAthleteIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(aId => aId !== id);
      }
      return [...prev, id];
    });
  };

  const openCreateModal = () => {
    setEditingGroup(null);
    setFormData({ ...INITIAL_FORM, club_id: user.club_id });
    setSelectedAthleteIds([]);
    setIsAddingCategoryInline(false);
    setIsAddingTrainerInline(false);
    setInlineCategoryName('');
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
    
    // Find athletes currently in this group
    const currentAthleteIds = athletes
      .filter(a => a.current_groups?.some(g => g.id === group.id))
      .map(a => a.id);
    setSelectedAthleteIds(currentAthleteIds);

    setIsAddingCategoryInline(false);
    setIsAddingTrainerInline(false);
    setInlineCategoryName('');
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

      let savedGroup;
      if (editingGroup) {
        savedGroup = await groupService.updateGroup(editingGroup.id, payload);
      } else {
        savedGroup = await groupService.createGroup(payload);
      }
      
      const groupId = editingGroup ? editingGroup.id : savedGroup.id;

      // Bulk assign / remove athletes
      const initialAthleteIds = editingGroup 
        ? athletes.filter(a => a.current_groups?.some(g => g.id === editingGroup.id)).map(a => a.id)
        : [];

      const toAdd = selectedAthleteIds.filter(id => !initialAthleteIds.includes(id));
      const toRemove = initialAthleteIds.filter(id => !selectedAthleteIds.includes(id));

      await Promise.all([
        ...toAdd.map(athId => groupService.assignAthlete(groupId, athId)),
        ...toRemove.map(athId => {
          const athObj = athletes.find(a => a.id === athId);
          return athleteService.updateAthlete(athId, {
            athlete: { birth_date: athObj.birth_date, phone: athObj.phone, address: athObj.address },
            group_id: null
          });
        })
      ]);

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

  const handleCreateCategoryInline = async (e) => {
    e.preventDefault();
    if (!inlineCategoryName) return;
    try {
      const newCat = await categoryService.createCategory({ name: inlineCategoryName, club_id: user.club_id });
      setInlineCategoryName('');
      setIsAddingCategoryInline(false);
      const categoriesData = await categoryService.getCategories();
      setCategories(categoriesData || []);
      if (newCat && newCat.id) {
        setFormData(prev => ({ ...prev, category_id: newCat.id.toString() }));
      }
    } catch (err) {
      setError('Error al crear categoría inline');
    }
  };

  const handleCreateTrainerInline = async (e) => {
    e.preventDefault();
    if (!inlineTrainerForm.first_name || !inlineTrainerForm.last_name || !inlineTrainerForm.identification_number) {
      setError('Complete los campos obligatorios del entrenador');
      return;
    }
    try {
      const payload = {
        ...inlineTrainerForm,
        role: 'TRAINER',
        club_id: user.club_id
      };
      const newTrainer = await userService.createUser(payload);
      setIsAddingTrainerInline(false);
      setInlineTrainerForm({
        first_name: '', last_name: '', identification_number: '', phone: '', password: 'Entrenador123*'
      });
      const trainersData = await authService.getTrainers();
      setTrainers(trainersData || []);
      if (newTrainer && newTrainer.id) {
        setFormData(prev => {
          const current = prev.trainer_ids || [];
          return { ...prev, trainer_ids: [...current, newTrainer.id] };
        });
      }
    } catch (err) {
      setError(err.message || 'Error al crear entrenador inline');
    }
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

      {groups.length === 0 ? (
        <div style={{
          background: 'white',
          border: '1px dashed var(--border-color)',
          borderRadius: '16px',
          padding: '40px',
          textAlign: 'center',
          maxWidth: '600px',
          margin: '40px auto',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '8px' }}>¡Te damos la bienvenida a la gestión de Grupos! 🚀</h2>
          <p className="text-muted" style={{ marginBottom: '24px', fontSize: '0.9rem' }}>Para comenzar a operar, te recomendamos seguir estos sencillos pasos:</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: categories.length > 0 ? '#10b981' : '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem', flexShrink: 0 }}>
                {categories.length > 0 ? '✓' : '1'}
              </div>
              <div>
                <strong>Definir Categorías</strong>
                <p className="text-muted" style={{ margin: '2px 0 0 0', fontSize: '0.8rem' }}>Categorías por edad o nivel (ej: Sub-15, Principiantes). {categories.length > 0 ? <span style={{ color: '#10b981' }}>(Listo: {categories.length} creadas)</span> : <button className="btn btn-link btn-sm" style={{ padding: 0, height: 'auto', fontSize: '0.8rem', border: 'none', background: 'transparent', color: 'var(--primary-color)', cursor: 'pointer' }} onClick={() => setIsCategoryModalOpen(true)}>Crear ahora</button>}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: trainers.length > 0 ? '#10b981' : '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem', flexShrink: 0 }}>
                {trainers.length > 0 ? '✓' : '2'}
              </div>
              <div>
                <strong>Registrar Entrenadores</strong>
                <p className="text-muted" style={{ margin: '2px 0 0 0', fontSize: '0.8rem' }}>Los encargados de dirigir cada grupo. {trainers.length > 0 ? <span style={{ color: '#10b981' }}>(Listo: {trainers.length} registrados)</span> : <button className="btn btn-link btn-sm" style={{ padding: 0, height: 'auto', fontSize: '0.8rem', border: 'none', background: 'transparent', color: 'var(--primary-color)', cursor: 'pointer' }} onClick={() => navigate('/admin/trainers')}>Ir a Entrenadores</button>}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem', flexShrink: 0 }}>
                3
              </div>
              <div>
                <strong>Crear tu primer Grupo</strong>
                <p className="text-muted" style={{ margin: '2px 0 0 0', fontSize: '0.8rem' }}>Asocia un entrenador, una categoría y horarios. <button className="btn btn-link btn-sm" style={{ padding: 0, height: 'auto', fontSize: '0.8rem', border: 'none', background: 'transparent', color: 'var(--primary-color)', cursor: 'pointer' }} onClick={openCreateModal} disabled={trainers.length === 0 || categories.length === 0}>Crear grupo</button></p>
              </div>
            </div>
          </div>
          
          <button className="btn btn-primary" onClick={openCreateModal} disabled={trainers.length === 0 || categories.length === 0}>
            + Crear Grupo
          </button>
          {(trainers.length === 0 || categories.length === 0) && (
            <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '12px' }}>* Debes completar el paso 1 y 2 antes de poder crear un grupo.</p>
          )}
        </div>
      ) : (
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
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--primary-color)' }}
                    onClick={() => navigate(`/admin/athletes?openCreate=true&group_id=${group.id}`)}
                  >
                    + Atleta
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(group)}>Editar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
          <button type="button" style={tabStyle('athletes')} onClick={() => setActiveTab('athletes')}>🏃 Atletas</button>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label className="form-label" style={{ margin: 0 }}>Categoría</label>
                    <button
                      type="button"
                      className="btn btn-link"
                      style={{ padding: 0, fontSize: '0.75rem', border: 'none', background: 'transparent', color: 'var(--primary-color)', cursor: 'pointer', height: 'auto' }}
                      onClick={() => setIsAddingCategoryInline(!isAddingCategoryInline)}
                    >
                      {isAddingCategoryInline ? 'Cancelar' : '+ Nueva'}
                    </button>
                  </div>
                  {isAddingCategoryInline ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Nombre cat."
                        value={inlineCategoryName}
                        onChange={e => setInlineCategoryName(e.target.value)}
                        style={{ flex: 1, padding: '4px 8px', fontSize: '0.85rem' }}
                      />
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleCreateCategoryInline}
                        style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                      >
                        OK
                      </button>
                    </div>
                  ) : (
                    <select name="category_id" value={formData.category_id} onChange={handleInputChange} className="form-input" required>
                      <option value="">Seleccionar</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  )}
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
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>Asigna entrenadores al grupo:</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ height: 'auto', padding: '4px 8px', fontSize: '0.75rem' }}
                  onClick={() => setIsAddingTrainerInline(!isAddingTrainerInline)}
                >
                  {isAddingTrainerInline ? 'Cancelar' : '+ Registrar Entrenador'}
                </button>
              </div>

              {isAddingTrainerInline && (
                <div style={{ padding: '14px', border: '1px solid var(--border-color)', borderRadius: '10px', background: 'var(--bg-main)', marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.85rem' }}>Nuevo Entrenador</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Nombre *"
                      value={inlineTrainerForm.first_name}
                      onChange={e => setInlineTrainerForm(prev => ({ ...prev, first_name: e.target.value }))}
                      style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Apellido *"
                      value={inlineTrainerForm.last_name}
                      onChange={e => setInlineTrainerForm(prev => ({ ...prev, last_name: e.target.value }))}
                      style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                    />
                  </div>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="N° Identificación *"
                    value={inlineTrainerForm.identification_number}
                    onChange={e => setInlineTrainerForm(prev => ({ ...prev, identification_number: e.target.value }))}
                    style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Teléfono"
                    value={inlineTrainerForm.phone}
                    onChange={e => setInlineTrainerForm(prev => ({ ...prev, phone: e.target.value }))}
                    style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleCreateTrainerInline}
                    style={{ alignSelf: 'flex-end', marginTop: '4px' }}
                  >
                    Crear y Seleccionar
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
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
            </div>
          )}

          {activeTab === 'athletes' && (
            <div>
              <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: 12 }}>
                Asigna atletas sin grupo en lote a este grupo:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                {athletes.filter(a => {
                  const isInThisGroup = a.current_groups?.some(g => g.id === editingGroup?.id);
                  const isUnassigned = !a.current_groups || a.current_groups.length === 0;
                  return isInThisGroup || isUnassigned;
                }).map(athlete => {
                  const isSelected = selectedAthleteIds.includes(athlete.id);
                  return (
                    <div key={athlete.id} onClick={() => handleAthleteSelect(athlete.id)}
                      style={{
                        padding: '10px',
                        borderRadius: 8,
                        border: isSelected ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(37,99,235,0.05)' : 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                      <div>
                        <strong>{athlete.user?.first_name} {athlete.user?.last_name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: {athlete.user?.identification_number}</div>
                      </div>
                      <span className={`badge ${isSelected ? 'badge-success' : 'badge-inactive'}`}>
                        {isSelected ? '✓ Seleccionado' : 'Sin asignar'}
                      </span>
                    </div>
                  );
                })}
                {athletes.filter(a => {
                  const isInThisGroup = a.current_groups?.some(g => g.id === editingGroup?.id);
                  const isUnassigned = !a.current_groups || a.current_groups.length === 0;
                  return isInThisGroup || isUnassigned;
                }).length === 0 && (
                  <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px', fontSize: '0.85rem' }}>
                    No hay atletas sin grupo disponibles en el club.
                  </p>
                )}
              </div>
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
