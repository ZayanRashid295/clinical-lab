/**
 * Shared page shell + glass surfaces (My Subscription / Achievements pattern).
 * Use with `cn()` from `@/shared/utils/cn`.
 */

/** Full-page vertical gradient — light and dark */
export const APP_PAGE_SHELL =
  "min-h-screen w-full bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950";

/** Standard horizontal padding for in-app pages */
export const APP_PAGE_PADDING =
  "w-full px-4 pb-10 pt-6 sm:px-6 lg:px-10";

/** Frosted card / panel in dark mode */
export const APP_GLASS_CARD =
  "border-slate-200/90 shadow-sm dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-md";
