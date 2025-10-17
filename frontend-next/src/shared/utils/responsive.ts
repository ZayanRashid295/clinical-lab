/**
 * Responsive Typography and Spacing Utilities
 * Provides consistent responsive design tokens across the application
 */

// Typography Scale - Mobile First Approach
export const typography = {
  // Display text (Hero sections, main titles)
  display: {
    1: "text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight",
    2: "text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight",
    3: "text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold leading-tight",
  },

  // Headings (Section titles, card headers)
  heading: {
    1: "text-xl sm:text-2xl lg:text-3xl font-semibold leading-tight",
    2: "text-lg sm:text-xl lg:text-2xl font-semibold leading-tight",
    3: "text-base sm:text-lg lg:text-xl font-semibold leading-tight",
    4: "text-sm sm:text-base lg:text-lg font-semibold leading-tight",
    5: "text-xs sm:text-sm lg:text-base font-semibold leading-tight",
  },

  // Body text (Regular content, descriptions)
  body: {
    large: "text-base sm:text-lg leading-relaxed",
    regular: "text-sm sm:text-base leading-relaxed",
    small: "text-xs sm:text-sm leading-relaxed",
  },

  // UI text (Labels, buttons, form elements)
  ui: {
    large: "text-sm sm:text-base font-medium",
    regular: "text-xs sm:text-sm font-medium",
    small: "text-xs font-medium",
  },

  // Caption text (Timestamps, metadata, help text)
  caption: {
    regular: "text-xs sm:text-sm text-gray-600",
    small: "text-xs text-gray-500",
  },
} as const;

// Spacing Scale - Mobile First Approach
export const spacing = {
  // Container spacing (Page margins, section padding)
  container: {
    xs: "px-4 py-3 sm:px-6 sm:py-4",
    sm: "px-4 py-4 sm:px-6 sm:py-6",
    md: "px-4 py-6 sm:px-6 sm:py-8 lg:px-8",
    lg: "px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16",
    xl: "px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20",
  },

  // Component spacing (Cards, panels, sections)
  component: {
    xs: "p-3 sm:p-4",
    sm: "p-4 sm:p-6",
    md: "p-6 sm:p-8",
    lg: "p-8 sm:p-12",
  },

  // Element spacing (Between elements, gaps)
  element: {
    xs: "gap-2 sm:gap-3",
    sm: "gap-3 sm:gap-4",
    md: "gap-4 sm:gap-6",
    lg: "gap-6 sm:gap-8",
    xl: "gap-8 sm:gap-12",
  },

  // Margin utilities
  margin: {
    xs: "m-2 sm:m-3",
    sm: "m-3 sm:m-4",
    md: "m-4 sm:m-6",
    lg: "m-6 sm:m-8",
  },

  // Stack spacing (Vertical rhythm)
  stack: {
    xs: "space-y-2 sm:space-y-3",
    sm: "space-y-3 sm:space-y-4",
    md: "space-y-4 sm:space-y-6",
    lg: "space-y-6 sm:space-y-8",
    xl: "space-y-8 sm:space-y-12",
  },
} as const;

// Interactive element sizing
export const interactive = {
  // Button sizes
  button: {
    sm: "px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm",
    md: "px-4 py-2 text-sm sm:px-6 sm:py-2.5 sm:text-base",
    lg: "px-6 py-3 text-base sm:px-8 sm:py-4 sm:text-lg",
  },

  // Touch targets (minimum 44px on mobile)
  touch: {
    sm: "min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px]",
    md: "min-h-[44px] min-w-[44px] sm:min-h-[40px] sm:min-w-[40px]",
    lg: "min-h-[48px] min-w-[48px] sm:min-h-[44px] sm:min-w-[44px]",
  },

  // Form elements
  input: {
    sm: "px-3 py-2 text-sm sm:px-4 sm:py-2 sm:text-base",
    md: "px-4 py-2.5 text-sm sm:px-4 sm:py-3 sm:text-base",
    lg: "px-4 py-3 text-base sm:px-6 sm:py-4 sm:text-lg",
  },
} as const;

// Responsive grid utilities
export const grid = {
  // Auto-fit grids
  autoFit: {
    sm: "grid-cols-1 sm:grid-cols-2",
    md: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    lg: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    xl: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
  },

  // Specific layouts
  stats: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  cards: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
  list: "grid-cols-1",
} as const;

// Responsive utilities helper functions
export const responsive = {
  /**
   * Get responsive class string from typography tokens
   */
  text: (category: keyof typeof typography, variant: string) => {
    const categoryObj = typography[category] as Record<string, string>;
    return categoryObj[variant] || "";
  },

  /**
   * Get responsive class string from spacing tokens
   */
  space: (category: keyof typeof spacing, variant: string) => {
    const categoryObj = spacing[category] as Record<string, string>;
    return categoryObj[variant] || "";
  },

  /**
   * Get responsive class string from interactive tokens
   */
  interact: (category: keyof typeof interactive, variant: string) => {
    const categoryObj = interactive[category] as Record<string, string>;
    return categoryObj[variant] || "";
  },

  /**
   * Combine multiple responsive utilities
   */
  combine: (...classes: string[]) => {
    return classes.filter(Boolean).join(" ");
  },

  /**
   * Conditional responsive classes
   */
  conditional: (condition: boolean, trueClass: string, falseClass = "") => {
    return condition ? trueClass : falseClass;
  },
};

// Breakpoint utilities for JavaScript
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

// Media query helpers for styled components or dynamic styles
export const mediaQueries = {
  sm: `(min-width: ${breakpoints.sm}px)`,
  md: `(min-width: ${breakpoints.md}px)`,
  lg: `(min-width: ${breakpoints.lg}px)`,
  xl: `(min-width: ${breakpoints.xl}px)`,
  "2xl": `(min-width: ${breakpoints["2xl"]}px)`,
} as const;
