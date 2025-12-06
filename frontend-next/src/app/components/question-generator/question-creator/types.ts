
// Types for the new QuestionCreator

import { ContentBlock } from "../rich-editor/types"
import { Choice } from "../choice-system/types"

export interface QuestionMetadata {
  subject?: string
  system?: string
  sectionId?: string
  chapterId?: string
  topicId?: string
  tags?: string[]
}

export interface QuestionCreatorData {
  stem: ContentBlock[]
  choices: Choice[]
  perAnswerExplanations: Record<string, ContentBlock[]>
  mainExplanation: ContentBlock[]
  metadata: QuestionMetadata
}

export interface QuestionCreatorProps {
  initialData?: Partial<QuestionCreatorData>
  onSave: (data: QuestionCreatorData) => void
  onCancel: () => void
  onPreview?: (data: QuestionCreatorData) => void
}































