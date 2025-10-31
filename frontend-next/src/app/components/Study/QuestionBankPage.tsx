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
  Star,
  Bookmark,
} from "lucide-react";
import {
  Question,
  QuestionFilter,
  MEDICAL_SUBJECTS,
  DIFFICULTY_LEVELS,
  QUESTION_TYPES,
} from "@/lib/test-models";

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

export default function QuestionBankPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(
    new Set()
  );
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<string>>(
    new Set()
  );
  const [questionFilter, setQuestionFilter] = useState<QuestionFilter>({
    subjects: [],
    topics: [],
    difficulties: [],
    questionTypes: [],
    sortBy: "created",
    sortOrder: "desc",
  });

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
          questionFilter.subjects.length > 0 &&
          !questionFilter.subjects.includes(question.subject)
        ) {
          return false;
        }

        // Difficulty filter
        if (
          questionFilter.difficulties.length > 0 &&
          !questionFilter.difficulties.includes(question.difficulty)
        ) {
          return false;
        }

        // Question type filter
        if (
          questionFilter.questionTypes.length > 0 &&
          !questionFilter.questionTypes.includes(question.type)
        ) {
          return false;
        }

        // Topic filter
        if (
          questionFilter.topics.length > 0 &&
          question.topic &&
          !questionFilter.topics.includes(question.topic)
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const aValue = (a[questionFilter.sortBy as keyof Question] as string) || "";
        const bValue = (b[questionFilter.sortBy as keyof Question] as string) || "";

        if (questionFilter.sortOrder === "asc") {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      });
  }, [mockQuestions, questionFilter, searchTerm]);

  const handleFilterChange = (field: keyof QuestionFilter, value: any) => {
    setQuestionFilter({
      ...questionFilter,
      [field]: value,
    });
  };

  const handleQuestionSelect = (questionId: string) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedQuestions(newSelected);
  };

  const handleBookmarkToggle = (questionId: string) => {
    const newBookmarked = new Set(bookmarkedQuestions);
    if (newBookmarked.has(questionId)) {
      newBookmarked.delete(questionId);
    } else {
      newBookmarked.add(questionId);
    }
    setBookmarkedQuestions(newBookmarked);
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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Question Bank</h1>
          <p className="text-muted-foreground mt-2">
            Browse and practice from our comprehensive medical question database
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Question
          </Button>
          <Button variant="outline">
            <Bookmark className="h-4 w-4 mr-2" />
            My Bookmarks ({bookmarkedQuestions.size})
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Filter
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? "Hide" : "Show"} Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search questions by content, topic, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label>Subjects</Label>
                <Select
                  value={questionFilter.subjects[0] || ""}
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
                  value={questionFilter.difficulties[0] || ""}
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
                  value={questionFilter.questionTypes[0] || ""}
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
                  value={questionFilter.sortBy}
                  onValueChange={(value) => handleFilterChange("sortBy", value)}
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
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Questions</p>
                <p className="text-2xl font-bold">{mockQuestions.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Filtered Results
                </p>
                <p className="text-2xl font-bold">{filteredQuestions.length}</p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Selected</p>
                <p className="text-2xl font-bold">{selectedQuestions.size}</p>
              </div>
              <Check className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bookmarked</p>
                <p className="text-2xl font-bold">{bookmarkedQuestions.size}</p>
              </div>
              <Bookmark className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.map((question) => (
          <Card
            key={question.id}
            className={`transition-all duration-200 ${
              selectedQuestions.has(question.id)
                ? "ring-2 ring-primary bg-primary/5"
                : "hover:shadow-md"
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedQuestions.has(question.id)}
                    onCheckedChange={() => handleQuestionSelect(question.id)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleBookmarkToggle(question.id)}
                  >
                    <Star
                      className={`h-4 w-4 ${
                        bookmarkedQuestions.has(question.id)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-400"
                      }`}
                    />
                  </Button>
                </div>

                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-base leading-relaxed">
                      {question.content}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button variant="outline" size="sm">
                        Practice
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

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Created{" "}
                      {new Date(question.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      1,234 attempts
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      78% success rate
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredQuestions.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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

      {/* Bulk Actions */}
      {selectedQuestions.size > 0 && (
        <Card className="sticky bottom-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedQuestions.size} questions selected
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  Add to Test
                </Button>
                <Button variant="outline" size="sm">
                  Practice Selected
                </Button>
                <Button variant="outline" size="sm">
                  Bookmark All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
