"use client"

import { useEffect, useState } from "react"
import { sampleCases } from "@/lib/fyp/data-models"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  User,
  Activity,
  Stethoscope,
  FileText,
  Sparkles,
  ArrowLeft,
  Users,
  Calendar,
  Briefcase,
  BookOpen,
  GraduationCap,
  Lightbulb,
  TrendingUp,
  Star,
  CheckCircle,
  Zap,
  Heart,
  Shield,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/router"

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
  const [caseFormData, setCaseFormData] = useState({
    specialty: "random",
    difficultyLevel: "intermediate",
    rareCase: false,
    caseType: "any",
  })
  const themedBackground = {
    background:
      "linear-gradient(135deg, var(--color-primary-50) 0%, var(--color-primary-100) 55%, var(--color-primary-200) 100%)",
  } as const
  const themedOverlay = {
    background:
      "linear-gradient(90deg, rgba(var(--color-primary-500-rgb, 59, 130, 246), 0.08) 0%, rgba(var(--color-primary-500-rgb, 59, 130, 246), 0.2) 100%)",
  } as const
  const themedGradient = {
    background:
      "linear-gradient(90deg, var(--color-primary-500) 0%, var(--color-primary-600) 100%)",
  } as const
  const themedSoftGradient = {
    background:
      "linear-gradient(135deg, rgba(var(--color-primary-500-rgb, 59, 130, 246), 0.05) 0%, rgba(var(--color-primary-500-rgb, 59, 130, 246), 0.14) 100%)",
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

  return (
    <>
      {currentStep === "landing" && (
        <div className="h-screen overflow-hidden" style={themedBackground}>
          <div className="relative h-full">
            <div className="absolute inset-0" style={themedOverlay} />
            <div className="relative container mx-auto px-4 h-full flex flex-col justify-center">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-xl" style={themedGradient}>
                    <BookOpen className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">{config.modeTitle}</h1>
                    <div className="flex items-center justify-center gap-2 text-base text-gray-600">
                      <GraduationCap className="h-4 w-4 text-primary" />
                      <span>{config.chooseCaseSubtitle}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="container mx-auto px-4">
                <div className="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
                  <Card className="group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 cursor-pointer border border-white/40 bg-white/85 backdrop-blur-sm overflow-hidden rounded-2xl" onClick={() => setCurrentStep("generate")}>
                    <div className="relative">
                      <div className="absolute inset-0" style={themedSoftGradient} />
                      <CardHeader className="relative text-center pb-4">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-xl" style={themedGradient}>
                          <Sparkles className="h-8 w-8 text-white" />
                        </div>
                        <CardTitle className="text-2xl text-gray-900 mb-2">Generate New Case</CardTitle>
                        <CardDescription className="text-base text-gray-600 leading-relaxed">{config.generateDescription}</CardDescription>
                      </CardHeader>
                      <CardContent className="relative space-y-4">
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-900 text-base flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-primary" />
                            Customization Features
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full flex items-center justify-center bg-primary/10"><Stethoscope className="h-3 w-3 text-primary" /></div><span className="text-xs text-gray-700">Specialty Selection</span></div>
                            <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full flex items-center justify-center bg-primary/15"><TrendingUp className="h-3 w-3 text-primary" /></div><span className="text-xs text-gray-700">Difficulty Levels</span></div>
                            <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full flex items-center justify-center bg-primary/20"><Heart className="h-3 w-3 text-primary" /></div><span className="text-xs text-gray-700">Rare Diseases</span></div>
                            <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full flex items-center justify-center bg-primary/25"><Shield className="h-3 w-3 text-primary" /></div><span className="text-xs text-gray-700">Case Types</span></div>
                          </div>
                        </div>
                        <Button style={themedGradient} className="w-full text-white py-3 text-base font-semibold shadow-lg hover:shadow-xl hover:opacity-90 transform hover:scale-[1.02] transition-all duration-300">
                          <Sparkles className="h-4 w-4 mr-2" />
                          Create Custom Case
                        </Button>
                      </CardContent>
                    </div>
                  </Card>

                  <Card className="group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 cursor-pointer border border-white/40 bg-white/85 backdrop-blur-sm overflow-hidden rounded-2xl" onClick={() => setCurrentStep("select")}>
                    <div className="relative">
                      <div className="absolute inset-0" style={themedSoftGradient} />
                      <CardHeader className="relative text-center pb-4">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-xl" style={themedGradient}>
                          <FileText className="h-8 w-8 text-white" />
                        </div>
                        <CardTitle className="text-2xl text-gray-900 mb-2">Browse Cases</CardTitle>
                        <CardDescription className="text-base text-gray-600 leading-relaxed">{config.browseDescription}</CardDescription>
                      </CardHeader>
                      <CardContent className="relative space-y-4">
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-900 text-base flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" />Case Library</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full flex items-center justify-center bg-primary/10"><span className="text-xs font-bold text-primary">{sampleCases.length}</span></div><span className="text-xs text-gray-700">Pre-built Cases</span></div>
                            <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full flex items-center justify-center bg-primary/15"><Activity className="h-3 w-3 text-primary" /></div><span className="text-xs text-gray-700">Multiple Specialties</span></div>
                            <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full flex items-center justify-center bg-primary/20"><Zap className="h-3 w-3 text-primary" /></div><span className="text-xs text-gray-700">All Difficulty Levels</span></div>
                            <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full flex items-center justify-center bg-primary/25"><Star className="h-3 w-3 text-primary" /></div><span className="text-xs text-gray-700">Rare & Common</span></div>
                          </div>
                        </div>
                        <Button style={themedGradient} className="w-full text-white py-3 text-base font-semibold shadow-lg hover:shadow-xl hover:opacity-90 transform hover:scale-[1.02] transition-all duration-300">
                          <FileText className="h-4 w-4 mr-2" />
                          Explore Case Library
                        </Button>
                      </CardContent>
                    </div>
                  </Card>
                </div>

                <div className="text-center mt-8">
                  <Link href={config.backToModeRoute}>
                    <Button variant="outline" className="flex items-center gap-2 mx-auto bg-white/80 backdrop-blur-sm hover:bg-white border-gray-300 shadow-lg hover:shadow-xl transition-all duration-300">
                      <ArrowLeft className="h-4 w-4" />
                      {config.backToModeLabel}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === "generate" && (
        <div className="min-h-screen relative" style={themedBackground}>
          {isGeneratingCase && (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 border border-gray-200">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl" style={themedGradient}>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Generating Case</h3>
                  <p className="text-sm text-gray-600">Please wait while we create your custom case...</p>
                </div>
              </div>
            </div>
          )}
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-4 mb-8">
              <Button variant="outline" onClick={() => setCurrentStep("landing")} className="flex items-center gap-2"><ArrowLeft className="h-4 w-4" />Back</Button>
              <div><h1 className="text-3xl font-bold text-gray-900">Generate New Case</h1><p className="text-gray-600">Customize your {config.casePurpose} case</p></div>
            </div>
            <div className="max-w-2xl mx-auto">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" />Case Configuration</CardTitle>
                  <CardDescription>Configure your case parameters. Leave fields blank for random selection.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Specialty</Label>
                    <Select value={caseFormData.specialty} onValueChange={(value) => setCaseFormData((prev) => ({ ...prev, specialty: value }))}>
                      <SelectTrigger><SelectValue placeholder="Select specialty (or leave blank for random)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="random">Random Specialty</SelectItem><SelectItem value="Cardiology">Cardiology</SelectItem><SelectItem value="Neurology">Neurology</SelectItem><SelectItem value="Endocrinology">Endocrinology</SelectItem><SelectItem value="Pulmonology">Pulmonology</SelectItem><SelectItem value="Gastroenterology">Gastroenterology</SelectItem><SelectItem value="Nephrology">Nephrology</SelectItem><SelectItem value="Hematology">Hematology</SelectItem><SelectItem value="Oncology">Oncology</SelectItem><SelectItem value="General Medicine">General Medicine</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">If left blank → random specialty</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Difficulty Level</Label>
                    <Select value={caseFormData.difficultyLevel} onValueChange={(value) => setCaseFormData((prev) => ({ ...prev, difficultyLevel: value }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner - Common diseases, fewer symptoms, more obvious clues</SelectItem>
                        <SelectItem value="intermediate">Intermediate - Moderate complexity, multiple symptoms</SelectItem>
                        <SelectItem value="advanced">Advanced - Rare diseases possible, multi-system involvement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Rare Disease Case</Label>
                        <p className="text-xs text-gray-500">Include rare diseases like Marfan syndrome, Addison&apos;s disease, Wilson&apos;s disease</p>
                      </div>
                      <Switch checked={caseFormData.rareCase} onCheckedChange={(checked) => setCaseFormData((prev) => ({ ...prev, rareCase: checked }))} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Case Type (Optional)</Label>
                    <Select value={caseFormData.caseType} onValueChange={(value) => setCaseFormData((prev) => ({ ...prev, caseType: value }))}>
                      <SelectTrigger><SelectValue placeholder="Select case type (optional)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any Type</SelectItem><SelectItem value="emergency">Emergency - Acute presentation</SelectItem><SelectItem value="outpatient">Outpatient - Clinic visit</SelectItem><SelectItem value="chronic">Chronic - Follow-up care</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">Can be skipped if you want to keep it lean</p>
                  </div>
                  <div className="flex gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={() => setCurrentStep("landing")} className="flex-1">Cancel</Button>
                    <Button onClick={handleGenerateCase} disabled={isGeneratingCase} style={themedGradient} className="flex-1 text-white hover:opacity-90">
                      {isGeneratingCase ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Generating Case...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate Case</>}
                    </Button>
                  </div>
                  {generationError ? <p className="text-sm text-red-600">{generationError}</p> : null}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {currentStep === "select" && (
        <div className="min-h-screen relative" style={themedBackground}>
          {isGeneratingCase && (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 border border-gray-200">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl" style={themedGradient}>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Loading Case</h3>
                  <p className="text-sm text-gray-600">Please wait while we prepare your case...</p>
                </div>
              </div>
            </div>
          )}
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={() => setCurrentStep("landing")} className="flex items-center gap-2"><ArrowLeft className="h-4 w-4" />Back</Button>
                <div><h1 className="text-3xl font-bold text-gray-900">Select Case</h1><p className="text-gray-600">Choose a case for {config.casePurpose}</p></div>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">{config.modeTitle}</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sampleCases.map((caseItem) => (
                <Card key={caseItem.id} className={`hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative rounded-2xl border border-white/50 bg-white/90 ${isGeneratingCase ? "opacity-50 pointer-events-none" : ""}`} onClick={() => handleCaseSelection(caseItem.id)}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg transition-colors group-hover:text-primary">{caseItem.title}</CardTitle>
                      <Badge variant="outline" className={caseItem.difficulty === "beginner" ? "bg-green-100 text-green-800 border-green-200" : caseItem.difficulty === "intermediate" ? "bg-yellow-100 text-yellow-800 border-yellow-200" : "bg-red-100 text-red-800 border-red-200"}>{caseItem.difficulty}</Badge>
                    </div>
                    <CardDescription className="line-clamp-2">{caseItem.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between text-sm"><span className="text-gray-600">Age</span><span className="font-medium">{caseItem.patientProfile.age}</span></div>
                        <div className="flex items-center justify-between text-sm"><span className="text-gray-600">Symptoms</span><span className="font-medium">{caseItem.symptoms.length}</span></div>
                        <div className="flex items-center justify-between text-sm"><span className="text-gray-600">Duration</span><span className="font-medium">~{caseItem.difficulty === "beginner" ? "20" : caseItem.difficulty === "intermediate" ? "30" : "45"} min</span></div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-gray-900">Patient Profile</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1"><User className="h-3 w-3 text-gray-500" /><span className="text-gray-600">Name:</span><span className="font-medium">{caseItem.patientProfile.name}</span></div>
                          <div className="flex items-center gap-1"><Calendar className="h-3 w-3 text-gray-500" /><span className="text-gray-600">Age:</span><span className="font-medium">{caseItem.patientProfile.age}</span></div>
                          <div className="flex items-center gap-1"><Users className="h-3 w-3 text-gray-500" /><span className="text-gray-600">Gender:</span><span className="font-medium">{caseItem.patientProfile.gender}</span></div>
                          <div className="flex items-center gap-1"><Briefcase className="h-3 w-3 text-gray-500" /><span className="text-gray-600">Occupation:</span><span className="font-medium">{caseItem.patientProfile.occupation}</span></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-gray-900">Presenting Symptoms</h4>
                        <div className="flex flex-wrap gap-1">
                          {caseItem.symptoms.slice(0, 3).map((symptom, index) => <Badge key={index} variant="secondary" className="text-xs">{symptom}</Badge>)}
                          {caseItem.symptoms.length > 3 && <Badge variant="outline" className="text-xs">+{caseItem.symptoms.length - 3} more</Badge>}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs">{caseItem.specialty}</Badge>
                        {caseItem.isRare && <Badge variant="destructive" className="text-xs">Rare</Badge>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
