"use client"

import { useState } from "react"
import { Card } from "@/shared/ui/card"
import RichContentRenderer from "./rich-content-renderer"

interface PerAnswerExplanationsEditorProps {
  options: Array<{ label: string; text: string; correct: boolean }>
  explanations: Record<string, any[] | string> // support both content blocks and plain strings for backward compatibility
  onChange: (explanations: Record<string, any[]>) => void
}

export default function PerAnswerExplanationsEditor({
  options,
  explanations,
  onChange,
}: PerAnswerExplanationsEditorProps) {
  const [expandedOption, setExpandedOption] = useState<string | null>(options[0]?.label || null)

  const isContentBlocks = (value: any): value is any[] => Array.isArray(value)

  const ensureContentBlocks = (value: any[]): any[] => {
    if (!Array.isArray(value)) {
      return value.trim() ? [{ type: "paragraph", content: value.trim() }] : []
    }
    return value
  }

  return (
    <Card className="p-6 shadow-lg">
      <h2 className="text-2xl font-bold text-foreground mb-2">Per-Answer Explanations</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Provide detailed explanations for each answer choice. These will display on the student side after they submit
        their answer.
      </p>

      <div className="space-y-3">
        {options.map((option) => {
          const explanation = explanations[option.label] || []
          const contentBlocks = ensureContentBlocks(explanation)
          const hasContent = contentBlocks.length > 0

          return (
            <div key={option.label} className="border border-border rounded-lg overflow-hidden">
              {/* Header Button */}
              <button
                onClick={() => setExpandedOption(expandedOption === option.label ? null : option.label)}
                className={`w-full px-4 py-3 flex items-center justify-between transition-colors ${
                  expandedOption === option.label ? "bg-muted/80" : "bg-muted/40 hover:bg-muted/60"
                }`}
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="flex-shrink-0 font-bold text-lg text-primary">{option.label}.</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground line-clamp-1">{option.text}</p>
                    {hasContent && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {contentBlocks.length} content block{contentBlocks.length !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                  {option.correct && (
                    <span className="flex-shrink-0 ml-2 px-2 py-1 bg-green-500/20 text-green-600 text-xs font-semibold rounded">
                      Correct
                    </span>
                  )}
                </div>
                <div className="flex-shrink-0 ml-2 text-muted-foreground transition-transform">
                  {expandedOption === option.label ? "▼" : "▶"}
                </div>
              </button>

              {/* Expanded Content */}
              {expandedOption === option.label && (
                <div className="border-t border-border p-4 bg-card">
                  {hasContent ? (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-foreground">Explanation Preview:</p>
                      <div className="bg-muted/30 rounded-lg p-4 border border-border">
                        <RichContentRenderer content={contentBlocks} />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <span className="text-xs text-amber-600 bg-amber-500/10 px-2 py-1 rounded">
                        No explanation provided
                      </span>
                      <p className="text-xs mt-2">
                        {option.correct
                          ? "Add an explanation for this correct answer"
                          : "Add an explanation for why this answer is incorrect"}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Status Summary */}
      <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
        <p className="text-sm font-semibold text-foreground mb-2">Explanation Status</p>
        <div className="space-y-1 text-sm text-foreground/80">
          {options.map((option) => {
            const exp = explanations[option.label]
            const contentBlocks = ensureContentBlocks(exp || [])
            const hasContent = contentBlocks.length > 0
            return (
              <div key={option.label} className="flex items-center gap-2">
                <span className={hasContent ? "text-green-600" : "text-muted-foreground"}>
                  {hasContent ? "✓" : "○"}
                </span>
                <span>
                  Option {option.label}: {hasContent ? "Filled" : "Empty"}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
