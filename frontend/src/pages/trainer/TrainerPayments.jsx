import React, { useEffect, useState } from 'react';
import { groupService } from '../../services/groupService';
import { useToast } from '../../contexts/ToastContext';
import { authService } from '../../services/authService';
import { api } from '../../services/api';

const TrainerPayments = () => {
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [athletes, setAthletes] = useState([]);
    const [payments, setPayments] = useState({});
    const [loading, setLoading] = useState(true);
    const { showError } = useToast();
    const user = authService.getCurrentUser();

    useEffect(() => {
        loadGroups();
    }, []);

    useEffect(() => {
        if (selectedGroup) {
            loadAthletesAndPayments();
        }
    }, [selectedGroup]);

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

    const loadAthletesAndPayments = async () => {
        try {
            const athletesData = await groupService.getGroupAthletes(selectedGroup);
            setAthletes(athletesData || []);

            // Load payments for each athlete
            const paymentsMap = {};
            for (const a of (athletesData || [])) {
                try {
                    const p = await api(`/payments/athlete/${a.id}`);
                    paymentsMap[a.id] = p || [];
                } catch {
                    paymentsMap[a.id] = [];
                }
            }
            setPayments(paymentsMap);
        } catch (err) {
            showError('Error al cargar datos');
        }
    };

    const getStatusBadge = (status) => {
        if (status === 'PAID') return <span className="badge badge-success">✅ Pagado</span>;
        if (status === 'PENDING') return <span className="badge badge-warning">⏳ Pendiente</span>;
        if (status === 'OVERDUE') return <span className="badge badge-danger">🔴 Vencido</span>;
        return <span className="badge">—</span>;
    };

    if (loading) return <div className="loading-state"><p>Cargando...</p></div>;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Pagos de Atletas</h1>
                    <p className="text-muted">Consulta el estado de pagos de los atletas de tus grupos</p>
                </div>
            </div>

            <div className="profile-card" style={{ marginBottom: 24 }}>
                <div className="form-group">
                    <label className="form-label">Seleccionar Grupo</label>
                    <select
                        className="form-input"
                        value={selectedGroup}
                        onChange={e => setSelectedGroup(e.target.value)}
                    >
                        <option value="">-- Seleccionar --</option>
                        {groups.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedGroup && (
                <div className="table-card">
                    <div className="table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>Atleta</th>
                                    <th>Último Pago</th>
                                    <th>Estado</th>
                                    <th>Monto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {athletes.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="empty-cell">No hay atletas en este grupo</td>
                                    </tr>
                                ) : athletes.map(a => {
                                    const athletePayments = payments[a.id] || [];
                                    const lastPayment = athletePayments.length > 0 ? athletePayments[athletePayments.length - 1] : null;
                                    return (
                                        <tr key={a.id}>
                                            <td>
                                                <strong>{a.user?.first_name} {a.user?.last_name}</strong>
                                            </td>
                                            <td>
                                                {lastPayment?.payment_date
                                                    ? new Date(lastPayment.payment_date).toLocaleDateString('es-CO')
                                                    : '—'}
                                            </td>
                                            <td>{getStatusBadge(lastPayment?.status)}</td>
                                            <td>
                                                {lastPayment?.amount
                                                    ? `$${parseFloat(lastPayment.amount).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`
                                                    : '—'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrainerPayments;