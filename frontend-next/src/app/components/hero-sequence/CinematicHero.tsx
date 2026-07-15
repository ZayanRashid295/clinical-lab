"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { HeroBackground } from "./HeroBackground";
import { ScrollController } from "./ScrollController";
import { AnimationTimeline } from "./AnimationTimeline";
import { HERO_SEQUENCE } from "./constants";
import { useLenis } from "./LenisScrollProvider";
import { HeroScrollContext } from "./HeroScrollContext";
import type { ScrollProgress } from "./types";
import {
  getPrefersReducedMotion,
  subscribeReducedMotion,
} from "./utils/prefersReducedMotion";

export type CinematicHeroLayout = "brand" | "program";

export interface CinematicHeroProps {
  children: ReactNode;
  layout?: CinematicHeroLayout;
  className?: string;
  sectionId?: string;
  ariaLabel?: string;
  scrollHeightVh?: number;
}

const UI_PROGRESS_INTERVAL_MS = 48;

export function CinematicHero({
  children,
  layout = "brand",
  className = "",
  sectionId = "home",
  ariaLabel = "MedPrepAI brand introduction",
  scrollHeightVh = HERO_SEQUENCE.scrollHeightVh,
}: CinematicHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const frameIndexRef = useRef(0);
  const lenis = useLenis();
  const timeline = useMemo(
    () => new AnimationTimeline(HERO_SEQUENCE.frameCount),
    []
  );

  const [uiProgress, setUiProgress] = useState<Pick<ScrollProgress, "raw" | "eased">>({
    raw: 0,
    eased: 0,
  });
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(getPrefersReducedMotion());
    return subscribeReducedMotion(setReducedMotion);
  }, []);

  useEffect(() => {
    let lastUiUpdate = 0;

    const controller = new ScrollController({
      sectionRef,
      frameCount: HERO_SEQUENCE.frameCount,
      reducedMotion,
      lenis,
      onProgress: (p) => {
        frameIndexRef.current = p.frameIndex;
        const now = performance.now();
        if (now - lastUiUpdate >= UI_PROGRESS_INTERVAL_MS) {
          lastUiUpdate = now;
          setUiProgress({ raw: p.raw, eased: p.eased });
        }
      },
    });
    controller.start();
    return () => controller.destroy();
  }, [lenis, reducedMotion]);

  const ctaBoost = timeline.ctaOpacity(uiProgress.raw);
  const showScrollHint = layout !== "program" && uiProgress.raw < 0.15 && !reducedMotion;

  return (
    <HeroScrollContext.Provider value={uiProgress.raw}>
      <section
        ref={sectionRef}
        id={sectionId}
        className={`hero-cinematic hero-cinematic--${layout} hero-cinematic--centered ${className}`.trim()}
        style={
          layout === "program"
            ? { minHeight: "100vh" }
            : { height: `${scrollHeightVh}vh` }
        }
        aria-label={ariaLabel}
      >
        <div className="hero-cinematic-sticky">
          <div className="hero-cinematic-composition">
            {layout !== "program" ? (
              <>
                <div className="hero-cinematic-blend-visual" aria-hidden="true">
                  <HeroBackground
                    scrollProgress={uiProgress.raw}
                    reducedMotion={reducedMotion}
                  />
                </div>
                <div className="hero-cinematic-blend-scrim" aria-hidden="true" />
              </>
            ) : (
              <div className="hero-cinematic-blend-visual hero-cinematic-blend-visual--program" aria-hidden="true">
                <HeroBackground
                  scrollProgress={uiProgress.raw}
                  reducedMotion={reducedMotion}
                  className="hero-background--program"
                />
              </div>
            )}

            <div className="hero-cinematic-copy hero-cinematic-copy--center">
              {children}
              {layout !== "program" ? (
                <div
                  className="hero-cinematic-cta-glow hero-cinematic-cta-glow--center"
                  style={{ opacity: 0.2 + ctaBoost * 0.4 }}
                  aria-hidden="true"
                />
              ) : null}
            </div>
          </div>

          {showScrollHint ? (
            <div className="hero-cinematic-scroll-hint" aria-hidden="true">
              <span className="hero-cinematic-scroll-label">scroll</span>
            </div>
          ) : null}
        </div>
      </section>
    </HeroScrollContext.Provider>
  );
}
