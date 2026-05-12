"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Award, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Lightbulb, 
  Target,
  CheckCircle,
  XCircle,
  Star,
  Crown,
  Gem,
  Flame,
  Zap,
  Brain,
  BookOpen,
  MessageCircle,
  BarChart3,
  Eye,
  EyeOff,
  Download,
  Share2,
  RefreshCw
} from "lucide-react"
import type { PracticeSessionGrade } from "@/lib/fyp/practice-grading-service"
import { HintGradeDisplay } from "./hint-grade-display"
import { MarkdownContent } from "@/shared/components/MarkdownContent/MarkdownContent"
import { cn } from "@/shared/utils/cn"
import { APP_GLASS_CARD } from "@/app/config/app-shell"

interface PracticeGradeModalProps {
  grade: PracticeSessionGrade
  isOpen: boolean
  onClose: () => void
  onRetry?: () => void
}

export function PracticeGradeModal({ grade, isOpen, onClose, onRetry }: PracticeGradeModalProps) {
  const [showDetailed, setShowDetailed] = useState(false)
  const [activeTab, setActiveTab] = useState<"overview" | "breakdown" | "feedback" | "hints">("overview")

  if (!isOpen) return null

  const getGradeColor = (gradeValue: number) => {
    if (gradeValue >= 90) return "text-primary-600 dark:text-primary-400"
    if (gradeValue >= 80) return "text-primary-700 dark:text-primary-300"
    if (gradeValue >= 70) return "text-yellow-600 dark:text-yellow-400"
    if (gradeValue >= 60) return "text-orange-600 dark:text-orange-400"
    return "text-red-600 dark:text-red-400"
  }

  const getGradeIcon = (gradeValue: number) => {
    if (gradeValue >= 95) return <Crown className="h-8 w-8 text-yellow-500 dark:text-yellow-400" />
    if (gradeValue >= 90) return <Gem className="h-8 w-8 text-primary" />
    if (gradeValue >= 80) return <Star className="h-8 w-8 text-primary" />
    if (gradeValue >= 70) return <Award className="h-8 w-8 text-yellow-500 dark:text-yellow-400" />
    if (gradeValue >= 60) return <Target className="h-8 w-8 text-orange-500 dark:text-orange-400" />
    return <AlertTriangle className="h-8 w-8 text-red-500 dark:text-red-400" />
  }

  const getGradeMessage = (gradeValue: number) => {
    if (gradeValue >= 95) return "Outstanding Performance! 🏆"
    if (gradeValue >= 90) return "Excellent Work! ⭐"
    if (gradeValue >= 80) return "Good Job! 👍"
    if (gradeValue >= 70) return "Satisfactory Performance ✅"
    if (gradeValue >= 60) return "Needs Improvement 📈"
    return "Requires Significant Improvement 🔄"
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 dark:bg-black/60">
      <div
        className={cn(
          APP_GLASS_CARD,
          "max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl shadow-2xl"
        )}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {getGradeIcon(grade.finalGrade)}
              <div>
                <h2 className="text-2xl font-bold">Practice Session Complete!</h2>
                <p className="text-primary-100">Here's your detailed performance analysis</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <XCircle className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-h-[calc(90vh-120px)] overflow-y-auto p-6 dark:text-slate-100">
          {/* Grade Summary */}
          <Card className="mb-6 border border-primary-200 bg-gradient-to-r from-primary-50 to-primary-100/80 dark:border-primary-500/25 dark:from-primary-950/30 dark:to-primary-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className={`text-5xl font-bold ${getGradeColor(grade.finalGrade)}`}>
                      {grade.finalGrade}%
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={`mt-2 bg-white/80 px-4 py-2 text-xl ${getGradeColor(grade.finalGrade)} dark:bg-white/10`}
                    >
                      {grade.gradeLetter}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="mb-2 text-xl font-semibold text-gray-800 dark:text-slate-100">
                      {getGradeMessage(grade.finalGrade)}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-slate-400">
                      <div className="flex items-center space-x-2">
                        <span>Base Grade:</span>
                        <span className="font-semibold">{grade.baseGrade}%</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span>Hint Penalty:</span>
                        <span className="font-semibold text-red-600">-{grade.hintPenalty} points</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Progress 
                    value={grade.finalGrade} 
                    className="w-32 h-3 mb-2"
                  />
                  <p className="text-sm text-gray-600 dark:text-slate-400">Overall Performance</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <div className="mb-6 flex space-x-1 rounded-lg bg-gray-100 p-1 dark:bg-white/10">
            {[
              { id: "overview", label: "Overview", icon: BarChart3 },
              { id: "breakdown", label: "Breakdown", icon: Target },
              { id: "feedback", label: "Feedback", icon: MessageCircle },
              { id: "hints", label: "Hint Analysis", icon: Lightbulb }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 rounded-md px-4 py-2 transition-all ${
                  activeTab === tab.id
                    ? "bg-white text-primary shadow-sm dark:bg-white/15 dark:text-primary-300"
                    : "text-gray-600 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-foreground">
                    <Award className="h-5 w-5 text-primary" />
                    <span>Performance Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(grade.breakdown).map(([key, value]) => (
                      <div key={key} className="rounded-lg bg-gray-50 p-3 text-center dark:bg-white/[0.06]">
                        <div className={`text-2xl font-bold ${getGradeColor(value)}`}>
                          {value}%
                        </div>
                        <div className="text-sm capitalize text-gray-600 dark:text-slate-400">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "breakdown" && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-foreground">
                    <Target className="h-5 w-5 text-primary" />
                    <span>Detailed Breakdown</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(grade.breakdown).map(([key, value]) => (
                      <div key={key} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className={`font-bold ${getGradeColor(value)}`}>
                            {value}%
                          </span>
                        </div>
                        <Progress value={value} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "feedback" && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-foreground">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    <span>Detailed Feedback</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Strengths */}
                    <div>
                      <h4 className="mb-3 flex items-center space-x-2 font-semibold text-primary-900 dark:text-primary-100">
                        <CheckCircle className="h-4 w-4" />
                        <span>Strengths</span>
                      </h4>
                      <div className="space-y-2">
                        {grade.feedback.strengths.map((strength, index) => (
                          <div key={index} className="flex items-start space-x-2 rounded border border-primary-200 bg-primary-50/80 p-2 dark:border-primary-500/25 dark:bg-primary-950/25">
                            <Star className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                            <div className="prose prose-sm max-w-none text-sm text-primary-900 dark:text-primary-100">
                              <MarkdownContent variant="default">{strength}</MarkdownContent>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Improvements */}
                    <div>
                      <h4 className="mb-3 flex items-center space-x-2 font-semibold text-orange-800 dark:text-orange-200">
                        <TrendingUp className="h-4 w-4" />
                        <span>Areas for Improvement</span>
                      </h4>
                      <div className="space-y-2">
                        {grade.feedback.improvements.map((improvement, index) => (
                          <div key={index} className="flex items-start space-x-2 rounded border border-orange-200 bg-orange-50 p-2 dark:border-orange-500/25 dark:bg-orange-950/25">
                            <Target className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-600 dark:text-orange-400" />
                            <div className="prose prose-sm max-w-none text-sm text-orange-800 dark:text-orange-200">
                              <MarkdownContent variant="default">{improvement}</MarkdownContent>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div>
                      <h4 className="mb-3 flex items-center space-x-2 font-semibold text-primary-900 dark:text-primary-100">
                        <Brain className="h-4 w-4" />
                        <span>Recommendations</span>
                      </h4>
                      <div className="space-y-2">
                        {grade.feedback.recommendations.map((recommendation, index) => (
                          <div key={index} className="flex items-start space-x-2 rounded border border-primary-200 bg-primary-50/80 p-2 dark:border-primary-500/25 dark:bg-primary-950/25">
                            <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                            <div className="prose prose-sm max-w-none text-sm text-primary-900 dark:text-primary-100">
                              <MarkdownContent variant="default">{recommendation}</MarkdownContent>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "hints" && (
            <HintGradeDisplay gradeImpact={grade.hintImpact} showDetailed={true} />
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 p-6 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setShowDetailed(!showDetailed)}
                className="flex items-center space-x-2"
              >
                {showDetailed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span>{showDetailed ? "Hide Details" : "Show Details"}</span>
              </Button>
            </div>
            <div className="flex items-center space-x-3">
              {onRetry && (
                <Button
                  variant="outline"
                  onClick={onRetry}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Try Again</span>
                </Button>
              )}
              <Button
                onClick={onClose}
                className="bg-gradient-to-r from-primary-600 to-primary-800 text-primary-foreground hover:from-primary-700 hover:to-primary-900"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


