"use client"

import { useState, useEffect } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, ChevronRight, ChevronDown, X } from "lucide-react"

interface System {
  id: string
  name: string
  count: number
}

interface Topic {
  id: string
  name: string
  count: number
}

interface SystemSelectorProps {
  selectedSystems: string[]
  onSystemToggle: (systemId: string) => void
  selectedTags?: string[]
  selectedPool?: string
  expandedSystem?: string | null
  onSystemExpand?: (systemId: string) => void
}

const mockSystems: System[] = [
  { id: "system1", name: "Cardiovascular", count: 234 },
  { id: "system2", name: "Respiratory", count: 198 },
  { id: "system3", name: "Nervous", count: 289 },
  { id: "system4", name: "Endocrine", count: 212 },
  { id: "system5", name: "Digestive", count: 267 },
  { id: "system6", name: "Urinary", count: 176 },
  { id: "system7", name: "Reproductive", count: 145 },
  { id: "system8", name: "Immune", count: 198 },
  { id: "system9", name: "Musculoskeletal", count: 156 },
  { id: "system10", name: "Integumentary", count: 124 },
  { id: "system11", name: "Lymphatic", count: 89 },
  { id: "system12", name: "Hematopoietic", count: 167 },
  { id: "system13", name: "Renal", count: 145 },
  { id: "system14", name: "Hepatic", count: 198 },
  { id: "system15", name: "Pancreatic", count: 112 },
  { id: "system16", name: "Thyroid", count: 156 },
  { id: "system17", name: "Parathyroid", count: 89 },
  { id: "system18", name: "Adrenal", count: 124 },
  { id: "system19", name: "Pituitary", count: 143 },
  { id: "system20", name: "Gonadal", count: 134 },
  { id: "system21", name: "Gastric", count: 156 },
  { id: "system22", name: "Hepatobiliary", count: 178 },
  { id: "system23", name: "Pulmonary", count: 203 },
  { id: "system24", name: "Cardiac", count: 289 },
  { id: "system25", name: "Cerebral", count: 267 },
  { id: "system26", name: "Spinal", count: 145 },
  { id: "system27", name: "Peripheral Nerve", count: 156 },
  { id: "system28", name: "Joint", count: 134 },
  { id: "system29", name: "Bone", count: 167 },
  { id: "system30", name: "Skin", count: 123 },
]

const mockTopicsMap: Record<string, Topic[]> = {
  system1: [
    { id: "topic1-1", name: "Heart Anatomy", count: 45 },
    { id: "topic1-2", name: "Blood Vessels", count: 38 },
    { id: "topic1-3", name: "Cardiac Cycle", count: 52 },
    { id: "topic1-4", name: "Arrhythmias", count: 41 },
    { id: "topic1-5", name: "Heart Failure", count: 58 },
  ],
  system2: [
    { id: "topic2-1", name: "Lung Anatomy", count: 32 },
    { id: "topic2-2", name: "Gas Exchange", count: 45 },
    { id: "topic2-3", name: "Pulmonary Diseases", count: 67 },
    { id: "topic2-4", name: "Respiratory Control", count: 54 },
  ],
  system3: [
    { id: "topic3-1", name: "Brain Anatomy", count: 56 },
    { id: "topic3-2", name: "Spinal Cord", count: 43 },
    { id: "topic3-3", name: "Neurotransmitters", count: 67 },
    { id: "topic3-4", name: "Neurological Disorders", count: 78 },
    { id: "topic3-5", name: "Cranial Nerves", count: 45 },
  ],
  system4: [
    { id: "topic4-1", name: "Pituitary Gland", count: 34 },
    { id: "topic4-2", name: "Thyroid Disorders", count: 56 },
    { id: "topic4-3", name: "Adrenal Gland", count: 45 },
    { id: "topic4-4", name: "Diabetes", count: 77 },
  ],
  system5: [
    { id: "topic5-1", name: "GI Anatomy", count: 45 },
    { id: "topic5-2", name: "Digestion Process", count: 52 },
    { id: "topic5-3", name: "GI Disorders", count: 89 },
    { id: "topic5-4", name: "Liver Function", count: 81 },
  ],
}

// Generate default topics for systems without specific data
const getTopicsForSystem = (systemId: string, systemName: string): Topic[] => {
  if (mockTopicsMap[systemId]) return mockTopicsMap[systemId]
  return [
    { id: `${systemId}-t1`, name: `${systemName} Basics`, count: Math.floor(Math.random() * 40) + 20 },
    { id: `${systemId}-t2`, name: `${systemName} Pathology`, count: Math.floor(Math.random() * 50) + 30 },
    { id: `${systemId}-t3`, name: `${systemName} Pharmacology`, count: Math.floor(Math.random() * 35) + 15 },
  ]
}

export function SystemSelector({
  selectedSystems,
  onSystemToggle,
  selectedTags,
  selectedPool,
  expandedSystem,
  onSystemExpand,
}: SystemSelectorProps) {
  const [systems, setSystems] = useState<System[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])

  useEffect(() => {
    const fetchSystems = async () => {
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
    fetchSystems()
  }, [selectedTags, selectedPool])

  const allSelected = systems.length > 0 && systems.every((system) => selectedSystems.includes(system.id))
  const someSelected = systems.some((system) => selectedSystems.includes(system.id)) && !allSelected

  const handleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked) {
      systems.forEach((system) => {
        if (!selectedSystems.includes(system.id)) onSystemToggle(system.id)
      })
    } else {
      systems.forEach((system) => {
        if (selectedSystems.includes(system.id)) onSystemToggle(system.id)
      })
    }
  }

  const handleTopicToggle = (topicId: string) => {
    setSelectedTopics((prev) => (prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId]))
  }

  const expandedSystemData = expandedSystem ? systems.find((s) => s.id === expandedSystem) : null
  const expandedTopics =
    expandedSystem && expandedSystemData ? getTopicsForSystem(expandedSystem, expandedSystemData.name) : []

  return (
    <div className="flex flex-col h-full" data-testid="card-systems">
      <div className="px-4 py-3 border-b border-border/50 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <h3 className="text-sm font-medium text-foreground">Body Systems</h3>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs text-muted-foreground">All</span>
            <Checkbox
              id="select-all-systems"
              checked={allSelected ? true : someSelected ? "indeterminate" : false}
              onCheckedChange={handleSelectAll}
              className="h-4 w-4"
            />
          </label>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Systems Grid */}
        <ScrollArea className={`flex-1 ${expandedSystem ? "border-r border-border" : ""}`}>
          <div className="p-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <p className="text-sm text-destructive text-center py-12">{error}</p>
            ) : (
              <div className={`grid gap-2 ${expandedSystem ? "grid-cols-2" : "grid-cols-3"}`}>
                {systems.map((system) => {
                  const isSelected = selectedSystems.includes(system.id)
                  const isExpanded = expandedSystem === system.id
                  return (
                    <div
                      key={system.id}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all border ${
                        isExpanded
                          ? "bg-primary/10 border-primary/40 ring-1 ring-primary/20"
                          : isSelected
                            ? "bg-primary/5 border-primary/30"
                            : "bg-muted/30 border-transparent hover:bg-muted/50 hover:border-border"
                      }`}
                    >
                      <Checkbox
                        id={system.id}
                        checked={isSelected}
                        onCheckedChange={() => onSystemToggle(system.id)}
                        data-testid={`checkbox-${system.id}`}
                        className="h-4 w-4 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span
                          className={`text-sm block truncate ${isSelected || isExpanded ? "text-foreground font-medium" : "text-foreground/80"}`}
                        >
                          {system.name}
                        </span>
                        <span className="text-[11px] text-muted-foreground">{system.count} Q's</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onSystemExpand?.(system.id)
                        }}
                        className={`p-1 rounded-md transition-colors ${
                          isExpanded
                            ? "bg-primary/20 text-primary"
                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </ScrollArea>

        {expandedSystem && expandedSystemData && (
          <div className="w-72 flex flex-col bg-muted/20">
            <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-foreground">{expandedSystemData.name}</h4>
                <p className="text-xs text-muted-foreground">Select topics</p>
              </div>
              <button
                onClick={() => onSystemExpand?.(expandedSystem)}
                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-1.5">
                {expandedTopics.map((topic) => {
                  const isTopicSelected = selectedTopics.includes(topic.id)
                  return (
                    <label
                      key={topic.id}
                      htmlFor={topic.id}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all border ${
                        isTopicSelected
                          ? "bg-primary/10 border-primary/30"
                          : "bg-card border-border/50 hover:bg-muted/50 hover:border-border"
                      }`}
                    >
                      <Checkbox
                        id={topic.id}
                        checked={isTopicSelected}
                        onCheckedChange={() => handleTopicToggle(topic.id)}
                        className="h-4 w-4 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span
                          className={`text-sm block truncate ${isTopicSelected ? "text-foreground font-medium" : "text-foreground/80"}`}
                        >
                          {topic.name}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground shrink-0">{topic.count}</span>
                    </label>
                  )
                })}
              </div>
            </ScrollArea>
            <div className="px-4 py-2.5 border-t border-border/50 bg-muted/30">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {expandedTopics.filter((t) => selectedTopics.includes(t.id)).length}
                </span>{" "}
                of {expandedTopics.length} topics selected
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-2.5 border-t border-border/50 shrink-0 bg-muted/30">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{selectedSystems.length}</span> of {systems.length} systems
          selected
          {selectedTopics.length > 0 && <span className="ml-2 text-primary">({selectedTopics.length} topics)</span>}
        </p>
      </div>
    </div>
  )
}
