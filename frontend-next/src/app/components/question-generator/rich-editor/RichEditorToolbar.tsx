"use client"

import { Button } from "@/shared/ui/button"
import { BlockType } from "./types"

interface RichEditorToolbarProps {
  onAddBlock: (type: BlockType) => void
  disabled?: boolean
  showLabels?: boolean
  perAnswerExplanationCount?: number
  isMainExplanation?: boolean // Only show per-answer-explanation button in main explanation
}

export default function RichEditorToolbar({ 
  onAddBlock, 
  disabled = false,
  showLabels = true,
  perAnswerExplanationCount = 0,
  isMainExplanation = false
}: RichEditorToolbarProps) {
  const buttonConfig = [
    { type: 'text' as BlockType, label: 'Text', icon: '📝' },
    { type: 'table' as BlockType, label: 'Table', icon: '📊' },
    { type: 'image' as BlockType, label: 'Image', icon: '🖼️' },
    { type: 'internal-link' as BlockType, label: 'Internal Link', icon: '🔗' },
    { type: 'external-link' as BlockType, label: 'External Link', icon: '🌐' },
  ]

  // Only show per-answer-explanation button in main explanation when count is 0
  if (isMainExplanation && perAnswerExplanationCount === 0) {
    buttonConfig.push({ 
      type: 'per-answer-explanation' as BlockType, 
      label: 'Per-Answer Explanation', 
      icon: '💬' 
    })
  }

  return (
    <div className="flex flex-wrap gap-2 p-3 border-b border-border/40 bg-card/40 backdrop-blur-sm">
      {buttonConfig.map(({ type, label, icon }) => (
        <Button
          key={type}
          onClick={() => onAddBlock(type)}
          disabled={disabled}
          variant="outline"
          size="sm"
          className="bg-card hover:bg-muted/50 border-border/50 text-foreground"
        >
          <span className="mr-1.5">{icon}</span>
          {showLabels && <span>+ {label}</span>}
        </Button>
      ))}
    </div>
  )
}






