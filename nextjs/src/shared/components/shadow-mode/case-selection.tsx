"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  Play,
  Clock,
  User,
  Stethoscope,
  Brain,
  Star,
  TrendingUp,
  BookOpen,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { MedicalCase } from "@/shared/types/learning.types";
import { learningService } from "@/shared/services/learning/learning.service";

interface CaseSelectionProps {
  onCaseSelect: (caseId: string) => void;
  isFullScreen?: boolean;
}

export default function CaseSelection({
  onCaseSelect,
  isFullScreen = false,
}: CaseSelectionProps) {
  const [cases, setCases] = useState<MedicalCase[]>([]);
  const [filteredCases, setFilteredCases] = useState<MedicalCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("all");

  // Load cases on component mount
  useEffect(() => {
    loadCases();
  }, []);

  // Filter cases based on search and filters
  useEffect(() => {
    let filtered = cases;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (case_) =>
          case_.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          case_.disease.toLowerCase().includes(searchTerm.toLowerCase()) ||
          case_.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
          case_.symptoms.some((symptom) =>
            symptom.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    // Difficulty filter
    if (difficultyFilter !== "all") {
      filtered = filtered.filter(
        (case_) => case_.difficulty === difficultyFilter
      );
    }

    // Specialty filter
    if (specialtyFilter !== "all") {
      filtered = filtered.filter(
        (case_) => case_.specialty === specialtyFilter
      );
    }

    setFilteredCases(filtered);
  }, [cases, searchTerm, difficultyFilter, specialtyFilter]);

  const loadCases = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const loadedCases = await learningService.getAllCases();
      setCases(loadedCases);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cases");
    } finally {
      setIsLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "advanced":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getSpecialtyIcon = (specialty: string) => {
    switch (specialty.toLowerCase()) {
      case "cardiology":
        return <TrendingUp className="w-4 h-4" />;
      case "neurology":
        return <Brain className="w-4 h-4" />;
      case "gastroenterology":
        return <Stethoscope className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const containerClass = isFullScreen
    ? "min-h-screen bg-background p-6"
    : "p-6";

  if (isLoading) {
    return (
      <div className={containerClass}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading medical cases...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={containerClass}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
            <p className="text-destructive mb-2">Error loading cases</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadCases} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            Shadow Mode Learning
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Practice medical interviews with AI-powered patients. Select a case
            to begin your learning journey.
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter Cases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search cases, diseases, symptoms..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select
                  value={difficultyFilter}
                  onValueChange={setDifficultyFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Specialty</Label>
                <Select
                  value={specialtyFilter}
                  onValueChange={setSpecialtyFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Specialties</SelectItem>
                    <SelectItem value="Cardiology">Cardiology</SelectItem>
                    <SelectItem value="Neurology">Neurology</SelectItem>
                    <SelectItem value="Gastroenterology">
                      Gastroenterology
                    </SelectItem>
                    <SelectItem value="Emergency Medicine">
                      Emergency Medicine
                    </SelectItem>
                    <SelectItem value="Internal Medicine">
                      Internal Medicine
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCases.map((case_) => (
            <Card key={case_.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg line-clamp-2">
                    {case_.title}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    {getSpecialtyIcon(case_.specialty)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getDifficultyColor(case_.difficulty)}>
                    {case_.difficulty}
                  </Badge>
                  <Badge variant="outline">{case_.specialty}</Badge>
                  {case_.isRare && (
                    <Badge
                      variant="secondary"
                      className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
                    >
                      <Star className="w-3 h-3 mr-1" />
                      Rare
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Disease</Label>
                  <p className="text-sm text-muted-foreground">
                    {case_.disease}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Patient</Label>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="w-4 h-4" />
                    {case_.patientProfile.name}, {case_.patientProfile.age}{" "}
                    years old
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Chief Complaint</Label>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {case_.symptoms.join(", ")}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Medical History</Label>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {case_.history.join(", ")}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {new Date(case_.createdAt).toLocaleDateString()}
                  </div>
                  <Button
                    onClick={() => onCaseSelect(case_.id)}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Start Case
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {filteredCases.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No cases found
            </h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or filters.
            </p>
          </div>
        )}

        {/* Stats */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {cases.length}
                </div>
                <div className="text-sm text-muted-foreground">Total Cases</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {cases.filter((c) => c.difficulty === "beginner").length}
                </div>
                <div className="text-sm text-muted-foreground">Beginner</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {cases.filter((c) => c.difficulty === "intermediate").length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Intermediate
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {cases.filter((c) => c.difficulty === "advanced").length}
                </div>
                <div className="text-sm text-muted-foreground">Advanced</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
