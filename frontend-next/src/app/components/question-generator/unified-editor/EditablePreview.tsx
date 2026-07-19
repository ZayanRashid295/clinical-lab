"use client"

import { useState, useEffect, useCallback } from "react"
import { ContentBlock } from "../rich-editor/types"
import { Choice } from "../choice-system/types"
import RichTextEditor from "./RichTextEditor"
import PerAnswerExplanationEditor from "./PerAnswerExplanationEditor"
import { blocksToHTML, htmlToBlocks } from "./content-utils"

interface EditablePreviewProps {
  blocks: ContentBlock[]
  perAnswerExplanations: Record<string, ContentBlock[]>
  choices: Choice[]
  onChange: (blocks: ContentBlock[]) => void
  onPerAnswerChange: (choiceLabel: string, blocks: ContentBlock[]) => void
}

export default function EditablePreview({
  blocks,
  perAnswerExplanations,
  choices,
  onChange,
  onPerAnswerChange,
}: EditablePreviewProps) {
  // Sync blocks with parent - when blocks change externally, update local state
  const [localBlocks, setLocalBlocks] = useState<ContentBlock[]>(blocks)

  useEffect(() => {
    setLocalBlocks(blocks)
  }, [blocks])

  const handleBlockChange = useCallback(
    (index: number, html: string) => {
      const newBlocks = [...localBlocks]
      if (newBlocks[index] && newBlocks[index].type === "text") {
        const updatedBlocks = htmlToBlocks(html, [newBlocks[index]])
        newBlocks[index] = updatedBlocks[0]
        setLocalBlocks(newBlocks)
        onChange(newBlocks)
      }
    },
    [localBlocks, onChange]
  )

  const handlePerAnswerBlockChange = useCallback(
    (choiceLabel: string, html: string) => {
      const existingBlocks = perAnswerExplanations[choiceLabel] || []
      const newBlocks = htmlToBlocks(html, existingBlocks)
      onPerAnswerChange(choiceLabel, newBlocks)
    },
    [perAnswerExplanations, onPerAnswerChange]
  )

  // Group blocks - separate text blocks from per-answer explanation blocks
  const textBlocks = localBlocks.filter((b) => b.type === "text")
  const perAnswerBlock = localBlocks.find(
    (b) => b.type === "per-answer-explanation" && b.data?.allChoices === true
  )

  return (
    <div className="space-y-4">
      {/* Render text blocks */}
      {textBlocks.map((block, index) => {
        const originalIndex = localBlocks.findIndex((b) => b.id === block.id)
        return (
          <div key={block.id} className="border-b border-border/30 pb-4 last:border-0 last:pb-0">
            <RichTextEditor
              content={blocksToHTML([block])}
              onChange={(html) => handleBlockChange(originalIndex, html)}
              placeholder="Enter explanation text..."
              className=""
            />
          </div>
        )
      })}

      {/* Render per-answer explanations if the block exists */}
      {perAnswerBlock && (
        <div className="border-t border-border/50 pt-4 mt-4">
          <div className="mb-3">
            <h4 className="text-sm font-semibold">Per-Answer Explanations</h4>
          </div>
          <div className="space-y-3">
            {choices.map((choice) => {
              const perAnswerBlocks = perAnswerExplanations[choice.label] || []
              return (
                <div key={choice.label} className="border border-border/30 rounded-lg p-3 bg-muted/10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-foreground">Option {choice.label}:</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      choice.correct ? "text-green-600 bg-green-50 dark:bg-green-950" : "text-red-600 bg-red-50 dark:bg-red-950"
                    }`}>
                      {choice.correct ? "Correct" : "Incorrect"}
                    </span>
                    <span className="text-xs text-muted-foreground">{choice.text}</span>
                  </div>
                  <PerAnswerExplanationEditor
                    blocks={perAnswerBlocks}
                    onChange={(html) => handlePerAnswerBlockChange(choice.label, html)}
                    placeholder={`Enter explanation for option ${choice.label}...`}
                    className=""
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {localBlocks.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No content. Add content blocks in the explanation editor above.
        </div>
      )}
    </div>
  )
}


