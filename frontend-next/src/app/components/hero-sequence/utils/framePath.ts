import { HERO_SEQUENCE } from "../constants";

export function formatFrameFilename(index: number): string {
  const padded = String(index + 1).padStart(HERO_SEQUENCE.indexPad, "0");
  return HERO_SEQUENCE.filePattern.replace("{index}", padded);
}

export function getFrameUrl(basePath: string, index: number): string {
  return `${basePath}/${formatFrameFilename(index)}`;
}

export function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 768px)").matches;
}
