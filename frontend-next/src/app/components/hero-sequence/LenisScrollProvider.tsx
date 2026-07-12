"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

interface LenisContextValue {
  lenis: Lenis | null;
}

const LenisContext = createContext<LenisContextValue>({ lenis: null });

export function useLenis(): Lenis | null {
  return useContext(LenisContext).lenis;
}

interface LenisScrollProviderProps {
  children: ReactNode;
  /** Only enable on pages that need cinematic scroll (landing). */
  enabled?: boolean;
}

/**
 * Smooth scroll provider for marketing pages.
 * Uses Lenis with native scroll position sync for scrub-based heroes.
 */
export function LenisScrollProvider({
  children,
  enabled = true,
}: LenisScrollProviderProps) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const prefersReduced =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const instance = new Lenis({
      duration: 1.35,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.4,
      wheelMultiplier: 0.9,
    });

    document.documentElement.classList.add("lenis", "lenis-smooth");
    setLenis(instance);

    const raf = (time: number) => {
      instance.raf(time);
      rafRef.current = requestAnimationFrame(raf);
    };
    rafRef.current = requestAnimationFrame(raf);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      document.documentElement.classList.remove("lenis", "lenis-smooth");
      instance.destroy();
      setLenis(null);
    };
  }, [enabled]);

  return (
    <LenisContext.Provider value={{ lenis }}>{children}</LenisContext.Provider>
  );
}
