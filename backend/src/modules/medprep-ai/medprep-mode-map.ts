import { MedprepMode } from "@prisma/client";

/** URL / UI slugs (frontend `modes.ts`) ↔ Prisma enum */
export const MEDPREP_SLUG_TO_MODE: Record<string, MedprepMode> = {
  "let-me-drive": MedprepMode.PRACTICE,
  qa: MedprepMode.LEARNING,
  "ai-evaluation": MedprepMode.EVALUATION,
  "shadow-mode": MedprepMode.SHADOW,
};

export const MEDPREP_MODE_TO_SLUG: Record<MedprepMode, string> = {
  [MedprepMode.PRACTICE]: "let-me-drive",
  [MedprepMode.LEARNING]: "qa",
  [MedprepMode.EVALUATION]: "ai-evaluation",
  [MedprepMode.SHADOW]: "shadow-mode",
};

export function modeToSlug(mode: MedprepMode): string {
  return MEDPREP_MODE_TO_SLUG[mode];
}

/** Valid MedPrep route slugs from entitlement `items` arrays (strict allow-list). */
export const MEDPREP_ENTITLEMENT_SLUGS = new Set(Object.keys(MEDPREP_SLUG_TO_MODE));
