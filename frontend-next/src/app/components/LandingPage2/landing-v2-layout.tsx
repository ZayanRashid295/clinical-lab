import type { CSSProperties, ReactNode } from "react";

export const LP = {
  /** Horizontal inset only — content spans the viewport between padding. */
  padX: "clamp(28px, 5vw, 72px)",
  /** Max width for long-form prose blocks (not the page shell). */
  prose: 720,
};

export const container: CSSProperties = {
  width: "100%",
  maxWidth: "none",
  margin: 0,
  paddingLeft: LP.padX,
  paddingRight: LP.padX,
};

export const sectionPad: CSSProperties = {
  paddingTop: "4.5rem",
  paddingBottom: "4.5rem",
};

export function Container({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`lp-container ${className}`.trim()} style={{ ...container, ...style }}>
      {children}
    </div>
  );
}

export function SectionHeader({
  children,
  align = "left",
}: {
  children: ReactNode;
  align?: "center" | "left";
}) {
  return (
    <div
      className={`lp-section-header${align === "center" ? " lp-section-header--center" : ""}`}
    >
      {children}
    </div>
  );
}

export const LANDING_V2_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');

  .medprep-landing-v2 {
    width: 100%;
    overflow-x: hidden;
    font-family: 'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 17px;
    color: var(--mkt-text);
    -webkit-font-smoothing: antialiased;
    letter-spacing: -0.011em;
  }

  .medprep-landing-v2 h1,
  .medprep-landing-v2 h2,
  .medprep-landing-v2 h3,
  .medprep-landing-v2 h4 {
    font-family: inherit;
    font-weight: 600;
    letter-spacing: -0.025em;
    color: var(--mkt-text);
    line-height: 1.25;
  }

  .medprep-landing-v2 p {
    line-height: 1.6;
  }

  .lp-container {
    box-sizing: border-box;
  }

  .lp-kicker {
    display: block;
    font-size: 1rem;
    font-weight: 600;
    color: var(--mkt-accent);
    margin-bottom: 0.75rem;
    letter-spacing: 0;
    text-transform: none;
  }

  .lp-kicker--center {
    text-align: center;
  }

  .lp-section-header {
    max-width: none;
    margin: 0 0 2.5rem;
    text-align: left;
  }

  .lp-section-header--center {
    text-align: center;
    max-width: ${LP.prose}px;
    margin-left: auto;
    margin-right: auto;
  }

  .lp-section-header .lp-kicker--center {
    text-align: center;
  }

  .lp-section-lead {
    max-width: ${LP.prose}px;
  }

  .lp-section-header--center .lp-section-lead {
    margin-left: auto;
    margin-right: auto;
  }

  .lp-section-header p,
  .lp-section-lead {
    margin: 0.75rem 0 0;
    font-size: 1.125rem;
    line-height: 1.65;
    color: var(--mkt-text-muted);
    font-weight: 400;
  }

  .lp-hero {
    padding: 5rem 0 3.5rem;
  }

  .lp-hero-layout {
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
  }

  .lp-hero-copy {
    max-width: none;
    text-align: left;
  }

  .lp-hero-title {
    max-width: 28rem;
  }

  .lp-hero-subtitle {
    max-width: ${LP.prose}px;
  }

  .lp-hero-kicker {
    font-size: 1.0625rem;
    font-weight: 600;
    color: var(--mkt-accent);
    margin-bottom: 1rem;
  }

  .lp-hero-title {
    font-size: 2.375rem;
    font-weight: 700;
    line-height: 1.15;
    margin: 0 0 1rem;
    letter-spacing: -0.03em;
  }

  .lp-hero-subtitle {
    font-size: 1.1875rem;
    line-height: 1.65;
    color: var(--mkt-text-muted);
    margin: 0 0 2rem;
    font-weight: 400;
  }

  .lp-hero-stats {
    display: flex;
    width: 100%;
    border: 1px solid var(--mkt-border);
    border-radius: 8px;
    overflow: hidden;
  }

  .lp-mission {
    max-width: none;
    margin: 0;
    padding-left: 1.25rem;
    border-left: 3px solid var(--mkt-accent);
  }

  .lp-mission p {
    max-width: 960px;
  }

  .lp-mission p {
    font-size: 1.125rem;
    line-height: 1.65;
    font-weight: 400;
    color: var(--mkt-text);
    margin: 0;
  }

  .lp-faq {
    max-width: none;
    margin: 0;
  }

  .lp-cta-copy {
    max-width: ${LP.prose}px;
    margin: 0 auto;
  }

  .lp-step-card {
    padding: 1.25rem 1.125rem;
    background: var(--mkt-bg-elevated);
    border: 1px solid var(--mkt-border);
    border-radius: 8px;
  }

  .lp-step-num {
    font-size: 0.9375rem;
    font-weight: 700;
    color: var(--mkt-accent);
    font-variant-numeric: tabular-nums;
    margin-bottom: 0.75rem;
    letter-spacing: 0.02em;
  }

  .lp-section-title {
    font-size: 1.625rem;
    font-weight: 700;
    line-height: 1.25;
    margin: 0;
    letter-spacing: -0.025em;
  }

  .lp-section-title--lg {
    font-size: 1.875rem;
  }

  .lp-body-lg {
    font-size: 1.125rem;
    line-height: 1.65;
    color: var(--mkt-text-muted);
    max-width: ${LP.prose}px;
  }

  .lp-stat-num {
    font-size: 2rem;
    font-weight: 700;
    color: var(--mkt-accent);
    line-height: 1;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
  }

  .lp-stat-label {
    font-size: 1rem;
    color: var(--mkt-text-muted);
    margin-top: 0.375rem;
    line-height: 1.45;
  }

  .feature-item h4 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--mkt-text);
    margin: 0;
  }

  .feature-item p {
    font-size: 0.9375rem;
    color: var(--mkt-text-muted);
    line-height: 1.55;
    margin: 0;
  }

  .lp-step-card h3 {
    font-size: 1.0625rem;
    font-weight: 600;
    margin-bottom: 0.375rem;
  }

  .lp-step-card p {
    font-size: 0.9375rem;
    color: var(--mkt-text-muted);
    line-height: 1.55;
  }

  .lp-pillar-card h3 {
    font-size: 1.0625rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--mkt-text);
  }

  .lp-pillar-card p {
    font-size: 0.9375rem;
    color: var(--mkt-text-muted);
    line-height: 1.55;
  }

  .lp-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: clamp(2rem, 4vw, 4rem);
    align-items: center;
  }

  .lp-grid-3 {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: clamp(1rem, 2vw, 1.5rem);
  }

  .lp-grid-4 {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: clamp(1rem, 2vw, 1.25rem);
  }

  .lp-pillar-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: clamp(1rem, 2vw, 1.25rem);
  }

  .feature-strip {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    border: 1px solid var(--mkt-border);
    border-radius: 8px;
    overflow: hidden;
    background: var(--mkt-bg-elevated);
  }

  .feature-item {
    min-width: 0;
  }

  .lp-image-frame {
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid var(--mkt-border);
  }

  .lp-image-frame img {
    width: 100%;
    display: block;
    max-height: 480px;
    object-fit: cover;
  }

  @media (min-width: 1200px) {
    .lp-image-frame img {
      max-height: 560px;
    }
  }

  .lp-block-title {
    font-size: 1.375rem;
    font-weight: 700;
    line-height: 1.3;
    margin-bottom: 0.75rem;
    letter-spacing: -0.02em;
    max-width: ${LP.prose}px;
  }

  .lp-grid-2 .lp-block-title,
  .lp-grid-2 .lp-body-lg {
    max-width: none;
  }

  .tab-switcher-inner {
    display: flex;
    width: 100%;
    max-width: none;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid var(--mkt-border);
    flex-wrap: wrap;
  }

  .tab-switcher-inner button {
    flex: 1 1 200px;
  }

  @media (min-width: 900px) {
    .lp-hero-layout {
      display: grid;
      grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
      gap: clamp(2rem, 5vw, 4rem);
      align-items: center;
    }

    .lp-hero-title {
      max-width: 32rem;
    }
  }

  @media (max-width: 899px) {
    .lp-hero-copy {
      text-align: center;
    }

    .lp-hero-title,
    .lp-hero-subtitle {
      max-width: none;
      margin-left: auto;
      margin-right: auto;
    }

    .lp-hero .cta-buttons {
      justify-content: center !important;
    }
  }

  @media (max-width: 768px) {
    .lp-hero-title {
      font-size: 1.875rem;
    }

    .lp-hero-subtitle {
      font-size: 1.0625rem;
    }

    .lp-section-title--lg {
      font-size: 1.5rem;
    }
  }

  .feature-item:last-child {
    border-right: none;
  }

  @media (max-width: 1100px) {
    .feature-strip {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .feature-item {
      border-right: none !important;
      border-bottom: 1px solid var(--mkt-border) !important;
    }
    .lp-pillar-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .lp-grid-4 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 768px) {
    .nav-desktop { display: none !important; }
    .nav-mobile-toggle { display: flex !important; }
    .mobile-menu-overlay { display: block !important; }
    .lp-hero { padding: 3.5rem 0 2.5rem; }
    .lp-grid-2,
    .lp-grid-3,
    .lp-grid-4,
    .lp-pillar-grid {
      grid-template-columns: 1fr !important;
    }
    .feature-strip {
      grid-template-columns: 1fr !important;
    }
    .program-tabs-hero {
      grid-template-columns: 1fr !important;
      padding: 2rem 1.5rem !important;
      gap: 2rem !important;
    }
    .program-stats {
      grid-template-columns: 1fr 1fr !important;
    }
    .footer-grid {
      grid-template-columns: 1fr !important;
    }
    .hero-stats,
    .lp-hero-stats {
      flex-wrap: wrap !important;
    }
    .hero-stat {
      flex: 1 1 45% !important;
      border-right: none !important;
      border-bottom: 1px solid var(--mkt-border) !important;
    }
    .cta-buttons {
      flex-direction: column !important;
      align-items: stretch !important;
    }
    .cta-buttons button,
    .cta-buttons a {
      width: 100% !important;
      max-width: 320px !important;
      margin: 0 auto !important;
    }
    .tab-switcher > div {
      flex-direction: column !important;
      width: 100% !important;
    }
    .tab-switcher button {
      border-right: none !important;
      border-bottom: 1px solid var(--mkt-border) !important;
    }
  }

  @media (min-width: 769px) {
    .nav-mobile-toggle { display: none !important; }
    .nav-desktop { display: flex !important; }
    .mobile-menu-overlay { display: none !important; }
  }
`;
