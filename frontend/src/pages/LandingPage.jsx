import React, { useState, useEffect, useRef, useCallback } from 'react';
import './LandingPage.css';
import logoImg from '../assets/logo_v2_SC.png';

/* ─────────────────────── DATA ─────────────────────── */
const services = [
  { icon: '⚙️', title: 'Desarrollo Web', desc: 'SaaS y aplicaciones con React, Next.js y Python.' },
  { icon: '📱', title: 'Apps Móviles', desc: 'Experiencias nativas con Flutter y Swift.' },
  { icon: '☁️', title: 'Cloud & DevOps', desc: 'Infraestructura escalable en AWS y GCP.' },
  { icon: '🧠', title: 'IA & Datos', desc: 'Automatización inteligente y modelos predictivos.' },
];

const techs = ['React', 'Python', 'Node.js', 'Docker', 'PostgreSQL', 'AWS', 'Flutter', 'FastAPI', 'Next.js', 'Kubernetes'];

const products = [
  {
    badge: 'Disponible',
    title: 'Club Manager',
    desc: 'Gestión deportiva para academias y clubes. Control de atletas, pagos y asistencia.',
    link: 'http://club-manager.osdosoft.com',
    soon: false,
  },
  {
    badge: 'Disponible',
    title: 'E‑Shop',
    desc: 'Tienda virtual con catálogo dinámico e integración con WhatsApp.',
    link: 'http://e-shop.osdosoft.com',
    soon: false,
  },
  {
    badge: 'Próximamente',
    title: 'HR Automation',
    desc: 'Sistema de nómina con integración PILA Colombia y cálculo automático.',
    link: null,
    soon: true,
  },
];

const plans = [
  { name: 'Prueba Gratis', price: '0', period: '15 días', sub: 'Sin compromiso', trial: true, features: ['Atletas ilimitados', 'Categorías ilimitadas', 'Gestión de asistencia', 'Seguimiento de pagos', 'Reportes y estadísticas', 'Múltiples entrenadores', 'Soporte prioritario'] },
  { name: 'Básico Mensual', price: '120.000', period: 'mes', sub: 'Factura mensual', features: ['Atletas ilimitados', 'Categorías ilimitadas', 'Gestión de asistencia', 'Seguimiento de pagos', 'Reportes y estadísticas', 'Múltiples entrenadores', 'Soporte prioritario'] },
  { name: 'Básico Semestral', price: '600.000', period: '6 meses', sub: 'Ahorra 16%', features: ['Atletas ilimitados', 'Categorías ilimitadas', 'Gestión de asistencia', 'Seguimiento de pagos', 'Reportes y estadísticas', 'Múltiples entrenadores', 'Soporte prioritario'] },
  { name: 'Básico Anual', price: '1.080.000', period: 'año', sub: 'Ahorra 25%', recommended: true, features: ['Atletas ilimitados', 'Categorías ilimitadas', 'Gestión de asistencia', 'Seguimiento de pagos', 'Reportes y estadísticas', 'Múltiples entrenadores', 'Soporte prioritario'] },
];

const shopPlans = [
  { name: 'Starter', price: '0', period: '15 días', sub: 'Prueba gratuita', trial: true, features: ['Hasta 50 productos', 'Catálogo básico', 'Integración WhatsApp', 'Pedidos manuales', 'Soporte por email'] },
  { name: 'Profesional', price: '89.000', period: 'mes', sub: 'Factura mensual', features: ['Productos ilimitados', 'Catálogo dinámico', 'Integración WhatsApp', 'Panel de analytics', 'Soporte prioritario'] },
  { name: 'Profesional Anual', price: '890.000', period: 'año', sub: 'Ahorra 16%', recommended: true, features: ['Productos ilimitados', 'Catálogo dinámico', 'Integración WhatsApp', 'Panel de analytics', 'Soporte prioritario', 'Dominio personalizado'] },
];

const testimonios = [
  { stars: '★★★★★', quote: '"Club Manager revolucionó la administración de nuestra academia. Pasamos de planillas a un sistema en tiempo real."', author: 'Carlos Méndez', role: 'Director, Academia Deportiva Élite' },
  { stars: '★★★★★', quote: '"El equipo de Osdosoft entendió nuestras necesidades y construyó una plataforma escalable en tiempo récord."', author: 'Mariana Restrepo', role: 'CTO, Fintech Latam' },
  { stars: '★★★★★', quote: '"La precisión técnica y el diseño estratégico hicieron la diferencia. Nuestros usuarios aman la experiencia."', author: 'Andrés Herrera', role: 'CEO, HealthApp' },
];

/* ─────────────────────── HOOKS ─────────────────────── */
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

/* ─────────────────────── MAIN PAGE ─────────────────────── */
const LandingPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNavClick = useCallback((e) => {
    const href = e.currentTarget.getAttribute('href');
    if (href && href.startsWith('#')) {
      e.preventDefault();
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      setMenuOpen(false);
    }
  }, []);

  return (
    <div className="lp">
      {/* ─── HEADER ─── */}
      <header className="lp-header">
        <div className="lp-container lp-header-inner">
          <a href="#" className="lp-logo" onClick={handleNavClick}>
            <img
              src={logoImg}
              alt="Osdosoft"
              width={48}
              height={48}
              className="lp-logo-img"
            />
            <div className="lp-logo-text">
              <span className="lp-brand">Osdo<span>soft</span></span>
            </div>
          </a>
          <nav className={`lp-nav ${menuOpen ? 'lp-nav--open' : ''}`} id="lpNav">
            <a href="#nosotros" className="lp-nav-link" onClick={handleNavClick}>Nosotros</a>
            <a href="#servicios" className="lp-nav-link" onClick={handleNavClick}>Servicios</a>
            <a href="#tecnologia" className="lp-nav-link" onClick={handleNavClick}>Tecnología</a>
            <a href="#productos" className="lp-nav-link" onClick={handleNavClick}>Productos</a>
            <a href="#precios" className="lp-nav-link" onClick={handleNavClick}>Precios</a>
            <a href="#contacto" className="lp-nav-link lp-nav-cta" onClick={handleNavClick}>Hablemos</a>
          </nav>
          <button
            className="lp-mobile-toggle"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menú"
          >
            <span></span><span></span><span></span>
          </button>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="lp-hero">
        <div className="lp-container lp-hero-grid">
          <div className="lp-hero-text">
            <FadeIn>
              <span className="lp-section-label">✦ Software que impulsa tu negocio</span>
            </FadeIn>
            <FadeIn delay={0.1}>
              <h1 className="lp-hero-title">
                Diseño estratégico<br />
                <span className="lp-highlight">código robusto</span>
              </h1>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p className="lp-hero-sub">
                Construimos plataformas escalables y experiencias digitales que transforman tu operación.
              </p>
            </FadeIn>
            <FadeIn delay={0.3}>
              <div className="lp-hero-buttons">
                <a href="#contacto" className="lp-btn-primary" onClick={handleNavClick}>Impulsa tu proyecto</a>
                <a href="#productos" className="lp-btn-secondary" onClick={handleNavClick}>Ver productos</a>
              </div>
            </FadeIn>
          </div>
          <FadeIn delay={0.2}>
            <div className="lp-hero-visual">
              <div className="lp-hero-code">
                <div className="lp-dots">
                  <span className="lp-dot lp-dot--red"></span>
                  <span className="lp-dot lp-dot--yellow"></span>
                  <span className="lp-dot lp-dot--green"></span>
                </div>
                <div className="lp-line"><span className="lp-kw">import</span> <span className="lp-str">'@osdosoft/core'</span></div>
                <div className="lp-line"><span className="lp-kw">const</span> <span className="lp-fn">build</span> = <span className="lp-kw">async</span> () {'='}{'>'} {'{'}</div>
                <div className="lp-line">&nbsp;&nbsp;<span className="lp-cmt">// escalable · mantenible · seguro</span></div>
                <div className="lp-line">&nbsp;&nbsp;<span className="lp-kw">return</span> <span className="lp-fn">platform</span>.<span className="lp-fn">deploy</span>({'{'}</div>
                <div className="lp-line">&nbsp;&nbsp;&nbsp;&nbsp;stack: <span className="lp-str">'modern'</span>,</div>
                <div className="lp-line">&nbsp;&nbsp;&nbsp;&nbsp;ux: <span className="lp-kw">true</span></div>
                <div className="lp-line">&nbsp;&nbsp;{'}'})</div>
                <div className="lp-line">{'}'}</div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── NOSOTROS ─── */}
      <section id="nosotros" className="lp-section lp-section--white">
        <div className="lp-container">
          <div className="lp-text-center">
            <FadeIn>
              <span className="lp-section-label">Quiénes somos</span>
              <h2 className="lp-section-title">Construimos el futuro digital</h2>
              <p className="lp-section-subtitle lp-mx-auto">
                Somos un estudio de ingeniería de software comprometido con la excelencia técnica y el éxito de nuestros
                clientes.
              </p>
            </FadeIn>
          </div>
          <div className="lp-about-grid">
            <FadeIn delay={0.1}>
              <div className="lp-about-card">
                <h3><span className="lp-icon">🎯</span> Misión</h3>
                <p>
                  Desarrollar soluciones de software a medida que potencien la productividad y el crecimiento de nuestros
                  clientes, mediante arquitecturas robustas y diseño centrado en el usuario.
                </p>
              </div>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div className="lp-about-card">
                <h3><span className="lp-icon">🔭</span> Visión</h3>
                <p>
                  Ser reconocidos como el estudio de ingeniería de software de referencia en el Valle del Cauca Colombia por nuestra calidad
                  técnica, innovación y compromiso con el éxito del cliente.
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ─── SERVICIOS ─── */}
      <section id="servicios" className="lp-section">
        <div className="lp-container">
          <div className="lp-text-center">
            <FadeIn>
              <span className="lp-section-label">Qué hacemos</span>
              <h2 className="lp-section-title">Soluciones que potencian tu negocio</h2>
              <p className="lp-section-subtitle lp-mx-auto">
                Desde el MVP hasta la plataforma enterprise, con foco en resultados.
              </p>
            </FadeIn>
          </div>
          <div className="lp-services-grid">
            {services.map((s, i) => (
              <FadeIn key={s.title} delay={i * 0.08}>
                <div className="lp-service-card">
                  <span className="lp-service-icon">{s.icon}</span>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TECNOLOGÍA ─── */}
      <section id="tecnologia" className="lp-section lp-section--white">
        <div className="lp-container lp-text-center">
          <FadeIn>
            <span className="lp-section-label">Stack tecnológico</span>
            <h2 className="lp-section-title">Herramientas de vanguardia</h2>
            <p className="lp-section-subtitle lp-mx-auto">
              Elegimos tecnologías probadas, con gran ecosistema y rendimiento.
            </p>
          </FadeIn>
          <FadeIn delay={0.15}>
            <div className="lp-tech-grid">
              {techs.map((t) => (
                <span key={t} className="lp-tech-tag">{t}</span>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── PRODUCTOS ─── */}
      <section id="productos" className="lp-section">
        <div className="lp-container">
          <div className="lp-text-center">
            <FadeIn>
              <span className="lp-section-label">Portafolio</span>
              <h2 className="lp-section-title">Productos que resuelven</h2>
              <p className="lp-section-subtitle lp-mx-auto">
                Proyectos construidos con arquitectura sólida y experiencia de usuario.
              </p>
            </FadeIn>
          </div>
          <div className="lp-productos-grid">
            {products.map((p, i) => (
              <FadeIn key={p.title} delay={i * 0.1}>
                <div className="lp-product-card">
                  <span className={`lp-badge ${p.soon ? 'lp-badge--soon' : ''}`}>{p.badge}</span>
                  <h3>{p.title}</h3>
                  <p>{p.desc}</p>
                  {p.link ? (
                    <a href={p.link} className="lp-link" target="_blank" rel="noreferrer">Ver producto →</a>
                  ) : (
                    <span className="lp-link-disabled">Próximamente</span>
                  )}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRECIOS ─── */}
      <section id="precios" className="lp-section lp-section--white">
        <div className="lp-container">
          <div className="lp-text-center">
            <FadeIn>
              <span className="lp-section-label">Planes transparentes</span>
              <h2 className="lp-section-title">Elige el plan para tu club</h2>
              <p className="lp-section-subtitle lp-mx-auto">
                Club Manager · Prueba gratuita y opciones flexibles.
              </p>
            </FadeIn>
          </div>
          <div className="lp-pricing-grid">
            {plans.map((plan, i) => (
              <FadeIn key={plan.name} delay={i * 0.08}>
                <div className={`lp-pricing-card ${plan.recommended ? 'lp-pricing-card--recommended' : ''}`}>
                  {plan.recommended && <span className="lp-recommended-badge">Recomendado</span>}
                  {plan.trial && <span className="lp-recommended-badge lp-recommended-badge--trial">SIN COSTO</span>}
                  <div className="lp-plan-name">{plan.name}</div>
                  <div className="lp-price">${plan.price} <small>/{plan.period}</small></div>
                  <div className="lp-period">{plan.sub}</div>
                  <ul>
                    {plan.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  <a href="#contacto" className="lp-btn-outline" onClick={handleNavClick}>Contratar</a>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRECIOS E-SHOP ─── */}
      <section id="precios-shop" className="lp-section">
        <div className="lp-container">
          <div className="lp-text-center">
            <FadeIn>
              <span className="lp-section-label">E‑Shop · Planes flexibles</span>
              <h2 className="lp-section-title">Lleva tu tienda al siguiente nivel</h2>
              <p className="lp-section-subtitle lp-mx-auto">
                Comienza gratis y escala cuando lo necesites. Sin compromisos.
              </p>
            </FadeIn>
          </div>
          <div className="lp-pricing-grid">
            {shopPlans.map((plan, i) => (
              <FadeIn key={plan.name} delay={i * 0.08}>
                <div className={`lp-pricing-card ${plan.recommended ? 'lp-pricing-card--recommended' : ''}`}>
                  {plan.recommended && <span className="lp-recommended-badge">Recomendado</span>}
                  {plan.trial && <span className="lp-recommended-badge lp-recommended-badge--trial">GRATIS</span>}
                  <div className="lp-plan-name">{plan.name}</div>
                  <div className="lp-price">${plan.price} <small>/{plan.period}</small></div>
                  <div className="lp-period">{plan.sub}</div>
                  <ul>
                    {plan.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  <a href="#contacto" className="lp-btn-outline" onClick={handleNavClick}>Comenzar</a>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIOS ─── */}
      <section id="testimonios" className="lp-section">
        <div className="lp-container">
          <div className="lp-text-center">
            <FadeIn>
              <span className="lp-section-label">Testimonios</span>
              <h2 className="lp-section-title">Confianza de nuestros clientes</h2>
              <p className="lp-section-subtitle lp-mx-auto">
                Equipos que han potenciado su negocio con nuestro software.
              </p>
            </FadeIn>
          </div>
          <div className="lp-testimonios-grid">
            {testimonios.map((t, i) => (
              <FadeIn key={t.author} delay={i * 0.1}>
                <div className="lp-testimonio-card">
                  <div className="lp-stars">{t.stars}</div>
                  <blockquote>{t.quote}</blockquote>
                  <div className="lp-author">{t.author}</div>
                  <div className="lp-role">{t.role}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CONTACTO ─── */}
      <section id="contacto" className="lp-section lp-contacto">
        <div className="lp-container">
          <div className="lp-text-center">
            <FadeIn>
              <span className="lp-section-label lp-section-label--light">Hablemos</span>
              <h2 className="lp-section-title lp-section-title--light">Cuéntanos tu proyecto</h2>
              <p className="lp-section-subtitle lp-mx-auto lp-section-subtitle--light">
                Te responderemos en menos de 24 horas con una propuesta técnica.
              </p>
            </FadeIn>
          </div>
          <div className="lp-contact-grid">
            <FadeIn delay={0.1}>
              <div className="lp-contact-info">
                <h3>¿Tienes una idea en mente?</h3>
                <p>
                  Desde un MVP hasta una plataforma enterprise, estamos listos para acompañarte
                  con la mejor ingeniería y diseño estratégico.
                </p>
                <div className="lp-detail">📧 Contacto@osdosoft.com</div>
                <div className="lp-detail">📍 Guadalajara de Buga, Colombia</div>
                <div className="lp-detail">⚡ Respuesta en {'<'} 24h</div>
              </div>
            </FadeIn>
            <FadeIn delay={0.2}>
              <form className="lp-contact-form" onSubmit={(e) => e.preventDefault()}>
                <input type="text" placeholder="Nombre completo" required />
                <input type="email" placeholder="Correo electrónico" required />
                <input type="text" placeholder="Empresa / Proyecto" />
                <textarea placeholder="Cuéntanos más sobre tu proyecto..."></textarea>
                <button type="submit" className="lp-btn-primary">Enviar mensaje</button>
              </form>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-grid">
            <div className="lp-footer-brand">
              <a href="#" className="lp-logo" onClick={handleNavClick}>
                <img
                  src={logoImg}
                  alt="Osdosoft"
                  width={42}
                  height={42}
                  className="lp-footer-logo-img"
                />
                <div className="lp-logo-text">
                  <span className="lp-brand lp-brand--sm">Osdo<span>soft</span></span>
                </div>
              </a>
              <p>Estudio de ingeniería de software. Construimos soluciones que impulsan tu negocio.</p>
            </div>
            <div className="lp-footer-col">
              <h4>Servicios</h4>
              <a href="#servicios" onClick={handleNavClick}>Desarrollo Web</a>
              <a href="#servicios" onClick={handleNavClick}>Apps Móviles</a>
              <a href="#servicios" onClick={handleNavClick}>Cloud & DevOps</a>
              <a href="#servicios" onClick={handleNavClick}>IA & Datos</a>
            </div>
            <div className="lp-footer-col">
              <h4>Productos</h4>
              <a href="#productos" onClick={handleNavClick}>Club Manager</a>
              <a href="#productos" onClick={handleNavClick}>E‑Shop</a>
              <a href="#productos" onClick={handleNavClick}>HR Automation</a>
            </div>
            <div className="lp-footer-col">
              <h4>Compañía</h4>
              <a href="#nosotros" onClick={handleNavClick}>Nosotros</a>
              <a href="#contacto" onClick={handleNavClick}>Contacto</a>
              <a href="#">Política de privacidad</a>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <span>© 2026 Osdosoft S.A.S. — Todos los derechos reservados.</span>
            <span>Hecho con ⚡ en Colombia</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;