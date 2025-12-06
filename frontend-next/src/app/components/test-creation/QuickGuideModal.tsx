"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import {
  BookOpen,
  Settings,
  Bookmark,
  ListChecks,
  MousePointerClick,
  Target,
  CheckCircle2,
  ArrowRight,
  Clock,
  Sparkles,
} from "lucide-react"

interface QuickGuideModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuickGuideModal({ open, onOpenChange }: QuickGuideModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden border-border/50 dark:border-gray-700/50 shadow-2xl bg-card dark:bg-gray-800">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50 dark:border-gray-700/50 bg-gradient-to-br from-primary/5 dark:from-primary/10 via-transparent to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 dark:bg-primary/20 ring-1 ring-primary/20 dark:ring-primary/30">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-foreground dark:text-gray-100">Quick Guide</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground dark:text-gray-400 mt-0.5">
                  Learn how to create your perfect practice test
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto scrollbar-thin">
          {/* Step 1 - Test Settings */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                1
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-foreground dark:text-gray-100">Configure Test Settings</h3>
              </div>
              <p className="text-sm text-muted-foreground dark:text-gray-400 leading-relaxed">
                Enable <span className="font-medium text-foreground dark:text-gray-100">Tutor Mode</span> to see explanations after each
                question. Toggle <span className="font-medium text-foreground dark:text-gray-100">Timed Mode</span> for time-based
                practice. Both can be enabled together for a guided yet timed experience.
              </p>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  Tutor Mode
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Timed
                </Badge>
              </div>
            </div>
          </div>

          <div className="border-t border-border/50 dark:border-gray-700/50" />

          {/* Step 2 - Marked Questions */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                2
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Bookmark className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-foreground dark:text-gray-100">Include Marked Questions</h3>
              </div>
              <p className="text-sm text-muted-foreground dark:text-gray-400 leading-relaxed">
                Enable <span className="font-medium text-foreground dark:text-gray-100">Include marked questions</span> to filter your test
                to only show questions you've previously marked for review. This is perfect for revisiting challenging
                topics you want to focus on.
              </p>
              <div className="bg-muted/50 dark:bg-gray-700/30 rounded-lg p-3 mt-2 flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-amber-500 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground dark:text-gray-400">
                  <span className="font-medium text-foreground dark:text-gray-100">Pro tip:</span> Mark questions during practice to build
                  a personalized review bank.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-border/50 dark:border-gray-700/50" />

          {/* Step 3 - Question Pool */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                3
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-foreground dark:text-gray-100">Select Question Pool</h3>
              </div>
              <p className="text-sm text-muted-foreground dark:text-gray-400 leading-relaxed">
                Filter questions by their status. Choose <span className="font-medium text-foreground dark:text-gray-100">Unused</span> for
                fresh questions,
                <span className="font-medium text-foreground dark:text-gray-100"> Correct</span> to revisit mastered content,
                <span className="font-medium text-foreground dark:text-gray-100"> Incorrect</span> to review mistakes, or
                <span className="font-medium text-foreground dark:text-gray-100"> Omitted</span> for skipped questions.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className="text-xs border-emerald-500/30 dark:border-emerald-400/40 text-emerald-600 dark:text-emerald-400">
                  Unused
                </Badge>
                <Badge variant="outline" className="text-xs border-blue-500/30 dark:border-blue-400/40 text-blue-600 dark:text-blue-400">
                  Correct
                </Badge>
                <Badge variant="outline" className="text-xs border-red-500/30 dark:border-red-400/40 text-red-600 dark:text-red-400">
                  Incorrect
                </Badge>
                <Badge variant="outline" className="text-xs border-amber-500/30 dark:border-amber-400/40 text-amber-600 dark:text-amber-400">
                  Omitted
                </Badge>
              </div>
            </div>
          </div>

          <div className="border-t border-border/50 dark:border-gray-700/50" />

          {/* Step 4 - Subjects & Systems */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                4
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <MousePointerClick className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-foreground dark:text-gray-100">Choose Subjects & Systems</h3>
              </div>
              <p className="text-sm text-muted-foreground dark:text-gray-400 leading-relaxed">
                Click on subjects and organ systems to include them in your test. You can select multiple items from
                each category. Use the search bar to quickly find specific topics.
              </p>
              <div className="bg-muted/50 dark:bg-gray-700/30 rounded-lg p-3 mt-2 flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-amber-500 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground dark:text-gray-400">
                  <span className="font-medium text-foreground dark:text-gray-100">Pro tip:</span> Use "Select All" to quickly include all
                  items, then deselect the ones you don't need.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-border/50 dark:border-gray-700/50" />

          {/* Step 5 - Question Count */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                5
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-foreground dark:text-gray-100">Set Question Count</h3>
              </div>
              <p className="text-sm text-muted-foreground dark:text-gray-400 leading-relaxed">
                Enter the number of questions for your test (1-40). The system will randomly select questions based on
                your criteria. You can see how many questions are available in the footer.
              </p>
            </div>
          </div>

          <div className="border-t border-border/50 dark:border-gray-700/50" />

          {/* Step 6 - Generate */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-emerald-500 dark:bg-emerald-600 text-white flex items-center justify-center text-sm font-bold">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                <h3 className="font-semibold text-foreground dark:text-gray-100">Generate Your Test</h3>
              </div>
              <p className="text-sm text-muted-foreground dark:text-gray-400 leading-relaxed">
                Once you've configured all settings, click the{" "}
                <span className="font-medium text-foreground dark:text-gray-100">"Generate Test"</span> button to create your personalized
                practice exam. Your test will be ready in seconds!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/50 dark:border-gray-700/50 bg-muted/30 dark:bg-gray-700/30 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-gray-400">
            <Clock className="h-4 w-4" />
            <span>
              Average test creation time: <span className="font-medium text-foreground dark:text-gray-100">30 seconds</span>
            </span>
          </div>
          <Button onClick={() => onOpenChange(false)} className="h-9 px-4 font-medium">
            Got it, let's start!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}














