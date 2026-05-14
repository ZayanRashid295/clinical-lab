"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  HelpCircle, 
  Lightbulb, 
  MessageCircleQuestion, 
  Eye, 
  EyeOff, 
  Sparkles,
  Brain,
  Zap,
  Target,
  Clock,
  Star,
  ChevronRight,
  ArrowRight,
  BookOpen,
  Heart,
  AlertTriangle,
  CheckCircle,
  Flame,
  Crown,
  Gem,
  Rocket,
  Wand2,
  Sparkle
} from "lucide-react"
import type { ConversationContext } from "@/lib/fyp/data-models"
import { aiHintTrackingService } from "@/lib/fyp/ai-hint-tracking-service"
import { cn } from "@/shared/utils/cn"
import { APP_GLASS_CARD } from "@/app/config/app-shell"

interface SuggestedQuestion {
  id: string
  question: string
  category: string
  importance: "high" | "medium" | "low"
  rationale?: string
  confidence?: number
  tags?: string[]
}

interface AskQuestionsProps {
  context: ConversationContext
  onQuestionSelect: (question: string) => void
  isLoading?: boolean
  triggerRefresh?: number
  sessionId?: string
  onHintUsed?: (category: string, importance: "high" | "medium" | "low") => void
}

// Enhanced Animated Counter Component
const AnimatedCounter = ({
  value,
  duration = 1000,
  suffix = "",
  prefix = "",
}: {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | undefined;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (startTime === undefined) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      setCount(Math.floor(progress * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return (
    <span>
      {prefix}
      {count}
      {suffix}
    </span>
  );
};

export function AskQuestions({ context, onQuestionSelect, isLoading = false, triggerRefresh = 0, sessionId, onHintUsed }: AskQuestionsProps) {
  const [suggestedQuestions, setSuggestedQuestions] = useState<SuggestedQuestion[]>([])
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFlipped, setIsFlipped] = useState(false)
  const [showRationale, setShowRationale] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [animationKey, setAnimationKey] = useState(0)
  const [hintUsageCount, setHintUsageCount] = useState(0)

  const fetchSuggestedQuestions = useCallback(async () => {
    if (context.conversationHistory.length === 0) return
    
    setIsLoadingQuestions(true)
    setError(null)
    setAnimationKey(prev => prev + 1)

    try {
      const response = await fetch("/api/ai/suggested-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ context }),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch suggested questions")
      }

      const data = await response.json()
      setSuggestedQuestions(data.questions || [])
    } catch (error) {
      console.error("Error fetching suggested questions:", error)
      setError("Unable to load suggested questions")
      setSuggestedQuestions(generateFallbackQuestions(context.disease))
    } finally {
      setIsLoadingQuestions(false)
    }
  }, [context])

  const generateFallbackQuestions = (disease: string): SuggestedQuestion[] => {
    const commonQuestions = [
      {
        id: "1",
        question: "When did your symptoms first begin?",
        category: "History",
        importance: "high" as const,
        rationale: "Understanding symptom onset helps determine disease progression and urgency",
        confidence: 95,
        tags: ["onset", "timing", "history"]
      },
      {
        id: "2",
        question: "How would you rate your pain on a scale of 1-10?",
        category: "Assessment",
        importance: "high" as const,
        rationale: "Pain assessment is crucial for diagnosis and treatment planning",
        confidence: 90,
        tags: ["pain", "assessment", "severity"]
      },
      {
        id: "3",
        question: "Have you noticed any triggers that make your symptoms worse?",
        category: "History",
        importance: "medium" as const,
        rationale: "Identifying triggers helps understand the condition better and guide treatment",
        confidence: 85,
        tags: ["triggers", "exacerbating", "factors"]
      },
      {
        id: "4",
        question: "Are you currently taking any medications?",
        category: "History",
        importance: "high" as const,
        rationale: "Current medications can affect symptoms and treatment options",
        confidence: 95,
        tags: ["medications", "drugs", "treatment"]
      },
      {
        id: "5",
        question: "Do you have any family history of similar conditions?",
        category: "History",
        importance: "medium" as const,
        rationale: "Family history provides important genetic and risk factor information",
        confidence: 80,
        tags: ["family", "genetics", "risk"]
      },
      {
        id: "6",
        question: "Have you experienced any recent changes in your daily activities?",
        category: "Impact",
        importance: "medium" as const,
        rationale: "Understanding functional impact helps assess severity and treatment needs",
        confidence: 75,
        tags: ["function", "activities", "impact"]
      }
    ]

    return commonQuestions
  }

  useEffect(() => {
    if (triggerRefresh > 0) {
      fetchSuggestedQuestions()
    }
  }, [triggerRefresh, fetchSuggestedQuestions])

  // Update hint usage count when session changes
  useEffect(() => {
    if (sessionId) {
      const session = aiHintTrackingService.getSession(sessionId)
      if (session) {
        setHintUsageCount(session.totalHintsUsed)
      }
    }
  }, [sessionId, triggerRefresh])

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case "high":
        return "border-red-300 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-500/35 dark:!bg-red-950/50 dark:!text-red-100 dark:hover:!bg-red-900/55"
      case "medium":
        return "border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-500/35 dark:!bg-yellow-950/45 dark:!text-yellow-100 dark:hover:!bg-yellow-900/50"
      case "low":
        return "border-primary-200 bg-primary-50 text-primary-800 hover:bg-primary-100 dark:border-primary-500/30 dark:!bg-primary-900/45 dark:!text-primary-100 dark:hover:!bg-primary-800/50"
      default:
        return "border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:border-white/15 dark:!bg-slate-800/85 dark:!text-slate-200 dark:hover:!bg-slate-700/80"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "history":
        return "📋"
      case "assessment":
        return "🔍"
      case "examination":
        return "🩺"
      case "symptoms":
        return "🤒"
      case "impact":
        return "📊"
      default:
        return "❓"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "history":
        return "border-primary-200 bg-primary-50 text-primary-800 dark:border-primary-500/30 dark:!bg-primary-900/45 dark:!text-primary-100"
      case "assessment":
        return "border-primary-300 bg-primary-100/80 text-primary-900 dark:border-primary-500/35 dark:!bg-primary-900/45 dark:!text-primary-50"
      case "examination":
        return "border-primary-200 bg-primary-50 text-primary-800 dark:border-primary-500/30 dark:!bg-primary-900/45 dark:!text-primary-100"
      case "symptoms":
        return "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/30 dark:!bg-orange-950/50 dark:!text-orange-100"
      case "impact":
        return "border-pink-200 bg-pink-50 text-pink-700 dark:border-pink-500/30 dark:!bg-pink-950/50 dark:!text-pink-100"
      default:
        return "border-gray-200 bg-gray-50 text-gray-700 dark:border-white/15 dark:!bg-slate-800/80 dark:!text-slate-200"
    }
  }

  const filteredQuestions = suggestedQuestions.filter(q => 
    selectedCategory === "all" || q.category.toLowerCase() === selectedCategory.toLowerCase()
  )

  const categories = ["all", ...Array.from(new Set(suggestedQuestions.map(q => q.category)))]

  return (
    <div className="h-full">
      <div 
        className={`relative w-full h-full transition-all duration-700 cursor-pointer ${
          isFlipped ? '' : ''
        }`}
        onClick={() => setIsFlipped(!isFlipped)}
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}
      >
        {/* Front Side - Click to get hints */}
        <div 
          className="absolute inset-0"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(0deg)',
            opacity: isFlipped ? 0 : 1,
            visibility: isFlipped ? 'hidden' : 'visible'
          }}
        >
          <Card
            className={cn(
              "relative flex h-full items-center justify-center overflow-hidden border-2 border-dashed transition-all duration-300",
              "border-primary-300 bg-gradient-to-br from-primary-50 via-primary-100/80 to-primary-100",
              "hover:border-primary-400 hover:shadow-xl",
              "dark:border-primary-500/45 dark:!bg-gradient-to-br dark:!from-slate-950 dark:!via-primary-900/45 dark:!to-slate-950",
              "dark:hover:border-primary-400/70 dark:hover:shadow-2xl dark:shadow-black/35"
            )}
          >
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-4 -right-4 h-24 w-24 animate-pulse rounded-full bg-primary-200/40 dark:bg-primary-500/15"></div>
              <div className="absolute -bottom-4 -left-4 h-32 w-32 animate-pulse rounded-full bg-primary-300/30 dark:bg-primary-500/10" style={{ animationDelay: "1s" }}></div>
              <div className="absolute top-1/2 left-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 transform animate-pulse rounded-full bg-primary-200/35 dark:bg-primary-500/10" style={{ animationDelay: "2s" }}></div>
            </div>
            
            <CardContent className="relative z-10 p-6 text-center sm:p-8">
              <div className="relative mb-6">
                <div className="absolute inset-0 animate-pulse rounded-full bg-primary-200/30 dark:bg-primary-500/15"></div>
                <div className="relative rounded-full bg-gradient-to-r from-primary-500 to-primary-700 p-4 shadow-lg sm:p-5">
                  <HelpCircle className="h-12 w-12 text-white sm:h-14 sm:w-14" />
                </div>
                <div className="absolute -top-2 -right-2">
                  <Sparkles className="h-6 w-6 text-yellow-500 animate-spin" style={{ animationDuration: "3s" }} />
                </div>
              </div>
              
              <h3 className="mb-3 text-2xl font-bold text-primary-900 dark:text-primary-50 sm:text-3xl">
                Get AI Question Hints
              </h3>
              <p className="mx-auto mb-4 max-w-md text-base leading-relaxed text-primary-800 dark:text-slate-200 sm:text-[17px]">
                Click to reveal intelligent question suggestions tailored to this specific case and conversation
              </p>
              
              <div className="mb-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                <div className="inline-flex items-center rounded-full border border-primary-200/70 bg-primary-100 px-3.5 py-1.5 dark:border-white/20 dark:!bg-slate-950/95 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
                  <Brain className="mr-1.5 h-4 w-4 shrink-0 text-primary-700 dark:!text-slate-200 sm:h-5 sm:w-5" />
                  <span className="text-sm font-semibold text-primary-900 dark:!text-slate-100">AI-Powered</span>
                </div>
                <div className="inline-flex items-center rounded-full border border-primary-200/70 bg-primary-100/90 px-3.5 py-1.5 dark:border-white/20 dark:!bg-slate-950/95 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
                  <Zap className="mr-1.5 h-4 w-4 shrink-0 text-primary-700 dark:!text-slate-200 sm:h-5 sm:w-5" />
                  <span className="text-sm font-semibold text-primary-900 dark:!text-slate-100">Smart Suggestions</span>
                </div>
              </div>
              
              <div className="flex items-center justify-center text-base text-primary-600 dark:!text-slate-400 sm:text-[17px]">
                <ArrowRight className="mr-1 h-5 w-5 shrink-0 animate-bounce" />
                <span className="font-medium">Click to explore</span>
                <ArrowRight className="ml-1 h-5 w-5 shrink-0 animate-bounce" style={{ animationDelay: "0.5s" }} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Back Side - Suggested Questions */}
        <div 
          className="absolute inset-0"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            opacity: isFlipped ? 1 : 0,
            visibility: isFlipped ? 'visible' : 'hidden'
          }}
        >
          <Card
            className={cn(
              APP_GLASS_CARD,
              "h-full border border-gray-200/50 shadow-2xl backdrop-blur-sm dark:border-white/10",
              "dark:!bg-slate-900/94"
            )}
          >
            <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-primary-50 to-primary-100/80 pb-2 pt-3 dark:border-white/10 dark:bg-gradient-to-r dark:!from-slate-900/95 dark:!to-slate-900/70">
              <div className="flex items-center justify-between">
                
                {/* Hint Usage Counter */}
                {sessionId && (
                  <div className="flex items-center space-x-1">
                    <div className="flex items-center rounded-full border border-orange-200 bg-gradient-to-r from-orange-100 to-red-100 px-2.5 py-1.5 dark:border-orange-500/30 dark:!bg-gradient-to-r dark:!from-orange-950/55 dark:!to-red-950/45">
                      <Lightbulb className="mr-1 h-4 w-4 shrink-0 text-orange-600 dark:text-orange-300" />
                      <span className="text-sm font-semibold text-orange-700 dark:text-orange-200">
                        Hints: <AnimatedCounter value={hintUsageCount} />
                      </span>
                    </div>
                    {hintUsageCount > 0 && (
                      <div className="flex items-center rounded-full border border-red-200 bg-gradient-to-r from-red-100 to-pink-100 px-2.5 py-1.5 dark:border-red-500/30 dark:!bg-gradient-to-r dark:!from-red-950/55 dark:!to-pink-950/45">
                        <AlertTriangle className="mr-1 h-4 w-4 shrink-0 text-red-600 dark:text-red-300" />
                        <span className="text-sm font-medium text-red-700 dark:text-red-200">
                          -{Math.min(hintUsageCount * 2, 50)} pts
                        </span>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowRationale(!showRationale)
                    }}
                    className="p-1 hover:bg-white/50 dark:hover:bg-white/10"
                    title={showRationale ? "Hide explanations" : "Show explanations"}
                  >
                    {showRationale ? (
                      <EyeOff className="h-3 w-3 text-gray-600 dark:text-slate-300" />
                    ) : (
                      <Eye className="h-3 w-3 text-gray-600 dark:text-slate-300" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsFlipped(false)
                    }}
                    className="p-1 hover:bg-white/50 dark:hover:bg-white/10"
                    title="Back to overview"
                  >
                    <ChevronRight className="h-3 w-3 rotate-180 text-gray-600 dark:text-slate-300" />
                  </Button>
                </div>
              </div>
              <p className="mt-1 text-sm text-gray-600 dark:text-slate-400 md:text-base">
                Click any question to use it in your conversation
              </p>
              
              {/* Category Filter */}
              {suggestedQuestions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedCategory(category)
                      }}
                      className={`text-sm md:text-[15px] ${
                        selectedCategory === category 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-white/50 text-gray-600 hover:bg-primary/10 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-primary/20"
                      }`}
                    >
                      {category === "all" ? "All" : category}
                    </Button>
                  ))}
                </div>
              )}
            </CardHeader>
            
            <CardContent className="flex-1 overflow-hidden p-4">
              <div className="space-y-3 h-full overflow-y-auto custom-scrollbar">
                {isLoadingQuestions ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, index) => (
                      <div key={index} className="animate-pulse rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 p-4 dark:from-white/[0.06] dark:to-white/[0.03]">
                        <div className="mb-3 flex items-center space-x-2">
                          <div className="h-6 w-16 rounded-full bg-gray-200 dark:bg-white/10"></div>
                          <div className="h-6 w-12 rounded-full bg-gray-200 dark:bg-white/10"></div>
                          <div className="h-6 w-20 rounded-full bg-gray-200 dark:bg-white/10"></div>
                        </div>
                        <div className="mb-2 h-4 rounded bg-gray-200 dark:bg-white/10"></div>
                        <div className="h-3 w-3/4 rounded bg-gray-100 dark:bg-white/[0.06]"></div>
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="py-12 text-center">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/15">
                      <AlertTriangle className="h-10 w-10 text-red-500 dark:text-red-400" />
                    </div>
                    <h4 className="mb-2 font-semibold text-gray-700 dark:text-slate-200">Unable to Load Suggestions</h4>
                    <p className="mb-3 text-sm text-gray-500 dark:text-slate-400">{error}</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        fetchSuggestedQuestions()
                      }}
                    >
                      Try Again
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredQuestions.map((question, index) => (
                      <div
                        key={`${question.id}-${animationKey}`}
                        className="group cursor-pointer transform rounded-xl border border-gray-200 bg-gradient-to-r from-white to-gray-50 p-4 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:border-primary-200 hover:shadow-lg dark:border-white/10 dark:from-white/[0.06] dark:to-white/[0.02] dark:hover:border-primary-500/30"
                        onClick={(e) => {
                          e.stopPropagation()
                          
                          // Track hint usage if sessionId is provided
                          if (sessionId) {
                            const session = aiHintTrackingService.trackHintUsage(sessionId, question.category, question.importance)
                            if (session) {
                              console.log(`Hint used: ${question.category} (${question.importance}) - Total hints: ${session.totalHintsUsed}`)
                              // Update local hint count
                              setHintUsageCount(session.totalHintsUsed)
                              // Notify parent component about hint usage
                              if (onHintUsed) {
                                onHintUsed(question.category, question.importance)
                              }
                            }
                          }
                          
                          onQuestionSelect(question.question)
                          setIsFlipped(false)
                        }}
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-primary-500 to-primary-700 text-base font-bold text-white shadow-lg sm:h-10 sm:w-10">
                              {index + 1}
                            </div>
                            <Badge 
                              variant="secondary" 
                              className={`text-sm border ${getCategoryColor(question.category)}`}
                            >
                              {getCategoryIcon(question.category)} {question.category}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={`text-sm border-2 ${getImportanceColor(question.importance)}`}
                            >
                              {question.importance.toUpperCase()}
                            </Badge>
                            {question.confidence && (
                              <div className="flex items-center space-x-1">
                                <div className="h-2 w-16 rounded-full bg-gray-200 dark:bg-white/10">
                                  <div 
                                    className="h-2 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-1000"
                                    style={{ width: `${question.confidence}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm text-gray-500 dark:text-slate-400">{question.confidence}%</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <span className="text-sm text-gray-400 dark:text-slate-400">Click to use</span>
                            <ArrowRight className="h-4 w-4 text-gray-400 dark:text-slate-400" />
                          </div>
                        </div>
                        
                        <p className="mb-2 text-base font-semibold leading-relaxed text-gray-800 transition-colors group-hover:text-primary-700 dark:text-slate-100 dark:group-hover:text-primary-300 md:text-[17px]">
                          {question.question}
                        </p>
                        
                        {question.tags && question.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {question.tags.map((tag, tagIndex) => (
                              <span 
                                key={tagIndex}
                                className="rounded-full bg-gray-100 px-2.5 py-1 text-sm text-gray-600 dark:bg-white/10 dark:text-slate-300"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {question.rationale && showRationale && (
                          <div className="mt-3 rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-3 dark:border-amber-500/30 dark:!bg-gradient-to-r dark:!from-amber-950/45 dark:!to-yellow-950/35">
                            <div className="flex items-start">
                              <Lightbulb className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-300" />
                              <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-200 md:text-[15px]">{question.rationale}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {filteredQuestions.length === 0 && !isLoadingQuestions && (
                      <div className="py-12 text-center">
                        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-white/10">
                          <MessageCircleQuestion className="h-10 w-10 text-gray-400 dark:text-slate-500" />
                        </div>
                        <h4 className="mb-2 font-semibold text-gray-700 dark:text-slate-200">No suggestions yet</h4>
                        <p className="text-sm text-gray-500 dark:text-slate-400">
                          Start a conversation to get personalized question suggestions
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}