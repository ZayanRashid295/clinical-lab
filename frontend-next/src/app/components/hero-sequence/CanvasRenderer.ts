import { HERO_COLORS, HERO_PERFORMANCE } from "./constants";
import type { CanvasRenderOptions } from "./types";
import { clamp, lerp } from "./utils/easing";

/**
 * Canvas 2D renderer for hero sequence frames with DPR, cover fit, and interpolation.
 */
export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private dpr = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("CanvasRenderer: 2D context unavailable");
    this.ctx = ctx;
  }

  resize(cssWidth: number, cssHeight: number, isMobile: boolean): void {
    const maxDpr = isMobile
      ? HERO_PERFORMANCE.mobileMaxDevicePixelRatio
      : HERO_PERFORMANCE.maxDevicePixelRatio;
    this.dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    this.width = Math.round(cssWidth * this.dpr);
    this.height = Math.round(cssHeight * this.dpr);
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.width = `${cssWidth}px`;
    this.canvas.style.height = `${cssHeight}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  /**
   * Draw frame with optional crossfade between adjacent frames for smooth scrubbing.
   */
  render(
    primary: HTMLImageElement | undefined,
    secondary: HTMLImageElement | undefined,
    blend: number,
    options: CanvasRenderOptions
  ): void {
    const w = this.width / this.dpr;
    const h = this.height / this.dpr;

    this.ctx.fillStyle = options.backgroundColor;
    this.ctx.fillRect(0, 0, w, h);

    const { x: px, y: py } = options.parallaxOffset;

    const focus = options.focus ?? "center";

    if (primary) {
      this.drawImageCover(primary, w, h, px, py, 1 - blend, focus);
    }
    if (secondary && blend > 0.001) {
      this.ctx.globalAlpha = clamp(blend, 0, 1);
      this.drawImageCover(secondary, w, h, px, py, blend, focus);
      this.ctx.globalAlpha = 1;
    }

    if (focus === "right") {
      const gradient = this.ctx.createLinearGradient(0, 0, w * 0.22, 0);
      gradient.addColorStop(0, "rgba(5, 5, 8, 0.18)");
      gradient.addColorStop(1, "rgba(5, 5, 8, 0)");
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, w, h);
    } else if (focus === "left") {
      const gradient = this.ctx.createLinearGradient(w, 0, w * 0.65, 0);
      gradient.addColorStop(0, "rgba(5, 5, 8, 0.35)");
      gradient.addColorStop(1, "rgba(5, 5, 8, 0)");
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, w, h);
    }
  }

  private drawImageCover(
    img: HTMLImageElement,
    cw: number,
    ch: number,
    parallaxX: number,
    parallaxY: number,
    alpha: number,
    focus: "left" | "center" | "right" = "center"
  ): void {
    if (alpha <= 0) return;
    if (!img.naturalWidth || !img.naturalHeight) return;

    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = cw / ch;
    let dw: number;
    let dh: number;

    if (imgRatio > canvasRatio) {
      dh = ch;
      dw = dh * imgRatio;
    } else {
      dw = cw;
      dh = dw / imgRatio;
    }

    const focusShift =
      focus === "right" ? -cw * 0.2 : focus === "left" ? cw * 0.2 : 0;
    const dx = (cw - dw) / 2 + parallaxX + focusShift;
    const dy = (ch - dh) / 2 + parallaxY;

    this.ctx.globalAlpha = alpha;
    this.ctx.drawImage(img, dx, dy, dw, dh);
    this.ctx.globalAlpha = 1;
  }

  /** Fallback — matches frame-1 hero bloom until WebP loads. */
  renderPlaceholder(progress: number): void {
    const w = this.width / this.dpr;
    const h = this.height / this.dpr;
    const cx = w * 0.68;
    const cy = h * 0.46;
    const load = 0.55 + progress * 0.45;

    this.ctx.fillStyle = HERO_COLORS.background;
    this.ctx.fillRect(0, 0, w, h);

    const bloom = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.38);
    bloom.addColorStop(0, `rgba(248, 250, 252, ${0.12 * load})`);
    bloom.addColorStop(0.15, `rgba(56, 189, 248, ${0.38 * load})`);
    bloom.addColorStop(0.45, `rgba(56, 189, 248, ${0.18 * load})`);
    bloom.addColorStop(0.75, `rgba(59, 130, 246, ${0.06 * load})`);
    bloom.addColorStop(1, HERO_COLORS.background);
    this.ctx.fillStyle = bloom;
    this.ctx.fillRect(0, 0, w, h);

    const orbR = Math.min(w, h) * 0.14 * load;
    const orb = this.ctx.createRadialGradient(
      cx - orbR * 0.35,
      cy - orbR * 0.4,
      4,
      cx,
      cy,
      orbR
    );
    orb.addColorStop(0, `rgba(248, 250, 252, ${0.85 * load})`);
    orb.addColorStop(0.35, `rgba(56, 189, 248, ${0.55 * load})`);
    orb.addColorStop(0.75, `rgba(59, 130, 246, ${0.2 * load})`);
    orb.addColorStop(1, "rgba(5,5,8,0)");
    this.ctx.fillStyle = orb;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, orbR, 0, Math.PI * 2);
    this.ctx.fill();
  }

  /** Interpolate between two frame indices. */
  static splitFrameIndex(floatIndex: number): {
    lower: number;
    upper: number;
    blend: number;
  } {
    const lower = Math.floor(floatIndex);
    const upper = Math.ceil(floatIndex);
    const blend = floatIndex - lower;
    return { lower, upper, blend: clamp(blend, 0, 1) };
  }

  static smoothFrameIndex(current: number, target: number): number {
    return lerp(current, target, HERO_PERFORMANCE.frameSmoothing);
  }
}
