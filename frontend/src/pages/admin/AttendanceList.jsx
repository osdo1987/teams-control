import React, { useState, useEffect } from 'react';
import { attendanceService } from '../../services/attendanceService';
import { groupService } from '../../services/groupService';
import Modal from '../../components/UI/Modal';

const AttendanceList = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Estados para la toma de asistencia
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [pendingAthletes, setPendingAthletes] = useState([]); // Los que faltan por marcar
  const [bulkRecords, setBulkRecords] = useState([]); // Los ya marcados para enviar
  const [bulkDate, setBulkDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const data = await groupService.getGroups();
      setGroups(data);
    } catch { setError('Error al cargar grupos.'); }
    finally { setLoading(false); }
  };

  const handleOpenBulk = async (group) => {
    setSelectedGroup(group);
    setLoading(true);
    try {
      const athletes = await groupService.getGroupAthletes(group.id);
      setPendingAthletes(athletes);
      setBulkRecords([]); // Resetear registros previos
      setIsBulkModalOpen(true);
    } catch (err) {
      setError("No se pudieron cargar los atletas.");
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = (athlete, status) => {
    // 1. Agregar al registro de envío
    const newRecord = {
      athlete_id: athlete.id,
      date: bulkDate,
      status: status,
      notes: ''
    };
    setBulkRecords(prev => [...prev, newRecord]);

    // 2. Quitar de la lista visual (desaparecer)
    setPendingAthletes(prev => prev.filter(a => a.id !== athlete.id));
  };

  const handleBulkSubmit = async () => {
    if (bulkRecords.length === 0) return;
    setLoading(true);
    try {
      await attendanceService.registerBulkAttendance(selectedGroup.id, bulkRecords);
      setIsBulkModalOpen(false);
      alert(`Asistencia guardada: ${bulkRecords.length} atletas procesados.`);
    } catch {
      setError("Error al guardar en el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1>Asistencia Diaria</h1>
          <p className="text-muted">Marca la asistencia de tus grupos de forma rápida.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {groups.map(g => (
          <div key={g.id} className="card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{g.name}</h3>
              <div className="text-muted" style={{ fontSize: '0.8rem' }}>{g.category_obj?.name}</div>
            </div>
            <button className="btn btn-primary" onClick={() => handleOpenBulk(g)}>Tomar</button>
          </div>
        ))}
      </div>

      <Modal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} title={`Asistencia: ${selectedGroup?.name}`}>
        <div style={{ marginBottom: '20px' }}>
          <label className="form-label">Fecha de Clase</label>
          <input type="date" value={bulkDate} onChange={e => setBulkDate(e.target.value)} className="form-input" />
        </div>

        {/* Indicador de Progreso */}
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
            Progreso: {bulkRecords.length} / {bulkRecords.length + pendingAthletes.length} atletas
          </span>
          {pendingAthletes.length === 0 && bulkRecords.length > 0 && (
            <span className="badge badge-success">¡LISTO PARA GUARDAR!</span>
          )}
        </div>

        <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
          <table className="data-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Atleta</th>
                <th style={{ textAlign: 'right' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {pendingAthletes.map(a => (
                <tr key={a.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{a.user?.first_name} {a.user?.last_name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>ID: {a.user?.identification_number}</div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button 
                        className="btn btn-sm" 
                        style={{ background: '#dcfce7', color: '#166534', border: 'none', padding: '8px 12px' }}
                        onClick={() => markAttendance(a, 'PRESENT')}
                        title="Presente"
                      >✅</button>
                      <button 
                        className="btn btn-sm" 
                        style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '8px 12px' }}
                        onClick={() => markAttendance(a, 'ABSENT')}
                        title="Ausente"
                      >❌</button>
                      <button 
                        className="btn btn-sm" 
                        style={{ background: '#fef3c7', color: '#92400e', border: 'none', padding: '8px 12px' }}
                        onClick={() => markAttendance(a, 'JUSTIFIED')}
                        title="Justificado"
                      >ℹ️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {pendingAthletes.length === 0 && (
                <tr>
                  <td colSpan="2" style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🎯</div>
                    <div style={{ fontWeight: 600 }}>Todos los atletas han sido procesados.</div>
                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>Haz clic en "Guardar Todo" para finalizar.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="modal-footer" style={{ margin: '8px -24px -24px', padding: '16px 24px' }}>
          <button type="button" className="btn btn-ghost" onClick={() => setIsBulkModalOpen(false)}>Cancelar</button>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={handleBulkSubmit}
            disabled={bulkRecords.length === 0 || loading}
          >
            {loading ? 'Guardando...' : 'Guardar Todo'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default AttendanceList;
