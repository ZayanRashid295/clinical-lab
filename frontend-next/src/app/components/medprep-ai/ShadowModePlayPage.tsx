"use client"

import { MedPrepSlugGate } from "./MedPrepSlugGate"
import ShadowModeContent from "./shadow/shadow-mode-content"

/** Active shadow simulation (case flow, replay, etc.). Landing lives at `/medprep-ai/shadow-mode`. */
export function ShadowModePlayPage() {
  return (
    <MedPrepSlugGate slug="shadow-mode" modeLabel="Shadow Mode">
      <div className="flex min-h-[60vh] flex-1 flex-col overflow-auto">
        <ShadowModeContent />
      </div>
    </MedPrepSlugGate>
  )
}
