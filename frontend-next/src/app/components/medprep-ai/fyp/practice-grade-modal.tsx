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
import ReactMarkdown from "react-markdown"

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
    if (gradeValue >= 90) return "text-green-600"
    if (gradeValue >= 80) return "text-blue-600"
    if (gradeValue >= 70) return "text-yellow-600"
    if (gradeValue >= 60) return "text-orange-600"
    return "text-red-600"
  }

  const getGradeIcon = (gradeValue: number) => {
    if (gradeValue >= 95) return <Crown className="h-8 w-8 text-yellow-500" />
    if (gradeValue >= 90) return <Gem className="h-8 w-8 text-green-500" />
    if (gradeValue >= 80) return <Star className="h-8 w-8 text-blue-500" />
    if (gradeValue >= 70) return <Award className="h-8 w-8 text-yellow-500" />
    if (gradeValue >= 60) return <Target className="h-8 w-8 text-orange-500" />
    return <AlertTriangle className="h-8 w-8 text-red-500" />
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {getGradeIcon(grade.finalGrade)}
              <div>
                <h2 className="text-2xl font-bold">Practice Session Complete!</h2>
                <p className="text-blue-100">Here's your detailed performance analysis</p>
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
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Grade Summary */}
          <Card className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className={`text-5xl font-bold ${getGradeColor(grade.finalGrade)}`}>
                      {grade.finalGrade}%
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={`text-xl px-4 py-2 mt-2 ${getGradeColor(grade.finalGrade)} bg-white/80`}
                    >
                      {grade.gradeLetter}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      {getGradeMessage(grade.finalGrade)}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600">
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
                  <p className="text-sm text-gray-600">Overall Performance</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
            {[
              { id: "overview", label: "Overview", icon: BarChart3 },
              { id: "breakdown", label: "Breakdown", icon: Target },
              { id: "feedback", label: "Feedback", icon: MessageCircle },
              { id: "hints", label: "Hint Analysis", icon: Lightbulb }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
                  activeTab === tab.id
                    ? "bg-white shadow-sm text-blue-600"
                    : "text-gray-600 hover:text-gray-800"
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
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="h-5 w-5 text-blue-600" />
                    <span>Performance Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(grade.breakdown).map(([key, value]) => (
                      <div key={key} className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className={`text-2xl font-bold ${getGradeColor(value)}`}>
                          {value}%
                        </div>
                        <div className="text-sm text-gray-600 capitalize">
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
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-green-600" />
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
                  <CardTitle className="flex items-center space-x-2">
                    <MessageCircle className="h-5 w-5 text-purple-600" />
                    <span>Detailed Feedback</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Strengths */}
                    <div>
                      <h4 className="font-semibold text-green-800 mb-3 flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4" />
                        <span>Strengths</span>
                      </h4>
                      <div className="space-y-2">
                        {grade.feedback.strengths.map((strength, index) => (
                          <div key={index} className="flex items-start space-x-2 p-2 bg-green-50 rounded border border-green-200">
                            <Star className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-green-800 prose prose-sm max-w-none">
                              <ReactMarkdown
                                components={{
                                  p: ({ children }) => <p className="mb-0">{children}</p>,
                                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                  em: ({ children }) => <em className="italic">{children}</em>,
                                  code: ({ children }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                                }}
                              >
                                {strength}
                              </ReactMarkdown>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Improvements */}
                    <div>
                      <h4 className="font-semibold text-orange-800 mb-3 flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4" />
                        <span>Areas for Improvement</span>
                      </h4>
                      <div className="space-y-2">
                        {grade.feedback.improvements.map((improvement, index) => (
                          <div key={index} className="flex items-start space-x-2 p-2 bg-orange-50 rounded border border-orange-200">
                            <Target className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-orange-800 prose prose-sm max-w-none">
                              <ReactMarkdown
                                components={{
                                  p: ({ children }) => <p className="mb-0">{children}</p>,
                                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                  em: ({ children }) => <em className="italic">{children}</em>,
                                  code: ({ children }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                                }}
                              >
                                {improvement}
                              </ReactMarkdown>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div>
                      <h4 className="font-semibold text-blue-800 mb-3 flex items-center space-x-2">
                        <Brain className="h-4 w-4" />
                        <span>Recommendations</span>
                      </h4>
                      <div className="space-y-2">
                        {grade.feedback.recommendations.map((recommendation, index) => (
                          <div key={index} className="flex items-start space-x-2 p-2 bg-blue-50 rounded border border-blue-200">
                            <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-blue-800 prose prose-sm max-w-none">
                              <ReactMarkdown
                                components={{
                                  p: ({ children }) => <p className="mb-0">{children}</p>,
                                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                  em: ({ children }) => <em className="italic">{children}</em>,
                                  code: ({ children }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                                }}
                              >
                                {recommendation}
                              </ReactMarkdown>
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
        <div className="border-t p-6 bg-gray-50">
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
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
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


