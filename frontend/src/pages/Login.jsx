import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { IconLock, IconIdCard, IconAlertCircle, IconZap, IconUsers, IconCreditCard, IconClipboard, IconArrowRight, IconEye, IconEyeOff } from '../components/Icons';

const DEMO_USERS = [
  { id: '0000000001', pass: 'super123', label: 'Super Admin', role: 'SUPER_ADMIN' },
  { id: '1140892301', pass: 'admin123', label: 'Admin — Troya Voley', role: 'ADMIN' },
  { id: '79854321', pass: 'admin123', label: 'Admin — Águilas FC', role: 'ADMIN' },
  { id: '32876543', pass: 'admin123', label: 'Admin — Náutica Caribe', role: 'ADMIN' },
];

const Login = () => {
  const [identificationNumber, setIdentificationNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authService.login(identificationNumber, password);
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

  const fillDemo = (u) => {
    setIdentificationNumber(u.id);
    setPassword(u.pass);
  };

  return (
    <div className="auth-screen animate-fade-in">
      <div className="auth-side">
        <div className="auth-brand">
          <div className="brand-mark">
            <IconZap size={22} />
          </div>
          <h1>Club Manager</h1>
        </div>
        <div className="auth-content">
          <h2>Gestión deportiva sin fricción.</h2>
          <p>Administra atletas, entrenadores, pagos y asistencia desde una plataforma diseñada para clubes modernos.</p>
          <div className="auth-features">
            <div className="auth-feature">
              <div className="icon"><IconUsers size={18} /></div>
              <span>Gestión integral de atletas y grupos</span>
            </div>
            <div className="auth-feature">
              <div className="icon"><IconCreditCard size={18} /></div>
              <span>Control de pagos y mensualidades</span>
            </div>
            <div className="auth-feature">
              <div className="icon"><IconClipboard size={18} /></div>
              <span>Registro de asistencia en segundos</span>
            </div>
          </div>
        </div>
        <div className="auth-footer">© 2026 Osdosoft · Todos los derechos reservados</div>
      </div>

      <div className="auth-form-side">
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="welcome">
            <h2>Bienvenido de vuelta</h2>
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

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? <><span className="spinner" style={{ borderTopColor: 'white' }} /> Ingresando...</> : <>Ingresar <IconArrowRight size={16} /></>}
          </button>

          <div className="demo-creds">
            <div className="label">⚡ Acceso rápido (demo)</div>
            {DEMO_USERS.map((u) => (
              <div className="row" key={u.id} style={{ marginTop: 6 }}>
                <code onClick={() => fillDemo(u)} title="Clic para autocompletar">{u.id}</code>
                <code onClick={() => fillDemo(u)} title="Clic para autocompletar">{u.pass}</code>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{u.label}</span>
              </div>
            ))}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
