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
  { id: "tag1", name: "Anatomy", count: 245 },
  { id: "tag2", name: "Physiology", count: 189 },
  { id: "tag3", name: "Pharmacology", count: 312 },
  { id: "tag4", name: "Pathology", count: 267 },
  { id: "tag5", name: "Microbiology", count: 198 },
  { id: "tag6", name: "Biochemistry", count: 156 },
  { id: "tag7", name: "Medical Genetics", count: 84 },
  { id: "tag8", name: "Immunology", count: 142 },
  { id: "tag9", name: "Clinical Medicine", count: 423 },
  { id: "tag10", name: "Surgery", count: 356 },
  { id: "tag11", name: "Pediatrics", count: 267 },
  { id: "tag12", name: "Psychiatry", count: 145 },
  { id: "tag13", name: "Obstetrics", count: 178 },
  { id: "tag14", name: "Neuroscience", count: 234 },
  { id: "tag15", name: "Biostatistics", count: 89 },
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
      tags.forEach((tag) => {
        if (selectedSubjects.includes(tag.id)) onSubjectToggle(tag.id)
      })
    }
  }

  return (
    <div className="flex flex-col h-full" data-testid="card-subjects">
      <div className="px-4 py-3 border-b border-border/50 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <h3 className="text-sm font-medium text-foreground">Subjects</h3>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs text-muted-foreground">All</span>
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
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <p className="text-sm text-destructive text-center py-12">{error}</p>
          ) : (
            <div className="space-y-0">
              {tags.map((tag) => {
                const isSelected = selectedSubjects.includes(tag.id)
                return (
                  <label
                    key={tag.id}
                    htmlFor={tag.id}
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                      isSelected ? "bg-primary/5" : "hover:bg-accent"
                    }`}
                  >
                    <Checkbox
                      id={tag.id}
                      checked={isSelected}
                      onCheckedChange={() => onSubjectToggle(tag.id)}
                      data-testid={`checkbox-${tag.id}`}
                      className="h-4 w-4"
                    />
                    <span
                      className={`text-sm flex-1 ${isSelected ? "text-foreground font-medium" : "text-foreground/80"}`}
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

      <div className="px-4 py-2.5 border-t border-border/50 shrink-0 bg-muted/30">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{selectedSubjects.length}</span> of {tags.length} selected
        </p>
      </div>
    </div>
  )
}
