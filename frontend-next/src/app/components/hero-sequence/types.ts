export type HeroBreakpoint = "desktop" | "mobile";

export interface HeroSequenceConfig {
  frameCount: number;
  basePath: string;
  breakpoint: HeroBreakpoint;
}

export interface FrameLoaderState {
  loaded: Set<number>;
  failed: Set<number>;
  images: Map<number, HTMLImageElement>;
  isReady: boolean;
  progress: number;
}

export interface ScrollProgress {
  /** Raw scroll progress 0–1 within the hero scrub zone. */
  raw: number;
  /** Timeline-mapped progress with cinematic easing. */
  eased: number;
  /** Floating frame index (supports interpolation). */
  frameIndex: number;
}

export type CanvasFocus = "left" | "center" | "right";

export interface CanvasRenderOptions {
  objectFit: "cover" | "contain";
  backgroundColor: string;
  parallaxOffset: { x: number; y: number };
  /** Bias cover crop for split hero layouts. */
  focus?: CanvasFocus;
}

export type ScrollProgressListener = (progress: ScrollProgress) => void;
