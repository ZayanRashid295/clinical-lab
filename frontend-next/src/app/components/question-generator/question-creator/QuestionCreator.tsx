"use client"

import { useState, useEffect } from "react"
import { Card } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import RichEditorContent from "../rich-editor/RichEditorContent"
import ChoiceEditor from "../choice-system/ChoiceEditor"
import ChoiceExplanationEditor from "../choice-system/ChoiceExplanationEditor"
import MetadataSection from "./MetadataSection"
import QuestionPreviewPanel from "./QuestionPreviewPanel"
import { QuestionCreatorProps, QuestionCreatorData } from "./types"
import { ContentBlock } from "../rich-editor/types"
import { Choice } from "../choice-system/types"
import { generateBlockId } from "../rich-editor/types"
import { Eye, EyeOff } from "lucide-react"

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
  const [showPreview, setShowPreview] = useState(false)

  // Update state when initialData changes (for editing existing questions)
  useEffect(() => {
    if (initialData) {
      // Always use stem blocks if provided (even if empty array)
      if (initialData.stem !== undefined) {
        setStem(Array.isArray(initialData.stem) ? initialData.stem : [])
        // Debug: Log stem blocks being set
        if (process.env.NODE_ENV === "development") {
          console.log("QuestionCreator: Setting stem blocks:", initialData.stem?.length || 0, "blocks", initialData.stem?.map((b: any) => ({ type: b.type, order: b.order })))
        }
      }
      if (initialData.choices) setChoices(initialData.choices)
      if (initialData.perAnswerExplanations)
        setPerAnswerExplanations(initialData.perAnswerExplanations)
      if (initialData.mainExplanation) setMainExplanation(initialData.mainExplanation)
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

  const handlePreview = () => {
    if (onPreview) {
      const data: QuestionCreatorData = {
        stem,
        choices,
        perAnswerExplanations,
        mainExplanation,
        metadata,
      }
      onPreview(data)
    }
  }

  // Prepare data for preview
  const previewData: QuestionCreatorData = {
    stem,
    choices,
    perAnswerExplanations,
    mainExplanation,
    metadata,
  }

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden">
      {/* Header - Always visible */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border/40 bg-card/20 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">
            {showPreview ? "Question Preview" : "Create Question"}
          </h2>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowPreview(!showPreview)}
              variant="outline"
              className="bg-card hover:bg-muted flex items-center gap-2"
            >
              {showPreview ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  Edit Mode
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Preview Mode
                </>
              )}
            </Button>
            {!showPreview && (
              <>
                {onPreview && (
                  <Button
                    onClick={handlePreview}
                    variant="outline"
                    className="bg-card hover:bg-muted"
                  >
                    Preview
                  </Button>
                )}
                <Button onClick={onCancel} variant="outline" className="bg-card hover:bg-muted">
                  Cancel
                </Button>
                <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
                  Save Question
                </Button>
              </>
            )}
            {showPreview && (
              <Button onClick={onCancel} variant="outline" className="bg-card hover:bg-muted">
                Close
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content Area - Either Editor or Preview */}
      {showPreview ? (
        /* Preview Panel - Full screen when active */
        <div className="flex-1 min-h-0 overflow-hidden">
          <QuestionPreviewPanel data={previewData} />
        </div>
      ) : (
        /* Editor Section - Full screen when active */
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6 p-6 bg-background w-full">

        {/* Question Stem Section */}
        <Card className="p-4 shadow-md border border-border/40 bg-card/60 backdrop-blur-sm rounded-xl">
          <h3 className="text-sm font-bold text-primary/70 mb-4 uppercase tracking-widest">
            Question Stem
          </h3>
          <RichEditorContent
            blocks={stem}
            onChange={setStem}
            placeholder="Add question stem content using the buttons above..."
          />
        </Card>

      {/* Answer Choices Section */}
      <ChoiceEditor
        choices={choices}
        onChange={setChoices}
        explanations={perAnswerExplanations}
      />

      {/* Per-Answer Explanations Section */}
      <ChoiceExplanationEditor
        choices={choices}
        explanations={perAnswerExplanations}
        onChange={setPerAnswerExplanations}
          />

        {/* Main Explanation Section */}
        <Card className="p-4 shadow-md border border-border/40 bg-card/60 backdrop-blur-sm rounded-xl">
          <h3 className="text-sm font-bold text-primary/70 mb-4 uppercase tracking-widest">
            Main Explanation
          </h3>
          <RichEditorContent
            blocks={mainExplanation}
            onChange={setMainExplanation}
            placeholder="Add main explanation content using the buttons above..."
          isMainExplanation={true}
          />
        </Card>

            {/* Metadata Section */}
            <MetadataSection value={metadata} onChange={setMetadata} />
          </div>
        </div>
      )}
    </div>
  )
}

