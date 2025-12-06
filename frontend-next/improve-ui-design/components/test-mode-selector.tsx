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
    <div
      className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm"
      data-testid="card-test-mode"
    >
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Test Mode</h3>
      </div>

      <div className="p-4 space-y-3">
        <label
          htmlFor="tutor"
          className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors ${
            isTutor
              ? "bg-indigo-50 dark:bg-indigo-950/30 ring-1 ring-indigo-500"
              : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-1.5 rounded-md ${isTutor ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}
            >
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <p
                className={`text-sm font-medium ${isTutor ? "text-slate-900 dark:text-slate-100" : "text-slate-700 dark:text-slate-300"}`}
              >
                Tutor Mode
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Show explanations after each answer</p>
            </div>
          </div>
          <Switch id="tutor" checked={isTutor} onCheckedChange={onTutorChange} data-testid="switch-tutor" />
        </label>

        <label
          htmlFor="timed"
          className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors ${
            isTimed
              ? "bg-indigo-50 dark:bg-indigo-950/30 ring-1 ring-indigo-500"
              : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-1.5 rounded-md ${isTimed ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}
            >
              <Timer className="h-4 w-4" />
            </div>
            <div>
              <p
                className={`text-sm font-medium ${isTimed ? "text-slate-900 dark:text-slate-100" : "text-slate-700 dark:text-slate-300"}`}
              >
                Timed Mode
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Practice with time constraints</p>
            </div>
          </div>
          <Switch id="timed" checked={isTimed} onCheckedChange={onTimedChange} data-testid="switch-timed" />
        </label>
      </div>
    </div>
  )
}
