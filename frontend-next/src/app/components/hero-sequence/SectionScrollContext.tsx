"use client";

import { createContext, useContext } from "react";

/** Per-section scroll progress 0–1 (raw). */
export const SectionScrollContext = createContext(0);

export function useSectionScrollProgress(): number {
  return useContext(SectionScrollContext);
}
