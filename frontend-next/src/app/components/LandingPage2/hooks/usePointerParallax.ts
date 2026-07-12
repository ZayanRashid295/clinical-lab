"use client";

import { useEffect, useState, type RefObject } from "react";

export interface PointerParallax {
  rotateX: number;
  rotateY: number;
  pointerX: number;
  pointerY: number;
}

export function usePointerParallax(
  ref: RefObject<HTMLElement | null>,
  maxDeg = 5,
  enabled = true,
): PointerParallax {
  const [tilt, setTilt] = useState<PointerParallax>({
    rotateX: 0,
    rotateY: 0,
    pointerX: 50,
    pointerY: 50,
  });

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const nx = (x - 0.5) * 2;
      const ny = (y - 0.5) * 2;
      setTilt({
        rotateX: -ny * maxDeg,
        rotateY: nx * maxDeg,
        pointerX: x * 100,
        pointerY: y * 100,
      });
    };

    const onLeave = () => {
      setTilt({ rotateX: 0, rotateY: 0, pointerX: 50, pointerY: 50 });
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled, maxDeg, ref]);

  return tilt;
}
