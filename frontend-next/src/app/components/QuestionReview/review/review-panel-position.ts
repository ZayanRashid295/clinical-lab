const HEADER_OFFSET = 72;
const PANEL_ESTIMATE_HEIGHT = 440;
const VIEWPORT_MARGIN = 12;

/** Keep the feedback panel vertically aligned with the user's selection/click. */
export function clampFeedbackPanelTop(anchorY?: number): number {
  if (typeof window === "undefined") return HEADER_OFFSET;

  const maxTop =
    window.innerHeight - PANEL_ESTIMATE_HEIGHT - VIEWPORT_MARGIN;

  if (anchorY == null || Number.isNaN(anchorY)) {
    return Math.max(
      HEADER_OFFSET,
      Math.min((window.innerHeight - PANEL_ESTIMATE_HEIGHT) / 2, maxTop)
    );
  }

  const aligned = anchorY - 56;
  return Math.max(HEADER_OFFSET, Math.min(aligned, maxTop));
}

export function anchorYFromEvent(e: { clientY: number }): number {
  return e.clientY;
}
