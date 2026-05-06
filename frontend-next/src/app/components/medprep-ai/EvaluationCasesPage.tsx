"use client"

import { ModeCasesPage } from "./shared/ModeCasesPage"

export function EvaluationCasesPage() {
  return (
    <ModeCasesPage
      config={{
        modeTitle: "Evaluation Mode",
        chooseCaseSubtitle: "Choose Your Evaluation Case",
        generateDescription:
          "Generate a custom case for AI assessment. Receive comprehensive evaluation with detailed scoring and improvement suggestions.",
        browseDescription:
          "Browse existing cases for AI evaluation. Get detailed scoring (A-F grades), feedback on question quality, and diagnostic reasoning assessment.",
        casePurpose: "evaluation",
        backToModeLabel: "Back to Evaluation Mode",
        backToModeRoute: "/medprep-ai/evaluation-mode",
        routeForGeneratedCase: (caseId) => `/medprep-ai/evaluation?mode=evaluation&caseId=${caseId}&generated=true`,
        routeForSelectedCase: (caseId) => `/medprep-ai/evaluation?mode=evaluation&caseId=${caseId}`,
        routeForChatbotGeneratedCase: (caseId) => `/medprep-ai/evaluation?mode=evaluation&caseId=${caseId}&generated=true`,
        accent: {
          pageGradient: "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100",
          overlayGradient: "bg-gradient-to-r from-blue-400/20 to-indigo-400/20",
          iconGradient: "bg-gradient-to-r from-blue-500 to-indigo-600",
          subtitleText: "text-blue-600",
          genOverlay: "bg-gradient-to-br from-blue-500/10 to-indigo-500/10",
          browseOverlay: "bg-gradient-to-br from-indigo-500/10 to-purple-500/10",
          genIcon: "bg-gradient-to-r from-blue-500 to-indigo-600",
          browseIcon: "bg-gradient-to-r from-indigo-500 to-purple-600",
          feature1Bg: "bg-blue-100",
          feature1Text: "text-blue-600",
          feature2Bg: "bg-indigo-100",
          feature2Text: "text-indigo-600",
          feature3Bg: "bg-purple-100",
          feature3Text: "text-purple-600",
          feature4Bg: "bg-pink-100",
          feature4Text: "text-pink-600",
          ctaGenerate: "bg-gradient-to-r from-blue-500 to-indigo-600",
          ctaGenerateHover: "hover:from-blue-600 hover:to-indigo-700",
          ctaBrowse: "bg-gradient-to-r from-indigo-500 to-purple-600",
          ctaBrowseHover: "hover:from-indigo-600 hover:to-purple-700",
          modeBadgeBg: "bg-blue-50",
          modeBadgeText: "text-blue-700",
          modeBadgeBorder: "border-blue-200",
          hoverTitleText: "group-hover:text-blue-600",
        },
      }}
    />
  )
}
