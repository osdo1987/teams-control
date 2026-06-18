import React, { useEffect, useState } from 'react';
import trainerService from '../../services/trainerService';
import { useToast } from '../../contexts/ToastContext';

const TrainerProfile = () => {
    const { showError, showSuccess } = useToast();
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true); // Keep loading state
    const [saving, setSaving] = useState(false); // Keep saving state
    const [activeTab, setActiveTab] = useState('personal');
    const [editMode, setEditMode] = useState(false);

    const [formData, setFormData] = useState({ user: {}, profile: {} });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const data = await trainerService.getMyProfile();
            setUser(data.user);
            setProfile(data.profile);
            setFormData({
                user: {
                    first_name: data.user.first_name || '',
                    last_name: data.user.last_name || '',
                    email: data.user.email || '',
                    phone: data.user.phone || '',
                },
                profile: {
                    birth_date: data.profile.birth_date || '',
                    gender: data.profile.gender || '',
                    address: data.profile.address || '',
                    city: data.profile.city || '',
                    state: data.profile.state || '',
                    emergency_contact_name: data.profile.emergency_contact_name || '',
                    emergency_contact_phone: data.profile.emergency_contact_phone || '',
                    profile_photo_url: data.profile.profile_photo_url || '',
                    bank_name: data.profile.bank_name || '',
                    bank_account_number: data.profile.bank_account_number || '',
                    bank_account_type: data.profile.bank_account_type || '',
                    salary: data.profile.salary || '',
                    payment_frequency: data.profile.payment_frequency || '',
                    tax_id: data.profile.tax_id || '',
                    education_level: data.profile.education_level || '',
                    institution: data.profile.institution || '',
                    degree_title: data.profile.degree_title || '',
                    graduation_year: data.profile.graduation_year || '',
                    certifications: data.profile.certifications || '',
                    specialization: data.profile.specialization || '',
                    years_of_experience: data.profile.years_of_experience || '',
                    previous_clubs: data.profile.previous_clubs || '',
                    bio: data.profile.bio || '',
                    hire_date: data.profile.hire_date || '',
                    contract_type: data.profile.contract_type || '',
                },
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
            await trainerService.updateMyProfile(formData);
            showSuccess('Perfil actualizado correctamente');
            setEditMode(false);
            await fetchProfile();
        } catch (err) {
            showError('Error al guardar perfil');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (section, field, value) => {
        setFormData((prev) => ({
            ...prev,
            [section]: { ...prev[section], [field]: value },
        }));
    };

    const tabs = [
        { id: 'personal', label: 'Datos Personales', icon: '👤' },
        { id: 'payment', label: 'Pago / Bancario', icon: '💳' },
        { id: 'education', label: 'Educación', icon: '🎓' },
        { id: 'experience', label: 'Experiencia', icon: '💼' },
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
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                </div>
                <div className="profile-header-info">
                    <h1>{user?.first_name} {user?.last_name}</h1>
                    <p className="profile-subtitle">{user?.club_name} · Entrenador</p>
                    {profile?.status && (
                        <span className={`badge ${profile.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
                            {profile.status === 'ACTIVE' ? 'Activo' : profile.status === 'INACTIVE' ? 'Inactivo' : 'En Permiso'}
                        </span>
                    )}
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
                                <label className="form-label">Nombre</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.user.first_name}
                                    onChange={(e) => handleChange('user', 'first_name', e.target.value)}
                                    disabled={!editMode}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Apellido</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.user.last_name}
                                    onChange={(e) => handleChange('user', 'last_name', e.target.value)}
                                    disabled={!editMode}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={formData.user.email}
                                    onChange={(e) => handleChange('user', 'email', e.target.value)}
                                    disabled={!editMode}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Teléfono</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.user.phone}
                                    onChange={(e) => handleChange('user', 'phone', e.target.value)}
                                    disabled={!editMode}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Fecha de Nacimiento</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.profile.birth_date}
                                    onChange={(e) => handleChange('profile', 'birth_date', e.target.value)}
                                    disabled={!editMode}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Género</label>
                                <select
                                    className="form-input"
                                    value={formData.profile.gender}
                                    onChange={(e) => handleChange('profile', 'gender', e.target.value)}
                                    disabled={!editMode}
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="Masculino">Masculino</option>
                                    <option value="Femenino">Femenino</option>
                                    <option value="Otro">Otro</option>
                                </select>
                            </div>
                            <div className="form-group full-width">
                                <label className="form-label">Dirección</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.profile.address}
                                    onChange={(e) => handleChange('profile', 'address', e.target.value)}
                                    disabled={!editMode}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Ciudad</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.profile.city}
                                    onChange={(e) => handleChange('profile', 'city', e.target.value)}
                                    disabled={!editMode}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Departamento / Estado</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.profile.state}
                                    onChange={(e) => handleChange('profile', 'state', e.target.value)}
                                    disabled={!editMode}
                                />
                            </div>
                        </div>
                        <h3>Contacto de Emergencia</h3>
                        <div className="form-grid-2">
                            <div className="form-group">
                                <label className="form-label">Nombre del Contacto</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.profile.emergency_contact_name}
                                    onChange={(e) => handleChange('profile', 'emergency_contact_name', e.target.value)}
                                    disabled={!editMode}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Teléfono del Contacto</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.profile.emergency_contact_phone}
                                    onChange={(e) => handleChange('profile', 'emergency_contact_phone', e.target.value)}
                                    disabled={!editMode}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'payment' && (
                    <div className="profile-card">
                        <h3>Datos Bancarios</h3>
                        <div className="form-grid-2">
                            <div className="form-group">
                                <label className="form-label">Banco</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.profile.bank_name}
                                    onChange={(e) => handleChange('profile', 'bank_name', e.target.value)}
                                    disabled={!editMode}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Número de Cuenta</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.profile.bank_account_number}
                                    onChange={(e) => handleChange('profile', 'bank_account_number', e.target.value)}
                                    disabled={!editMode}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Tipo de Cuenta</label>
                                <select
                                    className="form-input"
                                    value={formData.profile.bank_account_type}
                                    onChange={(e) => handleChange('profile', 'bank_account_type', e.target.value)}
                                    disabled={!editMode}
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="Ahorros">Ahorros</option>
                                    <option value="Corriente">Corriente</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">NIT / RUT</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.profile.tax_id}
                                    onChange={(e) => handleChange('profile', 'tax_id', e.target.value)}
                                    disabled={!editMode}
                                />
                            </div>
                        </div>
                        <h3>Información Salarial</h3>
                        <div className="form-grid-2">
                            <div className="form-group">
                                <label className="form-label">Salario</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.profile.salary}
                                    onChange={(e) => handleChange('profile', 'salary', e.target.value)}
                                    disabled={!editMode}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Frecuencia de Pago</label>
                                <select
                                    className="form-input"
                                    value={formData.profile.payment_frequency}
                                    onChange={(e) => handleChange('profile', 'payment_frequency', e.target.value)}
                                    disabled={!editMode}
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="Mensual">Mensual</option>
                                    <option value="Quincenal">Quincenal</option>
                                    <option value="Semanal">Semanal</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Fecha de Contratación</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.profile.hire_date}
                                    onChange={(e) => handleChange('profile', 'hire_date', e.target.value)}
                                    disabled={!editMode}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Tipo de Contrato</label>
                                <select
                                    className="form-input"
                                    value={formData.profile.contract_type}
                                    onChange={(e) => handleChange('profile', 'contract_type', e.target.value)}
                                    disabled={!editMode}
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="Tiempo completo">Tiempo completo</option>
                                    <option value="Medio tiempo">Medio tiempo</option>
                                    <option value="Contrato">Contrato</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'education' && (
                    <div className="profile-card">
                        <h3>Formación Académica</h3>
                        <div className="form-grid-2">
                            <div className="form-group">
                                <label className="form-label">Nivel de Educación</label>
                                <select
                                    className="form-input"
                                    value={formData.profile.education_level}
                                    onChange={(e) => handleChange('profile', 'education_level', e.target.value)}
                                    disabled={!editMode}
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="Bachiller">Bachiller</option>
                                    <option value="Técnico">Técnico</option>
                                    <option value="Profesional">Profesional</option>
                                    <option value="Posgrado">Posgrado</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Institución</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.profile.institution}
                                    onChange={(e) => handleChange('profile', 'institution', e.target.value)}
                                    disabled={!editMode}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Título</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.profile.degree_title}
                                    onChange={(e) => handleChange('profile', 'degree_title', e.target.value)}
                                    disabled={!editMode}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Año de Graduación</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.profile.graduation_year}
                                    onChange={(e) => handleChange('profile', 'graduation_year', e.target.value)}
                                    disabled={!editMode}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Especialización Deportiva</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.profile.specialization}
                                    onChange={(e) => handleChange('profile', 'specialization', e.target.value)}
                                    disabled={!editMode}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Certificaciones</label>
                            <textarea
                                className="form-input form-textarea"
                                value={formData.profile.certifications}
                                onChange={(e) => handleChange('profile', 'certifications', e.target.value)}
                                disabled={!editMode}
                                placeholder="Ej: Licencia FIFA C, Certificación NSCA-CPT, Curso de alto rendimiento..."
                                rows={3}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'experience' && (
                    <div className="profile-card">
                        <h3>Experiencia Profesional</h3>
                        <div className="form-grid-2">
                            <div className="form-group">
                                <label className="form-label">Años de Experiencia</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.profile.years_of_experience}
                                    onChange={(e) => handleChange('profile', 'years_of_experience', e.target.value)}
                                    disabled={!editMode}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Clubes Anteriores</label>
                            <textarea
                                className="form-input form-textarea"
                                value={formData.profile.previous_clubs}
                                onChange={(e) => handleChange('profile', 'previous_clubs', e.target.value)}
                                disabled={!editMode}
                                placeholder="Describe los clubes donde has trabajado anteriormente..."
                                rows={3}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Biografía / Resumen Profesional</label>
                            <textarea
                                className="form-input form-textarea"
                                value={formData.profile.bio}
                                onChange={(e) => handleChange('profile', 'bio', e.target.value)}
                                disabled={!editMode}
                                placeholder="Cuéntanos sobre tu experiencia como entrenador..."
                                rows={4}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrainerProfile;