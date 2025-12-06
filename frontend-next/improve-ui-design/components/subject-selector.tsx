"use client"

import { useState, useEffect } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2 } from "lucide-react"

interface Tag {
  id: string
  name: string
  count: number
}

interface SubjectSelectorProps {
  selectedSubjects: string[]
  onSubjectToggle: (subjectId: string) => void
  selectedPool?: string
}

const mockTags: Tag[] = [
  { id: "tag1", name: "Cardiology", count: 245 },
  { id: "tag2", name: "Neurology", count: 189 },
  { id: "tag3", name: "Gastroenterology", count: 156 },
  { id: "tag4", name: "Endocrinology", count: 134 },
  { id: "tag5", name: "Pulmonology", count: 198 },
  { id: "tag6", name: "Nephrology", count: 112 },
  { id: "tag7", name: "Hematology", count: 98 },
  { id: "tag8", name: "Oncology", count: 167 },
]

export function SubjectSelector({ selectedSubjects, onSubjectToggle, selectedPool }: SubjectSelectorProps) {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTags = async () => {
      try {
        setLoading(true)
        setError(null)
        await new Promise((resolve) => setTimeout(resolve, 300))
        setTags(mockTags)
      } catch (err) {
        setError("Failed to load subjects")
      } finally {
        setLoading(false)
      }
    }
    fetchTags()
  }, [selectedPool])

  const allSelected = tags.length > 0 && tags.every((tag) => selectedSubjects.includes(tag.id))
  const someSelected = tags.some((tag) => selectedSubjects.includes(tag.id)) && !allSelected

  const handleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked) {
      tags.forEach((tag) => {
        if (!selectedSubjects.includes(tag.id)) onSubjectToggle(tag.id)
      })
    } else {
      selectedSubjects.forEach((id) => onSubjectToggle(id))
    }
  }

  return (
    <div className="bg-card rounded-lg border border-border" data-testid="card-subjects">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-foreground">Subjects</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Select topics to include in your test</p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-xs text-muted-foreground">All</span>
          <Checkbox
            id="select-all-subjects"
            checked={allSelected ? true : someSelected ? "indeterminate" : false}
            onCheckedChange={handleSelectAll}
          />
        </label>
      </div>

      <ScrollArea className="h-[220px]">
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <p className="text-sm text-destructive text-center py-8">{error}</p>
          ) : (
            <div className="space-y-1">
              {tags.map((tag) => {
                const isSelected = selectedSubjects.includes(tag.id)
                return (
                  <label
                    key={tag.id}
                    htmlFor={tag.id}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors ${
                      isSelected ? "bg-primary/5" : "hover:bg-muted/50"
                    }`}
                  >
                    <Checkbox
                      id={tag.id}
                      checked={isSelected}
                      onCheckedChange={() => onSubjectToggle(tag.id)}
                      data-testid={`checkbox-${tag.id}`}
                    />
                    <span
                      className={`text-sm flex-1 ${isSelected ? "text-foreground font-medium" : "text-muted-foreground"}`}
                    >
                      {tag.name}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">{tag.count}</span>
                  </label>
                )
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
