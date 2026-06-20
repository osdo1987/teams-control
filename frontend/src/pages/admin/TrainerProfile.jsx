import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { userService } from '../../services/userService';
import { useToast } from '../../contexts/ToastContext';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f97316', '#ec4899', '#0ea5e9'];
const avatarColor = (name = '') => COLORS[name.charCodeAt(0) % COLORS.length];
const initials = (first = '?', last = '?') => `${first?.[0] || '?'}${last?.[0] || '?'}`.toUpperCase();

const TrainerProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [trainer, setTrainer] = useState(null);
    const [loading, setLoading] = useState(true);
    const { showError } = useToast();

    useEffect(() => {
        fetchTrainer();
    }, [id]);

    const fetchTrainer = async () => {
        try {
            const data = await authService.getTrainers();
            const found = data?.find(t => t.id === parseInt(id));
            if (!found) {
                showError('Entrenador no encontrado');
                navigate('/admin/trainers');
                return;
            }
            setTrainer(found);
        } catch (err) {
            showError('Error al cargar perfil del entrenador');
        } finally {
            setLoading(false);
        }
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

    const tp = trainer.trainer_profile || {};
    const fullName = `${trainer.first_name} ${trainer.last_name}`;

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
                </div>
            </div>

            {/* Profile Hero */}
            <div className="profile-hero">
                <div className="profile-hero-avatar">
                    {initials(trainer.first_name, trainer.last_name)}
                </div>
                <div className="profile-hero-info">
                    <h1>{fullName}</h1>
                    <p className="profile-hero-subtitle">
                        {tp.specialization || 'Entrenador'} · {tp.years_of_experience ? `${tp.years_of_experience} años de experiencia` : 'Sin experiencia registrada'}
                    </p>
                    <div className="profile-hero-badges">
                        {trainer.is_active !== false && (
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
                    </div>

                    {/* Education & Certifications Card */}
                    <div className="profile-card">
                        <div className="profile-card-title">
                            <span className="profile-card-title-icon">🎓</span>
                            Educación y Certificaciones
                        </div>
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
                    </div>

                    {/* Experience Card */}
                    <div className="profile-card">
                        <div className="profile-card-title">
                            <span className="profile-card-title-icon">📋</span>
                            Experiencia y Perfil Profesional
                        </div>
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
                        </div>
                    </div>

                    {/* Contact Info Card */}
                    <div className="profile-card">
                        <div className="profile-card-title">
                            <span className="profile-card-title-icon">📞</span>
                            Información de Contacto
                        </div>
                        <div className="profile-info-grid">
                            <div className="profile-info-item">
                                <span className="profile-info-label">Email</span>
                                <span className="profile-info-value">{trainer.email || '—'}</span>
                            </div>
                            <div className="profile-info-item">
                                <span className="profile-info-label">Teléfono</span>
                                <span className="profile-info-value">{trainer.phone || '—'}</span>
                            </div>
                            <div className="profile-info-item">
                                <span className="profile-info-label">Identificación</span>
                                <span className="profile-info-value" style={{ fontFamily: 'monospace' }}>
                                    {trainer.identification_number || '—'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrainerProfile;