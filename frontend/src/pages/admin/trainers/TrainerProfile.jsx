import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { userService } from '../../services/userService';
import trainerService from '../../services/trainerService';
import { useToast } from '../../contexts/ToastContext';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f97316', '#ec4899', '#0ea5e9'];
const avatarColor = (name = '') => COLORS[name.charCodeAt(0) % COLORS.length];
const initials = (first = '?', last = '?') => `${first?.[0] || '?'}${last?.[0] || '?'}`.toUpperCase();

const TrainerProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [trainer, setTrainer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const { showError, showSuccess } = useToast();
    const [formData, setFormData] = useState({ user: {}, profile: {} });

    useEffect(() => {
        fetchTrainer();
    }, [id]);

    const fetchTrainer = async () => {
        try {
            const data = await trainerService.getAdminProfile(id);
            setTrainer(data);
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
                    status: data.profile.status || 'ACTIVE',
                },
            });
        } catch (err) {
            showError('Error al cargar perfil del entrenador');
            navigate('/admin/trainers');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await trainerService.updateAdminProfile(id, formData);
            showSuccess('Perfil de entrenador actualizado correctamente');
            setEditMode(false);
            await fetchTrainer();
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
                <p>Cargando perfil del entrenador...</p>
            </div>
        );
    }

    if (!trainer) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <p>Entrenador no encontrado.</p>
            </div>
        );
    }

    const tp = trainer.profile || {};
    const u = trainer.user || {};
    const fullName = `${u.first_name} ${u.last_name}`;

    return (
        <div className="athlete-profile-page">
            {/* Header with back button */}
            <div className="page-header">
                <div>
                    <h1>Perfil del Entrenador</h1>
                    <p className="text-muted">Gestión de información y datos de {fullName}</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-ghost" onClick={() => navigate('/admin/trainers')}>← Volver a Entrenadores</button>
                    {editMode ? (
                        <>
                            <button className="btn btn-secondary" onClick={() => { setEditMode(false); fetchTrainer(); }}>
                                Cancelar
                            </button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                {saving ? 'Guardando...' : '💾 Guardar Cambios'}
                            </button>
                        </>
                    ) : (
                        <button className="btn btn-primary" onClick={() => setEditMode(true)}>
                            ✏️ Editar Perfil
                        </button>
                    )}
                </div>
            </div>

            {/* Profile Hero */}
            <div className="profile-hero">
                <div className="profile-hero-avatar" style={{ background: avatarColor(u.first_name || 'E') }}>
                    {initials(u.first_name, u.last_name)}
                </div>
                <div className="profile-hero-info">
                    <h1>{fullName}</h1>
                    <p className="profile-hero-subtitle">
                        {tp.specialization || 'Entrenador'} · {tp.years_of_experience ? `${tp.years_of_experience} años de experiencia` : 'Sin experiencia registrada'}
                    </p>
                    <div className="profile-hero-badges">
                        {u.is_active !== false && (
                            <span className="profile-hero-badge profile-hero-badge-success">🟢 Activo</span>
                        )}
                        {tp.contract_type && (
                            <span className="profile-hero-badge">📄 {tp.contract_type}</span>
                        )}
                        {tp.education_level && (
                            <span className="profile-hero-badge">🎓 {tp.education_level}</span>
                        )}
                        {tp.certifications && (
                            <span className="profile-hero-badge profile-tag-purple">
                                📜 {tp.certifications.split(',')[0].trim()}
                            </span>
                        )}
                    </div>
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
                                        {tp.birth_date ? `${formatDate(tp.birth_date)} (${calculateAge(tp.birth_date)} años)` : '—'}
                                    </span>
                                </div>
                                <div className="profile-info-item">
                                    <span className="profile-info-label">Género</span>
                                    <span className="profile-info-value">{tp.gender || '—'}</span>
                                </div>
                                <div className="profile-info-item" style={{ gridColumn: '1 / -1' }}>
                                    <span className="profile-info-label">Dirección</span>
                                    <span className="profile-info-value">{tp.address || '—'}</span>
                                </div>
                                <div className="profile-info-item">
                                    <span className="profile-info-label">Ciudad / Depto</span>
                                    <span className="profile-info-value">
                                        {tp.city && tp.state ? `${tp.city}, ${tp.state}` : tp.city || tp.state || '—'}
                                    </span>
                                </div>
                                <div className="profile-info-item">
                                    <span className="profile-info-label">Contacto de Emergencia</span>
                                    <span className="profile-info-value">{tp.emergency_contact_name || '—'}</span>
                                </div>
                                <div className="profile-info-item">
                                    <span className="profile-info-label">Tel. Emergencia</span>
                                    <span className="profile-info-value">{tp.emergency_contact_phone || '—'}</span>
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
                                        <span className="profile-info-value">{tp.education_level || '—'}</span>
                                    </div>
                                    <div className="profile-info-item">
                                        <span className="profile-info-label">Institución</span>
                                        <span className="profile-info-value">{tp.institution || '—'}</span>
                                    </div>
                                    <div className="profile-info-item">
                                        <span className="profile-info-label">Especialización Deportiva</span>
                                        <span className="profile-info-value">{tp.specialization || '—'}</span>
                                    </div>
                                </div>
                                {tp.certifications && (
                                    <>
                                        <span className="profile-info-label" style={{ display: 'block', marginBottom: 10 }}>
                                            Certificaciones Obtenidas
                                        </span>
                                        <div className="profile-tags-container">
                                            {tp.certifications.split(',').map((cert, idx) => {
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
                                        placeholder="Describe los clubes donde ha trabajado..."
                                        rows={3}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Bio / Resumen Profesional</label>
                                    <textarea
                                        className="form-input"
                                        value={formData.profile.bio}
                                        onChange={(e) => handleChange('profile', 'bio', e.target.value)}
                                        placeholder="Cuéntanos sobre su experiencia..."
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
                                            {tp.years_of_experience || '0'} Años
                                        </span>
                                    </div>
                                </div>
                                {tp.bio && (
                                    <>
                                        <span className="profile-info-label" style={{ display: 'block', marginBottom: 10 }}>
                                            Bio / Resumen Profesional
                                        </span>
                                        <div className="profile-bio-text">
                                            {tp.bio}
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
                                <div className="form-group">
                                    <label className="form-label">NIT / RUT</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.profile.tax_id}
                                        onChange={(e) => handleChange('profile', 'tax_id', e.target.value)}
                                        placeholder="NIT o RUT"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Estado</label>
                                    <select
                                        className="form-input"
                                        value={formData.profile.status}
                                        onChange={(e) => handleChange('profile', 'status', e.target.value)}
                                    >
                                        <option value="ACTIVE">Activo</option>
                                        <option value="INACTIVE">Inactivo</option>
                                        <option value="ON_LEAVE">En Permiso</option>
                                    </select>
                                </div>
                            </div>
                        ) : (
                            <div className="profile-info-grid">
                                <div className="profile-info-item">
                                    <span className="profile-info-label">Tipo de Contrato</span>
                                    <span className="profile-info-value">{tp.contract_type || '—'}</span>
                                </div>
                                <div className="profile-info-item">
                                    <span className="profile-info-label">Frecuencia de Pago</span>
                                    <span className="profile-info-value">{tp.payment_frequency || '—'}</span>
                                </div>
                                <div className="profile-info-item">
                                    <span className="profile-info-label">Salario Base</span>
                                    <span className="profile-info-value" style={{
                                        color: 'var(--success-700)',
                                        fontWeight: 700
                                    }}>
                                        {tp.salary
                                            ? `$${parseFloat(tp.salary).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`
                                            : '—'}
                                    </span>
                                </div>
                                <div className="profile-info-item">
                                    <span className="profile-info-label">Fecha de Contratación</span>
                                    <span className="profile-info-value">
                                        {tp.hire_date ? formatDate(tp.hire_date) : '—'}
                                    </span>
                                </div>
                                <div className="profile-info-item">
                                    <span className="profile-info-label">Banco</span>
                                    <span className="profile-info-value">{tp.bank_name || '—'}</span>
                                </div>
                                <div className="profile-info-item">
                                    <span className="profile-info-label">Tipo de Cuenta</span>
                                    <span className="profile-info-value">{tp.bank_account_type || '—'}</span>
                                </div>
                                <div className="profile-info-item" style={{ gridColumn: '1 / -1' }}>
                                    <span className="profile-info-label">Número de Cuenta</span>
                                    <span className="profile-info-value" style={{ fontFamily: 'monospace' }}>
                                        {tp.bank_account_number || '—'}
                                    </span>
                                </div>
                                <div className="profile-info-item">
                                    <span className="profile-info-label">NIT / RUT</span>
                                    <span className="profile-info-value" style={{ fontFamily: 'monospace' }}>
                                        {tp.tax_id || '—'}
                                    </span>
                                </div>
                                <div className="profile-info-item">
                                    <span className="profile-info-label">Estado</span>
                                    <span className="profile-info-value">
                                        {tp.status === 'ACTIVE' ? '🟢 Activo' : tp.status === 'INACTIVE' ? '🔴 Inactivo' : '🟡 En Permiso'}
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
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="form-label">Nombres</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.user.first_name}
                                        onChange={(e) => handleChange('user', 'first_name', e.target.value)}
                                        placeholder="Nombres"
                                    />
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="form-label">Apellidos</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.user.last_name}
                                        onChange={(e) => handleChange('user', 'last_name', e.target.value)}
                                        placeholder="Apellidos"
                                    />
                                </div>
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
                                    <span className="profile-info-value">{u.email || '—'}</span>
                                </div>
                                <div className="profile-info-item">
                                    <span className="profile-info-label">Teléfono</span>
                                    <span className="profile-info-value">{u.phone || '—'}</span>
                                </div>
                                <div className="profile-info-item">
                                    <span className="profile-info-label">Identificación</span>
                                    <span className="profile-info-value" style={{ fontFamily: 'monospace' }}>
                                        {u.identification_number || '—'}
                                    </span>
                                </div>
                                <div className="profile-info-item">
                                    <span className="profile-info-label">Club</span>
                                    <span className="profile-info-value">{u.club_name || '—'}</span>
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