"use client"

import type React from "react"
import { useState } from "react"
import { TestModeSelector } from "./test-mode-selector"
import { QuestionPoolSelector } from "./question-pool-selector"
import { SubjectSelector } from "./subject-selector"
import { SystemSelector } from "./system-selector"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Rocket, AlertCircle, CheckCircle2, ArrowRight, GraduationCap } from "lucide-react"

interface ValidationErrors {
  subjects?: string
  systems?: string
  questionCount?: string
}

export default function TestCreationPage() {
  const [isTutor, setIsTutor] = useState(true)
  const [isTimed, setIsTimed] = useState(false)
  const [selectedPool, setSelectedPool] = useState("unused")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedSystems, setSelectedSystems] = useState<string[]>([])
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [questionCount, setQuestionCount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())
  const [availableQuestionsCount, setAvailableQuestionsCount] = useState<number | null>(null)

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) => {
      const newTags = prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]

      if (newTags.length > 0) {
        setValidationErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors.subjects
          return newErrors
        })
      }

      return newTags
    })
  }

  const handleSystemToggle = (systemId: string) => {
    setSelectedSystems((prev) => {
      const newSystems = prev.includes(systemId) ? prev.filter((id) => id !== systemId) : [...prev, systemId]

      if (newSystems.length > 0) {
        setValidationErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors.systems
          return newErrors
        })
      }

      return newSystems
    })
  }

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId) ? prev.filter((id) => id !== subjectId) : [...prev, subjectId],
    )
  }

  const handleTopicToggle = (topicId: string) => {
    setSelectedTopics((prev) => (prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId]))
  }

  const validateQuestionCount = (value: string): string | undefined => {
    if (!value || value.trim() === "") {
      return "Number of questions is required."
    }

    const num = Number.parseInt(value, 10)

    if (isNaN(num)) {
      return "Please enter a valid number."
    }

    if (num <= 0) {
      return "Number of questions must be greater than 0."
    }

    if (num > 40) {
      return "Maximum 40 questions allowed per test."
    }

    return undefined
  }

  const handleQuestionCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    if (value === "" || /^\d+$/.test(value)) {
      setQuestionCount(value)
      setTouchedFields((prev) => new Set(prev).add("questionCount"))

      if (touchedFields.has("questionCount") || value !== "") {
        const error = validateQuestionCount(value)
        setValidationErrors((prev) => {
          const newErrors = { ...prev }
          if (error) {
            newErrors.questionCount = error
          } else {
            delete newErrors.questionCount
          }
          return newErrors
        })
      }
    }
  }

  const handleQuestionCountBlur = () => {
    setTouchedFields((prev) => new Set(prev).add("questionCount"))
    const error = validateQuestionCount(questionCount)
    setValidationErrors((prev) => {
      const newErrors = { ...prev }
      if (error) {
        newErrors.questionCount = error
      } else {
        delete newErrors.questionCount
      }
      return newErrors
    })
  }

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {}
    let isValid = true

    if (selectedTags.length === 0) {
      errors.subjects = "Please select at least one tag."
      isValid = false
    }

    if (selectedSystems.length === 0) {
      errors.systems = "Please select at least one system."
      isValid = false
    }

    const questionCountError = validateQuestionCount(questionCount)
    if (questionCountError) {
      errors.questionCount = questionCountError
      isValid = false
    }

    setValidationErrors(errors)
    return isValid
  }

  const handleGenerateTest = async () => {
    setError(null)
    setSuccess(null)

    setTouchedFields(new Set(["subjects", "systems", "questionCount"]))

    if (!validateForm()) {
      const firstErrorField = document.querySelector('[data-validation-error="true"]')
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" })
      }
      return
    }

    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
    setSuccess("Test generated successfully!")
  }

  const isFormValid =
    selectedTags.length > 0 &&
    selectedSystems.length > 0 &&
    questionCount &&
    Number.parseInt(questionCount, 10) > 0 &&
    Number.parseInt(questionCount, 10) <= 40

  return (
    <div className="min-h-screen bg-background" data-testid="page-create-test">
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground tracking-tight">Test Builder</h1>
              <p className="text-xs text-muted-foreground">Configure your assessment</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
            data-testid="button-launch-tutorial"
          >
            <Rocket className="h-4 w-4" />
            Tutorial
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Error/Success Messages */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg flex items-start gap-3 animate-in slide-in-from-top-2 duration-200">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <strong className="font-medium">Error:</strong> {error}
            </div>
          </div>
        )}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-4 py-3 rounded-lg flex items-start gap-3 animate-in slide-in-from-top-2 duration-200">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <strong className="font-medium">Success:</strong> {success}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column - Mode and Pool */}
          <div className="space-y-6">
            <TestModeSelector
              isTutor={isTutor}
              isTimed={isTimed}
              onTutorChange={setIsTutor}
              onTimedChange={setIsTimed}
            />
            <QuestionPoolSelector
              selectedPool={selectedPool}
              onPoolChange={setSelectedPool}
              filters={{
                tagIds: selectedTags.length > 0 ? selectedTags : undefined,
                systemIds: selectedSystems.length > 0 ? selectedSystems : undefined,
                subjectIds: selectedSubjects.length > 0 ? selectedSubjects : undefined,
                topicIds: selectedTopics.length > 0 ? selectedTopics : undefined,
              }}
            />
          </div>

          {/* Right column - Subjects and Systems */}
          <div className="lg:col-span-2 space-y-6">
            <div data-validation-error={!!validationErrors.subjects}>
              <SubjectSelector
                selectedSubjects={selectedTags}
                onSubjectToggle={handleTagToggle}
                selectedPool={selectedPool}
              />
              {validationErrors.subjects && (
                <p className="text-sm text-destructive mt-2 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" />
                  {validationErrors.subjects}
                </p>
              )}
            </div>

            <div data-validation-error={!!validationErrors.systems}>
              <SystemSelector
                selectedSystems={selectedSystems}
                onSystemToggle={handleSystemToggle}
                selectedTags={selectedTags}
                selectedPool={selectedPool}
                selectedSubjects={selectedSubjects}
                selectedTopics={selectedTopics}
                onSubjectToggle={handleSubjectToggle}
                onTopicToggle={handleTopicToggle}
              />
              {validationErrors.systems && (
                <p className="text-sm text-destructive mt-2 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" />
                  {validationErrors.systems}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 -mx-6 px-6 py-4 bg-card/95 backdrop-blur-sm border-t border-border mt-8">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="space-y-1">
                <Label htmlFor="question-count" className="text-sm font-medium text-foreground">
                  Questions
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="question-count"
                    type="text"
                    inputMode="numeric"
                    placeholder="1-40"
                    value={questionCount}
                    onChange={handleQuestionCountChange}
                    onBlur={handleQuestionCountBlur}
                    className={`w-20 h-9 text-center font-medium ${
                      validationErrors.questionCount ? "border-destructive focus-visible:ring-destructive" : ""
                    }`}
                    data-testid="input-question-count"
                    data-validation-error={!!validationErrors.questionCount}
                    min="1"
                    max="40"
                    disabled={isLoading}
                  />
                  <span className="text-sm text-muted-foreground">max 40</span>
                </div>
                {validationErrors.questionCount && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.questionCount}
                  </p>
                )}
              </div>

              {availableQuestionsCount !== null && <div className="h-12 w-px bg-border" />}

              {availableQuestionsCount !== null && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Available</span>
                  <p className="text-lg font-semibold text-foreground tabular-nums">
                    {availableQuestionsCount === 999 ? "999+" : availableQuestionsCount}
                  </p>
                </div>
              )}
            </div>

            <Button
              className="h-11 px-8 font-medium gap-2"
              onClick={handleGenerateTest}
              data-testid="button-generate-test"
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  Generate Test
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
