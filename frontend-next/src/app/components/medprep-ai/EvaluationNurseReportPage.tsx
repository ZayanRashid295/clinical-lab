"use client"

import { MedPrepSlugGate } from "./MedPrepSlugGate"
import { ModeNurseReportPage } from "./shared/ModeNurseReportPage"

export function EvaluationNurseReportPage() {
  return (
    <MedPrepSlugGate slug="ai-evaluation" modeLabel="AI Evaluation Mode">
      <ModeNurseReportPage
        config={{
          modeLabel: "AI Evaluation Mode",
          backLabel: "Back to Evaluation Cases",
          backRoute: "/medprep-ai/evaluation-cases",
          startRoute: (caseId, options) => {
            const generatedSuffix = options?.generated ? "&generated=true" : ""
            return `/medprep-ai/evaluation?mode=evaluation&caseId=${caseId}${generatedSuffix}`
          },
          startButtonLabel: "Begin Evaluation",
          startingButtonLabel: "Starting Evaluation...",
          cardSubtitle: "Evaluation Case - Nurse Report",
          guidelinesTitle: "Evaluation Mode Guidelines",
          guidelinesLines: [
            "• This is a graded evaluation - perform to the best of your ability",
            "• Approach the patient systematically and document thoroughly",
            "• Build a complete differential diagnosis from your history-taking",
            "• Receive an A-F grade with detailed feedback on your performance",
            "• Question quality, diagnostic reasoning, and management will be scored",
            "• Use this opportunity to demonstrate clinical mastery",
          ],
          accent: {
            spinnerBorder: "border-blue-600",
            modeBadgeBg: "bg-blue-50",
            modeBadgeText: "text-blue-700",
            modeBadgeBorder: "border-blue-200",
            headerGradient: "bg-gradient-to-r from-blue-50 to-indigo-50",
            headerIconBg: "bg-blue-100",
            headerIconText: "text-blue-600",
            headerCaseBadgeText: "text-blue-700",
            headerCaseBadgeBorder: "border-blue-200",
            patientSectionBg: "bg-blue-50",
            patientTitleText: "text-blue-900",
            patientLabelText: "text-blue-700",
            patientValueText: "text-blue-900",
            overviewIconText: "text-blue-600",
            notesSectionBg: "bg-indigo-50",
            notesTitleText: "text-indigo-900",
            notesBodyText: "text-indigo-800",
            assessmentSectionBg: "bg-purple-50",
            assessmentTitleText: "text-purple-900",
            assessmentBodyText: "text-purple-800",
            guidelinesSectionBg: "bg-slate-50",
            guidelinesTitleText: "text-slate-900",
            guidelinesBodyText: "text-slate-700",
            buttonGradient: "bg-gradient-to-r from-blue-500 to-indigo-600",
            buttonHoverGradient: "hover:from-blue-600 hover:to-indigo-700",
          },
        }}
      />
    </MedPrepSlugGate>
  )
}
