"use client"

import { useState } from "react"
import { Card } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import QuestionPanel from "./question-panel"
import ExplanationPanel from "./explanation-panel"

interface AdminQuestionViewProps {
  question: any
  onEdit?: () => void
  onCancel?: () => void
}

export default function AdminQuestionView({ question, onEdit, onCancel }: AdminQuestionViewProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)

  if (!question) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No question available</p>
        </Card>
      </div>
    )
  }

  const handleSelectAnswer = (option: string) => {
    if (!answered) {
      setSelectedAnswer(option)
      setAnswered(true)
    }
  }

  const correctOption = question.options?.find((o: any) => o.correct)
  const isCorrect = selectedAnswer === correctOption?.value
  const correctAnswerLabel = correctOption?.label

  return (
    <div className="h-full bg-background dark:bg-gray-900 flex flex-col w-full">
      {/* Header */}
      <div className="flex-shrink-0 px-4 sm:px-6 lg:px-8 py-3 border-b border-border/40 dark:border-gray-700 bg-card/20 dark:bg-gray-800/20 backdrop-blur-sm w-full">
        <div className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-foreground dark:text-gray-100">Question Preview</h2>
            </div>
            <div className="flex gap-2">
              {onCancel && (
                <Button onClick={onCancel} variant="outline" size="sm">
                  Cancel
                </Button>
              )}
              {onEdit && (
                <Button onClick={onEdit} size="sm" className="bg-primary dark:bg-blue-600 text-primary-foreground dark:text-white hover:bg-primary/90 dark:hover:bg-blue-700">
                  Edit Question
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Split Screen */}
      <div className="flex-1 overflow-hidden w-full">
        <div className="h-full grid grid-cols-1 lg:grid-cols-5 gap-3 p-3 lg:p-4 w-full">
          {/* Left column - Question, Choices, and Per-Answer Explanations */}
          <div className="lg:col-span-2 flex flex-col overflow-hidden min-h-0">
            {/* Question Panel - Scrollable */}
            <div className="overflow-y-auto flex-1 pr-2 mb-3">
              <div className="animate-fade-in">
                <QuestionPanel
                  question={question}
                  selectedAnswer={selectedAnswer}
                  answered={answered}
                  onSelectAnswer={handleSelectAnswer}
                />
              </div>
            </div>

            {/* Feedback Box - Visible when answered */}
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
                      <p className="text-foreground/70 dark:text-gray-300 text-sm">
                        Correct Answer:{" "}
                        <span className="font-semibold text-foreground dark:text-gray-100">
                          {correctAnswerLabel}. {correctOption?.text}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Reset Answer Button - For admin to test different answers */}
            {answered && (
              <div className="flex-shrink-0 mb-3">
                <Button
                  onClick={() => {
                    setSelectedAnswer(null)
                    setAnswered(false)
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Reset Answer
                </Button>
              </div>
            )}
          </div>

          {/* Right column - Main Explanation */}
          <div className="lg:col-span-3 flex flex-col overflow-hidden min-h-0">
            {answered ? (
              <div className="overflow-y-auto flex-1 pr-2">
                <ExplanationPanel
                  correct={isCorrect}
                  selectedAnswer={selectedAnswer}
                  explanation={question.explanation}
                  correctAnswerLabel={correctAnswerLabel}
                  options={question.options}
                  perAnswerExplanations={question.perAnswerExplanations}
                  chapter={question.subject}
                  subjectTag={question.tags && question.tags.length > 0 ? question.tags[0] : undefined}
                  topic={question.topic}
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center px-4">
                <Card className="p-8 sm:p-12 text-center w-full bg-gradient-to-br from-primary/8 to-secondary/8 dark:from-primary/10 dark:to-secondary/10 backdrop-blur-sm border border-border/40 dark:border-gray-700 animate-fade-in shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 dark:from-primary/30 dark:to-secondary/30 flex items-center justify-center animate-pulse border border-primary/30 dark:border-primary/50">
                      <svg className="w-7 h-7 text-primary dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-foreground/70 dark:text-gray-300 font-semibold tracking-wide">
                      Select an answer to view the detailed explanation
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





