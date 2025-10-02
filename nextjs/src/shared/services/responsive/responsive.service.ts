import { useState, useEffect, useCallback } from "react";

export interface ResponsiveLayoutState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  shouldUseVerticalLayout: boolean;
}

export interface Breakpoints {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  "2xl": number;
}

export const useResponsiveLayout = () => {
  const breakpoints: Breakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    "2xl": 1536,
  };

  const [state, setState] = useState<ResponsiveLayoutState>(() => {
    if (typeof window === "undefined") {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        screenWidth: 1024,
        shouldUseVerticalLayout: false,
      };
    }

    const width = window.innerWidth;
    const isMobile = width < breakpoints.md;
    const isTablet = width >= breakpoints.md && width < breakpoints.lg;
    const isDesktop = width >= breakpoints.lg;
    const shouldUseVerticalLayout = isMobile || isTablet;

    return {
      isMobile,
      isTablet,
      isDesktop,
      screenWidth: width,
      shouldUseVerticalLayout,
    };
  });

  const updateState = useCallback(() => {
    if (typeof window === "undefined") return;

    const width = window.innerWidth;
    const isMobile = width < breakpoints.md;
    const isTablet = width >= breakpoints.md && width < breakpoints.lg;
    const isDesktop = width >= breakpoints.lg;
    const shouldUseVerticalLayout = isMobile || isTablet;

    const newState = {
      isMobile,
      isTablet,
      isDesktop,
      screenWidth: width,
      shouldUseVerticalLayout,
    };

    setState((prevState) => {
      // Only update if state actually changed to prevent unnecessary re-renders
      if (
        prevState.isMobile !== newState.isMobile ||
        prevState.isTablet !== newState.isTablet ||
        prevState.isDesktop !== newState.isDesktop ||
        prevState.shouldUseVerticalLayout !==
          newState.shouldUseVerticalLayout ||
        Math.abs(prevState.screenWidth - newState.screenWidth) > 10
      ) {
        return newState;
      }
      return prevState;
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Initial state
    updateState();

    // Listen to window resize events with debounce
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateState, 16); // ~60fps for smoother transitions
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, [updateState]);

  const getResponsiveLayout = useCallback(
    (
      preferredLayout: "horizontal" | "vertical" = "horizontal"
    ): ResponsiveLayoutState => {
      return {
        ...state,
        shouldUseVerticalLayout:
          state.isMobile ||
          (preferredLayout === "horizontal" && state.isTablet),
      };
    },
    [state]
  );

  const isBreakpoint = useCallback(
    (breakpoint: keyof Breakpoints): boolean => {
      switch (breakpoint) {
        case "sm":
          return state.screenWidth >= breakpoints.sm;
        case "md":
          return state.screenWidth >= breakpoints.md;
        case "lg":
          return state.screenWidth >= breakpoints.lg;
        case "xl":
          return state.screenWidth >= breakpoints.xl;
        case "2xl":
          return state.screenWidth >= breakpoints["2xl"];
        default:
          return false;
      }
    },
    [state.screenWidth, breakpoints]
  );

  const getCurrentBreakpoint = useCallback((): string => {
    if (state.screenWidth >= breakpoints["2xl"]) return "2xl";
    if (state.screenWidth >= breakpoints.xl) return "xl";
    if (state.screenWidth >= breakpoints.lg) return "lg";
    if (state.screenWidth >= breakpoints.md) return "md";
    if (state.screenWidth >= breakpoints.sm) return "sm";
    return "xs";
  }, [state.screenWidth, breakpoints]);

  const getBreakpoints = useCallback((): Breakpoints => {
    return { ...breakpoints };
  }, []);

  return {
    ...state,
    getResponsiveLayout,
    isBreakpoint,
    getCurrentBreakpoint,
    getBreakpoints,
  };
};
