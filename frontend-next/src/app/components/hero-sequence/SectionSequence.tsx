"use client";

import {
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type CSSProperties,
} from "react";
import { HERO_COLORS, HERO_PERFORMANCE } from "./constants";
import { FrameLoader } from "./FrameLoader";
import { CanvasRenderer } from "./CanvasRenderer";
import { SECTION_SEQUENCE, type SectionTheme } from "./section-constants";
import { getSectionFramePath } from "./section-constants";
import type { HeroBreakpoint } from "./types";
import { isMobileViewport } from "./utils/framePath";

export interface SectionSequenceProps {
  theme: SectionTheme;
  frameIndexRef: MutableRefObject<number>;
  reducedMotion?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * Scroll-scrubbed frame sequence for cinematic body chapters.
 */
export function SectionSequence({
  theme,
  frameIndexRef,
  reducedMotion = false,
  className = "",
  style,
}: SectionSequenceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<FrameLoader | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const smoothedFrameRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const reducedMotionRef = useRef(reducedMotion);
  const [loadProgress, setLoadProgress] = useState(0);
  const [breakpoint, setBreakpoint] = useState<HeroBreakpoint>("desktop");

  reducedMotionRef.current = reducedMotion;

  useEffect(() => {
    if (reducedMotion) smoothedFrameRef.current = SECTION_SEQUENCE.frameCount - 1;
  }, [reducedMotion]);

  useEffect(() => {
    const updateBp = () => setBreakpoint(isMobileViewport() ? "mobile" : "desktop");
    updateBp();
    window.addEventListener("resize", updateBp, { passive: true });
    return () => window.removeEventListener("resize", updateBp);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const basePath = getSectionFramePath(theme);
    const frameCount = SECTION_SEQUENCE.frameCount;

    const loader = new FrameLoader({ frameCount, basePath, breakpoint });
    loader.setProgressCallback(setLoadProgress);
    loaderRef.current = loader;

    const renderer = new CanvasRenderer(canvas);
    rendererRef.current = renderer;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      renderer.resize(rect.width, rect.height, breakpoint === "mobile");
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    void loader.preload().then(() => {
      smoothedFrameRef.current = reducedMotionRef.current ? frameCount - 1 : 0;
    });

    return () => {
      ro.disconnect();
      loader.destroy();
      loaderRef.current = null;
      rendererRef.current = null;
    };
  }, [breakpoint, theme]);

  useEffect(() => {
    const render = () => {
      const loader = loaderRef.current;
      const renderer = rendererRef.current;
      if (!renderer) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }

      const target = reducedMotionRef.current
        ? SECTION_SEQUENCE.frameCount - 1
        : frameIndexRef.current;

      smoothedFrameRef.current = CanvasRenderer.smoothFrameIndex(
        smoothedFrameRef.current,
        target
      );

      const { lower, upper, blend } = CanvasRenderer.splitFrameIndex(smoothedFrameRef.current);
      const primary = loader?.getImage(lower);
      const secondary = loader?.getImage(upper);

      if (primary || secondary) {
        renderer.render(primary, secondary, blend, {
          objectFit: "cover",
          backgroundColor: HERO_COLORS.background,
          parallaxOffset: { x: 0, y: 0 },
          focus: "center",
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
  }, [frameIndexRef, loadProgress]);

  return (
    <div
      ref={containerRef}
      className={`section-sequence-wrap ${className}`.trim()}
      style={style}
      aria-hidden
    >
      <canvas className="section-sequence-canvas" ref={canvasRef} />
    </div>
  );
}
