"use client";

import { MonitorMockup, PROGRAM_HERO_SCREEN } from "../LandingPage2/monitor-mockup";
import { useHeroScrollProgress } from "./HeroScrollContext";
import { clamp } from "./utils/easing";

export interface Monitor3DSceneProps {
  screenSrc?: string;
  alt?: string;
  /** Override scroll progress (defaults to hero context). */
  progress?: number;
  className?: string;
  /** Front-facing monitor (FCPS / JCAT program heroes). */
  straight?: boolean;
  /** Click to open lightbox preview (program heroes). */
  zoomable?: boolean;
}

/**
 * CSS 3D monitor — scroll-driven perspective for FCPS / JCAT heroes.
 * Uses existing QBank screen imagery inside a premium rig.
 */
export function Monitor3DScene({
  screenSrc = PROGRAM_HERO_SCREEN,
  alt = "Question bank interface on desktop monitor",
  progress: progressProp,
  className = "",
  straight = false,
  zoomable = false,
}: Monitor3DSceneProps) {
  const ctxProgress = useHeroScrollProgress();
  const t = clamp(progressProp ?? ctxProgress, 0, 1);

  const rotateY = straight ? 0 : -18 + t * 24;
  const rotateX = straight ? 0 : 10 - t * 6;
  const scale = straight ? 1 : 0.78 + t * 0.16;
  const translateY = straight ? 0 : 16 - t * 24;
  const glowOpacity = straight ? 0.35 + t * 0.25 : 0.25 + t * 0.55;

  const sceneClass = [
    "monitor-3d-scene",
    straight ? "monitor-3d-scene--straight" : "",
    zoomable ? "monitor-3d-scene--zoomable" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={sceneClass} aria-hidden={zoomable ? undefined : true}>
      <div
        className="monitor-3d-rig"
        style={{
          transform: straight
            ? undefined
            : `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale}) translateY(${translateY}px)`,
        }}
      >
        <MonitorMockup screenSrc={screenSrc} alt={alt} zoomable={zoomable} />
      </div>
      <div className="monitor-3d-glow" style={{ opacity: glowOpacity }} aria-hidden />
      <div className="monitor-3d-floor" style={{ opacity: 0.4 + t * 0.35 }} aria-hidden />
    </div>
  );
}
