export interface Point3 {
  x: number;
  y: number;
  z: number;
}

export function rotateY(p: Point3, a: number): Point3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: p.x * c + p.z * s, y: p.y, z: -p.x * s + p.z * c };
}

export function rotateX(p: Point3, a: number): Point3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: p.x, y: p.y * c - p.z * s, z: p.y * s + p.z * c };
}

export function project(
  p: Point3,
  cx: number,
  cy: number,
  focal: number,
  scale: number
): { x: number; y: number; z: number; s: number } {
  const f = focal / (focal + p.z);
  return { x: cx + p.x * f * scale, y: cy + p.y * f * scale, z: p.z, s: f };
}

export function rgba(r: number, g: number, b: number, a: number) {
  return `rgba(${r},${g},${b},${a})`;
}
