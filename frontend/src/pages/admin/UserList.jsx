import React, { useEffect, useState } from 'react';
import { userService } from '../../services/userService';
import { groupService } from '../../services/groupService';
import clubService from '../../services/clubService';
import { authService } from '../../services/authService';
import Modal from '../../components/UI/Modal';
import ConfirmModal from '../../components/UI/ConfirmModal';

const COLORS = ['#3b82f6','#8b5cf6','#10b981','#f97316','#ec4899','#0ea5e9'];
const avatarColor = (name = '') => COLORS[name.charCodeAt(0) % COLORS.length];
const initials = (f = '?', l = '?') => `${f?.[0] || '?'}${l?.[0] || '?'}`.toUpperCase();

const ROLE_BADGE = {
  ADMIN:   'badge badge-danger',
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
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [formData, setFormData] = useState({ ...INITIAL_FORM });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClubId, setSelectedClubId] = useState('');

  const filteredUsers = users.filter(u => {
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
    try {
      const [usersData, clubsData, groupsData] = await Promise.all([
        userService.getUsers(),
        clubService.getAllClubs(),
        groupService.getGroups()
      ]);
      setUsers(usersData);
      setClubs(clubsData);
      setGroups(groupsData);
    } catch { 
      setError('Error al cargar datos iniciales'); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleInputChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const openCreateModal = () => {
    const currentUser = authService.getCurrentUser();
    setEditingUser(null);
    
    // Si es ADMIN, bloquear a su club. Si es SUPER_ADMIN, permitir elegir.
    const defaultClubId = currentUser.role === 'ADMIN' ? currentUser.club_id : (clubs[0]?.id || '');
    
    setFormData({ 
      ...INITIAL_FORM, 
      club_id: defaultClubId 
    });
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
      group_id: user.athlete_profile?.current_groups?.[0]?.id || '',
      phone: user.phone || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const payload = { 
        ...formData, 
        club_id: parseInt(formData.club_id),
        group_id: formData.group_id ? parseInt(formData.group_id) : null
      };
      if (!payload.password && editingUser) delete payload.password;

      if (editingUser) {
        await userService.updateUser(editingUser.id, payload);
      } else {
        await userService.createUser(payload);
      }
      setIsModalOpen(false);
      fetchInitialData();
    } catch (err) { setError(err.message || 'Error al guardar usuario'); }
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await userService.deleteUser(userToDelete.id);
      fetchInitialData();
    } catch (err) {
      setError('Error al eliminar usuario');
    } finally {
      setIsConfirmOpen(false);
      setUserToDelete(null);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando usuarios...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Gestión de Usuarios</h1>
          <p className="text-muted">Administra las cuentas de acceso al sistema y sus roles.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>+ Nuevo Usuario</button>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '12px' }}>
        <div style={{ flex: 1 }}>
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
          <div style={{ width: '250px' }}>
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

      {error && <div className="badge badge-danger" style={{ marginBottom: '16px', padding: '10px 16px', borderRadius: '10px', display: 'block' }}>{error}</div>}

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
                    <div className="table-avatar" style={{ background: avatarColor(user.first_name || 'U') }}>
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
                    <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#b91c1c', border: 'none' }}
                      onClick={() => { setUserToDelete(user); setIsConfirmOpen(true); }}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={confirmDelete}
        title="Eliminar Usuario"
        message={`¿Está seguro de que desea eliminar a ${userToDelete?.first_name}? Esta acción eliminará su acceso al sistema.`}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? "Editar Usuario" : "Crear Nuevo Usuario"}>
        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
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
          <div className="form-group">
            <label className="form-label">Contraseña {editingUser && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>(Dejar vacío para mantener)</span>}</label>
            <input type="password" name="password" value={formData.password} onChange={handleInputChange} className="form-input" required={!editingUser} placeholder="••••••••" />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Rol</label>
              <select name="role" value={formData.role} onChange={handleInputChange} className="form-input">
                <option value="ADMIN">Administrador</option>
                <option value="TRAINER">Entrenador</option>
                <option value="ATHLETE">Atleta</option>
                <option value="SUPER_ADMIN">Super Admin</option>
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
          {formData.role === 'ATHLETE' && (
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
