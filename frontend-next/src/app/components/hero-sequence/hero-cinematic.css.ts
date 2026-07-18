/** Cinematic scroll hero styles — Apple-level dark brand hero. */

export const HERO_CINEMATIC_CSS = `
  .landing-cinematic {
    background: var(--cine-bg, var(--mkt-bg));
  }

  .landing-cinematic .landing-cinematic-header {
    position: sticky;
    top: 0;
    z-index: 200;
    background: var(--cine-header-bg, var(--mkt-header-bg)) !important;
    backdrop-filter: blur(16px) saturate(140%);
    -webkit-backdrop-filter: blur(16px) saturate(140%);
    border-bottom: 1px solid var(--cine-border, var(--mkt-border)) !important;
  }

  .landing-cinematic .landing-cinematic-header a,
  .landing-cinematic .landing-cinematic-header button {
    color: var(--mkt-text) !important;
  }

  .landing-cinematic .landing-cinematic-header .nav-link-active {
    color: var(--mkt-accent) !important;
  }

  .landing-cinematic .landing-cinematic-header .mkt-theme-toggle {
    border-color: var(--mkt-border);
    color: var(--mkt-text-muted);
  }

  .landing-cinematic .landing-cinematic-header a[href="/landing-page"] > div:first-child {
    background: var(--mkt-accent) !important;
    box-shadow: none;
  }

  .hero-cinematic {
    position: relative;
    width: 100%;
    background: var(--cine-hero-bg, var(--mkt-bg-muted));
    margin: 0;
    padding: 0;
    isolation: isolate;
  }

  .hero-cinematic-sticky {
    position: sticky;
    top: 0;
    height: 100vh;
    height: 100dvh;
    min-height: 32rem;
    width: 100%;
    overflow: hidden;
    background: var(--cine-hero-bg, var(--mkt-bg-muted));
    perspective: 1400px;
  }

  /* ── Centered blend: 3D core + cinematic copy in one stack ── */
  .hero-cinematic-composition {
    position: relative;
    z-index: 1;
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: clamp(4.5rem, 11vh, 6.5rem) clamp(1.25rem, 4vw, 2rem)
      clamp(1.5rem, 4vh, 2.5rem);
    perspective: 1400px;
    transform-style: preserve-3d;
    overflow: hidden;
  }

  .hero-cinematic-blend-visual {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
  }

  .hero-cinematic-blend-visual .hero-background-vignette {
    display: none;
  }

  .hero-cinematic-blend-scrim {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    background:
      radial-gradient(
        ellipse 46% 40% at 50% 36%,
        color-mix(in srgb, var(--cine-hero-bg, var(--mkt-bg-muted)) 55%, transparent) 0%,
        color-mix(in srgb, var(--cine-hero-bg, var(--mkt-bg-muted)) 22%, transparent) 48%,
        transparent 78%
      ),
      linear-gradient(
        to top,
        color-mix(in srgb, var(--cine-hero-bg, var(--mkt-bg-muted)) 92%, transparent) 0%,
        color-mix(in srgb, var(--cine-hero-bg, var(--mkt-bg-muted)) 35%, transparent) 10%,
        transparent 24%
      );
  }

  .hero-background {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    background: transparent;
  }

  .hero-background-canvas {
    display: block;
    width: 100% !important;
    height: 100% !important;
    background: transparent;
  }

  .hero-cinematic-copy--center {
    position: relative;
    z-index: 2;
    width: 100%;
    max-width: min(54rem, 94vw);
    margin: 0 auto;
    padding: 0 !important;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    pointer-events: auto;
    transform-style: preserve-3d;
  }

  .cine-content-3d {
    width: 100%;
    transform-style: preserve-3d;
  }

  .cine-content-3d-rig {
    transform-style: preserve-3d;
    will-change: transform;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .cine-depth-layer {
    transform-style: preserve-3d;
    backface-visibility: hidden;
  }

  .hero-content-3d--center {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    text-align: center;
  }

  .hero-content-3d--center .cine-content-3d-rig {
    align-items: center;
    width: 100%;
  }

  .hero-content-3d--center .cine-depth-layer {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  }

  .hero-content-3d .cine-depth-layer + .cine-depth-layer {
    margin-top: 0.625rem;
  }

  .hero-cinematic-title-zone {
    position: relative;
    margin: 0.35rem 0 0;
    padding: 0.25rem 0;
    z-index: 2;
  }

  .hero-cinematic-title-zone::before {
    content: "";
    position: absolute;
    left: 50%;
    top: 55%;
    transform: translate(-50%, -50%);
    width: 115%;
    height: 130%;
    background: radial-gradient(
      ellipse at center,
      color-mix(in srgb, var(--cine-accent, var(--mkt-accent)) 18%, transparent) 0%,
      color-mix(in srgb, var(--cine-accent, var(--mkt-accent)) 6%, transparent) 50%,
      transparent 75%
    );
    pointer-events: none;
    z-index: -1;
    filter: blur(22px);
    opacity: 0.75;
  }

  .hero-cinematic-blended-slot {
    margin: -3.5rem 0 -1rem;
    width: 100%;
    display: flex;
    justify-content: center;
    pointer-events: auto;
    transform-style: preserve-3d;
  }

  .hero-cinematic-blended-slot .monitor-3d-scene {
    width: min(100%, 400px);
    height: min(38vh, 260px);
    opacity: 0.96;
    filter: drop-shadow(0 24px 48px color-mix(in srgb, var(--mkt-accent) 25%, transparent));
  }

  .hero-brand-kicker--center {
    justify-content: center;
  }

  .hero-brand-title--center {
    text-align: center !important;
    margin: 0 auto !important;
    background: linear-gradient(
      180deg,
      var(--cine-title-from, var(--mkt-text)) 0%,
      var(--cine-title-to, var(--mkt-accent-muted)) 100%
    );
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent !important;
    text-shadow: none;
    filter: drop-shadow(0 0 32px color-mix(in srgb, var(--cine-accent) 35%, transparent));
  }

  .hero-brand-subtitle--center {
    text-align: center !important;
    margin: 0 auto 1.25rem !important;
    color: var(--cine-body, var(--cine-text, var(--mkt-text))) !important;
    text-shadow: none;
  }

  .hero-brand-punchlines--center {
    justify-content: center;
  }

  .hero-brand-cta--center {
    justify-content: center;
    position: relative;
    z-index: 1;
  }

  .hero-cinematic-action-zone {
    position: relative;
    width: 100%;
    max-width: 40rem;
    margin: 0.75rem auto 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.375rem;
  }

  .hero-cinematic-action-glow {
    position: absolute;
    top: 28%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 130%;
    height: 180%;
    background: radial-gradient(
      ellipse at center,
      color-mix(in srgb, var(--cine-accent, var(--mkt-accent)) 18%, transparent) 0%,
      color-mix(in srgb, var(--cine-accent, var(--mkt-accent)) 6%, transparent) 45%,
      transparent 72%
    );
    pointer-events: none;
    z-index: 0;
    filter: blur(12px);
  }

  .hero-cinematic-stats-rail {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: stretch;
    width: 100%;
    padding: 0.125rem 0;
    background: var(--cine-stat-rail-bg, var(--mkt-bg-elevated));
    border: 1px solid var(--cine-stat-rail-border, var(--mkt-border));
    border-radius: 18px;
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    box-shadow: 0 8px 32px color-mix(in srgb, var(--mkt-shadow) 100%, transparent);
    overflow: hidden;
  }

  html.dark .hero-cinematic-stats-rail {
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.28),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }

  .hero-cinematic-stats-rail::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      color-mix(in srgb, var(--cine-accent, var(--mkt-accent)) 6%, transparent) 50%,
      transparent 100%
    );
    pointer-events: none;
  }

  .hero-cinematic-stat {
    flex: 1;
    min-width: 0;
    text-align: center;
    padding: 1rem 0.625rem;
  }

  .hero-cinematic-stat-divider {
    width: 1px;
    flex-shrink: 0;
    margin: 0.75rem 0;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      color-mix(in srgb, var(--cine-accent, var(--mkt-accent)) 28%, transparent) 50%,
      transparent 100%
    );
  }

  .hero-cinematic-action-zone .hero-cinematic-stat-num {
    font-size: clamp(1.125rem, 2.4vw, 1.375rem);
    font-weight: 700;
    letter-spacing: -0.03em;
    line-height: 1.1;
    background: linear-gradient(
      180deg,
      var(--cine-stat-num-from, var(--cine-title-from, var(--mkt-text))) 0%,
      var(--cine-stat-num-to, var(--cine-title-to, var(--mkt-accent))) 100%
    );
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent !important;
    filter: drop-shadow(0 0 14px color-mix(in srgb, var(--cine-accent, var(--mkt-accent)) 35%, transparent));
  }

  html:not(.dark) .hero-cinematic-action-zone .hero-cinematic-stat-num {
    filter: none;
  }

  .hero-cinematic-action-zone .hero-cinematic-stat-label {
    font-size: 0.625rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--cine-text, var(--mkt-text)) !important;
    opacity: 0.88;
    margin-top: 0.35rem;
    line-height: 1.35;
  }

  html.dark .hero-cinematic-action-zone .hero-cinematic-stat-label {
    color: rgba(226, 232, 240, 0.92) !important;
    opacity: 1;
  }

  .hero-cinematic-cta-glow--center {
    left: 50%;
    transform: translateX(-50%);
    width: 18rem;
    bottom: -1rem;
  }

  .hero-cinematic-copy {
    position: relative;
    z-index: 10;
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 100%;
    max-width: min(44rem, 100%);
    margin: 0;
    padding: clamp(5.5rem, 12vh, 7rem) clamp(1.5rem, 5vw, 2rem)
      clamp(1.5rem, 4vh, 2.5rem);
    pointer-events: auto;
    color: var(--cine-text, var(--mkt-text));
  }

  @media (min-width: 960px) {
    .hero-cinematic-copy {
      padding: clamp(5rem, 10vh, 6.5rem) clamp(1rem, 2vw, 1.5rem)
        clamp(2rem, 6vh, 3rem) clamp(1.5rem, 3vw, 2rem);
    }
  }

  .hero-cinematic-visual {
    position: relative;
    z-index: 1;
    flex: 1;
    min-height: 14rem;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  @media (min-width: 960px) {
    .hero-cinematic-visual {
      min-height: 0;
      height: 100%;
    }
  }

  .hero-cinematic-visual .hero-sequence-canvas-wrap {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .hero-cinematic-visual-gradient {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(
      to right,
      color-mix(in srgb, var(--cine-hero-bg, var(--mkt-bg-muted)) 55%, transparent) 0%,
      color-mix(in srgb, var(--cine-hero-bg, var(--mkt-bg-muted)) 8%, transparent) 18%,
      transparent 42%
    );
    z-index: 2;
  }

  @media (max-width: 959px) {
    .hero-cinematic-visual-gradient {
      background: linear-gradient(
        to top,
        color-mix(in srgb, var(--cine-hero-bg, var(--mkt-bg-muted)) 90%, transparent) 0%,
        color-mix(in srgb, var(--cine-hero-bg, var(--mkt-bg-muted)) 35%, transparent) 40%,
        transparent 70%
      );
    }
  }

  .hero-cinematic-program-bg {
    position: absolute;
    inset: 0;
    z-index: 0;
    opacity: 0.28;
    pointer-events: none;
  }

  .hero-background--program {
    opacity: 1;
  }

  .hero-background-vignette {
    display: none;
  }

  .hero-orbital-core {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .hero-orbital-core--ambient {
    opacity: 0.35;
    filter: blur(2px);
  }

  .hero-orbital-core-canvas {
    display: block;
    width: 100% !important;
    height: 100% !important;
  }

  .hero-orbital-core-vignette {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(
      ellipse at 50% 40%,
      transparent 30%,
      color-mix(in srgb, var(--cine-hero-bg, var(--mkt-bg-muted)) 20%, transparent) 65%,
      color-mix(in srgb, var(--cine-hero-bg, var(--mkt-bg-muted)) 50%, transparent) 100%
    );
  }

  .hero-cinematic-program-bg-canvas {
    width: 100%;
    height: 100%;
  }

  /* ── CSS 3D monitor (FCPS / JCAT) ── */
  .monitor-3d-scene {
    position: relative;
    width: min(100%, 520px);
    height: min(72vh, 480px);
    display: flex;
    align-items: center;
    justify-content: center;
    perspective: 1400px;
    transform-style: preserve-3d;
  }

  .monitor-3d-rig {
    transform-style: preserve-3d;
    transition: transform 0.08s linear;
    will-change: transform;
  }

  .monitor-3d-scene--straight {
    height: auto;
    min-height: 0;
    align-items: center;
    justify-content: center;
    perspective: none;
    overflow: visible;
  }

  .monitor-3d-scene--straight .monitor-3d-rig {
    transform: none;
    transition: none;
  }

  .monitor-3d-scene--zoomable {
    pointer-events: auto;
  }

  .monitor-3d-scene--zoomable .monitor-mockup-trigger {
    width: 100%;
  }

  .monitor-3d-scene--zoomable .monitor-mockup-zoom-hint {
    opacity: 0;
  }

  .monitor-3d-scene--zoomable .monitor-mockup-trigger:hover .monitor-mockup-zoom-hint,
  .monitor-3d-scene--zoomable .monitor-mockup-trigger:focus-visible .monitor-mockup-zoom-hint {
    opacity: 1;
  }

  .monitor-3d-rig .monitor-mockup {
    max-width: min(92vw, 480px);
    filter: drop-shadow(0 32px 64px rgba(0, 0, 0, 0.55));
  }

  .monitor-3d-glow {
    position: absolute;
    bottom: 8%;
    left: 50%;
    transform: translateX(-50%);
    width: 70%;
    height: 28%;
    background: radial-gradient(
      ellipse at center,
      color-mix(in srgb, var(--mkt-accent) 45%, transparent),
      color-mix(in srgb, var(--mkt-accent) 12%, transparent) 45%,
      transparent 70%
    );
    filter: blur(28px);
    pointer-events: none;
    z-index: 0;
  }

  .monitor-3d-floor {
    position: absolute;
    bottom: 4%;
    left: 50%;
    transform: translateX(-50%) rotateX(78deg);
    width: 55%;
    height: 12%;
    background: radial-gradient(
      ellipse at center,
      color-mix(in srgb, var(--mkt-accent) 22%, transparent),
      transparent 70%
    );
    filter: blur(12px);
    pointer-events: none;
  }

  .hero-cinematic-stage {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
  }

  .hero-sequence-canvas-wrap {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    min-height: 100%;
  }

  .hero-sequence-canvas {
    display: block;
    width: 100% !important;
    height: 100% !important;
    object-fit: cover;
  }

  .hero-cinematic-cta-glow {
    position: absolute;
    bottom: -2rem;
    left: 0;
    width: 12rem;
    height: 4rem;
    background: radial-gradient(
      ellipse,
      color-mix(in srgb, var(--mkt-accent) 40%, transparent),
      transparent 70%
    );
    filter: blur(24px);
    pointer-events: none;
  }

  .hero-cinematic-scroll-hint {
    position: absolute;
    bottom: 1.5rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 12;
    opacity: 0.45;
    pointer-events: none;
  }

  .hero-cinematic-scroll-label {
    font-size: 0.6875rem;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: lowercase;
    color: var(--cine-muted, var(--mkt-text-muted));
  }

  @keyframes hero-scroll-pulse {
    0%, 100% { opacity: 0.35; transform: scaleY(0.85); }
    50% { opacity: 0.85; transform: scaleY(1); }
  }

  /* Typography — follows app marketing theme */
  .hero-cinematic .hero-brand-kicker {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--cine-accent-muted, var(--mkt-accent-muted)) !important;
    margin-bottom: 1.25rem;
  }

  .hero-cinematic .hero-brand-kicker-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--cine-accent, var(--mkt-accent));
    box-shadow: 0 0 12px color-mix(in srgb, var(--cine-accent, var(--mkt-accent)) 65%, transparent);
  }

  .hero-cinematic .hero-brand-title {
    color: var(--cine-text, var(--mkt-text)) !important;
    margin: 0 !important;
    text-shadow:
      0 1px 2px color-mix(in srgb, var(--cine-hero-bg, var(--mkt-bg)) 55%, transparent),
      0 8px 40px color-mix(in srgb, var(--cine-hero-bg, var(--mkt-bg)) 45%, transparent),
      0 0 48px color-mix(in srgb, var(--cine-accent, var(--mkt-accent)) 18%, transparent);
  }

  .hero-cinematic .hero-brand-subtitle {
    color: var(--cine-text, var(--mkt-text)) !important;
    margin: 0.35rem 0 1.5rem !important;
    opacity: 0.95;
    text-shadow: 0 2px 24px color-mix(in srgb, var(--cine-hero-bg, var(--mkt-bg)) 50%, transparent);
  }

  .hero-cinematic .hero-brand-punchlines {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin: 0 0 1.75rem;
    padding: 0;
    list-style: none;
    justify-content: center;
    position: relative;
    z-index: 2;
  }

  .hero-cinematic .hero-brand-punchlines li {
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--cine-text, var(--mkt-text)) !important;
    border: 1px solid color-mix(in srgb, var(--cine-accent, var(--mkt-accent)) 40%, var(--cine-border, var(--mkt-border)));
    border-radius: 999px;
    padding: 0.4rem 0.9rem;
    background: color-mix(
      in srgb,
      var(--cine-bg-elevated, var(--mkt-bg-elevated)) 78%,
      var(--cine-accent, var(--mkt-accent)) 22%
    );
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 20px color-mix(in srgb, var(--cine-hero-bg, var(--mkt-bg)) 28%, transparent);
  }

  .hero-cinematic .hero-brand-cta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
  }

  .hero-cinematic .hero-btn-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.9375rem 1.75rem;
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--cine-on-accent, #ffffff) !important;
    background: linear-gradient(135deg, var(--cine-accent, var(--mkt-accent)) 0%, var(--cine-accent-hover, var(--mkt-accent-hover)) 100%);
    border: none;
    border-radius: 999px;
    cursor: pointer;
    min-width: 10.5rem;
    box-shadow: 0 0 32px color-mix(in srgb, var(--cine-accent, var(--mkt-accent)) 40%, transparent);
    transition: background 0.35s cubic-bezier(0.22, 1, 0.36, 1),
      transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
      box-shadow 0.35s cubic-bezier(0.22, 1, 0.36, 1);
    font-family: inherit;
  }

  .hero-cinematic .hero-btn-primary:hover {
    filter: brightness(1.06);
    transform: translateY(-2px);
    box-shadow: 0 0 40px color-mix(in srgb, var(--cine-accent, var(--mkt-accent)) 55%, transparent);
  }

  .hero-cinematic .hero-btn-ghost {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.9375rem 1.75rem;
    font-size: 0.9375rem;
    font-weight: 500;
    color: var(--cine-text, var(--mkt-text)) !important;
    background: var(--mkt-bg-elevated);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid var(--cine-border, var(--mkt-border));
    border-radius: 999px;
    cursor: pointer;
    min-width: 10.5rem;
    transition: border-color 0.35s cubic-bezier(0.22, 1, 0.36, 1),
      background 0.35s cubic-bezier(0.22, 1, 0.36, 1),
      transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
    font-family: inherit;
  }

  .hero-cinematic .hero-btn-ghost:hover {
    border-color: var(--cine-accent, var(--mkt-accent));
    background: var(--cine-accent-soft, var(--mkt-accent-soft));
    transform: translateY(-1px);
  }

  .hero-cinematic-stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.75rem 0;
    margin-top: 2.25rem;
    padding-top: 1.75rem;
    border-top: 1px solid var(--cine-border, var(--mkt-border));
    max-width: 38rem;
  }

  .hero-cinematic-stat-num {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--cine-text, var(--mkt-text)) !important;
    letter-spacing: -0.02em;
  }

  .hero-cinematic-stat-label {
    font-size: 0.6875rem;
    color: var(--cine-muted, var(--mkt-text-muted)) !important;
    margin-top: 0.15rem;
    line-height: 1.35;
  }

  .landing-content-bridge {
    position: relative;
    z-index: 5;
  }

  @media (max-width: 959px) {
    .hero-cinematic-composition {
      padding-top: clamp(5rem, 14vh, 7rem);
    }

    .hero-cinematic-blended-slot {
      margin: -1.25rem 0 0;
    }

    .hero-cinematic-blended-slot .monitor-3d-scene {
      height: min(34vh, 220px);
    }
  }

  @media (max-width: 768px) {
    .hero-cinematic-action-zone {
      max-width: 22rem;
      gap: 1.125rem;
    }

    .hero-cinematic-stats-rail {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      padding: 0.25rem;
      border-radius: 16px;
    }

    .hero-cinematic-stat-divider {
      display: none;
    }

    .hero-cinematic-stat {
      padding: 0.875rem 0.5rem;
    }

    .hero-cinematic .hero-brand-cta {
      flex-direction: column;
      align-items: stretch;
      width: 100%;
    }

    .hero-brand-cta--center .hero-btn-primary,
    .hero-brand-cta--center .hero-btn-ghost {
      width: 100%;
      min-width: 0;
    }
  }

  /* ── FCPS / JCAT program hero — content-fit (no 100vh clip on stats rail) ── */
  .hero-cinematic--program .hero-cinematic-sticky {
    position: relative;
    top: auto;
    height: auto;
    min-height: 100vh;
    min-height: 100dvh;
    overflow: visible;
  }

  .hero-cinematic--program .hero-cinematic-composition {
    align-items: center;
    justify-content: center;
    height: auto;
    min-height: 100vh;
    min-height: 100dvh;
    padding: clamp(6.5rem, 14vh, 8.5rem) clamp(1.25rem, 4vw, 2rem)
      clamp(1.5rem, 4vh, 2.5rem);
    overflow: visible;
  }

  .hero-cinematic--program .hero-cinematic-copy--center {
    max-width: min(52rem, 96vw);
    padding-bottom: 0;
    position: relative;
    z-index: 3;
    margin-left: auto;
    margin-right: auto;
  }

  .hero-cinematic--program .hero-cinematic-blend-visual--program {
    opacity: 1;
    z-index: 0;
  }

  .hero-cinematic--program .hero-cinematic-blend-visual--program .hero-background-vignette {
    display: none;
  }

  .hero-cinematic--program .hero-cinematic-action-glow {
    display: none;
  }

  /* Flatten parallax layers so the monitor does not overlap copy below */
  .hero-cinematic--program .cine-content-3d-rig,
  .hero-cinematic--program .cine-depth-layer {
    transform: none !important;
  }

  .hero-cinematic--program .hero-brand-title--center {
    margin-bottom: 0.75rem !important;
  }

  .hero-cinematic--program .hero-cinematic-blended-slot {
    margin: 0.25rem 0 0.75rem;
    width: 100%;
    display: flex;
    justify-content: center;
    position: relative;
    z-index: 2;
  }

  .hero-cinematic--program .hero-cinematic-blended-slot .monitor-3d-scene {
    width: min(100%, 500px);
    height: auto !important;
    min-height: 0;
    perspective: none;
    overflow: visible;
    opacity: 1;
    filter: none;
  }

  .hero-cinematic--program .hero-cinematic-blended-slot .monitor-mockup,
  .hero-cinematic--program .hero-cinematic-blended-slot .monitor-mockup-trigger {
    max-width: min(94vw, 500px);
    filter: drop-shadow(0 24px 48px color-mix(in srgb, var(--mkt-accent) 22%, transparent));
  }

  .hero-cinematic--program .hero-cinematic-blended-slot + .cine-depth-layer {
    position: relative;
    z-index: 3;
    margin-top: 0;
  }

  .hero-cinematic--program .hero-brand-subtitle--center {
    margin: 0 auto 1rem !important;
    padding-top: 0.25rem;
    max-width: min(58rem, 94vw) !important;
  }

  .hero-cinematic--program .hero-cinematic-action-zone {
    margin-top: 0.25rem;
    gap: 1.125rem;
    max-width: min(44rem, 100%);
  }

  .hero-cinematic--program .hero-brand-cta--center {
    gap: 0.625rem;
  }

  .hero-cinematic--program .hero-cinematic-stats-rail {
    width: 100%;
    max-width: 44rem;
    margin-bottom: 0.125rem;
  }

  .hero-cinematic--program .hero-cinematic-stat {
    padding: 0.875rem 0.625rem 1rem;
  }

  .hero-cinematic--program .hero-cinematic-stat-num {
    font-size: clamp(1rem, 2vw, 1.25rem);
  }

  .hero-cinematic--program .hero-cinematic-action-zone .hero-cinematic-stat-label {
    text-transform: none !important;
    letter-spacing: 0.01em !important;
    font-size: 0.8125rem !important;
    font-weight: 600 !important;
    line-height: 1.4 !important;
    color: rgba(241, 245, 249, 0.95) !important;
    opacity: 1 !important;
    text-wrap: balance;
    hyphens: auto;
  }

  html:not(.dark) .hero-cinematic--program .hero-cinematic-action-zone .hero-cinematic-stat-label {
    color: var(--cine-text, var(--mkt-text)) !important;
    opacity: 0.9 !important;
  }

  @media (min-width: 769px) and (max-width: 1100px) {
    .hero-cinematic--program .hero-cinematic-stats-rail {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .hero-cinematic--program .hero-cinematic-stat-divider {
      display: none;
    }
  }

  @media (max-height: 860px) {
    .hero-cinematic--program .hero-cinematic-blended-slot .monitor-mockup,
    .hero-cinematic--program .hero-cinematic-blended-slot .monitor-mockup-trigger {
      max-width: min(88vw, 420px);
    }

    .hero-cinematic--program .hero-cinematic-blended-slot {
      margin: 0.125rem 0 0.5rem;
    }

    .hero-cinematic--program .hero-brand-subtitle--center {
      margin-bottom: 0.75rem !important;
    }

    .hero-cinematic--program .hero-cinematic-action-zone {
      gap: 0.875rem;
    }
  }

  @media (max-width: 768px) {
    .hero-cinematic--program .hero-cinematic-blended-slot .monitor-mockup,
    .hero-cinematic--program .hero-cinematic-blended-slot .monitor-mockup-trigger {
      max-width: min(94vw, 440px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .hero-cinematic-scroll-hint,
    .hero-cinematic-scroll-line {
      animation: none !important;
      display: none;
    }
  }
`;
