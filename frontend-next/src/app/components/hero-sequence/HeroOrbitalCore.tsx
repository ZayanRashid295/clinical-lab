"use client";

import { useEffect, useRef } from "react";
import { HERO_COLORS } from "./constants";
import { clamp, lerp } from "./utils/easing";
import {
  readHeroCanvasBg,
  readThemeCanvasPalette,
  rgbaRgb,
  type Rgb,
  type ThemeCanvasPalette,
} from "./utils/themeCanvasColors";

export interface HeroOrbitalCoreProps {
  /** Hero scroll progress 0–1 — modulates glow & camera. */
  scrollProgress?: number;
  reducedMotion?: boolean;
  className?: string;
  /** Center behind hero copy (blended composition). */
  centered?: boolean;
}

function rgba(c: Rgb, a: number) {
  return rgbaRgb(c, a);
}


function buildCrystalVertices(): Array<[number, number, number]> {
  const phi = (1 + Math.sqrt(5)) / 2;
  const raw: Array<[number, number, number]> = [
    [-1, phi, 0],
    [1, phi, 0],
    [-1, -phi, 0],
    [1, -phi, 0],
    [0, -1, phi],
    [0, 1, phi],
    [0, -1, -phi],
    [0, 1, -phi],
    [phi, 0, -1],
    [phi, 0, 1],
    [-phi, 0, -1],
    [-phi, 0, 1],
  ];

  return raw.map(([x, y, z]) => {
    const len = Math.sqrt(x * x + y * y + z * z);
    const nx = x / len;
    const ny = y / len;
    const nz = z / len;
    const jag = 0.72 + Math.abs(Math.sin(nx * 4.1 + ny * 3.7)) * 0.38;
    return [nx * jag * 88, ny * jag * 88, nz * jag * 88];
  });
}

const FACES: Array<[number, number, number]> = [
  [0, 11, 5],
  [0, 5, 1],
  [0, 1, 7],
  [0, 7, 10],
  [0, 10, 11],
  [1, 5, 9],
  [5, 11, 4],
  [11, 10, 2],
  [10, 7, 6],
  [7, 1, 8],
  [3, 9, 4],
  [3, 4, 2],
  [3, 2, 6],
  [3, 6, 8],
  [3, 8, 9],
  [4, 9, 5],
  [2, 4, 11],
  [6, 2, 10],
  [8, 6, 7],
  [9, 8, 1],
];

interface Point3 {
  x: number;
  y: number;
  z: number;
}

function rotateY(p: Point3, a: number): Point3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: p.x * c + p.z * s, y: p.y, z: -p.x * s + p.z * c };
}

function rotateX(p: Point3, a: number): Point3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: p.x, y: p.y * c - p.z * s, z: p.y * s + p.z * c };
}

function project(
  p: Point3,
  cx: number,
  cy: number,
  focal: number,
  scale: number
): { x: number; y: number; z: number; s: number } {
  const f = focal / (focal + p.z);
  return {
    x: cx + p.x * f * scale,
    y: cy + p.y * f * scale,
    z: p.z,
    s: f,
  };
}

/**
 * Live rotating crystalline shard — purple orbital core (continuous RAF).
 */
export function HeroOrbitalCore({
  scrollProgress = 0,
  reducedMotion = false,
  className = "",
  centered = false,
}: HeroOrbitalCoreProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef(scrollProgress);
  const motionRef = useRef(reducedMotion);
  const rafRef = useRef<number | null>(null);
  const timeRef = useRef(0);

  scrollRef.current = scrollProgress;
  motionRef.current = reducedMotion;
  const centeredRef = useRef(centered);
  centeredRef.current = centered;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const vertices = buildCrystalVertices();
    let w = 0;
    let h = 0;

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
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const drawRing = (
      cx: number,
      cy: number,
      rx: number,
      ry: number,
      tilt: number,
      spin: number,
      alpha: number,
      palette: ThemeCanvasPalette
    ) => {
      ctx.beginPath();
      for (let i = 0; i <= 64; i++) {
        const ang = (i / 64) * Math.PI * 2;
        const x = Math.cos(ang + spin) * rx;
        const y = Math.sin(ang + spin) * ry;
        const p = rotateX(rotateY({ x, y, z: 0 }, tilt), tilt * 0.35);
        const pr = project(p, cx, cy, 420, 1);
        if (i === 0) ctx.moveTo(pr.x, pr.y);
        else ctx.lineTo(pr.x, pr.y);
      }
      ctx.closePath();
      ctx.strokeStyle = rgba(palette.primary, alpha);
      ctx.lineWidth = 1.2;
      ctx.stroke();
    };

    let lastNow = performance.now();

    const render = (now: number) => {
      const dt = Math.min(now - lastNow, 32);
      lastNow = now;
      if (!motionRef.current) timeRef.current += dt;

      const palette = readThemeCanvasPalette();
      const t = timeRef.current * 0.001;
      const scroll = scrollRef.current;
      const glow = 0.55 + scroll * 0.45;

      ctx.fillStyle = readHeroCanvasBg(HERO_COLORS.background);
      ctx.fillRect(0, 0, w, h);

      const cx = centeredRef.current ? w * 0.5 : w * 0.62;
      const cy = centeredRef.current ? h * 0.42 : h * 0.48;
      const scaleMul = centeredRef.current ? 1.28 : 1;
      const scale = lerp(0.92, 1.08, scroll) * Math.min(w, h) / 520 * scaleMul;

      const bloomR = Math.min(w, h) * lerp(0.38, 0.48, scroll);
      const bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, bloomR);
      bloom.addColorStop(0, rgba(palette.light, 0.22 * glow));
      bloom.addColorStop(0.35, rgba(palette.primary, 0.14 * glow));
      bloom.addColorStop(0.65, rgba(palette.deep, 0.05 * glow));
      bloom.addColorStop(1, "transparent");
      ctx.fillStyle = bloom;
      ctx.fillRect(0, 0, w, h);

      const autoSpin = motionRef.current ? 0.35 : t * 0.55;
      const rotY = autoSpin + scroll * 0.9;
      const rotX = 0.28 + scroll * 0.16 + Math.sin(t * 0.4) * 0.06;

      drawRing(cx, cy, 155 * scale, 52 * scale, 0.5, -t * 0.7, 0.35 + glow * 0.25, palette);
      drawRing(cx, cy, 175 * scale, 48 * scale, 1.1, t * 0.55, 0.28 + glow * 0.2, palette);
      drawRing(cx, cy, 135 * scale, 58 * scale, 1.7, -t * 0.85, 0.22 + glow * 0.18, palette);

      const projected = vertices.map(([vx, vy, vz]) => {
        let p: Point3 = { x: vx, y: vy, z: vz };
        p = rotateY(p, rotY);
        p = rotateX(p, rotX);
        return project(p, cx, cy, 420, scale);
      });

      const faceData = FACES.map(([a, b, c]) => ({
        idx: [a, b, c] as [number, number, number],
        depth: (projected[a].z + projected[b].z + projected[c].z) / 3,
      })).sort((f1, f2) => f1.depth - f2.depth);

      for (const face of faceData) {
        const [a, b, c] = face.idx;
        const pa = projected[a];
        const pb = projected[b];
        const pc = projected[c];
        const depthNorm = clamp((face.depth + 120) / 240, 0, 1);
        const faceAlpha = 0.08 + depthNorm * 0.18 + glow * 0.08;

        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.lineTo(pc.x, pc.y);
        ctx.closePath();

        const fg = ctx.createLinearGradient(pa.x, pa.y, pc.x, pc.y);
        fg.addColorStop(0, rgba(palette.light, faceAlpha));
        fg.addColorStop(1, rgba(palette.deep, faceAlpha * 0.6));
        ctx.fillStyle = fg;
        ctx.fill();

        ctx.strokeStyle = rgba(palette.primary, 0.25 + depthNorm * 0.35 + glow * 0.2);
        ctx.lineWidth = 0.8 + depthNorm * 0.6;
        ctx.stroke();
      }

      for (const p of projected) {
        const depthNorm = clamp((p.z + 120) / 240, 0, 1);
        const nodeR = (2.5 + depthNorm * 4) * p.s;
        const nodeAlpha = 0.35 + depthNorm * 0.55 + glow * 0.25;

        const ng = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, nodeR * 3);
        ng.addColorStop(0, rgba(palette.primary, nodeAlpha));
        ng.addColorStop(0.5, rgba(palette.light, nodeAlpha * 0.35));
        ng.addColorStop(1, "transparent");
        ctx.fillStyle = ng;
        ctx.beginPath();
        ctx.arc(p.x, p.y, nodeR * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = rgba({ r: 250, g: 245, b: 255 }, 0.5 + depthNorm * 0.4);
        ctx.beginPath();
        ctx.arc(p.x, p.y, nodeR * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }

      const coreR = lerp(18, 32, scroll) * scale;
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
      core.addColorStop(0, rgba({ r: 255, g: 255, b: 255 }, 0.85 * glow));
      core.addColorStop(0.25, rgba(palette.primary, 0.65 * glow));
      core.addColorStop(0.6, rgba(palette.light, 0.25 * glow));
      core.addColorStop(1, "transparent");
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
      ctx.fill();

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);

    return () => {
      ro.disconnect();
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`hero-orbital-core ${className}`.trim()}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="hero-orbital-core-canvas" />
      <div className="hero-orbital-core-vignette" />
    </div>
  );
}
