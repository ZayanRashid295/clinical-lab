"use client"

import { ModeLandingPage } from "./shared/ModeLandingPage"

export function EvaluationModePage() {
  return (
    <ModeLandingPage
      config={{
        title: "AI Evaluation Mode",
        subtitle: "Master Clinical Skills Through AI-Powered Assessment",
        description:
          "Comprehensive AI assessment of your clinical performance. Receive detailed scoring, feedback on your diagnostic reasoning, and personalized improvement suggestions to enhance your medical skills.",
        highlight1Title: "AI Assessment",
        highlight1Subtitle: "Comprehensive evaluation",
        highlight2Title: "Detailed Scoring",
        highlight2Subtitle: "A-F grade feedback",
        highlight3Title: "Improvement Insights",
        highlight3Subtitle: "Personalized suggestions",
        startLabel: "Start Evaluation",
        startingLabel: "Starting Evaluation...",
        startRoute: "/medprep-ai/evaluation-cases",
        directStartSuccessRoute: (caseId, specialty) => `/medprep-ai/evaluation?caseId=${caseId}&specialty=${specialty}&generated=true`,
        directStartFallbackRoute: (caseId, specialty) => `/medprep-ai/evaluation?caseId=${caseId}&specialty=${specialty}`,
        accent: {
          pageGradient: "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100",
          overlayGradient: "bg-gradient-to-r from-blue-400/20 to-indigo-400/20",
          iconGradient: "bg-gradient-to-r from-blue-500 to-indigo-600",
          subtitleText: "text-blue-600",
          h1Bg: "bg-blue-100",
          h2Bg: "bg-indigo-100",
          h3Bg: "bg-purple-100",
          h1Text: "text-blue-600",
          h2Text: "text-indigo-600",
          h3Text: "text-purple-600",
          buttonGradient: "bg-gradient-to-r from-blue-500 to-indigo-600",
          buttonHoverGradient: "hover:from-blue-600 hover:to-indigo-700",
        },
      }}
    />
  )
}
