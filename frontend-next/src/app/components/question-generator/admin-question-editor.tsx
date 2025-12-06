"use client"

import { useEffect } from "react"
import QuestionEditor from "./unified-editor/QuestionEditor"
import { QuestionCreatorData } from "./question-creator/types"
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
  const convertedData = initialData
    ? initialData.stem && Array.isArray(initialData.stem) && initialData.choices
      ? (initialData as QuestionCreatorData)
      : convertOldQuestionToNew(initialData)
    : undefined

  useEffect(() => {
    if (onEditModeChange) {
      onEditModeChange(true) // Editor is always in edit mode
    }
  }, [onEditModeChange])

  const handleSave = (data: {
    stem: any[]
    choices: any[]
    perAnswerExplanations: Record<string, any[]>
    mainExplanation: any[]
    metadata: any
  }) => {
    const questionData: QuestionCreatorData = {
      stem: data.stem,
      choices: data.choices,
      perAnswerExplanations: data.perAnswerExplanations,
      mainExplanation: data.mainExplanation,
      metadata: data.metadata,
    }
    onSave(questionData)
  }

  return (
    <QuestionEditor
      initialData={convertedData}
      onSave={handleSave}
      onCancel={onCancel}
    />
  )
}
