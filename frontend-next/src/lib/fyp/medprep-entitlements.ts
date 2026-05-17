/** Route ids from `modes.ts` — must match backend `medprep-mode-map` slugs. */
export const MEDPREP_KNOWN_SLUGS = new Set([
  "let-me-drive",
  "qa",
  "ai-evaluation",
  "shadow-mode",
]);

/**
 * Mirrors backend {@link MedprepAiService} policy: absent `medprepai.modes` → legacy (any mode if access on).
 * Present object → strict allow-list from `items`.
 */
export function parseMedprepModesPolicy(entitlements: Record<string, unknown>): {
  restrictModes: boolean;
  allowedSlugs: Set<string>;
} {
  const raw = entitlements["medprepai.modes"];
  if (raw === undefined || raw === null) {
    return { restrictModes: false, allowedSlugs: new Set() };
  }
  if (typeof raw !== "object" || Array.isArray(raw)) {
    return { restrictModes: false, allowedSlugs: new Set() };
  }
  const itemsRaw = (raw as { items?: unknown }).items;
  const items = Array.isArray(itemsRaw)
    ? itemsRaw.filter((x): x is string => typeof x === "string")
    : [];
  return {
    restrictModes: true,
    allowedSlugs: new Set(items.filter((s) => MEDPREP_KNOWN_SLUGS.has(s))),
  };
}

/** Maps backend session mode to overview / route slug (`modes.ts` ids). */
export function medprepSessionModeToSlug(
  mode: "PRACTICE" | "LEARNING" | "EVALUATION" | "SHADOW"
): string {
  if (mode === "LEARNING") return "qa";
  if (mode === "EVALUATION") return "ai-evaluation";
  if (mode === "SHADOW") return "shadow-mode";
  return "let-me-drive";
}

/** Whether the user may open this MedPrep route slug (e.g. `qa` for Learning). */
export function isMedprepSlugAllowed(
  entitlements: Record<string, unknown>,
  slug: string,
  hasModuleAccess: boolean
): boolean {
  if (!hasModuleAccess) return false;
  const { restrictModes, allowedSlugs } = parseMedprepModesPolicy(entitlements);
  if (!restrictModes) return true;
  return allowedSlugs.size > 0 && allowedSlugs.has(slug);
}
