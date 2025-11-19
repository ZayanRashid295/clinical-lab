"use client"

import { useState, useEffect } from "react"
import { Card } from "@/shared/ui/card"
import QuestionPanel from "./question-panel"
import ExplanationPanel from "./explanation-panel"
import { QuestionsService } from "@/app/services/questions/questions.service"

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
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const questionsService = new QuestionsService()

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
                // Preserve HTML from block data
                const blockData = b.data || {}
                return {
                  id: b.id || `text-${Math.random()}`,
                  type: "text",
                  data: {
                    html: blockData.html || "",
                    ...blockData,
                  },
                }
              } else if (b.type === "TABLE") {
                return {
                  id: b.id || `table-${Math.random()}`,
                  type: "table",
                  data: b.data || {},
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

    // Transform question stem blocks and sort by order to preserve markdown file structure
    const questionStemBlocks = Array.isArray(backendQuestion.questionStemBlocks) && backendQuestion.questionStemBlocks.length > 0
      ? backendQuestion.questionStemBlocks
          .map((block: any) => ({
          id: block.id || Date.now(),
          type: block.type?.toLowerCase() || "text",
          data: block.data || {},
            order: typeof block.order === "number" ? block.order : 999,
        }))
          .sort((a: any, b: any) => {
            // Sort by order to maintain block sequence as in markdown file
            return a.order - b.order
          })
      : []

    return {
      id: backendQuestion.id,
      stem: backendQuestion.question || "",
      questionStemBlocks,
      subject: backendQuestion.subject || "",
      system: backendQuestion.system || "",
      topic: backendQuestion.topic,
      options,
      explanation,
      perAnswerExplanations,
      tags: Array.isArray(backendQuestion.tags) ? backendQuestion.tags : [],
    }
  }

  useEffect(() => {
    loadQuestions()
  }, [])

  const loadQuestions = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log("🔍 Starting to load questions from database...")
      
      // Check if auth token exists
      const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
      if (!token) {
        console.warn("⚠️ No auth token found. Questions endpoint requires authentication.")
        setError("Authentication required. Please log in to view questions.")
        setQuestions([DEMO_QUESTION])
        setLoading(false)
        return
      }
      
      // Fetch questions with pagination (max 100 per request)
      let allQuestions: any[] = []
      let page = 1
      const limit = 100
      let hasMore = true
      let totalPages = 1

      while (hasMore && page <= 10) { // Limit to 10 pages max to prevent infinite loops
        console.log(`📄 Fetching page ${page}...`)

        const response = await questionsService.getQuestions({ 
          status: "ACTIVE",
          page,
          limit,
          sortBy: "createdAt",
          sortOrder: "asc",
        })
        
        console.log(`📦 Response received:`, {
          isArray: Array.isArray(response),
          hasData: !!(response as any)?.data,
          pagination: (response as any)?.pagination,
        })
        
        const questionsData = Array.isArray(response) 
          ? response 
          : (response as any)?.data || []
        
        console.log(`📊 Found ${questionsData.length} questions on page ${page}`)
        
        allQuestions = [...allQuestions, ...questionsData]
        
        // Check if there are more pages
        if (Array.isArray(response)) {
          hasMore = questionsData.length === limit
        } else {
          const pagination = (response as any)?.pagination
          if (pagination) {
            totalPages = pagination.totalPages
            hasMore = page < pagination.totalPages
          } else {
            hasMore = questionsData.length === limit
          }
        }
        
        // If no questions on this page, stop
        if (questionsData.length === 0) {
          hasMore = false
        }
        
        page++
      }
      
      console.log(`✅ Loaded ${allQuestions.length} total questions from database`)
      
      if (allQuestions.length === 0) {
        console.log("⚠️ No questions found in database, using demo question")
        setError("No questions found in database. Using demo question.")
        setQuestions([DEMO_QUESTION])
        setLoading(false)
        return
      }
      
      const transformedQuestions = allQuestions.map((q, idx) => {
        try {
          return transformBackendToFrontend(q)
        } catch (transformErr: any) {
          console.error(`❌ Failed to transform question ${idx}:`, transformErr)
          console.error("Question data:", q)
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
      }
    } catch (err: any) {
      console.error("❌ Failed to load questions:", err)
      console.error("Error details:", {
        message: err.message,
        stack: err.stack,
        response: err.response,
      })
      
      // Try to get more details from the error
      let errorMessage = err.message || "Failed to load questions"
      if (err.message?.includes("401") || err.message?.includes("Unauthorized")) {
        errorMessage = "Authentication required. Please log in to view questions."
      } else if (err.message?.includes("403") || err.message?.includes("Forbidden")) {
        errorMessage = "You don't have permission to view questions."
      } else if (err.message?.includes("Network") || err.message?.includes("fetch")) {
        errorMessage = "Network error. Please check your connection."
      }
      
      setError(errorMessage)
      // Fallback to demo question on error
      setQuestions([DEMO_QUESTION])
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAnswer = (option: string) => {
    if (!answered) {
      setSelectedAnswer(option)
      setAnswered(true)
    }
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedAnswer(null)
      setAnswered(false)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
      setSelectedAnswer(null)
      setAnswered(false)
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <Card className="p-8 sm:p-12 text-center w-full max-w-md bg-card/50 backdrop-blur-sm">
          <p className="text-foreground/70">Loading questions from database...</p>
          {error && (
            <p className="text-destructive mt-2 text-sm">{error}</p>
          )}
        </Card>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <Card className="p-8 sm:p-12 text-center w-full max-w-md bg-card/50 backdrop-blur-sm">
          <p className="text-foreground/70 mb-4">
            {error ? "Failed to load questions" : "No questions available"}
          </p>
          {error && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}
          <p className="text-muted-foreground mt-4 text-sm">
            Using demo question as fallback
          </p>
        </Card>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const correctOption = currentQuestion.options.find((o: any) => o.correct)
  const isCorrect = selectedAnswer === correctOption?.value
  const correctAnswerLabel = correctOption?.label
  const correctAnswerText = correctOption?.text


  return (
    <div className="h-full bg-background dark:bg-background flex flex-col">
      <div className="flex-shrink-0 px-4 sm:px-6 lg:px-8 py-3 border-b border-border/40 bg-card/20 backdrop-blur-sm">
        <div className="max-w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm text-foreground/60 bg-primary/10 px-3 py-1.5 rounded-lg w-fit border border-primary/20 font-semibold tracking-wide uppercase">
              Question {currentQuestionIndex + 1} of {questions.length}
            </div>
            {currentQuestion.subject || currentQuestion.system ? (
              <div className="flex flex-wrap gap-2">
                {currentQuestion.subject && (
                  <span className="px-3 py-1 bg-primary/12 text-primary rounded-lg text-xs font-semibold border border-primary/25">
                    {currentQuestion.subject}
                  </span>
                )}
                {currentQuestion.system && (
                  <span className="px-3 py-1 bg-secondary/12 text-secondary rounded-lg text-xs font-semibold border border-secondary/25">
                    {currentQuestion.system}
                  </span>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

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
                      <p className="text-foreground/70 text-sm">
                        Correct Answer:{" "}
                        <span className="font-semibold text-foreground">
                          {correctAnswerLabel}. {correctAnswerText}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons - Always visible */}
            <div className="flex-shrink-0 flex flex-col sm:flex-row gap-2.5 pt-3 border-t border-border/40">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="flex-1 px-3 py-2.5 rounded-lg border border-border/50 text-foreground/80 hover:text-primary hover:border-primary/30 hover:bg-primary/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-sm"
              >
                ← Previous
              </button>
              <button
                onClick={handleNext}
                disabled={currentQuestionIndex === questions.length - 1}
                className="flex-1 px-3 py-2.5 rounded-lg border border-border/50 text-foreground/80 hover:text-primary hover:border-primary/30 hover:bg-primary/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-sm"
              >
                Next →
              </button>
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
                <Card className="p-8 sm:p-12 text-center w-full bg-gradient-to-br from-primary/8 to-secondary/8 backdrop-blur-sm border border-border/40 animate-fade-in shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center animate-pulse border border-primary/30">
                      <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-foreground/70 font-semibold tracking-wide">
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
