
// Types for the new QuestionCreator

import { ContentBlock } from "../rich-editor/types"
import { Choice } from "../choice-system/types"

export interface QuestionMetadata {
  subject?: string
  system?: string
  systemId?: string
  topicId?: string
  subtopicId?: string
  productId?: string
  categoryId?: string // New 5-level hierarchy: Category -> Product -> System -> Topic -> Subtopic
  title?: string
  productTagId?: string // Deprecated: use categoryId
  productTagIds?: string[] // Deprecated: use categoryId
  questionId?: string | null // Optional question ID stored in metadata/tags
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
  onPreviewModeChange?: (isPreview: boolean) => void
}































