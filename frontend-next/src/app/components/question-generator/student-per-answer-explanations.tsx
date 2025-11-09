"use client"

import RichContentRenderer from "./rich-content-renderer"

interface StudentPerAnswerExplanationsProps {
  options: Array<{ label: string; text: string; correct: boolean }>
  explanations: Record<string, string | any[]>
  selectedAnswer: string | null
}

export default function StudentPerAnswerExplanations({
  options,
  explanations,
  selectedAnswer,
}: StudentPerAnswerExplanationsProps) {
  return (
    <div className="space-y-6 mt-6">
      {options.map((option) => {
        const isCorrect = option.correct
        const isSelected = selectedAnswer === option.label
        const explanation = explanations[option.label]
        const isContentBlocks = Array.isArray(explanation)
        const hasContent = isContentBlocks 
          ? explanation.length > 0 
          : !!explanation?.trim()

        return (
          <div
            key={option.label}
            className="border-b border-border/40 pb-6 last:border-b-0 last:pb-0"
          >
            {/* Header */}
            <div className="mb-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-bold text-foreground">Option {option.label}:</span>
                <span className={`text-sm font-semibold ${
                  isCorrect ? "text-success" : "text-destructive"
                }`}>
                  {isCorrect ? "Correct" : "Incorrect"}
                </span>
                {isSelected && (
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20">
                    You selected
                  </span>
                )}
              </div>
              <p className="text-sm text-foreground/70 mt-1">{option.text}</p>
            </div>

            {/* Explanation Content */}
            {hasContent ? (
              <div className="space-y-2">
                {isContentBlocks ? (
                  <div className="text-foreground/90">
                    <RichContentRenderer content={explanation} />
                  </div>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90">
                    <p className="leading-relaxed whitespace-pre-wrap">{explanation}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No explanation provided</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
