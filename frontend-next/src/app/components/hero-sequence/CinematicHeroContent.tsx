"use client";

import { Fragment, type ReactNode } from "react";
import { CinematicContent3D, CinematicDepthLayer } from "./CinematicContent3D";

export interface CinematicHeroStat {
  num: string;
  label: string;
}

export interface CinematicHeroContentProps {
  kicker: string;
  title: ReactNode;
  subtitle: string;
  primaryCta: { label: string; onClick: () => void };
  secondaryCta?: { label: string; onClick: () => void };
  stats?: CinematicHeroStat[];
  punchlines?: string[];
  /** 3D asset blended into the centered stack (e.g. monitor on program pages). */
  blendedVisual?: ReactNode;
}

/**
 * Centered cinematic hero — text and 3D visual share one blended composition.
 */
export function CinematicHeroContent({
  kicker,
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  stats,
  punchlines,
  blendedVisual,
}: CinematicHeroContentProps) {
  return (
    <CinematicContent3D className="hero-content-3d hero-content-3d--center" depth={0.45}>
      <CinematicDepthLayer z={20}>
        <span className="hero-brand-kicker hero-brand-kicker--center">
          <span className="hero-brand-kicker-dot" aria-hidden />
          {kicker}
        </span>
      </CinematicDepthLayer>

      <CinematicDepthLayer z={100} className="hero-cinematic-title-zone">
        <h1 className="hero-brand-title hero-brand-title--center lp-h1">{title}</h1>
      </CinematicDepthLayer>

      {blendedVisual ? (
        <CinematicDepthLayer z={72} className="hero-cinematic-blended-slot">
          {blendedVisual}
        </CinematicDepthLayer>
      ) : null}

      <CinematicDepthLayer z={48}>
        <p className="hero-brand-subtitle hero-brand-subtitle--center">{subtitle}</p>
      </CinematicDepthLayer>

      {punchlines && punchlines.length > 0 ? (
        <CinematicDepthLayer z={52}>
          <ul className="hero-brand-punchlines hero-brand-punchlines--center" aria-label="Key benefits">
            {punchlines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </CinematicDepthLayer>
      ) : null}

      <CinematicDepthLayer z={56} className="hero-cinematic-action-zone">
        <div className="hero-cinematic-action-glow" aria-hidden />

        <div className="hero-brand-cta hero-brand-cta--center">
          <button type="button" className="hero-btn-primary" onClick={primaryCta.onClick}>
            {primaryCta.label}
          </button>
          {secondaryCta ? (
            <button type="button" className="hero-btn-ghost" onClick={secondaryCta.onClick}>
              {secondaryCta.label}
            </button>
          ) : null}
        </div>

        {stats && stats.length > 0 ? (
          <div className="hero-cinematic-stats-rail" aria-label="Highlights">
            {stats.map(({ num, label }, index) => (
              <Fragment key={label}>
                {index > 0 ? (
                  <div className="hero-cinematic-stat-divider" aria-hidden />
                ) : null}
                <div className="hero-cinematic-stat">
                  <div className="hero-cinematic-stat-num">{num}</div>
                  <div className="hero-cinematic-stat-label">{label}</div>
                </div>
              </Fragment>
            ))}
          </div>
        ) : null}
      </CinematicDepthLayer>
    </CinematicContent3D>
  );
}
