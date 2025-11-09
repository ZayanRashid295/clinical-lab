"use client"
import { Card } from "@/shared/ui/card"
import RichContentRenderer from "./rich-content-renderer"
import StudentPerAnswerExplanations from "./student-per-answer-explanations"

interface ExplanationPanelProps {
  correct: boolean
  selectedAnswer: string | null
  explanation?: any
  correctAnswerLabel?: string
  options?: Array<{ label: string; text: string; correct: boolean }>
  perAnswerExplanations?: Record<string, string | any[]>
}

export default function ExplanationPanel({
  correct,
  selectedAnswer,
  explanation = [],
  correctAnswerLabel = "C",
  options = [],
  perAnswerExplanations = {},
}: ExplanationPanelProps) {
  const hasPerAnswerExplanations = options.length > 0 && Object.values(perAnswerExplanations).some((e) => {
    if (Array.isArray(e)) {
      return e.length > 0
    }
    return !!e?.trim()
  })

  return (
    <div className="animate-fade-in flex flex-col h-full">
      <Card className="shadow-md overflow-hidden flex-1 flex flex-col bg-card/60 backdrop-blur-sm border border-border/40 rounded-xl hover:shadow-lg transition-all duration-300">
        <div className="border-b border-border/40 px-6 py-4 bg-gradient-to-r from-primary/8 via-transparent to-transparent">
          <h2 className="text-lg font-bold text-primary tracking-wide uppercase letter-spacing">Explanation</h2>
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="p-6 space-y-6">
            {/* Main Explanation */}
            {explanation && explanation.length > 0 ? (
              <RichContentRenderer content={explanation} />
            ) : (
              <div className="text-center py-12 text-foreground/60">
                <p className="text-sm font-medium">No detailed explanation available for this question.</p>
              </div>
            )}

            {hasPerAnswerExplanations && (
              <div className="border-t border-border/40 pt-6 mt-6">
                <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wide">Answer Breakdown</h3>
                <StudentPerAnswerExplanations
                  options={options}
                  explanations={perAnswerExplanations}
                  selectedAnswer={selectedAnswer}
                />
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
