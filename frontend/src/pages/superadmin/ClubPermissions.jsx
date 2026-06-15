import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';

const FEATURES_MAP = {
    TRAINER: [
        { key: 'dashboard', label: 'Dashboard', icon: '🏠', desc: 'Panel principal del entrenador' },
        { key: 'profile', label: 'Mi Perfil', icon: '👤', desc: 'Ver y editar información personal' },
        { key: 'groups', label: 'Mis Grupos', icon: '📋', desc: 'Gestionar grupos asignados' },
        { key: 'attendance', label: 'Asistencia', icon: '📊', desc: 'Registrar asistencia de atletas' },
        { key: 'tests', label: 'Tests', icon: '🧪', desc: 'Crear y administrar tests físicos' },
        { key: 'payments', label: 'Pagos', icon: '💳', desc: 'Ver información de pagos' },
    ],
    ATHLETE: [
        { key: 'dashboard', label: 'Dashboard', icon: '🏠', desc: 'Panel principal del atleta' },
        { key: 'profile', label: 'Mi Perfil', icon: '👤', desc: 'Ver y editar información personal' },
        { key: 'attendance', label: 'Asistencia', icon: '📅', desc: 'Historial de asistencia' },
        { key: 'payments', label: 'Pagos', icon: '💳', desc: 'Estado de pagos y cuotas' },
        { key: 'tests', label: 'Mis Tests', icon: '🧪', desc: 'Resultados de tests físicos' },
    ],
};

const ClubPermissions = () => {
    const [clubs, setClubs] = useState([]);
    const [selectedClub, setSelectedClub] = useState(null);
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchClubs();
    }, []);

    const fetchClubs = async () => {
        try {
            const data = await api('/clubs');
            setClubs(data);
        } catch (err) {
            setError('Error al cargar clubes');
        } finally {
            setLoading(false);
        }
    };

    const fetchPermissions = async (clubId) => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const data = await api(`/clubs/${clubId}/permissions`);
            setPermissions(data);
            setSelectedClub(clubId);
        } catch (err) {
            setError('Error al cargar permisos');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (role, feature) => {
        setPermissions((prev) => ({
            ...prev,
            [role]: {
                ...prev[role],
                [feature]: !prev[role]?.[feature],
            },
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            await api(`/clubs/${selectedClub}/permissions`, {
                method: 'PUT',
                body: JSON.stringify(permissions),
            });
            setSuccess('Permisos actualizados correctamente');
        } catch (err) {
            setError('Error al guardar permisos');
        } finally {
            setSaving(false);
        }
    };

    const selectedClubData = clubs.find(c => c.id === selectedClub);

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Permisos por Club</h1>
                    <p>Configura qué funcionalidades tiene cada rol en cada club</p>
                </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <div style={{ display: 'flex', gap: 24, marginTop: 24 }}>
                {/* Club List */}
                <div className="card" style={{ width: 260, flexShrink: 0 }}>
                    <div className="card-header">
                        <h3>Clubes</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {clubs.map((club) => (
                            <button
                                key={club.id}
                                className={`nav-link ${selectedClub === club.id ? 'active' : ''}`}
                                onClick={() => fetchPermissions(club.id)}
                                style={{ textAlign: 'left', width: '100%' }}
                            >
                                {club.name}
                                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    {club.athlete_count || 0} atletas
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Permissions Panel */}
                {selectedClub ? (
                    <div style={{ flex: 1 }}>
                        <div className="card" style={{ marginBottom: 16 }}>
                            <div className="card-header">
                                <h3>{selectedClubData?.name} — Permisos</h3>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleSave}
                                    disabled={saving}
                                >
                                    {saving ? 'Guardando...' : '💾 Guardar'}
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                            {Object.entries(FEATURES_MAP).map(([role, features]) => (
                                <div key={role} className="card">
                                    <div className="card-header">
                                        <h3>{role === 'TRAINER' ? '🏋️ Entrenador' : '⚽ Atleta'}</h3>
                                        <span className="badge badge-info">{role}</span>
                                    </div>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                                        Funcionalidades disponibles para este rol
                                    </p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {features.map((f) => (
                                            <div
                                                key={f.key}
                                                className="toggle-row"
                                                onClick={() => handleToggle(role, f.key)}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <span style={{ fontSize: '1.2rem' }}>{f.icon}</span>
                                                    <div>
                                                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{f.label}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{f.desc}</div>
                                                    </div>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={permissions[role]?.[f.key] || false}
                                                    onChange={() => handleToggle(role, f.key)}
                                                />
                                                <div className="toggle-switch" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
                        <div className="empty-state">
                            <div className="icon">🔒</div>
                            <h3>Selecciona un club</h3>
                            <p>Elige un club de la lista para configurar sus permisos</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClubPermissions;