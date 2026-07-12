/**
 * Generates placeholder cinematic WebP frames for the scroll hero.
 * Replace output in public/hero-sequence/ with Blender/Cinema4D exports.
 *
 * Usage: node scripts/generate-hero-frames.mjs
 */
import { createCanvas } from "@napi-rs/canvas";
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const FRAME_COUNT = 180;
const DESKTOP = { w: 1920, h: 1080 };
const MOBILE = { w: 960, h: 540 };

const BG = "#050508";
const CYAN = { r: 56, g: 189, b: 248 };
const BLUE = { r: 59, g: 130, b: 246 };
const WHITE = { r: 248, g: 250, b: 252 };

function easeInOutQuint(t) {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function phaseProgress(t, start, end) {
  return Math.max(0, Math.min(1, (t - start) / (end - start)));
}

function rgba(c, a) {
  return `rgba(${c.r},${c.g},${c.b},${a})`;
}

/** Soft bloom halo — always visible, anchors the hero on frame 1. */
function drawBloom(ctx, cx, cy, radius, intensity) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  g.addColorStop(0, rgba(WHITE, 0.18 * intensity));
  g.addColorStop(0.12, rgba(CYAN, 0.42 * intensity));
  g.addColorStop(0.38, rgba(CYAN, 0.22 * intensity));
  g.addColorStop(0.65, rgba(BLUE, 0.08 * intensity));
  g.addColorStop(1, "rgba(5,5,8,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
}

/** Floating glass exam card — MCQ UI abstraction. */
function drawGlassCard(ctx, x, y, w, h, rot, alpha, highlight) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.globalAlpha = alpha;

  const r = 14;
  ctx.beginPath();
  ctx.moveTo(-w / 2 + r, -h / 2);
  ctx.lineTo(w / 2 - r, -h / 2);
  ctx.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  ctx.lineTo(w / 2, h / 2 - r);
  ctx.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  ctx.lineTo(-w / 2 + r, h / 2);
  ctx.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  ctx.lineTo(-w / 2, -h / 2 + r);
  ctx.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  ctx.closePath();

  const fill = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  fill.addColorStop(0, rgba(WHITE, 0.14 + highlight * 0.08));
  fill.addColorStop(0.5, rgba(CYAN, 0.1 + highlight * 0.06));
  fill.addColorStop(1, rgba(BLUE, 0.06));
  ctx.fillStyle = fill;
  ctx.fill();

  ctx.strokeStyle = rgba(CYAN, 0.45 + highlight * 0.25);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Glass shine
  ctx.beginPath();
  ctx.moveTo(-w / 2 + 12, -h / 2 + 8);
  ctx.lineTo(w / 4, -h / 2 + 8);
  ctx.strokeStyle = rgba(WHITE, 0.35 + highlight * 0.2);
  ctx.lineWidth = 2;
  ctx.stroke();

  // Option rows
  const opts = ["A", "B", "C", "D"];
  opts.forEach((label, i) => {
    const oy = -h / 2 + 36 + i * 22;
    const selected = i === 1;
    ctx.beginPath();
    ctx.arc(-w / 2 + 22, oy, selected ? 5 : 4, 0, Math.PI * 2);
    ctx.fillStyle = selected
      ? rgba(CYAN, 0.85)
      : rgba(WHITE, 0.25);
    ctx.fill();
    ctx.fillStyle = rgba(WHITE, selected ? 0.9 : 0.45);
    ctx.font = "600 11px sans-serif";
    ctx.fillText(label, -w / 2 + 34, oy + 4);
    ctx.fillStyle = rgba(WHITE, 0.35);
    ctx.fillRect(-w / 2 + 52, oy - 3, w - 72, 6);
  });

  ctx.restore();
}

/** Premium intelligence orb + orbiting explanation cards. */
function drawHeroVisual(ctx, cx, cy, scale, rotY, rotX, glow, orbit, cardSpread) {
  ctx.save();
  ctx.translate(cx, cy);

  // Floor glow
  ctx.save();
  ctx.globalAlpha = 0.35 + glow * 0.25;
  const floor = ctx.createRadialGradient(0, 95 * scale, 0, 0, 95 * scale, 220 * scale);
  floor.addColorStop(0, rgba(CYAN, 0.35));
  floor.addColorStop(0.5, rgba(BLUE, 0.12));
  floor.addColorStop(1, "rgba(5,5,8,0)");
  ctx.fillStyle = floor;
  ctx.fillRect(-260 * scale, 40 * scale, 520 * scale, 180 * scale);
  ctx.restore();

  ctx.scale(scale, scale);
  ctx.rotate(rotY);

  // Orbital ring
  ctx.save();
  ctx.rotate(rotX * 0.5);
  ctx.globalAlpha = 0.55 + glow * 0.35;
  ctx.beginPath();
  ctx.ellipse(0, 8, 165, 52, 0, 0, Math.PI * 2);
  ctx.strokeStyle = rgba(CYAN, 0.55 + glow * 0.3);
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, 8, 165, 52, 0, 0, Math.PI * 2);
  ctx.strokeStyle = rgba(WHITE, 0.12);
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.restore();

  // Floating cards — orbit angle driven by scroll
  const cards = [
    { dist: 195, angle: -0.55 + orbit * 0.9, w: 118, h: 128, rot: -0.22 },
    { dist: 210, angle: 0.85 - orbit * 0.7, w: 108, h: 118, rot: 0.28 },
    { dist: 175, angle: 2.4 + orbit * 0.5, w: 100, h: 110, rot: -0.08 },
  ];
  cards.forEach((c, i) => {
    const spread = 1 - cardSpread * 0.35 * (i + 1) * 0.15;
    const px = Math.cos(c.angle) * c.dist * spread;
    const py = Math.sin(c.angle) * c.dist * 0.38 * spread - 10;
    drawGlassCard(ctx, px, py, c.w, c.h, c.rot + rotY * 0.15, 0.82 + glow * 0.15, glow);
  });

  // Main glass orb — bright from frame 1
  ctx.save();
  ctx.rotate(rotX);
  const orbR = 108;

  // Outer glow shell
  const shell = ctx.createRadialGradient(0, 0, orbR * 0.5, 0, 0, orbR * 1.35);
  shell.addColorStop(0, rgba(CYAN, 0.05));
  shell.addColorStop(0.6, rgba(CYAN, 0.22 + glow * 0.18));
  shell.addColorStop(1, "rgba(5,5,8,0)");
  ctx.fillStyle = shell;
  ctx.beginPath();
  ctx.arc(0, 0, orbR * 1.35, 0, Math.PI * 2);
  ctx.fill();

  // Glass sphere
  const orb = ctx.createRadialGradient(-38, -48, 8, 0, 0, orbR);
  orb.addColorStop(0, rgba(WHITE, 0.95));
  orb.addColorStop(0.18, rgba(WHITE, 0.75));
  orb.addColorStop(0.42, rgba(CYAN, 0.55 + glow * 0.2));
  orb.addColorStop(0.72, rgba(BLUE, 0.35));
  orb.addColorStop(1, rgba(BLUE, 0.08));
  ctx.fillStyle = orb;
  ctx.beginPath();
  ctx.arc(0, 0, orbR, 0, Math.PI * 2);
  ctx.fill();

  // Rim highlight
  ctx.strokeStyle = rgba(WHITE, 0.55 + glow * 0.25);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, orbR, -Math.PI * 0.85, -Math.PI * 0.15);
  ctx.stroke();

  // Inner core — “understanding” pulse
  const coreR = 36 + glow * 14;
  const core = ctx.createRadialGradient(0, 0, 0, 0, 0, coreR);
  core.addColorStop(0, rgba(WHITE, 0.98));
  core.addColorStop(0.35, rgba(CYAN, 0.85));
  core.addColorStop(0.75, rgba(BLUE, 0.35));
  core.addColorStop(1, "rgba(5,5,8,0)");
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(0, 0, coreR, 0, Math.PI * 2);
  ctx.fill();

  // Neural arcs inside orb
  ctx.globalAlpha = 0.5 + glow * 0.4;
  ctx.strokeStyle = rgba(WHITE, 0.5);
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + orbit;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 28, Math.sin(a) * 28);
    ctx.quadraticCurveTo(
      Math.cos(a + 0.6) * 52,
      Math.sin(a + 0.6) * 52,
      Math.cos(a + 1.1) * 38,
      Math.sin(a + 1.1) * 38
    );
    ctx.stroke();
  }

  ctx.restore();
  ctx.restore();
}

function renderFrame(index, { w, h }) {
  const t = index / (FRAME_COUNT - 1);
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, h);

  const intro = phaseProgress(t, 0, 0.12);
  const reveal = phaseProgress(t, 0.12, 0.32);
  const assemble = phaseProgress(t, 0.32, 0.52);
  const transform = phaseProgress(t, 0.52, 0.72);
  const finale = phaseProgress(t, 0.72, 1);

  const cx = w * 0.7;
  const cy = h * 0.48;

  // Strong ambient from frame 1 — no empty first slide
  const ambient =
    0.28 + intro * 0.06 + reveal * 0.1 + assemble * 0.12 + transform * 0.14 + finale * 0.18;
  drawBloom(ctx, cx, cy, w * 0.42, ambient);

  const camT = easeInOutQuint(t);
  const rotY = lerp(-0.18, 0.32, camT) + assemble * 0.25;
  const rotX = lerp(0.08, -0.06, camT);
  const scale = lerp(0.98, 1.12, reveal * 0.35 + assemble * 0.35 + finale * 0.3);
  const glow = 0.62 + reveal * 0.15 + assemble * 0.12 + transform * 0.12 + finale * 0.18;
  const orbit = camT * Math.PI * 0.55 + assemble * 0.4;
  const cardSpread = easeInOutQuint(assemble + transform * 0.5);

  drawHeroVisual(ctx, cx, cy, scale, rotY, rotX, glow, orbit, cardSpread);

  // Subtle vignette on far edges only
  const vig = ctx.createRadialGradient(cx, cy, w * 0.2, cx, cy, w * 0.72);
  vig.addColorStop(0, "rgba(5,5,8,0)");
  vig.addColorStop(1, "rgba(5,5,8,0.35)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  return canvas.toBuffer("image/png");
}

async function writeFrames(outDir, size) {
  await mkdir(outDir, { recursive: true });
  for (let i = 0; i < FRAME_COUNT; i++) {
    const png = renderFrame(i, size);
    const name = `frame${String(i + 1).padStart(4, "0")}.webp`;
    const webp = await sharp(png).webp({ quality: 86, effort: 4 }).toBuffer();
    await writeFile(join(outDir, name), webp);
    if (i % 30 === 0) console.log(`  ${outDir}: ${i + 1}/${FRAME_COUNT}`);
  }
}

const publicDir = join(process.cwd(), "public", "hero-sequence");
console.log("Generating cinematic hero frames…");
await writeFrames(publicDir, DESKTOP);
await writeFrames(join(publicDir, "mobile"), MOBILE);
console.log("Done. Replace with Blender exports when ready.");
