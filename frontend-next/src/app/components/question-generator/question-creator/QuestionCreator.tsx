"use client"

import QuestionEditor from "../unified-editor/QuestionEditor"
import { QuestionCreatorProps, QuestionCreatorData } from "./types"

export default function QuestionCreator(props: QuestionCreatorProps) {
  const handleSave = async (data: {
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
    return props.onSave(questionData)
  }

  return (
    <QuestionEditor
      initialData={props.initialData}
      onSave={handleSave}
      onCancel={props.onCancel}
      onPreviewModeChange={props.onPreviewModeChange}
      isSavingExternal={props.isSavingExternal}
      saveBusyLabel={props.saveBusyLabel}
    />
  )
}
