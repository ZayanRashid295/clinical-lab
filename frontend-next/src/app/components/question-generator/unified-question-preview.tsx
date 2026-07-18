"use client"

import { useState, useEffect, useCallback, type ReactNode } from "react"
import { Card } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import QuestionPanel from "./question-panel"
import ExplanationPanel from "./explanation-panel"
import { ProtectedMcqContent } from "./ProtectedMcqContent"
import { QuestionCreatorData } from "./question-creator/types"
import { blocksToHTML } from "./unified-editor/content-utils"
import { SystemsService } from "@/app/services/systems/systems.service"
import { TopicsService } from "@/app/services/content/topics.service"

interface UnifiedQuestionPreviewProps {
  questionData: QuestionCreatorData
  questionId?: string | null
  onEdit?: () => void
  onClose?: () => void
  /** Admin editor preview reveals answers immediately. Practice waits for a selection (student/demo). */
  mode?: "preview" | "practice"
  /** Optional controls rendered under the choices (e.g. demo Previous / Next). */
  belowChoices?: ReactNode
  /** Current question index within a set (1-based) and total count. */
  questionPosition?: { current: number; total: number }
}

export default function UnifiedQuestionPreview({ 
  questionData, 
  questionId,
  onEdit,
  onClose,
  mode = "preview",
  belowChoices,
  questionPosition,
}: UnifiedQuestionPreviewProps) {
  const isPreviewMode = mode === "preview"
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)
  
  // Metadata name states
  const [chapterName, setChapterName] = useState<string>(
    () =>
      (typeof questionData.metadata?.system === "string"
        ? questionData.metadata.system
        : "") || "",
  )
  const [topicName, setTopicName] = useState<string>(
    () => questionData.metadata?.parsedTopicName || "",
  )
  const [topicLookupDone, setTopicLookupDone] = useState(
    () => !questionData.metadata?.topicId || Boolean(questionData.metadata?.parsedTopicName),
  )
  
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
      if (metadata.parsedTopicName) {
        setTopicName(metadata.parsedTopicName)
        setTopicLookupDone(true)
      }
      promises.push(
        topicsService.getTopic(metadata.topicId)
          .then((topic) => {
            setTopicName(topic?.name || metadata.parsedTopicName || "")
          })
          .catch(() => setTopicName(metadata.parsedTopicName || ""))
          .finally(() => setTopicLookupDone(true))
      )
    } else {
      setTopicLookupDone(true)
    }

    await Promise.all(promises)
  }, [questionData.metadata?.systemId, questionData.metadata?.topicId, questionData.metadata?.parsedTopicName, questionData.metadata?.system])

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
  const resolvedTopicName =
    topicName || questionData.metadata?.parsedTopicName || ""
  const displayTopic = resolvedTopicName
    ? { name: resolvedTopicName }
    : questionData.metadata?.topicId && !topicLookupDone
      ? { name: "Loading..." }
      : undefined
  const displayMcqTitle = questionData.metadata?.title || ""

  return (
    <div
      className={
        isPreviewMode
          ? "h-full min-h-0 bg-background dark:bg-gray-900 flex flex-col w-full overflow-hidden"
          : "h-full min-h-0 flex flex-col w-full overflow-hidden bg-[var(--mkt-bg,hsl(var(--background)))] text-[var(--mkt-text,hsl(var(--foreground)))]"
      }
      style={isPreviewMode ? { marginTop: "-2rem", paddingTop: 0 } : undefined}
    >
      {/* Header */}
      <div
        className={
          isPreviewMode
            ? "flex-shrink-0 px-2 sm:px-3 lg:px-4 py-0 border-b border-border/40 dark:border-gray-700 bg-card/20 dark:bg-gray-800/20 backdrop-blur-sm w-full"
            : "flex-shrink-0 px-2 sm:px-3 lg:px-4 py-0 border-b border-[color:var(--mkt-border)] bg-[color-mix(in_srgb,var(--mkt-bg-elevated)_88%,transparent)] backdrop-blur-sm w-full"
        }
      >
        <div className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0">
            <div className="flex items-center gap-2 py-0">
              <h2
                className={
                  isPreviewMode
                    ? "text-base font-bold text-foreground dark:text-gray-100 m-0 leading-tight py-0"
                    : "text-base font-bold m-0 leading-tight py-0 text-[var(--mkt-text)]"
                }
              >
                Question ID
              </h2>
              {questionId && (
                <span
                  className={
                    isPreviewMode
                      ? "text-xs font-mono font-bold text-foreground dark:text-gray-100 bg-card dark:bg-gray-800 px-2 py-1 rounded border border-border dark:border-gray-700"
                      : "text-xs font-mono font-bold px-2 py-1 rounded border text-[var(--mkt-text)] bg-[var(--mkt-bg-elevated)] border-[color:var(--mkt-border)]"
                  }
                >
                  {questionId}
                </span>
              )}
              {questionPosition && questionPosition.total > 0 && (
                <span
                  className={
                    isPreviewMode
                      ? "text-xs font-semibold tabular-nums text-muted-foreground dark:text-gray-400"
                      : "text-xs font-semibold tabular-nums text-[var(--mkt-text-muted)]"
                  }
                >
                  {questionPosition.current} / {questionPosition.total}
                </span>
              )}
            </div>
            <div className="flex-1 flex justify-center -ml-48 py-0">
              <h2
                className={
                  isPreviewMode
                    ? "text-base font-bold text-primary dark:text-blue-400 tracking-wide uppercase m-0 leading-tight"
                    : "text-base font-bold tracking-wide uppercase m-0 leading-tight text-[var(--mkt-accent)]"
                }
              >
                Explanation
              </h2>
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
      <ProtectedMcqContent
        enabled={!isPreviewMode}
        mode="strict"
        className="flex-1 overflow-hidden w-full"
      >
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
                  isPreviewMode={isPreviewMode}
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

                {belowChoices}
              </div>
            </div>
          </div>

          {/* Right column - Main Explanation */}
          <div className="lg:col-span-3 flex flex-col overflow-hidden min-h-0 h-full">
            {isPreviewMode || answered ? (
              <div className="flex-1 min-h-0 overflow-hidden h-full">
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
            ) : (
              <div className="flex-1 flex items-center justify-center px-4 min-h-0 overflow-hidden">
                <Card className="p-8 sm:p-12 text-center w-full bg-gradient-to-br from-primary/8 dark:from-primary/10 to-secondary/8 dark:to-secondary/10 backdrop-blur-sm border border-border/40 dark:border-gray-700/50 animate-fade-in shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 dark:from-primary/30 to-secondary/20 dark:to-secondary/30 flex items-center justify-center animate-pulse border border-primary/30 dark:border-primary/40">
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
                      Select an answer to unlock the detailed explanation
                    </p>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </ProtectedMcqContent>
    </div>
  )
}

