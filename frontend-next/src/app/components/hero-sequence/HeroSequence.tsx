"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MutableRefObject,
} from "react";
import { HERO_COLORS, HERO_PERFORMANCE, HERO_SEQUENCE } from "./constants";
import { FrameLoader } from "./FrameLoader";
import { CanvasRenderer } from "./CanvasRenderer";
import type { CanvasFocus, HeroBreakpoint } from "./types";
import { isMobileViewport } from "./utils/framePath";

export interface HeroSequenceProps {
  /** Ref updated every scroll tick — avoids re-render per frame. */
  frameIndexRef: MutableRefObject<number>;
  reducedMotion?: boolean;
  /** Crop bias for split-layout heroes. */
  focus?: CanvasFocus;
  className?: string;
  style?: CSSProperties;
}

/**
 * Canvas-driven cinematic image sequence — frame index driven by scroll ref.
 */
export function HeroSequence({
  frameIndexRef,
  reducedMotion = false,
  focus = "center",
  className = "",
  style,
}: HeroSequenceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const loaderRef = useRef<FrameLoader | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);

  const smoothedFrameRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const reducedMotionRef = useRef(reducedMotion);

  const [loadProgress, setLoadProgress] = useState(0);
  const [breakpoint, setBreakpoint] = useState<HeroBreakpoint>("desktop");

  reducedMotionRef.current = reducedMotion;

  useEffect(() => {
    if (reducedMotion) {
      smoothedFrameRef.current = HERO_SEQUENCE.frameCount - 1;
    }
  }, [reducedMotion]);

  useEffect(() => {
    const updateBp = () =>
      setBreakpoint(isMobileViewport() ? "mobile" : "desktop");
    updateBp();
    window.addEventListener("resize", updateBp, { passive: true });
    return () => window.removeEventListener("resize", updateBp);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const isMobile = breakpoint === "mobile";
    const basePath = isMobile
      ? HERO_SEQUENCE.mobilePath
      : HERO_SEQUENCE.desktopPath;
    const frameCount = isMobile
      ? HERO_SEQUENCE.mobileFrameCount
      : HERO_SEQUENCE.frameCount;

    const loader = new FrameLoader({ frameCount, basePath, breakpoint });
    loader.setProgressCallback(setLoadProgress);
    loaderRef.current = loader;

    const renderer = new CanvasRenderer(canvas);
    rendererRef.current = renderer;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      renderer.resize(rect.width, rect.height, isMobile);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    void loader.preload().then(() => {
      if (reducedMotionRef.current) {
        smoothedFrameRef.current = frameCount - 1;
      } else {
        smoothedFrameRef.current = 0;
      }
    });

    return () => {
      ro.disconnect();
      loader.destroy();
      loaderRef.current = null;
      rendererRef.current = null;
    };
  }, [breakpoint]);

  useEffect(() => {
    if (reducedMotion) return;
    const onMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      };
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [reducedMotion]);

  // Stable RAF loop — reads frameIndexRef, never restarts on scroll
  useEffect(() => {
    const render = () => {
      const loader = loaderRef.current;
      const renderer = rendererRef.current;
      if (!renderer) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }

      const target = reducedMotionRef.current
        ? HERO_SEQUENCE.frameCount - 1
        : frameIndexRef.current;

      smoothedFrameRef.current = CanvasRenderer.smoothFrameIndex(
        smoothedFrameRef.current,
        target
      );

      const { lower, upper, blend } = CanvasRenderer.splitFrameIndex(
        smoothedFrameRef.current
      );

      const maxPx = reducedMotionRef.current ? 0 : HERO_PERFORMANCE.parallaxMaxPx;
      const parallax = {
        x: mouseRef.current.x * maxPx,
        y: mouseRef.current.y * maxPx * 0.6,
      };

      const primary = loader?.getImage(lower);
      const secondary = loader?.getImage(upper);

      if (primary || secondary) {
        renderer.render(primary, secondary, blend, {
          objectFit: "cover",
          backgroundColor: HERO_COLORS.background,
          parallaxOffset: parallax,
          focus,
        });
      } else {
        renderer.renderPlaceholder(loadProgress);
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [frameIndexRef, loadProgress, focus]);

  return (
    <div
      ref={containerRef}
      className={`hero-sequence-canvas-wrap ${className}`.trim()}
      style={style}
    >
      <canvas
        ref={canvasRef}
        className="hero-sequence-canvas"
        role="img"
        aria-label="Decorative MedPrepAI brand animation"
      />
    </div>
  );
}

export { HERO_SEQUENCE };
