import React, { useEffect, useState } from 'react';
import { userService } from '../../services/userService';
import { groupService } from '../../services/groupService';
import clubService from '../../services/clubService';
import { authService } from '../../services/authService';
import Modal from '../../components/UI/Modal';
import { useToast } from '../../contexts/ToastContext';
import ConfirmModal from '../../components/UI/ConfirmModal';
import PasswordInput from '../../components/UI/PasswordInput';
import { IconEye, IconEyeOff } from '../../components/Icons';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f97316', '#ec4899', '#0ea5e9'];
const avatarColor = (name = '') => COLORS[name.charCodeAt(0) % COLORS.length];
const initials = (f = '?', l = '?') => `${f?.[0] || '?'}${l?.[0] || '?'}`.toUpperCase();

const ROLE_BADGE = {
  ADMIN: 'badge badge-danger',
  TRAINER: 'badge badge-primary',
  ATHLETE: 'badge badge-success',
  SUPER_ADMIN: 'badge badge-primary',
};

const INITIAL_FORM = {
  identification_number: '',
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  role: 'ATHLETE',
  club_id: '',
  group_id: '',
  phone: ''
};

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showError, showSuccess } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [formData, setFormData] = useState({ ...INITIAL_FORM });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClubId, setSelectedClubId] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const currentUser = authService.getCurrentUser();
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const filteredUsers = users.filter(u => {
    // No mostrar atletas ni entrenadores en la sección de Usuarios
    if (u.role === 'ATHLETE' || u.role === 'TRAINER') return false;
    // Admin normal no ve SUPER_ADMIN
    if (!isSuperAdmin && u.role === 'SUPER_ADMIN') return false;
    const name = `${u.first_name} ${u.last_name}`.toLowerCase();
    const id = (u.identification_number || '').toString();
    const matchesSearch = name.includes(searchTerm.toLowerCase()) || id.includes(searchTerm);
    const matchesClub = selectedClubId === '' || parseInt(u.club_id) === parseInt(selectedClubId);
    if (!matchesSearch || !matchesClub) return false;
    if (filterStatus === 'active') return u.is_active !== false;
    if (filterStatus === 'inactive') return u.is_active === false;
    return true;
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, selectedClubId]);

  const fetchInitialData = async () => {
    // clearMessages(); // No longer needed with toast
    try {
      const [usersData, clubsData, groupsData] = await Promise.all([
        userService.getUsers(),
        clubService.getAllClubs(),
        groupService.getGroups()
      ]);
      setUsers(usersData || []);
      setClubs(clubsData || []);
      setGroups(groupsData || []);
    } catch (err) {
      showError(err.message || 'Error al cargar datos. Verifique la conexión.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setPasswordError('');
  };

  const openCreateModal = () => {
    const currentUser = authService.getCurrentUser();
    setEditingUser(null);

    // Si es ADMIN, bloquear a su club. Si es SUPER_ADMIN, permitir elegir.
    const defaultClubId = currentUser.role === 'ADMIN' ? currentUser.club_id : (clubs[0]?.id || '');

    setFormData({
      ...INITIAL_FORM,
      role: isSuperAdmin ? 'ADMIN' : 'ATHLETE',
      club_id: defaultClubId
    });
    setConfirmPassword('');
    setPasswordError('');
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      identification_number: user.identification_number || '',
      email: user.email || '',
      password: '',
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      club_id: user.club_id || '',
      group_id: '',
      phone: user.phone || ''
    });
    setConfirmPassword('');
    setPasswordError('');
    setIsModalOpen(true);
  };

  const validatePassword = (pass) => {
    const errors = [];
    if (pass.length < 6) errors.push('Mínimo 6 caracteres');
    if (!/[A-Z]/.test(pass) && !/[a-z]/.test(pass)) errors.push('Debe contener letras');
    if (!/[0-9]/.test(pass)) errors.push('Debe contener al menos un número');
    return errors;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setPasswordError('');

    // Validar password al crear usuario o al cambiarlo
    if (!editingUser || (editingUser && formData.password)) {
      if (formData.password !== confirmPassword) {
        setPasswordError('Las contraseñas no coinciden');
        return;
      }
      const pwdErrors = validatePassword(formData.password);
      if (pwdErrors.length > 0) {
        setPasswordError(pwdErrors.join('. '));
        return;
      }
    }

    try {
      const payload = {
        ...formData,
        club_id: parseInt(formData.club_id)
      };
      // Solo incluir group_id para ATHLETE
      if (formData.role === 'ATHLETE') {
        payload.group_id = formData.group_id ? parseInt(formData.group_id) : null;
      }
      if (!payload.password && editingUser) delete payload.password;

      if (editingUser) {
        await userService.updateUser(editingUser.id, payload);
        // Recargar datos completos después de editar
        setConfirmPassword('');
        const usersData = await userService.getUsers();
        setUsers(usersData || []);
        setIsModalOpen(false);
      } else {
        await userService.createUser(payload);
        // Agregar el nuevo usuario directamente al state sin refetch
        showSuccess('Usuario creado correctamente');
        setConfirmPassword('');
        setIsModalOpen(false);
        fetchInitialData(); // Refetch to get full user data including club name
      }
    } catch (err) {
      showError(err.message || 'Error al guardar usuario');
    }
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await userService.deleteUser(userToDelete.id);
      showSuccess('Usuario eliminado correctamente');
      fetchInitialData();
    } catch (err) {
      showError(err.message || 'Error al eliminar usuario');
    } finally {
      setIsConfirmOpen(false);
      setUserToDelete(null);
    }
  };

  const totalActive = filteredUsers.filter(u => u.is_active !== false).length;
  const totalInactive = filteredUsers.filter(u => u.is_active === false).length;

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const getPageNumbers = () => {
    const pages = [];
    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
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

  if (loading) return <div className="loading-state"><p>Cargando usuarios...</p></div>;

  return (
    <div className="athlete-list-page">
      {/* Header */}
      <div className="header">
        <div>
          <h1>Usuarios</h1>
          <p>Gestiona las cuentas de acceso al sistema y sus roles.</p>
        </div>
        <div className="header-actions">
          <div className="search-bar">
            🔍 <input type="text" placeholder="Buscar por nombre o identificación..."
              value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
          </div>
          {isSuperAdmin && (
            <div className="filter-field" style={{ minWidth: '200px' }}>
              <select
                className="form-input"
                value={selectedClubId}
                onChange={(e) => setSelectedClubId(e.target.value)}
                style={{ borderRadius: '12px' }}
              >
                <option value="">🏢 Todos los Clubes</option>
                {clubs.map(club => (
                  <option key={club.id} value={club.id}>{club.name}</option>
                ))}
              </select>
            </div>
          )}
          <button className="btn-primary" onClick={openCreateModal}>+ Nuevo Usuario</button>
        </div>
      </div>

      {/* Mini KPIs */}
      <div className="kpi-mini-grid">
        <div className="mini-kpi">
          <div>
            <h3>Total Usuarios</h3>
            <div className="val">{filteredUsers.length}</div>
          </div>
          <div className="mini-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>👥</div>
        </div>
        <div className="mini-kpi">
          <div>
            <h3>Activos</h3>
            <div className="val">{totalActive}</div>
          </div>
          <div className="mini-icon" style={{ background: '#ECFDF5', color: '#10B981' }}>🟢</div>
        </div>
        <div className="mini-kpi">
          <div>
            <h3>Inactivos</h3>
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
              Todos ({filteredUsers.length})
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
                <th>Usuario</th>
                <th>Identificación</th>
                <th>Rol</th>
                <th>Club</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-cell">No se encontraron usuarios</td>
                </tr>
              ) : paginatedUsers.map(user => (
                <tr key={user.id}>
                  <td>
                    <div className="table-cell-name">
                      <div className="table-avatar" style={{
                        background: avatarColor(user.first_name || 'U'), width: '40px', height: '40px',
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: '600', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                      }}>{initials(user.first_name, user.last_name)}</div>
                      <div>
                        <strong>{user.first_name} {user.last_name}</strong>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>#{user.id} · {user.email || 'Sin email'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{user.identification_number}</td>
                  <td><span className={ROLE_BADGE[user.role] || 'badge badge-inactive'}>{user.role}</span></td>
                  <td><span className="badge badge-primary">{user.club?.name || `Club ${user.club_id}`}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(user)}>✏️ Editar</button>
                      {user.is_active !== false ? (
                        <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#b91c1c', border: 'none' }}
                          onClick={() => { setUserToDelete(user); setIsConfirmOpen(true); }}>✕</button>
                      ) : (
                        <button className="btn btn-sm btn-success"
                          onClick={async () => {
                            try {
                              await userService.reactivateUser(user.id);
                              showSuccess('Usuario reactivado correctamente');
                              fetchInitialData();
                            } catch (err) { showError(err.message || 'Error al reactivar usuario'); }
                          }}>Reactivar</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredUsers.length > ITEMS_PER_PAGE && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 20px',
            borderTop: '1px solid var(--border-main)'
          }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} de {filteredUsers.length} usuarios
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
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={confirmDelete}
        title="Desactivar Usuario"
        message={`¿Desactivar a ${userToDelete?.first_name} ${userToDelete?.last_name}? No podrá iniciar sesión hasta que sea reactivado.`}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? "Editar Usuario" : "Crear Nuevo Usuario"}>
        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Nombres</label>
              <input type="text" name="first_name" value={formData.first_name} onChange={handleInputChange} className="form-input" required placeholder="Juan" />
            </div>
            <div className="form-group">
              <label className="form-label">Apellidos</label>
              <input type="text" name="last_name" value={formData.last_name} onChange={handleInputChange} className="form-input" required placeholder="Pérez" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Número de Identificación</label>
            <input type="text" name="identification_number" value={formData.identification_number} onChange={handleInputChange} className="form-input" required placeholder="1234567890" />
          </div>
          <div className="form-group">
            <label className="form-label">Email (Opcional)</label>
            <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="form-input" placeholder="email@ejemplo.com" />
          </div>
          <PasswordInput
            value={formData.password}
            onChange={handleInputChange}
            name="password"
            required={!editingUser}
            showStrength={false}
            label={<>Contraseña {editingUser && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>(Dejar vacío para mantener)</span>}</>}
          />
          <div className="form-group">
            <label className="form-label">Confirmar Contraseña</label>
            <input
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={e => { setConfirmPassword(e.target.value); setPasswordError(''); }}
              className="form-input"
              required={!editingUser}
              placeholder="••••••••"
              minLength={6}
            />
          </div>
          {passwordError && (
            <div className="badge badge-danger" style={{ marginBottom: '8px', padding: '10px 16px', borderRadius: '10px', display: 'block', fontSize: '0.8rem' }}>
              {passwordError}
            </div>
          )}

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Rol</label>
              <select name="role" value={formData.role} onChange={handleInputChange} className="form-input">
                <option value="ADMIN">Administrador</option>
                {!isSuperAdmin && <option value="TRAINER">Entrenador</option>}
                {!isSuperAdmin && <option value="ATHLETE">Atleta</option>}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Club</label>
              <select
                name="club_id"
                value={formData.club_id}
                onChange={handleInputChange}
                className="form-input"
                required
                disabled={authService.getCurrentUser()?.role !== 'SUPER_ADMIN'}
              >
                <option value="">Seleccionar Club</option>
                {clubs.map(club => (
                  <option key={club.id} value={club.id}>{club.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Selector de Grupo - Solo para Atletas */}
          {formData.role === 'ATHLETE' && !isSuperAdmin && (
            <div className="form-group">
              <label className="form-label">Asignar a Grupo</label>
              <select name="group_id" value={formData.group_id} onChange={handleInputChange} className="form-input" required={!editingUser}>
                <option value="">Seleccionar Grupo</option>
                {groups.filter(g => parseInt(g.club_id) === parseInt(formData.club_id)).map(group => (
                  <option key={group.id} value={group.id}>{group.name} ({group.category})</option>
                ))}
              </select>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 4, display: 'block' }}>
                * Los atletas deben pertenecer a un grupo.
              </span>
            </div>
          )}

          <div className="modal-footer" style={{ margin: '8px -24px -24px', padding: '16px 24px' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">{editingUser ? "Guardar Cambios" : "Crear Usuario"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserList;
