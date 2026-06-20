import React, { useEffect, useState } from 'react';
import trainerService from '../../services/trainerService';
import { useToast } from '../../contexts/ToastContext';

const TrainerProfile = () => {
    const { showError, showSuccess } = useToast();
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
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

    const getInitials = () => {
        const first = user?.first_name?.[0] || '?';
        const last = user?.last_name?.[0] || '?';
        return `${first}${last}`.toUpperCase();
    };

    const getStatusBadge = () => {
        if (!profile?.status) return null;
        const isActive = profile.status === 'ACTIVE';
        return (
            <span className={`profile-hero-badge ${isActive ? 'profile-hero-badge-success' : ''}`}>
                {isActive ? '🟢 Activo' : profile.status === 'INACTIVE' ? '🔴 Inactivo' : '🟡 En Permiso'}
            </span>
        );
    };

    const getContractBadge = () => {
        if (!profile?.contract_type) return null;
        return <span className="profile-hero-badge">📄 {profile.contract_type}</span>;
    };

    const getEducationBadge = () => {
        if (!profile?.education_level) return null;
        return <span className="profile-hero-badge">🎓 {profile.education_level}</span>;
    };

    const getLicenseBadge = () => {
        if (!profile?.certifications) return null;
        const certs = profile.certifications.split(',').map(c => c.trim()).filter(Boolean);
        if (certs.length === 0) return null;
        return (
            <span className="profile-hero-badge profile-tag-purple">
                📜 {certs[0]}
                {certs.length > 1 && ` +${certs.length - 1}`}
            </span>
        );
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const calculateAge = (birthDate) => {
        if (!birthDate) return null;
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

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
            {/* Profile Hero */}
            <div className="profile-hero">
                <div className="profile-hero-avatar">
                    {getInitials()}
                </div>
                <div className="profile-hero-info">
                    <h1>{user?.first_name} {user?.last_name}</h1>
                    <p className="profile-hero-subtitle">
                        {profile?.specialization || 'Entrenador'} · {profile?.years_of_experience ? `${profile.years_of_experience} años de experiencia` : 'Sin experiencia registrada'}
                    </p>
                    <div className="profile-hero-badges">
                        {getStatusBadge()}
                        {getContractBadge()}
                        {getEducationBadge()}
                        {getLicenseBadge()}
                    </div>
                </div>
                <div className="profile-header-actions">
                    {editMode ? (
                        <>
                            <button className="btn btn-secondary" onClick={() => { setEditMode(false); fetchProfile(); }}>
                                Cancelar
                            </button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                {saving ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </>
                    ) : (
                        <button className="btn btn-primary" onClick={() => setEditMode(true)}>
                            ✏️ Editar Perfil
                        </button>
                    )}
                </div>
            </div>

            {/* Main Grid */}
            <div className="profile-grid-3">
                {/* Left Column - Main Info */}
                <div>
                    {/* Personal Info Card */}
                    <div className="profile-card">
                        <div className="profile-card-title">
                            <span className="profile-card-title-icon">👤</span>
                            Información Personal
                        </div>
                        {editMode ? (
                            <div className="profile-info-grid">
                                <div className="form-group">
                                    <label className="form-label">Fecha de Nacimiento</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={formData.profile.birth_date}
                                        onChange={(e) => handleChange('profile', 'birth_date', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Género</label>
                                    <select
                                        className="form-input"
                                        value={formData.profile.gender}
                                        onChange={(e) => handleChange('profile', 'gender', e.target.value)}
                                    >
                                        <option value="">Seleccionar</option>
                                        <option value="Masculino">Masculino</option>
                                        <option value="Femenino">Femenino</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="form-label">Dirección</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.profile.address}
                                        onChange={(e) => handleChange('profile', 'address', e.target.value)}
                                        placeholder="Calle 45 #12-30"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Ciudad</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.profile.city}
                                        onChange={(e) => handleChange('profile', 'city', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Departamento</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.profile.state}
                                        onChange={(e) => handleChange('profile', 'state', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Contacto de Emergencia</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.profile.emergency_contact_name}
                                        onChange={(e) => handleChange('profile', 'emergency_contact_name', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Tel. Emergencia</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.profile.emergency_contact_phone}
                                        onChange={(e) => handleChange('profile', 'emergency_contact_phone', e.target.value)}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="profile-info-grid">
                                <div className="profile-info-item">
                                    <span className="profile-info-label">Fecha de Nacimiento</span>
                                    <span className="profile-info-value">
                                        {profile?.birth_date ? `${formatDate(profile.birth_date)} (${calculateAge(profile.birth_date)} años)` : '—'}
                                    </span>
                                </div>
                                <div className="profile-info-item">
                                    <span className="profile-info-label">Género</span>
                                    <span className="profile-info-value">{profile?.gender || '—'}</span>
                                </div>
                                <div className="profile-info-item">
                                    <span className="profile-info-label">Dirección</span>
                                    <span className="profile-info-value">{profile?.address || '—'}</span>
                                </div>
                                <div className="profile-info-item">
                                    <span className="profile-info-label">Ciudad / Depto</span>
                                    <span className="profile-info-value">
                                        {profile?.city && profile?.state
                                            ? `${profile.city}, ${profile.state}`
                                            : profile?.city || profile?.state || '—'}
                                    </span>
                                </div>
                                <div className="profile-info-item">
                                    <span className="profile-info-label">Contacto de Emergencia</span>
                                    <span className="profile-info-value">{profile?.emergency_contact_name || '—'}</span>
                                </div>
                                <div className="profile-info-item">
                                    <span className="profile-info-label">Tel. Emergencia</span>
                                    <span className="profile-info-value">{profile?.emergency_contact_phone || '—'}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Education & Certifications Card */}
                    <div className="profile-card">
                        <div className="profile-card-title">
                            <span className="profile-card-title-icon">🎓</span>
                            Educación y Certificaciones
                        </div>
                        {editMode ? (
                            <>
                                <div className="profile-info-grid" style={{ marginBottom: 16 }}>
                                    <div className="form-group">
                                        <label className="form-label">Nivel Educativo</label>
                                        <select
                                            className="form-input"
                                            value={formData.profile.education_level}
                                            onChange={(e) => handleChange('profile', 'education_level', e.target.value)}
                                        >
                                            <option value="">Seleccionar</option>
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
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Especialización Deportiva</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.profile.specialization}
                                            onChange={(e) => handleChange('profile', 'specialization', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Certificaciones (separadas por coma)</label>
                                    <textarea
                                        className="form-input"
                                        value={formData.profile.certifications}
                                        onChange={(e) => handleChange('profile', 'certifications', e.target.value)}
                                        placeholder="Ej: Licencia CONMEBOL B, Primeros Auxilios, Preparación Física Avanzada"
                                        rows={3}
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="profile-info-grid" style={{ marginBottom: 20 }}>
                                    <div className="profile-info-item">
                                        <span className="profile-info-label">Nivel Educativo</span>
                                        <span className="profile-info-value">{profile?.education_level || '—'}</span>
                                    </div>
                                    <div className="profile-info-item">
                                        <span className="profile-info-label">Institución</span>
                                        <span className="profile-info-value">{profile?.institution || '—'}</span>
                                    </div>
                                    <div className="profile-info-item">
                                        <span className="profile-info-label">Especialización Deportiva</span>
                                        <span className="profile-info-value">{profile?.specialization || '—'}</span>
                                    </div>
                                </div>
                                {profile?.certifications && (
                                    <>
                                        <span className="profile-info-label" style={{ display: 'block', marginBottom: 10 }}>
                                            Certificaciones Obtenidas
                                        </span>
                                        <div className="profile-tags-container">
                                            {profile.certifications.split(',').map((cert, idx) => {
                                                const trimmed = cert.trim();
                                                if (!trimmed) return null;
                                                const colors = ['profile-tag-blue', 'profile-tag-orange', 'profile-tag-purple'];
                                                const colorClass = colors[idx % colors.length];
                                                return (
                                                    <span key={idx} className={`profile-tag ${colorClass}`}>
                                                        📜 {trimmed}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>

                    {/* Experience Card */}
                    <div className="profile-card">
                        <div className="profile-card-title">
                            <span className="profile-card-title-icon">📋</span>
                            Experiencia y Perfil Profesional
                        </div>
                        {editMode ? (
                            <>
                                <div className="profile-info-grid" style={{ marginBottom: 16 }}>
                                    <div className="form-group">
                                        <label className="form-label">Años de Experiencia</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={formData.profile.years_of_experience}
                                            onChange={(e) => handleChange('profile', 'years_of_experience', e.target.value)}
                                            min="0"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Clubes Anteriores</label>
                                    <textarea
                                        className="form-input"
                                        value={formData.profile.previous_clubs}
                                        onChange={(e) => handleChange('profile', 'previous_clubs', e.target.value)}
                                        placeholder="Describe los clubes donde has trabajado..."
                                        rows={3}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Bio / Resumen Profesional</label>
                                    <textarea
                                        className="form-input"
                                        value={formData.profile.bio}
                                        onChange={(e) => handleChange('profile', 'bio', e.target.value)}
                                        placeholder="Cuéntanos sobre tu experiencia..."
                                        rows={4}
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="profile-info-grid" style={{ marginBottom: 16 }}>
                                    <div className="profile-info-item">
                                        <span className="profile-info-label">Años de Experiencia</span>
                                        <span className="profile-info-value" style={{
                                            fontSize: '1.2rem',
                                            fontWeight: 700,
                                            color: 'var(--brand-600)'
                                        }}>
                                            {profile?.years_of_experience || '0'} Años
                                        </span>
                                    </div>
                                </div>
                                {profile?.bio && (
                                    <>
                                        <span className="profile-info-label" style={{ display: 'block', marginBottom: 10 }}>
                                            Bio / Resumen Profesional
                                        </span>
                                        <div className="profile-bio-text">
                                            {profile.bio}
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Right Column - Operational Info */}
                <div>
                    {/* Contractual Info Card */}
                    <div className="profile-card">
                        <div className="profile-card-title">
                            <span className="profile-card-title-icon">💰</span>
                            Información Contractual
                        </div>
                        {editMode ? (
                            <div className="profile-info-grid">
                                <div className="form-group">
                                    <label className="form-label">Tipo de Contrato</label>
                                    <select
                                        className="form-input"
                                        value={formData.profile.contract_type}
                                        onChange={(e) => handleChange('profile', 'contract_type', e.target.value)}
                                    >
                                        <option value="">Seleccionar</option>
                                        <option value="Tiempo completo">Tiempo completo</option>
                                        <option value="Medio tiempo">Medio tiempo</option>
                                        <option value="Contrato">Contrato</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Frecuencia de Pago</label>
                                    <select
                                        className="form-input"
                                        value={formData.profile.payment_frequency}
                                        onChange={(e) => handleChange('profile', 'payment_frequency', e.target.value)}
                                    >
                                        <option value="">Seleccionar</option>
                                        <option value="Mensual">Mensual</option>
                                        <option value="Quincenal">Quincenal</option>
                                        <option value="Semanal">Semanal</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Salario Base</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.profile.salary}
                                        onChange={(e) => handleChange('profile', 'salary', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Fecha de Contratación</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={formData.profile.hire_date}
                                        onChange={(e) => handleChange('profile', 'hire_date', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Banco</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.profile.bank_name}
                                        onChange={(e) => handleChange('profile', 'bank_name', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Tipo de Cuenta</label>
                                    <select
                                        className="form-input"
                                        value={formData.profile.bank_account_type}
                                        onChange={(e) => handleChange('profile', 'bank_account_type', e.target.value)}
                                    >
                                        <option value="">Seleccionar</option>
                                        <option value="Ahorros">Ahorros</option>
                                        <option value="Corriente">Corriente</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="form-label">Número de Cuenta</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.profile.bank_account_number}
                                        onChange={(e) => handleChange('profile', 'bank_account_number', e.target.value)}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="profile-info-grid">
                                <div className="profile-info-item">
                                    <span className="profile-info-label">Tipo de Contrato</span>
                                    <span className="profile-info-value">{profile?.contract_type || '—'}</span>
                                </div>
                                <div className="profile-info-item">
                                    <span className="profile-info-label">Frecuencia de Pago</span>
                                    <span className="profile-info-value">{profile?.payment_frequency || '—'}</span>
                                </div>
                                <div className="profile-info-item">
                                    <span className="profile-info-label">Salario Base</span>
                                    <span className="profile-info-value" style={{
                                        color: 'var(--success-700)',
                                        fontWeight: 700
                                    }}>
                                        {profile?.salary
                                            ? `$${parseFloat(profile.salary).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`
                                            : '—'}
                                    </span>
                                </div>
                                <div className="profile-info-item">
                                    <span className="profile-info-label">Fecha de Contratación</span>
                                    <span className="profile-info-value">
                                        {profile?.hire_date ? formatDate(profile.hire_date) : '—'}
                                    </span>
                                </div>
                                <div className="profile-info-item">
                                    <span className="profile-info-label">Banco</span>
                                    <span className="profile-info-value">{profile?.bank_name || '—'}</span>
                                </div>
                                <div className="profile-info-item">
                                    <span className="profile-info-label">Tipo de Cuenta</span>
                                    <span className="profile-info-value">{profile?.bank_account_type || '—'}</span>
                                </div>
                                <div className="profile-info-item" style={{ gridColumn: '1 / -1' }}>
                                    <span className="profile-info-label">Número de Cuenta</span>
                                    <span className="profile-info-value" style={{ fontFamily: 'monospace' }}>
                                        {profile?.bank_account_number || '—'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Contact Info Card */}
                    <div className="profile-card">
                        <div className="profile-card-title">
                            <span className="profile-card-title-icon">📞</span>
                            Información de Contacto
                        </div>
                        {editMode ? (
                            <div className="profile-info-grid">
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        value={formData.user.email}
                                        onChange={(e) => handleChange('user', 'email', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Teléfono</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.user.phone}
                                        onChange={(e) => handleChange('user', 'phone', e.target.value)}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="profile-info-grid">
                                <div className="profile-info-item">
                                    <span className="profile-info-label">Email</span>
                                    <span className="profile-info-value">{user?.email || '—'}</span>
                                </div>
                                <div className="profile-info-item">
                                    <span className="profile-info-label">Teléfono</span>
                                    <span className="profile-info-value">{user?.phone || '—'}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrainerProfile;