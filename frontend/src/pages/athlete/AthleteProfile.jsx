import React, { useEffect, useState } from 'react';
import { athleteService } from '../../services/athleteService';
import { api } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

const AthleteProfile = () => {
    const { showError, showSuccess } = useToast();
    const [athlete, setAthlete] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('personal');
    const [editMode, setEditMode] = useState(false);

    const [formData, setFormData] = useState({
        birth_date: '',
        phone: '',
        address: '',
        guardians: [],
        medical: {},
        academic: {},
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const data = await athleteService.getMyProfile();
            setAthlete(data);
            setFormData({
                birth_date: data.birth_date || '',
                phone: data.phone || '',
                address: data.address || '',
                guardians: data.guardians || [],
                medical: data.medical_info || {},
                academic: data.academic_info || {},
            });
        } catch (err) {
            showError('Error al cargar perfil');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await athleteService.updateMyProfile(formData);
            showSuccess('Perfil actualizado correctamente');
            setEditMode(false);
            await fetchProfile();
        } catch (err) {
            showError('Error al guardar perfil');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleMedicalChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            medical: { ...prev.medical, [field]: value },
        }));
    };

    const handleAcademicChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            academic: { ...prev.academic, [field]: value },
        }));
    };

    const tabs = [
        { id: 'personal', label: 'Datos Personales', icon: '👤' },
        { id: 'guardians', label: 'Acudientes', icon: '👨‍👩‍👧' },
        { id: 'medical', label: 'Info Médica', icon: '🏥' },
        { id: 'academic', label: 'Info Académica', icon: '🎓' },
    ];

    if (loading) {
        return (
            <div className="loading-state">
                <div className="spinner spinner-lg" />
                <p>Cargando perfil...</p>
            </div>
        );
    }

    return (
        <div className="profile-page">
            {/* Header */}
            <div className="profile-header-section">
                <div className="profile-avatar-lg" style={{ background: 'var(--brand-600)' }}>
                    {athlete?.first_name?.[0]}{athlete?.last_name?.[0]}
                </div>
                <div className="profile-header-info">
                    <h1>{athlete?.first_name} {athlete?.last_name}</h1>
                    <p className="profile-subtitle">{athlete?.club_name} · Atleta</p>
                </div>
                <div className="profile-header-actions">
                    {editMode ? (
                        <>
                            <button className="btn btn-secondary" onClick={() => { setEditMode(false); fetchProfile(); }}>Cancelar</button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                {saving ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </>
                    ) : (
                        <button className="btn btn-primary" onClick={() => setEditMode(true)}>✏️ Editar Perfil</button>
                    )}
                </div>
            </div>


            {/* Tabs */}
            <div className="profile-tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="profile-tab-content">
                {activeTab === 'personal' && (
                    <div className="profile-card">
                        <h3>Datos Personales</h3>
                        <div className="form-grid-2">
                            <div className="form-group">
                                <label className="form-label">Fecha de Nacimiento</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.birth_date}
                                    onChange={(e) => handleChange('birth_date', e.target.value)}
                                    disabled={!editMode}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Teléfono</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.phone}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                    disabled={!editMode}
                                />
                            </div>
                            <div className="form-group full-width">
                                <label className="form-label">Dirección</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.address}
                                    onChange={(e) => handleChange('address', e.target.value)}
                                    disabled={!editMode}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'guardians' && (
                    <div className="profile-card">
                        <h3>Acudientes</h3>
                        {formData.guardians.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No hay acudientes registrados.</p>
                        ) : (
                            formData.guardians.map((g, i) => (
                                <div key={i} className="editor-feature-card" style={{ marginBottom: 12 }}>
                                    <div className="form-grid-2">
                                        <div className="form-group">
                                            <label className="form-label">Nombre</label>
                                            <input type="text" className="form-input" value={g.name || ''} disabled={!editMode} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Parentesco</label>
                                            <input type="text" className="form-input" value={g.relationship || ''} disabled={!editMode} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Teléfono</label>
                                            <input type="text" className="form-input" value={g.phone || ''} disabled={!editMode} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Email</label>
                                            <input type="email" className="form-input" value={g.email || ''} disabled={!editMode} />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'medical' && (
                    <div className="profile-card">
                        <h3>Información Médica</h3>
                        <div className="form-grid-2">
                            <div className="form-group">
                                <label className="form-label">Tipo de Sangre</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.medical.blood_type || ''}
                                    onChange={(e) => handleMedicalChange('blood_type', e.target.value)}
                                    disabled={!editMode}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Contacto de Emergencia</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.medical.emergency_contact || ''}
                                    onChange={(e) => handleMedicalChange('emergency_contact', e.target.value)}
                                    disabled={!editMode}
                                />
                            </div>
                            <div className="form-group full-width">
                                <label className="form-label">Alergias</label>
                                <textarea
                                    className="form-input form-textarea"
                                    value={formData.medical.allergies || ''}
                                    onChange={(e) => handleMedicalChange('allergies', e.target.value)}
                                    disabled={!editMode}
                                    rows={3}
                                />
                            </div>
                            <div className="form-group full-width">
                                <label className="form-label">Condiciones Médicas</label>
                                <textarea
                                    className="form-input form-textarea"
                                    value={formData.medical.conditions || ''}
                                    onChange={(e) => handleMedicalChange('conditions', e.target.value)}
                                    disabled={!editMode}
                                    rows={3}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'academic' && (
                    <div className="profile-card">
                        <h3>Información Académica</h3>
                        <div className="form-grid-2">
                            <div className="form-group">
                                <label className="form-label">Colegio / Institución</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.academic.school_name || ''}
                                    onChange={(e) => handleAcademicChange('school_name', e.target.value)}
                                    disabled={!editMode}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Grado</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.academic.grade || ''}
                                    onChange={(e) => handleAcademicChange('grade', e.target.value)}
                                    disabled={!editMode}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AthleteProfile;