"use client";

import React, { useState } from "react";
import { useToast } from "@/shared/ui/use-toast";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Rocket } from "lucide-react";
import { TestModeSelector } from "./TestModeSelector";
import { QuestionPoolSelector } from "./QuestionPoolSelector";
import { SystemSelector } from "./SystemSelector";
import { TopicSelector } from "./TopicSelector";

export default function StudyCreateTest() {
  const { toast } = useToast();
  const [isTutor, setIsTutor] = useState(true);
  const [isTimed, setIsTimed] = useState(false);
  const [selectedPool, setSelectedPool] = useState("unused");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedSystems, setSelectedSystems] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState("");

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSystemToggle = (systemId: string) => {
    setSelectedSystems((prev) =>
      prev.includes(systemId)
        ? prev.filter((id) => id !== systemId)
        : [...prev, systemId]
    );
  };

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleTopicToggle = (topicId: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId]
    );
  };

  const handleGenerateTest = () => {
    // Validation
    if (selectedTags.length === 0) {
      toast({
        title: "Selection Needed",
        description: "Please select at least one tag.",
        variant: "destructive",
      });
      return;
    }
    if (selectedSystems.length === 0) {
      toast({
        title: "Selection Needed",
        description: "Please select at least one system.",
        variant: "destructive",
      });
      return;
    }
    if (!questionCount || parseInt(questionCount) <= 0 || parseInt(questionCount) > 40) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid number of questions (1-40).",
        variant: "destructive",
      });
      return;
    }

    // Build query parameters
    const params = new URLSearchParams();
    if (selectedTags.length > 0) {
      params.set("tagIds", selectedTags.join(","));
    }
    if (selectedSystems.length > 0) {
      params.set("systemIds", selectedSystems.join(","));
    }
    if (selectedSubjects.length > 0) {
      params.set("subjectIds", selectedSubjects.join(","));
    }
    if (selectedTopics.length > 0) {
      params.set("topicIds", selectedTopics.join(","));
    }
    params.set("limit", questionCount);
    // Determine mode: if tutor is enabled, use "tutor", otherwise use "timed" if timed is enabled
    const mode = isTutor ? "tutor" : (isTimed ? "timed" : "tutor");
    params.set("mode", mode);
    if (isTimed) {
      params.set("timed", "true");
    }
    if (isTutor) {
      params.set("tutor", "true");
    }

    // Navigate to student mode with filters
    window.location.href = `/question-generator/student?${params.toString()}`;
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
            isTutor={isTutor}
            isTimed={isTimed}
            onTutorChange={setIsTutor}
            onTimedChange={setIsTimed}
          />
          <QuestionPoolSelector
            selectedPool={selectedPool}
            onPoolChange={setSelectedPool}
            filters={{
              tagIds: selectedTags.length > 0 ? selectedTags : undefined,
              systemIds: selectedSystems.length > 0 ? selectedSystems : undefined,
              subjectIds: selectedSubjects.length > 0 ? selectedSubjects : undefined,
              topicIds: selectedTopics.length > 0 ? selectedTopics : undefined,
            }}
          />
        </div>

        <div className="space-y-6">
          <SystemSelector
            selectedSystems={selectedTags}
            onSystemToggle={handleTagToggle}
            selectedPool={selectedPool}
          />
          <TopicSelector
            selectedSystems={selectedTags}
            onSystemToggle={handleTagToggle}
            selectedPool={selectedPool}
            selectedTopics={selectedSubjects}
            selectedSubtopics={selectedTopics}
            onTopicToggle={handleSubjectToggle}
            onSubtopicToggle={handleTopicToggle}
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

