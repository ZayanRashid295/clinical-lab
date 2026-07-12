"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import QuestionPanel from "./question-panel"
import ExplanationPanel from "./explanation-panel"
import { QuestionCreatorData } from "./question-creator/types"
import { blocksToHTML } from "./unified-editor/content-utils"
import { SystemsService } from "@/app/services/systems/systems.service"
import { TopicsService } from "@/app/services/content/topics.service"
import type { QaFeedbackHighlight } from "@/app/components/QuestionReview/admin/QaFeedbackHighlightsBar"

interface UnifiedQuestionPreviewProps {
  questionData: QuestionCreatorData
  questionId?: string | null
  feedbackHighlights?: QaFeedbackHighlight[]
  onEdit?: () => void
  onClose?: () => void
}

export default function UnifiedQuestionPreview({ 
  questionData, 
  questionId,
  feedbackHighlights,
  onEdit,
  onClose 
}: UnifiedQuestionPreviewProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)
  
  // Metadata name states
  const [chapterName, setChapterName] = useState<string>("")
  const [topicName, setTopicName] = useState<string>("")
  
  const systemsService = new SystemsService()
  const topicsService = new TopicsService()

  // Fetch metadata names
  const fetchMetadataNames = useCallback(async () => {
    const metadata = questionData.metadata
    if (!metadata) return

    const promises: Promise<any>[] = []

    // Fetch chapter name
    if (metadata.systemId) {
      promises.push(
        systemsService.getSystem(metadata.systemId)
          .then((chapter) => {
            setChapterName(chapter?.name || metadata.system || "")
          })
          .catch(() => setChapterName(metadata.system || ""))
      )
    } else if (metadata.system) {
      setChapterName(metadata.system)
    }

    // Fetch topic name
    if (metadata.topicId) {
      promises.push(
        topicsService.getTopic(metadata.topicId)
          .then((topic) => {
            setTopicName(topic?.name || "")
          })
          .catch(() => setTopicName(""))
      )
    }

    await Promise.all(promises)
  }, [questionData.metadata?.systemId, questionData.metadata?.topicId])

  useEffect(() => {
    fetchMetadataNames()
  }, [fetchMetadataNames])

  const handleSelectAnswer = (option: string) => {
    if (!answered) {
      setSelectedAnswer(option)
      setAnswered(true)
    }
  }

  // Transform QuestionCreatorData to the format expected by QuestionPanel and ExplanationPanel
  const choices = questionData.choices || []
  const correctOption = choices.find((choice) => choice.correct)
  const isCorrect = selectedAnswer === correctOption?.value
  const correctAnswerLabel = correctOption?.label || ""
  const correctAnswerText = correctOption?.text || ""

  const options = choices.map((choice) => ({
    label: choice.label,
    text: choice.text,
    value: choice.value,
    correct: choice.correct,
  }))

  const question = {
    stem: blocksToHTML(questionData.stem || []),
    questionStemBlocks: questionData.stem || [],
    options: options.length > 0 ? options : [],
    explanation: questionData.mainExplanation || [],
    perAnswerExplanations: questionData.perAnswerExplanations || {},
  }
  
  // Prepare metadata for ExplanationPanel
  const systemMeta = questionData.metadata?.system;
  const displayChapterName = chapterName || (typeof systemMeta === 'string' ? systemMeta : (systemMeta as any)?.name) || ""
  const displayTopic = topicName ? { name: topicName } : (questionData.metadata?.topicId ? { name: "Loading..." } : undefined)
  const displayMcqTitle = questionData.metadata?.title || ""

  return (
    <div className="h-full bg-background dark:bg-gray-900 flex flex-col w-full" style={{ marginTop: '-2rem', paddingTop: 0 }}>
      {/* Header */}
      <div className="flex-shrink-0 px-2 sm:px-3 lg:px-4 py-0 border-b border-border/40 dark:border-gray-700 bg-card/20 dark:bg-gray-800/20 backdrop-blur-sm w-full">
        <div className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0">
            <div className="flex items-center gap-2 py-0">
              <h2 className="text-base font-bold text-foreground dark:text-gray-100 m-0 leading-tight py-0">Question ID</h2>
              {questionId && (
                <span className="text-xs font-mono font-bold text-foreground dark:text-gray-100 bg-card dark:bg-gray-800 px-2 py-1 rounded border border-border dark:border-gray-700">
                  {questionId}
                </span>
              )}
            </div>
            <div className="flex-1 flex justify-center -ml-48 py-0">
              <h2 className="text-base font-bold text-primary dark:text-blue-400 tracking-wide uppercase m-0 leading-tight">Explanation</h2>
            </div>
            <div className="flex items-center gap-2 py-0">
              {(onEdit || onClose) && (
                <div className="flex gap-1.5">
                  {onEdit && (
                    <Button onClick={onEdit} size="sm" className="bg-primary dark:bg-blue-600 text-primary-foreground dark:text-white hover:bg-primary/90 dark:hover:bg-blue-700">
                      Edit
                    </Button>
                  )}
                  {onClose && (
                    <Button onClick={onClose} variant="outline" size="sm">
                      Close
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Split Screen */}
      <div className="flex-1 overflow-hidden w-full">
        <div className="h-full grid grid-cols-1 lg:grid-cols-5 gap-1 p-1 w-full">
          {/* Left column - Question, Choices, and Feedback */}
          <div className="lg:col-span-2 flex flex-col overflow-hidden min-h-0">
            {/* Question Panel - Scrollable */}
            <div className="overflow-y-auto flex-1 pr-1">
              <div className="animate-fade-in space-y-2">
                <QuestionPanel
                   question={question}
                  selectedAnswer={selectedAnswer}
                  answered={answered}
                  onSelectAnswer={handleSelectAnswer}
                  isPreviewMode={true}
                  feedbackHighlights={feedbackHighlights}
                />

                {/* Feedback Box - Visible when answered */}
                {answered && (
                  <div className="animate-slide-in-up">
                    <div
                      className={`p-2 rounded-lg border-l-4 backdrop-blur-sm shadow-md transition-all ${
                        isCorrect
                          ? "border-success/70 bg-success/12 dark:bg-success/8"
                          : "border-destructive/70 bg-destructive/12 dark:bg-destructive/8"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`text-xl flex-shrink-0 ${isCorrect ? "text-success" : "text-destructive"}`}>
                          {isCorrect ? "✓" : "✕"}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <p className={`font-bold text-sm ${isCorrect ? "text-success" : "text-destructive"}`}>
                            {isCorrect ? "Correct!" : "Incorrect"}
                          </p>
                          <p className="text-foreground/70 dark:text-gray-300 text-xs">
                            Correct Answer:{" "}
                            <span className="font-semibold text-foreground dark:text-gray-100">
                              {correctAnswerLabel}. {correctAnswerText}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reset Answer Button */}
                {answered && (
                  <div>
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
            </div>
          </div>

          {/* Right column - Main Explanation */}
          <div className="lg:col-span-3 flex flex-col overflow-hidden min-h-0">
            <ExplanationPanel
              correct={answered ? isCorrect : false}
              selectedAnswer={selectedAnswer}
              explanation={question.explanation}
              correctAnswerLabel={correctAnswerLabel}
              options={options}
              perAnswerExplanations={question.perAnswerExplanations}
              chapter={displayChapterName || undefined}
              chapterLabel="System"
              topic={displayTopic}
              mcqTitle={displayMcqTitle || undefined}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

