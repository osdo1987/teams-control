import React, { useState, useEffect } from 'react';
import { attendanceService } from '../../services/attendanceService';
import { groupService } from '../../services/groupService';
import Modal from '../../components/UI/Modal';

const AttendanceList = () => {
  const [searchType, setSearchType] = useState('group'); 
  const [searchValue, setSearchValue] = useState('');
  const [attendances, setAttendances] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [groupAthletes, setGroupAthletes] = useState([]);
  const [filteredGroupAthletes, setFilteredGroupAthletes] = useState([]);
  const [athleteSearch, setAthleteSearch] = useState('');
  const [bulkDate, setBulkDate] = useState(new Date().toISOString().split('T')[0]);
  const [bulkRecords, setBulkRecords] = useState({}); 

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    const results = groupAthletes.filter(a => {
      const name = `${a.user?.first_name} ${a.user?.last_name}`.toLowerCase();
      const id = (a.user?.identification_number || '').toString();
      return name.includes(athleteSearch.toLowerCase()) || id.includes(athleteSearch);
    });
    setFilteredGroupAthletes(results);
  }, [athleteSearch, groupAthletes]);

  const fetchGroups = async () => {
    try {
      const data = await groupService.getGroups();
      setGroups(data);
    } catch { /* fail silently */ }
  };

  const fetchAttendance = async (id = searchValue) => {
    if (!id) return;
    setLoading(true);
    try {
      let data;
      if (searchType === 'athlete') {
        data = await attendanceService.getAthleteAttendance(id);
      } else {
        data = await attendanceService.getGroupAttendance(id);
      }
      setAttendances(data); 
      setError('');
    } catch { 
      setError('No se encontraron registros.'); 
      setAttendances([]); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleOpenBulk = async (groupId) => {
    setSelectedGroupId(groupId);
    setAthleteSearch('');
    try {
      const athletes = await groupService.getGroupAthletes(groupId);
      setGroupAthletes(athletes);
      setFilteredGroupAthletes(athletes);
      const initialRecords = {};
      athletes.forEach(a => initialRecords[a.id] = 'PRESENT');
      setBulkRecords(initialRecords);
      setIsBulkModalOpen(true);
    } catch {
      alert("Error al cargar miembros del grupo");
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    try {
      const records = Object.entries(bulkRecords).map(([athleteId, status]) => ({
        athlete_id: parseInt(athleteId),
        date: bulkDate,
        status,
        notes: ''
      }));
      await attendanceService.registerBulkAttendance(selectedGroupId, records);
      setIsBulkModalOpen(false);
      fetchAttendance(selectedGroupId);
    } catch {
      alert("Error al registrar asistencia");
    }
  };

  const stats = {
    present: attendances.filter(r => r.status === 'PRESENT').length,
    absent: attendances.filter(r => r.status === 'ABSENT').length,
    justified: attendances.filter(r => r.status === 'JUSTIFIED').length,
    rate: attendances.length ? Math.round((attendances.filter(r => r.status === 'PRESENT').length / attendances.length) * 100) : 0
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Sistema de Asistencia</h1>
          <p className="text-muted">Gestión de presencia y seguimiento de clases.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
        {/* Grupos Activos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.95rem', marginBottom: '16px', fontWeight: 700 }}>GRUPOS ACTIVOS</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {groups.map(g => (
                <div key={g.id} className="list-item" style={{ 
                  padding: '12px', background: 'var(--bg-main)', borderRadius: '10px', 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  border: selectedGroupId === g.id ? '1px solid var(--primary-color)' : '1px solid transparent'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{g.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{g.category_obj?.name}</div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => handleOpenBulk(g.id)}>Tomar</button>
                </div>
              ))}
            </div>
          </div>

          {attendances.length > 0 && (
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '0.9rem', marginBottom: '16px', fontWeight: 700 }}>ESTADÍSTICAS</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span className="text-muted">Asistencia:</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{stats.rate}%</span>
                </div>
                <div className="progress-bar" style={{ height: '6px', background: 'var(--bg-main)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${stats.rate}%`, height: '100%', background: 'var(--primary-color)' }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginTop: '4px' }}>
                  <span>✅ {stats.present}</span>
                  <span>❌ {stats.absent}</span>
                  <span>ℹ️ {stats.justified}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Historial */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '20px', fontWeight: 700 }}>HISTORIAL DE ASISTENCIA</h3>
          
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
            <select className="form-input" style={{ width: '160px' }} value={searchType} onChange={(e) => setSearchType(e.target.value)}>
              <option value="group">Por Grupo</option>
              <option value="athlete">Por Atleta</option>
            </select>
            <input 
              type="number" className="form-input" 
              placeholder={`Ingrese ID de ${searchType === 'group' ? 'Grupo' : 'Atleta'}...`} 
              value={searchValue} onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchAttendance()}
            />
            <button className="btn btn-ghost" onClick={() => fetchAttendance()}>Consultar</button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Atleta / Grupo</th>
                  <th>Estado</th>
                  <th>Notas</th>
                </tr>
              </thead>
              <tbody>
                {attendances.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Seleccione un grupo o atleta para ver el historial.</td></tr>
                ) : attendances.map(r => (
                  <tr key={r.id}>
                    <td>{new Date(r.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td>
                      {searchType === 'group' ? (
                        <div style={{ fontSize: '0.85rem' }}>Atleta #{r.athlete_id}</div>
                      ) : (
                        <div style={{ fontSize: '0.85rem' }}>Grupo #{r.group_id}</div>
                      )}
                    </td>
                    <td>
                      <span className={r.status === 'PRESENT' ? 'badge badge-success' : r.status === 'ABSENT' ? 'badge badge-danger' : 'badge badge-warning'}>
                        {r.status === 'PRESENT' ? 'Presente' : r.status === 'ABSENT' ? 'Ausente' : 'Justificado'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{r.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} title="Tomar Asistencia">
        <form onSubmit={handleBulkSubmit} style={{ display: 'contents' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
              <label className="form-label">Fecha de la Clase</label>
              <input type="date" value={bulkDate} onChange={e => setBulkDate(e.target.value)} className="form-input" required />
            </div>
            <div style={{ flex: 2 }}>
              <label className="form-label">Filtrar Lista</label>
              <input type="text" placeholder="Buscar atleta por nombre..." className="form-input" value={athleteSearch} onChange={(e) => setAthleteSearch(e.target.value)} />
            </div>
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '12px', marginBottom: '20px' }}>
            <table className="data-table">
              <thead style={{ position: 'sticky', top: 0, background: 'var(--card-bg)', zIndex: 1 }}>
                <tr>
                  <th>Atleta</th>
                  <th style={{ width: '130px' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredGroupAthletes.map(a => (
                  <tr key={a.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{a.user?.first_name} {a.user?.last_name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>ID: {a.user?.identification_number}</div>
                    </td>
                    <td>
                      <select 
                        value={bulkRecords[a.id]} 
                        onChange={e => setBulkRecords({...bulkRecords, [a.id]: e.target.value})}
                        className="form-input"
                        style={{ padding: '6px', fontSize: '0.8rem' }}
                      >
                        <option value="PRESENT">✅ Presente</option>
                        <option value="ABSENT">❌ Ausente</option>
                        <option value="JUSTIFIED">ℹ️ Justificado</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {filteredGroupAthletes.length === 0 && (
                  <tr><td colSpan="2" style={{ textAlign: 'center', padding: '20px' }}>No hay atletas en este grupo.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="modal-footer" style={{ margin: '8px -24px -24px', padding: '16px 24px' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsBulkModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar Asistencia</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AttendanceList;
