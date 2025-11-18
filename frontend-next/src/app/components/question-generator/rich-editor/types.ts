// Unified types for the new RichEditor system

export type BlockType = 'text' | 'table' | 'image' | 'internal-link' | 'external-link' | 'per-answer-explanation'

export interface ContentBlock {
  id: string
  type: BlockType
  data: BlockData
  order: number
}

export interface BlockData {
  // Text block
  html?: string
  markdown?: string
  
  // Table block
  tableHtml?: string
  rows?: number
  cols?: number
  
  // Image block
  images?: Array<{ url: string; alt?: string; id?: string }>
  count?: number
  
  // Internal Link block
  targetId?: string
  targetType?: 'question' | 'topic' | 'chapter' | 'section'
  linkText?: string
  description?: string
  
  // External Link block
  url?: string
  linkText?: string
  description?: string
  openInNewTab?: boolean
  
  // Per-Answer Explanation placeholder
  placeholder?: boolean
  isPerAnswerExplanation?: boolean
}

export interface RichEditorProps {
  blocks: ContentBlock[]
  onChange: (blocks: ContentBlock[]) => void
  placeholder?: string
  disabled?: boolean
}

// Helper function to generate unique IDs
export function generateBlockId(): string {
  return `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Helper function to get default data for a block type
export function getDefaultDataForType(type: BlockType): BlockData {
  switch (type) {
    case 'text':
      return { html: '', markdown: '' }
    case 'table':
      return { tableHtml: '', rows: 3, cols: 3 }
    case 'image':
      return { images: [], count: 2 }
    case 'internal-link':
      return { linkText: '', targetType: 'question' }
    case 'external-link':
      return { url: '', linkText: '', openInNewTab: true }
    case 'per-answer-explanation':
      return { placeholder: true, isPerAnswerExplanation: true }
    default:
      return {}
  }
}





