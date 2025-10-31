"use client";

import React, { useState } from "react";
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

// Mock data for demonstration
// In production, this would come from an API service
interface Test {
  id: string;
  name: string;
  score: number | null;
  createdAt: string;
  isTimed: boolean;
  questionPool: string;
  subjects: string[];
  systems: string[];
  questionCount: number;
}

const mockTests: Test[] = [
  {
    id: "1",
    name: "Cardiology Practice Test 1",
    score: 85,
    createdAt: "2024-01-15T10:00:00Z",
    isTimed: true,
    questionPool: "USMLE Step 1",
    subjects: ["Cardiology", "Pathology"],
    systems: ["Cardiovascular"],
    questionCount: 50,
  },
  {
    id: "2",
    name: "Nephrology Review",
    score: 72,
    createdAt: "2024-01-14T15:30:00Z",
    isTimed: false,
    questionPool: "USMLE Step 1",
    subjects: ["Nephrology"],
    systems: ["Renal"],
    questionCount: 30,
  },
  {
    id: "3",
    name: "Hematology Assessment",
    score: 91,
    createdAt: "2024-01-13T09:15:00Z",
    isTimed: true,
    questionPool: "Custom",
    subjects: ["Hematology", "Oncology"],
    systems: ["Hematologic"],
    questionCount: 40,
  },
  {
    id: "4",
    name: "Endocrinology Study Session",
    score: 68,
    createdAt: "2024-01-12T14:20:00Z",
    isTimed: false,
    questionPool: "USMLE Step 1",
    subjects: ["Endocrinology"],
    systems: ["Endocrine"],
    questionCount: 25,
  },
  {
    id: "5",
    name: "Multi-System Comprehensive",
    score: 79,
    createdAt: "2024-01-11T11:45:00Z",
    isTimed: true,
    questionPool: "USMLE Step 1",
    subjects: ["Cardiology", "Nephrology", "Endocrinology"],
    systems: ["Cardiovascular", "Renal", "Endocrine"],
    questionCount: 60,
  },
];

export default function PreviousTestsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading] = useState(false);

  const filteredTests = mockTests
    .filter((test) =>
      test.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .map((test) => ({
      id: test.id,
      score: test.score || 0,
      name: test.name,
      date: new Date(test.createdAt).toLocaleDateString(),
      mode: test.isTimed ? "Timed" : "Tutored, Untimed",
      pool: test.questionPool,
      subjects: test.subjects.join(", ") || "Multiple",
      systems: test.systems.join(", ") || "Multiple",
      questionCount: test.questionCount,
    }));

  if (isLoading) {
    return (
      <div className="px-[50px] pb-[50px] pt-[25px] space-y-6" data-testid="page-previous-tests">
        <div>
          <h1 className="text-3xl font-bold">Previous Tests</h1>
          <p className="text-muted-foreground mt-1">
            Review and analyze your completed tests
          </p>
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const handleResume = (id: string) => {
    console.log("Resume test:", id);
    // Navigate to test session
  };

  const handleViewResults = (id: string) => {
    console.log("View results:", id);
    // Navigate to test results page
  };

  const handleViewAnalysis = (id: string) => {
    console.log("View analysis:", id);
    // Navigate to test analysis page
  };

  return (
    <div className="px-[50px] pb-[50px] pt-[25px] space-y-6" data-testid="page-previous-tests">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Previous Tests</h1>
        <p className="text-muted-foreground mt-1">
          Review and analyze your completed tests
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-tests"
          />
        </div>
        <div className="flex gap-2">
          <Select defaultValue="10">
            <SelectTrigger className="w-[180px]" data-testid="select-items-per-page">
              <SelectValue placeholder="Items per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 per page</SelectItem>
              <SelectItem value="25">25 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" data-testid="button-columns">
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
        <p className="text-sm text-muted-foreground">
          Showing {filteredTests.length} of {mockTests.length} tests
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled data-testid="button-previous">
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled data-testid="button-next">
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

