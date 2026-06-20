import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupService } from '../../services/groupService';
import { authService } from '../../services/authService';
import { categoryService } from '../../services/categoryService';
import { athleteService } from '../../services/athleteService';
import { userService } from '../../services/userService';
import Modal from '../../components/UI/Modal';
import ConfirmModal from '../../components/UI/ConfirmModal';
import { useToast } from '../../contexts/ToastContext';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f97316', '#ec4899', '#0ea5e9', '#f59e0b'];
const groupColor = (name = '') => COLORS[name.charCodeAt(0) % COLORS.length];

const LEVELS = [
  'Recreativo',
  'Principiante',
  'Básico',
  'Intermedio',
  'Avanzado',
  'Competitivo',
  'Élite',
  'Semiprofesional',
  'Profesional',
  'Pre-competitivo'
];

const WEEK_DAYS = [
  'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'
];

const STATUS_BADGE = {
  ACTIVE: 'badge badge-success',
  INACTIVE: 'badge badge-inactive',
  FULL: 'badge badge-warning',
};

const INITIAL_FORM = {
  name: '', club_id: 1, category_id: '', description: '',
  max_capacity: '', schedule: '', schedule_days: '', schedule_start_time: '',
  schedule_end_time: '', schedule_blocks: '', training_location: '', level: '', season: '',
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
  const { showError, showSuccess } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [formData, setFormData] = useState({ ...INITIAL_FORM });
  const [activeTab, setActiveTab] = useState('general');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrainerForChange, setSelectedTrainerForChange] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const getPageNumbers = () => {
    const pages = [];
    const totalPages = Math.ceil(filteredGroups.length / ITEMS_PER_PAGE);
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      if (currentPage <= 3) { start = 2; end = 4; }
      if (currentPage >= totalPages - 2) { start = totalPages - 3; end = totalPages - 1; }
      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  // Inline category/trainer states
  const [isAddingCategoryInline, setIsAddingCategoryInline] = useState(false);
  const [inlineCategoryName, setInlineCategoryName] = useState('');
  const [isAddingTrainerInline, setIsAddingTrainerInline] = useState(false);
  const [inlineTrainerForm, setInlineTrainerForm] = useState({
    first_name: '', last_name: '', identification_number: '', phone: '', password: 'Entrenador123*'
  });

  // Multi-block schedule
  const [scheduleBlocks, setScheduleBlocks] = useState([]);

  const user = authService.getCurrentUser();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchData = async () => {
    setLoading(true);
    // clearMessages(); // No longer needed with toast
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
    } catch (err) { showError(err.message || 'Error al cargar datos'); }
    finally { setLoading(false); }
  };

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (g.category_obj?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredGroups.length / ITEMS_PER_PAGE);
  const paginatedGroups = filteredGroups.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
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

  // Multi-block schedule helpers
  const addScheduleBlock = () => {
    setScheduleBlocks([...scheduleBlocks, { days: [], start: '', end: '' }]);
  };

  const removeScheduleBlock = (index) => {
    setScheduleBlocks(scheduleBlocks.filter((_, i) => i !== index));
  };

  const toggleBlockDay = (blockIndex, day) => {
    setScheduleBlocks(scheduleBlocks.map((block, i) => {
      if (i !== blockIndex) return block;
      const days = block.days.includes(day)
        ? block.days.filter(d => d !== day)
        : [...block.days, day];
      return { ...block, days };
    }));
  };

  const updateBlockField = (blockIndex, field, value) => {
    setScheduleBlocks(scheduleBlocks.map((block, i) =>
      i === blockIndex ? { ...block, [field]: value } : block
    ));
  };

  const getScheduleSummary = (blocks) => {
    if (!blocks || blocks.length === 0) return '';
    return blocks.map(b => `${b.days.join('-')} ${b.start} a ${b.end}`).join(' | ');
  };

  const openCreateModal = () => {
    setEditingGroup(null);
    setFormData({ ...INITIAL_FORM, club_id: user.club_id });
    setSelectedAthleteIds([]);
    setScheduleBlocks([]);
    setSelectedTrainerForChange(null);
    setIsAddingCategoryInline(false);
    setIsAddingTrainerInline(false);
    setInlineCategoryName('');
    setActiveTab('general');
    setIsModalOpen(true);
  };

  const openEditModal = (group) => {
    setEditingGroup(group);

    // Parse existing schedule_blocks from JSON or create from legacy fields
    let parsedBlocks = [];
    try {
      parsedBlocks = group.schedule_blocks ? JSON.parse(group.schedule_blocks) : [];
    } catch {
      parsedBlocks = [];
    }
    // If no blocks but legacy schedule fields exist, create one block
    if (parsedBlocks.length === 0 && group.schedule_days && group.schedule_start_time && group.schedule_end_time) {
      const days = (group.schedule_days || '').split(',').filter(Boolean);
      parsedBlocks = [{ days, start: group.schedule_start_time || '', end: group.schedule_end_time || '' }];
    }

    setScheduleBlocks(parsedBlocks);

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
      schedule_blocks: group.schedule_blocks || '',
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
    setSelectedTrainerForChange(null);
    setActiveTab('general');
    setIsModalOpen(true);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!formData.trainer_ids || formData.trainer_ids.length === 0) {
      showError('Debe asignar al menos un entrenador al grupo');
      return;
    }
    try {
      // Build schedule_blocks JSON
      const validBlocks = scheduleBlocks.filter(b => b.days.length > 0 && b.start && b.end);
      const scheduleBlocksJson = validBlocks.length > 0 ? JSON.stringify(validBlocks) : null;

      const payload = {
        ...formData,
        schedule_blocks: scheduleBlocksJson,
        schedule: validBlocks.length > 0 ? getScheduleSummary(validBlocks) : formData.schedule,
        schedule_days: validBlocks.length > 0 ? validBlocks.flatMap(b => b.days).join(',') : formData.schedule_days,
        schedule_start_time: validBlocks.length > 0 ? validBlocks[0].start : formData.schedule_start_time,
        schedule_end_time: validBlocks.length > 0 ? validBlocks[0].end : formData.schedule_end_time,
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

      // Bulk assign athletes (only add, never remove from this menu)
      if (editingGroup) {
        const initialAthleteIds = athletes
          .filter(a => a.current_groups?.some(g => g.id === editingGroup.id))
          .map(a => a.id);

        const toAdd = selectedAthleteIds.filter(id => !initialAthleteIds.includes(id));

        if (toAdd.length > 0) {
          await Promise.all(toAdd.map(athId => groupService.assignAthlete(groupId, athId)));
        }
      }

      setIsModalOpen(false);
      showSuccess(editingGroup ? 'Grupo actualizado correctamente' : 'Grupo creado correctamente');
      fetchData();
    } catch (err) { showError(err.message || 'Error al guardar grupo'); }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName) return;
    try {
      await categoryService.createCategory({ name: newCategoryName, club_id: user.club_id });
      setNewCategoryName('');
      showSuccess('Categoría creada correctamente');
      fetchData();
    } catch (err) { showError(err.message || 'Error al crear categoría'); }
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
      showSuccess('Categoría creada y asignada');
    } catch (err) { showError(err.message || 'Error al crear categoría'); }
  };

  const handleCreateTrainerInline = async (e) => {
    e.preventDefault();
    if (!inlineTrainerForm.first_name || !inlineTrainerForm.last_name || !inlineTrainerForm.identification_number) {
      showError('Complete los campos obligatorios del entrenador');
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
      showSuccess('Entrenador creado y asignado');
    } catch (err) { showError(err.message || 'Error al crear entrenador'); }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await categoryService.deleteCategory(id);
      showSuccess('Categoría eliminada correctamente');
      fetchData();
    } catch (err) { showError(err.message || 'Error al eliminar categoría'); }
  };

  const confirmDelete = async () => {
    if (!groupToDelete) return;
    try {
      await groupService.deleteGroup(groupToDelete.id);
      showSuccess('Grupo eliminado correctamente');
      fetchData();
    } catch (err) {
      showError(err.message || 'Error al eliminar grupo');
    } finally {
      setIsConfirmOpen(false);
      setGroupToDelete(null);
    }
  };


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
          {paginatedGroups.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>No se encontraron grupos.</p>
          ) : paginatedGroups.map(group => {
            // Parse schedule blocks for display
            let blocks = [];
            try {
              blocks = group.schedule_blocks ? JSON.parse(group.schedule_blocks) : [];
            } catch { blocks = []; }
            const hasMultiBlock = blocks.length > 1;

            return (
              <div key={group.id} className="card" style={{ padding: '22px', cursor: 'default' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: groupColor(group.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', marginBottom: 14 }}>
                    {user.sport?.includes('Baloncesto') ? '🏀' : '⚽'}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span className={STATUS_BADGE[group.status] || 'badge badge-success'}>{group.status || 'ACTIVE'}</span>
                    {group.is_active !== false ? (
                      <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#b91c1c', border: 'none' }} onClick={() => { setGroupToDelete(group); setIsConfirmOpen(true); }}>
                        ✕
                      </button>
                    ) : (
                      <button className="btn btn-sm btn-success" onClick={async () => {
                        try {
                          await groupService.reactivateGroup(group.id);
                          showSuccess('Grupo reactivado correctamente');
                          fetchData();
                        } catch (err) { showError(err.message || 'Error al reactivar grupo'); }
                      }}>Reactivar</button>
                    )}
                  </div>
                </div>

                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 4 }}>{group.name}</h3>

                <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                  {group.category_obj?.name && <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>{group.category_obj.name}</span>}
                  <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>{user.sport}</span>
                  {group.level && <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>{group.level}</span>}
                </div>

                {/* Schedule display - supports multi-block */}
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                  🕐 {hasMultiBlock ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {blocks.map((b, i) => (
                        <span key={i}>{b.days.join(' - ')} {b.start} a {b.end}</span>
                      ))}
                    </div>
                  ) : (group.schedule || 'Sin horario definido')}
                </div>

                {/* Show assigned trainer(s) on card */}
                {group.trainers && group.trainers.length > 0 && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                    🏅 {group.trainers.map((t, i) => (
                      <span key={t.id} className="badge badge-info" style={{ fontSize: '0.68rem' }}>
                        {t.first_name} {t.last_name}
                      </span>
                    ))}
                  </div>
                )}

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
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {filteredGroups.length > ITEMS_PER_PAGE && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 20px',
          borderTop: '1px solid var(--border-main)',
          marginTop: '20px'
        }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredGroups.length)} de {filteredGroups.length} grupos
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-main)',
                background: 'var(--bg-surface)',
                color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem',
                fontWeight: 500,
                opacity: currentPage === 1 ? 0.5 : 1
              }}
            >
              ‹ Anterior
            </button>
            {getPageNumbers().map((page, idx) => (
              page === '...' ? (
                <span key={`ellipsis-${idx}`} style={{ padding: '6px 4px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>...</span>
              ) : (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: currentPage === page ? '1px solid #2563EB' : '1px solid var(--border-main)',
                    background: currentPage === page ? '#2563EB' : 'var(--bg-surface)',
                    color: currentPage === page ? 'white' : 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: currentPage === page ? 700 : 500,
                    minWidth: '36px'
                  }}
                >
                  {page}
                </button>
              )
            ))}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-main)',
                background: 'var(--bg-surface)',
                color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem',
                fontWeight: 500,
                opacity: currentPage === totalPages ? 0.5 : 1
              }}
            >
              Siguiente ›
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={confirmDelete}
        title="Desactivar Grupo"
        message={`¿Está seguro de desactivar ${groupToDelete?.name}? El grupo dejará de estar visible para los usuarios. Puede reactivarlo después.`}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingGroup ? "Editar Grupo" : "Crear Nuevo Grupo"}>
        <div className="profile-tabs">
          <button type="button" className={`profile-tab ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>📋 General</button>
          <button type="button" className={`profile-tab ${activeTab === 'schedule' ? 'active' : ''}`} onClick={() => setActiveTab('schedule')}>🕐 Horario</button>
          <button type="button" className={`profile-tab ${activeTab === 'trainer' ? 'active' : ''}`} onClick={() => setActiveTab('trainer')}>🏅 Entrenador</button>
          <button type="button" className={`profile-tab ${activeTab === 'athletes' ? 'active' : ''}`} onClick={() => setActiveTab('athletes')}>🏃 Atletas</button>
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
                    {LEVELS.map(lvl => (
                      <option key={lvl} value={lvl}>{lvl}</option>
                    ))}
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
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                Define los bloques de horario. Cada bloque puede tener días y horarios diferentes.
              </p>

              {/* Multi-block schedule */}
              {scheduleBlocks.map((block, index) => (
                <div key={index} style={{
                  padding: '14px',
                  border: '1px solid var(--border-main)',
                  borderRadius: '12px',
                  marginBottom: 12,
                  background: 'var(--bg-app)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <strong style={{ fontSize: '0.85rem' }}>Bloque {index + 1}</strong>
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', padding: '2px 8px', fontSize: '0.75rem' }}
                      onClick={() => removeScheduleBlock(index)}
                    >
                      Eliminar
                    </button>
                  </div>

                  {/* Day checkboxes */}
                  <div style={{ marginBottom: 10 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 6, display: 'block' }}>Días</label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {WEEK_DAYS.map(day => (
                        <label
                          key={day}
                          onClick={() => toggleBlockDay(index, day)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            background: block.days.includes(day) ? 'var(--brand-600)' : 'var(--bg-surface)',
                            color: block.days.includes(day) ? '#fff' : 'var(--text-secondary)',
                            border: block.days.includes(day) ? '1px solid var(--brand-600)' : '1px solid var(--border-main)',
                            userSelect: 'none'
                          }}
                        >
                          {day}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 4, display: 'block' }}>Hora Inicio</label>
                      <input
                        type="time"
                        value={block.start}
                        onChange={e => updateBlockField(index, 'start', e.target.value)}
                        className="form-input"
                        style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 4, display: 'block' }}>Hora Fin</label>
                      <input
                        type="time"
                        value={block.end}
                        onChange={e => updateBlockField(index, 'end', e.target.value)}
                        className="form-input"
                        style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={addScheduleBlock}
                style={{ marginBottom: 12, fontSize: '0.8rem' }}
              >
                + Agregar bloque horario
              </button>

              {/* Legacy single schedule fields (fallback) */}
              <div style={{ borderTop: '1px dashed var(--border-main)', paddingTop: 14 }}>
                <div className="form-group">
                  <label className="form-label">Horario Resumido (texto libre)</label>
                  <input type="text" name="schedule" value={formData.schedule} disabled className="form-input" placeholder="Lun-Mie-Vie 5PM a 7PM" />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>El horario resumido se genera automáticamente desde los bloques de horario.</small>
                </div>
                <div className="form-group">
                  <label className="form-label">Lugar de Entrenamiento</label>
                  <input type="text" name="training_location" value={formData.training_location} onChange={handleInputChange} className="form-input" placeholder="Cancha Principal, Gimnasio..." />
                </div>
              </div>
            </>
          )}

          {activeTab === 'trainer' && (
            <div>
              {/* Current assigned trainers - prominent display */}
              {(formData.trainer_ids || []).length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                    🏅 Entrenador{formData.trainer_ids.length > 1 ? 'es' : ''} asignado{formData.trainer_ids.length > 1 ? 's' : ''} actual{formData.trainer_ids.length > 1 ? 'es' : ''}:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {formData.trainer_ids.map(tId => {
                      const t = trainers.find(trainer => trainer.id === tId);
                      if (!t) return null;
                      return (
                        <div key={tId} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '12px 16px',
                          background: 'var(--brand-50)',
                          border: '2px solid var(--brand-500)',
                          borderRadius: '12px'
                        }}>
                          <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            background: 'var(--brand-500)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            flexShrink: 0
                          }}>
                            {t.first_name?.[0]}{t.last_name?.[0]}
                          </div>
                          <div style={{ flex: 1 }}>
                            <strong style={{ fontSize: '0.9rem' }}>{t.first_name} {t.last_name}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {t.identification_number || 'Sin ID'} {t.phone ? `· ${t.phone}` : ''}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm"
                            style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', padding: '4px 10px', fontSize: '0.75rem' }}
                            onClick={() => handleTrainerSelect(tId)}
                          >
                            ✕ Quitar
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {(formData.trainer_ids || []).length === 0 && (
                <div style={{
                  padding: '14px',
                  background: 'var(--warning-50)',
                  border: '1px solid var(--warning-500)',
                  borderRadius: '10px',
                  marginBottom: 16,
                  fontSize: '0.85rem',
                  color: 'var(--warning-700)',
                  fontWeight: 600
                }}>
                  ⚠️ No hay entrenador asignado. Selecciona uno de la lista o crea uno nuevo.
                </div>
              )}

              {/* Options to change: register new trainer + list */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {formData.trainer_ids && formData.trainer_ids.length > 0
                    ? '¿Cambiar entrenador? Selecciona de la lista:'
                    : 'Selecciona entrenador(es) para el grupo:'}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ height: 'auto', padding: '4px 8px', fontSize: '0.75rem' }}
                  onClick={() => setIsAddingTrainerInline(!isAddingTrainerInline)}
                >
                  {isAddingTrainerInline ? 'Cancelar' : '+ Registrar Nuevo'}
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
                    Crear y Asignar
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 240, overflowY: 'auto' }}>
                {trainers.map(trainer => {
                  const isSelected = (formData.trainer_ids || []).includes(trainer.id);
                  return (
                    <div key={trainer.id} onClick={() => {
                      // For single selection mode (common case), replace if already selected
                      if (isSelected) {
                        handleTrainerSelect(trainer.id);
                      } else {
                        // Replace all current with this one (single trainer mode)
                        setFormData(prev => ({ ...prev, trainer_ids: [trainer.id] }));
                      }
                    }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: isSelected ? '2px solid var(--brand-500)' : '1px solid var(--border-main)',
                        cursor: 'pointer',
                        background: isSelected ? 'var(--brand-50)' : 'var(--bg-surface)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12
                      }}>
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: isSelected ? 'var(--brand-500)' : 'var(--bg-hover)',
                        color: isSelected ? 'white' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        flexShrink: 0
                      }}>
                        {trainer.first_name?.[0]}{trainer.last_name?.[0]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <strong style={{ fontSize: '0.85rem' }}>{trainer.first_name} {trainer.last_name}</strong>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {trainer.identification_number || 'Sin ID'}
                        </div>
                      </div>
                      <span className={`badge ${isSelected ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '0.65rem' }}>
                        {isSelected ? '✓ Asignado' : 'Seleccionar'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'athletes' && (
            <div>
              <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: 12 }}>
                {editingGroup
                  ? 'Los atletas ya asignados al grupo no pueden removerse desde aquí. Puedes agregar atletas sin grupo seleccionándolos.'
                  : 'Asigna atletas sin grupo en lote a este grupo:'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                {athletes.filter(a => {
                  const isInThisGroup = a.current_groups?.some(g => g.id === editingGroup?.id);
                  const isUnassigned = !a.current_groups || a.current_groups.length === 0;
                  return isInThisGroup || isUnassigned;
                }).map(athlete => {
                  const isInThisGroup = a => a.current_groups?.some(g => g.id === editingGroup?.id);
                  const alreadyInGroup = isInThisGroup(athlete);
                  const isSelected = selectedAthleteIds.includes(athlete.id);
                  return (
                    <div key={athlete.id} onClick={() => {
                      if (alreadyInGroup) return; // No permitir deseleccionar atletas ya en el grupo
                      handleAthleteSelect(athlete.id);
                    }}
                      style={{
                        padding: '10px',
                        borderRadius: 8,
                        border: isSelected ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                        cursor: alreadyInGroup ? 'default' : 'pointer',
                        background: isSelected ? 'rgba(37,99,235,0.05)' : 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        opacity: alreadyInGroup ? 0.85 : 1
                      }}>
                      <div>
                        <strong>{athlete.user?.first_name} {athlete.user?.last_name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: {athlete.user?.identification_number}</div>
                      </div>
                      <span className={`badge ${isSelected ? 'badge-success' : 'badge-inactive'}`}>
                        {alreadyInGroup ? '✓ En el grupo' : (isSelected ? '✓ Seleccionado' : 'Sin asignar')}
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
              {cat.is_active !== false ? (
                <button className="btn btn-sm" style={{ color: '#ef4444', border: 'none', background: 'transparent' }} onClick={() => handleDeleteCategory(cat.id)}>Eliminar</button>
              ) : (
                <button className="btn btn-sm btn-success" onClick={async () => {
                  try {
                    await categoryService.reactivateCategory(cat.id);
                    showSuccess('Categoría reactivada correctamente');
                    fetchData();
                  } catch (err) { showError(err.message || 'Error al reactivar categoría'); }
                }}>Reactivar</button>
              )}
            </div>
          ))}
          {categories.length === 0 && <p className="text-muted">No has creado categorías todavía.</p>}
        </div>
      </Modal>
    </div>
  );
};

export default GroupList;