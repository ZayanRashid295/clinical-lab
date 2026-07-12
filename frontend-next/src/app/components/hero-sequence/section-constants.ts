/** Section image-sequence + scroll config for cinematic body chapters. */

export type SectionTheme =
  | "mission"
  | "distinction"
  | "platform"
  | "workflow"
  | "testimonials"
  | "cta"
  | "faq";

export const SECTION_SEQUENCE = {
  frameCount: 90,
  basePath: "/section-sequence",
  indexPad: 4,
  filePattern: "frame{index}.webp",
  /** Default scroll distance per chapter (vh) — keep close to viewport to avoid dead scroll. */
  scrollHeightVh: 58,
} as const;

export function getSectionFramePath(theme: SectionTheme): string {
  return `${SECTION_SEQUENCE.basePath}/${theme}`;
}

export const SECTION_MODEL_VARIANT: Record<SectionTheme, SectionTheme> = {
  mission: "mission",
  distinction: "distinction",
  platform: "platform",
  workflow: "workflow",
  testimonials: "testimonials",
  cta: "cta",
  faq: "faq",
};
