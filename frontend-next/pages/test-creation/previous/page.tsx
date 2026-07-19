"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../src/shared/ui/card";
import { Button } from "../../../src/shared/ui/button";
import { Input } from "../../../src/shared/ui/input";
import { Badge } from "../../../src/shared/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../src/shared/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../src/shared/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../src/shared/ui/dropdown-menu";
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Copy,
  Play,
  Calendar,
  Clock,
  Users,
  Target,
  TrendingUp,
  Download,
  Share,
} from "lucide-react";

// Mock data for previous tests
const mockPreviousTests = [
  {
    id: "1",
    title: "USMLE Step 1 Practice Test - Cardiology",
    description:
      "Comprehensive cardiology assessment covering heart anatomy, physiology, and pathology",
    type: "Practice",
    difficulty: "Intermediate",
    questionCount: 50,
    timeLimit: 90,
    createdAt: "2024-01-15",
    lastModified: "2024-01-20",
    attempts: 3,
    averageScore: 78,
    status: "Completed",
    subjects: ["Cardiology", "Anatomy", "Physiology"],
    createdBy: "Dr. Sarah Johnson",
  },
  {
    id: "2",
    title: "Emergency Medicine Quick Review",
    description: "Fast-paced emergency scenarios for rapid assessment skills",
    type: "Timed",
    difficulty: "Advanced",
    questionCount: 30,
    timeLimit: 45,
    createdAt: "2024-01-10",
    lastModified: "2024-01-18",
    attempts: 1,
    averageScore: 85,
    status: "Draft",
    subjects: ["Emergency Medicine", "Trauma"],
    createdBy: "Dr. Michael Chen",
  },
  {
    id: "3",
    title: "Pediatrics Comprehensive Exam",
    description: "Complete pediatric assessment covering all age groups",
    type: "Formal",
    difficulty: "Expert",
    questionCount: 100,
    timeLimit: 180,
    createdAt: "2024-01-05",
    lastModified: "2024-01-22",
    attempts: 5,
    averageScore: 72,
    status: "Published",
    subjects: ["Pediatrics", "Growth & Development"],
    createdBy: "Dr. Emily Rodriguez",
  },
  {
    id: "4",
    title: "Pharmacology Drug Interactions",
    description: "Focus on drug-drug interactions and adverse effects",
    type: "Practice",
    difficulty: "Intermediate",
    questionCount: 40,
    timeLimit: 60,
    createdAt: "2024-01-12",
    lastModified: "2024-01-19",
    attempts: 2,
    averageScore: 81,
    status: "Completed",
    subjects: ["Pharmacology", "Toxicology"],
    createdBy: "Dr. James Wilson",
  },
  {
    id: "5",
    title: "Surgery Pre-Operative Assessment",
    description: "Pre-operative evaluation and surgical planning scenarios",
    type: "Case Study",
    difficulty: "Advanced",
    questionCount: 25,
    timeLimit: 75,
    createdAt: "2024-01-08",
    lastModified: "2024-01-21",
    attempts: 4,
    averageScore: 76,
    status: "Draft",
    subjects: ["Surgery", "Anesthesia"],
    createdBy: "Dr. Robert Kim",
  },
];

const testTypes = ["All", "Practice", "Timed", "Formal", "Case Study"];
const difficultyLevels = [
  "All",
  "Beginner",
  "Intermediate",
  "Advanced",
  "Expert",
];
const statusOptions = ["All", "Draft", "Published", "Completed", "Archived"];

export default function PreviousTestsPage() {
  const [tests, setTests] = useState(mockPreviousTests);
  const [filteredTests, setFilteredTests] = useState(mockPreviousTests);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [sortBy, setSortBy] = useState("lastModified");
  const [sortOrder, setSortOrder] = useState("desc");

  // Filter and search logic
  useEffect(() => {
    let filtered = tests.filter((test) => {
      const matchesSearch =
        test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.subjects.some((subject) =>
          subject.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesType = selectedType === "All" || test.type === selectedType;
      const matchesDifficulty =
        selectedDifficulty === "All" || test.difficulty === selectedDifficulty;
      const matchesStatus =
        selectedStatus === "All" || test.status === selectedStatus;

      return matchesSearch && matchesType && matchesDifficulty && matchesStatus;
    });

    // Sort tests
    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case "title":
          aValue = a.title;
          bValue = b.title;
          break;
        case "createdAt":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case "lastModified":
          aValue = new Date(a.lastModified);
          bValue = new Date(b.lastModified);
          break;
        case "attempts":
          aValue = a.attempts;
          bValue = b.attempts;
          break;
        case "averageScore":
          aValue = a.averageScore;
          bValue = b.averageScore;
          break;
        default:
          aValue = new Date(a.lastModified);
          bValue = new Date(b.lastModified);
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredTests(filtered);
  }, [
    tests,
    searchTerm,
    selectedType,
    selectedDifficulty,
    selectedStatus,
    sortBy,
    sortOrder,
  ]);

  const handleTestAction = (testId: string, action: string) => {
    // TODO: Implement actual actions
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Published":
        return "bg-green-100 text-green-800";
      case "Draft":
        return "bg-yellow-100 text-yellow-800";
      case "Completed":
        return "bg-blue-100 text-blue-800";
      case "Archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-100 text-green-800";
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "Advanced":
        return "bg-orange-100 text-orange-800";
      case "Expert":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Previous Tests
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage and review your previously created tests
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filters
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Tests</p>
                  <p className="text-2xl font-bold">{tests.length}</p>
                </div>
                <Target className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Published</p>
                  <p className="text-2xl font-bold">
                    {tests.filter((t) => t.status === "Published").length}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Attempts
                  </p>
                  <p className="text-2xl font-bold">
                    {tests.reduce((sum, test) => sum + test.attempts, 0)}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Score</p>
                  <p className="text-2xl font-bold">
                    {Math.round(
                      tests.reduce((sum, test) => sum + test.averageScore, 0) /
                        tests.length
                    )}
                    %
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tests by title, description, or subjects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {testTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={selectedDifficulty}
                  onValueChange={setSelectedDifficulty}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {difficultyLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lastModified">Last Modified</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="createdAt">Created Date</SelectItem>
                    <SelectItem value="attempts">Attempts</SelectItem>
                    <SelectItem value="averageScore">Average Score</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tests Table */}
        <Card>
          <CardHeader>
            <CardTitle>Test Library ({filteredTests.length} tests)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Questions</TableHead>
                    <TableHead>Time Limit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Avg Score</TableHead>
                    <TableHead>Last Modified</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTests.map((test) => (
                    <TableRow key={test.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{test.title}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {test.description}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {test.subjects.slice(0, 2).map((subject) => (
                              <Badge
                                key={subject}
                                variant="secondary"
                                className="text-xs"
                              >
                                {subject}
                              </Badge>
                            ))}
                            {test.subjects.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{test.subjects.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{test.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getDifficultyColor(test.difficulty)}>
                          {test.difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          {test.questionCount}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {test.timeLimit} min
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(test.status)}>
                          {test.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {test.attempts}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          {test.averageScore}%
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(test.lastModified).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleTestAction(test.id, "view")}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleTestAction(test.id, "edit")}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Test
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleTestAction(test.id, "copy")}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleTestAction(test.id, "start")}
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Start Test
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleTestAction(test.id, "delete")
                              }
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
