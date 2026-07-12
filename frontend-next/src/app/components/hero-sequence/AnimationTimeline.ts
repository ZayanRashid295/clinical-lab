import { HERO_TIMELINE } from "./constants";
import { mapTimelineProgress, smoothstep } from "./utils/easing";

export interface TimelineFrameResult {
  /** Eased timeline progress 0–1. */
  progress: number;
  /** Floating frame index for interpolation. */
  frameIndex: number;
  /** Current narrative phase label (debug / a11y). */
  phase: string;
}

/**
 * Maps scroll progress (0–1) to a frame index with phase-aware easing.
 * Phases follow the cinematic director's timeline.
 */
export class AnimationTimeline {
  constructor(private readonly frameCount: number) {}

  resolve(scrollProgress: number): TimelineFrameResult {
    const raw = Math.max(0, Math.min(1, scrollProgress));
    const eased = mapTimelineProgress(raw);
    const phase = this.getPhase(raw);
    const frameIndex = eased * (this.frameCount - 1);

    return { progress: eased, frameIndex, phase };
  }

  private getPhase(t: number): string {
    if (t < HERO_TIMELINE.introEnd) return "intro";
    if (t < HERO_TIMELINE.revealEnd) return "reveal";
    if (t < HERO_TIMELINE.assembleEnd) return "assemble";
    if (t < HERO_TIMELINE.transformEnd) return "transform";
    return "finale";
  }

  /** Opacity curve for hero copy — readable on load, subtle fade when exiting. */
  copyOpacity(scrollProgress: number): number {
    if (scrollProgress > 0.92) {
      return smoothstep(1, 0.92, scrollProgress);
    }
    return 1;
  }

  /** CTA emphasis ramps up in finale. */
  ctaOpacity(scrollProgress: number): number {
    return smoothstep(HERO_TIMELINE.transformEnd, HERO_TIMELINE.finaleEnd, scrollProgress);
  }
}
