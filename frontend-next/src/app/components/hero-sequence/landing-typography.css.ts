/** Normalized landing typography — one scale for Home, FCPS, JCAT. */

export const LANDING_TYPOGRAPHY_CSS = `
  .medprep-landing-v2 {
    /* H1 — page hero (identical on Home, FCPS, JCAT) */
    --lp-h1-size: clamp(2.5rem, 6.5vw, 4.5rem);
    --lp-h1-lh: 1.02;
    --lp-h1-weight: 700;
    --lp-h1-tracking: -0.04em;
    --lp-h1-max-w: min(26rem, 94vw);

    /* H2 — section titles */
    --lp-h2-size: clamp(1.875rem, 3.8vw, 2.875rem);
    --lp-h2-lh: 1.08;
    --lp-h2-weight: 700;
    --lp-h2-tracking: -0.035em;
    --lp-h2-max-w: min(72rem, 94vw);

    /* H3 — card / step titles */
    --lp-h3-size: clamp(0.9375rem, 1.8vw, 1.0625rem);
    --lp-h3-lh: 1.35;
    --lp-h3-weight: 600;
    --lp-h3-tracking: -0.02em;

    /* H4 — feature labels (uppercase) */
    --lp-h4-size: 0.8125rem;
    --lp-h4-lh: 1.35;
    --lp-h4-weight: 600;
    --lp-h4-tracking: 0.08em;

    /* H4 — footer / UI group labels */
    --lp-h4-ui-size: 1rem;
    --lp-h4-ui-lh: 1.35;
    --lp-h4-ui-weight: 600;
    --lp-h4-ui-tracking: -0.01em;

    /* Section lead */
    --lp-lead-size: clamp(1rem, 2vw, 1.125rem);
    --lp-lead-lh: 1.5;
    --lp-lead-max-w: min(52rem, 94vw);

    /* Hero subtitle — larger / stronger than section leads */
    --lp-hero-sub-size: clamp(1.25rem, 2.8vw, 1.625rem);
    --lp-hero-sub-lh: 1.4;
    --lp-hero-sub-weight: 500;
    --lp-hero-sub-max-w: min(40rem, 94vw);

    /* Kickers */
    --lp-kicker-hero-size: 0.8125rem;
    --lp-kicker-hero-tracking: 0.14em;
    --lp-kicker-section-size: 0.6875rem;
    --lp-kicker-section-tracking: 0.16em;

    /* FAQ question (button, not a heading) */
    --lp-faq-q-size: clamp(0.9375rem, 1.8vw, 1.0625rem);
    --lp-faq-q-lh: 1.35;
    --lp-faq-q-weight: 600;
    --lp-faq-q-tracking: -0.02em;
  }

  /* ── H1 ── */
  .medprep-landing-v2 .hero-brand-title,
  .medprep-landing-v2 .lp-h1 {
    font-size: var(--lp-h1-size) !important;
    line-height: var(--lp-h1-lh) !important;
    font-weight: var(--lp-h1-weight) !important;
    letter-spacing: var(--lp-h1-tracking) !important;
    max-width: var(--lp-h1-max-w) !important;
    text-wrap: balance;
  }

  /* ── H2 ── */
  .medprep-landing-v2 .cine-section-title,
  .medprep-landing-v2 .lp-h2 {
    font-size: var(--lp-h2-size);
    line-height: var(--lp-h2-lh);
    font-weight: var(--lp-h2-weight);
    letter-spacing: var(--lp-h2-tracking);
    max-width: var(--lp-h2-max-w);
    text-wrap: balance;
  }

  .medprep-landing-v2 .cine-section-head {
    max-width: var(--lp-h2-max-w);
  }

  .medprep-landing-v2 .cine-section-head--left .cine-section-title {
    text-align: left;
  }

  .medprep-landing-v2 .cine-section-head--center .cine-section-title {
    text-align: center;
    margin-left: auto;
    margin-right: auto;
  }

  /* ── H3 ── */
  .medprep-landing-v2 .cine-text-block h3,
  .medprep-landing-v2 .lp-h3 {
    font-size: var(--lp-h3-size);
    line-height: var(--lp-h3-lh);
    font-weight: var(--lp-h3-weight);
    letter-spacing: var(--lp-h3-tracking);
    text-wrap: balance;
  }

  /* ── H4 feature label ── */
  .medprep-landing-v2 .cine-text-block--feature h4,
  .medprep-landing-v2 .lp-h4 {
    font-size: var(--lp-h4-size);
    line-height: var(--lp-h4-lh);
    font-weight: var(--lp-h4-weight);
    letter-spacing: var(--lp-h4-tracking);
    text-transform: uppercase;
    text-wrap: balance;
  }

  /* ── H4 footer / UI ── */
  .medprep-landing-v2 .lp-h4-ui {
    font-size: var(--lp-h4-ui-size);
    line-height: var(--lp-h4-ui-lh);
    font-weight: var(--lp-h4-ui-weight);
    letter-spacing: var(--lp-h4-ui-tracking);
    margin: 0 0 0.75rem;
    color: var(--cine-text, var(--mkt-text));
  }

  /* ── Section leads ── */
  .medprep-landing-v2 .cine-section-lead {
    font-size: var(--lp-lead-size) !important;
    line-height: var(--lp-lead-lh) !important;
    max-width: var(--lp-lead-max-w) !important;
    text-wrap: balance;
  }

  /* ── Hero subtitle ── */
  .medprep-landing-v2 .hero-cinematic .hero-brand-subtitle,
  .medprep-landing-v2 .hero-cinematic .hero-brand-subtitle--center,
  .medprep-landing-v2 .hero-cinematic--program .hero-brand-subtitle--center {
    font-size: var(--lp-hero-sub-size) !important;
    line-height: var(--lp-hero-sub-lh) !important;
    font-weight: var(--lp-hero-sub-weight) !important;
    max-width: var(--lp-hero-sub-max-w) !important;
    text-wrap: balance;
  }

  /* Product pages — wider subtitle so copy sits on ~2–3 lines */
  .medprep-landing-v2 .hero-cinematic--program .hero-brand-subtitle--center {
    max-width: min(58rem, 94vw) !important;
    text-wrap: pretty;
  }

  .medprep-landing-v2 .cine-section-head--left .cine-section-lead {
    text-align: left;
    margin-left: 0;
    margin-right: 0;
  }

  .medprep-landing-v2 .cine-section-head--center .cine-section-lead {
    text-align: center;
    margin-left: auto;
    margin-right: auto;
  }

  /* ── Kickers ── */
  .medprep-landing-v2 .hero-brand-kicker {
    font-size: var(--lp-kicker-hero-size);
    letter-spacing: var(--lp-kicker-hero-tracking);
  }

  .medprep-landing-v2 .cine-section-kicker {
    font-size: var(--lp-kicker-section-size);
    letter-spacing: var(--lp-kicker-section-tracking);
    margin-bottom: var(--lp-kicker-gap);
  }

  /* ── FAQ questions ── */
  .medprep-landing-v2 .cine-faq-trigger {
    font-size: var(--lp-faq-q-size);
    line-height: var(--lp-faq-q-lh);
    font-weight: var(--lp-faq-q-weight);
    letter-spacing: var(--lp-faq-q-tracking);
  }

  /* Desktop: widen heading containers before type shrinks; single line when width allows */
  @media (min-width: 1024px) {
    .medprep-landing-v2 .cine-section-head--left .cine-section-title {
      max-width: var(--lp-h2-max-w);
    }

    .medprep-landing-v2 .cine-section-lead {
      max-width: var(--lp-lead-max-w);
    }

    .medprep-landing-v2 .cine-text-block h3,
    .medprep-landing-v2 .lp-h3 {
      text-wrap: pretty;
    }
  }

  @media (max-width: 640px) {
    .medprep-landing-v2 {
      --lp-h1-size: clamp(2.125rem, 9vw, 2.75rem);
      --lp-h2-size: clamp(1.625rem, 6.5vw, 2.25rem);
    }
  }
`;
