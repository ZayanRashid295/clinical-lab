"use client"

import { useState, useMemo } from "react"
import { Card } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import QuestionPanel from "../question-panel"
import ExplanationPanel from "../explanation-panel"
import { QuestionCreatorData } from "./types"

interface QuestionPreviewPanelProps {
  data: QuestionCreatorData
}

export default function QuestionPreviewPanel({ data }: QuestionPreviewPanelProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)

  // Transform QuestionCreatorData to the format expected by QuestionPanel and ExplanationPanel
  // Use useMemo to ensure it updates when data changes
  const { question, correctAnswerLabel, options } = useMemo(() => {
    // Find the correct choice
    const correctChoice = data.choices.find((choice) => choice.correct)
    const correctAnswerLabel = correctChoice?.label || ""

    // Transform choices to options format
    const options = data.choices.map((choice) => ({
      label: choice.label,
      text: choice.text,
      value: choice.value,
      correct: choice.correct,
    }))

    // Transform stem blocks to questionStemBlocks format
    const questionStemBlocks = data.stem || []

    // Create question object in the format expected by QuestionPanel
    const question = {
      stem: "", // Will use questionStemBlocks instead
      questionStemBlocks: questionStemBlocks,
      options: options,
      explanation: data.mainExplanation || [],
      perAnswerExplanations: data.perAnswerExplanations || {},
      subject: data.metadata?.subject,
      system: data.metadata?.system,
      topic: data.metadata?.topicId || undefined, // Pass undefined if not available
    }

    return {
      question,
      correctAnswerLabel,
      options,
    }
  }, [data])

  const handleSelectAnswer = (option: string) => {
    if (!answered) {
      setSelectedAnswer(option)
      setAnswered(true)
    }
  }

  const correctOption = question.options?.find((o: any) => o.correct)
  const isCorrect = selectedAnswer === correctOption?.value

  return (
    <div className="h-full bg-background flex flex-col w-full">
      {/* Question ID only - metadata moved to ExplanationPanel */}
      {data.metadata?.questionId && (
        <div className="flex-shrink-0 px-6 py-2 border-b border-border/40 bg-card/10">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-mono font-bold text-foreground bg-card px-3 py-1.5 rounded border border-border">
              {data.metadata.questionId}
            </span>
          </div>
        </div>
      )}

      {/* Reset Answer Button - If answered */}
      {answered && (
        <div className="flex-shrink-0 px-6 py-2 border-b border-border/40 bg-card/10 flex justify-end">
          <Button
            onClick={() => {
              setSelectedAnswer(null)
              setAnswered(false)
            }}
            variant="outline"
            size="sm"
          >
            Reset Answer
          </Button>
        </div>
      )}

      {/* Main Content - Split Screen */}
      <div className="flex-1 overflow-hidden w-full">
        <div className="h-full grid grid-cols-1 lg:grid-cols-5 gap-3 p-3 lg:p-4 w-full">
          {/* Left column - Question, Choices */}
          <div className="lg:col-span-2 flex flex-col overflow-hidden min-h-0">
            {/* Question Panel - Scrollable */}
            <div className="overflow-y-auto flex-1 pr-2 mb-3">
              <div className="animate-fade-in">
                <QuestionPanel
                  question={question}
                  selectedAnswer={selectedAnswer}
                  answered={answered}
                  onSelectAnswer={handleSelectAnswer}
                  isPreviewMode={true}
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
                      <p className="text-foreground/70 text-sm">
                        Correct Answer:{" "}
                        <span className="font-semibold text-foreground">
                          {correctAnswerLabel}. {correctOption?.text}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
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
                  options={options}
                  perAnswerExplanations={question.perAnswerExplanations}
                  chapter={question.subject}
                  subjectTag={data.metadata?.productTagId ? undefined : undefined}
                  topic={question.topic}
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center px-4">
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

