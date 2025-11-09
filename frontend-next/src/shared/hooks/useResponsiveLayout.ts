import { useState, useEffect } from "react";
import { breakpoints } from "../utils/responsive";

interface ResponsiveLayoutState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  shouldUseVerticalLayout: boolean;
}

export const useResponsiveLayout = (
  preferredLayout: "horizontal" | "vertical" = "horizontal"
) => {
  const [state, setState] = useState<ResponsiveLayoutState>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenWidth: typeof window !== "undefined" ? window.innerWidth : 1024,
    shouldUseVerticalLayout: false,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const isMobile = width < breakpoints.md; // < 768px
      const isTablet = width >= breakpoints.md && width < breakpoints.lg; // 768px - 1024px
      const isDesktop = width >= breakpoints.lg; // >= 1024px

      // Auto-switch to vertical layout at first breakpoint (768px) when width is reduced
      // This ensures vertical mode takes over at the first breakpoint
      const shouldUseVerticalLayout =
        isMobile || (preferredLayout === "horizontal" && isTablet);

      setState({
        isMobile,
        isTablet,
        isDesktop,
        screenWidth: width,
        shouldUseVerticalLayout,
      });
    };

    // Set initial state
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, [preferredLayout]);

  return state;
};

export default useResponsiveLayout;
