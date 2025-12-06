"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { TestModeSelector } from "./test-mode-selector"
import { QuestionPoolSelector } from "./question-pool-selector"
import { SubjectSelector } from "./subject-selector"
import { SystemSelector } from "./system-selector"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  CheckCircle2,
  LayoutDashboard,
  FileText,
  BarChart3,
  Settings,
  HelpCircle,
  BookOpen,
  History,
  Star,
  Bookmark,
  ChevronRight,
  Target,
  Bell,
  Search,
  Sparkles,
  Clock,
  Hash,
  BookMarked,
  Flame,
  Layers,
  Sun,
  Moon,
  Lightbulb,
} from "lucide-react"

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
  const [availableQuestionsCount] = useState<number | null>(2404)
  const [includeMarkedQuestions, setIncludeMarkedQuestions] = useState(false)
  const [markedQuestionsCount] = useState(12)
  const [showQuickGuide, setShowQuickGuide] = useState(false)

  const [expandedSystem, setExpandedSystem] = useState<string | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(true)

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDarkMode])

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", active: false, badge: null },
    { icon: FileText, label: "Create Test", active: true, badge: null },
    { icon: History, label: "Test History", active: false, badge: "23" },
    { icon: BookOpen, label: "Study Materials", active: false, badge: null },
    { icon: BarChart3, label: "Performance", active: false, badge: null },
    { icon: Target, label: "Practice Mode", active: false, badge: "New" },
    { icon: Star, label: "Bookmarks", active: false, badge: null },
  ]

  const bottomMenuItems = [
    { icon: Settings, label: "Settings", active: false },
    { icon: HelpCircle, label: "Help Center", active: false },
  ]

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

  const handleSystemExpand = (systemId: string) => {
    setExpandedSystem(expandedSystem === systemId ? null : systemId)
  }

  const validateQuestionCount = (value: string): string | undefined => {
    if (!value || value.trim() === "") return "Number of questions is required."
    const num = Number.parseInt(value, 10)
    if (isNaN(num)) return "Please enter a valid number."
    if (num <= 0) return "Number of questions must be greater than 0."
    if (num > 40) return "Maximum 40 questions allowed per test."
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
          if (error) newErrors.questionCount = error
          else delete newErrors.questionCount
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
      if (error) newErrors.questionCount = error
      else delete newErrors.questionCount
      return newErrors
    })
  }

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {}
    let isValid = true
    if (selectedTags.length === 0) {
      errors.subjects = "Please select at least one subject."
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
      if (firstErrorField) firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" })
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

  // Updated state variables and testMode logic
  const [testMode, setTestMode] = useState<string>("tutor")
  const [includeMarked, setIncludeMarked] = useState(false)
  const questionCountNum = Number.parseInt(questionCount) || 0
  const totalSelected = selectedSubjects.length + selectedSystems.length
  const maxQuestions = 40

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <BookMarked className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-sm text-sidebar-foreground">MedPrep</h1>
              <p className="text-[10px] text-muted-foreground">Question Bank</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-0.5">
          <Button
            variant="ghost"
            className="w-full justify-start h-9 px-3 text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <LayoutDashboard className="h-4 w-4 mr-2.5" />
            <span className="text-sm">Dashboard</span>
          </Button>
          <Button variant="ghost" className="w-full justify-start h-9 px-3 bg-sidebar-accent text-sidebar-foreground">
            <FileText className="h-4 w-4 mr-2.5" />
            <span className="text-sm">Create Test</span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start h-9 px-3 text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <History className="h-4 w-4 mr-2.5" />
            <span className="text-sm">Test History</span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start h-9 px-3 text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <BarChart3 className="h-4 w-4 mr-2.5" />
            <span className="text-sm">Performance</span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start h-9 px-3 text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <BookMarked className="h-4 w-4 mr-2.5" />
            <span className="text-sm">Bookmarks</span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start h-9 px-3 text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <Settings className="h-4 w-4 mr-2.5" />
            <span className="text-sm">Settings</span>
          </Button>
        </nav>

        {/* Stats Card */}
        <div className="mx-2 mb-2 p-3 rounded-lg bg-sidebar-accent/50 border border-sidebar-border">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-xs font-medium text-sidebar-foreground">12 Day Streak</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-medium text-sidebar-foreground">78% Accuracy</span>
          </div>
        </div>

        <div className="p-2 border-t border-sidebar-border">
          <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-sidebar-accent cursor-pointer transition-colors">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-medium text-primary">JD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">John Doe</p>
              <p className="text-[10px] text-muted-foreground truncate">Premium Plan</p>
            </div>
            <Settings className="h-4 w-4 text-muted-foreground" />{" "}
            {/* Changed from LogOut to Settings as per theme context */}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-border bg-card/50 flex items-center justify-between px-6 shrink-0">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Create Test</h1>
            <p className="text-xs text-muted-foreground">Customize your learning path</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setIsDarkMode(!isDarkMode)}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <Search className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground relative"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-primary rounded-full" />
            </Button>
            <div className="w-px h-5 bg-border mx-1" />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs font-medium text-muted-foreground hover:text-foreground"
              onClick={() => setShowQuickGuide(true)}
            >
              <HelpCircle className="h-3.5 w-3.5 mr-1.5" />
              Quick Guide
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto scrollbar-thin bg-background">
          <div className="p-6">
            {/* Settings Row */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              {/* Test Mode */}
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-4 py-3 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <h3 className="text-sm font-medium text-foreground">Test Mode</h3>
                  </div>
                </div>
                <div className="p-4">
                  <TestModeSelector
                    testMode={testMode}
                    setTestMode={setTestMode}
                    isTimed={isTimed}
                    setIsTimed={setIsTimed}
                  />
                </div>
              </div>

              {/* Marked Questions */}
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-4 py-3 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-rose-500" />
                      <h3 className="text-sm font-medium text-foreground">Marked Questions</h3>
                    </div>
                    <span className="text-xs text-muted-foreground">0 marked</span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Include marked questions</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Filter questions marked for review</p>
                    </div>
                    <Switch checked={includeMarked} onCheckedChange={setIncludeMarked} />
                  </div>
                </div>
              </div>

              {/* Question Pool */}
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-4 py-3 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <h3 className="text-sm font-medium text-foreground">Question Pool</h3>
                  </div>
                </div>
                <div className="p-4">
                  <QuestionPoolSelector selectedPool={selectedPool} onPoolChange={setSelectedPool} />
                </div>
              </div>
            </div>

            {/* Subjects & Systems */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="grid grid-cols-[280px_1fr] divide-x divide-border min-h-[500px]">
                {/* Subjects Column */}
                <SubjectSelector selectedSubjects={selectedSubjects} onSubjectToggle={handleSubjectToggle} />

                {/* Systems Column */}
                <SystemSelector
                  selectedSystems={selectedSystems}
                  onSystemToggle={handleSystemToggle}
                  expandedSystem={expandedSystem}
                  onSystemExpand={handleSystemExpand}
                />
              </div>
            </div>

            {/* Question Count */}
            <div className="mt-4 bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-violet-500" />
                  <h3 className="text-sm font-medium text-foreground">Question Count</h3>
                  <span className="text-xs text-muted-foreground ml-auto">max {maxQuestions}</span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      min={1}
                      max={maxQuestions}
                      value={questionCount}
                      onChange={(e) =>
                        setQuestionCount(Math.min(maxQuestions, Math.max(1, Number.parseInt(e.target.value) || 1)))
                      }
                      className="w-20 h-9 text-center bg-muted/50 border-border"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${(questionCountNum / maxQuestions) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">{questionCountNum} questions</span>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="h-16 border-t border-border bg-card/80 backdrop-blur flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{totalSelected}</span> selections
              </span>
            </div>
            {selectedSubjects.length > 0 && (
              <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                {selectedSubjects.length} subjects
              </span>
            )}
            {selectedSystems.length > 0 && (
              <span className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                {selectedSystems.length} systems
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="h-9 bg-transparent">
              Reset All
            </Button>
            <Button size="sm" className="h-9 px-6" onClick={handleGenerateTest} disabled={isLoading || !isFormValid}>
              Generate Test
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </footer>
      </div>

      {/* Quick Guide Modal */}
      <QuickGuideModal open={showQuickGuide} onOpenChange={setShowQuickGuide} />
    </div>
  )
}

// Quick Guide Modal Component
function QuickGuideModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const steps = [
    {
      number: 1,
      title: "Configure Test Settings",
      description:
        "Choose Tutor Mode to see explanations after each question. Enable Timed mode for time-based practice. Both can be used together.",
      icon: Clock,
      badges: ["Tutor Mode", "Timed"],
    },
    {
      number: 2,
      title: "Marked Questions",
      description:
        "Toggle to include questions you've previously marked for review. Great for focused revision sessions.",
      icon: Bookmark,
      badges: ["Include Marked"],
      tip: "Mark difficult questions during practice to review them later",
    },
    {
      number: 3,
      title: "Select Question Pool",
      description:
        "Filter questions by their status. Choose Unused for fresh questions, Correct/Incorrect to review, or Omitted for skipped ones.",
      icon: Layers,
      badges: ["Unused", "Correct", "Incorrect", "Omitted"],
    },
    {
      number: 4,
      title: "Choose Subjects",
      description:
        "Select specific subjects to focus your study. Each subject shows the total number of available questions.",
      icon: BookOpen,
      badges: ["Anatomy", "Physiology", "Pathology"],
    },
    {
      number: 5,
      title: "Select Body Systems",
      description:
        "Pick body systems to narrow down your question selection. Click on a system to view and select specific topics within it.",
      icon: Target,
      badges: ["Cardiovascular", "Respiratory", "Nervous"],
      tip: "Click the arrow on any system to expand and see related topics",
    },
    {
      number: 6,
      title: "Set Question Count",
      description:
        "Choose how many questions you want in your test. Maximum 40 questions per session for optimal learning.",
      icon: Hash,
      badges: ["1-40 Questions"],
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Quick Guide</DialogTitle>
              <p className="text-sm text-muted-foreground">Learn how to create the perfect test</p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <div className="space-y-4">
            {steps.map((step) => (
              <div
                key={step.number}
                className="flex gap-4 p-4 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{step.number}</span>
                  </div>
                  <step.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground mb-1">{step.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {step.badges.map((badge) => (
                      <span
                        key={badge}
                        className="text-xs px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                  {step.tip && (
                    <div className="mt-2 flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                      <Lightbulb className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span>{step.tip}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>Average completion: 2 mins</span>
          </div>
          <Button onClick={() => onOpenChange(false)}>Got it, let's start</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
