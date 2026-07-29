"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/shared/ui/dialog";
import { LandingLightboxClose } from "./landing-v2-lightbox-close";

export const PROGRAM_HERO_SCREEN = "/images/landing-v2/computer-screen.jpeg";
export const CLIPBOARD_SCREEN = "/images/landing-v2/clipboard-screen.jpeg";

function ZoomIcon() {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3M11 8v6M8 11h6" />
    </svg>
  );
}

function MonitorFrame({
  screenSrc,
  alt,
  className = "",
}: {
  screenSrc: string;
  alt: string;
  className?: string;
}) {
  return (
    <div className={`monitor-mockup ${className}`.trim()}>
      <div className="monitor-mockup__shell">
        <div className="monitor-mockup__bezel">
          <div className="monitor-mockup__screen">
            <img src={screenSrc} alt={alt} />
          </div>
        </div>
        <div className="monitor-mockup__chin">
          <span className="monitor-mockup__camera" />
        </div>
      </div>
      <div className="monitor-mockup__stand">
        <div className="monitor-mockup__neck" />
        <div className="monitor-mockup__foot" />
      </div>
      <div className="monitor-mockup__shadow" />
    </div>
  );
}

export function MonitorMockup({
  screenSrc = PROGRAM_HERO_SCREEN,
  alt = "Question bank interface on desktop monitor",
  zoomable = true,
}: {
  screenSrc?: string;
  alt?: string;
  zoomable?: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (!zoomable) {
    return <MonitorFrame screenSrc={screenSrc} alt={alt} />;
  }

  return (
    <>
      <button
        type="button"
        className="monitor-mockup-trigger"
        onClick={() => setOpen(true)}
        aria-label={`Enlarge preview: ${alt}`}
      >
        <MonitorFrame screenSrc={screenSrc} alt={alt} />
        <span className="monitor-mockup-zoom-hint">
          <ZoomIcon />
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="monitor-mockup-dialog border-0 bg-transparent p-3 shadow-none"
          showCloseButton={false}
        >
          <LandingLightboxClose onClick={() => setOpen(false)} />
          <MonitorFrame screenSrc={screenSrc} alt={alt} className="monitor-mockup--lightbox" />
        </DialogContent>
      </Dialog>
    </>
  );
}
