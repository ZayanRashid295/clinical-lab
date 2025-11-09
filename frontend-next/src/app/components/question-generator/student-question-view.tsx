"use client"

import { useState, useEffect } from "react"
import { Card } from "@/shared/ui/card"
import QuestionPanel from "./question-panel"
import ExplanationPanel from "./explanation-panel"

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

  useEffect(() => {
    const saved = localStorage.getItem("uworld_questions")
    if (saved) {
      try {
        const parsedQuestions = JSON.parse(saved)
        if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
          setQuestions(parsedQuestions)
        } else {
          setQuestions([DEMO_QUESTION])
        }
      } catch (e) {
        console.error("Failed to load questions:", e)
        setQuestions([DEMO_QUESTION])
      }
    } else {
      setQuestions([DEMO_QUESTION])
    }
    setLoading(false)
  }, [])

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

  if (loading || questions.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <Card className="p-8 sm:p-12 text-center w-full max-w-md bg-card/50 backdrop-blur-sm">
          <p className="text-foreground/70">{loading ? "Loading questions..." : "Loading demo question..."}</p>
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
