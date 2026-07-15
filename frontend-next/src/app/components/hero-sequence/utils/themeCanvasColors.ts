/** Reads app marketing accent tokens for canvas / CSS 3D glows. */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface ThemeCanvasPalette {
  /** --mkt-accent — main strokes, nodes, core glow */
  primary: Rgb;
  /** --mkt-accent-muted — inner bloom, face fills */
  light: Rgb;
  /** --mkt-accent-hover — outer depth, gradients */
  deep: Rgb;
}

const FALLBACK: ThemeCanvasPalette = {
  primary: { r: 37, g: 99, b: 235 },
  light: { r: 59, g: 130, b: 246 },
  deep: { r: 29, g: 78, b: 216 },
};

export function rgbaRgb(c: Rgb, a: number): string {
  return `rgba(${c.r},${c.g},${c.b},${a})`;
}

export function parseCssColor(value: string): Rgb | null {
  const v = value.trim();
  if (!v) return null;

  if (v.startsWith("#")) {
    const hex = v.slice(1);
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
      };
    }
    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
      };
    }
    return null;
  }

  const rgbMatch = v.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
  if (rgbMatch) {
    return {
      r: Math.round(Number(rgbMatch[1])),
      g: Math.round(Number(rgbMatch[2])),
      b: Math.round(Number(rgbMatch[3])),
    };
  }

  return null;
}

/** Live palette from ThemeService `--mkt-*` tokens (re-read each frame for theme changes). */
export function readThemeCanvasPalette(): ThemeCanvasPalette {
  if (typeof document === "undefined") return FALLBACK;

  const style = getComputedStyle(document.documentElement);
  const primary = parseCssColor(style.getPropertyValue("--mkt-accent"));
  const light = parseCssColor(style.getPropertyValue("--mkt-accent-muted"));
  const deep = parseCssColor(style.getPropertyValue("--mkt-accent-hover"));

  if (!primary) return FALLBACK;

  return {
    primary,
    light: light ?? primary,
    deep: deep ?? primary,
  };
}

export function isDocumentDarkTheme(): boolean {
  if (typeof document === "undefined") return true;
  return document.documentElement.classList.contains("dark");
}

export function readHeroCanvasBg(fallback = "#050508"): string {
  if (typeof document === "undefined") return fallback;
  const root = document.documentElement;
  const landing = document.querySelector(".medprep-landing-v2");
  const source = landing ?? root;
  const fromCine = getComputedStyle(source).getPropertyValue("--cine-hero-bg").trim();
  if (fromCine) return fromCine;
  const fromMkt = getComputedStyle(root).getPropertyValue("--mkt-bg-muted").trim();
  return fromMkt || fallback;
}

/** Parsed hero/page background for canvas fades that match CSS theme. */
export function readHeroCanvasBgRgb(fallback = "#050508"): Rgb {
  const parsed = parseCssColor(readHeroCanvasBg(fallback));
  if (parsed) return parsed;
  return isDocumentDarkTheme()
    ? { r: 5, g: 5, b: 8 }
    : { r: 248, g: 250, b: 252 };
}
