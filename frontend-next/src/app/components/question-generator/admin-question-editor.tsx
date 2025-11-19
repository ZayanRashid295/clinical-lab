"use client"

import { useState, useEffect, useMemo } from "react"
import { Card } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import QuestionPanel from "./question-panel"
import ExplanationPanel from "./explanation-panel"
import RichEditorContent from "./rich-editor/RichEditorContent"
import ChoiceEditor from "./choice-system/ChoiceEditor"
import ChoiceExplanationEditor from "./choice-system/ChoiceExplanationEditor"
import MetadataSection from "./question-creator/MetadataSection"
import { ContentBlock } from "./rich-editor/types"
import { Choice } from "./choice-system/types"
import { QuestionCreatorData } from "./question-creator/types"
import { Edit2, Eye, Save, X, Settings } from "lucide-react"
import { convertOldQuestionToNew } from "./migration-utils"

interface AdminQuestionEditorProps {
  initialData?: any // Can be QuestionCreatorData or old format question
  onSave: (data: QuestionCreatorData) => void
  onCancel: () => void
  isEditing?: boolean
  onEditModeChange?: (isEditing: boolean) => void // Callback when edit mode changes
}

export default function AdminQuestionEditor({
  initialData,
  onSave,
  onCancel,
  isEditing = false,
  onEditModeChange,
}: AdminQuestionEditorProps) {
  // Convert initialData to QuestionCreatorData format if needed
  const convertedData = useMemo(() => {
    if (!initialData) return undefined
    
    // Check if it's already in QuestionCreatorData format
    if (initialData.stem && Array.isArray(initialData.stem) && initialData.choices) {
      return initialData as QuestionCreatorData
    }
    
    // Otherwise, convert from old format
    return convertOldQuestionToNew(initialData)
  }, [initialData])

  // Editor state
  const [editMode, setEditMode] = useState(isEditing)

  // Notify parent when edit mode changes
  useEffect(() => {
    if (onEditModeChange) {
      onEditModeChange(editMode)
    }
  }, [editMode, onEditModeChange])
  const [stem, setStem] = useState<ContentBlock[]>(convertedData?.stem || [])
  const [choices, setChoices] = useState<Choice[]>(
    convertedData?.choices || [
      { label: "A", text: "", correct: false, value: "A" },
      { label: "B", text: "", correct: false, value: "B" },
    ]
  )
  const [perAnswerExplanations, setPerAnswerExplanations] = useState<
    Record<string, ContentBlock[]>
  >(convertedData?.perAnswerExplanations || {})
  const [mainExplanation, setMainExplanation] = useState<ContentBlock[]>(
    convertedData?.mainExplanation || []
  )
  const [metadata, setMetadata] = useState(convertedData?.metadata || {})
  const [showMetadataEditor, setShowMetadataEditor] = useState(false)

  // View mode state (for student-like preview)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)

  // Update state when initialData changes
  useEffect(() => {
    if (convertedData) {
      if (convertedData.stem !== undefined) {
        setStem(Array.isArray(convertedData.stem) ? convertedData.stem : [])
      }
      if (convertedData.choices) setChoices(convertedData.choices)
      if (convertedData.perAnswerExplanations)
        setPerAnswerExplanations(convertedData.perAnswerExplanations)
      if (convertedData.mainExplanation) setMainExplanation(convertedData.mainExplanation)
      if (convertedData.metadata) setMetadata(convertedData.metadata)
    }
  }, [convertedData])

  // Transform editor data to view format
  const viewQuestion = useMemo(() => {
    const correctChoice = choices.find((c) => c.correct)
    const options = choices.map((choice) => ({
      label: choice.label,
      text: choice.text,
      value: choice.value,
      correct: choice.correct,
    }))

    return {
      id: "editor-question",
      stem: "", // Will use questionStemBlocks
      questionStemBlocks: stem,
      options,
      explanation: mainExplanation,
      perAnswerExplanations,
      subject: metadata?.subject,
      system: metadata?.system,
      topic: metadata?.topicId,
    }
  }, [stem, choices, mainExplanation, perAnswerExplanations, metadata])

  const handleSave = () => {
    const data: QuestionCreatorData = {
      stem,
      choices,
      perAnswerExplanations,
      mainExplanation,
      metadata,
    }
    onSave(data)
  }

  const handleSelectAnswer = (option: string) => {
    if (!answered && !editMode) {
      setSelectedAnswer(option)
      setAnswered(true)
    }
  }

  const handleResetAnswer = () => {
    setSelectedAnswer(null)
    setAnswered(false)
  }

  const correctOption = choices.find((c) => c.correct)
  const isCorrect = selectedAnswer === correctOption?.value
  const correctAnswerLabel = correctOption?.label

  return (
    <div className="h-full bg-background dark:bg-background flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-4 sm:px-6 lg:px-8 py-3 border-b border-border/40 bg-card/20 backdrop-blur-sm">
        <div className="max-w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-foreground">
                {editMode ? "Edit Question" : "Question Preview"}
              </h2>
              {viewQuestion.subject || viewQuestion.system ? (
                <div className="flex flex-wrap gap-2">
                  {viewQuestion.subject && (
                    <span className="px-3 py-1 bg-primary/12 text-primary rounded-lg text-xs font-semibold border border-primary/25">
                      {viewQuestion.subject}
                    </span>
                  )}
                  {viewQuestion.system && (
                    <span className="px-3 py-1 bg-secondary/12 text-secondary rounded-lg text-xs font-semibold border border-secondary/25">
                      {viewQuestion.system}
                    </span>
                  )}
                </div>
              ) : null}
            </div>
            <div className="flex gap-2">
              {editMode ? (
                <>
                  <Button
                    onClick={() => setShowMetadataEditor(!showMetadataEditor)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Metadata
                  </Button>
                  <Button onClick={onCancel} variant="outline" size="sm">
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave} size="sm" className="bg-primary hover:bg-primary/90">
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => setEditMode(true)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button onClick={onCancel} variant="outline" size="sm">
                    <X className="w-4 h-4 mr-2" />
                    Close
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Metadata Editor Modal */}
      {showMetadataEditor && editMode && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Question Metadata</h3>
              <Button
                onClick={() => setShowMetadataEditor(false)}
                variant="ghost"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <MetadataSection value={metadata} onChange={setMetadata} />
            <div className="flex justify-end gap-2 mt-4">
              <Button
                onClick={() => setShowMetadataEditor(false)}
                variant="outline"
              >
                Done
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {editMode ? (
          /* Edit Mode - Show editors */
          <div className="h-full overflow-y-auto">
            <div className="space-y-6 p-6 bg-background w-full">
              {/* Question Stem Editor */}
              <Card className="p-4 shadow-md border border-border/40 bg-card/60 backdrop-blur-sm rounded-xl">
                <h3 className="text-sm font-bold text-primary/70 mb-4 uppercase tracking-widest">
                  Question Stem
                </h3>
                <RichEditorContent
                  blocks={stem}
                  onChange={setStem}
                  placeholder="Add question stem content using the buttons above..."
                />
              </Card>

              {/* Answer Choices Editor */}
              <ChoiceEditor
                choices={choices}
                onChange={setChoices}
                explanations={perAnswerExplanations}
              />

              {/* Per-Answer Explanations Editor */}
              <ChoiceExplanationEditor
                choices={choices}
                explanations={perAnswerExplanations}
                onChange={setPerAnswerExplanations}
              />

              {/* Main Explanation Editor */}
              <Card className="p-4 shadow-md border border-border/40 bg-card/60 backdrop-blur-sm rounded-xl">
                <h3 className="text-sm font-bold text-primary/70 mb-4 uppercase tracking-widest">
                  Main Explanation
                </h3>
                <RichEditorContent
                  blocks={mainExplanation}
                  onChange={setMainExplanation}
                  placeholder="Add main explanation content using the buttons above..."
                  isMainExplanation={true}
                />
              </Card>
            </div>
          </div>
        ) : (
          /* View Mode - Student-like UI */
          <div className="h-full grid grid-cols-1 lg:grid-cols-5 gap-3 p-3 lg:p-4">
            {/* Left column - Questions */}
            <div className="lg:col-span-2 flex flex-col overflow-hidden min-h-0">
              {/* Question Panel - Scrollable */}
              <div className="overflow-y-auto flex-1 pr-2 mb-3">
                <div className="animate-fade-in">
                  <QuestionPanel
                    question={viewQuestion}
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

              {/* Reset Answer Button - For admin to test different answers */}
              {answered && (
                <div className="flex-shrink-0 mb-3">
                  <Button
                    onClick={handleResetAnswer}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Reset Answer
                  </Button>
                </div>
              )}
            </div>

            {/* Right column - Explanation */}
            <div className="lg:col-span-3 flex flex-col overflow-hidden min-h-0">
              {answered ? (
                <div className="overflow-y-auto flex-1 pr-2">
                  <ExplanationPanel
                    correct={isCorrect}
                    selectedAnswer={selectedAnswer}
                    explanation={viewQuestion.explanation}
                    correctAnswerLabel={correctAnswerLabel}
                    options={viewQuestion.options}
                    perAnswerExplanations={viewQuestion.perAnswerExplanations}
                    subject={viewQuestion.subject}
                    system={viewQuestion.system}
                    topic={viewQuestion.topic}
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
        )}
      </div>
    </div>
  )
}

