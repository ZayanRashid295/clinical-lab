"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/router"
import { sampleCases } from "@/lib/fyp/data-models"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Home } from "lucide-react"
import Link from "next/link"
import { MarkdownContent } from "@/shared/components/MarkdownContent/MarkdownContent"
import { cn } from "@/shared/utils/cn"
import { APP_PAGE_SHELL } from "@/app/config/app-shell"
import { authService } from "@/shared/services/auth.service"
import { getClinicalUserId } from "@/lib/fyp/medprep-user"
import {
  caseSnapshotFromSession,
  fetchResumeSession,
  startMedprepSession,
} from "@/lib/fyp/medprep-persistence-service"
import {
  assignmentStartMetadata,
  resolveMedicalCase,
} from "@/lib/fyp/institution-case"
import { studentInstitutionApiService } from "@/app/services/faculty/student-institution-api.service"

interface ModeNurseReportConfig {
  medprepMode?: "PRACTICE" | "LEARNING" | "EVALUATION" | "SHADOW"
  modeLabel: string
  backLabel: string
  backRoute: string
  startRoute: (caseId: string, options?: { generated?: boolean }) => string
  startButtonLabel: string
  startingButtonLabel: string
  cardSubtitle: string
  guidelinesTitle: string
  guidelinesLines: string[]
  accent: {
    spinnerBorder: string
    modeBadgeBg: string
    modeBadgeText: string
    modeBadgeBorder: string
    headerGradient: string
    headerIconBg: string
    headerIconText: string
    headerCaseBadgeText: string
    headerCaseBadgeBorder: string
    patientSectionBg: string
    patientTitleText: string
    patientLabelText: string
    patientValueText: string
    overviewIconText: string
    notesSectionBg: string
    notesTitleText: string
    notesBodyText: string
    assessmentSectionBg: string
    assessmentTitleText: string
    assessmentBodyText: string
    guidelinesSectionBg: string
    guidelinesTitleText: string
    guidelinesBodyText: string
    buttonGradient: string
    buttonHoverGradient: string
  }
}

interface MedicalCase {
  id: string
  title: string
  description: string
  difficulty: "beginner" | "intermediate" | "advanced" | string
  specialty: string
  caseType?: string
  symptoms: string[]
  patientProfile: {
    name: string
    age: number
    gender: string
    occupation: string
  }
}

export function ModeNurseReportPage({ config }: { config: ModeNurseReportConfig }) {
  const router = useRouter()
  const [medicalCase, setMedicalCase] = useState<MedicalCase | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isStartingSession, setIsStartingSession] = useState(false)

  const decorativeCircle = {
    background:
      "radial-gradient(circle at center, rgba(var(--color-primary-500-rgb, 16, 185, 129), 0.18) 0%, rgba(var(--color-primary-500-rgb, 16, 185, 129), 0.08) 45%, rgba(var(--color-primary-500-rgb, 16, 185, 129), 0) 75%)",
  } as const

  const themedSolidButton = {
    background:
      "linear-gradient(180deg, var(--color-primary-600) 0%, var(--color-primary-700) 100%)",
    boxShadow:
      "0 12px 28px -10px rgba(var(--color-primary-700-rgb, 4, 120, 87), 0.55)",
  } as const

  const queryCaseId = useMemo(
    () => (typeof router.query.caseId === "string" ? router.query.caseId : null),
    [router.query.caseId]
  )
  const isGenerated = router.query.generated === "true"

  useEffect(() => {
    if (!router.isReady) return
    if (!queryCaseId) {
      setError("No case ID provided")
      setIsLoading(false)
      return
    }
    void loadCase(queryCaseId, isGenerated)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, queryCaseId, isGenerated])

  const loadCase = async (caseId: string, generated: boolean) => {
    setIsLoading(true)
    setError(null)
    try {
      const userId = getClinicalUserId(authService.getCurrentUser())
      const resolved = await resolveMedicalCase(caseId, {
        userId: userId ?? undefined,
        mode: config.medprepMode ?? "PRACTICE",
      })
      if (resolved) {
        setMedicalCase(resolved as MedicalCase)
        return
      }

      if (generated && userId) {
        const dbSession = await fetchResumeSession(
          userId,
          config.medprepMode ?? "PRACTICE",
          caseId,
        )
        const fromDb = dbSession ? caseSnapshotFromSession(dbSession) : null
        if (fromDb && (!fromDb.id || fromDb.id === caseId)) {
          setMedicalCase(fromDb as MedicalCase)
          return
        }
      }

      const response = await fetch(`/api/cases/${caseId}`)
      if (response.ok) {
        const caseData = await response.json()
        setMedicalCase((caseData.case ?? caseData) as MedicalCase)
      } else {
        setError("Case not found")
      }
    } catch (err) {
      console.error("Error loading case:", err)
      setError("Failed to load case")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartCase = async () => {
    if (!medicalCase || isStartingSession) return
    setIsStartingSession(true)
    try {
      const userId = getClinicalUserId(authService.getCurrentUser())
      const assignmentId =
        typeof router.query.assignmentId === "string"
          ? router.query.assignmentId
          : undefined
      const mode = config.medprepMode ?? "PRACTICE"
      if (userId) {
        const session = await startMedprepSession({
          userId,
          mode,
          caseId: medicalCase.id,
          title: medicalCase.title,
          caseSnapshot: medicalCase as unknown as Record<string, unknown>,
          metadata: assignmentStartMetadata({
            assignmentId,
            institutionCaseId: medicalCase.id,
          }),
        })
        if (assignmentId && session?.id) {
          await studentInstitutionApiService
            .updateAssignmentProgress(assignmentId, {
              status: "IN_PROGRESS",
              conversationId: session.id,
              institutionCaseId: medicalCase.id,
            })
            .catch(() => undefined)
        }
      }
      const startUrl = config.startRoute(medicalCase.id, { generated: isGenerated })
      router.push(
        assignmentId
          ? `${startUrl}${startUrl.includes("?") ? "&" : "?"}assignmentId=${encodeURIComponent(assignmentId)}`
          : startUrl,
      )
    } finally {
      setIsStartingSession(false)
    }
  }

  const SectionCard = ({
    children,
    className = "",
  }: {
    children: React.ReactNode
    className?: string
  }) => (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_2px_12px_-6px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-md",
        className
      )}
    >
      {children}
    </div>
  )

  if (isLoading) {
    return (
      <div className={cn(APP_PAGE_SHELL, "min-h-screen flex items-center justify-center")}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-gray-600 dark:text-slate-400">Loading nurse report...</p>
        </div>
      </div>
    )
  }

  if (error || !medicalCase) {
    return (
      <div className={cn(APP_PAGE_SHELL, "min-h-screen flex items-center justify-center")}>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4">Case Not Found</h1>
          <p className="text-gray-600 dark:text-slate-400 mb-6">{error || "The requested case could not be found."}</p>
          <div className="space-x-4">
            <Button onClick={() => router.push(config.backRoute)} variant="outline" className="rounded-xl">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {config.backLabel}
            </Button>
            <Link href="/">
              <Button style={themedSolidButton} className="rounded-xl text-white">
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const durationLabel =
    medicalCase.difficulty === "beginner"
      ? "~20 min"
      : medicalCase.difficulty === "intermediate"
        ? "~30 min"
        : "~45 min"
  const difficultyLabel =
    medicalCase.difficulty.charAt(0).toUpperCase() + medicalCase.difficulty.slice(1)

  const additionalSymptoms = medicalCase.symptoms.slice(1)
  const primaryComplaint = medicalCase.symptoms[0] ?? ""

  const clinicalNotes = [
    `Patient arrived via ${medicalCase.caseType === "emergency" ? "emergency department" : "outpatient clinic"}`,
    "Initial assessment completed by nursing staff",
    "Vitals taken on admission — stable",
  ]

  return (
    <div className={cn(APP_PAGE_SHELL, "relative w-full shrink-0 overflow-x-hidden pb-5 sm:pb-6")}>
      <div
        aria-hidden
        className="pointer-events-none absolute -top-48 -left-48 w-[520px] h-[520px] rounded-full opacity-60"
        style={decorativeCircle}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-56 -right-56 w-[620px] h-[620px] rounded-full opacity-60"
        style={decorativeCircle}
      />

      {/* Clean inline page header */}
      <div className="border-b border-slate-200/80 bg-white dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-md">
        <div className="container mx-auto px-8 py-6 flex items-start justify-between gap-6">
          <div>
            <h1 className="text-[22px] md:text-2xl font-bold text-gray-900 dark:text-slate-100 leading-tight">
              Nurse Report
            </h1>
            <p className="text-[13px] text-gray-500 dark:text-slate-400 mt-1">
              {config.cardSubtitle}
            </p>
          </div>
          <div className="text-[13px] font-medium text-gray-700 dark:text-slate-300 pt-1">
            {config.modeLabel}
          </div>
        </div>
      </div>

      <div className="relative container mx-auto max-w-3xl px-6 pt-8 pb-2">
        {/* Case overview card */}
        <SectionCard className="mb-5 group">
          <span
            aria-hidden
            className="absolute top-0 left-0 h-[3px] w-0 bg-primary transition-all duration-500 ease-out group-hover:w-full"
          />
          <div className="p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-[20px] font-bold text-gray-900 dark:text-slate-100 leading-tight">
                  {medicalCase.title}
                </h2>
                <p className="text-[13px] text-gray-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {medicalCase.description}
                </p>
              </div>
              <span className="shrink-0 inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-[12px] font-medium">
                {medicalCase.specialty}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-1">
                  Difficulty
                </div>
                <div className="text-[14px] font-semibold text-gray-900 dark:text-slate-100">
                  {difficultyLabel}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-1">
                  Duration
                </div>
                <div className="text-[14px] font-semibold text-gray-900 dark:text-slate-100">
                  {durationLabel}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-1">
                  Symptoms
                </div>
                <div className="text-[14px] font-semibold text-gray-900 dark:text-slate-100">
                  {medicalCase.symptoms.length}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-1">
                  Type
                </div>
                <div className="text-[14px] font-semibold text-gray-900 dark:text-slate-100 capitalize">
                  {medicalCase.caseType ?? "Outpatient"}
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Patient Profile card */}
        <SectionCard className="mb-5 group">
          <span
            aria-hidden
            className="absolute top-0 left-0 h-[3px] w-0 bg-primary transition-all duration-500 ease-out group-hover:w-full"
          />
          <div className="p-6">
            <h3 className="text-[15px] font-bold text-gray-900 dark:text-slate-100 mb-4">
              Patient Profile
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
              <div>
                <div className="text-[12px] text-gray-400 dark:text-slate-500 mb-1">Name</div>
                <div className="text-[14px] font-semibold text-gray-900 dark:text-slate-100">
                  {medicalCase.patientProfile.name}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-gray-400 dark:text-slate-500 mb-1">Age</div>
                <div className="text-[14px] font-semibold text-gray-900 dark:text-slate-100">
                  {medicalCase.patientProfile.age} years old
                </div>
              </div>
              <div>
                <div className="text-[12px] text-gray-400 dark:text-slate-500 mb-1">Gender</div>
                <div className="text-[14px] font-semibold text-gray-900 dark:text-slate-100">
                  {medicalCase.patientProfile.gender}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-gray-400 dark:text-slate-500 mb-1">Occupation</div>
                <div className="text-[14px] font-semibold text-gray-900 dark:text-slate-100">
                  {medicalCase.patientProfile.occupation}
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Presenting Symptoms card (orange) */}
        <div className="relative overflow-hidden rounded-2xl border border-primary-200/60 bg-primary-50/70 shadow-[0_2px_12px_-6px_rgba(var(--color-primary-500-rgb),0.18)] mb-5 group dark:border-primary-500/25 dark:bg-primary-500/10">
          <span
            aria-hidden
            className="absolute top-0 left-0 h-[3px] w-0 bg-primary transition-all duration-500 ease-out group-hover:w-full"
          />
          <div className="p-6">
            <h3 className="text-[15px] font-bold text-primary-800 mb-4 dark:text-primary-100">
              Presenting Symptoms
            </h3>

            <div className="mb-5">
              <div className="text-[14px] font-semibold text-primary-800 dark:text-primary-200">
                Primary Complaint:{" "}
                <span className="text-primary-950 dark:text-primary-50">
                  <MarkdownContent
                    variant="primary"
                    components={{
                      p: ({ children }) => <span>{children}</span>,
                    }}
                  >
                    {primaryComplaint}
                  </MarkdownContent>
                </span>
              </div>
            </div>

            {additionalSymptoms.length > 0 && (
              <div>
                <div className="text-[12px] font-medium text-primary-700/90 dark:text-primary-300/90 mb-2">
                  Additional Symptoms
                </div>
                <div className="space-y-2">
                  {additionalSymptoms.map((symptom, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-primary-200/50 bg-primary-100/60 px-4 py-2.5 text-[13px] text-primary-950 dark:border-primary-500/20 dark:bg-primary-500/15 dark:text-primary-50"
                    >
                      <MarkdownContent
                        variant="primary"
                        components={{
                          p: ({ children }) => <span>{children}</span>,
                        }}
                      >
                        {symptom}
                      </MarkdownContent>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Clinical Notes card */}
        <SectionCard className="mb-7 group">
          <span
            aria-hidden
            className="absolute top-0 left-0 h-[3px] w-0 bg-primary transition-all duration-500 ease-out group-hover:w-full"
          />
          <div className="p-6">
            <h3 className="text-[15px] font-bold text-gray-900 dark:text-slate-100 mb-4">
              Clinical Notes
            </h3>
            <ul className="space-y-2.5">
              {clinicalNotes.map((note, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2.5 text-[13px] leading-relaxed text-gray-700 dark:text-slate-300"
                >
                  <span className="mt-[7px] w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        </SectionCard>

        {/* Begin Consultation Button */}
        <Button
          onClick={handleStartCase}
          disabled={isStartingSession}
          style={themedSolidButton}
          className="w-full rounded-2xl text-white py-7 text-[15px] font-semibold hover:opacity-95 hover:brightness-105 transition-all duration-200 disabled:opacity-70"
        >
          {isStartingSession ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              {config.startingButtonLabel}
            </>
          ) : (
            "Begin Consultation"
          )}
        </Button>

        <div className="mt-5 text-center">
          <Link
            href={config.backRoute}
            className="inline-block text-sm text-gray-500 dark:text-slate-400 transition-colors hover:text-gray-800 dark:hover:text-slate-200"
          >
            {config.backLabel}
          </Link>
        </div>
      </div>
    </div>
  )
}
