"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/router"
import { sampleCases } from "@/lib/fyp/data-models"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Home } from "lucide-react"
import Link from "next/link"
import ReactMarkdown from "react-markdown"

interface ModeNurseReportConfig {
  modeLabel: string
  backLabel: string
  backRoute: string
  startRoute: (caseId: string) => string
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

  const themedBackground = {
    background:
      "linear-gradient(135deg, var(--color-primary-50) 0%, var(--color-primary-100) 60%, var(--color-primary-50) 100%)",
  } as const

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
      const existingCase = sampleCases.find((c) => c.id === caseId) as MedicalCase | undefined
      if (existingCase) {
        setMedicalCase(existingCase)
        return
      }

      if (generated) {
        const generatedCaseData = localStorage.getItem("generatedCase")
        if (generatedCaseData) {
          try {
            const generatedCase = JSON.parse(generatedCaseData) as MedicalCase
            if (!generatedCase?.id || generatedCase.id === caseId) {
              setMedicalCase(generatedCase)
              return
            }
          } catch (parseError) {
            console.error("Error parsing generated case:", parseError)
          }
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

  const handleStartCase = () => {
    if (medicalCase && !isStartingSession) {
      setIsStartingSession(true)
      router.push(config.startRoute(medicalCase.id))
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
      className={`relative overflow-hidden rounded-2xl bg-white border border-black/5 shadow-[0_2px_12px_-6px_rgba(0,0,0,0.08)] ${className}`}
    >
      {children}
    </div>
  )

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={themedBackground}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading nurse report...</p>
        </div>
      </div>
    )
  }

  if (error || !medicalCase) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={themedBackground}>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Case Not Found</h1>
          <p className="text-gray-600 mb-6">{error || "The requested case could not be found."}</p>
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
    <div className="relative min-h-screen overflow-hidden" style={themedBackground}>
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
      <div className="bg-white">
        <div className="container mx-auto px-8 py-6 flex items-start justify-between gap-6">
          <div>
            <h1 className="text-[22px] md:text-2xl font-bold text-gray-900 leading-tight">
              Nurse Report
            </h1>
            <p className="text-[13px] text-gray-500 mt-1">
              {config.cardSubtitle}
            </p>
          </div>
          <div className="text-[13px] font-medium text-gray-700 pt-1">
            {config.modeLabel}
          </div>
        </div>
      </div>

      <div className="relative container mx-auto px-6 py-8 max-w-3xl">
        {/* Case overview card */}
        <SectionCard className="mb-5 group">
          <span
            aria-hidden
            className="absolute top-0 left-0 h-[3px] w-0 bg-primary transition-all duration-500 ease-out group-hover:w-full"
          />
          <div className="p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-[20px] font-bold text-gray-900 leading-tight">
                  {medicalCase.title}
                </h2>
                <p className="text-[13px] text-gray-500 mt-1 line-clamp-2">
                  {medicalCase.description}
                </p>
              </div>
              <span className="shrink-0 inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-[12px] font-medium">
                {medicalCase.specialty}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-gray-400 mb-1">
                  Difficulty
                </div>
                <div className="text-[14px] font-semibold text-gray-900">
                  {difficultyLabel}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-gray-400 mb-1">
                  Duration
                </div>
                <div className="text-[14px] font-semibold text-gray-900">
                  {durationLabel}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-gray-400 mb-1">
                  Symptoms
                </div>
                <div className="text-[14px] font-semibold text-gray-900">
                  {medicalCase.symptoms.length}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-gray-400 mb-1">
                  Type
                </div>
                <div className="text-[14px] font-semibold text-gray-900 capitalize">
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
            <h3 className="text-[15px] font-bold text-gray-900 mb-4">
              Patient Profile
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
              <div>
                <div className="text-[12px] text-gray-400 mb-1">Name</div>
                <div className="text-[14px] font-semibold text-gray-900">
                  {medicalCase.patientProfile.name}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-gray-400 mb-1">Age</div>
                <div className="text-[14px] font-semibold text-gray-900">
                  {medicalCase.patientProfile.age} years old
                </div>
              </div>
              <div>
                <div className="text-[12px] text-gray-400 mb-1">Gender</div>
                <div className="text-[14px] font-semibold text-gray-900">
                  {medicalCase.patientProfile.gender}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-gray-400 mb-1">Occupation</div>
                <div className="text-[14px] font-semibold text-gray-900">
                  {medicalCase.patientProfile.occupation}
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Presenting Symptoms card (orange) */}
        <div className="relative overflow-hidden rounded-2xl bg-orange-50/70 border border-orange-200/50 shadow-[0_2px_12px_-6px_rgba(251,146,60,0.18)] mb-5 group">
          <span
            aria-hidden
            className="absolute top-0 left-0 h-[3px] w-0 bg-orange-500 transition-all duration-500 ease-out group-hover:w-full"
          />
          <div className="p-6">
            <h3 className="text-[15px] font-bold text-orange-700 mb-4">
              Presenting Symptoms
            </h3>

            <div className="mb-5">
              <div className="text-[14px] font-semibold text-orange-700">
                Primary Complaint:{" "}
                <span className="text-orange-900">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <span>{children}</span>,
                    }}
                  >
                    {primaryComplaint}
                  </ReactMarkdown>
                </span>
              </div>
            </div>

            {additionalSymptoms.length > 0 && (
              <div>
                <div className="text-[12px] font-medium text-orange-600/80 mb-2">
                  Additional Symptoms
                </div>
                <div className="space-y-2">
                  {additionalSymptoms.map((symptom, index) => (
                    <div
                      key={index}
                      className="rounded-xl bg-orange-100/70 border border-orange-200/40 px-4 py-2.5 text-[13px] text-orange-900"
                    >
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <span>{children}</span>,
                        }}
                      >
                        {symptom}
                      </ReactMarkdown>
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
            <h3 className="text-[15px] font-bold text-gray-900 mb-4">
              Clinical Notes
            </h3>
            <ul className="space-y-2.5">
              {clinicalNotes.map((note, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2.5 text-[13px] text-gray-700 leading-relaxed"
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

        <div className="text-center mt-6">
          <Link
            href={config.backRoute}
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            {config.backLabel}
          </Link>
        </div>
      </div>
    </div>
  )
}
