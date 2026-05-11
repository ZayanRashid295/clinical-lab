"use client"

import { MedPrepSlugGate } from "./MedPrepSlugGate"
import { ModeLandingPage } from "./shared/ModeLandingPage"

export function LearningModePage() {
  return (
    <MedPrepSlugGate slug="qa" modeLabel="Learning Mode">
      <ModeLandingPage
        config={{
          title: "Learning Mode",
          subtitle: "Master Clinical Skills Through Guided Practice",
          description:
            "Guided learning sessions with AI support and educational feedback. Work through cases with real-time guidance, ask questions to AI doctors, and receive detailed explanations to enhance your clinical reasoning skills.",
          highlight1Title: "Guided Learning",
          highlight1Subtitle: "AI-supported education",
          highlight2Title: "Interactive Cases",
          highlight2Subtitle: "Real-time feedback",
          highlight3Title: "Educational Support",
          highlight3Subtitle: "Detailed explanations",
          startLabel: "Start Learning",
          startingLabel: "Starting Learning...",
          startRoute: "/medprep-ai/learn-cases",
          directStartSuccessRoute: (caseId, specialty) =>
            `/medprep-ai/learn/${caseId}?specialty=${specialty}&generated=true`,
          directStartFallbackRoute: (caseId, specialty) =>
            `/medprep-ai/learn/${caseId}?specialty=${specialty}`,
          accent: {
            pageGradient: "bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100",
            overlayGradient: "bg-gradient-to-r from-green-400/20 to-teal-400/20",
            iconGradient: "bg-gradient-to-r from-green-500 to-teal-600",
            subtitleText: "text-green-600",
            h1Bg: "bg-green-100",
            h2Bg: "bg-teal-100",
            h3Bg: "bg-emerald-100",
            h1Text: "text-green-600",
            h2Text: "text-teal-600",
            h3Text: "text-emerald-600",
            buttonGradient: "bg-gradient-to-r from-green-500 to-teal-600",
            buttonHoverGradient: "hover:from-green-600 hover:to-teal-700",
          },
        }}
      />
    </MedPrepSlugGate>
  )
}
