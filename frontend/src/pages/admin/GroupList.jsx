import React, { useEffect, useState } from 'react';
import { groupService } from '../../services/groupService';
import Modal from '../../components/UI/Modal';

const COLORS = ['#3b82f6','#8b5cf6','#10b981','#f97316','#ec4899','#0ea5e9','#f59e0b'];
const groupColor = (name = '') => COLORS[name.charCodeAt(0) % COLORS.length];

const GroupList = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', club_id: 1, schedule: '' });

  useEffect(() => { fetchGroups(); }, []);

  const fetchGroups = async () => {
    try {
      const data = await groupService.getGroups();
      setGroups(data);
    } catch { setError('Failed to load groups'); }
    finally { setLoading(false); }
  };

  const handleInputChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleCreateGroup = async e => {
    e.preventDefault();
    try {
      await groupService.createGroup({ name: formData.name, club_id: parseInt(formData.club_id), schedule: formData.schedule });
      setIsModalOpen(false);
      fetchGroups();
      setFormData({ name: '', club_id: 1, schedule: '' });
    } catch (err) { setError(err.message || 'Error creating group'); }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading groups...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Groups</h1>
          <p className="text-muted">Manage training groups and their schedules.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>+ New Group</button>
      </div>

      {error && <div className="badge badge-danger" style={{ marginBottom: '16px', padding: '10px 16px', borderRadius: '10px', display: 'block' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {groups.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>No groups found.</p>
        ) : groups.map(group => (
          <div key={group.id} className="card" style={{ padding: '22px', cursor: 'default' }}>
            {/* Color accent bar */}
            <div style={{ width: 44, height: 44, borderRadius: 12, background: groupColor(group.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', marginBottom: 14 }}>
              👥
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 4 }}>{group.name}</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 14 }}>{group.schedule || 'No schedule set'}</p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid var(--border-color)' }}>
              <span className="badge badge-primary">{group.athletes_count ?? 0} Athletes</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm">Edit</button>
                <button className="btn btn-ghost btn-sm">Members</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Group">
        <form onSubmit={handleCreateGroup} style={{ display: 'contents' }}>
          <div className="form-group">
            <label className="form-label">Group Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="form-input" required placeholder="e.g. Soccer U-15" />
          </div>
          <div className="form-group">
            <label className="form-label">Club ID</label>
            <input type="number" name="club_id" value={formData.club_id} onChange={handleInputChange} className="form-input" required />
          </div>
          <div className="form-group">
            <label className="form-label">Schedule</label>
            <input type="text" name="schedule" value={formData.schedule} onChange={handleInputChange} className="form-input" placeholder="e.g. Mon/Wed/Fri 5PM" />
          </div>
          <div className="modal-footer" style={{ margin: '8px -24px -24px', padding: '16px 24px' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Group</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default GroupList;
