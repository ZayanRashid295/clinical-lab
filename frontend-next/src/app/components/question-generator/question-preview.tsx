"use client"

import { useState } from "react"
import { Card } from "@/shared/ui/card"
import QuestionPanel from "./question-panel"
import ExplanationPanel from "./explanation-panel"

interface QuestionPreviewProps {
  question: any
  onExit: () => void
}

export default function QuestionPreview({ question, onExit }: QuestionPreviewProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)

  const handleSelectAnswer = (option: string) => {
    if (!answered) {
      setSelectedAnswer(option)
      setAnswered(true)
    }
  }

  const currentQuestion = question
  const correctOption = currentQuestion.options.find((o: any) => o.correct)
  const isCorrect = selectedAnswer === correctOption?.value
  const correctAnswerLabel = correctOption?.label
  const correctAnswerText = correctOption?.text

  return (
    <div className="h-full bg-background flex flex-col overflow-hidden w-full">
      <div className="flex-shrink-0 px-4 sm:px-6 lg:px-8 py-3 border-b border-border/40 bg-card/20 backdrop-blur-sm w-full">
        <div className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="text-sm text-foreground/60 bg-primary/10 px-3 py-1.5 rounded-lg w-fit border border-primary/20 font-semibold tracking-wide uppercase">
                Preview Mode
              </div>
              {currentQuestion.questionId && (
                <span className="text-sm font-mono font-bold text-foreground bg-card px-3 py-1.5 rounded border border-border">
                  {currentQuestion.questionId}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={onExit}
                className="px-3 py-2.5 rounded-lg border border-border/50 text-foreground/80 hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 font-semibold text-sm"
              >
                Exit Preview
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden min-h-0 w-full">
        <div className="h-full grid grid-cols-1 lg:grid-cols-5 gap-3 p-3 lg:p-4 overflow-hidden w-full">
          {/* Left column - Questions */}
          <div className="lg:col-span-2 flex flex-col overflow-hidden min-h-0 h-full">
            {/* Question Panel - Takes available space, handles own scrolling */}
            <div className="flex-1 min-h-0 mb-3">
              <QuestionPanel
                question={currentQuestion}
                selectedAnswer={selectedAnswer}
                answered={answered}
                onSelectAnswer={handleSelectAnswer}
              />
            </div>

            {/* Feedback Box - ALWAYS VISIBLE (outside scroll area) */}
            {answered && (
              <div className="flex-shrink-0 mb-3 animate-slide-in-up">
                <div
                  className={`p-5 rounded-xl border-l-4 backdrop-blur-sm shadow-md transition-all ${
                    isCorrect
                      ? "border-success/70 bg-success/12 dark:bg-success/8"
                      : "border-destructive/70 bg-destructive/12 dark:bg-destructive/8"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`text-2xl flex-shrink-0 ${isCorrect ? "text-success" : "text-destructive"}`}>
                      {isCorrect ? "✓" : "✕"}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <p className={`font-bold text-base ${isCorrect ? "text-success" : "text-destructive"}`}>
                        {isCorrect ? "Correct!" : "Incorrect"}
                      </p>
                      <p className="text-foreground/70 text-sm">
                        Correct Answer:{" "}
                        <span className="font-semibold text-foreground">
                          {correctAnswerLabel}. {correctAnswerText}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right column - Explanation */}
          <div className="lg:col-span-3 flex flex-col overflow-hidden min-h-0 h-full">
            {answered ? (
              <div className="flex-1 min-h-0">
                <ExplanationPanel
                  correct={isCorrect}
                  selectedAnswer={selectedAnswer}
                  explanation={currentQuestion.explanation}
                  correctAnswerLabel={correctAnswerLabel}
                  options={currentQuestion.options}
                  perAnswerExplanations={currentQuestion.perAnswerExplanations}
                  subject={currentQuestion.subject}
                  system={currentQuestion.system}
                  topic={currentQuestion.topic}
                />
              </div>
            ) : (
              <div className="flex-1 min-h-0 flex items-center justify-center px-4 overflow-hidden">
                <Card className="p-8 sm:p-12 text-center w-full bg-gradient-to-br from-primary/8 to-secondary/8 backdrop-blur-sm border border-border/40 animate-fade-in shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center animate-pulse border border-primary/30">
                      <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-foreground/70 font-semibold tracking-wide">
                      Select an answer to unlock the detailed explanation
                    </p>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}





