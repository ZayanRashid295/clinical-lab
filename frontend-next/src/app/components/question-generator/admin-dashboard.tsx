"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Search } from "lucide-react"
import { useLayoutHeaderLeading } from "@/shared/contexts/LayoutHeaderLeadingContext"
import { Card } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import QuestionList from "./question-list"
import { useConfirm } from "@/hooks/useConfirm"
import { useToast } from "@/shared/ui/use-toast"
import MarkdownUploader from "./markdown-uploader"
import BulkMarkdownUploader from "./bulk-markdown-uploader"
import DocxUploader from "./docx-uploader"
import BulkDocxUploader from "./bulk-docx-uploader"
import QuestionBuilderUploader, {
  type SaveQuestionOptions,
} from "./question-builder-uploader"
import AdminQuestionView from "./admin-question-view"
import QuestionCreator from "./question-creator/QuestionCreator"
import { QuestionCreatorData } from "./question-creator/types"
import { convertOldQuestionToNew, convertNewQuestionToOld, convertNewBlocksToOld, convertChoicesToOldOptions, convertNewPerAnswerExplanationsToOld } from "./migration-utils"
import { blocksToHTML } from "./unified-editor/content-utils"
import { QuestionsService } from "@/app/services/questions/questions.service"
import { QuestionChoice } from "@/app/types/question"
import { CreateQuestionDto } from "@/app/types/question"
import { authService } from "@/shared/services/auth.service"
import { useLanguage } from "@/shared/contexts/LanguageContext"
import { QuestionBankListHeader } from "./QuestionBankListHeader"
import {
  ApiHttpError,
  getApiErrorMessage,
} from "@/app/services/base/api-http-error"
import {
  mergeResolvedMetadata,
  resolveCreatorMetadataIds,
} from "./resolve-creator-metadata"

interface Question {
  id: string
  questionId?: string | null // Optional question ID stored in metadata/tags
  stem: string
  options: Array<{ label: string; text: string; correct: boolean; value?: string }>
  choices?: QuestionChoice[] // Backend uses 'choices'
  subject: string
  category?: string
  product?: string
  system: string
  subtopicName?: string
  mcqTitle?: string
  explanation: any
  perAnswerExplanations?: Record<string, any[]> // Per-answer explanations in frontend format
  tags: string[]
  createdAt: number | string
  topicId?: string // Required for backend
  subtopicId?: string
  systemId?: string
  questionStemBlocks?: any[] // Rich content blocks for question stem
  chapterId?: string // legacy
  productId?: string // Product ID
  chapterName?: string
  topicName?: string
  categoryId?: string // New 5-level hierarchy: Category -> Product -> System -> Topic -> Subtopic
  productTagId?: string // Deprecated: use categoryId instead
  productTagIds?: string[] // Deprecated: use categoryId instead
  topic?: any // Topic object or string
}

interface AdminDashboardProps {
  onQuestionViewChange?: (questionId: string | null, dbId: string | null, isViewing: boolean) => void
  onEditorPreviewModeChange?: (isPreview: boolean) => void
}

export default function AdminDashboard({ onQuestionViewChange, onEditorPreviewModeChange }: AdminDashboardProps) {
  const { t } = useLanguage()
  const { toast } = useToast()
  const { confirm } = useConfirm()
  const [questions, setQuestions] = useState<Question[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [showNewQuestion, setShowNewQuestion] = useState(false)
  const [showMarkdownUploader, setShowMarkdownUploader] = useState(false)
  const [showBulkUploader, setShowBulkUploader] = useState(false)
  const [showDocxUploader, setShowDocxUploader] = useState(false)
  const [showBulkDocxUploader, setShowBulkDocxUploader] = useState(false)
  const [showQuestionBuilder, setShowQuestionBuilder] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [systemFilter, setSystemFilter] = useState<"all" | string>("all")
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [parsedMarkdownData, setParsedMarkdownData] = useState<any>(null)
  const [showNewQuestionMenu, setShowNewQuestionMenu] = useState(false)
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([])
  const menuRef = useRef<HTMLDivElement>(null)
  const questionsService = useMemo(() => new QuestionsService(), [])
  const layoutHeader = useLayoutHeaderLeading()

  const showListSearchInHeader =
    !showNewQuestion &&
    !editingId &&
    !viewingId &&
    !showMarkdownUploader &&
    !showBulkUploader &&
    !showDocxUploader &&
    !showBulkDocxUploader &&
    !showQuestionBuilder

  useEffect(() => {
    if (!layoutHeader) return
    const { setLeadingContent } = layoutHeader
    if (!showListSearchInHeader) {
      setLeadingContent(null)
      return
    }
    setLeadingContent(() => (
      <div className="w-full flex items-center min-w-0 max-w-full lg:max-w-2xl xl:max-w-3xl">
        <div className="relative w-full flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 shadow-sm">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 shrink-0 pointer-events-none"
            size={16}
            aria-hidden
          />
          <input
            type="text"
            placeholder={t("questionGenerator.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-2 py-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-md min-w-0"
            aria-label="Search questions"
          />
        </div>
      </div>
    ))
  }, [layoutHeader, showListSearchInHeader, searchTerm, t])

  useEffect(() => {
    return () => {
      layoutHeader?.setLeadingContent(null)
    }
  }, [layoutHeader])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowNewQuestionMenu(false)
      }
    }

    if (showNewQuestionMenu) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showNewQuestionMenu])

  // Transform backend question to frontend format
  const transformBackendToFrontend = (backendQuestion: any): Question => {
    const choices = backendQuestion.choices || []
    const options = choices.map((choice: any, index: number) => ({
      label: String.fromCharCode(65 + index), // A, B, C, D, E
      text: choice.text,
      correct: choice.isCorrect,
      value: String.fromCharCode(65 + index),
    }))

    // Transform explanation blocks from backend format to frontend format
    const explanationBlocks = backendQuestion.explanationBlocks || []
    const transformedExplanation = Array.isArray(explanationBlocks) ? explanationBlocks.map((block: any, index: number) => {
      if (!block) return null
      
      // Check for per-answer-explanation placeholder
      // Check for placeholder, isPerAnswerExplanation, or allChoices flags
      if (block.data && (
        block.data.placeholder === true || 
        block.data.isPerAnswerExplanation === true ||
        block.data.allChoices === true
      )) {
        return {
          // Don't include id - backend doesn't accept it during creation
          type: "per-answer-explanation",
          order: typeof block.order === "number" ? block.order : index,
          data: { 
            placeholder: true,
            isPerAnswerExplanation: true,
            allChoices: true, // Mark as containing all choices
          },
        }
      }
      
      // Transform block types to lowercase and ensure proper structure
      if (block.type === "TEXT") {
        const blockData = block.data || {}
        // Ensure HTML and markdown are preserved
        // If we have markdown but no HTML, the editor will convert it
        return {
          id: block.id || `text-${Date.now()}-${index}`, // Preserve ID if available
          type: "text",
          order: typeof block.order === "number" ? block.order : index,
          data: {
            html: blockData.html || "", // Preserve HTML if available
            markdown: blockData.markdown || blockData.content || "", // Preserve markdown
            ...blockData, // Preserve other fields
          },
        }
      } else if (block.type === "TABLE") {
        return {
          // Don't include id - backend doesn't accept it during creation
          type: "table",
          order: typeof block.order === "number" ? block.order : index,
          data: block.data || {},
        }
      } else if (block.type === "IMAGES") {
        return {
          // Don't include id - backend doesn't accept it during creation
          type: "images",
          order: typeof block.order === "number" ? block.order : index,
          data: block.data || {},
        }
      } else {
        // Already in frontend format or unknown type
        return {
          ...block,
          order: typeof block.order === "number" ? block.order : index,
        }
      }
    }).filter((b: any) => b !== null).sort((a: any, b: any) => {
      // Sort by order to maintain block sequence
      const orderA = typeof a.order === "number" ? a.order : 999
      const orderB = typeof b.order === "number" ? b.order : 999
      return orderA - orderB
    }) : []

    // Transform question stem blocks from backend format to frontend format
    const questionStemBlocks = Array.isArray(backendQuestion.questionStemBlocks) && backendQuestion.questionStemBlocks.length > 0
      ? backendQuestion.questionStemBlocks
          .filter((block: any) => block != null) // Filter out null/undefined first
          .map((block: any, index: number) => {
            // Determine the type - handle both uppercase and lowercase
            let blockType = "text"
            if (block.type === "TEXT" || block.type === "text") {
              blockType = "text"
            } else if (block.type === "TABLE" || block.type === "table") {
              blockType = "table"
            } else if (block.type === "IMAGES" || block.type === "image" || block.type === "images" || block.type === "IMAGE") {
              blockType = "image" // Frontend uses "image" not "images"
            } else if (block.type) {
              blockType = block.type.toLowerCase()
            }
            
            // Preserve block data - ensure it's an object
            let blockData: any = {}
            if (block.data && typeof block.data === "object" && block.data !== null) {
              blockData = { ...block.data }
            } else if (block.data) {
              blockData = { content: block.data }
            }
            
            // Handle table blocks - ensure html is preserved from tableHtml
            if (blockType === "table") {
              // If we have tableHtml from backend, also set it as html for frontend
              if (blockData.tableHtml && !blockData.html) {
                blockData.html = blockData.tableHtml
              }
            }
            
            // Handle text blocks - check if markdown contains a table and convert it
            if (blockType === "text" && blockData.markdown) {
              // Check if markdown contains a table
              const markdownText = typeof blockData.markdown === "string" ? blockData.markdown : ""
              if (markdownText.includes("|") && markdownText.match(/^\|.+\|/m)) {
                // Markdown table detected - ensure we have HTML version
                // If HTML is missing or contains raw markdown, we'll convert it in the editor
                if (!blockData.html || (blockData.html.includes("|") && !blockData.html.includes("<table"))) {
                  // HTML is missing or contains raw markdown - will be converted in editor
                  // Keep markdown for now, editor will handle conversion
                }
              }
              // Also preserve tableHtml for backward compatibility
              if (blockData.html && !blockData.tableHtml) {
                blockData.tableHtml = blockData.html
              }
            }
            
            // Handle image blocks - ensure images array is properly formatted
            if (blockType === "image" && blockData.images) {
              // Ensure images is an array
              if (!Array.isArray(blockData.images)) {
                blockData.images = []
              }
              // Convert to object format with url property (frontend expects objects)
              blockData.images = blockData.images.map((img: any, imgIdx: number) => {
                if (typeof img === "object" && img !== null && img.url) {
                  // Already in object format with url
                  return {
                    url: img.url,
                    alt: img.alt || `Image ${imgIdx + 1}`,
                    id: img.id || `img-${Date.now()}-${imgIdx}`,
                  }
                }
                if (typeof img === "string" && img.trim()) {
                  // String URL - convert to object
                  return {
                    url: img,
                    alt: `Image ${imgIdx + 1}`,
                    id: `img-${Date.now()}-${imgIdx}`,
                  }
                }
                return null
              }).filter((img: any) => img !== null)
              
              // Ensure count matches
              if (!blockData.count || blockData.count < blockData.images.length) {
                blockData.count = Math.max(blockData.images.length, 2)
              }
            }
            
            return {
              // Don't include id - backend doesn't accept it during creation
              type: blockType,
              data: blockData,
              order: typeof block.order === "number" ? block.order : index, // Preserve order
            }
          })
          .sort((a: any, b: any) => {
            // Sort by order to maintain block sequence
            const orderA = typeof a.order === "number" ? a.order : 999
            const orderB = typeof b.order === "number" ? b.order : 999
            return orderA - orderB
          })
      : []
    

    // Transform per-answer explanations from backend format to frontend format
    // Backend format: Array of { choiceLabel: "A", blocks: [...] }
    // Frontend format: Record<string, any[]> where key is option label
    const transformedPerAnswerExplanations: Record<string, any[]> = {}
    
    // Transform backend per-answer explanations if they exist
    if (backendQuestion.perAnswerExplanations && Array.isArray(backendQuestion.perAnswerExplanations)) {
      for (const pae of backendQuestion.perAnswerExplanations) {
        if (!pae || !pae.choiceLabel) continue
        
        const blocks = Array.isArray(pae.blocks) ? pae.blocks : []
        
        // Check if we have rich content blocks (TABLE, IMAGES) or just TEXT
        const hasRichContent = blocks.some((b: any) => b && (b.type === "TABLE" || b.type === "IMAGES"))
        
        if (hasRichContent) {
          // Transform to frontend block format
          const transformedBlocks = blocks
            .filter((b: any) => b != null)
            .map((b: any) => {
              const blockData = b.data || {}

              if (b.type === "TEXT") {
                // Ensure HTML and markdown are preserved
                // If we have markdown but no HTML, the editor will convert it
                return {
                  id: b.id || `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  type: "text",
                  order: typeof b.order === "number" ? b.order : 0,
                  data: {
                    html: blockData.html || "", // Preserve HTML if available
                    markdown: blockData.markdown || blockData.content || "", // Preserve markdown
                    ...blockData, // Preserve other fields
                  },
                }
              } else if (b.type === "TABLE") {
                const tableBlockData = b.data || {}
                return {
                  id: b.id || `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  type: "table",
                  order: typeof b.order === "number" ? b.order : 0,
                  data: {
                    html: tableBlockData.html || tableBlockData.tableHtml || "",
                    tableHtml: tableBlockData.tableHtml || tableBlockData.html || "",
                    markdown: tableBlockData.markdown || "",
                    ...tableBlockData,
                  },
                }
              } else if (b.type === "IMAGES") {
                const imageBlockData = b.data || {}
                return {
                  id: b.id || `images-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  type: "images",
                  order: typeof b.order === "number" ? b.order : 0,
                  data: imageBlockData,
                }
              }
              // Default fallback
              return {
                id: b.id || `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: "text",
                order: typeof b.order === "number" ? b.order : 0,
                data: blockData,
              }
            })
        } else {
          // Simple text explanation - convert to text blocks for consistency
          const textBlocks = blocks
            .filter((b: any) => b != null && b.type === "TEXT")
            .map((b: any) => {
              const blockData = b.data || {}
              let markdown = ""
              if (typeof blockData === "string") {
                markdown = blockData
              } else if (blockData.markdown) {
                markdown = blockData.markdown
              } else if (blockData.content) {
                markdown = blockData.content
              } else if (blockData.html) {
                markdown = blockData.html
              }
              return markdown
            })
            .filter((text: string) => text != null && text.trim().length > 0)
          
          if (textBlocks.length > 0) {
            // Convert text strings to text blocks
            // Don't wrap markdown in HTML - let the editor convert it properly
            // If text is already HTML, use it; otherwise leave html empty so markdown conversion happens
            transformedPerAnswerExplanations[pae.choiceLabel] = textBlocks.map((text: string, idx: number) => {
              // Check if text is already HTML
              const isHtml = text.trim().startsWith("<") && text.trim().includes(">")
              
              return {
                id: `text-${Date.now()}-${idx}-${Math.random()}`,
                type: "text",
                order: idx,
                data: { 
                  // Only set html if it's already HTML, otherwise leave empty for markdown conversion
                  html: isHtml ? text : "",
                  markdown: text, // Always preserve markdown
                },
              }
            })
          }
        }
      }
    }
    
    // Also check if perAnswerExplanations is already in frontend format (Record)
    // This handles cases where the question was already transformed
    if (backendQuestion.perAnswerExplanations && !Array.isArray(backendQuestion.perAnswerExplanations)) {
      Object.keys(backendQuestion.perAnswerExplanations).forEach((label) => {
        const value = backendQuestion.perAnswerExplanations[label]
        if (Array.isArray(value) && value.length > 0) {
          transformedPerAnswerExplanations[label] = value
        }
      })
    }

    // Extract questionId and productTagIds from tags if stored there
    let storedQuestionId: string | null = null
    let storedProductName: string | null = null
    let storedMcqTitle: string | null = null
    let storedProductTagIds: string[] | undefined = undefined
    const tags = Array.isArray(backendQuestion.tags) ? backendQuestion.tags : []
    const filteredTags: string[] = []
    
    for (const tag of tags) {
      if (typeof tag === "string" && tag.startsWith("__questionId:")) {
        storedQuestionId = tag.replace("__questionId:", "")
      } else if (typeof tag === "string" && tag.startsWith("__product:")) {
        storedProductName = tag.replace("__product:", "").trim()
      } else if (typeof tag === "string" && tag.startsWith("__mcqTitle:")) {
        storedMcqTitle = tag.replace("__mcqTitle:", "").trim()
      } else if (typeof tag === "string" && tag.startsWith("__productTagIds:")) {
        try {
          const tagIdsJson = tag.replace("__productTagIds:", "")
          storedProductTagIds = JSON.parse(tagIdsJson)
        } catch (e) {
          console.warn("Failed to parse productTagIds from tags:", e)
        }
      } else {
        filteredTags.push(String(tag))
      }
    }
    
    // Use stored productTagIds or fallback to single productTagId/categoryId
    const categoryId = backendQuestion.categoryId || backendQuestion.productTagId
    const productTagIds = storedProductTagIds || (categoryId ? [categoryId] : undefined)
    
    const chapterName = backendQuestion.chapter?.name ?? backendQuestion.topic?.chapter?.name ?? ""
    const topicName = backendQuestion.topic?.name ?? ""
    const subtopicName = backendQuestion.subtopic?.name ?? ""
    // Subject = product tag name for display
    const subjectDisplay = backendQuestion.productTag?.name ?? backendQuestion.subject ?? ""
    const categoryDisplay = backendQuestion.category?.name ?? subjectDisplay
    const productDisplay = backendQuestion.system?.product?.name ?? storedProductName ?? ""

    return {
      id: backendQuestion.id,
      questionId: storedQuestionId || backendQuestion.metadata?.questionId || backendQuestion.questionId || null,
      stem: backendQuestion.question || "",
      questionStemBlocks,
      options,
      choices: backendQuestion.choices,
      subject: subjectDisplay,
      category: categoryDisplay,
      product: productDisplay,
      system: (typeof backendQuestion.system === 'string' ? backendQuestion.system : backendQuestion.system?.name) || "",
      systemId: backendQuestion.systemId || backendQuestion.system?.id || "",
      subtopicName,
      mcqTitle: storedMcqTitle || backendQuestion.title || "",
      chapterId: backendQuestion.chapterId || "", // legacy fallback
      categoryId: backendQuestion.categoryId || backendQuestion.productTagId || "",
      productId: backendQuestion.system?.product?.id || backendQuestion.productId || "",
      chapterName,
      topicName,
      productTagId: backendQuestion.productTagId || "",
      productTagIds: productTagIds,
      explanation: transformedExplanation,
      perAnswerExplanations: transformedPerAnswerExplanations,
      tags: filteredTags, // Return tags without the questionId and productTagIds markers
      createdAt: backendQuestion.createdAt,
      topicId: backendQuestion.topicId,
      subtopicId: backendQuestion.subtopicId || "",
      topic: backendQuestion.topic,
    }
  }

  // Transform frontend question to backend format
  const transformFrontendToBackend = (frontendQuestion: any, topicId: string): CreateQuestionDto => {
    const choices = frontendQuestion.options.map((opt: any, index: number) => ({
      text: opt.text,
      isCorrect: opt.correct,
      order: index,
    }))

    // Transform explanation blocks - ensure proper format
    const explanationBlocks = Array.isArray(frontendQuestion.explanation) && frontendQuestion.explanation.length > 0
      ? frontendQuestion.explanation
          .filter((block: any) => block != null)
          .map((block: any, idx: number) => {
          // Handle per-answer-explanation placeholder blocks
            if (block.type === "per-answer-explanation" || (block.data && (block.data.placeholder === true || block.data.allChoices === true))) {
              // Save as TEXT block with special marker
              return {
                type: "TEXT" as const,
                order: typeof block.order === "number" ? block.order : idx,
                data: { 
                  placeholder: true, 
                  isPerAnswerExplanation: true,
                  allChoices: block.data?.allChoices === true || true, // Preserve allChoices flag
                },
              }
            }
            
          // Handle different explanation formats
            let blockData: any = {}
            
            if (block.data && typeof block.data === "object" && block.data !== null) {
              // Deep clone to avoid circular references and ensure it's plain JSON
              try {
                blockData = JSON.parse(JSON.stringify(block.data))
                // Ensure it's still an object (not null, not array if it shouldn't be)
                if (typeof blockData !== "object" || blockData === null) {
                  blockData = {}
                }
                
                // Handle image blocks - ensure images array is properly formatted
                if (block.type === "IMAGES" || block.type === "image" || block.type === "images") {
                  // Convert image objects to URL strings if needed
                  if (Array.isArray(blockData.images)) {
                    blockData.images = blockData.images.map((img: any) => {
                      if (typeof img === "object" && img !== null && img.url) {
                        return img.url
                      }
                      return typeof img === "string" ? img : ""
                    }).filter((url: string) => url && url.trim())
                  }
                  // Ensure count matches actual images
                  if (blockData.count && Array.isArray(blockData.images)) {
                    blockData.count = Math.max(blockData.count, blockData.images.length)
                  }
                }
              } catch (e) {
                console.warn("Failed to clone block.data, using empty object:", e)
                blockData = {}
              }
            } else if (block.content) {
              blockData = { markdown: String(block.content) }
            } else if (block.markdown) {
              blockData = { markdown: String(block.markdown) }
            } else {
              blockData = {}
            }
            
            // Ensure type is valid enum value
            const validTypes = ["TEXT", "TABLE", "IMAGES"] as const
            let blockType: "TEXT" | "TABLE" | "IMAGES" = "TEXT"
            if (block.type) {
              const upperType = String(block.type).toUpperCase()
              // Map "image" to "IMAGES" for consistency
              if (upperType === "IMAGE") {
                blockType = "IMAGES"
              } else if (validTypes.includes(upperType as any)) {
                blockType = upperType as "TEXT" | "TABLE" | "IMAGES"
              }
            }
            
            // Handle table blocks - ensure tableHtml is present
            if (blockType === "TABLE") {
              if (!blockData.tableHtml && blockData.html) {
                blockData.tableHtml = blockData.html
              }
              if (!blockData.tableHtml) {
                // Create empty table HTML if missing
                blockData.tableHtml = "<table><tr><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td></tr></table>"
              }
              // Ensure table structure fields
              if (!blockData.rows) blockData.rows = 3
              if (!blockData.cols) blockData.cols = 3
              if (!blockData.cells) blockData.cells = {}
            }
            
            // Clean up data - remove any undefined or null values that might cause issues
            const cleanedData: any = {}
            for (const [key, value] of Object.entries(blockData)) {
              if (value !== undefined && value !== null) {
                cleanedData[key] = value
              }
            }
            
            return {
              type: blockType,
              order: typeof block.order === "number" ? block.order : idx,
              data: cleanedData,
              // Don't include id - backend doesn't accept it during creation
            }
          })
      : undefined

    // Transform per-answer explanations - ensure proper format
    const perAnswerExplanations: Record<string, Array<{ type: "TEXT" | "TABLE" | "IMAGES"; order?: number; data: any }>> = {}
    if (frontendQuestion.perAnswerExplanations && typeof frontendQuestion.perAnswerExplanations === "object") {
      for (const [label, blocks] of Object.entries(frontendQuestion.perAnswerExplanations)) {
        if (Array.isArray(blocks) && blocks.length > 0) {
          perAnswerExplanations[label] = blocks
            .filter((b: any) => b != null)
            .map((b: any, idx: number) => {
              let blockData: any = {}
              
              if (b.data && typeof b.data === "object" && b.data !== null) {
                try {
                  blockData = JSON.parse(JSON.stringify(b.data))
                  if (typeof blockData !== "object" || blockData === null) {
                    blockData = {}
                  }
                  
                  // Handle image blocks - ensure images array is properly formatted
                  if (b.type === "IMAGES" || b.type === "image" || b.type === "images") {
                    // Convert image objects to URL strings if needed
                    if (Array.isArray(blockData.images)) {
                      blockData.images = blockData.images.map((img: any) => {
                        if (typeof img === "object" && img !== null && img.url) {
                          return img.url
                        }
                        return typeof img === "string" ? img : ""
                      }).filter((url: string) => url && url.trim())
                    }
                    // Ensure count matches actual images
                    if (blockData.count && Array.isArray(blockData.images)) {
                      blockData.count = Math.max(blockData.count, blockData.images.length)
                    }
                  }
                } catch (e) {
                  blockData = {}
                }
              } else if (b.content) {
                blockData = { markdown: String(b.content) }
              } else if (b.markdown) {
                blockData = { markdown: String(b.markdown) }
              } else {
                blockData = {}
              }
              
              const validTypes = ["TEXT", "TABLE", "IMAGES"] as const
              let blockType: "TEXT" | "TABLE" | "IMAGES" = "TEXT"
              if (b.type) {
                const upperType = String(b.type).toUpperCase()
                // Map "image" to "IMAGES" for consistency
                if (upperType === "IMAGE") {
                  blockType = "IMAGES"
                } else if (validTypes.includes(upperType as any)) {
                  blockType = upperType as "TEXT" | "TABLE" | "IMAGES"
            }
          }
              
          return {
                type: blockType,
                order: typeof b.order === "number" ? b.order : idx,
                data: blockData,
                // Don't include id - backend doesn't accept it during creation
          }
        })
        }
      }
    }

    // Transform question stem blocks - ensure proper format
    const questionStemBlocks = Array.isArray(frontendQuestion.questionStemBlocks) && frontendQuestion.questionStemBlocks.length > 0
      ? frontendQuestion.questionStemBlocks
          .filter((block: any) => block != null)
          .map((block: any, idx: number) => {
            let blockData: any = {}
            
            if (block.data && typeof block.data === "object" && block.data !== null) {
              try {
                blockData = JSON.parse(JSON.stringify(block.data))
                if (typeof blockData !== "object" || blockData === null) {
                  blockData = {}
                }
                
                // Handle image blocks - ensure images array is properly formatted
                const blockTypeUpper = String(block.type || "").toUpperCase()
                if (blockTypeUpper === "IMAGES" || blockTypeUpper === "IMAGE") {
                  // Convert image objects to URL strings if needed
                  if (Array.isArray(blockData.images)) {
                    blockData.images = blockData.images.map((img: any) => {
                      if (typeof img === "object" && img !== null && img.url) {
                        return img.url
                      }
                      return typeof img === "string" ? img : ""
                    }).filter((url: string) => url && url.trim())
                  }
                  // Ensure count matches actual images
                  if (Array.isArray(blockData.images)) {
                    blockData.count = blockData.images.length
                  } else {
                    blockData.count = 0
                  }
                }
                
                // Ensure text blocks have at least empty html/markdown
                if (blockTypeUpper === "TEXT") {
                  if (!blockData.html && !blockData.markdown) {
                    blockData.html = ""
                    blockData.markdown = ""
                  }
                }
                
                // Ensure table blocks have proper structure
                if (blockTypeUpper === "TABLE") {
                  // Use html if tableHtml is missing
                  if (!blockData.tableHtml && blockData.html) {
                    blockData.tableHtml = blockData.html
                    delete blockData.html
                  }
                  // Ensure tableHtml exists (even if empty)
                  if (!blockData.tableHtml) {
                    blockData.tableHtml = "<table><tr><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td></tr></table>"
                  }
                  // Ensure table structure fields
                  if (!blockData.rows) blockData.rows = 3
                  if (!blockData.cols) blockData.cols = 3
                  if (!blockData.cells) blockData.cells = {}
                }
              } catch (e) {
                console.warn("Failed to clone block.data for question stem:", e)
                blockData = {}
              }
            } else if (block.content) {
              blockData = { markdown: String(block.content), html: "" }
            } else if (block.markdown) {
              blockData = { markdown: String(block.markdown), html: "" }
            } else {
              blockData = {}
            }
            
            const validTypes = ["TEXT", "IMAGES", "TABLE"] as const
            let blockType: "TEXT" | "IMAGES" | "TABLE" = "TEXT"
            if (block.type) {
              const upperType = String(block.type).toUpperCase()
              // Map "image" to "IMAGES" for consistency
              if (upperType === "IMAGE") {
                blockType = "IMAGES"
              } else if (validTypes.includes(upperType as any)) {
                blockType = upperType as "TEXT" | "IMAGES" | "TABLE"
              }
            }
            
            // Remove id from block - backend doesn't expect it in create
            return {
              type: blockType,
              order: typeof block.order === "number" ? block.order : idx,
              data: blockData,
            }
          })
      : undefined

    // Generate question text from stem blocks if stem is empty
    let questionText = String(frontendQuestion.stem || "")
    if (!questionText.trim() && Array.isArray(frontendQuestion.questionStemBlocks) && frontendQuestion.questionStemBlocks.length > 0) {
      // Extract text from blocks - use markdown or HTML from first text block
      const firstTextBlock = frontendQuestion.questionStemBlocks.find((b: any) => 
        b.type === "TEXT" || b.type === "text"
      )
      if (firstTextBlock?.data) {
        questionText = firstTextBlock.data.markdown || firstTextBlock.data.html || ""
        // Strip HTML tags if it's HTML
        if (questionText && questionText.includes("<")) {
          questionText = questionText.replace(/<[^>]*>/g, "").trim()
        }
      }
      // If still empty, create a placeholder
      if (!questionText.trim()) {
        questionText = "Question with rich content blocks"
      }
    }

    // Build the payload
    const payload: any = {
      topicId: String(topicId),
      ...(frontendQuestion.subtopicId ? { subtopicId: String(frontendQuestion.subtopicId) } : {}),
      question: questionText,
      difficulty: "medium" as const,
      points: 1,
      isActive: true,
    }

    // Only add optional fields if they have values
    if (frontendQuestion.categoryId && String(frontendQuestion.categoryId).trim()) {
      payload.categoryId = String(frontendQuestion.categoryId).trim()
    }

    if (frontendQuestion.title && String(frontendQuestion.title).trim()) {
      payload.title = String(frontendQuestion.title).trim()
    }

    if (frontendQuestion.subject && String(frontendQuestion.subject).trim()) {
      payload.subject = String(frontendQuestion.subject).trim()
    }
    
    if (frontendQuestion.system && String(frontendQuestion.system).trim()) {
      payload.system = String(frontendQuestion.system).trim()
    }
    
    // Handle tags - store questionId in tags as a special entry
    const tagsArray: string[] = []
    if (Array.isArray(frontendQuestion.tags) && frontendQuestion.tags.length > 0) {
      tagsArray.push(...frontendQuestion.tags
        .filter((tag: any) => tag && String(tag).trim() && !String(tag).startsWith("__questionId:"))
        .map((tag: any) => String(tag).trim()))
    }
    
    // Store questionId in tags if it exists in metadata (from convertNewQuestionToOld)
    const questionId = frontendQuestion.metadata?.questionId || frontendQuestion.questionId
    if (questionId && String(questionId).trim()) {
      tagsArray.push(`__questionId:${String(questionId).trim()}`)
    }
    
    if (tagsArray.length > 0) {
      payload.tags = tagsArray
    }
    
    // Only include explanationBlocks if they exist and are valid
    if (explanationBlocks && explanationBlocks.length > 0) {
      // Remove id fields from all blocks - backend doesn't accept them
      payload.explanationBlocks = explanationBlocks.map((block: any) => {
        const { id, ...blockWithoutId } = block
        // Clean up data - remove undefined/null values and ensure proper structure
        if (blockWithoutId.data) {
          const cleanedData: any = {}
          for (const [key, value] of Object.entries(blockWithoutId.data)) {
            if (value !== undefined && value !== null) {
              cleanedData[key] = value
            }
          }
          // Ensure table blocks have tableHtml
          if (blockWithoutId.type === "TABLE") {
            // If we have html, use it as tableHtml (but keep html too for frontend)
            if (cleanedData.html && !cleanedData.tableHtml) {
              cleanedData.tableHtml = cleanedData.html
            }
            // Preserve cells data even if we have HTML - cells are useful for editing
            // Only create empty table HTML if we have absolutely nothing
            if (!cleanedData.tableHtml && !cleanedData.html && (!cleanedData.cells || Object.keys(cleanedData.cells || {}).length === 0)) {
              cleanedData.tableHtml = "<table><tr><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td></tr></table>"
            }
            // Keep both html and tableHtml for compatibility - don't delete html
          }
          blockWithoutId.data = cleanedData
        }
        return blockWithoutId
      })
    }
    
    // Only include perAnswerExplanations if they exist and are valid
    if (Object.keys(perAnswerExplanations).length > 0) {
      // Remove id fields from all blocks - backend doesn't accept them
      const cleanedPerAnswerExplanations: Record<string, any[]> = {}
      for (const [label, blocks] of Object.entries(perAnswerExplanations)) {
        cleanedPerAnswerExplanations[label] = blocks.map((block: any) => {
          const { id, ...blockWithoutId } = block
          // Clean up data - remove undefined/null values
          if (blockWithoutId.data) {
            const cleanedData: any = {}
            for (const [key, value] of Object.entries(blockWithoutId.data)) {
              if (value !== undefined && value !== null) {
                cleanedData[key] = value
              }
            }
            blockWithoutId.data = cleanedData
          }
          return blockWithoutId
        })
      }
      payload.perAnswerExplanations = cleanedPerAnswerExplanations
    }

    // Only include questionStemBlocks if they exist and are valid
    if (questionStemBlocks && questionStemBlocks.length > 0) {
      // Ensure all blocks have proper order and are sorted, and remove id fields
      const sortedStemBlocks = questionStemBlocks
        .map((block: any, idx: number) => {
          const { id, ...blockWithoutId } = block
          return {
            ...blockWithoutId,
            order: typeof block.order === "number" ? block.order : idx,
          }
        })
        .sort((a: any, b: any) => {
          const orderA = typeof a.order === "number" ? a.order : 999
          const orderB = typeof b.order === "number" ? b.order : 999
          return orderA - orderB
        })
      
      payload.questionStemBlocks = sortedStemBlocks
      
    }

    // Persist display labels in compatible fields/tags
    if (frontendQuestion.system && String(frontendQuestion.system).trim()) {
      payload.system = String(frontendQuestion.system).trim()
    }

    // Note: questionId is generated on the frontend based on system, subject, and topic
    // It's not stored in the backend, but can be regenerated when needed

    // Store choices separately (not part of DTO)
    return {
      ...payload,
      _choices: choices,
    } as any
  }

  const loadQuestions = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true
    try {
      if (silent) {
        setIsRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)
      
      // Load all questions using pagination (like student mode)
      const cacheBuster = Date.now()
      let page = 1
      const limit = 100
      let hasMore = true
      let allQuestions: any[] = []

      while (hasMore && page <= 50) { // Increased max pages to 50 (5000 questions max)

        const response = await questionsService.getQuestions({ 
          status: "ACTIVE",
          page,
          limit,
          sortBy: "createdAt",
          sortOrder: "desc", // Show newest first in admin
          _t: cacheBuster,
        })
        
        const questionsData = Array.isArray(response) 
          ? response 
          : (response as any)?.data || []
        
        allQuestions = [...allQuestions, ...questionsData]
        
        if (Array.isArray(response)) {
          hasMore = questionsData.length === limit
        } else {
          const pagination = (response as any)?.pagination
          if (pagination) {
            hasMore = page < pagination.totalPages
          } else {
            hasMore = questionsData.length === limit
          }
        }
        
        if (questionsData.length === 0) {
          hasMore = false
        }
        
        page++
      }
      
      const transformedQuestions = allQuestions.map(transformBackendToFrontend)
      
      setQuestions(transformedQuestions)
    } catch (err: unknown) {
      console.error("Failed to load questions:", err)

      if (ApiHttpError.is(err) && err.status === 401) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("authToken")
          localStorage.removeItem("userData")
        }
        setError("Your session has expired. Please log in again to continue.")
        setQuestions([])
      } else {
        setError(getApiErrorMessage(err, "Failed to load questions"))
        setQuestions([])
      }
    } finally {
      if (silent) {
        setIsRefreshing(false)
      } else {
        setLoading(false)
      }
    }
  }, [questionsService])

  useEffect(() => {
    // Check authentication before loading questions
    if (authService.isAuthenticated()) {
      loadQuestions()
    } else {
      setLoading(false)
      setError("Please log in to access the admin dashboard.")
      setQuestions([])
    }
  }, [loadQuestions])

  // Listen for question updates from other tabs/components
  useEffect(() => {
    const handleQuestionUpdate = () => {
      if (authService.isAuthenticated()) {
        loadQuestions({ silent: true })
      }
    }

    // Listen for both event types
    window.addEventListener("questionUpdated", handleQuestionUpdate)
    window.addEventListener("questionsUpdated", handleQuestionUpdate)

    // Also listen for storage changes (cross-tab updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "questionsUpdated") {
        if (authService.isAuthenticated()) {
          loadQuestions({ silent: true })
        }
      }
    }

    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("questionUpdated", handleQuestionUpdate)
      window.removeEventListener("questionsUpdated", handleQuestionUpdate)
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [loadQuestions])

  const handleSaveQuestion = async (
    questionData: QuestionCreatorData,
    options?: SaveQuestionOptions,
  ): Promise<boolean> => {
    try {
      setError(null)

      let metadata = questionData.metadata
      if (!metadata.topicId) {
        const resolved = await resolveCreatorMetadataIds(metadata)
        metadata = mergeResolvedMetadata(metadata, resolved)
        questionData = { ...questionData, metadata }
      }

      if (!questionData.metadata.topicId) {
        const topicLabel = questionData.metadata.parsedTopicName
        toast({
          title: "Registration Error",
          description: topicLabel
            ? `Could not match topic "${topicLabel}" in the database. Select an existing topic from the dropdown or use + to add it.`
            : "Please select a topic for this question.",
          variant: "destructive",
        })
        return false
      }

      // Convert new format to old format for backend compatibility
      const oldFormatData = convertNewQuestionToOld(questionData)
      
      const backendData = transformFrontendToBackend(oldFormatData, questionData.metadata.topicId)
      
      // Extract choices separately (they're not part of the DTO)
      const choices = (backendData as any)._choices || []
      
      // Remove choices and _choices from the payload - create clean payload
      const { _choices, ...questionPayload } = backendData as any
      
      // Validate payload before sending
      // Check for question text OR question stem blocks
      const hasQuestionText = questionPayload.question && questionPayload.question.trim()
      const hasQuestionStemBlocks = Array.isArray(questionPayload.questionStemBlocks) && questionPayload.questionStemBlocks.length > 0
      
      if (!hasQuestionText && !hasQuestionStemBlocks) {
        throw new Error("Question stem content is required. Please add content to the Question Stem section.")
      }
      
      if (!questionPayload.topicId) {
        throw new Error("Topic ID is required")
      }

      // Final cleanup - remove any id fields and undefined/null values recursively
      const cleanPayload = (obj: any): any => {
        if (Array.isArray(obj)) {
          return obj.map(cleanPayload).filter((item) => item !== undefined && item !== null)
        } else if (obj && typeof obj === "object") {
          const cleaned: any = {}
          for (const [key, value] of Object.entries(obj)) {
            if (key === "id") continue // Skip id fields
            if (value !== undefined && value !== null) {
              cleaned[key] = cleanPayload(value)
            }
          }
          return cleaned
        }
        return obj
      }
      
      const finalPayload = cleanPayload(questionPayload)
      
      if (editingId) {
        // Transform explanation blocks if they exist as ContentBlocks
        const updatedData: any = {
          question: questionData.stem ? blocksToHTML(questionData.stem) : undefined,
          questionStemBlocks: questionData.stem ? convertNewBlocksToOld(questionData.stem) : undefined,
          explanationBlocks: questionData.mainExplanation ? convertNewBlocksToOld(questionData.mainExplanation) : undefined,
          perAnswerExplanations: questionData.perAnswerExplanations ? convertNewPerAnswerExplanationsToOld(questionData.perAnswerExplanations) : undefined,
          categoryId: questionData.metadata.categoryId,
          productId: questionData.metadata.productId,
          title: questionData.metadata.title,
          topicId: questionData.metadata.topicId,
          subtopicId: questionData.metadata.subtopicId,
          systemId: questionData.metadata.systemId,
          system: questionData.metadata.system,
          tags: questionData.metadata.tags || [],
        }

        // Final clean and update
        const cleanUpdated = cleanPayload(updatedData)
        await questionsService.updateQuestion(editingId, cleanUpdated)

        // Update choices separately
        if (questionData.choices) {
          const QuestionChoicesService = (await import("@/app/services/questions/question-choices.service")).QuestionChoicesService
          const choicesService = new QuestionChoicesService()
          
          try {
            const existingChoicesRes: any = await choicesService.getQuestionChoices({ questionId: editingId })
            const existingChoices = Array.isArray(existingChoicesRes) ? existingChoicesRes : (existingChoicesRes.data || [])
            const newChoiceIds = questionData.choices.map((c: any) => c.id).filter(Boolean)
            
            // Delete removed choices
            for (const ec of existingChoices) {
              if (!newChoiceIds.includes(ec.id)) {
                try { await choicesService.deleteQuestionChoice(ec.id) } catch (e) { console.error("Failed to delete choice", e) }
              }
            }
            
            // Create or update choices
            for (let i = 0; i < questionData.choices.length; i++) {
              const choice: any = questionData.choices[i]
              const order = choice.order !== undefined ? choice.order : (i + 1)
              
              if (choice.id && existingChoices.some((ec: any) => ec.id === choice.id)) {
                await choicesService.updateQuestionChoice(choice.id, {
                  text: choice.text || "",
                  isCorrect: choice.isCorrect !== undefined ? choice.isCorrect : choice.correct,
                  order: order
                })
              } else {
                await choicesService.createQuestionChoice({
                  questionId: editingId,
                  text: choice.text || "",
                  isCorrect: choice.isCorrect !== undefined ? choice.isCorrect : choice.correct,
                  order: order
                })
              }
            }
          } catch (error) {
            console.error("Failed to sync choices:", error)
          }
        }
        // Reload questions to get updated data
        await loadQuestions({ silent: true })
        // If viewing the edited question, refresh the view
        if (viewingId === editingId) {
          setViewingId(null)
          setTimeout(() => setViewingId(editingId), 100)
        }
        // Notify other tabs/components that questions were updated
        // Use a unique timestamp to ensure the event is detected
        if (typeof window !== "undefined") {
          const timestamp = Date.now().toString()
          localStorage.setItem("questionsUpdated", timestamp)
          // Dispatch event multiple times to ensure it's caught
          window.dispatchEvent(new Event("questionUpdated"))
          // Also dispatch a custom event with more details
          window.dispatchEvent(new CustomEvent("questionsUpdated", { detail: { timestamp, questionId: editingId } }))
        }
      } else {
        // Create new question
        let createdQuestion
        try {
          createdQuestion = await questionsService.createQuestion(finalPayload)
        } catch (createError: any) {
          console.error("[Save] Error creating question:", createError)
          console.error("[Save] Error response:", createError.response?.data)
          console.error("[Save] Error status:", createError.response?.status)
          console.error("[Save] Payload that failed:", JSON.stringify(finalPayload, null, 2))
          const errorMessage = createError.response?.data?.message || createError.response?.data?.error || createError.message || "Internal server error"
          throw new Error(`Failed to save question: ${errorMessage}`)
        }
        
        if (!createdQuestion) {
          throw new Error("Failed to create question: No response from server")
        }
        
        // Get the question ID (handle both response formats)
        const questionId = typeof createdQuestion === "object" && "id" in createdQuestion 
          ? createdQuestion.id 
          : (createdQuestion as any).id

        if (!questionId) {
          console.error("Created question response:", createdQuestion)
          throw new Error("Failed to get question ID after creation")
        }

        // Then add choices using the question choices service
        const QuestionChoicesService = (await import("@/app/services/questions/question-choices.service")).QuestionChoicesService
        const choicesService = new QuestionChoicesService()
        
        for (const choice of choices) {
          try {
            await choicesService.createQuestionChoice({
              questionId: questionId,
              text: choice.text,
              isCorrect: choice.isCorrect,
              order: choice.order,
            })
          } catch (choiceError: any) {
            console.error(`Failed to create choice ${choice.order}:`, choiceError)
            // Continue with other choices even if one fails
          }
        }

        // Reload questions to get new question with all data
        await loadQuestions({ silent: options?.batchReview === true })
        // Notify other tabs/components that questions were updated
        // Use a unique timestamp to ensure the event is detected
        if (typeof window !== "undefined") {
          const timestamp = Date.now().toString()
          localStorage.setItem("questionsUpdated", timestamp)
          // Dispatch event multiple times to ensure it's caught
          window.dispatchEvent(new Event("questionUpdated"))
          // Also dispatch a custom event with more details
          window.dispatchEvent(new CustomEvent("questionsUpdated", { detail: { timestamp, questionId } }))
        }
      }
      
      if (!options?.batchReview) {
        setShowNewQuestion(false)
        setEditingId(null)
        setViewingId(null)
        setParsedMarkdownData(null)
      }
      return true
    } catch (err: unknown) {
      console.error("Failed to save question:", err)

      setError(getApiErrorMessage(err, "Failed to save question"))
      toast({
        title: "Error",
        description: getApiErrorMessage(err, "Unknown error during save"),
        variant: "destructive",
      })
      return false
    }
  }


  const handleDeleteQuestion = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Delete Question",
      message: "Are you sure you want to delete this question? This action cannot be undone.",
      confirmText: "Delete",
      variant: "danger",
    })
    
    if (!isConfirmed) {
      return
    }

    try {
      setError(null)
      await questionsService.delete(id)
      await loadQuestions() // Reload to reflect deletion
    } catch (err: unknown) {
      console.error("Failed to delete question:", err)
      setError(getApiErrorMessage(err, "Failed to delete question"))
      toast({
        title: "Error",
        description: getApiErrorMessage(err, "Failed to delete question"),
        variant: "destructive",
      })
    }
  }

  const handleBulkDeleteQuestions = async (ids: string[]) => {
    if (ids.length === 0) return
    const isConfirmed = await confirm({
      title: "Bulk Delete",
      message: `Are you sure you want to delete ${ids.length} question${ids.length === 1 ? "" : "s"}? This cannot be undone.`,
      confirmText: "Delete All",
      variant: "danger",
    })

    if (!isConfirmed) {
      return
    }
    try {
      setError(null)
      await Promise.all(ids.map((id) => questionsService.delete(id)))
      await loadQuestions()
      setSelectedQuestionIds([])
      setIsSelectMode(false)
    } catch (err) {
      console.error("Failed to delete questions:", err)
      setError(getApiErrorMessage(err, "Failed to delete questions"))
      toast({
        title: "Bulk Delete Failed",
        description: getApiErrorMessage(err, "Something went wrong."),
        variant: "destructive",
      })
    }
  }

  const handleMarkdownParsed = (questionData: any) => {
    setParsedMarkdownData(questionData)
    setShowNewQuestion(true)
    setShowMarkdownUploader(false) // Hide uploader once parsed
    setEditingId(null)
    setViewingId(null)
  }

  const handleCreateManually = () => {
    setShowNewQuestion(true)
    setShowMarkdownUploader(false)
    setParsedMarkdownData(null)
    setEditingId(null)
    setViewingId(null)
    setShowNewQuestionMenu(false)
  }

  const handleUploadMarkdown = () => {
    setShowMarkdownUploader(true)
    setShowBulkUploader(false)
    setShowNewQuestion(false)
    setParsedMarkdownData(null)
    setEditingId(null)
    setViewingId(null)
    setShowNewQuestionMenu(false)
  }

  const handleBulkUploadMarkdown = () => {
    setShowBulkUploader(true)
    setShowMarkdownUploader(false)
    setShowNewQuestion(false)
    setParsedMarkdownData(null)
    setEditingId(null)
    setViewingId(null)
    setShowNewQuestionMenu(false)
  }

  const handleUploadDocx = () => {
    setShowDocxUploader(true)
    setShowBulkDocxUploader(false)
    setShowMarkdownUploader(false)
    setShowBulkUploader(false)
    setShowNewQuestion(false)
    setParsedMarkdownData(null)
    setEditingId(null)
    setViewingId(null)
    setShowNewQuestionMenu(false)
  }

  const handleBulkUploadDocx = () => {
    setShowBulkDocxUploader(true)
    setShowDocxUploader(false)
    setShowMarkdownUploader(false)
    setShowBulkUploader(false)
    setShowNewQuestion(false)
    setParsedMarkdownData(null)
    setEditingId(null)
    setViewingId(null)
    setShowNewQuestionMenu(false)
  }

  const handleDocxParsed = (questionData: any) => {
    setParsedMarkdownData(questionData)
    setShowDocxUploader(false)
    setShowNewQuestion(true)
    setEditingId(null)
    setViewingId(null)
  }

  const handleQuestionBuilder = () => {
    setShowQuestionBuilder(true)
    setShowMarkdownUploader(false)
    setShowBulkUploader(false)
    setShowDocxUploader(false)
    setShowBulkDocxUploader(false)
    setShowNewQuestion(false)
    setParsedMarkdownData(null)
    setEditingId(null)
    setViewingId(null)
    setShowNewQuestionMenu(false)
  }

  const editingQuestion = editingId ? questions.find((q) => q.id === editingId) : null
  const viewingQuestion = viewingId ? questions.find((q) => q.id === viewingId) : null

  // Notify parent when viewing/editing changes
  useEffect(() => {
    const currentId = editingId || viewingId
    if (!currentId) {
      onQuestionViewChange?.(null, null, false)
      return
    }
    const question = questions.find((q) => q.id === currentId)
    if (question) {
      // Use questionId if available, otherwise use the database id as fallback
      const questionId = question.questionId || question.id || null
      const isViewing = !!viewingId && !editingId
      onQuestionViewChange?.(questionId, currentId, isViewing)
    } else {
      // Question not loaded yet, set to null
      onQuestionViewChange?.(null, null, false)
    }
  }, [editingId, viewingId, questions, onQuestionViewChange])

  // Handle close question view event from parent
  useEffect(() => {
    const handleCloseQuestionView = () => {
      setViewingId(null)
      setEditingId(null)
      // Notify parent that we're no longer viewing/editing
      onQuestionViewChange?.(null, null, false)
    }
    const handleEditQuestion = (event: CustomEvent) => {
      const questionId = event.detail?.questionId
      if (questionId) {
        setEditingId(questionId)
        setViewingId(null)
      }
    }
    window.addEventListener("closeQuestionView", handleCloseQuestionView)
    window.addEventListener("editQuestion", handleEditQuestion as EventListener)
    return () => {
      window.removeEventListener("closeQuestionView", handleCloseQuestionView)
      window.removeEventListener("editQuestion", handleEditQuestion as EventListener)
    }
  }, [onQuestionViewChange])
  const searchFilteredQuestions = useMemo(() => {
    if (!searchTerm || searchTerm.trim() === "") {
      return questions
    }
    const searchLower = searchTerm.toLowerCase()
    return questions.filter((q) => {
      const stem = (q.stem || "").toLowerCase()
      const category = (q.category || "").toLowerCase()
      const product = (q.product || "").toLowerCase()
      const system = (q.system || "").toLowerCase()
      const topicName = (q.topicName || "").toLowerCase()
      const subtopicName = (q.subtopicName || "").toLowerCase()
      const mcqTitle = (q.mcqTitle || "").toLowerCase()
      return (
        stem.includes(searchLower) ||
        category.includes(searchLower) ||
        product.includes(searchLower) ||
        system.includes(searchLower) ||
        topicName.includes(searchLower) ||
        subtopicName.includes(searchLower) ||
        mcqTitle.includes(searchLower)
      )
    })
  }, [questions, searchTerm])

  const bankSystems = useMemo(() => {
    const names = new Set<string>()
    questions.forEach((q) => {
      const s = (q.system || "").trim()
      if (s) names.add(s)
    })
    return [...names].sort((a, b) => a.localeCompare(b))
  }, [questions])

  useEffect(() => {
    if (systemFilter === "all") return
    if (!bankSystems.includes(systemFilter)) {
      setSystemFilter("all")
    }
  }, [bankSystems, systemFilter])

  const displayedQuestions = useMemo(() => {
    if (systemFilter === "all") return searchFilteredQuestions
    return searchFilteredQuestions.filter((q) => (q.system || "").trim() === systemFilter)
  }, [searchFilteredQuestions, systemFilter])

  const bankStatCards = useMemo(() => {
    const n = questions.length
    const systems = new Set<string>()
    const products = new Set<string>()
    let optionSum = 0
    questions.forEach((q) => {
      if (q.system?.trim()) systems.add(q.system.trim())
      if (q.product?.trim()) products.add(q.product.trim())
      optionSum += q.options?.length ?? 0
    })
    const avg =
      n === 0 ? 0 : Math.round((optionSum / n) * 10) / 10
    return [
      {
        id: "total",
        title: t("questionGenerator.statTotal"),
        value: String(n),
        hint: t("questionGenerator.statTotalHint"),
      },
      {
        id: "systems",
        title: t("questionGenerator.statSystems"),
        value: String(systems.size),
      },
      {
        id: "avgOptions",
        title: t("questionGenerator.statAvgOptions"),
        value: String(avg),
        hint: t("questionGenerator.statAvgOptionsHint"),
      },
      {
        id: "products",
        title: t("questionGenerator.statProducts"),
        value: String(products.size),
      },
    ]
  }, [questions, t])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card className="p-12 bg-card dark:bg-gray-800 border-border dark:border-gray-700">
          <div className="text-center">
            <p className="text-muted-foreground dark:text-gray-400">Loading questions from database...</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background dark:bg-gray-900">
      <div className="px-4 py-8 flex-1 flex flex-col min-h-0 w-full">
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-destructive/10 dark:bg-destructive/20 border border-destructive/20 dark:border-destructive/30 rounded-lg">
          <p className="text-destructive dark:text-red-400">{error}</p>
        </div>
      )}

      {/* + New Question lives on the list toolbar row (with Select); search is in the app header */}

      {/* Markdown Uploader Section - Only shown when upload mode is selected */}
      {showMarkdownUploader && (
        <div className="mb-4">
          <MarkdownUploader onQuestionParsed={handleMarkdownParsed} />
        </div>
      )}

      {/* Bulk Markdown Uploader Section */}
      {showBulkUploader && (
        <div className="mb-4 overflow-y-auto max-h-[calc(100vh-200px)]">
          <BulkMarkdownUploader
            onQuestionsCreated={async (questionIds) => {
              // Reload questions after bulk creation
              await loadQuestions()
              toast({
                title: "Success",
                description: `Successfully created ${questionIds.length} question(s)!`,
              })
            }}
            onQuestionEdit={(questionId) => {
              setEditingId(questionId)
              setShowBulkUploader(false)
              setShowNewQuestion(false)
            }}
            onCancel={() => {
              setShowBulkUploader(false)
            }}
          />
        </div>
      )}

      {/* DOCX Uploader Section */}
      {showDocxUploader && (
        <div className="mb-4">
          <DocxUploader onQuestionParsed={handleDocxParsed} />
        </div>
      )}

      {/* Question Builder (template-based DOCX, no AI) */}
      {showQuestionBuilder && (
        <div className="mb-4 flex-1 min-h-0 overflow-hidden">
          <QuestionBuilderUploader
            onSave={handleSaveQuestion}
            onCancel={() => setShowQuestionBuilder(false)}
          />
        </div>
      )}

      {/* Bulk DOCX Uploader Section */}
      {showBulkDocxUploader && (
        <div className="mb-4 overflow-y-auto max-h-[calc(100vh-200px)]">
          <BulkDocxUploader
            onQuestionsCreated={async (questionIds) => {
              // Reload questions after bulk creation
              await loadQuestions()
              toast({
                title: "Success",
                description: `Successfully created ${questionIds.length} question(s)!`,
              })
            }}
            onQuestionEdit={(questionId) => {
              setEditingId(questionId)
              setShowBulkDocxUploader(false)
              setShowNewQuestion(false)
            }}
            onCancel={() => {
              setShowBulkDocxUploader(false)
            }}
          />
        </div>
      )}

      {/* Editor, View, or List */}
      {showNewQuestion || editingId ? (
        <div className="flex-1 min-h-0" style={{ paddingTop: 0, marginTop: 0 }}>
          <QuestionCreator
            initialData={
              editingId && editingQuestion
                ? (() => {
                    const converted = convertOldQuestionToNew(editingQuestion)
                    return converted
                  })()
                : parsedMarkdownData
                  ? Array.isArray(parsedMarkdownData.stem)
                    ? parsedMarkdownData
                    : convertOldQuestionToNew(parsedMarkdownData)
                  : undefined
            }
            onSave={handleSaveQuestion}
            onCancel={() => {
              setShowNewQuestion(false)
              setShowMarkdownUploader(false)
              setShowBulkUploader(false)
              setShowDocxUploader(false)
              setShowBulkDocxUploader(false)
              setShowQuestionBuilder(false)
              setEditingId(null)
              setViewingId(null)
              setParsedMarkdownData(null)
              setShowNewQuestionMenu(false)
            }}
            onPreviewModeChange={onEditorPreviewModeChange}
          />
        </div>
      ) : viewingId ? (
        <div className="flex-1 min-h-0" style={{ paddingTop: 0, marginTop: 0 }}>
          <AdminQuestionView
            question={viewingQuestion}
            onEdit={() => {
              setEditingId(viewingId)
              setViewingId(null)
            }}
            onCancel={() => {
              setViewingId(null)
          }}
        />
        </div>
      ) : !showMarkdownUploader && !showBulkUploader && !showDocxUploader && !showBulkDocxUploader && !showQuestionBuilder ? (
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <QuestionBankListHeader
            title={t("questionGenerator.bankTitle")}
            subtitle={t("questionGenerator.bankSubtitle")}
            statCards={bankStatCards}
            systems={bankSystems}
            systemFilter={systemFilter}
            onSystemChange={setSystemFilter}
            allLabel={t("questionGenerator.filterAll")}
            presentationLabel={t("questionGenerator.filterPresentation")}
          />
          {/* Toolbar: always show on list view so Create / Select stay available with zero questions */}
          <div className="mb-4 flex flex-nowrap items-center justify-between gap-3 min-w-0 pt-1">
            <p className="text-sm text-muted-foreground dark:text-gray-400 min-w-0 shrink">
              {questions.length === 0
                ? "No questions yet"
                : displayedQuestions.length === 0
                  ? "No questions match your search or system filter"
                  : `Showing ${displayedQuestions.length} of ${questions.length} questions`}
            </p>
            <div className="flex flex-nowrap items-center gap-3 sm:gap-4 shrink-0 pl-2">
              <div className="relative isolate" ref={menuRef}>
                <Button
                  type="button"
                  size="lg"
                  onClick={() => setShowNewQuestionMenu(!showNewQuestionMenu)}
                  className="bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20 ring-1 ring-primary/40 ring-offset-2 ring-offset-background hover:shadow-lg hover:shadow-primary/25 dark:ring-offset-gray-900"
                >
                  + New Question
                </Button>
                {showNewQuestionMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-card dark:bg-gray-800 border border-border dark:border-gray-700 rounded-lg shadow-lg z-50">
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={handleBulkUploadMarkdown}
                        className="w-full text-left px-4 py-2 text-sm text-foreground dark:text-gray-100 hover:bg-muted dark:hover:bg-gray-700 transition-colors"
                      >
                        Upload Markdown Questions
                      </button>
                      <button
                        type="button"
                        onClick={handleBulkUploadDocx}
                        className="text-left px-4 py-2 text-sm text-foreground dark:text-gray-100 hover:bg-muted dark:hover:bg-gray-700 transition-colors w-full"
                      >
                        Upload DOCX Questions
                      </button>
                      <button
                        type="button"
                        onClick={handleQuestionBuilder}
                        className="w-full text-left px-4 py-2 text-sm text-foreground dark:text-gray-100 hover:bg-muted dark:hover:bg-gray-700 transition-colors"
                      >
                        Question Builder
                      </button>
                      <div className="border-t border-border dark:border-gray-700 my-1" />
                      <button
                        type="button"
                        onClick={handleCreateManually}
                        className="w-full text-left px-4 py-2 text-sm text-foreground dark:text-gray-100 hover:bg-muted dark:hover:bg-gray-700 transition-colors"
                      >
                        ✏️ Create Question Manually
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {!isSelectMode ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsSelectMode(true)
                    setSelectedQuestionIds([])
                  }}
                  className="border-border dark:border-gray-700 text-foreground dark:text-gray-100 hover:bg-muted dark:hover:bg-gray-700"
                >
                  Select
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsSelectMode(false)
                      setSelectedQuestionIds([])
                    }}
                    className="border-border dark:border-gray-700 text-foreground dark:text-gray-100"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={selectedQuestionIds.length === 0}
                    onClick={() => handleBulkDeleteQuestions(selectedQuestionIds)}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-300 dark:border-red-800 disabled:opacity-50"
                  >
                    Delete selected ({selectedQuestionIds.length})
                  </Button>
                </>
              )}
            </div>
          </div>

          {displayedQuestions.length === 0 ? (
            <Card className="p-12 bg-card dark:bg-gray-800 border-border dark:border-gray-700">
              <div className="text-center">
                <p className="text-muted-foreground dark:text-gray-400 mb-4">
                  {questions.length === 0
                    ? "Get started by creating a question or uploading a batch."
                    : "Try adjusting your search or system filter."}
                </p>
                <Button
                  onClick={handleCreateManually}
                  variant="outline"
                  className="border-border dark:border-gray-700 text-foreground dark:text-gray-100 hover:bg-muted dark:hover:bg-gray-700"
                >
                  {questions.length === 0 ? "Create first question" : "New question"}
                </Button>
              </div>
            </Card>
          ) : (
            <QuestionList
              questions={displayedQuestions}
              onEdit={(id: string) => {
                setEditingId(id)
                setViewingId(null)
                setShowNewQuestion(false)
              }}
              onView={(id: string) => {
                setViewingId(id)
                setEditingId(null)
                setShowNewQuestion(false)
              }}
              onDelete={handleDeleteQuestion}
              selectionMode={isSelectMode}
              selectedIds={selectedQuestionIds}
              onSelectionChange={setSelectedQuestionIds}
            />
          )}
        </div>
      ) : null}
      </div>
    </div>
  )
}
