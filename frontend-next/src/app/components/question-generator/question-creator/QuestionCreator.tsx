"use client"

import { useState, useEffect, useMemo } from "react"
import { Card } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import RichEditorContent from "../rich-editor/RichEditorContent"
import ChoiceEditor from "../choice-system/ChoiceEditor"
import ChoiceExplanationEditor from "../choice-system/ChoiceExplanationEditor"
import MetadataSection from "./MetadataSection"
import AdminQuestionView from "../admin-question-view"
import { QuestionCreatorProps, QuestionCreatorData } from "./types"
import { ContentBlock } from "../rich-editor/types"
import { Choice } from "../choice-system/types"
import { generateBlockId } from "../rich-editor/types"
import { Settings, Save, X, Eye, EyeOff } from "lucide-react"

export default function QuestionCreator({
  initialData,
  onSave,
  onCancel,
  onPreview,
}: QuestionCreatorProps) {
  const [stem, setStem] = useState<ContentBlock[]>(initialData?.stem || [])
  const [choices, setChoices] = useState<Choice[]>(
    initialData?.choices || [
      { label: "A", text: "", correct: false, value: "A" },
      { label: "B", text: "", correct: false, value: "B" },
    ]
  )
  const [perAnswerExplanations, setPerAnswerExplanations] = useState<
    Record<string, ContentBlock[]>
  >(initialData?.perAnswerExplanations || {})
  const [mainExplanation, setMainExplanation] = useState<ContentBlock[]>(
    initialData?.mainExplanation || []
  )
  const [metadata, setMetadata] = useState(initialData?.metadata || {})
  const [showMetadataEditor, setShowMetadataEditor] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  
  // Preview state for preview mode
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)

  // Update state when initialData changes (for editing existing questions)
  useEffect(() => {
    if (initialData) {
      // Always use stem blocks if provided (even if empty array)
      if (initialData.stem !== undefined) {
        const stemBlocks = Array.isArray(initialData.stem) ? initialData.stem : []
        setStem(stemBlocks)
        // Debug: Log table blocks in stem
        if (process.env.NODE_ENV === "development") {
          const tableBlocks = stemBlocks.filter((b: any) => b.type?.toLowerCase() === "table")
          if (tableBlocks.length > 0) {
            console.log("QuestionCreator: Stem table blocks loaded:", tableBlocks.map((b: any) => ({
              id: b.id,
              rows: b.data?.rows,
              cols: b.data?.cols,
              cellCount: Object.keys(b.data?.cells || {}).length,
              hasCells: !!b.data?.cells,
            })))
          }
        }
      }
      if (initialData.choices) setChoices(initialData.choices)
      if (initialData.perAnswerExplanations)
        setPerAnswerExplanations(initialData.perAnswerExplanations)
      if (initialData.mainExplanation) {
        const explanationBlocks = Array.isArray(initialData.mainExplanation) ? initialData.mainExplanation : []
        setMainExplanation(explanationBlocks)
        // Debug: Log table blocks in explanation
        if (process.env.NODE_ENV === "development") {
          const tableBlocks = explanationBlocks.filter((b: any) => b.type?.toLowerCase() === "table")
          if (tableBlocks.length > 0) {
            console.log("QuestionCreator: Explanation table blocks loaded:", tableBlocks.map((b: any) => ({
              id: b.id,
              rows: b.data?.rows,
              cols: b.data?.cols,
              cellCount: Object.keys(b.data?.cells || {}).length,
              hasCells: !!b.data?.cells,
            })))
          }
        }
      }
      if (initialData.metadata) setMetadata(initialData.metadata)
  }
  }, [initialData])

  const handleSave = () => {
    const data: QuestionCreatorData = {
      stem,
      choices,
      perAnswerExplanations,
      mainExplanation,
      metadata,
    }
    onSave(data)
  }

  // Transform editor data to view format for AdminQuestionView (same as admin dashboard view button)
  const viewQuestion = useMemo(() => {
    const options = choices.map((choice) => ({
      label: choice.label,
      text: choice.text,
      value: choice.value,
      correct: choice.correct,
    }))

    // Helper function to normalize and preserve block data, especially for tables
    const normalizeBlock = (block: any, index: number) => {
      // Deep copy data to preserve nested objects like cells
      const blockData = block.data || {}
      const normalizedData: any = {}
      
      // Copy all properties from blockData
      if (blockData) {
        Object.keys(blockData).forEach((key) => {
          const value = blockData[key]
          // For objects (like cells), create a deep copy
          if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
            normalizedData[key] = { ...value }
          } else {
            normalizedData[key] = value
          }
        })
      }
      
      // For table blocks, ensure cells object is deeply preserved
      if (block.type?.toLowerCase() === "table" && blockData) {
        // Preserve cells object with all its key-value pairs (deep copy)
        if (blockData.cells && typeof blockData.cells === "object") {
          normalizedData.cells = { ...blockData.cells }
        } else {
          normalizedData.cells = {}
        }
        // Preserve other table properties
        normalizedData.rows = blockData.rows || 0
        normalizedData.cols = blockData.cols || 0
        
        // Map tableHtml to html for renderer compatibility (AdvancedTableEditor stores as tableHtml)
        if (blockData.tableHtml && !blockData.html) {
          normalizedData.html = blockData.tableHtml
          normalizedData.tableHtml = blockData.tableHtml // Also keep original
        } else if (blockData.html) {
          normalizedData.html = blockData.html
        }
        
        // Debug logging for table blocks
        if (process.env.NODE_ENV === "development") {
          console.log("[QuestionCreator Preview] Table block normalized:", {
            id: block.id,
            rows: normalizedData.rows,
            cols: normalizedData.cols,
            cellCount: Object.keys(normalizedData.cells || {}).length,
            sampleCells: Object.entries(normalizedData.cells || {}).slice(0, 3),
            hasTableHtml: !!normalizedData.tableHtml,
            hasHtml: !!normalizedData.html,
            originalData: blockData,
            normalizedData: normalizedData,
          })
        }
      }
      
      return {
        id: block.id || Date.now() + Math.random(),
        type: (block.type?.toLowerCase() || "text") as any,
        data: normalizedData,
        order: typeof block.order === "number" ? block.order : 999,
      }
    }

    // Sort stem blocks by order to preserve markdown file structure
    const sortedStemBlocks = Array.isArray(stem) && stem.length > 0
      ? [...stem]
          .map(normalizeBlock)
          .sort((a: any, b: any) => a.order - b.order)
      : []

    // Sort explanation blocks by order
    const sortedExplanation = Array.isArray(mainExplanation) && mainExplanation.length > 0
      ? [...mainExplanation]
          .map(normalizeBlock)
          .sort((a: any, b: any) => a.order - b.order)
      : []

    // Debug logging in development
    if (process.env.NODE_ENV === "development") {
      console.log("[QuestionCreator Preview] Stem blocks:", {
        count: sortedStemBlocks.length,
        blocks: sortedStemBlocks.map((b: any) => ({ type: b.type, order: b.order, hasData: !!b.data })),
      })
      console.log("[QuestionCreator Preview] Explanation blocks:", {
        count: sortedExplanation.length,
        blocks: sortedExplanation.map((b: any) => ({ type: b.type, order: b.order, hasData: !!b.data })),
      })
    }

    // Sort per-answer explanations blocks
    const sortedPerAnswerExplanations: Record<string, ContentBlock[]> = {}
    Object.keys(perAnswerExplanations).forEach((key) => {
      const explanation = perAnswerExplanations[key]
      if (Array.isArray(explanation) && explanation.length > 0) {
        sortedPerAnswerExplanations[key] = [...explanation]
          .map(normalizeBlock)
          .sort((a: any, b: any) => a.order - b.order)
      } else {
        sortedPerAnswerExplanations[key] = explanation as any
      }
    })

    return {
      id: "editor-question",
      stem: "", // Will use questionStemBlocks
      questionStemBlocks: sortedStemBlocks,
      options,
      explanation: sortedExplanation,
      perAnswerExplanations: sortedPerAnswerExplanations,
      subject: metadata?.subject,
      system: metadata?.system,
      topic: metadata?.topicId,
    }
  }, [stem, choices, mainExplanation, perAnswerExplanations, metadata])


  return (
    <div className="h-full bg-background dark:bg-background flex flex-col">
      {/* Header - Only show in edit mode */}
      {!previewMode && (
        <div className="flex-shrink-0 px-4 sm:px-6 lg:px-8 py-3 border-b border-border/40 bg-card/20 backdrop-blur-sm">
          <div className="max-w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-foreground">
                  {initialData ? "Edit Question" : "Create Question"}
                </h2>
                {viewQuestion.subject || viewQuestion.system ? (
                  <div className="flex flex-wrap gap-2">
                    {viewQuestion.subject && (
                      <span className="px-3 py-1 bg-primary/12 text-primary rounded-lg text-xs font-semibold border border-primary/25">
                        {viewQuestion.subject}
                      </span>
                    )}
                    {viewQuestion.system && (
                      <span className="px-3 py-1 bg-secondary/12 text-secondary rounded-lg text-xs font-semibold border border-secondary/25">
                        {viewQuestion.system}
                      </span>
                    )}
                  </div>
                ) : null}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setPreviewMode(!previewMode)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Preview Mode
                </Button>
                <Button
                  onClick={() => setShowMetadataEditor(!showMetadataEditor)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Metadata
                </Button>
                <Button onClick={onCancel} variant="outline" size="sm">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} size="sm" className="bg-primary hover:bg-primary/90">
                  <Save className="w-4 h-4 mr-2" />
                  Save Question
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Mode Header - Show toggle button */}
      {previewMode && (
        <div className="flex-shrink-0 px-4 sm:px-6 lg:px-8 py-3 border-b border-border/40 bg-card/20 backdrop-blur-sm">
          <div className="max-w-full">
            <div className="flex items-center justify-end">
              <Button
                onClick={() => setPreviewMode(false)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <EyeOff className="w-4 h-4" />
                Edit Mode
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Metadata Editor Modal */}
      {showMetadataEditor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Question Metadata</h3>
              <Button
                onClick={() => setShowMetadataEditor(false)}
                variant="ghost"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <MetadataSection value={metadata} onChange={setMetadata} />
            <div className="flex justify-end gap-2 mt-4">
              <Button
                onClick={() => setShowMetadataEditor(false)}
                variant="outline"
              >
                Done
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Main Content - Either Edit Mode or Preview Mode */}
      {previewMode ? (
        /* Preview Mode - Use AdminQuestionView (same as admin dashboard view button) */
        <div className="flex-1 min-h-0 overflow-hidden">
          <AdminQuestionView
            question={viewQuestion}
            onCancel={() => setPreviewMode(false)}
            onEdit={() => setPreviewMode(false)}
          />
        </div>
      ) : (
        /* Edit Mode - Editors Layout */
        <div className="flex-1 overflow-hidden">
          <div className="h-full grid grid-cols-1 lg:grid-cols-5 gap-3 p-3 lg:p-4">
            {/* Left column - Question Stem, Choices, Per-Answer Explanations */}
            <div className="lg:col-span-2 flex flex-col overflow-hidden min-h-0">
              <div className="overflow-y-auto flex-1 pr-2 space-y-4">
                {/* Question Stem Editor */}
                <Card className="p-4 shadow-md border border-border/40 bg-card/60 backdrop-blur-sm rounded-xl">
                  <h3 className="text-xs font-bold text-primary/70 mb-3 uppercase tracking-widest">
                    Question Stem
                  </h3>
                  <RichEditorContent
                    blocks={stem}
                    onChange={setStem}
                    placeholder="Add question stem content using the buttons above..."
                  />
                </Card>

                {/* Answer Choices Editor */}
                <ChoiceEditor
                  choices={choices}
                  onChange={setChoices}
                  explanations={perAnswerExplanations}
                />

                {/* Per-Answer Explanations Editor */}
                <ChoiceExplanationEditor
                  choices={choices}
                  explanations={perAnswerExplanations}
                  onChange={setPerAnswerExplanations}
                />
              </div>
            </div>

            {/* Right column - Main Explanation Editor */}
            <div className="lg:col-span-3 flex flex-col overflow-hidden min-h-0">
              <div className="overflow-y-auto flex-1 pr-2 space-y-4">
                {/* Main Explanation Editor */}
                <Card className="p-4 shadow-md border border-border/40 bg-card/60 backdrop-blur-sm rounded-xl">
                  <h3 className="text-xs font-bold text-primary/70 mb-3 uppercase tracking-widest">
                    Main Explanation
                  </h3>
                  <RichEditorContent
                    blocks={mainExplanation}
                    onChange={setMainExplanation}
                    placeholder="Add main explanation content using the buttons above..."
                    isMainExplanation={true}
                  />
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

