import { useState } from "react";
import "./Home.css";
import examInterfaceImg from "../assets/exam-interface-screenshot.jpeg";
import teamCollabImg from "../assets/team-ai-collaboration.png";
import facultyAnalyticsImg from "../assets/faculty-analytics-dashboard.png";
import doctorPatientImg from "../assets/doctor-patient-screen.png";

// ── Local button (kept local to match the pasted design's exact hover states) ──
function Btn({ variant = "primary", size = "md", children, onClick }) {
  const [hovered, setHovered] = useState(false);
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    gap: 8, borderRadius: 8, fontWeight: 600, cursor: "pointer",
    border: "none", transition: "all .18s ease", fontFamily: "inherit",
    padding: size === "lg" ? "14px 28px" : "11px 22px",
    fontSize: size === "lg" ? "0.98rem" : "0.92rem",
  };
  const variants = {
    primary: {
      background: hovered ? "var(--teal-deep)" : "var(--teal)", color: "#fff",
      transform: hovered ? "translateY(-1px)" : "none",
      boxShadow: hovered ? "0 4px 16px rgba(5,150,105,0.25)" : "none",
    },
    ghost: {
      background: hovered ? "var(--surface)" : "transparent", color: "var(--ink)",
      border: `1px solid ${hovered ? "var(--teal)" : "var(--line)"}`,
    },
  };
  return (
    <button onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ ...base, ...variants[variant] }}>
      {children}
    </button>
  );
}

function SectionEyebrow({ children, center }) {
  return (
    <span style={{
      fontFamily: "monospace", fontSize: "0.8rem", fontWeight: 700, color: "var(--teal)",
      textTransform: "uppercase", letterSpacing: "0.07em", display: "block",
      marginBottom: 12, textAlign: center ? "center" : "left",
    }}>{children}</span>
  );
}

const Icon = {
  layers: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>,
  clock: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>,
  check: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>,
  monitor: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>,
  pulse: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
};

// ── Feature item ───────────────────────────────────────────────
function FeatItem({ icon, title, desc }) {
  return (
    <div className="hp-feature-item">
      <div style={{ width: 40, height: 40, borderRadius: 8, background: "rgba(5,150,105,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
      <h4 style={{ fontSize: "0.93rem", fontWeight: 600, color: "var(--ink)", margin: 0 }}>{title}</h4>
      <p style={{ fontSize: "0.84rem", color: "var(--slate)", lineHeight: 1.55, margin: 0 }}>{desc}</p>
    </div>
  );
}

// ── DATA ───────────────────────────────────────────────────────
const TABS = [
  { id: "fcps", label: "FCPS-1", sub: "Medicine & Allied" },
  { id: "jcat", label: "JCAT (MDMS)", sub: "Medicine & Allied" },
];

const FEATURES = [
  { icon: Icon.layers, title: "3,000+ Options Explained", fcps: "Every MCQ option explained at real FCPS-1 exam difficulty, covering the complete syllabus.", jcat: "Every MCQ option explained at real JCAT (MDMS) exam difficulty, covering the complete syllabus." },
  { icon: Icon.clock, title: "Every Option Explained", fcps: "Understand precisely why each answer is correct or incorrect — not merely which option to select.", jcat: "Understand precisely why each answer is correct or incorrect — not merely which option to select." },
  { icon: Icon.check, title: "Scenario-Based QBank", fcps: "Clinical case scenarios with complete option-level explanations, mirroring FCPS-1 exam format.", jcat: "JCAT-style clinical scenarios with comprehensive option-level explanations for deep learning." },
  { icon: Icon.monitor, title: "Exam-Like Interface", fcps: "Practice within an interface that replicates the actual FCPS-1 examination environment.", jcat: "Practice within an interface that replicates the actual JCAT (MDMS) examination environment." },
  { icon: Icon.pulse, title: "Performance Analytics", fcps: "Monitor your scores, identify weak topics, and track measurable improvement across sessions.", jcat: "Monitor your scores, identify weak topics, and track measurable improvement across sessions." },
];

const PROGRAM_STATS = [
  { big: "3,000+", label: "Questions at Exam-Level Difficulty" },
  { big: "100%", label: "Options Explained for Every MCQ" },
  { big: "Scenario", label: "Based QBank with Full Explanations" },
  { big: "Live", label: "Analytics to Track Your Performance" },
];

const PILLAR_CARDS = [
  {
    iconPaths: <><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></>,
    accent: "#059669", accentBg: "rgba(5,150,105,0.12)",
    title: "Structured & Exam-Oriented Preparation",
    body: "Our question bank is designed to reflect the precise difficulty and format of both FCPS-1 and JCAT examinations, ensuring that every practice session closely mirrors actual exam conditions.",
  },
  {
    iconPaths: <><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></>,
    accent: "#B7791F", accentBg: "rgba(183,121,31,0.12)",
    title: "Every Answer Option Explained",
    body: "Each MCQ includes a detailed explanation for every option — not only the correct answer. This approach builds comprehensive conceptual understanding rather than surface-level answer memorisation.",
  },
  {
    iconPaths: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></>,
    accent: "#3B82C4", accentBg: "rgba(59,130,196,0.12)",
    title: "Clinical Reasoning at the Core",
    body: "Scenario-based questions are crafted to develop the clinical thinking required in both examinations and real-world practice, bridging the gap between academic knowledge and patient care.",
  },
  {
    iconPaths: <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" /></>,
    accent: "#8B5CC7", accentBg: "rgba(139,92,199,0.12)",
    title: "Intelligent Performance Analytics",
    body: "Live dashboards provide subject-wise breakdowns, time-per-question data, peer comparisons, and improvement trends — giving you a precise view of where to focus your revision.",
  },
];

const FAQ_DATA = [
  { q: "Which examinations does MedPrepAI cover?", a: "MedPrepAI currently covers FCPS-1 (Medicine & Allied) and JCAT (MDMS) (Medicine & Allied). Both programmes are specialty-focused and designed for postgraduate candidates in Pakistan." },
  { q: "What does 'Every Option Explained' mean?", a: "For every MCQ, we provide a detailed explanation not only for the correct answer but for each incorrect option as well. This method builds genuine conceptual understanding rather than encouraging surface-level memorisation." },
  { q: "How many questions are available in the question bank?", a: "The question bank contains over 3,000 options-explained questions, all set at exam-level difficulty and covering the complete syllabus for both FCPS-1 and JCAT (MDMS)." },
  { q: "Is a free trial available?", a: "Yes. You may access a curated selection of questions from both the FCPS-1 and JCAT tracks at no cost before committing to a full subscription plan." },
  { q: "What does the performance analytics feature include?", a: "Analytics include subject-wise performance breakdowns, time-per-question tracking, comparison with peer averages, and improvement trends measured across sessions — giving you a precise and actionable picture of your progress." },
];

// ── Pillar Card ──────────────────────────────────────────────────
function PillarCard({ iconPaths, accent, accentBg, title, body }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} className="hp-pillar-card">
      <div style={{ width: 48, height: 48, borderRadius: 10, background: hov ? accentBg : "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18, transition: "background .2s" }}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke={hov ? accent : "var(--slate)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{iconPaths}</svg>
      </div>
      <div style={{ width: hov ? 48 : 32, height: 3, background: hov ? accent : "var(--line)", borderRadius: 2, marginBottom: 14, transition: "background .2s, width .2s" }} />
      <h3 style={{ fontFamily: "Georgia, serif", fontSize: "1.08rem", fontWeight: 600, marginBottom: 10, color: "var(--ink)" }}>{title}</h3>
      <p style={{ fontSize: "0.9rem", color: "var(--slate)", lineHeight: 1.65 }}>{body}</p>
    </div>
  );
}

// ── Testimonial Card ────────────────────────────────────────────
function TestimonialCard({ text, name, role }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: "var(--paper)", border: `1px solid ${hov ? "var(--teal)" : "var(--line)"}`,
        borderRadius: "var(--radius)", padding: "30px 28px", display: "flex", flexDirection: "column", gap: 18,
        transition: "all .2s", transform: hov ? "translateY(-3px)" : "none",
        boxShadow: hov ? "0 6px 20px rgba(15,23,42,0.12)" : "none", cursor: "default",
      }}>
      <div style={{ fontFamily: "Georgia, serif", fontSize: "2.4rem", color: "var(--teal)", lineHeight: 1 }}>"</div>
      <p style={{ fontSize: "0.98rem", color: "var(--ink)", flex: 1, lineHeight: 1.7 }}>{text}</p>
      <div style={{ borderTop: "1px solid var(--line)", paddingTop: 14 }}>
        <div style={{ fontWeight: 600, fontSize: "0.92rem" }}>{name}</div>
        <div style={{ fontSize: "0.82rem", color: "var(--slate)", marginTop: 2 }}>{role}</div>
      </div>
    </div>
  );
}

// ── Program Tabs section ──────────────────────────────────────
function ProgramTabs({ activeTab, setActiveTab, setPage }) {
  const tab = TABS.find((t) => t.id === activeTab);
  const descriptions = {
    fcps: "Thousands of postgraduate candidates rely on our platform for focused, high-yield FCPS-1 preparation. We combine a rigorous question bank with in-depth explanations to develop lasting clinical knowledge and exam confidence.",
    jcat: "Our JCAT (MDMS)-specific preparation is purpose-built for the unique demands of the MDMS entrance examination, featuring scenario-intensive questions and comprehensive explanations that strengthen both exam performance and clinical judgement.",
  };
  const headlines = {
    fcps: "The Preferred Choice for FCPS-1 Preparation",
    jcat: "The Preferred Choice for JCAT (MDMS) Preparation",
  };
  const startLabels = {
    fcps: "Begin FCPS-1 Preparation",
    jcat: "Begin JCAT (MDMS) Preparation",
  };

  return (
    <section id="programs" style={{ scrollMarginTop: 80 }}>
      <div className="hp-section-padding" style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <SectionEyebrow center>Examination Tracks</SectionEyebrow>
          <h2 className="hp-section-title" style={{ fontSize: "2.4rem", margin: "0 auto 14px", maxWidth: 640 }}>
            Focused Preparation for <span style={{ color: "var(--teal)" }}>Every Examination</span>
          </h2>
          <p style={{ color: "var(--slate)", fontSize: "1.02rem", maxWidth: 560, margin: "0 auto" }}>
            Pick your track. Everything else is already built in.
          </p>
        </div>

        <div className="hp-tab-switcher">
          <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", border: "1px solid var(--line)", flexWrap: "wrap" }}>
            {TABS.map((t, i) => {
              const isActive = activeTab === t.id;
              return (
                <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                  padding: "14px 40px",
                  background: isActive ? "var(--teal)" : "var(--surface)",
                  color: isActive ? "#fff" : "var(--slate)",
                  border: "none",
                  borderRight: i < TABS.length - 1 ? "1px solid var(--line)" : "none",
                  cursor: "pointer", fontFamily: "inherit",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                  transition: "background .2s, color .2s", flex: "1 1 auto",
                }}>
                  <span style={{ fontWeight: 700, fontSize: "1rem" }}>{t.label}</span>
                  <span style={{ fontFamily: "monospace", fontSize: "0.68rem", opacity: 0.75 }}>{t.sub}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="hp-program-tabs-hero">
          <div>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "monospace", fontSize: "0.72rem",
              color: "var(--teal-deep)", background: "rgba(5,150,105,0.08)", border: "1px solid var(--teal)",
              padding: "6px 14px", borderRadius: 100, marginBottom: 20,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--teal)" }} />
              {tab.label} · {tab.sub}
            </span>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: "2.4rem", lineHeight: 1.1, color: "var(--ink)", marginBottom: 12 }}>
              {headlines[activeTab]}
            </h2>
            <p style={{ fontFamily: "monospace", fontSize: "0.82rem", color: "var(--slate)", marginBottom: 22 }}>
              Specialty Only — Medicine & Allied
            </p>
            <p style={{ color: "var(--slate)", fontSize: "1.02rem", marginBottom: 32, lineHeight: 1.7 }}>
              {descriptions[activeTab]}
            </p>
            <div className="hp-cta-buttons">
              <Btn size="lg" onClick={() => setPage(activeTab)}>{startLabels[activeTab]}</Btn>
              <Btn variant="ghost" size="lg" onClick={() => setPage(activeTab)}>View Sample Questions</Btn>
            </div>
          </div>
          <div className="hp-program-stats">
            {PROGRAM_STATS.map(({ big, label }) => (
              <div key={label} className="hp-stat-item">
                <div className="hp-stat-number">{big}</div>
                <div style={{ fontSize: "0.82rem", color: "var(--slate)", marginTop: 6 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 56 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <SectionEyebrow center>Inside The Question Bank</SectionEyebrow>
            <h2 className="hp-section-title" style={{ fontSize: "2rem", margin: "0 auto 14px", maxWidth: 620 }}>
              What Makes Every Question <span style={{ color: "var(--teal)" }}>Count</span>
            </h2>
            <p style={{ color: "var(--slate)", fontSize: "1rem", maxWidth: 520, margin: "0 auto" }}>
              Five pillars built into every {tab.label} question, from first attempt to final review.
            </p>
          </div>
          <div className="hp-feature-strip">
            {FEATURES.map((f) => (
              <FeatItem key={f.title} icon={f.icon} title={f.title} desc={activeTab === "fcps" ? f.fcps : f.jcat} />
            ))}
          </div>
        </div>

        <div className="hp-grid-2col" style={{ marginTop: 56 }}>
          <div>
            <SectionEyebrow>Performance, Visualised</SectionEyebrow>
            <h3 style={{ fontFamily: "Georgia, serif", fontSize: "1.8rem", fontWeight: 700, lineHeight: 1.2, marginBottom: 16 }}>
              See Exactly Where Your <span style={{ color: "var(--teal)" }}>Preparation Stands</span>
            </h3>
            <p style={{ color: "var(--slate)", fontSize: "1.02rem", lineHeight: 1.75 }}>
              Scores turned into a clear plan for what to study next.
            </p>
          </div>
          <div style={{ borderRadius: "var(--radius)", overflow: "hidden", border: "1px solid var(--line)" }}>
            <img src={facultyAnalyticsImg} alt="Faculty reviewing student performance analytics on a dashboard" style={{ width: "100%", display: "block", maxHeight: 420, objectFit: "cover" }} />
          </div>
        </div>
      </div>
    </section>
  );
}

// ── FAQ ────────────────────────────────────────────────────────
function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" style={{ scrollMarginTop: 80 }}>
      <div className="hp-section-padding" style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <SectionEyebrow center>Frequently Asked Questions</SectionEyebrow>
          <h2 className="hp-section-title" style={{ fontSize: "2.4rem", margin: "0 auto 14px" }}>Common <span style={{ color: "var(--teal)" }}>Questions</span></h2>
          <p style={{ color: "var(--slate)", fontSize: "1.02rem", maxWidth: 500, margin: "0 auto" }}>
            Answers to the questions most frequently asked by candidates before beginning their preparation.
          </p>
        </div>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          {FAQ_DATA.map((item, i) => (
            <div key={i} className="hp-faq-item" style={{ borderTop: i === 0 ? "1px solid var(--line)" : "none" }}>
              <button onClick={() => setOpen(open === i ? -1 : i)} style={{
                width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer",
                padding: "22px 4px", display: "flex", justifyContent: "space-between", alignItems: "center",
                fontFamily: "Georgia, serif", fontWeight: 500, color: "var(--ink)",
              }}>
                <span className="hp-faq-question">{item.q}</span>
                <span style={{
                  fontFamily: "monospace", fontSize: "1.2rem", color: "var(--teal)",
                  transition: "transform .2s", display: "inline-block",
                  transform: open === i ? "rotate(45deg)" : "none", flexShrink: 0, marginLeft: 16,
                }}>+</span>
              </button>
              {open === i && (
                <p style={{ color: "var(--slate)", padding: "0 4px 22px", fontSize: "0.95rem", maxWidth: 620, margin: 0, lineHeight: 1.7 }}>{item.a}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Main export ────────────────────────────────────────────────
export default function Home({ setPage }) {
  const [activeTab, setActiveTab] = useState("fcps");

  return (
    <>
      {/* ── HERO ── */}
      <section id="home" className="hp-hero-padding" style={{ textAlign: "center" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 32px" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "monospace", fontSize: "0.78rem",
            color: "var(--teal-deep)", background: "rgba(5,150,105,0.08)", border: "1px solid var(--teal)",
            padding: "6px 14px", borderRadius: 100, marginBottom: 28,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--teal)" }} />
            MedPrepAI
          </span>
          <h1 className="hp-hero-title">We Make Complex Stuff Easier to Understand</h1>
          <p className="hp-hero-subtitle" style={{ color: "var(--slate)", maxWidth: 560, margin: "0 auto 40px", lineHeight: 1.7 }}>
            Learning Tools Designed for High-Stakes Exams
          </p>
          <div className="hp-cta-buttons" style={{ justifyContent: "center", marginBottom: 60 }}>
            <Btn size="lg" onClick={() => setPage("fcps")}>Begin FCPS-1 Preparation</Btn>
            <Btn variant="ghost" size="lg" onClick={() => setPage("jcat")}>Begin JCAT (MDMS) Preparation</Btn>
          </div>

          <div className="hp-hero-stats">
            {[
              { num: "3,000+", label: "Examination-Level Questions" },
              { num: "100%", label: "Options Explained" },
              { num: "2", label: "Examination Tracks" },
              { num: "Live", label: "Performance Analytics" },
            ].map(({ num, label }) => (
              <div key={label} className="hp-hero-stat">
                <div className="hp-hero-stat-number">{num}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--slate)", marginTop: 6 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VISUAL PANEL 1 ── */}
      <section>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 32px 80px" }}>
          <div className="hp-grid-2col">
            <div>
              <SectionEyebrow>Real Clinical Encounters</SectionEyebrow>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: "2rem", fontWeight: 700, lineHeight: 1.2, marginBottom: 16 }}>
                Learn by <span style={{ color: "var(--teal)" }}>Doing</span>, Not Memorising
              </h2>
              <p style={{ color: "var(--slate)", fontSize: "1.02rem", lineHeight: 1.75 }}>
                Real scenarios. Real feedback. Built to feel like practice, not a quiz.
              </p>
            </div>
            <div style={{ borderRadius: "var(--radius)", overflow: "hidden", border: "1px solid var(--line)" }}>
              <img src={doctorPatientImg} alt="Clinician reviewing a virtual patient encounter on screen" style={{ width: "100%", display: "block", maxHeight: 420, objectFit: "cover" }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── MISSION STRIP ── */}
      <div style={{ borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", padding: "44px 0" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 32px", textAlign: "center" }}>
          <span style={{ fontFamily: "monospace", fontSize: "0.8rem", fontWeight: 700, color: "var(--teal)", letterSpacing: "0.06em", display: "block", marginBottom: 16 }}>OUR MISSION</span>
          <p style={{ fontSize: "1.08rem", fontWeight: 600, color: "var(--ink)", maxWidth: 820, lineHeight: 1.8, margin: "0 auto" }}>
            We build confidence, not just exam-takers.
          </p>
        </div>
      </div>

      {/* ── WHAT SETS US APART ── */}
      <section id="why-us" style={{ background: "var(--surface)", scrollMarginTop: 80 }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "80px 32px" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <SectionEyebrow center>Our Distinction</SectionEyebrow>
            <h2 className="hp-section-title" style={{ fontSize: "2.4rem", margin: "0 auto 14px", maxWidth: 640 }}>
              What Sets <span style={{ color: "var(--teal)" }}>MedPrepAI</span> Apart
            </h2>
            <p style={{ color: "var(--slate)", fontSize: "1.02rem", maxWidth: 560, margin: "0 auto" }}>
              Built to make the hard parts clear.
            </p>
          </div>

          <div className="hp-pillar-grid">
            {PILLAR_CARDS.map((p) => <PillarCard key={p.title} {...p} />)}
          </div>

          <div className="hp-grid-2col">
            <div style={{ borderRadius: "var(--radius)", overflow: "hidden", border: "1px solid var(--line)" }}>
              <img src={teamCollabImg} alt="Medical team reviewing AI-driven clinical insights together" style={{ width: "100%", display: "block", maxHeight: 420, objectFit: "cover" }} />
            </div>
            <div>
              <SectionEyebrow>Collaborative By Design</SectionEyebrow>
              <h3 style={{ fontFamily: "Georgia, serif", fontSize: "1.8rem", fontWeight: 700, lineHeight: 1.2, marginBottom: 16 }}>
                Faculty and Candidates, <span style={{ color: "var(--teal)" }}>Working From the Same Data</span>
              </h3>
              <p style={{ color: "var(--slate)", fontSize: "1.02rem", lineHeight: 1.75 }}>
                One shared view of progress — for coaching that's grounded in real evidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROGRAM TABS ── */}
      <ProgramTabs activeTab={activeTab} setActiveTab={setActiveTab} setPage={setPage} />

      {/* ── SEE IT IN ACTION ── */}
      <section>
        <div className="hp-see-it-action-wrap">
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <SectionEyebrow center>See It In Action</SectionEyebrow>
            <h2 className="hp-section-title" style={{ fontSize: "2.2rem", margin: "0 auto 14px", maxWidth: 620 }}>
              Every Option, <span style={{ color: "var(--teal)" }}>Explained In Full</span>
            </h2>
            <p style={{ color: "var(--slate)", fontSize: "1.02rem", maxWidth: 560, margin: "0 auto" }}>
              A real question from the bank — keywords highlighted in the stem, and a full breakdown of why each option is correct or incorrect.
            </p>
          </div>
          <div style={{ borderRadius: "var(--radius)", overflow: "hidden", border: "1px solid var(--line)", boxShadow: "0 8px 28px rgba(15,23,42,0.08)" }}>
            <img src={examInterfaceImg} alt="Exam-style question interface with full answer breakdown" style={{ width: "100%", display: "block" }} />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ background: "var(--surface)", scrollMarginTop: 80 }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "80px 32px" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <SectionEyebrow center>Preparation Workflow</SectionEyebrow>
            <h2 className="hp-section-title" style={{ fontSize: "2.4rem", margin: "0 auto 14px" }}>How <span style={{ color: "var(--teal)" }}>MedPrepAI</span> Works</h2>
            <p style={{ color: "var(--slate)", fontSize: "1.02rem", maxWidth: 500, margin: "0 auto" }}>
              A clear, structured path from your first login to confident examination performance.
            </p>
          </div>
          <div className="hp-grid-4col">
            {[
              { n: "01", title: "Create Your Account", body: "Register and select your examination track — FCPS-1 or JCAT (MDMS) — to begin your personalised preparation." },
              { n: "02", title: "Practice Questions", body: "Work through scenario-based MCQs with every option explained at real examination difficulty." },
              { n: "03", title: "Review Explanations", body: "Study the detailed reasoning behind every correct and incorrect answer to reinforce clinical understanding." },
              { n: "04", title: "Monitor Your Progress", body: "Use live dashboards and analytics to identify performance trends, weak areas, and measurable improvement." },
            ].map(({ n, title, body }, i, arr) => (
              <div key={n} className="hp-step-item" style={{ borderRight: i < arr.length - 1 ? "1px dashed var(--line)" : "none" }}>
                <div style={{ fontFamily: "monospace", color: "var(--teal)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  {n}<span style={{ height: 1, flex: 1, background: "var(--line)" }} />
                </div>
                <h3 style={{ fontFamily: "Georgia, serif", fontSize: "1.1rem", marginBottom: 8 }}>{title}</h3>
                <p style={{ color: "var(--slate)", fontSize: "0.92rem", lineHeight: 1.6 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "80px 32px" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <SectionEyebrow center>Testimonials</SectionEyebrow>
            <h2 className="hp-section-title" style={{ fontSize: "2.4rem", margin: "0 auto 14px" }}>
              Trusted by FCPS and JCAT Candidates
            </h2>
            <p style={{ color: "var(--slate)", fontSize: "1.02rem", maxWidth: 480, margin: "0 auto" }}>
              Real feedback from people who used it.
            </p>
          </div>
          <div className="hp-grid-3col">
            {[
              { text: "The every-option-explained approach fundamentally changed how I study. I now understand why incorrect answers are wrong, not merely which answer to select.", name: "Ayesha K.", role: "FCPS-1 Candidate, Medicine" },
              { text: "The scenario-based question bank closely replicates the actual JCAT examination experience. My confidence increased significantly after a few weeks of practice.", name: "Hassan R.", role: "JCAT (MDMS) Candidate" },
              { text: "The performance analytics helped me identify my weakest subjects early. I was able to direct my revision toward the areas that needed the most attention.", name: "Fatima N.", role: "Postgraduate Trainee, Internal Medicine" },
            ].map(({ text, name, role }) => (
              <TestimonialCard key={name} text={text} name={name} role={role} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ background: "var(--surface)", textAlign: "center" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "80px 32px" }}>
          <h2 className="hp-section-title" style={{ fontSize: "2.4rem", maxWidth: 640, margin: "0 auto 16px" }}>
            Ready to Get Started?
          </h2>
          <p style={{ color: "var(--slate)", maxWidth: 500, margin: "0 auto 36px", fontSize: "1.02rem", lineHeight: 1.7 }}>
            Pick a track and start practicing today.
          </p>
          <div className="hp-cta-buttons" style={{ justifyContent: "center" }}>
            <Btn size="lg" onClick={() => setPage("fcps")}>Begin FCPS-1 Preparation</Btn>
            <Btn variant="ghost" size="lg" onClick={() => setPage("jcat")}>Begin JCAT (MDMS) Preparation</Btn>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <FAQ />
    </>
  );
}
