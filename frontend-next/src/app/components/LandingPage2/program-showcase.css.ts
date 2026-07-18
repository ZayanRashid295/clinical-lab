/** Premium cinematic 3D showcase — QBank carousel & resource cards. */

export const PROGRAM_SHOWCASE_CSS = `
  /* ── QBank cinematic carousel ── */
  .cine-qbank-showcase {
    position: relative;
    width: 100%;
    padding: 0 clamp(2.75rem, 6vw, 3.75rem);
    touch-action: pan-y;
  }

  .cine-qbank-showcase__ambient {
    position: absolute;
    inset: 8% 12% 14%;
    pointer-events: none;
    z-index: 0;
    border-radius: 50%;
    background: radial-gradient(
      ellipse 55% 48% at 50% 52%,
      color-mix(in srgb, var(--mkt-accent) 16%, transparent) 0%,
      color-mix(in srgb, var(--mkt-accent) 5%, transparent) 42%,
      transparent 72%
    );
    filter: blur(28px);
    animation: cine-qbank-glow-pulse 7s ease-in-out infinite;
  }

  @keyframes cine-qbank-glow-pulse {
    0%, 100% { opacity: 0.55; transform: scale(1); }
    50% { opacity: 0.85; transform: scale(1.04); }
  }

  .cine-qbank-showcase__spotlight {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 1;
    background: radial-gradient(
      circle at var(--cine-pointer-x, 50%) var(--cine-pointer-y, 42%),
      color-mix(in srgb, #ffffff 9%, transparent) 0%,
      transparent 42%
    );
    opacity: 0.9;
    transition: opacity 0.35s ease;
  }

  .cine-qbank-showcase__rig {
    position: relative;
    z-index: 2;
    height: clamp(220px, 32vw, 320px);
    perspective: 2100px;
    perspective-origin: 50% 46%;
    transform-style: preserve-3d;
  }

  .cine-qbank-slide {
    position: absolute;
    left: 50%;
    top: 50%;
    width: min(76%, 720px);
    aspect-ratio: 2.4 / 1;
    margin: 0;
    transform-style: preserve-3d;
    will-change: transform, opacity, filter;
    backface-visibility: hidden;
  }

  .cine-qbank-slide--interactive {
    cursor: zoom-in;
  }

  .cine-qbank-card {
    position: relative;
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
    will-change: transform;
  }

  .cine-qbank-card__shell {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 16px;
    overflow: hidden;
    background: var(--mkt-bg-elevated);
    border: 1px solid color-mix(in srgb, var(--mkt-border) 88%, #ffffff 12%);
    box-shadow:
      0 2px 0 color-mix(in srgb, #ffffff 14%, transparent) inset,
      0 28px 56px -16px rgba(0, 0, 0, 0.45),
      0 12px 24px -12px color-mix(in srgb, var(--mkt-accent) 18%, transparent);
    transform-style: preserve-3d;
  }

  .cine-qbank-card__shell img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    object-position: center top;
  }

  .cine-qbank-card__sheen {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(
      115deg,
      transparent 0%,
      transparent 38%,
      color-mix(in srgb, #ffffff 22%, transparent) 48%,
      transparent 58%,
      transparent 100%
    );
    transform: translateX(-120%) skewX(-12deg);
    animation: cine-glass-sweep 5.5s ease-in-out infinite;
  }

  .cine-qbank-slide:not(.cine-qbank-slide--active) .cine-qbank-card__sheen {
    animation: none;
    opacity: 0;
  }

  @keyframes cine-glass-sweep {
    0%, 72% { transform: translateX(-120%) skewX(-12deg); opacity: 0; }
    78% { opacity: 0.65; }
    100% { transform: translateX(120%) skewX(-12deg); opacity: 0; }
  }

  .cine-qbank-card__floor {
    position: absolute;
    left: 10%;
    right: 10%;
    bottom: -14%;
    height: 18%;
    border-radius: 50%;
    background: radial-gradient(
      ellipse at center,
      rgba(0, 0, 0, 0.34) 0%,
      transparent 72%
    );
    filter: blur(10px);
    transform: translateZ(-1px);
    pointer-events: none;
  }

  .cine-qbank-zoom-hint {
    position: absolute;
    right: 12px;
    bottom: 12px;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--mkt-bg) 72%, transparent);
    border: 1px solid color-mix(in srgb, var(--mkt-border) 80%, transparent);
    color: var(--mkt-text-muted);
    opacity: 0;
    transition: opacity 0.25s ease;
    pointer-events: none;
  }

  .cine-qbank-slide--active:hover .cine-qbank-zoom-hint {
    opacity: 1;
  }

  .cine-qbank-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 5;
    width: 42px;
    height: 42px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--mkt-bg-elevated) 92%, transparent);
    border: 1px solid var(--mkt-border);
    color: var(--mkt-text-muted);
    cursor: pointer;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    transition: border-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
  }

  .cine-qbank-arrow:hover {
    border-color: color-mix(in srgb, var(--mkt-accent) 40%, var(--mkt-border));
    color: var(--mkt-text);
    transform: translateY(-50%) scale(1.04);
  }

  .cine-qbank-arrow--left { left: 0; }
  .cine-qbank-arrow--right { right: 0; }

  .cine-qbank-dots {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-top: var(--lp-stack-lg, 1.5rem);
    position: relative;
    z-index: 3;
  }

  .cine-qbank-dot {
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: var(--mkt-border);
    border: none;
    padding: 0;
    cursor: pointer;
    transition: width 0.35s cubic-bezier(0.22, 1, 0.36, 1), background 0.25s ease;
  }

  .cine-qbank-dot--active {
    width: 20px;
    background: var(--mkt-accent);
  }

  /* ── Resource cinematic cards ── */
  .cine-resource-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--lp-grid-gap-lg, 1.5rem);
    perspective: 2000px;
    transform-style: preserve-3d;
  }

  .cine-resource-grid--dim .cine-resource-card:not(.cine-resource-card--hovered) {
    opacity: 0.62;
    filter: saturate(0.88) blur(0.4px);
    transition: opacity 0.45s ease, filter 0.45s ease;
  }

  .cine-resource-card {
    position: relative;
    transform-style: preserve-3d;
    will-change: transform, opacity, filter;
  }

  .cine-resource-card__glow {
    position: absolute;
    inset: -8% -4% -4%;
    pointer-events: none;
    border-radius: 22px;
    background: radial-gradient(
      ellipse 70% 55% at 50% 40%,
      color-mix(in srgb, var(--mkt-accent) 22%, transparent) 0%,
      transparent 68%
    );
    opacity: 0;
    filter: blur(18px);
    transition: opacity 0.45s ease;
    z-index: 0;
  }

  .cine-resource-card--hovered .cine-resource-card__glow {
    opacity: 1;
  }

  .cine-resource-card__panel {
    position: relative;
    z-index: 1;
    border-radius: 18px;
    overflow: hidden;
    background: color-mix(in srgb, var(--mkt-bg-elevated) 88%, transparent);
    border: 1px solid color-mix(in srgb, var(--mkt-border) 90%, #ffffff 10%);
    box-shadow:
      0 1px 0 color-mix(in srgb, #ffffff 12%, transparent) inset,
      0 18px 40px -20px rgba(0, 0, 0, 0.35);
    transform-style: preserve-3d;
    will-change: transform;
  }

  .cine-resource-card__spotlight {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 3;
    background: radial-gradient(
      circle at var(--cine-pointer-x, 50%) var(--cine-pointer-y, 35%),
      color-mix(in srgb, #ffffff 11%, transparent) 0%,
      transparent 48%
    );
    opacity: 0;
    transition: opacity 0.35s ease;
  }

  .cine-resource-card--hovered .cine-resource-card__spotlight {
    opacity: 1;
  }

  .cine-resource-card__media {
    position: relative;
    z-index: 2;
    display: block;
    width: 100%;
    padding: 0;
    margin: 0;
    border: none;
    overflow: hidden;
    border-radius: 16px 16px 0 0;
    aspect-ratio: 4 / 3;
    background: var(--mkt-bg-muted);
    transform-style: preserve-3d;
    cursor: zoom-in;
    font: inherit;
    color: inherit;
    text-align: left;
  }

  .cine-resource-card__media:focus-visible {
    outline: 2px solid var(--mkt-accent);
    outline-offset: -2px;
  }

  .cine-resource-card__media-inner {
    width: 100%;
    height: 100%;
    will-change: transform;
  }

  .cine-resource-card__media img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: contain;
    object-position: center;
  }

  .cine-resource-card__sheen {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 2;
    background: linear-gradient(
      115deg,
      transparent 0%,
      transparent 40%,
      color-mix(in srgb, #ffffff 18%, transparent) 50%,
      transparent 60%,
      transparent 100%
    );
    transform: translateX(-120%) skewX(-10deg);
    animation: cine-glass-sweep 6.5s ease-in-out infinite;
  }

  .cine-resource-card:not(.cine-resource-card--hovered) .cine-resource-card__sheen {
    animation-duration: 8s;
    opacity: 0.35;
  }

  .cine-resource-card__zoom {
    position: absolute;
    right: 10px;
    bottom: 10px;
    z-index: 4;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--mkt-bg) 78%, transparent);
    border: 1px solid var(--mkt-border);
    color: var(--mkt-text-muted);
    opacity: 0.85;
    pointer-events: none;
    transition: opacity 0.2s ease, transform 0.2s ease, background 0.2s ease;
  }

  .cine-resource-card--hovered .cine-resource-card__zoom,
  .cine-resource-card__media:focus-visible .cine-resource-card__zoom {
    opacity: 1;
    transform: scale(1.05);
    background: color-mix(in srgb, var(--mkt-bg) 90%, transparent);
  }

  .cine-resource-card__body {
    padding: 1.25rem 1.375rem 1.375rem;
    position: relative;
    z-index: 2;
  }

  .cine-resource-card__body h3 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 0.5rem;
    color: var(--mkt-text);
  }

  .cine-resource-card__body p {
    margin: 0;
    color: var(--mkt-text-muted);
    font-size: 0.86rem;
    line-height: 1.6;
  }

  @media (max-width: 960px) {
    .cine-resource-grid {
      grid-template-columns: 1fr;
      gap: var(--lp-grid-gap, 1rem);
    }

    .cine-resource-grid--dim .cine-resource-card:not(.cine-resource-card--hovered) {
      opacity: 1;
      filter: none;
    }
  }

  @media (max-width: 640px) {
    .cine-qbank-showcase {
      padding: 0 2.75rem;
    }

    .cine-qbank-showcase__rig {
      height: clamp(190px, 52vw, 240px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .cine-qbank-showcase__ambient,
    .cine-qbank-card__sheen,
    .cine-resource-card__sheen {
      animation: none !important;
    }

    .cine-resource-grid--dim .cine-resource-card:not(.cine-resource-card--hovered) {
      opacity: 1;
      filter: none;
    }
  }
`;
