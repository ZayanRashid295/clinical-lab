"use client";

import { useEffect, useRef } from "react";
import { HERO_COLORS } from "./constants";
import type { SectionTheme } from "./section-constants";
import { clamp, lerp } from "./utils/easing";
import { project, rotateX, rotateY, rgba, type Point3 } from "./utils/canvas3d";
import {
  readHeroCanvasBg,
  readThemeCanvasPalette,
  rgbaRgb,
  type ThemeCanvasPalette,
} from "./utils/themeCanvasColors";

export interface Section3DCoreProps {
  variant: SectionTheme;
  scrollProgress?: number;
  reducedMotion?: boolean;
  className?: string;
}


function drawBloom(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  cx: number,
  cy: number,
  glow: number,
  radius: number,
  palette: ThemeCanvasPalette
) {
  const bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  bloom.addColorStop(0, rgbaRgb(palette.light, 0.2 * glow));
  bloom.addColorStop(0.4, rgbaRgb(palette.primary, 0.12 * glow));
  bloom.addColorStop(1, "transparent");
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, w, h);
}

function drawWirePolyhedron(
  ctx: CanvasRenderingContext2D,
  vertices: Point3[],
  edges: Array<[number, number]>,
  cx: number,
  cy: number,
  scale: number,
  rotY: number,
  rotX: number,
  alpha: number,
  palette: ThemeCanvasPalette
) {
  const projected = vertices.map((v) => {
    let p = rotateY(v, rotY);
    p = rotateX(p, rotX);
    return project(p, cx, cy, 420, scale);
  });

  for (const [a, b] of edges) {
    const pa = projected[a];
    const pb = projected[b];
    const depth = (pa.z + pb.z) / 2;
    const depthNorm = clamp((depth + 80) / 160, 0, 1);
    ctx.beginPath();
    ctx.moveTo(pa.x, pa.y);
    ctx.lineTo(pb.x, pb.y);
    ctx.strokeStyle = rgbaRgb(palette.primary, alpha * (0.35 + depthNorm * 0.45));
    ctx.lineWidth = 0.8 + depthNorm * 0.8;
    ctx.stroke();
  }

  for (const p of projected) {
    const depthNorm = clamp((p.z + 80) / 160, 0, 1);
    const r = (2 + depthNorm * 3) * p.s;
    ctx.fillStyle = rgba(250, 245, 255, 0.35 + depthNorm * 0.45);
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Live 3D canvas models — one distinct rig per landing chapter. */
export function Section3DCore({
  variant,
  scrollProgress = 0,
  reducedMotion = false,
  className = "",
}: Section3DCoreProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef(scrollProgress);
  const motionRef = useRef(reducedMotion);
  const variantRef = useRef(variant);
  const timeRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  scrollRef.current = scrollProgress;
  motionRef.current = reducedMotion;
  variantRef.current = variant;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

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

    let lastNow = performance.now();

    const render = (now: number) => {
      const dt = Math.min(now - lastNow, 32);
      lastNow = now;
      if (!motionRef.current) timeRef.current += dt;

      const palette = readThemeCanvasPalette();
      const t = timeRef.current * 0.001;
      const scroll = scrollRef.current;
      const glow = 0.5 + scroll * 0.5;
      const v = variantRef.current;

      ctx.fillStyle = readHeroCanvasBg(HERO_COLORS.background);
      ctx.fillRect(0, 0, w, h);

      const cx = w * 0.5;
      const cy = h * 0.46;
      const scale = Math.min(w, h) / 520 * lerp(0.88, 1.05, scroll);

      drawBloom(ctx, w, h, cx, cy, glow, Math.min(w, h) * 0.42, palette);

      const autoSpin = motionRef.current ? 0.25 : t * 0.45;
      const rotY = autoSpin + scroll * 1.1;
      const rotX = 0.22 + scroll * 0.18 + Math.sin(t * 0.35) * 0.05;

      switch (v) {
        case "mission": {
          const nodes: Point3[] = [];
          for (let i = 0; i < 24; i++) {
            const phi = Math.acos(1 - (2 * (i + 0.5)) / 24);
            const theta = Math.PI * (1 + Math.sqrt(5)) * i;
            nodes.push({
              x: Math.sin(phi) * Math.cos(theta) * 72,
              y: Math.sin(phi) * Math.sin(theta) * 72,
              z: Math.cos(phi) * 72,
            });
          }
          const edges: Array<[number, number]> = [];
          for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
              const dx = nodes[i].x - nodes[j].x;
              const dy = nodes[i].y - nodes[j].y;
              const dz = nodes[i].z - nodes[j].z;
              if (Math.sqrt(dx * dx + dy * dy + dz * dz) < 68) edges.push([i, j]);
            }
          }
          drawWirePolyhedron(ctx, nodes, edges, cx, cy, scale * 1.05, rotY, rotX, glow, palette);
          const coreR = lerp(14, 26, scroll) * scale;
          const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
          core.addColorStop(0, rgba(255, 255, 255, 0.75 * glow));
          core.addColorStop(0.4, rgbaRgb(palette.primary, 0.5 * glow));
          core.addColorStop(1, "transparent");
          ctx.fillStyle = core;
          ctx.beginPath();
          ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case "distinction": {
          const offsets: Array<[number, number, number]> = [
            [-55, -40, 0],
            [55, -35, 10],
            [-48, 42, -8],
            [50, 38, 12],
          ];
          for (let i = 0; i < offsets.length; i++) {
            const [ox, oy, oz] = offsets[i];
            const shard: Point3[] = [
              { x: ox, y: oy - 28, z: oz },
              { x: ox + 24, y: oy + 14, z: oz + 8 },
              { x: ox - 24, y: oy + 14, z: oz - 8 },
            ];
            const spin = rotY + i * 0.8;
            const projected = shard.map((p) => {
              let pt = rotateY(p, spin);
              pt = rotateX(pt, rotX);
              return project(pt, cx, cy, 420, scale);
            });
            ctx.beginPath();
            ctx.moveTo(projected[0].x, projected[0].y);
            ctx.lineTo(projected[1].x, projected[1].y);
            ctx.lineTo(projected[2].x, projected[2].y);
            ctx.closePath();
            ctx.fillStyle = rgbaRgb(palette.light, 0.12 + glow * 0.1);
            ctx.fill();
            ctx.strokeStyle = rgbaRgb(palette.primary, 0.45 + glow * 0.25);
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
          break;
        }
        case "platform": {
          for (let layer = 0; layer < 3; layer++) {
            const layerT = layer / 2;
            const yOff = lerp(36, -36, layerT) + Math.sin(t * 0.5 + layer) * 4;
            const layerScale = scale * lerp(0.75, 1.05, layerT);
            const verts: Point3[] = [
              { x: -90, y: yOff, z: -20 + layer * 18 },
              { x: 90, y: yOff, z: -20 + layer * 18 },
              { x: 90, y: yOff + 8, z: 20 + layer * 18 },
              { x: -90, y: yOff + 8, z: 20 + layer * 18 },
            ];
            const edges: Array<[number, number]> = [
              [0, 1], [1, 2], [2, 3], [3, 0], [0, 2],
            ];
            drawWirePolyhedron(ctx, verts, edges, cx, cy, layerScale, rotY * 0.6, rotX * 0.8, glow * 0.85, palette);
          }
          break;
        }
        case "workflow": {
          const ringR = 78 * scale;
          ctx.beginPath();
          for (let i = 0; i <= 64; i++) {
            const ang = (i / 64) * Math.PI * 2 + rotY * 0.4;
            const p = project(
              rotateX(rotateY({ x: Math.cos(ang) * 78, y: Math.sin(ang) * 28, z: 0 }, rotY), rotX),
              cx, cy, 420, scale
            );
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          }
          ctx.strokeStyle = rgbaRgb(palette.primary, 0.35 + glow * 0.2);
          ctx.lineWidth = 1.5;
          ctx.stroke();

          for (let step = 0; step < 4; step++) {
            const stepProgress = clamp((scroll * 4 - step) * 1.2, 0, 1);
            const ang = (step / 4) * Math.PI * 2 - Math.PI / 2 + rotY * 0.3;
            const p = project(
              rotateX(rotateY({ x: Math.cos(ang) * 78, y: Math.sin(ang) * 28, z: step * 8 }, rotY), rotX),
              cx, cy, 420, scale
            );
            const r = (8 + stepProgress * 6) * p.s;
            const ng = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2.5);
            ng.addColorStop(0, rgbaRgb(palette.primary, 0.4 + stepProgress * 0.45));
            ng.addColorStop(1, "transparent");
            ctx.fillStyle = ng;
            ctx.beginPath();
            ctx.arc(p.x, p.y, r * 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = rgba(255, 255, 255, 0.5 + stepProgress * 0.4);
            ctx.beginPath();
            ctx.arc(p.x, p.y, r * 0.5, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        }
        case "testimonials": {
          for (let i = 0; i < 3; i++) {
            const ang = (i / 3) * Math.PI * 2 + rotY * 0.5;
            const orbit = 62 + i * 8;
            const card: Point3[] = [
              { x: Math.cos(ang) * orbit - 28, y: Math.sin(ang) * 22 - 18, z: Math.sin(ang) * 20 },
              { x: Math.cos(ang) * orbit + 28, y: Math.sin(ang) * 22 - 18, z: Math.sin(ang) * 20 },
              { x: Math.cos(ang) * orbit + 28, y: Math.sin(ang) * 22 + 18, z: Math.sin(ang) * 20 + 10 },
              { x: Math.cos(ang) * orbit - 28, y: Math.sin(ang) * 22 + 18, z: Math.sin(ang) * 20 + 10 },
            ];
            const edges: Array<[number, number]> = [[0, 1], [1, 2], [2, 3], [3, 0]];
            drawWirePolyhedron(ctx, card, edges, cx, cy, scale, rotY, rotX, glow * 0.7, palette);
          }
          break;
        }
        case "cta": {
          for (let ring = 0; ring < 3; ring++) {
            const r = lerp(42, 88, ring / 2) * scale;
            ctx.beginPath();
            for (let i = 0; i <= 48; i++) {
              const ang = (i / 48) * Math.PI * 2 + rotY * (0.4 + ring * 0.15);
              const p = project(
                rotateX(rotateY({ x: Math.cos(ang) * r / scale, y: Math.sin(ang) * (r / scale) * 0.35, z: ring * 12 - 12 }, rotY), rotX),
                cx, cy, 420, scale
              );
              if (i === 0) ctx.moveTo(p.x, p.y);
              else ctx.lineTo(p.x, p.y);
            }
            ctx.strokeStyle = rgbaRgb(palette.primary, 0.25 + glow * 0.15 - ring * 0.05);
            ctx.lineWidth = 1.2 + ring * 0.3;
            ctx.stroke();
          }
          const portalR = lerp(20, 38, scroll) * scale;
          const portal = ctx.createRadialGradient(cx, cy, 0, cx, cy, portalR);
          portal.addColorStop(0, rgba(255, 255, 255, 0.9 * glow));
          portal.addColorStop(0.3, rgbaRgb(palette.primary, 0.55 * glow));
          portal.addColorStop(1, "transparent");
          ctx.fillStyle = portal;
          ctx.beginPath();
          ctx.arc(cx, cy, portalR, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case "faq": {
          const icoVerts: Point3[] = [];
          const phi = (1 + Math.sqrt(5)) / 2;
          const raw: Array<[number, number, number]> = [
            [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
            [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
            [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1],
          ];
          for (const [x, y, z] of raw) {
            const len = Math.sqrt(x * x + y * y + z * z);
            const expand = 1 + scroll * 0.35;
            icoVerts.push({ x: (x / len) * 68 * expand, y: (y / len) * 68 * expand, z: (z / len) * 68 * expand });
          }
          const icoEdges: Array<[number, number]> = [
            [0, 11], [0, 5], [0, 1], [0, 7], [0, 10], [1, 5], [5, 11], [11, 10], [10, 7], [7, 1],
            [3, 9], [3, 4], [3, 2], [3, 6], [3, 8], [4, 9], [9, 8], [8, 6], [6, 2], [2, 4],
          ];
          drawWirePolyhedron(ctx, icoVerts, icoEdges, cx, cy, scale, rotY, rotX, glow, palette);
          break;
        }
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => {
      ro.disconnect();
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className={`section-3d-core ${className}`.trim()} aria-hidden>
      <canvas ref={canvasRef} className="section-3d-core-canvas" />
      <div className="section-3d-core-vignette" />
    </div>
  );
}
