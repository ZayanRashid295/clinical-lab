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
        return "bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
      case "medium":
        return "bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-yellow-100"
      case "low":
        return "bg-green-50 text-green-700 border-green-300 hover:bg-green-100"
      default:
        return "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
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
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "assessment":
        return "bg-purple-50 text-purple-700 border-purple-200"
      case "examination":
        return "bg-green-50 text-green-700 border-green-200"
      case "symptoms":
        return "bg-orange-50 text-orange-700 border-orange-200"
      case "impact":
        return "bg-pink-50 text-pink-700 border-pink-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
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
          <Card className="h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 border-2 border-dashed border-emerald-300 hover:border-emerald-400 transition-all duration-300 hover:shadow-xl relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-emerald-200 rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-teal-200 rounded-full opacity-20 animate-pulse" style={{ animationDelay: "1s" }}></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-cyan-200 rounded-full opacity-20 animate-pulse" style={{ animationDelay: "2s" }}></div>
            </div>
            
            <CardContent className="text-center p-6 relative z-10">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-emerald-200 rounded-full opacity-20 animate-pulse"></div>
                <div className="relative bg-gradient-to-r from-emerald-500 to-teal-600 p-4 rounded-full shadow-lg">
                  <HelpCircle className="h-12 w-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2">
                  <Sparkles className="h-6 w-6 text-yellow-500 animate-spin" style={{ animationDuration: "3s" }} />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-emerald-900 mb-3">Get AI Question Hints</h3>
              <p className="text-emerald-700 text-sm leading-relaxed mb-4 max-w-sm mx-auto">
                Click to reveal intelligent question suggestions tailored to this specific case and conversation
              </p>
              
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="inline-flex items-center bg-emerald-100 px-3 py-1 rounded-full">
                  <Brain className="h-4 w-4 text-emerald-600 mr-1" />
                  <span className="text-emerald-700 text-xs font-semibold">AI-Powered</span>
                </div>
                <div className="inline-flex items-center bg-teal-100 px-3 py-1 rounded-full">
                  <Zap className="h-4 w-4 text-teal-600 mr-1" />
                  <span className="text-teal-700 text-xs font-semibold">Smart Suggestions</span>
                </div>
              </div>
              
              <div className="flex items-center justify-center text-emerald-600 text-sm">
                <ArrowRight className="h-4 w-4 mr-1 animate-bounce" />
                <span className="font-medium">Click to explore</span>
                <ArrowRight className="h-4 w-4 ml-1 animate-bounce" style={{ animationDelay: "0.5s" }} />
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
          <Card className="h-full bg-white/95 backdrop-blur-sm shadow-2xl border border-gray-200/50">
            <CardHeader className="pb-2 pt-3 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex items-center justify-between">
                
                {/* Hint Usage Counter */}
                {sessionId && (
                  <div className="flex items-center space-x-1">
                    <div className="flex items-center bg-gradient-to-r from-orange-100 to-red-100 px-2 py-1 rounded-full border border-orange-200">
                      <Lightbulb className="h-3 w-3 text-orange-600 mr-1" />
                      <span className="text-orange-700 text-xs font-semibold">
                        Hints: <AnimatedCounter value={hintUsageCount} />
                      </span>
                    </div>
                    {hintUsageCount > 0 && (
                      <div className="flex items-center bg-gradient-to-r from-red-100 to-pink-100 px-2 py-1 rounded-full border border-red-200">
                        <AlertTriangle className="h-3 w-3 text-red-600 mr-1" />
                        <span className="text-red-700 text-xs font-medium">
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
                    className="p-1 hover:bg-white/50"
                    title={showRationale ? "Hide explanations" : "Show explanations"}
                  >
                    {showRationale ? (
                      <EyeOff className="h-3 w-3 text-gray-600" />
                    ) : (
                      <Eye className="h-3 w-3 text-gray-600" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsFlipped(false)
                    }}
                    className="p-1 hover:bg-white/50"
                    title="Back to overview"
                  >
                    <ChevronRight className="h-3 w-3 text-gray-600 rotate-180" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-0">
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
                      className={`text-xs ${
                        selectedCategory === category 
                          ? "bg-indigo-600 text-white" 
                          : "bg-white/50 text-gray-600 hover:bg-indigo-50"
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
                      <div key={index} className="animate-pulse bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                          <div className="h-6 bg-gray-200 rounded-full w-12"></div>
                          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle className="h-10 w-10 text-red-500" />
                    </div>
                    <h4 className="font-semibold text-gray-700 mb-2">Unable to Load Suggestions</h4>
                    <p className="text-sm text-gray-500 mb-3">{error}</p>
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
                        className="group bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-indigo-200 transition-all duration-300 cursor-pointer transform hover:-translate-y-1 hover:scale-[1.02]"
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
                            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                              {index + 1}
                            </div>
                            <Badge 
                              variant="secondary" 
                              className={`text-xs border ${getCategoryColor(question.category)}`}
                            >
                              {getCategoryIcon(question.category)} {question.category}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={`text-xs border-2 ${getImportanceColor(question.importance)}`}
                            >
                              {question.importance.toUpperCase()}
                            </Badge>
                            {question.confidence && (
                              <div className="flex items-center space-x-1">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full transition-all duration-1000"
                                    style={{ width: `${question.confidence}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-500">{question.confidence}%</span>
                              </div>
                            )}
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                            <span className="text-xs text-gray-400">Click to use</span>
                            <ArrowRight className="h-3 w-3 text-gray-400" />
                          </div>
                        </div>
                        
                        <p className="text-sm font-semibold text-gray-800 mb-2 leading-relaxed group-hover:text-indigo-700 transition-colors">
                          {question.question}
                        </p>
                        
                        {question.tags && question.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {question.tags.map((tag, tagIndex) => (
                              <span 
                                key={tagIndex}
                                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {question.rationale && showRationale && (
                          <div className="mt-3 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg">
                            <div className="flex items-start">
                              <Lightbulb className="h-4 w-4 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-amber-800 leading-relaxed">{question.rationale}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {filteredQuestions.length === 0 && !isLoadingQuestions && (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <MessageCircleQuestion className="h-10 w-10 text-gray-400" />
                        </div>
                        <h4 className="font-semibold text-gray-700 mb-2">No suggestions yet</h4>
                        <p className="text-sm text-gray-500">
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