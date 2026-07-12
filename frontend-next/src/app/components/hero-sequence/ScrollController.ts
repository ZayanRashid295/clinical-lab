import type Lenis from "lenis";
import type { RefObject } from "react";
import { HERO_SEQUENCE } from "./constants";
import { AnimationTimeline } from "./AnimationTimeline";
import type { ScrollProgress, ScrollProgressListener } from "./types";
import { clamp } from "./utils/easing";

export interface ScrollControllerConfig {
  sectionRef: RefObject<HTMLElement | null>;
  frameCount: number;
  reducedMotion: boolean;
  onProgress: ScrollProgressListener;
  lenis?: Lenis | null;
}

/**
 * Maps Lenis / native scroll position to hero scrub progress.
 */
export class ScrollController {
  private timeline: AnimationTimeline;
  private rafId: number | null = null;
  private destroyed = false;
  private lastProgress = -1;
  private lenisUnsubscribe: (() => void) | null = null;

  constructor(private readonly config: ScrollControllerConfig) {
    this.timeline = new AnimationTimeline(config.frameCount);
  }

  start(): void {
    const { lenis, sectionRef } = this.config;

    const tick = () => {
      if (this.destroyed) return;
      this.measure();
      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);

    if (lenis) {
      this.lenisUnsubscribe = lenis.on("scroll", () => this.measure());
    } else {
      window.addEventListener("scroll", this.onScroll, { passive: true });
      window.addEventListener("resize", this.onScroll, { passive: true });
    }

    this.measure();
  }

  private onScroll = (): void => {
    this.measure();
  };

  private measure(): void {
    const el = this.config.sectionRef.current;
    if (!el) return;

    let raw: number;

    if (this.config.reducedMotion) {
      raw = 1;
    } else {
      const rect = el.getBoundingClientRect();
      const scrollable = el.offsetHeight - window.innerHeight;
      if (scrollable <= 0) {
        raw = 0;
      } else {
        raw = clamp(-rect.top / scrollable, 0, 1);
      }
    }

    // Skip micro-updates
    if (Math.abs(raw - this.lastProgress) < 0.0001) return;
    this.lastProgress = raw;

    const { frameIndex, progress: eased } = this.timeline.resolve(raw);

    const payload: ScrollProgress = { raw, eased, frameIndex };
    this.config.onProgress(payload);
  }

  getTimeline(): AnimationTimeline {
    return this.timeline;
  }

  static getSectionHeightPx(): number {
    return (HERO_SEQUENCE.scrollHeightVh / 100) * window.innerHeight;
  }

  destroy(): void {
    this.destroyed = true;
    if (this.rafId != null) cancelAnimationFrame(this.rafId);
    window.removeEventListener("scroll", this.onScroll);
    window.removeEventListener("resize", this.onScroll);
    const { lenis } = this.config;
    if (this.lenisUnsubscribe) {
      this.lenisUnsubscribe();
      this.lenisUnsubscribe = null;
    }
  }
}
