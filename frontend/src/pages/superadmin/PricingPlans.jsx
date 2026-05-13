import React from 'react';

const PricingPlans = () => {
    const plans = [
        {
            name: "Básico",
            price: "120.000",
            period: "mes",
            description: "Ideal para escuelas pequeñas que están iniciando su digitalización.",
            features: [
                "Hasta 50 atletas registrados",
                "Gestión de 2 categorías",
                "Asistencia básica",
                "Soporte por correo electrónico",
                "Reportes mensuales en PDF"
            ],
            color: "var(--primary-color)",
            recommended: false
        },
        {
            name: "Profesional",
            price: "280.000",
            period: "mes",
            description: "Perfecto para clubes medianos con múltiples grupos de entrenamiento.",
            features: [
                "Hasta 200 atletas registrados",
                "Categorías ilimitadas",
                "Gestión de hasta 5 entrenadores",
                "Seguimiento de pagos avanzado",
                "Reportes de rendimiento individuales",
                "Soporte prioritario"
            ],
            color: "#8b5cf6",
            recommended: true
        },
        {
            name: "Flexible",
            price: "1.000",
            period: "atleta/mes",
            description: "Paga exactamente por lo que usas. Sin cargos fijos ni sorpresas.",
            features: [
                "Atletas ilimitados",
                "Todas las funciones Pro",
                "Gestión de pagos incluida",
                "Escalabilidad automática",
                "Ideal para clubes en crecimiento"
            ],
            color: "#ec4899",
            recommended: false
        },
        {
            name: "Ilimitado",
            price: "600.000",
            period: "mes",
            description: "La solución total para grandes academias y franquicias deportivas.",
            features: [
                "Atletas ilimitados",
                "Entrenadores ilimitados",
                "Personalización de marca",
                "API de integración básica",
                "Soporte 24/7 dedicado",
                "Carga masiva de datos",
                "Gestión multi-sede"
            ],
            color: "#f59e0b",
            recommended: false
        }
    ];

    return (
        <div className="pricing-page animate-in">
            <header className="pricing-header">
                <h1>Planes y Tarifas de Suscripción</h1>
                <p>Configura los costos operativos de la plataforma para tus clientes (Pesos Colombianos - COP)</p>
            </header>

            <div className="pricing-grid">
                {plans.map((plan, index) => (
                    <div key={index} className={`pricing-card ${plan.recommended ? 'recommended' : ''}`}>
                        {plan.recommended && <div className="best-value">MÁS POPULAR</div>}
                        <div className="card-top">
                            <h2 style={{ color: plan.color }}>{plan.name}</h2>
                            <p className="plan-desc">{plan.description}</p>
                            <div className="price-container">
                                <span className="currency">$</span>
                                <span className="price">{plan.price}</span>
                                <span className="period">/{plan.period}</span>
                            </div>
                        </div>
                        
                        <div className="features-list">
                            <p className="features-title">Incluye:</p>
                            {plan.features.map((feature, fIndex) => (
                                <div key={fIndex} className="feature-item">
                                    <span className="check" style={{ color: plan.color }}>✓</span>
                                    <span>{feature}</span>
                                </div>
                            ))}
                        </div>

                        <div className="card-footer">
                            <button className="btn btn-outline" style={{ borderColor: plan.color, color: plan.color }}>
                                Configurar Límites
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <section className="revenue-info glass-panel mt-4">
                <div className="info-icon">💡</div>
                <div className="info-text">
                    <h3>Nota para el Super Administrador</h3>
                    <p>Estos planes definen los límites técnicos en la base de datos. Si un club supera el límite de atletas de su plan, el sistema le solicitará automáticamente un upgrade o bloqueará el registro de nuevos deportistas.</p>
                </div>
            </section>

            <style>{`
                .pricing-page {
                    padding-bottom: 50px;
                }
                .pricing-header {
                    text-align: center;
                    margin-bottom: 50px;
                    padding: 20px 0;
                }
                .pricing-header h1 {
                    font-size: 2.2rem;
                    font-weight: 800;
                    letter-spacing: -0.04em;
                    margin-bottom: 12px;
                }
                .pricing-header p {
                    color: var(--text-secondary);
                    font-size: 1.1rem;
                }

                .pricing-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 30px;
                    margin: 0 auto;
                    max-width: 1200px;
                }

                .pricing-card {
                    background: white;
                    border-radius: 28px;
                    padding: 40px;
                    border: 1px solid var(--border-color);
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .pricing-card:hover {
                    transform: translateY(-10px);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                }
                .pricing-card.recommended {
                    border: 2px solid var(--primary-color);
                    transform: scale(1.05);
                    box-shadow: 0 15px 30px rgba(37,99,235,0.1);
                    z-index: 2;
                }
                .pricing-card.recommended:hover {
                    transform: scale(1.05) translateY(-10px);
                    box-shadow: 0 25px 50px rgba(37,99,235,0.15);
                }

                .best-value {
                    position: absolute;
                    top: -15px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: var(--primary-color);
                    color: white;
                    padding: 6px 16px;
                    border-radius: 99px;
                    font-size: 0.75rem;
                    font-weight: 800;
                    letter-spacing: 0.05em;
                }

                .card-top h2 {
                    font-size: 1.5rem;
                    font-weight: 800;
                    margin-bottom: 10px;
                }
                .plan-desc {
                    font-size: 0.9rem;
                    color: var(--text-secondary);
                    line-height: 1.5;
                    margin-bottom: 24px;
                    height: 50px;
                }

                .price-container {
                    margin-bottom: 30px;
                    display: flex;
                    align-items: baseline;
                }
                .currency {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin-right: 4px;
                }
                .price {
                    font-size: 2.8rem;
                    font-weight: 900;
                    letter-spacing: -0.02em;
                }
                .period {
                    font-size: 1rem;
                    color: var(--text-muted);
                    font-weight: 600;
                }

                .features-list {
                    flex: 1;
                    margin-bottom: 30px;
                }
                .features-title {
                    font-size: 0.85rem;
                    font-weight: 800;
                    color: var(--text-primary);
                    text-transform: uppercase;
                    margin-bottom: 16px;
                    letter-spacing: 0.05em;
                }
                .feature-item {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 12px;
                    font-size: 0.95rem;
                    color: var(--text-secondary);
                    align-items: center;
                }
                .check {
                    font-weight: 900;
                }

                .card-footer button {
                    width: 100%;
                    padding: 14px;
                    border-radius: 14px;
                    font-weight: 700;
                    font-size: 0.95rem;
                    background: transparent;
                    border: 2px solid;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .card-footer button:hover {
                    filter: brightness(0.9);
                    transform: scale(0.98);
                }

                .revenue-info {
                    display: flex;
                    gap: 20px;
                    padding: 30px;
                    align-items: center;
                    border-radius: 20px;
                    background: #f8fafc;
                }
                .info-icon {
                    font-size: 2rem;
                    background: white;
                    width: 60px;
                    height: 60px;
                    border-radius: 15px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.05);
                }
                .info-text h3 {
                    font-size: 1.1rem;
                    font-weight: 700;
                    margin-bottom: 4px;
                }
                .info-text p {
                    color: var(--text-secondary);
                    font-size: 0.95rem;
                }

                .animate-in {
                    animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default PricingPlans;
