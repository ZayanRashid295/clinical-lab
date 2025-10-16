import { useState } from "react";
import { TestModeSelector } from "@/components/TestModeSelector";
import { QuestionPoolSelector } from "@/components/QuestionPoolSelector";
import { SubjectSelector } from "@/components/SubjectSelector";
import { SystemSelector } from "@/components/SystemSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Rocket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function CreateTest() {
  const [mode, setMode] = useState<"tutor" | "timed">("tutor");
  const [isTimed, setIsTimed] = useState(false);
  const [selectedPool, setSelectedPool] = useState("unused");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedSystems, setSelectedSystems] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState("");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const createTestMutation = useMutation({
    mutationFn: async (testData: any) => {
      const response = await apiRequest("POST", "/api/tests", testData);
      return response;
    },
    onSuccess: (data: any) => {
      toast({
        title: "Test Created",
        description: `Successfully created a test with ${questionCount} questions.`,
      });
      setLocation(`/test-session/${data.id}`);
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to create test. Please try again.";
      toast({
        title: "Error Creating Test",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleSystemToggle = (systemId: string) => {
    setSelectedSystems((prev) =>
      prev.includes(systemId)
        ? prev.filter((id) => id !== systemId)
        : [...prev, systemId]
    );
  };

  const handleGenerateTest = () => {
    if (selectedSubjects.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one subject.",
        variant: "destructive",
      });
      return;
    }
    if (selectedSystems.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one system.",
        variant: "destructive",
      });
      return;
    }
    if (!questionCount || parseInt(questionCount) <= 0 || parseInt(questionCount) > 40) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid number of questions (1-40).",
        variant: "destructive",
      });
      return;
    }

    createTestMutation.mutate({
      name: `${mode === "tutor" ? "Tutor" : "Timed"} Test - ${new Date().toLocaleDateString()}`,
      mode,
      isTimed,
      questionPool: selectedPool,
      subjects: selectedSubjects,
      systems: selectedSystems,
      questionCount: parseInt(questionCount),
      duration: isTimed ? parseInt(questionCount) * 1.5 : undefined,
      questions: [],
      answers: {},
      markedQuestions: [],
    });
  };

  return (
    <div className="space-y-6" data-testid="page-create-test">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Create Test</h1>
          <p className="text-muted-foreground mt-1">
            Configure your custom test parameters
          </p>
        </div>
        <Button variant="outline" size="sm" data-testid="button-launch-tutorial">
          <Rocket className="h-4 w-4 mr-2" />
          Launch Tutorial
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <TestModeSelector
            mode={mode}
            isTimed={isTimed}
            onModeChange={setMode}
            onTimedChange={setIsTimed}
          />
          <QuestionPoolSelector
            selectedPool={selectedPool}
            onPoolChange={setSelectedPool}
          />
        </div>

        <div className="space-y-6">
          <SubjectSelector
            selectedSubjects={selectedSubjects}
            onSubjectToggle={handleSubjectToggle}
          />
          <SystemSelector
            selectedSystems={selectedSystems}
            onSystemToggle={handleSystemToggle}
          />
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="question-count">No. of Questions</Label>
              <Input
                id="question-count"
                type="number"
                placeholder="Enter number of questions"
                value={questionCount}
                onChange={(e) => setQuestionCount(e.target.value)}
                className="mt-2"
                data-testid="input-question-count"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Max allowed per block: 40
              </p>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleGenerateTest}
              data-testid="button-generate-test"
              disabled={createTestMutation.isPending}
            >
              {createTestMutation.isPending ? "GENERATING..." : "GENERATE TEST"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
