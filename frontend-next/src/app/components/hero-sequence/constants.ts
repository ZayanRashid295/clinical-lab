/** Hero image-sequence configuration — swap frames in /public/hero-sequence/ from Blender exports. */

export const HERO_SEQUENCE = {
  /** Total frames in the cinematic sequence (desktop). */
  frameCount: 180,
  /** Mobile uses the same choreography at lower resolution. */
  mobileFrameCount: 180,
  /** Desktop frame directory (public URL path). */
  desktopPath: "/hero-sequence",
  /** Mobile-optimized frames. */
  mobilePath: "/hero-sequence/mobile",
  /** Filename pattern — frame0001.webp … frame0180.webp */
  filePattern: "frame{index}.webp",
  /** Zero-padded index width. */
  indexPad: 4,
  /** Native frame aspect (matches Blender export). */
  aspectRatio: 16 / 9,
  /** Scroll distance as viewport heights — controls scrub duration. */
  scrollHeightVh: 105,
  /** Sticky hero viewport height. */
  viewportHeightVh: 100,
} as const;

/** Animation timeline phases (0–1 scroll progress). */
export const HERO_TIMELINE = {
  /** Dark void — subtle light only. */
  introEnd: 0.15,
  /** Premium object emerges. */
  revealEnd: 0.35,
  /** Camera orbit + assembly + internal glow. */
  assembleEnd: 0.55,
  /** Transform — intelligence / precision cues. */
  transformEnd: 0.75,
  /** Final pose — peak lighting. */
  finaleEnd: 1,
} as const;

export const HERO_PERFORMANCE = {
  /** Frames loaded per batch during idle. */
  preloadBatchSize: 8,
  /** Max concurrent image fetches. */
  maxConcurrentLoads: 6,
  /** Interpolation smoothing (0 = none, 1 = heavy). */
  frameSmoothing: 0.12,
  /** Subtle mouse parallax (px at max offset). */
  parallaxMaxPx: 6,
  /** DPR cap for canvas (retina without excess memory). */
  maxDevicePixelRatio: 2,
  /** Mobile DPR cap. */
  mobileMaxDevicePixelRatio: 1.5,
} as const;

export const HERO_COLORS = {
  background: "#050508",
  accentCyan: "#38bdf8",
  accentBlue: "#3b82f6",
  textPrimary: "#f8fafc",
  textMuted: "#94a3b8",
} as const;
