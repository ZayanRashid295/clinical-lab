import { useState } from "react";
import { TestTable } from "@/components/TestTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { type Test } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function PreviousTests() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: tests = [], isLoading } = useQuery<Test[]>({
    queryKey: ["/api/tests"],
  });

  const filteredTests = tests
    .filter((test) => test.name.toLowerCase().includes(searchQuery.toLowerCase()))
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
      <div className="space-y-6" data-testid="page-previous-tests">
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

  return (
    <div className="space-y-6" data-testid="page-previous-tests">
      <div>
        <h1 className="text-3xl font-bold">Previous Tests</h1>
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
        onResume={(id) => console.log("Resume test:", id)}
        onViewResults={(id) => console.log("View results:", id)}
        onViewAnalysis={(id) => console.log("View analysis:", id)}
      />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredTests.length} of {tests.length} tests
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
