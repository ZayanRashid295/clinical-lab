"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Bookmark,
  Tag,
  Calendar,
  FileText,
  Save,
  X,
  Filter,
  Grid,
  List,
  Star,
  Clock,
  Eye,
  Share,
} from "lucide-react";

interface Note {
  id: string;
  title: string;
  content: string;
  subject: string;
  topic: string;
  tags: string[];
  isBookmarked: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  wordCount: number;
  lastAccessed?: string;
}

// Mock data for demonstration
const mockNotes: Note[] = [
  {
    id: "1",
    title: "Cardiology Fundamentals - Heart Anatomy",
    content: "The heart is a four-chambered organ consisting of two atria and two ventricles. The right side pumps deoxygenated blood to the lungs, while the left side pumps oxygenated blood to the body. Key structures include the mitral valve, tricuspid valve, aortic valve, and pulmonary valve.",
    subject: "cardiology",
    topic: "heart_anatomy",
    tags: ["anatomy", "fundamentals", "valves"],
    isBookmarked: true,
    isPublic: false,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
    wordCount: 45,
  },
  {
    id: "2",
    title: "ECG Interpretation - Basic Patterns",
    content: "ECG interpretation involves analyzing the P wave, QRS complex, and T wave. Normal intervals: PR interval 0.12-0.20s, QRS duration <0.12s, QT interval varies with heart rate. Common abnormalities include ST elevation (STEMI), ST depression (ischemia), and various arrhythmias.",
    subject: "cardiology",
    topic: "ecg_interpretation",
    tags: ["ecg", "diagnosis", "patterns"],
    isBookmarked: false,
    isPublic: true,
    createdAt: "2024-01-14T15:30:00Z",
    updatedAt: "2024-01-14T15:30:00Z",
    wordCount: 52,
  },
  {
    id: "3",
    title: "Nephrology - Acute Kidney Injury",
    content: "AKI is defined as a rapid decline in kidney function. Causes include prerenal (hypovolemia), renal (ATN), and postrenal (obstruction). Management involves fluid resuscitation, addressing underlying cause, and monitoring electrolytes. Dialysis may be required in severe cases.",
    subject: "nephrology",
    topic: "acute_kidney_injury",
    tags: ["kidney", "emergency", "management"],
    isBookmarked: true,
    isPublic: false,
    createdAt: "2024-01-13T09:15:00Z",
    updatedAt: "2024-01-13T09:15:00Z",
    wordCount: 48,
  },
  {
    id: "4",
    title: "Pharmacology - ACE Inhibitors",
    content: "ACE inhibitors block the conversion of angiotensin I to angiotensin II, reducing vasoconstriction and aldosterone secretion. Common side effects include dry cough, hyperkalemia, and angioedema. Contraindicated in pregnancy due to teratogenic effects.",
    subject: "pharmacology",
    topic: "ace_inhibitors",
    tags: ["pharmacology", "cardiovascular", "side_effects"],
    isBookmarked: false,
    isPublic: true,
    createdAt: "2024-01-12T14:20:00Z",
    updatedAt: "2024-01-12T14:20:00Z",
    wordCount: 42,
  },
  {
    id: "5",
    title: "Hematology - Anemia Classification",
    content: "Anemia can be classified by morphology (microcytic, normocytic, macrocytic) or etiology (blood loss, decreased production, increased destruction). Common causes include iron deficiency (microcytic), B12/folate deficiency (macrocytic), and chronic disease (normocytic).",
    subject: "hematology",
    topic: "anemia",
    tags: ["anemia", "classification", "diagnosis"],
    isBookmarked: false,
    isPublic: false,
    createdAt: "2024-01-11T11:45:00Z",
    updatedAt: "2024-01-11T11:45:00Z",
    wordCount: 38,
  },
];

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>(mockNotes);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isCreating, setIsCreating] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    subject: "",
    topic: "",
    tags: [] as string[],
    isPublic: false,
  });
  const [tagInput, setTagInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [newNote.content, editingNote?.content]);

  const filteredNotes = notes.filter((note) => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSubject = selectedSubject === "all" || note.subject === selectedSubject;
    const matchesTag = selectedTag === "all" || note.tags.includes(selectedTag);
    
    return matchesSearch && matchesSubject && matchesTag;
  });

  const allTags = Array.from(new Set(notes.flatMap(note => note.tags)));

  const handleCreateNote = () => {
    if (newNote.title.trim() && newNote.content.trim()) {
      const note: Note = {
        id: Date.now().toString(),
        title: newNote.title,
        content: newNote.content,
        subject: newNote.subject,
        topic: newNote.topic,
        tags: newNote.tags,
        isBookmarked: false,
        isPublic: newNote.isPublic,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        wordCount: newNote.content.split(/\s+/).length,
      };
      
      setNotes([note, ...notes]);
      setNewNote({
        title: "",
        content: "",
        subject: "",
        topic: "",
        tags: [],
        isPublic: false,
      });
      setIsCreating(false);
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
  };

  const handleSaveEdit = () => {
    if (editingNote) {
      setNotes(notes.map(note => 
        note.id === editingNote.id 
          ? {
              ...editingNote,
              updatedAt: new Date().toISOString(),
              wordCount: editingNote.content.split(/\s+/).length,
            }
          : note
      ));
      setEditingNote(null);
    }
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes(notes.filter(note => note.id !== noteId));
  };

  const handleBookmarkToggle = (noteId: string) => {
    setNotes(notes.map(note => 
      note.id === noteId 
        ? { ...note, isBookmarked: !note.isBookmarked }
        : note
    ));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !newNote.tags.includes(tagInput.trim())) {
      setNewNote({
        ...newNote,
        tags: [...newNote.tags, tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNewNote({
      ...newNote,
      tags: newNote.tags.filter(tag => tag !== tagToRemove),
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Notes</h1>
          <p className="text-muted-foreground mt-2">
            Organize and manage your medical study notes
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Note
          </Button>
          <Button variant="outline">
            <Bookmark className="h-4 w-4 mr-2" />
            Bookmarked ({notes.filter(n => n.isBookmarked).length})
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
                placeholder="Search notes by title, content, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-4">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md bg-white"
              >
                <option value="all">All Subjects</option>
                <option value="cardiology">Cardiology</option>
                <option value="nephrology">Nephrology</option>
                <option value="pharmacology">Pharmacology</option>
                <option value="hematology">Hematology</option>
              </select>

              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md bg-white"
              >
                <option value="all">All Tags</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>

              {/* View Mode Toggle */}
              <div className="flex border border-gray-300 rounded-md">
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
                <p className="text-sm text-muted-foreground">Total Notes</p>
                <p className="text-2xl font-bold">{notes.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bookmarked</p>
                <p className="text-2xl font-bold">
                  {notes.filter(n => n.isBookmarked).length}
                </p>
              </div>
              <Bookmark className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Public Notes</p>
                <p className="text-2xl font-bold">
                  {notes.filter(n => n.isPublic).length}
                </p>
              </div>
              <Share className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Words</p>
                <p className="text-2xl font-bold">
                  {notes.reduce((sum, note) => sum + note.wordCount, 0)}
                </p>
              </div>
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Note Modal */}
      {isCreating && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Create New Note</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Note title..."
              value={newNote.title}
              onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Subject..."
                value={newNote.subject}
                onChange={(e) => setNewNote({ ...newNote, subject: e.target.value })}
              />
              <Input
                placeholder="Topic..."
                value={newNote.topic}
                onChange={(e) => setNewNote({ ...newNote, topic: e.target.value })}
              />
            </div>

            <Textarea
              ref={textareaRef}
              placeholder="Write your note here..."
              value={newNote.content}
              onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
              className="min-h-[200px] resize-none"
            />

            <div className="flex items-center gap-2">
              <Input
                placeholder="Add tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
              />
              <Button onClick={handleAddTag} size="sm">
                <Tag className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {newNote.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleRemoveTag(tag)}
                  />
                </Badge>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newNote.isPublic}
                  onChange={(e) => setNewNote({ ...newNote, isPublic: e.target.checked })}
                />
                <span className="text-sm">Make public</span>
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateNote}>
                <Save className="h-4 w-4 mr-2" />
                Save Note
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Note Modal */}
      {editingNote && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Edit Note</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setEditingNote(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={editingNote.title}
              onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                value={editingNote.subject}
                onChange={(e) => setEditingNote({ ...editingNote, subject: e.target.value })}
              />
              <Input
                value={editingNote.topic}
                onChange={(e) => setEditingNote({ ...editingNote, topic: e.target.value })}
              />
            </div>

            <Textarea
              value={editingNote.content}
              onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
              className="min-h-[200px] resize-none"
            />

            <div className="flex items-center gap-2 flex-wrap">
              {editingNote.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingNote(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => (
            <Card key={note.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg line-clamp-2 mb-2">
                      {note.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(note.updatedAt)}</span>
                      <span>•</span>
                      <span>{note.wordCount} words</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBookmarkToggle(note.id)}
                    >
                      <Star
                        className={`h-4 w-4 ${
                          note.isBookmarked
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-400"
                        }`}
                      />
                    </Button>
                    {note.isPublic && (
                      <Badge variant="outline" className="text-xs">
                        Public
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {note.content}
                </p>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {note.subject}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {note.topic.replace("_", " ")}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    {note.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {note.tags.length > 2 && (
                      <span className="text-xs text-muted-foreground">
                        +{note.tags.length - 2} more
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEditNote(note)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotes.map((note) => (
            <Card key={note.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{note.title}</h3>
                        <p className="text-muted-foreground line-clamp-2 mb-3">
                          {note.content}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Updated {formatDate(note.updatedAt)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            <span>{note.wordCount} words</span>
                          </div>
                          {note.isPublic && (
                            <Badge variant="outline" className="text-xs">
                              Public
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {note.subject}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {note.topic.replace("_", " ")}
                          </Badge>
                          {note.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleBookmarkToggle(note.id)}
                        >
                          <Star
                            className={`h-4 w-4 ${
                              note.isBookmarked
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-400"
                            }`}
                          />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEditNote(note)}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {filteredNotes.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No notes found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search terms or filters, or create your first note.
            </p>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Note
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

