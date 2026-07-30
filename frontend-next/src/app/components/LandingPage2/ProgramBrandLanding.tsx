"use client";

import { useState } from "react";
import { DemoModal } from "./landing-v2-program-ui";
import { MEDICINE_PRODUCT_COPY, PROGRAMS, type ExamTrack } from "./landing-v2-data";
import { LandingV2Chrome, type LandingV2ChromeActions } from "./landing-v2-chrome";
import { ProgramCinematicBody } from "./ProgramCinematicBody";
import {
  CinematicHero,
  CinematicHeroContent,
  Monitor3DScene,
} from "../hero-sequence";
import { MonitorMockup, PROGRAM_HERO_SCREEN } from "./monitor-mockup";
import { demoPackForTrack } from "./landing-demo-lead";

export interface ProgramBrandActions extends LandingV2ChromeActions {
  onBeginPrep: () => void;
}

function HeroVisual({ screenSrc, useComputer }: { screenSrc: string; useComputer: boolean }) {
  if (useComputer) {
    return (
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "12px 0 8px",
        }}
      >
        <MonitorMockup screenSrc={screenSrc} alt="Medicine and Allied diagnostic preview" zoomable={false} />
      </div>
    );
  }

  return (
    <div
      className="program-hero-visual program-hero-visual--clipboard"
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 360,
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "12px 0 8px",
      }}
    >
      <div
        className="program-hero-clipboard"
        style={{
          position: "relative",
          width: 288,
          height: 336,
          borderRadius: 30,
          background: "linear-gradient(145deg, #fefefe 0%, #eaf3ff 100%)",
          boxShadow: "0 24px 48px rgba(15, 23, 42, 0.16)",
          border: "1px solid rgba(59, 130, 246, 0.16)",
          transform: "rotate(0deg)",
          padding: "24px 22px 26px",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 116,
            height: 34,
            borderRadius: "0 0 16px 16px",
            background: "linear-gradient(135deg, #dbeafe 0%, #93c5fd 100%)",
            border: "1px solid rgba(37, 99, 235, 0.16)",
            boxShadow: "0 10px 20px rgba(59, 130, 246, 0.16)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: "26px 24px 24px",
            borderRadius: 24,
            background: "linear-gradient(180deg, #fcfdff 0%, #f6f9fe 100%)",
            border: "1px solid rgba(15, 23, 42, 0.08)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.75)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: 12,
              background: "linear-gradient(90deg, rgba(37,99,235,0.16), rgba(15,23,42,0.03))",
              borderBottom: "1px solid rgba(15,23,42,0.06)",
            }}
          />
          <div
            style={{
              padding: 10,
              height: "100%",
              background: "repeating-linear-gradient(180deg, rgba(15,23,42,0.025) 0 1px, transparent 1px 18px)",
            }}
          >
            <img
              src={screenSrc}
              alt="Medicine and Allied diagnostic preview"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: 14,
                display: "block",
                border: "1px solid rgba(15, 23, 42, 0.06)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProgramBrandLanding({
  track,
  actions,
}: {
  track: ExamTrack;
  actions: ProgramBrandActions;
}) {
  const [demoOpen, setDemoOpen] = useState(false);
  const p = PROGRAMS[track];
  const copy = MEDICINE_PRODUCT_COPY[track];

  const beginLabel = "Begin Medicine and Allied Preparation";
  const heroVisualSrc = track === "fcps" ? PROGRAM_HERO_SCREEN : "/images/landing-v2/clipboard-screen.png";
  const pageTitle =
    track === "fcps" ? (
      <>
        Medicine and Allied
      </>
    ) : (
      <>Medicine and Allied</>
    );
  const otherTrackLabel =
    track === "fcps" ? "Medicine and Allied under MDMS/ JCAT" : "Medicine and Allied under FCPS-1";

  return (
    <LandingV2Chrome
      activePage={track}
      actions={actions}
      cinematicNav
      footerBlurb="Postgraduate medical examination preparation for FCPS-1 and MDMS/ JCAT. Every option explained. Built for clinical excellence."
      footerBottomNote="Trusted for FCPS-1 & MDMS/ JCAT Preparation · Pakistan"
    >
      <div className="lp-program">
        {demoOpen && (
          <DemoModal
            badge="Medicine and Allied"
            pack={demoPackForTrack(track)}
            onClose={() => setDemoOpen(false)}
            onUnlocked={(result) => {
              void window.location.assign(result.samplePath);
            }}
          />
        )}

        <CinematicHero
          layout="program"
          sectionId={track === "fcps" ? "fcps" : "jcat"}
          ariaLabel="Medicine and Allied exam preparation"
        >
          <CinematicHeroContent
            composition={track === "jcat" ? "visual-right" : "centered"}
            kicker={track === "fcps" ? "FCPS-1 product" : "MDMS/ JCAT product"}
            title={pageTitle}
            subtitle={copy.heroSubtitle}
            blendedVisual={
              <HeroVisual screenSrc={heroVisualSrc} useComputer={track === "fcps"} />
            }
            primaryCta={{ label: beginLabel, onClick: actions.onBeginPrep }}
            secondaryCta={{
              label: "View sample questions",
              onClick: () => setDemoOpen(true),
            }}
            stats={p.stats.map((s) => ({ num: s.num, label: s.label }))}
          />
        </CinematicHero>

        <div className="landing-content-bridge lp-cinematic-body">
          <ProgramCinematicBody
            track={track}
            onBeginPrep={actions.onBeginPrep}
            onOpenDemo={() => setDemoOpen(true)}
            onExploreOther={() =>
              actions.onNavigateToProgram(track === "fcps" ? "jcat" : "fcps", "medicine-and-allied")
            }
            otherTrackLabel={otherTrackLabel}
          />
        </div>
      </div>
    </LandingV2Chrome>
  );
}
