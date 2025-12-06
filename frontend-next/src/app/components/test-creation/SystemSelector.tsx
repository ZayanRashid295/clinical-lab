"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Checkbox } from "@/shared/ui/checkbox";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { QuestionsService } from "@/app/services/questions/questions.service";

interface Topic {
  id: string;
  name: string;
  description?: string;
  order: number;
  count: number;
  countsByTag: Record<string, number>;
}

interface Subject {
  id: string;
  name: string;
  description?: string;
  order: number;
  count: number;
  countsByTag: Record<string, number>;
  topics: Topic[];
}

interface System {
  id: string;
  name: string;
  description?: string;
  order: number;
  count: number;
  countsByTag: Record<string, number>;
  subjects: Subject[];
}

interface SystemSelectorProps {
  selectedSystems: string[];
  onSystemToggle: (systemId: string) => void;
  selectedTags?: string[];
  selectedPool?: string;
  selectedSubjects?: string[];
  selectedTopics?: string[];
  isMarked?: boolean;
  onSubjectToggle?: (subjectId: string) => void;
  onTopicToggle?: (topicId: string) => void;
  refreshTrigger?: number;
}

export function SystemSelector({ 
  selectedSystems, 
  onSystemToggle, 
  selectedTags = [],
  selectedPool,
  selectedSubjects = [],
  selectedTopics = [],
  isMarked,
  onSubjectToggle,
  onTopicToggle,
  refreshTrigger,
}: SystemSelectorProps) {
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSubjects, setExpandedSubjects] = useState<string[]>([]);
  
  // Flatten all subjects from all systems into a single array
  // Use useMemo to ensure it updates when systems change
  const allSubjects = useMemo(() => {
    return systems.flatMap(system => system.subjects);
  }, [systems]);

  // Helper function to calculate filtered count based on selected tags
  // Note: When multiple tags are selected, this sums the counts which may slightly overcount
  // questions that have multiple selected tags (since they appear in multiple countsByTag entries)
  // For exact counts, a backend query with tag combinations would be needed
  const getFilteredCount = (countsByTag: Record<string, number>, totalCount: number): number => {
    if (selectedTags.length === 0) {
      // If no tags selected, show 0 (everything is disabled)
      return 0;
    }
    
    // Sum counts for all selected tags
    // This gives an upper bound - questions with multiple selected tags may be counted multiple times
    let filteredCount = 0;
    selectedTags.forEach((tagId) => {
      if (countsByTag[tagId]) {
        filteredCount += countsByTag[tagId];
      }
    });
    
    return filteredCount;
  };

  // Check if a system/subject/topic should be disabled (no tags selected or no questions for selected tags)
  const isDisabled = (countsByTag: Record<string, number>): boolean => {
    if (selectedTags.length === 0) {
      return true;
    }
    // Check if any selected tag has questions
    return !selectedTags.some((tagId) => countsByTag[tagId] && countsByTag[tagId] > 0);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const questionsService = new QuestionsService();
        // Pass pool directly if it exists, including "unused"
        const pool = selectedPool ? selectedPool as "unused" | "incorrect" | "correct" | "omitted" : undefined;
        // Explicitly pass marked parameter: true when enabled, undefined when disabled (to show all)
        const markedParam = isMarked ? true : undefined;
        console.log(`📊 SystemSelector - Fetching with pool=${pool}, marked=${markedParam}, isMarked=${isMarked}`);
        const data = await questionsService.getTestCreationData({ pool, marked: markedParam });
        console.log(`📊 SystemSelector - Received systems:`, data.systems.map(s => ({ name: s.name, count: s.count })));

        // Use backend data directly - backend handles all filtering logic including marked filter
        // for all question modes (unused, incorrect, correct, omitted)
        setSystems(data.systems);
      } catch (err) {
        console.error("Failed to fetch systems:", err);
        setError("Failed to load systems. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedPool, isMarked, refreshTrigger]);
  
  // Force re-render when selectedTags change to update filtered counts
  // Note: We don't refetch data because countsByTag already contains all tag counts
  // The filtering happens client-side in getFilteredCount

  const handleSubjectExpand = (subjectId: string) => {
    setExpandedSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  // Helper function to calculate checkbox state: true (fully selected), false (none selected), 'indeterminate' (partially selected)
  const getTopicState = (topic: Topic): boolean | 'indeterminate' => {
    if (isDisabled(topic.countsByTag)) {
      return false;
    }
    return selectedTopics.includes(topic.id);
  };

  const getSubjectState = (subject: Subject): boolean | 'indeterminate' => {
    if (isDisabled(subject.countsByTag)) {
      return false;
    }
    
    const enabledTopics = subject.topics.filter((t) => !isDisabled(t.countsByTag));
    if (enabledTopics.length === 0) {
      // If no enabled topics, check if subject itself is selected
      return selectedSubjects.includes(subject.id);
    }
    
    const selectedTopicsCount = enabledTopics.filter((t) => selectedTopics.includes(t.id)).length;
    
    if (selectedTopicsCount === 0) {
      return false; // None selected
    } else if (selectedTopicsCount === enabledTopics.length) {
      return true; // All selected
    } else {
      return 'indeterminate'; // Partially selected
    }
  };

  const getAllSubjectsState = (): boolean | 'indeterminate' => {
    const enabledSubjects = allSubjects.filter((s) => !isDisabled(s.countsByTag));
    if (enabledSubjects.length === 0) {
      return false;
    }
    
    let fullySelectedCount = 0;
    let partiallySelectedCount = 0;
    let noneSelectedCount = 0;
    
    enabledSubjects.forEach((subject) => {
      const subjectState = getSubjectState(subject);
      if (subjectState === true) {
        fullySelectedCount++;
      } else if (subjectState === 'indeterminate') {
        partiallySelectedCount++;
      } else {
        noneSelectedCount++;
      }
    });
    
    if (fullySelectedCount === enabledSubjects.length) {
      return true; // All subjects fully selected
    } else if (noneSelectedCount === enabledSubjects.length) {
      return false; // No subjects selected
    } else {
      return 'indeterminate'; // Some subjects selected
    }
  };

  // Helper to find parent system for a subject
  const getParentSystemId = (subjectId: string): string | null => {
    for (const system of systems) {
      if (system.subjects.some(s => s.id === subjectId)) {
        return system.id;
      }
    }
    return null;
  };

  // Helper to find parent subject for a topic
  const getParentSubjectId = (topicId: string): string | null => {
    for (const system of systems) {
      for (const subject of system.subjects) {
        if (subject.topics.some(t => t.id === topicId)) {
          return subject.id;
        }
      }
    }
    return null;
  };

  const handleTopicCheck = (topicId: string) => {
    if (!onTopicToggle) return;
    
    const topicIsSelected = selectedTopics.includes(topicId);
    const shouldSelect = !topicIsSelected;
    
    // Toggle topic first
    onTopicToggle(topicId);
    
    // Automatically select/deselect parent subject and system for backend compatibility
    // Use the NEW state (after toggle) for checks
    const newTopicSelected = !topicIsSelected;
    const parentSubjectId = getParentSubjectId(topicId);
    
    if (parentSubjectId && onSubjectToggle) {
      // Check current state (before our toggle, but after topic toggle)
      const subjectIsSelected = selectedSubjects.includes(parentSubjectId);
      
      if (newTopicSelected && !subjectIsSelected) {
        // Topic is now selected, so select parent subject
        onSubjectToggle(parentSubjectId);
        
        // Also select parent system
        const parentSystemId = getParentSystemId(parentSubjectId);
        if (parentSystemId) {
          const systemIsSelected = selectedSystems.includes(parentSystemId);
          if (!systemIsSelected) {
            onSystemToggle(parentSystemId);
          }
        }
      } else if (!newTopicSelected) {
        // Topic is now deselected, check if we should deselect parent
        const subject = allSubjects.find(s => s.id === parentSubjectId);
        if (subject) {
          // Check if any other topics in this subject are still selected
          // Note: We need to account for the topic we just toggled
          const hasOtherSelectedTopics = subject.topics.some(
            t => t.id !== topicId && selectedTopics.includes(t.id)
          );
          
          if (!hasOtherSelectedTopics && subjectIsSelected) {
            // No other topics selected, deselect subject
            onSubjectToggle(parentSubjectId);
            
            // Check if any other subjects in the parent system are selected
            const parentSystemId = getParentSystemId(parentSubjectId);
            if (parentSystemId) {
              const system = systems.find(s => s.id === parentSystemId);
              if (system) {
                const hasOtherSelectedSubjects = system.subjects.some(
                  s => s.id !== parentSubjectId && selectedSubjects.includes(s.id)
                );
                if (!hasOtherSelectedSubjects) {
                  const systemIsSelected = selectedSystems.includes(parentSystemId);
                  if (systemIsSelected) {
                    onSystemToggle(parentSystemId);
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  const handleSubjectCheck = (subject: Subject) => {
    if (!onSubjectToggle) return;
    
    // Get current state BEFORE toggling
    const currentState = getSubjectState(subject);
    const subjectIsCurrentlySelected = selectedSubjects.includes(subject.id);
    const shouldSelect = currentState !== true;
    
    // Toggle subject first
    onSubjectToggle(subject.id);
    
    // Now determine the new state after toggle
    const newSubjectSelected = !subjectIsCurrentlySelected;
    
    // Automatically select/deselect parent system for backend compatibility
    const parentSystemId = getParentSystemId(subject.id);
    if (parentSystemId) {
      const systemIsSelected = selectedSystems.includes(parentSystemId);
      
      if (newSubjectSelected && !systemIsSelected) {
        // Subject is now selected, so select parent system
        onSystemToggle(parentSystemId);
      } else if (!newSubjectSelected) {
        // Subject is now deselected, check if we should deselect parent system
        const system = systems.find(s => s.id === parentSystemId);
        if (system) {
          // Check if any other subjects in this system are still selected
          const hasOtherSelectedSubjects = system.subjects.some(
            s => s.id !== subject.id && selectedSubjects.includes(s.id)
          );
          
          if (!hasOtherSelectedSubjects && systemIsSelected) {
            // No other subjects selected, deselect system
            onSystemToggle(parentSystemId);
          }
        }
      }
    }
    
    // Handle topic selection/deselection based on the NEW state
    if (onTopicToggle) {
      subject.topics.forEach((topic) => {
        if (!isDisabled(topic.countsByTag)) {
          const topicIsSelected = selectedTopics.includes(topic.id);
          
          // Only toggle if the topic state doesn't match the desired subject state
          if (newSubjectSelected && !topicIsSelected) {
            // Subject is now selected, but topic is not - select it
            onTopicToggle(topic.id);
          } else if (!newSubjectSelected && topicIsSelected) {
            // Subject is now deselected, but topic is still selected - deselect it
            onTopicToggle(topic.id);
          }
          // If states already match (both selected or both deselected), do nothing
        }
      });
    }
  };

  const handleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked) {
      // Select all systems (for backend compatibility)
      systems.forEach((system) => {
        if (!isDisabled(system.countsByTag) && !selectedSystems.includes(system.id)) {
          onSystemToggle(system.id);
        }
      });
      // Select all subjects and topics
      if (onSubjectToggle) {
        allSubjects.forEach((subject) => {
          if (!isDisabled(subject.countsByTag) && !selectedSubjects.includes(subject.id)) {
            onSubjectToggle(subject.id);
          }
        });
      }
      if (onTopicToggle) {
        allSubjects.forEach((subject) => {
          if (!isDisabled(subject.countsByTag)) {
            subject.topics.forEach((topic) => {
              if (!isDisabled(topic.countsByTag) && !selectedTopics.includes(topic.id)) {
                onTopicToggle(topic.id);
              }
            });
          }
        });
      }
    } else {
      // Deselect all
      const subjectsToDeselect: string[] = [];
      const topicsToDeselect: string[] = [];
      allSubjects.forEach((subject) => {
        if (!isDisabled(subject.countsByTag) && selectedSubjects.includes(subject.id)) {
          subjectsToDeselect.push(subject.id);
        }
        subject.topics.forEach((topic) => {
          if (!isDisabled(topic.countsByTag) && selectedTopics.includes(topic.id)) {
            topicsToDeselect.push(topic.id);
          }
        });
      });
      if (onTopicToggle) topicsToDeselect.forEach((topicId) => onTopicToggle(topicId));
      if (onSubjectToggle) subjectsToDeselect.forEach((subjectId) => onSubjectToggle(subjectId));
      // Deselect all systems
      selectedSystems.forEach((id) => onSystemToggle(id));
    }
  };

  return (
    <div className="flex flex-col h-full" data-testid="card-systems">
      <div className="px-4 py-3 border-b border-border/50 dark:border-gray-700/50 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <h3 className="text-sm font-medium text-foreground dark:text-gray-100">Chapters</h3>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs text-muted-foreground dark:text-gray-400">All</span>
            <Checkbox id="select-all-subjects" checked={getAllSubjectsState()} onCheckedChange={handleSelectAll} className="h-4 w-4" />
          </label>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground dark:text-gray-400" />
            </div>
          ) : error ? (
            <p className="text-sm text-destructive dark:text-red-400 text-center py-12">{error}</p>
          ) : allSubjects.length === 0 ? (
            <p className="text-sm text-muted-foreground dark:text-gray-400 text-center py-12">No chapters found</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {allSubjects.map((subject) => {
                const subjectDisabled = isDisabled(subject.countsByTag);
                const subjectState = getSubjectState(subject);
                const subjectExpanded = expandedSubjects.includes(subject.id);
                // Calculate count - this will update when selectedTags changes
                const subjectCount = getFilteredCount(subject.countsByTag, subject.count);

                return (
                  <div key={subject.id} className="space-y-0.5">
                    <div
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all border ${
                        subjectExpanded
                          ? "bg-primary/10 dark:bg-primary/20 border-primary/40 dark:border-primary/30 ring-1 ring-primary/20 dark:ring-primary/30"
                          : subjectDisabled
                            ? "opacity-50 dark:opacity-60 border-transparent"
                            : subjectState === true
                              ? "bg-primary/5 dark:bg-primary/10 border-primary/30 dark:border-primary/20"
                              : "bg-muted/30 dark:bg-gray-700/20 border-transparent hover:bg-muted/50 dark:hover:bg-gray-700/30 hover:border-border dark:hover:border-gray-700/50"
                      }`}
                      onClick={(e) => {
                        if (!subjectDisabled) {
                          // If clicking on the expand button or checkbox, don't toggle
                          const target = e.target as HTMLElement;
                          if (target.closest('button') || target.closest('[role="checkbox"]')) {
                            return;
                          }
                          // Toggle subject selection when clicking the row
                          handleSubjectCheck(subject);
                        }
                      }}
                    >
                      {onSubjectToggle && (
                        <Checkbox
                          id={subject.id}
                          checked={subjectState}
                          disabled={subjectDisabled}
                          onCheckedChange={() => handleSubjectCheck(subject)}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          className="h-4 w-4 shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <span
                          className={`text-sm block truncate ${subjectState || subjectExpanded ? "text-foreground dark:text-gray-100 font-medium" : "text-foreground/80 dark:text-gray-300"}`}
                        >
                          {subject.name}
                        </span>
                        <span className="text-[11px] text-muted-foreground dark:text-gray-400">{subjectCount} Q's</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!subjectDisabled) handleSubjectExpand(subject.id);
                        }}
                        className={`p-1 rounded-md transition-colors ${
                          subjectExpanded
                            ? "bg-primary/20 dark:bg-primary/30 text-primary"
                            : "hover:bg-muted dark:hover:bg-gray-700/50 text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-gray-100"
                        }`}
                      >
                        {subjectExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                    </div>

                    {subjectExpanded && (
                      <div className="ml-6 pl-4 border-l border-border dark:border-gray-700/50 space-y-0.5">
                        {subject.topics.map((topic) => {
                          const topicDisabled = isDisabled(topic.countsByTag);
                          const topicState = getTopicState(topic);
                          // Calculate count - this will update when selectedTags changes
                          const topicCount = getFilteredCount(topic.countsByTag, topic.count);

                          return (
                            <div
                              key={topic.id}
                              className={`flex items-center gap-2 px-2 py-1 rounded-md transition-colors ${
                                topicDisabled ? "opacity-40" : "hover:bg-muted/50 dark:hover:bg-muted/30"
                              }`}
                            >
                              {onTopicToggle && (
                                <Checkbox
                                  id={topic.id}
                                  checked={topicState}
                                  disabled={topicDisabled}
                                  onCheckedChange={() => handleTopicCheck(topic.id)}
                                  className="h-4 w-4"
                                />
                              )}
                              <span className="flex-1 text-xs text-muted-foreground cursor-pointer">
                                {topic.name}
                              </span>
                              <span className="text-xs text-muted-foreground/60 tabular-nums">
                                {topicCount}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="px-4 py-2.5 border-t border-border/50 dark:border-gray-700/50 shrink-0 bg-muted/30 dark:bg-gray-700/30">
        <p className="text-xs text-muted-foreground dark:text-gray-400">
          <span className="font-medium text-foreground dark:text-gray-100">{selectedSubjects.length}</span> of {allSubjects.length} chapters
          selected
          {selectedTopics.length > 0 && <span className="ml-2 text-primary dark:text-blue-400">({selectedTopics.length} topics)</span>}
        </p>
      </div>
    </div>
  );
}

