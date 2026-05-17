"use client"

import { MedPrepSlugGate } from "./MedPrepSlugGate"
import { ModeCasesPage } from "./shared/ModeCasesPage"

export function ShadowCasesPage() {
  return (
    <MedPrepSlugGate slug="shadow-mode" modeLabel="Shadow Mode">
      <ModeCasesPage
        config={{
          modeTitle: "Shadow Mode",
          chooseCaseSubtitle: "Shadow Mode Learning",
          landingIntro:
            "Practice medical interviews with AI-powered patients. Choose how you'd like to begin your learning journey.",
          generateCardTitle: "Generate Custom Case",
          browseCardTitle: "Select Existing Case",
          generateCtaLabel: "Generate Case",
          browseCtaLabel: "Browse Cases",
          generateDescription:
            "Create a personalized medical case tailored to your learning needs and specialty focus.",
          browseDescription:
            "Choose from our curated collection of medical cases across different specialties and difficulty levels.",
          casePurpose: "shadow",
          casePurposeLabel: "Shadow Mode",
          backToModeLabel: "Back to Shadow Mode",
          backToModeRoute: "/medprep-ai/shadow-mode",
          routeForGeneratedCase: (caseId) =>
            `/medprep-ai/shadow-play?caseId=${encodeURIComponent(caseId)}&generated=true`,
          routeForSelectedCase: (caseId) =>
            `/medprep-ai/shadow-play?caseId=${encodeURIComponent(caseId)}`,
          routeForChatbotGeneratedCase: (caseId) =>
            `/medprep-ai/shadow-play?caseId=${encodeURIComponent(caseId)}&generated=true`,
          accent: {
            pageGradient: "bg-gradient-to-br from-slate-50 via-zinc-50 to-slate-100",
            overlayGradient: "bg-gradient-to-r from-slate-400/15 to-zinc-500/15",
            iconGradient: "bg-gradient-to-r from-slate-600 to-zinc-700",
            subtitleText: "text-slate-600",
            genOverlay: "bg-gradient-to-br from-slate-500/10 to-zinc-600/10",
            browseOverlay: "bg-gradient-to-br from-slate-500/10 to-zinc-500/10",
            genIcon: "bg-gradient-to-r from-slate-600 to-zinc-700",
            browseIcon: "bg-gradient-to-r from-slate-600 to-zinc-700",
            feature1Bg: "bg-slate-100",
            feature1Text: "text-slate-600",
            feature2Bg: "bg-zinc-100",
            feature2Text: "text-zinc-600",
            feature3Bg: "bg-slate-50",
            feature3Text: "text-slate-600",
            feature4Bg: "bg-slate-100",
            feature4Text: "text-slate-600",
            ctaGenerate: "bg-gradient-to-r from-slate-700 to-zinc-800",
            ctaGenerateHover: "hover:from-slate-800 hover:to-zinc-900",
            ctaBrowse: "bg-gradient-to-r from-slate-700 to-zinc-800",
            ctaBrowseHover: "hover:from-slate-800 hover:to-zinc-900",
            modeBadgeBg: "bg-slate-50",
            modeBadgeText: "text-slate-700",
            modeBadgeBorder: "border-slate-200",
            hoverTitleText: "group-hover:text-slate-600",
          },
        }}
      />
    </MedPrepSlugGate>
  )
}
