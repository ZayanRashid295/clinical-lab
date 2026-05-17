"use client"

import { Brain, Eye, History } from "lucide-react"
import { MedPrepSlugGate } from "./MedPrepSlugGate"
import { ModeLandingPage } from "./shared/ModeLandingPage"

export function ShadowModePage() {
  return (
    <MedPrepSlugGate slug="shadow-mode" modeLabel="Shadow Mode">
      <ModeLandingPage
        config={{
          title: "Shadow Mode",
          subtitle: "Observe AI clinical reasoning and replay full encounters",
          description:
            "Follow an AI physician through a case: history, internal reasoning, differentials, investigations, and documentation—then step through a replay timeline to consolidate patterns. Ideal for learning clinical flow without being in the hot seat.",
          highlight1Title: "Physician playthrough",
          highlight1Subtitle: "Watch questions and reasoning unfold",
          highlight2Title: "Differentials & workups",
          highlight2Subtitle: "Aligned with each turn",
          highlight3Title: "Replay timeline",
          highlight3Subtitle: "Step through the encounter",
          startLabel: "Start Shadow Mode",
          startingLabel: "Opening Shadow Mode...",
          startRoute: "/medprep-ai/shadow-cases",
          topIcon: Eye,
          highlightIcons: [Eye, Brain, History],
          directStartSuccessRoute: (caseId, specialty) =>
            `/medprep-ai/shadow-play?caseId=${encodeURIComponent(caseId)}&specialty=${encodeURIComponent(specialty)}&generated=true`,
          directStartFallbackRoute: (caseId, specialty) =>
            `/medprep-ai/shadow-play?caseId=${encodeURIComponent(caseId)}&specialty=${encodeURIComponent(specialty)}`,
          accent: {
            pageGradient: "bg-gradient-to-br from-slate-50 via-zinc-50 to-slate-100",
            overlayGradient: "bg-gradient-to-r from-slate-400/15 to-zinc-500/15",
            iconGradient: "bg-gradient-to-r from-slate-600 to-zinc-700",
            subtitleText: "text-slate-600",
            h1Bg: "bg-slate-100",
            h2Bg: "bg-zinc-100",
            h3Bg: "bg-slate-50",
            h1Text: "text-slate-700",
            h2Text: "text-zinc-700",
            h3Text: "text-slate-600",
            buttonGradient: "bg-gradient-to-r from-slate-700 to-zinc-800",
            buttonHoverGradient: "hover:from-slate-800 hover:to-zinc-900",
          },
        }}
      />
    </MedPrepSlugGate>
  )
}
