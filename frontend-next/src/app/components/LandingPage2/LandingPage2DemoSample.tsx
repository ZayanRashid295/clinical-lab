"use client";

import { LandingDemoPreviewSample } from "./LandingDemoPreviewSample";
import { LandingV2Chrome } from "./landing-v2-chrome";
import { useLandingV2Actions } from "./use-landing-v2-actions";
import { MarketingThemeShell } from "../marketing/marketing-theme";
import { demoPackForTrack } from "./landing-demo-lead";
import type { ExamTrack } from "./landing-v2-data";

function SampleInner({ track }: { track: ExamTrack }) {
  const { programActions } = useLandingV2Actions();
  const actions = programActions();

  return (
    <LandingV2Chrome
      activePage={track}
      actions={actions}
      cinematicNav
      hideFooter
      footerBlurb="Postgraduate medical examination preparation for FCPS-1 and MDMS/ JCAT."
      footerBottomNote="Trusted for FCPS-1 & MDMS/ JCAT Preparation · Pakistan"
    >
      <LandingDemoPreviewSample
        pack={demoPackForTrack(track)}
        track={track}
        onBeginPrep={actions.onBeginPrep}
      />
    </LandingV2Chrome>
  );
}

export function LandingPage2DemoSample({ track = "fcps" }: { track?: ExamTrack }) {
  return (
    <MarketingThemeShell className="medprep-landing-v2">
      <SampleInner track={track} />
    </MarketingThemeShell>
  );
}
