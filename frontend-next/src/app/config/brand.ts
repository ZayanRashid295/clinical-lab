/**
 * Product branding — single source of truth for display name.
 * Override with NEXT_PUBLIC_APP_NAME in env (e.g. MedPrepAI).
 */
export const APP_DISPLAY_NAME =
  process.env.NEXT_PUBLIC_APP_NAME?.trim() || "MedPrepAI";

export function appPageTitle(page: string): string {
  return `${page} - ${APP_DISPLAY_NAME}`;
}
