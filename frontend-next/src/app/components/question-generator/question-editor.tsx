"use client"

import { useState, useEffect } from "react"
import { Card } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import ExplanationEditor from "./explanation-editor"
import PerAnswerExplanationsEditor from "./per-answer-explanations-editor"

interface QuestionEditorProps {
  question?: any
  onSave: (data: any) => void
  onCancel: () => void
}

export default function QuestionEditor({ question, onSave, onCancel }: QuestionEditorProps) {
  const [questionStem, setQuestionStem] = useState("")
  const [subject, setSubject] = useState("")
  const [system, setSystem] = useState("")
  const [tags, setTags] = useState("")
  const [options, setOptions] = useState<Array<{ label: string; text: string; correct: boolean }>>([
    { label: "A", text: "", correct: false },
    { label: "B", text: "", correct: false },
    { label: "C", text: "", correct: false },
    { label: "D", text: "", correct: false },
  ])
  const [explanation, setExplanation] = useState<any[]>([])
  const [perAnswerExplanations, setPerAnswerExplanations] = useState<Record<string, any[]>>({
    A: [],
    B: [],
    C: [],
    D: [],
    E: [],
  })

  useEffect(() => {
    if (question) {
      setQuestionStem(question.stem)
      setSubject(question.subject)
      setSystem(question.system)
      setTags(question.tags?.join(", ") || "")
      setOptions(question.options)
      setExplanation(question.explanation || [])
      setPerAnswerExplanations(
        question.perAnswerExplanations || {
          A: [],
          B: [],
          C: [],
          D: [],
          E: [],
        },
      )
    }
  }, [question])

  const updateOption = (index: number, field: string, value: any) => {
    const newOptions = [...options]
    newOptions[index] = { ...newOptions[index], [field]: value }
    setOptions(newOptions)
  }

  const handleSave = () => {
    if (!questionStem.trim()) {
      alert("Please enter a question stem")
      return
    }
    if (!options.some((opt) => opt.correct)) {
      alert("Please select a correct answer")
      return
    }
    if (options.some((opt) => !opt.text.trim())) {
      alert("Please fill in all option texts")
      return
    }

    const parsedTags = tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t)

    const optionsWithValues = options.map((opt) => ({
      ...opt,
      value: opt.label,
    }))

    onSave({
      stem: questionStem,
      subject,
      system,
      options: optionsWithValues,
      explanation,
      perAnswerExplanations,
      tags: parsedTags,
    })
  }

  return (
    <div className="space-y-6">
      {/* Question Stem Section */}
      <Card className="p-6 shadow-lg">
        <h2 className="text-2xl font-bold text-foreground mb-4">Question Details</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Question Stem</label>
            <textarea
              value={questionStem}
              onChange={(e) => setQuestionStem(e.target.value)}
              placeholder="Enter the question text..."
              className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              rows={4}
            />
          </div>

          {/* Question Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Pathophysiology"
                className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">System</label>
              <input
                type="text"
                value={system}
                onChange={(e) => setSystem(e.target.value)}
                placeholder="e.g., Endocrine"
                className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Tags (comma separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., CAH, Enzyme deficiency, Adrenal glands"
              className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
      </Card>

      {/* Answer Options Section */}
      <Card className="p-6 shadow-lg">
        <h2 className="text-2xl font-bold text-foreground mb-4">Answer Options</h2>

        <div className="space-y-3">
          {options.map((option, index) => (
            <div
              key={index}
              className="flex gap-3 items-start p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              <div className="flex-shrink-0 mt-2">
                <input
                  type="radio"
                  name="correctAnswer"
                  checked={option.correct}
                  onChange={() => {
                    const newOptions = options.map((opt, idx) => ({
                      ...opt,
                      correct: idx === index,
                    }))
                    setOptions(newOptions)
                  }}
                  className="w-4 h-4 cursor-pointer"
                />
              </div>
              <div className="flex-1 space-y-2">
                <label className="block text-sm font-semibold text-muted-foreground">{option.label}.</label>
                <input
                  type="text"
                  value={option.text}
                  onChange={(e) => updateOption(index, "text", e.target.value)}
                  placeholder={`Option ${option.label} text...`}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                />
              </div>
              {option.correct && (
                <div className="flex-shrink-0 mt-2 px-3 py-1 bg-green-500/10 text-green-600 text-xs font-semibold rounded">
                  Correct
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Per-Answer Explanations Section */}
      <PerAnswerExplanationsEditor
        options={options}
        explanations={perAnswerExplanations}
        onChange={setPerAnswerExplanations}
      />

      {/* Explanation Section */}
      <ExplanationEditor value={explanation} onChange={setExplanation} />

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button onClick={onCancel} variant="outline" className="px-6 bg-transparent">
          Cancel
        </Button>
        <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90 px-6">
          {question ? "Update Question" : "Save Question"}
        </Button>
      </div>
    </div>
  )
}
