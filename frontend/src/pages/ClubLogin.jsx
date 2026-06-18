import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clubService from '../services/clubService';
import { IconLock, IconIdCard, IconAlertCircle } from '../components/Icons';
import { useToast } from '../contexts/ToastContext';

const ClubLogin = () => {
    const { showError } = useToast();
    const [identificationNumber, setIdentificationNumber] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    // const [error, setError] = useState(''); // Removed, using useToast
    const [loading, setLoading] = useState(false);
    const [club, setClub] = useState(null);
    const navigate = useNavigate();

    React.useEffect(() => {
        const slug = window.location.pathname.split('/')[1];
        if (slug) {
            clubService.getBySlug(slug).then(setClub).catch(() => { });
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        // setError(''); // Removed, using useToast
        setLoading(true);
        try {
            const data = await clubService.login(identificationNumber, password);
            if (data.user.role === 'TRAINER') navigate('/trainer');
            else if (data.user.role === 'ATHLETE') navigate('/athlete');
            else navigate('/');
        } catch (err) {
            showError(err.message || 'Credenciales inválidas. Intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-screen animate-fade-in">
            <div className="auth-side">
                <div className="auth-brand">
                    <div className="brand-mark">⚡</div>
                    <h1>{club?.name || 'Club Manager'}</h1>
                </div>
                <div className="auth-content">
                    <h2>{club?.welcome_message || 'Bienvenido'}</h2>
                    <p>{club?.description || 'Accede a tu plataforma de gestión deportiva.'}</p>
                </div>
            </div>

            <div className="auth-form-side">
                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="welcome">
                        <h2>Iniciar Sesión</h2>
                        <p>Ingresa con tu número de identificación</p>
                    </div>

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
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                        {loading ? 'Ingresando...' : 'Ingresar'}
                    </button>
                </form>
            </div>
        </div>
    );
};


export default ClubLogin;