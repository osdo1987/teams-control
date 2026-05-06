import React, { useEffect, useState } from 'react';
import { userService } from '../../services/userService';
import Modal from '../../components/UI/Modal';

const COLORS = ['#3b82f6','#8b5cf6','#10b981','#f97316','#ec4899','#0ea5e9'];
const avatarColor = (name = '') => COLORS[name.charCodeAt(0) % COLORS.length];
const initials = (f = '?', l = '?') => `${f[0]}${l[0]}`.toUpperCase();

const ROLE_BADGE = {
  ADMIN:   'badge badge-danger',
  TRAINER: 'badge badge-primary',
  ATHLETE: 'badge badge-success',
};

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', first_name: '', last_name: '', role: 'ATHLETE', club_id: 1 });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try { const data = await userService.getUsers(); setUsers(data); }
    catch { setError('Failed to load users'); }
    finally { setLoading(false); }
  };

  const handleInputChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleCreateUser = async e => {
    e.preventDefault();
    try {
      await userService.createUser({ ...formData, club_id: parseInt(formData.club_id) });
      setIsModalOpen(false); fetchUsers();
    } catch (err) { setError(err.message || 'Error creating user'); }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading users...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Users &amp; Trainers</h1>
          <p className="text-muted">Manage system accounts, roles and access.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>+ New User</button>
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
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No users found</td></tr>
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
                <td><span className="badge badge-primary">Club {user.club_id}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New User">
        <form onSubmit={handleCreateUser} style={{ display: 'contents' }}>
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
            <label className="form-label">Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleInputChange} className="form-input" required placeholder="••••••••" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select name="role" value={formData.role} onChange={handleInputChange} className="form-input">
                <option value="ADMIN">Admin</option>
                <option value="TRAINER">Trainer</option>
                <option value="ATHLETE">Athlete</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Club ID</label>
              <input type="number" name="club_id" value={formData.club_id} onChange={handleInputChange} className="form-input" required />
            </div>
          </div>
          <div className="modal-footer" style={{ margin: '8px -24px -24px', padding: '16px 24px' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create User</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserList;
