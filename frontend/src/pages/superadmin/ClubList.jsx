import React, { useState, useEffect } from 'react';
import clubService from '../../services/clubService';
import Modal from '../../components/UI/Modal';

const ClubList = () => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newClub, setNewClub] = useState({ name: '', description: '' });

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

  const handleCreateClub = async (e) => {
    e.preventDefault();
    try {
      await clubService.createClub(newClub);
      setShowModal(false);
      setNewClub({ name: '', description: '' });
      fetchClubs();
    } catch (error) {
      alert('Error creating club: ' + (error.response?.data?.error || error.message));
    }
  };

  if (loading) return <div className="loading">Cargando clubes...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Gestión de Clubes</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Nuevo Club
        </button>
      </div>

      <div className="glass-panel mt-4">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Usuarios</th>
              <th>Grupos</th>
              <th>Atletas</th>
              <th>Fecha Registro</th>
            </tr>
          </thead>
          <tbody>
            {clubs.map((club) => (
              <tr key={club.id}>
                <td>{club.id}</td>
                <td><strong>{club.name}</strong></td>
                <td>{club.description}</td>
                <td>{club.user_count}</td>
                <td>{club.group_count}</td>
                <td>{club.athlete_count}</td>
                <td>{new Date(club.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {clubs.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center' }}>No hay clubes registrados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title="Crear Nuevo Club" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreateClub} className="form-grid">
            <div className="form-group full-width">
              <label>Nombre del Club</label>
              <input
                type="text"
                className="form-control"
                required
                value={newClub.name}
                onChange={(e) => setNewClub({ ...newClub, name: e.target.value })}
              />
            </div>
            <div className="form-group full-width">
              <label>Descripción</label>
              <textarea
                className="form-control"
                rows="3"
                value={newClub.description}
                onChange={(e) => setNewClub({ ...newClub, description: e.target.value })}
              ></textarea>
            </div>
            <div className="form-actions full-width">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Guardar Club
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ClubList;
