"use client"

import { useState, useEffect } from "react"
import { sampleCases } from "@/lib/fyp/data-models"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Brain, 
  User, 
  Clock, 
  Target, 
  Activity, 
  Stethoscope, 
  FileText, 
  Sparkles,
  ArrowLeft,
  Home,
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
  Shield
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/router"
import { EvaluationPage } from "./EvaluationPage"
import { MedPrepSlugGate } from "./MedPrepSlugGate"

function SupportLandingInner() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<'landing' | 'generate' | 'select'>('landing')
  /** After Start, show Generate / Browse cards. */
  const [landingStarted, setLandingStarted] = useState(false)
  const [isGeneratingCase, setIsGeneratingCase] = useState(false)
  
  // Case generation form state
  const [caseFormData, setCaseFormData] = useState({
    specialty: "random",
    difficultyLevel: "intermediate",
    rareCase: false,
    caseType: "any"
  })

  // Check for generated case data from chatbot
  useEffect(() => {
    const generatedCaseData = sessionStorage.getItem('currentCase')
    if (generatedCaseData) {
      try {
        const caseData = JSON.parse(generatedCaseData)
        console.log('Found generated case data:', caseData)
        
        // Store in localStorage for the evaluation session
        localStorage.setItem('generatedCase', generatedCaseData)
        
        // Clear sessionStorage
        sessionStorage.removeItem('currentCase')
        
        // Redirect directly to the evaluation conversation interface with the generated case
        router.push(
          `/medprep-ai/support?mode=evaluation&caseId=${caseData.id}&generated=true&medprepEmbed=1`
        )
      } catch (error) {
        console.error('Error parsing generated case data:', error)
        sessionStorage.removeItem('currentCase')
      }
    }
  }, [router])

  // Function to handle case generation
  const handleGenerateCase = async () => {
    setIsGeneratingCase(true)
    try {
      const response = await fetch("/api/cases/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          count: 1,
          specialty: caseFormData.specialty === "random" ? "" : caseFormData.specialty,
          difficulty: caseFormData.difficultyLevel,
          forceRare: caseFormData.rareCase,
          rareProbability: caseFormData.rareCase ? 1.0 : 0.08,
          caseType: caseFormData.caseType === "any" ? "outpatient" : caseFormData.caseType,
          useLLM: true
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("API Error:", errorData)
        throw new Error(`Failed to generate case: ${errorData.details || errorData.error || 'Unknown error'}`)
      }
      
      const data = await response.json()
      console.log("Generated case data:", data)
      
      if (data.cases && data.cases.length > 0) {
        const generatedCase = data.cases[0]
        console.log("Generated case:", generatedCase)
        
        if (generatedCase.id) {
          localStorage.setItem('generatedCase', JSON.stringify(generatedCase))
          router.push(
            `/medprep-ai/support?mode=evaluation&caseId=${generatedCase.id}&generated=true&medprepEmbed=1`
          )
        } else {
          console.error("Generated case missing ID:", generatedCase)
          throw new Error("Generated case missing ID")
        }
      } else {
        console.error("No cases generated:", data)
        throw new Error("No cases generated")
      }
    } catch (error) {
      console.error("Error generating case:", error)
      throw error
    } finally {
      setIsGeneratingCase(false)
    }
  }

  // Function to handle case selection
  const handleCaseSelection = (caseId: string) => {
    setIsGeneratingCase(true) // Show loading state for case selection too
    router.push(
      `/medprep-ai/support?mode=evaluation&caseId=${caseId}&medprepEmbed=1`
    )
  }

  // Landing Page Component (Case Selection)
  const LandingPage = () => (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 overflow-hidden">
      {/* Hero Section */}
      <div className="relative h-full">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-400/20"></div>
        <div className="relative container mx-auto px-4 h-full flex flex-col justify-center">
          <div className="text-center mb-8">
            {/* Header */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-xl">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Evaluation Mode</h1>
                <div className="flex items-center justify-center gap-2 text-base text-gray-600">
                  <GraduationCap className="h-4 w-4 text-blue-600" />
                  <span>Choose Your Evaluation Case</span>
                </div>
              </div>
            </div>
          </div>

          {!landingStarted && (
            <div className="text-center mb-10">
              <Button
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-10 py-6 text-lg font-semibold shadow-lg"
                onClick={() => setLandingStarted(true)}
              >
                Start
              </Button>
            </div>
          )}

          {/* Main Action Cards — after Start */}
          <div className="container mx-auto px-4">
            {landingStarted && (
            <div className="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {/* Generate New Case */}
              <Card className="group hover:shadow-2xl transition-all duration-500 cursor-pointer border-0 bg-white/90 backdrop-blur-sm overflow-hidden" onClick={() => setCurrentStep('generate')}>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10"></div>
                  <CardHeader className="relative text-center pb-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-xl">
                      <Sparkles className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl text-gray-900 mb-2">Generate New Case</CardTitle>
                    <CardDescription className="text-base text-gray-600 leading-relaxed">
                      Generate a custom case for AI assessment. Receive comprehensive evaluation with detailed scoring and improvement suggestions.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="relative space-y-4">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 text-base flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-yellow-500" />
                        Customization Features
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <Stethoscope className="h-3 w-3 text-blue-600" />
                          </div>
                          <span className="text-xs text-gray-700">Specialty Selection</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                            <TrendingUp className="h-3 w-3 text-indigo-600" />
                          </div>
                          <span className="text-xs text-gray-700">Difficulty Levels</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                            <Heart className="h-3 w-3 text-purple-600" />
                          </div>
                          <span className="text-xs text-gray-700">Rare Diseases</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center">
                            <Shield className="h-3 w-3 text-pink-600" />
                          </div>
                          <span className="text-xs text-gray-700">Case Types</span>
                        </div>
                      </div>
                    </div>
                    <Button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 text-base font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Create Custom Case
                    </Button>
                  </CardContent>
                </div>
              </Card>

              {/* Select Existing Case */}
              <Card className="group hover:shadow-2xl transition-all duration-500 cursor-pointer border-0 bg-white/90 backdrop-blur-sm overflow-hidden" onClick={() => setCurrentStep('select')}>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10"></div>
                  <CardHeader className="relative text-center pb-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-xl">
                      <FileText className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl text-gray-900 mb-2">Browse Cases</CardTitle>
                    <CardDescription className="text-base text-gray-600 leading-relaxed">
                      Browse existing cases for AI evaluation. Get detailed scoring (A-F grades), feedback on question quality, and diagnostic reasoning assessment.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="relative space-y-4">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 text-base flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Case Library
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-600">{sampleCases.length}</span>
                          </div>
                          <span className="text-xs text-gray-700">Pre-built Cases</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                            <Activity className="h-3 w-3 text-indigo-600" />
                          </div>
                          <span className="text-xs text-gray-700">Multiple Specialties</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                            <Zap className="h-3 w-3 text-purple-600" />
                          </div>
                          <span className="text-xs text-gray-700">All Difficulty Levels</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center">
                            <Star className="h-3 w-3 text-pink-600" />
                          </div>
                          <span className="text-xs text-gray-700">Rare & Common</span>
                        </div>
                      </div>
                    </div>
                    <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-3 text-base font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                      <FileText className="h-4 w-4 mr-2" />
                      Explore Case Library
                    </Button>
                  </CardContent>
                </div>
              </Card>
            </div>
            )}

            {/* Back to Dashboard */}
            <div className="text-center mt-8">
              <Link href="/medprep-ai">
                <Button variant="outline" className="flex items-center gap-2 mx-auto bg-white/80 backdrop-blur-sm hover:bg-white border-gray-300 shadow-lg hover:shadow-xl transition-all duration-300">
                  <ArrowLeft className="h-4 w-4" />
                  Back to MedPrepAI
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Case Generation Form Component
  const CaseGenerationForm = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => {
              setCurrentStep("landing")
              setLandingStarted(true)
            }}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Generate New Case</h1>
            <p className="text-gray-600">Customize your evaluation case</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                Case Configuration
              </CardTitle>
              <CardDescription>
                Configure your case parameters. Leave fields blank for random selection.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Specialty Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Specialty</Label>
                <Select value={caseFormData.specialty} onValueChange={(value) => setCaseFormData(prev => ({ ...prev, specialty: value }))}>
                  <SelectTrigger>
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
                <p className="text-xs text-gray-500">If left blank → random specialty</p>
              </div>

              {/* Difficulty Level */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Difficulty Level</Label>
                <Select value={caseFormData.difficultyLevel} onValueChange={(value) => setCaseFormData(prev => ({ ...prev, difficultyLevel: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner - Common diseases, fewer symptoms, more obvious clues</SelectItem>
                    <SelectItem value="intermediate">Intermediate - Moderate complexity, multiple symptoms</SelectItem>
                    <SelectItem value="advanced">Advanced - Rare diseases possible, multi-system involvement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Rare Case Toggle */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Rare Disease Case</Label>
                    <p className="text-xs text-gray-500">Include rare diseases like Marfan syndrome, Addison's disease, Wilson's disease</p>
                  </div>
                  <Switch
                    checked={caseFormData.rareCase}
                    onCheckedChange={(checked) => setCaseFormData(prev => ({ ...prev, rareCase: checked }))}
                  />
                </div>
              </div>

              {/* Case Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Case Type (Optional)</Label>
                <Select value={caseFormData.caseType} onValueChange={(value) => setCaseFormData(prev => ({ ...prev, caseType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select case type (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Type</SelectItem>
                    <SelectItem value="emergency">Emergency - Acute presentation</SelectItem>
                    <SelectItem value="outpatient">Outpatient - Clinic visit</SelectItem>
                    <SelectItem value="chronic">Chronic - Follow-up care</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">Can be skipped if you want to keep it lean</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentStep("landing")
                    setLandingStarted(true)
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerateCase}
                  disabled={isGeneratingCase}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                >
                  {isGeneratingCase ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )

  // Case Selection Page Component
  const CaseSelectionPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setCurrentStep("landing")
                setLandingStarted(true)
              }}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Select Case</h1>
              <p className="text-gray-600">Choose a case for evaluation</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Evaluation Mode
          </Badge>
        </div>

        {/* Loading Modal */}
        {isGeneratingCase && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 border border-gray-200">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Loading Case</h3>
                <p className="text-sm text-gray-600">Please wait while we prepare your case...</p>
              </div>
            </div>
          </div>
        )}

        {/* Case Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sampleCases.map((caseItem) => (
            <Card 
              key={caseItem.id} 
              className={`hover:shadow-lg transition-all duration-300 cursor-pointer group relative ${
                isGeneratingCase ? 'opacity-50 pointer-events-none' : ''
              }`}
              onClick={() => handleCaseSelection(caseItem.id)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                    {caseItem.title}
                  </CardTitle>
                  <Badge 
                    variant="outline" 
                    className={
                      caseItem.difficulty === 'beginner' 
                        ? 'bg-green-100 text-green-800 border-green-200' 
                        : caseItem.difficulty === 'intermediate' 
                        ? 'bg-yellow-100 text-yellow-800 border-yellow-200' 
                        : 'bg-red-100 text-red-800 border-red-200'
                    }
                  >
                    {caseItem.difficulty}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">
                  {caseItem.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Case Info Template */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Age</span>
                      <span className="font-medium">{caseItem.patientProfile.age}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Symptoms</span>
                      <span className="font-medium">{caseItem.symptoms.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Duration</span>
                      <span className="font-medium">
                        ~{caseItem.difficulty === 'beginner' ? '20' : caseItem.difficulty === 'intermediate' ? '30' : '45'} min
                      </span>
                    </div>
                  </div>

                  {/* Patient Profile */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-gray-900">Patient Profile</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{caseItem.patientProfile.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-600">Age:</span>
                        <span className="font-medium">{caseItem.patientProfile.age}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-600">Gender:</span>
                        <span className="font-medium">{caseItem.patientProfile.gender}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-600">Occupation:</span>
                        <span className="font-medium">{caseItem.patientProfile.occupation}</span>
                      </div>
                    </div>
                  </div>

                  {/* Presenting Symptoms */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-gray-900">Presenting Symptoms</h4>
                    <div className="flex flex-wrap gap-1">
                      {caseItem.symptoms.slice(0, 3).map((symptom, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {symptom}
                        </Badge>
                      ))}
                      {caseItem.symptoms.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{caseItem.symptoms.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Case Tags */}
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
  )

  // Render based on current step
  switch (currentStep) {
    case 'generate':
      return <CaseGenerationForm />
    case 'select':
      return <CaseSelectionPage />
    default:
      return <LandingPage />
  }
}

export function SupportModePage() {
  const router = useRouter()
  if (!router.isReady) {
    return (
      <div className="flex min-h-[240px] items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-violet-600" />
      </div>
    )
  }
  const mode = typeof router.query.mode === "string" ? router.query.mode : undefined
  const caseId = typeof router.query.caseId === "string" ? router.query.caseId : undefined
  const generated = typeof router.query.generated === "string" ? router.query.generated : undefined
  const medprepEmbed = router.query.medprepEmbed === "1"
  if (
    mode === "evaluation" &&
    caseId &&
    (generated === "true" || medprepEmbed)
  ) {
    return (
      <MedPrepSlugGate slug="ai-evaluation" modeLabel="AI Evaluation Mode">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EvaluationPage embedInAppShell initialCopilotMode={false} skipExternalRedirects />
        </div>
      </MedPrepSlugGate>
    )
  }
  return <SupportLandingInner />
}
