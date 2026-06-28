import React, { useEffect, useState } from 'react';
import { groupService } from '../../services/groupService';
import { attendanceService } from '../../services/attendanceService';
import { useToast } from '../../contexts/ToastContext';
import { authService } from '../../services/authService';

const TrainerAttendance = () => {
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [athletes, setAthletes] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [alreadyTaken, setAlreadyTaken] = useState(false);
    const { showError, showSuccess } = useToast();
    const user = authService.getCurrentUser();

    useEffect(() => {
        loadGroups();
    }, []);

    useEffect(() => {
        if (selectedGroup && date) {
            loadAthletes();
            checkAttendance();
        }
    }, [selectedGroup, date]);

    const loadGroups = async () => {
        try {
            const data = await groupService.getGroups();
            const myGroups = data.filter(g =>
                g.trainers?.some(t => t.id === user?.id)
            );
            setGroups(myGroups);
        } catch (err) {
            showError('Error al cargar grupos');
        } finally {
            setLoading(false);
        }
    };

    const loadAthletes = async () => {
        try {
            const data = await groupService.getGroupAthletes(selectedGroup);
            setAthletes(data || []);
            // Reset attendance
            const init = {};
            (data || []).forEach(a => { init[a.id] = 'PRESENT'; });
            setAttendance(init);
        } catch (err) {
            showError('Error al cargar atletas');
        }
    };

    const checkAttendance = async () => {
        try {
            const result = await attendanceService.checkAttendanceTaken(selectedGroup, date);
            setAlreadyTaken(result.taken);
        } catch {
            setAlreadyTaken(false);
        }
    };

    const toggleAttendance = (athleteId, status) => {
        setAttendance(prev => ({ ...prev, [athleteId]: status }));
    };

    const handleSubmit = async () => {
        setSaving(true);
        try {
            const records = Object.entries(attendance).map(([athleteId, status]) => ({
                athlete_id: parseInt(athleteId),
                status,
                date
            }));
            await attendanceService.registerBulkAttendance(selectedGroup, records);
            showSuccess('Asistencia registrada correctamente');
            setAlreadyTaken(true);
        } catch (err) {
            showError('Error al registrar asistencia');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="loading-state"><p>Cargando...</p></div>;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Registrar Asistencia</h1>
                    <p className="text-muted">Selecciona un grupo y registra la asistencia del día</p>
                </div>
            </div>

            <div className="profile-card" style={{ marginBottom: 24 }}>
                <div className="profile-info-grid">
                    <div className="form-group">
                        <label className="form-label">Grupo</label>
                        <select
                            className="form-input"
                            value={selectedGroup}
                            onChange={e => setSelectedGroup(e.target.value)}
                        >
                            <option value="">Seleccionar grupo</option>
                            {groups.map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Fecha</label>
                        <input
                            type="date"
                            className="form-input"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {selectedGroup && (
                <>
                    {alreadyTaken && (
                        <div className="badge badge-warning" style={{ display: 'block', marginBottom: 16, padding: 12 }}>
                            ⚠️ La asistencia para este grupo y fecha ya fue registrada.
                        </div>
                    )}

                    {athletes.length === 0 ? (
                        <div className="empty-state">
                            <p>No hay atletas en este grupo.</p>
                        </div>
                    ) : (
                        <div className="table-card">
                            <div className="table-scroll">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Atleta</th>
                                            <th>Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {athletes.map(a => (
                                            <tr key={a.id}>
                                                <td>
                                                    <div className="table-cell-name">
                                                        <strong>{a.user?.first_name} {a.user?.last_name}</strong>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: 8 }}>
                                                        {['PRESENT', 'ABSENT', 'EXCUSED'].map(status => (
                                                            <button
                                                                key={status}
                                                                className={`btn btn-sm ${attendance[a.id] === status ? 'btn-primary' : 'btn-ghost'}`}
                                                                onClick={() => toggleAttendance(a.id, status)}
                                                                disabled={alreadyTaken}
                                                            >
                                                                {status === 'PRESENT' ? '✅ Presente' : status === 'ABSENT' ? '❌ Ausente' : '📝 Excusado'}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div style={{ padding: 16, textAlign: 'right' }}>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleSubmit}
                                    disabled={saving || alreadyTaken}
                                >
                                    {saving ? 'Guardando...' : '💾 Guardar Asistencia'}
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default TrainerAttendance;