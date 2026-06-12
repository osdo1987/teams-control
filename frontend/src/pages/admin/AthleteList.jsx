import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { athleteService } from '../../services/athleteService';
import { groupService } from '../../services/groupService';
import ConfirmModal from '../../components/UI/ConfirmModal';
import Modal from '../../components/UI/Modal';

const COLORS = ['#3b82f6','#8b5cf6','#10b981','#f97316','#ec4899','#0ea5e9'];
const avatarColor = (name = '') => COLORS[name.charCodeAt(0) % COLORS.length];
const initials = (first = '?', last = '?') => `${first?.[0] || '?'}${last?.[0] || '?'}`.toUpperCase();

const AthleteList = () => {
  const navigate = useNavigate();
  const [athletes, setAthletes] = useState([]);
  const [groups, setGroups] = useState([]);
  const [filteredAthletes, setFilteredAthletes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [athleteToDelete, setAthleteToDelete] = useState(null);
  const [editingAthlete, setEditingAthlete] = useState(null);

  const [formData, setFormData] = useState({
    birth_date: '', phone: '', address: '', group_id: ''
  });

  useEffect(() => { 
    fetchAthletes();
    fetchGroups();
  }, []);

  useEffect(() => {
    const results = athletes.filter(a => {
      const name = `${a.user?.first_name} ${a.user?.last_name}`.toLowerCase();
      const id = (a.user?.identification_number || '').toString();
      return name.includes(searchTerm.toLowerCase()) || id.includes(searchTerm);
    });
    setFilteredAthletes(results);
  }, [searchTerm, athletes]);

  const fetchAthletes = async () => {
    try {
      const data = await athleteService.getAthletes();
      setAthletes(data);
      setFilteredAthletes(data);
    } catch { setError('Error al cargar atletas'); }
    finally { setLoading(false); }
  };

  const fetchGroups = async () => {
    try {
      const data = await groupService.getGroups();
      setGroups(data);
    } catch { /* Fail silently */ }
  };

  const handleInputChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const openEditModal = (athlete) => {
    setEditingAthlete(athlete);
    setFormData({
      birth_date: athlete.birth_date ? athlete.birth_date.split('T')[0] : '',
      phone: athlete.phone || '',
      address: athlete.address || '',
      group_id: athlete.current_groups?.[0]?.id || ''
    });
    setIsEditModalOpen(true);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const payload = {
        athlete: { 
          birth_date: formData.birth_date,
          phone: formData.phone,
          address: formData.address
        },
        group_id: formData.group_id ? parseInt(formData.group_id) : null
      };
      await athleteService.updateAthlete(editingAthlete.id, payload);
      setIsEditModalOpen(false);
      fetchAthletes();
    } catch (err) { setError(err.message || 'Error al guardar cambios'); }
  };

  const confirmDelete = async () => {
    if (!athleteToDelete) return;
    try {
      await athleteService.deleteAthlete(athleteToDelete.id);
      fetchAthletes();
    } catch (err) { setError('Error al eliminar atleta'); }
    finally {
      setIsConfirmOpen(false);
      setAthleteToDelete(null);
    }
  };

  if (loading && athletes.length === 0) return <div className="loading-state"><p>Cargando atletas...</p></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Atletas</h1>
          <p className="text-muted">Gestión de perfiles, transferencias y hoja de vida deportiva.</p>
        </div>
      </div>

      <div className="filter-row" style={{ marginBottom: '20px' }}>
        <div className="search-field">
          <input
            type="text"
            placeholder="🔍 Buscar por nombre o identificación..."
            className="form-input"
            style={{ borderRadius: '12px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="badge badge-danger" style={{ marginBottom: '16px', width: '100%' }}>{error}</div>}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Atleta</th>
              <th>Identificación</th>
              <th>Grupo Actual</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredAthletes.map(athlete => (
              <tr key={athlete.id}>
                <td>
                  <div className="table-cell-name">
                    <div className="table-avatar" style={{ background: avatarColor(athlete.user?.first_name || ''),
                        width: '40px', height: '40px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: '600', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                      {initials(athlete.user?.first_name, athlete.user?.last_name)}
                    </div>
                    <div>
                      <strong>{athlete.user?.first_name} {athlete.user?.last_name}</strong>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{athlete.user?.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ fontWeight: 600 }}>{athlete.user?.identification_number}</td>
                <td>
                  {athlete.current_groups && athlete.current_groups.length > 0 ? (
                    athlete.current_groups.map(g => <span key={g.id} className="badge badge-success">{g.name}</span>)
                  ) : <span style={{ opacity: 0.5 }}>Sin grupo</span>}
                </td>
                <td>
                  <div className="actions-group">
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/admin/athletes/${athlete.id}`)}>👁 Ver Perfil</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(athlete)}>✏️ Editar</button>
                    <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#b91c1c', border: 'none' }}
                      onClick={() => { setAthleteToDelete(athlete); setIsConfirmOpen(true); }}>✕</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Edición */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Atleta">
        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div className="form-group">
            <label className="form-label">Fecha de Nacimiento</label>
            <input type="date" name="birth_date" value={formData.birth_date} onChange={handleInputChange} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Teléfono</label>
            <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Dirección</label>
            <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Transferir a Grupo</label>
            <select name="group_id" value={formData.group_id} onChange={handleInputChange} className="form-input">
              <option value="">-- Sin Grupo / Remover --</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div className="modal-footer" style={{ margin: '8px -24px -24px', padding: '16px 24px' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsEditModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar Cambios</button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={confirmDelete}
        title="Eliminar Atleta"
        message={`¿Eliminar permanentemente a ${athleteToDelete?.user?.first_name}?`}
      />
    </div>
  );
};

export default AthleteList;