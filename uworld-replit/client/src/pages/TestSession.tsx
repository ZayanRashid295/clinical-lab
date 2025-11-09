import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { type Test, type Question } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Clock, ChevronLeft, ChevronRight, Flag, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function TestSession() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [startTime] = useState(Date.now());

  const { data: test, isLoading: testLoading } = useQuery<Test>({
    queryKey: ["/api/tests", id],
    queryFn: async () => {
      const response = await fetch(`/api/tests/${id}`);
      if (!response.ok) throw new Error("Failed to fetch test");
      return response.json();
    },
  });

  const { data: questions = [], isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ["/api/questions", test?.questions],
    queryFn: async () => {
      if (!test || !test.questions || test.questions.length === 0) return [];
      
      // Fetch questions by their IDs from the test
      const questionPromises = test.questions.map(async (questionId) => {
        const response = await fetch(`/api/questions/${questionId}`);
        if (!response.ok) throw new Error(`Failed to fetch question ${questionId}`);
        return response.json();
      });
      
      return await Promise.all(questionPromises);
    },
    enabled: !!test && !!test.questions && test.questions.length > 0,
  });

  const submitTestMutation = useMutation({
    mutationFn: async (data: { score: number; duration: number }) => {
      await apiRequest("PATCH", `/api/tests/${id}`, {
        status: "completed",
        score: data.score,
        duration: data.duration,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests"] });
      setLocation(`/test-results/${id}`);
    },
  });

  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswer = selectedAnswers[currentQuestionIndex];
  const isAnswered = selectedAnswer !== undefined;
  const totalAnswered = Object.keys(selectedAnswers).length;
  const progressPercent = questions.length > 0 ? (totalAnswered / questions.length) * 100 : 0;

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answer,
    }));
    
    if (!test?.isTimed) {
      setShowExplanation(true);
    }
  };

  const handleNext = () => {
    setShowExplanation(false);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setShowExplanation(false);
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitTest = () => {
    const duration = Math.floor((Date.now() - startTime) / 1000 / 60);
    let correctCount = 0;
    
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswer) {
        correctCount++;
      }
    });
    
    const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    
    submitTestMutation.mutate({ score, duration });
  };

  if (testLoading || questionsLoading) {
    return (
      <div className="space-y-6" data-testid="page-test-session">
        <Skeleton className="h-8 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!test || questions.length === 0) {
    return (
      <div className="space-y-6" data-testid="page-test-session">
        <h1 className="text-2xl font-bold">Test not found</h1>
        <Button onClick={() => setLocation("/")}>Return to Dashboard</Button>
      </div>
    );
  }

  const isCorrect = isAnswered && selectedAnswer === currentQuestion?.correctAnswer;
  const isIncorrect = isAnswered && selectedAnswer !== currentQuestion?.correctAnswer;

  return (
    <div className="space-y-6 max-w-5xl mx-auto" data-testid="page-test-session">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{test.name}</h1>
          <p className="text-muted-foreground">
            {test.isTimed ? "Timed Mode" : "Tutor Mode"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {test.isTimed && test.duration && (
            <Badge variant="outline" className="gap-2">
              <Clock className="h-4 w-4" />
              {test.duration} min
            </Badge>
          )}
          <Badge variant="outline">
            Question {currentQuestionIndex + 1} of {questions.length}
          </Badge>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{totalAnswered} / {questions.length} answered</span>
        </div>
        <Progress value={progressPercent} />
      </div>

      {currentQuestion && (
        <Card data-testid={`question-card-${currentQuestionIndex}`}>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <CardTitle className="text-lg flex-1">{currentQuestion.text}</CardTitle>
              <div className="flex gap-2">
                <Badge variant="secondary">{currentQuestion.subject}</Badge>
                <Badge variant="outline">{currentQuestion.difficulty}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup
              value={selectedAnswer}
              onValueChange={handleAnswerSelect}
              disabled={showExplanation && !test.isTimed}
            >
              <div className="space-y-3">
                {currentQuestion.options.map((option, idx) => {
                  const optionLetter = String.fromCharCode(65 + idx);
                  const isThisCorrect = option === currentQuestion.correctAnswer;
                  const isSelected = selectedAnswer === option;
                  
                  let borderColor = "";
                  if (showExplanation) {
                    if (isThisCorrect) borderColor = "border-chart-2";
                    else if (isSelected && !isThisCorrect) borderColor = "border-destructive";
                  }

                  return (
                    <div
                      key={idx}
                      className={`flex items-center space-x-3 p-4 rounded-lg border-2 ${borderColor} hover-elevate`}
                      data-testid={`option-${idx}`}
                    >
                      <RadioGroupItem value={option} id={`option-${idx}`} />
                      <Label
                        htmlFor={`option-${idx}`}
                        className="flex-1 cursor-pointer"
                      >
                        <span className="font-medium mr-2">{optionLetter}.</span>
                        {option}
                      </Label>
                      {showExplanation && isThisCorrect && (
                        <CheckCircle className="h-5 w-5 text-chart-2" />
                      )}
                    </div>
                  );
                })}
              </div>
            </RadioGroup>

            {showExplanation && (
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    {isCorrect ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-chart-2" />
                        <span className="text-chart-2">Correct!</span>
                      </>
                    ) : (
                      <>
                        <Flag className="h-5 w-5 text-destructive" />
                        <span className="text-destructive">Incorrect</span>
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{currentQuestion.explanation}</p>
                </CardContent>
              </Card>
            )}

            {test.isTimed && isAnswered && (
              <Button
                variant="outline"
                onClick={() => setShowExplanation(!showExplanation)}
                data-testid="button-toggle-explanation"
              >
                {showExplanation ? "Hide" : "Show"} Explanation
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          data-testid="button-previous"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex gap-3">
          {currentQuestionIndex === questions.length - 1 ? (
            <Button
              onClick={handleSubmitTest}
              disabled={totalAnswered < questions.length}
              data-testid="button-submit-test"
            >
              Submit Test
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              data-testid="button-next"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
