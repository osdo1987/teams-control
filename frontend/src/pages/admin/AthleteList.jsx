import React, { useEffect, useState } from 'react';
import { athleteService } from '../../services/athleteService';
import ConfirmModal from '../../components/UI/ConfirmModal';
import Modal from '../../components/UI/Modal';

const COLORS = ['#3b82f6','#8b5cf6','#10b981','#f97316','#ec4899','#0ea5e9'];
const avatarColor = (name = '') => COLORS[name.charCodeAt(0) % COLORS.length];
const initials = (first = '?', last = '?') => `${first?.[0] || '?'}${last?.[0] || '?'}`.toUpperCase();

const AthleteList = () => {
  const [athletes, setAthletes] = useState([]);
  const [filteredAthletes, setFilteredAthletes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [athleteToDelete, setAthleteToDelete] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState(null);
  const [formData, setFormData] = useState({
    birth_date: '', phone: '', address: ''
  });

  useEffect(() => { fetchAthletes(); }, []);

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

  const handleInputChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const openEditModal = (athlete) => {
    setEditingAthlete(athlete);
    setFormData({
      birth_date: athlete.birth_date ? athlete.birth_date.split('T')[0] : '',
      phone: athlete.phone || '',
      address: athlete.address || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const payload = {
        athlete: { ...formData }
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
    } catch (err) {
      setError('Error al eliminar atleta');
    } finally {
      setIsConfirmOpen(false);
      setAthleteToDelete(null);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando atletas...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Atletas</h1>
          <p className="text-muted">Gestiona los perfiles y datos de los atletas registrados.</p>
        </div>
      </div>

      <div style={{ marginBottom: '20px', position: 'relative' }}>
        <input
          type="text"
          placeholder="🔍 Buscar por nombre o identificación..."
          className="form-input"
          style={{ paddingLeft: '40px', borderRadius: '12px' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}></span>
      </div>

      {error && <div className="badge badge-danger" style={{ marginBottom: '16px', padding: '10px 16px', borderRadius: '10px', display: 'block' }}>{error}</div>}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Atleta</th>
              <th>Identificación</th>
              <th>Teléfono</th>
              <th>Club</th>
              <th>Grupo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredAthletes.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No se encontraron atletas</td></tr>
            ) : filteredAthletes.map(athlete => (
              <tr key={athlete.id}>
                <td>
                  <div className="table-cell-name">
                    <div className="table-avatar" style={{ background: avatarColor(athlete.user?.first_name || '') }}>
                      {initials(athlete.user?.first_name, athlete.user?.last_name)}
                    </div>
                    <div>
                      <strong>{athlete.user?.first_name} {athlete.user?.last_name}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{athlete.user?.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{athlete.user?.identification_number}</td>
                <td>{athlete.phone || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                <td><span className="badge badge-primary">{athlete.user?.club?.name || `Club ${athlete.user?.club_id}`}</span></td>
                <td>
                  {athlete.current_groups && athlete.current_groups.length > 0 ? (
                    athlete.current_groups.map(g => (
                      <span key={g.id} className="badge badge-success" style={{ marginRight: 4 }}>{g.name}</span>
                    ))
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sin grupo</span>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(athlete)}>Perfil</button>
                    <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#b91c1c', border: 'none' }}
                      onClick={() => { setAthleteToDelete(athlete); setIsConfirmOpen(true); }}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={confirmDelete}
        title="Eliminar Atleta"
        message={`¿Está seguro de que desea eliminar a ${athleteToDelete?.user?.first_name}?`}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Editar Perfil de Atleta">
        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div className="form-group">
            <label className="form-label">Fecha de Nacimiento</label>
            <input type="date" name="birth_date" value={formData.birth_date} onChange={handleInputChange} className="form-input" required />
          </div>
          <div className="form-group">
            <label className="form-label">Teléfono</label>
            <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="form-input" placeholder="555-1234" />
          </div>
          <div className="form-group">
            <label className="form-label">Dirección</label>
            <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="form-input" placeholder="Calle 123..." />
          </div>
          <div className="modal-footer" style={{ margin: '8px -24px -24px', padding: '16px 24px' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar Cambios</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AthleteList;
