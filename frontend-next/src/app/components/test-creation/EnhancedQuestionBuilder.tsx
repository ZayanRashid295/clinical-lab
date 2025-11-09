"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Badge } from "@/shared/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import {
  Plus,
  Trash2,
  Save,
  Eye,
  FileText,
  Zap,
  List,
  ClipboardList,
  Grid,
  Upload,
  X,
  CheckCircle,
  XCircle,
  MessageSquare,
  Lightbulb,
  BookOpen,
} from "lucide-react";
import {
  Question,
  Answer,
  MEDICAL_SUBJECTS,
  DIFFICULTY_LEVELS,
} from "@/lib/test-models";

interface ExtendedAnswer extends Answer {
  comment?: string;
  reasonWhyWrong?: string;
  reasonWhyCorrect?: string;
}

interface QuestionBuilderData {
  question: Partial<Question>;
  answers: ExtendedAnswer[];
  images: File[];
  correctAnswerReason?: string;
}

interface EnhancedQuestionBuilderProps {
  onQuestionCreated?: (
    question: Question & { answers: ExtendedAnswer[]; images?: File[] }
  ) => void;
}

export default function EnhancedQuestionBuilder({
  onQuestionCreated,
}: EnhancedQuestionBuilderProps) {
  const [activeTab, setActiveTab] = useState("standard");
  const [data, setData] = useState<QuestionBuilderData>({
    question: {
      content: "",
      type: "multiple_choice",
      difficulty: "intermediate",
      subject: "internal_medicine",
      topic: "",
      explanation: "",
      isActive: true,
    },
    answers: [
      {
        id: "",
        questionId: "",
        content: "",
        isCorrect: false,
        order: 1,
        createdAt: "",
      },
      {
        id: "",
        questionId: "",
        content: "",
        isCorrect: false,
        order: 2,
        createdAt: "",
      },
      {
        id: "",
        questionId: "",
        content: "",
        isCorrect: false,
        order: 3,
        createdAt: "",
      },
      {
        id: "",
        questionId: "",
        content: "",
        isCorrect: false,
        order: 4,
        createdAt: "",
      },
    ],
    images: [],
    correctAnswerReason: "",
  });
  const [previewMode, setPreviewMode] = useState(false);

  const handleQuestionChange = (field: keyof Question, value: any) => {
    setData((prev) => ({
      ...prev,
      question: { ...prev.question, [field]: value },
    }));
  };

  const handleAnswerChange = (
    index: number,
    field: keyof ExtendedAnswer,
    value: any
  ) => {
    setData((prev) => ({
      ...prev,
      answers: prev.answers.map((answer, i) =>
        i === index ? { ...answer, [field]: value } : answer
      ),
    }));
  };

  const handleCorrectAnswerChange = (index: number) => {
    setData((prev) => ({
      ...prev,
      answers: prev.answers.map((answer, i) => ({
        ...answer,
        isCorrect: i === index,
      })),
    }));
  };

  const addAnswer = () => {
    setData((prev) => ({
      ...prev,
      answers: [
        ...prev.answers,
        {
          id: "",
          questionId: "",
          content: "",
          isCorrect: false,
          order: prev.answers.length + 1,
          createdAt: "",
        },
      ],
    }));
  };

  const removeAnswer = (index: number) => {
    if (data.answers.length > 2) {
      setData((prev) => ({
        ...prev,
        answers: prev.answers
          .filter((_, i) => i !== index)
          .map((answer, i) => ({ ...answer, order: i + 1 })),
      }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setData((prev) => ({
      ...prev,
      images: [...prev.images, ...files],
    }));
  };

  const removeImage = (index: number) => {
    setData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSave = () => {
    if (!data.question.content || data.answers.some((a) => !a.content)) {
      alert("Please fill in all required fields");
      return;
    }

    const correctAnswers = data.answers.filter((a) => a.isCorrect);
    if (correctAnswers.length === 0) {
      alert("Please select at least one correct answer");
      return;
    }

    const newQuestion: Question & {
      answers: ExtendedAnswer[];
      images?: File[];
    } = {
      id: `q_${Date.now()}`,
      content: data.question.content!,
      type: data.question.type!,
      difficulty: data.question.difficulty!,
      subject: data.question.subject!,
      topic: data.question.topic || undefined,
      explanation: data.question.explanation || undefined,
      isActive: true,
      createdBy: "current_user",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      answers: data.answers.map((answer, index) => ({
        id: `a_${Date.now()}_${index}`,
        questionId: `q_${Date.now()}`,
        content: answer.content!,
        isCorrect: answer.isCorrect!,
        order: answer.order!,
        createdAt: new Date().toISOString(),
        comment: answer.comment,
        reasonWhyWrong: answer.reasonWhyWrong,
        reasonWhyCorrect: answer.isCorrect
          ? data.correctAnswerReason || answer.reasonWhyCorrect
          : answer.reasonWhyWrong,
      })),
      images: data.images.length > 0 ? data.images : undefined,
    };

    onQuestionCreated?.(newQuestion);

    // Reset form
    setData({
      question: {
        content: "",
        type: "multiple_choice",
        difficulty: "intermediate",
        subject: "internal_medicine",
        topic: "",
        explanation: "",
        isActive: true,
      },
      answers: [
        {
          id: "",
          questionId: "",
          content: "",
          isCorrect: false,
          order: 1,
          createdAt: "",
        },
        {
          id: "",
          questionId: "",
          content: "",
          isCorrect: false,
          order: 2,
          createdAt: "",
        },
        {
          id: "",
          questionId: "",
          content: "",
          isCorrect: false,
          order: 3,
          createdAt: "",
        },
        {
          id: "",
          questionId: "",
          content: "",
          isCorrect: false,
          order: 4,
          createdAt: "",
        },
      ],
      images: [],
      correctAnswerReason: "",
    });
  };

  // Render Standard Builder Tab
  const renderStandardBuilder = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                value={data.question.content}
                onChange={(e) =>
                  handleQuestionChange("content", e.target.value)
                }
                className="min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Upload Images</Label>
              <div className="flex items-center gap-2 flex-wrap">
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    document.getElementById("image-upload")?.click()
                  }
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Add Images
                </Button>
                {data.images.length > 0 && (
                  <Badge variant="secondary">
                    {data.images.length} image(s)
                  </Badge>
                )}
              </div>
              {data.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {data.images.map((image, index) => (
                    <div key={index} className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded border"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="explanation">Explanation (Optional)</Label>
              <Textarea
                id="explanation"
                placeholder="Provide a detailed explanation..."
                value={data.question.explanation}
                onChange={(e) =>
                  handleQuestionChange("explanation", e.target.value)
                }
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Answer Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.answers.map((answer, index) => (
              <Card key={index} className="p-4 border-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">
                      Option {String.fromCharCode(65 + index)}
                      {answer.isCorrect && (
                        <Badge className="ml-2 bg-green-100 text-green-800">
                          Correct
                        </Badge>
                      )}
                    </Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={answer.isCorrect ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleCorrectAnswerChange(index)}
                      >
                        {answer.isCorrect ? (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-2" />
                        )}
                        {answer.isCorrect ? "Correct" : "Mark Correct"}
                      </Button>
                      {data.answers.length > 2 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAnswer(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Answer Text *</Label>
                    <Input
                      placeholder={`Enter option ${String.fromCharCode(
                        65 + index
                      )} text`}
                      value={answer.content}
                      onChange={(e) =>
                        handleAnswerChange(index, "content", e.target.value)
                      }
                    />
                  </div>

                  {answer.isCorrect && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-green-600" />
                        Why is this correct?
                      </Label>
                      <Textarea
                        placeholder="Explain why this answer is correct..."
                        value={
                          answer.reasonWhyCorrect || data.correctAnswerReason
                        }
                        onChange={(e) => {
                          const value = e.target.value;
                          if (answer.isCorrect) {
                            setData((prev) => ({
                              ...prev,
                              correctAnswerReason: value,
                              answers: prev.answers.map((a, i) =>
                                i === index
                                  ? { ...a, reasonWhyCorrect: value }
                                  : a
                              ),
                            }));
                          } else {
                            handleAnswerChange(
                              index,
                              "reasonWhyCorrect",
                              value
                            );
                          }
                        }}
                        className="min-h-[80px]"
                      />
                    </div>
                  )}

                  {!answer.isCorrect && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        Why is this incorrect?
                      </Label>
                      <Textarea
                        placeholder="Explain why this answer is wrong..."
                        value={answer.reasonWhyWrong}
                        onChange={(e) =>
                          handleAnswerChange(
                            index,
                            "reasonWhyWrong",
                            e.target.value
                          )
                        }
                        className="min-h-[80px]"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Comment (Optional)
                    </Label>
                    <Textarea
                      placeholder="Add any additional comments or notes..."
                      value={answer.comment}
                      onChange={(e) =>
                        handleAnswerChange(index, "comment", e.target.value)
                      }
                      className="min-h-[60px]"
                    />
                  </div>
                </div>
              </Card>
            ))}

            <Button variant="outline" onClick={addAnswer} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Answer Option
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Question Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select
                value={data.question.difficulty}
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
                value={data.question.subject}
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
                value={data.question.topic}
                onChange={(e) => handleQuestionChange("topic", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Question Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Answer Options:</span>
              <span className="font-medium">{data.answers.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Correct Answers:</span>
              <span className="font-medium">
                {data.answers.filter((a) => a.isCorrect).length}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Images:</span>
              <span className="font-medium">{data.images.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Render Quick Add Tab
  const renderQuickAdd = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Add Question
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Question Text *</Label>
            <Textarea
              placeholder="Enter your question..."
              value={data.question.content}
              onChange={(e) => handleQuestionChange("content", e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Answers (one per line, mark correct with *)</Label>
            <Textarea
              placeholder={`Option A\n*Option B (correct)\nOption C\nOption D`}
              className="min-h-[150px] font-mono text-sm"
              onChange={(e) => {
                const lines = e.target.value
                  .split("\n")
                  .filter((l) => l.trim());
                const newAnswers = lines.map((line, index) => {
                  const isCorrect = line.trim().startsWith("*");
                  const content = line.replace(/^\*/, "").trim();
                  return {
                    id: "",
                    questionId: "",
                    content,
                    isCorrect,
                    order: index + 1,
                    createdAt: "",
                  };
                });
                setData((prev) => ({ ...prev, answers: newAnswers }));
              }}
            />
            <p className="text-xs text-muted-foreground">
              Use * before the correct answer
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select
                value={data.question.difficulty}
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
              <Label>Subject</Label>
              <Select
                value={data.question.subject}
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
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render Bulk Entry Tab
  const renderBulkEntry = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <List className="h-5 w-5" />
            Bulk Entry
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>
              CSV Format (Question, Option1, Option2, Option3, Option4,
              CorrectOption, Explanation)
            </Label>
            <Textarea
              placeholder="What is the normal heart rate?,60-80,80-100,100-120,120-140,2,The normal resting heart rate for adults ranges from 60-100 bpm..."
              className="min-h-[200px] font-mono text-sm"
              onChange={(e) => {
                // Parse CSV and update question
                const lines = e.target.value
                  .split("\n")
                  .filter((l) => l.trim());
                if (lines.length > 0) {
                  const parts = lines[0].split(",").map((p) => p.trim());
                  if (parts.length >= 6) {
                    handleQuestionChange("content", parts[0]);
                    const correctIndex = parseInt(parts[5]) - 1;
                    const newAnswers = parts
                      .slice(1, 5)
                      .map((content, index) => ({
                        id: "",
                        questionId: "",
                        content,
                        isCorrect: index === correctIndex,
                        order: index + 1,
                        createdAt: "",
                      }));
                    if (parts[6]) {
                      handleQuestionChange("explanation", parts[6]);
                    }
                    setData((prev) => ({ ...prev, answers: newAnswers }));
                  }
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Format: Question, Option1, Option2, Option3, Option4,
              CorrectOption (1-4), Explanation
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render Template Based Tab
  const renderTemplateBased = () => {
    const templates = [
      {
        name: "Basic Multiple Choice",
        question: "What is...?",
        options: ["Option A", "Option B", "Option C", "Option D"],
      },
      {
        name: "Case Study",
        question:
          "A [patient description] presents with [symptoms]. What is the most likely diagnosis?",
        options: ["Diagnosis A", "Diagnosis B", "Diagnosis C", "Diagnosis D"],
      },
      {
        name: "Mechanism of Action",
        question: "What is the mechanism of action of [medication]?",
        options: ["Mechanism A", "Mechanism B", "Mechanism C", "Mechanism D"],
      },
    ];

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Choose a Template
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {templates.map((template, index) => (
                <Card
                  key={index}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => {
                    handleQuestionChange("content", template.question);
                    setData((prev) => ({
                      ...prev,
                      answers: template.options.map((opt, i) => ({
                        id: "",
                        questionId: "",
                        content: opt,
                        isCorrect: false,
                        order: i + 1,
                        createdAt: "",
                      })),
                    }));
                  }}
                >
                  <CardHeader>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {template.question}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {data.question.content && renderStandardBuilder()}
      </div>
    );
  };

  // Render Visual Builder Tab
  const renderVisualBuilder = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid className="h-5 w-5" />
            Visual Builder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Question Text *</Label>
              <Textarea
                placeholder="Enter your question..."
                value={data.question.content}
                onChange={(e) =>
                  handleQuestionChange("content", e.target.value)
                }
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {data.answers.map((answer, index) => (
                <Card
                  key={index}
                  className={`p-4 cursor-pointer transition-all ${
                    answer.isCorrect
                      ? "border-2 border-green-500 bg-green-50"
                      : "border-2 border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => handleCorrectAnswerChange(index)}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="font-semibold">
                        {String.fromCharCode(65 + index)}
                      </Label>
                      {answer.isCorrect && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                    <Input
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                      value={answer.content}
                      onChange={(e) =>
                        handleAnswerChange(index, "content", e.target.value)
                      }
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Create New Question</h2>
          <p className="text-muted-foreground mt-1">
            Choose a method to build your multiple choice question
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? "Edit" : "Preview"}
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Question
          </Button>
        </div>
      </div>

      {previewMode ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-800">
                  {data.question.difficulty}
                </Badge>
                <Badge variant="outline">
                  {data.question.subject?.replace("_", " ")}
                </Badge>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Question:</h3>
                <p className="text-base leading-relaxed">
                  {data.question.content}
                </p>
              </div>

              {data.images.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Images:</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {data.images.map((image, index) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={index}
                        src={URL.createObjectURL(image)}
                        alt={`Question image ${index + 1}`}
                        className="w-full rounded border"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-3">Answer Options:</h4>
                <div className="space-y-2">
                  {data.answers.map((answer, index) => (
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
                      {answer.isCorrect &&
                        (answer.reasonWhyCorrect ||
                          data.correctAnswerReason) && (
                          <div className="mt-2 p-2 bg-green-100 rounded text-sm">
                            <strong>Why correct:</strong>{" "}
                            {answer.reasonWhyCorrect ||
                              data.correctAnswerReason}
                          </div>
                        )}
                      {!answer.isCorrect && answer.reasonWhyWrong && (
                        <div className="mt-2 p-2 bg-red-100 rounded text-sm">
                          <strong>Why incorrect:</strong>{" "}
                          {answer.reasonWhyWrong}
                        </div>
                      )}
                      {answer.comment && (
                        <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
                          <strong>Comment:</strong> {answer.comment}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {data.question.explanation && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Explanation:
                  </h4>
                  <div className="p-4 bg-blue-50 rounded border-l-4 border-blue-500">
                    <p className="text-sm">{data.question.explanation}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="standard">
              <FileText className="h-4 w-4 mr-2" />
              Standard
            </TabsTrigger>
            <TabsTrigger value="quick">
              <Zap className="h-4 w-4 mr-2" />
              Quick Add
            </TabsTrigger>
            <TabsTrigger value="bulk">
              <List className="h-4 w-4 mr-2" />
              Bulk Entry
            </TabsTrigger>
            <TabsTrigger value="template">
              <ClipboardList className="h-4 w-4 mr-2" />
              Template
            </TabsTrigger>
            <TabsTrigger value="visual">
              <Grid className="h-4 w-4 mr-2" />
              Visual
            </TabsTrigger>
          </TabsList>

          <TabsContent value="standard" className="mt-6">
            {renderStandardBuilder()}
          </TabsContent>

          <TabsContent value="quick" className="mt-6">
            {renderQuickAdd()}
          </TabsContent>

          <TabsContent value="bulk" className="mt-6">
            {renderBulkEntry()}
          </TabsContent>

          <TabsContent value="template" className="mt-6">
            {renderTemplateBased()}
          </TabsContent>

          <TabsContent value="visual" className="mt-6">
            {renderVisualBuilder()}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
