"use client"

import { useState, useEffect } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react"

interface Topic {
  id: string
  name: string
  description?: string
  order: number
  count: number
  countsByTag: Record<string, number>
}

interface Subject {
  id: string
  name: string
  description?: string
  order: number
  count: number
  countsByTag: Record<string, number>
  topics: Topic[]
}

interface System {
  id: string
  name: string
  description?: string
  order: number
  count: number
  countsByTag: Record<string, number>
  subjects: Subject[]
}

interface SystemSelectorProps {
  selectedSystems: string[]
  onSystemToggle: (systemId: string) => void
  selectedTags?: string[]
  selectedPool?: string
  selectedSubjects?: string[]
  selectedTopics?: string[]
  onSubjectToggle?: (subjectId: string) => void
  onTopicToggle?: (topicId: string) => void
}

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
          { id: "topic1", name: "Acute Heart Failure", order: 1, count: 34, countsByTag: { tag1: 34 } },
          { id: "topic2", name: "Chronic Heart Failure", order: 2, count: 55, countsByTag: { tag1: 55 } },
        ],
      },
      {
        id: "subject2",
        name: "Arrhythmias",
        order: 2,
        count: 156,
        countsByTag: { tag1: 156 },
        topics: [
          { id: "topic3", name: "Atrial Fibrillation", order: 1, count: 78, countsByTag: { tag1: 78 } },
          { id: "topic4", name: "Ventricular Tachycardia", order: 2, count: 78, countsByTag: { tag1: 78 } },
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
          { id: "topic5", name: "Ischemic Stroke", order: 1, count: 45, countsByTag: { tag2: 45 } },
          { id: "topic6", name: "Hemorrhagic Stroke", order: 2, count: 22, countsByTag: { tag2: 22 } },
        ],
      },
      {
        id: "subject4",
        name: "Epilepsy",
        order: 2,
        count: 122,
        countsByTag: { tag2: 122 },
        topics: [
          { id: "topic7", name: "Focal Seizures", order: 1, count: 89, countsByTag: { tag2: 89 } },
          { id: "topic8", name: "Generalized Seizures", order: 2, count: 33, countsByTag: { tag2: 33 } },
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
          { id: "topic9", name: "Hepatitis", order: 1, count: 56, countsByTag: { tag3: 56 } },
          { id: "topic10", name: "Cirrhosis", order: 2, count: 42, countsByTag: { tag3: 42 } },
        ],
      },
    ],
  },
]

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
  const [systems, setSystems] = useState<System[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedSystems, setExpandedSystems] = useState<string[]>([])
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, string[]>>({})

  const getFilteredCount = (countsByTag: Record<string, number>, totalCount: number): number => {
    if (selectedTags.length === 0) return 0
    let filteredCount = 0
    selectedTags.forEach((tagId) => {
      if (countsByTag[tagId]) filteredCount += countsByTag[tagId]
    })
    return filteredCount
  }

  const isDisabled = (countsByTag: Record<string, number>): boolean => {
    if (selectedTags.length === 0) return true
    return !selectedTags.some((tagId) => countsByTag[tagId] && countsByTag[tagId] > 0)
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        await new Promise((resolve) => setTimeout(resolve, 300))
        setSystems(mockSystems)
      } catch (err) {
        setError("Failed to load systems")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [selectedPool])

  const handleSystemExpand = (systemId: string) => {
    setExpandedSystems((prev) => (prev.includes(systemId) ? prev.filter((id) => id !== systemId) : [...prev, systemId]))
  }

  const handleSubjectExpand = (systemId: string, subjectId: string) => {
    setExpandedSubjects((prev) => {
      const systemSubjects = prev[systemId] || []
      return {
        ...prev,
        [systemId]: systemSubjects.includes(subjectId)
          ? systemSubjects.filter((id) => id !== subjectId)
          : [...systemSubjects, subjectId],
      }
    })
  }

  const handleExpandAll = () => {
    if (expandedSystems.length === systems.length) {
      setExpandedSystems([])
      setExpandedSubjects({})
    } else {
      setExpandedSystems(systems.map((s) => s.id))
      const allSubjects: Record<string, string[]> = {}
      systems.forEach((system) => {
        allSubjects[system.id] = system.subjects.map((s) => s.id)
      })
      setExpandedSubjects(allSubjects)
    }
  }

  const getTopicState = (topic: Topic): boolean | "indeterminate" => {
    if (isDisabled(topic.countsByTag)) return false
    return selectedTopics.includes(topic.id)
  }

  const getSubjectState = (subject: Subject): boolean | "indeterminate" => {
    if (isDisabled(subject.countsByTag)) return false
    const enabledTopics = subject.topics.filter((t) => !isDisabled(t.countsByTag))
    if (enabledTopics.length === 0) return selectedSubjects.includes(subject.id)
    const selectedTopicsCount = enabledTopics.filter((t) => selectedTopics.includes(t.id)).length
    if (selectedTopicsCount === 0) return false
    if (selectedTopicsCount === enabledTopics.length) return true
    return "indeterminate"
  }

  const getSystemState = (system: System): boolean | "indeterminate" => {
    if (isDisabled(system.countsByTag)) return false
    const enabledSubjects = system.subjects.filter((s) => !isDisabled(s.countsByTag))
    if (enabledSubjects.length === 0) return selectedSystems.includes(system.id)
    let fullySelectedCount = 0
    let partiallySelectedCount = 0
    let noneSelectedCount = 0
    enabledSubjects.forEach((subject) => {
      const subjectState = getSubjectState(subject)
      if (subjectState === true) fullySelectedCount++
      else if (subjectState === "indeterminate") partiallySelectedCount++
      else noneSelectedCount++
    })
    if (fullySelectedCount === enabledSubjects.length) return true
    if (noneSelectedCount === enabledSubjects.length) return false
    return "indeterminate"
  }

  const getAllSystemsState = (): boolean | "indeterminate" => {
    const enabledSystems = systems.filter((s) => !isDisabled(s.countsByTag))
    if (enabledSystems.length === 0) return false
    let fullySelectedCount = 0
    let partiallySelectedCount = 0
    let noneSelectedCount = 0
    enabledSystems.forEach((system) => {
      const systemState = getSystemState(system)
      if (systemState === true) fullySelectedCount++
      else if (systemState === "indeterminate") partiallySelectedCount++
      else noneSelectedCount++
    })
    if (fullySelectedCount === enabledSystems.length) return true
    if (noneSelectedCount === enabledSystems.length) return false
    return "indeterminate"
  }

  const handleSystemCheck = (system: System, checked: boolean | "indeterminate") => {
    onSystemToggle(system.id)
    if (!isDisabled(system.countsByTag) && onSubjectToggle && onTopicToggle) {
      system.subjects.forEach((subject) => {
        if (!isDisabled(subject.countsByTag)) {
          const subjectIsSelected = selectedSubjects.includes(subject.id)
          if (checked !== subjectIsSelected) onSubjectToggle(subject.id)
          subject.topics.forEach((topic) => {
            if (!isDisabled(topic.countsByTag)) {
              const topicIsSelected = selectedTopics.includes(topic.id)
              if (checked !== topicIsSelected) onTopicToggle(topic.id)
            }
          })
        }
      })
    }
  }

  const handleSubjectCheck = (subject: Subject) => {
    if (!onSubjectToggle) return
    const currentState = getSubjectState(subject)
    const shouldSelect = currentState !== true
    onSubjectToggle(subject.id)
    if (onTopicToggle) {
      subject.topics.forEach((topic) => {
        if (!isDisabled(topic.countsByTag)) {
          const topicIsSelected = selectedTopics.includes(topic.id)
          if (shouldSelect && !topicIsSelected) onTopicToggle(topic.id)
          else if (!shouldSelect && topicIsSelected) onTopicToggle(topic.id)
        }
      })
    }
  }

  const handleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked) {
      systems.forEach((system) => {
        if (!isDisabled(system.countsByTag)) {
          if (!selectedSystems.includes(system.id)) onSystemToggle(system.id)
          if (onSubjectToggle) {
            system.subjects.forEach((subject) => {
              if (!isDisabled(subject.countsByTag) && !selectedSubjects.includes(subject.id)) {
                onSubjectToggle(subject.id)
              }
            })
          }
          if (onTopicToggle) {
            system.subjects.forEach((subject) => {
              if (!isDisabled(subject.countsByTag)) {
                subject.topics.forEach((topic) => {
                  if (!isDisabled(topic.countsByTag) && !selectedTopics.includes(topic.id)) {
                    onTopicToggle(topic.id)
                  }
                })
              }
            })
          }
        }
      })
    } else {
      const subjectsToDeselect: string[] = []
      const topicsToDeselect: string[] = []
      systems.forEach((system) => {
        if (!isDisabled(system.countsByTag) && selectedSystems.includes(system.id)) {
          system.subjects.forEach((subject) => {
            if (!isDisabled(subject.countsByTag) && selectedSubjects.includes(subject.id)) {
              subjectsToDeselect.push(subject.id)
            }
            subject.topics.forEach((topic) => {
              if (!isDisabled(topic.countsByTag) && selectedTopics.includes(topic.id)) {
                topicsToDeselect.push(topic.id)
              }
            })
          })
        }
      })
      if (onTopicToggle) topicsToDeselect.forEach((topicId) => onTopicToggle(topicId))
      if (onSubjectToggle) subjectsToDeselect.forEach((subjectId) => onSubjectToggle(subjectId))
      selectedSystems.forEach((id) => onSystemToggle(id))
    }
  }

  if (loading) {
    return (
      <div className="bg-card rounded-lg border border-border" data-testid="card-systems">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-card rounded-lg border border-border" data-testid="card-systems">
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-lg border border-border" data-testid="card-systems">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-foreground">Systems</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Drill down into subjects and topics</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleExpandAll}
            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            data-testid="button-expand-all"
          >
            {expandedSystems.length === systems.length && systems.length > 0 ? "Collapse" : "Expand"}
          </button>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs text-muted-foreground">All</span>
            <Checkbox id="select-all-systems" checked={getAllSystemsState()} onCheckedChange={handleSelectAll} />
          </label>
        </div>
      </div>

      <ScrollArea className="h-[320px]">
        <div className="p-4">
          {systems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No systems available</p>
          ) : (
            <div className="space-y-1">
              {systems.map((system) => {
                const disabled = isDisabled(system.countsByTag)
                const isExpanded = expandedSystems.includes(system.id)
                const systemState = getSystemState(system)
                const filteredCount = getFilteredCount(system.countsByTag, system.count)

                return (
                  <div key={system.id} className="space-y-0.5">
                    <div
                      className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                        disabled ? "opacity-40" : systemState === true ? "bg-primary/5" : "hover:bg-muted/50"
                      } ${disabled ? "" : "cursor-pointer"}`}
                      onClick={() => !disabled && handleSystemExpand(system.id)}
                    >
                      <button
                        className="p-0.5 text-muted-foreground"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!disabled) handleSystemExpand(system.id)
                        }}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <Checkbox
                        id={system.id}
                        checked={systemState}
                        disabled={disabled}
                        onCheckedChange={(checked) => handleSystemCheck(system, checked)}
                        data-testid={`checkbox-${system.id}`}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Label
                        htmlFor={system.id}
                        className={`flex-1 text-sm cursor-pointer ${
                          disabled
                            ? "text-muted-foreground"
                            : systemState
                              ? "text-foreground font-medium"
                              : "text-foreground"
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {system.name}
                      </Label>
                      <span className="text-xs text-muted-foreground tabular-nums">{filteredCount}</span>
                    </div>

                    {isExpanded && (
                      <div className="ml-6 pl-4 border-l border-border space-y-0.5">
                        {system.subjects.map((subject) => {
                          const subjectDisabled = isDisabled(subject.countsByTag)
                          const subjectState = getSubjectState(subject)
                          const subjectExpanded = expandedSubjects[system.id]?.includes(subject.id)
                          const subjectCount = getFilteredCount(subject.countsByTag, subject.count)

                          return (
                            <div key={subject.id} className="space-y-0.5">
                              <div
                                className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors ${
                                  subjectDisabled ? "opacity-40" : "hover:bg-muted/50 cursor-pointer"
                                }`}
                                onClick={() => !subjectDisabled && handleSubjectExpand(system.id, subject.id)}
                              >
                                <button
                                  className="p-0.5 text-muted-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (!subjectDisabled) handleSubjectExpand(system.id, subject.id)
                                  }}
                                >
                                  {subjectExpanded ? (
                                    <ChevronDown className="h-3 w-3" />
                                  ) : (
                                    <ChevronRight className="h-3 w-3" />
                                  )}
                                </button>
                                {onSubjectToggle && (
                                  <Checkbox
                                    id={subject.id}
                                    checked={subjectState}
                                    disabled={subjectDisabled}
                                    onCheckedChange={() => handleSubjectCheck(subject)}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                )}
                                <Label
                                  className={`flex-1 text-sm cursor-pointer ${subjectDisabled ? "text-muted-foreground" : "text-muted-foreground"}`}
                                >
                                  {subject.name}
                                </Label>
                                <span className="text-xs text-muted-foreground/70 tabular-nums">{subjectCount}</span>
                              </div>

                              {subjectExpanded && (
                                <div className="ml-5 pl-3 border-l border-border/50 space-y-0.5">
                                  {subject.topics.map((topic) => {
                                    const topicDisabled = isDisabled(topic.countsByTag)
                                    const topicState = getTopicState(topic)
                                    const topicCount = getFilteredCount(topic.countsByTag, topic.count)

                                    return (
                                      <div
                                        key={topic.id}
                                        className={`flex items-center gap-2 px-2 py-1 rounded-md transition-colors ${
                                          topicDisabled ? "opacity-40" : "hover:bg-muted/50"
                                        }`}
                                      >
                                        {onTopicToggle && (
                                          <Checkbox
                                            id={topic.id}
                                            checked={topicState}
                                            disabled={topicDisabled}
                                            onCheckedChange={() => onTopicToggle(topic.id)}
                                          />
                                        )}
                                        <Label className="flex-1 text-xs text-muted-foreground cursor-pointer">
                                          {topic.name}
                                        </Label>
                                        <span className="text-xs text-muted-foreground/60 tabular-nums">
                                          {topicCount}
                                        </span>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
