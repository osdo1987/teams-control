import React, { useState, useEffect } from 'react';
import { attendanceService } from '../../services/attendanceService';
import { groupService } from '../../services/groupService';
import Modal from '../../components/UI/Modal';

const AttendanceList = () => {
  const [searchType, setSearchType] = useState('athlete'); // 'athlete' or 'group'
  const [searchValue, setSearchValue] = useState('');
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // For bulk registration
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [groupAthletes, setGroupAthletes] = useState([]);
  const [bulkDate, setBulkDate] = useState(new Date().toISOString().split('T')[0]);
  const [bulkRecords, setBulkRecords] = useState({}); // {athleteId: status}

  const fetchAttendance = async () => {
    if (!searchValue) return;
    setLoading(true);
    try {
      let data;
      if (searchType === 'athlete') {
        data = await attendanceService.getAthleteAttendance(searchValue);
      } else {
        data = await attendanceService.getGroupAttendance(searchValue);
      }
      setAttendances(data); setError('');
    } catch { setError('No attendance records found.'); setAttendances([]); }
    finally { setLoading(false); }
  };

  const handleOpenBulk = async () => {
    if (!selectedGroupId) {
      alert("Please enter a group ID first");
      return;
    }
    try {
      const athletes = await groupService.getGroupAthletes(selectedGroupId);
      setGroupAthletes(athletes);
      const initialRecords = {};
      athletes.forEach(a => initialRecords[a.id] = 'PRESENT');
      setBulkRecords(initialRecords);
      setIsBulkModalOpen(true);
    } catch {
      alert("Error loading group members");
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
      if (searchType === 'group' && String(searchValue) === String(selectedGroupId)) fetchAttendance();
    } catch {
      alert("Error registering attendance");
    }
  };

  const present  = attendances.filter(r => r.status === 'PRESENT').length;
  const absent   = attendances.filter(r => r.status !== 'PRESENT').length;
  const rate     = attendances.length ? Math.round((present / attendances.length) * 100) : null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Attendance</h1>
          <p className="text-muted">View and track athlete attendance records.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input type="number" value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)} className="form-input" placeholder="Group ID for Bulk..." style={{ maxWidth: 180 }} />
          <button className="btn btn-primary" onClick={handleOpenBulk}>Bulk Register</button>
        </div>
      </div>

      {/* Search */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '24px', marginBottom: '12px', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="radio" checked={searchType === 'athlete'} onChange={() => setSearchType('athlete')} /> Athlete ID
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="radio" checked={searchType === 'group'} onChange={() => setSearchType('group')} /> Group ID
          </label>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="number" value={searchValue} onChange={e => setSearchValue(e.target.value)}
            className="form-input" placeholder={`Enter ${searchType} ID...`} style={{ maxWidth: 280 }}
            onKeyDown={e => e.key === 'Enter' && fetchAttendance()}
          />
          <button className="btn btn-primary" onClick={fetchAttendance}>Search</button>
        </div>
      </div>

      {/* Stats row */}
      {attendances.length > 0 && (
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <div className="card" style={{ padding: '18px 22px', flex: 1, display: 'flex', gap: '14px', alignItems: 'center' }}>
            <div className="stat-icon green">✅</div>
            <div>
              <div className="stat-value" style={{ fontSize: '1.5rem' }}>{present}</div>
              <div className="stat-label">Present</div>
            </div>
          </div>
          <div className="card" style={{ padding: '18px 22px', flex: 1, display: 'flex', gap: '14px', alignItems: 'center' }}>
            <div className="stat-icon" style={{ background: '#fee2e2' }}>❌</div>
            <div>
              <div className="stat-value" style={{ fontSize: '1.5rem' }}>{absent}</div>
              <div className="stat-label">Absent</div>
            </div>
          </div>
          <div className="card" style={{ padding: '18px 22px', flex: 1, display: 'flex', gap: '14px', alignItems: 'center' }}>
            <div className="stat-icon blue">📊</div>
            <div>
              <div className="stat-value" style={{ fontSize: '1.5rem' }}>{rate}%</div>
              <div className="stat-label">Attendance Rate</div>
            </div>
          </div>
        </div>
      )}

      {error && <div className="badge badge-danger" style={{ marginBottom: '16px', padding: '10px 16px', borderRadius: '10px', display: 'block' }}>{error}</div>}

      <div className="table-container">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>{searchType === 'athlete' ? 'Group ID' : 'Athlete ID'}</th>
                <th>Date</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {attendances.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Search to see records.</td></tr>
              ) : attendances.map(r => (
                <tr key={r.id}>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>#{r.id}</td>
                  <td>
                    <span className="badge badge-primary">
                      {searchType === 'athlete' ? `Group ${r.group_id}` : `Athlete ${r.athlete_id}`}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{new Date(r.date).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                  <td>
                    <span className={r.status === 'PRESENT' ? 'badge badge-success' : 'badge badge-danger'}>
                      {r.status === 'PRESENT' ? 'Present' : 'Absent'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{r.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} title="Bulk Attendance Registration">
        <form onSubmit={handleBulkSubmit} style={{ display: 'contents' }}>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input type="date" value={bulkDate} onChange={e => setBulkDate(e.target.value)} className="form-input" required />
          </div>
          <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Athlete</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {groupAthletes.map(a => (
                  <tr key={a.id}>
                    <td>{a.user?.first_name} {a.user?.last_name}</td>
                    <td>
                      <select 
                        value={bulkRecords[a.id]} 
                        onChange={e => setBulkRecords({...bulkRecords, [a.id]: e.target.value})}
                        className="form-input"
                      >
                        <option value="PRESENT">Present</option>
                        <option value="ABSENT">Absent</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="modal-footer" style={{ margin: '8px -24px -24px', padding: '16px 24px' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsBulkModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Attendance</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AttendanceList;
