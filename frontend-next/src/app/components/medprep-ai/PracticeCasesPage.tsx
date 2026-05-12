"use client"

import { MedPrepSlugGate } from "./MedPrepSlugGate"
import { ModeCasesPage } from "./shared/ModeCasesPage"

export function PracticeCasesPage() {
  return (
    <MedPrepSlugGate slug="let-me-drive" modeLabel="Practice Mode">
      <ModeCasesPage
        config={{
          modeTitle: "Practice Mode",
          chooseCaseSubtitle: "Choose Your Practice Case",
          generateDescription:
            "Generate a custom case for independent practice. Develop your clinical reasoning without guidance or supervision.",
          browseDescription:
            "Browse existing cases for self-paced practice. Work through cases independently to build your clinical skills.",
          casePurpose: "practice",
          backToModeLabel: "Back to Practice Mode",
          backToModeRoute: "/medprep-ai/let-me-drive",
          routeForGeneratedCase: (caseId) => `/medprep-ai/practice-nurse-report?caseId=${caseId}&generated=true`,
          routeForSelectedCase: (caseId) => `/medprep-ai/practice-nurse-report?caseId=${caseId}`,
          routeForChatbotGeneratedCase: (caseId) => `/medprep-ai/practice-nurse-report?caseId=${caseId}&generated=true`,
          accent: {
            pageGradient: "bg-gradient-to-br from-primary-50 via-primary-100/80 to-primary-100",
            overlayGradient: "bg-gradient-to-r from-primary-400/20 to-primary-600/15",
            iconGradient: "bg-gradient-to-r from-primary-500 to-primary-700",
            subtitleText: "text-primary-600",
            genOverlay: "bg-gradient-to-br from-primary-500/10 to-primary-600/10",
            browseOverlay: "bg-gradient-to-br from-primary-500/10 to-primary-400/10",
            genIcon: "bg-gradient-to-r from-primary-500 to-primary-700",
            browseIcon: "bg-gradient-to-r from-primary-500 to-primary-700",
            feature1Bg: "bg-primary-100",
            feature1Text: "text-primary-600",
            feature2Bg: "bg-primary-100",
            feature2Text: "text-primary-600",
            feature3Bg: "bg-primary-50",
            feature3Text: "text-primary-600",
            feature4Bg: "bg-primary-100",
            feature4Text: "text-primary-600",
            ctaGenerate: "bg-gradient-to-r from-primary-500 to-primary-700",
            ctaGenerateHover: "hover:from-primary-600 hover:to-primary-800",
            ctaBrowse: "bg-gradient-to-r from-primary-500 to-primary-700",
            ctaBrowseHover: "hover:from-primary-600 hover:to-primary-800",
            modeBadgeBg: "bg-primary-50",
            modeBadgeText: "text-primary-700",
            modeBadgeBorder: "border-primary-200",
            hoverTitleText: "group-hover:text-primary-600",
          },
        }}
      />
    </MedPrepSlugGate>
  )
}
