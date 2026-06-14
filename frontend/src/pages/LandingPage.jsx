import React, { useState, useEffect, useRef } from 'react';

/* ─────────────────────────── DATA ─────────────────────────── */
const plans = [
  { name: 'Prueba Gratis', price: '0', period: '15 días', features: ['Atletas ilimitados', 'Categorías ilimitadas', 'Gestión de asistencia', 'Seguimiento de pagos', 'Reportes y estadísticas', 'Múltiples entrenadores', 'Soporte prioritario'], trial: true },
  { name: 'Básico Mensual', price: '120.000', period: 'mes', features: ['Atletas ilimitados', 'Categorías ilimitadas', 'Gestión de asistencia', 'Seguimiento de pagos', 'Reportes y estadísticas', 'Múltiples entrenadores', 'Soporte prioritario'] },
  { name: 'Básico Semestral', price: '600.000', period: 'semestre', features: ['Atletas ilimitados', 'Categorías ilimitadas', 'Gestión de asistencia', 'Seguimiento de pagos', 'Reportes y estadísticas', 'Múltiples entrenadores', 'Soporte prioritario'] },
  { name: 'Básico Anual', price: '1.080.000', period: 'año', highlight: true, features: ['Atletas ilimitados', 'Categorías ilimitadas', 'Gestión de asistencia', 'Seguimiento de pagos', 'Reportes y estadísticas', 'Múltiples entrenadores', 'Soporte prioritario'] },
];

const portfolio = [
  {
    id: 'clubmanager', tag: 'SaaS Deportivo', title: 'Club Manager',
    desc: 'Plataforma de gestión deportiva para academias y clubes. Control de atletas, pagos y asistencia.',
    link: 'http://club-manager.osdosoft.com'
  },
  {
    id: 'ecommerce', tag: 'E-Commerce', title: 'E-Shop',
    desc: 'Tu tienda virtual lista para vender. Catálogo dinámico e integración directa con WhatsApp en minutos.',
    link: null
  },
  {
    id: 'hrapp', tag: 'Automatización', title: 'HR Automation',
    desc: 'Sistema de gestión de nómina con integración a PILA Colombia y cálculo automático.',
    link: null
  }
];

const techs = ['React', 'Python', 'Node.js', 'Docker', 'PostgreSQL', 'AWS', 'Flutter', 'FastAPI', 'Next.js', 'Oracle Cloud'];

/* ─────────────────────── HOOKS & UTILS ─────────────────────── */
function useInView(threshold = 0.1) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function FadeIn({ children, delay = 0, className = '' }) {
  const [ref, visible] = useInView();
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(24px)',
      transition: `opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
    }}>
      {children}
    </div>
  );
}

function LogoMark({ size = 32 }) {
  const inner = Math.round(size * 0.53);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'var(--text-main)', borderRadius: Math.round(size * 0.26), opacity: 0.1 }} />
      <div style={{ position: 'absolute', inset: 2, background: 'var(--text-main)', borderRadius: Math.round(size * 0.21), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={inner} height={inner} viewBox="0 0 20 20" fill="none">
          <path d="M4 10 L10 4 L16 10 L10 16 Z" fill="white" opacity="0.9" />
          <path d="M7 10 L10 7 L13 10 L10 13 Z" fill="rgba(255,255,255,0.5)" />
        </svg>
      </div>
    </div>
  );
}

/* ─────────────────────── MAIN PAGE ─────────────────────── */
const LandingPage = () => {
  return (
    <div className="layout-container">
      <style>{`
        :root {
          --bg: #ffffff;
          --text-main: #09090b;
          --text-muted: #71717a;
          --border: rgba(0, 0, 0, 0.08);
          --card-bg: #fafafa;
          --card-hover: #ffffff;
        }

        body { 
          margin: 0; background: var(--bg); color: var(--text-main); 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
          -webkit-font-smoothing: antialiased; 
        }
        * { box-sizing: border-box; }

        .layout-container { max-width: 1200px; margin: 0 auto; padding: 40px 24px; overflow-x: hidden; }
        
        /* Navbar */
        .navbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 100px; }
        .logo-container { display: flex; align-items: center; gap: 12px; }
        .logo-text { font-size: 1.25rem; font-weight: 800; letter-spacing: -0.04em; }
        .nav-links { display: flex; gap: 32px; align-items: center; }
        .nav-link { color: var(--text-muted); text-decoration: none; font-size: 0.9rem; font-weight: 500; transition: color 0.2s; }
        .nav-link:hover { color: var(--text-main); }
        .nav-button { padding: 10px 24px; border-radius: 100px; background: var(--text-main); color: #fff; text-decoration: none; font-size: 0.875rem; font-weight: 600; transition: transform 0.2s, box-shadow 0.2s; }
        .nav-button:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }

        /* Hero */
        .hero { margin-bottom: 80px; text-align: center; }
        .hero-title { font-size: clamp(3.5rem, 8vw, 7.5rem); font-weight: 800; line-height: 1; letter-spacing: -0.04em; margin: 0 0 32px 0; }
        .hero-subtitle { font-size: clamp(1.1rem, 2vw, 1.5rem); color: var(--text-muted); max-width: 600px; margin: 0 auto; line-height: 1.6; }

        /* Section Titles */
        .section-header { text-align: center; margin-bottom: 64px; }
        .section-tag { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.1em; color: var(--text-muted); margin-bottom: 16px; text-transform: uppercase; }
        .section-title { font-size: clamp(2rem, 4vw, 3rem); font-weight: 800; letter-spacing: -0.03em; margin: 0; }

        /* Bento Grid */
        .bento-grid { display: grid; grid-template-columns: repeat(4, 1fr); grid-auto-rows: minmax(280px, auto); gap: 24px; margin-bottom: 140px; }
        .bento-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 32px; padding: 48px; display: flex; flex-direction: column; transition: transform 0.4s, box-shadow 0.4s, background 0.4s; }
        .bento-card:hover { transform: translateY(-6px); box-shadow: 0 24px 48px rgba(0,0,0,0.06); background: var(--card-hover); }
        .card-large { grid-column: span 2; grid-row: span 2; }
        .card-wide  { grid-column: span 2; grid-row: span 1; }
        .card-small { grid-column: span 1; grid-row: span 1; padding: 32px; }

        /* Portfolio */
        .portfolio-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 140px; }
        .port-card { padding: 32px; border: 1px solid var(--border); border-radius: 24px; background: var(--bg); display: flex; flex-direction: column; height: 100%; transition: box-shadow 0.3s; }
        .port-card:hover { box-shadow: 0 10px 30px rgba(0,0,0,0.04); }

        /* Tech Stack */
        .tech-container { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin-bottom: 140px; }
        .tech-pill { padding: 8px 20px; border-radius: 100px; border: 1px solid var(--border); font-size: 0.85rem; font-weight: 500; color: var(--text-muted); }

        /* Pricing */
        .pricing-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 140px; }
        .price-card { padding: 32px 24px; border-radius: 24px; border: 1px solid var(--border); display: flex; flex-direction: column; position: relative; }
        .price-highlight { border: 2px solid var(--text-main); background: var(--card-bg); }

        /* Contact */
        .contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; margin-bottom: 80px; align-items: start; }
        .contact-input { width: 100%; padding: 14px 16px; border-radius: 12px; border: 1px solid var(--border); background: var(--card-bg); font-family: inherit; font-size: 0.95rem; margin-bottom: 16px; outline: none; transition: border-color 0.2s; }
        .contact-input:focus { border-color: var(--text-main); }
        .contact-btn { width: 100%; padding: 16px; border-radius: 12px; background: var(--text-main); color: #fff; font-weight: 700; border: none; cursor: pointer; font-size: 1rem; }

        @media (max-width: 1024px) {
          .bento-grid { grid-template-columns: repeat(2, 1fr); }
          .card-large, .card-wide { grid-column: span 2; grid-row: span 1; }
          .portfolio-grid { grid-template-columns: repeat(2, 1fr); }
          .pricing-grid { grid-template-columns: repeat(2, 1fr); }
          .contact-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .nav-links { display: none; }
          .bento-grid, .portfolio-grid, .pricing-grid { grid-template-columns: 1fr; }
          .card-large, .card-wide, .card-small { grid-column: span 1; }
        }
      `}</style>

      {/* Navbar */}
      <nav className="navbar">
        <div className="logo-container">
          <LogoMark size={32} />
          <div className="logo-text">OSDOSOFT.</div>
        </div>
        <div className="nav-links">
          <a href="#about" className="nav-link">Nosotros</a>
          <a href="#portfolio" className="nav-link">Proyectos</a>
          <a href="#pricing" className="nav-link">Precios</a>
        </div>
        <a href="#contact" className="nav-button">Iniciar Proyecto</a>
      </nav>

      {/* Hero */}
      <header className="hero">
        <FadeIn><h1 className="hero-title">Diseño.<br />Código.<br />Precisión.</h1></FadeIn>
        <FadeIn delay={0.1}>
          <p className="hero-subtitle">
            Construimos software excepcional para empresas visionarias. Minimalismo estético y arquitectura de vanguardia.
          </p>
        </FadeIn>
      </header>

      {/* Bento Grid (About, Mission, Vision, Services) */}
      <section id="about" className="bento-grid">
        <FadeIn className="bento-card card-large">
          <div style={{ fontSize: '2.5rem', marginBottom: '24px' }}>🧠</div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '24px', letterSpacing: '-0.03em' }}>Quiénes Somos</h2>
          <p style={{ fontSize: '1.125rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
            Somos un estudio boutique de ingeniería de software. Rechazamos lo convencional y el exceso visual. Nos enfocamos estrictamente en lo esencial: construir plataformas impecables y escalables.
          </p>
        </FadeIn>

        <FadeIn delay={0.1} className="bento-card card-wide">
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>🔭</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '16px' }}>Nuestra Visión</h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>Ser el referente global en productos digitales, donde la ingeniería de alto rendimiento y el diseño minimalista convergen perfectamente.</p>
        </FadeIn>

        <FadeIn delay={0.2} className="bento-card card-wide">
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>🎯</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '16px' }}>Nuestra Misión</h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>Entregar soluciones precisas. Transformamos la complejidad empresarial en interfaces limpias y arquitecturas robustas que potencian el crecimiento.</p>
        </FadeIn>

        <FadeIn delay={0.3} className="bento-card card-small">
          <div style={{ fontSize: '2rem', marginBottom: 'auto' }}>⚡</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '16px 0 8px' }}>Desarrollo Web</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Plataformas SaaS ultrarrápidas.</p>
        </FadeIn>

        <FadeIn delay={0.4} className="bento-card card-small">
          <div style={{ fontSize: '2rem', marginBottom: 'auto' }}>📱</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '16px 0 8px' }}>Apps Móviles</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Experiencias iOS y Android nativas.</p>
        </FadeIn>

        <FadeIn delay={0.5} className="bento-card card-small">
          <div style={{ fontSize: '2rem', marginBottom: 'auto' }}>☁️</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '16px 0 8px' }}>Cloud & DevOps</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>AWS, GCP y arquitecturas serverless.</p>
        </FadeIn>

        <FadeIn delay={0.6} className="bento-card card-small">
          <div style={{ fontSize: '2rem', marginBottom: 'auto' }}>🤖</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '16px 0 8px' }}>IA & Datos</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Modelos y automatización inteligente.</p>
        </FadeIn>
      </section>

      {/* Tech Stack */}
      <FadeIn>
        <div className="section-header">
          <div className="section-tag">TECNOLOGÍA</div>
          <h2 className="section-title">Stack de Vanguardia</h2>
        </div>
        <div className="tech-container">
          {techs.map(t => <span key={t} className="tech-pill">{t}</span>)}
        </div>
      </FadeIn>

      {/* Portfolio / Products */}
      <section id="portfolio">
        <FadeIn>
          <div className="section-header">
            <div className="section-tag">PRODUCTOS & PORTAFOLIO</div>
            <h2 className="section-title">Soluciones Escalables</h2>
          </div>
        </FadeIn>
        <div className="portfolio-grid">
          {portfolio.map((p, i) => (
            <FadeIn key={p.id} delay={i * 0.1}>
              <div className="port-card">
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '16px' }}>{p.tag.toUpperCase()}</div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '16px', letterSpacing: '-0.03em' }}>{p.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, flex: 1 }}>{p.desc}</p>
                {p.link ? (
                  <a href={p.link} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: '24px', color: 'var(--text-main)', fontWeight: 600, textDecoration: 'none' }}>Ver producto →</a>
                ) : (
                  <span style={{ display: 'inline-block', marginTop: '24px', color: '#a1a1aa', fontWeight: 500, fontSize: '0.85rem' }}>Próximamente</span>
                )}
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing">
        <FadeIn>
          <div className="section-header">
            <div className="section-tag">CLUB MANAGER</div>
            <h2 className="section-title">Planes Simples</h2>
          </div>
        </FadeIn>
        <div className="pricing-grid">
          {plans.map((plan, i) => (
            <FadeIn key={plan.name} delay={i * 0.1}>
              <div className={`price-card ${plan.highlight ? 'price-highlight' : ''}`}>
                {plan.trial && <div style={{ position: 'absolute', top: -12, left: 24, background: 'var(--green-500)', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '4px 12px', borderRadius: '100px' }}>SIN COSTO</div>}
                {plan.highlight && <div style={{ position: 'absolute', top: -12, left: 24, background: 'var(--text-main)', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '4px 12px', borderRadius: '100px' }}>RECOMENDADO</div>}
                <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '8px' }}>{plan.name}</div>
                <div style={{ marginBottom: '24px' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 800 }}>${plan.price}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>/{plan.period}</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', flex: 1, color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 2 }}>
                  {plan.features.map(f => <li key={f}>• {f}</li>)}
                </ul>
                <button className="nav-button" style={{ width: '100%', border: 'none', cursor: 'pointer', background: plan.highlight ? 'var(--text-main)' : 'var(--border)', color: plan.highlight ? '#fff' : 'var(--text-main)' }}>Elegir Plan</button>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact" style={{ borderTop: '1px solid var(--border)', paddingTop: '120px', paddingBottom: '60px' }}>
        <FadeIn>
          <div className="contact-grid">
            <div>
              <h2 style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 24px' }}>Hablemos.</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1.6, maxWidth: '400px' }}>
                Cuéntanos sobre tu proyecto. Nos pondremos en contacto contigo en menos de 24 horas con una propuesta técnica.
              </p>
              <div style={{ marginTop: '40px' }}>
                <div style={{ fontWeight: 600, marginBottom: '8px' }}>Email Directo</div>
                <a href="mailto:contacto@osdosoft.com" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>contacto@osdosoft.com</a>
              </div>
            </div>

            <div style={{ background: 'var(--card-bg)', padding: '40px', borderRadius: '24px', border: '1px solid var(--border)' }}>
              <input type="text" placeholder="Nombre completo" className="contact-input" />
              <input type="email" placeholder="Correo electrónico" className="contact-input" />
              <textarea placeholder="Cuéntanos tu idea o requerimiento..." className="contact-input" style={{ minHeight: '120px', resize: 'vertical' }}></textarea>
              <button className="contact-btn">Enviar Mensaje</button>
            </div>
          </div>
        </FadeIn>

        <div style={{ textAlign: 'center', marginTop: '60px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          &copy; {new Date().getFullYear()} Osdosoft S.A.S. — Todos los derechos reservados.
        </div>
      </section>

    </div>
  );
};

export default LandingPage;
