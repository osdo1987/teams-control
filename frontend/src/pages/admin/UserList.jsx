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

  const currentUser = authService.getCurrentUser();
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const filteredUsers = users.filter(u => {
    if (u.role === 'ATHLETE') return false;
    // Super admin solo ve ADMIN, admin normal ve todos excepto SUPER_ADMIN
    if (isSuperAdmin && u.role !== 'ADMIN') return false;
    const name = `${u.first_name} ${u.last_name}`.toLowerCase();
    const id = (u.identification_number || '').toString();
    const matchesSearch = name.includes(searchTerm.toLowerCase()) || id.includes(searchTerm);
    const matchesClub = selectedClubId === '' || parseInt(u.club_id) === parseInt(selectedClubId);
    return matchesSearch && matchesClub;
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

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

  if (loading) return <div className="loading-state"><p>Cargando usuarios...</p></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Gestión de Usuarios</h1>
          <p className="text-muted">Administra las cuentas de acceso al sistema y sus roles.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>+ Nuevo Usuario</button>
      </div>

      <div className="filter-row">
        <div className="search-field">
          <input
            type="text"
            placeholder="🔍 Buscar usuario por nombre o ID..."
            className="form-input"
            style={{ borderRadius: '12px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {authService.getCurrentUser()?.role === 'SUPER_ADMIN' && (
          <div className="filter-field">
            <select
              className="form-input"
              style={{ borderRadius: '12px' }}
              value={selectedClubId}
              onChange={(e) => setSelectedClubId(e.target.value)}
            >
              <option value="">🏢 Todos los Clubes</option>
              {clubs.map(club => (
                <option key={club.id} value={club.id}>{club.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Identificación</th>
              <th>Rol</th>
              <th>Club</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No se encontraron usuarios</td></tr>
            ) : filteredUsers.map(user => (
              <tr key={user.id}>
                <td>
                  <div className="table-cell-name">
                    <div className="table-avatar" style={{
                      background: avatarColor(user.first_name || 'U'),
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
                      {initials(user.first_name, user.last_name)}
                    </div>
                    <div>
                      <strong>{user.first_name} {user.last_name}</strong>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>#{user.id} {user.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{user.identification_number}</td>
                <td><span className={ROLE_BADGE[user.role] || 'badge badge-inactive'}>{user.role}</span></td>
                <td><span className="badge badge-primary">{user.club?.name || `Club ${user.club_id}`}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(user)}>Editar</button>
                    {user.is_active !== false ? (
                      <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#b91c1c', border: 'none' }}
                        onClick={() => { setUserToDelete(user); setIsConfirmOpen(true); }}>Eliminar</button>
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
