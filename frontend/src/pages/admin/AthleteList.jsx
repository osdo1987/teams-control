import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { athleteService } from '../../services/athleteService';
import { userService } from '../../services/userService';
import { groupService } from '../../services/groupService';
import { authService } from '../../services/authService';
import clubService from '../../services/clubService';
import { useToast } from '../../contexts/ToastContext';
import ConfirmModal from '../../components/UI/ConfirmModal';
import Modal from '../../components/UI/Modal';
import PasswordInput from '../../components/UI/PasswordInput';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f97316', '#ec4899', '#0ea5e9'];
const avatarColor = (name = '') => COLORS[name.charCodeAt(0) % COLORS.length];
const initials = (first = '?', last = '?') => `${first?.[0] || '?'}${last?.[0] || '?'}`.toUpperCase();

const AthleteList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [athletes, setAthletes] = useState([]);
  const [groups, setGroups] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { showError, showSuccess } = useToast();
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'inactive', 'overdue'

  // Create modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    identification_number: '', email: '', password: '', first_name: '', last_name: '',
    phone: '', birth_date: '', address: '', group_id: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [createClubId, setCreateClubId] = useState('');

  // Edit modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState(null);
  const [editForm, setEditForm] = useState({ birth_date: '', phone: '', address: '', group_id: '' });

  // Delete
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [athleteToDelete, setAthleteToDelete] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const openCreate = (defaultGroupId = '') => {
    setCreateForm({
      identification_number: '', email: '', password: '', first_name: '', last_name: '',
      phone: '', birth_date: '', address: '', group_id: defaultGroupId || ''
    });
    setConfirmPassword('');
    setPasswordError('');
    setIsCreateOpen(true);
  };

  useEffect(() => {
    const init = async () => {
      await fetchAll();
    };
    init();
  }, []);

  useEffect(() => {
    const openParam = searchParams.get('openCreate');
    const groupParam = searchParams.get('group_id');
    if (openParam === 'true' && !loading) {
      openCreate(groupParam);
    }
  }, [searchParams, loading]);

  const fetchAll = async () => {
    try {
      const [athletesData, groupsData, clubsData] = await Promise.all([
        athleteService.getAthletes(),
        groupService.getGroups(),
        clubService.getAllClubs()
      ]);
      setAthletes(athletesData || []);
      setGroups(groupsData || []);
      setClubs(clubsData || []);
    } catch (err) { showError(err.message || 'Error al cargar datos'); }
    finally { setLoading(false); }
  };

  const currentUser = authService.getCurrentUser();
  const clubGroups = groups.filter(g => parseInt(g.club_id) === parseInt(currentUser?.club_id));

  // Filter logic
  const filteredAthletes = athletes.filter(a => {
    const name = `${a.user?.first_name} ${a.user?.last_name}`.toLowerCase();
    const id = (a.user?.identification_number || '').toString();
    const phone = (a.phone || '').toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase()) || id.includes(searchTerm) || phone.includes(searchTerm);
    if (!matchesSearch) return false;

    if (filterStatus === 'active') return a.is_active !== false;
    if (filterStatus === 'inactive') return a.is_active === false;
    if (filterStatus === 'overdue') {
      // Check if athlete has overdue payments
      return a.is_overdue === true;
    }
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredAthletes.length / ITEMS_PER_PAGE);
  const paginatedAthletes = filteredAthletes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleCreateChange = e => {
    setCreateForm({ ...createForm, [e.target.name]: e.target.value });
    setPasswordError('');
  };

  const validatePassword = (pass) => {
    const errors = [];
    if (pass.length < 8) errors.push('Mínimo 8 caracteres');
    if (!/[A-Z]/.test(pass) && !/[a-z]/.test(pass)) errors.push('Debe contener letras');
    if (!/[0-9]/.test(pass)) errors.push('Al menos un número');
    return errors;
  };

  const handleCreateSubmit = async e => {
    e.preventDefault();
    setPasswordError('');
    if (createForm.password !== confirmPassword) {
      showError('Las contraseñas no coinciden');
      return;
    }
    const pwdErrors = validatePassword(createForm.password);
    if (pwdErrors.length > 0) {
      showError(pwdErrors.join('. '));
      return;
    }
    try {
      const payload = {
        identification_number: createForm.identification_number,
        email: createForm.email,
        password: createForm.password,
        first_name: createForm.first_name,
        last_name: createForm.last_name,
        role: 'ATHLETE',
        club_id: currentUser?.club_id,
        group_id: createForm.group_id ? parseInt(createForm.group_id) : null,
        phone: createForm.phone
      };
      await userService.createUser(payload);
      setIsCreateOpen(false);
      fetchAll();
      showSuccess('Atleta creado correctamente');
    } catch (err) { showError(err.message || 'Error al crear atleta'); }
  };

  const openEdit = (athlete) => {
    setEditingAthlete(athlete);
    setEditForm({
      birth_date: athlete.birth_date ? athlete.birth_date.split('T')[0] : '',
      phone: athlete.phone || '',
      address: athlete.address || '',
      group_id: athlete.current_groups?.[0]?.id || ''
    });
    setIsEditOpen(true);
  };

  const handleEditChange = e => setEditForm({ ...editForm, [e.target.name]: e.target.value });

  const handleEditSubmit = async e => {
    e.preventDefault();
    try {
      const payload = {
        athlete: {
          birth_date: editForm.birth_date,
          phone: editForm.phone,
          address: editForm.address
        },
        group_id: editForm.group_id ? parseInt(editForm.group_id) : null
      };
      await athleteService.updateAthlete(editingAthlete.id, payload);
      setIsEditOpen(false);
      fetchAll();
      showSuccess('Atleta actualizado correctamente');
    } catch (err) { showError(err.message || 'Error al guardar cambios'); }
  };

  const confirmDelete = async () => {
    if (!athleteToDelete) return;
    try {
      await athleteService.deleteAthlete(athleteToDelete.id);
      showSuccess('Atleta eliminado correctamente');
      fetchAll();
    } catch (err) { showError(err.message || 'Error al eliminar atleta'); }
    finally { setIsConfirmOpen(false); setAthleteToDelete(null); }
  };

  const getAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const totalActive = athletes.filter(a => a.is_active !== false).length;
  const totalInactive = athletes.filter(a => a.is_active === false).length;

  if (loading) return <div className="loading-state"><p>Cargando atletas...</p></div>;

  return (
    <div className="athlete-list-page">
      {/* Header */}
      <div className="header">
        <div>
          <h1>Atletas</h1>
          <p>Gestiona los perfiles, estados y asignaciones de los jugadores del club.</p>
        </div>
        <div className="header-actions">
          <div className="search-bar">
            🔍 <input type="text" placeholder="Buscar por nombre, ID o teléfono..."
              value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
          </div>
          <button className="btn-primary" onClick={openCreate}>+ Nuevo Atleta</button>
        </div>
      </div>

      {/* Mini KPIs */}
      <div className="kpi-mini-grid">
        <div className="mini-kpi">
          <div>
            <h3>Total Atletas</h3>
            <div className="val">{athletes.length}</div>
          </div>
          <div className="mini-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>👥</div>
        </div>
        <div className="mini-kpi">
          <div>
            <h3>Activos (Mes)</h3>
            <div className="val">{totalActive}</div>
          </div>
          <div className="mini-icon" style={{ background: '#ECFDF5', color: '#10B981' }}>🟢</div>
        </div>
        <div className="mini-kpi">
          <div>
            <h3>Inactivos / Suspendidos</h3>
            <div className="val">{totalInactive}</div>
          </div>
          <div className="mini-icon" style={{ background: '#FEF2F2', color: '#EF4444' }}>🔴</div>
        </div>
      </div>

      {/* Table Card */}
      <div className="table-card">
        <div className="table-filters">
          <div className="filter-pills">
            <div className={`filter-pill ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => { setFilterStatus('all'); setCurrentPage(1); }}>
              Todos ({athletes.length})
            </div>
            <div className={`filter-pill ${filterStatus === 'active' ? 'active' : ''}`}
              onClick={() => { setFilterStatus('active'); setCurrentPage(1); }}>
              Activos ({totalActive})
            </div>
            <div className={`filter-pill ${filterStatus === 'inactive' ? 'active' : ''}`}
              onClick={() => { setFilterStatus('inactive'); setCurrentPage(1); }}>
              Inactivos ({totalInactive})
            </div>
          </div>
          <div className="sort-info">
            Ordenar por: <span className="sort-value">Nombre A-Z ↓</span>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Atleta</th>
                <th>Identificación</th>
                <th>Contacto</th>
                <th>Grupo Asignado</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAthletes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-cell">No se encontraron atletas</td>
                </tr>
              ) : paginatedAthletes.map(a => {
                const age = getAge(a.birth_date);
                const groupName = a.current_groups?.[0]?.name || null;
                const isActive = a.is_active !== false;
                const colorIdx = (a.user?.first_name || 'A').charCodeAt(0) % 4;
                const avatarClasses = ['blue', 'green', 'purple', 'blue'];
                return (
                  <tr key={a.id}>
                    <td>
                      <div className="athlete-cell">
                        <div className={`athlete-avatar ${avatarClasses[colorIdx]}`}>
                          {initials(a.user?.first_name, a.user?.last_name)}
                        </div>
                        <div>
                          <div className="athlete-name">{a.user?.first_name} {a.user?.last_name}</div>
                          <div className="athlete-sub">{age ? `${age} años` : '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{a.user?.identification_number}</td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>
                        {a.phone ? `📞 ${a.phone}` : '—'}
                      </div>
                    </td>
                    <td>
                      {groupName ? (
                        <span className="group-badge">👥 {groupName}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sin grupo</span>
                      )}
                    </td>
                    <td>
                      <div className="status-badge" style={{ color: isActive ? 'var(--text-dark)' : 'var(--accent-red)' }}>
                        <div className={`status-dot ${isActive ? 'dot-green' : 'dot-red'}`}></div>
                        {isActive ? 'Activo' : 'Inactivo'}
                      </div>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button className="action-btn" title="Ver Perfil"
                          onClick={() => navigate(`/admin/athletes/${a.id}`)}>👁️</button>
                        <button className="action-btn" title="Editar"
                          onClick={() => openEdit(a)}>✏️</button>
                        {isActive ? (
                          <button className="action-btn danger" title="Desactivar"
                            onClick={() => { setAthleteToDelete(a); setIsConfirmOpen(true); }}>🗑️</button>
                        ) : (
                          <button className="action-btn" title="Reactivar"
                            style={{ color: '#10b981' }}
                            onClick={async () => {
                              try {
                                await athleteService.reactivateAthlete(a.id);
                                showSuccess('Atleta reactivado correctamente');
                                fetchAll();
                              } catch (err) { showError(err.message || 'Error al reactivar atleta'); }
                            }}>🔄</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredAthletes.length > ITEMS_PER_PAGE && (
          <div className="pagination">
            <span>Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredAthletes.length)} de {filteredAthletes.length} resultados</span>
            <div className="pagination-buttons">
              <button className="action-btn" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}>←</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button key={page}
                  className={`action-btn ${page === currentPage ? 'active-page' : ''}`}
                  onClick={() => setCurrentPage(page)}>
                  {page}
                </button>
              ))}
              <button className="action-btn" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}>→</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Crear Atleta */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Nuevo Atleta">
        <form onSubmit={handleCreateSubmit} style={{ display: 'contents' }}>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Nombres *</label>
              <input type="text" name="first_name" value={createForm.first_name} onChange={handleCreateChange} className="form-input" required placeholder="Laura" />
            </div>
            <div className="form-group">
              <label className="form-label">Apellidos *</label>
              <input type="text" name="last_name" value={createForm.last_name} onChange={handleCreateChange} className="form-input" required placeholder="Ospina" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Identificación *</label>
            <input type="text" name="identification_number" value={createForm.identification_number} onChange={handleCreateChange} className="form-input" required placeholder="1234567890" />
          </div>
          <div className="form-group">
            <label className="form-label">Email (Opcional)</label>
            <input type="email" name="email" value={createForm.email} onChange={handleCreateChange} className="form-input" placeholder="email@ejemplo.com" />
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Fecha de Nacimiento</label>
              <input type="date" name="birth_date" value={createForm.birth_date} onChange={handleCreateChange} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input type="text" name="phone" value={createForm.phone} onChange={handleCreateChange} className="form-input" placeholder="3001234567" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Dirección</label>
            <input type="text" name="address" value={createForm.address} onChange={handleCreateChange} className="form-input" placeholder="Carrera 45 #12-30" />
          </div>
          <div className="form-group">
            <label className="form-label">Asignar a Grupo</label>
            <select name="group_id" value={createForm.group_id} onChange={handleCreateChange} className="form-input">
              <option value="">Seleccionar Grupo</option>
              {clubGroups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.category})</option>)}
            </select>
          </div>
          <PasswordInput value={createForm.password} onChange={handleCreateChange} name="password" required showStrength label="Contraseña *" />
          <div className="form-group">
            <label className="form-label">Confirmar Contraseña *</label>
            <input type="password" name="confirmPassword" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setPasswordError(''); }}
              className="form-input" required placeholder="••••••••" minLength={6} />
          </div>
          {passwordError && <div className="badge badge-danger" style={{ marginBottom: '8px', padding: '10px 16px', borderRadius: '10px', display: 'block', fontSize: '0.8rem' }}>{passwordError}</div>}
          <div className="modal-footer" style={{ margin: '8px -24px -24px', padding: '16px 24px' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsCreateOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Crear Atleta</button>
          </div>
        </form>
      </Modal>

      {/* Modal Editar Atleta */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Editar ${editingAthlete?.user?.first_name}`}>
        <form onSubmit={handleEditSubmit} style={{ display: 'contents' }}>
          <div className="form-group">
            <label className="form-label">Fecha de Nacimiento</label>
            <input type="date" name="birth_date" value={editForm.birth_date} onChange={handleEditChange} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Teléfono</label>
            <input type="text" name="phone" value={editForm.phone} onChange={handleEditChange} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Dirección</label>
            <input type="text" name="address" value={editForm.address} onChange={handleEditChange} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Transferir a Grupo</label>
            <select name="group_id" value={editForm.group_id} onChange={handleEditChange} className="form-input">
              <option value="">-- Sin Grupo / Remover --</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div className="modal-footer" style={{ margin: '8px -24px -24px', padding: '16px 24px' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsEditOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar Cambios</button>
          </div>
        </form>
      </Modal>

      <ConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={confirmDelete}
        title="Desactivar Atleta" message={`¿Desactivar a ${athleteToDelete?.user?.first_name} ${athleteToDelete?.user?.last_name}? No podrá acceder al sistema hasta que sea reactivado.`} />
    </div>
  );
};

export default AthleteList;