"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Card } from "@/shared/ui/card"
import RichContentRenderer from "./rich-content-renderer"
import { ExternalLink, Check, X } from "lucide-react"
import {
  normalizeStemBlocksForDisplay,
  isOptionsAndExplanationsBlock,
  stripOptionsAndExplanationsFromStemString,
  stripOptionsAndExplanationsFromBlock,
} from "./stem-blocks-utils"

interface QuestionPanelProps {
  question?: any
  selectedAnswer: string | null
  answered: boolean
  onSelectAnswer: (option: string) => void
  isPreviewMode?: boolean // If true, show correct answer highlighted even when not answered
}

export default function QuestionPanel({ question, selectedAnswer, answered, onSelectAnswer, isPreviewMode = false }: QuestionPanelProps) {
  if (!question) {
    return (
      <Card className="p-7 shadow-xl border border-border/30 dark:border-gray-700 bg-card/50 dark:bg-gray-800/50 backdrop-blur-sm sticky top-6 rounded-xl">
        <div className="text-center py-12">
          <p className="text-foreground/60 dark:text-gray-400 text-base">No question available</p>
        </div>
      </Card>
    )
  }

  // Check if question has stem blocks (rich content)
  const rawStemBlocks = question.questionStemBlocks && Array.isArray(question.questionStemBlocks) ? question.questionStemBlocks : []
  const questionStemBlocksFiltered = rawStemBlocks.filter((b: any) => !isOptionsAndExplanationsBlock(b))
  const questionStemBlocksMerged = normalizeStemBlocksForDisplay(questionStemBlocksFiltered)
  const hasStemBlocks = questionStemBlocksMerged.length > 0

  // Use stem as-is; no hardcoded parsing or line-breaking. Doc structure is preserved.
  const displayStem = stripOptionsAndExplanationsFromStemString(question.stem || "")

  return (
    <Card className="p-2 shadow-md border border-border/40 dark:border-gray-700 bg-card/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden">
      {/* Content container (scrolling handled by parent) */}
      <div className="flex-1 min-h-0">
        <div className="animate-fade-in">
        {/* Render stem blocks if available, otherwise use plain text stem */}
        {hasStemBlocks ? (
          <div className="text-foreground text-pretty text-base leading-normal font-medium mb-1">
            <RichContentRenderer content={questionStemBlocksMerged.map((b: any) => stripOptionsAndExplanationsFromBlock(b))} stemMode />
          </div>
        ) : (
        <div className="prose prose-sm dark:prose-invert max-w-none text-foreground dark:text-gray-200 text-pretty text-base leading-normal font-medium mb-1 [&_h1]:font-bold [&_h1]:text-center [&_h2]:font-bold [&_h2]:text-center [&_h3]:font-bold [&_h3]:text-center [&_h4]:font-bold [&_h4]:text-center [&_h5]:font-bold [&_h5]:text-center [&_h6]:font-bold [&_h6]:text-center">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ node, ...props }) => (
                <p className="text-foreground/90 dark:text-gray-200 leading-normal mb-1.5" {...props} />
              ),
              strong: ({ node, ...props }) => (
                <strong className="font-semibold text-foreground dark:text-gray-100" {...props} />
              ),
              em: ({ node, ...props }) => (
                <em className="italic text-foreground/90 dark:text-gray-200" {...props} />
              ),
              h1: ({ node, ...props }: any) => (
                <h1 className="text-2xl font-bold text-center text-foreground dark:text-gray-100 mt-4 mb-2" {...props} />
              ),
              h2: ({ node, ...props }: any) => (
                <h2 className="text-xl font-bold text-center text-foreground dark:text-gray-100 mt-3 mb-1.5" {...props} />
              ),
              h3: ({ node, ...props }: any) => (
                <h3 className="text-lg font-bold text-center text-foreground dark:text-gray-100 mt-2 mb-1" {...props} />
              ),
              ul: ({ node, ...props }: any) => (
                <ul className="list-disc list-outside space-y-0.5 mb-2 text-foreground/90 dark:text-gray-200 ml-4" {...props} />
              ),
              ol: ({ node, ...props }: any) => (
                <ol className="list-decimal list-outside space-y-0.5 mb-2 text-foreground/90 dark:text-gray-200 ml-4" {...props} />
              ),
              li: ({ node, ...props }: any) => (
                <li className="text-foreground/90 dark:text-gray-200" {...props} />
              ),
              code: ({ node, ...props }: any) => (
                <code className="bg-muted dark:bg-gray-800 text-foreground dark:text-gray-100 px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
              ),
              pre: ({ node, ...props }: any) => (
                <pre className="bg-muted dark:bg-gray-800 text-foreground dark:text-gray-100 p-2 rounded overflow-x-auto" {...props} />
              ),
              blockquote: ({ node, ...props }: any) => (
                <blockquote className="border-l-4 border-border dark:border-gray-600 pl-3 italic text-foreground/80 dark:text-gray-300" {...props} />
              ),
              img: ({ node, ...props }: any) => (
                <img
                  {...props}
                  className="max-w-full h-auto rounded-lg my-2 border border-border dark:border-gray-700"
                  alt={props.alt || "Image"}
                />
              ),
              a: ({ node, ...props }: any) => (
                <a
                  className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 transition-colors inline-flex items-center gap-1"
                  target="_blank"
                  rel="noopener noreferrer"
                  {...props}
                >
                  {props.children}
                  <ExternalLink className="w-3 h-3 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                </a>
              ),
            }}
          >
            {displayStem}
          </ReactMarkdown>
        </div>
        )}

          {/* Answer Options - Now inside the scrollable container */}
      <div className="space-y-1">
        {question.options.map((option: any, idx: number) => {
          const isSelected = selectedAnswer === option.value
          const isCorrect = option.correct
          const showFeedback = answered && isSelected
          // In preview mode, show correct answer highlighted even when not answered
          // In student mode, show correct answer highlighted after selection
          const showCorrectHighlight = isPreviewMode ? isCorrect : (answered && isCorrect)
          const showCorrectTick = isPreviewMode ? isCorrect : (answered && isCorrect)

          return (
            <button
              key={option.value}
              onClick={() => onSelectAnswer(option.value)}
              disabled={answered}
              className={`w-full text-left p-2 rounded-lg border-2 transition-all duration-300 flex items-center gap-1.5 group ${
                isSelected
                  ? isCorrect
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20 shadow-md"
                    : "border-red-500 bg-red-50 dark:bg-red-900/20 shadow-md"
                  : showCorrectHighlight
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20 shadow-sm"
                  : "border-border/50 dark:border-gray-600 hover:border-primary/40 dark:hover:border-blue-500/40 hover:bg-primary/5 dark:hover:bg-blue-500/10"
              } ${answered && !isSelected && !showCorrectHighlight ? "opacity-45" : ""} ${!answered ? "cursor-pointer hover:shadow-sm" : ""}`}
            >
              <div
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                  isSelected
                    ? isCorrect
                      ? "border-green-500 bg-green-100 dark:bg-green-900/30"
                      : "border-red-500 bg-red-100 dark:bg-red-900/30"
                    : showCorrectHighlight
                      ? "border-green-500 bg-green-100 dark:bg-green-900/30"
                    : "border-border/60 dark:border-gray-600 group-hover:border-primary/40 dark:group-hover:border-blue-500/40"
                }`}
              >
                {isSelected && (
                  <Check 
                    className="w-3.5 h-3.5 animate-scale-in"
                    strokeWidth={3}
                    style={{ color: isCorrect ? '#22c55e' : '#ef4444' }}
                    />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <span className="font-bold text-sm text-foreground dark:text-gray-100">{option.label}.</span>
                <span className="text-sm text-foreground/75 dark:text-gray-300"> {option.text}</span>
              </div>

              {showFeedback && (
                <div
                  className={`flex-shrink-0 text-xs font-semibold px-2 py-1 rounded animate-bounce-subtle ${
                    isCorrect 
                      ? "text-success bg-success/10 border border-success/20" 
                      : "text-primary bg-primary/10 border border-primary/20"
                  }`}
                >
                  {isCorrect ? "✓ Correct" : "(You selected)"}
                </div>
              )}
              {showCorrectTick && !isSelected && (
                <div className="flex-shrink-0 text-success">
                  <Check className="w-5 h-5 animate-scale-in" strokeWidth={3} />
                </div>
              )}
            </button>
          )
        })}
          </div>
        </div>
      </div>
    </Card>
  )
}
