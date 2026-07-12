"use client";

import { createContext, useContext } from "react";

/** Scroll progress 0–1 within the cinematic hero scrub zone. */
export const HeroScrollContext = createContext(0);

export function useHeroScrollProgress(): number {
  return useContext(HeroScrollContext);
}
