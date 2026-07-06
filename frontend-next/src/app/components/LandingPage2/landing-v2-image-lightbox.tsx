"use client";

import { useEffect } from "react";
import { Dialog, DialogContent } from "@/shared/ui/dialog";
import { LandingLightboxClose } from "./landing-v2-lightbox-close";

export type LightboxImage = { src: string; alt: string };

function LightboxArrow({
  direction,
  onClick,
  label,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      className={`landing-v2-lightbox-arrow landing-v2-lightbox-arrow--${direction}`}
      onClick={onClick}
      aria-label={label}
    >
      <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {direction === "prev" ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
      </svg>
    </button>
  );
}

export function LandingImageLightbox({
  open,
  onOpenChange,
  images,
  index,
  onIndexChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: LightboxImage[];
  index: number;
  onIndexChange?: (index: number) => void;
}) {
  const len = images.length;
  const safeIndex = len > 0 ? ((index % len) + len) % len : 0;
  const current = images[safeIndex];
  const hasNav = len > 1 && onIndexChange;

  const go = (dir: number) => {
    if (!onIndexChange || len <= 1) return;
    onIndexChange((safeIndex + dir + len) % len);
  };

  useEffect(() => {
    if (!open || !onIndexChange || len <= 1) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") onIndexChange((safeIndex - 1 + len) % len);
      if (e.key === "ArrowRight") onIndexChange((safeIndex + 1) % len);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onIndexChange, safeIndex, len]);

  if (!current) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`landing-v2-gallery-dialog border-0 bg-transparent p-0 shadow-none${
          hasNav ? " landing-v2-gallery-dialog--nav" : ""
        }`}
        showCloseButton={false}
      >
        <LandingLightboxClose onClick={() => onOpenChange(false)} />
        <div className={`landing-v2-lightbox-shell${hasNav ? " has-nav" : ""}`}>
          {hasNav && <LightboxArrow direction="prev" onClick={() => go(-1)} label="Previous image" />}
          <div className="landing-v2-lightbox-main">
            <div className="landing-v2-lightbox-scroll">
              <img src={current.src} alt={current.alt} />
            </div>
            {hasNav && (
              <div className="landing-v2-lightbox-counter" aria-live="polite">
                {safeIndex + 1} / {len}
              </div>
            )}
          </div>
          {hasNav && <LightboxArrow direction="next" onClick={() => go(1)} label="Next image" />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
