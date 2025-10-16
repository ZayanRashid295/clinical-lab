"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  Target,
  Clock,
  BookOpen,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  Award,
  RotateCcw,
  Download,
  Share,
  Eye,
  EyeOff,
  Lightbulb,
} from "lucide-react";
import { Test, Question, SessionAnswer } from "@/lib/test-models";

interface TestResultsPageProps {
  test: Test;
  questions: Question[];
  sessionAnswers: Map<string, SessionAnswer>;
  timeSpent: number;
  onRetakeTest: () => void;
}

interface QuestionResult {
  question: Question;
  userAnswer?: SessionAnswer;
  isCorrect: boolean;
  timeSpent?: number;
}

export default function TestResultsPage({
  test,
  questions,
  sessionAnswers,
  timeSpent,
  onRetakeTest,
}: TestResultsPageProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [showExplanations, setShowExplanations] = useState(false);

  // Calculate results
  const results = React.useMemo(() => {
    const questionResults: QuestionResult[] = questions.map((question) => {
      const userAnswer = sessionAnswers.get(question.id);
      const correctAnswer = question.answers?.find(
        (answer) => answer.isCorrect
      );
      const isCorrect = userAnswer?.answerId === correctAnswer?.id;

      return {
        question,
        userAnswer,
        isCorrect,
        timeSpent: userAnswer?.timeSpent,
      };
    });

    const correctCount = questionResults.filter((r) => r.isCorrect).length;
    const incorrectCount = questionResults.filter(
      (r) => !r.isCorrect && r.userAnswer
    ).length;
    const unansweredCount = questionResults.filter((r) => !r.userAnswer).length;
    const score = (correctCount / questions.length) * 100;

    // Performance by subject
    const subjectPerformance: Record<
      string,
      { correct: number; total: number; percentage: number }
    > = {};
    questionResults.forEach((result) => {
      const subject = result.question.subject;
      if (!subjectPerformance[subject]) {
        subjectPerformance[subject] = { correct: 0, total: 0, percentage: 0 };
      }
      subjectPerformance[subject].total++;
      if (result.isCorrect) {
        subjectPerformance[subject].correct++;
      }
    });

    Object.keys(subjectPerformance).forEach((subject) => {
      const perf = subjectPerformance[subject];
      perf.percentage = (perf.correct / perf.total) * 100;
    });

    // Performance by difficulty
    const difficultyPerformance: Record<
      string,
      { correct: number; total: number; percentage: number }
    > = {};
    questionResults.forEach((result) => {
      const difficulty = result.question.difficulty;
      if (!difficultyPerformance[difficulty]) {
        difficultyPerformance[difficulty] = {
          correct: 0,
          total: 0,
          percentage: 0,
        };
      }
      difficultyPerformance[difficulty].total++;
      if (result.isCorrect) {
        difficultyPerformance[difficulty].correct++;
      }
    });

    Object.keys(difficultyPerformance).forEach((difficulty) => {
      const perf = difficultyPerformance[difficulty];
      perf.percentage = (perf.correct / perf.total) * 100;
    });

    return {
      questionResults,
      correctCount,
      incorrectCount,
      unansweredCount,
      score,
      subjectPerformance,
      difficultyPerformance,
    };
  }, [questions, sessionAnswers]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  const getPerformanceIcon = (percentage: number) => {
    if (percentage >= 80)
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (percentage >= 60)
      return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            <h1 className="text-3xl font-bold">Test Complete!</h1>
          </div>
          <h2 className="text-xl text-muted-foreground">{test.title}</h2>
        </div>

        {/* Score Overview */}
        <Card>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
              <div>
                <div
                  className={`text-4xl font-bold ${getScoreColor(
                    results.score
                  )}`}
                >
                  {Math.round(results.score)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Overall Score
                </div>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-600">
                  {results.correctCount}
                </div>
                <div className="text-sm text-muted-foreground">Correct</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-red-600">
                  {results.incorrectCount}
                </div>
                <div className="text-sm text-muted-foreground">Incorrect</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-gray-600">
                  {results.unansweredCount}
                </div>
                <div className="text-sm text-muted-foreground">Unanswered</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Results */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="review">Question Review</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Test Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Total Questions:
                      </span>
                      <span className="font-medium">{questions.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Time Spent:
                      </span>
                      <span className="font-medium">
                        {formatTime(timeSpent)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Average Time per Question:
                      </span>
                      <span className="font-medium">
                        {formatTime(Math.round(timeSpent / questions.length))}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Test Type:
                      </span>
                      <Badge variant="outline">{test.type}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Difficulty:
                      </span>
                      <Badge variant="outline">{test.difficulty}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Achievement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    {results.score >= 90 && <div className="text-6xl">🏆</div>}
                    {results.score >= 80 && results.score < 90 && (
                      <div className="text-6xl">🥇</div>
                    )}
                    {results.score >= 70 && results.score < 80 && (
                      <div className="text-6xl">🥈</div>
                    )}
                    {results.score >= 60 && results.score < 70 && (
                      <div className="text-6xl">🥉</div>
                    )}
                    {results.score < 60 && <div className="text-6xl">📚</div>}

                    <div>
                      <h3 className="font-semibold text-lg">
                        {results.score >= 90
                          ? "Excellent Work!"
                          : results.score >= 80
                          ? "Great Job!"
                          : results.score >= 70
                          ? "Good Effort!"
                          : results.score >= 60
                          ? "Keep Studying!"
                          : "More Practice Needed"}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        {results.score >= 80
                          ? "You have a strong understanding of the material."
                          : results.score >= 60
                          ? "You're on the right track, but more practice would help."
                          : "Consider reviewing the material and taking more practice tests."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance by Subject</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(results.subjectPerformance).map(
                    ([subject, perf]) => (
                      <div key={subject} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">
                            {subject.replace("_", " ")}
                          </span>
                          <div className="flex items-center gap-2">
                            {getPerformanceIcon(perf.percentage)}
                            <span className="text-sm font-medium">
                              {perf.correct}/{perf.total} (
                              {Math.round(perf.percentage)}%)
                            </span>
                          </div>
                        </div>
                        <Progress value={perf.percentage} className="h-2" />
                      </div>
                    )
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance by Difficulty</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(results.difficultyPerformance).map(
                    ([difficulty, perf]) => (
                      <div key={difficulty} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">
                            {difficulty}
                          </span>
                          <div className="flex items-center gap-2">
                            {getPerformanceIcon(perf.percentage)}
                            <span className="text-sm font-medium">
                              {perf.correct}/{perf.total} (
                              {Math.round(perf.percentage)}%)
                            </span>
                          </div>
                        </div>
                        <Progress value={perf.percentage} className="h-2" />
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Question Review Tab */}
          <TabsContent value="review" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Question Review</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExplanations(!showExplanations)}
              >
                {showExplanations ? (
                  <EyeOff className="h-4 w-4 mr-2" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                {showExplanations ? "Hide" : "Show"} Explanations
              </Button>
            </div>

            <div className="space-y-4">
              {results.questionResults.map((result, index) => (
                <Card
                  key={result.question.id}
                  className={`${
                    result.isCorrect ? "border-green-200" : "border-red-200"
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              result.isCorrect
                                ? "bg-green-100 text-green-600"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {result.isCorrect ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold">
                              Question {index + 1}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {result.question.subject.replace("_", " ")}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {result.question.difficulty}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        {result.timeSpent && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatTime(result.timeSpent)}
                          </div>
                        )}
                      </div>

                      <p className="text-base leading-relaxed">
                        {result.question.content}
                      </p>

                      <div className="space-y-2">
                        {result.question.answers?.map((answer, answerIndex) => {
                          const isUserAnswer =
                            result.userAnswer?.answerId === answer.id;
                          const isCorrectAnswer = answer.isCorrect;

                          return (
                            <div
                              key={answer.id}
                              className={`p-3 rounded border ${
                                isCorrectAnswer
                                  ? "border-green-500 bg-green-50"
                                  : isUserAnswer
                                  ? "border-red-500 bg-red-50"
                                  : "border-gray-200"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {String.fromCharCode(65 + answerIndex)}.
                                </span>
                                <span>{answer.content}</span>
                                {isCorrectAnswer && (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                )}
                                {isUserAnswer && !isCorrectAnswer && (
                                  <XCircle className="h-4 w-4 text-red-600" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {showExplanations && result.question.explanation && (
                        <div className="p-4 bg-blue-50 rounded border-l-4 border-blue-500">
                          <div className="flex items-center gap-2 mb-2">
                            <Lightbulb className="h-4 w-4 text-blue-600" />
                            <span className="font-semibold text-blue-800">
                              Explanation
                            </span>
                          </div>
                          <p className="text-sm text-blue-700">
                            {result.question.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Study Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(results.subjectPerformance)
                  .filter(([_, perf]) => perf.percentage < 70)
                  .map(([subject, perf]) => (
                    <div key={subject} className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2 capitalize">
                        Focus on {subject.replace("_", " ")}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        You scored {Math.round(perf.percentage)}% in this
                        subject area.
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Review Materials</Badge>
                        <Badge variant="outline">Practice Questions</Badge>
                        <Badge variant="outline">Study Guide</Badge>
                      </div>
                    </div>
                  ))}

                {Object.entries(results.subjectPerformance).every(
                  ([_, perf]) => perf.percentage >= 70
                ) && (
                  <div className="text-center p-8">
                    <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      Excellent Performance!
                    </h3>
                    <p className="text-muted-foreground">
                      You performed well across all subject areas. Consider
                      taking more advanced tests or exploring new topics.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" onClick={onRetakeTest}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Retake Test
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download Results
          </Button>
          <Button variant="outline">
            <Share className="h-4 w-4 mr-2" />
            Share Results
          </Button>
        </div>
      </div>
    </div>
  );
}
