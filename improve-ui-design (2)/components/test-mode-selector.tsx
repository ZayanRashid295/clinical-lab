"use client"
import { Switch } from "@/components/ui/switch"
import { BookOpen, Timer } from "lucide-react"

interface TestModeSelectorProps {
  isTutor: boolean
  isTimed: boolean
  onTutorChange: (tutor: boolean) => void
  onTimedChange: (timed: boolean) => void
}

export function TestModeSelector({ isTutor, isTimed, onTutorChange, onTimedChange }: TestModeSelectorProps) {
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden" data-testid="card-test-mode">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium text-foreground">Test Mode</h3>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <label
          htmlFor="tutor"
          className="flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer transition-all hover:bg-accent group"
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-1.5 rounded-md transition-all ${
                isTutor ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
            </div>
            <div>
              <span className={`text-sm block ${isTutor ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                Tutor Mode
              </span>
              <span className="text-[11px] text-muted-foreground">See explanations after each question</span>
            </div>
          </div>
          <Switch id="tutor" checked={isTutor} onCheckedChange={onTutorChange} data-testid="switch-tutor" />
        </label>

        <label
          htmlFor="timed"
          className="flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer transition-all hover:bg-accent group"
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-1.5 rounded-md transition-all ${
                isTimed ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              <Timer className="h-3.5 w-3.5" />
            </div>
            <div>
              <span className={`text-sm block ${isTimed ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                Timed Mode
              </span>
              <span className="text-[11px] text-muted-foreground">90 seconds per question</span>
            </div>
          </div>
          <Switch id="timed" checked={isTimed} onCheckedChange={onTimedChange} data-testid="switch-timed" />
        </label>
      </div>
    </div>
  )
}
