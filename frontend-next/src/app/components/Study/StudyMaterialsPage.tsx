"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import {
  Search,
  BookOpen,
  FileText,
  Video,
  Download,
  Star,
  Clock,
  Users,
  Filter,
  Grid,
  List,
  Bookmark,
  Play,
  Eye,
} from "lucide-react";

interface StudyMaterial {
  id: string;
  title: string;
  type: "textbook" | "video" | "article" | "presentation" | "notes";
  subject: string;
  topic: string;
  description: string;
  duration?: string; // for videos
  pages?: number; // for textbooks
  author: string;
  rating: number;
  downloads: number;
  isBookmarked: boolean;
  createdAt: string;
  tags: string[];
}

// Mock data for demonstration
const mockMaterials: StudyMaterial[] = [
  {
    id: "1",
    title: "Cardiology Fundamentals: A Comprehensive Guide",
    type: "textbook",
    subject: "cardiology",
    topic: "fundamentals",
    description: "Complete guide covering basic cardiology principles, anatomy, and common conditions.",
    pages: 450,
    author: "Dr. Sarah Johnson",
    rating: 4.8,
    downloads: 1234,
    isBookmarked: false,
    createdAt: "2024-01-15T10:00:00Z",
    tags: ["anatomy", "physiology", "pathology", "diagnosis"],
  },
  {
    id: "2",
    title: "ECG Interpretation Masterclass",
    type: "video",
    subject: "cardiology",
    topic: "ecg_interpretation",
    description: "Step-by-step video tutorial on reading and interpreting electrocardiograms.",
    duration: "2h 30m",
    author: "Dr. Michael Chen",
    rating: 4.9,
    downloads: 856,
    isBookmarked: true,
    createdAt: "2024-01-14T15:30:00Z",
    tags: ["ecg", "diagnosis", "tutorial", "case_studies"],
  },
  {
    id: "3",
    title: "Nephrology Case Studies Collection",
    type: "article",
    subject: "nephrology",
    topic: "case_studies",
    description: "Collection of real-world nephrology cases with detailed analysis and treatment plans.",
    author: "Dr. Emily Rodriguez",
    rating: 4.7,
    downloads: 567,
    isBookmarked: false,
    createdAt: "2024-01-13T09:15:00Z",
    tags: ["case_studies", "treatment", "diagnosis", "clinical"],
  },
  {
    id: "4",
    title: "Hematology Lecture Series",
    type: "presentation",
    subject: "hematology",
    topic: "blood_disorders",
    description: "Comprehensive lecture series covering various blood disorders and their management.",
    author: "Dr. James Wilson",
    rating: 4.6,
    downloads: 789,
    isBookmarked: true,
    createdAt: "2024-01-12T14:20:00Z",
    tags: ["lecture", "blood_disorders", "treatment", "pathology"],
  },
  {
    id: "5",
    title: "Clinical Notes: Internal Medicine",
    type: "notes",
    subject: "internal_medicine",
    topic: "clinical_notes",
    description: "Comprehensive clinical notes covering common internal medicine conditions and treatments.",
    author: "Dr. Lisa Thompson",
    rating: 4.5,
    downloads: 432,
    isBookmarked: false,
    createdAt: "2024-01-11T11:45:00Z",
    tags: ["clinical_notes", "internal_medicine", "treatment", "diagnosis"],
  },
];

export default function StudyMaterialsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [bookmarkedMaterials, setBookmarkedMaterials] = useState<Set<string>>(
    new Set(mockMaterials.filter(m => m.isBookmarked).map(m => m.id))
  );

  const filteredMaterials = mockMaterials.filter((material) => {
    const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = selectedType === "all" || material.type === selectedType;
    const matchesSubject = selectedSubject === "all" || material.subject === selectedSubject;

    return matchesSearch && matchesType && matchesSubject;
  });

  const handleBookmarkToggle = (materialId: string) => {
    const newBookmarked = new Set(bookmarkedMaterials);
    if (newBookmarked.has(materialId)) {
      newBookmarked.delete(materialId);
    } else {
      newBookmarked.add(materialId);
    }
    setBookmarkedMaterials(newBookmarked);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "textbook":
        return <BookOpen className="h-5 w-5" />;
      case "video":
        return <Video className="h-5 w-5" />;
      case "article":
        return <FileText className="h-5 w-5" />;
      case "presentation":
        return <Play className="h-5 w-5" />;
      case "notes":
        return <FileText className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "textbook":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300";
      case "video":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300";
      case "article":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
      case "presentation":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300";
      case "notes":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200";
    }
  };

  return (
    <div className="container mx-auto p-3 space-y-4 bg-gray-50 dark:bg-gray-950 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Study Materials</h1>
          <p className="text-muted-foreground mt-2">
            Access comprehensive medical education resources and materials
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            Upload Material
          </Button>
          <Button variant="outline">
            <Bookmark className="h-4 w-4 mr-2" />
            My Bookmarks ({bookmarkedMaterials.size})
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search materials by title, description, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-4">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All Types</option>
                <option value="textbook">Textbooks</option>
                <option value="video">Videos</option>
                <option value="article">Articles</option>
                <option value="presentation">Presentations</option>
                <option value="notes">Notes</option>
              </select>

              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All Subjects</option>
                <option value="cardiology">Cardiology</option>
                <option value="nephrology">Nephrology</option>
                <option value="hematology">Hematology</option>
                <option value="internal_medicine">Internal Medicine</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex border border-gray-300 dark:border-gray-700 rounded-md">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Materials</p>
                <p className="text-2xl font-bold">{mockMaterials.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Videos</p>
                <p className="text-2xl font-bold">
                  {mockMaterials.filter(m => m.type === "video").length}
                </p>
              </div>
              <Video className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Textbooks</p>
                <p className="text-2xl font-bold">
                  {mockMaterials.filter(m => m.type === "textbook").length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bookmarked</p>
                <p className="text-2xl font-bold">{bookmarkedMaterials.size}</p>
              </div>
              <Bookmark className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Materials Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((material) => (
            <Card key={material.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${getTypeColor(material.type)}`}>
                      {getTypeIcon(material.type)}
                    </div>
                    <div>
                      <Badge className={getTypeColor(material.type)}>
                        {material.type}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleBookmarkToggle(material.id)}
                  >
                    <Star
                      className={`h-4 w-4 ${
                        bookmarkedMaterials.has(material.id)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-400"
                      }`}
                    />
                  </Button>
                </div>
                <CardTitle className="text-lg line-clamp-2">
                  {material.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {material.description}
                </p>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {material.subject.replace("_", " ")}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {material.topic.replace("_", " ")}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 dark:fill-yellow-500 text-yellow-400 dark:text-yellow-500" />
                    <span>{material.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Download className="h-3 w-3" />
                    <span>{material.downloads}</span>
                  </div>
                  {material.duration && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{material.duration}</span>
                    </div>
                  )}
                  {material.pages && (
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      <span>{material.pages} pages</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    by {material.author}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMaterials.map((material) => (
            <Card key={material.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${getTypeColor(material.type)}`}>
                    {getTypeIcon(material.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{material.title}</h3>
                          <Badge className={getTypeColor(material.type)}>
                            {material.type}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mb-3">
                          {material.description}
                        </p>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>{material.rating}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Download className="h-3 w-3" />
                            <span>{material.downloads} downloads</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>by {material.author}</span>
                          </div>
                          {material.duration && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{material.duration}</span>
                            </div>
                          )}
                          {material.pages && (
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              <span>{material.pages} pages</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {material.subject.replace("_", " ")}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {material.topic.replace("_", " ")}
                          </Badge>
                          {material.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag.replace("_", " ")}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleBookmarkToggle(material.id)}
                        >
                          <Star
                            className={`h-4 w-4 ${
                              bookmarkedMaterials.has(material.id)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-400"
                            }`}
                          />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        <Button size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredMaterials.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No materials found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search terms or filters to find more materials.
            </p>
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              Upload New Material
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
