import React, { useEffect, useState } from 'react';
import { groupService } from '../../services/groupService';
import Modal from '../../components/UI/Modal';
import ConfirmModal from '../../components/UI/ConfirmModal';

const COLORS = ['#3b82f6','#8b5cf6','#10b981','#f97316','#ec4899','#0ea5e9','#f59e0b'];
const groupColor = (name = '') => COLORS[name.charCodeAt(0) % COLORS.length];

const GroupList = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
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

  const openCreateModal = () => {
    setEditingGroup(null);
    setFormData({ name: '', club_id: 1, schedule: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (group) => {
    setEditingGroup(group);
    setFormData({ name: group.name, club_id: group.club_id, schedule: group.schedule || '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const payload = { name: formData.name, club_id: parseInt(formData.club_id), schedule: formData.schedule };
      if (editingGroup) {
        await groupService.updateGroup(editingGroup.id, payload);
      } else {
        await groupService.createGroup(payload);
      }
      setIsModalOpen(false);
      fetchGroups();
    } catch (err) { setError(err.message || 'Error saving group'); }
  };

  const confirmDelete = async () => {
    if (!groupToDelete) return;
    try {
      await groupService.deleteGroup(groupToDelete.id);
      fetchGroups();
    } catch (err) {
      setError('Error deleting group');
    } finally {
      setIsConfirmOpen(false);
      setGroupToDelete(null);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading groups...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Groups</h1>
          <p className="text-muted">Manage training groups and their schedules.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>+ New Group</button>
      </div>

      {error && <div className="badge badge-danger" style={{ marginBottom: '16px', padding: '10px 16px', borderRadius: '10px', display: 'block' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {groups.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>No groups found.</p>
        ) : groups.map(group => (
          <div key={group.id} className="card" style={{ padding: '22px', cursor: 'default' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: groupColor(group.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', marginBottom: 14 }}>
                👥
              </div>
              <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#b91c1c', border: 'none' }} onClick={() => { setGroupToDelete(group); setIsConfirmOpen(true); }}>
                ✕
              </button>
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 4 }}>{group.name}</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 14 }}>{group.schedule || 'No schedule set'}</p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid var(--border-color)' }}>
              <span className="badge badge-primary">{group.athletes_count ?? group.athletes?.length ?? 0} Athletes</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(group)}>Edit</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={confirmDelete}
        title="Delete Group"
        message={`Are you sure you want to delete ${groupToDelete?.name}? This action will unassign all members.`}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingGroup ? "Edit Group" : "Create New Group"}>
        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
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
            <button type="submit" className="btn btn-primary">{editingGroup ? "Save Changes" : "Create Group"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default GroupList;
