"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import {
  motion,
  useReducedMotion,
  type Transition,
} from "framer-motion";
import { LandingImageLightbox } from "./landing-v2-image-lightbox";
import { ProgramIcon } from "./landing-v2-program-ui";
import { usePointerParallax } from "./hooks/usePointerParallax";

const SPRING: Transition = {
  type: "spring",
  stiffness: 280,
  damping: 34,
  mass: 0.85,
};

function relPosition(index: number, active: number, len: number): number {
  let offset = index - active;
  if (offset > len / 2) offset -= len;
  if (offset < -len / 2) offset += len;
  return offset;
}

function slidePose(rel: number, reducedMotion: boolean) {
  if (rel === 0) {
    return {
      x: "-50%",
      y: "-50%",
      z: 0,
      scale: 1,
      rotateY: 0,
      opacity: 1,
      filter: "blur(0px)",
    };
  }
  if (rel === -1) {
    return {
      x: "calc(-50% - 52%)",
      y: "-50%",
      z: reducedMotion ? -60 : -150,
      scale: 0.82,
      rotateY: reducedMotion ? 0 : 12,
      opacity: 0.48,
      filter: reducedMotion ? "blur(0px)" : "blur(5px)",
    };
  }
  if (rel === 1) {
    return {
      x: "calc(-50% + 52%)",
      y: "-50%",
      z: reducedMotion ? -60 : -150,
      scale: 0.82,
      rotateY: reducedMotion ? 0 : -12,
      opacity: 0.48,
      filter: reducedMotion ? "blur(0px)" : "blur(5px)",
    };
  }
  return {
    x: "-50%",
    y: "-50%",
    z: -280,
    scale: 0.68,
    rotateY: 0,
    opacity: 0,
    filter: "blur(8px)",
  };
}

export function CinematicQBankCarousel({
  images,
}: {
  images: Array<{ src: string; alt: string }>;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const len = images.length;

  const parallax = usePointerParallax(stageRef, 5, !reducedMotion);

  const go = useCallback(
    (dir: number) => setIndex((i) => (i + dir + len) % len),
    [len],
  );

  const openLightbox = (i: number) => {
    setLightboxIndex(i);
    setIndex(i);
    setLightboxOpen(true);
  };

  useEffect(() => {
    if (reducedMotion || len <= 1) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") go(-1);
      if (event.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, len, reducedMotion]);

  return (
    <div
      className="cine-qbank-showcase"
      ref={stageRef}
      style={
        {
          "--cine-pointer-x": `${parallax.pointerX}%`,
          "--cine-pointer-y": `${parallax.pointerY}%`,
        } as CSSProperties
      }
    >
      <div className="cine-qbank-showcase__ambient" aria-hidden />
      <div className="cine-qbank-showcase__spotlight" aria-hidden />

      <button
        type="button"
        className="cine-qbank-arrow cine-qbank-arrow--left"
        onClick={() => go(-1)}
        aria-label="Previous screenshot"
      >
        <ProgramIcon name="left" />
      </button>

      <div className="cine-qbank-showcase__rig">
        {images.map((img, i) => {
          const rel = relPosition(i, index, len);
          const isActive = rel === 0;
          const pose = slidePose(rel, !!reducedMotion);

          return (
            <motion.div
              key={img.src}
              className={`cine-qbank-slide${isActive ? " cine-qbank-slide--active cine-qbank-slide--interactive" : ""}`}
              initial={false}
              animate={pose}
              transition={SPRING}
              style={{
                zIndex: isActive ? 4 : Math.abs(rel) === 1 ? 2 : 0,
                pointerEvents: Math.abs(rel) <= 1 ? "auto" : "none",
                transformStyle: "preserve-3d",
              }}
              onClick={() => {
                if (isActive) openLightbox(i);
                else setIndex(i);
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                if (isActive) openLightbox(i);
                else setIndex(i);
              }}
              role="button"
              tabIndex={Math.abs(rel) <= 1 ? 0 : -1}
              aria-label={
                isActive ? `Enlarge: ${img.alt}` : `Show screenshot: ${img.alt}`
              }
            >
              <motion.div
                className="cine-qbank-card"
                animate={
                  isActive && !reducedMotion
                    ? { y: [0, -7, 0], rotateX: parallax.rotateX, rotateY: parallax.rotateY }
                    : { y: 0, rotateX: 0, rotateY: 0 }
                }
                transition={
                  isActive && !reducedMotion
                    ? {
                        y: { duration: 5.5, repeat: Infinity, ease: "easeInOut" },
                        rotateX: { type: "spring", stiffness: 220, damping: 28 },
                        rotateY: { type: "spring", stiffness: 220, damping: 28 },
                      }
                    : SPRING
                }
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="cine-qbank-card__shell">
                  <img src={img.src} alt={img.alt} draggable={false} />
                  <span className="cine-qbank-card__sheen" aria-hidden />
                  {isActive ? (
                    <span className="cine-qbank-zoom-hint" aria-hidden>
                      <ProgramIcon name="zoom" size={16} />
                    </span>
                  ) : null}
                </div>
                {isActive ? <div className="cine-qbank-card__floor" aria-hidden /> : null}
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      <button
        type="button"
        className="cine-qbank-arrow cine-qbank-arrow--right"
        onClick={() => go(1)}
        aria-label="Next screenshot"
      >
        <ProgramIcon name="right" />
      </button>

      <div className="cine-qbank-dots">
        {images.map((img, i) => (
          <button
            key={img.src}
            type="button"
            className={`cine-qbank-dot${i === index ? " cine-qbank-dot--active" : ""}`}
            onClick={() => setIndex(i)}
            aria-label={`Go to screenshot ${i + 1}`}
          />
        ))}
      </div>

      <LandingImageLightbox
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        images={images}
        index={lightboxIndex}
        onIndexChange={(i) => {
          setLightboxIndex(i);
          setIndex(i);
        }}
      />
    </div>
  );
}
