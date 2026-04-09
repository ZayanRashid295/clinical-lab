"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Checkbox } from "@/shared/ui/checkbox";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { ChevronDown, ChevronRight, ChevronUp, Loader2 } from "lucide-react";
import { QuestionsService } from "@/app/services/questions/questions.service";

interface SubtopicItem {
  id: string;
  name: string;
  description?: string;
  order: number;
  count: number;
}

interface TopicItem {
  id: string;
  name: string;
  description?: string;
  order: number;
  count: number;
  subtopics: SubtopicItem[];
}

interface SystemItem {
  id: string;
  name: string;
  description?: string;
  order: number;
  count: number;
  topics: TopicItem[];
}

interface TopicSelectorProps {
  selectedSystems: string[];
  onSystemToggle: (systemId: string) => void;
  selectedPool?: string;
  selectedTopics?: string[];
  selectedSubtopics?: string[];
  isMarked?: boolean;
  onTopicToggle?: (topicId: string) => void;
  onSubtopicToggle?: (subtopicId: string) => void;
}

export function TopicSelector({ 
  selectedSystems, 
  onSystemToggle, 
  selectedPool,
  selectedTopics = [],
  selectedSubtopics = [],
  isMarked,
  onTopicToggle,
  onSubtopicToggle,
}: TopicSelectorProps) {
  const [systems, setSystems] = useState<SystemItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedTopics, setExpandedTopics] = useState<string[]>([]);
  
  const allTopics = useMemo(() => {
    return systems.flatMap(system => system.topics);
  }, [systems]);

  const hasExpanded = expandedTopics.length > 0;

  const toggleExpandAll = () => {
    if (hasExpanded) {
      setExpandedTopics([]);
    } else {
      setExpandedTopics(allTopics.map((t) => t.id));
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        const questionsService = new QuestionsService();
        const pool = selectedPool ? selectedPool as "unused" | "incorrect" | "correct" | "omitted" : undefined;
        const markedParam = isMarked ? true : undefined;
        const data = await questionsService.getTestCreationData({ pool, marked: markedParam });

        setSystems(data.systems);
      } catch (err) {
        console.error("Failed to fetch test creation data:", err);
        setError("Failed to load data. Please try again.");
      }
    };

    fetchData();
  }, [selectedPool, isMarked]);
  
  const handleTopicExpand = (topicId: string) => {
    setExpandedTopics((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId]
    );
  };

  const getSubtopicState = (subtopic: SubtopicItem): boolean => {
    return selectedSubtopics.includes(subtopic.id);
  };

  const getTopicState = (topic: TopicItem): boolean | 'indeterminate' => {
    const enabledSubtopics = topic.subtopics.filter((s) => s.count > 0);
    if (enabledSubtopics.length === 0) {
      return selectedTopics.includes(topic.id);
    }
    
    const selectedSubtopicsCount = enabledSubtopics.filter((s) => selectedSubtopics.includes(s.id)).length;
    
    if (selectedSubtopicsCount === 0) {
      return false;
    } else if (selectedSubtopicsCount === enabledSubtopics.length) {
      return true;
    } else {
      return 'indeterminate';
    }
  };

  const getAllTopicsState = (): boolean | 'indeterminate' => {
    const enabledTopics = allTopics.filter((t) => t.count > 0);
    if (enabledTopics.length === 0) {
      return false;
    }
    
    let fullySelectedCount = 0;
    let partiallySelectedCount = 0;
    let noneSelectedCount = 0;
    
    enabledTopics.forEach((topic) => {
      const topicState = getTopicState(topic);
      if (topicState === true) {
        fullySelectedCount++;
      } else if (topicState === 'indeterminate') {
        partiallySelectedCount++;
      } else {
        noneSelectedCount++;
      }
    });
    
    if (fullySelectedCount === enabledTopics.length) {
      return true;
    } else if (noneSelectedCount === enabledTopics.length) {
      return false;
    } else {
      return 'indeterminate';
    }
  };

  const getParentSystemId = (topicId: string): string | null => {
    for (const system of systems) {
      if (system.topics.some(t => t.id === topicId)) {
        return system.id;
      }
    }
    return null;
  };

  const getParentTopicId = (subtopicId: string): string | null => {
    for (const system of systems) {
      for (const topic of system.topics) {
        if (topic.subtopics.some(s => s.id === subtopicId)) {
          return topic.id;
        }
      }
    }
    return null;
  };

  const handleSubtopicCheck = (subtopicId: string) => {
    if (!onSubtopicToggle) return;
    
    const isSelected = selectedSubtopics.includes(subtopicId);
    onSubtopicToggle(subtopicId);
    
    const newSelected = !isSelected;
    const parentTopicId = getParentTopicId(subtopicId);
    
    if (parentTopicId && onTopicToggle) {
      const topicIsSelected = selectedTopics.includes(parentTopicId);
      
      if (newSelected && !topicIsSelected) {
        onTopicToggle(parentTopicId);
        const parentSystemId = getParentSystemId(parentTopicId);
        if (parentSystemId && !selectedSystems.includes(parentSystemId)) {
          onSystemToggle(parentSystemId);
        }
      } else if (!newSelected) {
        const topic = allTopics.find(t => t.id === parentTopicId);
        if (topic) {
          const hasOtherSelected = topic.subtopics.some(s => s.id !== subtopicId && selectedSubtopics.includes(s.id));
          if (!hasOtherSelected && topicIsSelected) {
            onTopicToggle(parentTopicId);
            const parentSystemId = getParentSystemId(parentTopicId);
            if (parentSystemId) {
              const system = systems.find(s => s.id === parentSystemId);
              if (system && !system.topics.some(t => t.id !== parentTopicId && selectedTopics.includes(t.id))) {
                if (selectedSystems.includes(parentSystemId)) {
                  onSystemToggle(parentSystemId);
                }
              }
            }
          }
        }
      }
    }
  };

  const handleTopicCheck = (topic: TopicItem) => {
    if (!onTopicToggle) return;
    
    const topicIsSelected = selectedTopics.includes(topic.id);
    onTopicToggle(topic.id);
    
    const newSelected = !topicIsSelected;
    const parentSystemId = getParentSystemId(topic.id);
    
    if (parentSystemId) {
      if (newSelected && !selectedSystems.includes(parentSystemId)) {
        onSystemToggle(parentSystemId);
      } else if (!newSelected) {
        const system = systems.find(s => s.id === parentSystemId);
        if (system && !system.topics.some(t => t.id !== topic.id && selectedTopics.includes(t.id))) {
          if (selectedSystems.includes(parentSystemId)) {
            onSystemToggle(parentSystemId);
          }
        }
      }
    }
    
    if (onSubtopicToggle) {
      topic.subtopics.forEach((subtopic) => {
        if (subtopic.count > 0) {
          const isSelected = selectedSubtopics.includes(subtopic.id);
          if (newSelected && !isSelected) {
            onSubtopicToggle(subtopic.id);
          } else if (!newSelected && isSelected) {
            onSubtopicToggle(subtopic.id);
          }
        }
      });
    }
  };

  const handleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked) {
      systems.forEach((system) => {
        if (system.count > 0 && !selectedSystems.includes(system.id)) {
          onSystemToggle(system.id);
        }
      });
      if (onTopicToggle) {
        allTopics.forEach((topic) => {
          if (topic.count > 0 && !selectedTopics.includes(topic.id)) {
            onTopicToggle(topic.id);
          }
        });
      }
      if (onSubtopicToggle) {
        allTopics.forEach((topic) => {
          if (topic.count > 0) {
            topic.subtopics.forEach((subtopic) => {
              if (subtopic.count > 0 && !selectedSubtopics.includes(subtopic.id)) {
                onSubtopicToggle(subtopic.id);
              }
            });
          }
        });
      }
    } else {
      if (onSubtopicToggle) selectedSubtopics.forEach(id => onSubtopicToggle(id));
      if (onTopicToggle) selectedTopics.forEach(id => onTopicToggle(id));
      selectedSystems.forEach((id) => onSystemToggle(id));
    }
  };

  return (
    <div className="flex flex-col h-full" data-testid="card-systems">
      <div className="px-4 py-3 border-b border-border/50 dark:border-gray-700/50 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="flex items-center cursor-pointer">
              <Checkbox id="select-all-topics" checked={getAllTopicsState()} onCheckedChange={handleSelectAll} className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
            </label>
            <div className="flex items-center gap-2 border-l border-border/50 pl-3">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <h3 className="text-sm font-medium text-foreground dark:text-gray-100">Topics</h3>
            </div>
          </div>
          <button 
            onClick={toggleExpandAll}
            className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <span className="font-medium">{hasExpanded ? "-" : "+"}</span>
            <span>{hasExpanded ? "Collapse All" : "Expand All"}</span>
            {hasExpanded ? <ChevronUp className="h-4 w-4 bg-transparent text-gray-400" /> : <ChevronDown className="h-4 w-4 bg-transparent text-gray-400" />}
          </button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3">
          {error ? (
            <p className="text-sm text-destructive dark:text-red-400 text-center py-12">{error}</p>
          ) : allTopics.length === 0 ? (
            <p className="text-sm text-muted-foreground dark:text-gray-400 text-center py-12">No data found</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {allTopics.map((topic) => {
                const parentSystemId = getParentSystemId(topic.id);
                const isSystemSelected = parentSystemId ? selectedSystems.includes(parentSystemId) : false;
                const topicDisabled = topic.count === 0 || !isSystemSelected;
                const topicState = getTopicState(topic);
                const topicExpanded = expandedTopics.includes(topic.id);

                return (
                  <div key={topic.id} className="space-y-0.5">
                    <div
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all border ${
                        topicDisabled
                          ? `opacity-50 dark:opacity-60 border-transparent ${topicExpanded ? 'bg-muted/50 dark:bg-gray-700/30' : ''}`
                          : topicExpanded
                            ? "bg-primary/10 dark:bg-primary/20 border-primary/40 dark:border-primary/30 ring-1 ring-primary/20 dark:ring-primary/30 cursor-pointer"
                            : topicState === true
                              ? "bg-primary/5 dark:bg-primary/10 border-primary/30 dark:border-primary/20 cursor-pointer"
                              : "bg-muted/30 dark:bg-gray-700/20 border-transparent hover:bg-muted/50 dark:hover:bg-gray-700/30 hover:border-border dark:hover:border-gray-700/50 cursor-pointer"
                      }`}
                      onClick={(e) => {
                        if (!topicDisabled) {
                          const target = e.target as HTMLElement;
                          if (target.closest('button') || target.closest('[role="checkbox"]')) {
                            return;
                          }
                          handleTopicCheck(topic);
                        }
                      }}
                    >
                      {onTopicToggle && (
                        <Checkbox
                          id={topic.id}
                          checked={topicState}
                          disabled={topicDisabled}
                          onCheckedChange={() => handleTopicCheck(topic)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <span
                          className={`text-sm block truncate ${(!topicDisabled && (topicState || topicExpanded)) ? "text-foreground dark:text-gray-100 font-medium" : "text-foreground/80 dark:text-gray-300"}`}
                        >
                          {topic.name}
                        </span>
                        <span className="text-[11px] text-muted-foreground dark:text-gray-400">{topic.count} Q&apos;s</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!topicDisabled) handleTopicExpand(topic.id);
                        }}
                        className={`p-1 rounded-md transition-colors ${
                          topicExpanded
                            ? "bg-primary/20 dark:bg-primary/30 text-primary"
                            : "hover:bg-muted dark:hover:bg-gray-700/50 text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-gray-100"
                        }`}
                      >
                        {topicExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                    </div>

                    {topicExpanded && (
                      <div className="ml-6 pl-4 border-l border-border dark:border-gray-700/50 space-y-0.5">
                        {topic.subtopics.map((subtopic) => {
                          const subtopicDisabled = subtopic.count === 0;
                          const subtopicState = getSubtopicState(subtopic);

                          return (
                            <div
                              key={subtopic.id}
                              className={`flex items-center gap-2 px-2 py-1 rounded-md transition-colors ${
                                subtopicDisabled ? "opacity-40" : "hover:bg-muted/50 dark:hover:bg-muted/30"
                              }`}
                            >
                              {onSubtopicToggle && (
                                <Checkbox
                                  id={subtopic.id}
                                  checked={subtopicState}
                                  disabled={subtopicDisabled}
                                  onCheckedChange={() => handleSubtopicCheck(subtopic.id)}
                                  className="h-4 w-4"
                                />
                              )}
                              <span className="flex-1 text-xs text-muted-foreground cursor-pointer">
                                {subtopic.name}
                              </span>
                              <span className="text-xs text-muted-foreground/60 tabular-nums">
                                {subtopic.count}
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
          <span className="font-medium text-foreground dark:text-gray-100">{selectedTopics.length}</span> of {allTopics.length} topics selected
          {selectedSubtopics.length > 0 && <span className="ml-2 text-primary dark:text-blue-400">({selectedSubtopics.length} subtopics)</span>}
        </p>
      </div>
    </div>
  );
}


