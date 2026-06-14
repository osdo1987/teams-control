import React from 'react';
import { IconZap } from '../../components/Icons';

const plans = [
    {
        name: "Prueba Gratis",
        price: "0",
        period: "15 días",
        description: "Prueba la plataforma sin costo durante 15 días. Acceso completo a todas las funcionalidades.",
        features: [
            "Atletas ilimitados",
            "Categorías ilimitadas",
            "Gestión de asistencia",
            "Seguimiento de pagos",
            "Reportes y estadísticas",
            "Múltiples entrenadores",
            "Soporte prioritario"
        ],
        color: "var(--green-500)",
        recommended: false,
        trial: true
    },
    {
        name: "Básico Mensual",
        price: "120.000",
        period: "mes",
        description: "Acceso completo a todas las funcionalidades de la plataforma. Pago mensual sin compromiso.",
        features: [
            "Atletas ilimitados",
            "Categorías ilimitadas",
            "Gestión de asistencia",
            "Seguimiento de pagos",
            "Reportes y estadísticas",
            "Múltiples entrenadores",
            "Soporte prioritario"
        ],
        color: "var(--brand-500)",
        recommended: false
    },
    {
        name: "Básico Semestral",
        price: "600.000",
        period: "semestre",
        description: "Todas las funcionalidades incluidas. Ahorra $120.000 pagando el semestre completo.",
        features: [
            "Atletas ilimitados",
            "Categorías ilimitadas",
            "Gestión de asistencia",
            "Seguimiento de pagos",
            "Reportes y estadísticas",
            "Múltiples entrenadores",
            "Soporte prioritario"
        ],
        color: "var(--purple-500)",
        recommended: false
    },
    {
        name: "Básico Anual",
        price: "1.080.000",
        period: "año",
        description: "Todas las funcionalidades incluidas. Ahorra $360.000 pagando el año completo.",
        features: [
            "Atletas ilimitados",
            "Categorías ilimitadas",
            "Gestión de asistencia",
            "Seguimiento de pagos",
            "Reportes y estadísticas",
            "Múltiples entrenadores",
            "Soporte prioritario"
        ],
        color: "var(--warning-500)",
        recommended: true
    }
];

const PricingPlans = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div className="page-header" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div>
                    <h1>Planes y Tarifas de Suscripción</h1>
                    <p>Configura los costos operativos de la plataforma para tus clientes (Pesos Colombianos - COP)</p>
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '24px',
                maxWidth: '1200px',
                margin: '0 auto',
                width: '100%'
            }}>
                {plans.map((plan, index) => (
                    <div key={index} className="card card-hover" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        overflow: 'visible',
                        ...(plan.recommended ? {
                            border: '2px solid var(--brand-500)',
                            boxShadow: '0 8px 24px rgba(79,70,229,0.15)',
                            transform: 'scale(1.03)',
                            zIndex: 2
                        } : {})
                    }}>
                        {plan.recommended && (
                            <div style={{
                                position: 'absolute',
                                top: '-14px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: 'var(--brand-600)',
                                color: 'white',
                                padding: '4px 16px',
                                borderRadius: '99px',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase',
                                whiteSpace: 'nowrap'
                            }}>
                                Más Popular
                            </div>
                        )}
                        {plan.trial && (
                            <div style={{
                                position: 'absolute',
                                top: '-14px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: 'var(--green-600)',
                                color: 'white',
                                padding: '4px 16px',
                                borderRadius: '99px',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase',
                                whiteSpace: 'nowrap'
                            }}>
                                Sin Costo
                            </div>
                        )}
                        <h2 style={{ color: plan.color, fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>{plan.name}</h2>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '24px', minHeight: '45px' }}>
                            {plan.description}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '24px' }}>
                            <span style={{ fontSize: '1.3rem', fontWeight: 700, marginRight: '4px' }}>$</span>
                            <span style={{ fontSize: plan.price.length > 7 ? '1.8rem' : '2.5rem', fontWeight: 900, letterSpacing: '-0.02em' }}>{plan.price}</span>
                            <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 600, marginLeft: '4px' }}>/{plan.period}</span>
                        </div>

                        <div style={{ flex: 1, marginBottom: '24px' }}>
                            <p style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.05em' }}>
                                Incluye:
                            </p>
                            {plan.features.map((feature, fIndex) => (
                                <div key={fIndex} style={{ display: 'flex', gap: '10px', marginBottom: '10px', fontSize: '0.9rem', color: 'var(--text-secondary)', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 900, color: plan.color }}>✓</span>
                                    <span>{feature}</span>
                                </div>
                            ))}
                        </div>

                        <button className="btn btn-outline" style={{ borderColor: plan.color, color: plan.color, width: '100%', padding: '12px', borderRadius: '12px', fontWeight: 700 }}>
                            Configurar Límites
                        </button>
                    </div>
                ))}
            </div>

            <div className="card" style={{ display: 'flex', gap: '20px', padding: '28px', alignItems: 'center', background: 'var(--gray-50)' }}>
                <div style={{ fontSize: '2rem', background: 'white', width: '56px', height: '56px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>💡</div>
                <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>Nota para el Super Administrador</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Estos planes definen los límites técnicos en la base de datos. Si un club supera el límite de atletas de su plan, el sistema le solicitará automáticamente un upgrade o bloqueará el registro de nuevos deportistas.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PricingPlans;
