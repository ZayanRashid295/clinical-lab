/**
 * Touch-Friendly Interaction Utilities
 * Provides utilities for creating accessible, touch-friendly interfaces
 */

// Touch target sizes (minimum 44px for accessibility)
export const touchTargets = {
  // Minimum touch target sizes
  minimum: "min-h-[44px] min-w-[44px]",
  comfortable: "min-h-[48px] min-w-[48px]",
  large: "min-h-[56px] min-w-[56px]",

  // Interactive element padding for touch
  padding: {
    sm: "p-2 sm:p-1.5", // More padding on mobile
    md: "p-3 sm:p-2",
    lg: "p-4 sm:p-3",
  },

  // Touch-friendly spacing between interactive elements
  spacing: {
    sm: "gap-3 sm:gap-2",
    md: "gap-4 sm:gap-3",
    lg: "gap-6 sm:gap-4",
  },
} as const;

// Gesture-friendly interactions
export const gestures = {
  // Swipe-friendly containers
  swipeContainer: "touch-pan-x overflow-x-auto scrollbar-hide",

  // Tap feedback
  tapFeedback: "active:scale-95 transition-transform duration-150",

  // Long press indication
  longPress: "select-none touch-manipulation",

  // Scroll momentum
  scrollMomentum: "overflow-scroll touch-pan-y",
} as const;

// Mobile-first hover states
export const mobileHover = {
  // Only show hover effects on devices that support hover
  button: "hover:bg-opacity-90 focus:bg-opacity-90 active:bg-opacity-80",
  card: "@media (hover: hover) { hover:shadow-md hover:scale-[1.02] }",
  link: "@media (hover: hover) { hover:underline }",
} as const;

// Accessibility helpers
export const accessibility = {
  // Screen reader only
  srOnly: "sr-only",

  // Focus indicators
  focus: {
    ring: "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
    visible:
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
  },

  // ARIA labels for touch interactions
  touchLabels: {
    tap: "Tap to activate",
    swipe: "Swipe to navigate",
    longPress: "Long press for options",
    doubleTab: "Double tap to select",
  },
} as const;

// Touch interaction helpers
export const touchHelpers = {
  /**
   * Debounce function for preventing rapid taps
   */
  debounce: <T extends (...args: any[]) => void>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  /**
   * Throttle function for scroll/swipe events
   */
  throttle: <T extends (...args: any[]) => void>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  /**
   * Detect if device supports touch
   */
  isTouchDevice: (): boolean => {
    return (
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-ignore
      navigator.msMaxTouchPoints > 0
    );
  },

  /**
   * Get optimal touch target size based on content
   */
  getTouchTargetSize: (contentSize: "small" | "medium" | "large"): string => {
    const sizeMap = {
      small: touchTargets.minimum,
      medium: touchTargets.comfortable,
      large: touchTargets.large,
    };
    return sizeMap[contentSize];
  },

  /**
   * Create touch-friendly class combinations
   */
  createTouchClass: (
    baseClasses: string,
    touchEnhancements?: {
      tapFeedback?: boolean;
      minTouchTarget?: boolean;
      focusRing?: boolean;
      extraPadding?: boolean;
    }
  ): string => {
    const enhancements = {
      tapFeedback: false,
      minTouchTarget: true,
      focusRing: true,
      extraPadding: false,
      ...touchEnhancements,
    };

    let classes = baseClasses;

    if (enhancements.minTouchTarget) {
      classes += ` ${touchTargets.minimum}`;
    }

    if (enhancements.tapFeedback) {
      classes += ` ${gestures.tapFeedback}`;
    }

    if (enhancements.focusRing) {
      classes += ` ${accessibility.focus.ring}`;
    }

    if (enhancements.extraPadding) {
      classes += ` ${touchTargets.padding.md}`;
    }

    return classes;
  },
} as const;

// Responsive breakpoints for touch interactions
export const touchBreakpoints = {
  // Show touch-specific UI only on touch devices
  touchOnly: "@media (pointer: coarse)",

  // Show mouse-specific UI only on non-touch devices
  mouseOnly: "@media (pointer: fine)",

  // Combine with hover support
  hoverSupport: "@media (hover: hover) and (pointer: fine)",
} as const;

// Common touch interaction patterns
export const touchPatterns = {
  // Card that's tappable
  tappableCard: `
    ${touchTargets.comfortable}
    ${gestures.tapFeedback}
    ${accessibility.focus.ring}
    cursor-pointer
    transition-all duration-200
  `,

  // Button optimized for touch
  touchButton: `
    ${touchTargets.minimum}
    ${gestures.tapFeedback}
    ${accessibility.focus.ring}
    ${touchTargets.padding.md}
    rounded-md
    transition-all duration-200
  `,

  // List item that's interactive
  touchListItem: `
    ${touchTargets.comfortable}
    ${gestures.tapFeedback}
    ${accessibility.focus.ring}
    ${touchTargets.padding.sm}
    border-b border-gray-200
    transition-colors duration-200
  `,

  // Swipeable container
  swipeableContainer: `
    ${gestures.swipeContainer}
    ${gestures.scrollMomentum}
    -mx-4 px-4 sm:mx-0 sm:px-0
  `,
} as const;
