import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search as SearchIcon, FileQuestion } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { type Question } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const { data: questions = [], isLoading } = useQuery<Question[]>({
    queryKey: ["/api/questions/search", { searchTerm: searchQuery, subject: selectedSubject, status: selectedStatus }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("searchTerm", searchQuery);
      if (selectedSubject !== "all") params.append("subject", selectedSubject);
      if (selectedStatus !== "all") params.append("status", selectedStatus);
      
      const url = `/api/questions/search?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch questions");
      return response.json();
    },
  });

  const questionsByStatus = {
    all: questions,
    correct: questions.filter((q: any) => q.status === "correct"),
    incorrect: questions.filter((q: any) => q.status === "incorrect"),
    unseen: questions.filter((q: any) => q.status === "unseen"),
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "correct":
        return <Badge className="bg-chart-2/10 text-chart-2 border-chart-2/20">Correct</Badge>;
      case "incorrect":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Incorrect</Badge>;
      case "unseen":
        return <Badge variant="outline">Unseen</Badge>;
      default:
        return null;
    }
  };

  const renderQuestion = (question: any) => (
    <Card key={question.id} className="hover-elevate" data-testid={`card-question-${question.id}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {question.id}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {question.subject}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {question.system}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {question.difficulty}
              </Badge>
              {getStatusBadge(question.status)}
            </div>
            <CardTitle className="text-base font-medium">{question.text}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {question.yourAnswer && (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">Your Answer: <span className="font-medium">{question.yourAnswer}</span></span>
            <span className="text-muted-foreground">Correct Answer: <span className="font-medium">{question.correctAnswer}</span></span>
          </div>
        )}
        <div className="flex gap-2 mt-3">
          <Button variant="outline" size="sm" data-testid={`button-view-${question.id}`}>
            View Question
          </Button>
          <Button variant="ghost" size="sm" data-testid={`button-add-note-${question.id}`}>
            Add Note
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="page-search">
        <div>
          <h1 className="text-3xl font-bold">Search Questions</h1>
          <p className="text-muted-foreground mt-1">
            Find and review questions from your question bank
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="page-search">
      <div>
        <h1 className="text-3xl font-bold">Search Questions</h1>
        <p className="text-muted-foreground mt-1">
          Find and review questions from your question bank
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-total-questions">
              {questions.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Answered Correctly
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-chart-2" data-testid="text-correct-count">
              {questionsByStatus.correct.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Need Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive" data-testid="text-incorrect-count">
              {questionsByStatus.incorrect.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by question ID or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-questions"
          />
        </div>
        <div className="flex gap-2">
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-[180px]" data-testid="select-subject">
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              <SelectItem value="Cardiology">Cardiology</SelectItem>
              <SelectItem value="Endocrinology">Endocrinology</SelectItem>
              <SelectItem value="Pharmacology">Pharmacology</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[180px]" data-testid="select-status">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="correct">Correct</SelectItem>
              <SelectItem value="incorrect">Incorrect</SelectItem>
              <SelectItem value="unseen">Unseen</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">
            All ({questionsByStatus.all.length})
          </TabsTrigger>
          <TabsTrigger value="correct" data-testid="tab-correct">
            Correct ({questionsByStatus.correct.length})
          </TabsTrigger>
          <TabsTrigger value="incorrect" data-testid="tab-incorrect">
            Incorrect ({questionsByStatus.incorrect.length})
          </TabsTrigger>
          <TabsTrigger value="unseen" data-testid="tab-unseen">
            Unseen ({questionsByStatus.unseen.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3">
          {questionsByStatus.all.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">No questions found</p>
              </CardContent>
            </Card>
          ) : (
            questionsByStatus.all.map(renderQuestion)
          )}
        </TabsContent>

        <TabsContent value="correct" className="space-y-3">
          {questionsByStatus.correct.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">No correct answers found</p>
              </CardContent>
            </Card>
          ) : (
            questionsByStatus.correct.map(renderQuestion)
          )}
        </TabsContent>

        <TabsContent value="incorrect" className="space-y-3">
          {questionsByStatus.incorrect.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">No incorrect answers found</p>
              </CardContent>
            </Card>
          ) : (
            questionsByStatus.incorrect.map(renderQuestion)
          )}
        </TabsContent>

        <TabsContent value="unseen" className="space-y-3">
          {questionsByStatus.unseen.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">No unseen questions found</p>
              </CardContent>
            </Card>
          ) : (
            questionsByStatus.unseen.map(renderQuestion)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
