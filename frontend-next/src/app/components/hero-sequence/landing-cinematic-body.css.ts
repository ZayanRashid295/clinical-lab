/** Landing cinematic tokens — derived from ThemeService / --mkt-* (light & dark). */

export const LANDING_CINEMATIC_BODY_CSS = `
  /* Cinematic aliases follow app marketing tokens (never override --mkt-*) */
  .medprep-landing-v2 {
    --cine-bg: var(--mkt-bg);
    --cine-bg-elevated: var(--mkt-bg-elevated);
    --cine-text: var(--mkt-text);
    --cine-muted: var(--mkt-text-muted);
    --cine-subtle: var(--mkt-text-subtle);
    --cine-border: var(--mkt-border);
    --cine-accent: var(--mkt-accent);
    --cine-accent-hover: var(--mkt-accent-hover);
    --cine-accent-muted: var(--mkt-accent-muted);
    --cine-accent-soft: var(--mkt-accent-soft);
    --cine-hero-bg: var(--mkt-bg-muted);
    --cine-glow: var(--mkt-glow);
    --cine-on-accent: #ffffff;
    --cine-body: var(--mkt-text);
    --cine-title-from: var(--mkt-text);
    --cine-title-to: var(--mkt-accent-muted);
    --cine-mission-em-from: var(--mkt-text);
    --cine-mission-em-to: var(--mkt-accent);
    --cine-ambient-strength: 0.07;
  }

  html.dark .medprep-landing-v2 {
    /* Cinematic dark — deeper than app shell; accents still follow ThemeService */
    --cine-bg: color-mix(in srgb, var(--mkt-bg) 35%, #050508);
    --cine-bg-elevated: color-mix(in srgb, var(--mkt-bg-elevated) 40%, #0a0a10);
    --cine-hero-bg: color-mix(in srgb, var(--mkt-bg-muted) 30%, #050508);
    --cine-text: #f8fafc;
    --cine-muted: rgba(203, 213, 225, 0.92);
    --cine-body: rgba(226, 232, 240, 0.96);
    --cine-subtle: rgba(148, 163, 184, 0.88);
    --cine-border: rgba(148, 163, 184, 0.12);
    --cine-header-bg: color-mix(in srgb, var(--cine-hero-bg) 55%, transparent);
    --cine-stat-rail-bg: linear-gradient(
      165deg,
      color-mix(in srgb, var(--mkt-bg-elevated) 55%, transparent) 0%,
      color-mix(in srgb, var(--mkt-bg-elevated) 32%, transparent) 100%
    );
    --cine-stat-rail-border: color-mix(in srgb, var(--mkt-accent) 14%, transparent);
    --cine-stat-num-from: #ffffff;
    --cine-stat-num-to: var(--mkt-accent-muted);
    --cine-title-from: #ffffff;
    --cine-title-to: var(--mkt-accent-muted);
    --cine-mission-em-from: #ffffff;
    --cine-mission-em-to: var(--mkt-accent);
    --cine-ambient-strength: 0.11;
  }

  html.dark:has(.landing-cinematic) body {
    background: var(--cine-hero-bg, #050508);
  }

  html:not(.dark) .medprep-landing-v2 {
    --cine-stat-rail-bg: var(--mkt-bg-elevated);
    --cine-stat-rail-border: var(--mkt-border);
    --cine-stat-num-from: var(--mkt-text);
    --cine-stat-num-to: var(--mkt-accent);
  }

  .medprep-landing-v2 {
    background: var(--cine-bg) !important;
    color: var(--cine-text) !important;
  }

  .landing-cinematic {
    background: var(--cine-bg);
    color: var(--cine-text);
    min-height: 100vh;
  }

  .landing-cinematic .landing-content-bridge {
    position: relative;
    z-index: 5;
    background: transparent;
    color: var(--cine-text);
    border-top: none;
    border-radius: 0;
    box-shadow: none;
  }

  .landing-cinematic footer {
    background: var(--cine-bg) !important;
    border-top: 1px solid var(--cine-border) !important;
    color: var(--mkt-footer-text) !important;
  }

  .landing-cinematic footer h4,
  .landing-cinematic footer .lp-h4-ui {
    color: var(--cine-text) !important;
  }

  .landing-cinematic .landing-cinematic-header-cta {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.625rem 1.25rem;
    font-size: 0.9375rem;
    font-weight: 600;
    font-family: inherit;
    color: var(--cine-on-accent) !important;
    background: linear-gradient(135deg, var(--cine-accent), var(--cine-accent-hover)) !important;
    border: none !important;
    border-radius: 999px !important;
    cursor: pointer;
    box-shadow: 0 0 20px color-mix(in srgb, var(--cine-accent) 35%, transparent);
    transition: background 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
  }

  .landing-cinematic .landing-cinematic-header-cta:hover {
    transform: translateY(-1px);
    filter: brightness(1.06);
  }

  .landing-cinematic .landing-cinematic-header .mobile-menu-overlay {
    background: var(--mkt-overlay-bg) !important;
    border-bottom-color: var(--cine-border) !important;
  }

  .landing-cinematic .lp-kicker,
  .landing-cinematic .lp-program .eyebrow,
  .landing-cinematic .lp-step-num,
  .landing-cinematic .lp-highlight-kicker {
    color: var(--cine-accent) !important;
  }

  .landing-cinematic .lp-section-title,
  .landing-cinematic .lp-section-title span,
  .landing-cinematic .lp-program .section-head h2,
  .landing-cinematic .lp-block-title {
    color: var(--cine-text) !important;
  }

  .medprep-landing-v2 .cine-section-lead,
  .medprep-landing-v2 .cine-text-block p,
  .medprep-landing-v2 .cine-callout-band p,
  .medprep-landing-v2 .cine-faq-answer,
  .medprep-landing-v2 .cine-mission-rest,
  .landing-cinematic .lp-section-lead,
  .landing-cinematic .lp-body-lg,
  .landing-cinematic .lp-program .section-head p,
  .landing-cinematic .cine-section-lead,
  .landing-cinematic .cine-text-block p,
  .landing-cinematic .cine-callout-band p,
  .landing-cinematic .cine-faq-answer {
    color: var(--cine-body, var(--cine-text)) !important;
  }

  .medprep-landing-v2 .hero-cinematic .hero-brand-subtitle,
  .medprep-landing-v2 .hero-cinematic .hero-brand-subtitle--center {
    color: var(--cine-text) !important;
  }

  .landing-cinematic .cta-buttons .lp-home-btn--primary,
  .landing-cinematic .lp-program-btn--primary,
  .landing-cinematic .cine-section .hero-btn-primary {
    background: linear-gradient(135deg, var(--cine-accent), var(--cine-accent-hover)) !important;
    border: none !important;
    color: var(--cine-on-accent) !important;
    box-shadow: 0 0 24px color-mix(in srgb, var(--cine-accent) 35%, transparent);
  }

  .landing-cinematic .cta-buttons .lp-home-btn--ghost,
  .landing-cinematic .lp-program-btn--ghost,
  .landing-cinematic .cine-section .hero-btn-ghost {
    border-color: var(--cine-border) !important;
    color: var(--cine-text) !important;
    background: var(--mkt-bg-elevated) !important;
  }

  .landing-cinematic .cta-buttons .lp-home-btn--ghost:hover,
  .landing-cinematic .lp-program-btn--ghost:hover,
  .landing-cinematic .cine-section .hero-btn-ghost:hover {
    border-color: var(--cine-accent) !important;
    background: var(--cine-accent-soft) !important;
  }

  .landing-cinematic .lp-program .qbank-dot.active,
  .landing-cinematic .lp-program .testi-dot.active {
    background: var(--cine-accent) !important;
  }
`;
