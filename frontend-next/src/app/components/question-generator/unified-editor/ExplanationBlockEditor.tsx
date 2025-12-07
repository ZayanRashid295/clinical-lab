"use client"

import { useCallback, useRef } from "react"
import { ContentBlock } from "../rich-editor/types"
import { Choice } from "../choice-system/types"
import RichTextEditor from "./RichTextEditor"
import PerAnswerExplanationEditor from "./PerAnswerExplanationEditor"
import AdvancedTableEditor from "../advanced-table-editor"
import { Button } from "@/shared/ui/button"
import { Card } from "@/shared/ui/card"
import { Label } from "@/shared/ui/label"
import { ChevronUp, ChevronDown, X, MessageSquare } from "lucide-react"
import { blocksToHTML, htmlToBlocks } from "./content-utils"
import { Editor } from "@tiptap/react"

interface ExplanationBlockEditorProps {
  blocks: ContentBlock[]
  onChange: (blocks: ContentBlock[]) => void
  choices: Choice[]
  perAnswerExplanations: Record<string, ContentBlock[]>
  onPerAnswerExplanationChange: (choiceLabel: string, blocks: ContentBlock[]) => void
  activeSection: string | null
  activePerAnswerLabel: string | null
  onSectionChange: (section: string | null, perAnswerLabel?: string | null) => void
  onInsertImage?: (choiceLabel?: string) => void
  onInsertLink?: (choiceLabel?: string) => void
  onInsertTable?: () => void
  editorRefs: {
    main: React.MutableRefObject<Editor | null>
    perAnswer: React.MutableRefObject<Record<string, Editor | null>>
    textBlocks: React.MutableRefObject<Record<string, Editor | null>>
  }
}

export default function ExplanationBlockEditor({
  blocks,
  onChange,
  choices,
  perAnswerExplanations,
  onPerAnswerExplanationChange,
  activeSection,
  activePerAnswerLabel,
  onSectionChange,
  onInsertImage,
  onInsertLink,
  onInsertTable,
  editorRefs,
}: ExplanationBlockEditorProps) {
  const textBlockEditorRefs = editorRefs.textBlocks
  const handleBlockChange = useCallback(
    (index: number, html: string) => {
      const newBlocks = [...blocks]
      // Update the HTML content of the text block
      if (newBlocks[index].type === "text") {
        // Preserve all HTML formatting (bold, italic, font-size, font-family, colors, etc.)
        // TipTap generates HTML with inline styles that must be preserved
        newBlocks[index] = {
          ...newBlocks[index],
          data: {
            ...newBlocks[index].data,
            html: html, // Preserve the full HTML with all inline styles
            markdown: newBlocks[index].data.markdown || "",
          },
        }
        
        // Debug: Log when formatting is detected
        if (process.env.NODE_ENV === "development" && (html.includes('style=') || html.includes('font-size') || html.includes('font-family'))) {
          console.log("handleBlockChange: Preserving HTML with formatting:", html.substring(0, 300))
        }
        
        onChange(newBlocks)
      }
    },
    [blocks, onChange]
  )

  const handleTableBlockChange = useCallback(
    (index: number, payload: { html: string; markdown: string }) => {
      const newBlocks = [...blocks]
      if (newBlocks[index].type === "table") {
        newBlocks[index] = {
          ...newBlocks[index],
          data: {
            ...newBlocks[index].data,
            html: payload.html,
            tableHtml: payload.html, // Also store as tableHtml for compatibility
            markdown: payload.markdown,
          },
        }
        onChange(newBlocks)
      }
    },
    [blocks, onChange]
  )

  const handleMoveBlock = useCallback(
    (index: number, direction: "up" | "down") => {
      const newBlocks = [...blocks]
      const targetIndex = direction === "up" ? index - 1 : index + 1
      if (targetIndex >= 0 && targetIndex < newBlocks.length) {
        // Swap blocks by moving the block to the target position
        const [movedBlock] = newBlocks.splice(index, 1)
        newBlocks.splice(targetIndex, 0, movedBlock)
        // Update order values to match new positions
        newBlocks.forEach((block, idx) => {
          block.order = idx
        })
        onChange(newBlocks)
      }
    },
    [blocks, onChange]
  )

  const handleRemoveBlock = useCallback(
    (index: number) => {
      const newBlocks = blocks.filter((_, i) => i !== index)
      onChange(newBlocks)
    },
    [blocks, onChange]
  )

  const handleInsertPerAnswerPlaceholder = useCallback(() => {
    // Check if a per-answer explanations block already exists
    const existingPerAnswerBlock = blocks.find(
      (block) => block.type === "per-answer-explanation" && block.data?.allChoices === true
    )

    if (existingPerAnswerBlock) {
      // Block already exists, don't add another
      return
    }

    // Add a single block that contains all per-answer explanations
    const newBlock: ContentBlock = {
      id: `per-answer-all-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "per-answer-explanation" as const,
      order: blocks.length,
      data: {
        placeholder: true,
        isPerAnswerExplanation: true,
        allChoices: true, // Mark this as containing all choices
      },
    }

    onChange([...blocks, newBlock])
  }, [blocks, choices, onChange])

  const handlePerAnswerBlockChange = useCallback(
    (choiceLabel: string, html: string) => {
      // Preserve existing block IDs when converting HTML back to blocks
      const existingBlocks = perAnswerExplanations[choiceLabel] || []
      const newBlocks = htmlToBlocks(html, existingBlocks)
      onPerAnswerExplanationChange(choiceLabel, newBlocks)
    },
    [onPerAnswerExplanationChange, perAnswerExplanations]
  )

  return (
    <div 
      className="space-y-4"
      onClick={(e) => {
        // If clicking on the container (not on a block or interactive element), activate explanation section
        const target = e.target as HTMLElement
        if (target === e.currentTarget || (!target.closest('[contenteditable]') && !target.closest('button') && !target.closest('input'))) {
          onSectionChange("explanation")
        }
      }}
    >
      {blocks.map((block, index) => {
        const isPerAnswerPlaceholder = block.type === "per-answer-explanation"
        const isAllChoicesBlock = isPerAnswerPlaceholder && block.data?.allChoices === true
        const isActive = isAllChoicesBlock
          ? activeSection === "per-answer-all"
          : activeSection === `explanation-block-${block.id}`

        if (isAllChoicesBlock) {
          return (
            <Card
              key={block.id}
              className={`border-2 bg-card dark:bg-gray-800 ${
                isActive ? "border-primary ring-2 ring-primary dark:border-blue-500 dark:ring-blue-500" : "border-dashed border-border/50 dark:border-gray-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary dark:text-blue-400" />
                  <Label className="text-sm font-semibold text-foreground dark:text-gray-100">
                    Per-Answer Explanations
                  </Label>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMoveBlock(index, "up")
                    }}
                    disabled={index === 0}
                    className="h-6 w-6 p-0"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMoveBlock(index, "down")
                    }}
                    disabled={index === blocks.length - 1}
                    className="h-6 w-6 p-0"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveBlock(index)
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="space-y-4">
                {choices.map((choice) => {
                  const perAnswerBlocks = perAnswerExplanations[choice.label] || []
                  const isPerAnswerActive = activeSection === `per-answer-${choice.label}` && activePerAnswerLabel === choice.label
                  
                  return (
                    <div
                      key={choice.label}
                      onClick={() => {
                        onSectionChange(`per-answer-${choice.label}`, choice.label)
                      }}
                      className={`rounded-lg border ${
                        isPerAnswerActive ? "border-primary ring-2 ring-primary dark:border-blue-500 dark:ring-blue-500" : "border-border/30 dark:border-gray-700 bg-muted/10 dark:bg-gray-800/30"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground dark:text-gray-100">Option {choice.label}:</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          choice.correct ? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950" : "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950"
                        }`}>
                          {choice.correct ? "Correct" : "Incorrect"}
                        </span>
                        <span className="text-xs text-muted-foreground dark:text-gray-300">{choice.text}</span>
                      </div>
                      <PerAnswerExplanationEditor
                        blocks={perAnswerBlocks}
                        onChange={(html) => handlePerAnswerBlockChange(choice.label, html)}
                        editorRef={(editor) => {
                          editorRefs.perAnswer.current[choice.label] = editor
                          if (editor) {
                            // Set up focus handler
                            editor.on("focus", () => {
                              onSectionChange(`per-answer-${choice.label}`, choice.label)
                            })
                          }
                        }}
                        placeholder={`Enter explanation for option ${choice.label}...`}
                        className="min-h-[80px]"
                      />
                    </div>
                  )
                })}
              </div>
            </Card>
          )
        }

        // Regular text block or table block
        const blockHtml = block.data?.html || block.data?.tableHtml || block.data?.markdown || (block.type === "table" ? "" : "<p></p>")
        const blockActiveSection = `explanation-block-${block.id}`
        const isTextBlockActive = activeSection === blockActiveSection
        const isTableBlock = block.type === "table"
        
        return (
          <Card
            key={block.id}
            className={`border bg-card dark:bg-gray-800 ${
              isTextBlockActive ? "border-primary ring-2 ring-primary dark:border-blue-500 dark:ring-blue-500" : "border-border/30 dark:border-gray-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground dark:text-gray-300">
                {block.type === "text" ? "Text Block" : block.type === "table" ? "Table Block" : "Content Block"}
              </Label>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMoveBlock(index, "up")}
                  disabled={index === 0}
                  className="h-6 w-6 p-0"
                >
                  <ChevronUp className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMoveBlock(index, "down")}
                  disabled={index === blocks.length - 1}
                  className="h-6 w-6 p-0"
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveBlock(index)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div
              onClick={() => {
                onSectionChange(blockActiveSection)
              }}
            >
              {isTableBlock ? (
                <AdvancedTableEditor
                  initialContent={blockHtml}
                  initialFormat="html"
                  onChange={(payload) => handleTableBlockChange(index, payload)}
                  className="min-h-[200px]"
                  showToolbar={false}
                  editorRef={(editor) => {
                    textBlockEditorRefs.current[block.id] = editor
                    if (editor) {
                      // Set up focus handler
                      editor.on("focus", () => {
                        onSectionChange(blockActiveSection)
                      })
                    }
                  }}
                />
              ) : (
              <RichTextEditor
                content={blockHtml}
                onChange={(html) => handleBlockChange(index, html)}
                editorRef={(editor) => {
                  textBlockEditorRefs.current[block.id] = editor
                  if (editor) {
                    // Set up focus handler
                    editor.on("focus", () => {
                      onSectionChange(blockActiveSection)
                    })
                  }
                }}
                placeholder="Enter explanation text..."
                className="min-h-[100px]"
              />
              )}
            </div>
          </Card>
        )
      })}

      {blocks.length === 0 && (
        <div 
          className="text-center py-8 text-muted-foreground dark:text-gray-400 text-sm border border-dashed rounded-lg border-border dark:border-gray-700 bg-card dark:bg-gray-800 cursor-pointer hover:bg-muted/50 dark:hover:bg-gray-700/50 transition-colors"
          onClick={() => {
            onSectionChange("explanation")
          }}
        >
          No explanation content. Use the toolbar above to add text blocks or per-answer explanations.
        </div>
      )}
    </div>
  )
}

