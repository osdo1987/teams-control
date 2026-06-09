import React, { useState, useEffect, useCallback } from 'react';
import { attendanceService } from '../../services/attendanceService';
import { groupService } from '../../services/groupService';
import Modal from '../../components/UI/Modal';

/* ═══════════════════════════════════════════════════
   STATUS HELPERS
   ═══════════════════════════════════════════════════ */
const STATUS_CONFIG = {
  PRESENT: { label: 'Presente', emoji: '✅', color: '#10b981', bg: '#ecfdf5' },
  ABSENT: { label: 'Ausente', emoji: '❌', color: '#ef4444', bg: '#fef2f2' },
  JUSTIFIED: { label: 'Justificado', emoji: 'ℹ️', color: '#f59e0b', bg: '#fffbeb' },
  EXCUSED: { label: 'Justificado', emoji: 'ℹ️', color: '#f59e0b', bg: '#fffbeb' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.ABSENT;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '4px 10px', borderRadius: 20,
      fontSize: '0.75rem', fontWeight: 600,
      background: cfg.bg, color: cfg.color,
    }}>
      {cfg.emoji} {cfg.label}
    </span>
  );
};

const RateBar = ({ rate, size = 'md' }) => {
  const getColor = (r) => r >= 80 ? '#10b981' : r >= 50 ? '#f59e0b' : '#ef4444';
  const h = size === 'sm' ? 6 : 10;
  return (
    <div style={{ width: '100%' }}>
      <div style={{
        height: h, borderRadius: h, background: 'var(--gray-200)',
        overflow: 'hidden', position: 'relative',
      }}>
        <div style={{
          height: '100%', borderRadius: h,
          background: getColor(rate),
          width: `${Math.min(rate, 100)}%`,
          transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        }} />
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   DATE UTILITIES
   ═══════════════════════════════════════════════════ */
const today = () => new Date().toISOString().split('T')[0];

const formatDate = (d) => {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-CO', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });
};

const getWeekRange = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().split('T')[0],
    end: sunday.toISOString().split('T')[0],
  };
};

const getMonthRange = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  const year = d.getFullYear();
  const month = d.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
    label: d.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }),
  };
};

const DAYS_OF_WEEK = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */
const AttendanceList = () => {
  // --- Groups ---
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // --- Tab: 'take' | 'history' ---
  const [activeTab, setActiveTab] = useState('take');

  // --- Take Attendance State ---
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [pendingAthletes, setPendingAthletes] = useState([]);
  const [bulkRecords, setBulkRecords] = useState([]);
  const [bulkDate, setBulkDate] = useState(today());
  const [attendanceTakenInfo, setAttendanceTakenInfo] = useState(null);
  const [checkingAttendance, setCheckingAttendance] = useState(false);

  // --- History State ---
  const [historyGroup, setHistoryGroup] = useState(null);
  const [historyView, setHistoryView] = useState('daily'); // daily | weekly | monthly
  const [historyDate, setHistoryDate] = useState(today());
  const [historyStats, setHistoryStats] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // --- Details Modal ---
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailDay, setDetailDay] = useState(null);

  useEffect(() => { fetchGroups(); }, []);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const data = await groupService.getGroups();
      setGroups(data);
    } catch { setError('Error al cargar grupos.'); }
    finally { setLoading(false); }
  };

  const clearMessages = () => { setError(''); setSuccessMsg(''); };

  // ─── TAKE ATTENDANCE ───────────────────────────
  const handleOpenBulk = async (group) => {
    clearMessages();
    setSelectedGroup(group);
    setBulkDate(today());
    setAttendanceTakenInfo(null);
    setIsBulkModalOpen(true);
    await checkIfTaken(group.id, today());
  };

  const checkIfTaken = async (groupId, date) => {
    setCheckingAttendance(true);
    try {
      const info = await attendanceService.checkAttendanceTaken(groupId, date);
      setAttendanceTakenInfo(info);
      if (info.taken) {
        // Already taken — don't load athletes
        setPendingAthletes([]);
        setBulkRecords([]);
      } else {
        // Load athletes
        const athletes = await groupService.getGroupAthletes(groupId);
        setPendingAthletes(athletes);
        setBulkRecords([]);
      }
    } catch {
      // If check fails, still let user try
      const athletes = await groupService.getGroupAthletes(groupId);
      setPendingAthletes(athletes);
      setBulkRecords([]);
    } finally {
      setCheckingAttendance(false);
    }
  };

  const handleDateChange = async (newDate) => {
    setBulkDate(newDate);
    if (selectedGroup) {
      await checkIfTaken(selectedGroup.id, newDate);
    }
  };

  const markAttendance = (athlete, status) => {
    const newRecord = {
      athlete_id: athlete.id,
      date: bulkDate,
      status: status,
      notes: ''
    };
    setBulkRecords(prev => [...prev, newRecord]);
    setPendingAthletes(prev => prev.filter(a => a.id !== athlete.id));
  };

  const undoLastMark = () => {
    if (bulkRecords.length === 0) return;
    const last = bulkRecords[bulkRecords.length - 1];
    setBulkRecords(prev => prev.slice(0, -1));
    // Find the athlete object — we need to reconstruct it
    // Since we don't have the full athlete object stored, we add a placeholder
    setPendingAthletes(prev => [...prev, { id: last.athlete_id, user: { first_name: `Atleta #${last.athlete_id}`, last_name: '' }, _undo: true }]);
  };

  const handleBulkSubmit = async () => {
    if (bulkRecords.length === 0) return;
    setLoading(true);
    try {
      await attendanceService.registerBulkAttendance(selectedGroup.id, bulkRecords);
      setIsBulkModalOpen(false);
      setSuccessMsg(`✅ Asistencia guardada: ${bulkRecords.length} atletas procesados para ${formatDate(bulkDate)}.`);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch {
      setError("Error al guardar en el servidor.");
    } finally {
      setLoading(false);
    }
  };

  // ─── HISTORY ───────────────────────────────────
  const loadHistory = useCallback(async () => {
    if (!historyGroup) return;
    setHistoryLoading(true);
    try {
      let startDate, endDate;
      if (historyView === 'daily') {
        startDate = historyDate;
        endDate = historyDate;
      } else if (historyView === 'weekly') {
        const range = getWeekRange(historyDate);
        startDate = range.start;
        endDate = range.end;
      } else {
        const range = getMonthRange(historyDate);
        startDate = range.start;
        endDate = range.end;
      }
      const stats = await attendanceService.getGroupStats(historyGroup.id, startDate, endDate);
      setHistoryStats(stats);
    } catch {
      setError('Error al cargar estadísticas.');
    } finally {
      setHistoryLoading(false);
    }
  }, [historyGroup, historyView, historyDate]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const navigateHistoryDate = (direction) => {
    const d = new Date(historyDate + 'T00:00:00');
    if (historyView === 'daily') d.setDate(d.getDate() + direction);
    else if (historyView === 'weekly') d.setDate(d.getDate() + (7 * direction));
    else d.setMonth(d.getMonth() + direction);
    setHistoryDate(d.toISOString().split('T')[0]);
  };

  const getHistoryTitle = () => {
    if (!historyGroup) return 'Selecciona un grupo';
    if (historyView === 'daily') return `${historyGroup.name} — ${formatDate(historyDate)}`;
    if (historyView === 'weekly') {
      const r = getWeekRange(historyDate);
      return `${historyGroup.name} — ${formatDate(r.start)} al ${formatDate(r.end)}`;
    }
    const r = getMonthRange(historyDate);
    return `${historyGroup.name} — ${r.label}`;
  };

  const openDetail = (dayStat) => {
    setDetailDay(dayStat);
    setDetailModalOpen(true);
  };

  /* ═══════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════ */
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>📋 Asistencia</h1>
          <p className="text-muted">Control de asistencia de tus grupos</p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div style={{
          padding: '12px 16px', borderRadius: 10, marginBottom: 16,
          background: '#fef2f2', color: '#991b1b', fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          ⚠️ {error}
          <button onClick={clearMessages} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
      )}
      {successMsg && (
        <div style={{
          padding: '12px 16px', borderRadius: 10, marginBottom: 16,
          background: '#ecfdf5', color: '#047857', fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {successMsg}
          <button onClick={clearMessages} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
      )}

      {/* Tab Switcher */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 24,
        background: 'var(--gray-100)', borderRadius: 12, padding: 4,
        width: 'fit-content',
      }}>
        {[
          { key: 'take', label: '📝 Tomar Asistencia', },
          { key: 'history', label: '📊 Historial y Estadísticas', },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 20px', borderRadius: 10, border: 'none',
              fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
              background: activeTab === tab.key ? '#fff' : 'transparent',
              color: activeTab === tab.key ? 'var(--brand-600)' : 'var(--text-secondary)',
              boxShadow: activeTab === tab.key ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════ TAB: TAKE ATTENDANCE ═══════════ */}
      {activeTab === 'take' && (
        <div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16,
          }}>
            {groups.map(g => (
              <div key={g.id} className="card" style={{
                padding: 20, display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'default',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 12,
                    background: 'var(--brand-50)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
                  }}>👥</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{g.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{g.category_obj?.name || 'Sin categoría'}</div>
                  </div>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => handleOpenBulk(g)}
                  style={{ padding: '8px 18px', borderRadius: 10 }}
                >
                  Tomar
                </button>
              </div>
            ))}
            {groups.length === 0 && !loading && (
              <div className="card" style={{ padding: 40, textAlign: 'center', gridColumn: '1 / -1' }}>
                <div style={{ fontSize: '2rem', marginBottom: 10 }}>📋</div>
                <div style={{ fontWeight: 600 }}>No hay grupos disponibles</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════ TAB: HISTORY ═══════════ */}
      {activeTab === 'history' && (
        <div>
          {/* Group selector + View selector */}
          <div style={{
            display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center',
          }}>
            <select
              value={historyGroup?.id || ''}
              onChange={e => {
                const g = groups.find(gr => gr.id === Number(e.target.value));
                setHistoryGroup(g || null);
                setHistoryStats(null);
              }}
              className="form-input"
              style={{ flex: '0 0 auto', minWidth: 200 }}
            >
              <option value="">Seleccionar grupo...</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>

            <div style={{
              display: 'flex', gap: 2, background: 'var(--gray-100)',
              borderRadius: 10, padding: 3,
            }}>
              {[
                { key: 'daily', label: '📅 Diario' },
                { key: 'weekly', label: '📆 Semanal' },
                { key: 'monthly', label: '🗓️ Mensual' },
              ].map(v => (
                <button
                  key={v.key}
                  onClick={() => setHistoryView(v.key)}
                  style={{
                    padding: '7px 14px', borderRadius: 8, border: 'none',
                    fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                    background: historyView === v.key ? '#fff' : 'transparent',
                    color: historyView === v.key ? 'var(--brand-600)' : 'var(--text-secondary)',
                    boxShadow: historyView === v.key ? 'var(--shadow-xs)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Navigation */}
          {historyGroup && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24,
            }}>
              <button
                className="btn btn-sm"
                onClick={() => navigateHistoryDate(-1)}
                style={{ padding: '8px 12px', borderRadius: 8 }}
              >
                ◀
              </button>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{getHistoryTitle()}</div>
              </div>
              <button
                className="btn btn-sm"
                onClick={() => navigateHistoryDate(1)}
                style={{ padding: '8px 12px', borderRadius: 8 }}
              >
                ▶
              </button>
              <button
                className="btn btn-sm"
                onClick={() => setHistoryDate(today())}
                style={{ padding: '8px 14px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600 }}
              >
                Hoy
              </button>
            </div>
          )}

          {/* Stats Cards */}
          {historyStats && (
            <>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 12, marginBottom: 24,
              }}>
                <StatCard
                  emoji="🎯"
                  label="Tasa de Asistencia"
                  value={`${historyStats.attendance_rate}%`}
                  color="var(--brand-600)"
                  bg="var(--brand-50)"
                />
                <StatCard
                  emoji="✅"
                  label="Presentes"
                  value={historyStats.present_count}
                  color="#10b981"
                  bg="#ecfdf5"
                />
                <StatCard
                  emoji="❌"
                  label="Ausentes"
                  value={historyStats.absent_count}
                  color="#ef4444"
                  bg="#fef2f2"
                />
                <StatCard
                  emoji="ℹ️"
                  label="Justificados"
                  value={historyStats.justified_count}
                  color="#f59e0b"
                  bg="#fffbeb"
                />
                <StatCard
                  emoji="📅"
                  label="Sesiones"
                  value={historyStats.total_sessions}
                  color="#6366f1"
                  bg="#eef2ff"
                />
                <StatCard
                  emoji="👥"
                  label="Atletas"
                  value={historyStats.total_athletes}
                  color="#0ea5e9"
                  bg="#f0f9ff"
                />
              </div>

              {/* Overall Rate Bar */}
              <div className="card" style={{ padding: 20, marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Rendimiento General</span>
                  <span style={{
                    fontWeight: 800, fontSize: '1.2rem',
                    color: historyStats.attendance_rate >= 80 ? '#10b981' : historyStats.attendance_rate >= 50 ? '#f59e0b' : '#ef4444',
                  }}>
                    {historyStats.attendance_rate}%
                  </span>
                </div>
                <RateBar rate={historyStats.attendance_rate} />
                <div style={{ display: 'flex', gap: 20, marginTop: 10 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>✅ {historyStats.present_count} presentes</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>❌ {historyStats.absent_count} ausentes</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ℹ️ {historyStats.justified_count} justificados</span>
                </div>
              </div>

              {/* Calendar / Daily Stats Grid */}
              {(historyView === 'daily' || historyView === 'weekly') && historyStats.daily_stats?.length > 0 && (
                <div className="card" style={{ padding: 20, marginBottom: 24 }}>
                  <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: '0.95rem' }}>
                    📊 Detalle por Día
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: historyView === 'weekly' ? 'repeat(7, 1fr)' : 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: 10,
                  }}>
                    {historyView === 'weekly' && DAYS_OF_WEEK.map((day, i) => {
                      const weekStart = getWeekRange(historyDate).start;
                      const d = new Date(weekStart + 'T00:00:00');
                      d.setDate(d.getDate() + i);
                      const dateStr = d.toISOString().split('T')[0];
                      const dayStat = historyStats.daily_stats.find(ds => ds.date === dateStr);
                      return (
                        <DayCell
                          key={dateStr}
                          dayName={day}
                          dateStr={dateStr}
                          stat={dayStat}
                          totalAthletes={historyStats.total_athletes}
                          onClick={() => dayStat && openDetail(dayStat)}
                        />
                      );
                    })}
                    {historyView === 'daily' && historyStats.daily_stats.map(ds => (
                      <DayCell
                        key={ds.date}
                        dayName={new Date(ds.date + 'T00:00:00').toLocaleDateString('es-CO', { weekday: 'short' })}
                        dateStr={ds.date}
                        stat={ds}
                        totalAthletes={historyStats.total_athletes}
                        onClick={() => openDetail(ds)}
                        wide
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Monthly Calendar View */}
              {historyView === 'monthly' && historyStats.daily_stats?.length > 0 && (
                <div className="card" style={{ padding: 20, marginBottom: 24 }}>
                  <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: '0.95rem' }}>
                    🗓️ Calendario Mensual
                  </h3>
                  <MonthlyCalendar
                    monthDate={historyDate}
                    dailyStats={historyStats.daily_stats}
                    totalAthletes={historyStats.total_athletes}
                    onDayClick={openDetail}
                  />
                </div>
              )}

              {historyStats.daily_stats?.length === 0 && (
                <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>📭</div>
                  <div style={{ fontWeight: 600, fontSize: '1rem' }}>Sin datos de asistencia</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
                    No hay registros para este período
                  </div>
                </div>
              )}

              {/* Athlete Stats Table */}
              {historyStats.athlete_stats?.length > 0 && (
                <div className="card" style={{ padding: 20, marginBottom: 24 }}>
                  <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: '0.95rem' }}>
                    👤 Rendimiento por Atleta
                  </h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table" style={{ margin: 0 }}>
                      <thead>
                        <tr>
                          <th>Atleta</th>
                          <th style={{ textAlign: 'center' }}>Presente</th>
                          <th style={{ textAlign: 'center' }}>Ausente</th>
                          <th style={{ textAlign: 'center' }}>Justificado</th>
                          <th style={{ textAlign: 'center', minWidth: 140 }}>Tasa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyStats.athlete_stats.map(a => (
                          <tr key={a.athlete_id}>
                            <td style={{ fontWeight: 600 }}>{a.name}</td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{ color: '#10b981', fontWeight: 600 }}>{a.present}</span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{ color: '#ef4444', fontWeight: 600 }}>{a.absent}</span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{ color: '#f59e0b', fontWeight: 600 }}>{a.justified}</span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <RateBar rate={a.rate} size="sm" />
                                <span style={{ fontWeight: 700, fontSize: '0.8rem', minWidth: 42, textAlign: 'right', color: a.rate >= 80 ? '#10b981' : a.rate >= 50 ? '#f59e0b' : '#ef4444' }}>
                                  {a.rate}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {!historyGroup && (
            <div className="card" style={{ padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>📊</div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>Selecciona un grupo</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Elige un grupo para ver sus estadísticas de asistencia
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════ TAKE ATTENDANCE MODAL ═══════════ */}
      <Modal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} title={`Asistencia: ${selectedGroup?.name}`}>
        {/* Date picker */}
        <div style={{ marginBottom: 20 }}>
          <label className="form-label">Fecha de Clase</label>
          <input
            type="date"
            value={bulkDate}
            onChange={e => handleDateChange(e.target.value)}
            className="form-input"
            max={today()}
          />
        </div>

        {/* Duplicate prevention alert */}
        {attendanceTakenInfo?.taken && (
          <div style={{
            padding: '16px 20px', borderRadius: 12, marginBottom: 20,
            background: '#fffbeb', border: '1px solid #fde68a',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: '1.5rem' }}>🔒</span>
              <div>
                <div style={{ fontWeight: 700, color: '#92400e', fontSize: '0.95rem' }}>
                  Asistencia ya registrada
                </div>
                <div style={{ color: '#a16207', fontSize: '0.82rem' }}>
                  La asistencia para este grupo el {formatDate(bulkDate)} ya fue tomada ({attendanceTakenInfo.count} atletas registrados).
                </div>
              </div>
            </div>
            <div style={{
              fontSize: '0.8rem', color: '#92400e', padding: '8px 12px',
              background: '#fef3c7', borderRadius: 8,
            }}>
              💡 Cambia la fecha para tomar asistencia en otro día, o revisa el historial.
            </div>
          </div>
        )}

        {/* Loading */}
        {checkingAttendance && (
          <div style={{ textAlign: 'center', padding: 30 }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 8, animation: 'spin 1s linear infinite' }}>⏳</div>
            <div style={{ fontWeight: 500, color: 'var(--text-muted)' }}>Verificando asistencia...</div>
          </div>
        )}

        {/* Athletes list */}
        {!attendanceTakenInfo?.taken && !checkingAttendance && (
          <>
            {/* Progress indicator */}
            <div style={{
              marginBottom: 16, display: 'flex', justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                Progreso: {bulkRecords.length} / {bulkRecords.length + pendingAthletes.length} atletas
              </span>
              {bulkRecords.length > 0 && (
                <button
                  onClick={undoLastMark}
                  style={{
                    padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border-main)',
                    background: '#fff', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer',
                  }}
                >
                  ↩ Deshacer
                </button>
              )}
              {pendingAthletes.length === 0 && bulkRecords.length > 0 && (
                <span style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
                  background: '#ecfdf5', color: '#047857',
                }}>
                  ¡LISTO PARA GUARDAR!
                </span>
              )}
            </div>

            {bulkRecords.length > 0 && pendingAthletes.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <RateBar rate={(bulkRecords.length / (bulkRecords.length + pendingAthletes.length)) * 100} size="sm" />
              </div>
            )}

            <div style={{
              maxHeight: 400, overflowY: 'auto',
              border: '1px solid var(--border-color, var(--border-main))', borderRadius: 12,
            }}>
              <table className="data-table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Atleta</th>
                    <th style={{ textAlign: 'right' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingAthletes.filter(a => !a._undo).map(a => (
                    <tr key={a.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{a.user?.first_name} {a.user?.last_name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>ID: {a.user?.identification_number}</div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-sm"
                            style={{ background: '#dcfce7', color: '#166534', border: 'none', padding: '8px 12px', borderRadius: 8 }}
                            onClick={() => markAttendance(a, 'PRESENT')}
                            title="Presente"
                          >✅</button>
                          <button
                            className="btn btn-sm"
                            style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '8px 12px', borderRadius: 8 }}
                            onClick={() => markAttendance(a, 'ABSENT')}
                            title="Ausente"
                          >❌</button>
                          <button
                            className="btn btn-sm"
                            style={{ background: '#fef3c7', color: '#92400e', border: 'none', padding: '8px 12px', borderRadius: 8 }}
                            onClick={() => markAttendance(a, 'JUSTIFIED')}
                            title="Justificado"
                          >ℹ️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pendingAthletes.filter(a => !a._undo).length === 0 && (
                    <tr>
                      <td colSpan="2" style={{ textAlign: 'center', padding: 40 }}>
                        <div style={{ fontSize: '2rem', marginBottom: 10 }}>🎯</div>
                        <div style={{ fontWeight: 600 }}>Todos los atletas han sido procesados.</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Haz clic en "Guardar Todo" para finalizar.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="modal-footer" style={{ margin: '8px -24px -24px', padding: '16px 24px' }}>
          <button type="button" className="btn btn-ghost" onClick={() => setIsBulkModalOpen(false)}>Cancelar</button>
          {!attendanceTakenInfo?.taken && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleBulkSubmit}
              disabled={bulkRecords.length === 0 || loading}
            >
              {loading ? 'Guardando...' : 'Guardar Todo'}
            </button>
          )}
          {attendanceTakenInfo?.taken && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setIsBulkModalOpen(false)}
            >
              Cerrar
            </button>
          )}
        </div>
      </Modal>

      {/* ═══════════ DETAIL MODAL ═══════════ */}
      <Modal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)} title={`Detalle: ${detailDay ? formatDate(detailDay.date) : ''}`}>
        {detailDay && (
          <div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20,
            }}>
              <div style={{ textAlign: 'center', padding: 14, borderRadius: 12, background: '#ecfdf5' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10b981' }}>{detailDay.present}</div>
                <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 600 }}>Presentes</div>
              </div>
              <div style={{ textAlign: 'center', padding: 14, borderRadius: 12, background: '#fef2f2' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ef4444' }}>{detailDay.absent}</div>
                <div style={{ fontSize: '0.75rem', color: '#991b1b', fontWeight: 600 }}>Ausentes</div>
              </div>
              <div style={{ textAlign: 'center', padding: 14, borderRadius: 12, background: '#fffbeb' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f59e0b' }}>{detailDay.justified}</div>
                <div style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: 600 }}>Justificados</div>
              </div>
            </div>
            <div style={{ textAlign: 'center', marginBottom: 10 }}>
              <span style={{
                fontSize: '1.5rem', fontWeight: 800,
                color: detailDay.rate >= 80 ? '#10b981' : detailDay.rate >= 50 ? '#f59e0b' : '#ef4444',
              }}>
                {detailDay.rate}%
              </span>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tasa de asistencia</div>
            </div>
            <RateBar rate={detailDay.rate} />
          </div>
        )}
      </Modal>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════ */

const StatCard = ({ emoji, label, value, color, bg }) => (
  <div style={{
    padding: '16px 18px', borderRadius: 14, background: bg,
    display: 'flex', alignItems: 'center', gap: 12,
    transition: 'transform 0.2s',
  }}>
    <div style={{ fontSize: '1.5rem' }}>{emoji}</div>
    <div>
      <div style={{ fontSize: '1.2rem', fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: '0.72rem', fontWeight: 500, color, opacity: 0.8 }}>{label}</div>
    </div>
  </div>
);

const DayCell = ({ dayName, dateStr, stat, totalAthletes, onClick, wide }) => {
  const rate = stat ? stat.rate : 0;
  const bgColor = stat
    ? rate >= 80 ? '#ecfdf5' : rate >= 50 ? '#fffbeb' : '#fef2f2'
    : 'var(--gray-50)';
  const borderColor = stat
    ? rate >= 80 ? '#86efac' : rate >= 50 ? '#fde68a' : '#fca5a5'
    : 'var(--gray-200)';

  return (
    <div
      onClick={onClick}
      style={{
        padding: wide ? '14px 16px' : '12px',
        borderRadius: 12,
        background: bgColor,
        border: `1.5px solid ${borderColor}`,
        cursor: stat ? 'pointer' : 'default',
        transition: 'transform 0.15s, box-shadow 0.15s',
        textAlign: wide ? 'left' : 'center',
        minWidth: wide ? 'auto' : 80,
      }}
      onMouseEnter={e => { if (stat) e.currentTarget.style.transform = 'scale(1.04)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
        {dayName}
      </div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
        {new Date(dateStr + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
      </div>
      {stat ? (
        <>
          <div style={{ fontSize: wide ? '1.2rem' : '1rem', fontWeight: 800, color: rate >= 80 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444' }}>
            {rate}%
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            {stat.present}✅ {stat.absent}❌
          </div>
        </>
      ) : (
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>—</div>
      )}
    </div>
  );
};

const MonthlyCalendar = ({ monthDate, dailyStats, totalAthletes, onDayClick }) => {
  const d = new Date(monthDate + 'T00:00:00');
  const year = d.getFullYear();
  const month = d.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7; // Monday = 0

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const dateStr = new Date(year, month, day).toISOString().split('T')[0];
    const stat = dailyStats.find(s => s.date === dateStr);
    cells.push({ day, dateStr, stat });
  }

  return (
    <div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6,
      }}>
        {DAYS_OF_WEEK.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', padding: 4, textTransform: 'uppercase' }}>
            {d}
          </div>
        ))}
        {cells.map((cell, i) => {
          if (!cell) return <div key={`empty-${i}`} />;
          const rate = cell.stat ? cell.stat.rate : 0;
          const bg = cell.stat
            ? rate >= 80 ? '#ecfdf5' : rate >= 50 ? '#fffbeb' : '#fef2f2'
            : 'transparent';
          return (
            <div
              key={cell.dateStr}
              onClick={() => cell.stat && onDayClick(cell.stat)}
              style={{
                padding: '8px 4px', borderRadius: 8, background: bg,
                textAlign: 'center', cursor: cell.stat ? 'pointer' : 'default',
                border: cell.stat ? `1.5px solid ${rate >= 80 ? '#86efac' : rate >= 50 ? '#fde68a' : '#fca5a5'}` : '1.5px solid transparent',
                transition: 'transform 0.15s',
                minHeight: 56,
              }}
              onMouseEnter={e => { if (cell.stat) e.currentTarget.style.transform = 'scale(1.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{cell.day}</div>
              {cell.stat ? (
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: rate >= 80 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444' }}>
                  {rate}%
                </div>
              ) : (
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>—</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AttendanceList;