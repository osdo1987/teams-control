import React from 'react';
import { authService } from '../../services/authService';

const SubscriptionGate = ({ children, status }) => {
  // Si el status no se recibe del padre, leer directamente del localStorage
  const effectiveStatus = status !== undefined && status !== null
    ? status
    : authService.getCurrentUser()?.subscription_status;

  if (effectiveStatus !== 'ACTIVE' && effectiveStatus !== 'TRIAL') {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-app)',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div className="card" style={{
          padding: '40px',
          maxWidth: '450px',
          width: '100%'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>💳</div>
          <h2 style={{ marginBottom: '12px' }}>Suscripción Requerida</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', lineHeight: 1.6 }}>
            Lo sentimos, el acceso para este club ha sido suspendido debido a que la suscripción ha vencido o el periodo de prueba ha finalizado.
          </p>
          <div style={{ background: 'var(--gray-50)', padding: '16px', borderRadius: '12px', marginBottom: '30px' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              Estado Actual: <span style={{ color: 'var(--danger-500)' }}>
                {effectiveStatus === 'EXPIRED' ? 'Vencido' : (effectiveStatus || 'Indefinido')}
              </span>
            </p>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Por favor, contacte al administrador del sistema para reactivar su cuenta.
          </p>
          <button
            className="btn btn-primary"
            style={{ marginTop: '24px', width: '100%' }}
            onClick={() => window.location.href = '/login'}
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default SubscriptionGate;