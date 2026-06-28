import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupService } from '../../../services/groupService';
import { authService } from '../../../services/authService';
import { categoryService } from '../../../services/categoryService';
import { athleteService } from '../../../services/athleteService';
import { userService } from '../../../services/userService';
import Drawer from '../../../components/UI/Drawer';
import ConfirmModal from '../../../components/UI/ConfirmModal';
import Modal from '../../../components/UI/Modal';
import { useToast } from '../../../contexts/ToastContext';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f97316', '#ec4899', '#0ea5e9', '#f59e0b'];
const groupColor = (name = '') => COLORS[name.charCodeAt(0) % COLORS.length];

const LEVELS = [
  'Recreativo', 'Principiante', 'Básico', 'Intermedio', 'Avanzado',
  'Competitivo', 'Élite', 'Semiprofesional', 'Profesional', 'Pre-competitivo'
];

const WEEK_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const CATEGORY_CLASSES = {
  'menores': 'cat-menores',
  'juveniles': 'cat-juveniles',
  'mayores': 'cat-mayores',
};

const INITIAL_FORM = {
  name: '', club_id: 1, category_id: '', description: '',
  max_capacity: '', schedule: '', schedule_days: '', schedule_start_time: '',
  schedule_end_time: '', schedule_blocks: '', training_location: '', level: '', season: '',
  monthly_fee: '', trainer_ids: []
};

// ─── Accordion component (defined OUTSIDE to avoid remounting on every render) ──
const AccordionSection = ({ title, icon, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="accordion-section">
      <button
        className={`accordion-header ${open ? 'active' : ''}`}
        onClick={() => setOpen(!open)}
        type="button"
      >
        <span className="acc-title">{icon} {title}</span>
        <span className="acc-arrow">▼</span>
      </button>
      <div className={`accordion-content ${open ? 'active' : ''}`}>
        <div className="inner-padding">
          {children}
        </div>
      </div>
    </div>
  );
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

  // Drawers
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [viewGroup, setViewGroup] = useState(null);
  const [viewGroupAthletes, setViewGroupAthletes] = useState([]);
  const [loadingAthletes, setLoadingAthletes] = useState(false);

  // Edit state
  const [editingGroup, setEditingGroup] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [viewTab, setViewTab] = useState('plan'); // 'plan', 'atletas', 'asistencia', 'tests', 'finanzas'
  const [activeDay, setActiveDay] = useState('Mié');
  const [completedExercises, setCompletedExercises] = useState({ 0: true, 1: true });
  const [selectedWeek, setSelectedWeek] = useState('1');
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [formData, setFormData] = useState({ ...INITIAL_FORM });
  const [scheduleBlocks, setScheduleBlocks] = useState([]);

  // Inline creation
  const [isAddingCategoryInline, setIsAddingCategoryInline] = useState(false);
  const [inlineCategoryName, setInlineCategoryName] = useState('');
  const [isAddingTrainerInline, setIsAddingTrainerInline] = useState(false);
  const [inlineTrainerForm, setInlineTrainerForm] = useState({
    first_name: '', last_name: '', identification_number: '', phone: '', password: 'Entrenador123*'
  });

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // Category modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const user = authService.getCurrentUser();

  useEffect(() => { fetchData(); }, []);

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
    } catch (err) { showError(err.message || 'Error al cargar datos'); }
    finally { setLoading(false); }
  };

  // ─── Compute KPIs ────────────────────────────────────────────
  const activeGroups = groups.filter(g => g.status !== 'INACTIVE');
  const totalAthletes = groups.reduce((sum, g) => sum + (g.athletes_count ?? g.athletes?.length ?? 0), 0);
  const totalTrainers = new Set();
  groups.forEach(g => (g.trainers || []).forEach(t => totalTrainers.add(t.id)));
  const totalCapacity = groups.reduce((sum, g) => sum + (g.max_capacity || 0), 0);
  const availableSpots = totalCapacity - totalAthletes;

  // ─── Category badge color helper ─────────────────────────────
  const CATEGORY_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f97316', '#ec4899', '#0ea5e9', '#f59e0b', '#84cc16', '#14b8a6', '#a855f7'];
  const getCategoryColor = (catId) => CATEGORY_COLORS[(catId || 0) % CATEGORY_COLORS.length];

  // ─── Filters ─────────────────────────────────────────────────
  const filteredGroups = groups.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.category_obj?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (filterCategory === 'all') return true;
    return g.category_id === parseInt(filterCategory);
  });

  // ─── Filter pills (dynamic from actual categories) ───────────
  const filterOptions = [
    { key: 'all', label: `Todos los Grupos (${groups.length})` },
    ...categories.map(cat => ({
      key: cat.id.toString(),
      label: `${cat.name} (${groups.filter(g => g.category_id === cat.id).length})`
    })),
  ];

  // ─── Group helpers ───────────────────────────────────────────
  const getScheduleBlocks = (group) => {
    let blocks = [];
    try {
      blocks = group.schedule_blocks ? JSON.parse(group.schedule_blocks) : [];
    } catch { blocks = []; }
    return blocks;
  };

  const getCapacityPercent = (group) => {
    const current = group.athletes_count ?? group.athletes?.length ?? 0;
    const max = group.max_capacity || 1;
    return Math.min(Math.round((current / max) * 100), 100);
  };

  const getCapacityFillClass = (percent) => {
    if (percent >= 90) return 'fill-red';
    if (percent >= 60) return 'fill-orange';
    return 'fill-green';
  };

  const getStatusText = (group) => {
    const current = group.athletes_count ?? group.athletes?.length ?? 0;
    const max = group.max_capacity;
    if (max && current >= max) return 'Lleno';
    return 'Activo';
  };

  // ─── Drawer: View ────────────────────────────────────────────
  const openViewDrawer = async (group) => {
    setViewGroup(group);
    setViewTab('plan');
    setActiveDay('Mié');
    setViewDrawerOpen(true);
    setLoadingAthletes(true);
    try {
      const athletesData = await groupService.getGroupAthletes(group.id);
      setViewGroupAthletes(athletesData || []);
    } catch (err) {
      setViewGroupAthletes([]);
    } finally {
      setLoadingAthletes(false);
    }
  };

  const closeViewDrawer = () => {
    setViewDrawerOpen(false);
    setTimeout(() => {
      setViewGroup(null);
      setViewGroupAthletes([]);
    }, 300);
  };

  // ─── Drawer: Edit ────────────────────────────────────────────
  const openCreateDrawer = () => {
    setEditingGroup(null);
    setFormData({ ...INITIAL_FORM, club_id: user.club_id });
    setSelectedAthleteIds([]);
    setScheduleBlocks([]);
    setIsAddingCategoryInline(false);
    setIsAddingTrainerInline(false);
    setEditDrawerOpen(true);
  };

  const openEditDrawer = (group) => {
    setEditingGroup(group);
    let parsedBlocks = getScheduleBlocks(group);
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
    const currentAthleteIds = athletes
      .filter(a => a.current_groups?.some(g => g.id === group.id))
      .map(a => a.id);
    setSelectedAthleteIds(currentAthleteIds);
    setIsAddingCategoryInline(false);
    setIsAddingTrainerInline(false);
    setEditDrawerOpen(true);
  };

  const closeEditDrawer = () => {
    setEditDrawerOpen(false);
  };

  // ─── Form handlers ───────────────────────────────────────────
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
      if (prev.includes(id)) return prev.filter(aId => aId !== id);
      return [...prev, id];
    });
  };

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

  const handleSubmit = async e => {
    e.preventDefault();
    if (!formData.trainer_ids || formData.trainer_ids.length === 0) {
      showError('Debe asignar al menos un entrenador al grupo');
      return;
    }
    try {
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

      if (editingGroup) {
        const initialAthleteIds = athletes
          .filter(a => a.current_groups?.some(g => g.id === editingGroup.id))
          .map(a => a.id);
        const toAdd = selectedAthleteIds.filter(id => !initialAthleteIds.includes(id));
        if (toAdd.length > 0) {
          await Promise.all(toAdd.map(athId => groupService.assignAthlete(groupId, athId)));
        }
      }

      setEditDrawerOpen(false);
      showSuccess(editingGroup ? 'Grupo actualizado correctamente' : 'Grupo creado correctamente');
      fetchData();
    } catch (err) { showError(err.message || 'Error al guardar grupo'); }
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

  // ─── Refresh only categories (avoids full loading state) ────
  const refreshCategories = async () => {
    try {
      const categoriesData = await categoryService.getCategories();
      setCategories(categoriesData || []);
    } catch (err) {
      showError(err.message || 'Error al cargar categorías');
    }
  };

  // ─── Category Modal handlers ─────────────────────────────────
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName) return;
    try {
      await categoryService.createCategory({ name: newCategoryName, club_id: user.club_id });
      setNewCategoryName('');
      setIsCategoryModalOpen(false);
      showSuccess('Categoría creada correctamente');
      await refreshCategories();
    } catch (err) { showError(err.message || 'Error al crear categoría'); }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await categoryService.deleteCategory(id);
      showSuccess('Categoría eliminada correctamente');
      await refreshCategories();
    } catch (err) { showError(err.message || 'Error al eliminar categoría'); }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando grupos...</div>;

  return (
    <div className="group-list-v2">
      {/* HEADER */}
      <div className="header-v2">
        <div>
          <h1>Gestión de Grupos</h1>
          <p>Administra los equipos, categorías, entrenadores y sedes del club.</p>
        </div>
        <div className="header-actions-v2">
          <div className="search-bar-v2">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Buscar grupo, entrenador o sede..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-primary-v2" onClick={openCreateDrawer}>
            + Nuevo Grupo
          </button>
        </div>
      </div>

      {/* KPIs MINI */}
      <div className="grid-4-v2">
        <div className="mini-kpi-v2">
          <div>
            <h3>Grupos Activos</h3>
            <div className="val">{activeGroups.length}</div>
          </div>
          <div className="mini-icon-v2" style={{ background: '#EFF6FF', color: '#2563EB' }}>⚽</div>
        </div>
        <div className="mini-kpi-v2">
          <div>
            <h3>Total Atletas</h3>
            <div className="val">{totalAthletes}</div>
          </div>
          <div className="mini-icon-v2" style={{ background: '#ECFDF5', color: '#10B981' }}>👥</div>
        </div>
        <div className="mini-kpi-v2">
          <div>
            <h3>Entrenadores</h3>
            <div className="val">{totalTrainers.size}</div>
          </div>
          <div className="mini-icon-v2" style={{ background: '#FEF3C7', color: '#F59E0B' }}>🧢</div>
        </div>
        <div className="mini-kpi-v2">
          <div>
            <h3>Cupos Disponibles</h3>
            <div className="val">{Math.max(0, availableSpots)}</div>
          </div>
          <div className="mini-icon-v2" style={{ background: '#F5F3FF', color: '#8B5CF6' }}>🟢</div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="filters-bar-v2">
        <div className="filter-pills-v2">
          {filterOptions.map(opt => (
            <div
              key={opt.key}
              className={`filter-pill-v2 ${filterCategory === opt.key ? 'active' : ''}`}
              onClick={() => setFilterCategory(opt.key)}
            >
              {opt.label}
            </div>
          ))}
        </div>
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => setIsCategoryModalOpen(true)}>
            ⚙️ Categorías
          </button>
        </div>
      </div>

      {/* GROUPS GRID */}
      {groups.length === 0 ? (
        <div className="empty-state-v2">
          <div className="empty-icon">⚽</div>
          <h2>¡Te damos la bienvenida a la gestión de Grupos! 🚀</h2>
          <p>Para comenzar a operar, te recomendamos seguir estos sencillos pasos:</p>
          <div className="steps-v2">
            <div className="step-item">
              <div className={`step-num ${categories.length > 0 ? 'done' : ''}`}>
                {categories.length > 0 ? '✓' : '1'}
              </div>
              <div>
                <strong>Definir Categorías</strong>
                <p>Categorías por edad o nivel (ej: Sub-15, Principiantes).</p>
                {categories.length > 0 ? (
                  <span style={{ color: '#10B981', fontSize: '0.8rem' }}>(Listo: {categories.length} creadas)</span>
                ) : (
                  <button className="btn btn-link btn-sm" style={{ padding: 0, border: 'none', background: 'transparent', color: '#2563EB', cursor: 'pointer', fontSize: '0.8rem' }} onClick={() => setIsCategoryModalOpen(true)}>Crear ahora</button>
                )}
              </div>
            </div>
            <div className="step-item">
              <div className={`step-num ${trainers.length > 0 ? 'done' : ''}`}>
                {trainers.length > 0 ? '✓' : '2'}
              </div>
              <div>
                <strong>Registrar Entrenadores</strong>
                <p>Los encargados de dirigir cada grupo.</p>
                {trainers.length > 0 ? (
                  <span style={{ color: '#10B981', fontSize: '0.8rem' }}>(Listo: {trainers.length} registrados)</span>
                ) : (
                  <button className="btn btn-link btn-sm" style={{ padding: 0, border: 'none', background: 'transparent', color: '#2563EB', cursor: 'pointer', fontSize: '0.8rem' }} onClick={() => navigate('/admin/trainers')}>Ir a Entrenadores</button>
                )}
              </div>
            </div>
            <div className="step-item">
              <div className="step-num">3</div>
              <div>
                <strong>Crear tu primer Grupo</strong>
                <p>Asocia un entrenador, una categoría y horarios.</p>
                <button className="btn btn-link btn-sm" style={{ padding: 0, border: 'none', background: 'transparent', color: '#2563EB', cursor: 'pointer', fontSize: '0.8rem' }} onClick={openCreateDrawer}>Crear grupo</button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="groups-grid-v2">
          {filteredGroups.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>
              No se encontraron grupos con los filtros actuales.
            </p>
          ) : filteredGroups.map(group => {
            const blocks = getScheduleBlocks(group);
            const capacityPercent = getCapacityPercent(group);
            const currentCount = group.athletes_count ?? group.athletes?.length ?? 0;

            return (
              <div key={group.id} className="group-card-v2">
                <div className="card-top-v2">
                  <div>
                    <div className="group-name-v2">{group.name}</div>
                    {group.category_obj?.name && (
                      <div className="category-badge-v2" style={{ background: `${getCategoryColor(group.category_id)}20`, color: getCategoryColor(group.category_id), border: `1px solid ${getCategoryColor(group.category_id)}40` }}>
                        {group.category_obj.name}
                      </div>
                    )}
                  </div>
                  <div className="status-badge-v2">🟢 {getStatusText(group)}</div>
                </div>
                <div className="card-details-v2">
                  {blocks.length > 0 ? (
                    <div className="detail-item-v2">
                      📅 <span>
                        <strong>{blocks.map(b => b.days.join(', ')).join(' | ')}</strong>
                        {' - '}{blocks[0].start} a {blocks[0].end}
                      </span>
                    </div>
                  ) : group.schedule ? (
                    <div className="detail-item-v2">📅 <span><strong>{group.schedule}</strong></span></div>
                  ) : null}
                  {group.trainers && group.trainers.length > 0 && (
                    <div className="detail-item-v2">
                      🧢 <strong>{group.trainers.map(t => `${t.first_name} ${t.last_name}`).join(', ')}</strong>
                    </div>
                  )}
                  {group.training_location && (
                    <div className="detail-item-v2">📍 <strong>{group.training_location}</strong></div>
                  )}
                  {group.monthly_fee && (
                    <div className="detail-item-v2">💰 <strong>${parseFloat(group.monthly_fee).toLocaleString()}</strong></div>
                  )}
                </div>
                <div className="card-footer-v2">
                  <div className="capacity-container-v2">
                    <div className="capacity-label-v2">
                      <span>Capacidad</span>
                      <span style={capacityPercent >= 90 ? { color: '#EF4444' } : capacityPercent >= 60 ? { color: '#F59E0B' } : {}}>
                        {currentCount}/{group.max_capacity || '∞'}
                        {group.max_capacity && currentCount >= parseInt(group.max_capacity) ? ' (Lleno)' : ''}
                      </span>
                    </div>
                    <div className="progress-bar-v2">
                      <div
                        className={`progress-fill-v2 ${getCapacityFillClass(capacityPercent)}`}
                        style={{ width: `${capacityPercent}%` }}
                      />
                    </div>
                  </div>
                  <div className="action-icons-v2">
                    <button
                      className="action-btn-v2"
                      onClick={() => navigate(`/admin/groups/${group.id}`)}
                      title="Ver Detalle"
                    >
                      👁️
                    </button>
                    <button
                      className="action-btn-v2"
                      onClick={() => openEditDrawer(group)}
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      className="action-btn-v2"
                      onClick={() => { setGroupToDelete(group); setIsConfirmOpen(true); }}
                      title="Desactivar"
                      style={{ color: '#EF4444' }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── DRAWER: VER DETALLE ───────────────────────────── */}
      <Drawer
        isOpen={viewDrawerOpen}
        onClose={closeViewDrawer}
        title="Detalle del Grupo"
        footer={
          <>
            <button className="btn btn-ghost" onClick={closeViewDrawer}>Cerrar</button>
            {viewGroup && (
              <button
                className="btn btn-primary"
                onClick={() => { closeViewDrawer(); setTimeout(() => openEditDrawer(viewGroup), 300); }}
              >
                ✏️ Editar Grupo
              </button>
            )}
          </>
        }
      >
        {viewGroup && (
          <>
            {/* HERO IDENTITY */}
            <div className="view-hero-v2" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              marginBottom: '20px',
              paddingBottom: '20px',
              borderBottom: '1px solid var(--border-soft)'
            }}>
              <div className="view-avatar-v2" style={{
                width: '70px',
                height: '70px',
                borderRadius: '16px',
                fontSize: '1.8rem',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #2563EB, #8B5CF6)',
                color: 'white',
                marginBottom: '10px',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
              }}>
                {viewGroup.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="view-name-v2" style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '5px' }}>
                {viewGroup.name}
              </div>
              <div className="view-badges-v2" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                {viewGroup.category_obj?.name && (
                  <div className="category-badge-v2" style={{ background: `${getCategoryColor(viewGroup.category_id)}20`, color: getCategoryColor(viewGroup.category_id), border: `1px solid ${getCategoryColor(viewGroup.category_id)}40` }}>
                    {viewGroup.category_obj.name}
                  </div>
                )}
                <div className="status-badge-v2">🟢 {getStatusText(viewGroup)}</div>
              </div>
            </div>

            {/* TAB SELECTOR */}
            <div className="tabs" style={{
              display: 'flex',
              gap: '4px',
              marginBottom: '20px',
              background: '#F1F5F9',
              padding: '4px',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              overflowX: 'auto'
            }}>
              {[
                { id: 'plan', label: 'Plan de Ent.' },
                { id: 'atletas', label: 'Atletas' },
                { id: 'asistencia', label: 'Asistencia' },
                { id: 'tests', label: 'Tests Físicos' },
                { id: 'finanzas', label: 'Finanzas' }
              ].map((tab) => {
                const isActive = viewTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setViewTab(tab.id)}
                    style={{
                      flex: 1,
                      padding: '8px 8px',
                      borderRadius: '8px',
                      border: 'none',
                      background: isActive ? '#2563EB' : 'transparent',
                      color: isActive ? '#FFFFFF' : '#64748B',
                      fontWeight: '600',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      boxShadow: isActive ? '0 2px 8px rgba(37, 99, 235, 0.2)' : 'none',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT: PLAN DE ENTRENAMIENTO */}
            {viewTab === 'plan' && (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                {/* MACRO PLAN ASSIGNED */}
                <div className="macro-summary" style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderLeft: '5px solid #2563EB',
                  borderRadius: '16px',
                  padding: '16px',
                  marginBottom: '20px',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div className="macro-info">
                    <h2 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '3px' }}>Pretemporada Verano</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>📅 01 Jun - 30 Jun | Fase: Acumulación</p>
                  </div>
                  <div className="progress-ring" style={{
                    width: '45px',
                    height: '45px',
                    borderRadius: '50%',
                    background: 'conic-gradient(#2563EB 65%, #F1F5F9 0)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{
                      width: '35px',
                      height: '35px',
                      background: '#FFFFFF',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      color: '#2563EB'
                    }}>65%</span>
                  </div>
                </div>

                {/* MICROCYCLE (WEEK) */}
                <div className="card" style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '16px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>Microciclo:</span>
                      <select
                        className="week-selector"
                        value={selectedWeek}
                        onChange={(e) => setSelectedWeek(e.target.value)}
                        style={{
                          background: '#F1F5F9',
                          border: '1px solid var(--border-color)',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          fontWeight: '600',
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="1">Semana 3 (10 Jun - 16 Jun)</option>
                        <option value="2">Semana 4 - Descarga (17 Jun - 23 Jun)</option>
                      </select>
                      <span className={`tag ${selectedWeek === '2' ? 'tag-orange' : 'tag-green'}`} style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700' }}>
                        {selectedWeek === '2' ? 'Descarga' : 'Carga'}
                      </span>
                    </div>
                  </div>

                  <div className="days-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
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
                          className={`day-card ${isActive ? 'active' : ''}`}
                          style={{
                            background: isActive ? '#2563EB' : '#F8FAFC',
                            color: isActive ? '#FFFFFF' : '#0F172A',
                            border: `1px solid ${isActive ? '#2563EB' : '#E2E8F0'}`,
                            borderRadius: '10px',
                            padding: '10px 4px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: '0.2s'
                          }}
                        >
                          <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: '700', color: isActive ? '#FFFFFF' : '#64748B' }}>{d.day}</div>
                          <div style={{ fontSize: '1rem', fontWeight: '800', margin: '2px 0' }}>{d.num}</div>
                          <div style={{
                            fontSize: '0.6rem',
                            padding: '2px 2px',
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

                {/* DETALLE DE SESION */}
                <div className="card" style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
                  <div className="session-header" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '15px',
                    background: '#F1F5F9',
                    padding: '12px',
                    borderRadius: '10px'
                  }}>
                    <div className="session-title">
                      <h3 style={{ fontSize: '0.95rem', fontWeight: '700' }}>
                        {activeDay === 'Lun' && 'Lunes 10 - Fuerza Base'}
                        {activeDay === 'Mar' && 'Martes 11 - Descanso'}
                        {activeDay === 'Mié' && 'Miércoles 12 - Velocidad y Agilidad'}
                        {activeDay === 'Jue' && 'Jueves 13 - Técnica Individual'}
                        {activeDay === 'Vie' && 'Viernes 14 - Táctica Colectiva'}
                        {activeDay === 'Sáb' && 'Sábado 15 - Recuperación'}
                        {activeDay === 'Dom' && 'Domingo 16 - Descanso Total'}
                      </h3>
                      <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                        Sub-10 B | 16:00 - 18:00 | Intensidad: Alta
                      </p>
                    </div>
                  </div>

                  {['Mar', 'Sáb', 'Dom'].includes(activeDay) ? (
                    <div style={{ textAlign: 'center', padding: '30px 10px', color: '#64748B', fontWeight: '600', fontSize: '0.85rem' }}>
                      😴 Día de Descanso. No hay sesión programada.
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ borderBottom: '2px solid #E2E8F0', padding: '8px 4px', fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748B', textAlign: 'left' }}>Estado</th>
                          <th style={{ borderBottom: '2px solid #E2E8F0', padding: '8px 4px', fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748B', textAlign: 'left' }}>Ejercicio</th>
                          <th style={{ borderBottom: '2px solid #E2E8F0', padding: '8px 4px', fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748B', textAlign: 'left' }}>Bloque</th>
                          <th style={{ borderBottom: '2px solid #E2E8F0', padding: '8px 4px', fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748B', textAlign: 'left' }}>Series</th>
                          <th style={{ borderBottom: '2px solid #E2E8F0', padding: '8px 4px', fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748B', textAlign: 'left' }}>Carga</th>
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
                              <td style={{ padding: '10px 4px' }}>
                                <div
                                  onClick={() => setCompletedExercises(prev => ({ ...prev, [ex.id]: !prev[ex.id] }))}
                                  style={{
                                    width: '20px',
                                    height: '20px',
                                    border: '2px solid #CBD5E1',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: isCompleted ? '#10B981' : '#FFFFFF',
                                    borderColor: isCompleted ? '#10B981' : '#CBD5E1',
                                    color: isCompleted ? '#FFFFFF' : 'transparent',
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold'
                                  }}
                                >
                                  ✔
                                </div>
                              </td>
                              <td style={{ padding: '10px 4px', fontWeight: '600', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                                <span style={{ marginRight: '4px' }}>{ex.icon}</span> {ex.name}
                              </td>
                              <td style={{ padding: '10px 4px' }}>
                                <span className={`tag ${ex.blockClass}`} style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem' }}>{ex.block}</span>
                              </td>
                              <td style={{ padding: '10px 4px', fontSize: '0.8rem', color: '#0F172A' }}>{ex.series}</td>
                              <td style={{ padding: '10px 4px', fontSize: '0.8rem', color: '#64748B' }}>{ex.load}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: ATLETAS */}
            {viewTab === 'atletas' && (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <div className="info-card-v2" style={{ background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '15px', marginBottom: '15px' }}>
                  {viewGroup.trainers && viewGroup.trainers.length > 0 && (
                    <div className="info-row-v2" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-soft)' }}>
                      <span className="info-label-v2" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>🧢 Entrenador</span>
                      <span className="info-value-v2" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {viewGroup.trainers.map(t => `${t.first_name} ${t.last_name}`).join(', ')}
                      </span>
                    </div>
                  )}
                  {viewGroup.training_location && (
                    <div className="info-row-v2" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-soft)' }}>
                      <span className="info-label-v2" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>📍 Sede</span>
                      <span className="info-value-v2" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{viewGroup.training_location}</span>
                    </div>
                  )}
                  {(() => {
                    const blks = getScheduleBlocks(viewGroup);
                    const scheduleText = blks.length > 0
                      ? blks.map(b => `${b.days.join(', ')} - ${b.start} a ${b.end}`).join(' | ')
                      : viewGroup.schedule;
                    return scheduleText ? (
                      <div className="info-row-v2" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-soft)' }}>
                        <span className="info-label-v2" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>📅 Horario</span>
                        <span className="info-value-v2" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{scheduleText}</span>
                      </div>
                    ) : null;
                  })()}
                  {viewGroup.monthly_fee && (
                    <div className="info-row-v2" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-soft)' }}>
                      <span className="info-label-v2" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>💰 Cuota Mensual</span>
                      <span className="info-value-v2" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#10B981' }}>
                        ${parseFloat(viewGroup.monthly_fee).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {viewGroup.level && (
                    <div className="info-row-v2" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-soft)' }}>
                      <span className="info-label-v2" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>📊 Nivel</span>
                      <span className="info-value-v2" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{viewGroup.level}</span>
                    </div>
                  )}
                  <div className="capacity-row-v2" style={{ marginTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 5 }}>
                      <span className="info-label-v2" style={{ fontWeight: 600 }}>👥 Capacidad</span>
                      <span className="info-value-v2" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {(viewGroup.athletes_count ?? viewGroup.athletes?.length ?? 0)} / {viewGroup.max_capacity || '∞'} Atletas
                      </span>
                    </div>
                    <div className="capacity-bar-v2" style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '10px', overflow: 'hidden', marginTop: '5px' }}>
                      <div
                        className="capacity-fill-v2"
                        style={{
                          height: '100%',
                          borderRadius: '10px',
                          width: `${getCapacityPercent(viewGroup)}%`,
                          background: getCapacityPercent(viewGroup) >= 90 ? '#EF4444' : getCapacityPercent(viewGroup) >= 60 ? '#F59E0B' : '#10B981'
                        }}
                      />
                    </div>
                  </div>
                  {viewGroup.description && (
                    <div className="info-row-v2" style={{ borderBottom: 'none', flexDirection: 'column', alignItems: 'flex-start', gap: 4, padding: '8px 0' }}>
                      <span className="info-label-v2" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>📝 Descripción</span>
                      <span className="info-value-v2" style={{ textAlign: 'left', fontWeight: 400, color: 'var(--text-primary)' }}>{viewGroup.description}</span>
                    </div>
                  )}
                </div>

                <div className="section-divider-v2" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, margin: '20px 0 10px' }}>
                  Atletas Inscritos ({viewGroup.athletes_count ?? viewGroupAthletes.length ?? 0})
                </div>

                {loadingAthletes ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>
                    Cargando atletas...
                  </p>
                ) : viewGroupAthletes.length > 0 ? (
                  viewGroupAthletes.map((athlete, idx) => (
                    <div key={athlete.id || idx} className="list-card-v2" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '10px', marginBottom: '8px', background: 'var(--bg-surface)' }}>
                      <div className="list-info-v2" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="list-avatar-v2" style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                          {(athlete.user?.first_name?.[0] || '')}{(athlete.user?.last_name?.[0] || '')}
                        </div>
                        <div>
                          <div className="list-name-v2" style={{ fontWeight: '600', fontSize: '0.85rem' }}>
                            {athlete.user?.first_name} {athlete.user?.last_name}
                          </div>
                          <div className="list-sub-v2" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {athlete.user?.identification_number}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>
                        <span className="dot-green-v2"></span> Activo
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>
                    No hay atletas inscritos en este grupo.
                  </p>
                )}
              </div>
            )}

            {/* TAB CONTENT: ASISTENCIA */}
            {viewTab === 'asistencia' && (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Fecha: Hoy (22 Jun 2026)</span>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => showSuccess('Asistencia guardada correctamente')}>
                    💾 Guardar Asistencia
                  </button>
                </div>
                {viewGroupAthletes.length > 0 ? (
                  viewGroupAthletes.map((athlete) => (
                    <div key={athlete.id} className="list-card-v2" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '10px', marginBottom: '8px', cursor: 'default' }}>
                      <div className="list-info-v2" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="list-avatar-v2" style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                          {athlete.user?.first_name?.[0]}{athlete.user?.last_name?.[0]}
                        </div>
                        <div>
                          <div className="list-name-v2" style={{ fontWeight: '600', fontSize: '0.85rem' }}>{athlete.user?.first_name} {athlete.user?.last_name}</div>
                          <div className="list-sub-v2" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {athlete.user?.identification_number}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                          type="button"
                          className="btn-action-sm-v2"
                          style={{
                            background: '#ECFDF5',
                            color: '#10B981',
                            border: '1px solid #10B981',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Presente
                        </button>
                        <button
                          type="button"
                          className="btn-action-sm-v2"
                          style={{
                            background: '#F1F5F9',
                            color: '#64748B',
                            border: '1px solid #CBD5E1',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Ausente
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>
                    No hay atletas inscritos para tomar asistencia.
                  </p>
                )}
              </div>
            )}

            {/* TAB CONTENT: TESTS FISICOS */}
            {viewTab === 'tests' && (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <div className="card" style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '12px' }}>Historial de Tests Recientes</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
                        <th style={{ padding: '8px 4px', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748B' }}>Test</th>
                        <th style={{ padding: '8px 4px', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748B' }}>Fecha</th>
                        <th style={{ padding: '8px 4px', textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748B' }}>Promedio</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '10px 4px', fontSize: '0.8rem', fontWeight: '600' }}>⚡ Control Velocidad 30m</td>
                        <td style={{ padding: '10px 4px', fontSize: '0.8rem', color: '#64748B' }}>15 Jun 2026</td>
                        <td style={{ padding: '10px 4px', fontSize: '0.8rem', color: '#10B981', fontWeight: '600' }}>4.82 seg</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '10px 4px', fontSize: '0.8rem', fontWeight: '600' }}>🦵 Test de Salto Vertical</td>
                        <td style={{ padding: '10px 4px', fontSize: '0.8rem', color: '#64748B' }}>12 Jun 2026</td>
                        <td style={{ padding: '10px 4px', fontSize: '0.8rem', color: '#2563EB', fontWeight: '600' }}>38.5 cm</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '10px 4px', fontSize: '0.8rem', fontWeight: '600' }}>🫁 Resistencia Yo-Yo Lvl 1</td>
                        <td style={{ padding: '10px 4px', fontSize: '0.8rem', color: '#64748B' }}>05 Jun 2026</td>
                        <td style={{ padding: '10px 4px', fontSize: '0.8rem', color: '#F59E0B', fontWeight: '600' }}>14.2 (1620m)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB CONTENT: FINANZAS */}
            {viewTab === 'finanzas' && (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <div className="card" style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: '700' }}>Estado de Mensualidades (Junio)</h3>
                    <span style={{ fontSize: '0.75rem', background: '#ECFDF5', color: '#10B981', padding: '3px 8px', borderRadius: '6px', fontWeight: '600' }}>
                      Recaudado: 85%
                    </span>
                  </div>
                  {viewGroupAthletes.length > 0 ? (
                    viewGroupAthletes.map((athlete, idx) => {
                      const isPaid = idx % 4 !== 0;
                      return (
                        <div key={athlete.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>{athlete.user?.first_name} {athlete.user?.last_name}</span>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            padding: '3px 6px',
                            borderRadius: '5px',
                            background: isPaid ? '#ECFDF5' : '#FEE2E2',
                            color: isPaid ? '#047857' : '#B91C1C'
                          }}>
                            {isPaid ? 'Al día' : 'Pendiente'}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>
                      No hay atletas inscritos para ver pagos.
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </Drawer>

      {/* ─── DRAWER: CREAR / EDITAR ────────────────────────── */}
      <Drawer
        isOpen={editDrawerOpen}
        onClose={closeEditDrawer}
        title={editingGroup ? `Editar Grupo: ${editingGroup.name}` : 'Nuevo Grupo'}
        footer={
          <>
            <button className="btn btn-ghost" onClick={closeEditDrawer}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              {editingGroup ? 'Guardar Cambios' : 'Crear Grupo'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          {/* SECCIÓN 1: GENERAL */}
          <AccordionSection title="Información General" icon="⚙️" defaultOpen={true}>
            <div className="form-group">
              <label className="form-label">Nombre del Grupo</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="form-input"
                required
                placeholder="Ej: Sub-10 B - Intermedio"
              />
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
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
                      style={{ flex: 1, padding: '6px 10px', fontSize: '0.85rem' }}
                    />
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={handleCreateCategoryInline}
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
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Capacidad Máxima</label>
                <input type="number" name="max_capacity" value={formData.max_capacity} onChange={handleInputChange} className="form-input" placeholder="15" />
              </div>
              <div className="form-group">
                <label className="form-label">Cuota Mensual ($)</label>
                <input type="number" name="monthly_fee" value={formData.monthly_fee} onChange={handleInputChange} className="form-input" placeholder="180000" />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Descripción</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="form-input"
                rows={3}
                placeholder="Descripción del grupo..."
              />
            </div>
          </AccordionSection>

          {/* SECCIÓN 2: HORARIO */}
          <AccordionSection title="Horario y Sede" icon="📅">
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
              Define los bloques de horario. Cada bloque puede tener días y horarios diferentes.
            </p>

            {scheduleBlocks.map((block, index) => (
              <div key={index} className="schedule-block-v2">
                <div className="schedule-block-header">
                  <strong>Bloque {index + 1}</strong>
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{ background: '#FEF2F2', color: '#EF4444', border: 'none', padding: '2px 8px', fontSize: '0.75rem' }}
                    onClick={() => removeScheduleBlock(index)}
                  >
                    ✕ Eliminar
                  </button>
                </div>
                <div className="form-group">
                  <label className="form-label">Días de Entrenamiento</label>
                  <div className="days-selector-v2">
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                      <div
                        key={day}
                        className={`day-pill-v2 ${block.days.includes(day) ? 'active' : ''}`}
                        onClick={() => toggleBlockDay(index, day)}
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Hora Inicio</label>
                    <input
                      type="time"
                      value={block.start}
                      onChange={e => updateBlockField(index, 'start', e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Hora Fin</label>
                    <input
                      type="time"
                      value={block.end}
                      onChange={e => updateBlockField(index, 'end', e.target.value)}
                      className="form-input"
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

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Sede / Lugar</label>
              <input
                type="text"
                name="training_location"
                value={formData.training_location}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Cancha Sintética El Campín"
              />
            </div>
          </AccordionSection>

          {/* SECCIÓN 3: ENTRENADOR */}
          <AccordionSection title="Entrenador Asignado" icon="🧢">
            {/* Current assigned trainers */}
            {(formData.trainer_ids || []).length > 0 && (
              <div style={{ marginBottom: 15 }}>
                {formData.trainer_ids.map(tId => {
                  const t = trainers.find(trainer => trainer.id === tId);
                  if (!t) return null;
                  return (
                    <div key={tId} className="list-card-v2" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', marginBottom: 8 }}>
                      <div className="list-info-v2">
                        <div className="list-avatar-v2" style={{ background: '#DBEAFE', color: '#1D4ED8' }}>
                          {t.first_name?.[0]}{t.last_name?.[0]}
                        </div>
                        <div>
                          <div className="list-name-v2">{t.first_name} {t.last_name}</div>
                          <div className="list-sub-v2">Actualmente asignado</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-action-sm-v2 btn-remove-v2"
                        onClick={() => handleTrainerSelect(tId)}
                      >
                        ✕ Quitar
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {(formData.trainer_ids || []).length === 0 && (
              <div style={{
                padding: '14px',
                background: '#FEF3C7',
                border: '1px solid #F59E0B',
                borderRadius: '10px',
                marginBottom: 15,
                fontSize: '0.85rem',
                color: '#B45309',
                fontWeight: 600
              }}>
                ⚠️ No hay entrenador asignado. Selecciona uno de la lista o crea uno nuevo.
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', margin: 0 }}>
                Disponibles para asignar
              </label>
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
              <div className="inline-trainer-form">
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem' }}>Nuevo Entrenador</h4>
                <div className="form-grid-2">
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
                  style={{ padding: '6px 10px', fontSize: '0.8rem', marginBottom: 8 }}
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Teléfono"
                  value={inlineTrainerForm.phone}
                  onChange={e => setInlineTrainerForm(prev => ({ ...prev, phone: e.target.value }))}
                  style={{ padding: '6px 10px', fontSize: '0.8rem', marginBottom: 8 }}
                />
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleCreateTrainerInline}
                  style={{ alignSelf: 'flex-end' }}
                >
                  Crear y Asignar
                </button>
              </div>
            )}

            <div className="trainer-list-v2">
              {trainers.map(trainer => {
                const isSelected = (formData.trainer_ids || []).includes(trainer.id);
                return (
                  <div
                    key={trainer.id}
                    className={`list-card-v2 ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      if (isSelected) {
                        handleTrainerSelect(trainer.id);
                      } else {
                        setFormData(prev => ({ ...prev, trainer_ids: [trainer.id] }));
                      }
                    }}
                  >
                    <div className="list-info-v2">
                      <div className="list-avatar-v2" style={isSelected ? { background: '#2563EB', color: 'white' } : {}}>
                        {trainer.first_name?.[0]}{trainer.last_name?.[0]}
                      </div>
                      <div>
                        <div className="list-name-v2">{trainer.first_name} {trainer.last_name}</div>
                        <div className="list-sub-v2">{trainer.identification_number || 'Sin ID'}</div>
                      </div>
                    </div>
                    <span className={`badge ${isSelected ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '0.65rem' }}>
                      {isSelected ? '✓ Asignado' : '+ Asignar'}
                    </span>
                  </div>
                );
              })}
            </div>
          </AccordionSection>

          {/* SECCIÓN 4: ATLETAS */}
          <AccordionSection title={`Atletas del Grupo (${selectedAthleteIds.length})`} icon="👥">
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
              {editingGroup
                ? 'Los atletas ya asignados al grupo no pueden removerse desde aquí. Puedes agregar atletas sin grupo seleccionándolos.'
                : 'Asigna atletas sin grupo en lote a este grupo:'}
            </p>
            <div className="athlete-list-v2">
              {athletes.filter(a => {
                const isInThisGroup = a.current_groups?.some(g => g.id === editingGroup?.id);
                const isUnassigned = !a.current_groups || a.current_groups.length === 0;
                return isInThisGroup || isUnassigned;
              }).map(athlete => {
                const alreadyInGroup = athlete.current_groups?.some(g => g.id === editingGroup?.id);
                const isSelected = selectedAthleteIds.includes(athlete.id);
                return (
                  <div
                    key={athlete.id}
                    className={`list-card-v2 ${isSelected ? 'selected' : ''}`}
                    onClick={() => { if (!alreadyInGroup) handleAthleteSelect(athlete.id); }}
                    style={{ opacity: alreadyInGroup ? 0.85 : 1 }}
                  >
                    <div className="list-info-v2">
                      <div className="list-avatar-v2">
                        {(athlete.user?.first_name?.[0] || '')}{(athlete.user?.last_name?.[0] || '')}
                      </div>
                      <div>
                        <div className="list-name-v2">
                          {athlete.user?.first_name} {athlete.user?.last_name}
                        </div>
                        <div className="list-sub-v2">ID: {athlete.user?.identification_number}</div>
                      </div>
                    </div>
                    {alreadyInGroup ? (
                      <span className="badge-assigned-v2">✓ En grupo</span>
                    ) : (
                      <span className={`badge ${isSelected ? 'badge-success' : 'badge-inactive'}`}>
                        {isSelected ? '✓ Seleccionado' : 'Sin asignar'}
                      </span>
                    )}
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
          </AccordionSection>
        </form>
      </Drawer>

      {/* ─── CONFIRM MODAL: DELETE ─────────────────────────── */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Desactivar Grupo"
        message={`¿Está seguro de desactivar ${groupToDelete?.name}? El grupo dejará de estar visible para los usuarios. Puede reactivarlo después.`}
      />

      {/* ─── CATEGORY MODAL ────────────────────────────────── */}
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
                    await refreshCategories();
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
