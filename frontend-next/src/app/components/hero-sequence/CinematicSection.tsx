"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { SectionScrollContext } from "./SectionScrollContext";
import type { SectionTheme } from "./section-constants";
import {
  getPrefersReducedMotion,
  subscribeReducedMotion,
} from "./utils/prefersReducedMotion";
import { clamp } from "./utils/easing";

export interface CinematicSectionProps {
  id?: string;
  theme: SectionTheme;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  /** Text alignment — left editorial (default) or center for CTAs. */
  align?: "left" | "center";
}

/** Text-only cinematic chapter — no images or 3D (hero keeps the top visual). */
export function CinematicSection({
  id,
  theme,
  children,
  className = "",
  ariaLabel,
  align = "left",
}: CinematicSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(getPrefersReducedMotion());
    return subscribeReducedMotion(setReducedMotion);
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const measure = () => {
      if (reducedMotion) {
        setProgress(1);
        return;
      }
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const center = rect.top + rect.height * 0.5;
      const dist = Math.abs(center - vh * 0.5);
      const reveal = clamp(1 - dist / (vh * 0.65), 0, 1);
      setProgress(reveal);
    };

    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure, { passive: true });
    return () => {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [reducedMotion]);

  const opacity = reducedMotion ? 1 : clamp(0.4 + progress * 0.6, 0.4, 1);
  const translateY = reducedMotion ? 0 : (1 - progress) * 20;

  return (
    <SectionScrollContext.Provider value={progress}>
      <section
        ref={sectionRef}
        id={id}
        className={`cine-section cine-section--text cine-section--${theme} cine-section--align-${align} ${className}`.trim()}
        aria-label={ariaLabel}
      >
        <div className="cine-section-ambient" aria-hidden />
        <div
          className={`cine-section-inner cine-section-inner--${align}`}
          style={{
            opacity,
            transform: `translateY(${translateY}px)`,
          }}
        >
          {children}
        </div>
      </section>
    </SectionScrollContext.Provider>
  );
}
