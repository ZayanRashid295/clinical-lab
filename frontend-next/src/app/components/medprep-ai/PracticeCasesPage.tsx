"use client"

import { ModeCasesPage } from "./shared/ModeCasesPage"

export function PracticeCasesPage() {
  return (
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
          pageGradient: "bg-gradient-to-br from-red-50 via-orange-50 to-pink-100",
          overlayGradient: "bg-gradient-to-r from-red-400/20 to-orange-400/20",
          iconGradient: "bg-gradient-to-r from-red-500 to-orange-600",
          subtitleText: "text-red-600",
          genOverlay: "bg-gradient-to-br from-red-500/10 to-orange-500/10",
          browseOverlay: "bg-gradient-to-br from-orange-500/10 to-pink-500/10",
          genIcon: "bg-gradient-to-r from-red-500 to-orange-600",
          browseIcon: "bg-gradient-to-r from-orange-500 to-pink-600",
          feature1Bg: "bg-red-100",
          feature1Text: "text-red-600",
          feature2Bg: "bg-orange-100",
          feature2Text: "text-orange-600",
          feature3Bg: "bg-pink-100",
          feature3Text: "text-pink-600",
          feature4Bg: "bg-purple-100",
          feature4Text: "text-purple-600",
          ctaGenerate: "bg-gradient-to-r from-red-500 to-orange-600",
          ctaGenerateHover: "hover:from-red-600 hover:to-orange-700",
          ctaBrowse: "bg-gradient-to-r from-orange-500 to-pink-600",
          ctaBrowseHover: "hover:from-orange-600 hover:to-pink-700",
          modeBadgeBg: "bg-red-50",
          modeBadgeText: "text-red-700",
          modeBadgeBorder: "border-red-200",
          hoverTitleText: "group-hover:text-red-600",
        },
      }}
    />
  )
}
