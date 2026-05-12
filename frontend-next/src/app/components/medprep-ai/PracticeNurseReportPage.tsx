"use client"

import { MedPrepSlugGate } from "./MedPrepSlugGate"
import { ModeNurseReportPage } from "./shared/ModeNurseReportPage"

export function PracticeNurseReportPage() {
  return (
    <MedPrepSlugGate slug="let-me-drive" modeLabel="Practice Mode">
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
            spinnerBorder: "border-primary",
            modeBadgeBg: "bg-primary-50",
            modeBadgeText: "text-primary-700",
            modeBadgeBorder: "border-primary-200",
            headerGradient: "bg-gradient-to-r from-primary-50 to-primary-100/80",
            headerIconBg: "bg-primary-100",
            headerIconText: "text-primary-600",
            headerCaseBadgeText: "text-primary-700",
            headerCaseBadgeBorder: "border-primary-200",
            patientSectionBg: "bg-primary-50",
            patientTitleText: "text-primary-900",
            patientLabelText: "text-primary-700",
            patientValueText: "text-primary-900",
            overviewIconText: "text-primary-600",
            notesSectionBg: "bg-primary-50/80",
            notesTitleText: "text-primary-900",
            notesBodyText: "text-primary-800",
            assessmentSectionBg: "bg-primary-50/80",
            assessmentTitleText: "text-primary-900",
            assessmentBodyText: "text-primary-800",
            guidelinesSectionBg: "bg-primary-50/80",
            guidelinesTitleText: "text-primary-900",
            guidelinesBodyText: "text-primary-800",
            buttonGradient: "bg-gradient-to-r from-primary-500 to-primary-700",
            buttonHoverGradient: "hover:from-primary-600 hover:to-primary-800",
          },
        }}
      />
    </MedPrepSlugGate>
  )
}
