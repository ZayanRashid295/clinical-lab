"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

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
}

// Mock data for tags/subjects
const mockTags: Tag[] = [
  { id: "tag1", name: "Cardiology", count: 245 },
  { id: "tag2", name: "Neurology", count: 189 },
  { id: "tag3", name: "Gastroenterology", count: 156 },
  { id: "tag4", name: "Endocrinology", count: 134 },
  { id: "tag5", name: "Pulmonology", count: 198 },
  { id: "tag6", name: "Nephrology", count: 112 },
  { id: "tag7", name: "Hematology", count: 98 },
  { id: "tag8", name: "Oncology", count: 167 },
];

export function SubjectSelector({
  selectedSubjects,
  onSubjectToggle,
  selectedPool,
}: SubjectSelectorProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API call with mock data
    const fetchTags = async () => {
      try {
        setLoading(true);
        setError(null);
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 300));
        setTags(mockTags);
      } catch (err) {
        console.error("Failed to fetch tags:", err);
        setError("Failed to load tags. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, [selectedPool]);

  return (
    <Card data-testid="card-subjects">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all-subjects"
              checked={(() => {
                if (tags.length === 0) return false;
                const selectedCount = tags.filter((tag) =>
                  selectedSubjects.includes(tag.id)
                ).length;
                if (selectedCount === 0) return false;
                if (selectedCount === tags.length) return true;
                return "indeterminate";
              })()}
              onCheckedChange={(checked) => {
                if (checked) {
                  tags.forEach((tag) => {
                    if (!selectedSubjects.includes(tag.id)) {
                      onSubjectToggle(tag.id);
                    }
                  });
                } else {
                  selectedSubjects.forEach((id) => onSubjectToggle(id));
                }
              }}
            />
            <h3 className="font-semibold text-gray-900 dark:text-gray-200">
              Subjects
            </h3>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Some questions may be shared across shelf subjects.
          </p>

          <ScrollArea className="h-[300px] pr-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Loading tags...
                </p>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            ) : tags.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No tags available
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center space-x-2 py-1"
                  >
                    <Checkbox
                      id={tag.id}
                      checked={selectedSubjects.includes(tag.id)}
                      onCheckedChange={() => onSubjectToggle(tag.id)}
                      data-testid={`checkbox-${tag.id}`}
                    />
                    <Label
                      htmlFor={tag.id}
                      className="cursor-pointer font-normal text-gray-900 dark:text-gray-200"
                    >
                      {tag.name}{" "}
                      <span className="text-blue-600 dark:text-blue-400">
                        ({tag.count})
                      </span>
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}

















