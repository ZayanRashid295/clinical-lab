"use client"

import { useState } from "react"
import { useToast } from "@/shared/ui/use-toast"
import { Card } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { Choice } from "./types"

interface ChoiceEditorProps {
  choices: Choice[]
  onChange: (choices: Choice[]) => void
  explanations: Record<string, any[]>
  disabled?: boolean
}

export default function ChoiceEditor({
  choices,
  onChange,
  explanations,
  disabled = false,
}: ChoiceEditorProps) {
  const { toast } = useToast()
  const addChoice = () => {
    const nextLabel = String.fromCharCode(65 + choices.length)
    onChange([
      ...choices,
      { label: nextLabel, text: "", correct: false, value: nextLabel },
    ])
  }

  const removeChoice = (index: number) => {
    if (choices.length <= 2) {
      toast({
        title: "Requirement",
        description: "You must have at least 2 options",
        variant: "destructive",
      })
      return
    }
    const removedLabel = choices[index].label
    const newChoices = choices.filter((_, idx) => idx !== index)
    
    // Update labels to be sequential (A, B, C, D, etc.)
    const updatedChoices = newChoices.map((opt, idx) => ({
      ...opt,
      label: String.fromCharCode(65 + idx),
      value: String.fromCharCode(65 + idx),
    }))
    
    onChange(updatedChoices)
  }

  const updateChoice = (index: number, field: keyof Choice, value: any) => {
    const newChoices = [...choices]
    if (field === "correct") {
      // Only one choice can be correct
      newChoices.forEach((opt, idx) => {
        opt.correct = idx === index
      })
    } else {
      newChoices[index] = { ...newChoices[index], [field]: value }
    }
    onChange(newChoices)
  }

  return (
    <Card className="p-4 shadow-md border border-border/40 bg-card/60 backdrop-blur-sm rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-primary/70 uppercase tracking-widest">
          Answer Choices
        </h3>
        <Button
          onClick={addChoice}
          variant="outline"
          size="sm"
          disabled={disabled}
          className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/30"
        >
          + Add Choice
        </Button>
      </div>

      <div className="space-y-2">
        {choices.map((choice, index) => {
          const hasExplanation = explanations[choice.label]?.length > 0

          return (
            <div
              key={index}
              className="flex gap-2 items-start p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              <div className="flex-shrink-0 mt-1.5">
                <input
                  type="radio"
                  name="correctAnswer"
                  checked={choice.correct}
                  onChange={() => updateChoice(index, "correct", true)}
                  disabled={disabled}
                  className="w-4 h-4 cursor-pointer"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <label className="block text-xs font-semibold text-muted-foreground">
                    {choice.label}.
                  </label>
                  {hasExplanation && (
                    <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                      ✓ Has Explanation
                    </Badge>
                  )}
                </div>
                <input
                  type="text"
                  value={choice.text}
                  onChange={(e) => updateChoice(index, "text", e.target.value)}
                  placeholder={`Option ${choice.label} text...`}
                  disabled={disabled}
                  className="w-full px-2 py-1.5 text-sm rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {choice.correct && (
                  <div className="px-2 py-1 bg-green-500/10 text-green-600 text-xs font-semibold rounded">
                    ✓
                  </div>
                )}
                {choices.length > 2 && (
                  <Button
                    onClick={() => removeChoice(index)}
                    variant="ghost"
                    size="sm"
                    disabled={disabled}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 w-7 p-0"
                  >
                    ×
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}































