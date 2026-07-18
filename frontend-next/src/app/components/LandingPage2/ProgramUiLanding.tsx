"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  CATEGORIES,
  PROGRAMS,
  PROGRAM_FAQS,
  PROGRAM_TESTIMONIALS,
  productPath,
  type ExamProduct,
  type ExamTrack,
} from "./landing-v2-data";
import { DemoModal } from "./landing-v2-program-ui";
import { PROGRAM_UI_CSS } from "./program-ui.css";
import { demoPackForTrack } from "./landing-demo-lead";

const LOGO_ICON = "/images/landing-v2/logo-icon.png";

const IMG = {
  diagram: "/images/landing-v2/program-ui/labeled-diagram.jpeg",
  fcpsHero: "/images/landing-v2/program-ui/fcps-hero.png",
  jcatHero: "/images/landing-v2/program-ui/jcat-hero.png",
} as const;

const BENTO = [
  {
    title: "Build Custom Tests",
    body: "Filter by subject, difficulty, or question status to build a block that targets exactly what you need.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <line x1="4" y1="7" x2="20" y2="7" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="9" cy="7" r="2" fill="var(--navy-950)" stroke="currentColor" strokeWidth="1.8" />
        <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="15" cy="12" r="2" fill="var(--navy-950)" stroke="currentColor" strokeWidth="1.8" />
        <line x1="4" y1="17" x2="20" y2="17" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="7" cy="17" r="2" fill="var(--navy-950)" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    title: "Bookmark & Review",
    body: "Flag questions as you go and pull every flagged item into one review set before your next session.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M7 4H17V20L12 16L7 20V4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Timed & Tutor Modes",
    body: "Switch between exam-timed blocks and a relaxed tutor mode that reveals explanations as you go.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 8V12L15 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Reference-Backed Answers",
    body: "Explanations are grounded in standard clinical references, so what you're reading holds up under scrutiny.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M4 5C4 4 5 4 6 4H12V19H6C5 19 4 19 4 20V5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M20 5C20 4 19 4 18 4H12V19H18C19 19 20 19 20 20V5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Full Syllabus Coverage",
    body: "Every subject and topic in the official syllabus is represented, so nothing catches you by surprise.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M6 4H18V20H6V4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M9 9H15M9 13H15M9 17H12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Regularly Updated Content",
    body: "Refreshed each cycle to stay aligned with the current exam pattern and syllabus.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M18 4v4h-4M6 20v-4h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
] as const;

const STEPS = [
  { n: "01", title: "Create your account", body: "Pick your exam track and set up your study profile in under a minute." },
  { n: "02", title: "Practice questions", body: "Work through scenario MCQs at real exam difficulty with every option explained." },
  { n: "03", title: "Read explanations", body: "Review why each option is right or wrong until the logic sticks." },
  { n: "04", title: "Track progress", body: "Use dashboards to spot weak areas and measure improvement over time." },
] as const;

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <span
      className="brand-logo"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.26,
      }}
    >
      <img src={LOGO_ICON} alt="" width={size} height={size} />
    </span>
  );
}

function Chevron() {
  return (
    <svg className="chev" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NavDropdown({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuId = useId();

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const openMenu = () => {
    clearCloseTimer();
    setOpen(true);
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setOpen(false), 220);
  };

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => () => clearCloseTimer(), []);

  return (
    <div
      className={`nav-item has-dropdown${open ? " is-open" : ""}`}
      ref={ref}
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        className="nav-link"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => {
          clearCloseTimer();
          setOpen((v) => !v);
        }}
      >
        {label}
        <Chevron />
      </button>
      {open ? (
        <div className="dropdown" id={menuId} role="menu">
          <div className="dropdown-panel">{children}</div>
        </div>
      ) : null}
    </div>
  );
}

function useScrollReveal(root: HTMLElement | null) {
  useEffect(() => {
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const els = root.querySelectorAll("[data-reveal]");
    if (reduce || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [root]);
}

export interface ProgramUiActions {
  isAuthenticated: boolean;
  primaryCtaLabel: string;
  onLogin: () => void;
  onBeginPrep: () => void;
  onNavigateToProgram: (program: ExamTrack, product?: ExamProduct) => void;
}

export function ProgramUiLanding({
  track,
  actions,
}: {
  track: ExamTrack;
  actions: ProgramUiActions;
}) {
  const p = PROGRAMS[track];
  const category = CATEGORIES[track];
  const router = useRouter();
  const [demoOpen, setDemoOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [rootEl, setRootEl] = useState<HTMLElement | null>(null);
  useScrollReveal(rootEl);

  const heroImg = track === "fcps" ? IMG.fcpsHero : IMG.jcatHero;
  const beginLabel = track === "fcps" ? "Begin FCPS-1 Preparation" : "Begin JCAT (MDMS) Preparation";
  const trustLine =
    track === "fcps"
      ? "Rated 4.9/5 by more than 1,200 FCPS-1 candidates for explanation quality and realism."
      : "Rated 4.8/5 by more than 900 JCAT (MDMS) candidates for explanation quality and realism.";
  const testimonials = PROGRAM_TESTIMONIALS[track].slice(0, 3);
  const faqs = PROGRAM_FAQS[track];

  const mcq =
    track === "fcps"
      ? {
          stem: "A 32-year-old develops sudden dyspnoea and pleuritic chest pain on post-op day 3. Best next step?",
          options: [
            { letter: "A", text: "Chest X-ray" },
            {
              letter: "B",
              text: "CT pulmonary angiography",
              state: "correct" as const,
              explain: "Confirms or excludes PE — the leading diagnosis in this post-operative scenario.",
            },
            { letter: "C", text: "Empirical beta-blocker", state: "wrong" as const },
          ],
        }
      : {
          stem: "A patient presents with pallor, fatigue, and spoon-shaped nails. Which deficiency is most likely?",
          options: [
            { letter: "A", text: "Vitamin B12" },
            {
              letter: "B",
              text: "Iron",
              state: "correct" as const,
              explain: "Koilonychia and fatigue with pallor are classic for iron-deficiency anaemia.",
            },
            { letter: "C", text: "Folate", state: "wrong" as const },
          ],
        };

  const chart =
    track === "fcps"
      ? {
          score: "78%",
          bars: [
            { label: "Medicine", height: "70%" },
            { label: "Surgery", height: "40%", low: true },
            { label: "Peds", height: "85%" },
            { label: "OB-GYN", height: "60%" },
          ],
        }
      : {
          score: "74%",
          bars: [
            { label: "Anatomy", height: "65%" },
            { label: "Pharm", height: "38%", low: true },
            { label: "Physio", height: "80%" },
            { label: "Pathology", height: "55%" },
          ],
        };

  const goProduct = (product: ExamProduct = "medicine-and-allied") => {
    setMobileOpen(false);
    actions.onNavigateToProgram(track, product);
  };

  const goTrack = (next: ExamTrack) => {
    setMobileOpen(false);
    actions.onNavigateToProgram(next, "medicine-and-allied");
  };

  return (
    <div className="program-ui" ref={setRootEl}>
      <Head>
        <title>{`${p.badge} Preparation | MedPrepAI`}</title>
        <meta
          name="description"
          content={`Scenario-based ${p.badge} QBank with 3,000+ exam-level questions, full option-level explanations, and live performance analytics.`}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&family=Source+Sans+3:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap"
          rel="stylesheet"
        />
      </Head>
      <style>{PROGRAM_UI_CSS}</style>

      {demoOpen ? (
        <DemoModal
          badge={p.badge}
          pack={demoPackForTrack(track)}
          onClose={() => setDemoOpen(false)}
          onUnlocked={(result) => {
            void router.push(result.samplePath);
          }}
        />
      ) : null}

      <header className="site-header">
        <div className="container nav-inner">
          <Link href="/landing-page" className="brand" onClick={() => setMobileOpen(false)}>
            <BrandMark />
            <span className="brand-name">MedPrepAI</span>
          </Link>

          <nav className={`main-nav${mobileOpen ? " is-open" : ""}`} id="mainNav">
            <NavDropdown label="Products">
              {category.products.map((product) => (
                <a
                  key={product.slug}
                  href={productPath(track, product.slug)}
                  role="menuitem"
                  onClick={(e) => {
                    e.preventDefault();
                    goProduct(product.slug);
                  }}
                >
                  {product.label}
                </a>
              ))}
            </NavDropdown>
            <NavDropdown label="Account">
              <button
                type="button"
                role="menuitem"
                className="dropdown-action"
                onClick={() => {
                  setMobileOpen(false);
                  actions.onLogin();
                }}
              >
                {actions.primaryCtaLabel}
              </button>
              <a href="#faq" role="menuitem" onClick={() => setMobileOpen(false)}>
                FAQ
              </a>
            </NavDropdown>
          </nav>

          <button type="button" className="btn btn-primary btn-sm nav-cta" onClick={actions.onBeginPrep}>
            Begin Prep
          </button>
          <button
            type="button"
            className="nav-toggle"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <main>
        <section className="hero-banner">
          <img className="hero-banner-img" src={heroImg} alt={`Doctors preparing for the ${p.badge} examination`} />
          <div className="hero-banner-scrim" aria-hidden />
          <div className="container hero-banner-inner">
            <p className="eyebrow eyebrow--light">
              {p.badge} · Medicine &amp; Allied
            </p>
            <h1 className="hero-banner-h1">
              {track === "fcps" ? (
                <>
                  FCPS-1 <span>Preparation</span>
                </>
              ) : (
                <>
                  JCAT (MDMS) <span>Preparation</span>
                </>
              )}
            </h1>
            <p className="hero-banner-lede">{p.heroSubtitle}</p>
            <div className="hero-actions">
              <button type="button" className="btn btn-primary btn-light" onClick={actions.onBeginPrep}>
                {beginLabel}
              </button>
              <button type="button" className="btn btn-ghost-light" onClick={() => setDemoOpen(true)}>
                View sample questions
              </button>
            </div>
          </div>
        </section>

        <section className="stats-band">
          <div className="container stats-grid">
            {p.stats.map((stat) => (
              <div className="stat" key={stat.label}>
                <span className="stat-num">{stat.num}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="section" id="inside">
          <div className="container">
            <p className="eyebrow">Inside The Question Bank</p>
            <h2>{p.qbankHeading}</h2>
            <p className="section-lede">{p.qbankText}</p>

            <div className="feature-row" data-reveal>
              <div className="feature-row-text">
                <h3>Practice like it&apos;s exam day</h3>
                <p>
                  Timed blocks that mirror the real {p.badge} screen, paired with a full walkthrough of every option —
                  not just an answer key — so the reasoning behind each choice actually sticks.
                </p>
              </div>
              <div className="feature-row-media">
                <div className="mini-mcq">
                  <p>{mcq.stem}</p>
                  <ul>
                    {mcq.options.map((opt) => (
                      <li
                        key={opt.letter}
                        className={opt.state === "correct" ? "is-correct" : opt.state === "wrong" ? "is-wrong" : undefined}
                      >
                        <span className="opt-letter">{opt.letter}</span>
                        {opt.text}
                        {"explain" in opt && opt.explain ? <span className="opt-explain">{opt.explain}</span> : null}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="feature-row" data-reveal>
              <div className="feature-row-media">
                <div className="mini-chart">
                  <div className="mini-chart-head">
                    <span>Subject Accuracy</span>
                    <span className="mini-chart-score">{chart.score}</span>
                  </div>
                  <div className="mini-chart-bars">
                    {chart.bars.map((bar) => (
                      <div className={`mini-chart-bar${bar.low ? " is-low" : ""}`} key={bar.label}>
                        <span className="bar" style={{ height: bar.height }} />
                        <label>{bar.label}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="feature-row-text">
                <h3>Know exactly where you stand</h3>
                <p>
                  Live analytics break your accuracy and timing down by subject, so your final weeks of prep go to the
                  topics that will actually move your score.
                </p>
              </div>
            </div>

            <div className="feature-row" data-reveal>
              <div className="feature-row-text">
                <h3>Visual explanations, not walls of text</h3>
                <p>
                  {track === "fcps"
                    ? "Labeled diagrams sit right inside the explanation, with each numbered callout matched to a line of reasoning — so complex clinical concepts are easier to picture and easier to retain."
                    : "Labeled diagrams sit right inside the explanation, so complex concepts are easier to picture and easier to retain."}
                </p>
              </div>
              <div className="feature-row-media">
                <figure className="diagram-figure">
                  <img src={IMG.diagram} alt="Sample labeled clinical diagram" loading="lazy" />
                </figure>
              </div>
            </div>
          </div>
        </section>

        <section className="section section--muted" id="built-in">
          <div className="container">
            <p className="eyebrow">Built Into Every Question</p>
            <h2>Everything included, every time you practice</h2>
            <p className="section-lede">
              No add-ons, no separate purchases — every question in the {p.badge} QBank ships with the same depth of
              support.
            </p>

            <div className="included-meta" data-reveal>
              <span className="included-tag">Included With Every Question</span>
              <span className="included-count">3,000+ Questions</span>
            </div>

            <div className="bento-grid" data-reveal>
              {BENTO.map((card) => (
                <div className="bento-card" key={card.title}>
                  <span className="icon-badge">{card.icon}</span>
                  <h4>{card.title}</h4>
                  <p>{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="how-it-works">
          <div className="container">
            <p className="eyebrow">Getting Started</p>
            <h2>How it works</h2>
            <p className="section-lede">From sign-up to exam day.</p>
            <ol className="steps">
              {STEPS.map((step) => (
                <li className="step" data-reveal key={step.n}>
                  <span className="step-num">{step.n}</span>
                  <h4>{step.title}</h4>
                  <p>{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="section section--muted" id="reviews">
          <div className="container">
            <p className="eyebrow">From Candidates</p>
            <h2>{track === "fcps" ? "What FCPS-1 candidates say" : "What JCAT (MDMS) candidates say"}</h2>

            <div className="trust-stat" data-reveal>
              <div className="star-row" aria-hidden>
                ★★★★★
              </div>
              <p className="mission-statement">{trustLine}</p>
            </div>

            <div className="testimonial-grid">
              {testimonials.map((t) => (
                <blockquote className="testimonial" data-reveal key={t.name}>
                  <span className="stars" aria-hidden>
                    ★★★★★
                  </span>
                  <p>{t.text}</p>
                  <footer>
                    <span className="avatar">{initials(t.name)}</span>
                    <span>
                      <strong>{t.name}</strong>
                      <br />
                      {t.city}, Pakistan
                    </span>
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>

        <section className="cta-band" id="start">
          <div className="container cta-inner">
            <p className="eyebrow eyebrow--light">Start Preparing</p>
            <h2>{track === "fcps" ? "FCPS-1 question bank" : "JCAT (MDMS) question bank"}</h2>
            <p className="cta-lead">Full explanations for every option.</p>
            <div className="pill-row pill-row--center">
              <span className="pill">3,000+ Questions</span>
              <span className="pill">100% Options Explained</span>
              <span className="pill">Live Analytics</span>
            </div>
            <div className="hero-actions">
              <button type="button" className="btn btn-primary" onClick={actions.onBeginPrep}>
                {beginLabel}
              </button>
              <button type="button" className="btn btn-ghost-light" onClick={() => setDemoOpen(true)}>
                View sample questions
              </button>
            </div>
          </div>
        </section>

        <section className="section" id="faq">
          <div className="container container--narrow">
            <p className="eyebrow">{track === "fcps" ? "FCPS-1 FAQ" : "JCAT (MDMS) FAQ"}</p>
            <h2>Common questions</h2>
            <div className="accordion">
              {faqs.map((item, i) => {
                const open = faqOpen === i;
                return (
                  <div className={`accordion-item${open ? " is-open" : ""}`} key={item.q}>
                    <button
                      type="button"
                      className="accordion-trigger"
                      aria-expanded={open}
                      onClick={() => setFaqOpen(open ? -1 : i)}
                    >
                      {item.q}
                      <span className="accordion-icon">+</span>
                    </button>
                    <div
                      className="accordion-panel"
                      style={{ maxHeight: open ? 240 : 0 }}
                    >
                      <p>{item.a}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <span className="brand">
              <BrandMark size={28} />
              <span className="brand-name">MedPrepAI</span>
            </span>
            <p>
              Postgraduate medical examination preparation for FCPS-1 and JCAT (MDMS). Every option explained. Built for
              clinical excellence.
            </p>
          </div>
          <div className="footer-col">
            <h5>Programs</h5>
            <ul>
              <li>
                <a
                  href={productPath("fcps")}
                  onClick={(e) => {
                    e.preventDefault();
                    goTrack("fcps");
                  }}
                >
                  FCPS-1
                </a>
              </li>
              <li>
                <a
                  href={productPath("jcat")}
                  onClick={(e) => {
                    e.preventDefault();
                    goTrack("jcat");
                  }}
                >
                  JCAT (MDMS)
                </a>
              </li>
            </ul>
          </div>
          <div className="footer-col">
            <h5>Account</h5>
            <ul>
              <li>
                <a
                  href="#signin"
                  onClick={(e) => {
                    e.preventDefault();
                    actions.onLogin();
                  }}
                >
                  Sign in
                </a>
              </li>
              <li>
                <a href="#faq">FAQ</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom container">© 2026 MedPrepAI. All rights reserved.</div>
      </footer>
    </div>
  );
}
