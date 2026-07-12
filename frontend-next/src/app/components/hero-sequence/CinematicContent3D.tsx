"use client";

import { useEffect, useRef, useContext, type ReactNode, type CSSProperties } from "react";
import { HeroScrollContext } from "./HeroScrollContext";
import { clamp, lerp } from "./utils/easing";

export interface CinematicContent3DProps {
  children: ReactNode;
  /** Override scroll 0–1 (defaults to hero context). */
  progress?: number;
  className?: string;
  /** Depth intensity 0–1 */
  depth?: number;
}

/**
 * Scroll + mouse parallax 3D rig for cinematic copy layers.
 */
export function CinematicContent3D({
  children,
  progress: progressProp,
  className = "",
  depth = 1,
}: CinematicContent3DProps) {
  const ctxProgress = useContext(HeroScrollContext);
  const t = clamp(progressProp ?? ctxProgress, 0, 1);
  const rigRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const applyTransform = () => {
      const el = rigRef.current;
      if (!el) return;
      const rotY = lerp(-2, 2, t) * depth + mouseRef.current.x * 1.2 * depth;
      const rotX = lerp(2, -1.5, t) * depth + mouseRef.current.y * -0.8 * depth;
      const tz = lerp(0, 16, t) * depth;
      el.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(${tz}px)`;
    };

    const onMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      };
      applyTransform();
    };

    applyTransform();
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [t, depth]);

  return (
    <div className={`cine-content-3d ${className}`.trim()}>
      <div ref={rigRef} className="cine-content-3d-rig">
        {children}
      </div>
    </div>
  );
}

/** Depth layer — assign translateZ for parallax separation. */
export function CinematicDepthLayer({
  children,
  z = 40,
  className = "",
  style,
}: {
  children: ReactNode;
  z?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`cine-depth-layer ${className}`.trim()}
      style={{ ...style, transform: `translateZ(${z}px)` }}
    >
      {children}
    </div>
  );
}
