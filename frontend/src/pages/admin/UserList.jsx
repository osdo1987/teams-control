import React, { useEffect, useState } from 'react';
import { userService } from '../../services/userService';
import Modal from '../../components/UI/Modal';
import ConfirmModal from '../../components/UI/ConfirmModal';

const COLORS = ['#3b82f6','#8b5cf6','#10b981','#f97316','#ec4899','#0ea5e9'];
const avatarColor = (name = '') => COLORS[name.charCodeAt(0) % COLORS.length];
const initials = (f = '?', l = '?') => `${f?.[0] || '?'}${l?.[0] || '?'}`.toUpperCase();

const ROLE_BADGE = {
  ADMIN:   'badge badge-danger',
  TRAINER: 'badge badge-primary',
  ATHLETE: 'badge badge-success',
  SUPER_ADMIN: 'badge badge-primary', // Fallback
};

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [formData, setFormData] = useState({ email: '', password: '', first_name: '', last_name: '', role: 'ATHLETE', club_id: 1 });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try { const data = await userService.getUsers(); setUsers(data); }
    catch { setError('Failed to load users'); }
    finally { setLoading(false); }
  };

  const handleInputChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ email: '', password: '', first_name: '', last_name: '', role: 'ATHLETE', club_id: 1 });
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '', // Leave empty if not changing
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      club_id: user.club_id || 1
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const payload = { ...formData, club_id: parseInt(formData.club_id) };
      if (!payload.password && editingUser) delete payload.password;

      if (editingUser) {
        await userService.updateUser(editingUser.id, payload);
      } else {
        await userService.createUser(payload);
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) { setError(err.message || 'Error saving user'); }
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await userService.deleteUser(userToDelete.id);
      fetchUsers();
    } catch (err) {
      setError('Error deleting user');
    } finally {
      setIsConfirmOpen(false);
      setUserToDelete(null);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading users...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Users &amp; Trainers</h1>
          <p className="text-muted">Manage system accounts, roles and access.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>+ New User</button>
      </div>

      {error && <div className="badge badge-danger" style={{ marginBottom: '16px', padding: '10px 16px', borderRadius: '10px', display: 'block' }}>{error}</div>}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Club</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No users found</td></tr>
            ) : users.map(user => (
              <tr key={user.id}>
                <td>
                  <div className="table-cell-name">
                    <div className="table-avatar" style={{ background: avatarColor(user.first_name || user.email) }}>
                      {initials(user.first_name, user.last_name)}
                    </div>
                    <div>
                      <strong>{user.first_name} {user.last_name}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>#{user.id}</div>
                    </div>
                  </div>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{user.email}</td>
                <td><span className={ROLE_BADGE[user.role] || 'badge badge-inactive'}>{user.role}</span></td>
                <td><span className="badge badge-primary">{user.club_id ? `Club ${user.club_id}` : 'Global'}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(user)}>Edit</button>
                    <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#b91c1c', border: 'none' }}
                      onClick={() => { setUserToDelete(user); setIsConfirmOpen(true); }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={confirmDelete}
        title="Delete User"
        message={`Are you sure you want to delete ${userToDelete?.first_name}? This will remove their access to the system.`}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? "Edit User" : "Create New User"}>
        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input type="text" name="first_name" value={formData.first_name} onChange={handleInputChange} className="form-input" required placeholder="John" />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input type="text" name="last_name" value={formData.last_name} onChange={handleInputChange} className="form-input" required placeholder="Doe" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="form-input" required placeholder="john@example.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Password {editingUser && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>(Leave empty to keep current)</span>}</label>
            <input type="password" name="password" value={formData.password} onChange={handleInputChange} className="form-input" required={!editingUser} placeholder="••••••••" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select name="role" value={formData.role} onChange={handleInputChange} className="form-input">
                <option value="ADMIN">Admin</option>
                <option value="TRAINER">Trainer</option>
                <option value="ATHLETE">Athlete</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Club ID</label>
              <input type="number" name="club_id" value={formData.club_id} onChange={handleInputChange} className="form-input" required />
            </div>
          </div>
          <div className="modal-footer" style={{ margin: '8px -24px -24px', padding: '16px 24px' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editingUser ? "Save Changes" : "Create User"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserList;
