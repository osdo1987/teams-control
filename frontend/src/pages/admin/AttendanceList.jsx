import React, { useState } from 'react';
import { attendanceService } from '../../services/attendanceService';

const AttendanceList = () => {
  const [athleteIdSearch, setAthleteIdSearch] = useState('');
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAttendance = async () => {
    if (!athleteIdSearch) return;
    setLoading(true);
    try {
      const data = await attendanceService.getAthleteAttendance(athleteIdSearch);
      setAttendances(data); setError('');
    } catch { setError('No attendance records found.'); setAttendances([]); }
    finally { setLoading(false); }
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
      </div>

      {/* Search */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: '24px' }}>
        <p style={{ fontWeight: 600, marginBottom: '12px', fontSize: '0.9rem' }}>Search by Athlete ID</p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="number" value={athleteIdSearch} onChange={e => setAthleteIdSearch(e.target.value)}
            className="form-input" placeholder="Enter athlete ID..." style={{ maxWidth: 280 }}
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
                <th>Group ID</th>
                <th>Date</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {attendances.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Search for an athlete to see their attendance.</td></tr>
              ) : attendances.map(r => (
                <tr key={r.id}>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>#{r.id}</td>
                  <td><span className="badge badge-primary">Group {r.group_id}</span></td>
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
    </div>
  );
};

export default AttendanceList;
