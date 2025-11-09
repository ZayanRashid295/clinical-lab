"use client"

import { Card } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"

interface Question {
  id: string
  stem: string
  subject: string
  system: string
  tags: string[]
  options: Array<{ label: string; text: string; correct: boolean }>
}

interface QuestionListProps {
  questions: Question[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export default function QuestionList({ questions, onEdit, onDelete }: QuestionListProps) {
  return (
    <div className="space-y-4">
      {questions.map((question) => (
        <Card key={question.id} className="p-6 hover:shadow-lg transition-shadow">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Question Content */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2">{question.stem}</h3>
              <div className="space-y-1">
                {question.subject && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Subject:</span> {question.subject}
                  </p>
                )}
                {question.system && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">System:</span> {question.system}
                  </p>
                )}
              </div>
              {question.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {question.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {question.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{question.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex flex-col justify-center text-sm text-muted-foreground">
              <p>
                <span className="font-semibold">{question.options.length}</span> options
              </p>
              <p>
                Correct answer: <span className="font-semibold">{question.options.find((o) => o.correct)?.label}</span>
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 lg:justify-end items-center">
              <Button onClick={() => onEdit(question.id)} variant="outline" className="flex-1 lg:flex-none">
                Edit
              </Button>
              <Button
                onClick={() => onDelete(question.id)}
                variant="outline"
                className="flex-1 lg:flex-none text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                Delete
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
