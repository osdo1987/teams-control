import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authService.login(email, password);
      if (data.user.role === 'ADMIN') navigate('/admin');
      else if (data.user.role === 'TRAINER') navigate('/trainer');
      else navigate('/athlete');
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--bg-main)',
    }}>
      {/* Left panel */}
      <div style={{
        width: '50%',
        background: 'var(--sidebar-bg)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: 320, height: 320, borderRadius: '50%', background: 'rgba(37,99,235,0.15)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: 240, height: 240, borderRadius: '50%', background: 'rgba(139,92,246,0.15)', filter: 'blur(50px)' }} />

        <div style={{ position: 'relative', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', margin: '0 auto 24px', boxShadow: '0 8px 24px rgba(37,99,235,0.4)' }}>
            ⚽
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', marginBottom: 12, letterSpacing: '-0.03em' }}>
            SportClub
          </h1>
          <p style={{ color: 'rgba(160,174,192,0.9)', fontSize: '1rem', lineHeight: 1.7, maxWidth: 320 }}>
            Sistema de gestión integral para clubes deportivos. Administra atletas, grupos, pagos y asistencia desde un solo lugar.
          </p>

          {/* Feature bullets */}
          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
            {[['👥', 'Gestión de Atletas y Grupos'],['💳', 'Control de Pagos y Cuotas'],['📋', 'Registro de Asistencia']].map(([icon, text]) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>{icon}</div>
                <span style={{ color: 'rgba(248,250,252,0.75)', fontSize: '0.9rem', fontWeight: 500 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel – form */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px 80px',
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: 8, color: 'var(--text-primary)' }}>Welcome back 👋</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 36, fontSize: '0.95rem' }}>Sign in to your admin account</p>

          {error && (
            <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: '0.875rem', fontWeight: 500, border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="form-input" placeholder="admin@sportclub.com" required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="form-input" placeholder="••••••••" required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '13px', fontSize: '0.95rem', marginTop: 4 }}>
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
