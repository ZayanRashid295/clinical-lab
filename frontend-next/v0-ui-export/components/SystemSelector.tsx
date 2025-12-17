"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronRight } from "lucide-react";

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
  onSubjectToggle?: (subjectId: string) => void;
  onTopicToggle?: (topicId: string) => void;
}

// Mock data for systems
const mockSystems: System[] = [
  {
    id: "system1",
    name: "Cardiovascular System",
    order: 1,
    count: 245,
    countsByTag: { tag1: 245, tag2: 0, tag3: 0 },
    subjects: [
      {
        id: "subject1",
        name: "Heart Failure",
        order: 1,
        count: 89,
        countsByTag: { tag1: 89 },
        topics: [
          {
            id: "topic1",
            name: "Acute Heart Failure",
            order: 1,
            count: 34,
            countsByTag: { tag1: 34 },
          },
          {
            id: "topic2",
            name: "Chronic Heart Failure",
            order: 2,
            count: 55,
            countsByTag: { tag1: 55 },
          },
        ],
      },
      {
        id: "subject2",
        name: "Arrhythmias",
        order: 2,
        count: 156,
        countsByTag: { tag1: 156 },
        topics: [
          {
            id: "topic3",
            name: "Atrial Fibrillation",
            order: 1,
            count: 78,
            countsByTag: { tag1: 78 },
          },
          {
            id: "topic4",
            name: "Ventricular Tachycardia",
            order: 2,
            count: 78,
            countsByTag: { tag1: 78 },
          },
        ],
      },
    ],
  },
  {
    id: "system2",
    name: "Nervous System",
    order: 2,
    count: 189,
    countsByTag: { tag2: 189, tag1: 0 },
    subjects: [
      {
        id: "subject3",
        name: "Stroke",
        order: 1,
        count: 67,
        countsByTag: { tag2: 67 },
        topics: [
          {
            id: "topic5",
            name: "Ischemic Stroke",
            order: 1,
            count: 45,
            countsByTag: { tag2: 45 },
          },
          {
            id: "topic6",
            name: "Hemorrhagic Stroke",
            order: 2,
            count: 22,
            countsByTag: { tag2: 22 },
          },
        ],
      },
      {
        id: "subject4",
        name: "Epilepsy",
        order: 2,
        count: 122,
        countsByTag: { tag2: 122 },
        topics: [
          {
            id: "topic7",
            name: "Focal Seizures",
            order: 1,
            count: 89,
            countsByTag: { tag2: 89 },
          },
          {
            id: "topic8",
            name: "Generalized Seizures",
            order: 2,
            count: 33,
            countsByTag: { tag2: 33 },
          },
        ],
      },
    ],
  },
  {
    id: "system3",
    name: "Gastrointestinal System",
    order: 3,
    count: 156,
    countsByTag: { tag3: 156 },
    subjects: [
      {
        id: "subject5",
        name: "Liver Disease",
        order: 1,
        count: 98,
        countsByTag: { tag3: 98 },
        topics: [
          {
            id: "topic9",
            name: "Hepatitis",
            order: 1,
            count: 56,
            countsByTag: { tag3: 56 },
          },
          {
            id: "topic10",
            name: "Cirrhosis",
            order: 2,
            count: 42,
            countsByTag: { tag3: 42 },
          },
        ],
      },
    ],
  },
];

export function SystemSelector({
  selectedSystems,
  onSystemToggle,
  selectedTags = [],
  selectedPool,
  selectedSubjects = [],
  selectedTopics = [],
  onSubjectToggle,
  onTopicToggle,
}: SystemSelectorProps) {
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSystems, setExpandedSystems] = useState<string[]>([]);
  const [expandedSubjects, setExpandedSubjects] = useState<
    Record<string, string[]>
  >({});

  const getFilteredCount = (
    countsByTag: Record<string, number>,
    totalCount: number
  ): number => {
    if (selectedTags.length === 0) {
      return 0;
    }

    let filteredCount = 0;
    selectedTags.forEach((tagId) => {
      if (countsByTag[tagId]) {
        filteredCount += countsByTag[tagId];
      }
    });

    return filteredCount;
  };

  const isDisabled = (countsByTag: Record<string, number>): boolean => {
    if (selectedTags.length === 0) {
      return true;
    }
    return !selectedTags.some(
      (tagId) => countsByTag[tagId] && countsByTag[tagId] > 0
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 300));
        setSystems(mockSystems);
      } catch (err) {
        console.error("Failed to fetch systems:", err);
        setError("Failed to load systems. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedPool]);

  const handleSystemExpand = (systemId: string) => {
    setExpandedSystems((prev) =>
      prev.includes(systemId)
        ? prev.filter((id) => id !== systemId)
        : [...prev, systemId]
    );
  };

  const handleSubjectExpand = (systemId: string, subjectId: string) => {
    setExpandedSubjects((prev) => {
      const systemSubjects = prev[systemId] || [];
      return {
        ...prev,
        [systemId]: systemSubjects.includes(subjectId)
          ? systemSubjects.filter((id) => id !== subjectId)
          : [...systemSubjects, subjectId],
      };
    });
  };

  const handleExpandAll = () => {
    if (expandedSystems.length === systems.length) {
      setExpandedSystems([]);
      setExpandedSubjects({});
    } else {
      setExpandedSystems(systems.map((s) => s.id));
      const allSubjects: Record<string, string[]> = {};
      systems.forEach((system) => {
        allSubjects[system.id] = system.subjects.map((s) => s.id);
      });
      setExpandedSubjects(allSubjects);
    }
  };

  const getTopicState = (topic: Topic): boolean | "indeterminate" => {
    if (isDisabled(topic.countsByTag)) {
      return false;
    }
    return selectedTopics.includes(topic.id);
  };

  const getSubjectState = (subject: Subject): boolean | "indeterminate" => {
    if (isDisabled(subject.countsByTag)) {
      return false;
    }

    const enabledTopics = subject.topics.filter(
      (t) => !isDisabled(t.countsByTag)
    );
    if (enabledTopics.length === 0) {
      return selectedSubjects.includes(subject.id);
    }

    const selectedTopicsCount = enabledTopics.filter((t) =>
      selectedTopics.includes(t.id)
    ).length;

    if (selectedTopicsCount === 0) {
      return false;
    } else if (selectedTopicsCount === enabledTopics.length) {
      return true;
    } else {
      return "indeterminate";
    }
  };

  const getSystemState = (system: System): boolean | "indeterminate" => {
    if (isDisabled(system.countsByTag)) {
      return false;
    }

    const enabledSubjects = system.subjects.filter(
      (s) => !isDisabled(s.countsByTag)
    );
    if (enabledSubjects.length === 0) {
      return selectedSystems.includes(system.id);
    }

    let fullySelectedCount = 0;
    let partiallySelectedCount = 0;
    let noneSelectedCount = 0;

    enabledSubjects.forEach((subject) => {
      const subjectState = getSubjectState(subject);
      if (subjectState === true) {
        fullySelectedCount++;
      } else if (subjectState === "indeterminate") {
        partiallySelectedCount++;
      } else {
        noneSelectedCount++;
      }
    });

    if (fullySelectedCount === enabledSubjects.length) {
      return true;
    } else if (noneSelectedCount === enabledSubjects.length) {
      return false;
    } else {
      return "indeterminate";
    }
  };

  const getAllSystemsState = (): boolean | "indeterminate" => {
    const enabledSystems = systems.filter((s) => !isDisabled(s.countsByTag));
    if (enabledSystems.length === 0) {
      return false;
    }

    let fullySelectedCount = 0;
    let partiallySelectedCount = 0;
    let noneSelectedCount = 0;

    enabledSystems.forEach((system) => {
      const systemState = getSystemState(system);
      if (systemState === true) {
        fullySelectedCount++;
      } else if (systemState === "indeterminate") {
        partiallySelectedCount++;
      } else {
        noneSelectedCount++;
      }
    });

    if (fullySelectedCount === enabledSystems.length) {
      return true;
    } else if (noneSelectedCount === enabledSystems.length) {
      return false;
    } else {
      return "indeterminate";
    }
  };

  if (loading) {
    return (
      <Card data-testid="card-systems">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Loading systems...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card data-testid="card-systems">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-systems">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all-systems"
                checked={getAllSystemsState()}
                onCheckedChange={(checked) => {
                  if (checked) {
                    systems.forEach((system) => {
                      if (!isDisabled(system.countsByTag)) {
                        if (!selectedSystems.includes(system.id)) {
                          onSystemToggle(system.id);
                        }

                        if (onSubjectToggle) {
                          system.subjects.forEach((subject) => {
                            if (
                              !isDisabled(subject.countsByTag) &&
                              !selectedSubjects.includes(subject.id)
                            ) {
                              onSubjectToggle(subject.id);
                            }
                          });
                        }

                        if (onTopicToggle) {
                          system.subjects.forEach((subject) => {
                            if (!isDisabled(subject.countsByTag)) {
                              subject.topics.forEach((topic) => {
                                if (
                                  !isDisabled(topic.countsByTag) &&
                                  !selectedTopics.includes(topic.id)
                                ) {
                                  onTopicToggle(topic.id);
                                }
                              });
                            }
                          });
                        }
                      }
                    });
                  } else {
                    const subjectsToDeselect: string[] = [];
                    const topicsToDeselect: string[] = [];

                    systems.forEach((system) => {
                      if (
                        !isDisabled(system.countsByTag) &&
                        selectedSystems.includes(system.id)
                      ) {
                        system.subjects.forEach((subject) => {
                          if (
                            !isDisabled(subject.countsByTag) &&
                            selectedSubjects.includes(subject.id)
                          ) {
                            subjectsToDeselect.push(subject.id);
                          }

                          subject.topics.forEach((topic) => {
                            if (
                              !isDisabled(topic.countsByTag) &&
                              selectedTopics.includes(topic.id)
                            ) {
                              topicsToDeselect.push(topic.id);
                            }
                          });
                        });
                      }
                    });

                    if (onTopicToggle) {
                      topicsToDeselect.forEach((topicId) =>
                        onTopicToggle(topicId)
                      );
                    }

                    if (onSubjectToggle) {
                      subjectsToDeselect.forEach((subjectId) =>
                        onSubjectToggle(subjectId)
                      );
                    }

                    selectedSystems.forEach((id) => onSystemToggle(id));
                  }
                }}
              />
              <h3 className="font-semibold text-gray-900 dark:text-gray-200">
                Systems
              </h3>
            </div>
            <button
              onClick={handleExpandAll}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              data-testid="button-expand-all"
            >
              {expandedSystems.length === systems.length && systems.length > 0
                ? "Collapse All"
                : "+ Expand All"}
            </button>
          </div>

          <ScrollArea className="h-[400px] pr-4">
            {systems.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No systems available
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {systems.map((system) => (
                  <div
                    key={system.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg px-3"
                  >
                    <div
                      className={`flex items-center justify-between py-3 transition-colors ${
                        isDisabled(system.countsByTag)
                          ? "opacity-60 cursor-not-allowed"
                          : "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      }`}
                      onClick={() =>
                        !isDisabled(system.countsByTag) &&
                        handleSystemExpand(system.id)
                      }
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <Checkbox
                          id={system.id}
                          checked={getSystemState(system)}
                          disabled={isDisabled(system.countsByTag)}
                          onCheckedChange={(checked) => {
                            onSystemToggle(system.id);

                            if (
                              !isDisabled(system.countsByTag) &&
                              onSubjectToggle &&
                              onTopicToggle
                            ) {
                              system.subjects.forEach((subject) => {
                                if (!isDisabled(subject.countsByTag)) {
                                  const subjectIsSelected =
                                    selectedSubjects.includes(subject.id);

                                  if (checked !== subjectIsSelected) {
                                    onSubjectToggle(subject.id);
                                  }

                                  subject.topics.forEach((topic) => {
                                    if (!isDisabled(topic.countsByTag)) {
                                      const topicIsSelected =
                                        selectedTopics.includes(topic.id);

                                      if (checked !== topicIsSelected) {
                                        onTopicToggle(topic.id);
                                      }
                                    }
                                  });
                                }
                              });
                            }
                          }}
                          data-testid={`checkbox-${system.id}`}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Label
                          htmlFor={system.id}
                          className={`cursor-pointer font-medium text-sm flex-1 ${
                            isDisabled(system.countsByTag)
                              ? "text-gray-500 dark:text-gray-400 cursor-not-allowed"
                              : "text-gray-900 dark:text-gray-200"
                          }`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {system.name}{" "}
                          <span className="text-blue-600 dark:text-blue-400">
                            ({getFilteredCount(system.countsByTag, system.count)})
                          </span>
                        </Label>
                        {expandedSystems.includes(system.id) ? (
                          <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        )}
                      </div>
                    </div>

                    {expandedSystems.includes(system.id) && (
                      <div className="pb-3 space-y-2 pl-6">
                        {system.subjects.length === 0 ? (
                          <p className="text-xs text-gray-500 dark:text-gray-400 py-2">
                            No subjects available
                          </p>
                        ) : (
                          system.subjects.map((subject) => {
                            const subjectDisabled = isDisabled(
                              subject.countsByTag
                            );
                            return (
                              <div key={subject.id} className="space-y-1">
                                <div
                                  className={`flex items-center justify-between p-2 rounded-md transition-colors ${
                                    subjectDisabled
                                      ? "opacity-60 cursor-not-allowed"
                                      : "hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                                  }`}
                                  onClick={() =>
                                    !subjectDisabled &&
                                    handleSubjectExpand(system.id, subject.id)
                                  }
                                >
                                  <div className="flex items-center space-x-2 flex-1">
                                    {onSubjectToggle && (
                                      <Checkbox
                                        id={subject.id}
                                        checked={getSubjectState(subject)}
                                        disabled={subjectDisabled}
                                        onCheckedChange={(checked) => {
                                          const currentState =
                                            getSubjectState(subject);
                                          const shouldSelect =
                                            currentState !== true;

                                          onSubjectToggle(subject.id);

                                          if (onTopicToggle) {
                                            subject.topics.forEach((topic) => {
                                              if (
                                                !isDisabled(topic.countsByTag)
                                              ) {
                                                const topicIsSelected =
                                                  selectedTopics.includes(
                                                    topic.id
                                                  );
                                                if (
                                                  shouldSelect &&
                                                  !topicIsSelected
                                                ) {
                                                  onTopicToggle(topic.id);
                                                } else if (
                                                  !shouldSelect &&
                                                  topicIsSelected
                                                ) {
                                                  onTopicToggle(topic.id);
                                                }
                                              }
                                            });
                                          }
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    )}
                                    {expandedSubjects[system.id]?.includes(
                                      subject.id
                                    ) ? (
                                      <ChevronDown className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                                    ) : (
                                      <ChevronRight className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                                    )}
                                    <Label
                                      className={`cursor-pointer font-normal text-xs flex-1 ${
                                        subjectDisabled
                                          ? "text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                          : "text-gray-700 dark:text-gray-300"
                                      }`}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {subject.name}{" "}
                                      <span className="text-blue-600 dark:text-blue-400">
                                        (
                                        {getFilteredCount(
                                          subject.countsByTag,
                                          subject.count
                                        )}
                                        )
                                      </span>
                                    </Label>
                                  </div>
                                </div>

                                {expandedSubjects[system.id]?.includes(
                                  subject.id
                                ) && (
                                  <div className="pl-4 space-y-1">
                                    {subject.topics.length === 0 ? (
                                      <p className="text-xs text-gray-500 dark:text-gray-400 py-1 pl-2">
                                        No topics available
                                      </p>
                                    ) : (
                                      subject.topics.map((topic) => {
                                        const topicDisabled = isDisabled(
                                          topic.countsByTag
                                        );
                                        return (
                                          <div
                                            key={topic.id}
                                            className={`flex items-center justify-between p-1.5 rounded-md transition-colors ${
                                              topicDisabled
                                                ? "opacity-60"
                                                : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                            }`}
                                          >
                                            {onTopicToggle && (
                                              <Checkbox
                                                id={topic.id}
                                                checked={getTopicState(topic)}
                                                disabled={topicDisabled}
                                                onCheckedChange={() => {
                                                  onTopicToggle(topic.id);
                                                }}
                                                className="mr-2"
                                              />
                                            )}
                                            <Label
                                              className={`cursor-pointer font-normal text-xs flex-1 ${
                                                topicDisabled
                                                  ? "text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                                  : "text-gray-600 dark:text-gray-400"
                                              }`}
                                            >
                                              {topic.name}{" "}
                                              <span className="text-blue-600 dark:text-blue-400">
                                                (
                                                {getFilteredCount(
                                                  topic.countsByTag,
                                                  topic.count
                                                )}
                                                )
                                              </span>
                                            </Label>
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
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














































