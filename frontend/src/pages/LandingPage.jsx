import React, { useState } from 'react';

const services = [
  { icon: '⚡', title: 'Desarrollo Web & SaaS', desc: 'Plataformas web escalables, sistemas multi-tenant y aplicaciones SaaS con arquitecturas modernas.' },
  { icon: '📱', title: 'Apps Móviles', desc: 'Aplicaciones iOS y Android nativas e híbridas con experiencias de usuario de primer nivel.' },
  { icon: '🎨', title: 'UI/UX Design', desc: 'Diseño centrado en el usuario. Interfaces que convierten visitantes en clientes.' },
  { icon: '☁️', title: 'Cloud & DevOps', desc: 'Infraestructura en AWS, Oracle y GCP. CI/CD, Docker y Kubernetes para escalar sin límites.' },
  { icon: '🤖', title: 'IA & Automatización', desc: 'Integramos inteligencia artificial en tus procesos. Chatbots, análisis predictivo y automatizaciones.' },
  { icon: '🔗', title: 'APIs & Integraciones', desc: 'Conectamos tus sistemas. REST, GraphQL, WebSockets e integraciones con terceros.' },
];

const plans = [
  { name: 'Básico', price: '120.000', period: 'mes', color: '#3b82f6', features: ['Hasta 50 atletas', '2 categorías', 'Reportes PDF', 'Soporte por email'] },
  { name: 'Profesional', price: '280.000', period: 'mes', color: '#8b5cf6', highlight: true, features: ['Hasta 200 atletas', 'Categorías ilimitadas', '5 Entrenadores', 'Soporte prioritario', 'Reportes avanzados'] },
  { name: 'Flexible', price: '1.000', period: 'atleta/mes', color: '#ec4899', features: ['Atletas ilimitados', 'Sin cargos fijos', 'Todas las funciones Pro', 'Escalabilidad automática'] },
  { name: 'Ilimitado', price: '600.000', period: 'mes', color: '#f59e0b', features: ['Todo ilimitado', 'Marca blanca', 'Multi-sede', 'API de integración', 'Soporte 24/7'] },
];

const techs = ['React', 'Python', 'Node.js', 'Docker', 'PostgreSQL', 'AWS', 'Flutter', 'FastAPI', 'Next.js', 'Oracle Cloud'];

const LandingPage = () => {
  const [activeService, setActiveService] = useState(null);

  return (
    <div style={{ background: '#080c14', color: '#f1f5f9', fontFamily: "'Inter', sans-serif", overflowX: 'hidden' }}>

      {/* Navbar */}
      <nav style={{ padding: '0 80px', height: '72px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'fixed', width: '100%', top: 0, zIndex: 100, backdropFilter: 'blur(20px)', background: 'rgba(8,12,20,0.85)', borderBottom: '1px solid rgba(255,255,255,0.06)', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Logo Mark */}
          <div style={{ position: 'relative', width: '38px', height: '38px' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', borderRadius: '10px', opacity: 0.15 }} />
            <div style={{ position: 'absolute', inset: '2px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 10 L10 4 L16 10 L10 16 Z" fill="white" opacity="0.9"/>
                <path d="M7 10 L10 7 L13 10 L10 13 Z" fill="url(#g)" />
                <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#60a5fa"/><stop offset="1" stopColor="#a78bfa"/></linearGradient></defs>
              </svg>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 900, letterSpacing: '0.08em', lineHeight: 1 }}>OSDOSOFT</div>
            <div style={{ fontSize: '0.55rem', color: '#475569', fontWeight: 600, letterSpacing: '0.15em' }}>SOFTWARE FACTORY</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '36px', alignItems: 'center' }}>
          {[['#services', 'Servicios'], ['#tech', 'Tecnología'], ['#product', 'Producto'], ['#contact', 'Contacto']].map(([href, label]) => (
            <a key={label} href={href} style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = '#f1f5f9'} onMouseLeave={e => e.target.style.color = '#64748b'}>
              {label}
            </a>
          ))}
          <a href="http://club-manager.osdosoft.com" style={{ padding: '9px 22px', borderRadius: '8px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem', boxShadow: '0 0 20px rgba(99,102,241,0.3)' }}>
            Club Manager →
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '140px 80px 100px', position: 'relative' }}>
        {/* Background grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)', backgroundSize: '64px 64px', pointerEvents: 'none' }} />
        {/* Glow */}
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)', width: '800px', height: '400px', background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: '900px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '32px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 8px #6366f1', display: 'inline-block' }} />
            DISPONIBLE PARA NUEVOS PROYECTOS
          </div>
          <h1 style={{ fontSize: 'clamp(3rem, 6vw, 5.5rem)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-3px', marginBottom: '28px' }}>
            Construimos el software<br />
            <span style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              que escala tu negocio
            </span>
          </h1>
          <p style={{ fontSize: '1.2rem', color: '#64748b', lineHeight: 1.7, maxWidth: '600px', margin: '0 auto 48px' }}>
            Somos una fábrica de software especializada en plataformas SaaS, apps móviles y sistemas a medida. Transformamos tus ideas en productos digitales de clase mundial.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#contact" style={{ padding: '15px 32px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', fontWeight: 700, textDecoration: 'none', boxShadow: '0 0 30px rgba(99,102,241,0.4)' }}>
              Habla con nosotros
            </a>
            <a href="#services" style={{ padding: '15px 32px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', color: '#94a3b8', fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.08)' }}>
              Ver servicios
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: '60px 80px', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px', textAlign: 'center' }}>
          {[['5+', 'Años de Experiencia'], ['50+', 'Proyectos Entregados'], ['20+', 'Clientes Activos'], ['99.9%', 'Uptime Garantizado']].map(([val, label]) => (
            <div key={label}>
              <div style={{ fontSize: '2.8rem', fontWeight: 900, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{val}</div>
              <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600, marginTop: '4px' }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section id="services" style={{ padding: '120px 80px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '72px' }}>
            <div style={{ color: '#6366f1', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.12em', marginBottom: '16px' }}>SERVICIOS</div>
            <h2 style={{ fontSize: '2.8rem', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: '16px' }}>Lo que construimos</h2>
            <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '500px' }}>Desde MVPs hasta plataformas empresariales, con tecnología de vanguardia.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {services.map((s, i) => (
              <div key={i}
                onMouseEnter={() => setActiveService(i)}
                onMouseLeave={() => setActiveService(null)}
                style={{ padding: '36px', borderRadius: '20px', background: activeService === i ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.02)', border: activeService === i ? '1px solid rgba(99,102,241,0.25)' : '1px solid rgba(255,255,255,0.05)', transition: 'all 0.3s ease', cursor: 'default' }}>
                <div style={{ fontSize: '2rem', marginBottom: '20px' }}>{s.icon}</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px', color: activeService === i ? '#e2e8f0' : '#cbd5e1' }}>{s.title}</h3>
                <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section id="tech" style={{ padding: '80px', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ color: '#6366f1', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.12em', marginBottom: '16px' }}>TECNOLOGÍA</div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '48px', letterSpacing: '-1px' }}>Stack moderno y probado</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            {techs.map(t => (
              <span key={t} style={{ padding: '10px 22px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', fontSize: '0.875rem', fontWeight: 500, background: 'rgba(255,255,255,0.02)' }}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section style={{ padding: '120px 80px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '72px' }}>
            <div style={{ color: '#6366f1', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.12em', marginBottom: '16px' }}>PROCESO</div>
            <h2 style={{ fontSize: '2.8rem', fontWeight: 800, letterSpacing: '-1.5px' }}>Cómo trabajamos</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px' }}>
            {[
              ['01', 'Discovery', 'Entendemos tu negocio, tus usuarios y definimos la arquitectura ideal.'],
              ['02', 'Diseño', 'Creamos prototipos y sistemas de diseño que enamoran a tus usuarios.'],
              ['03', 'Desarrollo', 'Código limpio, testeable y entregado en ciclos de 2 semanas.'],
              ['04', 'Lanzamiento', 'Deploy en producción, monitoreo 24/7 y soporte post-lanzamiento.']
            ].map(([num, title, desc]) => (
              <div key={num} style={{ position: 'relative' }}>
                <div style={{ fontSize: '3rem', fontWeight: 900, color: 'rgba(99,102,241,0.15)', marginBottom: '16px', letterSpacing: '-2px' }}>{num}</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px' }}>{title}</h3>
                <p style={{ color: '#475569', fontSize: '0.875rem', lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Club Manager Product Promo */}
      <section id="product" style={{ padding: '120px 80px', background: 'linear-gradient(180deg, #080c14 0%, #0d1829 50%, #080c14 100%)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ color: '#6366f1', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.12em', marginBottom: '16px' }}>NUESTRO PRODUCTO</div>
            <h2 style={{ fontSize: '2.8rem', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: '16px' }}>
              Presentamos <span style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Club Manager</span>
            </h2>
            <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 64px' }}>
              La plataforma SaaS que creamos para revolucionar la gestión de clubes deportivos. Prueba de lo que Osdosoft puede construir para ti.
            </p>
          </div>

          {/* Feature highlights */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '64px' }}>
            {[
              ['👥', 'Gestión de Atletas', 'Perfiles completos, categorías, historial y seguimiento individual de cada deportista.'],
              ['💳', 'Control de Pagos', 'Mensualidades, reportes financieros y seguimiento de mora en tiempo real.'],
              ['📋', 'Asistencia Digital', 'Registro diario de presencia con estadísticas por grupo y por atleta.'],
              ['📊', 'Panel de Control', 'Dashboard con todas las métricas clave de tu club en un solo vistazo.']
            ].map(([icon, title, desc]) => (
              <div key={title} style={{ padding: '28px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '1.8rem', flexShrink: 0 }}>{icon}</div>
                <div>
                  <h4 style={{ fontWeight: 700, marginBottom: '8px', fontSize: '1rem' }}>{title}</h4>
                  <p style={{ color: '#475569', fontSize: '0.875rem', lineHeight: 1.5 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>Planes y precios</h3>
            <p style={{ color: '#475569', fontSize: '0.9rem' }}>En pesos colombianos (COP). Sin costos ocultos.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '48px' }}>
            {plans.map(plan => (
              <div key={plan.name} style={{ padding: '32px 24px', borderRadius: '20px', background: plan.highlight ? `rgba(99,102,241,0.08)` : 'rgba(255,255,255,0.02)', border: plan.highlight ? `2px solid rgba(99,102,241,0.4)` : '1px solid rgba(255,255,255,0.06)', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                {plan.highlight && (
                  <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff', padding: '4px 16px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 800, whiteSpace: 'nowrap' }}>MÁS POPULAR</div>
                )}
                <div style={{ color: plan.color, fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '12px' }}>{plan.name.toUpperCase()}</div>
                <div style={{ marginBottom: '24px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>$</span>
                  <span style={{ fontSize: '2rem', fontWeight: 900, marginLeft: '2px' }}>{plan.price}</span>
                  <span style={{ fontSize: '0.78rem', color: '#475569' }}>/{plan.period}</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', gap: '8px', fontSize: '0.8rem', color: '#64748b', alignItems: 'flex-start' }}>
                      <span style={{ color: plan.color, fontWeight: 900, flexShrink: 0, marginTop: '1px' }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <a href="http://club-manager.osdosoft.com" style={{ display: 'block', textAlign: 'center', padding: '11px', borderRadius: '10px', background: plan.highlight ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'rgba(255,255,255,0.06)', color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>
                  Empezar
                </a>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center' }}>
            <a href="http://club-manager.osdosoft.com" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '16px 40px', borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: '1.05rem', boxShadow: '0 0 40px rgba(99,102,241,0.35)' }}>
              Probar Club Manager Gratis ⚽
            </a>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section id="contact" style={{ padding: '120px 80px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-2px', marginBottom: '20px' }}>
            ¿Tienes una idea? <br />
            <span style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Hagámosla realidad.</span>
          </h2>
          <p style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: '48px', lineHeight: 1.6 }}>
            Cuéntanos tu proyecto. Respondemos en menos de 24 horas con una propuesta técnica sin compromiso.
          </p>
          <a href="mailto:contacto@osdosoft.com" style={{ display: 'inline-block', padding: '16px 40px', borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: '1rem', boxShadow: '0 0 40px rgba(99,102,241,0.3)' }}>
            contacto@osdosoft.com
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '40px 80px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative', width: '30px', height: '30px' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', borderRadius: '8px', opacity: 0.15 }} />
            <div style={{ position: 'absolute', inset: '2px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <path d="M4 10 L10 4 L16 10 L10 16 Z" fill="white" opacity="0.9"/>
                <path d="M7 10 L10 7 L13 10 L10 13 Z" fill="#60a5fa" />
              </svg>
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: '0.85rem', letterSpacing: '0.08em' }}>OSDOSOFT</div>
            <div style={{ fontSize: '0.5rem', color: '#334155', fontWeight: 600, letterSpacing: '0.12em' }}>SOFTWARE FACTORY</div>
          </div>
        </div>
        <p style={{ color: '#334155', fontSize: '0.8rem' }}>© 2026 Osdosoft S.A.S. — Todos los derechos reservados.</p>
        <div style={{ display: 'flex', gap: '24px' }}>
          {['Privacidad', 'Términos', 'Contacto'].map(l => (
            <a key={l} href="#" style={{ color: '#334155', textDecoration: 'none', fontSize: '0.8rem' }}>{l}</a>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
