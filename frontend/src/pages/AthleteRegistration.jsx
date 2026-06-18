import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';

// Icons inline to avoid dependency issues
const IconUser = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
const IconMail = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>;
const IconPhone = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>;
const IconLock = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
const IconIdCard = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const IconCalendar = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
const IconCamera = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>;
const IconMapPin = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>;
const IconSchool = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>;
const IconClipboard = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" /></svg>;
const IconCheck = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
const IconArrowLeft = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>;
const IconArrowRight = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12h14" /><path d="m12 5 7 7-7 7" /></svg>;
const IconImage = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>;

const STEPS = [
    { id: 1, label: 'Datos', icon: 'person' },
    { id: 2, label: 'Contacto', icon: 'contact' },
    { id: 3, label: 'Médico', icon: 'medical' },
    { id: 4, label: 'Finalizar', icon: 'academic' },
];

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const PASSWORD_RULES = {
    minLength: 8,
    requireUpper: true,
    requireLower: true,
    requireNumber: true,
};

const AthleteRegistration = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const clubSlug = searchParams.get('club');

    const { showError, showSuccess } = useToast(); // Use toast for errors/success
    const [clubs, setClubs] = useState([]);
    const [clubInfo, setClubInfo] = useState(null);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        club_id: '',
        first_name: '',
        last_name: '',
        identification_number: '',
        email: '',
        phone: '',
        address: '',
        birth_date: '',
        photo_url: '',
        password: '',
        confirm_password: '',
        guardian_name: '',
        guardian_relationship: '',
        guardian_phone: '',
        guardian_email: '',
        blood_type: '',
        allergies: '',
        medical_conditions: '',
        emergency_contact: '',
        school_name: '',
        grade: '',
    });

    const fileInputRef = useRef(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [passwordErrors, setPasswordErrors] = useState([]);

    const accentColor = clubInfo?.primary_color || '#6366f1';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const clubsData = await api('/registration/clubs');
                setClubs(clubsData);
                if (clubSlug) {
                    const matched = clubsData.find(c => c.slug === clubSlug);
                    if (matched) {
                        setClubInfo(matched);
                        setForm(prev => ({ ...prev, club_id: matched.id }));
                    }
                }
            } catch (err) {
                // Ignore
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [clubSlug]);

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        if (field === 'password') {
            validatePassword(value);
        }
    };

    const validatePassword = (password) => {
        const errors = [];
        let strength = 0;

        if (password.length >= PASSWORD_RULES.minLength) strength += 25;
        else errors.push(`Mínimo ${PASSWORD_RULES.minLength} caracteres`);

        if (/[A-Z]/.test(password)) strength += 25;
        else errors.push('Una mayúscula');

        if (/[a-z]/.test(password)) strength += 25;
        else errors.push('Una minúscula');

        if (/\d/.test(password)) strength += 25;
        else errors.push('Un número');

        setPasswordStrength(strength);
        setPasswordErrors(errors);
    };

    const getStrengthLabel = () => {
        if (passwordStrength === 0) return '';
        if (passwordStrength <= 25) return 'Débil';
        if (passwordStrength <= 50) return 'Regular';
        if (passwordStrength <= 75) return 'Buena';
        return 'Fuerte';
    };

    const getStrengthColor = () => {
        if (passwordStrength <= 25) return '#ef4444';
        if (passwordStrength <= 50) return '#f59e0b';
        if (passwordStrength <= 75) return '#3b82f6';
        return '#10b981';
    };

    const handleClubChange = (clubId) => {
        handleChange('club_id', clubId);
        const matched = clubs.find(c => c.id === parseInt(clubId));
        setClubInfo(matched || null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validación de contraseña mejorada
        if (form.password !== form.confirm_password) {
            setError('Las contraseñas no coinciden');
            return;
        }
        if (passwordErrors.length > 0) {
            setError('La contraseña no cumple con los requisitos de seguridad');
            return;
        }

        setSubmitting(true);
        try {
            const result = await api('/registration/register', {
                method: 'POST',
                body: JSON.stringify(form),
            });
            setSuccess(result.message || 'Registro exitoso');
            // Redirigir a la landing/login del club
            const redirectSlug = clubSlug || result.club_slug;
            setTimeout(() => navigate(`/${redirectSlug}`), 2000);
        } catch (err) {
            setError(err.message || 'Error al registrar');
        } finally {
            setSubmitting(false);
        }
    };

    const nextStep = () => {
        setError('');
        if (step === 1) {
            if (!form.first_name || !form.last_name || !form.identification_number) {
                setError('Los campos marcados son obligatorios');
                return;
            }
            if (!form.club_id) {
                setError('Selecciona un club');
                return;
            }
        }
        if (step === 2) {
            if (!form.email && !form.phone) {
                setError('Ingresa al menos un email o teléfono de contacto');
                return;
            }
        }
        setStep(prev => Math.min(prev + 1, 4));
    };

    const prevStep = () => {
        setError('');
        setStep(prev => Math.max(prev - 1, 1));
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('La imagen es demasiado grande. Máximo 5MB.');
            return;
        }

        setUploadingPhoto(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('file', file);

            const token = localStorage.getItem('access_token');
            const response = await fetch('/api/registration/upload-photo', {
                method: 'POST',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                body: formData,
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Error al subir la foto');
            }

            handleChange('photo_url', data.url);
        } catch (err) {
            setError(err.message || 'Error al subir la foto');
        } finally {
            setUploadingPhoto(false);
        }
    };

    const inputStyle = clubInfo ? { '--focus-color': accentColor } : {};

    const fallbackAvatar = clubInfo?.logo_url || null;

    if (loading) {
        return (
            <div className="auth-screen reg-screen">
                <div className="auth-form-side" style={{ width: '100%', maxWidth: 600, margin: '0 auto' }}>
                    <div className="loading-state">
                        <div className="spinner spinner-lg" style={clubInfo ? { borderTopColor: accentColor } : {}} />
                        <p>Cargando...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-screen reg-screen">
            {/* Left decorative side */}
            <div className="auth-side reg-side">
                <div className="auth-brand">
                    <div className="brand-mark">
                        <span style={{ fontSize: 20 }}>⚡</span>
                    </div>
                    <h1>{clubInfo?.name || 'Club Manager'}</h1>
                </div>

                <div className="auth-content reg-side-content">
                    {clubInfo ? (
                        <>
                            <div className="reg-club-badge">
                                {clubInfo.logo_url && <img src={clubInfo.logo_url} alt={clubInfo.name} />}
                                <div>
                                    <strong>{clubInfo.name}</strong>
                                    <span>{clubInfo.sport}</span>
                                </div>
                            </div>
                            <h2>Registro de Atleta</h2>
                            <p>Completa tus datos en pocos pasos y forma parte de nuestro equipo.</p>
                        </>
                    ) : (
                        <>
                            <h2>Únete al club</h2>
                            <p>Regístrate como atleta y comienza a entrenar con nosotros.</p>
                        </>
                    )}

                    <div className="auth-features">
                        <div className="auth-feature">
                            <div className="icon">📋</div>
                            <span>Completa tu perfil deportivo</span>
                        </div>
                        <div className="auth-feature">
                            <div className="icon">🏥</div>
                            <span>Información médica opcional</span>
                        </div>
                        <div className="auth-feature">
                            <div className="icon">🔐</div>
                            <span>Contraseña segura, mínimo 8 caracteres</span>
                        </div>
                    </div>
                </div>

                <div className="auth-footer">
                    © {new Date().getFullYear()} {clubInfo?.name || 'Club Manager'}
                </div>
            </div>

            {/* Form side */}
            <div className="auth-form-side reg-form-side">
                <div className="auth-form reg-form">
                    {/* Progress Steps */}
                    <div className="reg-steps" style={inputStyle}>
                        {STEPS.map((s, i) => (
                            <React.Fragment key={s.id}>
                                <div
                                    className={`reg-step ${step === s.id ? 'active' : ''} ${step > s.id ? 'completed' : ''}`}
                                    onClick={() => step > s.id && setStep(s.id)}
                                    style={step === s.id ? { '--step-color': accentColor } : {}}
                                >
                                    <div className="reg-step-circle">
                                        {step > s.id ? <IconCheck /> : s.icon === 'person' ? '1' : s.icon === 'contact' ? '2' : s.icon === 'medical' ? '3' : '4'}
                                    </div>
                                    <span className="reg-step-label">{s.label}</span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className={`reg-step-line ${step > s.id ? 'completed' : ''}`}
                                        style={step > s.id ? { background: accentColor } : {}} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>

                    <div className="reg-form-card">
                        {/* Header */}
                        <div className="reg-form-header">
                            <h3>{step === 1 ? '🏋️ Datos Personales' : step === 2 ? '📞 Contacto' : step === 3 ? '🏥 Médico' : '🎓 Finalizar'}</h3>
                            <p>
                                {step === 1 && 'Información básica del atleta'}
                                {step === 2 && 'Datos de contacto y acudiente'}
                                {step === 3 && 'Información médica (opcional)'}
                                {step === 4 && 'Datos académicos y seguridad'}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {/* Step 1 - Personal Data */}
                            {step === 1 && (
                                <>
                                    <div className="form-group">
                                        <label className="form-label">Club</label>
                                        {clubSlug && clubInfo ? (
                                            <div className="reg-club-selected" style={{ borderColor: accentColor, background: `${accentColor}08` }}>
                                                {clubInfo.logo_url && <img src={clubInfo.logo_url} alt="" />}
                                                <div>
                                                    <div style={{ fontWeight: 700 }}>{clubInfo.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{clubInfo.sport}</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <select className="form-input" value={form.club_id} onChange={(e) => handleClubChange(e.target.value)} required style={inputStyle}>
                                                <option value="">Selecciona un club...</option>
                                                {clubs.map((c) => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>

                                    {/* Avatar / Photo upload section */}
                                    <div className="reg-avatar-section">
                                        <div className="reg-avatar-preview" style={clubInfo ? { '--accent': accentColor } : {}}>
                                            {form.photo_url ? (
                                                <img src={form.photo_url} alt="Preview" />
                                            ) : fallbackAvatar ? (
                                                <img src={fallbackAvatar} alt="Club" className="reg-avatar-fallback" />
                                            ) : (
                                                <div className="reg-avatar-placeholder">
                                                    <IconCamera />
                                                </div>
                                            )}
                                            {uploadingPhoto && (
                                                <div className="reg-avatar-uploading">
                                                    <div className="spinner" style={{ borderTopColor: 'white', width: 16, height: 16, borderWidth: 2 }} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="reg-avatar-info">
                                            <label className="form-label">Foto de perfil (opcional)</label>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 6px' }}>
                                                {fallbackAvatar ? 'Se usará el logo del club si no subes una foto' : 'Sube una foto desde tu dispositivo'}
                                            </p>
                                            <div className="reg-upload-actions">
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    onChange={handlePhotoUpload}
                                                    accept="image/png,image/jpeg,image/gif,image/webp"
                                                    style={{ display: 'none' }}
                                                />
                                                <button
                                                    type="button"
                                                    className="btn btn-outline btn-sm"
                                                    onClick={() => fileInputRef.current.click()}
                                                    disabled={uploadingPhoto}
                                                    style={clubInfo ? { '--accent': accentColor } : {}}
                                                >
                                                    {uploadingPhoto ? 'Subiendo...' : <><IconCamera /> Elegir foto</>}
                                                </button>
                                                {form.photo_url && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-ghost btn-sm"
                                                        onClick={() => handleChange('photo_url', '')}
                                                        style={{ color: 'var(--danger-500)' }}
                                                    >
                                                        Quitar
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-grid-2">
                                        <div className="form-group">
                                            <label className="form-label">Nombres *</label>
                                            <div className="input-with-icon">
                                                <IconUser />
                                                <input type="text" className="form-input" value={form.first_name} onChange={(e) => handleChange('first_name', e.target.value)} required placeholder="Ej: Juan Carlos" style={inputStyle} />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Apellidos *</label>
                                            <div className="input-with-icon">
                                                <IconUser />
                                                <input type="text" className="form-input" value={form.last_name} onChange={(e) => handleChange('last_name', e.target.value)} required placeholder="Ej: Pérez García" style={inputStyle} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-grid-2">
                                        <div className="form-group">
                                            <label className="form-label">N° Identificación *</label>
                                            <div className="input-with-icon">
                                                <IconIdCard />
                                                <input type="text" className="form-input" value={form.identification_number} onChange={(e) => handleChange('identification_number', e.target.value)} required placeholder="Ej: 1140892301" style={inputStyle} />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Fecha de Nacimiento</label>
                                            <div className="input-with-icon">
                                                <IconCalendar />
                                                <input type="date" className="form-input" value={form.birth_date} onChange={(e) => handleChange('birth_date', e.target.value)} style={inputStyle} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="reg-nav-buttons">
                                        <div />
                                        <button type="button" className="btn btn-primary btn-lg" onClick={nextStep}
                                            style={clubInfo ? { background: accentColor, borderColor: accentColor } : {}}>
                                            Siguiente <IconArrowRight />
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* Step 2 - Contact */}
                            {step === 2 && (
                                <>
                                    <div className="form-grid-2">
                                        <div className="form-group">
                                            <label className="form-label">Email</label>
                                            <div className="input-with-icon">
                                                <IconMail />
                                                <input type="email" className="form-input" value={form.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="atleta@ejemplo.com" style={inputStyle} />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Teléfono</label>
                                            <div className="input-with-icon">
                                                <IconPhone />
                                                <input type="text" className="form-input" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="+573001234567" style={inputStyle} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Dirección</label>
                                        <div className="input-with-icon">
                                            <IconMapPin />
                                            <input type="text" className="form-input" value={form.address} onChange={(e) => handleChange('address', e.target.value)} placeholder="Dirección de residencia" style={inputStyle} />
                                        </div>
                                    </div>

                                    <div className="reg-section-divider">
                                        <span>👨‍👩‍👧 Acudiente (opcional)</span>
                                    </div>

                                    <div className="form-grid-2">
                                        <div className="form-group">
                                            <label className="form-label">Nombre del Acudiente</label>
                                            <input type="text" className="form-input" value={form.guardian_name} onChange={(e) => handleChange('guardian_name', e.target.value)} placeholder="Nombre completo" style={inputStyle} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Parentesco</label>
                                            <input type="text" className="form-input" value={form.guardian_relationship} onChange={(e) => handleChange('guardian_relationship', e.target.value)} placeholder="Ej: Madre, Padre" style={inputStyle} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Teléfono del Acudiente</label>
                                            <div className="input-with-icon">
                                                <IconPhone />
                                                <input type="text" className="form-input" value={form.guardian_phone} onChange={(e) => handleChange('guardian_phone', e.target.value)} placeholder="+573001234567" style={inputStyle} />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Email del Acudiente</label>
                                            <div className="input-with-icon">
                                                <IconMail />
                                                <input type="email" className="form-input" value={form.guardian_email} onChange={(e) => handleChange('guardian_email', e.target.value)} placeholder="acudiente@ejemplo.com" style={inputStyle} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="reg-nav-buttons">
                                        <button type="button" className="btn btn-secondary btn-lg" onClick={prevStep}>
                                            <IconArrowLeft /> Anterior
                                        </button>
                                        <button type="button" className="btn btn-primary btn-lg" onClick={nextStep}
                                            style={clubInfo ? { background: accentColor, borderColor: accentColor } : {}}>
                                            Siguiente <IconArrowRight />
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* Step 3 - Medical */}
                            {step === 3 && (
                                <>
                                    <div className="form-grid-2">
                                        <div className="form-group">
                                            <label className="form-label">Tipo de Sangre</label>
                                            <select className="form-input" value={form.blood_type} onChange={(e) => handleChange('blood_type', e.target.value)} style={inputStyle}>
                                                <option value="">Seleccionar...</option>
                                                {BLOOD_TYPES.map(bt => (
                                                    <option key={bt} value={bt}>{bt}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Contacto de Emergencia</label>
                                            <div className="input-with-icon">
                                                <IconPhone />
                                                <input type="text" className="form-input" value={form.emergency_contact} onChange={(e) => handleChange('emergency_contact', e.target.value)} placeholder="Nombre y teléfono" style={inputStyle} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Alergias</label>
                                        <textarea className="form-input" value={form.allergies} onChange={(e) => handleChange('allergies', e.target.value)} rows={3} placeholder="Ej: Penicilina, polen, mariscos..." style={inputStyle} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Condiciones Médicas</label>
                                        <textarea className="form-input" value={form.medical_conditions} onChange={(e) => handleChange('medical_conditions', e.target.value)} rows={3} placeholder="Ej: Asma, diabetes, hipertensión..." style={inputStyle} />
                                    </div>

                                    <div className="reg-nav-buttons">
                                        <button type="button" className="btn btn-secondary btn-lg" onClick={prevStep}>
                                            <IconArrowLeft /> Anterior
                                        </button>
                                        <button type="button" className="btn btn-primary btn-lg" onClick={nextStep}
                                            style={clubInfo ? { background: accentColor, borderColor: accentColor } : {}}>
                                            Siguiente <IconArrowRight />
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* Step 4 - Academic & Security */}
                            {step === 4 && (
                                <>
                                    <div className="form-grid-2">
                                        <div className="form-group">
                                            <label className="form-label">Colegio / Institución</label>
                                            <div className="input-with-icon">
                                                <IconSchool />
                                                <input type="text" className="form-input" value={form.school_name} onChange={(e) => handleChange('school_name', e.target.value)} placeholder="Nombre del colegio" style={inputStyle} />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Grado</label>
                                            <input type="text" className="form-input" value={form.grade} onChange={(e) => handleChange('grade', e.target.value)} placeholder="Ej: 5to, 6to" style={inputStyle} />
                                        </div>
                                    </div>

                                    <div className="reg-section-divider">
                                        <span>🔐 Contraseña segura</span>
                                    </div>

                                    <div className="form-grid-2">
                                        <div className="form-group">
                                            <label className="form-label">Contraseña *</label>
                                            <div className="input-with-icon">
                                                <IconLock />
                                                <input
                                                    type="password"
                                                    className="form-input"
                                                    value={form.password}
                                                    onChange={(e) => handleChange('password', e.target.value)}
                                                    required
                                                    minLength={PASSWORD_RULES.minLength}
                                                    placeholder={`Mínimo ${PASSWORD_RULES.minLength} caracteres`}
                                                    style={inputStyle}
                                                />
                                            </div>
                                            {form.password && (
                                                <div className="reg-password-strength">
                                                    <div className="reg-password-bar">
                                                        <div className="reg-password-fill" style={{
                                                            width: `${passwordStrength}%`,
                                                            background: getStrengthColor(),
                                                        }} />
                                                    </div>
                                                    <span className="reg-password-label" style={{ color: getStrengthColor() }}>
                                                        {getStrengthLabel()}
                                                    </span>
                                                </div>
                                            )}
                                            {passwordErrors.length > 0 && form.password && (
                                                <div className="reg-password-rules">
                                                    {passwordErrors.map((err, i) => (
                                                        <span key={i} className="reg-password-rule">
                                                            ✗ {err}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Confirmar Contraseña *</label>
                                            <div className="input-with-icon">
                                                <IconLock />
                                                <input
                                                    type="password"
                                                    className="form-input"
                                                    value={form.confirm_password}
                                                    onChange={(e) => handleChange('confirm_password', e.target.value)}
                                                    required
                                                    placeholder="Repite la contraseña"
                                                    style={{
                                                        ...inputStyle,
                                                        borderColor: form.confirm_password && form.password !== form.confirm_password ? 'var(--danger-500)' : undefined,
                                                    }}
                                                />
                                            </div>
                                            {form.confirm_password && form.password !== form.confirm_password && (
                                                <span style={{ fontSize: '0.75rem', color: 'var(--danger-500)', marginTop: 2 }}>
                                                    Las contraseñas no coinciden
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="reg-password-hint">
                                        La contraseña debe tener al menos {PASSWORD_RULES.minLength} caracteres, incluir mayúsculas, minúsculas y números.
                                    </div>

                                    <div className="reg-nav-buttons">
                                        <button type="button" className="btn btn-secondary btn-lg" onClick={prevStep}>
                                            <IconArrowLeft /> Anterior
                                        </button>
                                        <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}
                                            style={clubInfo ? { background: accentColor, borderColor: accentColor } : {}}>
                                            {submitting ? (
                                                <><span className="spinner" style={{ borderTopColor: 'white' }} /> Registrando...</>
                                            ) : (
                                                <><IconCheck /> Completar Registro</>
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}
                        </form>
                    </div>

                    <p className="reg-login-link">
                        ¿Ya tienes cuenta?{' '}
                        <Link to={clubSlug ? `/${clubSlug}` : '/'} style={clubInfo ? { color: accentColor } : {}}>
                            Inicia sesión
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AthleteRegistration;