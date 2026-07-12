/** Slow cinematic easing — heavy, intentional, no bounce. */

/** Smoothstep — Apple-like ease in-out. */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** Quintic ease-out — decelerates into hold. */
export function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5);
}

/** Quintic ease-in-out — camera moves. */
export function easeInOutQuint(t: number): number {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
}

/** Map linear scroll progress through timeline phases. */
export function mapTimelineProgress(linear: number): number {
  const t = Math.max(0, Math.min(1, linear));
  // Slight ease on the overall scrub so motion feels directed, not linear.
  return easeInOutQuint(t);
}

/** Lerp between two values. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Clamp value. */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
