"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog"
import QuestionPanel from "./question-panel"
import ExplanationPanel from "./explanation-panel"
import { QuestionsService } from "@/app/services/questions/questions.service"
import { QuestionPapersService } from "@/app/services/assessments/question-papers.service"
import { QuestionPaperQuestionsService } from "@/app/services/assessments/question-paper-questions.service"
import { authService } from "@/shared/services/auth.service"

const DEMO_QUESTION = {
  id: "demo-1",
  stem: "A 13-year-old girl is brought to the clinic by her mother for a yearly physical examination. The patient feels well but is worried that she has not yet started puberty. Temperature is 36.7°C (98°F), blood pressure is 152/91 mm Hg, pulse is 75/min, and respirations are 18/min. Physical examination is significant for a lack of secondary sexual characteristics; a blind vagina is noted on pelvic examination. Laboratory studies reveal hypokalemia and low testosterone and estradiol levels. Cytogenetic analysis shows a 46,XY karyotype. This patient most likely has deficiency of which of the following enzymes?",
  subject: "Pathology",
  system: "Endocrine",
  options: [
    {
      label: "A",
      value: "A",
      text: "5 alpha-reductase (11%)",
      correct: false,
    },
    {
      label: "B",
      value: "B",
      text: "17 alpha-hydroxylase (66%)",
      correct: true,
    },
    {
      label: "C",
      value: "C",
      text: "11 beta-hydroxylase (8%)",
      correct: false,
    },
    {
      label: "D",
      value: "D",
      text: "17,20-lyase (7%)",
      correct: false,
    },
    {
      label: "E",
      value: "E",
      text: "3 beta-hydroxysteroid dehydrogenase (8%)",
      correct: false,
    },
  ],
  explanation: [
    {
      id: 1,
      type: "text",
      data: {
        markdown:
          "## Overview\n\nThis patient is **genetically male (46,XY)** with features suggestive of **17 alpha-hydroxylase deficiency**, a rare cause of **congenital adrenal hyperplasia (CAH)**. This enzyme deficiency impairs both cortisol and androgen synthesis, leading to accumulation of precursor hormones and shunting toward the mineralocorticoid pathway.",
      },
    },
    {
      id: 2,
      type: "text",
      data: {
        markdown:
          "## Clinical Presentation\n\nThe classic triad of 17 alpha-hydroxylase deficiency includes:\n\n- **Hypertension** from excess mineralocorticoid (11-deoxycorticosterone)\n- **Hypokalemia** from aldosterone-like effects\n- **Sexual underdevelopment** from androgen deficiency\n\nFemale external genitalia with XY karyotype (46,XY) results from lack of androgen action during fetal development. The blind-ending vagina occurs because anti-müllerian hormone (AMH) from fetal testes suppresses müllerian duct development, but without androgenic action, external female genitalia form.",
      },
    },
    {
      id: 3,
      type: "table",
      data: {
        rows: 5,
        cols: 4,
        cells: {
          "0-0": "**Enzyme**",
          "0-1": "**Defect**",
          "0-2": "**Clinical Findings**",
          "0-3": "**Key Feature**",
          "1-0": "17α-hydroxylase",
          "1-1": "↓ Cortisol, ↓ Androgens",
          "1-2": "Hypertension, XX female with XY",
          "1-3": "46,XY phenotypic female",
          "2-0": "11β-hydroxylase",
          "2-1": "↓ Cortisol, ↑ Androgens",
          "2-2": "Hypertension, virilization",
          "2-3": "46,XY virilized female",
          "3-0": "5α-reductase",
          "3-1": "↓ DHT, normal testosterone",
          "3-2": "Ambiguous genitalia, gynecomastia",
          "3-3": "Post-pubertal virilization",
          "4-0": "17,20-lyase",
          "4-1": "↓ Androgens, normal cortisol",
          "4-2": "Sexual underdevelopment only",
          "4-3": "46,XY without hypertension",
        },
      },
    },
    {
      id: 4,
      type: "text",
      data: {
        markdown:
          "## Enzyme Function\n\nThe enzyme **17 alpha-hydroxylase** (cytochrome P450 17A1) catalyzes two sequential reactions:\n\n1. **17-hydroxylation**: Pregnenolone → 17-hydroxypregnenolone and Progesterone → 17-hydroxyprogesterone\n2. **17,20-lyase activity**: 17-hydroxypregnenolone → DHEA and 17-hydroxyprogesterone → Androstenediol\n\nThis enzyme is expressed in both the **adrenal glands** (for cortisol synthesis) and **gonads** (for androgen synthesis). Without functional 17α-hydroxylase, both cortisol and androgen synthesis are impaired.",
      },
    },
    {
      id: 5,
      type: "text",
      data: {
        markdown:
          "## Why This Answer?\n\n### Clinical Reasoning:\n\n- **Hypertension + Hypokalemia**: Indicates excess mineralocorticoid pathway shunting\n- **46,XY with female phenotype**: Requires androgen deficiency during development\n- **Absent secondary sexual characteristics**: Confirms inadequate androgen and estrogen\n- **Low testosterone and estradiol**: Direct result of 17α-hydroxylase deficiency\n\n### Why Not the Others:\n\n- **5α-reductase deficiency**: Would have normal testosterone and hypertension only; virilization occurs at puberty\n- **11β-hydroxylase deficiency**: Causes virilization (elevated androgens), NOT sexual underdevelopment\n- **17,20-lyase deficiency**: Causes sexual underdevelopment but normal blood pressure (no mineralocorticoid excess)\n- **3β-hydroxysteroid dehydrogenase**: Affects multiple pathways; presentation differs",
      },
    },
    {
      id: 6,
      type: "text",
      data: {
        markdown:
          "## Treatment\n\nManagement of 17α-hydroxylase deficiency includes:\n\n- **Glucocorticoid replacement** (hydrocortisone) to suppress ACTH and reduce precursor shunting\n- **Mineralocorticoid antagonist** (spironolactone) for hypertension and hypokalemia\n- **Hormone replacement therapy** for sexual development (estrogen/progesterone for female phenotype patients)",
      },
    },
  ],
  perAnswerExplanations: {
    A: "5 alpha-reductase deficiency causes ambiguous genitalia and gynecomastia at puberty, but testosterone levels are normal or elevated and there is NO hypertension or hypokalemia. This patient has hypertension and low testosterone, which rules out this diagnosis.",
    B: "17 alpha-hydroxylase deficiency is the correct answer. It causes deficiency in both cortisol and androgen synthesis, leading to hypertension (from mineralocorticoid shunting), hypokalemia, and sexual underdevelopment. The 46,XY karyotype with female phenotype is pathognomonic.",
    C: "11 beta-hydroxylase deficiency causes hypertension and hypokalemia like this case, BUT it also causes virilization due to excess androgen production. This patient shows NO virilization and has FEMALE external genitalia, making this diagnosis incompatible.",
    D: "17,20-lyase deficiency causes selective androgen deficiency and sexual underdevelopment, but it does NOT cause hypertension or hypokalemia. This patient has clear hypertension and electrolyte abnormalities, ruling out this diagnosis.",
    E: "3 beta-hydroxysteroid dehydrogenase deficiency presents with salt-wasting crisis in severe cases, with a different biochemical pattern. Additionally, mild forms cause virilization, not the findings seen here.",
  },
}

export default function StudentQuestionView() {
  const router = useRouter()
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEndTestDialog, setShowEndTestDialog] = useState(false)
  const [isEndingTest, setIsEndingTest] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [markedQuestions, setMarkedQuestions] = useState<Set<string>>(new Set())
  const [questionPaperQuestionIds, setQuestionPaperQuestionIds] = useState<Record<string, string>>({})
  const [questionStartTimes, setQuestionStartTimes] = useState<Record<string, number>>({})
  const [questionTimeSpent, setQuestionTimeSpent] = useState<Record<string, number>>({})
  const questionsService = new QuestionsService()
  const questionPapersService = new QuestionPapersService()
  const questionPaperQuestionsService = new QuestionPaperQuestionsService()

  // Helper function to get URL search params
  const getSearchParams = () => {
    if (typeof window === "undefined") return new URLSearchParams()
    return new URLSearchParams(window.location.search)
  }

  // Transform backend question to frontend format
  const transformBackendToFrontend = (backendQuestion: any) => {
    if (!backendQuestion) {
      throw new Error("Backend question is null or undefined")
    }

    const choices = Array.isArray(backendQuestion.choices) ? backendQuestion.choices : []
    
    if (choices.length === 0) {
      console.warn(`⚠️ Question ${backendQuestion.id} has no choices`)
    }
    
    const options = choices.map((choice: any, index: number) => ({
      label: String.fromCharCode(65 + index), // A, B, C, D, E
      value: String.fromCharCode(65 + index),
      text: choice.text || "",
      correct: choice.isCorrect || false,
    }))

    // Transform explanation blocks
    const explanationBlocks = Array.isArray(backendQuestion.explanationBlocks) 
      ? backendQuestion.explanationBlocks 
      : []
    
    const explanation = explanationBlocks.map((block: any) => {
      if (!block) return null
      
      // Check for per-answer-explanation placeholder FIRST, before processing TEXT blocks
      // This handles blocks saved as TEXT with placeholder marker
      if (block.type === "PER_ANSWER_EXPLANATION" || (block.data && (block.data.placeholder === true || block.data.isPerAnswerExplanation === true))) {
        // Handle PER-ANSWER-EXPLANATION placeholder blocks
        return {
          id: block.id || `per-answer-${Math.random()}`,
          type: "per-answer-explanation",
          data: { placeholder: true },
        }
      }
      
      if (block.type === "TEXT") {
        // Handle TEXT blocks - preserve both HTML and markdown for backward compatibility
        const blockData = block.data || {}
        
        return {
          id: block.id || `text-${Math.random()}`,
          type: "text",
          data: {
            // Preserve HTML if it exists
            html: blockData.html || "",
            // Preserve markdown as fallback (for old questions or conversion)
            markdown: blockData.markdown || blockData.content || (typeof blockData === "string" ? blockData : ""),
            // Keep other fields for backward compatibility
            ...blockData,
          },
        }
      } else if (block.type === "TABLE") {
        // Handle TABLE blocks
        return {
          id: block.id || `table-${Math.random()}`,
          type: "table",
          data: block.data || {},
        }
      } else if (block.type === "IMAGES") {
        // Handle IMAGES blocks
        return {
          id: block.id || `images-${Math.random()}`,
          type: "images",
          data: block.data || {},
        }
      } else {
        // Default to text
        return {
          id: block.id || `block-${Math.random()}`,
          type: "text",
          data: block.data || {},
        }
      }
    }).filter((block: any) => block !== null)

    // Transform per-answer explanations - preserve block structure for rich content
    const perAnswerExplanations: Record<string, string | any[]> = {}
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
                // Preserve HTML and markdown from block data
                const blockData = b.data || {}
                return {
                  id: b.id || `text-${Math.random()}`,
                  type: "text",
                  data: {
                    html: blockData.html || "",
                    markdown: blockData.markdown || "",
                    ...blockData,
                  },
                }
              } else if (b.type === "TABLE") {
                // Handle TABLE blocks - ensure tableHtml is present
                const blockData = b.data || {}
                // Use tableHtml if available, otherwise use html
                if (!blockData.tableHtml && blockData.html) {
                  blockData.tableHtml = blockData.html
                }
                return {
                  id: b.id || `table-${Math.random()}`,
                  type: "table",
                  data: blockData,
                }
              } else if (b.type === "IMAGES") {
                return {
                  id: b.id || `images-${Math.random()}`,
                  type: "images",
                  data: b.data || {},
                }
              }
              return null
            })
            .filter((b: any) => b !== null)
          
          if (transformedBlocks.length > 0) {
            perAnswerExplanations[pae.choiceLabel] = transformedBlocks
          }
        } else {
          // Simple text explanation - preserve as blocks with HTML
          const transformedBlocks = blocks
            .filter((b: any) => b != null && b.type === "TEXT")
            .map((b: any) => {
              const blockData = b.data || {}
              return {
                id: b.id || `text-${Math.random()}`,
                type: "text",
                data: {
                  html: blockData.html || "",
                  markdown: blockData.markdown || "",
                  ...blockData,
                },
              }
            })
          
          if (transformedBlocks.length > 0) {
            perAnswerExplanations[pae.choiceLabel] = transformedBlocks
          }
        }
      }
    }

    // Transform question stem blocks from backend format to frontend format
    // Match the logic from admin-dashboard.tsx for consistency
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
              id: block.id || `block-${Date.now()}-${index}`,
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

    // Extract questionId from tags if stored there (from edit mode)
    let storedQuestionId: string | null = null
    const tags = Array.isArray(backendQuestion.tags) ? backendQuestion.tags : []
    const filteredTags: string[] = []
    
    for (const tag of tags) {
      if (typeof tag === "string" && tag.startsWith("__questionId:")) {
        storedQuestionId = tag.replace("__questionId:", "")
      } else {
        filteredTags.push(String(tag))
      }
    }
    
    // Generate questionId based on system, subject, and topic (same logic as edit mode)
    // Only generate if not stored in tags
    const generateQuestionId = () => {
      const system = backendQuestion.system || backendQuestion.subject || ""
      const subject = backendQuestion.subject || ""
      const topicId = backendQuestion.topicId || backendQuestion.topic?.id || ""
      
      if (!system && !subject && !topicId) {
        return null
      }

      // Get abbreviations from names
      const systemAbbr = system
        ? system
            .split(" ")
            .map((word: string) => word.charAt(0).toUpperCase())
            .join("")
            .substring(0, 4)
        : "SYS"
      
      const subjectAbbr = subject
        ? subject
            .split(" ")
            .map((word: string) => word.charAt(0).toUpperCase())
            .join("")
            .substring(0, 4)
        : "SUB"
      
      // Use last 4 characters of topic ID as unique identifier
      const topicAbbr = topicId ? topicId.slice(-4).toUpperCase() : "TOP"

      return `Q-${systemAbbr}-${subjectAbbr}-${topicAbbr}`
    }

    return {
      id: backendQuestion.id,
      questionId: storedQuestionId || generateQuestionId(),
      stem: backendQuestion.question || "",
      questionStemBlocks,
      subject: backendQuestion.subject || "",
      system: backendQuestion.system || "",
      topic: backendQuestion.topic,
      topicId: backendQuestion.topicId,
      options,
      explanation,
      perAnswerExplanations,
      tags: filteredTags, // Return tags without the questionId marker
    }
  }

  // Restore selected answer when question changes and track time
  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex < questions.length) {
      const currentQuestion = questions[currentQuestionIndex]
      if (currentQuestion) {
        const savedAnswer = answers[currentQuestion.id]
        setSelectedAnswer(savedAnswer || null)
        setAnswered(!!savedAnswer)
        
        // Track start time for current question
        const now = Date.now()
        setQuestionStartTimes((prev) => {
          // If this question hasn't been viewed before, record the start time
          if (!prev[currentQuestion.id]) {
            return { ...prev, [currentQuestion.id]: now }
          }
          return prev
        })
      }
    }
  }, [currentQuestionIndex, questions, answers])

  // Track time spent when leaving a question
  const recordTimeSpent = (questionId: string) => {
    const startTime = questionStartTimes[questionId]
    if (startTime) {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000) // Convert to seconds
      setQuestionTimeSpent((prev) => {
        // Accumulate time if question was visited multiple times
        const existingTime = prev[questionId] || 0
        return { ...prev, [questionId]: existingTime + timeSpent }
      })
      // Reset start time for this question
      setQuestionStartTimes((prev) => {
        const updated = { ...prev }
        delete updated[questionId]
        return updated
      })
    }
  }

  useEffect(() => {
    loadQuestions()
  }, [])

  const loadQuestions = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Check if auth token exists
      const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
      if (!token) {
        console.warn("⚠️ No auth token found. Questions endpoint requires authentication.")
        setError("Authentication required. Please log in to view questions.")
        setQuestions([DEMO_QUESTION])
        setLoading(false)
        return
      }

      // Check for filter parameters in URL
      const searchParams = getSearchParams()
      const questionPaperIdParam = searchParams.get("questionPaperId")
      const tagIdsParam = searchParams.get("tagIds")
      const systemIdsParam = searchParams.get("systemIds")
      const subjectIdsParam = searchParams.get("subjectIds")
      const topicIdsParam = searchParams.get("topicIds")
      const poolParam = searchParams.get("pool")
      const markedParam = searchParams.get("marked")
      const limitParam = searchParams.get("limit")

      let allQuestions: any[] = []

      // If questionPaperId is provided, load from saved test
      if (questionPaperIdParam) {
        console.log("📚 Loading questions from saved question paper:", questionPaperIdParam)
        
        // Fetch question paper questions
        const questionsResponse = await questionPaperQuestionsService.getQuestionPaperQuestions({
          questionPaperId: questionPaperIdParam,
          limit: 100,
        })
        
        // Handle paginated response
        let questionPaperQuestions = Array.isArray(questionsResponse)
          ? questionsResponse
          : (questionsResponse as any)?.data || []
        
        // If paginated, fetch all pages
        if (!Array.isArray(questionsResponse) && (questionsResponse as any)?.pagination) {
          const pagination = (questionsResponse as any).pagination
          let page = 2
          while (page <= pagination.totalPages) {
            const nextPage = await questionPaperQuestionsService.getQuestionPaperQuestions({
              questionPaperId: questionPaperIdParam,
              limit: 100,
              page,
            })
            const nextPageData = Array.isArray(nextPage) ? nextPage : (nextPage as any)?.data || []
            questionPaperQuestions = [...questionPaperQuestions, ...nextPageData]
            page++
          }
        }
        
        // Sort by order to maintain question sequence
        questionPaperQuestions.sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
        
        console.log(`📋 Loaded ${questionPaperQuestions.length} question paper questions`)
        console.log("🔍 Sample question paper question:", questionPaperQuestions[0] ? {
          questionId: questionPaperQuestions[0].questionId,
          markedForReview: questionPaperQuestions[0].markedForReview,
          markedForReviewType: typeof questionPaperQuestions[0].markedForReview,
        } : "No questions")
        
        // Extract question IDs and restore answers, marked status, and question paper question IDs
        const questionIds = questionPaperQuestions.map((qpq: any) => qpq.questionId)
        const restoredAnswers: Record<string, string> = {}
        const restoredMarked: Set<string> = new Set()
        const restoredQPQIds: Record<string, string> = {}
        
        questionPaperQuestions.forEach((qpq: any) => {
          if (qpq.userAnswer) {
            restoredAnswers[qpq.questionId] = qpq.userAnswer
          }
          // Explicitly check for true (handle boolean, string "true", or 1)
          const isMarked = qpq.markedForReview === true || qpq.markedForReview === "true" || qpq.markedForReview === 1
          if (isMarked) {
            restoredMarked.add(qpq.questionId)
            console.log(`✅ Restored marked status for question ${qpq.questionId} (value: ${qpq.markedForReview}, type: ${typeof qpq.markedForReview})`)
          } else {
            // Explicitly handle false values - question is NOT marked
            const isUnmarked = qpq.markedForReview === false || qpq.markedForReview === "false" || qpq.markedForReview === 0
            if (isUnmarked) {
              // Ensure question is NOT in the marked set (explicitly remove if it was there)
              restoredMarked.delete(qpq.questionId)
              console.log(`❌ Question ${qpq.questionId} is unmarked (value: ${qpq.markedForReview}, type: ${typeof qpq.markedForReview})`)
            } else if (qpq.markedForReview !== null && qpq.markedForReview !== undefined) {
              // Log unexpected values (neither true nor false)
              console.warn(`⚠️ Unexpected markedForReview value for question ${qpq.questionId}:`, qpq.markedForReview, typeof qpq.markedForReview)
            }
          }
          restoredQPQIds[qpq.questionId] = qpq.id
        })
        
        console.log(`📌 Restored ${restoredMarked.size} marked questions:`, Array.from(restoredMarked))
        setMarkedQuestions(restoredMarked)
        setQuestionPaperQuestionIds(restoredQPQIds)
        
        // Update answers state
        setAnswers(restoredAnswers)
        
        // Fetch full question details
        const questionPromises = questionIds.map(async (questionId: string) => {
          try {
            return await questionsService.getQuestion(questionId)
          } catch (err) {
            console.error(`Failed to fetch question ${questionId}:`, err)
            throw err
          }
        })
        
        allQuestions = await Promise.all(questionPromises)
        console.log(`✅ Loaded ${allQuestions.length} questions from saved test`)
      } else {
        // Original logic for loading from filters or all questions
        const hasFilters = tagIdsParam || systemIdsParam || subjectIdsParam || topicIdsParam

        if (hasFilters) {
        // Use filtered questions endpoint
        console.log("🔍 Loading filtered questions based on test configuration...")
        
        const filters: any = {}
        if (tagIdsParam) {
          filters.tagIds = tagIdsParam.split(",").filter((id) => id.trim())
        }
        if (systemIdsParam) {
          filters.systemIds = systemIdsParam.split(",").filter((id) => id.trim())
        }
        if (subjectIdsParam) {
          filters.subjectIds = subjectIdsParam.split(",").filter((id) => id.trim())
        }
        if (topicIdsParam) {
          filters.topicIds = topicIdsParam.split(",").filter((id) => id.trim())
        }
        if (limitParam) {
          filters.limit = parseInt(limitParam, 10)
        } else {
          filters.limit = 100
        }
        if (poolParam) {
          if (poolParam === "marked") {
            // Legacy support: if pool="marked", treat it as marked=true
            filters.marked = true
          } else {
            // Set pool for other types
            filters.pool = poolParam as "unused" | "incorrect" | "correct" | "omitted"
          }
        }
        if (markedParam === "true") {
          filters.marked = true
        }

        console.log("📋 Filter parameters:", filters)

        allQuestions = await questionsService.getFilteredQuestions(filters)
        console.log(`✅ Loaded ${allQuestions.length} filtered questions`)
      } else {
        // Use regular questions endpoint (load all)
        console.log("🔍 Starting to load all questions from database...")
        
        const cacheBuster = Date.now()
        let page = 1
        const limit = 100
        let hasMore = true

        while (hasMore && page <= 10) {
          console.log(`📄 Fetching page ${page}...`)

          const response = await questionsService.getQuestions({ 
            status: "ACTIVE",
            page,
            limit,
            sortBy: "createdAt",
            sortOrder: "asc",
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
        
        console.log(`✅ Loaded ${allQuestions.length} total questions from database`)
        }
      }
      
      if (allQuestions.length === 0) {
        console.log("⚠️ No questions found, using demo question")
        setError("No questions found matching the selected filters.")
        setQuestions([DEMO_QUESTION])
        setLoading(false)
        return
      }
      
      const transformedQuestions = allQuestions.map((q, idx) => {
        try {
          return transformBackendToFrontend(q)
        } catch (transformErr: any) {
          console.error(`❌ Failed to transform question ${idx}:`, transformErr)
          return null
        }
      }).filter((q) => q !== null)
      
      console.log(`✅ Transformed ${transformedQuestions.length} questions successfully`)
      
      if (transformedQuestions.length === 0) {
        console.log("⚠️ All questions failed transformation, using demo question")
        setError("Failed to process questions from database. Using demo question.")
        setQuestions([DEMO_QUESTION])
      } else {
        console.log(`✅ Setting ${transformedQuestions.length} questions`)
        setQuestions(transformedQuestions)
        
        // Check if questionPaperId exists in URL - if so, reload marked status from that paper
        const checkParams = getSearchParams()
        const existingQuestionPaperIdForCheck = checkParams.get("questionPaperId")
        
        if (existingQuestionPaperIdForCheck) {
          // Reload marked status from the existing question paper
          try {
            console.log("🔄 Reloading marked status from question paper:", existingQuestionPaperIdForCheck)
            
            // Fetch all question paper questions with pagination
            let questionPaperQuestions: any[] = []
            let page = 1
            let hasMore = true
            
            while (hasMore) {
              const qpqResponse = await questionPaperQuestionsService.getQuestionPaperQuestions({
                questionPaperId: existingQuestionPaperIdForCheck,
                limit: 100,
                page,
              })
              
              const qpqArray = Array.isArray(qpqResponse)
                ? qpqResponse
                : (qpqResponse as any)?.data || []
              
              questionPaperQuestions = [...questionPaperQuestions, ...qpqArray]
              
              // Check if there are more pages
              if (Array.isArray(qpqResponse)) {
                hasMore = false
              } else {
                const pagination = (qpqResponse as any)?.pagination
                hasMore = pagination && page < pagination.totalPages
                page++
              }
              
              if (qpqArray.length === 0) {
                hasMore = false
              }
            }
            
            // Restore marked status and question paper question IDs
            const restoredMarked = new Set<string>()
            const restoredQPQIds: Record<string, string> = {}
            
            questionPaperQuestions.forEach((qpq: any) => {
              const isMarked = qpq.markedForReview === true || qpq.markedForReview === "true" || qpq.markedForReview === 1
              if (isMarked) {
                restoredMarked.add(qpq.questionId)
                console.log(`✅ Restored marked status for question ${qpq.questionId}`)
              }
              restoredQPQIds[qpq.questionId] = qpq.id
            })
            
            console.log(`📌 Restored ${restoredMarked.size} marked questions from question paper:`, Array.from(restoredMarked))
            setMarkedQuestions(restoredMarked)
            setQuestionPaperQuestionIds(restoredQPQIds)
          } catch (error) {
            console.error("Failed to reload marked status from question paper:", error)
          }
        } else {
          // Check if any questions were marked in previous tests (only when loading from filters, not from existing test)
          // Only check for previously marked questions when creating a new test from filters
          try {
            const user = authService.getCurrentUser()
            if (user && user.id && transformedQuestions.length > 0) {
              console.log("🔍 Checking for previously marked questions...")
              
              // Get all question paper questions for this user to find previously marked questions
              const questionIds = transformedQuestions.map(q => q.id)
              
              // Fetch all question papers for the user with pagination
              let allQuestionPapers: any[] = []
              let page = 1
              let hasMore = true
              
              while (hasMore) {
                try {
                  const userQuestionPapers = await questionPapersService.getQuestionPapers({
                    userId: user.id,
                    limit: 100, // Maximum allowed by backend
                    page,
                  })
                  
                  const questionPaperArray = Array.isArray(userQuestionPapers)
                    ? userQuestionPapers
                    : (userQuestionPapers as any)?.data || []
                  
                  allQuestionPapers = [...allQuestionPapers, ...questionPaperArray]
                  
                  // Check if there are more pages
                  if (Array.isArray(userQuestionPapers)) {
                    hasMore = false
                  } else {
                    const pagination = (userQuestionPapers as any)?.pagination
                    hasMore = pagination && page < pagination.totalPages
                    page++
                  }
                  
                  if (questionPaperArray.length === 0) {
                    hasMore = false
                  }
                } catch (error) {
                  console.error(`Failed to fetch question papers page ${page}:`, error)
                  hasMore = false
                }
              }
              
              const questionPaperIds = allQuestionPapers.map((qp: any) => qp.id)
              
              if (questionPaperIds.length > 0) {
                // Get all question paper questions for these question IDs
                const allMarkedQuestions = new Set<string>()
                
                // Fetch question paper questions in batches with pagination
                for (const questionPaperId of questionPaperIds) {
                  try {
                    let qpqPage = 1
                    let qpqHasMore = true
                    
                    while (qpqHasMore) {
                      const qpqResponse = await questionPaperQuestionsService.getQuestionPaperQuestions({
                        questionPaperId,
                        limit: 100,
                        page: qpqPage,
                      })
                      
                      const qpqArray = Array.isArray(qpqResponse)
                        ? qpqResponse
                        : (qpqResponse as any)?.data || []
                      
                      // Check if any of our current questions were marked in this paper
                      qpqArray.forEach((qpq: any) => {
                        if (questionIds.includes(qpq.questionId)) {
                          const isMarked = qpq.markedForReview === true || qpq.markedForReview === "true" || qpq.markedForReview === 1
                          if (isMarked) {
                            allMarkedQuestions.add(qpq.questionId)
                          }
                        }
                      })
                      
                      // Check if there are more pages
                      if (Array.isArray(qpqResponse)) {
                        qpqHasMore = false
                      } else {
                        const pagination = (qpqResponse as any)?.pagination
                        qpqHasMore = pagination && qpqPage < pagination.totalPages
                        qpqPage++
                      }
                      
                      if (qpqArray.length === 0) {
                        qpqHasMore = false
                      }
                    }
                  } catch (error) {
                    console.error(`Failed to fetch questions for paper ${questionPaperId}:`, error)
                  }
                }
                
                if (allMarkedQuestions.size > 0) {
                  console.log(`📌 Found ${allMarkedQuestions.size} questions that were marked in previous tests:`, Array.from(allMarkedQuestions))
                  // Merge with existing marked questions
                  setMarkedQuestions((prev) => {
                    const merged = new Set(prev)
                    allMarkedQuestions.forEach(id => merged.add(id))
                    return merged
                  })
                }
              }
            }
          } catch (error) {
            console.error("Failed to check for previously marked questions:", error)
            // Don't block the UI if this fails
          }
        }
        
        // If no questionPaperId exists yet, create one so marked status can be saved
        const params = getSearchParams()
        const existingQuestionPaperId = params.get("questionPaperId")
        if (!existingQuestionPaperId && transformedQuestions.length > 0) {
          try {
            const user = authService.getCurrentUser()
            if (user && user.id) {
              console.log("📝 Creating question paper for test session...")
              const questionPaper = await questionPapersService.createQuestionPaper({
                userId: user.id,
                name: `Practice Test - ${new Date().toLocaleDateString()}`,
                type: "practice",
                totalQuestions: transformedQuestions.length,
                isActive: true,
              })
              
              const newQuestionPaperId = (questionPaper as any)?.id || questionPaper.id
              if (newQuestionPaperId) {
                // Update URL to include questionPaperId
                const currentUrl = new URL(window.location.href)
                currentUrl.searchParams.set("questionPaperId", newQuestionPaperId)
                window.history.replaceState({}, "", currentUrl.toString())
                
                // Get current marked questions state (including previously marked ones)
                // Use the marked questions that were already found above
                const previouslyMarked = new Set<string>()
                // The marked questions state should already be updated from the check above
                // We'll use a simple approach: check the current markedQuestions state
                // But since state updates are async, we'll check directly from the database
                try {
                  // Fetch all question papers for the user with pagination
                  let allQuestionPapers: any[] = []
                  let page = 1
                  let hasMore = true
                  
                  while (hasMore) {
                    try {
                      const userQuestionPapers = await questionPapersService.getQuestionPapers({
                        userId: user.id,
                        limit: 100,
                        page,
                      })
                      
                      const questionPaperArray = Array.isArray(userQuestionPapers)
                        ? userQuestionPapers
                        : (userQuestionPapers as any)?.data || []
                      
                      allQuestionPapers = [...allQuestionPapers, ...questionPaperArray]
                      
                      // Check if there are more pages
                      if (Array.isArray(userQuestionPapers)) {
                        hasMore = false
                      } else {
                        const pagination = (userQuestionPapers as any)?.pagination
                        hasMore = pagination && page < pagination.totalPages
                        page++
                      }
                      
                      if (questionPaperArray.length === 0) {
                        hasMore = false
                      }
                    } catch (error) {
                      console.error(`Failed to fetch question papers page ${page}:`, error)
                      hasMore = false
                    }
                  }
                  
                  const questionPaperIds = allQuestionPapers
                    .map((qp: any) => qp.id)
                    .filter((id: string) => id !== newQuestionPaperId) // Skip current paper
                  
                  for (const qpId of questionPaperIds) {
                    try {
                      let qpqPage = 1
                      let qpqHasMore = true
                      
                      while (qpqHasMore) {
                        const qpqResponse = await questionPaperQuestionsService.getQuestionPaperQuestions({
                          questionPaperId: qpId,
                          limit: 100,
                          page: qpqPage,
                        })
                        
                        const qpqArray = Array.isArray(qpqResponse)
                          ? qpqResponse
                          : (qpqResponse as any)?.data || []
                        
                        qpqArray.forEach((qpq: any) => {
                          if (transformedQuestions.some(q => q.id === qpq.questionId)) {
                            const isMarked = qpq.markedForReview === true || qpq.markedForReview === "true" || qpq.markedForReview === 1
                            if (isMarked) {
                              previouslyMarked.add(qpq.questionId)
                            }
                          }
                        })
                        
                        // Check if there are more pages
                        if (Array.isArray(qpqResponse)) {
                          qpqHasMore = false
                        } else {
                          const pagination = (qpqResponse as any)?.pagination
                          qpqHasMore = pagination && qpqPage < pagination.totalPages
                          qpqPage++
                        }
                        
                        if (qpqArray.length === 0) {
                          qpqHasMore = false
                        }
                      }
                    } catch (error) {
                      // Continue with other papers
                    }
                  }
                } catch (error) {
                  // If this fails, just continue without preserving marked status
                }
                
                // Create question paper questions, preserving marked status from previous tests
                await Promise.all(
                  transformedQuestions.map(async (question, index) => {
                    try {
                      const wasMarkedInPreviousTest = previouslyMarked.has(question.id)
                      const created = await questionPaperQuestionsService.createQuestionPaperQuestion({
                        questionPaperId: newQuestionPaperId,
                        questionId: question.id,
                        order: index,
                        markedForReview: wasMarkedInPreviousTest, // Preserve marked status from previous tests
                      })
                      const id = (created as any)?.id || (created as any)?.data?.id || created?.id
                      if (id) {
                        setQuestionPaperQuestionIds((prev) => ({
                          ...prev,
                          [question.id]: id,
                        }))
                      }
                      // Update marked questions state if this was marked in previous test
                      if (wasMarkedInPreviousTest) {
                        setMarkedQuestions((prev) => {
                          const updated = new Set(prev)
                          updated.add(question.id)
                          return updated
                        })
                      }
                    } catch (error: any) {
                      // If already exists, fetch it
                      if (error.message?.includes("already exists")) {
                        const existing = await questionPaperQuestionsService.getQuestionPaperQuestions({
                          questionPaperId: newQuestionPaperId,
                          questionId: question.id,
                        })
                        const existingArray = Array.isArray(existing) ? existing : []
                        const existingQPQ = existingArray[0]
                        if (existingQPQ) {
                          setQuestionPaperQuestionIds((prev) => ({
                            ...prev,
                            [question.id]: existingQPQ.id,
                          }))
                          // Check if it was marked
                          const isMarked = existingQPQ.markedForReview === true || (typeof existingQPQ.markedForReview === "string" && existingQPQ.markedForReview === "true") || (typeof existingQPQ.markedForReview === "number" && existingQPQ.markedForReview === 1)
                          if (isMarked) {
                            setMarkedQuestions((prev) => {
                              const updated = new Set(prev)
                              updated.add(question.id)
                              return updated
                            })
                          }
                        }
                      }
                    }
                  })
                )
                
                console.log("✅ Question paper created and questions initialized")
              }
            }
          } catch (error) {
            console.error("Failed to create question paper:", error)
            // Don't block the UI if this fails
          }
        }
      }
    } catch (err: any) {
      console.error("❌ Failed to load questions:", err)
      
      let errorMessage = err.message || "Failed to load questions"
      if (err.message?.includes("401") || err.message?.includes("Unauthorized")) {
        errorMessage = "Authentication required. Please log in to view questions."
      } else if (err.message?.includes("403") || err.message?.includes("Forbidden")) {
        errorMessage = "You don't have permission to view questions."
      } else if (err.message?.includes("Network") || err.message?.includes("fetch")) {
        errorMessage = "Network error. Please check your connection."
      }
      
      setError(errorMessage)
      setQuestions([DEMO_QUESTION])
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAnswer = (option: string) => {
    if (!answered) {
      setSelectedAnswer(option)
      setAnswered(true)
      // Save answer
      const currentQuestion = questions[currentQuestionIndex]
      if (currentQuestion) {
        setAnswers((prev) => ({
          ...prev,
          [currentQuestion.id]: option,
        }))
        // Save answer to database if question paper exists
        saveAnswerToDatabase(currentQuestion.id, option)
      }
    }
  }

  const handleToggleMark = async () => {
    const currentQuestion = questions[currentQuestionIndex]
    if (!currentQuestion) return

    const isMarked = markedQuestions.has(currentQuestion.id)
    const newMarked = new Set(markedQuestions)
    
    if (isMarked) {
      newMarked.delete(currentQuestion.id)
    } else {
      newMarked.add(currentQuestion.id)
    }
    
    setMarkedQuestions(newMarked)
    
    // Save marked status to database
    await saveMarkedStatusToDatabase(currentQuestion.id, !isMarked)
  }

  const saveAnswerToDatabase = async (questionId: string, answer: string) => {
    try {
      const params = getSearchParams()
      const questionPaperId = params.get("questionPaperId")
      if (!questionPaperId) return

      const qpqId = questionPaperQuestionIds[questionId]
      if (!qpqId) return

      const question = questions.find((q) => q.id === questionId)
      if (!question) return

      const correctOption = question.options.find((o: any) => o.correct)
      const isCorrect = answer === correctOption?.value ? true : false

      await questionPaperQuestionsService.updateQuestionPaperQuestion(qpqId, {
        userAnswer: answer,
        isCorrect: isCorrect,
        markedForReview: markedQuestions.has(questionId),
      })
    } catch (error) {
      console.error("Failed to save answer to database:", error)
    }
  }

  const saveMarkedStatusToDatabase = async (questionId: string, marked: boolean) => {
    try {
      const params = getSearchParams()
      const questionPaperId = params.get("questionPaperId")
      if (!questionPaperId) return

      console.log(`💾 Saving marked status for question ${questionId}: marked=${marked}`)

      const qpqId = questionPaperQuestionIds[questionId]
      if (!qpqId) {
        // If question paper question doesn't exist yet, create it
        try {
          const created = await questionPaperQuestionsService.createQuestionPaperQuestion({
            questionPaperId,
            questionId,
            order: currentQuestionIndex,
            markedForReview: marked,
          })
          const id = (created as any)?.id || (created as any)?.data?.id || created?.id
          if (id) {
            setQuestionPaperQuestionIds((prev) => ({
              ...prev,
              [questionId]: id,
            }))
          }
        } catch (error: any) {
          // If it already exists, try to update it
          if (error.message?.includes("already exists")) {
            const existing = await questionPaperQuestionsService.getQuestionPaperQuestions({
              questionPaperId,
              questionId,
            })
            const existingArray = Array.isArray(existing) ? existing : []
            const existingQPQ = existingArray[0]
            if (existingQPQ) {
              await questionPaperQuestionsService.updateQuestionPaperQuestion(existingQPQ.id, {
                markedForReview: marked,
              })
              setQuestionPaperQuestionIds((prev) => ({
                ...prev,
                [questionId]: existingQPQ.id,
              }))
            }
          }
        }
        return
      }

      // Update existing question paper question
      const question = questions.find((q) => q.id === questionId)
      const userAnswer = answers[questionId] || null
      const correctOption = question?.options.find((o: any) => o.correct)
      const isCorrect = userAnswer === correctOption?.value ? true : userAnswer ? false : null

      // Explicitly include markedForReview even if false to ensure it's sent to the backend
      const updatePayload: any = {
        markedForReview: marked, // Always include, even if false
      }
      
      // Only include userAnswer and isCorrect if they have values
      if (userAnswer) {
        updatePayload.userAnswer = userAnswer
      }
      if (isCorrect !== null && isCorrect !== undefined) {
        updatePayload.isCorrect = isCorrect
      }
      
      console.log(`📤 Sending update payload for question ${questionId}:`, updatePayload)
      
      const updated = await questionPaperQuestionsService.updateQuestionPaperQuestion(qpqId, updatePayload)
      console.log(`✅ Successfully updated marked status for question ${questionId}: marked=${marked}`, updated)
      
      // Check the returned value from the update
      const returnedMarked = (updated as any)?.markedForReview ?? (updated as any)?.data?.markedForReview
      if (returnedMarked !== undefined) {
        const isMarkedInReturned = returnedMarked === true || returnedMarked === "true" || returnedMarked === 1
        console.log(`🔍 Update returned markedForReview: ${returnedMarked} (expected: ${marked})`)
        
        // Sync local state with returned value
        setMarkedQuestions((prev) => {
          const updated = new Set(prev)
          if (isMarkedInReturned) {
            updated.add(questionId)
          } else {
            updated.delete(questionId)
          }
          return updated
        })
      }
      
      // Also verify by fetching the latest value to ensure consistency
      try {
        // Wait a bit for the database to commit the transaction
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const verify = await questionPaperQuestionsService.getQuestionPaperQuestions({
          questionPaperId,
          questionId,
        })
        const verifyArray = Array.isArray(verify) ? verify : (verify as any)?.data || []
        if (verifyArray.length > 0) {
          const latestMarked = verifyArray[0].markedForReview
          const isMarkedInDb = latestMarked === true || latestMarked === "true" || latestMarked === 1
          console.log(`🔍 Verified marked status for question ${questionId}: ${latestMarked} (expected: ${marked})`)
          
          // Sync local state with database value to ensure consistency
          setMarkedQuestions((prev) => {
            const updated = new Set(prev)
            if (isMarkedInDb) {
              updated.add(questionId)
            } else {
              updated.delete(questionId)
            }
            return updated
          })
        }
      } catch (verifyError) {
        console.warn("Failed to verify marked status:", verifyError)
      }
    } catch (error) {
      console.error("Failed to save marked status to database:", error)
      // On error, revert the local state change to match what's in the database
      try {
        const params = getSearchParams()
        const questionPaperIdForRevert = params.get("questionPaperId")
        if (!questionPaperIdForRevert) return
        
        const current = await questionPaperQuestionsService.getQuestionPaperQuestions({
          questionPaperId: questionPaperIdForRevert,
          questionId,
        })
        const currentArray = Array.isArray(current) ? current : (current as any)?.data || []
        if (currentArray.length > 0) {
          const dbMarked = currentArray[0].markedForReview
          const isMarkedInDb = dbMarked === true || dbMarked === "true" || dbMarked === 1
          setMarkedQuestions((prev) => {
            const updated = new Set(prev)
            if (isMarkedInDb) {
              updated.add(questionId)
            } else {
              updated.delete(questionId)
            }
            return updated
          })
        }
      } catch (revertError) {
        console.error("Failed to revert state on error:", revertError)
      }
    }
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      // Record time spent on current question before moving
      const currentQuestion = questions[currentQuestionIndex]
      if (currentQuestion) {
        recordTimeSpent(currentQuestion.id)
      }
      
      const nextIndex = currentQuestionIndex + 1
      setCurrentQuestionIndex(nextIndex)
      const nextQuestion = questions[nextIndex]
      const savedAnswer = nextQuestion ? answers[nextQuestion.id] : null
      setSelectedAnswer(savedAnswer || null)
      setAnswered(!!savedAnswer)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      // Record time spent on current question before moving
      const currentQuestion = questions[currentQuestionIndex]
      if (currentQuestion) {
        recordTimeSpent(currentQuestion.id)
      }
      
      const prevIndex = currentQuestionIndex - 1
      setCurrentQuestionIndex(prevIndex)
      const prevQuestion = questions[prevIndex]
      const savedAnswer = prevQuestion ? answers[prevQuestion.id] : null
      setSelectedAnswer(savedAnswer || null)
      setAnswered(!!savedAnswer)
    }
  }

  const handleEndTest = async () => {
    setIsEndingTest(true)
    try {
      // Record time spent on current question before ending test
      const currentQuestion = questions[currentQuestionIndex]
      if (currentQuestion) {
        recordTimeSpent(currentQuestion.id)
      }
      
      const user = authService.getCurrentUser()
      if (!user || !user.id) {
        throw new Error("User not authenticated")
      }

      // Get URL params for test metadata
      const params = getSearchParams()
      const existingQuestionPaperId = params.get("questionPaperId")
      const tagIds = params.get("tagIds")?.split(",").filter(Boolean) || []
      const systemIds = params.get("systemIds")?.split(",").filter(Boolean) || []
      const subjectIds = params.get("subjectIds")?.split(",").filter(Boolean) || []
      const topicIds = params.get("topicIds")?.split(",").filter(Boolean) || []
      const mode = params.get("mode") || "tutor"
      const isTimed = params.get("timed") === "true"

      let questionPaperId: string

      // Check if we're resuming an existing test
      if (existingQuestionPaperId) {
        console.log("📝 Updating existing test:", existingQuestionPaperId)
        questionPaperId = existingQuestionPaperId

        // Fetch existing question paper questions to get their IDs
        let existingQuestionPaperQuestions = await questionPaperQuestionsService.getQuestionPaperQuestions({
          questionPaperId: existingQuestionPaperId,
          limit: 100,
        })

        // Handle pagination if needed
        if (!Array.isArray(existingQuestionPaperQuestions)) {
          existingQuestionPaperQuestions = (existingQuestionPaperQuestions as any)?.data || []
        }

        // If there are more than 100 questions, fetch all pages
        const existingArray = Array.isArray(existingQuestionPaperQuestions) 
          ? existingQuestionPaperQuestions 
          : (existingQuestionPaperQuestions as any)?.data || []
        if (existingArray.length === 100) {
          let allQuestions = [...existingArray]
          let page = 2
          while (true) {
            const nextPage = await questionPaperQuestionsService.getQuestionPaperQuestions({
              questionPaperId: existingQuestionPaperId,
              limit: 100,
              page,
            })
            const nextPageArray = Array.isArray(nextPage) ? nextPage : (nextPage as any)?.data || []
            if (nextPageArray.length === 0) break
            allQuestions = [...allQuestions, ...nextPageArray]
            if (nextPageArray.length < 100) break
            page++
          }
          existingQuestionPaperQuestions = allQuestions
        }

        // Create a map of questionId -> QuestionPaperQuestion for quick lookup
        const existingQPQMap = new Map(
          existingQuestionPaperQuestions.map((qpq: any) => [qpq.questionId, qpq])
        )

        // Update or create question paper questions
        const questionUpdates = await Promise.all(
          questions.map(async (question, index) => {
            const existingQPQ = existingQPQMap.get(question.id)
            
            if (existingQPQ) {
              // Update existing question paper question
              const userAnswer = answers[question.id] || null
              const correctOption = question.options.find((o: any) => o.correct)
              const isCorrect = userAnswer === correctOption?.value ? true : userAnswer ? false : null

              // Explicitly set markedForReview to true or false (not undefined)
              const isMarked = markedQuestions.has(question.id)
              // Get time spent for this question
              const timeSpent = questionTimeSpent[question.id] || 0
              
              await questionPaperQuestionsService.updateQuestionPaperQuestion(existingQPQ.id, {
                userAnswer: userAnswer || undefined,
                isCorrect: isCorrect ?? undefined,
                timeSpent: timeSpent,
                order: index,
                markedForReview: isMarked, // Explicitly true or false
              })
              console.log(`💾 End test: Updated question ${question.id} - markedForReview=${isMarked}`)
              return { id: existingQPQ.id, question, success: true }
            } else {
              // Create new question paper question if it doesn't exist
              try {
                const created = await questionPaperQuestionsService.createQuestionPaperQuestion({
                  questionPaperId,
                  questionId: question.id,
                  order: index,
                })
                const id = (created as any)?.id || (created as any)?.data?.id || created?.id
                
                const userAnswer = answers[question.id] || null
                const correctOption = question.options.find((o: any) => o.correct)
                const isCorrect = userAnswer === correctOption?.value ? true : userAnswer ? false : null

              // Explicitly set markedForReview to true or false (not undefined)
              const isMarked = markedQuestions.has(question.id)
              // Get time spent for this question
              const timeSpent = questionTimeSpent[question.id] || 0
              
              await questionPaperQuestionsService.updateQuestionPaperQuestion(id, {
                userAnswer: userAnswer || undefined,
                isCorrect: isCorrect ?? undefined,
                timeSpent: timeSpent,
                markedForReview: isMarked, // Explicitly true or false
              })
              console.log(`💾 End test: Created and updated question ${question.id} - markedForReview=${isMarked}`)
                return { id, question, success: true }
              } catch (error: any) {
                console.error(`Failed to create question paper question for ${question.id}:`, error)
                return { id: null, question, success: false }
              }
            }
          })
        )

        console.log(`✅ Updated ${questionUpdates.filter(q => q.success).length} questions in existing test`)
      } else {
        // Create new question paper
        console.log("📝 Creating new test")
        const questionPaper = await questionPapersService.createQuestionPaper({
          userId: user.id,
          name: `Practice Test - ${new Date().toLocaleDateString()}`,
          type: "practice",
          totalQuestions: questions.length,
          timeLimit: isTimed ? undefined : undefined,
          isActive: true,
        })

        questionPaperId = (questionPaper as any).id || questionPaper.id
        if (!questionPaperId) {
          throw new Error("Failed to create question paper: No ID returned")
        }

        // Update URL to include questionPaperId so marked status can be saved
        const currentUrl = new URL(window.location.href)
        currentUrl.searchParams.set("questionPaperId", questionPaperId)
        window.history.replaceState({}, "", currentUrl.toString())

        // Create question paper questions first, then update with answers
        const createdQuestions = await Promise.all(
          questions.map(async (question, index) => {
            try {
                const created = await questionPaperQuestionsService.createQuestionPaperQuestion({
                  questionPaperId,
                  questionId: question.id,
                  order: index,
                  markedForReview: markedQuestions.has(question.id),
                })
                // Extract ID from response - handle different response formats
                const id = (created as any)?.id || (created as any)?.data?.id || created?.id
                // Store the mapping
                if (id) {
                  setQuestionPaperQuestionIds((prev) => ({
                    ...prev,
                    [question.id]: id,
                  }))
                }
                return { id, created, question, index, success: true }
            } catch (error: any) {
              // If question already exists, try to fetch it instead
              if (error.message?.includes("already in the question paper") || error.message?.includes("already exists")) {
                console.warn(`Question ${question.id} already exists in paper, fetching existing record`)
                try {
                  // Try to find existing question paper question
                  const existing = await questionPaperQuestionsService.getQuestionPaperQuestions({
                    questionPaperId,
                    questionId: question.id,
                  })
                  const existingArray = Array.isArray(existing) ? existing : []
                  const existingQPQ = existingArray[0]
                  if (existingQPQ) {
                    return { id: existingQPQ.id, created: existingQPQ, question, index, success: true }
                  }
                } catch (fetchError) {
                  console.error("Failed to fetch existing question:", fetchError)
                }
              }
              // Re-throw if we can't handle it
              throw error
            }
          })
        )

        // Update each question with answers and marked status
        await Promise.all(
          createdQuestions
            .filter((item) => item.success && item.id)
            .map(async ({ id, question }) => {
              const userAnswer = answers[question.id] || null
              const correctOption = question.options.find((o: any) => o.correct)
              const isCorrect = userAnswer === correctOption?.value ? true : userAnswer ? false : null

              // Get time spent for this question
              const timeSpent = questionTimeSpent[question.id] || 0
              
              await questionPaperQuestionsService.updateQuestionPaperQuestion(id, {
                userAnswer: userAnswer || undefined,
                isCorrect: isCorrect ?? undefined,
                timeSpent: timeSpent,
                markedForReview: markedQuestions.has(question.id),
              })
            })
        )

        // After creating question paper questions, reload them to restore marked status
        console.log("🔄 Reloading question paper questions to restore marked status...")
        try {
          const reloadedResponse = await questionPaperQuestionsService.getQuestionPaperQuestions({
            questionPaperId,
            limit: 1000,
          })
          const reloadedQuestions = Array.isArray(reloadedResponse)
            ? reloadedResponse
            : (reloadedResponse as any)?.data || []
          
          // Restore marked status from database
          const reloadedMarked = new Set<string>()
          reloadedQuestions.forEach((qpq: any) => {
            const isMarked = qpq.markedForReview === true || qpq.markedForReview === "true" || qpq.markedForReview === 1
            if (isMarked) {
              reloadedMarked.add(qpq.questionId)
            }
          })
          
          console.log(`📌 Restored ${reloadedMarked.size} marked questions after creation:`, Array.from(reloadedMarked))
          setMarkedQuestions(reloadedMarked)
        } catch (reloadError) {
          console.error("Failed to reload question paper questions:", reloadError)
        }
      }

      // Navigate to previous tests page
      router.push("/previous-tests")
    } catch (error: any) {
      console.error("Failed to end test:", error)
      alert("Failed to save test. Please try again.")
    } finally {
      setIsEndingTest(false)
      setShowEndTestDialog(false)
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-background dark:bg-gray-900">
        <Card className="p-8 sm:p-12 text-center w-full max-w-md bg-card/50 dark:bg-gray-800/50 backdrop-blur-sm border-border dark:border-gray-700">
          <p className="text-foreground/70 dark:text-gray-300">Loading questions from database...</p>
          {error && (
            <p className="text-destructive dark:text-red-400 mt-2 text-sm">{error}</p>
          )}
        </Card>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-background dark:bg-gray-900">
        <Card className="p-8 sm:p-12 text-center w-full max-w-md bg-card/50 dark:bg-gray-800/50 backdrop-blur-sm border-border dark:border-gray-700">
          <p className="text-foreground/70 dark:text-gray-300 mb-4">
            {error ? "Failed to load questions" : "No questions available"}
          </p>
          {error && (
            <div className="mt-4 p-4 bg-destructive/10 dark:bg-red-900/20 border border-destructive/20 dark:border-red-800/30 rounded-lg">
              <p className="text-destructive dark:text-red-400 text-sm">{error}</p>
            </div>
          )}
          <p className="text-muted-foreground dark:text-gray-400 mt-4 text-sm">
            Using demo question as fallback
          </p>
        </Card>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  if (!currentQuestion) {
    return (
      <div className="h-full flex items-center justify-center bg-background dark:bg-gray-900">
        <Card className="p-8 text-center bg-card dark:bg-gray-800 border-border dark:border-gray-700">
          <p className="text-foreground/70 dark:text-gray-300">No question available</p>
        </Card>
      </div>
    )
  }

  const correctOption = currentQuestion.options.find((o: any) => o.correct)
  const isCorrect = selectedAnswer === correctOption?.value
  const correctAnswerLabel = correctOption?.label
  const correctAnswerText = correctOption?.text


  return (
    <div className="h-full bg-background dark:bg-gray-900 flex flex-col">
      <div className="flex-shrink-0 px-4 sm:px-6 lg:px-8 py-3 border-b border-border/40 dark:border-gray-700/50 bg-card/20 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap flex-1">
              <div className="text-sm text-foreground/60 dark:text-gray-300 bg-primary/10 dark:bg-primary/20 px-3 py-1.5 rounded-lg w-fit border border-primary/20 dark:border-primary/30 font-semibold tracking-wide uppercase">
                Question {currentQuestionIndex + 1} of {questions.length}
              </div>
              {currentQuestion.questionId && (
                <span className="text-sm font-mono font-bold text-foreground dark:text-gray-100 bg-card dark:bg-gray-700 px-3 py-1.5 rounded border border-border dark:border-gray-600">
                  {currentQuestion.questionId}
                </span>
              )}
              <button
                onClick={handleToggleMark}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 ${
                  markedQuestions.has(currentQuestion.id)
                    ? "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700"
                    : "text-foreground/70 dark:text-gray-300 hover:text-foreground dark:hover:text-gray-100 bg-secondary/10 dark:bg-gray-700/30 hover:bg-secondary/20 dark:hover:bg-gray-700/50 border-border/40 dark:border-gray-600"
                }`}
                title={markedQuestions.has(currentQuestion.id) ? "Unmark question" : "Mark question for review"}
              >
                <svg
                  className={`w-4 h-4 ${markedQuestions.has(currentQuestion.id) ? "fill-current" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
                {markedQuestions.has(currentQuestion.id) ? "Marked" : "Mark"}
              </button>
              <button
                onClick={async () => {
                  console.log("🔄 Manual refresh triggered")
                  setLoading(true)
                  // Small delay to ensure any pending database updates are committed
                  await new Promise(resolve => setTimeout(resolve, 200))
                  // Force reload by clearing any cached state
                  setMarkedQuestions(new Set())
                  setAnswers({})
                  await loadQuestions()
                }}
                disabled={loading}
                className="px-3 py-1.5 text-xs font-medium text-foreground/70 dark:text-gray-300 hover:text-foreground dark:hover:text-gray-100 bg-secondary/10 dark:bg-gray-700/30 hover:bg-secondary/20 dark:hover:bg-gray-700/50 border border-border/40 dark:border-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh questions"
              >
                {loading ? "⏳ Loading..." : "↻ Refresh"}
              </button>
              {currentQuestion.subject || currentQuestion.system ? (
                <div className="flex flex-wrap gap-2">
                  {currentQuestion.subject && (
                    <span className="px-3 py-1 bg-primary/12 dark:bg-primary/20 text-primary dark:text-blue-400 rounded-lg text-xs font-semibold border border-primary/25 dark:border-primary/30">
                      {currentQuestion.subject}
                    </span>
                  )}
                  {currentQuestion.system && (
                    <span className="px-3 py-1 bg-secondary/12 dark:bg-secondary/20 text-secondary dark:text-purple-400 rounded-lg text-xs font-semibold border border-secondary/25 dark:border-secondary/30">
                      {currentQuestion.system}
                    </span>
                  )}
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                onClick={() => setShowEndTestDialog(true)}
                variant="destructive"
                size="lg"
                className="whitespace-nowrap font-semibold shadow-lg hover:shadow-xl transition-all text-white bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
              >
                End Test
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* End Test Confirmation Dialog */}
      <AlertDialog open={showEndTestDialog} onOpenChange={setShowEndTestDialog}>
        <AlertDialogContent className="bg-card dark:bg-gray-800 border-border dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-orange-600 dark:text-orange-400">
              End Test
            </AlertDialogTitle>
            <AlertDialogDescription className="text-foreground dark:text-gray-300">
              Do you want to end this exam?
              <br />
              <span className="text-sm text-muted-foreground dark:text-gray-400 mt-2 block">
                You can always resume the exam from previous tests.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isEndingTest} className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 dark:hover:text-gray-100">
              No
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEndTest}
              disabled={isEndingTest}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
            >
              {isEndingTest ? "Saving..." : "Yes"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-5 gap-3 p-3 lg:p-4">
          {/* Left column - Questions */}
          <div className="lg:col-span-2 flex flex-col overflow-hidden min-h-0">
            {/* Question Panel - Scrollable */}
            <div className="overflow-y-auto flex-1 pr-2 mb-3">
              <div className="animate-fade-in">
                <QuestionPanel
                  question={currentQuestion}
                  selectedAnswer={selectedAnswer}
                  answered={answered}
                  onSelectAnswer={handleSelectAnswer}
                />
              </div>
            </div>

            {/* Feedback Box - ALWAYS VISIBLE (outside scroll area) */}
            {answered && (
              <div className="flex-shrink-0 mb-3 animate-slide-in-up">
                <div
                  className={`p-5 rounded-xl border-l-4 backdrop-blur-sm shadow-md transition-all ${
                    isCorrect
                      ? "border-success/70 bg-success/12 dark:bg-success/8"
                      : "border-destructive/70 bg-destructive/12 dark:bg-destructive/8"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`text-2xl flex-shrink-0 ${isCorrect ? "text-success" : "text-destructive"}`}>
                      {isCorrect ? "✓" : "✕"}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <p className={`font-bold text-base ${isCorrect ? "text-success" : "text-destructive"}`}>
                        {isCorrect ? "Correct!" : "Incorrect"}
                      </p>
                      <p className="text-foreground/70 dark:text-gray-300 text-sm">
                        Correct Answer:{" "}
                        <span className="font-semibold text-foreground dark:text-gray-100">
                          {correctAnswerLabel}. {correctAnswerText}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation - Always visible */}
            <div className="flex-shrink-0 flex flex-col gap-2.5 pt-3 border-t border-border/40 dark:border-gray-700/50">
              <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="flex-1 px-3 py-2.5 rounded-lg border border-border/50 dark:border-gray-600 text-foreground/80 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 hover:border-primary/30 dark:hover:border-blue-500/30 hover:bg-primary/5 dark:hover:bg-blue-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-sm"
              >
                ← Previous
              </button>
              <button
                onClick={handleNext}
                disabled={currentQuestionIndex === questions.length - 1}
                className="flex-1 px-3 py-2.5 rounded-lg border border-border/50 dark:border-gray-600 text-foreground/80 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400 hover:border-primary/30 dark:hover:border-blue-500/30 hover:bg-primary/5 dark:hover:bg-blue-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-sm"
              >
                Next →
              </button>
              </div>
            </div>
          </div>

          {/* Right column - Explanation */}
          <div className="lg:col-span-3 flex flex-col overflow-hidden min-h-0">
            {answered ? (
              <div className="overflow-y-auto flex-1 pr-2">
                <ExplanationPanel
                  correct={isCorrect}
                  selectedAnswer={selectedAnswer}
                  explanation={currentQuestion.explanation}
                  correctAnswerLabel={correctAnswerLabel}
                  options={currentQuestion.options}
                  perAnswerExplanations={currentQuestion.perAnswerExplanations}
                  subject={currentQuestion.subject}
                  system={currentQuestion.system}
                  topic={currentQuestion.topic}
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center px-4">
                <Card className="p-8 sm:p-12 text-center w-full bg-gradient-to-br from-primary/8 dark:from-primary/10 to-secondary/8 dark:to-secondary/10 backdrop-blur-sm border border-border/40 dark:border-gray-700/50 animate-fade-in shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 dark:from-primary/30 to-secondary/20 dark:to-secondary/30 flex items-center justify-center animate-pulse border border-primary/30 dark:border-primary/40">
                      <svg className="w-7 h-7 text-primary dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-foreground/70 dark:text-gray-300 font-semibold tracking-wide">
                      Select an answer to unlock the detailed explanation
                    </p>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
