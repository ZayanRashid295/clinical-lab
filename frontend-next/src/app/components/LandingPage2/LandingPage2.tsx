"use client";

import { MedPrepAILanding } from "./MedPrepAILanding";
import { ProgramBrandLanding } from "./ProgramBrandLanding";
import type { ExamTrack } from "./landing-v2-data";
import { useLandingV2Actions } from "./use-landing-v2-actions";
import { MarketingThemeShell } from "../marketing/marketing-theme";

export function LandingPage2() {
  const { homeActions } = useLandingV2Actions();

  return (
    <MarketingThemeShell className="medprep-landing-v2">
      <MedPrepAILanding actions={homeActions} />
    </MarketingThemeShell>
  );
}

export function LandingPage2Program({ track }: { track: ExamTrack }) {
  const { programActions } = useLandingV2Actions();

  return (
    <MarketingThemeShell className="medprep-landing-v2">
      <ProgramBrandLanding track={track} actions={programActions()} />
    </MarketingThemeShell>
  );
}

export default LandingPage2;
