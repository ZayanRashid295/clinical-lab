"use client"

import { Check } from "lucide-react"
import { Card } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { Checkbox } from "@/shared/ui/checkbox"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip"

interface Question {
  id: string
  stem: string
  subject: string
  category?: string
  product?: string
  system?: string
  chapterName?: string
  topicName?: string
  subtopicName?: string
  mcqTitle?: string
  tags: string[]
  options: Array<{ label: string; text: string; correct: boolean }>
}

interface QuestionListProps {
  questions: Question[]
  onEdit: (id: string) => void
  onView?: (id: string) => void
  onDelete: (id: string) => void
  /** When true, show checkboxes to select questions for bulk delete */
  selectionMode?: boolean
  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
}

export default function QuestionList({
  questions,
  onEdit,
  onView,
  onDelete,
  selectionMode = false,
  selectedIds = [],
  onSelectionChange,
}: QuestionListProps) {
  const toPlainText = (value: string) =>
    (value || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()

  const selectedSet = new Set(selectedIds)

  const handleToggleOne = (id: string, checked: boolean) => {
    if (!onSelectionChange) return
    if (checked) {
      onSelectionChange([...selectedIds, id])
    } else {
      onSelectionChange(selectedIds.filter((x) => x !== id))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return
    if (checked) {
      onSelectionChange(questions.map((q) => q.id))
    } else {
      onSelectionChange([])
    }
  }

  const allSelected = questions.length > 0 && questions.every((q) => selectedSet.has(q.id))
  const someSelected = selectedIds.length > 0

  return (
    <div className="space-y-4">
      {selectionMode && questions.length > 0 && (
        <div className="flex items-center gap-2 pb-2 border-b border-border dark:border-gray-700">
          <Checkbox
            id="select-all-questions"
            checked={allSelected ? true : someSelected ? "indeterminate" : false}
            onCheckedChange={(c) => handleSelectAll(c === true)}
          />
          <label htmlFor="select-all-questions" className="text-sm text-muted-foreground dark:text-gray-400 cursor-pointer">
            Select all on page
          </label>
        </div>
      )}
      {questions.map((question) => (
        <Card
          key={question.id}
          className="p-5 sm:p-6 hover:shadow-md transition-shadow bg-card dark:bg-gray-800/60 border-border/80 dark:border-gray-700"
        >
          {(() => {
            const plainStem = toPlainText(question.stem)
            const correct = question.options.find((o) => o.correct)?.label
            const meta = (label: string, value: string | undefined) =>
              value ? (
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground dark:text-gray-400">
                    {label}
                  </p>
                  <p className="text-sm text-foreground dark:text-gray-100 truncate" title={value}>
                    {value}
                  </p>
                </div>
              ) : null
            return (
              <div className={`flex gap-4 ${selectionMode ? "flex-row" : ""}`}>
                {selectionMode && (
                  <div className="flex items-start flex-shrink-0 pt-1">
                    <Checkbox
                      checked={selectedSet.has(question.id)}
                      onCheckedChange={(c) => handleToggleOne(question.id, c === true)}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0 space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <h3 className="text-base sm:text-lg font-semibold text-foreground dark:text-gray-50 line-clamp-3 cursor-help pr-0 sm:pr-4 flex-1 min-w-0">
                          {plainStem}
                        </h3>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        align="start"
                        className="max-w-[700px] whitespace-pre-wrap break-words text-sm leading-relaxed"
                      >
                        {plainStem}
                      </TooltipContent>
                    </Tooltip>
                    <div className="flex flex-wrap gap-1.5 shrink-0 sm:justify-end">
                      {onView && (
                        <Button
                          type="button"
                          onClick={() => onView(question.id)}
                          variant="ghost"
                          size="sm"
                          className="h-8 text-muted-foreground hover:text-foreground dark:text-gray-300 dark:hover:text-white"
                        >
                          View
                        </Button>
                      )}
                      <Button
                        type="button"
                        onClick={() => onEdit(question.id)}
                        variant="ghost"
                        size="sm"
                        className="h-8 text-muted-foreground hover:text-foreground dark:text-gray-300 dark:hover:text-white"
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        onClick={() => onDelete(question.id)}
                        variant="ghost"
                        size="sm"
                        className="h-8 text-red-600/90 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3 text-sm border-t border-border/60 dark:border-gray-700 pt-4">
                    <div className="space-y-3 min-w-0">
                      {meta("Product", question.product)}
                      {meta("Topic", question.topicName)}
                      {meta("Title", question.mcqTitle)}
                      {(question.category || question.subject) &&
                        meta("Category", question.category || question.subject)}
                    </div>
                    <div className="space-y-3 min-w-0">
                      {meta("System", question.system || question.chapterName)}
                      {meta("Subtopic", question.subtopicName)}
                    </div>
                  </div>

                  {question.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {question.tags
                        .filter((tag) => !tag.startsWith("__"))
                        .map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs font-normal bg-muted/80 text-muted-foreground dark:bg-gray-800/80 dark:text-gray-300 dark:border-gray-700"
                          >
                            {tag}
                          </Badge>
                        ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-border/60 dark:border-gray-700">
                    <p className="text-sm text-muted-foreground dark:text-gray-400">
                      <span className="font-medium text-foreground dark:text-gray-100">
                        {question.options.length}
                      </span>{" "}
                      options
                    </p>
                    {correct && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
                        <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                        Answer: {correct}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })()}
        </Card>
      ))}
    </div>
  )
}
