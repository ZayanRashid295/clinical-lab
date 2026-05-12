import React from "react";
import { Switch } from "@/shared/ui/switch";
import { BookOpen, Timer } from "lucide-react";

interface TestModeSelectorProps {
  isTutor: boolean;
  isTimed: boolean;
  onTutorChange: (tutor: boolean) => void;
  onTimedChange: (timed: boolean) => void;
}

export function TestModeSelector({ isTutor, isTimed, onTutorChange, onTimedChange }: TestModeSelectorProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white/90 backdrop-blur-sm dark:border-white/10 dark:bg-white/5" data-testid="card-test-mode">
      <div className="border-b border-slate-200/80 px-4 py-3 dark:border-white/10">
          <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <h3 className="text-sm font-medium text-foreground dark:text-gray-100">Test Mode</h3>
        </div>
                  </div>
      <div className="p-4">
        <div className="space-y-3">
          <label
            htmlFor="tutor"
            className="flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer transition-all hover:bg-accent dark:hover:bg-accent/50 group"
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
                <span className={`text-sm block ${isTutor ? "text-foreground dark:text-gray-100 font-medium" : "text-muted-foreground dark:text-gray-400"}`}>
                  Tutor Mode
                </span>
                <span className="text-[11px] text-muted-foreground dark:text-gray-400">See explanations after each question</span>
              </div>
            </div>
            <Switch id="tutor" checked={isTutor} onCheckedChange={onTutorChange} data-testid="switch-tutor" />
          </label>

          <label
            htmlFor="timed"
            className="flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer transition-all hover:bg-accent dark:hover:bg-accent/50 group"
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
                <span className={`text-sm block ${isTimed ? "text-foreground dark:text-gray-100 font-medium" : "text-muted-foreground dark:text-gray-400"}`}>
                  Timed Mode
                </span>
                <span className="text-[11px] text-muted-foreground dark:text-gray-400">90 seconds per question</span>
              </div>
            </div>
            <Switch id="timed" checked={isTimed} onCheckedChange={onTimedChange} data-testid="switch-timed" />
          </label>
        </div>
      </div>
    </div>
  );
}
