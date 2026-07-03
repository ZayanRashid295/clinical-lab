"use client";

import { useState, useRef, type ReactNode } from "react";
import { Container, SectionHeader, LANDING_V2_CSS, sectionPad } from "./landing-v2-layout";
import { MarketingThemeToggle } from "../marketing/marketing-theme";

const examInterfaceImg = "/images/landing-v2/exam-interface-screenshot.jpeg";
const teamCollabImg = "/images/landing-v2/team-ai-collaboration.png";
const facultyAnalyticsImg = "/images/landing-v2/faculty-analytics-dashboard.png";
const logoIcon = "/images/landing-v2/logo-icon.png";

export type ExamTrack = "fcps" | "jcat";

export interface MedPrepLandingActions {
  onLogin: () => void;
  onSignup: () => void;
  onStartTrial: () => void;
  onBeginProgram: (program: ExamTrack, intent: "explore" | "start") => void;
  onViewSampleQuestions: () => void;
  isAuthenticated: boolean;
  primaryCtaLabel: string;
  loginLabel: string;
}

// ── Design tokens (theme-aware via marketing CSS variables) ─────
const T = {
  ink: "var(--mkt-text)",
  paper: "var(--mkt-bg)",
  surface: "var(--mkt-bg-elevated)",
  teal: "var(--mkt-accent)",
  tealDeep: "var(--mkt-accent-hover)",
  gold: "var(--mkt-accent-muted)",
  slate: "var(--mkt-text-muted)",
  line: "var(--mkt-border)",
  radius: "8px",
};

// ── Logo badge ──────────────────────────────────────────────────
function LogoBadge({ size = 34 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.26,
      background: "var(--mkt-accent)", display: "flex", alignItems: "center", justifyContent: "center",
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
function Btn({
  variant = "primary",
  size = "md",
  children,
  onClick,
  href,
  style,
  fullWidth,
}: {
  variant?: "primary" | "gold" | "ghost" | "ghostDark";
  size?: "md" | "lg";
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  style?: React.CSSProperties;
  fullWidth?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    gap: 8, borderRadius: 6, fontWeight: 500, cursor: "pointer",
    border: "none", transition: "background .15s ease, border-color .15s ease",
    textDecoration: "none", fontFamily: "inherit",
    padding: size === "lg" ? "12px 24px" : "10px 20px",
    fontSize: size === "lg" ? "1rem" : "0.9375rem",
    width: fullWidth ? "100%" : "auto",
  };
  const variants = {
    primary: {
      background: hovered ? T.tealDeep : T.teal,
      color: "#fff",
      boxShadow: "none",
    },
    gold: {
      background: hovered ? T.tealDeep : T.teal,
      color: "#fff",
      boxShadow: "none",
    },
    ghost: {
      background: "transparent",
      color: T.ink,
      border: `1px solid ${hovered ? T.teal : T.line}`,
    },
    ghostDark: {
      background: hovered ? "var(--mkt-accent-soft)" : "transparent",
      color: "var(--mkt-text)",
      border: "1px solid var(--mkt-border)",
    },
  };
  const combined = { ...base, ...variants[variant], ...style };
  const props = { style: combined, onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false) };
  return href
    ? <a href={href} {...props}>{children}</a>
    : <button onClick={onClick} {...props}>{children}</button>;
}

function SectionKicker({ children, center }: { children: ReactNode; center?: boolean }) {
  return (
    <span className={`lp-kicker${center ? " lp-kicker--center" : ""}`}>{children}</span>
  );
}

// ── Feature item ───────────────────────────────────────────────
function FeatItem({
  icon,
  title,
  desc,
  last,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
  last?: boolean;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="feature-item"
      style={{
        padding: "26px 22px",
        background: hov ? "var(--mkt-card-hover)" : T.surface,
        borderRight: last ? "none" : `1px solid ${T.line}`,
        display: "flex", flexDirection: "column", gap: 10, minWidth: 0,
        transition: "background .2s",
        cursor: "default",
      }}>
      <div style={{ width: 40, height: 40, borderRadius: 8, background: hov ? "var(--mkt-accent-soft)" : "var(--mkt-badge-bg)", display: "flex", alignItems: "center", justifyContent: "center", transition: "background .2s" }}>{icon}</div>
      <h4>{title}</h4>
      <p>{desc}</p>
    </div>
  );
}

// ── Program Stat Grid ──────────────────────────────────────────
function ProgramStats({ stats }: { stats: Array<{ big: string; label: string }> }) {
  return (
    <div className="program-stats" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {stats.map(({ big, label }) => (
        <div key={label} className="stat-item" style={{
          background: "var(--mkt-stat-bg)", border: "1px solid var(--mkt-stat-border)",
          borderRadius: 10, padding: "22px 20px",
        }}>
          <div className="lp-stat-num">{big}</div>
          <div className="lp-stat-label">{label}</div>
        </div>
      ))}
    </div>
  );
}

// ── DATA ───────────────────────────────────────────────────────
const TABS: Array<{ id: ExamTrack; label: string; sub: string }> = [
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
    title: "Structured & exam-oriented preparation",
    body: "Questions reflect the difficulty and format of FCPS-1 and JCAT, so practice sessions feel like the real exam.",
  },
  {
    iconPaths: <><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></>,
    title: "Every answer option explained",
    body: "Each MCQ includes reasoning for every option, not just the correct one.",
  },
  {
    iconPaths: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></>,
    title: "Clinical reasoning at the core",
    body: "Scenario-based items build the thinking you need in exams and on the wards.",
  },
  {
    iconPaths: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></>,
    title: "Performance analytics",
    body: "Subject breakdowns, timing data, and trends show where to focus revision.",
  },
];

// ── Program Tabs Section ───────────────────────────────────────
function ProgramTabs({
  activeTab,
  setActiveTab,
  onBeginProgram,
  onViewSampleQuestions,
}: {
  activeTab: ExamTrack;
  setActiveTab: (tab: ExamTrack) => void;
  onBeginProgram: (program: ExamTrack, intent: "explore" | "start") => void;
  onViewSampleQuestions: () => void;
}) {
  const tab = TABS.find((t) => t.id === activeTab) ?? TABS[0];
  const sectionRef = useRef(null);

  const descriptions = {
    fcps: "Thousands of postgraduate candidates rely on our platform for focused, high-yield FCPS-1 preparation. We combine a rigorous question bank with in-depth explanations to develop lasting clinical knowledge and exam confidence.",
    jcat: "Our JCAT (MDMS)-specific preparation is purpose-built for the unique demands of the MDMS entrance examination, featuring scenario-intensive questions and comprehensive explanations that strengthen both exam performance and clinical judgement.",
  };
  const headlines = {
    fcps: "FCPS-1 preparation",
    jcat: "JCAT (MDMS) preparation",
  };
  const startLabels = {
    fcps: "Begin FCPS-1 Preparation",
    jcat: "Begin JCAT (MDMS) Preparation",
  };

  return (
    <section id="programs" ref={sectionRef} style={{ scrollMarginTop: 80 }}>
      <Container style={sectionPad}>

        <SectionHeader>
          <SectionKicker>Examination tracks</SectionKicker>
          <h2 className="lp-section-title lp-section-title--lg">
            Choose your exam
          </h2>
          <p className="lp-section-lead">
            FCPS-1 and JCAT (MDMS) tracks with scenario-based questions, full explanations, and performance tracking.
          </p>
        </SectionHeader>

        <div className="tab-switcher" style={{ marginBottom: 40 }}>
          <div className="tab-switcher-inner">
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
                  <span style={{ fontWeight: 600, fontSize: "1rem" }}>{t.label}</span>
                  <span style={{ fontSize: "0.9375rem", opacity: 0.85 }}>{t.sub}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="program-tabs-hero" style={{ background: T.paper, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: "clamp(2rem, 5vw, 4rem)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(2rem, 4vw, 3.5rem)", alignItems: "center" }}>
          <div>
            <p className="lp-kicker">{tab.label} · Medicine & Allied</p>
            <h2 className="lp-block-title" style={{ fontSize: "1.5rem", marginBottom: 10 }}>
              {headlines[activeTab]}
            </h2>
            <p className="lp-body-lg" style={{ marginBottom: 28 }}>
              {descriptions[activeTab]}
            </p>
            <div className="cta-buttons" style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Btn variant="gold" size="lg" onClick={() => onBeginProgram(activeTab, "start")}>
                {startLabels[activeTab]}
              </Btn>
              <Btn variant="ghostDark" size="lg" onClick={onViewSampleQuestions}>
                View Sample Questions
              </Btn>
            </div>
          </div>
          <ProgramStats stats={PROGRAM_STATS} />
        </div>

        <div style={{ marginTop: 48 }}>
          <SectionHeader align="left">
            <SectionKicker>In the question bank</SectionKicker>
            <h2 className="lp-section-title">
              Built into every question
            </h2>
            <p className="lp-section-lead">
              What you get with each {tab.label} item.
            </p>
          </SectionHeader>
          <div className="feature-strip">
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

        <div className="lp-grid-2" style={{ marginTop: 48 }}>
          <div>
            <SectionKicker>Analytics</SectionKicker>
            <h3 className="lp-block-title">
              See where you stand
            </h3>
            <p className="lp-body-lg">
              Subject-wise breakdowns, time-per-question data, and trend lines turn raw scores into a clear revision plan — built on the same analytics faculty use to track cohort progress.
            </p>
          </div>
          <div className="lp-image-frame">
            <img src={facultyAnalyticsImg} alt="Faculty reviewing student performance analytics on a dashboard" />
          </div>
        </div>

      </Container>
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
      <Container style={sectionPad}>
        <SectionHeader>
          <SectionKicker>FAQ</SectionKicker>
          <h2 className="lp-section-title">Common questions</h2>
          <p className="lp-section-lead">
            Before you start preparing.
          </p>
        </SectionHeader>
        <div className="lp-faq">
          {FAQ_DATA.map((item, i) => (
            <div key={i} className="faq-item" style={{ borderBottom: `1px solid ${T.line}`, borderTop: i === 0 ? `1px solid ${T.line}` : "none" }}>
              <button onClick={() => setOpen(open === i ? -1 : i)} style={{
                width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer",
                padding: "18px 4px", display: "flex", justifyContent: "space-between", alignItems: "center",
                fontSize: "1.0625rem", fontWeight: 600, color: T.ink,
              }}>
                <span className="faq-question">{item.q}</span>
                <span style={{
                  fontSize: "1.25rem", fontWeight: 400, color: T.slate,
                  transition: "transform .2s", display: "inline-block",
                  transform: open === i ? "rotate(45deg)" : "none",
                  flexShrink: 0, marginLeft: 16,
                }}>+</span>
              </button>
              {open === i && (
                <p className="lp-body-lg" style={{ padding: "0 4px 22px", margin: 0 }}>
                  {item.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

// ── Pillar Card ──────────────────────────────────────────────────
function PillarCard({
  iconPaths,
  title,
  body,
}: {
  iconPaths: ReactNode;
  title: string;
  body: string;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="pillar-card lp-pillar-card"
      style={{
        background: T.surface,
        border: `1px solid ${hov ? T.teal : T.line}`,
        borderRadius: T.radius,
        padding: "1.25rem 1.125rem",
        cursor: "default",
        transition: "border-color .15s ease",
      }}>
      <div style={{
        width: 40, height: 40, borderRadius: 6,
        background: hov ? "var(--mkt-accent-soft)" : "var(--mkt-stat-bg)",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 14, transition: "background .15s ease",
      }}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
          stroke={hov ? T.teal : T.slate} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {iconPaths}
        </svg>
      </div>
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}

// ── Testimonial Card ────────────────────────────────────────────
function TestimonialCard({
  text,
  name,
  role,
}: {
  text: string;
  name: string;
  role: string;
}) {
  return (
    <div
      style={{
        background: T.surface,
        border: `1px solid ${T.line}`,
        borderRadius: T.radius,
        padding: "1.25rem 1.125rem",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}>
      <p style={{ fontSize: "1rem", color: T.ink, flex: 1, lineHeight: 1.6 }}>{text}</p>
      <div style={{ borderTop: `1px solid ${T.line}`, paddingTop: 12 }}>
        <div style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{name}</div>
        <div style={{ fontSize: "0.875rem", color: T.slate, marginTop: 2 }}>{role}</div>
      </div>
    </div>
  );
}

// ── NavLink ────────────────────────────────────────────────────
function NavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <a href={href} onClick={onClick} style={{ 
      color: hov ? T.ink : T.slate, 
      textDecoration: "none", 
      fontSize: "1rem", 
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
export function MedPrepAILanding({ actions }: { actions: MedPrepLandingActions }) {
  const [activeTab, setActiveTab] = useState<ExamTrack>("fcps");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavExam = (tabId: ExamTrack) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    actions.onBeginProgram(tabId, "explore");
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
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: var(--mkt-bg); color: var(--mkt-text); }
        ${LANDING_V2_CSS}
      `}</style>

      {/* ── NAVBAR ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "var(--mkt-header-bg)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${T.line}` }}>
        <Container style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 18, paddingBottom: 18 }}>
          <a href="#home" style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 600, fontSize: "1.0625rem", color: T.ink, textDecoration: "none" }}>
            <LogoBadge size={32} /> MedPrepAI
          </a>
          
          {/* Desktop Navigation */}
          <div className="nav-desktop" style={{ display: "flex", gap: 28, fontSize: "1rem", alignItems: "center" }}>
            <NavLink href="#home">Home</NavLink>
            <button onClick={() => handleNavExam("fcps")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "1rem", color: T.slate, padding: 0 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = T.ink; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = T.slate; }}>
              FCPS-1
            </button>
            <button onClick={() => handleNavExam("jcat")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "1rem", color: T.slate, padding: 0 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = T.ink; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = T.slate; }}>
              JCAT (MDMS)
            </button>
            <NavLink href="#how-it-works">How It Works</NavLink>
            <NavLink href="#faq">FAQ</NavLink>
          </div>

          {/* Desktop Right Buttons */}
          <div className="nav-desktop" style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <MarketingThemeToggle />
            <Btn variant="primary" onClick={actions.onLogin}>{actions.primaryCtaLabel}</Btn>
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
        </Container>

        {/* Mobile Menu Overlay - FIXED: Now always visible on mobile when open */}
        {mobileMenuOpen && (
          <div className="mobile-menu-overlay" style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "var(--mkt-overlay-bg)",
            backdropFilter: "blur(10px)",
            borderBottom: `1px solid ${T.line}`,
            padding: "20px 0",
            display: "block",
          }}>
            <Container>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <NavLink href="#home" onClick={closeMobileMenu}>Home</NavLink>
              <button onClick={() => handleNavExam("fcps")} style={{ 
                background: "none", 
                border: "none", 
                cursor: "pointer", 
                fontFamily: "inherit", 
                fontSize: "1rem", 
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
                fontSize: "1rem", 
                color: T.slate, 
                padding: 0, 
                textAlign: "left" 
              }}>
                JCAT (MDMS)
              </button>
              <NavLink href="#how-it-works" onClick={closeMobileMenu}>How It Works</NavLink>
              <NavLink href="#faq" onClick={closeMobileMenu}>FAQ</NavLink>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <MarketingThemeToggle />
                </div>
                <Btn variant="primary" fullWidth onClick={() => { actions.onLogin(); closeMobileMenu(); }}>
                  {actions.primaryCtaLabel}
                </Btn>
              </div>
            </div>
            </Container>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section id="home" className="lp-hero">
        <Container>
          <div className="lp-hero-layout">
          <div className="lp-hero-copy">
            <p className="lp-hero-kicker">FCPS-1 & JCAT (MDMS) · Medicine & Allied</p>
            <h1 className="lp-hero-title">
              Exam prep with every option explained
            </h1>
            <p className="lp-hero-subtitle">
              Scenario-based questions, full answer breakdowns, and analytics for postgraduate candidates in Pakistan.
            </p>
            <div className="cta-buttons" style={{ display: "flex", gap: 12, justifyContent: "flex-start", flexWrap: "wrap", marginBottom: 0 }}>
              <Btn variant="primary" size="lg" onClick={() => handleNavExam("fcps")}>Begin FCPS-1 Preparation</Btn>
              <Btn variant="ghost" size="lg" onClick={() => handleNavExam("jcat")}>Begin JCAT (MDMS) Preparation</Btn>
            </div>
          </div>

          <div className="lp-hero-stats hero-stats">
            {[
              { num: "6,000+", label: "Examination-Level Questions" },
              { num: "100%", label: "Options Explained" },
              { num: "2", label: "Examination Tracks" },
              { num: "Live", label: "Performance Analytics" },
            ].map(({ num, label }, i) => (
              <div key={label} className="hero-stat" style={{ flex: 1, padding: "20px 16px", background: T.surface, borderRight: i < 3 ? `1px solid ${T.line}` : "none", textAlign: "center" }}>
                <div className="lp-stat-num">{num}</div>
                <div className="lp-stat-label">{label}</div>
              </div>
            ))}
          </div>
          </div>
        </Container>
      </section>

      {/* ── MISSION STRIP ── */}
      <div style={{ borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}`, padding: "44px 0" }}>
        <Container>
          <div className="lp-mission">
            <p>
              We build for exams and for practice: strong basics in medical science and clinical reasoning, so you are ready for the paper and the ward.
            </p>
          </div>
        </Container>
      </div>

      {/* ── WHAT SETS US APART ── */}
      <section id="why-us" style={{ background: T.surface, scrollMarginTop: 80 }}>
        <Container style={sectionPad}>
          <SectionHeader>
            <SectionKicker>Why MedPrepAI</SectionKicker>
            <h2 className="lp-section-title lp-section-title--lg">
              What you get
            </h2>
            <p className="lp-section-lead">
              Tools built around how postgraduate candidates actually study.
            </p>
          </SectionHeader>

          <div className="lp-pillar-grid" style={{ marginBottom: 36 }}>
            {PILLAR_CARDS.map(({ iconPaths, title, body }) => (
              <PillarCard key={title} iconPaths={iconPaths} title={title} body={body} />
            ))}
          </div>

          <div className="lp-grid-2">
            <div className="lp-image-frame">
              <img src={teamCollabImg} alt="Medical team reviewing AI-driven clinical insights together" />
            </div>
            <div>
              <SectionKicker>Faculty & candidates</SectionKicker>
              <h3 className="lp-block-title">
                Same data, same view
              </h3>
              <p className="lp-body-lg">
                Every explanation, score, and trend is visible to both sides — so coaching conversations are grounded in the same evidence candidates see when they review their own performance.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* ── PROGRAM TABS ── */}
      <ProgramTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onBeginProgram={actions.onBeginProgram}
        onViewSampleQuestions={actions.onViewSampleQuestions}
      />

      {/* ── SEE IT IN ACTION ── */}
      <section id="sample-questions" style={{ scrollMarginTop: 80 }}>
        <Container style={sectionPad}>
          <SectionHeader>
            <SectionKicker>Sample question</SectionKicker>
            <h2 className="lp-section-title">
              Every option explained
            </h2>
            <p className="lp-section-lead">
              From the question bank — stem, options, and full reasoning.
            </p>
          </SectionHeader>
          <div className="lp-image-frame">
            <img src={examInterfaceImg} alt="Exam-style question interface with full answer breakdown" style={{ maxHeight: "none" }} />
          </div>
        </Container>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ background: T.surface, scrollMarginTop: 80 }}>
        <Container style={sectionPad}>
          <SectionHeader>
            <SectionKicker>Getting started</SectionKicker>
            <h2 className="lp-section-title">How it works</h2>
            <p className="lp-section-lead">
              From sign-up to exam day.
            </p>
          </SectionHeader>
          <div className="lp-grid-4">
            {[
              { n: "1", title: "Create your account", body: "Pick FCPS-1 or JCAT (MDMS) and set up your profile." },
              { n: "2", title: "Practice questions", body: "Work through scenario MCQs at exam difficulty." },
              { n: "3", title: "Read explanations", body: "Review why each option is right or wrong." },
              { n: "4", title: "Track progress", body: "Use dashboards to spot weak areas and trends." },
            ].map(({ n, title, body }) => (
              <div key={n} className="lp-step-card">
                <div className="lp-step-num">{n}</div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section>
        <Container style={sectionPad}>
          <SectionHeader>
            <SectionKicker>From candidates</SectionKicker>
            <h2 className="lp-section-title">
              What people say
            </h2>
          </SectionHeader>
          <div className="lp-grid-3">
            {[
              { text: "The every-option-explained approach fundamentally changed how I study. I now understand why incorrect answers are wrong, not merely which answer to select.", name: "FCPS-1 Candidate", role: "Medicine, Batch 2025" },
              { text: "The scenario-based question bank closely replicates the actual JCAT examination experience. My confidence increased significantly after just a few weeks of structured practice.", name: "JCAT (MDMS) Candidate", role: "Medicine & Allied, 2025" },
              { text: "The performance analytics helped me identify my weakest subjects early in my preparation. I was able to direct my revision toward the areas that required the most attention.", name: "Postgraduate Trainee", role: "Internal Medicine" },
            ].map(({ text, name, role }) => (
              <TestimonialCard key={name} text={text} name={name} role={role} />
            ))}
          </div>
        </Container>
      </section>

      {/* ── FINAL CTA ── */}
      <section id="pricing" style={{ background: T.surface, textAlign: "center", scrollMarginTop: 80 }}>
        <Container style={sectionPad}>
          <SectionHeader align="center">
            <SectionKicker center>Start preparing</SectionKicker>
            <h2 className="lp-section-title">FCPS-1 & JCAT question banks</h2>
            <p className="lp-section-lead">Full explanations for every option.</p>
          </SectionHeader>
          <div className="cta-buttons" style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Btn variant="primary" size="lg" onClick={() => handleNavExam("fcps")}>Begin FCPS-1 Preparation</Btn>
            <Btn variant="ghost" size="lg" onClick={() => handleNavExam("jcat")}>Begin JCAT (MDMS) Preparation</Btn>
          </div>
          <div style={{ marginTop: 20 }}>
            <Btn
              variant="ghost"
              size="md"
              onClick={() =>
                actions.isAuthenticated
                  ? actions.onBeginProgram(activeTab, "start")
                  : actions.onLogin()
              }
            >
              {actions.isAuthenticated ? "Open question bank" : "Sign in"}
            </Btn>
          </div>
        </Container>
      </section>

      {/* ── FAQ ── */}
      <FAQ />

      {/* ── FOOTER ── */}
      <footer style={{ background: T.paper, color: "var(--mkt-footer-text)", padding: "64px 0 32px", borderTop: `1px solid ${T.line}` }}>
        <Container>
          <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 40, marginBottom: 48 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 600, color: "var(--mkt-text)", fontSize: "1.0625rem", marginBottom: 14 }}>
                <LogoBadge size={28} />
                MedPrepAI
              </div>
              <p style={{ fontSize: "1rem", maxWidth: 360, color: "var(--mkt-footer-muted)", lineHeight: 1.65 }}>
                Postgraduate medical examination preparation for FCPS-1 and JCAT (MDMS). Every option explained. Built for clinical excellence.
              </p>
            </div>
            <div>
              <h4 style={{ color: "var(--mkt-text)", fontSize: "1rem", marginBottom: 12, fontWeight: 600 }}>Exam tracks</h4>
              <ul style={{ listStyle: "none" }}>
                {(
                  [
                    ["FCPS-1 (Medicine & Allied)", "fcps"],
                    ["JCAT (MDMS) (Medicine & Allied)", "jcat"],
                  ] as Array<[string, ExamTrack]>
                ).map(([label, id]) => (
                  <li key={label} style={{ marginBottom: 10, fontSize: "1rem" }}>
                    <button type="button" onClick={() => handleNavExam(id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--mkt-footer-text)", fontFamily: "inherit", fontSize: "1rem", padding: 0, textAlign: "left" }}>{label}</button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 style={{ color: "var(--mkt-text)", fontSize: "1rem", marginBottom: 12, fontWeight: 600 }}>Account</h4>
              <ul style={{ listStyle: "none" }}>
                <li style={{ marginBottom: 10, fontSize: "1rem" }}>
                  <button type="button" onClick={actions.onLogin} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--mkt-footer-text)", fontFamily: "inherit", fontSize: "1rem", padding: 0 }}>
                    Sign in
                  </button>
                </li>
                <li style={{ marginBottom: 10, fontSize: "1rem" }}>
                  <a href="#faq" style={{ color: "var(--mkt-footer-text)", textDecoration: "none" }}>FAQ</a>
                </li>
              </ul>
            </div>
          </div>
          <div style={{ borderTop: "1px solid var(--mkt-border)", paddingTop: 24, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, fontSize: "0.875rem", color: "var(--mkt-footer-dim)" }}>
            <span>© 2026 MedPrepAI. All rights reserved.</span>
            <span>Trusted for FCPS-1 & JCAT Preparation · Pakistan</span>
          </div>
        </Container>
      </footer>
    </>
  );
}