// Migration utilities to convert between old and new question formats

import { coerceLabelString } from "./metadata-label-utils";
import { Choice } from "./choice-system/types"
import { QuestionCreatorData } from "./question-creator/types"
import { stemStringToStemBlocks } from "./stem-blocks-utils"

/**
 * Convert old format blocks to new format ContentBlocks
 */
export function convertOldBlocksToNew(oldBlocks: any[]): ContentBlock[] {
  if (!Array.isArray(oldBlocks)) return []

  return oldBlocks
    .filter((block) => block != null)
    .map((block, index) => {
      // Check if this is a per-answer-explanation placeholder first
      // This handles both PER_ANSWER_EXPLANATION type and TEXT blocks with markers
      const isPerAnswerExplanation = 
        block.type === "PER_ANSWER_EXPLANATION" || 
        block.type === "per-answer-explanation" ||
        (block.data && (
          block.data.placeholder === true || 
          block.data.isPerAnswerExplanation === true ||
          block.data.allChoices === true
        ))
      
      // Preserve the original type for proper conversion
      const originalType = block.type || "TEXT"
      const convertedType = isPerAnswerExplanation 
        ? "per-answer-explanation" 
        : convertOldTypeToNew(originalType)
      const convertedData = convertOldDataToNew(originalType, block.data)
      
      const newBlock: ContentBlock = {
        id: block.id || `block-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
        type: convertedType,
        data: convertedData,
        order: typeof block.order === "number" ? block.order : index,
      }
      return newBlock
    })
    .sort((a, b) => {
      // Sort by order to maintain block sequence
      const orderA = typeof a.order === "number" ? a.order : 999
      const orderB = typeof b.order === "number" ? b.order : 999
      return orderA - orderB
    })
}

/**
 * Convert new format ContentBlocks to old format blocks
 */
export function convertNewBlocksToOld(newBlocks: ContentBlock[]): any[] {
  if (!Array.isArray(newBlocks)) return []

  return newBlocks
    .filter((block) => block != null)
    .map((block, index) => ({
      id: block.id || `block-${Date.now()}-${index}`,
      type: convertNewTypeToOld(block.type),
      data: convertNewDataToOld(block.type, block.data),
      order: typeof block.order === "number" ? block.order : index, // Ensure order is preserved
    }))
    .sort((a, b) => {
      // Sort by order to maintain sequence
      const orderA = typeof a.order === "number" ? a.order : 999
      const orderB = typeof b.order === "number" ? b.order : 999
      return orderA - orderB
    })
}

/**
 * Convert old question format to new QuestionCreatorData format
 */
export function convertOldQuestionToNew(oldQuestion: any): Partial<QuestionCreatorData> {
  // Handle stem - prioritize questionStemBlocks over plain string stem
  // This ensures rich content blocks are preserved when editing
  let stemBlocks: ContentBlock[] = []
  
  // PRIORITY 1: Use questionStemBlocks if they exist (rich content blocks)
  if (Array.isArray(oldQuestion.questionStemBlocks) && oldQuestion.questionStemBlocks.length > 0) {
    stemBlocks = convertOldBlocksToNew(oldQuestion.questionStemBlocks)
    
  } 
  // PRIORITY 2: Use stem array if it exists
  else if (Array.isArray(oldQuestion.stem) && oldQuestion.stem.length > 0) {
    stemBlocks = convertOldBlocksToNew(oldQuestion.stem)
  }
  // PRIORITY 3: Fallback to string stem — use stem-only pipeline so stem never renders line-by-line
  else if (typeof oldQuestion.stem === "string" && oldQuestion.stem.trim()) {
    stemBlocks = stemStringToStemBlocks(oldQuestion.stem) as ContentBlock[]
  }

  // Extract questionId from tags if stored there
  let questionId: string | undefined = oldQuestion.questionId || oldQuestion.metadata?.questionId
  const tags = Array.isArray(oldQuestion.tags) ? oldQuestion.tags : []
  const filteredTags: string[] = []
  
  for (const tag of tags) {
    if (typeof tag === "string" && tag.startsWith("__questionId:")) {
      questionId = tag.replace("__questionId:", "")
      if (process.env.NODE_ENV === "development") {
        console.log("[convertOldQuestionToNew] Extracted questionId from tags:", questionId)
      }
    } else {
      filteredTags.push(String(tag))
    }
  }
  
  if (process.env.NODE_ENV === "development" && questionId) {
    console.log("[convertOldQuestionToNew] Final questionId for metadata:", questionId)
  }

  return {
    stem: stemBlocks,
    choices: convertOldOptionsToChoices(oldQuestion.options || []),
    perAnswerExplanations: convertOldPerAnswerExplanationsToNew(
      oldQuestion.perAnswerExplanations || {}
    ),
    mainExplanation: convertOldBlocksToNew(oldQuestion.explanation || []),
    metadata: {
      subject: oldQuestion.category || oldQuestion.subject,
      system: oldQuestion.system,
      systemId: oldQuestion.systemId,
      topicId: oldQuestion.topicId,
      subtopicId: oldQuestion.subtopicId,
      productId: oldQuestion.productId,
      categoryId: oldQuestion.categoryId,
      title: coerceLabelString(oldQuestion.mcqTitle ?? oldQuestion.title),
      parsedProductName: coerceLabelString(oldQuestion.product),
      parsedTopicName: coerceLabelString(oldQuestion.topic ?? (oldQuestion as any).topicName),
      parsedSubtopicName: coerceLabelString(oldQuestion.subtopic ?? (oldQuestion as any).subtopicName),
      parsedMcqTitle: coerceLabelString(oldQuestion.mcqTitle ?? oldQuestion.title),
      productTagId: oldQuestion.productTagId,
      // Convert single productTagId/categoryId to array for backward compatibility
      productTagIds: oldQuestion.categoryId 
        ? [oldQuestion.categoryId] 
        : (oldQuestion.productTagId ? [oldQuestion.productTagId] : oldQuestion.productTagIds || undefined),
      tags: filteredTags, // Return tags without the questionId marker
      questionId: questionId, // Preserve questionId from tags or existing metadata
      isDemo: Boolean(oldQuestion.isDemo),
      demoPack: oldQuestion.demoPack || null,
    },
  }
}

/**
 * Convert new QuestionCreatorData format to old question format
 */
export function convertNewQuestionToOld(newData: QuestionCreatorData): any {
  return {
    questionStemBlocks: convertNewBlocksToOld(newData.stem),
    options: convertChoicesToOldOptions(newData.choices),
    perAnswerExplanations: convertNewPerAnswerExplanationsToOld(
      newData.perAnswerExplanations
    ),
    explanation: convertNewBlocksToOld(newData.mainExplanation),
    subject: newData.metadata.subject,
    system: newData.metadata.system,
    systemId: newData.metadata.systemId,
    productId: newData.metadata.productId,
    topicId: newData.metadata.topicId,
    subtopicId: newData.metadata.subtopicId,
    title: newData.metadata.title,
    categoryId: newData.metadata.categoryId,
    productTagId:
      newData.metadata.categoryId ||
      newData.metadata.productTagId ||
      (newData.metadata.productTagIds && newData.metadata.productTagIds.length > 0
        ? newData.metadata.productTagIds[0]
        : undefined),
    productTagIds: newData.metadata.productTagIds,
    tags: newData.metadata.tags || [],
    isDemo: Boolean(newData.metadata.isDemo),
    demoPack: newData.metadata.isDemo ? newData.metadata.demoPack || null : null,
    metadata: {
      questionId: newData.metadata.questionId,
    },
  }
}

// Helper functions

function convertOldTypeToNew(oldType: string): ContentBlock["type"] {
  const typeMap: Record<string, ContentBlock["type"]> = {
    text: "text",
    TEXT: "text",
    table: "table",
    TABLE: "table",
    images: "image",
    IMAGES: "image",
    image: "image",
    IMAGE: "image",
    "per-answer-explanation": "per-answer-explanation",
    "PER_ANSWER_EXPLANATION": "per-answer-explanation",
    "internal-link": "internal-link",
    "external-link": "external-link",
  }
  return typeMap[oldType] || "text"
}

function convertNewTypeToOld(newType: ContentBlock["type"]): string {
  const typeMap: Record<ContentBlock["type"], string> = {
    text: "TEXT",
    table: "TABLE",
    image: "IMAGES",
    images: "IMAGES",
    "internal-link": "TEXT", // Internal links stored as TEXT in old format
    "external-link": "TEXT", // External links stored as TEXT in old format
    "per-answer-explanation": "PER_ANSWER_EXPLANATION", // Per-answer explanation placeholder
  }
  return typeMap[newType] || "TEXT"
}

function convertOldDataToNew(oldType: string, oldData: any): any {
  const normalizedType = oldType?.toLowerCase()

  if (normalizedType === "text" || normalizedType === "TEXT") {
    // If we have markdown but no HTML, keep markdown - TextEditor will convert it
    return {
      html: oldData?.html || "",
      markdown: oldData?.markdown || oldData?.content || "",
    }
  }

  if (normalizedType === "table" || normalizedType === "TABLE") {
    // Preserve all table data - TableEditor will convert rows/cols/cells to HTML if needed
    return {
      tableHtml: oldData?.html || oldData?.tableHtml || "",
      rows: oldData?.rows || 3,
      cols: oldData?.cols || 3,
      cells: oldData?.cells || {},
    }
  }

  if (normalizedType === "images" || normalizedType === "image" || normalizedType === "IMAGE" || normalizedType === "IMAGES") {
    // Convert old image format (array of strings) to new format (array of objects)
    // But also handle if it's already in object format
    let images: Array<{ url: string; alt?: string; id?: string }> = []
    if (Array.isArray(oldData?.images)) {
      images = oldData.images.map((img: any, idx: number) => {
        if (typeof img === "object" && img !== null && img.url) {
          // Already in object format
          return {
            url: img.url,
            alt: img.alt || `Image ${idx + 1}`,
            id: img.id || `img-${Date.now()}-${idx}`,
          }
        }
        if (typeof img === "string" && img.trim()) {
          // String URL format
          return {
            url: img,
            alt: `Image ${idx + 1}`,
            id: `img-${Date.now()}-${idx}`,
          }
        }
        return null
      }).filter((img: any) => img !== null) as Array<{ url: string; alt?: string; id?: string }>
    }
    return {
      images,
      count: oldData?.count || images.length || 2,
    }
  }

  if (normalizedType === "per-answer-explanation" || normalizedType === "PER_ANSWER_EXPLANATION") {
    // Handle per-answer-explanation placeholder
    // Preserve allChoices flag if it exists
    return {
      placeholder: true,
      isPerAnswerExplanation: true,
      allChoices: oldData?.allChoices === true || true, // Default to true for all choices block
    }
  }
  
  // Also check if it's a TEXT block with per-answer-explanation markers
  // (This case is now handled in convertOldBlocksToNew before calling convertOldDataToNew)
  if (normalizedType === "text" || normalizedType === "TEXT") {
    if (oldData?.placeholder === true || oldData?.isPerAnswerExplanation === true || oldData?.allChoices === true) {
      // This is a per-answer-explanation placeholder saved as TEXT
      return {
        placeholder: true,
        isPerAnswerExplanation: true,
        allChoices: oldData?.allChoices === true || true,
      }
    }
  }

  return oldData || {}
}

function convertNewDataToOld(newType: ContentBlock["type"], newData: any): any {
  if (newType === "text") {
    return {
      html: newData?.html || "",
      markdown: newData?.markdown || "",
    }
  }

  if (newType === "table") {
    return {
      html: newData?.tableHtml || "",
      rows: newData?.rows || 3,
      cols: newData?.cols || 3,
      cells: newData?.cells || {}, // Preserve cells object - this contains the actual table content!
    }
  }

  if (newType === "image") {
    // Convert new image format (array of objects) to old format (array of strings)
    const images = Array.isArray(newData?.images)
      ? newData.images.map((img: any) => (typeof img === "object" ? img.url : img))
      : []
    return {
      images,
      count: newData?.count || images.length || 2,
    }
  }

  // For internal-link and external-link, store as text with special markers
  if (newType === "internal-link" || newType === "external-link") {
    return {
      html: `<a href="${newType === "internal-link" ? `#${newData?.targetId}` : newData?.url || ""}" ${newData?.openInNewTab ? 'target="_blank"' : ""}>${newData?.linkText || ""}</a>`,
      markdown: `[${newData?.linkText || ""}](${newType === "internal-link" ? `#${newData?.targetId}` : newData?.url || ""})`,
      linkType: newType,
      ...newData,
    }
  }

  // For per-answer-explanation placeholder
  if (newType === "per-answer-explanation") {
    return {
      placeholder: true,
      isPerAnswerExplanation: true,
      allChoices: newData?.allChoices === true || true, // Preserve allChoices flag
    }
  }

  return newData || {}
}

export function convertOldOptionsToChoices(oldOptions: any[]): Choice[] {
  if (!Array.isArray(oldOptions)) return []

  return oldOptions.map((opt) => ({
    label: opt.label || String.fromCharCode(65 + oldOptions.indexOf(opt)),
    text: opt.text || "",
    correct: opt.correct || false,
    value: opt.value || opt.label || String.fromCharCode(65 + oldOptions.indexOf(opt)),
  }))
}

export function convertChoicesToOldOptions(choices: Choice[]): any[] {
  if (!Array.isArray(choices)) return []

  return choices.map((choice, index) => ({
    label: choice.label,
    text: choice.text,
    correct: choice.correct,
    value: choice.value || choice.label,
    order: index,
  }))
}

export function convertOldPerAnswerExplanationsToNew(
  oldExplanations: Record<string, any> | any[]
): Record<string, ContentBlock[]> {
  if (Array.isArray(oldExplanations)) {
    // Old format: array of { choiceLabel, blocks }
    const result: Record<string, ContentBlock[]> = {}
    oldExplanations.forEach((item: any) => {
      if (item?.choiceLabel && Array.isArray(item.blocks)) {
        result[item.choiceLabel] = convertOldBlocksToNew(item.blocks)
      }
    })
    return result
  }

  if (typeof oldExplanations === "object" && oldExplanations !== null) {
    // Already in Record format, but might have old block format
    const result: Record<string, ContentBlock[]> = {}
    Object.entries(oldExplanations).forEach(([label, blocks]) => {
      if (Array.isArray(blocks)) {
        result[label] = convertOldBlocksToNew(blocks)
      } else {
        result[label] = []
      }
    })
    return result
  }

  return {}
}

export function convertNewPerAnswerExplanationsToOld(
  newExplanations: Record<string, ContentBlock[]>
): Record<string, any[]> {
  const result: Record<string, any[]> = {}
  Object.entries(newExplanations).forEach(([label, blocks]) => {
    if (Array.isArray(blocks) && blocks.length > 0) {
      result[label] = convertNewBlocksToOld(blocks)
    }
  })
  return result
}




