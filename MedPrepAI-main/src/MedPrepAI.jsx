import { useState, useEffect, useRef } from "react";
import examInterfaceImg from "./assets/exam-interface-screenshot.jpeg";
import teamCollabImg from "./assets/team-ai-collaboration.png";
import facultyAnalyticsImg from "./assets/faculty-analytics-dashboard.png";
import doctorPatientImg from "./assets/doctor-patient-screen.png";
import logoIcon from "./assets/logo-icon.png";

// ── Design tokens (dark theme) ──────────────────────────────────
const T = {
  ink: "#FFFFFF",
  paper: "#020617",
  surface: "#0B1220",
  teal: "#059669",
  tealDeep: "#047857",
  gold: "#10B981",
  slate: "#99A2B0",
  line: "#283246",
  radius: "14px",
};

// ── Logo badge ──────────────────────────────────────────────────
function LogoBadge({ size = 34 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.26,
      background: "#059669", display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      <img src={logoIcon} alt="MedPrepAI" style={{ width: "62%", height: "62%", objectFit: "contain" }} />
    </div>
  );
}

// ── SVG Icons ──────────────────────────────────────────────────
const Icon = {
  layers: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke={T.teal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke={T.teal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke={T.teal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  ),
  monitor: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke={T.teal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
    </svg>
  ),
  pulse: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke={T.teal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  book: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke={T.teal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
    </svg>
  ),
  brain: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke={T.teal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0112 4.5v15a2.5 2.5 0 01-4.96-.46 2.5 2.5 0 01-1.07-4.69 3 3 0 01.34-5.58 2.5 2.5 0 013.2-3.77z"/>
      <path d="M14.5 2A2.5 2.5 0 0112 4.5v15a2.5 2.5 0 004.96-.46 2.5 2.5 0 001.07-4.69 3 3 0 00-.34-5.58 2.5 2.5 0 00-3.2-3.77z"/>
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke={T.teal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke={T.teal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  menu: (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
};

// ── Shared Button component ────────────────────────────────────
function Btn({ variant = "primary", size = "md", children, onClick, href, style, fullWidth }) {
  const [hovered, setHovered] = useState(false);
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    gap: 8, borderRadius: 8, fontWeight: 600, cursor: "pointer",
    border: "none", transition: "all .18s ease",
    textDecoration: "none", fontFamily: "inherit",
    padding: size === "lg" ? "14px 28px" : "11px 22px",
    fontSize: size === "lg" ? "0.98rem" : "0.92rem",
    width: fullWidth ? "100%" : "auto",
  };
  const variants = {
    primary: {
      background: hovered ? T.tealDeep : T.teal,
      color: "#fff",
      transform: hovered ? "translateY(-1px)" : "none",
      boxShadow: hovered ? `0 4px 16px rgba(47,111,94,0.3)` : "none",
    },
    gold: {
      background: hovered ? "#0EA371" : T.gold,
      color: "#06190F",
      transform: hovered ? "translateY(-1px)" : "none",
      boxShadow: hovered ? `0 4px 16px rgba(16,185,129,0.35)` : "none",
    },
    ghost: {
      background: "transparent",
      color: T.ink,
      border: `1px solid ${hovered ? T.teal : T.line}`,
    },
    ghostDark: {
      background: hovered ? "rgba(255,255,255,0.1)" : "transparent",
      color: "#fff",
      border: "1px solid rgba(255,255,255,0.25)",
    },
  };
  const combined = { ...base, ...variants[variant], ...style };
  const props = { style: combined, onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false) };
  return href
    ? <a href={href} {...props}>{children}</a>
    : <button onClick={onClick} {...props}>{children}</button>;
}

function SectionEyebrow({ children, center }) {
  return (
    <span style={{
      fontFamily: "IBM Plex Mono, monospace", fontSize: "0.8rem", fontWeight: 700, color: T.teal,
      textTransform: "uppercase", letterSpacing: "0.07em", display: "block",
      marginBottom: 12, textAlign: center ? "center" : "left",
    }}>{children}</span>
  );
}

// ── Feature item ───────────────────────────────────────────────
function FeatItem({ icon, title, desc, last }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="feature-item"
      style={{
        padding: "26px 22px",
        background: hov ? "rgba(5,150,105,0.1)" : T.surface,
        borderRight: last ? "none" : `1px solid ${T.line}`,
        display: "flex", flexDirection: "column", gap: 10, flex: 1, minWidth: 0,
        transition: "background .2s",
        cursor: "default",
      }}>
      <div style={{ width: 40, height: 40, borderRadius: 8, background: hov ? "rgba(16,185,129,0.18)" : "rgba(16,185,129,0.1)", display: "flex", alignItems: "center", justifyContent: "center", transition: "background .2s" }}>{icon}</div>
      <h4 style={{ fontSize: "0.93rem", fontWeight: 600, color: T.ink, margin: 0 }}>{title}</h4>
      <p style={{ fontSize: "0.84rem", color: T.slate, lineHeight: 1.55, margin: 0 }}>{desc}</p>
    </div>
  );
}

// ── Program Stat Grid ──────────────────────────────────────────
function ProgramStats({ stats }) {
  return (
    <div className="program-stats" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {stats.map(({ big, label }) => (
        <div key={label} className="stat-item" style={{
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 10, padding: "22px 20px",
        }}>
          <div className="stat-number" style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: "2rem", fontWeight: 500, color: T.gold, lineHeight: 1 }}>{big}</div>
          <div style={{ fontSize: "0.82rem", color: "#9CB8AE", marginTop: 6 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

// ── DATA ───────────────────────────────────────────────────────
const TABS = [
  { id: "fcps", label: "FCPS-1", sub: "Medicine & Allied" },
  { id: "jcat", label: "JCAT (MDMS)", sub: "Medicine & Allied" },
];

const FEATURES = [
  { icon: Icon.layers, title: "6,000+ Options Explained", fcps: "Every MCQ option explained at real FCPS-1 exam difficulty, covering the complete syllabus.", jcat: "Every MCQ option explained at real JCAT (MDMS) exam difficulty, covering the complete syllabus." },
  { icon: Icon.clock, title: "Every Option Explained", fcps: "Understand precisely why each answer is correct or incorrect — not merely which option to select.", jcat: "Understand precisely why each answer is correct or incorrect — not merely which option to select." },
  { icon: Icon.check, title: "Scenario-Based QBank", fcps: "Clinical case scenarios with complete option-level explanations, mirroring FCPS-1 exam format.", jcat: "JCAT-style clinical scenarios with comprehensive option-level explanations for deep learning." },
  { icon: Icon.monitor, title: "Exam-Like Interface", fcps: "Practice within an interface that replicates the actual FCPS-1 examination environment.", jcat: "Practice within an interface that replicates the actual JCAT (MDMS) examination environment." },
  { icon: Icon.pulse, title: "Performance Analytics", fcps: "Monitor your scores, identify weak topics, and track measurable improvement across sessions.", jcat: "Monitor your scores, identify weak topics, and track measurable improvement across sessions." },
];

const PROGRAM_STATS = [
  { big: "6,000+", label: "Questions at Exam-Level Difficulty" },
  { big: "100%", label: "Options Explained for Every MCQ" },
  { big: "Scenario", label: "Based QBank with Full Explanations" },
  { big: "Live", label: "Analytics to Track Your Performance" },
];

const PILLAR_CARDS = [
  {
    iconPaths: <><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></>,
    accent: T.teal,
    accentBg: "rgba(5,150,105,0.16)",
    title: "Structured & Exam-Oriented Preparation",
    body: "Our question bank is designed to reflect the precise difficulty and format of both FCPS-1 and JCAT examinations, ensuring that every practice session closely mirrors actual exam conditions.",
  },
  {
    iconPaths: <><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></>,
    accent: "#E0A75E",
    accentBg: "rgba(224,167,94,0.16)",
    title: "Every Answer Option Explained",
    body: "Each MCQ includes a detailed explanation for every option — not only the correct answer. This approach builds comprehensive conceptual understanding rather than surface-level answer memorisation.",
  },
  {
    iconPaths: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></>,
    accent: "#5B9FE0",
    accentBg: "rgba(91,159,224,0.16)",
    title: "Clinical Reasoning at the Core",
    body: "Scenario-based questions are crafted to develop the clinical thinking required in both examinations and real-world practice, bridging the gap between academic knowledge and patient care.",
  },
  {
    iconPaths: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></>,
    accent: "#A571E0",
    accentBg: "rgba(165,113,224,0.16)",
    title: "Intelligent Performance Analytics",
    body: "Live dashboards provide subject-wise breakdowns, time-per-question data, peer comparisons, and improvement trends — giving you a precise view of where to focus your revision.",
  },
];

// ── Program Tabs Section ───────────────────────────────────────
function ProgramTabs({ activeTab, setActiveTab }) {
  const tab = TABS.find(t => t.id === activeTab);
  const sectionRef = useRef(null);

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
    <section id="programs" ref={sectionRef} style={{ scrollMarginTop: 80 }}>
      <div className="section-padding" style={{ maxWidth: 1180, margin: "0 auto", padding: "80px 32px" }}>

        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <SectionEyebrow center>Examination Tracks</SectionEyebrow>
          <h2 className="section-title" style={{ fontFamily: "Fraunces, serif", fontSize: "2.4rem", fontWeight: 700, lineHeight: 1.18, margin: "0 auto 14px", maxWidth: 640 }}>
            Focused Preparation for <span style={{ color: T.teal }}>Every Examination</span>
          </h2>
          <p style={{ color: T.slate, fontSize: "1.02rem", maxWidth: 560, margin: "0 auto" }}>
            Select your examination track below. Both are fully equipped with scenario-based question banks, comprehensive option-level explanations, and live performance analytics.
          </p>
        </div>

        <div className="tab-switcher" style={{ display: "flex", justifyContent: "center", marginBottom: 40 }}>
          <div style={{ display: "flex", gap: 0, borderRadius: 10, overflow: "hidden", border: `1px solid ${T.line}`, flexWrap: "wrap" }}>
            {TABS.map((t, i) => {
              const isActive = activeTab === t.id;
              return (
                <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                  padding: "14px 40px",
                  background: isActive ? T.teal : T.surface,
                  color: isActive ? "#fff" : T.slate,
                  border: "none",
                  borderRight: i < TABS.length - 1 ? `1px solid ${T.line}` : "none",
                  cursor: "pointer", fontFamily: "inherit",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                  transition: "background .2s, color .2s",
                  flex: "1 1 auto",
                }}>
                  <span style={{ fontWeight: 700, fontSize: "1rem" }}>{t.label}</span>
                  <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: "0.68rem", opacity: 0.75, letterSpacing: "0.03em" }}>{t.sub}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="program-tabs-hero" style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: "64px 56px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
          <div>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              fontFamily: "IBM Plex Mono, monospace", fontSize: "0.72rem", letterSpacing: "0.04em",
              color: T.gold, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)",
              padding: "6px 14px", borderRadius: 100, marginBottom: 20,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.gold, animation: "blink 1.6s infinite" }} />
              {tab.label} · {tab.sub}
            </span>
            <h2 style={{ fontFamily: "Fraunces, serif", fontSize: "2.4rem", lineHeight: 1.1, color: "#fff", marginBottom: 12 }}>
              {headlines[activeTab]}
            </h2>
            <p style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: "0.82rem", color: "#9CB8AE", marginBottom: 22 }}>
              Specialty Only — Medicine & Allied
            </p>
            <p style={{ color: "#B8C9C2", fontSize: "1.02rem", marginBottom: 32, lineHeight: 1.7 }}>
              {descriptions[activeTab]}
            </p>
            <div className="cta-buttons" style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Btn variant="gold" size="lg">{startLabels[activeTab]}</Btn>
              <Btn variant="ghostDark" size="lg">View Sample Questions</Btn>
            </div>
          </div>
          <ProgramStats stats={PROGRAM_STATS} />
        </div>

        <div style={{ marginTop: 56 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <SectionEyebrow center>Inside The Question Bank</SectionEyebrow>
            <h2 className="section-title" style={{ fontFamily: "Fraunces, serif", fontSize: "2rem", fontWeight: 700, lineHeight: 1.18, margin: "0 auto 14px", maxWidth: 620 }}>
              What Makes Every Question <span style={{ color: T.teal }}>Count</span>
            </h2>
            <p style={{ color: T.slate, fontSize: "1rem", maxWidth: 520, margin: "0 auto" }}>
              Five pillars built into every {tab.label} question, from first attempt to final review.
            </p>
          </div>
          <div className="feature-strip" style={{
            border: `1px solid ${T.line}`, borderRadius: T.radius, overflow: "hidden",
            display: "flex", background: T.surface, boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
            flexWrap: "wrap",
          }}>
            {FEATURES.map((f, i) => (
              <FeatItem
                key={f.title}
                icon={f.icon}
                title={f.title}
                desc={activeTab === "fcps" ? f.fcps : f.jcat}
                last={i === FEATURES.length - 1}
              />
            ))}
          </div>
        </div>

        <div className="grid-2col" style={{ marginTop: 56, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
          <div>
            <SectionEyebrow>Performance, Visualised</SectionEyebrow>
            <h3 style={{ fontFamily: "Fraunces, serif", fontSize: "1.8rem", fontWeight: 700, lineHeight: 1.2, marginBottom: 16 }}>
              See Exactly Where Your <span style={{ color: T.teal }}>Preparation Stands</span>
            </h3>
            <p style={{ color: T.slate, fontSize: "1.02rem", lineHeight: 1.75 }}>
              Subject-wise breakdowns, time-per-question data, and trend lines turn raw scores into a clear revision plan — built on the same analytics faculty use to track cohort progress.
            </p>
          </div>
          <div style={{ borderRadius: T.radius, overflow: "hidden", border: `1px solid ${T.line}` }}>
            <img src={facultyAnalyticsImg} alt="Faculty reviewing student performance analytics on a dashboard" style={{ width: "100%", display: "block", maxHeight: 420, objectFit: "cover" }} />
          </div>
        </div>

      </div>
    </section>
  );
}

// ── FAQ ────────────────────────────────────────────────────────
const FAQ_DATA = [
  { q: "Which examinations does MedPrepAI cover?", a: "MedPrepAI currently covers FCPS-1 (Medicine & Allied) and JCAT (MDMS) (Medicine & Allied). Both programmes are specialty-focused and designed for postgraduate candidates in Pakistan." },
  { q: "What does 'Every Option Explained' mean?", a: "For every MCQ, we provide a detailed explanation not only for the correct answer but for each incorrect option as well. This method builds genuine conceptual understanding rather than encouraging surface-level memorisation." },
  { q: "How many questions are available in the question bank?", a: "The question bank contains over 6,000 options-explained questions, all set at exam-level difficulty and covering the complete syllabus for both FCPS-1 and JCAT (MDMS)." },
  { q: "Is a free trial available?", a: "Yes. You may access a curated selection of questions from both the FCPS-1 and JCAT tracks at no cost before committing to a full subscription plan." },
  { q: "What does the performance analytics feature include?", a: "Analytics include subject-wise performance breakdowns, time-per-question tracking, comparison with peer averages, and improvement trends measured across sessions — giving you a precise and actionable picture of your progress." },
];

function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" style={{ scrollMarginTop: 80 }}>
      <div className="section-padding" style={{ maxWidth: 1180, margin: "0 auto", padding: "80px 32px" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <SectionEyebrow center>Frequently Asked Questions</SectionEyebrow>
          <h2 className="section-title" style={{ fontFamily: "Fraunces, serif", fontSize: "2.4rem", fontWeight: 700, lineHeight: 1.18, margin: "0 auto 14px" }}>Common <span style={{ color: T.teal }}>Questions</span></h2>
          <p style={{ color: T.slate, fontSize: "1.02rem", maxWidth: 500, margin: "0 auto" }}>
            Answers to the questions most frequently asked by candidates before beginning their preparation.
          </p>
        </div>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          {FAQ_DATA.map((item, i) => (
            <div key={i} className="faq-item" style={{ borderBottom: `1px solid ${T.line}`, borderTop: i === 0 ? `1px solid ${T.line}` : "none" }}>
              <button onClick={() => setOpen(open === i ? -1 : i)} style={{
                width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer",
                padding: "22px 4px", display: "flex", justifyContent: "space-between", alignItems: "center",
                fontFamily: "Fraunces, serif", fontSize: "1.08rem", fontWeight: 500, color: T.ink,
              }}>
                <span className="faq-question">{item.q}</span>
                <span style={{
                  fontFamily: "IBM Plex Mono, monospace", fontSize: "1.2rem", color: T.teal,
                  transition: "transform .2s", display: "inline-block",
                  transform: open === i ? "rotate(45deg)" : "none",
                  flexShrink: 0, marginLeft: 16,
                }}>+</span>
              </button>
              {open === i && (
                <p style={{ color: T.slate, padding: "0 4px 22px", fontSize: "0.95rem", maxWidth: 620, margin: 0, lineHeight: 1.7 }}>
                  {item.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Pillar Card ──────────────────────────────────────────────────
function PillarCard({ iconPaths, accent, accentBg, title, body }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="pillar-card"
      style={{
        background: T.surface,
        border: `1px solid ${hov ? accent : T.line}`,
        borderRadius: T.radius,
        padding: "32px 28px",
        cursor: "default",
        transition: "border-color .2s, box-shadow .2s, transform .2s",
        transform: hov ? "translateY(-4px)" : "none",
        boxShadow: hov ? `0 8px 24px rgba(0,0,0,0.35)` : "none",
      }}>
      <div style={{
        width: 48, height: 48, borderRadius: 10,
        background: hov ? accentBg : "rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 18, transition: "background .2s",
      }}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
          stroke={hov ? accent : T.slate} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {iconPaths}
        </svg>
      </div>
      <div style={{ width: hov ? 48 : 32, height: 3, background: hov ? accent : T.line, borderRadius: 2, marginBottom: 14, transition: "background .2s, width .2s" }} />
      <h3 style={{ fontFamily: "Fraunces, serif", fontSize: "1.08rem", fontWeight: 600, marginBottom: 10, color: T.ink }}>{title}</h3>
      <p style={{ fontSize: "0.9rem", color: T.slate, lineHeight: 1.65 }}>{body}</p>
    </div>
  );
}

// ── Testimonial Card ────────────────────────────────────────────
function TestimonialCard({ text, name, role }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? "#101A2E" : T.surface,
        border: `1px solid ${hov ? T.teal : T.line}`,
        borderRadius: T.radius, padding: "30px 28px",
        display: "flex", flexDirection: "column", gap: 18,
        transition: "all .2s",
        transform: hov ? "translateY(-3px)" : "none",
        boxShadow: hov ? `0 6px 20px rgba(0,0,0,0.4)` : "none",
        cursor: "default",
      }}>
      <div style={{ fontFamily: "Fraunces, serif", fontSize: "2.4rem", color: T.teal, lineHeight: 1 }}>"</div>
      <p style={{ fontSize: "0.98rem", color: T.ink, flex: 1, lineHeight: 1.7 }}>{text}</p>
      <div style={{ borderTop: `1px solid ${T.line}`, paddingTop: 14 }}>
        <div style={{ fontWeight: 600, fontSize: "0.92rem" }}>{name}</div>
        <div style={{ fontSize: "0.82rem", color: T.slate, marginTop: 2 }}>{role}</div>
      </div>
    </div>
  );
}

// ── NavLink ────────────────────────────────────────────────────
function NavLink({ href, children, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <a href={href} onClick={onClick} style={{ 
      color: hov ? T.ink : T.slate, 
      textDecoration: "none", 
      fontSize: "0.92rem", 
      transition: "color .15s",
      cursor: "pointer",
      padding: "4px 0",
    }}
      onMouseEnter={() => setHov(true)} 
      onMouseLeave={() => setHov(false)}>
      {children}
    </a>
  );
}

// ── Main export ────────────────────────────────────────────────
export default function MedPrepAI() {
  const [activeTab, setActiveTab] = useState("fcps");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavExam = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    setTimeout(() => {
      document.getElementById("programs")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'Inter', sans-serif; background: ${T.paper}; color: ${T.ink}; -webkit-font-smoothing: antialiased; }
        h1, h2, h3 { font-family: 'Fraunces', serif; font-weight: 600; letter-spacing: -0.01em; color: ${T.ink}; }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: .25; } }
        
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-toggle { display: flex !important; }
          .mobile-menu-overlay { display: block !important; }
          .hero-title { font-size: 2.2rem !important; }
          .hero-subtitle { font-size: 1rem !important; }
          .section-title { font-size: 1.8rem !important; }
          .grid-2col { grid-template-columns: 1fr !important; }
          .grid-3col { grid-template-columns: 1fr !important; }
          .feature-strip { flex-direction: column !important; }
          .feature-item { border-right: none !important; border-bottom: 1px solid ${T.line} !important; }
          .feature-item:last-child { border-bottom: none !important; }
          .program-tabs-hero { grid-template-columns: 1fr !important; padding: 32px 24px !important; gap: 32px !important; }
          .program-stats { grid-template-columns: 1fr 1fr !important; gap: 12px !important; }
          .stat-item { padding: 16px !important; }
          .stat-number { font-size: 1.6rem !important; }
          .pillar-grid { grid-template-columns: 1fr 1fr !important; gap: 16px !important; }
          .pillar-card { padding: 24px 20px !important; }
          .footer-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          .hero-stats { flex-wrap: wrap !important; }
          .hero-stat { flex: 1 1 45% !important; border-right: none !important; border-bottom: 1px solid ${T.line} !important; }
          .hero-stat:last-child { border-bottom: none !important; }
          .cta-buttons { flex-direction: column !important; align-items: center !important; width: 100% !important; }
          .cta-buttons .btn { width: 100% !important; max-width: 300px !important; }
          .tab-switcher { width: 100% !important; }
          .tab-switcher > div { flex-direction: column !important; width: 100% !important; }
          .tab-switcher button { border-right: none !important; border-bottom: 1px solid ${T.line} !important; }
          .tab-switcher button:last-child { border-bottom: none !important; }
          .faq-item { padding: 16px 0 !important; }
          .faq-question { font-size: 0.95rem !important; }
          .section-padding { padding: 60px 20px !important; }
          .hero-padding { padding: 60px 0 40px !important; }
          .hero-stat-number { font-size: 1.4rem !important; }
        }
        
        @media (max-width: 480px) {
          .hero-title { font-size: 1.8rem !important; }
          .section-title { font-size: 1.5rem !important; }
          .pillar-grid { grid-template-columns: 1fr !important; }
          .program-stats { grid-template-columns: 1fr 1fr !important; }
          .hero-stat { flex: 1 1 100% !important; }
          .stat-number { font-size: 1.4rem !important; }
        }
        
        @media (min-width: 769px) {
          .nav-mobile-toggle { display: none !important; }
          .nav-desktop { display: flex !important; }
          .mobile-menu-overlay { display: none !important; }
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(2,6,23,0.92)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${T.line}` }}>
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 1180, margin: "0 auto", padding: "18px 32px" }}>
          <a href="#home" style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: "1.15rem", color: T.ink, textDecoration: "none" }}>
            <LogoBadge size={32} /> MedPrepAI
          </a>
          
          {/* Desktop Navigation */}
          <div className="nav-desktop" style={{ display: "flex", gap: 28, fontSize: "0.92rem", alignItems: "center" }}>
            <NavLink href="#home">Home</NavLink>
            <button onClick={() => handleNavExam("fcps")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "0.92rem", color: T.slate, padding: 0 }}
              onMouseEnter={e => e.target.style.color = T.ink}
              onMouseLeave={e => e.target.style.color = T.slate}>
              FCPS-1
            </button>
            <button onClick={() => handleNavExam("jcat")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "0.92rem", color: T.slate, padding: 0 }}
              onMouseEnter={e => e.target.style.color = T.ink}
              onMouseLeave={e => e.target.style.color = T.slate}>
              JCAT (MDMS)
            </button>
            <NavLink href="#how-it-works">How It Works</NavLink>
            <NavLink href="#faq">FAQ</NavLink>
          </div>

          {/* Desktop Right Buttons */}
          <div className="nav-desktop" style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <a href="#" style={{ fontSize: "0.92rem", color: T.slate, textDecoration: "none" }}>Log In</a>
            <Btn variant="primary">Start Free Trial</Btn>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="nav-mobile-toggle" 
            onClick={toggleMobileMenu}
            style={{ 
              background: "none", 
              border: "none", 
              cursor: "pointer", 
              color: T.ink,
              display: "none",
              padding: "4px",
            }}>
            {mobileMenuOpen ? Icon.close : Icon.menu}
          </button>
        </nav>

        {/* Mobile Menu Overlay - FIXED: Now always visible on mobile when open */}
        {mobileMenuOpen && (
          <div className="mobile-menu-overlay" style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "rgba(2,6,23,0.98)",
            backdropFilter: "blur(10px)",
            borderBottom: `1px solid ${T.line}`,
            padding: "20px 32px",
            display: "block",
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <NavLink href="#home" onClick={closeMobileMenu}>Home</NavLink>
              <button onClick={() => handleNavExam("fcps")} style={{ 
                background: "none", 
                border: "none", 
                cursor: "pointer", 
                fontFamily: "inherit", 
                fontSize: "0.92rem", 
                color: T.slate, 
                padding: 0, 
                textAlign: "left" 
              }}>
                FCPS-1
              </button>
              <button onClick={() => handleNavExam("jcat")} style={{ 
                background: "none", 
                border: "none", 
                cursor: "pointer", 
                fontFamily: "inherit", 
                fontSize: "0.92rem", 
                color: T.slate, 
                padding: 0, 
                textAlign: "left" 
              }}>
                JCAT (MDMS)
              </button>
              <NavLink href="#how-it-works" onClick={closeMobileMenu}>How It Works</NavLink>
              <NavLink href="#faq" onClick={closeMobileMenu}>FAQ</NavLink>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
                <a href="#" style={{ fontSize: "0.92rem", color: T.slate, textDecoration: "none" }}>Log In</a>
                <Btn variant="primary" fullWidth>Start Free Trial</Btn>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section id="home" className="hero-padding" style={{ padding: "100px 0 80px", textAlign: "center" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 32px" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            fontFamily: "IBM Plex Mono, monospace", fontSize: "0.78rem", letterSpacing: "0.04em",
            color: T.gold, background: "rgba(16,185,129,0.08)", border: `1px solid ${T.teal}`,
            padding: "6px 14px", borderRadius: 100, marginBottom: 28,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.gold, display: "inline-block" }} />
            Postgraduate Medical Examination Preparation
          </span>
          <h1 className="hero-title" style={{ fontFamily: "Fraunces, serif", fontSize: "3.6rem", lineHeight: 1.06, marginBottom: 24, maxWidth: 760, margin: "0 auto 24px" }}>
            Transforming Dedication into Clinical Excellence
          </h1>
          <p className="hero-subtitle" style={{ fontSize: "1.15rem", color: T.slate, maxWidth: 560, margin: "0 auto 40px", lineHeight: 1.7 }}>
            A comprehensive preparation platform combining scenario-based question banks, every-option explanations, and advanced performance analytics — designed for FCPS-1 and JCAT (MDMS) candidates across Pakistan.
          </p>
          <div className="cta-buttons" style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 60 }}>
            <Btn variant="primary" size="lg" onClick={() => handleNavExam("fcps")}>Begin FCPS-1 Preparation</Btn>
            <Btn variant="ghost" size="lg" onClick={() => handleNavExam("jcat")}>Begin JCAT (MDMS) Preparation</Btn>
          </div>
          
          <div className="hero-stats" style={{ display: "flex", gap: 0, justifyContent: "center", border: `1px solid ${T.line}`, borderRadius: T.radius, overflow: "hidden", maxWidth: 760, margin: "0 auto" }}>
            {[
              { num: "6,000+", label: "Examination-Level Questions" },
              { num: "100%", label: "Options Explained" },
              { num: "2", label: "Examination Tracks" },
              { num: "Live", label: "Performance Analytics" },
            ].map(({ num, label }, i) => (
              <div key={label} className="hero-stat" style={{ flex: 1, padding: "24px 20px", background: T.surface, borderRight: i < 3 ? `1px solid ${T.line}` : "none", textAlign: "center" }}>
                <div className="hero-stat-number" style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: "1.6rem", fontWeight: 500, color: T.teal, lineHeight: 1 }}>{num}</div>
                <div style={{ fontSize: "0.8rem", color: T.slate, marginTop: 6 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VISUAL PANEL 1 ── */}
      <section>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 32px 80px" }}>
          <div className="grid-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
            <div>
              <SectionEyebrow>Real Clinical Encounters</SectionEyebrow>
              <h2 style={{ fontFamily: "Fraunces, serif", fontSize: "2rem", fontWeight: 700, lineHeight: 1.2, marginBottom: 16 }}>
                Practice with <span style={{ color: T.teal }}>Virtual Patients</span>, Not Just Flashcards
              </h2>
              <p style={{ color: T.slate, fontSize: "1.02rem", lineHeight: 1.75 }}>
                Step into a simulated consultation, work through history-taking and examination, and receive feedback that mirrors what a real attending would expect — bridging the gap between exam preparation and clinical confidence.
              </p>
            </div>
            <div style={{ borderRadius: T.radius, overflow: "hidden", border: `1px solid ${T.line}` }}>
              <img src={doctorPatientImg} alt="Clinician reviewing a virtual patient encounter on screen" style={{ width: "100%", display: "block", maxHeight: 420, objectFit: "cover" }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── MISSION STRIP ── */}
      <div style={{ borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}`, padding: "44px 0" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 32px", textAlign: "center" }}>
          <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: "0.8rem", fontWeight: 700, color: T.teal, letterSpacing: "0.06em", display: "block", marginBottom: 16 }}>OUR MISSION</span>
          <p style={{ fontSize: "1.08rem", fontWeight: 600, color: T.ink, maxWidth: 820, lineHeight: 1.8, margin: "0 auto" }}>
            We believe that success extends far beyond passing an examination. Our mission is to develop competent, knowledgeable, and confident healthcare professionals through a strong foundation in medical sciences and clinical reasoning — building clinicians who are prepared not only for their examinations, but for the demands of patient care.
          </p>
        </div>
      </div>

      {/* ── WHAT SETS US APART ── */}
      <section id="why-us" style={{ background: T.surface, scrollMarginTop: 80 }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "80px 32px" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <SectionEyebrow center>Our Distinction</SectionEyebrow>
            <h2 className="section-title" style={{ fontFamily: "Fraunces, serif", fontSize: "2.4rem", fontWeight: 700, lineHeight: 1.18, margin: "0 auto 14px", maxWidth: 640 }}>
              What Sets <span style={{ color: T.teal }}>MedPrepAI</span> Apart
            </h2>
            <p style={{ color: T.slate, fontSize: "1.02rem", maxWidth: 560, margin: "0 auto" }}>
              Every feature of MedPrepAI has been designed with a single purpose: to close the gap between examination performance and real clinical readiness.
            </p>
          </div>

          <div className="pillar-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, marginBottom: 40 }}>
            {PILLAR_CARDS.map(({ iconPaths, accent, accentBg, title, body }) => (
              <PillarCard key={title} iconPaths={iconPaths} accent={accent} accentBg={accentBg} title={title} body={body} />
            ))}
          </div>

          <div className="grid-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
            <div style={{ borderRadius: T.radius, overflow: "hidden", border: `1px solid ${T.line}` }}>
              <img src={teamCollabImg} alt="Medical team reviewing AI-driven clinical insights together" style={{ width: "100%", display: "block", maxHeight: 420, objectFit: "cover" }} />
            </div>
            <div>
              <SectionEyebrow>Collaborative By Design</SectionEyebrow>
              <h3 style={{ fontFamily: "Fraunces, serif", fontSize: "1.8rem", fontWeight: 700, lineHeight: 1.2, marginBottom: 16 }}>
                Faculty and Candidates, <span style={{ color: T.teal }}>Working From the Same Data</span>
              </h3>
              <p style={{ color: T.slate, fontSize: "1.02rem", lineHeight: 1.75 }}>
                Every explanation, score, and trend is visible to both sides — so coaching conversations are grounded in the same evidence candidates see when they review their own performance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROGRAM TABS ── */}
      <ProgramTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* ── SEE IT IN ACTION ── */}
      <section>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "80px 32px" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <SectionEyebrow center>See It In Action</SectionEyebrow>
            <h2 className="section-title" style={{ fontFamily: "Fraunces, serif", fontSize: "2.2rem", fontWeight: 700, lineHeight: 1.18, margin: "0 auto 14px", maxWidth: 620 }}>
              Every Option, <span style={{ color: T.teal }}>Explained In Full</span>
            </h2>
            <p style={{ color: T.slate, fontSize: "1.02rem", maxWidth: 560, margin: "0 auto" }}>
              A real question from the bank — keywords highlighted in the stem, and a full breakdown of why each option is correct or incorrect.
            </p>
          </div>
          <div style={{ borderRadius: T.radius, overflow: "hidden", border: `1px solid ${T.line}`, boxShadow: "0 8px 28px rgba(14,26,23,0.08)" }}>
            <img src={examInterfaceImg} alt="Exam-style question interface with full answer breakdown" style={{ width: "100%", display: "block" }} />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ background: T.surface, scrollMarginTop: 80 }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "80px 32px" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <SectionEyebrow center>Preparation Workflow</SectionEyebrow>
            <h2 className="section-title" style={{ fontFamily: "Fraunces, serif", fontSize: "2.4rem", fontWeight: 700, lineHeight: 1.18, margin: "0 auto 14px" }}>How <span style={{ color: T.teal }}>MedPrepAI</span> Works</h2>
            <p style={{ color: T.slate, fontSize: "1.02rem", maxWidth: 500, margin: "0 auto" }}>
              A clear, structured path from your first login to confident examination performance.
            </p>
          </div>
          <div className="grid-4col" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}>
            {[
              { n: "01", title: "Create Your Account", body: "Register and select your examination track — FCPS-1 or JCAT (MDMS) — to begin your personalised preparation." },
              { n: "02", title: "Practice Questions", body: "Work through scenario-based MCQs with every option explained at real examination difficulty." },
              { n: "03", title: "Review Explanations", body: "Study the detailed reasoning behind every correct and incorrect answer to reinforce clinical understanding." },
              { n: "04", title: "Monitor Your Progress", body: "Use live dashboards and analytics to identify performance trends, weak areas, and measurable improvement." },
            ].map(({ n, title, body }, i) => (
              <div key={n} style={{ padding: "0 26px 0 0", borderRight: i < 3 ? `1px dashed ${T.line}` : "none" }}>
                <div style={{ fontFamily: "IBM Plex Mono, monospace", color: T.teal, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  {n}<span style={{ height: 1, flex: 1, background: T.line }} />
                </div>
                <h3 style={{ fontFamily: "Fraunces, serif", fontSize: "1.1rem", marginBottom: 8 }}>{title}</h3>
                <p style={{ color: T.slate, fontSize: "0.92rem", lineHeight: 1.6 }}>{body}</p>
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
            <h2 className="section-title" style={{ fontFamily: "Fraunces, serif", fontSize: "2.4rem", lineHeight: 1.18, margin: "0 auto 14px" }}>
              Trusted by FCPS and JCAT Candidates
            </h2>
            <p style={{ color: T.slate, fontSize: "1.02rem", maxWidth: 480, margin: "0 auto" }}>
              Postgraduate candidates across Pakistan rely on MedPrepAI to prepare with confidence and precision.
            </p>
          </div>
          <div className="grid-3col" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {[
              { text: "The every-option-explained approach fundamentally changed how I study. I now understand why incorrect answers are wrong, not merely which answer to select.", name: "FCPS-1 Candidate", role: "Medicine, Batch 2025" },
              { text: "The scenario-based question bank closely replicates the actual JCAT examination experience. My confidence increased significantly after just a few weeks of structured practice.", name: "JCAT (MDMS) Candidate", role: "Medicine & Allied, 2025" },
              { text: "The performance analytics helped me identify my weakest subjects early in my preparation. I was able to direct my revision toward the areas that required the most attention.", name: "Postgraduate Trainee", role: "Internal Medicine" },
            ].map(({ text, name, role }) => (
              <TestimonialCard key={name} text={text} name={name} role={role} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ background: T.surface, textAlign: "center" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "80px 32px" }}>
          <h2 className="section-title" style={{ fontFamily: "Fraunces, serif", fontSize: "2.4rem", maxWidth: 640, margin: "0 auto 16px" }}>
            Ready to Begin Your Examination Preparation?
          </h2>
          <p style={{ color: T.slate, maxWidth: 500, margin: "0 auto 36px", fontSize: "1.02rem", lineHeight: 1.7 }}>
            Join candidates across Pakistan who are preparing for FCPS-1 and JCAT (MDMS) with MedPrepAI — where every option is explained.
          </p>
          <div className="cta-buttons" style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Btn variant="primary" size="lg" onClick={() => handleNavExam("fcps")}>Begin FCPS-1 Preparation</Btn>
            <Btn variant="ghost" size="lg" onClick={() => handleNavExam("jcat")}>Begin JCAT (MDMS) Preparation</Btn>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <FAQ />

      {/* ── FOOTER ── */}
      <footer style={{ background: T.paper, color: "#C9D4CF", padding: "64px 0 32px", borderTop: `1px solid ${T.line}` }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 32px" }}>
          <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 40, marginBottom: 48 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "Fraunces, serif", fontWeight: 600, color: "#fff", fontSize: "1.1rem", marginBottom: 14 }}>
                <LogoBadge size={28} />
                MedPrepAI
              </div>
              <p style={{ fontSize: "0.9rem", maxWidth: 340, color: "#9CB8AE", lineHeight: 1.7 }}>
                Postgraduate medical examination preparation for FCPS-1 and JCAT (MDMS). Every option explained. Built for clinical excellence.
              </p>
            </div>
            <div>
              <h4 style={{ color: "#fff", fontFamily: "IBM Plex Mono, monospace", fontSize: "0.78rem", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 16, fontWeight: 500 }}>Examination Tracks</h4>
              <ul style={{ listStyle: "none" }}>
                {[["FCPS-1 (Medicine & Allied)", "fcps"], ["JCAT (MDMS) (Medicine & Allied)", "jcat"]].map(([label, id]) => (
                  <li key={label} style={{ marginBottom: 10, fontSize: "0.92rem" }}>
                    <button onClick={() => handleNavExam(id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#C9D4CF", fontFamily: "inherit", fontSize: "0.92rem", padding: 0, textAlign: "left" }}>{label}</button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 style={{ color: "#fff", fontFamily: "IBM Plex Mono, monospace", fontSize: "0.78rem", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 16, fontWeight: 500 }}>Account</h4>
              <ul style={{ listStyle: "none" }}>
                {[["Log In", "#"], ["Sign Up", "#"], ["FAQ", "#faq"]].map(([label, href]) => (
                  <li key={label} style={{ marginBottom: 10, fontSize: "0.92rem" }}>
                    <a href={href} style={{ color: "#C9D4CF", textDecoration: "none" }}>{label}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: 24, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, fontSize: "0.82rem", color: "#7E948C" }}>
            <span>© 2026 MedPrepAI. All rights reserved.</span>
            <span>Trusted for FCPS-1 & JCAT Preparation · Pakistan</span>
          </div>
        </div>
      </footer>
    </>
  );
}