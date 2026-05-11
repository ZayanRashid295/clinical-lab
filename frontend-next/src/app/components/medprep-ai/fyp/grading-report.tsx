"use client"

import { useState } from "react"
import type { SOAPGrading } from "@/lib/fyp/soap-service"
import type { ConversationGrading } from "@/lib/fyp/ai-service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MarkdownContent } from "@/shared/components/MarkdownContent/MarkdownContent"
import { TrendingUp, MessageCircle, FileText, Lightbulb, Award, Target, ThumbsUp, ThumbsDown, Eye } from "lucide-react"

interface GradingReportProps {
  soapGrading: SOAPGrading
  conversationGrading: ConversationGrading
  conversation: any
  medicalCase: any
}

const GradeBadge = ({ grade }: { grade: number }) => {
  const color =
    grade >= 90 ? "bg-green-100 text-green-800 border-green-200" :
    grade >= 80 ? "bg-blue-100 text-blue-800 border-blue-200" :
    grade >= 70 ? "bg-yellow-100 text-yellow-800 border-yellow-200" :
    "bg-red-100 text-red-800 border-red-200"
  return <Badge className={`${color} border font-semibold`}>{grade}/100</Badge>
}

const FeedbackList = ({ title, items, icon: Icon }: { title: string; items: string[]; icon: any }) => {
  if (!items.length) return null
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={index} className="text-sm prose prose-sm max-w-none">
              <MarkdownContent variant="default">{item}</MarkdownContent>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export function GradingReport({ soapGrading, conversationGrading, medicalCase }: GradingReportProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const overallGrade = Math.round((soapGrading.overallGrade + conversationGrading.overallGrade) / 2)

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Comprehensive Clinical Assessment Report
        </h1>
        <div className="flex items-center justify-center gap-3">
          <Badge variant="outline" className="text-lg px-4 py-2">{medicalCase.title}</Badge>
          <Badge variant="outline" className="text-lg px-4 py-2">{medicalCase.patientProfile.name}</Badge>
        </div>
        <div className="flex items-center justify-center gap-2 text-xl font-semibold">
          Overall Grade: <GradeBadge grade={overallGrade} />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview"><TrendingUp className="h-4 w-4 mr-1" />Overview</TabsTrigger>
          <TabsTrigger value="conversation"><MessageCircle className="h-4 w-4 mr-1" />Conversation</TabsTrigger>
          <TabsTrigger value="soap"><FileText className="h-4 w-4 mr-1" />SOAP Note</TabsTrigger>
          <TabsTrigger value="recommendations"><Lightbulb className="h-4 w-4 mr-1" />Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Conversation Performance</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between"><span>Overall</span><GradeBadge grade={conversationGrading.overallGrade} /></div>
                <div className="flex justify-between"><span>Question Quality</span><div className="flex items-center gap-2"><Progress value={conversationGrading.questionQualityGrade} className="w-24 h-2" /><span>{conversationGrading.questionQualityGrade}</span></div></div>
                <div className="flex justify-between"><span>Clinical Reasoning</span><div className="flex items-center gap-2"><Progress value={conversationGrading.clinicalReasoningGrade} className="w-24 h-2" /><span>{conversationGrading.clinicalReasoningGrade}</span></div></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>SOAP Performance</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between"><span>Overall</span><GradeBadge grade={soapGrading.overallGrade} /></div>
                <div className="flex justify-between"><span>Subjective</span><span>{soapGrading.subjectiveGrade}</span></div>
                <div className="flex justify-between"><span>Objective</span><span>{soapGrading.objectiveGrade}</span></div>
                <div className="flex justify-between"><span>Assessment</span><span>{soapGrading.assessmentGrade}</span></div>
                <div className="flex justify-between"><span>Plan</span><span>{soapGrading.planGrade}</span></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conversation" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FeedbackList title="Strengths" items={conversationGrading.strengths} icon={Award} />
          <FeedbackList title="Areas for Improvement" items={conversationGrading.improvements} icon={Target} />
          <FeedbackList title="Excellent Questions" items={conversationGrading.excellentQuestions} icon={ThumbsUp} />
          <FeedbackList title="Questions To Improve" items={conversationGrading.poorQuestions} icon={ThumbsDown} />
          <FeedbackList title="Missed Opportunities" items={conversationGrading.missedOpportunities} icon={Eye} />
        </TabsContent>

        <TabsContent value="soap" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FeedbackList title="SOAP Strengths" items={soapGrading.strengths} icon={Award} />
          <FeedbackList title="SOAP Improvements" items={soapGrading.improvements} icon={Target} />
          <FeedbackList title="Subjective Feedback" items={soapGrading.feedback.subjective} icon={FileText} />
          <FeedbackList title="Objective Feedback" items={soapGrading.feedback.objective} icon={FileText} />
          <FeedbackList title="Assessment Feedback" items={soapGrading.feedback.assessment} icon={FileText} />
          <FeedbackList title="Plan Feedback" items={soapGrading.feedback.plan} icon={FileText} />
        </TabsContent>

        <TabsContent value="recommendations">
          <FeedbackList title="Recommended Next Steps" items={conversationGrading.recommendations} icon={Lightbulb} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
