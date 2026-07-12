"use client";

import { useState } from "react";
import { DemoModal } from "./landing-v2-program-ui";
import { PROGRAMS, type ExamTrack } from "./landing-v2-data";
import { LandingV2Chrome, type LandingV2ChromeActions } from "./landing-v2-chrome";
import { ProgramCinematicBody } from "./ProgramCinematicBody";
import {
  CinematicHero,
  CinematicHeroContent,
  Monitor3DScene,
} from "../hero-sequence";
import { PROGRAM_HERO_SCREEN } from "./monitor-mockup";

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

  const beginLabel = track === "fcps" ? "Begin FCPS-1 Preparation" : "Begin JCAT (MDMS) Preparation";
  const pageTitle =
    track === "fcps" ? (
      <>
        FCPS-1
        <br />
        preparation
      </>
    ) : (
      <>
        JCAT (MDMS)
        <br />
        preparation
      </>
    );
  const otherTrack = track === "fcps" ? "JCAT (MDMS)" : "FCPS-1";

  return (
    <LandingV2Chrome
      activePage={track}
      actions={actions}
      cinematicNav
      footerBlurb="Postgraduate medical examination preparation for FCPS-1 and JCAT (MDMS). Every option explained. Built for clinical excellence."
      footerBottomNote="Trusted for FCPS-1 & JCAT Preparation · Pakistan"
    >
      <div className="lp-program">
      {demoOpen && (
        <DemoModal
          badge={p.badge}
          onClose={() => setDemoOpen(false)}
          onSubmit={actions.onBeginPrep}
        />
      )}

      <CinematicHero
        layout="program"
        sectionId={track === "fcps" ? "fcps" : "jcat"}
        ariaLabel={`${p.badge} exam preparation`}
      >
        <CinematicHeroContent
          kicker={`${p.badge} · Medicine & Allied`}
          title={pageTitle}
          subtitle={p.heroSubtitle}
          blendedVisual={
            <Monitor3DScene
              straight
              zoomable
              screenSrc={PROGRAM_HERO_SCREEN}
              alt={`${p.badge} question bank on desktop monitor`}
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
          onExploreOther={() => actions.onNavigateToProgram(track === "fcps" ? "jcat" : "fcps")}
          otherTrackLabel={otherTrack}
        />
      </div>
    </div>
    </LandingV2Chrome>
  );
}
