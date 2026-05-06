import React, { useEffect, useState } from 'react';
import { athleteService } from '../../services/athleteService';
import ConfirmModal from '../../components/UI/ConfirmModal';
import Modal from '../../components/UI/Modal';

const COLORS = ['#3b82f6','#8b5cf6','#10b981','#f97316','#ec4899','#0ea5e9'];
const avatarColor = (name = '') => COLORS[name.charCodeAt(0) % COLORS.length];
const initials = (first = '?', last = '?') => `${first[0]}${last[0]}`.toUpperCase();

const AthleteList = () => {
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [athleteToDelete, setAthleteToDelete] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '', first_name: '', last_name: '', club_id: 1, birth_date: '', phone: ''
  });

  useEffect(() => { fetchAthletes(); }, []);

  const fetchAthletes = async () => {
    try {
      const data = await athleteService.getAthletes();
      setAthletes(data);
    } catch { setError('Failed to load athletes'); }
    finally { setLoading(false); }
  };

  const handleInputChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleCreateAthlete = async e => {
    e.preventDefault();
    try {
      await athleteService.createAthlete({
        user: { email: formData.email, first_name: formData.first_name, last_name: formData.last_name, club_id: parseInt(formData.club_id) },
        athlete: { birth_date: formData.birth_date, phone: formData.phone }
      });
      setIsCreateModalOpen(false);
      fetchAthletes();
      setFormData({ email: '', first_name: '', last_name: '', club_id: 1, birth_date: '', phone: '' });
    } catch (err) { setError(err.message || 'Error creating athlete'); }
  };

  const confirmDelete = async () => {
    console.log('Deleting athlete:', athleteToDelete?.id);
    setIsConfirmOpen(false);
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading athletes...</div>;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Athletes</h1>
          <p className="text-muted">Manage all registered athletes and their profiles.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>+ New Athlete</button>
      </div>

      {error && <div className="badge badge-danger" style={{ marginBottom: '16px', padding: '10px 16px', borderRadius: '10px', display: 'block' }}>{error}</div>}

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Athlete</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Club</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {athletes.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No athletes found</td></tr>
            ) : athletes.map(athlete => (
              <tr key={athlete.id}>
                <td>
                  <div className="table-cell-name">
                    <div className="table-avatar" style={{ background: avatarColor(athlete.user?.first_name || '') }}>
                      {initials(athlete.user?.first_name, athlete.user?.last_name)}
                    </div>
                    <div>
                      <strong>{athlete.user?.first_name} {athlete.user?.last_name}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>#{athlete.id}</div>
                    </div>
                  </div>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{athlete.user?.email}</td>
                <td>{athlete.phone || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                <td><span className="badge badge-primary">Club {athlete.user?.club_id}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-ghost btn-sm">Edit</button>
                    <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#b91c1c', border: 'none' }}
                      onClick={() => { setAthleteToDelete(athlete); setIsConfirmOpen(true); }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirm Delete */}
      <ConfirmModal
        isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={confirmDelete}
        title="Delete Athlete"
        message={`Are you sure you want to delete ${athleteToDelete?.user?.first_name}? This action cannot be undone.`}
      />

      {/* Create Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Athlete">
        <form onSubmit={handleCreateAthlete} style={{ display: 'contents' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Birth Date</label>
              <input type="date" name="birth_date" value={formData.birth_date} onChange={handleInputChange} className="form-input" required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="form-input" placeholder="555-1234" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Club ID</label>
            <input type="number" name="club_id" value={formData.club_id} onChange={handleInputChange} className="form-input" required />
          </div>
          <div className="modal-footer" style={{ margin: '8px -24px -24px', padding: '16px 24px' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Athlete</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AthleteList;
