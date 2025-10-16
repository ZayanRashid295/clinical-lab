"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Create Test</h1>
            <p className="text-muted-foreground mt-2">
              Build custom medical assessments with our UWorld-style test
              creator
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {selectedQuestions.length} Questions Selected
            </Badge>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button onClick={handleSaveTest} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save Test
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="questions" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Question Bank
            </TabsTrigger>
            <TabsTrigger value="editor" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Create Question
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          {/* Test Configuration Tab */}
          <TabsContent value="config" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Basic Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Basic Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Test Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter test title..."
                      value={testConfig.title}
                      onChange={(e) =>
                        handleConfigChange("title", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Enter test description..."
                      value={testConfig.description}
                      onChange={(e) =>
                        handleConfigChange("description", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Test Type</Label>
                    <Select
                      value={testConfig.type}
                      onValueChange={(value) =>
                        handleConfigChange("type", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TEST_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty Level</Label>
                    <Select
                      value={testConfig.difficulty}
                      onValueChange={(value) =>
                        handleConfigChange("difficulty", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DIFFICULTY_LEVELS.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                    <Input
                      id="timeLimit"
                      type="number"
                      placeholder="Leave empty for untimed"
                      value={testConfig.timeLimit || ""}
                      onChange={(e) =>
                        handleConfigChange(
                          "timeLimit",
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Subject Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Subject Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Medical Subjects</Label>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {MEDICAL_SUBJECTS.map((subject) => (
                        <div
                          key={subject}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={subject}
                            checked={testConfig.subjectFilters.includes(
                              subject
                            )}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                handleConfigChange("subjectFilters", [
                                  ...testConfig.subjectFilters,
                                  subject,
                                ]);
                              } else {
                                handleConfigChange(
                                  "subjectFilters",
                                  testConfig.subjectFilters.filter(
                                    (s) => s !== subject
                                  )
                                );
                              }
                            }}
                          />
                          <Label
                            htmlFor={subject}
                            className="text-sm font-normal capitalize"
                          >
                            {subject.replace("_", " ")}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Selected Questions Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Test Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Total Questions:
                      </span>
                      <Badge variant="outline">
                        {selectedQuestions.length}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Estimated Time:
                      </span>
                      <Badge variant="outline">
                        {testConfig.timeLimit
                          ? `${testConfig.timeLimit} min`
                          : "Untimed"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Difficulty:
                      </span>
                      <Badge variant="outline" className="capitalize">
                        {testConfig.difficulty}
                      </Badge>
                    </div>
                  </div>

                  {selectedQuestions.length > 0 && (
                    <div className="space-y-2">
                      <Label>Selected Questions</Label>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {selectedQuestions.map((question, index) => (
                          <div
                            key={question.id}
                            className="flex items-center justify-between p-2 bg-muted rounded"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                Q{index + 1}:{" "}
                                {question.content.substring(0, 50)}...
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {question.subject}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {question.difficulty}
                                </Badge>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleQuestionRemove(question.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedQuestions.length > 0 && (
                    <Button
                      onClick={handleStartTest}
                      className="w-full"
                      disabled={!testConfig.title}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Test
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Question Bank Tab */}
          <TabsContent value="questions">
            <QuestionBank
              selectedQuestions={selectedQuestions}
              onQuestionSelect={handleQuestionSelect}
              filter={questionFilter}
              onFilterChange={setQuestionFilter}
            />
          </TabsContent>

          {/* Question Editor Tab */}
          <TabsContent value="editor">
            <QuestionEditor
              onQuestionCreated={(question) => {
                setSelectedQuestions((prev) => [...prev, question]);
                setActiveTab("questions");
              }}
            />
          </TabsContent>

          {/* Test Preview Tab */}
          <TabsContent value="preview">
            <TestPreview
              testConfig={testConfig}
              selectedQuestions={selectedQuestions}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
