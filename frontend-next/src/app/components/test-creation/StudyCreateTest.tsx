"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Rocket } from "lucide-react";
import { TestModeSelector } from "./TestModeSelector";
import { QuestionPoolSelector } from "./QuestionPoolSelector";
import { SubjectSelector } from "./SubjectSelector";
import { SystemSelector } from "./SystemSelector";

export default function StudyCreateTest() {
  const [mode, setMode] = useState<"tutor" | "timed">("tutor");
  const [isTimed, setIsTimed] = useState(false);
  const [selectedPool, setSelectedPool] = useState("unused");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedSystems, setSelectedSystems] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState("");

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
    // Validation
    if (selectedSubjects.length === 0) {
      alert("Please select at least one subject.");
      return;
    }
    if (selectedSystems.length === 0) {
      alert("Please select at least one system.");
      return;
    }
    if (!questionCount || parseInt(questionCount) <= 0 || parseInt(questionCount) > 40) {
      alert("Please enter a valid number of questions (1-40).");
      return;
    }

    // TODO: Implement API call to create test
    console.log("Creating test with:", {
      mode,
      isTimed,
      questionPool: selectedPool,
      subjects: selectedSubjects,
      systems: selectedSystems,
      questionCount: parseInt(questionCount),
      duration: isTimed ? parseInt(questionCount) * 1.5 : undefined,
    });
    
    alert(`Test configuration created! (This is a demo - backend integration pending)`);
  };

  return (
    <div className="space-y-6 bg-gray-50 dark:bg-gray-950 min-h-screen p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Test</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure your custom test parameters
          </p>
        </div>
        <Button variant="outline" size="sm">
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
                min="1"
                max="40"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Max allowed per block: 40
              </p>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleGenerateTest}
            >
              GENERATE TEST
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

