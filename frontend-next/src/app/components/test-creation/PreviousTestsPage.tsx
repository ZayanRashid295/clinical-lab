"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TestTable } from "./TestTable";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";
import { Skeleton } from "@/shared/ui/skeleton";
import { QuestionPapersService } from "@/app/services/assessments/question-papers.service";
import { QuestionPaperQuestionsService } from "@/app/services/assessments/question-paper-questions.service";
import { authService } from "@/shared/services/auth.service";

interface TestData {
  id: string;
  score: number;
  name: string;
  date: string;
  mode: string;
  pool: string;
  subjects: string;
  systems: string;
  questionCount: number;
}

export default function PreviousTestsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [tests, setTests] = useState<TestData[]>([]);
  const questionPapersService = new QuestionPapersService();
  const questionPaperQuestionsService = new QuestionPaperQuestionsService();

  useEffect(() => {
    const fetchTests = async () => {
      try {
        setIsLoading(true);
        const user = authService.getCurrentUser();
        if (!user || !user.id) {
          console.error("User not authenticated");
          setIsLoading(false);
          return;
        }

        // Fetch all question papers for the user
        const questionPapersResponse = await questionPapersService.getQuestionPapers({
          userId: user.id,
          limit: 100, // Maximum allowed by backend
        });

        // Handle both array and paginated response formats
        const questionPapers = Array.isArray(questionPapersResponse)
          ? questionPapersResponse
          : (questionPapersResponse as any)?.data || [];

        console.log("Fetched question papers:", questionPapers);

        // For each question paper, calculate score and get metadata
        const testsData = await Promise.all(
          questionPapers.map(async (paper) => {
            // Get questions for this paper (with pagination if needed)
            // We need to fetch questions to calculate score and extract subjects/systems
            let allQuestions: any[] = [];
            let page = 1;
            let hasMore = true;
            const totalQuestionCount = paper._count?.questionPaperQuestions || paper.totalQuestions || 0;
            
            // Only fetch if we have questions
            if (totalQuestionCount > 0) {
              while (hasMore) {
                const questionsResponse = await questionPaperQuestionsService.getQuestionPaperQuestions({
                  questionPaperId: paper.id,
                  limit: 100, // Maximum allowed by backend
                  page,
                });

                // Handle both array and paginated response formats
                const questionsArray = Array.isArray(questionsResponse)
                  ? questionsResponse
                  : (questionsResponse as any)?.data || [];
                
                allQuestions = [...allQuestions, ...questionsArray];
                
                // Check if there are more pages
                if (Array.isArray(questionsResponse)) {
                  hasMore = false; // If it's an array, we got everything
                } else {
                  const pagination = (questionsResponse as any)?.pagination;
                  hasMore = pagination && page < pagination.totalPages;
                  page++;
                }
              }
            }
            
            const questionsArray = allQuestions;
            console.log(`Questions for paper ${paper.id}:`, questionsArray.length, `(total: ${totalQuestionCount})`);

            // Calculate score
            const totalQuestions = totalQuestionCount || questionsArray.length;
            const correctAnswers = questionsArray.filter((q) => q.isCorrect === true).length;
            const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

            // Extract unique subjects and systems from questions
            const subjectsSet = new Set<string>();
            const systemsSet = new Set<string>();

            questionsArray.forEach((qpq) => {
              if (qpq.question?.topic?.chapter?.name) {
                subjectsSet.add(qpq.question.topic.chapter.name);
              }
              if (qpq.question?.topic?.chapter?.section?.name) {
                systemsSet.add(qpq.question.topic.chapter.section.name);
              }
            });

            // Determine mode - check if any question has timeSpent (indicates timed test)
            const hasTimeSpent = questionsArray.some((q) => q.timeSpent && q.timeSpent > 0);
            const mode = hasTimeSpent ? "Timed" : "Tutored, Untimed";

            // Determine question pool - for now, default to "Custom" or extract from paper type
            const pool = paper.type === "practice" ? "USMLE Step 1" : "Custom";

            return {
              id: paper.id,
              score,
              name: paper.name,
              date: new Date(paper.createdAt).toLocaleDateString(),
              mode,
              pool,
              subjects: Array.from(subjectsSet).join(", ") || "Multiple",
              systems: Array.from(systemsSet).join(", ") || "Multiple",
              questionCount: totalQuestions,
            };
          })
        );

        console.log("Processed tests data:", testsData);
        setTests(testsData);
      } catch (error) {
        console.error("Failed to fetch tests:", error);
        console.error("Error details:", {
          message: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        });
        setTests([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTests();
  }, []);

  const filteredTests = tests.filter((test) =>
      test.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="px-[50px] pb-[50px] pt-[25px] space-y-6 bg-background dark:bg-gray-900 min-h-screen" data-testid="page-previous-tests">
        <div>
          <h1 className="text-3xl font-bold text-foreground dark:text-gray-100">Previous Tests</h1>
          <p className="text-muted-foreground dark:text-gray-400 mt-1">
            Review and analyze your completed tests
          </p>
        </div>
        <Skeleton className="h-10 w-full bg-muted dark:bg-gray-800" />
        <Skeleton className="h-64 w-full bg-muted dark:bg-gray-800" />
      </div>
    );
  }

  const handleResume = (id: string) => {
    // Use window.location to ensure full navigation with query params
    // This ensures the route is properly matched and query params are preserved
    const url = `/question-generator/student?questionPaperId=${encodeURIComponent(id)}`;
    console.log("Navigating to resume test:", url);
    window.location.href = url;
  };

  const handleViewResults = (id: string) => {
    router.push(`/test-results/${id}`);
  };

  const handleViewAnalysis = (id: string) => {
    router.push(`/test-analysis/${id}`);
  };

  return (
    <div className="px-[50px] pb-[50px] pt-[25px] space-y-6 bg-background dark:bg-gray-900 min-h-screen" data-testid="page-previous-tests">
      <div>
        <h1 className="text-3xl font-bold text-foreground dark:text-gray-100">Previous Tests</h1>
        <p className="text-muted-foreground dark:text-gray-400 mt-1">
          Review and analyze your completed tests
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-gray-400" />
          <Input
            placeholder="Search tests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card dark:bg-gray-800 border-border dark:border-gray-700 text-foreground dark:text-gray-100"
            data-testid="input-search-tests"
          />
        </div>
        <div className="flex gap-2">
          <Select defaultValue="10">
            <SelectTrigger className="w-[180px] bg-card dark:bg-gray-800 border-border dark:border-gray-700 text-foreground dark:text-gray-100" data-testid="select-items-per-page">
              <SelectValue placeholder="Items per page" />
            </SelectTrigger>
            <SelectContent className="bg-card dark:bg-gray-800 border-border dark:border-gray-700">
              <SelectItem value="10" className="text-foreground dark:text-gray-100">10 per page</SelectItem>
              <SelectItem value="25" className="text-foreground dark:text-gray-100">25 per page</SelectItem>
              <SelectItem value="50" className="text-foreground dark:text-gray-100">50 per page</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="border-border dark:border-gray-700 text-foreground dark:text-gray-100 hover:bg-muted dark:hover:bg-gray-800" data-testid="button-columns">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Columns
          </Button>
        </div>
      </div>

      <TestTable
        tests={filteredTests}
        onResume={handleResume}
        onViewResults={handleViewResults}
        onViewAnalysis={handleViewAnalysis}
      />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground dark:text-gray-400">
          Showing {filteredTests.length} of {tests.length} tests
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled className="border-border dark:border-gray-700 text-foreground dark:text-gray-300" data-testid="button-previous">
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled className="border-border dark:border-gray-700 text-foreground dark:text-gray-300" data-testid="button-next">
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

