"use client"
import { Card } from "@/shared/ui/card"
import RichContentRenderer from "./rich-content-renderer"

interface ExplanationPanelProps {
  correct: boolean
  selectedAnswer: string | null
  explanation?: any
  correctAnswerLabel?: string
  options?: Array<{ label: string; text: string; correct: boolean }>
  perAnswerExplanations?: Record<string, string | any[]>
  subject?: string
  system?: string
  topic?: string | { name?: string }
}

export default function ExplanationPanel({
  correct,
  selectedAnswer,
  explanation = [],
  correctAnswerLabel = "C",
  options = [],
  perAnswerExplanations = {},
  subject,
  system,
  topic,
}: ExplanationPanelProps) {
  return (
    <div className="animate-fade-in flex flex-col h-full overflow-hidden">
      <Card className="shadow-md overflow-hidden flex-1 flex flex-col bg-card/60 dark:bg-gray-800/60 backdrop-blur-sm border border-border/40 dark:border-gray-700 rounded-xl hover:shadow-lg transition-all duration-300 min-h-0">
        <div className="border-b border-border/40 dark:border-gray-700/50 px-6 py-4 flex-shrink-0">
          <h2 className="text-lg font-bold text-primary dark:text-blue-400 tracking-wide uppercase letter-spacing">Explanation</h2>
        </div>

        <div className="overflow-y-auto flex-1 min-h-0" style={{ maxHeight: '100%' }}>
          <div className="p-6 space-y-6">
            {/* Main Explanation - per-answer explanations are now integrated within the explanation blocks */}
            {explanation && explanation.length > 0 ? (
              <RichContentRenderer 
                content={explanation}
                perAnswerExplanations={perAnswerExplanations}
                options={options}
                selectedAnswer={selectedAnswer}
              />
            ) : (
              <div className="text-center py-12 text-foreground/60 dark:text-gray-400">
                <p className="text-sm font-medium">No detailed explanation available for this question.</p>
              </div>
            )}

            {/* Subject, System, Topic at the end */}
            {(subject || system || topic) && (
              <div className="border-t border-border/40 dark:border-gray-700/50 pt-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {subject && (
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground dark:text-gray-400 uppercase tracking-wide mb-1">Subject</div>
                      <div className="text-sm font-bold text-foreground dark:text-gray-100">{subject}</div>
                    </div>
                  )}
                  {system && (
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground dark:text-gray-400 uppercase tracking-wide mb-1">System</div>
                      <div className="text-sm font-bold text-foreground dark:text-gray-100">{system}</div>
                    </div>
                  )}
                  {topic && (
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground dark:text-gray-400 uppercase tracking-wide mb-1">Topic</div>
                      <div className="text-sm font-bold text-foreground dark:text-gray-100">
                        {typeof topic === "string" ? topic : topic?.name || ""}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
