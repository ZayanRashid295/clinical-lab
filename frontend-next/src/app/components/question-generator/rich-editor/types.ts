/**
 * Content block types for rich content editing
 * These types are used across the question generator for stem, explanations, and per-answer explanations
 */

export type BlockType = 
  | "text" 
  | "table" 
  | "image" 
  | "images"
  | "internal-link" 
  | "external-link" 
  | "per-answer-explanation"

export interface ContentBlock {
  id: string
  type: BlockType
  order: number
  data: {
    html?: string
    markdown?: string
    [key: string]: any
  }
}

/**
 * Generate a unique block ID
 */
export function generateBlockId(): string {
  return `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Get default data for a block type
 */
export function getDefaultDataForType(type: BlockType): any {
  switch (type) {
    case "text":
      return {
        html: "<p></p>",
        markdown: "",
      }
    case "table":
      return {
        tableHtml: "<table><tr><th></th></tr><tr><td></td></tr></table>",
      }
    case "image":
    case "images":
      return {
        images: [],
      }
    case "internal-link":
      return {
        questionId: "",
        text: "",
      }
    case "external-link":
      return {
        url: "",
        text: "",
      }
    case "per-answer-explanation":
      return {
        placeholder: true,
        isPerAnswerExplanation: true,
        allChoices: true,
      }
    default:
      return {}
  }
}
