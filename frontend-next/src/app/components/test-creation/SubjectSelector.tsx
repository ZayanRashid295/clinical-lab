"use client";

import React, { useState, useEffect } from "react";
import { Checkbox } from "@/shared/ui/checkbox";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { QuestionsService } from "@/app/services/questions/questions.service";
import { Loader2 } from "lucide-react";

interface Tag {
  id: string;
  name: string;
  description?: string;
  color?: string;
  count: number;
}

interface SubjectSelectorProps {
  selectedSubjects: string[];
  onSubjectToggle: (subjectId: string) => void;
  selectedPool?: string;
  isMarked?: boolean;
  refreshTrigger?: number;
}

export function SubjectSelector({ selectedSubjects, onSubjectToggle, selectedPool, isMarked, refreshTrigger }: SubjectSelectorProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        setLoading(true);
        setError(null);
        const questionsService = new QuestionsService();
        // Pass pool directly if it exists, including "unused"
        const pool = selectedPool ? selectedPool as "unused" | "incorrect" | "correct" | "omitted" : undefined;
        // Explicitly pass marked parameter: true when enabled, undefined when disabled (to show all)
        const markedParam = isMarked ? true : undefined;
        const data = await questionsService.getTestCreationData({ pool, marked: markedParam });

        // Use backend data directly - backend handles all filtering logic including marked filter
        // for all question modes (unused, incorrect, correct, omitted)
        setTags(data.tags);
      } catch (err) {
        console.error("Failed to fetch tags:", err);
        setError("Failed to load tags. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, [selectedPool, isMarked, refreshTrigger]);

  // Only consider tags with count > 0 for selection logic
  const selectableTags = tags.filter((tag) => tag.count > 0);
  const allSelected = selectableTags.length > 0 && selectableTags.every((tag) => selectedSubjects.includes(tag.id));
  const someSelected = selectableTags.some((tag) => selectedSubjects.includes(tag.id)) && !allSelected;

  const handleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked) {
      // Only select tags with count > 0
      selectableTags.forEach((tag) => {
        if (!selectedSubjects.includes(tag.id)) onSubjectToggle(tag.id);
      });
    } else {
      tags.forEach((tag) => {
        if (selectedSubjects.includes(tag.id)) onSubjectToggle(tag.id);
      });
    }
  };

  return (
    <div className="flex flex-col h-full" data-testid="card-subjects">
      <div className="px-4 py-3 border-b border-border/50 dark:border-gray-700/50 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <h3 className="text-sm font-medium text-foreground dark:text-gray-100">Subjects</h3>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs text-muted-foreground dark:text-gray-400">All</span>
            <Checkbox
              id="select-all-subjects"
              checked={allSelected ? true : someSelected ? "indeterminate" : false}
              onCheckedChange={handleSelectAll}
              className="h-4 w-4"
            />
          </label>
        </div>
          </div>

      <ScrollArea className="flex-1">
        <div className="py-1">
            {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground dark:text-gray-400" />
              </div>
            ) : error ? (
            <p className="text-sm text-destructive text-center py-12">{error}</p>
          ) : (
            <div className="space-y-0">
              {tags.map((tag) => {
                const isSelected = selectedSubjects.includes(tag.id);
                const isDisabled = tag.count === 0;
                return (
                  <label
                    key={tag.id}
                    htmlFor={tag.id}
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                      isSelected ? "bg-primary/5 dark:bg-primary/10" : "hover:bg-accent dark:hover:bg-accent/50"
                    } ${isDisabled ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                      <Checkbox
                        id={tag.id}
                      checked={isSelected}
                      disabled={isDisabled}
                      onCheckedChange={() => {
                        if (!isDisabled) {
                          onSubjectToggle(tag.id);
                        }
                      }}
                        data-testid={`checkbox-${tag.id}`}
                      className="h-4 w-4"
                      />
                    <span
                      className={`text-sm flex-1 ${isSelected ? "text-foreground dark:text-gray-100 font-medium" : "text-foreground/80 dark:text-gray-300"}`}
                    >
                      {tag.name}
                    </span>
                    <span className="text-xs text-muted-foreground dark:text-gray-400 tabular-nums">{tag.count}</span>
                  </label>
                );
              })}
              </div>
            )}
        </div>
      </ScrollArea>

      <div className="px-4 py-2.5 border-t border-border/50 dark:border-gray-700/50 shrink-0 bg-muted/30 dark:bg-gray-700/30">
        <p className="text-xs text-muted-foreground dark:text-gray-400">
          <span className="font-medium text-foreground dark:text-gray-100">{selectedSubjects.length}</span> of {tags.length} selected
        </p>
      </div>
    </div>
  );
}

