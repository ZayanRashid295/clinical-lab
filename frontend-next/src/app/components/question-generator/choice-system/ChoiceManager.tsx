"use client"

import { useState, useEffect } from "react"
import ChoiceEditor from "./ChoiceEditor"
import ChoiceExplanationEditor from "./ChoiceExplanationEditor"
import { ChoiceManagerProps, ChoiceManagerData, Choice } from "./types"

export default function ChoiceManager({
  initialChoices = [],
  initialExplanations = {},
  onChange,
  disabled = false,
}: ChoiceManagerProps) {
  const [choices, setChoices] = useState<Choice[]>(initialChoices)
  const [explanations, setExplanations] = useState<Record<string, any[]>>(initialExplanations)

  // Initialize with default choices if empty
  useEffect(() => {
    if (choices.length === 0) {
      const defaultChoices: Choice[] = [
        { label: "A", text: "", correct: false, value: "A" },
        { label: "B", text: "", correct: false, value: "B" },
        { label: "C", text: "", correct: false, value: "C" },
        { label: "D", text: "", correct: false, value: "D" },
      ]
      setChoices(defaultChoices)
    }
  }, [])

  // Sync explanations when choices change (remove orphaned explanations, add empty for new choices)
  useEffect(() => {
    const choiceLabels = new Set(choices.map((c) => c.label))
    const cleaned: Record<string, any[]> = {}

    // Keep existing explanations for choices that still exist
    Object.entries(explanations).forEach(([label, expl]) => {
      if (choiceLabels.has(label)) {
        cleaned[label] = expl
      }
    })

    // Initialize empty explanations for new choices
    choices.forEach((choice) => {
      if (!cleaned[choice.label]) {
        cleaned[choice.label] = []
      }
    })

    setExplanations(cleaned)
  }, [choices])

  // Notify parent of changes
  useEffect(() => {
    onChange({ choices, explanations })
  }, [choices, explanations, onChange])

  const handleChoicesChange = (newChoices: Choice[]) => {
    setChoices(newChoices)
    
    // Update labels and values if choices were reordered
    const updatedChoices = newChoices.map((choice, idx) => ({
      ...choice,
      label: String.fromCharCode(65 + idx),
      value: String.fromCharCode(65 + idx),
    }))
    
    // Update explanation keys to match new labels
    const updatedExplanations: Record<string, any[]> = {}
    newChoices.forEach((newChoice, idx) => {
      const oldLabel = String.fromCharCode(65 + idx)
      if (explanations[oldLabel]) {
        updatedExplanations[newChoice.label] = explanations[oldLabel]
      } else {
        updatedExplanations[newChoice.label] = []
      }
    })
    
    setChoices(updatedChoices)
    setExplanations(updatedExplanations)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div>
        <ChoiceEditor
          choices={choices}
          onChange={handleChoicesChange}
          explanations={explanations}
          disabled={disabled}
        />
      </div>
      <div>
        <ChoiceExplanationEditor
          choices={choices}
          explanations={explanations}
          onChange={setExplanations}
          disabled={disabled}
        />
      </div>
    </div>
  )
}









