"use client"

import { useState, useEffect } from "react"
import { Card } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import RichEditorContent from "../rich-editor/RichEditorContent"
import { ContentBlock } from "../rich-editor/types"
import { Choice } from "./types"

interface ChoiceExplanationEditorProps {
  choices: Choice[]
  explanations: Record<string, ContentBlock[]>
  onChange: (explanations: Record<string, ContentBlock[]>) => void
  disabled?: boolean
}

export default function ChoiceExplanationEditor({
  choices,
  explanations,
  onChange,
  disabled = false,
}: ChoiceExplanationEditorProps) {
  const [activeTab, setActiveTab] = useState<string>(choices[0]?.label || "")

  useEffect(() => {
    if (choices.length > 0 && !activeTab) {
      setActiveTab(choices[0].label)
    }
  }, [choices, activeTab])

  const handleExplanationChange = (label: string, blocks: ContentBlock[]) => {
    const updated = { ...explanations }
    if (blocks && blocks.length > 0) {
      updated[label] = blocks
    } else {
      delete updated[label]
    }
    onChange(updated)
  }

  if (choices.length === 0) {
    return (
      <Card className="p-4 shadow-md border border-border/40 bg-card/60 backdrop-blur-sm rounded-xl">
        <p className="text-sm text-muted-foreground text-center py-8">
          Add choices first to create per-choice explanations
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-4 shadow-md border border-border/40 bg-card/60 backdrop-blur-sm rounded-xl">
      <h3 className="text-sm font-bold text-primary/70 mb-4 uppercase tracking-widest">
        Per-Choice Explanations
      </h3>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 mb-4">
          {choices.map((choice) => (
            <TabsTrigger
              key={choice.label}
              value={choice.label}
              className="text-xs"
            >
              {choice.label}
              {explanations[choice.label]?.length > 0 && (
                <span className="ml-1 text-green-600">✓</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {choices.map((choice) => (
          <TabsContent key={choice.label} value={choice.label} className="mt-0">
            <div className="space-y-2">
              <div className="p-2 bg-muted/30 rounded-lg">
                <p className="text-xs font-semibold text-foreground mb-1">
                  Choice {choice.label}:
                </p>
                <p className="text-sm text-foreground/70">{choice.text || "No text yet"}</p>
                {choice.correct && (
                  <Badge variant="outline" className="mt-2 text-xs bg-green-500/10 text-green-600 border-green-500/30">
                    Correct Answer
                  </Badge>
                )}
              </div>

              <div className="border border-border rounded-lg p-3 bg-card">
                <RichEditorContent
                  blocks={explanations[choice.label] || []}
                  onChange={(blocks) => handleExplanationChange(choice.label, blocks)}
                  placeholder={`Add explanation for choice ${choice.label}...`}
                  disabled={disabled}
                />
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Summary */}
      <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border">
        <p className="text-xs font-semibold text-foreground mb-2">Explanation Status</p>
        <div className="space-y-1 text-xs text-foreground/80">
          {choices.map((choice) => {
            const hasExplanation = explanations[choice.label]?.length > 0
            return (
              <div key={choice.label} className="flex items-center gap-2">
                <span className={hasExplanation ? "text-green-600" : "text-muted-foreground"}>
                  {hasExplanation ? "✓" : "○"}
                </span>
                <span>
                  Choice {choice.label}: {hasExplanation ? "Filled" : "Empty"}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}





