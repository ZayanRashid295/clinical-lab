"use client";

import { useRef, useState, type CSSProperties } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  type Transition,
} from "framer-motion";
import { LandingImageLightbox } from "./landing-v2-image-lightbox";
import { ProgramIcon } from "./landing-v2-program-ui";
import { usePointerParallax } from "./hooks/usePointerParallax";

const SPRING: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 32,
  mass: 0.88,
};

function CinematicResourceCard({
  item,
  index,
  isHovered,
  onHover,
  onLeave,
}: {
  item: { title: string; desc: string; img: string; alt: string };
  index: number;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const parallax = usePointerParallax(cardRef, 4, isHovered && !reducedMotion);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const lift = isHovered && !reducedMotion;
  const imgParallaxX = lift ? (parallax.pointerX - 50) * 0.12 : 0;
  const imgParallaxY = lift ? (parallax.pointerY - 50) * 0.1 : 0;

  return (
    <>
      <motion.div
        ref={cardRef}
        className={`cine-resource-card${isHovered ? " cine-resource-card--hovered" : ""}`}
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
        initial={reducedMotion ? false : { opacity: 0, y: 28, scale: 0.96 }}
        whileInView={reducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{
          ...SPRING,
          delay: index * 0.1,
        }}
        animate={
          lift
            ? {
                y: -12,
                scale: 1.025,
                rotateX: parallax.rotateX * 0.55,
                rotateY: parallax.rotateY * 0.55,
              }
            : { y: 0, scale: 1, rotateX: 0, rotateY: 0 }
        }
        style={
          {
            transformStyle: "preserve-3d",
            "--cine-pointer-x": `${parallax.pointerX}%`,
            "--cine-pointer-y": `${parallax.pointerY}%`,
          } as CSSProperties
        }
      >
        <div className="cine-resource-card__glow" aria-hidden />
        <motion.div
          className="cine-resource-card__panel"
          animate={
            lift
              ? {
                  boxShadow:
                    "0 1px 0 color-mix(in srgb, #ffffff 14%, transparent) inset, 0 36px 72px -24px rgba(0,0,0,0.42), 0 16px 32px -12px color-mix(in srgb, var(--mkt-accent) 22%, transparent)",
                }
              : {
                  boxShadow:
                    "0 1px 0 color-mix(in srgb, #ffffff 12%, transparent) inset, 0 18px 40px -20px rgba(0,0,0,0.35)",
                }
          }
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="cine-resource-card__spotlight" aria-hidden />
          <div className="cine-resource-card__media">
            <motion.div
              className="cine-resource-card__media-inner"
              animate={
                lift
                  ? {
                      x: imgParallaxX,
                      y: imgParallaxY,
                      scale: 1.05,
                    }
                  : { x: 0, y: 0, scale: 1 }
              }
              transition={SPRING}
            >
              <img src={item.img} alt={item.alt} draggable={false} />
            </motion.div>
            <span className="cine-resource-card__sheen" aria-hidden />
            <button
              type="button"
              className="cine-resource-card__zoom"
              aria-label={`Enlarge image: ${item.alt}`}
              onClick={(event) => {
                event.stopPropagation();
                setLightboxOpen(true);
              }}
            >
              <ProgramIcon name="zoom" size={15} />
            </button>
          </div>
          <div className="cine-resource-card__body">
            <h3 className="lp-h3">{item.title}</h3>
            <p>{item.desc}</p>
          </div>
        </motion.div>
      </motion.div>

      <LandingImageLightbox
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        images={[{ src: item.img, alt: item.alt }]}
        index={0}
      />
    </>
  );
}

export function CinematicResourceGrid({
  items,
}: {
  items: Array<{ title: string; desc: string; img: string; alt: string }>;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const inView = useInView(gridRef, { once: true, amount: 0.15 });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div
      ref={gridRef}
      className={`cine-resource-grid${hoveredIndex !== null ? " cine-resource-grid--dim" : ""}`}
      data-in-view={inView ? "true" : "false"}
    >
      {items.map((item, index) => (
        <CinematicResourceCard
          key={item.title}
          item={item}
          index={index}
          isHovered={hoveredIndex === index}
          onHover={() => setHoveredIndex(index)}
          onLeave={() => setHoveredIndex(null)}
        />
      ))}
    </div>
  );
}
