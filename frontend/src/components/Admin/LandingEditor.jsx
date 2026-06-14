import React, { useState, useEffect, useRef } from 'react';
import { authService } from '../../services/authService';
import landingService from '../../services/landingService';
import {
    IconSave, IconX, IconPlus, IconTrash, IconImage,
    IconChevronDown, IconChevronUp, IconRefresh
} from '../Icons';

const LandingEditor = () => {
    const user = authService.getCurrentUser();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [activeSection, setActiveSection] = useState('hero');
    const fileInputRef = useRef(null);

    // Form state
    const [form, setForm] = useState({
        // Hero
        hero_title: '',
        hero_subtitle: '',
        banner_url: '',
        cta_text: 'Ingresar',
        cta_link: '#login',
        // About
        about_title: 'Sobre nosotros',
        about_text: '',
        about_image_url: '',
        // Features
        features_title: 'Nuestros servicios',
        features: [],
        // Gallery
        gallery_title: 'Galería',
        gallery_images: [],
        // Contact
        contact_email: '',
        contact_phone: '',
        address: '',
        // Social
        social_facebook: '',
        social_instagram: '',
        social_whatsapp: '',
        social_twitter: '',
        social_youtube: '',
        // Visibility
        show_login_in_hero: true,
        show_about: true,
        show_features: true,
        show_gallery: true,
        show_contact: true,
        show_footer_social: true,
        // Footer
        footer_text: '',
    });

    const clubId = user?.role === 'SUPER_ADMIN' ? null : user?.club_id;

    useEffect(() => {
        loadLanding();
    }, []);

    const loadLanding = async () => {
        setLoading(true);
        try {
            const result = await landingService.getManage(clubId);
            setData(result);
            if (result.landing) {
                setForm(prev => ({
                    ...prev,
                    ...result.landing,
                    features: result.landing.features || [],
                    gallery_images: result.landing.gallery_images || [],
                }));
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Error al cargar la landing page' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            await landingService.save(form, clubId);
            setMessage({ type: 'success', text: 'Landing page guardada exitosamente' });
        } catch (err) {
            setMessage({ type: 'error', text: 'Error al guardar: ' + (err.message || 'Error desconocido') });
        } finally {
            setSaving(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const result = await landingService.uploadImage(file, clubId);
            // Copy the URL to clipboard so user can paste it where they want
            navigator.clipboard.writeText(result.url).then(() => {
                setMessage({ type: 'success', text: `Imagen subida: ${result.url} (copiada al portapapeles)` });
            }).catch(() => {
                setMessage({ type: 'info', text: `Imagen subida: ${result.url}` });
            });
        } catch (err) {
            setMessage({ type: 'error', text: 'Error al subir imagen' });
        }
    };

    const addFeature = () => {
        setForm(prev => ({
            ...prev,
            features: [...prev.features, { icon: 'star', title: '', description: '' }]
        }));
    };

    const updateFeature = (index, field, value) => {
        setForm(prev => {
            const features = [...prev.features];
            features[index] = { ...features[index], [field]: value };
            return { ...prev, features };
        });
    };

    const removeFeature = (index) => {
        setForm(prev => ({
            ...prev,
            features: prev.features.filter((_, i) => i !== index)
        }));
    };

    const addGalleryImage = () => {
        setForm(prev => ({
            ...prev,
            gallery_images: [...prev.gallery_images, { url: '', caption: '' }]
        }));
    };

    const updateGalleryImage = (index, field, value) => {
        setForm(prev => {
            const images = [...prev.gallery_images];
            images[index] = { ...images[index], [field]: value };
            return { ...prev, gallery_images: images };
        });
    };

    const removeGalleryImage = (index) => {
        setForm(prev => ({
            ...prev,
            gallery_images: prev.gallery_images.filter((_, i) => i !== index)
        }));
    };

    const sections = [
        { id: 'hero', label: 'Hero / Banner' },
        { id: 'about', label: 'Sobre nosotros' },
        { id: 'features', label: 'Servicios' },
        { id: 'gallery', label: 'Galería' },
        { id: 'contact', label: 'Contacto' },
        { id: 'social', label: 'Redes Sociales' },
        { id: 'visibility', label: 'Visibilidad' },
    ];

    const renderSectionNav = () => (
        <div className="editor-sidebar">
            <h4>Secciones</h4>
            {sections.map(s => (
                <button
                    key={s.id}
                    className={`editor-nav-item ${activeSection === s.id ? 'active' : ''}`}
                    onClick={() => setActiveSection(s.id)}
                >
                    {s.label}
                </button>
            ))}
        </div>
    );

    if (loading) {
        return (
            <div className="page-content">
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div className="spinner" />
                    <p style={{ marginTop: 16, color: 'var(--text-muted)' }}>Cargando editor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-content">
            <div className="page-header">
                <h2>Personalizar Landing Page</h2>
                <p style={{ color: 'var(--text-muted)' }}>
                    {data?.club?.name ? `Editando: ${data.club.name}` : 'Configura la página principal de tu club'}
                </p>
            </div>

            {message.text && (
                <div className={`alert alert-${message.type}`}>
                    {message.text}
                </div>
            )}

            <div className="landing-editor-layout">
                {renderSectionNav()}

                <div className="editor-main">
                    {/* Upload button */}
                    <div className="editor-toolbar">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            accept="image/*"
                            style={{ display: 'none' }}
                        />
                        <button className="btn btn-secondary" onClick={() => fileInputRef.current.click()}>
                            <IconImage size={16} /> Subir Imagen
                        </button>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: 8 }}>
                            Las imágenes se copian al portapapeles
                        </span>
                    </div>

                    {/* Hero Section */}
                    {activeSection === 'hero' && (
                        <div className="editor-section">
                            <h3>Hero / Banner</h3>

                            <div className="form-group">
                                <label className="form-label">Título principal</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={form.hero_title}
                                    onChange={e => handleChange('hero_title', e.target.value)}
                                    placeholder="Bienvenido a nuestro club"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Subtítulo</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={form.hero_subtitle}
                                    onChange={e => handleChange('hero_subtitle', e.target.value)}
                                    placeholder="Subtítulo opcional"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">URL del banner (imagen de fondo)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={form.banner_url}
                                    onChange={e => handleChange('banner_url', e.target.value)}
                                    placeholder="https://ejemplo.com/banner.jpg"
                                />
                                {form.banner_url && (
                                    <img src={form.banner_url} alt="Preview" className="editor-preview-img" />
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Texto del botón CTA</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={form.cta_text}
                                    onChange={e => handleChange('cta_text', e.target.value)}
                                    placeholder="Ingresar"
                                />
                            </div>
                        </div>
                    )}

                    {/* About Section */}
                    {activeSection === 'about' && (
                        <div className="editor-section">
                            <h3>Sobre nosotros</h3>

                            <div className="form-group">
                                <label className="form-label">Título de la sección</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={form.about_title}
                                    onChange={e => handleChange('about_title', e.target.value)}
                                    placeholder="Sobre nosotros"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Texto descriptivo</label>
                                <textarea
                                    className="form-input form-textarea"
                                    value={form.about_text}
                                    onChange={e => handleChange('about_text', e.target.value)}
                                    placeholder="Describe tu club..."
                                    rows={6}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">URL de imagen (opcional)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={form.about_image_url}
                                    onChange={e => handleChange('about_image_url', e.target.value)}
                                    placeholder="https://ejemplo.com/imagen.jpg"
                                />
                                {form.about_image_url && (
                                    <img src={form.about_image_url} alt="Preview" className="editor-preview-img" />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Features Section */}
                    {activeSection === 'features' && (
                        <div className="editor-section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3>Servicios / Características</h3>
                                <button className="btn btn-secondary" onClick={addFeature}>
                                    <IconPlus size={16} /> Agregar
                                </button>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Título de la sección</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={form.features_title}
                                    onChange={e => handleChange('features_title', e.target.value)}
                                    placeholder="Nuestros servicios"
                                />
                            </div>

                            {form.features.length === 0 && (
                                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
                                    No hay servicios. Haz clic en "Agregar" para añadir uno.
                                </p>
                            )}

                            {form.features.map((feature, i) => (
                                <div key={i} className="editor-feature-card">
                                    <div className="editor-feature-header">
                                        <strong>Servicio {i + 1}</strong>
                                        <button className="btn-icon btn-danger" onClick={() => removeFeature(i)}>
                                            <IconTrash size={16} />
                                        </button>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Icono</label>
                                        <select
                                            className="form-input"
                                            value={feature.icon}
                                            onChange={e => updateFeature(i, 'icon', e.target.value)}
                                        >
                                            <option value="star">⭐ Estrella</option>
                                            <option value="users">👥 Usuarios</option>
                                            <option value="zap">⚡ Rayo</option>
                                            <option value="heart">❤️ Corazón</option>
                                            <option value="shield">🛡️ Escudo</option>
                                            <option value="clock">⏰ Reloj</option>
                                            <option value="award">🏆 Trofeo</option>
                                            <option value="trending">📈 Tendencia</option>
                                            <option value="credit-card">💳 Tarjeta</option>
                                            <option value="clipboard">📋 Clip</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Título</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={feature.title}
                                            onChange={e => updateFeature(i, 'title', e.target.value)}
                                            placeholder="Nombre del servicio"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Descripción</label>
                                        <textarea
                                            className="form-input form-textarea"
                                            value={feature.description}
                                            onChange={e => updateFeature(i, 'description', e.target.value)}
                                            placeholder="Descripción del servicio"
                                            rows={2}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Gallery Section */}
                    {activeSection === 'gallery' && (
                        <div className="editor-section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3>Galería de imágenes</h3>
                                <button className="btn btn-secondary" onClick={addGalleryImage}>
                                    <IconPlus size={16} /> Agregar imagen
                                </button>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Título de la sección</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={form.gallery_title}
                                    onChange={e => handleChange('gallery_title', e.target.value)}
                                    placeholder="Galería"
                                />
                            </div>

                            {form.gallery_images.length === 0 && (
                                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
                                    No hay imágenes. Haz clic en "Agregar imagen".
                                </p>
                            )}

                            {form.gallery_images.map((img, i) => (
                                <div key={i} className="editor-feature-card">
                                    <div className="editor-feature-header">
                                        <strong>Imagen {i + 1}</strong>
                                        <button className="btn-icon btn-danger" onClick={() => removeGalleryImage(i)}>
                                            <IconTrash size={16} />
                                        </button>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">URL de la imagen</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={img.url}
                                            onChange={e => updateGalleryImage(i, 'url', e.target.value)}
                                            placeholder="https://ejemplo.com/imagen.jpg"
                                        />
                                        {img.url && (
                                            <img src={img.url} alt="Preview" className="editor-preview-img" style={{ maxHeight: 100 }} />
                                        )}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Texto alternativo / pie de foto</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={img.caption}
                                            onChange={e => updateGalleryImage(i, 'caption', e.target.value)}
                                            placeholder="Descripción de la imagen"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Contact Section */}
                    {activeSection === 'contact' && (
                        <div className="editor-section">
                            <h3>Información de contacto</h3>

                            <div className="form-group">
                                <label className="form-label">Correo electrónico</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={form.contact_email}
                                    onChange={e => handleChange('contact_email', e.target.value)}
                                    placeholder="club@ejemplo.com"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Teléfono</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={form.contact_phone}
                                    onChange={e => handleChange('contact_phone', e.target.value)}
                                    placeholder="+57 300 123 4567"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Dirección</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={form.address}
                                    onChange={e => handleChange('address', e.target.value)}
                                    placeholder="Dirección del club"
                                />
                            </div>
                        </div>
                    )}

                    {/* Social Section */}
                    {activeSection === 'social' && (
                        <div className="editor-section">
                            <h3>Redes Sociales</h3>

                            <div className="form-group">
                                <label className="form-label">Facebook (URL completa)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={form.social_facebook}
                                    onChange={e => handleChange('social_facebook', e.target.value)}
                                    placeholder="https://facebook.com/tu-club"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Instagram (URL completa)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={form.social_instagram}
                                    onChange={e => handleChange('social_instagram', e.target.value)}
                                    placeholder="https://instagram.com/tu-club"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">WhatsApp (URL completa, ej: https://wa.me/573001234567)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={form.social_whatsapp}
                                    onChange={e => handleChange('social_whatsapp', e.target.value)}
                                    placeholder="https://wa.me/573001234567"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Twitter / X (URL completa)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={form.social_twitter}
                                    onChange={e => handleChange('social_twitter', e.target.value)}
                                    placeholder="https://twitter.com/tu-club"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">YouTube (URL completa)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={form.social_youtube}
                                    onChange={e => handleChange('social_youtube', e.target.value)}
                                    placeholder="https://youtube.com/@tu-club"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Texto del footer</label>
                                <textarea
                                    className="form-input form-textarea"
                                    value={form.footer_text}
                                    onChange={e => handleChange('footer_text', e.target.value)}
                                    placeholder="Texto adicional en el footer"
                                    rows={2}
                                />
                            </div>
                        </div>
                    )}

                    {/* Visibility Section */}
                    {activeSection === 'visibility' && (
                        <div className="editor-section">
                            <h3>Visibilidad de secciones</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
                                Activa o desactiva las secciones que se muestran en la landing page
                            </p>

                            <div className="visibility-toggles">
                                <label className="toggle-row">
                                    <span>Mostrar formulario de login en el Hero</span>
                                    <input
                                        type="checkbox"
                                        checked={form.show_login_in_hero}
                                        onChange={e => handleChange('show_login_in_hero', e.target.checked)}
                                    />
                                    <span className="toggle-switch"></span>
                                </label>

                                <label className="toggle-row">
                                    <span>Mostrar sección "Sobre nosotros"</span>
                                    <input
                                        type="checkbox"
                                        checked={form.show_about}
                                        onChange={e => handleChange('show_about', e.target.checked)}
                                    />
                                    <span className="toggle-switch"></span>
                                </label>

                                <label className="toggle-row">
                                    <span>Mostrar sección "Servicios"</span>
                                    <input
                                        type="checkbox"
                                        checked={form.show_features}
                                        onChange={e => handleChange('show_features', e.target.checked)}
                                    />
                                    <span className="toggle-switch"></span>
                                </label>

                                <label className="toggle-row">
                                    <span>Mostrar sección "Galería"</span>
                                    <input
                                        type="checkbox"
                                        checked={form.show_gallery}
                                        onChange={e => handleChange('show_gallery', e.target.checked)}
                                    />
                                    <span className="toggle-switch"></span>
                                </label>

                                <label className="toggle-row">
                                    <span>Mostrar sección "Contacto"</span>
                                    <input
                                        type="checkbox"
                                        checked={form.show_contact}
                                        onChange={e => handleChange('show_contact', e.target.checked)}
                                    />
                                    <span className="toggle-switch"></span>
                                </label>

                                <label className="toggle-row">
                                    <span>Mostrar redes sociales en el footer</span>
                                    <input
                                        type="checkbox"
                                        checked={form.show_footer_social}
                                        onChange={e => handleChange('show_footer_social', e.target.checked)}
                                    />
                                    <span className="toggle-switch"></span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Save Button */}
                    <div className="editor-actions">
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            <IconSave size={18} />
                            {saving ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingEditor;