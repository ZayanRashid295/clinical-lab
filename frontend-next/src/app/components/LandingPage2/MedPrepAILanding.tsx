"use client";

import { useState, type ReactNode } from "react";
import { Container, SectionHeader, sectionPad } from "./landing-v2-layout";
import { LandingV2Chrome } from "./landing-v2-chrome";
import type { ExamTrack } from "./landing-v2-data";

export type { ExamTrack };

export interface MedPrepLandingActions {
  onLogin: () => void;
  onSignup: () => void;
  onStartTrial: () => void;
  onNavigateToProgram: (program: ExamTrack) => void;
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

// ── Logo badge (hero eyebrow only) ──────────────────────────────

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

// ── DATA ───────────────────────────────────────────────────────
const PLATFORM_FEATURES = [
  { icon: Icon.layers, title: "Deep Question Banks", desc: "Thousands of practice questions at exam-level difficulty — organised by subject and topic so you always know what to study next." },
  { icon: Icon.clock, title: "Every Option Explained", desc: "See why each answer is right or wrong. No more guessing — just clear reasoning you can apply on test day." },
  { icon: Icon.check, title: "Scenario-Based Learning", desc: "Real-world case scenarios with full option-level breakdowns that build thinking skills, not flashcard habits." },
  { icon: Icon.monitor, title: "Exam-Like Interface", desc: "Practice in an environment that mirrors high-stakes test conditions — so nothing feels unfamiliar when it counts." },
  { icon: Icon.pulse, title: "Performance Analytics", desc: "Track scores, spot weak topics, and watch your progress climb session by session." },
];

const HERO_PUNCHLINES = [
  "Every option explained",
  "Zero guesswork",
  "Exam-day ready",
];

const PILLAR_CARDS = [
  {
    iconPaths: <><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></>,
    title: "Built for High-Stakes Exams",
    body: "Content matches real exam difficulty and format — so every practice session feels like the real thing, not a warm-up.",
  },
  {
    iconPaths: <><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></>,
    title: "Every Option Explained",
    body: "Each question breaks down every choice — correct and incorrect — so you build understanding, not memorisation.",
  },
  {
    iconPaths: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></>,
    title: "Reasoning Over Rote Learning",
    body: "Scenario-based questions train you to think through problems — the skill that separates top scorers from the rest.",
  },
  {
    iconPaths: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></>,
    title: "Analytics That Show the Gap",
    body: "Live dashboards reveal exactly where you're strong, where you're slipping, and what to tackle before exam day.",
  },
];

const HIGHLIGHT_CARDS = [
  {
    kicker: "Interactive Practice",
    title: "Learn by Doing, Not Cramming",
    body: "Work through real scenarios with instant feedback — a study flow that feels like deliberate practice, not a pop quiz you're failing.",
  },
  {
    kicker: "Full Transparency",
    title: "Every Option, Explained In Full",
    body: "Wrong answers aren't failures — they're untaught lessons. We break down why each choice is right or wrong so the logic sticks.",
  },
  {
    kicker: "Performance, Visualised",
    title: "See Exactly Where You Stand",
    body: "Scores become a clear study plan. Dashboards show subject trends, weak spots, and improvement over time — so you always know what to tackle next.",
  },
];

function HighlightCard({ kicker, title, body }: { kicker: string; title: string; body: string }) {
  return (
    <article className="lp-highlight-card">
      <span className="lp-highlight-kicker">{kicker}</span>
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  );
}

function PlatformSection() {
  return (
    <section id="platform" style={{ scrollMarginTop: 80 }}>
      <Container style={sectionPad}>
        <SectionHeader>
          <SectionKicker>The Platform</SectionKicker>
          <h2 className="lp-section-title lp-section-title--lg">
            Everything You Need to <span style={{ color: T.teal }}>Prepare With Clarity</span>
          </h2>
          <p className="lp-section-lead">
            One platform for serious learners — question banks, explanations, and analytics in a single, focused workflow.
          </p>
        </SectionHeader>

        <div className="feature-strip">
          {PLATFORM_FEATURES.map((f, i) => (
            <FeatItem key={f.title} icon={f.icon} title={f.title} desc={f.desc} last={i === PLATFORM_FEATURES.length - 1} />
          ))}
        </div>

        <div className="lp-highlight-grid">
          {HIGHLIGHT_CARDS.map((card) => (
            <HighlightCard key={card.title} {...card} />
          ))}
        </div>
      </Container>
    </section>
  );
}

// ── FAQ ────────────────────────────────────────────────────────
const FAQ_DATA = [
  { q: "What is MedPrepAI?", a: "MedPrepAI is an AI-powered exam preparation platform. We combine scenario-based question banks with full option-level explanations and performance analytics — so you understand the material, not just the answers." },
  { q: "What does 'Every Option Explained' mean?", a: "For every question, we explain not only the correct answer but each incorrect option as well. You learn why something is wrong — not just what to pick." },
  { q: "How many questions are available?", a: "Our question banks contain over 3,000 fully explained questions, all set at exam-level difficulty and organised by subject and topic." },
  { q: "Is a free trial available?", a: "Yes. You can access a curated selection of sample questions at no cost before committing to a full subscription plan." },
  { q: "What does the performance analytics feature include?", a: "Analytics include subject-wise breakdowns, time-per-question tracking, and improvement trends across sessions — giving you a clear, actionable picture of your progress." },
];

function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" style={{ scrollMarginTop: 80 }}>
      <Container style={sectionPad}>
        <SectionHeader>
          <SectionKicker>Frequently Asked Questions</SectionKicker>
          <h2 className="lp-section-title">
            Common <span style={{ color: T.teal }}>Questions</span>
          </h2>
          <p className="lp-section-lead">
            Answers to the questions learners ask most before they start preparing.
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

// ── Main export ────────────────────────────────────────────────
export function MedPrepAILanding({ actions }: { actions: MedPrepLandingActions }) {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <LandingV2Chrome activePage="home" actions={actions}>
      {/* ── HERO ── */}
      <section id="home" className="lp-hero">
        <Container>
          <div className="lp-hero-layout">
            <div className="lp-hero-copy">
              <h1 className="lp-hero-title">
                Stop Guessing.<br />Start Understanding.
              </h1>
              <p className="lp-hero-subtitle">
                3,000+ questions with a full explanation for <strong style={{ color: T.ink, fontWeight: 600 }}>every single option</strong> — so you learn deeply, score higher, and walk in confident.
              </p>
              <div className="lp-hero-punchlines">
                {HERO_PUNCHLINES.map((line) => (
                  <span key={line} className="lp-hero-punchline">
                    <span className="lp-hero-punchline-dot" aria-hidden />
                    {line}
                  </span>
                ))}
              </div>
              <div className="cta-buttons lp-hero-cta">
                <Btn variant="primary" size="lg" onClick={actions.onStartTrial}>
                  {actions.isAuthenticated ? "Go to dashboard" : "Start Free — No Card Required"}
                </Btn>
                <Btn variant="ghost" size="lg" onClick={() => scrollTo("how-it-works")}>
                  See How It Works
                </Btn>
              </div>
            </div>

            <div className="lp-hero-stats hero-stats">
              {[
                { num: "3,000+", label: "Exam-Level Questions" },
                { num: "100%", label: "Options Explained" },
                { num: "Real", label: "Exam Interface" },
                { num: "Live", label: "Progress Tracking" },
              ].map(({ num, label }, i) => (
                <div
                  key={label}
                  className="hero-stat"
                  style={{
                    flex: 1,
                    padding: "20px 16px",
                    background: T.surface,
                    borderRight: i < 3 ? `1px solid ${T.line}` : "none",
                    textAlign: "center",
                  }}
                >
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
            <span style={{ fontFamily: "monospace", fontSize: "0.8rem", fontWeight: 700, color: T.teal, letterSpacing: "0.06em", display: "block", marginBottom: 16 }}>
              OUR MISSION
            </span>
            <p>Confidence comes from understanding — not from cramming the night before.</p>
          </div>
        </Container>
      </div>

      {/* ── WHAT SETS US APART ── */}
      <section id="why-us" style={{ background: T.surface, scrollMarginTop: 80 }}>
        <Container style={sectionPad}>
          <SectionHeader>
            <SectionKicker>Our Distinction</SectionKicker>
            <h2 className="lp-section-title lp-section-title--lg">
              What Sets <span style={{ color: T.teal }}>MedPrepAI</span> Apart
            </h2>
            <p className="lp-section-lead">Four reasons learners switch — and stay.</p>
          </SectionHeader>

          <div className="lp-pillar-grid">
            {PILLAR_CARDS.map(({ iconPaths, title, body }) => (
              <PillarCard key={title} iconPaths={iconPaths} title={title} body={body} />
            ))}
          </div>

          <div className="lp-callout-band">
            <SectionKicker>Collaborative By Design</SectionKicker>
            <h3 className="lp-block-title">
              Instructors and Learners, <span style={{ color: T.teal }}>On the Same Page</span>
            </h3>
            <p className="lp-body-lg" style={{ margin: 0 }}>
              One shared view of progress — so coaching is grounded in data, not guesswork.
            </p>
          </div>
        </Container>
      </section>

      {/* ── PLATFORM ── */}
      <PlatformSection />

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ background: T.surface, scrollMarginTop: 80 }}>
        <Container style={sectionPad}>
          <SectionHeader>
            <SectionKicker>Preparation Workflow</SectionKicker>
            <h2 className="lp-section-title">
              How <span style={{ color: T.teal }}>MedPrepAI</span> Works
            </h2>
            <p className="lp-section-lead">
              Four steps from sign-up to exam-day confidence.
            </p>
          </SectionHeader>
          <div className="lp-grid-4">
            {[
              { n: "01", title: "Create Your Account", body: "Register and set up your study profile in under a minute." },
              { n: "02", title: "Practice Questions", body: "Work through scenario-based questions with every option explained at real exam difficulty." },
              { n: "03", title: "Review Explanations", body: "Study the reasoning behind every correct and incorrect answer until the logic sticks." },
              { n: "04", title: "Track Your Progress", body: "Use live dashboards to find weak spots, measure improvement, and focus where it matters." },
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
            <SectionKicker>Testimonials</SectionKicker>
            <h2 className="lp-section-title">Trusted by Serious Learners</h2>
            <p className="lp-section-lead">Real results from people who stopped guessing and started understanding.</p>
          </SectionHeader>
          <div className="lp-grid-3">
            {[
              { text: "The every-option-explained approach changed how I study. I finally understand why wrong answers are wrong — not just which bubble to fill.", name: "Ayesha K.", role: "Exam Candidate" },
              { text: "The question bank feels exactly like the real test. My confidence shot up after just a few weeks of daily practice.", name: "Hassan R.", role: "Advanced Learner" },
              { text: "Analytics showed me my weakest subjects in the first week. I focused there and saw a measurable score jump within a month.", name: "Fatima N.", role: "Dedicated Prep Student" },
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
            <SectionKicker center>Ready when you are</SectionKicker>
            <h2 className="lp-section-title">Your Next Score Starts Here</h2>
            <p className="lp-section-lead">Join thousands of learners who prep with clarity — not chaos.</p>
          </SectionHeader>
          <div className="cta-buttons" style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Btn variant="primary" size="lg" onClick={actions.onStartTrial}>
              {actions.isAuthenticated ? "Open question bank" : "Start Free Today"}
            </Btn>
            <Btn variant="ghost" size="lg" onClick={() => scrollTo("platform")}>
              Explore the Platform
            </Btn>
          </div>
        </Container>
      </section>

      {/* ── FAQ ── */}
      <FAQ />
    </LandingV2Chrome>
  );
}