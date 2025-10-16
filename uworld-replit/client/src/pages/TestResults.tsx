import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { type Test, type Question } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Clock, Award, Target } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function TestResults() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

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

  if (testLoading || questionsLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto" data-testid="page-test-results">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="space-y-6" data-testid="page-test-results">
        <h1 className="text-2xl font-bold">Test not found</h1>
        <Button onClick={() => setLocation("/")}>Return to Dashboard</Button>
      </div>
    );
  }

  const score = test.score || 0;
  const correctCount = Math.round((score / 100) * test.questionCount);
  const incorrectCount = test.questionCount - correctCount;

  return (
    <div className="space-y-6 max-w-5xl mx-auto" data-testid="page-test-results">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Test Results</h1>
          <p className="text-muted-foreground">{test.name}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setLocation("/previous-tests")}
            data-testid="button-view-all-tests"
          >
            View All Tests
          </Button>
          <Button 
            onClick={() => setLocation("/create-test")}
            data-testid="button-new-test"
          >
            Take Another Test
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Award className="h-4 w-4" />
              Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-score">
              {score}%
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {correctCount} of {test.questionCount} correct
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-chart-2" data-testid="text-correct">
              {correctCount}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Correct answers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-duration">
              {test.duration || 0} min
            </div>
            <p className="text-sm text-muted-foreground mt-1">Time spent</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-chart-2" />
                <span>Correct Answers</span>
              </div>
              <span className="font-medium">{correctCount} ({score}%)</span>
            </div>
            <Progress value={score} className="h-2" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                <span>Incorrect Answers</span>
              </div>
              <span className="font-medium">{incorrectCount} ({100 - score}%)</span>
            </div>
            <Progress value={100 - score} className="h-2 bg-muted" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Mode</p>
              <p className="font-medium">{test.isTimed ? "Timed" : "Tutor"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Question Pool</p>
              <p className="font-medium capitalize">{test.questionPool}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Subjects</p>
              <div className="flex gap-1 flex-wrap mt-1">
                {test.subjects.map((subject, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {subject}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Systems</p>
              <div className="flex gap-1 flex-wrap mt-1">
                {test.systems.map((system, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {system}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">{new Date(test.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center gap-3">
        <Button 
          variant="outline" 
          onClick={() => setLocation("/performance")}
          data-testid="button-view-analytics"
        >
          View Performance Analytics
        </Button>
        <Button 
          onClick={() => setLocation("/create-test")}
          data-testid="button-create-new-test"
        >
          Create New Test
        </Button>
      </div>
    </div>
  );
}
