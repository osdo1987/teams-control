import React, { useState, useEffect } from 'react';
import clubService from '../../services/clubService';
import Modal from '../../components/UI/Modal';
import ConfirmModal from '../../components/UI/ConfirmModal';

const ClubList = () => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [clubToDelete, setClubToDelete] = useState(null);
  const [editingClub, setEditingClub] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    description: '', 
    sport: 'Fútbol',
    subscription_status: 'TRIAL',
    plan_type: 'BASIC',
    subscription_end_date: ''
  });

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      const data = await clubService.getAllClubs();
      setClubs(data);
    } catch (error) {
      console.error('Error fetching clubs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (club = null) => {
    if (club) {
      setEditingClub(club);
      setFormData({ 
        name: club.name, 
        description: club.description || '',
        sport: club.sport || 'Fútbol',
        subscription_status: club.subscription_status || 'TRIAL',
        plan_type: club.plan_type || 'BASIC',
        subscription_end_date: club.subscription_end_date ? club.subscription_end_date.split('T')[0] : ''
      });
    } else {
      setEditingClub(null);
      setFormData({ 
        name: '', 
        description: '', 
        sport: 'Fútbol',
        subscription_status: 'TRIAL',
        plan_type: 'BASIC',
        subscription_end_date: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0] // 30 days default
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClub) {
        await clubService.updateClub(editingClub.id, formData);
      } else {
        await clubService.createClub(formData);
      }
      setShowModal(false);
      fetchClubs();
    } catch (error) {
      alert('Error: ' + (error.message || 'Error al procesar la solicitud'));
    }
  };

  const handleDelete = async () => {
    if (!clubToDelete) return;
    try {
      await clubService.deleteClub(clubToDelete.id);
      fetchClubs();
    } catch (error) {
      alert('Error: ' + (error.message || 'Error al eliminar el club'));
    } finally {
      setIsConfirmOpen(false);
      setClubToDelete(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE': return <span className="badge badge-success">Activo</span>;
      case 'TRIAL': return <span className="badge badge-primary">Prueba</span>;
      case 'EXPIRED': return <span className="badge badge-danger">Vencido</span>;
      case 'INACTIVE': return <span className="badge badge-inactive">Inactivo</span>;
      default: return <span className="badge badge-inactive">{status}</span>;
    }
  };

  const getPlanBadge = (plan) => {
    switch (plan) {
      case 'BASIC': return <span className="badge badge-info">Basic ($120.000)</span>;
      case 'PRO': return <span className="badge badge-purple">Pro ($280.000)</span>;
      case 'FLEXIBLE': return <span className="badge badge-pink">Flexible ($1.000 p/a)</span>;
      case 'UNLIMITED': return <span className="badge badge-warning">Unlimited ($600.000)</span>;
      default: return <span className="badge">{plan}</span>;
    }
  };

  if (loading) return <div className="loading">Cargando clubes...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
            <h1>Gestión de Clubes</h1>
            <p className="text-muted">Administra los clubes registrados y sus estados de suscripción.</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          + Nuevo Club
        </button>
      </div>

      <div className="glass-panel mt-4">
        <table className="data-table">
          <thead>
            <tr>
              <th>Club</th>
              <th>Deporte</th>
              <th>Suscripción</th>
              <th>Plan</th>
              <th>Vencimiento</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clubs.map((club) => (
              <tr key={club.id}>
                <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong>{club.name}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: #{club.id}</span>
                    </div>
                </td>
                <td><span className="badge badge-info">{club.sport}</span></td>
                <td>{getStatusBadge(club.subscription_status)}</td>
                <td>{getPlanBadge(club.plan_type)}</td>
                <td style={{ fontSize: '0.85rem' }}>
                    {club.subscription_end_date ? new Date(club.subscription_end_date).toLocaleDateString() : 'N/A'}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleOpenModal(club)}>Gestionar</button>
                    <button className="btn btn-sm btn-outline-danger" 
                        style={{ borderColor: '#fee2e2', color: '#b91c1c' }}
                        onClick={() => { setClubToDelete(club); setIsConfirmOpen(true); }}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
            {clubs.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>No hay clubes registrados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Club"
        message={`¿Estás seguro de eliminar el club "${clubToDelete?.name}"? Esta acción no se puede deshacer.`}
      />

      {showModal && (
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingClub ? "Gestionar Club y Suscripción" : "Crear Nuevo Club"}>
          <form onSubmit={handleSubmit} className="form-grid">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', gridColumn: 'span 2' }}>
                <div className="form-group">
                <label className="form-label">Nombre del Club</label>
                <input
                    type="text"
                    className="form-input"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                </div>
                <div className="form-group">
                <label className="form-label">Deporte</label>
                <select
                    className="form-input"
                    value={formData.sport}
                    onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
                >
                    <option value="Fútbol">Fútbol</option>
                    <option value="Natación">Natación</option>
                    <option value="Baloncesto">Baloncesto</option>
                    <option value="Voleibol">Voleibol</option>
                    <option value="Otro">Otro</option>
                </select>
                </div>
            </div>

            <div className="section-divider" style={{ gridColumn: 'span 2', margin: '10px 0', borderTop: '1px solid var(--border-color)' }}></div>
            <h4 style={{ gridColumn: 'span 2', fontSize: '0.9rem', color: 'var(--primary-color)' }}>DATOS DE SUSCRIPCIÓN</h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', gridColumn: 'span 2' }}>
                <div className="form-group">
                <label className="form-label">Estado</label>
                <select
                    className="form-input"
                    value={formData.subscription_status}
                    onChange={(e) => setFormData({ ...formData, subscription_status: e.target.value })}
                >
                    <option value="TRIAL">Periodo de Prueba</option>
                    <option value="ACTIVE">Activo (Pagado)</option>
                    <option value="EXPIRED">Vencido / Suspendido</option>
                    <option value="INACTIVE">Inactivo</option>
                </select>
                </div>
                <div className="form-group">
                <label className="form-label">Plan</label>
                <select
                    className="form-input"
                    value={formData.plan_type}
                    onChange={(e) => setFormData({ ...formData, plan_type: e.target.value })}
                >
                    <option value="BASIC">Básico ($120.000)</option>
                    <option value="PRO">Profesional ($280.000)</option>
                    <option value="FLEXIBLE">Flexible ($1.000 x Atleta)</option>
                    <option value="UNLIMITED">Ilimitado ($600.000)</option>
                </select>
                </div>
            </div>

            <div className="form-group full-width">
              <label className="form-label">Fecha de Vencimiento</label>
              <input
                type="date"
                className="form-input"
                value={formData.subscription_end_date}
                onChange={(e) => setFormData({ ...formData, subscription_end_date: e.target.value })}
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">Descripción Interna</label>
              <textarea
                className="form-input"
                rows="2"
                placeholder="Notas sobre el club o su facturación..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              ></textarea>
            </div>

            <div className="modal-footer" style={{ margin: '8px -24px -24px', padding: '16px 24px', gridColumn: 'span 2' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                {editingClub ? 'Actualizar Cambios' : 'Crear Club'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <style>{`
        .badge-purple { background: #f3e8ff; color: #7e22ce; }
        .badge-pink { background: #fce7f3; color: #db2777; }
        .section-divider { width: 100%; height: 1px; background: var(--border-color); }
      `}</style>
    </div>
  );
};

export default ClubList;
