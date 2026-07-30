"use client";

import { useEffect, useRef } from "react";
import {
  isDocumentDarkTheme,
  readHeroCanvasBgRgb,
  readThemeCanvasPalette,
  rgbaRgb,
  type Rgb,
} from "./utils/themeCanvasColors";

export interface HeroBackgroundProps {
  /** Hero scroll progress 0–1 — drives chaos → understanding story. */
  scrollProgress?: number;
  reducedMotion?: boolean;
  className?: string;
}

function rgba(r: number, g: number, b: number, a: number) {
  return `rgba(${r},${g},${b},${a})`;
}

function clamp(v: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, v));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function seeded(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Push a point outside a soft elliptical content safe-zone
 * so cards frame the headline instead of covering it.
 */
function pushOutsideSafeZone(x: number, y: number, rx = 0.42, ry = 0.36): { x: number; y: number } {
  const nx = x / rx;
  const ny = y / ry;
  const d = Math.sqrt(nx * nx + ny * ny);
  if (d >= 1 || d < 0.001) return { x, y };
  const push = 1.08 / d;
  return { x: nx * push * rx, y: ny * push * ry };
}

type Card = {
  id: number;
  hx: number;
  hy: number;
  hz: number;
  hRot: number;
  cx: number;
  cy: number;
  cz: number;
  cRot: number;
  ax: number;
  ay: number;
  az: number;
  aRot: number;
  rx: number;
  ry: number;
  rz: number;
  rRot: number;
  isHero: boolean;
  size: number;
  baseAlpha: number;
  phase: number;
  driftAmp: number;
  options: number;
  answerIdx: number;
  layer: "far" | "mid" | "near";
  x: number;
  y: number;
  z: number;
  rot: number;
  vx: number;
  vy: number;
  vz: number;
  vRot: number;
  alpha: number;
  scale: number;
};

function cardCountForWidth(w: number): number {
  if (w < 640) return 26;
  if (w < 1024) return 42;
  return 64;
}

function createCards(count: number): Card[] {
  const cards: Card[] = [];

  // Four corner / side clusters — never the text center
  const clusterCenters = [
    { x: -0.72, y: -0.38 },
    { x: 0.74, y: -0.32 },
    { x: -0.68, y: 0.42 },
    { x: 0.7, y: 0.48 },
    { x: -0.88, y: 0.05 },
    { x: 0.9, y: 0.02 },
  ];

  for (let i = 0; i < count; i++) {
    const s = i + 1;
    const isHero = i === 0;

    // Orbital chaos — elliptical ring around the safe zone
    const angle = (i / count) * Math.PI * 2 + seeded(s) * 0.55;
    const ring = 0.58 + seeded(s + 11) * 0.42;
    let hx = Math.cos(angle) * ring * 1.05;
    let hy = Math.sin(angle) * ring * 0.78;
    // Jitter then force outside content ellipse
    hx += (seeded(s + 19) - 0.5) * 0.22;
    hy += (seeded(s + 23) - 0.5) * 0.18;
    const chaos = pushOutsideSafeZone(hx, hy, 0.4, 0.34);
    hx = chaos.x;
    hy = chaos.y;

    const cluster = clusterCenters[i % clusterCenters.length];
    const cSpread = 0.08 + seeded(s + 49) * 0.1;
    let cx = cluster.x + (seeded(s + 71) - 0.5) * cSpread * 2;
    let cy = cluster.y + (seeded(s + 83) - 0.5) * cSpread * 2;
    const clustered = pushOutsideSafeZone(cx, cy, 0.38, 0.32);
    cx = clustered.x;
    cy = clustered.y;

    // Align into a gentle oval frame
    const alignAngle = (i / count) * Math.PI * 2 + 0.2;
    let ax = Math.cos(alignAngle) * 0.72;
    let ay = Math.sin(alignAngle) * 0.52;
    const aligned = pushOutsideSafeZone(ax, ay, 0.36, 0.3);
    ax = aligned.x;
    ay = aligned.y;

    // Resolve: hero settles just below-center (under subtitle), others fade to edges
    let rx: number;
    let ry: number;
    if (isHero) {
      rx = 0;
      ry = 0.55; // under CTA area — readable path, not through title
    } else {
      const out = pushOutsideSafeZone(
        (seeded(s + 111) - 0.5) * 1.7,
        (seeded(s + 127) - 0.5) * 1.4,
        0.5,
        0.42
      );
      rx = out.x;
      ry = out.y;
    }

    const layerRoll = seeded(s + 41);
    const layer: Card["layer"] =
      layerRoll < 0.35 ? "far" : layerRoll < 0.7 ? "mid" : "near";

    const hz =
      layer === "far" ? 0.65 + seeded(s + 33) * 0.3 : layer === "mid" ? 0.35 + seeded(s + 33) * 0.25 : 0.08 + seeded(s + 33) * 0.2;

    const size = isHero
      ? 74
      : layer === "far"
        ? lerp(26, 38, seeded(s + 61))
        : layer === "mid"
          ? lerp(36, 52, seeded(s + 61))
          : lerp(50, 66, seeded(s + 61));

    const baseAlpha =
      isHero
        ? 1
        : layer === "far"
          ? lerp(0.4, 0.55, seeded(s + 223))
          : layer === "mid"
            ? lerp(0.62, 0.82, seeded(s + 223))
            : lerp(0.85, 0.98, seeded(s + 223));

    cards.push({
      id: i,
      hx,
      hy,
      hz,
      hRot: (seeded(s + 151) - 0.5) * (layer === "near" ? 0.28 : 0.45),
      cx,
      cy,
      cz: hz * 0.7,
      cRot: (seeded(s + 175) - 0.5) * 0.18,
      ax,
      ay,
      az: hz * 0.55,
      aRot: (seeded(s + 199) - 0.5) * 0.06,
      rx,
      ry,
      rz: isHero ? 0.12 : 0.5 + seeded(s + 139) * 0.35,
      rRot: isHero ? 0 : (seeded(s + 211) - 0.5) * 0.1,
      isHero,
      size,
      baseAlpha,
      phase: seeded(s + 235) * Math.PI * 2,
      driftAmp: lerp(0.006, 0.018, seeded(s + 247)),
      options: 3 + Math.floor(seeded(s + 259) * 2),
      answerIdx: Math.floor(seeded(s + 271) * 3),
      layer,
      x: hx,
      y: hy,
      z: hz,
      rot: (seeded(s + 151) - 0.5) * 0.35,
      vx: 0,
      vy: 0,
      vz: 0,
      vRot: 0,
      alpha: baseAlpha,
      scale: 1,
    });
  }
  return cards;
}

function storyTargets(card: Card, progress: number) {
  const chaos = 1 - smoothstep(0.06, 0.28, progress);
  const intel = smoothstep(0.1, 0.35, progress) * (1 - smoothstep(0.35, 0.55, progress));
  const simple = smoothstep(0.38, 0.6, progress) * (1 - smoothstep(0.6, 0.8, progress));
  const resolve = smoothstep(0.62, 0.9, progress);

  const wChaos = Math.max(chaos, 0.001);
  const wIntel = intel;
  const wSimple = simple;
  const wResolve = resolve;
  const sum = wChaos + wIntel + wSimple + wResolve;

  const x =
    (card.hx * wChaos + card.cx * wIntel + card.ax * wSimple + card.rx * wResolve) / sum;
  const y =
    (card.hy * wChaos + card.cy * wIntel + card.ay * wSimple + card.ry * wResolve) / sum;
  const z =
    (card.hz * wChaos + card.cz * wIntel + card.az * wSimple + card.rz * wResolve) / sum;
  const rot =
    (card.hRot * wChaos +
      card.cRot * wIntel +
      card.aRot * wSimple +
      card.rRot * wResolve) /
    sum;

  let alpha = card.baseAlpha;
  if (resolve > 0.02) {
    if (card.isHero) {
      alpha = lerp(card.baseAlpha, 1, resolve);
    } else if (card.layer === "near") {
      alpha = lerp(card.baseAlpha, 0.12, resolve);
    } else {
      alpha = lerp(card.baseAlpha, 0.03, resolve);
    }
  }

  // Softly fade anything that drifts into the text safe-zone
  const inSafe = 1 - clamp(Math.sqrt((x / 0.38) ** 2 + (y / 0.32) ** 2));
  if (inSafe > 0 && !card.isHero) {
    alpha *= 1 - inSafe * 0.85;
  }

  const scale = card.isHero
    ? lerp(1, 1.25, resolve)
    : lerp(1, 0.82, resolve);

  return { x, y, z, rot, alpha, scale, resolve };
}

function springToward(
  current: number,
  target: number,
  velocity: number,
  dt: number,
  stiffness = 22,
  damping = 12
) {
  const force = (target - current) * stiffness;
  const nextV = (velocity + force * dt) * Math.exp(-damping * dt);
  return { value: current + nextV * dt, velocity: nextV };
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawExamCard(
  ctx: CanvasRenderingContext2D,
  card: Card,
  px: number,
  py: number,
  w: number,
  h: number,
  alpha: number,
  highlight: number,
  checkProgress: number,
  accent: Rgb,
  dark: boolean
) {
  if (alpha < 0.03) return;

  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(card.rot);
  ctx.globalAlpha = alpha;

  const depth = clamp(1 - card.z * 0.55);
  const far = card.layer === "far";
  const ink = dark ? { r: 255, g: 255, b: 255 } : { r: 15, g: 23, b: 42 };

  ctx.shadowColor = rgbaRgb(
    accent,
    (far ? (dark ? 0.1 : 0.08) : 0.2 + highlight * 0.3) * depth * (dark ? 1 : 0.75)
  );
  ctx.shadowBlur = (far ? 8 : 14 + highlight * 18) * depth;

  roundRect(ctx, -w / 2, -h / 2, w, h, Math.max(4, w * 0.11));
  if (dark) {
    ctx.fillStyle = far ? "rgba(22, 28, 36, 0.7)" : "rgba(26, 32, 42, 0.9)";
  } else {
    ctx.fillStyle = far ? "rgba(255, 255, 255, 0.72)" : "rgba(255, 255, 255, 0.92)";
  }
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = dark
    ? rgba(255, 255, 255, (far ? 0.16 : 0.3) * depth + highlight * 0.22)
    : rgba(15, 23, 42, (far ? 0.1 : 0.14) * depth + highlight * 0.12);
  ctx.lineWidth = 1.15;
  ctx.stroke();

  if (!far) {
    ctx.strokeStyle = rgbaRgb(accent, (dark ? 0.28 : 0.35) * depth + highlight * 0.35);
    ctx.lineWidth = 1.15;
    roundRect(ctx, -w / 2 + 0.75, -h / 2 + 0.75, w - 1.5, h - 1.5, Math.max(3.5, w * 0.1));
    ctx.stroke();
  }

  const wash = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  wash.addColorStop(0, dark ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.85)");
  wash.addColorStop(0.45, dark ? "rgba(255,255,255,0.03)" : "rgba(248,250,252,0.4)");
  wash.addColorStop(1, rgbaRgb(accent, dark ? 0.1 : 0.08));
  ctx.fillStyle = wash;
  roundRect(ctx, -w / 2, -h / 2, w, h, Math.max(4, w * 0.11));
  ctx.fill();

  const pad = w * 0.12;
  const left = -w / 2 + pad;
  const top = -h / 2 + pad;
  const contentW = w - pad * 2;

  ctx.fillStyle = rgba(ink.r, ink.g, ink.b, (dark ? 0.45 : 0.28) * depth);
  roundRect(ctx, left, top, contentW * 0.32, h * 0.095, 2);
  ctx.fill();

  const optCount = card.options;
  const rowStart = top + h * 0.22;
  const rowH = (h * 0.5) / optCount;

  for (let o = 0; o < optCount; o++) {
    const oy = rowStart + o * rowH;
    const selected = o === card.answerIdx % optCount;

    ctx.strokeStyle = selected
      ? rgbaRgb(accent, 0.9 * depth)
      : rgba(ink.r, ink.g, ink.b, (dark ? 0.35 : 0.28) * depth);
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.arc(left + 3.5, oy + rowH * 0.35, Math.max(2.5, w * 0.05), 0, Math.PI * 2);
    ctx.stroke();

    if (selected) {
      ctx.fillStyle = rgbaRgb(accent, 0.92 * depth);
      ctx.beginPath();
      ctx.arc(left + 3.5, oy + rowH * 0.35, Math.max(1.5, w * 0.028), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = selected
      ? rgbaRgb(accent, 0.48 * depth + highlight * 0.22)
      : rgba(ink.r, ink.g, ink.b, (dark ? 0.28 : 0.16) * depth);
    roundRect(
      ctx,
      left + w * 0.13,
      oy + rowH * 0.16,
      contentW * (selected ? 0.72 : 0.52 + (o % 2) * 0.12),
      Math.max(3, h * 0.052),
      1.5
    );
    ctx.fill();
  }

  const exY = h / 2 - pad - h * 0.14;
  ctx.fillStyle = rgba(ink.r, ink.g, ink.b, (dark ? 0.2 : 0.12) * depth);
  roundRect(ctx, left, exY, contentW * 0.82, Math.max(2.2, h * 0.035), 1);
  ctx.fill();
  roundRect(ctx, left, exY + h * 0.05, contentW * 0.52, Math.max(2.2, h * 0.035), 1);
  ctx.fill();

  if (card.isHero && checkProgress > 0.05) {
    const cp = clamp(checkProgress);
    ctx.save();
    ctx.globalAlpha = alpha * cp;
    const cx = w * 0.28;
    const cy = -h * 0.28;
    const s = w * 0.15;
    ctx.shadowColor = rgbaRgb(accent, 0.55);
    ctx.shadowBlur = 10;
    ctx.strokeStyle = rgbaRgb(accent, 1);
    ctx.lineWidth = Math.max(2, w * 0.05);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.45, cy);
    ctx.lineTo(cx - s * 0.08, cy + s * 0.35);
    ctx.lineTo(cx + s * 0.5, cy - s * 0.4);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Premium cinematic hero backdrop — MCQ glass cards that frame the brand story.
 * Clear content safe-zone. Depth layers. Soft ambient. No neon blowout.
 */
export function HeroBackground({
  scrollProgress = 0,
  reducedMotion = false,
  className = "",
}: HeroBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef(scrollProgress);
  const lastScrollRef = useRef(scrollProgress);
  const motionRef = useRef(reducedMotion);
  const mouseRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const rafRef = useRef<number | null>(null);

  scrollRef.current = scrollProgress;
  motionRef.current = reducedMotion;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let cards: Card[] = [];
    let lastCount = 0;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const next = cardCountForWidth(w);
      if (next !== lastCount || cards.length === 0) {
        lastCount = next;
        cards = createCards(motionRef.current ? Math.min(14, next) : next);
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const onPointer = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.tx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseRef.current.ty = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    let lastNow = performance.now();
    let time = 0;

    const render = (now: number) => {
      const dt = Math.min((now - lastNow) / 1000, 0.033);
      lastNow = now;
      const reduced = motionRef.current;
      if (!reduced) time += dt;

      const progress = reduced ? 0.82 : scrollRef.current;
      const scrollDelta = Math.abs(scrollRef.current - lastScrollRef.current);
      // Keep the background visibly alive when the viewer is idle. The slower
      // rate while scrolling prevents the autonomous drift from competing with
      // the story transition, then it resumes a cinematic float at rest.
      const idleBoost = scrollDelta < 0.0006 ? 2.5 : 1.35;
      lastScrollRef.current = scrollRef.current;
      const mouse = mouseRef.current;
      mouse.x = lerp(mouse.x, mouse.tx, 1 - Math.exp(-5 * dt));
      mouse.y = lerp(mouse.y, mouse.ty, 1 - Math.exp(-5 * dt));

      const palette = readThemeCanvasPalette();
      const accent = palette.primary;
      const bg = readHeroCanvasBgRgb();
      const dark = isDocumentDarkTheme();
      const ambience = dark ? 1 : 0.72;

      // Transparent clear — page/hero CSS bg shows through; we only paint atmosphere + cards — page/hero CSS bg shows through; we only paint atmosphere + cards
      ctx.clearRect(0, 0, w, h);

      const hx = w * 0.5;
      const hy = h * 0.38;

      // Shared atmosphere (same hue as page, soft green bloom)
      const ambient = ctx.createRadialGradient(hx, hy, 0, hx, hy, Math.min(w, h) * 0.72);
      ambient.addColorStop(0, rgbaRgb(accent, 0.14 * ambience));
      ambient.addColorStop(0.4, rgbaRgb(accent, 0.06 * ambience));
      ambient.addColorStop(0.75, rgba(bg.r, bg.g, bg.b, 0));
      ambient.addColorStop(1, "transparent");
      ctx.fillStyle = ambient;
      ctx.fillRect(0, 0, w, h);

      const sideL = ctx.createRadialGradient(0, h * 0.6, 0, 0, h * 0.6, w * 0.45);
      sideL.addColorStop(0, rgbaRgb(accent, 0.1 * ambience));
      sideL.addColorStop(1, "transparent");
      ctx.fillStyle = sideL;
      ctx.fillRect(0, 0, w, h);

      const sideR = ctx.createRadialGradient(w, h * 0.35, 0, w, h * 0.35, w * 0.45);
      sideR.addColorStop(0, rgbaRgb(accent, 0.09 * ambience));
      sideR.addColorStop(1, "transparent");
      ctx.fillStyle = sideR;
      ctx.fillRect(0, 0, w, h);

      const spanX = Math.min(w, 1280) * 0.46;
      const spanY = Math.min(h, 900) * 0.4;

      // Soft content gate — elliptical distance from headline stage
      const gateRx = Math.min(w, 900) * 0.34;
      const gateRy = Math.min(h, 700) * 0.3;

      const contentGate = (px: number, py: number, isHero: boolean) => {
        const nx = (px - hx) / gateRx;
        const ny = (py - hy) / gateRy;
        const d = Math.sqrt(nx * nx + ny * ny);
        if (d >= 1.15) return 1;
        if (d <= 0.35) return isHero ? 0.12 : 0.04;
        return lerp(isHero ? 0.12 : 0.04, 1, smoothstep(0.35, 1.15, d));
      };

      const linkAlpha =
        smoothstep(0.18, 0.36, progress) * (1 - smoothstep(0.52, 0.72, progress));
      if (linkAlpha > 0.04 && !reduced) {
        ctx.save();
        ctx.lineWidth = 1;
        for (let i = 0; i < cards.length; i += 4) {
          const a = cards[i];
          const b = cards[(i + 3) % cards.length];
          if (a.isHero || b.isHero || a.layer === "far") continue;
          const ax = hx + a.x * spanX;
          const ay = hy + a.y * spanY;
          const bx = hx + b.x * spanX;
          const by = hy + b.y * spanY;
          const dist = Math.hypot(ax - bx, ay - by);
          const gate = Math.min(contentGate(ax, ay, false), contentGate(bx, by, false));
          if (dist > 100 && dist < 240 && gate > 0.35) {
            ctx.strokeStyle = rgbaRgb(accent, 0.2 * linkAlpha * gate);
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.stroke();
          }
        }
        ctx.restore();
      }

      for (const card of cards) {
        const target = storyTargets(card, progress);
        const driftScale = 1 - progress * 0.65;
        const driftX = reduced
          ? 0
          : Math.sin(time * (0.36 * idleBoost) + card.phase) * card.driftAmp * driftScale;
        const driftY = reduced
          ? 0
          : Math.cos(time * (0.3 * idleBoost) + card.phase * 1.2) * card.driftAmp * 0.8 * driftScale;

        const stiffness = reduced ? 70 : 18 + progress * 14;
        const damping = reduced ? 18 : 11 + progress * 5;

        let s = springToward(card.x, target.x + driftX, card.vx, dt, stiffness, damping);
        card.x = s.value;
        card.vx = s.velocity;
        s = springToward(card.y, target.y + driftY, card.vy, dt, stiffness, damping);
        card.y = s.value;
        card.vy = s.velocity;
        s = springToward(card.z, target.z, card.vz, dt, stiffness * 0.75, damping);
        card.z = s.value;
        card.vz = s.velocity;
        s = springToward(card.rot, target.rot, card.vRot, dt, stiffness * 0.65, damping);
        card.rot = s.value;
        card.vRot = s.velocity;
        card.alpha = lerp(card.alpha, target.alpha, 1 - Math.exp(-4.5 * dt));
        card.scale = lerp(card.scale, target.scale, 1 - Math.exp(-4.5 * dt));

        if (!reduced && card.layer === "near") {
          const md = Math.hypot(card.x - mouse.x * 0.25, card.y - mouse.y * 0.25);
          if (md < 0.3) {
            const push = (0.3 - md) * 0.01;
            card.rot += (mouse.x - card.x) * push * 0.5;
          }
        }
      }

      const sorted = [...cards].sort((a, b) => b.z - a.z);
      const checkProgress = smoothstep(0.75, 0.94, progress);

      for (const card of sorted) {
        const depthScale = lerp(1.08, 0.62, clamp(card.z));
        const parallax = (1 - card.z) * (card.layer === "near" ? 16 : 8);
        const px = hx + card.x * spanX + mouse.x * parallax;
        const py = hy + card.y * spanY + mouse.y * parallax * 0.65;
        const cw = card.size * depthScale * card.scale;
        const ch = cw * 1.28;
        const highlight = card.isHero ? smoothstep(0.55, 0.92, progress) : 0;
        const gate = contentGate(px, py, card.isHero);

        drawExamCard(
          ctx,
          card,
          px,
          py,
          cw,
          ch,
          card.alpha * gate,
          highlight,
          card.isHero ? checkProgress : 0,
          accent,
          dark
        );
      }

      // Feather edges into page bg (no hard canvas rectangle)
      const vig = ctx.createRadialGradient(
        hx,
        hy,
        Math.min(w, h) * 0.35,
        hx,
        hy,
        Math.max(w, h) * 0.78
      );
      vig.addColorStop(0, "transparent");
      vig.addColorStop(0.65, "transparent");
      vig.addColorStop(1, rgba(bg.r, bg.g, bg.b, dark ? 0.55 : 0.35));
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);

      // Soft bottom dissolve into next section
      const bottom = ctx.createLinearGradient(0, h * 0.72, 0, h);
      bottom.addColorStop(0, "transparent");
      bottom.addColorStop(0.55, rgba(bg.r, bg.g, bg.b, dark ? 0.25 : 0.18));
      bottom.addColorStop(1, rgba(bg.r, bg.g, bg.b, dark ? 0.85 : 0.65));
      ctx.fillStyle = bottom;
      ctx.fillRect(0, 0, w, h);

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);

    return () => {
      ro.disconnect();
      window.removeEventListener("pointermove", onPointer);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [reducedMotion]);

  return (
    <div
      ref={containerRef}
      className={`hero-background ${className}`.trim()}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="hero-background-canvas" />
      <div className="hero-background-vignette" />
    </div>
  );
}
