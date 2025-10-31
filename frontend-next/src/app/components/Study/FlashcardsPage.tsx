"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { Progress } from "@/shared/ui/progress";
import {
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Star,
  Clock,
  Target,
  BookOpen,
  Plus,
  Filter,
  Shuffle,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
} from "lucide-react";

interface Flashcard {
  id: string;
  front: string;
  back: string;
  subject: string;
  topic: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  isBookmarked: boolean;
  lastReviewed?: string;
  reviewCount: number;
  correctCount: number;
  tags: string[];
}

// Mock data for demonstration
const mockFlashcards: Flashcard[] = [
  {
    id: "1",
    front: "What is the normal range for systolic blood pressure?",
    back: "90-120 mmHg. Normal systolic blood pressure is considered to be between 90-120 mmHg, with optimal being less than 120 mmHg.",
    subject: "cardiology",
    topic: "vital_signs",
    difficulty: "beginner",
    isBookmarked: false,
    reviewCount: 5,
    correctCount: 4,
    tags: ["vital_signs", "hypertension", "normal_values"],
  },
  {
    id: "2",
    front: "What are the classic symptoms of myocardial infarction?",
    back: "Chest pain, shortness of breath, nausea, sweating, and pain radiating to the left arm, jaw, or back. These symptoms may vary between men and women.",
    subject: "cardiology",
    topic: "myocardial_infarction",
    difficulty: "intermediate",
    isBookmarked: true,
    reviewCount: 8,
    correctCount: 6,
    tags: ["chest_pain", "emergency", "symptoms"],
  },
  {
    id: "3",
    front: "What is the mechanism of action of ACE inhibitors?",
    back: "ACE inhibitors block the angiotensin-converting enzyme, preventing the conversion of angiotensin I to angiotensin II, which reduces vasoconstriction and aldosterone secretion.",
    subject: "pharmacology",
    topic: "ace_inhibitors",
    difficulty: "advanced",
    isBookmarked: false,
    reviewCount: 3,
    correctCount: 2,
    tags: ["pharmacology", "mechanism", "cardiovascular"],
  },
  {
    id: "4",
    front: "What is the normal range for serum creatinine?",
    back: "0.6-1.2 mg/dL for men and 0.5-1.1 mg/dL for women. Creatinine levels are used to assess kidney function.",
    subject: "nephrology",
    topic: "kidney_function",
    difficulty: "beginner",
    isBookmarked: false,
    reviewCount: 7,
    correctCount: 7,
    tags: ["kidney_function", "lab_values", "normal_values"],
  },
  {
    id: "5",
    front: "What are the signs of acute kidney injury?",
    back: "Oliguria (<400ml/day), elevated BUN and creatinine, fluid overload, electrolyte imbalances, and metabolic acidosis.",
    subject: "nephrology",
    topic: "acute_kidney_injury",
    difficulty: "intermediate",
    isBookmarked: true,
    reviewCount: 4,
    correctCount: 3,
    tags: ["kidney_injury", "symptoms", "diagnosis"],
  },
];

export default function FlashcardsPage() {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyMode, setStudyMode] = useState<"review" | "practice">("review");
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [isShuffled, setIsShuffled] = useState(false);
  const [studyCards, setStudyCards] = useState<Flashcard[]>(mockFlashcards);
  const [sessionStats, setSessionStats] = useState({
    total: 0,
    correct: 0,
    incorrect: 0,
    skipped: 0,
  });

  // Filter cards based on selected criteria
  useEffect(() => {
    let filtered = mockFlashcards;

    if (selectedSubject !== "all") {
      filtered = filtered.filter((card) => card.subject === selectedSubject);
    }

    if (selectedDifficulty !== "all") {
      filtered = filtered.filter(
        (card) => card.difficulty === selectedDifficulty
      );
    }

    if (isShuffled) {
      filtered = [...filtered].sort(() => Math.random() - 0.5);
    }

    setStudyCards(filtered);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setShowAnswer(false);
  }, [selectedSubject, selectedDifficulty, isShuffled]);

  const currentCard = studyCards[currentCardIndex];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    setShowAnswer(!showAnswer);
  };

  const handleNext = () => {
    if (currentCardIndex < studyCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
      setShowAnswer(false);
    }
  };

  const handlePrevious = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
      setShowAnswer(false);
    }
  };

  const handleAnswer = (isCorrect: boolean) => {
    setSessionStats((prev) => ({
      ...prev,
      total: prev.total + 1,
      correct: isCorrect ? prev.correct + 1 : prev.correct,
      incorrect: isCorrect ? prev.incorrect : prev.incorrect + 1,
    }));
    handleNext();
  };

  const handleShuffle = () => {
    setIsShuffled(!isShuffled);
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

  const getProgressPercentage = () => {
    return studyCards.length > 0
      ? ((currentCardIndex + 1) / studyCards.length) * 100
      : 0;
  };

  const getSuccessRate = (card: Flashcard) => {
    return card.reviewCount > 0
      ? (card.correctCount / card.reviewCount) * 100
      : 0;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Flashcards</h1>
          <p className="text-muted-foreground mt-2">
            Master medical concepts with spaced repetition flashcards
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Flashcard
          </Button>
          <Button variant="outline">
            <BookOpen className="h-4 w-4 mr-2" />
            My Decks
          </Button>
        </div>
      </div>

      {/* Study Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Subject:</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md bg-white text-sm"
                >
                  <option value="all">All Subjects</option>
                  <option value="cardiology">Cardiology</option>
                  <option value="nephrology">Nephrology</option>
                  <option value="pharmacology">Pharmacology</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Difficulty:</label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md bg-white text-sm"
                >
                  <option value="all">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <Button
                variant={isShuffled ? "default" : "outline"}
                size="sm"
                onClick={handleShuffle}
              >
                <Shuffle className="h-4 w-4 mr-2" />
                Shuffle
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={studyMode === "review" ? "default" : "outline"}
                size="sm"
                onClick={() => setStudyMode("review")}
              >
                <Eye className="h-4 w-4 mr-2" />
                Review
              </Button>
              <Button
                variant={studyMode === "practice" ? "default" : "outline"}
                size="sm"
                onClick={() => setStudyMode("practice")}
              >
                <Target className="h-4 w-4 mr-2" />
                Practice
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="text-2xl font-bold">
                  {currentCardIndex + 1} / {studyCards.length}
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
            <Progress value={getProgressPercentage()} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Session Correct</p>
                <p className="text-2xl font-bold text-green-600">
                  {sessionStats.correct}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Session Incorrect
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {sessionStats.incorrect}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">
                  {sessionStats.total > 0
                    ? Math.round(
                        (sessionStats.correct / sessionStats.total) * 100
                      )
                    : 0}
                  %
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Flashcard */}
      {currentCard && (
        <div className="max-w-4xl mx-auto">
          <Card className="min-h-[400px]">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={getDifficultyColor(currentCard.difficulty)}>
                    {currentCard.difficulty}
                  </Badge>
                  <Badge variant="outline">{currentCard.subject}</Badge>
                  <Badge variant="secondary">
                    {currentCard.topic.replace("_", " ")}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Star className="h-4 w-4" />
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    {Math.round(getSuccessRate(currentCard))}% success rate
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="text-center space-y-6 w-full">
                {/* 3D Flip Card Container */}
                <div
                  className="w-full max-w-md mx-auto"
                  style={{ perspective: "1000px" }}
                >
                  <div
                    className="relative w-full h-64 transition-transform duration-700"
                    style={{
                      transformStyle: "preserve-3d",
                      transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                    }}
                  >
                    {/* Front of Card */}
                    <div
                      className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200 rounded-lg shadow-lg flex items-center justify-center p-6"
                      style={{ backfaceVisibility: "hidden" }}
                    >
                      <p className="text-xl leading-relaxed text-gray-800">
                        {currentCard.front}
                      </p>
                    </div>

                    {/* Back of Card */}
                    <div
                      className="absolute inset-0 w-full h-full bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-200 rounded-lg shadow-lg flex items-center justify-center p-6"
                      style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                      }}
                    >
                      <p className="text-xl leading-relaxed text-gray-800">
                        {currentCard.back}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    onClick={handleFlip}
                    className="flex items-center gap-2 hover:scale-105 transition-transform duration-200"
                  >
                    {isFlipped ? (
                      <>
                        <EyeOff className="h-4 w-4" />
                        Show Question
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4" />
                        Show Answer
                      </>
                    )}
                  </Button>
                </div>

                {studyMode === "practice" && isFlipped && (
                  <div className="flex items-center justify-center gap-4 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => handleAnswer(false)}
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Incorrect
                    </Button>
                    <Button
                      onClick={() => handleAnswer(true)}
                      className="text-green-600 border-green-600 hover:bg-green-50"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Correct
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentCardIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentCardIndex(0)}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>

            <Button
              variant="outline"
              onClick={handleNext}
              disabled={currentCardIndex === studyCards.length - 1}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {studyCards.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No flashcards found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filters or create new flashcards to get
              started.
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create New Flashcard
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
