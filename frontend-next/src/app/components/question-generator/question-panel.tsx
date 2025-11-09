"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Card } from "@/shared/ui/card"

interface QuestionPanelProps {
  question?: any
  selectedAnswer: string | null
  answered: boolean
  onSelectAnswer: (option: string) => void
}

export default function QuestionPanel({ question, selectedAnswer, answered, onSelectAnswer }: QuestionPanelProps) {
  if (!question) {
    return (
      <Card className="p-7 shadow-xl border border-border/30 bg-card/50 backdrop-blur-sm sticky top-6 rounded-xl">
        <div className="text-center py-12">
          <p className="text-foreground/60 text-base">No question available</p>
        </div>
      </Card>
    )
  }

  // Process the stem to add line breaks before each **text:** pattern that appears after other text
  const processStem = (text: string): string => {
    // Add a line break before each **text:** pattern that is preceded by non-whitespace text
    // This ensures each bold label (like **Temperature:**) starts on a new line
    // Match: non-whitespace char + whitespace + **text:**
    return text.replace(/([^\n\s])\s+(\*\*[^*]+:\*\*)/g, '$1\n$2')
  }

  const processedStem = processStem(question.stem || "")

  return (
    <Card className="p-6 shadow-md border border-border/40 bg-card/60 backdrop-blur-sm rounded-xl hover:shadow-lg transition-all duration-300">
      <div className="mb-6 animate-fade-in">
        <h3 className="text-xs font-bold text-primary/70 mb-4 uppercase tracking-widest letter-spacing">
          Clinical Case
        </h3>
        <div className="prose prose-sm dark:prose-invert max-w-none text-foreground text-pretty text-base leading-relaxed font-medium">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ node, ...props }) => (
                <p className="text-foreground/90 leading-relaxed mb-3 whitespace-pre-line" {...props} />
              ),
              strong: ({ node, ...props }) => (
                <strong className="font-semibold text-foreground" {...props} />
              ),
              em: ({ node, ...props }) => (
                <em className="italic text-foreground/90" {...props} />
              ),
            }}
          >
            {processedStem}
          </ReactMarkdown>
        </div>
      </div>

      <div className="space-y-2.5">
        {question.options.map((option: any, idx: number) => {
          const isSelected = selectedAnswer === option.value
          const isCorrect = option.correct
          const showFeedback = answered && isSelected

          return (
            <button
              key={option.value}
              onClick={() => onSelectAnswer(option.value)}
              disabled={answered}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-300 flex items-center gap-3 group ${
                isSelected
                  ? isCorrect
                    ? "border-success/60 bg-success/12 shadow-md shadow-success/15"
                    : "border-destructive/60 bg-destructive/12 shadow-md shadow-destructive/15"
                  : "border-border/50 hover:border-primary/40 hover:bg-primary/5"
              } ${answered && !isSelected ? "opacity-45" : ""} ${!answered ? "cursor-pointer hover:shadow-sm" : ""}`}
            >
              <div
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                  isSelected
                    ? isCorrect
                      ? "border-success bg-success/25"
                      : "border-destructive bg-destructive/25"
                    : "border-border/60 group-hover:border-primary/40"
                }`}
              >
                {isSelected && (
                  <svg
                    className="w-3 h-3 text-white animate-scale-in font-bold"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3.5}
                      d={isCorrect ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"}
                    />
                  </svg>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <span className="font-bold text-foreground">{option.label}.</span>
                <span className="text-foreground/75"> {option.text}</span>
              </div>

              {showFeedback && (
                <div
                  className={`flex-shrink-0 font-bold text-lg animate-bounce-subtle ${
                    isCorrect ? "text-success" : "text-destructive"
                  }`}
                >
                  {isCorrect ? "✓" : "✕"}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </Card>
  )
}
