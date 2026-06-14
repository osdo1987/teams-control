import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import clubService from '../services/clubService';
import { IconLock, IconIdCard, IconAlertCircle, IconZap, IconUsers, IconCreditCard, IconClipboard, IconArrowRight, IconEye, IconEyeOff } from '../components/Icons';

const ClubLogin = () => {
    const { clubSlug } = useParams();
    const navigate = useNavigate();
    const [club, setClub] = useState(null);
    const [loadingClub, setLoadingClub] = useState(true);
    const [clubNotFound, setClubNotFound] = useState(false);
    const [identificationNumber, setIdentificationNumber] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchClub = async () => {
            try {
                const data = await clubService.getPublicBySlug(clubSlug);
                setClub(data);
                document.title = `${data.name} - Iniciar Sesión`;
            } catch (err) {
                setClubNotFound(true);
                document.title = 'Club no encontrado';
            } finally {
                setLoadingClub(false);
            }
        };
        fetchClub();
    }, [clubSlug]);

    // Generate CSS variables from club's primary color
    const getAccentColor = () => club?.primary_color || '#6366f1';
    const getAccentLight = () => {
        const hex = getAccentColor().replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, 0.08)`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await authService.login(identificationNumber, password, clubSlug);
            if (data.user.role === 'SUPER_ADMIN') navigate('/super-admin');
            else if (data.user.role === 'ADMIN') navigate('/admin');
            else if (data.user.role === 'TRAINER') navigate('/trainer');
            else navigate('/athlete');
        } catch (err) {
            setError(err.message || 'Credenciales inválidas. Intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    // Loading state
    if (loadingClub) {
        return (
            <div className="auth-screen animate-fade-in">
                <div className="auth-side" style={{ background: `linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)` }}>
                    <div className="auth-brand">
                        <div className="brand-mark" style={{ background: getAccentColor() }}>
                            <IconZap size={22} />
                        </div>
                        <h1>Cargando...</h1>
                    </div>
                </div>
                <div className="auth-form-side">
                    <div className="auth-form" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="spinner" style={{ borderTopColor: getAccentColor() }} />
                    </div>
                </div>
            </div>
        );
    }

    // Club not found
    if (clubNotFound) {
        return (
            <div className="auth-screen animate-fade-in">
                <div className="auth-side" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
                    <div className="auth-brand">
                        <div className="brand-mark" style={{ background: '#6366f1' }}>
                            <IconZap size={22} />
                        </div>
                        <h1>Club Manager</h1>
                    </div>
                </div>
                <div className="auth-form-side">
                    <div className="auth-form" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem' }}>🔍</div>
                        <h2 style={{ fontWeight: 700 }}>Club no encontrado</h2>
                        <p style={{ color: 'var(--text-muted)' }}>El club que buscas no existe o fue eliminado.</p>
                        <a href="/login" style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>
                            Ir al login general →
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    const accentColor = getAccentColor();
    const accentLight = getAccentLight();

    const features = [
        { icon: <IconUsers size={18} />, text: 'Gestión integral de atletas y grupos' },
        { icon: <IconCreditCard size={18} />, text: 'Control de pagos y mensualidades' },
        { icon: <IconClipboard size={18} />, text: 'Registro de asistencia en segundos' },
    ];

    return (
        <div className="auth-screen animate-fade-in">
            {/* Left side - branding */}
            <div className="auth-side" style={{
                background: `linear-gradient(135deg, ${accentColor}22 0%, ${accentColor}11 100%)`,
                borderBottom: `4px solid ${accentColor}`,
            }}>
                <div className="auth-brand">
                    <div className="brand-mark" style={{ background: accentColor }}>
                        {club.logo_url ? (
                            <img src={club.logo_url} alt={club.name} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8 }} />
                        ) : (
                            <IconZap size={22} />
                        )}
                    </div>
                    <h1>{club.name}</h1>
                </div>
                <div className="auth-content">
                    <h2>{club.welcome_message || 'Gestión deportiva sin fricción.'}</h2>
                    <p>{club.description || 'Accede a tu plataforma de gestión deportiva.'}</p>
                    {club.show_features && (
                        <div className="auth-features">
                            {features.map((f, i) => (
                                <div className="auth-feature" key={i}>
                                    <div className="icon" style={{ color: accentColor }}>{f.icon}</div>
                                    <span>{f.text}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="auth-footer">© {new Date().getFullYear()} {club.name} · Powered by Club Manager</div>
            </div>

            {/* Right side - form */}
            <div className="auth-form-side">
                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="welcome">
                        <h2>Bienvenido a {club.name}</h2>
                        <p>Ingresa con tu número de identificación para continuar</p>
                    </div>

                    {error && (
                        <div className="auth-error">
                            <IconAlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Número de identificación</label>
                        <div className="input-with-icon">
                            <IconIdCard size={18} />
                            <input
                                type="text"
                                className="form-input"
                                value={identificationNumber}
                                onChange={(e) => setIdentificationNumber(e.target.value)}
                                placeholder="Ej: 1140892301"
                                required
                                autoComplete="username"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Contraseña</label>
                        <div className="input-with-icon">
                            <IconLock size={18} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="form-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                autoComplete="current-password"
                                style={{ paddingRight: '44px' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--text-muted)',
                                    padding: '4px',
                                    display: 'flex'
                                }}
                                tabIndex={-1}
                            >
                                {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-block btn-lg"
                        disabled={loading}
                        style={{
                            backgroundColor: loading ? undefined : accentColor,
                            borderColor: loading ? undefined : accentColor,
                        }}
                    >
                        {loading ? (
                            <><span className="spinner" style={{ borderTopColor: 'white' }} /> Ingresando...</>
                        ) : (
                            <>Ingresar <IconArrowRight size={16} /></>
                        )}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: 16 }}>
                        <a href="/login" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textDecoration: 'none' }}>
                            ¿No eres de este club? Login general
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ClubLogin;