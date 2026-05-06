"use client"

import { ModeNurseReportPage } from "./shared/ModeNurseReportPage"

export function LearningNurseReportPage() {
  return (
    <ModeNurseReportPage
      config={{
        modeLabel: "Learning Mode",
        backLabel: "Back to Learning Cases",
        backRoute: "/medprep-ai/learn-cases",
        startRoute: (caseId) => `/medprep-ai/learn/${caseId}`,
        startButtonLabel: "Begin Learning Session",
        startingButtonLabel: "Starting Learning Session...",
        cardSubtitle: "Learning Case - Nurse Report",
        guidelinesTitle: "Learning Mode Guidelines",
        guidelinesLines: [
          "• This is a guided learning session with educational support",
          "• Take time to think through your clinical reasoning process",
          "• Ask questions systematically and build your knowledge",
          "• Receive real-time feedback and educational insights",
          "• Learn from each interaction and improve your skills",
          "• Focus on understanding the underlying medical concepts",
          "• Use this opportunity to develop your diagnostic approach",
        ],
        accent: {
          spinnerBorder: "border-green-600",
          modeBadgeBg: "bg-green-50",
          modeBadgeText: "text-green-700",
          modeBadgeBorder: "border-green-200",
          headerGradient: "bg-gradient-to-r from-green-50 to-teal-50",
          headerIconBg: "bg-green-100",
          headerIconText: "text-green-600",
          headerCaseBadgeText: "text-green-700",
          headerCaseBadgeBorder: "border-green-200",
          patientSectionBg: "bg-green-50",
          patientTitleText: "text-green-900",
          patientLabelText: "text-green-700",
          patientValueText: "text-green-900",
          overviewIconText: "text-green-600",
          notesSectionBg: "bg-blue-50",
          notesTitleText: "text-blue-900",
          notesBodyText: "text-blue-800",
          assessmentSectionBg: "bg-teal-50",
          assessmentTitleText: "text-teal-900",
          assessmentBodyText: "text-teal-800",
          guidelinesSectionBg: "bg-purple-50",
          guidelinesTitleText: "text-purple-900",
          guidelinesBodyText: "text-purple-800",
          buttonGradient: "bg-gradient-to-r from-green-500 to-teal-600",
          buttonHoverGradient: "hover:from-green-600 hover:to-teal-700",
        },
      }}
    />
  )
}
