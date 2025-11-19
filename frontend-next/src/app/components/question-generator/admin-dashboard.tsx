"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import QuestionList from "./question-list"
import MarkdownUploader from "./markdown-uploader"
import BulkMarkdownUploader from "./bulk-markdown-uploader"
import AdminQuestionView from "./admin-question-view"
import QuestionCreator from "./question-creator/QuestionCreator"
import { convertOldQuestionToNew, convertNewQuestionToOld } from "./migration-utils"
import { QuestionCreatorData } from "./question-creator/types"
import { QuestionsService } from "@/app/services/questions/questions.service"
import { QuestionChoice } from "@/app/types/question"
import { CreateQuestionDto } from "@/app/types/question"
import { authService } from "@/shared/services/auth.service"

interface Question {
  id: string
  stem: string
  options: Array<{ label: string; text: string; correct: boolean; value?: string }>
  choices?: QuestionChoice[] // Backend uses 'choices'
  subject: string
  system: string
  explanation: any
  perAnswerExplanations?: Record<string, any[]> // Per-answer explanations in frontend format
  tags: string[]
  createdAt: number | string
  topicId?: string // Required for backend
  questionStemBlocks?: any[] // Rich content blocks for question stem
  chapterId?: string // Chapter ID for Subject dropdown
  sectionId?: string // Section ID for System dropdown
  topic?: any // Topic object or string
}

const DEMO_QUESTION: Question = {
  id: "demo-question",
  stem: "A 13-year-old girl is brought to the clinic by her mother for a yearly physical examination. The patient feels well but is worried that she has not yet started puberty. Temperature is 36.7°C (98°F), blood pressure is 152/91 mm Hg, pulse is 75/min, and respirations are 18/min. Physical examination is significant for a lack of secondary sexual characteristics; a blind vagina is noted on pelvic examination. Laboratory studies reveal hypokalemia and low testosterone and estradiol levels. Cytogenetic analysis shows a 46,XY karyotype. This patient most likely has deficiency of which of the following enzymes?",
  options: [
    { label: "A", text: "5 alpha-reductase (11%)", correct: false, value: "A" },
    { label: "B", text: "17 alpha-hydroxylase (66%)", correct: true, value: "B" },
    { label: "C", text: "11 beta-hydroxylase (8%)", correct: false, value: "C" },
    { label: "D", text: "17,20-lyase (7%)", correct: false, value: "D" },
    { label: "E", text: "3 beta-hydroxysteroid dehydrogenase (8%)", correct: false, value: "E" },
  ],
  subject: "Pathology",
  system: "Endocrine",
  tags: ["CAH", "Congenital Adrenal Hyperplasia", "Enzyme Deficiency"],
  createdAt: Date.now(),
  explanation: [
    {
      type: "heading",
      level: 2,
      content: "Overview",
    },
    {
      type: "paragraph",
      content:
        "This patient is **genetically male (46,XY)** with features suggestive of **17 alpha-hydroxylase deficiency**, a rare cause of **congenital adrenal hyperplasia (CAH)**. This enzyme deficiency impairs both cortisol and androgen synthesis, leading to accumulation of precursor hormones and shunting toward the mineralocorticoid pathway.",
    },
    {
      type: "heading",
      level: 2,
      content: "Clinical Presentation",
    },
    {
      type: "paragraph",
      content: "The classic triad of 17 alpha-hydroxylase deficiency includes:",
    },
    {
      type: "list",
      items: [
        "**Hypertension** from excess mineralocorticoid (11-deoxycorticosterone)",
        "**Hypokalemia** from aldosterone-like effects",
        "**Sexual underdevelopment** from androgen deficiency",
      ],
    },
    {
      type: "paragraph",
      content:
        "Female external genitalia with XY karyotype (46,XY) results from lack of androgen action during fetal development. The blind-ending vagina occurs because anti-Müllerian hormone (AMH) was produced by the testes, suppressing development of the uterus and fallopian tubes.",
    },
    {
      type: "heading",
      level: 2,
      content: "Enzyme Function",
    },
    {
      type: "paragraph",
      content:
        "The enzyme **17 alpha-hydroxylase** is active in the **adrenal glands and gonads** and is responsible for converting pregnenolone to 17-hydroxypregnenolone and progesterone to 17-hydroxyprogesterone. This enzyme is critical for both **cortisol and androgen synthesis** pathways. Without this enzyme, steroids are shunted toward the mineralocorticoid pathway.",
    },
    {
      type: "heading",
      level: 2,
      content: "Why This Answer?",
    },
    {
      type: "paragraph",
      content:
        "The correct answer is **B. 17 alpha-hydroxylase (66%)**. The clinical presentation uniquely points to this enzyme deficiency:",
    },
    {
      type: "list",
      items: [
        "**Hypertension + Hypokalemia**: These are hallmark findings of 17 alpha-hydroxylase deficiency due to mineralocorticoid excess",
        "**Ambiguous genitalia**: Indicates androgen deficiency in a genetically male patient",
        "**46,XY genetic male**: Rules out pure 5-alpha reductase deficiency (which presents with ambiguous genitalia in males)",
        "**Low testosterone AND estradiol**: Confirms defect in androgen and estrogen production",
        "**Lack of virilization**: Would have occurred with 17,20-lyase deficiency (preserved androgen synthesis)",
      ],
    },
    {
      type: "heading",
      level: 3,
      content: "Why Not Other Answers?",
    },
    {
      type: "list",
      items: [
        "**5-alpha reductase**: Causes ambiguous genitalia but NO hypertension or hypokalemia; testosterone is elevated",
        "**11-beta hydroxylase**: Causes hypertension and hypokalemia, but also presents with virilization (elevated androgen)",
        "**17,20-lyase**: Presents with ambiguous genitalia but NO hypertension (normal mineralocorticoids)",
        "**3-beta HSD**: Presents with salt-wasting crisis and virilization",
      ],
    },
    {
      type: "heading",
      level: 2,
      content: "Comparative CAH Enzyme Deficiencies",
    },
    {
      type: "table",
      rows: [
        [
          "**Enzyme**",
          "**Hypertension**",
          "**Virilization (46,XX)**",
          "**Ambiguous Genitalia (46,XY)**",
          "**Key Feature**",
        ],
        ["17α-hydroxylase", "Yes", "No", "Yes (↓ androgen)", "↑ Mineralocorticoid"],
        ["11β-hydroxylase", "Yes", "Yes", "No (normal male)", "↑ Androgen + Mineralocorticoid"],
        ["21-hydroxylase", "No", "Yes", "No (normal male)", "↑ Androgen, salt-wasting variant"],
        ["5α-reductase", "No", "No", "Yes (↓ DHT)", "Ambiguous genitalia at birth, virilization at puberty"],
        ["3β-HSD", "Varies", "No", "Yes (↓ androgen)", "Salt-wasting crisis possible"],
      ],
    },
    {
      type: "heading",
      level: 2,
      content: "Treatment",
    },
    {
      type: "paragraph",
      content:
        "Management includes **glucocorticoid replacement** (to suppress ACTH and reduce excess mineralocorticoid production) and **mineralocorticoid antagonist** (spironolactone) to manage hypertension and hypokalemia. Hormone replacement therapy should be individualized based on sex of rearing.",
    },
  ],
}

export default function AdminDashboard() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [showNewQuestion, setShowNewQuestion] = useState(false)
  const [showMarkdownUploader, setShowMarkdownUploader] = useState(false)
  const [showBulkUploader, setShowBulkUploader] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [parsedMarkdownData, setParsedMarkdownData] = useState<any>(null)
  const [showNewQuestionMenu, setShowNewQuestionMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const questionsService = new QuestionsService()

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
    const transformedExplanation = Array.isArray(explanationBlocks) ? explanationBlocks.map((block: any) => {
      if (!block) return null
      
      // Check for per-answer-explanation placeholder
      if (block.data && (block.data.placeholder === true || block.data.isPerAnswerExplanation === true)) {
        return {
          id: block.id || Date.now(),
          type: "per-answer-explanation",
          data: { placeholder: true },
        }
      }
      
      // Transform block types to lowercase and ensure proper structure
      if (block.type === "TEXT") {
        return {
          id: block.id || Date.now(),
          type: "text",
          data: block.data || {},
        }
      } else if (block.type === "TABLE") {
        return {
          id: block.id || Date.now(),
          type: "table",
          data: block.data || {},
        }
      } else if (block.type === "IMAGES") {
        return {
          id: block.id || Date.now(),
          type: "images",
          data: block.data || {},
        }
      } else {
        // Already in frontend format or unknown type
        return block
      }
    }).filter((b: any) => b !== null) : []

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
              id: block.id || `stem-block-${Date.now()}-${index}`,
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
    
    // Debug: Log loaded blocks to verify all are being loaded
    if (process.env.NODE_ENV === "development" && questionStemBlocks.length > 0) {
      console.log("Loaded question stem blocks:", questionStemBlocks.length, "blocks", questionStemBlocks.map((b: any) => ({ type: b.type, order: b.order, id: b.id })))
    }

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
              if (b.type === "TEXT") {
                const blockData = b.data || {}
                return {
                  id: b.id || `text-${Date.now()}-${Math.random()}`,
                  type: "text",
                  data: {
                    html: blockData.html || "",
                    markdown: blockData.markdown || blockData.content || (typeof blockData === "string" ? blockData : ""),
                    ...blockData,
                  },
                }
              } else if (b.type === "TABLE") {
                return {
                  id: b.id || `table-${Date.now()}-${Math.random()}`,
                  type: "table",
                  data: b.data || {},
                }
              } else if (b.type === "IMAGES") {
                return {
                  id: b.id || `images-${Date.now()}-${Math.random()}`,
                  type: "images",
                  data: b.data || {},
                }
              }
              return null
            })
            .filter((b: any) => b !== null)
          
          if (transformedBlocks.length > 0) {
            transformedPerAnswerExplanations[pae.choiceLabel] = transformedBlocks
          }
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
            transformedPerAnswerExplanations[pae.choiceLabel] = textBlocks.map((text: string, idx: number) => ({
              id: `text-${Date.now()}-${idx}-${Math.random()}`,
              type: "text",
              data: { markdown: text },
            }))
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

    return {
      id: backendQuestion.id,
      stem: backendQuestion.question || "",
      questionStemBlocks,
      options,
      choices: backendQuestion.choices,
      subject: backendQuestion.subject || "",
      system: backendQuestion.system || "",
      chapterId: backendQuestion.chapterId || "",
      sectionId: backendQuestion.sectionId || "",
      explanation: transformedExplanation,
      perAnswerExplanations: transformedPerAnswerExplanations,
      tags: Array.isArray(backendQuestion.tags) ? backendQuestion.tags : [],
      createdAt: backendQuestion.createdAt,
      topicId: backendQuestion.topicId,
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
            if (block.type === "per-answer-explanation" || (block.data && block.data.placeholder === true)) {
              // Save as TEXT block with special marker
              return {
                type: "TEXT" as const,
                order: typeof block.order === "number" ? block.order : idx,
                data: { placeholder: true, isPerAnswerExplanation: true },
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
            
            return {
              type: blockType,
              order: typeof block.order === "number" ? block.order : idx,
              data: blockData,
              id: block.id || `explanation-block-${Date.now()}-${idx}`, // Preserve block ID
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
                id: b.id || `per-answer-block-${Date.now()}-${idx}`, // Preserve block ID
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
                console.warn("Failed to clone block.data for question stem:", e)
                blockData = {}
              }
            } else if (block.content) {
              blockData = { markdown: String(block.content) }
            } else if (block.markdown) {
              blockData = { markdown: String(block.markdown) }
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
            
            return {
              type: blockType,
              order: typeof block.order === "number" ? block.order : idx,
              data: blockData,
              id: block.id || `stem-block-${Date.now()}-${idx}`, // Preserve block ID
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

    // Build the payload - ensure it matches CreateQuestionDto exactly
    const payload: CreateQuestionDto = {
      topicId: String(topicId),
      question: questionText,
      difficulty: "medium" as const,
      points: 1,
      isActive: true,
    }

    // Only add optional fields if they have values
    if (frontendQuestion.subject && String(frontendQuestion.subject).trim()) {
      payload.subject = String(frontendQuestion.subject).trim()
    }
    
    if (frontendQuestion.system && String(frontendQuestion.system).trim()) {
      payload.system = String(frontendQuestion.system).trim()
    }
    
    if (Array.isArray(frontendQuestion.tags) && frontendQuestion.tags.length > 0) {
      payload.tags = frontendQuestion.tags
        .filter((tag: any) => tag && String(tag).trim())
        .map((tag: any) => String(tag).trim())
    }
    
    // Only include explanationBlocks if they exist and are valid
    if (explanationBlocks && explanationBlocks.length > 0) {
      payload.explanationBlocks = explanationBlocks
    }
    
    // Only include perAnswerExplanations if they exist and are valid
    if (Object.keys(perAnswerExplanations).length > 0) {
      payload.perAnswerExplanations = perAnswerExplanations
    }

    // Only include questionStemBlocks if they exist and are valid
    if (questionStemBlocks && questionStemBlocks.length > 0) {
      // Ensure all blocks have proper order and are sorted
      const sortedStemBlocks = questionStemBlocks
        .map((block: any, idx: number) => ({
          ...block,
          order: typeof block.order === "number" ? block.order : idx,
        }))
        .sort((a: any, b: any) => {
          const orderA = typeof a.order === "number" ? a.order : 999
          const orderB = typeof b.order === "number" ? b.order : 999
          return orderA - orderB
        })
      
      payload.questionStemBlocks = sortedStemBlocks
      
      // Debug: Log block count to verify all blocks are being saved
      if (process.env.NODE_ENV === "development") {
        console.log("Saving question stem blocks:", sortedStemBlocks.length, "blocks", sortedStemBlocks.map((b: any) => ({ type: b.type, order: b.order })))
      }
    }

    // Add chapterId and sectionId if provided
    if (frontendQuestion.chapterId && String(frontendQuestion.chapterId).trim()) {
      payload.chapterId = String(frontendQuestion.chapterId).trim()
    }
    
    if (frontendQuestion.sectionId && String(frontendQuestion.sectionId).trim()) {
      payload.sectionId = String(frontendQuestion.sectionId).trim()
    }

    // Store choices separately (not part of DTO)
    return {
      ...payload,
      _choices: choices,
    } as any
  }

  useEffect(() => {
    // Check authentication before loading questions
    if (authService.isAuthenticated()) {
      loadQuestions()
    } else {
      setLoading(false)
      setError("Please log in to access the admin dashboard.")
      // Show demo question as fallback
      setQuestions([DEMO_QUESTION])
    }
  }, [])

  const loadQuestions = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await questionsService.getQuestions({ 
        status: "ACTIVE",
        limit: 100 // Changed from 1000 to 100
      })
      
      const questionsData = Array.isArray(response) 
        ? response 
        : (response as any)?.data || []
      
      const transformedQuestions = questionsData.map(transformBackendToFrontend)
      
      if (transformedQuestions.length === 0) {
        // If no questions in DB, show demo question as fallback
        setQuestions([DEMO_QUESTION])
      } else {
        setQuestions(transformedQuestions)
      }
    } catch (err: any) {
      console.error("Failed to load questions:", err)
      
      // Handle authentication errors
      if (err.message?.includes("Unauthorized") || err.message?.includes("401")) {
        // Clear invalid token
        if (typeof window !== "undefined") {
          localStorage.removeItem("authToken")
          localStorage.removeItem("userData")
        }
        setError("Your session has expired. Please log in again to continue.")
        // Fallback to demo question on auth error
        setQuestions([DEMO_QUESTION])
      } else {
        setError(err.message || "Failed to load questions")
        // Fallback to demo question on error
        setQuestions([DEMO_QUESTION])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSaveQuestion = async (questionData: QuestionCreatorData) => {
    try {
      setError(null)
      
      if (!questionData.metadata.topicId) {
        alert("Please select a topic for this question.")
        return
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

      if (editingId) {
        // Update existing question
        await questionsService.updateQuestion(editingId, questionPayload)
        // Reload questions to get updated data
        await loadQuestions()
        // If viewing the edited question, refresh the view
        if (viewingId === editingId) {
          setViewingId(null)
          setTimeout(() => setViewingId(editingId), 100)
        }
      } else {
        // Create new question
        const createdQuestion = await questionsService.createQuestion(questionPayload)
        
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
        await loadQuestions()
      }
      
      setShowNewQuestion(false)
      setEditingId(null)
      setViewingId(null)
      setParsedMarkdownData(null)
    } catch (err: any) {
      console.error("Failed to save question:", err)
      console.error("Error details:", {
        message: err.message,
        stack: err.stack,
      })
      
      setError(err.message || "Failed to save question")
      alert(`Failed to save question: ${err.message || "Unknown error"}`)
    }
  }


  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) {
      return
    }

    try {
      setError(null)
      await questionsService.deactivateQuestion(id)
      await loadQuestions() // Reload to reflect deletion
    } catch (err: any) {
      console.error("Failed to delete question:", err)
      setError(err.message || "Failed to delete question")
      alert(`Failed to delete question: ${err.message}`)
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

  const editingQuestion = editingId ? questions.find((q) => q.id === editingId) : null
  const viewingQuestion = viewingId ? questions.find((q) => q.id === viewingId) : null
  const filteredQuestions = questions.filter((q) => {
    if (!searchTerm || searchTerm.trim() === "") {
      return true // Show all questions if no search term
    }
    const searchLower = searchTerm.toLowerCase()
    const stem = (q.stem || "").toLowerCase()
    const subject = (q.subject || "").toLowerCase()
    const system = (q.system || "").toLowerCase()
    return stem.includes(searchLower) || subject.includes(searchLower) || system.includes(searchLower)
  })

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card className="p-12">
          <div className="text-center">
            <p className="text-muted-foreground">Loading questions from database...</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-4 py-8 flex-1 flex flex-col min-h-0 w-full">
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {/* Search Bar and New Question Button - Only show when viewing list */}
      {!showNewQuestion && !editingId && !viewingId && !showMarkdownUploader && !showBulkUploader && (
        <div className="space-y-3 mb-4">
          <div className="flex gap-3">
            <Card className="p-4 shadow-md flex-1">
              <input
                type="text"
                placeholder="Search questions by stem, subject, or system..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </Card>
            <div className="relative" ref={menuRef}>
              <Button
                onClick={() => setShowNewQuestionMenu(!showNewQuestionMenu)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                + New Question
              </Button>
              {showNewQuestionMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-50">
                  <div className="py-1">
                    <button
                      onClick={handleUploadMarkdown}
                      className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      📄 Upload Markdown Question
                    </button>
                    <button
                      onClick={handleBulkUploadMarkdown}
                      className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      📚 Bulk Upload Markdown Questions
                    </button>
                    <button
                      onClick={handleCreateManually}
                      className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      ✏️ Create Question Manually
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
              // Optionally show success message
              alert(`Successfully created ${questionIds.length} question(s)!`)
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

      {/* Editor, View, or List */}
      {showNewQuestion || editingId ? (
        <div className="flex-1 min-h-0">
          <QuestionCreator
            initialData={
              editingId && editingQuestion
                ? (() => {
                    const converted = convertOldQuestionToNew(editingQuestion)
                    // Debug: Log what's being passed to QuestionCreator
                    if (process.env.NODE_ENV === "development") {
                      console.log("Passing to QuestionCreator - stem blocks:", converted.stem?.length || 0, "blocks", converted.stem?.map((b: any) => ({ type: b.type, order: b.order })))
                    }
                    return converted
                  })()
                : parsedMarkdownData
                  ? convertOldQuestionToNew(parsedMarkdownData)
                  : undefined
            }
            onSave={handleSaveQuestion}
            onCancel={() => {
              setShowNewQuestion(false)
              setShowMarkdownUploader(false)
              setShowBulkUploader(false)
              setEditingId(null)
              setViewingId(null)
              setParsedMarkdownData(null)
              setShowNewQuestionMenu(false)
            }}
          />
        </div>
      ) : viewingId ? (
        <div className="flex-1 min-h-0">
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
      ) : !showMarkdownUploader && !showBulkUploader ? (
        <div className="flex-1 min-h-0 overflow-y-auto">
          {/* Questions List */}
          {filteredQuestions.length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  {questions.length === 0 ? "No questions created yet" : "No questions match your search"}
                </p>
                <Button onClick={handleCreateManually} variant="outline">
                  {questions.length === 0 ? "Create First Question" : "New Question"}
                </Button>
              </div>
            </Card>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredQuestions.length} of {questions.length} questions
                </p>
              </div>
              <QuestionList
                questions={filteredQuestions}
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
              />
            </>
          )}
        </div>
      ) : null}
      </div>
    </div>
  )
}
