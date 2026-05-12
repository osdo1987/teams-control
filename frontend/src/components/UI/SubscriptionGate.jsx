import React from 'react';

const SubscriptionGate = ({ children, status }) => {
  if (status !== 'ACTIVE' && status !== 'TRIAL') {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-main)',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '24px',
          boxShadow: 'var(--card-shadow)',
          maxWidth: '450px',
          width: '100%'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>💳</div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>Suscripción Requerida</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', lineHeight: 1.6 }}>
            Lo sentimos, el acceso para este club ha sido suspendido debido a que la suscripción ha vencido o el periodo de prueba ha finalizado.
          </p>
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '30px' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              Estado Actual: <span style={{ color: 'var(--danger-color)' }}>{status === 'EXPIRED' ? 'Vencido' : 'Inactivo'}</span>
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
