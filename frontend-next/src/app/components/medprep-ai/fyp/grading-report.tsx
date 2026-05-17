"use client"

import { useState } from "react"
import type { SOAPGrading } from "@/lib/fyp/soap-service"
import type { ConversationGrading } from "@/lib/fyp/ai-service"
import type { ComprehensiveTabReports } from "@/lib/fyp/comprehensive-tab-report-service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MarkdownContent } from "@/shared/components/MarkdownContent/MarkdownContent"
import {
  TrendingUp,
  MessageCircle,
  FileText,
  Lightbulb,
  Award,
  Target,
  ThumbsUp,
  ThumbsDown,
  Eye,
} from "lucide-react"

interface GradingReportProps {
  soapGrading: SOAPGrading
  conversationGrading: ConversationGrading
  conversation: unknown
  medicalCase: { title: string; patientProfile?: { name?: string } }
  tabReports?: ComprehensiveTabReports | null
}

const GradeBadge = ({ grade }: { grade: number }) => {
  const color =
    grade >= 90
      ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/50 dark:text-green-100 dark:border-green-800/50"
      : grade >= 80
        ? "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-100 dark:border-blue-800/50"
        : grade >= 70
          ? "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-100 dark:border-yellow-800/50"
          : "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-100 dark:border-red-800/50"
  return (
    <Badge className={`${color} border font-semibold`}>{grade}/100</Badge>
  )
}

function NarrativeCard({
  title,
  narrative,
  icon: Icon,
}: {
  title: string
  narrative: string
  icon: typeof MessageCircle
}) {
  if (!narrative?.trim()) return null
  return (
    <Card className="border-border/80 dark:border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <MarkdownContent variant="default">{narrative}</MarkdownContent>
        </div>
      </CardContent>
    </Card>
  )
}

function FeedbackList({
  title,
  items,
  icon: Icon,
}: {
  title: string
  items: string[]
  icon: typeof Award
}) {
  if (!items.length) return null
  return (
    <Card className="border-border/80 dark:border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={index} className="text-sm prose prose-sm max-w-none dark:prose-invert">
              <MarkdownContent variant="default">{item}</MarkdownContent>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export function GradingReport({
  soapGrading,
  conversationGrading,
  medicalCase,
  tabReports,
}: GradingReportProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const overallGrade = Math.round(
    (soapGrading.overallGrade + conversationGrading.overallGrade) / 2,
  )

  const conversation = tabReports?.conversation
  const soap = tabReports?.soap
  const recommendations = tabReports?.recommendations

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="space-y-3 text-center">
        <h1 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-3xl font-bold text-transparent dark:from-blue-400 dark:to-purple-400">
          Comprehensive Clinical Assessment Report
        </h1>
        <div className="flex items-center justify-center gap-3">
          <Badge variant="outline" className="px-4 py-2 text-lg">
            {medicalCase.title}
          </Badge>
          {medicalCase.patientProfile?.name && (
            <Badge variant="outline" className="px-4 py-2 text-lg">
              {medicalCase.patientProfile.name}
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-center gap-2 text-xl font-semibold">
          Overall Grade: <GradeBadge grade={overallGrade} />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <TrendingUp className="mr-1 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="conversation">
            <MessageCircle className="mr-1 h-4 w-4" />
            Conversation
          </TabsTrigger>
          <TabsTrigger value="soap">
            <FileText className="mr-1 h-4 w-4" />
            SOAP Note
          </TabsTrigger>
          <TabsTrigger value="recommendations">
            <Lightbulb className="mr-1 h-4 w-4" />
            Recommendations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Conversation Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Overall</span>
                  <GradeBadge grade={conversationGrading.overallGrade} />
                </div>
                <div className="flex justify-between">
                  <span>Question Quality</span>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={conversationGrading.questionQualityGrade}
                      className="h-2 w-24"
                    />
                    <span>{conversationGrading.questionQualityGrade}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>Clinical Reasoning</span>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={conversationGrading.clinicalReasoningGrade}
                      className="h-2 w-24"
                    />
                    <span>{conversationGrading.clinicalReasoningGrade}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>SOAP Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Overall</span>
                  <GradeBadge grade={soapGrading.overallGrade} />
                </div>
                <div className="flex justify-between">
                  <span>Subjective</span>
                  <span>{soapGrading.subjectiveGrade}</span>
                </div>
                <div className="flex justify-between">
                  <span>Objective</span>
                  <span>{soapGrading.objectiveGrade}</span>
                </div>
                <div className="flex justify-between">
                  <span>Assessment</span>
                  <span>{soapGrading.assessmentGrade}</span>
                </div>
                <div className="flex justify-between">
                  <span>Plan</span>
                  <span>{soapGrading.planGrade}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conversation" className="space-y-6">
          <NarrativeCard
            title="Interview analysis"
            narrative={
              conversation?.narrative ||
              conversationGrading.clinicalInsights ||
              ""
            }
            icon={MessageCircle}
          />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <FeedbackList
              title="Strengths"
              items={conversation?.strengths ?? conversationGrading.strengths}
              icon={Award}
            />
            <FeedbackList
              title="Areas for Improvement"
              items={conversation?.improvements ?? conversationGrading.improvements}
              icon={Target}
            />
            <FeedbackList
              title="Excellent Questions"
              items={
                conversation?.excellentQuestions ??
                conversationGrading.excellentQuestions
              }
              icon={ThumbsUp}
            />
            <FeedbackList
              title="Questions To Improve"
              items={
                conversation?.questionsToImprove ?? conversationGrading.poorQuestions
              }
              icon={ThumbsDown}
            />
            <FeedbackList
              title="Missed Opportunities"
              items={
                conversation?.missedOpportunities ??
                conversationGrading.missedOpportunities
              }
              icon={Eye}
            />
          </div>
        </TabsContent>

        <TabsContent value="soap" className="space-y-6">
          <NarrativeCard
            title="SOAP documentation review"
            narrative={soap?.narrative ?? ""}
            icon={FileText}
          />
          {soap?.sectionNotes && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {(
                [
                  ["Subjective", soap.sectionNotes.subjective],
                  ["Objective", soap.sectionNotes.objective],
                  ["Assessment", soap.sectionNotes.assessment],
                  ["Plan", soap.sectionNotes.plan],
                ] as const
              ).map(([label, note]) =>
                note?.trim() ? (
                  <Card key={label} className="border-border/80 dark:border-white/10">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{label}</CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                      <MarkdownContent variant="default">{note}</MarkdownContent>
                    </CardContent>
                  </Card>
                ) : null,
              )}
            </div>
          )}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <FeedbackList
              title="SOAP Strengths"
              items={soap?.strengths ?? soapGrading.strengths}
              icon={Award}
            />
            <FeedbackList
              title="SOAP Improvements"
              items={soap?.improvements ?? soapGrading.improvements}
              icon={Target}
            />
          </div>
          {!soap?.narrative && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <FeedbackList
                title="Subjective Feedback"
                items={soapGrading.feedback.subjective}
                icon={FileText}
              />
              <FeedbackList
                title="Objective Feedback"
                items={soapGrading.feedback.objective}
                icon={FileText}
              />
              <FeedbackList
                title="Assessment Feedback"
                items={soapGrading.feedback.assessment}
                icon={FileText}
              />
              <FeedbackList
                title="Plan Feedback"
                items={soapGrading.feedback.plan}
                icon={FileText}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <NarrativeCard
            title="Personalized recommendations"
            narrative={
              recommendations?.narrative ??
              conversationGrading.recommendations.join("\n\n")
            }
            icon={Lightbulb}
          />
          <FeedbackList
            title="Action items"
            items={
              recommendations?.actionItems?.length
                ? recommendations.actionItems
                : conversationGrading.recommendations
            }
            icon={Target}
          />
          <FeedbackList
            title="Study focus"
            items={recommendations?.studyFocus ?? []}
            icon={Award}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
