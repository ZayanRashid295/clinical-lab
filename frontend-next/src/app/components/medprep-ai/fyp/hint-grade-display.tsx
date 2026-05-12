"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  BarChart3
} from "lucide-react"
import type { HintGradeImpact } from "@/lib/fyp/ai-hint-tracking-service"
import { MarkdownContent } from "@/shared/components/MarkdownContent/MarkdownContent"

interface HintGradeDisplayProps {
  gradeImpact: HintGradeImpact
  showDetailed?: boolean
  className?: string
}

export function HintGradeDisplay({ gradeImpact, showDetailed = true, className = "" }: HintGradeDisplayProps) {
  const { baseGrade, hintPenalty, finalGrade, gradeLetter, penaltyBreakdown, recommendations } = gradeImpact

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return "text-green-600"
    if (grade >= 80) return "text-blue-600"
    if (grade >= 70) return "text-yellow-600"
    if (grade >= 60) return "text-orange-600"
    return "text-red-600"
  }

  const getGradeIcon = (grade: number) => {
    if (grade >= 95) return <Crown className="h-6 w-6 text-yellow-500" />
    if (grade >= 90) return <Gem className="h-6 w-6 text-green-500" />
    if (grade >= 80) return <Star className="h-6 w-6 text-blue-500" />
    if (grade >= 70) return <Award className="h-6 w-6 text-yellow-500" />
    if (grade >= 60) return <Target className="h-6 w-6 text-orange-500" />
    return <AlertTriangle className="h-6 w-6 text-red-500" />
  }

  const getGradeMessage = (grade: number) => {
    if (grade >= 95) return "Outstanding Performance!"
    if (grade >= 90) return "Excellent Work!"
    if (grade >= 80) return "Good Job!"
    if (grade >= 70) return "Satisfactory Performance"
    if (grade >= 60) return "Needs Improvement"
    return "Requires Significant Improvement"
  }

  const getHintUsageLevel = (totalHints: number) => {
    if (totalHints === 0) return { level: "Perfect", color: "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-200", icon: <CheckCircle className="h-4 w-4" /> }
    if (totalHints <= 3) return { level: "Minimal", color: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200", icon: <TrendingUp className="h-4 w-4" /> }
    if (totalHints <= 7) return { level: "Moderate", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-200", icon: <Target className="h-4 w-4" /> }
    if (totalHints <= 10) return { level: "High", color: "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-200", icon: <AlertTriangle className="h-4 w-4" /> }
    return { level: "Excessive", color: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200", icon: <XCircle className="h-4 w-4" /> }
  }

  const hintLevel = getHintUsageLevel(penaltyBreakdown.totalHints)

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Grade Display */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 dark:border-white/10 dark:from-blue-950/30 dark:to-purple-950/25">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getGradeIcon(finalGrade)}
              <div>
                <span className="text-2xl font-bold">Final Grade</span>
                <div className="flex items-center space-x-2">
                  <span className={`text-4xl font-bold ${getGradeColor(finalGrade)}`}>
                    {finalGrade}%
                  </span>
                  <Badge 
                    variant="secondary" 
                    className={`text-lg px-3 py-1 ${getGradeColor(finalGrade)} bg-white/80 dark:bg-white/10`}
                  >
                    {gradeLetter}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-slate-400">Base Grade</p>
              <p className="text-xl font-semibold text-gray-800 dark:text-slate-100">{baseGrade}%</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Grade Breakdown</span>
              <span className="text-sm text-gray-600 dark:text-slate-400">
                {baseGrade}% - {hintPenalty}% = {finalGrade}%
              </span>
            </div>
            <Progress 
              value={finalGrade} 
              className="h-3"
              style={{
                background: `linear-gradient(to right, ${getGradeColor(finalGrade).replace('text-', 'bg-')} 0%, ${getGradeColor(finalGrade).replace('text-', 'bg-')} ${finalGrade}%, #e5e7eb ${finalGrade}%, #e5e7eb 100%)`
              }}
            />
            <p className={`text-center font-semibold ${getGradeColor(finalGrade)}`}>
              {getGradeMessage(finalGrade)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Hint Usage Analysis */}
      <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-red-50 dark:border-white/10 dark:from-orange-950/25 dark:to-red-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-orange-600" />
            <span className="text-lg">AI Hint Usage Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Overall Hint Usage */}
            <div className="flex items-center justify-between rounded-lg border border-gray-200/80 bg-white/80 p-3 dark:border-white/10 dark:bg-white/[0.06]">
              <div className="flex items-center space-x-3">
                {hintLevel.icon}
                <div>
                  <p className="font-semibold text-gray-800 dark:text-slate-100">Total Hints Used</p>
                  <p className="text-sm text-gray-600 dark:text-slate-400">{penaltyBreakdown.totalHints} hints</p>
                </div>
              </div>
              <Badge className={hintLevel.color}>
                {hintLevel.level} Usage
              </Badge>
            </div>

            {/* Penalty Breakdown */}
            {showDetailed && (
              <div className="space-y-2">
                <h4 className="flex items-center space-x-2 font-semibold text-gray-800 dark:text-slate-100">
                  <BarChart3 className="h-4 w-4" />
                  <span>Penalty Breakdown</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between p-2 bg-red-50 rounded border border-red-200">
                    <span className="text-red-700">High Importance:</span>
                    <span className="font-semibold text-red-800">-{penaltyBreakdown.highImportancePenalty} pts</span>
                  </div>
                  <div className="flex justify-between p-2 bg-yellow-50 rounded border border-yellow-200">
                    <span className="text-yellow-700">Medium Importance:</span>
                    <span className="font-semibold text-yellow-800">-{penaltyBreakdown.mediumImportancePenalty} pts</span>
                  </div>
                  <div className="flex justify-between p-2 bg-blue-50 rounded border border-blue-200">
                    <span className="text-blue-700">Low Importance:</span>
                    <span className="font-semibold text-blue-800">-{penaltyBreakdown.lowImportancePenalty} pts</span>
                  </div>
                  <div className="flex justify-between p-2 bg-purple-50 rounded border border-purple-200">
                    <span className="text-purple-700">Excessive Usage:</span>
                    <span className="font-semibold text-purple-800">-{penaltyBreakdown.excessiveUsagePenalty} pts</span>
                  </div>
                </div>
              </div>
            )}

            {/* Total Penalty */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-red-100 to-pink-100 rounded-lg border border-red-200">
              <div className="flex items-center space-x-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                <span className="font-semibold text-red-800">Total Penalty</span>
              </div>
              <span className="text-xl font-bold text-red-800">-{hintPenalty} points</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:border-white/10 dark:from-green-950/25 dark:to-emerald-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-green-600" />
              <span className="text-lg">Recommendations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-2 rounded border border-green-200 bg-white/80 p-2 dark:border-emerald-500/25 dark:bg-white/[0.06]">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="prose prose-sm max-w-none text-sm text-gray-700 dark:text-slate-300">
                    <MarkdownContent variant="default">{recommendation}</MarkdownContent>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Insights */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 dark:border-white/10 dark:from-purple-950/25 dark:to-indigo-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5 text-purple-600" />
            <span className="text-lg">Performance Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {penaltyBreakdown.totalHints === 0 ? (
              <div className="flex items-center space-x-2 p-3 bg-green-100 rounded-lg border border-green-200">
                <Crown className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-semibold text-green-800">Perfect Independence!</p>
                  <p className="text-sm text-green-700">You completed the case without any AI assistance.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 p-2 bg-blue-100 rounded border border-blue-200">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  <div className="text-sm text-blue-800 prose prose-sm max-w-none">
                    <MarkdownContent variant="default">{`You used ${penaltyBreakdown.totalHints} AI hints during this session.`}</MarkdownContent>
                  </div>
                </div>
                {penaltyBreakdown.highImportancePenalty > 0 && (
                  <div className="flex items-center space-x-2 p-2 bg-red-100 rounded border border-red-200">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <div className="text-sm text-red-800 prose prose-sm max-w-none">
                      <MarkdownContent variant="default">
                        Consider reviewing fundamental concepts to reduce reliance on critical hints.
                      </MarkdownContent>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

