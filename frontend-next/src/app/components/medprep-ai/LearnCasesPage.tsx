"use client"

import { ModeCasesPage } from "./shared/ModeCasesPage"

export function LearnCasesPage() {
  return (
    <ModeCasesPage
      config={{
        modeTitle: "Learning Mode",
        chooseCaseSubtitle: "Choose Your Learning Case",
        generateDescription:
          "Generate a custom case with AI guidance and educational support. Ask questions to AI doctors and receive detailed explanations.",
        browseDescription:
          "Browse existing cases with AI guidance. Learn from educational SOAP notes, ask questions to AI doctors, and receive real-time feedback.",
        casePurpose: "learning",
        backToModeLabel: "Back to Learning Mode",
        backToModeRoute: "/medprep-ai/learning-mode",
        routeForGeneratedCase: (caseId) => `/medprep-ai/learning-nurse-report?caseId=${caseId}&generated=true`,
        routeForSelectedCase: (caseId) => `/medprep-ai/learning-nurse-report?caseId=${caseId}`,
        routeForChatbotGeneratedCase: (caseId) => `/medprep-ai/learn/${caseId}?generated=true`,
        accent: {
          pageGradient: "bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100",
          overlayGradient: "bg-gradient-to-r from-green-400/20 to-teal-400/20",
          iconGradient: "bg-gradient-to-r from-green-500 to-teal-600",
          subtitleText: "text-green-600",
          genOverlay: "bg-gradient-to-br from-teal-500/10 to-green-500/10",
          browseOverlay: "bg-gradient-to-br from-green-500/10 to-blue-500/10",
          genIcon: "bg-gradient-to-r from-teal-500 to-green-600",
          browseIcon: "bg-gradient-to-r from-green-500 to-blue-600",
          feature1Bg: "bg-teal-100",
          feature1Text: "text-teal-600",
          feature2Bg: "bg-green-100",
          feature2Text: "text-green-600",
          feature3Bg: "bg-blue-100",
          feature3Text: "text-blue-600",
          feature4Bg: "bg-purple-100",
          feature4Text: "text-purple-600",
          ctaGenerate: "bg-gradient-to-r from-teal-500 to-green-600",
          ctaGenerateHover: "hover:from-teal-600 hover:to-green-700",
          ctaBrowse: "bg-gradient-to-r from-green-500 to-blue-600",
          ctaBrowseHover: "hover:from-green-600 hover:to-blue-700",
          modeBadgeBg: "bg-green-50",
          modeBadgeText: "text-green-700",
          modeBadgeBorder: "border-green-200",
          hoverTitleText: "group-hover:text-green-600",
        },
      }}
    />
  )
}
