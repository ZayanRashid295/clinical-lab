"use client"

import { Card } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { Checkbox } from "@/shared/ui/checkbox"

interface Question {
  id: string
  stem: string
  subject: string
  system?: string
  chapterName?: string
  topicName?: string
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
        <Card key={question.id} className="p-6 hover:shadow-lg transition-shadow bg-card dark:bg-gray-800 border-border dark:border-gray-700">
          <div className={`flex gap-4 ${selectionMode ? "flex-row" : ""}`}>
            {selectionMode && (
              <div className="flex items-center flex-shrink-0 pt-1">
                <Checkbox
                  checked={selectedSet.has(question.id)}
                  onCheckedChange={(c) => handleToggleOne(question.id, c === true)}
                />
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-w-0">
            {/* Question Stem Content */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold text-foreground dark:text-gray-100 mb-2 line-clamp-2">{question.stem}</h3>
              <div className="space-y-1">
                {question.subject && (
                  <p className="text-sm text-muted-foreground dark:text-gray-300">
                    <span className="font-medium">Subject:</span> {question.subject}
                  </p>
                )}
                {question.chapterName && (
                  <p className="text-sm text-muted-foreground dark:text-gray-300">
                    <span className="font-medium">System:</span> {question.chapterName}
                  </p>
                )}
                {question.topicName && (
                  <p className="text-sm text-muted-foreground dark:text-gray-300">
                    <span className="font-medium">Topic:</span> {question.topicName}
                  </p>
                )}
              </div>
              {question.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {question.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs text-foreground dark:text-gray-200 border-border dark:border-gray-600">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex flex-col justify-center text-sm text-muted-foreground dark:text-gray-300">
              <p>
                <span className="font-semibold">{question.options.length}</span> options
              </p>
              <p>
                Correct answer: <span className="font-semibold">{question.options.find((o) => o.correct)?.label}</span>
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 lg:justify-end items-center">
              {onView && (
                <Button 
                  onClick={() => onView(question.id)} 
                  variant="outline" 
                  className="flex-1 lg:flex-none bg-primary/10 dark:bg-primary/20 hover:bg-primary/20 dark:hover:bg-primary/30 text-primary dark:text-blue-400 border-primary/30 dark:border-primary/50"
                >
                  View
                </Button>
              )}
              <Button 
                onClick={() => onEdit(question.id)} 
                variant="outline" 
                className="flex-1 lg:flex-none border-border dark:border-gray-700 text-foreground dark:text-gray-100 hover:bg-muted dark:hover:bg-gray-700"
              >
                Edit
              </Button>
              <Button
                onClick={() => onDelete(question.id)}
                variant="outline"
                className="flex-1 lg:flex-none text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-300 dark:border-red-800"
              >
                Delete
              </Button>
            </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
