import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import landingService from '../services/landingService';
import {
    IconLock, IconIdCard, IconAlertCircle, IconArrowRight,
    IconEye, IconEyeOff, IconMenu, IconX, IconChevronDown,
    IconFacebook, IconInstagram, IconMessageCircle, IconTwitter, IconYoutube,
    IconMapPin, IconMail, IconPhone, IconImage
} from '../components/Icons';

// Fallback icons for features
const FeatureIcon = ({ icon, size = 24 }) => {
    const iconMap = {
        'users': '👥',
        'credit-card': '💳',
        'clipboard': '📋',
        'zap': '⚡',
        'heart': '❤️',
        'star': '⭐',
        'shield': '🛡️',
        'clock': '⏰',
        'trending': '📈',
        'award': '🏆',
    };
    return <span style={{ fontSize: size }}>{iconMap[icon] || '⭐'}</span>;
};

const ClubLanding = () => {
    const { clubSlug } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [clubNotFound, setClubNotFound] = useState(false);

    // Login form state
    const [identificationNumber, setIdentificationNumber] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);

    // Mobile menu
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Gallery modal
    const [galleryModal, setGalleryModal] = useState(null);

    useEffect(() => {
        const fetchLanding = async () => {
            try {
                const result = await landingService.getPublicBySlug(clubSlug);
                setData(result);
                document.title = `${result.club.name} - Landing`;
            } catch (err) {
                setClubNotFound(true);
                document.title = 'Club no encontrado';
            } finally {
                setLoading(false);
            }
        };
        fetchLanding();
    }, [clubSlug]);

    const handleLogin = useCallback(async (e) => {
        e.preventDefault();
        setError('');
        setLoginLoading(true);
        try {
            const result = await authService.login(identificationNumber, password, clubSlug);
            if (result.user.role === 'SUPER_ADMIN') navigate('/super-admin');
            else if (result.user.role === 'ADMIN') navigate('/admin');
            else if (result.user.role === 'TRAINER') navigate('/trainer');
            else navigate('/athlete');
        } catch (err) {
            setError(err.message || 'Credenciales inválidas.');
        } finally {
            setLoginLoading(false);
        }
    }, [identificationNumber, password, clubSlug, navigate]);

    const getAccentColor = () => data?.club?.primary_color || '#6366f1';
    const accentColor = getAccentColor();

    const getContrastText = (hex) => {
        const r = parseInt(hex.substring(1, 3), 16);
        const g = parseInt(hex.substring(3, 5), 16);
        const b = parseInt(hex.substring(5, 7), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5 ? '#1a1a2e' : '#ffffff';
    };

    if (loading) {
        return (
            <div className="landing-loading">
                <div className="spinner" style={{ borderTopColor: accentColor }} />
                <p>Cargando...</p>
            </div>
        );
    }

    if (clubNotFound) {
        return (
            <div className="landing-not-found">
                <div className="not-found-content">
                    <div className="not-found-icon">🔍</div>
                    <h2>Club no encontrado</h2>
                    <p>El club que buscas no existe o fue eliminado.</p>
                </div>
            </div>
        );
    }

    const { club, landing } = data;
    const accentLight = `${accentColor}15`;
    const textColor = getContrastText(accentColor);

    // Navigation items (smooth scroll)
    const navItems = [];
    if (landing) {
        if (landing.show_about) navItems.push({ id: 'about', label: 'Nosotros' });
        if (landing.show_features) navItems.push({ id: 'features', label: 'Servicios' });
        if (landing.show_gallery) navItems.push({ id: 'gallery', label: 'Galería' });
        if (landing.show_contact) navItems.push({ id: 'contact', label: 'Contacto' });
    }

    const scrollTo = (id) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        setMobileMenuOpen(false);
    };

    return (
        <div className="landing-page" style={{ '--accent': accentColor, '--accent-light': accentLight }}>
            {/* Navigation Bar */}
            <nav className="landing-nav">
                <div className="landing-nav-inner">
                    <div className="landing-nav-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ cursor: 'pointer' }}>
                        {club.logo_url ? (
                            <img src={club.logo_url} alt={club.name} className="nav-logo" />
                        ) : (
                            <div className="nav-brand-icon" style={{ background: accentColor, color: textColor }}>
                                {club.name.charAt(0)}
                            </div>
                        )}
                        <span className="nav-brand-name">{club.name}</span>
                    </div>

                    <div className={`landing-nav-links ${mobileMenuOpen ? 'open' : ''}`}>
                        {navItems.map(item => (
                            <button key={item.id} onClick={() => scrollTo(item.id)} className="nav-link">
                                {item.label}
                            </button>
                        ))}
                        {landing?.show_registration && (
                            <a href={`/register?club=${club.slug}`} className="nav-link" style={{ background: 'var(--success-500)', color: 'white', borderRadius: 8, padding: '8px 16px', fontWeight: 600 }}>
                                📝 Registrarse
                            </a>
                        )}
                        <button onClick={() => scrollTo('login')} className="nav-login-btn" style={{ background: accentColor, color: textColor }}>
                            Ingresar
                        </button>
                    </div>

                    <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <IconX size={24} /> : <IconMenu size={24} />}
                    </button>
                </div>
            </nav>

            {/* Hero Section with Login */}
            <section className="landing-hero">
                <div className="landing-hero-bg" style={{
                    background: landing?.banner_url
                        ? `linear-gradient(135deg, ${accentColor}dd 0%, ${accentColor}99 100%), url(${landing.banner_url})`
                        : `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}aa 50%, #1a1a2e 100%)`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }} />

                <div className="landing-hero-content">
                    <div className="landing-hero-text">
                        {club.logo_url && (
                            <img src={club.logo_url} alt={club.name} className="hero-logo" />
                        )}
                        <h1 className="hero-title">
                            {landing?.hero_title || club.welcome_message || `Bienvenido a ${club.name}`}
                        </h1>
                        {landing?.hero_subtitle && (
                            <p className="hero-subtitle">{landing.hero_subtitle}</p>
                        )}
                        {club.description && (
                            <p className="hero-description">{club.description}</p>
                        )}
                    </div>

                    {landing?.show_login_in_hero !== false && (
                        <div className="landing-hero-login">
                            <div className="landing-login-card" id="login">
                                <div className="login-card-header">
                                    <div className="login-card-logo">
                                        {club.logo_url ? (
                                            <img src={club.logo_url} alt={club.name} />
                                        ) : (
                                            <span>{club.name.charAt(0)}</span>
                                        )}
                                    </div>
                                    <h3>Iniciar Sesión</h3>
                                    <p>Ingresa con tu número de identificación</p>
                                </div>

                                {error && (
                                    <div className="auth-error">
                                        <IconAlertCircle size={18} />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <form onSubmit={handleLogin}>
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
                                                className="password-toggle"
                                                tabIndex={-1}
                                            >
                                                {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn btn-primary btn-block btn-lg"
                                        disabled={loginLoading}
                                        style={{
                                            backgroundColor: loginLoading ? undefined : accentColor,
                                            borderColor: loginLoading ? undefined : accentColor,
                                        }}
                                    >
                                        {loginLoading ? (
                                            <><span className="spinner" style={{ borderTopColor: 'white' }} /> Ingresando...</>
                                        ) : (
                                            <>Ingresar <IconArrowRight size={16} /></>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>

                <div className="hero-scroll-indicator" onClick={() => scrollTo('about')}>
                    <IconChevronDown size={24} />
                </div>
            </section>

            {/* About Section */}
            {landing?.show_about !== false && landing?.about_text && (
                <section className="landing-section" id="about">
                    <div className="landing-section-inner">
                        <div className="section-content">
                            <h2 className="section-title">{landing?.about_title || 'Sobre nosotros'}</h2>
                            <div className="about-text">
                                {landing.about_text.split('\n').map((p, i) => (
                                    <p key={i}>{p}</p>
                                ))}
                            </div>
                        </div>
                        {landing?.about_image_url && (
                            <div className="section-image">
                                <img src={landing.about_image_url} alt="Sobre nosotros" />
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Features Section */}
            {landing?.show_features !== false && landing?.features && landing.features.length > 0 && (
                <section className="landing-section landing-section-alt" id="features">
                    <div className="landing-section-inner">
                        <h2 className="section-title">{landing?.features_title || 'Nuestros servicios'}</h2>
                        <div className="features-grid">
                            {landing.features.map((feature, i) => (
                                <div className="feature-card" key={i} style={{ borderTop: `3px solid ${accentColor}` }}>
                                    <div className="feature-icon" style={{ color: accentColor }}>
                                        {feature.icon ? <FeatureIcon icon={feature.icon} /> : <IconImage size={24} />}
                                    </div>
                                    <h3>{feature.title}</h3>
                                    <p>{feature.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Gallery Section */}
            {landing?.show_gallery !== false && landing?.gallery_images && landing.gallery_images.length > 0 && (
                <section className="landing-section" id="gallery">
                    <div className="landing-section-inner">
                        <h2 className="section-title">{landing?.gallery_title || 'Galería'}</h2>
                        <div className="gallery-grid">
                            {landing.gallery_images.map((img, i) => (
                                <div
                                    className="gallery-item"
                                    key={i}
                                    onClick={() => setGalleryModal(img)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <img src={img.url} alt={img.caption || ''} />
                                    {img.caption && <div className="gallery-caption">{img.caption}</div>}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Gallery Modal */}
                    {galleryModal && (
                        <div className="gallery-modal" onClick={() => setGalleryModal(null)}>
                            <div className="gallery-modal-content" onClick={e => e.stopPropagation()}>
                                <button className="gallery-modal-close" onClick={() => setGalleryModal(null)}>
                                    <IconX size={24} />
                                </button>
                                <img src={galleryModal.url} alt={galleryModal.caption || ''} />
                                {galleryModal.caption && <p>{galleryModal.caption}</p>}
                            </div>
                        </div>
                    )}
                </section>
            )}

            {/* Contact Section */}
            {landing?.show_contact !== false && (
                <section className="landing-section landing-section-alt" id="contact">
                    <div className="landing-section-inner">
                        <h2 className="section-title">Contacto</h2>
                        <div className="contact-grid">
                            {landing?.contact_phone && (
                                <div className="contact-item">
                                    <div className="contact-icon" style={{ background: accentLight, color: accentColor }}>
                                        <IconPhone size={20} />
                                    </div>
                                    <div>
                                        <strong>Teléfono</strong>
                                        <p>{landing.contact_phone}</p>
                                    </div>
                                </div>
                            )}
                            {landing?.contact_email && (
                                <div className="contact-item">
                                    <div className="contact-icon" style={{ background: accentLight, color: accentColor }}>
                                        <IconMail size={20} />
                                    </div>
                                    <div>
                                        <strong>Email</strong>
                                        <p>{landing.contact_email}</p>
                                    </div>
                                </div>
                            )}
                            {landing?.address && (
                                <div className="contact-item">
                                    <div className="contact-icon" style={{ background: accentLight, color: accentColor }}>
                                        <IconMapPin size={20} />
                                    </div>
                                    <div>
                                        <strong>Dirección</strong>
                                        <p>{landing.address}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* Footer */}
            <footer className="landing-footer" style={{ background: accentColor }}>
                <div className="landing-footer-inner">
                    <div className="footer-brand">
                        {club.logo_url && <img src={club.logo_url} alt={club.name} className="footer-logo" />}
                        <div>
                            <h4 style={{ color: textColor }}>{club.name}</h4>
                            {landing?.footer_text && <p style={{ color: `${textColor}aa` }}>{landing.footer_text}</p>}
                        </div>
                    </div>

                    {landing?.show_footer_social !== false && (
                        <div className="footer-social">
                            {landing?.social_facebook && (
                                <a href={landing.social_facebook} target="_blank" rel="noopener noreferrer"
                                    className="social-link" style={{ color: textColor }}>
                                    <IconFacebook size={20} />
                                </a>
                            )}
                            {landing?.social_instagram && (
                                <a href={landing.social_instagram} target="_blank" rel="noopener noreferrer"
                                    className="social-link" style={{ color: textColor }}>
                                    <IconInstagram size={20} />
                                </a>
                            )}
                            {landing?.social_whatsapp && (
                                <a href={landing.social_whatsapp} target="_blank" rel="noopener noreferrer"
                                    className="social-link" style={{ color: textColor }}>
                                    <IconMessageCircle size={20} />
                                </a>
                            )}
                            {landing?.social_twitter && (
                                <a href={landing.social_twitter} target="_blank" rel="noopener noreferrer"
                                    className="social-link" style={{ color: textColor }}>
                                    <IconTwitter size={20} />
                                </a>
                            )}
                            {landing?.social_youtube && (
                                <a href={landing.social_youtube} target="_blank" rel="noopener noreferrer"
                                    className="social-link" style={{ color: textColor }}>
                                    <IconYoutube size={20} />
                                </a>
                            )}
                        </div>
                    )}
                </div>
                <div className="landing-footer-bottom" style={{ color: `${textColor}88`, borderTopColor: `${textColor}22` }}>
                    © {new Date().getFullYear()} {club.name} · Powered by <a href="https://osdosoft.com">Osdosoft</a>
                </div>
            </footer>
        </div>
    );
};

export default ClubLanding;