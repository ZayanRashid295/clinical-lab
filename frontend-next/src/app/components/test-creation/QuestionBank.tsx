"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Checkbox } from "@/shared/ui/checkbox";
import { Badge } from "@/shared/ui/badge";
import {
  Search,
  Filter,
  Plus,
  Eye,
  Check,
  Clock,
  Target,
  BookOpen,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Question,
  QuestionFilter,
  MEDICAL_SUBJECTS,
  DIFFICULTY_LEVELS,
  QUESTION_TYPES,
} from "@/lib/test-models";

interface QuestionBankProps {
  selectedQuestions: Question[];
  onQuestionSelect: (question: Question) => void;
  filter: QuestionFilter;
  onFilterChange: (filter: QuestionFilter) => void;
}

// Mock data for demonstration
const mockQuestions: Question[] = [
  {
    id: "1",
    content:
      "A 65-year-old male presents with chest pain that radiates to the left arm. ECG shows ST elevation in leads II, III, and aVF. What is the most likely diagnosis?",
    type: "multiple_choice",
    difficulty: "intermediate",
    subject: "cardiology",
    topic: "myocardial_infarction",
    explanation:
      "The patient presents with classic symptoms of inferior wall myocardial infarction. ST elevation in leads II, III, and aVF indicates inferior wall involvement.",
    isActive: true,
    createdBy: "user1",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
    answers: [
      {
        id: "a1",
        questionId: "1",
        content: "Anterior wall MI",
        isCorrect: false,
        order: 1,
        createdAt: "2024-01-15T10:00:00Z",
      },
      {
        id: "a2",
        questionId: "1",
        content: "Inferior wall MI",
        isCorrect: true,
        order: 2,
        createdAt: "2024-01-15T10:00:00Z",
      },
      {
        id: "a3",
        questionId: "1",
        content: "Lateral wall MI",
        isCorrect: false,
        order: 3,
        createdAt: "2024-01-15T10:00:00Z",
      },
      {
        id: "a4",
        questionId: "1",
        content: "Posterior wall MI",
        isCorrect: false,
        order: 4,
        createdAt: "2024-01-15T10:00:00Z",
      },
    ],
  },
  {
    id: "2",
    content:
      "Which of the following is the most common cause of acute kidney injury in hospitalized patients?",
    type: "multiple_choice",
    difficulty: "beginner",
    subject: "nephrology",
    topic: "acute_kidney_injury",
    explanation:
      "Prerenal causes, particularly hypovolemia and decreased effective circulating volume, account for 60-70% of acute kidney injury cases in hospitalized patients.",
    isActive: true,
    createdBy: "user1",
    createdAt: "2024-01-14T15:30:00Z",
    updatedAt: "2024-01-14T15:30:00Z",
    answers: [
      {
        id: "b1",
        questionId: "2",
        content: "Acute tubular necrosis",
        isCorrect: false,
        order: 1,
        createdAt: "2024-01-14T15:30:00Z",
      },
      {
        id: "b2",
        questionId: "2",
        content: "Prerenal causes",
        isCorrect: true,
        order: 2,
        createdAt: "2024-01-14T15:30:00Z",
      },
      {
        id: "b3",
        questionId: "2",
        content: "Postrenal obstruction",
        isCorrect: false,
        order: 3,
        createdAt: "2024-01-14T15:30:00Z",
      },
      {
        id: "b4",
        questionId: "2",
        content: "Glomerulonephritis",
        isCorrect: false,
        order: 4,
        createdAt: "2024-01-14T15:30:00Z",
      },
    ],
  },
  {
    id: "3",
    content:
      "A 45-year-old woman presents with progressive weakness and fatigue. Laboratory studies reveal macrocytic anemia and low vitamin B12 levels. What is the most likely underlying cause?",
    type: "multiple_choice",
    difficulty: "advanced",
    subject: "hematology",
    topic: "vitamin_b12_deficiency",
    explanation:
      "Pernicious anemia, caused by autoimmune destruction of gastric parietal cells leading to intrinsic factor deficiency, is the most common cause of vitamin B12 deficiency in adults.",
    isActive: true,
    createdBy: "user1",
    createdAt: "2024-01-13T09:15:00Z",
    updatedAt: "2024-01-13T09:15:00Z",
    answers: [
      {
        id: "c1",
        questionId: "3",
        content: "Dietary deficiency",
        isCorrect: false,
        order: 1,
        createdAt: "2024-01-13T09:15:00Z",
      },
      {
        id: "c2",
        questionId: "3",
        content: "Pernicious anemia",
        isCorrect: true,
        order: 2,
        createdAt: "2024-01-13T09:15:00Z",
      },
      {
        id: "c3",
        questionId: "3",
        content: "Crohn's disease",
        isCorrect: false,
        order: 3,
        createdAt: "2024-01-13T09:15:00Z",
      },
      {
        id: "c4",
        questionId: "3",
        content: "Celiac disease",
        isCorrect: false,
        order: 4,
        createdAt: "2024-01-13T09:15:00Z",
      },
    ],
  },
];

export default function QuestionBank({
  selectedQuestions,
  onQuestionSelect,
  filter,
  onFilterChange,
}: QuestionBankProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Filter questions based on current filter settings
  const filteredQuestions = useMemo(() => {
    return mockQuestions
      .filter((question) => {
        // Search term filter
        if (
          searchTerm &&
          !question.content.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          return false;
        }

        // Subject filter
        if (
          filter.subjects.length > 0 &&
          !filter.subjects.includes(question.subject)
        ) {
          return false;
        }

        // Difficulty filter
        if (
          filter.difficulties.length > 0 &&
          !filter.difficulties.includes(question.difficulty)
        ) {
          return false;
        }

        // Question type filter
        if (
          filter.questionTypes.length > 0 &&
          !filter.questionTypes.includes(question.type)
        ) {
          return false;
        }

        // Topic filter
        if (
          filter.topics.length > 0 &&
          question.topic &&
          !filter.topics.includes(question.topic)
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const aValue = (a[filter.sortBy as keyof Question] as string) || "";
        const bValue = (b[filter.sortBy as keyof Question] as string) || "";

        if (filter.sortOrder === "asc") {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      });
  }, [mockQuestions, filter, searchTerm]);

  const handleFilterChange = (field: keyof QuestionFilter, value: any) => {
    onFilterChange({
      ...filter,
      [field]: value,
    });
  };

  const isQuestionSelected = (questionId: string) => {
    return selectedQuestions.some((q) => q.id === questionId);
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

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Question
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Subjects</Label>
                  <Select
                    value={filter.subjects[0] || ""}
                    onValueChange={(value) =>
                      handleFilterChange("subjects", value ? [value] : [])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All subjects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All subjects</SelectItem>
                      {MEDICAL_SUBJECTS.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select
                    value={filter.difficulties[0] || ""}
                    onValueChange={(value) =>
                      handleFilterChange("difficulties", value ? [value] : [])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All levels</SelectItem>
                      {DIFFICULTY_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Question Type</Label>
                  <Select
                    value={filter.questionTypes[0] || ""}
                    onValueChange={(value) =>
                      handleFilterChange("questionTypes", value ? [value] : [])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All types</SelectItem>
                      {QUESTION_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Sort By</Label>
                  <Select
                    value={filter.sortBy}
                    onValueChange={(value) =>
                      handleFilterChange("sortBy", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created">Date Created</SelectItem>
                      <SelectItem value="difficulty">Difficulty</SelectItem>
                      <SelectItem value="subject">Subject</SelectItem>
                      <SelectItem value="topic">Topic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Question List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Questions ({filteredQuestions.length})
          </h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {selectedQuestions.length} selected
          </div>
        </div>

        {filteredQuestions.map((question) => (
          <Card
            key={question.id}
            className={`transition-all duration-200 ${
              isQuestionSelected(question.id)
                ? "ring-2 ring-primary bg-primary/5"
                : "hover:shadow-md"
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <Checkbox
                    checked={isQuestionSelected(question.id)}
                    onCheckedChange={() => onQuestionSelect(question)}
                  />
                </div>

                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground leading-relaxed">
                        {question.content}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {question.subject.replace("_", " ")}
                    </Badge>
                    {question.topic && (
                      <Badge variant="secondary" className="text-xs">
                        {question.topic.replace("_", " ")}
                      </Badge>
                    )}
                    <Badge
                      className={`text-xs ${getDifficultyColor(
                        question.difficulty
                      )}`}
                    >
                      {question.difficulty}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {question.type.replace("_", " ")}
                    </Badge>
                  </div>

                  {question.explanation && (
                    <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                      <strong>Explanation:</strong> {question.explanation}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Created{" "}
                      {new Date(question.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {question.answers?.length || 0} options
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      85% accuracy
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredQuestions.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No questions found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search terms or filters to find more
                questions.
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create New Question
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
