import React, { useEffect, useState } from 'react';
import { athleteService } from '../../services/athleteService';
import { groupService } from '../../services/groupService';
import { api } from '../../services/api';
import ConfirmModal from '../../components/UI/ConfirmModal';
import Modal from '../../components/UI/Modal';

const COLORS = ['#3b82f6','#8b5cf6','#10b981','#f97316','#ec4899','#0ea5e9'];
const avatarColor = (name = '') => COLORS[name.charCodeAt(0) % COLORS.length];
const initials = (first = '?', last = '?') => `${first?.[0] || '?'}${last?.[0] || '?'}`.toUpperCase();

const AthleteList = () => {
  const [athletes, setAthletes] = useState([]);
  const [groups, setGroups] = useState([]);
  const [filteredAthletes, setFilteredAthletes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modales
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  const [athleteToDelete, setAthleteToDelete] = useState(null);
  const [editingAthlete, setEditingAthlete] = useState(null);
  const [movementHistory, setMovementHistory] = useState([]);

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
    setIsModalOpen(true);
  };

  const openHistoryModal = async (athlete) => {
    setEditingAthlete(athlete);
    setLoading(true);
    try {
      const history = await api(`/groups/history/athlete/${athlete.id}`);
      setMovementHistory(history);
      setIsHistoryModalOpen(true);
    } catch {
      setError('Error al cargar el historial de movimientos');
    } finally {
      setLoading(false);
    }
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
      setIsModalOpen(false);
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

  if (loading && athletes.length === 0) return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando atletas...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Atletas</h1>
          <p className="text-muted">Gestión de perfiles, transferencias y hoja de vida deportiva.</p>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="🔍 Buscar por nombre o identificación..."
          className="form-input"
          style={{ borderRadius: '12px' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
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
                    <div className="table-avatar" style={{ background: avatarColor(athlete.user?.first_name || '') }}>
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
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(athlete)}>Editar</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => openHistoryModal(athlete)}>📂 Movimientos</button>
                    <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#b91c1c', border: 'none' }}
                      onClick={() => { setAthleteToDelete(athlete); setIsConfirmOpen(true); }}>✕</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Edición / Transferencia */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Editar y Transferir Atleta">
        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div className="form-group">
            <label className="form-label">Transferir a Grupo</label>
            <select name="group_id" value={formData.group_id} onChange={handleInputChange} className="form-input">
              <option value="">-- Sin Grupo / Remover --</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Teléfono</label>
            <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="form-input" />
          </div>
          <div className="modal-footer" style={{ margin: '8px -24px -24px', padding: '16px 24px' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar Cambios</button>
          </div>
        </form>
      </Modal>

      {/* Modal de Historial de Movimientos */}
      <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title={`Historial de Movimientos: ${editingAthlete?.user?.first_name}`}>
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Acción</th>
                <th>Grupo</th>
              </tr>
            </thead>
            <tbody>
              {movementHistory.map(h => (
                <tr key={h.id}>
                  <td style={{ fontSize: '0.85rem' }}>{new Date(h.date).toLocaleDateString()}</td>
                  <td>
                    <span className={h.action === 'JOINED' ? 'badge badge-success' : 'badge badge-danger'}>
                      {h.action === 'JOINED' ? 'ENTRADA' : 'SALIDA'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{h.group_name}</td>
                </tr>
              ))}
              {movementHistory.length === 0 && (
                <tr><td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>No hay registros de movimientos previos.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="modal-footer" style={{ margin: '8px -24px -24px', padding: '16px 24px' }}>
          <button type="button" className="btn btn-primary" onClick={() => setIsHistoryModalOpen(false)}>Cerrar</button>
        </div>
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
