"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import {
  Clock,
  BookOpen,
  Target,
  Play,
  Edit,
  Eye,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";
import { TestCreationConfig, Question } from "@/lib/test-models";

interface TestPreviewProps {
  testConfig: TestCreationConfig;
  selectedQuestions: Question[];
}

export default function TestPreview({
  testConfig,
  selectedQuestions,
}: TestPreviewProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showAnswers, setShowAnswers] = useState(false);

  const currentQuestion = selectedQuestions[currentQuestionIndex];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "advanced":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTestTypeColor = (type: string) => {
    switch (type) {
      case "practice":
        return "bg-blue-100 text-blue-800";
      case "assessment":
        return "bg-purple-100 text-purple-800";
      case "exam":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const calculateEstimatedTime = () => {
    if (testConfig.timeLimit) {
      return testConfig.timeLimit;
    }
    // Estimate 2 minutes per question for practice, 1.5 for assessment, 1 for exam
    const timePerQuestion =
      testConfig.type === "practice"
        ? 2
        : testConfig.type === "assessment"
        ? 1.5
        : 1;
    return Math.ceil(selectedQuestions.length * timePerQuestion);
  };

  const getSubjectDistribution = () => {
    const distribution: Record<string, number> = {};
    selectedQuestions.forEach((q) => {
      distribution[q.subject] = (distribution[q.subject] || 0) + 1;
    });
    return distribution;
  };

  const getDifficultyDistribution = () => {
    const distribution: Record<string, number> = {};
    selectedQuestions.forEach((q) => {
      distribution[q.difficulty] = (distribution[q.difficulty] || 0) + 1;
    });
    return distribution;
  };

  if (selectedQuestions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No questions selected</h3>
          <p className="text-muted-foreground">
            Add questions to your test to see the preview.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Test Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Test Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                Test Title
              </div>
              <p className="font-medium">
                {testConfig.title || "Untitled Test"}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="h-4 w-4" />
                Questions
              </div>
              <p className="font-medium">{selectedQuestions.length}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Duration
              </div>
              <p className="font-medium">
                {testConfig.timeLimit
                  ? `${testConfig.timeLimit} min`
                  : `${calculateEstimatedTime()} min (estimated)`}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                Type
              </div>
              <Badge className={getTestTypeColor(testConfig.type)}>
                {testConfig.type}
              </Badge>
            </div>
          </div>

          {testConfig.description && (
            <div className="mt-4 p-3 bg-muted rounded">
              <p className="text-sm">{testConfig.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Question Navigation */}
        <Card>
          <CardHeader>
            <CardTitle>Question Navigation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {selectedQuestions.map((_, index) => (
                <Button
                  key={index}
                  variant={
                    index === currentQuestionIndex ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setCurrentQuestionIndex(index)}
                  className="aspect-square"
                >
                  {index + 1}
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))
                }
                disabled={currentQuestionIndex === 0}
                className="w-full"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentQuestionIndex(
                    Math.min(
                      selectedQuestions.length - 1,
                      currentQuestionIndex + 1
                    )
                  )
                }
                disabled={currentQuestionIndex === selectedQuestions.length - 1}
                className="w-full"
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Current Question Preview */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Question {currentQuestionIndex + 1} of{" "}
                  {selectedQuestions.length}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge
                    className={getDifficultyColor(currentQuestion.difficulty)}
                  >
                    {currentQuestion.difficulty}
                  </Badge>
                  <Badge variant="outline">
                    {currentQuestion.subject.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Question:</h4>
                <p className="text-base leading-relaxed">
                  {currentQuestion.content}
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Answer Options:</h4>
                <div className="space-y-2">
                  {currentQuestion.answers?.map((answer, index) => (
                    <div
                      key={answer.id}
                      className={`p-3 rounded border ${
                        showAnswers && answer.isCorrect
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <span>{answer.content}</span>
                        {showAnswers && answer.isCorrect && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {currentQuestion.explanation && (
                <div>
                  <h4 className="font-semibold mb-2">Explanation:</h4>
                  <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-500">
                    <p className="text-sm">{currentQuestion.explanation}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAnswers(!showAnswers)}
                >
                  {showAnswers ? "Hide" : "Show"} Answers
                </Button>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Question
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Test Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Test Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Subject Distribution</h4>
              <div className="space-y-2">
                {Object.entries(getSubjectDistribution()).map(
                  ([subject, count]) => (
                    <div
                      key={subject}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm capitalize">
                        {subject.replace("_", " ")}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{
                              width: `${
                                (count / selectedQuestions.length) * 100
                              }%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8">{count}</span>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Difficulty Distribution</h4>
              <div className="space-y-2">
                {Object.entries(getDifficultyDistribution()).map(
                  ([difficulty, count]) => (
                    <div
                      key={difficulty}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm capitalize">{difficulty}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              difficulty === "beginner"
                                ? "bg-green-500"
                                : difficulty === "intermediate"
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{
                              width: `${
                                (count / selectedQuestions.length) * 100
                              }%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8">{count}</span>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" size="lg">
          <Edit className="h-4 w-4 mr-2" />
          Edit Test
        </Button>
        <Button size="lg">
          <Play className="h-4 w-4 mr-2" />
          Start Test Session
        </Button>
      </div>
    </div>
  );
}
