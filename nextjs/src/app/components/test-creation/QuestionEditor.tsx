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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Trash2,
  Save,
  Eye,
  ArrowUp,
  ArrowDown,
  BookOpen,
  Target,
  Lightbulb,
} from "lucide-react";
import {
  Question,
  Answer,
  MEDICAL_SUBJECTS,
  DIFFICULTY_LEVELS,
  QUESTION_TYPES,
} from "@/lib/test-models";

interface QuestionEditorProps {
  onQuestionCreated: (question: Question) => void;
}

export default function QuestionEditor({
  onQuestionCreated,
}: QuestionEditorProps) {
  const [question, setQuestion] = useState<Partial<Question>>({
    content: "",
    type: "multiple_choice",
    difficulty: "intermediate",
    subject: "internal_medicine",
    topic: "",
    explanation: "",
    isActive: true,
  });

  const [answers, setAnswers] = useState<Partial<Answer>[]>([
    { content: "", isCorrect: false, order: 1 },
    { content: "", isCorrect: false, order: 2 },
    { content: "", isCorrect: false, order: 3 },
    { content: "", isCorrect: false, order: 4 },
  ]);

  const [previewMode, setPreviewMode] = useState(false);

  const handleQuestionChange = (field: keyof Question, value: any) => {
    setQuestion((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAnswerChange = (
    index: number,
    field: keyof Answer,
    value: any
  ) => {
    setAnswers((prev) =>
      prev.map((answer, i) =>
        i === index ? { ...answer, [field]: value } : answer
      )
    );
  };

  const handleCorrectAnswerChange = (index: number) => {
    setAnswers((prev) =>
      prev.map((answer, i) => ({
        ...answer,
        isCorrect: i === index,
      }))
    );
  };

  const addAnswer = () => {
    setAnswers((prev) => [
      ...prev,
      {
        content: "",
        isCorrect: false,
        order: prev.length + 1,
      },
    ]);
  };

  const removeAnswer = (index: number) => {
    if (answers.length > 2) {
      setAnswers((prev) =>
        prev
          .filter((_, i) => i !== index)
          .map((answer, i) => ({
            ...answer,
            order: i + 1,
          }))
      );
    }
  };

  const moveAnswer = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < answers.length) {
      setAnswers((prev) => {
        const newAnswers = [...prev];
        const temp = newAnswers[index];
        newAnswers[index] = newAnswers[newIndex];
        newAnswers[newIndex] = temp;
        return newAnswers.map((answer, i) => ({ ...answer, order: i + 1 }));
      });
    }
  };

  const handleSave = () => {
    if (!question.content || answers.some((a) => !a.content)) {
      alert("Please fill in all required fields");
      return;
    }

    const correctAnswers = answers.filter((a) => a.isCorrect);
    if (correctAnswers.length === 0) {
      alert("Please select at least one correct answer");
      return;
    }

    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      content: question.content!,
      type: question.type!,
      difficulty: question.difficulty!,
      subject: question.subject!,
      topic: question.topic || undefined,
      explanation: question.explanation || undefined,
      isActive: true,
      createdBy: "current_user",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      answers: answers.map((answer, index) => ({
        id: `a_${Date.now()}_${index}`,
        questionId: `q_${Date.now()}`,
        content: answer.content!,
        isCorrect: answer.isCorrect!,
        order: answer.order!,
        createdAt: new Date().toISOString(),
      })),
    };

    onQuestionCreated(newQuestion);

    // Reset form
    setQuestion({
      content: "",
      type: "multiple_choice",
      difficulty: "intermediate",
      subject: "internal_medicine",
      topic: "",
      explanation: "",
      isActive: true,
    });
    setAnswers([
      { content: "", isCorrect: false, order: 1 },
      { content: "", isCorrect: false, order: 2 },
      { content: "", isCorrect: false, order: 3 },
      { content: "", isCorrect: false, order: 4 },
    ]);
  };

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

  if (previewMode) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Question Preview</h2>
          <Button variant="outline" onClick={() => setPreviewMode(false)}>
            <Eye className="h-4 w-4 mr-2" />
            Edit Mode
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Badge
                  className={getDifficultyColor(
                    question.difficulty || "intermediate"
                  )}
                >
                  {question.difficulty}
                </Badge>
                <Badge variant="outline">
                  {question.subject?.replace("_", " ")}
                </Badge>
                {question.topic && (
                  <Badge variant="secondary">
                    {question.topic.replace("_", " ")}
                  </Badge>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Question:</h3>
                <p className="text-base leading-relaxed">{question.content}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Answer Options:</h4>
                <div className="space-y-2">
                  {answers.map((answer, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded border ${
                        answer.isCorrect
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <span>{answer.content}</span>
                        {answer.isCorrect && (
                          <Badge className="bg-green-100 text-green-800">
                            Correct
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {question.explanation && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Explanation:
                  </h4>
                  <div className="p-4 bg-blue-50 rounded border-l-4 border-blue-500">
                    <p className="text-sm">{question.explanation}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Create New Question</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setPreviewMode(true)}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Question
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Question Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Question Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="content">Question Text *</Label>
                <Textarea
                  id="content"
                  placeholder="Enter your question here..."
                  value={question.content}
                  onChange={(e) =>
                    handleQuestionChange("content", e.target.value)
                  }
                  className="min-h-[120px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="explanation">Explanation (Optional)</Label>
                <Textarea
                  id="explanation"
                  placeholder="Provide a detailed explanation of the correct answer..."
                  value={question.explanation}
                  onChange={(e) =>
                    handleQuestionChange("explanation", e.target.value)
                  }
                  className="min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Answer Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Answer Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {answers.map((answer, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 border rounded"
                >
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveAnswer(index, "up")}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveAnswer(index, "down")}
                      disabled={index === answers.length - 1}
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="flex-1">
                    <Input
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                      value={answer.content}
                      onChange={(e) =>
                        handleAnswerChange(index, "content", e.target.value)
                      }
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={answer.isCorrect}
                      onCheckedChange={() => handleCorrectAnswerChange(index)}
                    />
                    <Label className="text-sm">Correct</Label>
                  </div>

                  {answers.length > 2 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAnswer(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              <Button variant="outline" onClick={addAnswer} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Answer Option
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Question Settings */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Question Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Question Type</Label>
                <Select
                  value={question.type}
                  onValueChange={(value) => handleQuestionChange("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUESTION_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select
                  value={question.difficulty}
                  onValueChange={(value) =>
                    handleQuestionChange("difficulty", value)
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
                <Label htmlFor="subject">Medical Subject</Label>
                <Select
                  value={question.subject}
                  onValueChange={(value) =>
                    handleQuestionChange("subject", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEDICAL_SUBJECTS.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic">Topic (Optional)</Label>
                <Input
                  id="topic"
                  placeholder="e.g., myocardial infarction"
                  value={question.topic}
                  onChange={(e) =>
                    handleQuestionChange("topic", e.target.value)
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Question Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Question Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Answer Options:</span>
                <span className="font-medium">{answers.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Correct Answers:</span>
                <span className="font-medium">
                  {answers.filter((a) => a.isCorrect).length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Has Explanation:</span>
                <span className="font-medium">
                  {question.explanation ? "Yes" : "No"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
