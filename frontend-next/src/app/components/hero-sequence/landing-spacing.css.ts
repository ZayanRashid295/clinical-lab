/** Landing vertical rhythm — 8px grid, shared across Home / FCPS / JCAT. */

export const LANDING_SPACING_CSS = `
  .medprep-landing-v2 {
    /* ── 8px base scale ── */
    --lp-space-1: 0.25rem;  /* 4px */
    --lp-space-2: 0.5rem;   /* 8px */
    --lp-space-3: 0.75rem;  /* 12px */
    --lp-space-4: 1rem;     /* 16px */
    --lp-space-5: 1.25rem;  /* 20px */
    --lp-space-6: 1.5rem;   /* 24px */
    --lp-space-8: 2rem;     /* 32px */
    --lp-space-10: 2.5rem;  /* 40px */
    --lp-space-12: 3rem;    /* 48px */
    --lp-space-16: 4rem;    /* 64px */

    /* ── Semantic vertical rhythm ── */
    --lp-section-x: clamp(var(--lp-space-4), 4vw, var(--lp-space-8));
    --lp-section-y: clamp(var(--lp-space-8), 5vh, var(--lp-space-10));
    --lp-section-y-band: clamp(var(--lp-space-6), 3.5vh, var(--lp-space-8));
    --lp-section-y-cta: clamp(var(--lp-space-10), 6vh, var(--lp-space-12));

    --lp-hero-inset-top: clamp(var(--lp-space-12), 10vh, var(--lp-space-16));
    --lp-hero-inset-bottom: clamp(var(--lp-space-6), 4vh, var(--lp-space-10));
    --lp-hero-program-inset-top: clamp(var(--lp-space-10), 11vh, 5.5rem);
    --lp-hero-program-inset-bottom: clamp(var(--lp-space-12), 7vh, var(--lp-space-16));
    --lp-program-section-first-y: clamp(var(--lp-space-12), 8vh, var(--lp-space-16));

    --lp-head-gap: var(--lp-space-6);
    --lp-kicker-gap: var(--lp-space-3);
    --lp-title-gap: var(--lp-space-3);
    --lp-stack-sm: var(--lp-space-3);
    --lp-stack-md: var(--lp-space-4);
    --lp-stack-lg: var(--lp-space-6);
    --lp-grid-gap: var(--lp-space-4);
    --lp-grid-gap-lg: var(--lp-space-6);
    --lp-block-py: var(--lp-space-4);
    --lp-divider-gap: var(--lp-space-6);
  }

  /* ── Hero (more breathing room than body sections) ── */
  .medprep-landing-v2 .hero-cinematic-composition {
    padding: var(--lp-hero-inset-top) var(--lp-section-x) var(--lp-hero-inset-bottom) !important;
  }

  .medprep-landing-v2 .hero-cinematic--program .hero-cinematic-composition {
    padding-top: var(--lp-hero-program-inset-top) !important;
    padding-bottom: var(--lp-hero-program-inset-bottom) !important;
  }

  .medprep-landing-v2 .hero-cinematic .hero-brand-kicker {
    margin-bottom: var(--lp-stack-md) !important;
  }

  .medprep-landing-v2 .hero-cinematic .hero-brand-subtitle,
  .medprep-landing-v2 .hero-cinematic .hero-brand-subtitle--center {
    margin-bottom: var(--lp-stack-lg) !important;
  }

  .medprep-landing-v2 .hero-cinematic-action-zone {
    margin-top: var(--lp-stack-sm) !important;
    gap: var(--lp-stack-lg) !important;
  }

  .medprep-landing-v2 .hero-content-3d .cine-depth-layer + .cine-depth-layer {
    margin-top: var(--lp-stack-sm) !important;
  }

  .medprep-landing-v2 .hero-cinematic--program .hero-brand-title--center {
    margin-bottom: var(--lp-stack-sm) !important;
  }

  .medprep-landing-v2 .hero-cinematic--program .hero-cinematic-blended-slot {
    margin: var(--lp-space-1) 0 var(--lp-stack-sm) !important;
  }

  .medprep-landing-v2 .hero-cinematic--program .hero-brand-subtitle--center {
    margin-bottom: var(--lp-stack-md) !important;
  }

  .medprep-landing-v2 .hero-cinematic--program .hero-cinematic-action-zone {
    margin-top: var(--lp-space-2) !important;
    gap: var(--lp-stack-md) !important;
  }

  /* ── Hero → body transition ── */
  .medprep-landing-v2 .landing-cinematic .landing-content-bridge {
    margin-top: 0;
  }

  .medprep-landing-v2 .lp-program .landing-content-bridge > .cine-section:first-child .cine-section-inner {
    padding-top: var(--lp-program-section-first-y);
  }

  .medprep-landing-v2 .hero-cinematic--program .hero-cinematic-stats-rail {
    margin-top: var(--lp-stack-sm);
  }

  /* ── Footer ── */
  .medprep-landing-v2 .lp-footer {
    padding: var(--lp-space-16) 0 var(--lp-space-8) !important;
  }

  .medprep-landing-v2 .lp-footer-grid {
    gap: var(--lp-space-10) !important;
    margin-bottom: var(--lp-space-12) !important;
  }

  .medprep-landing-v2 .lp-footer-brand {
    margin-bottom: var(--lp-space-3) !important;
  }

  .medprep-landing-v2 .lp-footer-list li {
    margin-bottom: var(--lp-space-2);
  }

  @media (max-width: 640px) {
    .medprep-landing-v2 {
      --lp-section-y: var(--lp-space-8);
      --lp-section-y-band: var(--lp-space-6);
      --lp-section-y-cta: var(--lp-space-10);
      --lp-hero-inset-top: var(--lp-space-10);
      --lp-hero-inset-bottom: var(--lp-space-6);
      --lp-hero-program-inset-top: var(--lp-space-10);
      --lp-hero-program-inset-bottom: var(--lp-space-10);
      --lp-program-section-first-y: var(--lp-space-12);
    }

    .medprep-landing-v2 .lp-footer {
      padding: var(--lp-space-12) 0 var(--lp-space-6) !important;
    }

    .medprep-landing-v2 .lp-footer-grid {
      gap: var(--lp-space-8) !important;
      margin-bottom: var(--lp-space-8) !important;
    }
  }

  /* Program page — QBank carousel & resource screenshots */
  .medprep-landing-v2 .cine-program-media {
    margin-top: var(--lp-stack-lg);
  }

  .medprep-landing-v2 .cine-program-media .cine-qbank-showcase__rig {
    height: clamp(220px, 32vw, 320px);
  }
`;
