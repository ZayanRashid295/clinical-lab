"use client"

import { useEffect, useState } from "react"
import { sampleCases } from "@/lib/fyp/data-models"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Sparkles,
  ArrowLeft,
  FileText,
  Stethoscope,
  LineChart,
  ToggleRight,
  LayoutGrid,
  Database,
  SlidersHorizontal,
  Globe,
  Star,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/router"
import { authService } from "@/shared/services/auth.service"
import { medprepSessionService, type MedprepSession } from "@/lib/fyp/medprep-session-service"

interface ModeCasesConfig {
  modeTitle: string
  chooseCaseSubtitle: string
  generateDescription: string
  browseDescription: string
  casePurpose: "practice" | "learning" | "evaluation"
  backToModeLabel: string
  backToModeRoute: string
  routeForGeneratedCase: (caseId: string) => string
  routeForSelectedCase: (caseId: string) => string
  routeForChatbotGeneratedCase: (caseId: string) => string
  accent: {
    pageGradient: string
    overlayGradient: string
    iconGradient: string
    subtitleText: string
    genOverlay: string
    browseOverlay: string
    genIcon: string
    browseIcon: string
    feature1Bg: string
    feature1Text: string
    feature2Bg: string
    feature2Text: string
    feature3Bg: string
    feature3Text: string
    feature4Bg: string
    feature4Text: string
    ctaGenerate: string
    ctaGenerateHover: string
    ctaBrowse: string
    ctaBrowseHover: string
    modeBadgeBg: string
    modeBadgeText: string
    modeBadgeBorder: string
    hoverTitleText: string
  }
}

export function ModeCasesPage({ config }: { config: ModeCasesConfig }) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<"landing" | "generate" | "select">("landing")
  const [isGeneratingCase, setIsGeneratingCase] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [resumeSessions, setResumeSessions] = useState<MedprepSession[]>([])
  const [caseFormData, setCaseFormData] = useState({
    specialty: "random",
    difficultyLevel: "intermediate",
    rareCase: false,
    caseType: "any",
  })

  const themedBackground = {
    background:
      "radial-gradient(circle at 0% 0%, rgba(16,185,129,0.16) 0%, rgba(246,251,248,0) 45%), radial-gradient(circle at 100% 100%, rgba(15,118,110,0.10) 0%, rgba(246,251,248,0) 35%), #F6FBF8",
  } as const

  const decorativeCircle = {
    background:
      "radial-gradient(circle at center, rgba(var(--color-primary-500-rgb, 16, 185, 129), 0.18) 0%, rgba(var(--color-primary-500-rgb, 16, 185, 129), 0.08) 45%, rgba(var(--color-primary-500-rgb, 16, 185, 129), 0) 75%)",
  } as const

  const iconTile = {
    background:
      "linear-gradient(180deg, var(--color-primary-500) 0%, var(--color-primary-700) 100%)",
    boxShadow:
      "0 8px 20px -8px rgba(var(--color-primary-700-rgb, 4, 120, 87), 0.55)",
  } as const

  const themedSolidButton = {
    background:
      "linear-gradient(180deg, var(--color-primary-600) 0%, var(--color-primary-700) 100%)",
    boxShadow:
      "0 10px 24px -10px rgba(var(--color-primary-700-rgb, 4, 120, 87), 0.55)",
  } as const

  const persistGeneratedCase = (caseData: unknown): boolean => {
    const serialized = JSON.stringify(caseData)
    try {
      localStorage.setItem("generatedCase", serialized)
      return true
    } catch (error) {
      // Storage can be full from unrelated app data; reclaim safe keys and retry once.
      if (!(error instanceof DOMException) || error.name !== "QuotaExceededError") {
        console.error("Failed to persist generated case:", error)
        return false
      }

      console.warn("Local storage quota exceeded. Attempting cleanup and retry...")
      const reclaimKeys = ["generatedCase", "currentCase", "learning_sessions", "practice_sessions", "evaluation_sessions"]
      for (const key of reclaimKeys) {
        try {
          localStorage.removeItem(key)
        } catch {
          // ignore
        }
      }

      try {
        localStorage.setItem("generatedCase", serialized)
        return true
      } catch (retryError) {
        console.error("Failed to persist generated case after cleanup:", retryError)
        return false
      }
    }
  }

  useEffect(() => {
    const generatedCaseData = sessionStorage.getItem("currentCase")
    if (!generatedCaseData) return
    try {
      const caseData = JSON.parse(generatedCaseData)
      const persisted = persistGeneratedCase(caseData)
      sessionStorage.removeItem("currentCase")
      if (persisted) {
        router.push(config.routeForChatbotGeneratedCase(caseData.id))
      } else {
        setGenerationError("Unable to save generated case in local storage.")
      }
    } catch {
      sessionStorage.removeItem("currentCase")
    }
  }, [config, router])

  useEffect(() => {
    const user = authService.getCurrentUser()
    const userId = user?.id ? String(user.id) : "anonymous"
    const mode =
      config.casePurpose === "learning"
        ? "LEARNING"
        : config.casePurpose === "evaluation"
          ? "EVALUATION"
          : "PRACTICE"
    medprepSessionService
      .listSessions(userId)
      .then((sessions) =>
        setResumeSessions(
          sessions.filter((session) => session.mode === mode && session.status === "ACTIVE").slice(0, 3)
        )
      )
      .catch(() => setResumeSessions([]))
  }, [config.casePurpose])

  const handleGenerateCase = async () => {
    setGenerationError(null)
    setIsGeneratingCase(true)
    try {
      const response = await fetch("/api/cases/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count: 1,
          specialty: caseFormData.specialty === "random" ? "" : caseFormData.specialty,
          difficulty: caseFormData.difficultyLevel,
          forceRare: caseFormData.rareCase,
          rareProbability: caseFormData.rareCase ? 1.0 : 0.08,
          caseType: caseFormData.caseType === "any" ? "outpatient" : caseFormData.caseType,
          useLLM: false,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Failed to generate case: ${errorData.details || errorData.error || "Unknown error"}`)
      }

      const data = await response.json()
      if (data.cases?.length) {
        const generatedCase = data.cases[0]
        if (!persistGeneratedCase(generatedCase)) {
          throw new Error("Unable to save generated case in local storage.")
        }
        router.push(config.routeForGeneratedCase(generatedCase.id))
        return
      }
      throw new Error("No cases generated")
    } catch (error) {
      console.error("Case generation failed:", error)
      setGenerationError(error instanceof Error ? error.message : "Case generation failed.")
      return
    } finally {
      setIsGeneratingCase(false)
    }
  }

  const handleCaseSelection = (caseId: string) => {
    setIsGeneratingCase(true)
    router.push(config.routeForSelectedCase(caseId))
  }

  const generateFeatures: { label: string; icon: LucideIcon }[] = [
    { label: "Specialty selection", icon: Stethoscope },
    { label: "Difficulty levels", icon: LineChart },
    { label: "Rare disease toggle", icon: ToggleRight },
    { label: "Case types", icon: LayoutGrid },
  ]
  const browseFeatures: { label: string; icon: LucideIcon }[] = [
    { label: `${sampleCases.length} pre-built cases`, icon: Database },
    { label: "All difficulty levels", icon: SlidersHorizontal },
    { label: "Multiple specialties", icon: Globe },
    { label: "Rare & common", icon: Star },
  ]

  const renderModePill = () => (
    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/85 px-3.5 py-1.5 shadow-[0_8px_20px_-16px_rgba(16,185,129,0.5)] backdrop-blur-sm">
      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
      <span className="text-[12px] font-medium text-slate-700 tracking-wide">
        {config.modeTitle}
      </span>
    </div>
  )

  // Difficulty badge color helper
  const difficultyBadgeClass = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-50 text-green-700 border-green-200"
      case "intermediate":
        return "bg-amber-50 text-amber-700 border-amber-200"
      case "advanced":
        return "bg-rose-50 text-rose-700 border-rose-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  // Shared horizontal frame: near full-bleed content so cards use most of the viewport.
  const pageFrameClass =
    "w-full max-w-none mx-auto px-3 sm:px-4 md:px-5 lg:px-6 xl:px-8 2xl:px-10"

  // Clean inline page header: white bar, title + subtitle left, mode label right (lighter on browse page).
  const renderPageHeader = (title: string, subtitle: string, modeLabelTone: "muted" | "default" = "default") => (
    <div className="sticky top-0 z-20 border-b border-emerald-100 bg-white/85 backdrop-blur-xl">
      <div className={`${pageFrameClass} py-5 md:py-6 flex items-start justify-between gap-6`}>
        <div>
          <h1 className="text-[22px] md:text-2xl font-bold text-slate-900 leading-tight tracking-tight">
            {title}
          </h1>
          <p className="text-[13px] text-slate-500 mt-1">{subtitle}</p>
        </div>
        <div
          className={
            modeLabelTone === "muted"
              ? "text-[13px] font-medium text-gray-400 pt-1 shrink-0"
              : "text-[13px] font-medium text-gray-700 pt-1 shrink-0"
          }
        >
          {config.modeTitle}
        </div>
      </div>
    </div>
  )

  return (
    <>
      {currentStep === "landing" && (
        <div className="relative min-h-screen overflow-hidden" style={themedBackground}>
          <div
            aria-hidden
            className="pointer-events-none absolute -top-48 -left-48 w-[520px] h-[520px] rounded-full mp-float-slow"
            style={decorativeCircle}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-56 -right-56 w-[620px] h-[620px] rounded-full mp-float-slower"
            style={decorativeCircle}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute top-1/2 -right-24 w-[260px] h-[260px] rounded-full opacity-50 mp-drift"
            style={decorativeCircle}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-12 left-16 w-[120px] h-[120px] rounded-full mp-pulse-glow"
            style={{
              background:
                "radial-gradient(circle, rgba(var(--color-primary-500-rgb, 16, 185, 129), 0.30) 0%, rgba(var(--color-primary-500-rgb, 16, 185, 129), 0) 70%)",
            }}
          />

          <div className="relative container mx-auto px-6 min-h-screen flex flex-col justify-center py-12">
            <div className="text-center mb-10">
              <div className="flex justify-center mb-6">{renderModePill()}</div>
              <h1 className="font-serif font-bold tracking-tight text-gray-900 text-4xl md:text-5xl leading-[1.1] mb-3">
                {config.chooseCaseSubtitle}
              </h1>
              <p className="text-base text-gray-600">
                Select how you want to practice today
              </p>
            </div>
            {resumeSessions.length > 0 ? (
              <div className="mb-8 mx-auto max-w-5xl rounded-2xl border border-emerald-100 bg-white/85 p-4">
                <p className="text-sm font-semibold text-emerald-900 mb-3">Continue where you left off</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {resumeSessions.map((session) => (
                    <Link
                      key={session.id}
                      href={medprepSessionService.getContinueUrl(session)}
                      className="rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-left text-sm text-emerald-800 hover:bg-emerald-50"
                    >
                      {session.title || session.caseId || "Untitled case"}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto w-full">
              <div className="group relative overflow-hidden rounded-3xl border border-[#DCEFE5] bg-white/90 shadow-[0_20px_44px_-30px_rgba(16,185,129,0.45)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_56px_-30px_rgba(16,185,129,0.5)] p-8 flex flex-col">
                <span
                  aria-hidden
                  className="absolute top-0 left-0 h-[3px] w-0 bg-primary transition-all duration-500 ease-out group-hover:w-full"
                />
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                  style={iconTile}
                >
                  <Sparkles className="h-5 w-5 text-white" strokeWidth={2} />
                </div>
                <h3 className="text-[20px] font-bold text-gray-900 mb-3">
                  Generate New Case
                </h3>
                <p className="text-[14px] text-gray-600 leading-relaxed mb-6">
                  Create a custom AI-generated case with your preferred
                  specialty, difficulty, and type.
                </p>
                <ul className="space-y-3 mb-8 flex-1">
                  {generateFeatures.map(({ label, icon: Icon }) => (
                    <li
                      key={label}
                      className="flex items-center gap-3 text-[14px] text-gray-700"
                    >
                      <Icon
                        className="h-[18px] w-[18px] text-primary flex-shrink-0"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                      {label}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => setCurrentStep("generate")}
                  style={themedSolidButton}
                  className="w-full text-white rounded-xl py-6 text-[15px] font-semibold hover:opacity-95 hover:brightness-105 transition-all duration-200"
                >
                  Create Custom Case
                </Button>
              </div>

              <div className="group relative overflow-hidden rounded-3xl border border-[#DCEFE5] bg-white/90 shadow-[0_20px_44px_-30px_rgba(16,185,129,0.45)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_56px_-30px_rgba(16,185,129,0.5)] p-8 flex flex-col">
                <span
                  aria-hidden
                  className="absolute top-0 left-0 h-[3px] w-0 bg-primary transition-all duration-500 ease-out group-hover:w-full"
                />
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                  style={iconTile}
                >
                  <FileText className="h-5 w-5 text-white" strokeWidth={2} />
                </div>
                <h3 className="text-[20px] font-bold text-gray-900 mb-3">
                  Browse Cases
                </h3>
                <p className="text-[14px] text-gray-600 leading-relaxed mb-6">
                  Explore pre-built cases across multiple specialties and
                  difficulty levels.
                </p>
                <ul className="space-y-3 mb-8 flex-1">
                  {browseFeatures.map(({ label, icon: Icon }) => (
                    <li
                      key={label}
                      className="flex items-center gap-3 text-[14px] text-gray-700"
                    >
                      <Icon
                        className="h-[18px] w-[18px] text-primary flex-shrink-0"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                      {label}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => setCurrentStep("select")}
                  variant="outline"
                  className="w-full rounded-xl py-6 text-[15px] font-semibold border-2 border-primary text-primary bg-white hover:bg-primary/5 transition-all duration-200"
                >
                  Explore Case Library
                </Button>
              </div>
            </div>

            <div className="text-center mt-10">
              <Link
                href={config.backToModeRoute}
                className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
              >
                {config.backToModeLabel}
              </Link>
            </div>
          </div>
        </div>
      )}

      {currentStep === "generate" && (
        <div className="relative min-h-screen overflow-hidden" style={themedBackground}>
          {/* Ambient animated blobs */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-56 -left-56 w-[560px] h-[560px] rounded-full opacity-70 mp-float-slow"
            style={decorativeCircle}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-64 -right-64 w-[640px] h-[640px] rounded-full opacity-70 mp-float-slower"
            style={decorativeCircle}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute top-1/3 -right-32 w-[300px] h-[300px] rounded-full opacity-50 mp-drift"
            style={decorativeCircle}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-10 left-12 w-[160px] h-[160px] rounded-full opacity-60 mp-pulse-glow"
            style={decorativeCircle}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute top-24 right-24 w-[80px] h-[80px] rounded-full opacity-70 mp-pulse-glow"
            style={{
              background:
                "radial-gradient(circle, rgba(var(--color-primary-500-rgb, 16, 185, 129), 0.35) 0%, rgba(var(--color-primary-500-rgb, 16, 185, 129), 0) 70%)",
              animationDelay: "1.2s",
            }}
          />

          {isGeneratingCase && (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 border border-gray-200">
                <div className="text-center">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={iconTile}
                  >
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Generating Case</h3>
                  <p className="text-sm text-gray-600">Please wait while we create your custom case...</p>
                </div>
              </div>
            </div>
          )}

          {renderPageHeader("Generate New Case", `Customize your ${config.casePurpose} case`, "default")}

          <div className={`relative py-10 md:py-12 ${pageFrameClass}`}>
            <div className="mx-auto max-w-2xl mp-fade-up">
              <div className="relative overflow-hidden rounded-3xl border border-[#DCEFE5] bg-white/90 p-8 md:p-10 shadow-[0_24px_60px_-34px_rgba(16,185,129,0.5)] backdrop-blur-md">
                {/* Subtle inner blob */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-24 -right-16 w-56 h-56 rounded-full opacity-60 mp-pulse-glow"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(var(--color-primary-500-rgb, 16, 185, 129), 0.18) 0%, rgba(var(--color-primary-500-rgb, 16, 185, 129), 0) 70%)",
                  }}
                />

                {/* Header */}
                <div className="relative text-center mb-8">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={iconTile}
                  >
                    <Sparkles className="h-6 w-6 text-white" strokeWidth={2} />
                  </div>
                  <h2 className="text-[22px] font-bold text-gray-900 mb-1.5 tracking-tight">
                    Case Configuration
                  </h2>
                  <p className="text-[13px] text-gray-500">
                    Configure your case parameters. Leave fields blank for random selection.
                  </p>
                </div>

                <div className="relative space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[13px] font-semibold text-gray-800">
                      Specialty
                    </Label>
                    <Select
                      value={caseFormData.specialty}
                      onValueChange={(value) => setCaseFormData((prev) => ({ ...prev, specialty: value }))}
                    >
                      <SelectTrigger className="h-11 rounded-xl border-emerald-200 bg-white text-[14px] hover:border-emerald-300 transition-colors focus:!ring-2 focus:!ring-emerald-300 focus:!border-emerald-400 data-[state=open]:!border-emerald-400 data-[state=open]:!ring-2 data-[state=open]:!ring-emerald-300">
                        <SelectValue placeholder="Select specialty (or leave blank for random)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="random">Random Specialty</SelectItem>
                        <SelectItem value="Cardiology">Cardiology</SelectItem>
                        <SelectItem value="Neurology">Neurology</SelectItem>
                        <SelectItem value="Endocrinology">Endocrinology</SelectItem>
                        <SelectItem value="Pulmonology">Pulmonology</SelectItem>
                        <SelectItem value="Gastroenterology">Gastroenterology</SelectItem>
                        <SelectItem value="Nephrology">Nephrology</SelectItem>
                        <SelectItem value="Hematology">Hematology</SelectItem>
                        <SelectItem value="Oncology">Oncology</SelectItem>
                        <SelectItem value="General Medicine">General Medicine</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[12px] text-gray-400">If left blank → random specialty</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[13px] font-semibold text-gray-800">
                      Difficulty Level
                    </Label>
                    <Select
                      value={caseFormData.difficultyLevel}
                      onValueChange={(value) => setCaseFormData((prev) => ({ ...prev, difficultyLevel: value }))}
                    >
                      <SelectTrigger className="h-11 rounded-xl border-emerald-200 bg-white text-[14px] hover:border-emerald-300 transition-colors focus:!ring-2 focus:!ring-emerald-300 focus:!border-emerald-400 data-[state=open]:!border-emerald-400 data-[state=open]:!ring-2 data-[state=open]:!ring-emerald-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner — Common diseases, fewer symptoms, more obvious clues</SelectItem>
                        <SelectItem value="intermediate">Intermediate — Moderate complexity, multiple symptoms</SelectItem>
                        <SelectItem value="advanced">Advanced — Rare diseases possible, multi-system involvement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Rare Disease toggle row — green-highlighted when ON */}
                  <div
                    className={`flex items-center justify-between gap-6 rounded-2xl border px-4 py-3.5 transition-all duration-300 ${
                      caseFormData.rareCase
                        ? "bg-primary/5 border-primary/30 shadow-[0_8px_24px_-12px_rgba(var(--color-primary-700-rgb,4,120,87),0.35)]"
                        : "bg-white border-primary/10 hover:border-primary/20"
                    }`}
                  >
                    <div>
                      <Label className="text-[13px] font-semibold text-gray-800 block">
                        Rare Disease Case
                      </Label>
                      <p className="text-[12px] text-gray-500 mt-0.5">
                        Include rare diseases like Marfan syndrome, Addison&apos;s disease, Wilson&apos;s disease
                      </p>
                    </div>
                    <Switch
                      checked={caseFormData.rareCase}
                      onCheckedChange={(checked) => setCaseFormData((prev) => ({ ...prev, rareCase: checked }))}
                      style={
                        caseFormData.rareCase
                          ? { backgroundColor: "#16a34a" }
                          : undefined
                      }
                      className="data-[state=checked]:!bg-[#16a34a] data-[state=checked]:shadow-[0_0_0_4px_rgba(22,163,74,0.18)] focus-visible:!ring-2 focus-visible:!ring-[#16a34a]/40 transition-shadow"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[13px] font-semibold text-gray-800">
                      Case Type <span className="font-normal text-gray-400">(Optional)</span>
                    </Label>
                    <Select
                      value={caseFormData.caseType}
                      onValueChange={(value) => setCaseFormData((prev) => ({ ...prev, caseType: value }))}
                    >
                      <SelectTrigger className="h-11 rounded-xl border-emerald-200 bg-white text-[14px] hover:border-emerald-300 transition-colors focus:!ring-2 focus:!ring-emerald-300 focus:!border-emerald-400 data-[state=open]:!border-emerald-400 data-[state=open]:!ring-2 data-[state=open]:!ring-emerald-300">
                        <SelectValue placeholder="Select case type (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any Type</SelectItem>
                        <SelectItem value="emergency">Emergency — Acute presentation</SelectItem>
                        <SelectItem value="outpatient">Outpatient — Clinic visit</SelectItem>
                        <SelectItem value="chronic">Chronic — Follow-up care</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[12px] text-gray-400">Can be skipped if you want to keep it lean</p>
                  </div>

                  <div className="flex gap-3 pt-3">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep("landing")}
                      className="flex-1 h-12 rounded-xl border-2 border-primary/20 bg-white text-primary hover:bg-primary/5 hover:border-primary/40 font-semibold text-[14px] transition-all"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleGenerateCase}
                      disabled={isGeneratingCase}
                      style={themedSolidButton}
                      className="flex-1 h-12 rounded-xl text-white hover:opacity-95 hover:brightness-110 hover:scale-[1.01] active:scale-[0.99] font-semibold text-[14px] transition-all duration-200"
                    >
                      {isGeneratingCase ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Generating Case...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Case
                        </>
                      )}
                    </Button>
                  </div>

                  {generationError ? (
                    <p className="text-sm text-red-600 text-center">{generationError}</p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === "select" && (
        <div className="relative min-h-screen" style={themedBackground}>
          {isGeneratingCase && (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 border border-gray-200">
                <div className="text-center">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={iconTile}
                  >
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Loading Case</h3>
                  <p className="text-sm text-gray-600">Please wait while we prepare your case...</p>
                </div>
              </div>
            </div>
          )}

          {renderPageHeader("Select Case", `Choose a case for ${config.casePurpose}`, "muted")}

          <div className={`relative py-8 md:py-10 lg:py-12 ${pageFrameClass}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-7 lg:gap-8 xl:gap-10 auto-rows-fr">
              {sampleCases.map((caseItem) => {
                const durationLabel =
                  caseItem.difficulty === "beginner"
                    ? "~20m"
                    : caseItem.difficulty === "intermediate"
                      ? "~30m"
                      : "~45m"
                const visibleSymptoms = caseItem.symptoms.slice(0, 3)
                const extraCount = Math.max(caseItem.symptoms.length - 3, 0)
                const difficultyLabel =
                  caseItem.difficulty.charAt(0).toUpperCase() + caseItem.difficulty.slice(1).toLowerCase()

                return (
                  <button
                    key={caseItem.id}
                    type="button"
                    onClick={() => handleCaseSelection(caseItem.id)}
                    disabled={isGeneratingCase}
                    className={`group relative flex h-full min-h-[320px] flex-col overflow-hidden text-left rounded-3xl bg-white/90 backdrop-blur-md border border-[#DCEFE5] p-7 sm:p-8 lg:p-9 shadow-[0_20px_44px_-32px_rgba(16,185,129,0.45)] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-emerald-300/60 hover:shadow-[0_28px_52px_-32px_rgba(16,185,129,0.52)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/50 focus-visible:ring-offset-2 cursor-pointer ${isGeneratingCase ? "opacity-50 pointer-events-none" : ""}`}
                  >
                    {/* Animated forest-green top bar (L → R on hover) */}
                    <span
                      aria-hidden
                      className="absolute top-0 left-0 z-[1] h-[3px] w-0 bg-[#1a4d2e] transition-[width] duration-500 ease-out group-hover:w-full"
                    />

                    {/* Title row */}
                    <div className="flex items-start justify-between gap-3 mb-3 lg:mb-4">
                      <h3 className="text-[17px] sm:text-lg lg:text-xl font-bold text-[#1A1A1A] leading-snug pr-1">
                        {caseItem.title}
                      </h3>
                      <span
                        className={`shrink-0 inline-flex items-center px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold border capitalize tracking-wide ${difficultyBadgeClass(
                          caseItem.difficulty
                        )}`}
                      >
                        {difficultyLabel}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-[13px] sm:text-sm text-gray-600 leading-relaxed line-clamp-3 mb-6 lg:mb-7 flex-shrink-0">
                      {caseItem.description}
                    </p>

                    {/* Stats row — large forest green numbers, spread across card */}
                    <div className="flex flex-wrap items-end justify-between gap-4 sm:gap-6 mb-6 lg:mb-7">
                      <div className="min-w-[4.5rem]">
                        <div className="text-[26px] sm:text-3xl lg:text-[32px] font-bold text-[#1a4d2e] leading-none tabular-nums tracking-tight">
                          {caseItem.patientProfile.age}
                        </div>
                        <div className="text-[11px] sm:text-xs text-gray-400 mt-2 font-medium uppercase tracking-wider">
                          Age
                        </div>
                      </div>
                      <div className="min-w-[4.5rem]">
                        <div className="text-[26px] sm:text-3xl lg:text-[32px] font-bold text-[#1a4d2e] leading-none tabular-nums tracking-tight">
                          {caseItem.symptoms.length}
                        </div>
                        <div className="text-[11px] sm:text-xs text-gray-400 mt-2 font-medium uppercase tracking-wider">
                          Symptoms
                        </div>
                      </div>
                      <div className="min-w-[4.5rem]">
                        <div className="text-[26px] sm:text-3xl lg:text-[32px] font-bold text-[#1a4d2e] leading-none tabular-nums tracking-tight">
                          {durationLabel}
                        </div>
                        <div className="text-[11px] sm:text-xs text-gray-400 mt-2 font-medium uppercase tracking-wider">
                          Duration
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 mb-6 lg:mb-7" />

                    {/* Patient profile */}
                    <div className="grid grid-cols-2 gap-x-5 gap-y-1.5 mb-6 text-[13px] sm:text-sm text-gray-600">
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-800 truncate text-[14px]">
                          {caseItem.patientProfile.name}
                        </div>
                        <div className="text-[12px] sm:text-[13px] text-gray-500 mt-1 truncate">
                          {caseItem.patientProfile.gender}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-800 text-[14px]">
                          Age: {caseItem.patientProfile.age}
                        </div>
                        <div className="text-[12px] sm:text-[13px] text-gray-500 mt-1 truncate">
                          {caseItem.patientProfile.occupation}
                        </div>
                      </div>
                    </div>

                    {/* Symptom tags */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {visibleSymptoms.map((symptom, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#ecfdf5] text-[#14532d] text-[11px] sm:text-xs font-semibold"
                        >
                          {symptom}
                        </span>
                      ))}
                      {extraCount > 0 && (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#ecfdf5] text-[#14532d] text-[11px] sm:text-xs font-semibold">
                          +{extraCount} more
                        </span>
                      )}
                    </div>

                    {/* Footer row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-50 pt-5">
                      <span className="inline-flex max-w-[75%] items-center px-3.5 py-1.5 rounded-full bg-[#ecfdf5] text-[#1a4d2e] text-xs sm:text-[13px] font-bold truncate">
                        {caseItem.specialty}
                      </span>
                      {caseItem.isRare ? (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-red-50 text-red-700 text-[11px] sm:text-xs font-semibold border border-red-100 shrink-0">
                          Rare
                        </span>
                      ) : null}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="text-center mt-14 pb-10 md:pb-12">
              <Link
                href={config.backToModeRoute}
                className="text-[14px] font-semibold text-[#2d6a4f] hover:text-[#1b4332] underline-offset-4 hover:underline transition-colors"
              >
                {config.backToModeLabel}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
