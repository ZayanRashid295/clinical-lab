"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/router"
import { sampleCases } from "@/lib/fyp/data-models"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Stethoscope, User, Target, Activity, AlertTriangle, BookOpen, Play, ArrowLeft, Home } from "lucide-react"
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

function formatTextWithLineBreaks(text: string) {
  return text
    .split("\n")
    .map((line) => {
      if (line.trim().startsWith("•")) return line.trim()
      return line
        .split(".")
        .map((sentence) => sentence.trim())
        .filter((sentence) => sentence.length > 0)
        .map((sentence, index, array) => (index < array.length - 1 ? `${sentence}.` : sentence))
        .join(" ")
    })
    .filter((line) => line.length > 0)
    .join("\n")
}

export function ModeNurseReportPage({ config }: { config: ModeNurseReportConfig }) {
  const router = useRouter()
  const [medicalCase, setMedicalCase] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isStartingSession, setIsStartingSession] = useState(false)
  const themedGradient = {
    background:
      "linear-gradient(90deg, var(--color-primary-500) 0%, var(--color-primary-600) 100%)",
  } as const
  const themedSoftGradient = {
    background:
      "linear-gradient(90deg, rgba(var(--color-primary-500-rgb, 59, 130, 246), 0.08) 0%, rgba(var(--color-primary-500-rgb, 59, 130, 246), 0.18) 100%)",
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
  }, [router.isReady, queryCaseId, isGenerated])

  const loadCase = async (caseId: string, generated: boolean) => {
    setIsLoading(true)
    setError(null)
    try {
      const existingCase = sampleCases.find((c) => c.id === caseId)
      if (existingCase) {
        setMedicalCase(existingCase)
        return
      }

      if (generated) {
        const generatedCaseData = localStorage.getItem("generatedCase")
        if (generatedCaseData) {
          try {
            const generatedCase = JSON.parse(generatedCaseData)
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
        setMedicalCase(caseData.case ?? caseData)
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading nurse report...</p>
        </div>
      </div>
    )
  }

  if (error || !medicalCase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Case Not Found</h1>
          <p className="text-gray-600 mb-6">{error || "The requested case could not be found."}</p>
          <div className="space-x-4">
            <Button onClick={() => router.push(config.backRoute)} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {config.backLabel}
            </Button>
            <Link href="/">
              <Button>
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push(config.backRoute)} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              {config.backLabel}
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nurse Report</h1>
              <p className="text-sm text-gray-600">Initial Patient Assessment</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            {config.modeLabel}
          </Badge>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="shadow-xl border border-white/50 rounded-2xl overflow-hidden">
          <CardHeader className="border-b" style={themedSoftGradient}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary/15">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-gray-900">{medicalCase.title}</CardTitle>
                  <CardDescription className="text-gray-600">{config.cardSubtitle}</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="bg-white text-primary border-primary/20">
                {medicalCase.difficulty}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" />
                Case Overview
              </h3>
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <span className="text-gray-600">Chief Complaint:</span>
                  <div className="font-medium text-gray-900 mt-1 break-words prose prose-sm max-w-none">
                    <ReactMarkdown>{medicalCase.symptoms[0]}</ReactMarkdown>
                  </div>
                </div>
                <div><span className="text-gray-600">Specialty:</span><p className="font-medium text-gray-900">{medicalCase.specialty}</p></div>
                <div><span className="text-gray-600">Case Complexity:</span><p className="font-medium text-gray-900 capitalize">{medicalCase.difficulty}</p></div>
                <div><span className="text-gray-600">Estimated Duration:</span><p className="font-medium text-gray-900">~{medicalCase.difficulty === "beginner" ? "20" : medicalCase.difficulty === "intermediate" ? "30" : "45"} min</p></div>
              </div>
            </div>

            <div className="rounded-xl p-6 bg-primary/5 border border-primary/10">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-primary"><User className="h-5 w-5" />Patient Profile</h3>
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div><span className="text-primary/80">Name:</span><p className="font-medium text-primary">{medicalCase.patientProfile.name}</p></div>
                <div><span className="text-primary/80">Age:</span><p className="font-medium text-primary">{medicalCase.patientProfile.age} years old</p></div>
                <div><span className="text-primary/80">Gender:</span><p className="font-medium text-primary">{medicalCase.patientProfile.gender}</p></div>
                <div><span className="text-primary/80">Occupation:</span><p className="font-medium text-primary">{medicalCase.patientProfile.occupation}</p></div>
              </div>
            </div>

            <div className="bg-orange-50 rounded-lg p-6">
              <h3 className="font-semibold text-orange-900 mb-4 flex items-center gap-2"><Target className="h-5 w-5 text-primary" />Presenting Symptoms</h3>
              <div className="space-y-3">
                <div className="text-sm"><span className="text-orange-700">Primary Complaint:</span><div className="font-medium text-orange-900 prose prose-sm max-w-none mt-1 break-words"><ReactMarkdown>{medicalCase.symptoms[0]}</ReactMarkdown></div></div>
                <div className="text-sm">
                  <span className="text-orange-700">Additional Symptoms:</span>
                  <div className="flex flex-col gap-2 mt-2">
                    {medicalCase.symptoms.slice(1).map((symptom: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs bg-orange-100 text-orange-800 border-orange-200 w-full break-words">
                        <div className="prose prose-xs max-w-none w-full">
                          <ReactMarkdown>{symptom}</ReactMarkdown>
                        </div>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl p-6 bg-primary/5 border border-primary/10">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-primary"><AlertTriangle className="h-5 w-5" />Clinical Notes</h3>
              <div className="text-sm space-y-1 text-primary/90">
                {formatTextWithLineBreaks(`• Patient arrived via ${medicalCase.caseType === "emergency" ? "emergency department" : "outpatient clinic"}
• Initial assessment completed by nursing staff
• Patient is alert and oriented x3 (person, place, time)
• Vital signs: BP 120/80, HR 72, RR 16, Temp 98.6°F
• No immediate life-threatening conditions observed
• Patient appears comfortable at rest
• Ready for physician evaluation`).split("\n").map((line, index) => <div key={index}>{line}</div>)}
              </div>
            </div>

            <div className="rounded-xl p-6 bg-primary/5 border border-primary/10">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-primary"><Activity className="h-5 w-5" />Initial Assessment</h3>
              <div className="text-sm space-y-1 text-primary/90">
                {formatTextWithLineBreaks(`• Patient reports ${medicalCase.symptoms[0].toLowerCase()}
• Onset: ${medicalCase.difficulty === "beginner" ? "Gradual" : medicalCase.difficulty === "intermediate" ? "Subacute" : "Variable"} presentation
• Severity: ${medicalCase.difficulty === "beginner" ? "Mild to moderate" : medicalCase.difficulty === "intermediate" ? "Moderate" : "Moderate to severe"}
• Associated symptoms: ${medicalCase.symptoms.slice(1, 3).join(", ")}
• No known drug allergies
• Previous medical history: ${medicalCase.difficulty === "beginner" ? "Unremarkable" : "Requires further evaluation"}`).split("\n").map((line, index) => <div key={index}>{line}</div>)}
              </div>
            </div>

            <div className="rounded-xl p-6 bg-primary/5 border border-primary/10">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-primary">
                {"Learning".includes(config.modeLabel) ? <BookOpen className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                {config.guidelinesTitle}
              </h3>
              <div className="text-sm space-y-1 text-primary/90">
                {formatTextWithLineBreaks(config.guidelinesLines.join("\n")).split("\n").map((line, index) => <div key={index}>{line}</div>)}
              </div>
            </div>

            <div className="pt-6 border-t">
              <Button onClick={handleStartCase} disabled={isStartingSession} style={themedGradient} className="w-full text-white py-4 text-lg disabled:opacity-70 hover:opacity-90">
                {isStartingSession ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    {config.startingButtonLabel}
                  </>
                ) : (
                  <>
                    <Stethoscope className="h-5 w-5 mr-2" />
                    {config.startButtonLabel}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
