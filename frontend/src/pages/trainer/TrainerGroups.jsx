import React, { useEffect, useState } from 'react';
import { groupService } from '../../services/groupService';
import { useToast } from '../../contexts/ToastContext';
import { authService } from '../../services/authService';

const TrainerGroups = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showError } = useToast();
    const user = authService.getCurrentUser();

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            const data = await groupService.getGroups();
            // Filter groups where current trainer is assigned
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

    if (loading) return <div className="loading-state"><p>Cargando grupos...</p></div>;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Mis Grupos</h1>
                    <p className="text-muted">Grupos a los que estás asignado como entrenador</p>
                </div>
            </div>

            {groups.length === 0 ? (
                <div className="empty-state">
                    <p>No estás asignado a ningún grupo actualmente.</p>
                </div>
            ) : (
                <div className="stat-grid">
                    {groups.map(group => (
                        <div key={group.id} className="stat-card card-hover">
                            <div className="stat-icon icon-success">📋</div>
                            <div className="stat-value">{group.name}</div>
                            <div className="stat-label">
                                {group.category && <span>🏷️ {group.category}</span>}
                                {group.schedule && <span> 🕐 {group.schedule}</span>}
                                {group.athletes_count !== undefined && (
                                    <span> 👥 {group.athletes_count} atletas</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TrainerGroups;