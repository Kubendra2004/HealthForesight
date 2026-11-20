import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarMonthRounded,
  MicRounded,
  MonitorHeartRounded,
  DescriptionRounded,
  EmergencyRounded,
  PhoneRounded,
  AccessTimeRounded,
  ChevronRightRounded,
  MenuRounded,
  CloseRounded,
  LocationOnRounded,
  ShieldRounded,
  CheckCircleRounded,
  LocalHospitalRounded,
  EventAvailableRounded,
  GroupsRounded,
  TranslateRounded,
  TextIncreaseRounded,
} from "@mui/icons-material";
import { API_BASE_URL, authHeaders } from "../lib/api";
import "./LandingPage.css";

const departments = [
  ["Cardiology", "Heart care", "Heart health and cardiac support"],
  ["General Medicine", "Primary care", "Everyday health and ongoing concerns"],
  ["Endocrinology", "Diabetes care", "Blood sugar and hormone support"],
  ["Pulmonology", "Lung care", "Breathing and respiratory care"],
  ["Neurology", "Brain care", "Nervous system and headache care"],
  ["Orthopaedics", "Bone care", "Joint, bone and mobility care"],
];

function Brand() {
  return (
    <Link className="hospital-brand" to="/" aria-label="HealthForesight home">
      <span className="hospital-brand-mark" aria-hidden="true"><LocalHospitalRounded /></span>
      <span><strong>Health</strong><b>Foresight</b></span>
    </Link>
  );
}

function HospitalIllustration() {
  return (
    <svg className="hospital-illustration" viewBox="0 0 620 430" role="img" aria-label="Illustration of a welcoming hospital building and care team">
      <defs>
        <clipPath id="sky"><rect x="0" y="0" width="620" height="430" rx="28" /></clipPath>
      </defs>
      <g clipPath="url(#sky)">
        <rect width="620" height="430" fill="#edf6fb" />
        <circle cx="520" cy="82" r="46" fill="#dff3ef" />
        <path d="M0 340C130 300 240 350 350 318C455 287 548 308 620 280V430H0Z" fill="#dcecf4" />
        <rect x="142" y="140" width="336" height="210" rx="14" fill="#fff" stroke="#b8d1e2" strokeWidth="3" />
        <rect x="212" y="82" width="196" height="268" rx="12" fill="#fff" stroke="#b8d1e2" strokeWidth="3" />
        <rect x="287" y="54" width="46" height="46" rx="9" fill="#1769aa" />
        <path d="M304 67V87M294 77H314" stroke="#fff" strokeWidth="7" strokeLinecap="round" />
        <path d="M212 128H408M212 166H408M212 204H408M212 242H408M212 280H408" stroke="#e5eef5" strokeWidth="3" />
        {[240,278,316,354,392].map((x) => (
          <g key={x}>
            <rect x={x} y="108" width="25" height="38" rx="4" fill="#d9ecf8" />
            <rect x={x} y="146" width="25" height="38" rx="4" fill="#d9ecf8" />
            <rect x={x} y="184" width="25" height="38" rx="4" fill="#d9ecf8" />
          </g>
        ))}
        <rect x="278" y="300" width="64" height="50" rx="6" fill="#1769aa" />
        <rect x="292" y="312" width="36" height="38" rx="18" fill="#edf6fb" />
        <circle cx="115" cy="318" r="32" fill="#dff3ef" />
        <circle cx="115" cy="308" r="13" fill="#f2c9ad" />
        <path d="M88 350C91 329 138 329 142 350V360H88Z" fill="#12a594" />
        <circle cx="502" cy="318" r="32" fill="#d9ecf8" />
        <circle cx="502" cy="308" r="13" fill="#dba58a" />
        <path d="M475 350C478 329 525 329 529 350V360H475Z" fill="#1769aa" />
      </g>
    </svg>
  );
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [doctorLoading, setDoctorLoading] = useState(true);
  const [search, setSearch] = useState({ department: "", doctor: "", symptom: "" });

  useEffect(() => {
    document.documentElement.style.fontSize = largeText ? "18px" : "";
  }, [largeText]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/auth/users?role=doctor`, { headers: authHeaders() })
      .then((response) => response.ok ? response.json() : [])
      .then((data) => setDoctors(Array.isArray(data) ? data.slice(0, 3) : []))
      .catch(() => setDoctors([]))
      .finally(() => setDoctorLoading(false));
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="hospital-site">
      <div className="utility-bar">
        <div className="utility-inner">
          <div className="utility-links">
            <span><EmergencyRounded /> Emergency: <b>Number placeholder</b></span>
            <span><AccessTimeRounded /> Working hours: 24/7</span>
          </div>
          <div className="utility-actions">
            <button type="button" aria-label="Change language"><TranslateRounded /> English</button>
            <button type="button" aria-pressed={largeText} onClick={() => setLargeText((value) => !value)} aria-label="Toggle larger text">
              <TextIncreaseRounded /> Text size
            </button>
          </div>
        </div>
      </div>

      <header className="hospital-header">
        <nav className="hospital-nav" aria-label="Main navigation">
          <Brand />
          <button className="mobile-nav-toggle" type="button" aria-expanded={menuOpen} aria-label={menuOpen ? "Close navigation" : "Open navigation"} onClick={() => setMenuOpen((value) => !value)}>
            {menuOpen ? <CloseRounded /> : <MenuRounded />}
          </button>
          <div className={`hospital-nav-links ${menuOpen ? "is-open" : ""}`}>
            <a href="#departments" onClick={closeMenu}>Departments</a>
            <a href="#doctors" onClick={closeMenu}>Doctors</a>
            <a href="#services" onClick={closeMenu}>Services</a>
            <Link to="/login" onClick={closeMenu}>Patient portal</Link>
            <a href="#about" onClick={closeMenu}>About</a>
            <a href="#contact" onClick={closeMenu}>Contact</a>
          </div>
          <div className="hospital-nav-actions">
            <Link className="nav-login" to="/login">Login</Link>
            <Link className="nav-book" to="/login">Book appointment</Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="hospital-hero" aria-labelledby="hospital-hero-title">
          <div className="hospital-container hero-grid">
            <div className="hero-copy">
              <span className="hero-kicker"><CheckCircleRounded /> Patient care, made simpler</span>
              <h1 id="hospital-hero-title">Trusted care for every stage of life.</h1>
              <p>Find the right care, book a visit, and stay connected with your hospital team.</p>
              <div className="hero-buttons">
                <Link className="hospital-button primary" to="/login"><CalendarMonthRounded /> Book an appointment</Link>
                <Link className="hospital-button secondary" to="/login">Patient portal <ChevronRightRounded /></Link>
              </div>
              <form className="quick-search" onSubmit={(event) => event.preventDefault()}>
                <label>
                  <span>Department</span>
                  <select value={search.department} onChange={(event) => setSearch((value) => ({ ...value, department: event.target.value }))}>
                    <option value="">Choose department</option>
                    {departments.map(([name]) => <option key={name}>{name}</option>)}
                  </select>
                </label>
                <label>
                  <span>Doctor</span>
                  <input value={search.doctor} onChange={(event) => setSearch((value) => ({ ...value, doctor: event.target.value }))} placeholder="Name" />
                </label>
                <label>
                  <span>Symptom</span>
                  <input value={search.symptom} onChange={(event) => setSearch((value) => ({ ...value, symptom: event.target.value }))} placeholder="What are you feeling?" />
                </label>
                <button type="submit" aria-label="Search care"><ChevronRightRounded /></button>
              </form>
            </div>
            <HospitalIllustration />
          </div>
        </section>

        <section className="quick-actions" aria-label="Quick actions">
          <div className="hospital-container quick-grid">
            {[
              [<CalendarMonthRounded />, "Book appointment", "Choose a department and time"],
              [<MicRounded />, "Ask the assistant", "Get spoken or typed help"],
              [<MonitorHeartRounded />, "Check health risk", "View optional health results"],
              [<DescriptionRounded />, "View records", "Prescriptions and care history"],
              [<EmergencyRounded />, "Emergency", "Contact emergency services"],
            ].map(([icon, title, copy], index) => (
              <Link className={`quick-card ${index === 4 ? "emergency" : ""}`} to={index === 4 ? "#contact" : "/login"} key={title}>
                <span>{icon}</span>
                <b>{title}</b>
                <small>{copy}</small>
              </Link>
            ))}
          </div>
        </section>

        <section className="hospital-section" id="departments">
          <div className="hospital-container">
            <div className="section-heading">
              <div><span>Our departments</span><h2>Care for the whole you.</h2></div>
              <Link to="/login">View appointment options <ChevronRightRounded /></Link>
            </div>
            <div className="department-grid">
              {departments.map(([name, label, copy]) => (
                <Link className="department-card" to="/login" key={name}>
                  <span className="department-icon"><MonitorHeartRounded /></span>
                  <small>{label}</small>
                  <h3>{name}</h3>
                  <p>{copy}</p>
                  <b>Book a visit <ChevronRightRounded /></b>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="hospital-section doctors-section" id="doctors">
          <div className="hospital-container">
            <div className="section-heading">
              <div><span>Our care team</span><h2>Doctors at this hospital.</h2></div>
              <Link to="/login">Find a doctor <ChevronRightRounded /></Link>
            </div>
            {doctorLoading ? (
              <div className="doctor-grid"><div className="doctor-skeleton" /><div className="doctor-skeleton" /><div className="doctor-skeleton" /></div>
            ) : doctors.length ? (
              <div className="doctor-grid">
                {doctors.map((doctor) => (
                  <article className="doctor-card" key={doctor.username}>
                    <div className="doctor-avatar" aria-hidden="true">{doctor.username?.[0]?.toUpperCase() || "D"}</div>
                    <h3>{doctor.username}</h3>
                    <p>{doctor.specialization || "Medical doctor"}</p>
                    <Link to="/login">View availability <ChevronRightRounded /></Link>
                  </article>
                ))}
              </div>
            ) : (
              <div className="designed-empty"><GroupsRounded /><h3>No doctors are listed yet</h3><p>The care team list will appear when doctor accounts are available.</p></div>
            )}
          </div>
        </section>

        <section className="hospital-section how-section" id="services">
          <div className="hospital-container how-grid">
            <div>
              <span className="section-label">How it works</span>
              <h2>A simpler care journey.</h2>
              <ol className="steps">
                <li><b>1</b><span><strong>Book</strong><small>Choose a department, doctor and convenient time.</small></span></li>
                <li><b>2</b><span><strong>Consult</strong><small>Meet your care team and share only what you choose.</small></span></li>
                <li><b>3</b><span><strong>Follow up</strong><small>View visits, prescriptions and next steps in one place.</small></span></li>
              </ol>
            </div>
            <div className="smart-care">
              <span className="section-label">Smart care</span>
              <h2>Helpful technology, explained clearly.</h2>
              <div className="smart-grid">
                <article><MonitorHeartRounded /><h3>Health risk check</h3><p>Optional results explain factors that may need attention. They are not a diagnosis.</p></article>
                <article><MicRounded /><h3>Accessible voice help</h3><p>Ask questions using typed or spoken text, with large reading options.</p></article>
                <article><EventAvailableRounded /><h3>Planning support</h3><p>7-day resource forecasts help the hospital plan beds and oxygen.</p></article>
                <article><LocalHospitalRounded /><h3>Live bed updates</h3><p>Care teams can see bed status changes as they happen.</p></article>
              </div>
            </div>
          </div>
        </section>

        <section className="hospital-section safety-section" id="about">
          <div className="hospital-container safety-grid">
            <div className="privacy-illustration" aria-hidden="true">
              <ShieldRounded />
              <span><CheckCircleRounded /> Secure sign-in</span>
              <span><CheckCircleRounded /> Sharing consent</span>
            </div>
            <div>
              <span className="section-label">Patient safety and privacy</span>
              <h2>Your information stays under your control.</h2>
              <p>HealthForesight uses secure account sessions and role-based access. Voice and chat features show consent before patient context is shared.</p>
              <ul><li>Secure JWT sign-in</li><li>Role-based patient and staff access</li><li>Clear consent indicators</li></ul>
            </div>
          </div>
        </section>

        <section className="hospital-section contact-section" id="contact">
          <div className="hospital-container contact-grid">
            <div>
              <span className="section-label">Contact and location</span>
              <h2>We’re here to help.</h2>
              <p><PhoneRounded /> Phone: <b>Number placeholder</b></p>
              <p><LocationOnRounded /> Address: <b>Location placeholder</b></p>
              <p><AccessTimeRounded /> Hours: <b>24/7 emergency access; clinic hours may vary</b></p>
            </div>
            <div className="faq">
              <details><summary>How do I book an appointment?</summary><p>Choose “Book appointment,” sign in, select a doctor and request an available time.</p></details>
              <details><summary>Are health risk results a diagnosis?</summary><p>No. Model outputs are informational and must be reviewed with a qualified care professional.</p></details>
              <details><summary>Can I access my records?</summary><p>Signed-in patients can review appointments, prescriptions and available health history in the patient portal.</p></details>
            </div>
          </div>
        </section>
      </main>

      <footer className="hospital-footer">
        <div className="hospital-container footer-grid">
          <div><Brand /><p>Clear access to care, records and hospital services.</p></div>
          <div><h3>Care</h3><a href="#departments">Departments</a><a href="#doctors">Doctors</a><Link to="/login">Appointments</Link></div>
          <div><h3>Patient portal</h3><Link to="/login">Login</Link><Link to="/signup">Create account</Link><a href="#about">Privacy and consent</a></div>
          <div><h3>Contact</h3><p>Number placeholder</p><p>Location placeholder</p></div>
        </div>
        <div className="hospital-container footer-bottom"><span>© {new Date().getFullYear()} HealthForesight</span><span>Personal hospital portal project</span></div>
      </footer>
    </div>
  );
}
