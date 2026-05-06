"use client"

import { ModeNurseReportPage } from "./shared/ModeNurseReportPage"

export function PracticeNurseReportPage() {
  return (
    <ModeNurseReportPage
      config={{
        modeLabel: "Practice Mode",
        backLabel: "Back to Practice Mode",
        backRoute: "/medprep-ai/let-me-drive",
        startRoute: (caseId) => `/medprep-ai/case/${caseId}`,
        startButtonLabel: "Begin Practice Session",
        startingButtonLabel: "Starting Practice Session...",
        cardSubtitle: "Practice Case - Nurse Report",
        guidelinesTitle: "Practice Mode Guidelines",
        guidelinesLines: [
          "• This is a practice session - take your time to think through your approach",
          "• Focus on developing your clinical reasoning skills",
          "• Ask questions systematically and build your differential diagnosis",
          "• No time pressure - learn at your own pace",
          "• Use this opportunity to practice patient communication",
          "• Review your performance after completing the case",
        ],
        accent: {
          spinnerBorder: "border-blue-600",
          modeBadgeBg: "bg-blue-50",
          modeBadgeText: "text-blue-700",
          modeBadgeBorder: "border-blue-200",
          headerGradient: "bg-gradient-to-r from-blue-50 to-purple-50",
          headerIconBg: "bg-blue-100",
          headerIconText: "text-blue-600",
          headerCaseBadgeText: "text-blue-700",
          headerCaseBadgeBorder: "border-blue-200",
          patientSectionBg: "bg-blue-50",
          patientTitleText: "text-blue-900",
          patientLabelText: "text-blue-700",
          patientValueText: "text-blue-900",
          overviewIconText: "text-blue-600",
          notesSectionBg: "bg-green-50",
          notesTitleText: "text-green-900",
          notesBodyText: "text-green-800",
          assessmentSectionBg: "bg-purple-50",
          assessmentTitleText: "text-purple-900",
          assessmentBodyText: "text-purple-800",
          guidelinesSectionBg: "bg-yellow-50",
          guidelinesTitleText: "text-yellow-900",
          guidelinesBodyText: "text-yellow-800",
          buttonGradient: "bg-gradient-to-r from-blue-500 to-purple-600",
          buttonHoverGradient: "hover:from-blue-600 hover:to-purple-700",
        },
      }}
    />
  )
}
