import { cn } from "@/shared/utils/cn";

/** Presentation typography — readable on projectors / kiosk displays */
export const demoType = {
  sceneTag:
    "text-sm font-bold uppercase tracking-[0.2em] sm:text-base [&_svg]:!h-4 [&_svg]:!w-4 sm:[&_svg]:!h-[1.125rem] sm:[&_svg]:!w-[1.125rem]",
  wordReveal:
    "text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl xl:text-8xl",
  stackedHeadline: "mt-2 text-center text-2xl sm:text-3xl xl:text-4xl",
  stackedHeadlineLarge:
    "mt-2 text-center !text-3xl !leading-tight sm:!text-4xl lg:!text-5xl",
  stackedHeadlineLargeSplit:
    "mt-1 text-left !text-4xl !leading-tight sm:!text-5xl lg:!text-6xl",
  stackedDesc:
    "mt-2 max-w-xl text-center text-base leading-relaxed sm:text-lg",
  stackedDescSplit:
    "mt-2 max-w-none text-left text-base leading-relaxed sm:text-lg lg:text-xl",
  stackedBullets: "text-base sm:text-lg lg:text-xl",
  body: "text-lg sm:text-xl",
  bodyMuted: "text-lg sm:text-xl",
  cardStat: "text-5xl font-bold sm:text-6xl",
  cardTitle: "text-xl font-semibold sm:text-2xl",
  cardDesc: "text-lg sm:text-xl",
  setupH2: "text-center text-5xl font-bold tracking-tight sm:text-6xl",
  setupLabel: "text-base font-medium sm:text-lg",
  setupInput: "text-lg sm:text-xl",
  setupList: "text-lg sm:text-xl",
  metricValue: "text-5xl font-bold sm:text-6xl",
  metricLabel: "text-base sm:text-lg",
  pill: "text-base sm:text-lg px-4 py-2",
  cta: "text-xl sm:text-2xl",
  footer: "text-lg sm:text-xl",
  introBadge: "text-base sm:text-lg",
  introSub: "text-2xl leading-relaxed sm:text-3xl",
  introFeatureTitle: "text-lg font-semibold sm:text-xl",
  introFeatureLine: "text-lg leading-relaxed sm:text-xl",
  introHint: "text-lg sm:text-xl",
} as const;

export const STACKED_HEADER = cn(
  "w-full max-w-3xl shrink-0 text-center [&_.mb-4]:mb-2",
  "[&>div.rounded-full]:text-sm sm:[&>div.rounded-full]:text-base",
);

export const STACKED_HEADER_LARGE = cn(
  "w-full max-w-3xl shrink-0 text-center [&_.mb-4]:mb-2.5",
  "[&>div.rounded-full]:text-sm sm:[&>div.rounded-full]:text-base",
);

export const SPLIT_HEADER = cn(
  "w-full shrink-0 text-left [&_.mb-3]:mb-1.5",
  "[&>div.rounded-full]:text-base sm:[&>div.rounded-full]:text-lg",
  "[&_h1]:text-left [&_h1_span]:inline-block",
);

/** Bump micro copy inside UI mock frames */
export const SNAPSHOT_FRAME_TITLE = "text-base font-medium sm:text-lg";

/** Slides 6–11: mode scenes + Clinical Lab — larger copy above visuals */
export const modeSlideType = {
  tag: "text-base font-bold uppercase tracking-[0.2em] sm:text-lg [&_svg]:!h-5 [&_svg]:!w-5 sm:[&_svg]:!h-5 sm:[&_svg]:!w-5",
  headline:
    "mt-2 w-full text-center text-3xl leading-tight sm:text-4xl xl:text-5xl [&_span]:inline",
  desc: "mt-3 w-full max-w-4xl text-left text-lg leading-relaxed sm:text-xl lg:text-2xl",
  bullets: "text-left text-lg leading-snug sm:text-xl lg:text-2xl",
} as const;

/** Centered headline; body and bullets left-aligned below */
export const MODE_SLIDE_HEADER = cn(
  "mx-auto flex w-full max-w-4xl flex-col items-center",
  "[&>div.rounded-full]:mb-3",
);

/** Chrome title on mode / clinical-lab snapshot frames (slides 6–11) */
export const MODE_SNAPSHOT_FRAME_TITLE = "text-lg font-medium sm:text-xl";
