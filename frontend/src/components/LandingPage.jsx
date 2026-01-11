import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useNavigate } from 'react-router-dom';
import {
  Psychology,
  MonitorHeart,
  LocalHospital,
  Analytics,
  ChatBubble,
  Security,
  Speed,
  CloudDone,
  ArrowForward,
  Favorite,
  Timeline,
  AutoAwesome,
  GitHub,
  Email
} from '@mui/icons-material';
import './LandingPage.css';

const LandingPage = () => {
  const [particles, setParticles] = useState([]);

  // Generate particles on mount
  useEffect(() => {
    const particleArray = [];
    for (let i = 0; i < 50; i++) {
      particleArray.push({
        id: i,
        left: Math.random() * 100 + '%',
        animationDelay: Math.random() * 20 + 's',
        animationDuration: (Math.random() * 10 + 10) + 's'
      });
    }
    setParticles(particleArray);
  }, []);

  return (
    <div className="landing-page">
      {/* Animated Background */}
      <div className="animated-gradient-bg"></div>
      
      {/* Floating Particles */}
      <div className="particles">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: particle.left,
              animationDelay: particle.animationDelay,
              animationDuration: particle.animationDuration
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* AI Capabilities Section */}
      <AICapabilitiesSection />

      {/* About Section */}
      <AboutSection />

      {/* CTA Section */}
      <CTASection />

      {/* Contact Section */}
      <ContactSection />
    </div>
  );
};

// Navigation Component
const Navigation = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      className={`navbar ${scrolled ? 'scrolled' : ''}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container">
        <div className="nav-content">
          <div className="logo">
            <Favorite className="logo-icon" />
            <span className="gradient-text">HealthForesight</span>
          </div>
          <div className="nav-links">
            <a href="#features" onClick={(e) => scrollToSection(e, 'features')}>Features</a>
            <a href="#ai" onClick={(e) => scrollToSection(e, 'ai')}>AI Capabilities</a>
            <a href="#about" onClick={(e) => scrollToSection(e, 'about')}>About</a>
            <button className="btn btn-primary" onClick={() => window.location.href = '/login'}>Get Started</button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

// Hero Section
const HeroSection = () => {
  return (
    <section className="hero-section">
      <div className="container">
        <div className="hero-content">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="hero-badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <AutoAwesome style={{ fontSize: '1rem' }} />
              <span>AI-Powered Healthcare</span>
            </motion.div>

            <h1 className="hero-title">
              The Future of
              <br />
              <span className="gradient-text">Healthcare Management</span>
            </h1>

            <p className="hero-subtitle">
              Harness the power of artificial intelligence and machine learning
              for predictive healthcare analytics, resource forecasting, and
              intelligent patient care.
            </p>

            <div className="hero-buttons">
              <button className="btn btn-primary" onClick={() => window.location.href = '/login'}>
                Start Your Journey
                <ArrowForward />
              </button>
            </div>
          </motion.div>

          {/* Floating Hero Cards */}
          <div className="hero-cards">
            <FloatingCard delay={0.5} />
            <FloatingCard delay={0.7} />
            <FloatingCard delay={0.9} />
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="scroll-indicator"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <div className="scroll-line"></div>
      </motion.div>
    </section>
  );
};

// Floating Card for Hero
const FloatingCard = ({ delay }) => {
  return (
    <motion.div
      className="floating-card glass-card"
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.8 }}
      whileHover={{ scale: 1.05, rotate: 2 }}
    >
      <MonitorHeart style={{ fontSize: '2rem', color: '#667eea' }} />
      <div className="card-pulse"></div>
    </motion.div>
  );
};

// Features Section
const FeaturesSection = () => {
  const [ref, inView] = useInView({ threshold: 0.2, triggerOnce: true });

  const features = [
    {
      icon: <Psychology />,
      title: 'AI-Powered Diagnosis',
      description: 'Machine learning models for heart disease and diabetes prediction with 95%+ accuracy',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      icon: <Timeline />,
      title: 'Resource Forecasting',
      description: 'Prophet-based forecasting for optimal bed, ICU, and oxygen resource allocation',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      icon: <ChatBubble />,
      title: 'Intelligent Chatbot',
      description: 'RAG-powered medical assistant for instant answers to healthcare queries',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
      icon: <Analytics />,
      title: 'Advanced Analytics',
      description: 'Real-time dashboards and insights for data-driven decision making',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    },
    {
      icon: <Security />,
      title: 'HIPAA Compliant',
      description: 'End-to-end encryption and comprehensive audit logging for security',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    },
    {
      icon: <CloudDone />,
      title: 'Cloud-Based',
      description: 'Scalable infrastructure with 99.9% uptime and automatic backups',
      gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
    }
  ];

  return (
    <section id="features" className="features-section" ref={ref}>
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2>Powerful Features</h2>
          <p>Everything you need for modern healthcare management</p>
        </motion.div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              feature={feature}
              index={index}
              inView={inView}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

// Feature Card Component
const FeatureCard = ({ feature, index, inView }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      className="feature-card glass-card glow-effect"
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ y: -10 }}
    >
      <motion.div
        className="feature-icon"
        style={{ background: feature.gradient }}
        animate={hovered ? { scale: 1.1, rotate: 360 } : { scale: 1, rotate: 0 }}
        transition={{ duration: 0.5 }}
      >
        {feature.icon}
      </motion.div>
      <h3>{feature.title}</h3>
      <p>{feature.description}</p>
      
      <motion.div
        className="feature-arrow"
        animate={hovered ? { x: 5 } : { x: 0 }}
      >
        <ArrowForward />
      </motion.div>
    </motion.div>
  );
};

// AI Capabilities Section
const AICapabilitiesSection = () => {
  const [ref, inView] = useInView({ threshold: 0.2, triggerOnce: true });

  const capabilities = [
    {
      title: 'Heart Disease Prediction',
      description: 'Advanced LightGBM model analyzing 13+ clinical parameters',
      accuracy: '96%',
      icon: <MonitorHeart />
    },
    {
      title: 'Diabetes Risk Assessment',
      description: 'Multi-factor analysis for early diabetes detection',
      accuracy: '94%',
      icon: <LocalHospital />
    },
    {
      title: 'Resource Optimization',
      description: 'Prophet-based forecasting for hospital resource planning',
      accuracy: '92%',
      icon: <Speed />
    }
  ];

  return (
    <section id="ai" className="ai-section" ref={ref}>
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
        >
          <h2>
            <span className="gradient-text">AI-Powered</span> Medical Intelligence
          </h2>
          <p>State-of-the-art machine learning models at your fingertips</p>
        </motion.div>

        <div className="ai-grid">
          {capabilities.map((capability, index) => (
            <motion.div
              key={index}
              className="ai-card glass-card"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: index * 0.2, duration: 0.5 }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="ai-card-icon">
                {capability.icon}
              </div>
              <h3>{capability.title}</h3>
              <p>{capability.description}</p>
              <div className="accuracy-bar">
                <div className="accuracy-label">Accuracy</div>
                <div className="accuracy-progress">
                  <motion.div
                    className="accuracy-fill"
                    initial={{ width: 0 }}
                    animate={inView ? { width: capability.accuracy } : {}}
                    transition={{ delay: index * 0.2 + 0.5, duration: 1 }}
                  >
                    <span>{capability.accuracy}</span>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Smooth scroll helper
const scrollToSection = (e, sectionId) => {
  e.preventDefault();
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

// About Section
const AboutSection = () => {
  const [ref, inView] = useInView({ threshold: 0.2, triggerOnce: true });

  return (
    <section id="about" className="about-section" ref={ref}>
      <div className="container">
        <motion.div
          className="about-content"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="about-text">
            <h2>About HealthForesight</h2>
            <p>
              HealthForesight is a cutting-edge healthcare management platform that leverages
              artificial intelligence and machine learning to revolutionize patient care and
              hospital operations.
            </p>
            <p>
              Our mission is to empower healthcare providers with predictive analytics,
              intelligent decision support, and streamlined workflows. By combining advanced
              ML models with an intuitive interface, we help medical professionals make
              data-driven decisions that improve patient outcomes.
            </p>
            <p>
              Founded by a team of AI & ML experts, HealthForesight
              brings together the best of modern technology. We're
              committed to HIPAA compliance, data security, and delivering measurable
              improvements in healthcare delivery.
            </p>
          </div>
          <div className="about-highlights">
            <div className="highlight-item glass-card">
              <LocalHospital style={{ fontSize: '3rem', color: '#2563eb' }} />
              <h3>Patient-Centered</h3>
              <p>Every feature designed with patient outcomes in mind</p>
            </div>
            <div className="highlight-item glass-card">
              <Security style={{ fontSize: '3rem', color: '#10b981' }} />
              <h3>Secure & Compliant</h3>
              <p>HIPAA-compliant with enterprise-grade security</p>
            </div>
            <div className="highlight-item glass-card">
              <Psychology style={{ fontSize: '3rem', color: '#0ea5e9' }} />
              <h3>AI-Powered</h3>
              <p>State-of-the-art machine learning models</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};





// CTA Section
const CTASection = () => {
  const [ref, inView] = useInView({ threshold: 0.5, triggerOnce: true });

  return (
    <section className="cta-section" ref={ref}>
      <motion.div
        className="container"
        initial={{ opacity: 0, y: 50 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
      >
        <div className="cta-card glass-card">
          <h2>Ready to Transform Healthcare?</h2>
          <p>Join thousands of healthcare professionals using AI to improve patient outcomes</p>
          <div className="cta-buttons">
            <button className="btn btn-primary" onClick={() => window.location.href = '/login'}>
              Get Started Free
              <ArrowForward />
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

// Contact Section
const ContactSection = () => {
  const [ref, inView] = useInView({ threshold: 0.2, triggerOnce: true });

  return (
    <section id="contact" className="contact-section" ref={ref} style={{ padding: '5rem 0' }}>
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2>Contact Us</h2>
          <p>Get in touch with us</p>
        </motion.div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '3rem', flexWrap: 'wrap' }}>
          <motion.a 
            href="https://github.com/Kubendra2004" 
            target="_blank"
            rel="noopener noreferrer"
            className="glass-card"
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.5 }}
            whileHover={{ scale: 1.05, y: -5 }}
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              padding: '2rem', 
              textDecoration: 'none', 
              color: 'inherit',
              minWidth: '200px'
            }}
          >
            <GitHub style={{ fontSize: '3rem', marginBottom: '1rem' }} />
            <h3>GitHub</h3>
            <p style={{ margin: 0, opacity: 0.8 }}>Kubendra2004</p>
          </motion.a>

          <motion.a 
            href="mailto:kubendra2004@gmail.com" 
            className="glass-card"
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.4, duration: 0.5 }}
            whileHover={{ scale: 1.05, y: -5 }}
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              padding: '2rem', 
              textDecoration: 'none', 
              color: 'inherit',
              minWidth: '200px'
            }}
          >
            <Email style={{ fontSize: '3rem', marginBottom: '1rem' }} />
            <h3>Email</h3>
            <p style={{ margin: 0, opacity: 0.8 }}>kubendra2004@gmail.com</p>
          </motion.a>
        </div>
      </div>
    </section>
  );
};

// Footer



export default LandingPage;
