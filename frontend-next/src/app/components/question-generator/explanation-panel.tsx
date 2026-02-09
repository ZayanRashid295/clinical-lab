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
  chapter?: string
  subjectTag?: string
  topic?: string | { name?: string }
}

export default function ExplanationPanel({
  correct,
  selectedAnswer,
  explanation = [],
  correctAnswerLabel = "C",
  options = [],
  perAnswerExplanations = {},
  chapter,
  subjectTag,
  topic,
}: ExplanationPanelProps) {
  return (
    <div className="animate-fade-in flex flex-col h-full min-h-0 overflow-hidden">
      <Card className="shadow-md overflow-hidden flex-1 flex flex-col bg-card/60 dark:bg-gray-800/60 backdrop-blur-sm border border-border/40 dark:border-gray-700 rounded-xl hover:shadow-lg transition-all duration-300 min-h-0 !py-0 !gap-0 !m-0" style={{ padding: 0, margin: 0, height: '100%' }}>
        <div className="overflow-y-auto flex-1 min-h-0" style={{ maxHeight: '100%', height: '100%', paddingRight: '0.25rem', overflowAnchor: 'none' }}>
          <div className="px-2 pb-2 pt-0 space-y-1 text-sm" style={{ marginTop: 0, marginBottom: 0, paddingTop: 0 }}>
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

            {/* Metadata (Subjects/Chapters/Topic) */}
            {/* Show metadata section if any value exists (including empty strings for loading states) */}
            {(subjectTag || chapter || (topic && (typeof topic === "string" ? topic : topic?.name))) && (
              <div className="border-t border-border/40 dark:border-gray-700/50 pt-1 mt-1">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
                  {subjectTag && (
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground dark:text-gray-400 uppercase tracking-wide mb-0">Subjects</div>
                      <div className="text-sm font-bold text-foreground dark:text-gray-100">{subjectTag}</div>
                    </div>
                  )}
                  {chapter && (
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground dark:text-gray-400 uppercase tracking-wide mb-0">Chapters</div>
                      <div className="text-sm font-bold text-foreground dark:text-gray-100">{chapter}</div>
                    </div>
                  )}
                  {topic && (typeof topic === "string" ? topic : topic?.name) && (
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground dark:text-gray-400 uppercase tracking-wide mb-0">Topic</div>
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
