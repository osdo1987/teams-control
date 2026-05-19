import React, { useState, useEffect, useRef } from 'react';

/* ─────────────────────────── DATA ─────────────────────────── */
const services = [
  { id: 'web', icon: '⚡', title: 'Desarrollo Web & SaaS', desc: 'Plataformas web escalables, sistemas multi-tenant y aplicaciones SaaS con arquitecturas modernas.' },
  { id: 'mobile', icon: '📱', title: 'Apps Móviles', desc: 'Aplicaciones iOS y Android nativas e híbridas con experiencias de usuario de primer nivel.' },
  { id: 'design', icon: '🎨', title: 'UI/UX Design', desc: 'Diseño centrado en el usuario. Interfaces que convierten visitantes en clientes.' },
  { id: 'cloud', icon: '☁️', title: 'Cloud & DevOps', desc: 'Infraestructura en AWS, Oracle y GCP. CI/CD, Docker y Kubernetes para escalar sin límites.' },
  { id: 'ai', icon: '🤖', title: 'IA & Automatización', desc: 'Integramos inteligencia artificial en tus procesos. Chatbots, análisis predictivo y automatizaciones.' },
  { id: 'api', icon: '🔗', title: 'APIs & Integraciones', desc: 'Conectamos tus sistemas. REST, GraphQL, WebSockets e integraciones con terceros.' },
];

const plans = [
  { name: 'Básico', price: '120.000', period: 'mes', color: '#3b82f6', features: ['Hasta 50 atletas', '2 categorías', 'Reportes PDF', 'Soporte por email'] },
  { name: 'Profesional', price: '280.000', period: 'mes', color: '#8b5cf6', highlight: true, features: ['Hasta 200 atletas', 'Categorías ilimitadas', '5 Entrenadores', 'Soporte prioritario', 'Reportes avanzados'] },
  { name: 'Flexible', price: '1.000', period: 'atleta/mes', color: '#ec4899', features: ['Atletas ilimitados', 'Sin cargos fijos', 'Todas las funciones Pro', 'Escalabilidad automática'] },
  { name: 'Ilimitado', price: '600.000', period: 'mes', color: '#f59e0b', features: ['Todo ilimitado', 'Marca blanca', 'Multi-sede', 'API de integración', 'Soporte 24/7'] },
];

const techs = ['React', 'Python', 'Node.js', 'Docker', 'PostgreSQL', 'AWS', 'Flutter', 'FastAPI', 'Next.js', 'Oracle Cloud'];

const portfolio = [
  {
    id: 'clubmanager',
    tag: 'SaaS Deportivo',
    tagColor: '#3b82f6',
    tagBg: 'rgba(59,130,246,0.1)',
    title: 'Club Manager',
    desc: 'Plataforma de gestión deportiva para academias y clubes. Control de atletas, pagos y asistencia desde un solo lugar.',
    metrics: [['200+', 'Clubes activos'], ['98%', 'Retención mensual'], ['30%', 'Menos mora']],
    tech: ['React', 'FastAPI', 'PostgreSQL', 'AWS'],
    link: 'http://club-manager.osdosoft.com',
  },
  {
    id: 'ecommerce',
    tag: 'E-Commerce',
    tagColor: '#ec4899',
    tagBg: 'rgba(236,72,153,0.1)',
    title: 'Solución de Tiendas Online',
    desc: 'Plataforma flexible para publicar productos organizados en múltiples categorías, con catálogo dinámico y un panel administrativo fácil de usar para gestionar tu tienda.',
    metrics: [['3x', 'Conversión vs email'], ['< 1s', 'Tiempo de carga'], ['Multi', 'Pasarelas de pago']],
    tech: ['Next.js', 'Node.js', 'Docker', 'GCP'],
    link: null,
  },
  {
    id: 'hrapp',
    tag: 'Automatización',
    tagColor: '#10b981',
    tagBg: 'rgba(16,185,129,0.1)',
    title: 'HR Automation',
    desc: 'Sistema de gestión de nómina y RRHH con integración a PILA Colombia, cálculo automático de prestaciones y reportes DIAN.',
    metrics: [['80%', 'Tiempo ahorrado'], ['0', 'Errores de nómina'], ['DIAN', 'Compliant']],
    tech: ['React', 'Python', 'PostgreSQL', 'Oracle Cloud'],
    link: null,
  },
];

/* ─────────────────────── HOOK: INTERSECTION ─────────────────────── */
function useInView(threshold = 0.15) {
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

/* ─────────────────────── ANIMATED SECTION ─────────────────────── */
function FadeIn({ children, delay = 0, style = {} }) {
  const [ref, visible] = useInView();
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(28px)',
      transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
      ...style,
    }}>
      {children}
    </div>
  );
}

/* ─────────────────────── LOGO SVG (unique IDs) ─────────────────────── */
function LogoMark({ size = 38, gradId = 'logoGrad1' }) {
  const inner = Math.round(size * 0.53);
  const r1 = Math.round(size * 0.26);
  const r2 = Math.round(size * 0.21);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', borderRadius: Math.round(size * 0.26), opacity: 0.15 }} />
      <div style={{ position: 'absolute', inset: 2, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', borderRadius: Math.round(size * 0.21), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={inner} height={inner} viewBox="0 0 20 20" fill="none">
          <path d="M4 10 L10 4 L16 10 L10 16 Z" fill="white" opacity="0.9" />
          <path d="M7 10 L10 7 L13 10 L10 13 Z" fill={`url(#${gradId})`} />
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#60a5fa" />
              <stop offset="1" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

/* ─────────────────────── CONTACT FORM ─────────────────────── */
function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', company: '', type: '', budget: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | success | error

  const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.message) {
      setStatus('error');
      return;
    }
    setStatus('sending');
    // Aquí conectas tu backend / Formspree / EmailJS
    await new Promise(r => setTimeout(r, 1200)); // simulación
    setStatus('success');
  };

  const inputStyle = {
    width: '100%', padding: '12px 16px', borderRadius: '10px',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    color: '#f1f5f9', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit', transition: 'border-color 0.2s',
  };
  const labelStyle = { fontSize: '0.78rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.05em', display: 'block', marginBottom: '6px' };

  if (status === 'success') return (
    <div style={{ textAlign: 'center', padding: '64px 32px' }}>
      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
      <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>¡Mensaje recibido!</h3>
      <p style={{ color: '#64748b' }}>Te respondemos en menos de 24 horas con una propuesta técnica.</p>
    </div>
  );

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle}>Nombre *</label>
          <input style={inputStyle} placeholder="Tu nombre" value={form.name} onChange={set('name')}
            onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
        </div>
        <div>
          <label style={labelStyle}>Email *</label>
          <input style={inputStyle} type="email" placeholder="tu@empresa.com" value={form.email} onChange={set('email')}
            onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle}>Empresa</label>
          <input style={inputStyle} placeholder="Nombre de tu empresa" value={form.company} onChange={set('company')}
            onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
        </div>
        <div>
          <label style={labelStyle}>Tipo de proyecto</label>
          <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.type} onChange={set('type')}
            onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}>
            <option value="" style={{ background: '#0d1829' }}>Selecciona...</option>
            <option value="web" style={{ background: '#0d1829' }}>Web / SaaS</option>
            <option value="mobile" style={{ background: '#0d1829' }}>App Móvil</option>
            <option value="ai" style={{ background: '#0d1829' }}>IA / Automatización</option>
            <option value="design" style={{ background: '#0d1829' }}>UI/UX Design</option>
            <option value="other" style={{ background: '#0d1829' }}>Otro</option>
          </select>
        </div>
      </div>
      <div>
        <label style={labelStyle}>Presupuesto estimado</label>
        <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.budget} onChange={set('budget')}
          onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}>
          <option value="" style={{ background: '#0d1829' }}>Selecciona un rango...</option>
          <option value="<5m" style={{ background: '#0d1829' }}>Menos de $5.000.000 COP</option>
          <option value="5-20" style={{ background: '#0d1829' }}>$5M – $20M COP</option>
          <option value="20-50" style={{ background: '#0d1829' }}>$20M – $50M COP</option>
          <option value=">50" style={{ background: '#0d1829' }}>Más de $50M COP</option>
          <option value="talk" style={{ background: '#0d1829' }}>Prefiero hablarlo</option>
        </select>
      </div>
      <div>
        <label style={labelStyle}>Cuéntanos tu proyecto *</label>
        <textarea style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
          placeholder="¿Qué quieres construir? ¿Cuál es el problema que resuelve? ¿Tienes algún plazo?"
          value={form.message} onChange={set('message')}
          onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
      </div>
      {status === 'error' && (
        <p style={{ color: '#f87171', fontSize: '0.82rem', margin: 0 }}>Por favor completa los campos obligatorios (*).</p>
      )}
      <button
        onClick={handleSubmit}
        disabled={status === 'sending'}
        style={{ padding: '14px', borderRadius: '10px', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', color: '#fff', fontWeight: 700, fontSize: '0.95rem', border: 'none', cursor: status === 'sending' ? 'wait' : 'pointer', boxShadow: '0 0 30px rgba(99,102,241,0.3)', opacity: status === 'sending' ? 0.7 : 1, fontFamily: 'inherit' }}>
        {status === 'sending' ? 'Enviando…' : 'Enviar mensaje →'}
      </button>
      <p style={{ textAlign: 'center', color: '#334155', fontSize: '0.78rem', margin: 0 }}>
        O escríbenos directo a{' '}
        <a href="mailto:contacto@osdosoft.com" style={{ color: '#6366f1', textDecoration: 'none' }}>contacto@osdosoft.com</a>
      </p>
    </div>
  );
}

/* ─────────────────────── WAITLIST FORM ─────────────────────── */
function WaitlistForm({ product }) {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const submit = () => { if (email) setDone(true); };
  if (done) return <p style={{ color: '#10b981', fontWeight: 600, textAlign: 'center', padding: '12px 0' }}>¡Te avisamos cuando esté listo! 🎉</p>;
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <input
        type="email" placeholder="tu@email.com" value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ flex: 1, minWidth: '180px', padding: '12px 16px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit' }} />
      <button onClick={submit} style={{ padding: '12px 20px', borderRadius: '10px', background: 'rgba(236,72,153,0.15)', border: '1px solid rgba(236,72,153,0.3)', color: '#f472b6', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
        Unirme a la lista →
      </button>
    </div>
  );
}

/* ═══════════════════════ MAIN COMPONENT ═══════════════════════ */
const LandingPage = () => {
  const [activeService, setActiveService] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div style={{ background: '#080c14', color: '#f1f5f9', fontFamily: "'Inter', sans-serif", overflowX: 'hidden' }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }

        .nav-container { padding: 0 80px; }
        .nav-links { display: flex; gap: 36px; align-items: center; }
        .mobile-menu-btn { display: none; background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; }
        .mobile-menu { display: none; flex-direction: column; gap: 20px; position: absolute; top: 72px; left: 0; right: 0; background: rgba(8,12,20,0.97); padding: 24px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); backdrop-filter: blur(20px); }
        .mobile-menu.open { display: flex; }

        .hero-section { padding: 140px 80px 100px; }
        .hero-title { font-size: clamp(2.5rem, 6vw, 5.5rem); }

        .stats-section { padding: 60px 80px; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 40px; }

        .section-padding { padding: 120px 80px; }

        .services-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .process-grid  { display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; }
        .pricing-grid  { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .portfolio-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }

        .products-showcase { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 64px; }
        .product-card { padding: 40px; border-radius: 24px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); display: flex; flex-direction: column; }

        .contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: start; }

        .footer-container { padding: 40px 80px; display: flex; justify-content: space-between; align-items: center; }

        .process-connector { display: block; }

        @media (max-width: 1024px) {
          .nav-container { padding: 0 40px; }
          .hero-section { padding: 120px 40px 80px; }
          .stats-section { padding: 60px 40px; }
          .section-padding { padding: 100px 40px; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 30px; }
          .services-grid { grid-template-columns: repeat(2, 1fr); }
          .process-grid { grid-template-columns: repeat(2, 1fr); gap: 40px; }
          .pricing-grid { grid-template-columns: repeat(2, 1fr); }
          .portfolio-grid { grid-template-columns: repeat(2, 1fr); }
          .contact-grid { grid-template-columns: 1fr; gap: 40px; }
          .footer-container { padding: 40px; }
          .products-showcase { grid-template-columns: 1fr; }
        }

        @media (max-width: 768px) {
          .nav-container { padding: 0 20px; }
          .nav-links { display: none; }
          .mobile-menu-btn { display: block; }
          .hero-section { padding: 100px 20px 60px; }
          .stats-section { padding: 40px 20px; }
          .section-padding { padding: 80px 20px; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 24px; }
          .services-grid { grid-template-columns: 1fr; }
          .process-grid { grid-template-columns: 1fr; gap: 32px; }
          .pricing-grid { grid-template-columns: 1fr; }
          .portfolio-grid { grid-template-columns: 1fr; }
          .footer-container { padding: 30px 20px; flex-direction: column; gap: 20px; text-align: center; }
          .product-card { padding: 24px; }
          .process-connector { display: none; }
        }
      `}</style>

      {/* ── Navbar ── */}
      <nav className="nav-container" style={{ height: '72px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'fixed', width: '100%', top: 0, zIndex: 100, backdropFilter: 'blur(20px)', background: 'rgba(8,12,20,0.85)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <LogoMark size={38} gradId="navGrad" />
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 900, letterSpacing: '0.08em', lineHeight: 1 }}>OSDOSOFT</div>
            <div style={{ fontSize: '0.55rem', color: '#475569', fontWeight: 600, letterSpacing: '0.15em' }}>SOFTWARE FACTORY</div>
          </div>
        </div>

        <div className="nav-links">
          {[['#services', 'Servicios'], ['#tech', 'Tecnología'], ['#portfolio', 'Portafolio'], ['#product', 'Productos'], ['#contact', 'Contacto']].map(([href, label]) => (
            <a key={label} href={href} style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = '#f1f5f9'} onMouseLeave={e => e.target.style.color = '#64748b'}>
              {label}
            </a>
          ))}
          <a href="#contact" style={{ padding: '9px 22px', borderRadius: '8px', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem', boxShadow: '0 0 20px rgba(99,102,241,0.3)' }}>
            Hablemos →
          </a>
        </div>

        <button className="mobile-menu-btn" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Menú">
          {isMenuOpen ? '✕' : '☰'}
        </button>

        <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
          {[['#services', 'Servicios'], ['#tech', 'Tecnología'], ['#portfolio', 'Portafolio'], ['#product', 'Productos'], ['#contact', 'Contacto']].map(([href, label]) => (
            <a key={label} href={href} onClick={closeMenu} style={{ color: '#f1f5f9', textDecoration: 'none', fontSize: '1rem', fontWeight: 600 }}>{label}</a>
          ))}
          <a href="#contact" onClick={closeMenu} style={{ padding: '12px 20px', borderRadius: '8px', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', color: '#fff', textDecoration: 'none', fontWeight: 700, textAlign: 'center' }}>Hablemos →</a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero-section" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)', backgroundSize: '64px 64px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: '800px', height: '400px', background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)', pointerEvents: 'none', maxWidth: '100%' }} />

        <div style={{ position: 'relative', maxWidth: '900px' }}>
          <div style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '32px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 8px #6366f1', display: 'inline-block' }} />
              DISPONIBLE PARA NUEVOS PROYECTOS
            </div>
          </div>

          <div style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(24px)', transition: 'opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s' }}>
            <h1 className="hero-title" style={{ fontWeight: 900, lineHeight: 1.05, letterSpacing: '-3px', marginBottom: '28px' }}>
              Construimos el software<br />
              <span style={{ background: 'linear-gradient(135deg,#3b82f6 0%,#8b5cf6 50%,#ec4899 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                que escala tu negocio
              </span>
            </h1>
          </div>

          <div style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.7s ease 0.2s, transform 0.7s ease 0.2s' }}>
            <p style={{ fontSize: '1.1rem', color: '#64748b', lineHeight: 1.7, maxWidth: '600px', margin: '0 auto 48px' }}>
              Somos una fábrica de software especializada en plataformas SaaS, apps móviles y sistemas a medida. Transformamos tus ideas en productos digitales de clase mundial.
            </p>
          </div>

          <div style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.7s ease 0.3s, transform 0.7s ease 0.3s', display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#contact" style={{ padding: '15px 32px', borderRadius: '10px', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', color: '#fff', fontWeight: 700, textDecoration: 'none', boxShadow: '0 0 30px rgba(99,102,241,0.4)' }}>
              Habla con nosotros
            </a>
            <a href="#services" style={{ padding: '15px 32px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', color: '#94a3b8', fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.08)' }}>
              Ver servicios
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="stats-section" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="stats-grid" style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          {[['5+', 'Años de Experiencia'], ['50+', 'Proyectos Entregados'], ['20+', 'Clientes Activos'], ['99.9%', 'Uptime Garantizado']].map(([val, label]) => (
            <FadeIn key={label}>
              <div style={{ fontSize: '2.8rem', fontWeight: 900, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{val}</div>
              <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600, marginTop: '4px' }}>{label}</div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── Services ── */}
      <section id="services" className="section-padding">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <FadeIn>
            <div style={{ marginBottom: '72px' }}>
              <div style={{ color: '#6366f1', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.12em', marginBottom: '16px' }}>SERVICIOS</div>
              <h2 style={{ fontSize: '2.8rem', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: '16px' }}>Lo que construimos</h2>
              <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '500px' }}>Desde MVPs hasta plataformas empresariales, con tecnología de vanguardia.</p>
            </div>
          </FadeIn>
          <div className="services-grid">
            {services.map((s, i) => (
              <FadeIn key={s.id} delay={i * 0.07}>
                <div
                  onMouseEnter={() => setActiveService(s.id)}
                  onMouseLeave={() => setActiveService(null)}
                  style={{ padding: '36px', borderRadius: '20px', background: activeService === s.id ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.02)', border: activeService === s.id ? '1px solid rgba(99,102,241,0.25)' : '1px solid rgba(255,255,255,0.05)', transition: 'all 0.3s ease', cursor: 'default', height: '100%' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '20px' }}>{s.icon}</div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px', color: activeService === s.id ? '#e2e8f0' : '#cbd5e1' }}>{s.title}</h3>
                  <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tech Stack ── */}
      <section id="tech" className="section-padding" style={{ background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <FadeIn>
            <div style={{ color: '#6366f1', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.12em', marginBottom: '16px' }}>TECNOLOGÍA</div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '48px', letterSpacing: '-1px' }}>Stack moderno y probado</h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
              {techs.map(t => (
                <span key={t} style={{ padding: '10px 22px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', fontSize: '0.875rem', fontWeight: 500, background: 'rgba(255,255,255,0.02)' }}>{t}</span>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Process ── */}
      <section className="section-padding">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <FadeIn>
            <div style={{ textAlign: 'center', marginBottom: '72px' }}>
              <div style={{ color: '#6366f1', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.12em', marginBottom: '16px' }}>PROCESO</div>
              <h2 style={{ fontSize: '2.8rem', fontWeight: 800, letterSpacing: '-1.5px' }}>Cómo trabajamos</h2>
            </div>
          </FadeIn>
          <div className="process-grid" style={{ position: 'relative' }}>
            {[
              ['01', 'Discovery', 'Entendemos tu negocio, tus usuarios y definimos la arquitectura ideal.'],
              ['02', 'Diseño', 'Creamos prototipos y sistemas de diseño que enamoran a tus usuarios.'],
              ['03', 'Desarrollo', 'Código limpio, testeable y entregado en ciclos de 2 semanas.'],
              ['04', 'Lanzamiento', 'Deploy en producción, monitoreo 24/7 y soporte post-lanzamiento.'],
            ].map(([num, title, desc], i) => (
              <FadeIn key={num} delay={i * 0.1}>
                <div style={{ position: 'relative' }}>
                  {/* connector line */}
                  {i < 3 && (
                    <div className="process-connector" style={{ position: 'absolute', top: '22px', left: 'calc(100% + 4px)', width: 'calc(100% - 8px)', height: '1px', background: 'linear-gradient(90deg, rgba(99,102,241,0.3), transparent)', pointerEvents: 'none', zIndex: 0 }} />
                  )}
                  <div style={{ fontSize: '3rem', fontWeight: 900, color: 'rgba(99,102,241,0.15)', marginBottom: '16px', letterSpacing: '-2px', lineHeight: 1 }}>{num}</div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px' }}>{title}</h3>
                  <p style={{ color: '#475569', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>{desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Portfolio ── */}
      <section id="portfolio" className="section-padding" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.005)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <FadeIn>
            <div style={{ marginBottom: '64px' }}>
              <div style={{ color: '#6366f1', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.12em', marginBottom: '16px' }}>PORTAFOLIO</div>
              <h2 style={{ fontSize: '2.8rem', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: '16px' }}>Proyectos que hablan por nosotros</h2>
              <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '520px' }}>Cada proyecto es una solución real a un problema real. Estos son algunos de los que más nos enorgullecen.</p>
            </div>
          </FadeIn>
          <div className="portfolio-grid">
            {portfolio.map((p, i) => (
              <FadeIn key={p.id} delay={i * 0.1}>
                <div style={{ padding: '32px', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ display: 'inline-block', alignSelf: 'flex-start', padding: '5px 12px', borderRadius: '100px', background: p.tagBg, color: p.tagColor, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '20px' }}>{p.tag.toUpperCase()}</div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.5px' }}>{p.title}</h3>
                  <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '24px', flex: 1 }}>{p.desc}</p>

                  {/* Metrics */}
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    {p.metrics.map(([val, lbl]) => (
                      <div key={lbl} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.3rem', fontWeight: 900, color: p.tagColor }}>{val}</div>
                        <div style={{ fontSize: '0.68rem', color: '#475569', fontWeight: 600 }}>{lbl}</div>
                      </div>
                    ))}
                  </div>

                  {/* Tech pills */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '24px' }}>
                    {p.tech.map(t => (
                      <span key={t} style={{ padding: '3px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#64748b', fontSize: '0.72rem', fontWeight: 500 }}>{t}</span>
                    ))}
                  </div>

                  {p.link
                    ? <a href={p.link} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', padding: '11px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>Ver proyecto →</a>
                    : <div style={{ padding: '11px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: '#334155', fontWeight: 600, fontSize: '0.85rem', textAlign: 'center' }}>Proyecto confidencial</div>
                  }
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Products ── */}
      <section id="product" className="section-padding" style={{ background: 'linear-gradient(180deg,#080c14 0%,#0d1829 50%,#080c14 100%)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <FadeIn>
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
              <div style={{ color: '#6366f1', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.12em', marginBottom: '16px' }}>NUESTROS PRODUCTOS</div>
              <h2 style={{ fontSize: '2.8rem', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: '16px' }}>
                Soluciones listas para{' '}
                <span style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>escalar</span>
              </h2>
              <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                Plataformas SaaS diseñadas para revolucionar diferentes industrias. Prueba de lo que Osdosoft puede construir.
              </p>
            </div>
          </FadeIn>

          <div className="products-showcase">
            {/* Club Manager */}
            <FadeIn>
              <div className="product-card">
                <div style={{ display: 'inline-block', alignSelf: 'flex-start', padding: '6px 14px', borderRadius: '100px', background: 'rgba(59,130,246,0.1)', color: '#60a5fa', fontSize: '0.75rem', fontWeight: 700, marginBottom: '20px', letterSpacing: '0.05em' }}>SAAS DEPORTIVO</div>
                <h3 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '12px', letterSpacing: '-1px' }}>Club Manager</h3>
                <p style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: 1.6, marginBottom: '28px', flex: 1 }}>
                  La plataforma definitiva para gestionar tu club deportivo. Controla pagos, asistencia, atletas y más desde un solo lugar.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '36px' }}>
                  {[['👥', 'Gestión de Atletas y Grupos'], ['💳', 'Control de Pagos y Mora'], ['📋', 'Asistencia Digital']].map(([icon, text]) => (
                    <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.05)', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>{icon}</div>
                      <span style={{ color: '#cbd5e1', fontSize: '0.9rem', fontWeight: 500 }}>{text}</span>
                    </div>
                  ))}
                </div>
                <a href="http://club-manager.osdosoft.com" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px 28px', borderRadius: '12px', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem', boxShadow: '0 0 20px rgba(99,102,241,0.2)' }}>
                  Ver Club Manager →
                </a>
              </div>
            </FadeIn>

            {/* E-Shop — Waitlist */}
            <FadeIn delay={0.1}>
              <div className="product-card" style={{ position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '16px', right: '16px', padding: '4px 10px', borderRadius: '100px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#fbbf24', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em' }}>PRÓXIMAMENTE</div>
                <div style={{ display: 'inline-block', alignSelf: 'flex-start', padding: '6px 14px', borderRadius: '100px', background: 'rgba(236,72,153,0.1)', color: '#f472b6', fontSize: '0.75rem', fontWeight: 700, marginBottom: '20px', letterSpacing: '0.05em' }}>E-COMMERCE</div>
                <h3 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '12px', letterSpacing: '-1px' }}>E-Shop</h3>
                <p style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: 1.6, marginBottom: '28px', flex: 1 }}>
                  Tu tienda virtual lista para vender. Catálogo de productos, carrito de compras e integración directa con WhatsApp en minutos.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px' }}>
                  {[['🛍️', 'Catálogo Multi-Tenant'], ['🛒', 'Carrito y Checkout Optimizados'], ['📱', 'Integración con WhatsApp']].map(([icon, text]) => (
                    <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.05)', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>{icon}</div>
                      <span style={{ color: '#cbd5e1', fontSize: '0.9rem', fontWeight: 500 }}>{text}</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(236,72,153,0.05)', border: '1px solid rgba(236,72,153,0.15)', marginBottom: '0' }}>
                  <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginBottom: '12px', fontWeight: 500 }}>Déjanos tu email y te avisamos en el lanzamiento:</p>
                  <WaitlistForm product="eshop" />
                </div>
              </div>
            </FadeIn>
          </div>

          {/* Pricing */}
          <FadeIn>
            <div style={{ textAlign: 'center', marginBottom: '48px', paddingTop: '40px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>Planes Club Manager</h3>
              <p style={{ color: '#475569', fontSize: '0.9rem' }}>En pesos colombianos (COP). Sin costos ocultos.</p>
            </div>
          </FadeIn>
          <div className="pricing-grid" style={{ marginBottom: '48px' }}>
            {plans.map((plan, i) => (
              <FadeIn key={plan.name} delay={i * 0.08}>
                <div style={{ padding: '32px 24px', borderRadius: '20px', background: plan.highlight ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)', border: plan.highlight ? '2px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.06)', position: 'relative', display: 'flex', flexDirection: 'column', height: '100%' }}>
                  {plan.highlight && (
                    <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', color: '#fff', padding: '4px 16px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 800, whiteSpace: 'nowrap' }}>MÁS POPULAR</div>
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
                  <a href="http://club-manager.osdosoft.com" target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', padding: '11px', borderRadius: '10px', background: plan.highlight ? 'linear-gradient(135deg,#3b82f6,#8b5cf6)' : 'rgba(255,255,255,0.06)', color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>
                    Empezar
                  </a>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contact" className="section-padding" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="contact-grid">
            {/* Left: copy */}
            <FadeIn>
              <div>
                <div style={{ color: '#6366f1', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.12em', marginBottom: '16px' }}>CONTACTO</div>
                <h2 style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: '20px', lineHeight: 1.1 }}>
                  ¿Tienes una idea?{' '}
                  <span style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Hagámosla realidad.</span>
                </h2>
                <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.7, marginBottom: '40px' }}>
                  Cuéntanos tu proyecto. Respondemos en menos de 24 horas con una propuesta técnica sin compromiso.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {[
                    ['📧', 'Email', 'contacto@osdosoft.com', 'mailto:contacto@osdosoft.com'],
                    ['💬', 'WhatsApp', 'Chatea directo con el equipo', 'https://wa.me/57XXXXXXXXXX'],
                    ['📍', 'Ubicación', 'Colombia · Remote-first', null],
                  ].map(([icon, lbl, val, href]) => (
                    <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>{icon}</div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600, marginBottom: '2px' }}>{lbl}</div>
                        {href
                          ? <a href={href} style={{ color: '#cbd5e1', fontWeight: 500, fontSize: '0.9rem', textDecoration: 'none' }}>{val}</a>
                          : <span style={{ color: '#cbd5e1', fontWeight: 500, fontSize: '0.9rem' }}>{val}</span>
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

            {/* Right: form */}
            <FadeIn delay={0.15}>
              <div style={{ padding: '40px', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <ContactForm />
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer-container" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <LogoMark size={30} gradId="footerGrad" />
          <div>
            <div style={{ fontWeight: 900, fontSize: '0.85rem', letterSpacing: '0.08em' }}>OSDOSOFT</div>
            <div style={{ fontSize: '0.5rem', color: '#334155', fontWeight: 600, letterSpacing: '0.12em' }}>SOFTWARE FACTORY</div>
          </div>
        </div>
        <p style={{ color: '#334155', fontSize: '0.8rem' }}>© 2026 Osdosoft S.A.S. — Todos los derechos reservados.</p>
        <div style={{ display: 'flex', gap: '24px' }}>
          {[['Privacidad', '/privacidad'], ['Términos', '/terminos'], ['Contacto', '#contact']].map(([l, href]) => (
            <a key={l} href={href} style={{ color: '#334155', textDecoration: 'none', fontSize: '0.8rem' }}>{l}</a>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
