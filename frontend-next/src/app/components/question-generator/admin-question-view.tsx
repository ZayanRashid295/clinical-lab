"use client"

import UnifiedQuestionPreview from "./unified-question-preview"
import { QuestionCreatorData } from "./question-creator/types"

interface AdminQuestionViewProps {
  question: any
  onEdit?: () => void
  onCancel?: () => void
}

export default function AdminQuestionView({ question, onEdit, onCancel }: AdminQuestionViewProps) {
  if (!question) {
    return (
      <div className="h-full flex items-center justify-center p-2">
        <div className="text-center">
          <p className="text-muted-foreground">No question available</p>
        </div>
      </div>
    )
  }

  // Transform question from admin-dashboard format to QuestionCreatorData format
  const questionData: QuestionCreatorData = {
    stem: Array.isArray(question.questionStemBlocks) ? question.questionStemBlocks : [],
    choices: Array.isArray(question.options) ? question.options.map((opt: any) => ({
      label: opt?.label || "",
      value: opt?.value || "",
      text: opt?.text || "",
      correct: opt?.correct || false,
    })) : [],
    mainExplanation: Array.isArray(question.explanation) ? question.explanation : [],
    perAnswerExplanations: question.perAnswerExplanations && typeof question.perAnswerExplanations === 'object' ? question.perAnswerExplanations : {},
    metadata: {
      chapterId: question.chapterId || "",
      topicId: question.topicId || "",
      productTagId: question.productTagId || "",
      productTagIds: Array.isArray(question.productTagIds) ? question.productTagIds : [],
      subject: question.subject || "",
      system: question.system || "",
      sectionId: question.sectionId || "",
    },
  }

  return (
    <UnifiedQuestionPreview
      questionData={questionData}
      questionId={question.questionId || question.id}
      onEdit={onEdit}
      onClose={onCancel}
    />
  )
}





