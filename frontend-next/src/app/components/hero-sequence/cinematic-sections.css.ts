/** Text-only cinematic sections — typography-led body chapters. */

export const CINEMATIC_SECTIONS_CSS = `
  .cine-section {
    position: relative;
    width: 100%;
    isolation: isolate;
    overflow: hidden;
  }

  .cine-section--text {
    background: var(--cine-bg, var(--mkt-bg));
    border-top: 1px solid var(--cine-border, var(--mkt-border));
  }

  .cine-section-ambient {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background:
      radial-gradient(
        ellipse 55% 45% at 50% 20%,
        color-mix(in srgb, var(--mkt-accent) 8%, transparent) 0%,
        transparent 65%
      );
  }

  .cine-section--mission .cine-section-ambient {
    background: none;
  }

  .cine-section--mission.cine-section--text {
    background: var(--cine-bg-elevated, var(--mkt-bg-elevated));
  }

  .cine-section--mission .cine-section-inner {
    padding-top: var(--lp-section-y-band);
    padding-bottom: var(--lp-section-y-band);
  }

  .cine-section--cta .cine-section-inner {
    padding-top: var(--lp-section-y-cta);
    padding-bottom: var(--lp-section-y-cta);
  }

  .landing-content-bridge > .cine-section:first-child {
    border-top: none;
  }

  .cine-section--align-left .cine-section-ambient {
    background: radial-gradient(
      ellipse 50% 45% at 12% 30%,
      color-mix(in srgb, var(--mkt-accent) 9%, transparent) 0%,
      transparent 65%
    );
  }

  .cine-section--cta .cine-section-ambient {
    background: radial-gradient(
      ellipse 50% 40% at 50% 50%,
      color-mix(in srgb, var(--mkt-accent) 12%, transparent) 0%,
      transparent 68%
    );
  }

  .cine-section-inner {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: min(72rem, 94vw);
    margin: 0 auto;
    padding: var(--lp-section-y) var(--lp-section-x);
    will-change: transform, opacity;
  }

  .cine-section-inner--left {
    text-align: left;
  }

  .cine-section-inner--center {
    text-align: center;
  }

  .cine-section-head {
    max-width: var(--lp-h2-max-w, min(72rem, 94vw));
    margin: 0 0 var(--lp-head-gap);
  }

  .cine-section-head--left {
    text-align: left;
    margin-left: 0;
    margin-right: auto;
  }

  .cine-section-head--center {
    text-align: center;
    margin-left: auto;
    margin-right: auto;
  }

  .cine-section-head--left .cine-section-kicker {
    justify-content: flex-start;
  }

  .cine-section-head--center .cine-section-kicker {
    justify-content: center;
  }

  .cine-editorial-line {
    display: flex;
    align-items: stretch;
    gap: var(--lp-stack-md);
    width: 100%;
    max-width: min(68rem, 100%);
    margin: 0;
    padding: 0;
  }

  .cine-text-grid + .cine-editorial-line {
    margin-top: var(--lp-divider-gap);
    padding-top: var(--lp-divider-gap);
    border-top: 1px solid var(--cine-border, var(--mkt-border));
  }

  .cine-section-inner--center .cine-editorial-line {
    margin-left: auto;
    margin-right: auto;
  }

  .cine-editorial-line-bar {
    width: 3px;
    flex-shrink: 0;
    border-radius: 999px;
    background: var(--cine-accent, var(--mkt-accent));
  }

  .cine-editorial-line-body {
    flex: 1;
    min-width: 0;
    text-align: left;
    padding-top: 0.125rem;
  }

  .cine-editorial-kicker {
    display: block;
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--cine-accent, var(--mkt-accent));
    margin-bottom: var(--lp-kicker-gap);
  }

  .cine-editorial-statement {
    margin: 0;
    font-size: clamp(1.0625rem, 2.15vw, 1.375rem);
    line-height: 1.45;
    letter-spacing: -0.02em;
    font-weight: 400;
    color: var(--cine-body, var(--cine-text, var(--mkt-text)));
    text-wrap: balance;
  }

  @media (min-width: 900px) {
    .cine-editorial-statement--nowrap {
      white-space: nowrap;
      text-wrap: nowrap;
    }
  }

  .cine-mission-line {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 0.625rem 1rem;
    max-width: min(58rem, 96vw);
    margin: 0 auto;
    text-align: center;
  }

  .cine-mission-kicker {
    margin-bottom: 0 !important;
    flex-shrink: 0;
  }

  .cine-mission-statement {
    margin: 0;
    font-size: clamp(1.125rem, 2.4vw, 1.625rem);
    line-height: 1.45;
    letter-spacing: -0.02em;
    text-wrap: balance;
  }

  .cine-mission-em {
    font-weight: 700;
    background: linear-gradient(
      180deg,
      var(--cine-mission-em-from, var(--mkt-text)) 0%,
      var(--cine-mission-em-to, var(--mkt-accent)) 55%,
      var(--cine-title-to, var(--mkt-accent-muted)) 100%
    );
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    filter: drop-shadow(0 0 20px color-mix(in srgb, var(--mkt-accent) 28%, transparent));
  }

  .cine-mission-rest {
    font-weight: 500;
    color: var(--cine-body, var(--cine-text, var(--mkt-text)));
  }

  @media (min-width: 900px) {
    .cine-mission-line {
      flex-wrap: nowrap;
    }
  }

  .cine-section-kicker {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--cine-accent-muted, var(--mkt-accent-muted));
  }

  .cine-section-kicker-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--cine-accent, var(--mkt-accent));
    box-shadow: 0 0 12px color-mix(in srgb, var(--mkt-accent) 70%, transparent);
  }

  .cine-section-title {
    margin: 0 0 var(--lp-title-gap);
    background: linear-gradient(
      180deg,
      var(--cine-title-from, var(--mkt-text)) 0%,
      var(--cine-title-to, var(--mkt-accent-muted)) 100%
    );
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    filter: drop-shadow(0 0 28px color-mix(in srgb, var(--mkt-accent) 30%, transparent));
  }

  .cine-section-title span {
    background: linear-gradient(
      180deg,
      var(--cine-title-from, var(--mkt-text)) 0%,
      var(--cine-title-to, var(--mkt-accent-muted)) 100%
    );
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .cine-section-head--left .cine-section-title {
    text-align: left;
  }

  .cine-section-lead {
    color: var(--cine-body, var(--cine-text, var(--mkt-text)));
  }

  .cine-section-head--left .cine-section-lead {
    margin: 0;
    text-align: left;
  }

  .cine-section-head--center .cine-section-lead {
    margin: 0 auto;
    text-align: center;
  }

  .cine-text-grid {
    display: grid;
    gap: var(--lp-grid-gap);
  }

  .cine-text-grid--spaced {
    margin-top: var(--lp-stack-lg);
  }

  .cine-text-grid--4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--lp-grid-gap-lg);
  }

  .cine-cross-sell {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: var(--lp-stack-md);
    max-width: 36rem;
    margin: 0 auto;
    text-align: center;
  }

  .cine-cross-sell p {
    margin: 0;
    font-size: 1rem;
    color: var(--cine-muted, var(--mkt-text-muted));
  }

  .cine-section-head--center .cine-section-title {
    text-align: center;
  }

  .cine-text-grid--2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .cine-text-grid--3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .cine-text-block {
    padding: var(--lp-block-py) 0;
    border-top: 1px solid color-mix(in srgb, var(--mkt-accent) 12%, transparent);
    transition: border-color 0.25s ease;
  }

  .cine-text-block:hover {
    border-color: color-mix(in srgb, var(--mkt-accent) 28%, transparent);
  }

  .cine-text-block h3,
  .cine-text-block h4 {
    color: var(--cine-text, var(--mkt-text));
    margin: 0 0 var(--lp-space-2);
  }

  .cine-text-block p {
    font-size: 0.875rem;
    line-height: 1.6;
    color: var(--cine-body, var(--cine-text, var(--mkt-text)));
    margin: 0;
  }

  .cine-text-block--feature h4 {
    color: var(--cine-accent-muted, var(--mkt-accent-muted));
  }

  .cine-step-num {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    color: var(--cine-accent, var(--mkt-accent));
    margin-bottom: var(--lp-space-2);
    text-shadow: 0 0 16px color-mix(in srgb, var(--mkt-accent) 40%, transparent);
  }

  .cine-highlight-kicker {
    display: block;
    font-size: 0.625rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--cine-accent-muted, var(--mkt-accent-muted));
    margin-bottom: var(--lp-space-2);
  }

  .cine-callout-band {
    margin-top: 1.25rem;
    padding: 1.25rem 0 0;
    border-top: 1px solid color-mix(in srgb, var(--mkt-accent) 18%, transparent);
    text-align: left;
    max-width: 40rem;
  }

  .cine-callout-band .cine-section-kicker {
    justify-content: flex-start;
  }

  .cine-callout-band h3 {
    font-size: clamp(1.125rem, 2.5vw, 1.375rem);
    font-weight: 700;
    letter-spacing: -0.025em;
    color: var(--cine-text, var(--mkt-text));
    margin: 0.5rem 0 0.5rem;
  }

  .cine-callout-band h3 span {
    color: var(--cine-accent-muted, var(--mkt-accent-muted));
  }

  .cine-callout-band p {
    font-size: 1rem;
    color: var(--cine-body, var(--cine-text, var(--mkt-text)));
    margin: 0;
    max-width: 48ch;
    line-height: 1.6;
  }

  .cine-callout-line {
    max-width: none;
    font-size: clamp(0.9375rem, 2vw, 1.0625rem);
    line-height: 1.5;
    letter-spacing: -0.01em;
    text-wrap: balance;
  }

  @media (min-width: 768px) {
    .cine-callout-line {
      white-space: nowrap;
      text-wrap: nowrap;
    }
  }

  .cine-quote-block {
    padding: var(--lp-stack-md) 0;
    border-top: 1px solid var(--cine-border, var(--mkt-border));
  }

  .cine-quote-block blockquote {
    font-size: clamp(1rem, 2.2vw, 1.125rem);
    line-height: 1.65;
    font-weight: 400;
    font-style: normal;
    color: var(--cine-text, var(--mkt-text));
    margin: 0 0 var(--lp-stack-md);
    letter-spacing: -0.01em;
  }

  .cine-quote-block blockquote::before {
    content: "\\201C";
    color: color-mix(in srgb, var(--mkt-accent) 50%, transparent);
    font-size: 1.5em;
    line-height: 0;
    vertical-align: -0.2em;
    margin-right: 0.15em;
  }

  .cine-testimonial-name {
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--cine-text, var(--mkt-text));
  }

  .cine-testimonial-role {
    font-size: 0.8125rem;
    color: var(--cine-subtle, var(--mkt-text-subtle));
    margin-top: var(--lp-space-1);
  }

  .cine-cta-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--lp-stack-sm);
    justify-content: center;
    margin-top: var(--lp-stack-lg);
  }

  .cine-section-inner--left .cine-cta-row {
    justify-content: flex-start;
  }

  .cine-section-inner--center .cine-cta-row {
    justify-content: center;
  }

  .cine-section .hero-btn-primary,
  .cine-section .hero-btn-ghost {
    font-family: inherit;
  }

  .cine-section .hero-btn-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.9375rem 1.75rem;
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--cine-on-accent, #ffffff);
    background: linear-gradient(135deg, var(--cine-accent, var(--mkt-accent)) 0%, var(--cine-accent-hover, var(--mkt-accent-hover)) 100%);
    border: none;
    border-radius: 999px;
    cursor: pointer;
    box-shadow: 0 0 32px color-mix(in srgb, var(--mkt-accent) 40%, transparent);
    transition: background 0.35s ease, transform 0.35s ease, box-shadow 0.35s ease;
  }

  .cine-section .hero-btn-primary:hover {
    filter: brightness(1.06);
    transform: translateY(-2px);
  }

  .cine-section .hero-btn-ghost {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.9375rem 1.75rem;
    font-size: 0.9375rem;
    font-weight: 500;
    color: var(--cine-text, var(--mkt-text));
    background: var(--mkt-bg-elevated);
    border: 1px solid var(--cine-border, var(--mkt-border));
    border-radius: 999px;
    cursor: pointer;
    backdrop-filter: blur(10px);
    transition: border-color 0.35s ease, background 0.35s ease;
  }

  .cine-section .hero-btn-ghost:hover {
    border-color: var(--cine-accent, var(--mkt-accent));
    background: var(--cine-accent-soft, var(--mkt-accent-soft));
  }

  .cine-section[id] {
    scroll-margin-top: 4.5rem;
  }

  .cine-faq-list {
    max-width: 44rem;
    margin: 0;
  }

  .cine-faq-item {
    border-bottom: 1px solid var(--cine-border, var(--mkt-border));
  }

  .cine-faq-item:first-child {
    border-top: 1px solid var(--cine-border, var(--mkt-border));
  }

  .cine-faq-trigger {
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    cursor: pointer;
    padding: var(--lp-stack-md) var(--lp-space-1);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--lp-stack-md);
    color: var(--cine-text, var(--mkt-text));
    font-family: inherit;
  }

  .cine-faq-trigger span:last-child {
    color: var(--cine-subtle, var(--mkt-text-subtle));
    font-size: 1.25rem;
    font-weight: 400;
    transition: transform 0.2s ease;
    flex-shrink: 0;
  }

  .cine-faq-trigger[aria-expanded="true"] span:last-child {
    transform: rotate(45deg);
    color: var(--cine-accent, var(--mkt-accent));
  }

  .cine-faq-answer {
    font-size: 0.9375rem;
    line-height: 1.65;
    color: var(--cine-body, var(--cine-text, var(--mkt-text)));
    padding: 0 var(--lp-space-1) var(--lp-stack-md);
    margin: 0;
  }

  @media (max-width: 960px) {
    .cine-text-grid--4 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 640px) {
    .cine-text-grid--2,
    .cine-text-grid--3 {
      grid-template-columns: 1fr;
    }
  }
`;
