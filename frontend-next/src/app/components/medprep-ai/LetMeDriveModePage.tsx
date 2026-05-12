"use client"

import { MedPrepSlugGate } from "./MedPrepSlugGate"
import { ModeLandingPage } from "./shared/ModeLandingPage"

export function LetMeDriveModePage() {
  return (
    <MedPrepSlugGate slug="let-me-drive" modeLabel="Practice Mode">
      <ModeLandingPage
        config={{
          title: "Practice Mode",
          subtitle: "Master Clinical Skills Through Independent Practice",
          description:
            "Independent practice sessions to develop your clinical skills. Work through cases at your own pace without guidance, focusing on building diagnostic reasoning and patient communication abilities.",
          highlight1Title: "Independent Learning",
          highlight1Subtitle: "Practice without guidance",
          highlight2Title: "Self-Paced Practice",
          highlight2Subtitle: "Learn at your own speed",
          highlight3Title: "Skill Building",
          highlight3Subtitle: "Develop clinical abilities",
          startLabel: "Start Practice",
          startingLabel: "Starting Practice...",
          startRoute: "/medprep-ai/practice-cases",
          directStartSuccessRoute: (caseId, specialty) =>
            `/medprep-ai/practice-nurse-report?caseId=${caseId}&specialty=${specialty}&generated=true`,
          directStartFallbackRoute: (caseId, specialty) =>
            `/medprep-ai/practice-nurse-report?caseId=${caseId}&specialty=${specialty}`,
          accent: {
            pageGradient: "bg-gradient-to-br from-primary-50 via-primary-100/80 to-primary-100",
            overlayGradient: "bg-gradient-to-r from-primary-400/20 to-primary-600/15",
            iconGradient: "bg-gradient-to-r from-primary-500 to-primary-700",
            subtitleText: "text-primary-600",
            h1Bg: "bg-primary-100",
            h2Bg: "bg-primary-100",
            h3Bg: "bg-primary-50",
            h1Text: "text-primary-600",
            h2Text: "text-primary-600",
            h3Text: "text-primary-600",
            buttonGradient: "bg-gradient-to-r from-primary-500 to-primary-700",
            buttonHoverGradient: "hover:from-primary-600 hover:to-primary-800",
          },
        }}
      />
    </MedPrepSlugGate>
  )
}
