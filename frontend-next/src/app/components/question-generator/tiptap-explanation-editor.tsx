"use client"

import { Card } from "@/shared/ui/card"
import TiptapEditor from "./tiptap-editor"

interface TiptapExplanationEditorProps {
  value: string
  onChange: (value: string) => void
}

export default function TiptapExplanationEditor({ value, onChange }: TiptapExplanationEditorProps) {
  const htmlContent = typeof value === "string" ? value : ""

  return (
    <Card className="p-6 shadow-lg">
      <h2 className="text-2xl font-bold text-foreground mb-2">Main Explanation (Rich Editor)</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Create detailed explanations with formatted text, tables, lists, and more
      </p>

      <TiptapEditor
        value={htmlContent}
        onChange={onChange}
        placeholder="Enter detailed explanation with formatting, tables, and more..."
      />

      <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border">
        <p className="text-xs text-muted-foreground font-medium mb-2">Editor Features:</p>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Text formatting: Bold, Italic, Underline</li>
          <li>• Headings: H1, H2, H3</li>
          <li>• Lists: Bullet and ordered lists</li>
          <li>• Tables: Insert and edit tables with merge support</li>
          <li>• Styling: Text color and highlighting</li>
          <li>• Links: Add clickable links to external resources</li>
        </ul>
      </div>
    </Card>
  )
}
