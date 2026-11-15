import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import {
  ArrowDownward,
  ArrowForward,
  ArrowOutward,
  AutoAwesome,
  Favorite,
  Hub,
  Insights,
  Menu,
  MonitorHeart,
  ShieldOutlined,
  SmartToy,
  Today,
  TrendingUp,
  VolunteerActivism,
  WaterDrop,
  Close,
} from "@mui/icons-material";
import "./LandingPage.css";

const reveal = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

const LandingPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const updateNav = () => setScrolled(window.scrollY > 20);
    updateNav();
    window.addEventListener("scroll", updateNav, { passive: true });
    return () => window.removeEventListener("scroll", updateNav);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <main className="landing-page">
      <Navigation
        scrolled={scrolled}
        menuOpen={menuOpen}
        onToggle={() => setMenuOpen((open) => !open)}
        onNavigate={closeMenu}
      />
      <HeroSection />
      <PlatformSection />
      <IntelligenceSection />
      <PrinciplesSection />
      <ContactSection />
      <Footer />
    </main>
  );
};

function Navigation({ scrolled, menuOpen, onToggle, onNavigate }) {
  return (
    <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
      <nav className="site-nav" aria-label="Main navigation">
        <Link className="brand" to="/" onClick={onNavigate} aria-label="HealthForesight home">
          <span className="brand-mark"><img src={`${import.meta.env.BASE_URL}HealthForesight.png`} alt="" /></span>
          <span className="brand-name">Health<span>Foresight</span></span>
        </Link>

        <button
          className="mobile-menu-toggle"
          type="button"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
          onClick={onToggle}
        >
          {menuOpen ? <Close /> : <Menu />}
        </button>

        <div className={`nav-panel ${menuOpen ? "is-open" : ""}`}>
          <div className="nav-links">
            <a href="#platform" onClick={onNavigate}>Platform</a>
            <a href="#intelligence" onClick={onNavigate}>Intelligence</a>
            <a href="#approach" onClick={onNavigate}>Our approach</a>
          </div>
          <Link className="nav-cta" to="/login" onClick={onNavigate}>
            Sign in <ArrowOutward fontSize="small" />
          </Link>
        </div>
      </nav>
    </header>
  );
}

function HeroSection() {
  const reduceMotion = useReducedMotion();
  const transition = reduceMotion ? { duration: 0 } : { duration: 0.75, ease: [0.22, 1, 0.36, 1] };

  return (
    <section className="hero-section" aria-labelledby="hero-title">
      <div className="hero-backdrop" aria-hidden="true">
        <div className="hero-orb hero-orb-one" />
        <div className="hero-orb hero-orb-two" />
        <div className="hero-grid" />
      </div>
      <div className="hero-container">
        <motion.div
          className="hero-copy"
          initial={reduceMotion ? false : "hidden"}
          animate="visible"
          variants={reveal}
          transition={transition}
        >
          <div className="hero-eyebrow"><span className="eyebrow-pulse" /> A clearer view of care</div>
          <h1 id="hero-title">Better care starts with <span>a better view.</span></h1>
          <p className="hero-description">
            Bring patient care, clinical workflows, and hospital operations into one thoughtful workspace—built to help teams see what matters and act with confidence.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" to="/login">
              Enter your workspace <ArrowForward />
            </Link>
            <a className="button button-quiet" href="#platform">
              Discover the platform <ArrowDownward />
            </a>
          </div>
          <div className="hero-note"><ShieldOutlined /> Designed around responsible, human-led care</div>
        </motion.div>

        <motion.div
          className="hero-visual-wrap"
          initial={reduceMotion ? false : { opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={reduceMotion ? { duration: 0 } : { delay: 0.18, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <ProductPreview />
        </motion.div>
      </div>
      <a className="hero-scroll" href="#platform" aria-label="Scroll to platform overview">
        <span /> Scroll to explore
      </a>
    </section>
  );
}

function ProductPreview() {
  return (
    <div className="preview-stage" aria-label="Illustrative HealthForesight interface preview">
      <div className="preview-halo" />
      <div className="preview-window">
        <div className="preview-topbar">
          <div className="window-dots" aria-hidden="true"><i /><i /><i /></div>
          <span className="preview-breadcrumb">HealthForesight <b>/</b> Overview</span>
          <span className="preview-avatar">H</span>
        </div>
        <div className="preview-body">
          <aside className="preview-sidebar" aria-hidden="true">
            <span className="sidebar-logo"><Favorite /></span>
            <span className="sidebar-item active"><Hub /></span>
            <span className="sidebar-item"><Today /></span>
            <span className="sidebar-item"><MonitorHeart /></span>
            <span className="sidebar-item"><Insights /></span>
          </aside>
          <div className="preview-content">
            <div className="preview-heading">
              <div><span className="preview-kicker">YOUR CARE WORKSPACE</span><h2>Good morning.</h2></div>
              <span className="preview-date"><Today /> Today</span>
            </div>
            <div className="preview-summary-grid">
              <PreviewTile icon={<VolunteerActivism />} label="Patient care" color="mint" />
              <PreviewTile icon={<MonitorHeart />} label="Clinical insights" color="blue" />
              <PreviewTile icon={<TrendingUp />} label="Operations" color="violet" />
            </div>
            <div className="preview-lower-grid">
              <div className="preview-chart-card">
                <div className="chart-card-heading"><div><span>CARE IN FOCUS</span><strong>Connected care, at a glance</strong></div><span className="chart-status"><i /> Overview</span></div>
                <div className="chart-area" aria-hidden="true">
                  <div className="chart-lines"><i /><i /><i /><i /></div>
                  <svg viewBox="0 0 560 150" preserveAspectRatio="none" role="presentation">
                    <defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#4de0c1" stopOpacity=".28" /><stop offset="1" stopColor="#4de0c1" stopOpacity="0" /></linearGradient></defs>
                    <path className="chart-fill" d="M0 112 C35 108 42 64 82 74 S127 104 166 86 S220 40 258 57 S302 101 344 76 S396 32 431 52 S479 75 510 42 S544 45 560 20 V150 H0Z" />
                    <path className="chart-stroke" d="M0 112 C35 108 42 64 82 74 S127 104 166 86 S220 40 258 57 S302 101 344 76 S396 32 431 52 S479 75 510 42 S544 45 560 20" />
                  </svg>
                </div>
                <div className="chart-footnote"><span>Patient-centered</span><span>Connected workflows</span><span>Human-led decisions</span></div>
              </div>
              <div className="preview-side-card">
                <span className="side-card-icon"><AutoAwesome /></span>
                <span className="side-card-label">A more connected view</span>
                <p>Make room for better conversations and more confident coordination.</p>
                <span className="side-card-link">Explore the platform <ArrowForward /></span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="preview-float preview-float-top"><span className="float-icon float-mint"><Favorite /></span><span><b>Care, connected</b><small>People at the center</small></span><span className="float-spark">✳</span></div>
      <div className="preview-float preview-float-bottom"><span className="float-icon float-blue"><WaterDrop /></span><span><b>One thoughtful workspace</b><small>Care · insight · operations</small></span></div>
      <p className="preview-caption">A platform preview · illustrative interface</p>
    </div>
  );
}

function PreviewTile({ icon, label, color }) {
  return <div className="preview-tile"><span className={`tile-icon ${color}`}>{icon}</span><span>{label}</span><ArrowOutward className="tile-arrow" /></div>;
}

const platformItems = [
  {
    number: "01",
    icon: <VolunteerActivism />,
    title: "Patient experience",
    copy: "Appointments, records, and patient communication come together in a calmer, more accessible experience.",
    tint: "mint",
  },
  {
    number: "02",
    icon: <MonitorHeart />,
    title: "Clinical workspace",
    copy: "Give care teams a focused place for patient context, appointments, and everyday clinical workflows.",
    tint: "blue",
  },
  {
    number: "03",
    icon: <Insights />,
    title: "Hospital operations",
    copy: "Bring resource visibility and operational planning into the same connected system.",
    tint: "violet",
  },
];

function PlatformSection() {
  const [ref, inView] = useInView({ threshold: 0.14, triggerOnce: true });
  return (
    <section id="platform" className="platform-section section-light" ref={ref}>
      <div className="section-container">
        <motion.div className="section-intro" initial="hidden" animate={inView ? "visible" : "hidden"} variants={reveal}>
          <span className="section-eyebrow">ONE PLATFORM, MANY PERSPECTIVES</span>
          <h2>Every part of care.<br /><span>Moving in the same direction.</span></h2>
          <p>Purpose-built spaces for the people who make healthcare work—connected through a shared view of the patient journey.</p>
        </motion.div>
        <div className="platform-grid">
          {platformItems.map((item, index) => (
            <motion.article
              className={`platform-card ${item.tint}`}
              key={item.number}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              variants={reveal}
              transition={{ delay: index * 0.12, duration: 0.6 }}
            >
              <div className="platform-card-top"><span className={`platform-icon ${item.tint}`}>{item.icon}</span><span className="platform-number">{item.number}</span></div>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
              <span className="platform-card-line" />
            </motion.article>
          ))}
        </div>
        <div className="platform-ribbon"><span className="ribbon-mark"><Hub /></span><p>One connected experience, shaped around <strong>real people and real workflows.</strong></p><span className="ribbon-orbit" aria-hidden="true" /></div>
      </div>
    </section>
  );
}

function IntelligenceSection() {
  const [ref, inView] = useInView({ threshold: 0.12, triggerOnce: true });
  return (
    <section id="intelligence" className="intelligence-section" ref={ref}>
      <div className="intelligence-glow" aria-hidden="true" />
      <div className="section-container intelligence-layout">
        <motion.div className="intelligence-visual" initial="hidden" animate={inView ? "visible" : "hidden"} variants={reveal}>
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="intelligence-core"><span className="core-icon"><SmartToy /></span><span>Human-led<br />intelligence</span></div>
          <div className="orbit-node node-one"><Insights /></div>
          <div className="orbit-node node-two"><MonitorHeart /></div>
          <div className="orbit-node node-three"><Today /></div>
          <span className="intelligence-visual-caption">Care context <i /> thoughtful insight <i /> next step</span>
        </motion.div>
        <motion.div className="intelligence-copy" initial="hidden" animate={inView ? "visible" : "hidden"} variants={reveal} transition={{ delay: 0.1, duration: 0.6 }}>
          <span className="section-eyebrow">TECHNOLOGY WITH PERSPECTIVE</span>
          <h2>Insight is powerful.<br /><span>Context makes it useful.</span></h2>
          <p>Explore healthcare data and operational patterns with tools designed to support people—not replace their judgment.</p>
          <div className="capability-list">
            <div className="capability-item"><span><Insights /></span><p><strong>Understand patterns</strong><small>Explore analytics across care and operations.</small></p><ArrowForward /></div>
            <div className="capability-item"><span><TrendingUp /></span><p><strong>Plan with foresight</strong><small>Use resource forecasts to inform planning.</small></p><ArrowForward /></div>
            <div className="capability-item"><span><SmartToy /></span><p><strong>Ask better questions</strong><small>Find helpful context through the assistant.</small></p><ArrowForward /></div>
          </div>
          <p className="clinical-note"><ShieldOutlined /> Predictive model outputs are exploratory, informational, and not clinically validated. They are not a diagnosis or a substitute for professional judgment.</p>
        </motion.div>
      </div>
    </section>
  );
}

function PrinciplesSection() {
  const [ref, inView] = useInView({ threshold: 0.2, triggerOnce: true });
  return (
    <section id="approach" className="principles-section section-light" ref={ref}>
      <motion.div className="principles-card" initial="hidden" animate={inView ? "visible" : "hidden"} variants={reveal}>
        <div className="principles-mark"><Favorite /></div>
        <div className="principles-copy"><span className="section-eyebrow">OUR NORTH STAR</span><h2>Technology should make care feel more human.</h2><p>HealthForesight brings the details into view so care teams can spend less energy navigating systems and more energy focused on people.</p></div>
        <div className="principles-side"><div><span>Thoughtful by design</span><i>01</i></div><div><span>Connected by default</span><i>02</i></div><div><span>Human at the center</span><i>03</i></div></div>
      </motion.div>
    </section>
  );
}

function ContactSection() {
  return (
    <section className="contact-section">
      <div className="contact-glow" aria-hidden="true" />
      <div className="section-container contact-content">
        <span className="section-eyebrow">A BETTER VIEW STARTS HERE</span>
        <h2>Make space for<br /><span>better care.</span></h2>
        <p>Step into a more connected healthcare workspace.</p>
        <Link className="button button-light" to="/login">Explore HealthForesight <ArrowForward /></Link>
      </div>
      <div className="contact-decoration" aria-hidden="true"><div /><div /><div /></div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="section-container footer-main">
        <Link className="brand footer-brand" to="/">
          <span className="brand-mark"><img src={`${import.meta.env.BASE_URL}HealthForesight.png`} alt="" /></span>
          <span className="brand-name">Health<span>Foresight</span></span>
        </Link>
        <p className="footer-tagline">A clearer view of care.</p>
        <div className="footer-links"><a href="https://github.com/Kubendra2004/HealthForesight" target="_blank" rel="noreferrer">GitHub <ArrowOutward /></a><a href="mailto:kubendra2004@gmail.com">Contact <ArrowOutward /></a><Link to="/login">Sign in <ArrowOutward /></Link></div>
      </div>
      <div className="section-container footer-bottom"><span>© {new Date().getFullYear()} HealthForesight</span><span>Built for the people who care.</span></div>
    </footer>
  );
}

export default LandingPage;
