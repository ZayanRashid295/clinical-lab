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
            pageGradient: "bg-gradient-to-br from-red-50 via-orange-50 to-pink-100",
            overlayGradient: "bg-gradient-to-r from-red-400/20 to-orange-400/20",
            iconGradient: "bg-gradient-to-r from-red-500 to-orange-600",
            subtitleText: "text-red-600",
            h1Bg: "bg-red-100",
            h2Bg: "bg-orange-100",
            h3Bg: "bg-pink-100",
            h1Text: "text-red-600",
            h2Text: "text-orange-600",
            h3Text: "text-pink-600",
            buttonGradient: "bg-gradient-to-r from-red-500 to-orange-600",
            buttonHoverGradient: "hover:from-red-600 hover:to-orange-700",
          },
        }}
      />
    </MedPrepSlugGate>
  )
}
