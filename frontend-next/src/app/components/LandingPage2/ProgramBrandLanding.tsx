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
import { PROGRAM_HERO_SCREEN } from "./monitor-mockup";
import { demoPackForTrack } from "./landing-demo-lead";

export interface ProgramBrandActions extends LandingV2ChromeActions {
  onBeginPrep: () => void;
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
  const pageTitle = (
    <>
      Medicine and Allied
      <br />
      preparation
    </>
  );
  const otherTrackLabel =
    track === "fcps" ? "Medicine and Allied under MDMS/JCAT" : "Medicine and Allied under FCPS-1";

  return (
    <LandingV2Chrome
      activePage={track}
      actions={actions}
      cinematicNav
      footerBlurb="Postgraduate medical examination preparation for FCPS-1 and MDMS/JCAT. Every option explained. Built for clinical excellence."
      footerBottomNote="Trusted for FCPS-1 & JCAT Preparation · Pakistan"
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
            kicker={track === "fcps" ? "FCPS-1 product" : "MDMS/JCAT product"}
            title={pageTitle}
            subtitle={copy.heroSubtitle}
            blendedVisual={
              <Monitor3DScene
                straight
                zoomable
                screenSrc={PROGRAM_HERO_SCREEN}
                alt="Medicine and Allied question bank on desktop monitor"
              />
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
