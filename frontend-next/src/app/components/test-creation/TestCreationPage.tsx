"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Badge } from "@/shared/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  Plus,
  Search,
  Filter,
  Clock,
  BookOpen,
  Target,
  Settings,
  Eye,
  Edit,
  Trash2,
  Save,
  Play,
  Brain,
  Heart,
  Stethoscope,
} from "lucide-react";
import {
  TestCreationConfig,
  Question,
  QuestionFilter,
  MEDICAL_SUBJECTS,
  DIFFICULTY_LEVELS,
  TEST_TYPES,
} from "@/lib/test-models";
import QuestionBank from "./QuestionBank";
import TestPreview from "./TestPreview";
import QuestionEditor from "./QuestionEditor";
import { StudyPlanCard } from "../Dashboard/StudyPlanCard";
import { ProgressCard } from "../Dashboard/ProgressCard";
import { StatCard } from "../Dashboard/StatCard";

export default function TestCreationPage() {
  const [activeTab, setActiveTab] = useState("config");
  const [testConfig, setTestConfig] = useState<TestCreationConfig>({
    title: "",
    description: "",
    type: "practice",
    difficulty: "intermediate",
    timeLimit: undefined,
    subjectFilters: [],
    topicFilters: [],
    difficultyFilters: [],
    questionCount: 0,
  });

  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [questionFilter, setQuestionFilter] = useState<QuestionFilter>({
    subjects: [],
    topics: [],
    difficulties: [],
    questionTypes: [],
    sortBy: "created",
    sortOrder: "desc",
  });

  const handleConfigChange = (field: keyof TestCreationConfig, value: any) => {
    setTestConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleQuestionSelect = (question: Question) => {
    setSelectedQuestions((prev) => {
      const exists = prev.find((q) => q.id === question.id);
      if (exists) {
        return prev.filter((q) => q.id !== question.id);
      } else {
        return [...prev, question];
      }
    });
  };

  const handleQuestionRemove = (questionId: string) => {
    setSelectedQuestions((prev) => prev.filter((q) => q.id !== questionId));
  };

  const handleSaveTest = () => {
    // TODO: Implement test saving logic
    console.log("Saving test:", { testConfig, selectedQuestions });
  };

  const handleStartTest = () => {
    // TODO: Navigate to test session
    console.log("Starting test session");
  };

  return (
    <div
      className="space-y-3 px-[50px] pb-[50px] pt-[25px]"
      data-testid="page-dashboard"
    >
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome to your USMLE preparation
        </p>
      </div>

      {/* Learning Modules Cards from Med App */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-500/10 dark:bg-red-500/20 rounded-lg">
                <Heart className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <CardTitle className="text-lg text-gray-900 dark:text-white">
                  Cardiology
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Heart conditions and treatments
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Progress
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  75%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: "75%" }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>12/16 lessons</span>
                <span>4.8★</span>
              </div>
              <Button className="w-full" size="sm">
                <Play className="h-4 w-4 mr-2" />
                Continue Learning
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg">
                <Brain className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-lg text-gray-900 dark:text-white">
                  Neurology
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Brain and nervous system
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Progress
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  45%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: "45%" }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>7/15 lessons</span>
                <span>4.6★</span>
              </div>
              <Button className="w-full" size="sm" variant="outline">
                <Play className="h-4 w-4 mr-2" />
                Start Learning
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500/10 dark:bg-green-500/20 rounded-lg">
                <Stethoscope className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-lg text-gray-900 dark:text-white">
                  Emergency Medicine
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Critical care and trauma
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Progress
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  90%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: "90%" }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>18/20 lessons</span>
                <span>4.9★</span>
              </div>
              <Button className="w-full" size="sm" variant="outline">
                <Play className="h-4 w-4 mr-2" />
                Review
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard
          title="Question Score"
          value={`${questionScore}% (${questionScoreFraction})`}
          subtitle="Correct"
          icon={CheckCircle2}
          color="success"
        />
        <StatCard
          title="QBank Usage"
          value={`${qbankUsagePercent}%`}
          subtitle={`${qbankUsageFraction} Used`}
          icon={BookOpen}
          progress={qbankUsagePercent}
          color="primary"
        />
        <StatCard
          title="Test Count"
          value={`${testCompletionPercent}%`}
          subtitle={`${testCompletionFraction} Completed`}
          icon={ClipboardCheck}
          progress={testCompletionPercent}
          color="primary"
        />
      </div> */}
    </div>
  );
}
