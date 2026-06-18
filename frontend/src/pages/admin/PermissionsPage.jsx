import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { authService } from '../../services/authService';
import { useToast } from '../../contexts/ToastContext';

const FEATURES = {
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

const PermissionsPage = () => {
    const { showError, showSuccess } = useToast();
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false); // Mantener saving para el estado del botón
    const user = authService.getCurrentUser();

    useEffect(() => {
        fetchPermissions();
    }, []);

    const fetchPermissions = async () => {
        try {
            const data = await api(`/clubs/${user.club_id}/permissions`);
            setPermissions(data);
        } catch (err) {
            showError('Error al cargar permisos');
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
        try {
            await api(`/clubs/${user.club_id}/permissions`, {
                method: 'PUT',
                body: JSON.stringify(permissions),
            });
            showSuccess('Permisos actualizados correctamente');
        } catch (err) {
            showError('Error al guardar permisos');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-state">
                <div className="spinner spinner-lg" />
                <p>Cargando permisos...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Permisos por Rol</h1>
                    <p>Configura qué opciones puede ver cada perfil (Entrenador y Atleta)</p>
                </div>
                <div className="header-actions">
                    <button
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? 'Guardando...' : '💾 Guardar Cambios'}
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24 }}>
                {Object.entries(FEATURES).map(([role, features]) => (
                    <div key={role} className="card">
                        <div className="card-header">
                            <h3>{role === 'TRAINER' ? '🏋️ Entrenador' : '⚽ Atleta'}</h3>
                            <span className="badge badge-info">{role}</span>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                            {role === 'TRAINER'
                                ? 'Controla qué módulos y funcionalidades puede ver el entrenador.'
                                : 'Controla qué módulos y funcionalidades puede ver el atleta.'}
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
    );
};

export default PermissionsPage;