import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import {
  ArrowDownward,
  ArrowForward,
  ArrowOutward,
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
  Close,
} from "@mui/icons-material";
import "./LandingPage.css";

const IS_STATIC_SHOWCASE = import.meta.env.MODE === "pages";

const reveal = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

const LandingPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const updateNav = () => {
      const hero = document.querySelector(".hero-section");
      setScrolled(Boolean(hero && hero.getBoundingClientRect().bottom <= 84));
    };
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
          <span className="brand-mark" aria-hidden="true"><Favorite /></span>
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
          <WorkspaceLink
            className="nav-cta"
            onNavigate={onNavigate}
            staticContent={<>Explore <ArrowDownward fontSize="small" /></>}
          >
            Sign in <ArrowOutward fontSize="small" />
          </WorkspaceLink>
        </div>
      </nav>
    </header>
  );
}

function HeroSection() {
  const reduceMotion = useReducedMotion();
  const updateSpotlight = (event) => {
    if (reduceMotion || event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--pointer-x", `${event.clientX - bounds.left}px`);
    event.currentTarget.style.setProperty("--pointer-y", `${event.clientY - bounds.top}px`);
  };

  return (
    <section className="hero-section hero-cinematic" aria-labelledby="hero-title" onPointerMove={updateSpotlight}>
      <div className="hero-backdrop" aria-hidden="true"><div className="hero-spotlight" /><div className="hero-grid" /></div>
      <div className="hero-container">
        <motion.div className="hero-copy" initial={reduceMotion ? false : { opacity: 0, y: 36 }} animate={{ opacity: 1, y: 0 }} transition={reduceMotion ? { duration: 0 } : { duration: 1.15, ease: [0.22, 1, 0.36, 1] }}>
          <div className="hero-eyebrow"><span className="eyebrow-pulse" /> A new perspective on care</div>
          <motion.h1 id="hero-title" initial={reduceMotion ? false : { opacity: 0, y: 30, filter: "blur(12px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={reduceMotion ? { duration: 0 } : { delay: 0.2, duration: 1.3, ease: [0.22, 1, 0.36, 1] }}>
            Healthcare,<br /><em>in sync.</em>
          </motion.h1>
          <motion.p className="hero-description" initial={reduceMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={reduceMotion ? { duration: 0 } : { delay: 0.55, duration: 0.85 }}>
            A connected workspace for the people, decisions, and details that move care forward.
          </motion.p>
          <motion.div className="hero-actions" initial={reduceMotion ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={reduceMotion ? { duration: 0 } : { delay: 0.72, duration: 0.75 }}>
            <a className="button button-primary" href="#platform">Explore the platform <ArrowForward /></a>
            {!IS_STATIC_SHOWCASE && <Link className="button button-quiet" to="/login">Sign in <ArrowOutward /> </Link>}
          </motion.div>
          <div className="hero-footnote"><span className="hero-footnote-dot" /> A shared view for patients, care teams, and operations</div>
        </motion.div>
        <HeroConstellation reduceMotion={reduceMotion} />
      </div>
      <div className="hero-caption"><span>CARE, CONNECTED</span><span className="hero-caption-rule" /><span>PEOPLE AT THE CENTER</span><a href="#platform">Explore what connects it <ArrowDownward /></a></div>
    </section>
  );
}

function HeroConstellation({ reduceMotion }) {
  return (
    <motion.div className="hero-constellation" initial={reduceMotion ? false : { opacity: 0, scale: 0.88, rotate: -8 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={reduceMotion ? { duration: 0 } : { delay: 0.26, duration: 1.4, ease: [0.2, 0.75, 0.25, 1] }} aria-label="Illustration of connected care, clinical insight, and hospital operations">
      <div className="constellation-glow" />
      <div className="constellation-ring ring-outer" /><div className="constellation-ring ring-middle" /><div className="constellation-ring ring-inner" />
      <svg className="constellation-lines" viewBox="0 0 600 600" aria-hidden="true">
        <defs><linearGradient id="flowLine" x1="0" x2="1"><stop offset="0" stopColor="#7fffe0" stopOpacity="0" /><stop offset=".5" stopColor="#7fffe0" stopOpacity=".85" /><stop offset="1" stopColor="#b4ff8a" stopOpacity="0" /></linearGradient></defs>
        <path d="M78 324 C150 323 143 170 246 190 S389 407 519 256" />
        <path d="M105 464 C192 426 181 282 299 306 S408 151 500 140" />
        <path d="M103 158 C197 218 177 417 312 409 S408 254 501 457" />
      </svg>
      <div className="constellation-core"><span className="core-halo" /><span className="core-symbol"><Favorite /></span><span className="core-label">HEALTH<br />FORESIGHT</span></div>
      <div className="constellation-node node-care"><span className="node-symbol"><VolunteerActivism /></span><span className="node-copy"><b>Patient care</b><small>People, first</small></span><span className="node-live" /></div>
      <div className="constellation-node node-insight"><span className="node-symbol"><Insights /></span><span className="node-copy"><b>Clinical insight</b><small>Context, connected</small></span></div>
      <div className="constellation-node node-flow"><span className="node-symbol"><TrendingUp /></span><span className="node-copy"><b>Operations</b><small>Ready for what’s next</small></span></div>
      <div className="constellation-spark spark-one" /><div className="constellation-spark spark-two" /><div className="constellation-spark spark-three" />
      <div className="constellation-coordinate">HF—01 <span>CARE SYSTEM</span></div>
    </motion.div>
  );
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
        <a className="button button-light" href="#platform">Explore HealthForesight <ArrowForward /></a>
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
          <span className="brand-mark" aria-hidden="true"><Favorite /></span>
          <span className="brand-name">Health<span>Foresight</span></span>
        </Link>
        <p className="footer-tagline">A clearer view of care.</p>
        <div className="footer-links"><a href="https://github.com/Kubendra2004/HealthForesight" target="_blank" rel="noreferrer">GitHub <ArrowOutward /></a><a href="mailto:kubendra2004@gmail.com">Contact <ArrowOutward /></a>{!IS_STATIC_SHOWCASE && <Link to="/login">Sign in <ArrowOutward /></Link>}</div>
      </div>
      <div className="section-container footer-bottom"><span>© {new Date().getFullYear()} HealthForesight</span><span>Built for the people who care.</span></div>
    </footer>
  );
}

function WorkspaceLink({ className, children, staticContent, onNavigate }) {
  if (IS_STATIC_SHOWCASE) {
    return <a className={className} href="#platform" onClick={onNavigate}>{staticContent ?? children}</a>;
  }
  return <Link className={className} to="/login" onClick={onNavigate}>{children}</Link>;
}

export default LandingPage;
